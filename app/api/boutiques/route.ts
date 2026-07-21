import { NextResponse } from 'next/server';
import { getBoutiques, createBoutiqueAction } from '@/lib/actions/boutiques';

export async function GET() {
  try {
    const boutiques = await getBoutiques();
    return NextResponse.json(boutiques);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.nom) {
      return NextResponse.json({ error: 'Le nom de la boutique est obligatoire' }, { status: 400 });
    }
    const newBoutique = await createBoutiqueAction(body);
    return NextResponse.json(newBoutique, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
