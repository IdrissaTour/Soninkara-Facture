import { NextResponse } from 'next/server';
import { adjustStockAction } from '@/lib/actions/boutiques';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { type, quantite, motif } = body;
    if (!type || quantite === undefined) {
      return NextResponse.json({ error: 'Type et quantité requis' }, { status: 400 });
    }
    const success = await adjustStockAction(params.id, type, Number(quantite), motif);
    if (!success) {
      return NextResponse.json({ error: 'Échec de l\'ajustement du stock' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
