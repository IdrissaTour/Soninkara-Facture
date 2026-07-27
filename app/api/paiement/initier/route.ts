import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    // 1. Authentification sécurisée de l'utilisateur côté serveur
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { plan, montant } = await req.json();
    
    if (!plan || !montant || montant <= 0) {
      return NextResponse.json({ error: 'Paramètres invalides ou manquants' }, { status: 400 });
    }

    const utilisateurId = user.id;
    const refCommande = `SF-${Date.now()}-${utilisateurId.slice(0, 8)}`;
    const origin = req.nextUrl.origin;
    
    // Déterminer l'URL de base (de préférence via variables d'environnement, sinon dynamiquement)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;

    const apiKey = process.env.PAYTECH_API_KEY;
    const apiSecret = process.env.PAYTECH_SECRET_KEY;
    const paytechEnv = process.env.PAYTECH_ENV || 'test';

    if (!apiKey || !apiSecret) {
      console.error('Configuration PayTech manquante : API_KEY ou SECRET_KEY indéfinie');
      return NextResponse.json({ 
        error: 'Le service de paiement PayTech n\'est pas configuré sur le serveur' 
      }, { status: 500 });
    }

    // 2. Appel à l'API de PayTech pour requérir un paiement
    const response = await fetch('https://paytech.sn/api/payment/request-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API_KEY': apiKey,
        'API_SECRET': apiSecret,
      },
      body: JSON.stringify({
        item_name: `Abonnement ${plan.toUpperCase()} - Soninkara Facture`,
        item_price: montant,
        currency: 'XOF',
        ref_command: refCommande,
        command_name: `Abonnement ${plan.toUpperCase()}`,
        env: paytechEnv,
        ipn_url: `${appUrl}/api/paiement/webhook`,
        success_url: `${appUrl}/dashboard/abonnement?succes=true`,
        cancel_url: `${appUrl}/dashboard/abonnement?annule=true`,
        target_payment: 'Orange Money, Wave',
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Erreur HTTP PayTech:', response.status, errBody);
      return NextResponse.json({ error: 'Le service de paiement est temporairement indisponible' }, { status: 502 });
    }

    const data = await response.json();

    if (data.success !== 1 && data.success !== '1') {
      console.error('Réponse de PayTech non conforme:', data);
      return NextResponse.json({ 
        error: data.errors?.[0] || 'Échec de l\'initiation du paiement avec PayTech' 
      }, { status: 500 });
    }

    // 3. Enregistrement de la transaction en attente dans la base de données
    const supabaseAdmin = createAdminClient();
    const { error: dbError } = await supabaseAdmin.from('transactions_paiement').insert({
      transaction_id: refCommande,
      utilisateur_id: utilisateurId,
      plan,
      montant,
      fournisseur: 'paytech',
      statut: 'en_attente',
    });

    if (dbError) {
      console.error('Erreur d\'insertion de la transaction en BDD:', dbError);
      return NextResponse.json({ error: 'Erreur interne lors de la sauvegarde de la transaction' }, { status: 500 });
    }

    return NextResponse.json({ 
      lienPaiement: data.redirect_url, 
      token: data.token 
    });
  } catch (err) {
    console.error('Exception lors de l\'initiation du paiement:', err);
    const errMsg = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: `Erreur serveur inattendue : ${errMsg}` }, { status: 500 });
  }
}
