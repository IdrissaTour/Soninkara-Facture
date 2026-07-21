import { NextResponse } from 'next/server';
import { getBoutiqueStats } from '@/lib/actions/boutiques';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const stats = await getBoutiqueStats(params.id);
    if (!stats) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 });
    }
    return NextResponse.json(stats);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
