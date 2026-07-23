import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    let transactionId = '';

    // Handle both content types
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      transactionId = formData.get('cpm_trans_id') as string;
    } else {
      const payload = await req.json();
      transactionId = payload.cpm_trans_id;
    }

    if (!transactionId) {
      return NextResponse.json({ error: 'Identifiant de transaction manquant' }, { status: 400 });
    }

    // Call CinetPay check API to verify the status securely
    const checkResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: process.env.CINETPAY_API_KEY,
        site_id: process.env.CINETPAY_SITE_ID,
        transaction_id: transactionId
      })
    });

    const verification = await checkResponse.json();

    if (verification.code !== '00' && verification.code !== 0) {
      console.error('CinetPay verification failed:', verification);
      return NextResponse.json({ error: verification.description || 'Echec de la verification' }, { status: 400 });
    }

    if (verification.data.status === 'ACCEPTED') {
      const supabaseAdmin = createAdminClient();

      // Retrieve the transaction details
      const { data: transaction, error: txError } = await supabaseAdmin
        .from('transactions_paiement')
        .select('*')
        .eq('transaction_id', transactionId)
        .maybeSingle();

      if (txError || !transaction) {
        console.error('Transaction not found in DB:', transactionId);
        return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 });
      }

      // Update the transaction status
      await supabaseAdmin
        .from('transactions_paiement')
        .update({ statut: 'paye' })
        .eq('transaction_id', transactionId);

      // Determine cycle and end date
      const montant = Number(transaction.montant);
      const isYearly = montant === 50000 || montant === 120000 || montant === 250000;
      const cycle = isYearly ? 'annuel' : 'mensuel';
      
      const dateProchaineFacturation = new Date();
      if (isYearly) {
        dateProchaineFacturation.setFullYear(dateProchaineFacturation.getFullYear() + 1);
      } else {
        dateProchaineFacturation.setDate(dateProchaineFacturation.getDate() + 30);
      }

      // Update or insert subscriber profile status
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
        console.error('Error updating subscriber plan:', subError);
        return NextResponse.json({ error: subError.message }, { status: 500 });
      }

      return NextResponse.json({ received: true, status: 'ACCEPTED' });
    }

    return NextResponse.json({ received: true, status: verification.data.status });
  } catch (err) {
    console.error('Error in paiement/webhook:', err);
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
