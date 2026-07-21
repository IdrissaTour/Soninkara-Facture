import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const HF_MODELS: Record<string, string> = {
  wolof: 'CAYTU/whosper-large',
  bambara: 'sudoping01/bambara-asr-v2',
};

async function callHuggingFace(modelId: string, audioBuffer: Buffer, retries = 2): Promise<{ text: string }> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error('Clé API Hugging Face manquante. Veuillez configurer HUGGINGFACE_API_KEY dans votre fichier .env.local.');
  }

  const url = `https://api-inference.huggingface.co/models/${modelId}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'audio/wav',
      },
      body: new Uint8Array(audioBuffer),
    });

    // Handle model cold start (HF returns 503 with estimated_time)
    if (response.status === 503) {
      const data = await response.json().catch(() => ({}));
      const wait = Math.min(((data as { estimated_time?: number }).estimated_time || 5) * 1000, 15000);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Erreur HuggingFace (${response.status}): ${errText || response.statusText}`);
    }

    const data = await response.json();
    return data; // Expected { text: "..." }
  }

  throw new Error('Modèle indisponible après plusieurs tentatives.');
}

async function callGeminiTranscribe(audioBuffer: Buffer, mimeType: string, langue: string): Promise<{ text: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Aucune clé API configurée (HUGGINGFACE_API_KEY et GEMINI_API_KEY manquantes dans .env.local).');
  }

  const base64Audio = audioBuffer.toString('base64');
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
                {
                  text: `Tu es un transcripteur audio spécialisé pour l'Afrique de l'Ouest. Transcris fidèlement et au mot près cet enregistrement vocal parlé en ${langue} ou Français. Ne donne aucune explication, uniquement la transcription brute.`,
                },
                {
                  inlineData: {
                    mimeType: mimeType || 'audio/webm',
                    data: base64Audio,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const transcribedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        return { text: transcribedText };
      }

      lastError = await response.text().catch(() => response.statusText);
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }

  throw new Error(`Erreur Gemini ASR: ${lastError}`);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    const langue = (formData.get('langue') as string) || 'wolof';

    if (!audioFile) {
      return NextResponse.json({ error: 'Aucun fichier audio reçu.' }, { status: 400 });
    }

    if (langue === 'soninke') {
      return NextResponse.json(
        { error: 'soninke_non_supporte', message: 'La transcription soninké arrive bientôt.' },
        { status: 422 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    const mimeType = audioFile.type || 'audio/webm';

    // 1. Tenter l'appel Hugging Face si la clé est présente
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    const modelId = HF_MODELS[langue];

    if (hfKey && modelId) {
      try {
        const result = await callHuggingFace(modelId, audioBuffer);
        if (result.text && result.text.trim()) {
          return NextResponse.json({ texte_transcrit: result.text.trim() });
        }
      } catch (hfError) {
        console.warn('Hugging Face ASR a échoué, passage automatique au secours Gemini:', hfError);
      }
    }

    // 2. Secours automatique Gemini Flash
    const geminiResult = await callGeminiTranscribe(audioBuffer, mimeType, langue);
    return NextResponse.json({ texte_transcrit: geminiResult.text });
  } catch (err) {
    console.error('Erreur transcription audio:', err);
    const message = err instanceof Error ? err.message : 'Échec de la transcription audio.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
