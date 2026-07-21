import { NextResponse } from 'next/server';
import { getProduits, createProduitAction } from '@/lib/actions/boutiques';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const produits = await getProduits(params.id);
    return NextResponse.json(produits);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    if (!body.nom || body.prix_vente === undefined) {
      return NextResponse.json({ error: 'Nom et prix de vente requis' }, { status: 400 });
    }
    const newProduit = await createProduitAction({
      ...body,
      boutique_id: params.id,
      prix_achat: Number(body.prix_achat || 0),
      prix_vente: Number(body.prix_vente || 0),
      quantite_stock: Number(body.quantite_stock || 0),
      seuil_alerte: Number(body.seuil_alerte || 5)
    });
    return NextResponse.json(newProduit, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
