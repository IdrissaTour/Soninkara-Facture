import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    let data: any = {};

    // 1. Extraire les données selon le type de contenu (x-www-form-urlencoded ou JSON)
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      data = Object.fromEntries(formData.entries());
    } else {
      data = await req.json();
    }

    const {
      type_event,
      ref_command,
      api_key_sha256,
      api_secret_sha256
    } = data;

    if (!ref_command) {
      console.error('Webhook PayTech: Référence de commande manquante');
      return NextResponse.json({ error: 'Référence de commande manquante' }, { status: 400 });
    }

    // 2. Validation de la signature cryptographique PayTech (HMAC SHA-256)
    const apiKey = process.env.PAYTECH_API_KEY || '';
    const apiSecret = process.env.PAYTECH_SECRET_KEY || '';

    const localApiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const localApiSecretHash = crypto.createHash('sha256').update(apiSecret).digest('hex');

    if (localApiKeyHash !== api_key_sha256 || localApiSecretHash !== api_secret_sha256) {
      console.error('Webhook PayTech: Signature invalide pour la commande', ref_command);
      return NextResponse.json({ error: 'Signature invalide' }, { status: 403 });
    }

    const supabaseAdmin = createAdminClient();

    // 3. Récupérer la transaction correspondante en base de données
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions_paiement')
      .select('*')
      .eq('transaction_id', ref_command)
      .maybeSingle();

    if (txError || !transaction) {
      console.error('Webhook PayTech: Transaction introuvable pour la commande', ref_command, txError);
      // Toujours répondre 200 pour éviter que PayTech ne bombarde le serveur de retries
      return NextResponse.json({ received: true, error: 'Transaction introuvable' });
    }

    // 4. Idempotence : Si la transaction est déjà marquée payée, ne rien faire de plus
    if (transaction.statut === 'paye') {
      console.log('Webhook PayTech: Transaction déjà traitée pour la commande', ref_command);
      return NextResponse.json({ received: true, message: 'Déjà traité' });
    }

    // 5. Traitement selon l'événement PayTech
    if (type_event === 'sale_complete') {
      console.log(`Webhook PayTech: Paiement réussi pour la transaction ${ref_command}. Activation de l'abonnement...`);

      // Mettre à jour la transaction à 'paye'
      await supabaseAdmin
        .from('transactions_paiement')
        .update({ 
          statut: 'paye',
          paye_at: new Date().toISOString()
        })
        .eq('transaction_id', ref_command);

      // Calculer le cycle de facturation et la date de prochaine facturation
      const montant = Number(transaction.montant);
      const isYearly = montant === 28800 || montant === 96000 || montant === 240000;
      const cycle = isYearly ? 'annuel' : 'mensuel';
      
      const dateProchaineFacturation = new Date();
      if (isYearly) {
        dateProchaineFacturation.setFullYear(dateProchaineFacturation.getFullYear() + 1);
      } else {
        dateProchaineFacturation.setDate(dateProchaineFacturation.getDate() + 30);
      }

      // Activer ou mettre à jour l'abonnement de l'utilisateur
      const { error: subError } = await supabaseAdmin
        .from('abonnements')
        .upsert({
          utilisateur_id: transaction.utilisateur_id,
          plan: transaction.plan,
          statut: 'actif',
          date_debut_abonnement: new Date().toISOString(),
          date_prochaine_facturation: dateProchaineFacturation.toISOString(),
          montant: montant,
          cycle_facturation: cycle,
          statut_paiement: 'paye'
        }, {
          onConflict: 'utilisateur_id'
        });

      if (subError) {
        console.error('Webhook PayTech: Erreur lors de l\'activation de l\'abonnement:', subError);
        return NextResponse.json({ received: true, error: 'Erreur lors de l\'activation' });
      }

      console.log(`Webhook PayTech: Abonnement mis à jour avec succès pour l'utilisateur ${transaction.utilisateur_id}`);
      return NextResponse.json({ received: true, status: 'ACCEPTED' });

    } else if (type_event === 'sale_cancel' || type_event === 'sale_error') {
      console.log(`Webhook PayTech: Échec ou annulation du paiement pour la transaction ${ref_command}`);

      // Mettre à jour le statut de la transaction à 'echec'
      await supabaseAdmin
        .from('transactions_paiement')
        .update({ statut: 'echec' })
        .eq('transaction_id', ref_command);

      return NextResponse.json({ received: true, status: 'FAILED' });
    }

    return NextResponse.json({ received: true, status: 'UNKNOWN_EVENT' });
  } catch (err) {
    console.error('Exception dans le webhook PayTech:', err);
    // Toujours répondre 200 pour éviter un retry infini de PayTech en cas d'erreur interne
    return NextResponse.json({ received: true, error_interne: true });
  }
}
