import { NextResponse } from 'next/server';
import { createVenteAction } from '@/lib/actions/boutiques';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { boutique_id, produit_id, quantite, prix_unitaire, genererFacture, client_id, notes } = body;

    if (!boutique_id || !produit_id || !quantite || prix_unitaire === undefined) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    const newVente = await createVenteAction(
      {
        boutique_id,
        produit_id,
        quantite: Number(quantite),
        prix_unitaire: Number(prix_unitaire)
      },
      {
        genererFacture: Boolean(genererFacture),
        client_id,
        notes
      }
    );

    return NextResponse.json(newVente, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
