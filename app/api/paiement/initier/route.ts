import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { utilisateurId, plan, montant } = await req.json();
    
    if (!utilisateurId || !plan || !montant) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const transactionId = `SF-${Date.now()}-${utilisateurId.slice(0, 8)}`;
    const origin = req.nextUrl.origin;

    const body = {
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount: montant,
      currency: 'XOF',
      description: `Abonnement ${plan} - Soninkara Facture`,
      notify_url: `${origin}/api/paiement/webhook`,
      return_url: `${origin}/dashboard/abonnement?succes=true`,
      channels: 'ALL',
    };

    const response = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (data.code !== 201 && data.code !== '201') {
      console.error('CinetPay API error:', data);
      return NextResponse.json({ 
        error: data.description || 'Erreur lors de l\'appel à CinetPay' 
      }, { status: 500 });
    }

    const supabaseAdmin = createAdminClient();
    const { error: dbError } = await supabaseAdmin.from('transactions_paiement').insert({
      transaction_id: transactionId,
      utilisateur_id: utilisateurId,
      plan,
      montant,
      statut: 'en_attente',
    });

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({ lienPaiement: data.data.payment_url });
  } catch (err) {
    console.error('Error in paiement/initier:', err);
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
