'use server';

export async function transcribeVoiceInvoice(
  audioBase64: string, 
  mimeType: string
): Promise<{ clientName?: string; items?: Array<{ description?: string; quantity?: number; price?: number }> }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Clé API Gemini manquante. Veuillez ajouter GEMINI_API_KEY=votre_cle dans votre fichier .env.local.");
  }

  // Google Gemini API REST URL (Gemini 3.1 Flash Lite is optimized and available)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

  const promptText = `Tu es l'assistant vocal intelligent de l'application Soninkara Facture (un SaaS de facturation pour l'Afrique de l'Ouest).
L'utilisateur vient de dicter le contenu d'une facture sous forme de note vocale.
La note vocale peut être parlée en Français, Wolof, Bambara, Swahili, Soninké, N'ko ou d'autres langues de la région.

Analyse l'audio de la note vocale et extrais les informations suivantes sous forme de JSON structuré :
1. "clientName" : Le nom ou prénom du client mentionné (ou null si aucun n'est mentionné).
2. "items" : La liste des articles/produits/services mentionnés sous forme d'un tableau d'objets, chaque objet ayant :
   - "description" : Traduction ou description claire de l'article en Français (ex: si l'utilisateur dit "sacs de riz", écris "Sac de riz").
   - "quantity" : Nombre entier ou décimal (par défaut 1 si non spécifié).
   - "price" : Prix unitaire en FCFA (par défaut 0 si non spécifié, ne garde que la valeur numérique).

IMPORTANT : Ne réponds QU'AVEC le JSON brut valide. Pas de balises markdown comme \`\`\`json, pas de texte d'introduction ni de conclusion. Si aucun article ou élément n'est détecté ou si l'audio est inaudible, renvoie un objet vide ou avec des tableaux vides.

Format de réponse attendu :
{
  "clientName": "Nom ou prénom du client",
  "items": [
    {
      "description": "Description de l'article 1",
      "quantity": 3,
      "price": 15000
    }
  ]
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API Error details:", errText);
      throw new Error(`Erreur API Gemini (${res.status}): ${res.statusText}`);
    }

    const responseData = await res.json();
    const textResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      throw new Error("L'IA n'a pas pu analyser la note vocale ou aucun contenu n'a été retourné.");
    }

    // Clean JSON response block markers if any (just in case model ignored instruction)
    let jsonText = textResponse.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    const parsedJson = JSON.parse(jsonText);
    return parsedJson;
  } catch (err) {
    console.error("Exception in transcribeVoiceInvoice:", err);
    throw err;
  }
}
