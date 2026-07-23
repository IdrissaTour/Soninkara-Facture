import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Auth validation, bypassable in local dev if CRON_SECRET is not set for easy testing
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const supabaseAdmin = createAdminClient();
    
    const { data: essaisExpires, error: fetchError } = await supabaseAdmin
      .from('abonnements')
      .select('id, utilisateur_id')
      .eq('plan', 'essai')
      .eq('statut', 'actif')
      .lt('date_fin_essai', new Date().toISOString());

    if (fetchError) {
      throw fetchError;
    }

    if (!essaisExpires || essaisExpires.length === 0) {
      return NextResponse.json({ traites: 0, message: 'Aucun essai expiré trouvé.' });
    }

    const idsToUpdate = essaisExpires.map(item => item.id);
    
    const { error: updateError } = await supabaseAdmin
      .from('abonnements')
      .update({ statut: 'expire' })
      .in('id', idsToUpdate);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      traites: essaisExpires.length, 
      message: `Mis à jour ${essaisExpires.length} abonnements en 'expire'.` 
    });
  } catch (err) {
    console.error('Error in verifier-essais cron route:', err);
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
