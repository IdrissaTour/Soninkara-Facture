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

    const { plan, montant, cycleFacturation } = await req.json();
    
    if (!plan || !montant || montant <= 0) {
      return NextResponse.json({ error: 'Paramètres invalides ou manquants' }, { status: 400 });
    }

    const utilisateurId = user.id;
    const refCommande = `SF-${Date.now()}-${utilisateurId.slice(0, 8)}`;

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || (req.nextUrl.protocol ? req.nextUrl.protocol.replace(':', '') : 'https');
    const detectedOrigin = host ? `${proto}://${host}` : req.nextUrl.origin;

    const envAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    // Utiliser NEXT_PUBLIC_APP_URL uniquement si ce n'est pas un domaine localhost. Sinon, utiliser l'origine détectée en direct.
    const appUrl = (envAppUrl && !envAppUrl.includes('localhost')) ? envAppUrl : detectedOrigin;

    const DEFAULT_PAYTECH_KEY = '26803f2bb0558c15dc26aa68e905456906bd5e0af0f3df5db473ef90f1350b8a';
    const DEFAULT_PAYTECH_SECRET = 'c784d6ae7a3e5714df901ef9fa3151e134c9e9bb2abd6759ed754b9eee69d98f';

    const apiKey = process.env.PAYTECH_API_KEY || DEFAULT_PAYTECH_KEY;
    const apiSecret = process.env.PAYTECH_SECRET_KEY || DEFAULT_PAYTECH_SECRET;
    const paytechEnv = process.env.PAYTECH_ENV || 'test';

    // Déterminer si nous devons simuler le paiement (clés explicitement désactivées)
    const isMockPayment = !apiKey || !apiSecret || 
      apiKey === 'votre_api_key_ici' || 
      apiSecret === 'votre_secret_key_ici' ||
      apiKey.trim() === '' ||
      apiSecret.trim() === '';

    if (isMockPayment) {
      console.log(`[Mode Simulation de Paiement] Initiation d'un paiement simulé pour le plan ${plan.toUpperCase()}...`);
      
      const dbClient = createAdminClient();
      
      // 1. Enregistrer la transaction immédiatement comme payée
      const { error: dbError } = await dbClient.from('transactions_paiement').insert({
        transaction_id: refCommande,
        utilisateur_id: utilisateurId,
        plan,
        montant,
        fournisseur: 'paytech_simule',
        statut: 'paye',
        paye_at: new Date().toISOString()
      });

      if (dbError) {
        console.error('Erreur d\'insertion de la transaction simulée en BDD:', dbError);
        return NextResponse.json({ error: 'Erreur interne lors de la sauvegarde de la transaction' }, { status: 500 });
      }

      // 2. Calculer le cycle de facturation
      const isYearly = cycleFacturation === 'yearly' || cycleFacturation === 'annuel' || montant === 28800 || montant === 96000 || montant === 240000;
      const cycle = isYearly ? 'annuel' : 'mensuel';
      
      const dateProchaineFacturation = new Date();
      if (isYearly) {
        dateProchaineFacturation.setFullYear(dateProchaineFacturation.getFullYear() + 1);
      } else {
        dateProchaineFacturation.setDate(dateProchaineFacturation.getDate() + 30);
      }

      // 3. Activer l'abonnement
      const { error: subError } = await dbClient
        .from('abonnements')
        .upsert({
          utilisateur_id: utilisateurId,
          plan,
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
        console.error('Erreur lors de l\'activation de l\'abonnement simulé:', subError);
        return NextResponse.json({ error: "Erreur interne lors de l'activation de l'abonnement" }, { status: 500 });
      }

      // Rediriger directement vers la page de succès de l'abonnement en local
      return NextResponse.json({ 
        lienPaiement: `${appUrl}/dashboard/abonnement?succes=true`, 
        token: `simule-${refCommande}`
      });
    }

    // Déterminer l'URL d'IPN en forçant le protocole HTTPS si nous sommes sur localhost
    let ipnUrl = `${appUrl}/api/paiement/webhook`;
    if (ipnUrl.startsWith('http://localhost')) {
      // PayTech refuse le protocole http pour l'ipn_url. 
      // On remplace le domaine localhost par une URL HTTPS publique (de secours/fictive)
      // pour que PayTech valide l'initiation en mode test.
      ipnUrl = ipnUrl.replace(/http:\/\/localhost:\d+/, 'https://soninkara-facture.vercel.app');
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
        ipn_url: ipnUrl,
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
    let dbAdminClient = supabase;
    try {
      dbAdminClient = createAdminClient();
    } catch (adminErr) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY non configurée pour la transaction en attente, tentative avec le client utilisateur:', adminErr);
    }

    const { error: dbError } = await dbAdminClient.from('transactions_paiement').insert({
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
