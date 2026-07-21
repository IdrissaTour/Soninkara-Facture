import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `Tu es un assistant expert qui extrait des informations de facturation à partir d'un texte transcrit depuis de l'audio en wolof, bambara ou français mélangé.
Le texte peut contenir des erreurs de transcription (caractères mal reconnus, mots tronqués, phonétique locale) — fais de ton mieux pour déduire l'intention exacte de facturation.

Réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après, avec ce format exact :
{
  "client_nom": string ou null,
  "produit": string ou null,
  "quantite": number ou null,
  "prix_unitaire": number ou null,
  "confiance": "haute" | "moyenne" | "basse"
}

Si une information est ambiguë ou absente, mets null pour ce champ et indique "basse" en confiance.
Les montants sont généralement exprimés en Francs CFA (XOF). Si l'utilisateur mentionne un prix global (ex: 3 sacs pour 15000), calcule le prix unitaire (ex: 5000).`;

async function callGeminiExtraire(texteTranscrit: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Aucune clé API configurée (ANTHROPIC_API_KEY et GEMINI_API_KEY manquantes dans .env.local).');
  }

  const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError = '';

  for (const model of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: SYSTEM_PROMPT },
                { text: `Texte transcrit : "${texteTranscrit}"` },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        const cleanJson = rawText.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);
      }

      lastError = await response.text().catch(() => response.statusText);
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }

  throw new Error(`Erreur Gemini extraction: ${lastError}`);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { texte_transcrit } = body;

    if (!texte_transcrit || typeof texte_transcrit !== 'string') {
      return NextResponse.json({ error: 'Texte transcrit manquant ou invalide.' }, { status: 400 });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // 1. Tenter l'appel Anthropic Claude si la clé est renseignée
    if (anthropicKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 400,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: texte_transcrit }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.content?.[0]?.text?.trim() || '';
          const cleanJson = rawText.replace(/```json|```/g, '').trim();
          const facture = JSON.parse(cleanJson);
          return NextResponse.json({ facture });
        }
      } catch (anthropicErr) {
        console.warn('Anthropic API a échoué, passage automatique au secours Gemini:', anthropicErr);
      }
    }

    // 2. Secours automatique Gemini Flash
    const factureGemini = await callGeminiExtraire(texte_transcrit);
    return NextResponse.json({ facture: factureGemini });
  } catch (err) {
    console.error('Erreur extraction facture:', err);
    const message = err instanceof Error ? err.message : 'Échec de l\'extraction des informations de facture.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
