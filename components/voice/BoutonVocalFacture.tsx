'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle, Sparkles, Languages } from 'lucide-react';

export interface ExtractedFacture {
  client_nom: string | null;
  produit: string | null;
  quantite: number | null;
  prix_unitaire: number | null;
  confiance: 'haute' | 'moyenne' | 'basse';
}

interface BoutonVocalFactureProps {
  onFactureExtraite: (facture: ExtractedFacture, texteTranscrit: string) => void;
}

const LANGUES = [
  { code: 'wolof', label: 'Wolof (🇸🇳)' },
  { code: 'bambara', label: 'Bambara (🇲🇱)' },
  { code: 'soninke', label: 'Soninké (bientôt)' },
];

export default function BoutonVocalFacture({ onFactureExtraite }: BoutonVocalFactureProps) {
  const [enregistrement, setEnregistrement] = useState(false);
  const [langue, setLangue] = useState('wolof');
  const [statut, setStatut] = useState('');
  const [erreur, setErreur] = useState('');
  const [duree, setDuree] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function demarrerEnregistrement() {
    setErreur('');
    setStatut('');
    chunksRef.current = [];
    setDuree(0);

    if (langue === 'soninke') {
      setErreur('La saisie vocale en Soninké arrive bientôt. Veuillez utiliser le Wolof ou le Bambara pour le moment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
        else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
        else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/aac')) mimeType = 'audio/aac';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else if (MediaRecorder.isTypeSupported('audio/wav')) mimeType = 'audio/wav';
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (chunksRef.current.length > 0) {
          envoyerAudio(mediaRecorder.mimeType || 'audio/wav');
        }
      };

      mediaRecorder.start(250);
      setEnregistrement(true);

      timerRef.current = setInterval(() => {
        setDuree((prev) => {
          if (prev >= 45) {
            arreterEnregistrement();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Erreur acces micro:', err);
      setErreur("Impossible d'accéder au microphone. Vérifiez les autorisations de votre navigateur.");
    }
  }

  function arreterEnregistrement() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setEnregistrement(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }

  async function envoyerAudio(mimeType: string) {
    setStatut('Transcription audio via Hugging Face...');
    const audioBlob = new Blob(chunksRef.current, { type: mimeType });

    const formData = new FormData();
    formData.append('audio', audioBlob, 'enregistrement.wav');
    formData.append('langue', langue);

    try {
      // 1. Transcription ASR
      const transcriptionRes = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      const transcriptionData = await transcriptionRes.json();

      if (transcriptionData.error === 'soninke_non_supporte') {
        setErreur('La saisie vocale en Soninké arrive bientôt. Utilisez le Wolof ou le Bambara pour le moment.');
        setStatut('');
        return;
      }

      if (!transcriptionRes.ok) {
        throw new Error(transcriptionData.error || 'Erreur lors de la transcription');
      }

      const texteTranscrit = transcriptionData.texte_transcrit;
      if (!texteTranscrit || !texteTranscrit.trim()) {
        throw new Error('Aucune parole claire n\'a pu être identifiée dans l\'enregistrement.');
      }

      // 2. Extraction structurée via Claude API
      setStatut('Extraction intelligente des données de facture...');
      const extractionRes = await fetch('/api/voice/extraire-facture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texte_transcrit: texteTranscrit }),
      });

      const extractionData = await extractionRes.json();
      if (!extractionRes.ok) {
        throw new Error(extractionData.error || 'Erreur lors de l\'extraction des champs');
      }

      setStatut('');
      onFactureExtraite(extractionData.facture, texteTranscrit);
    } catch (err) {
      setStatut('');
      const msg = err instanceof Error ? err.message : 'Erreur de traitement vocal.';
      setErreur(msg);
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Selection de la langue */}
      <div className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
          <Languages className="h-4 w-4 text-brand-600" />
          Langue parlée :
        </label>
        <select
          value={langue}
          onChange={(e) => setLangue(e.target.value)}
          disabled={enregistrement || Boolean(statut)}
          className="bg-white border border-slate-200 text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-500 transition-colors"
        >
          {LANGUES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {/* Bouton Enregistrement */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={enregistrement ? arreterEnregistrement : demarrerEnregistrement}
          disabled={Boolean(statut)}
          className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md ${
            enregistrement
              ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/20 animate-pulse'
              : statut
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-600/20 hover:scale-[1.01]'
          }`}
        >
          {statut ? (
            <>
              <Loader2 className="h-4.5 w-4.5 animate-spin text-brand-600" />
              <span>{statut}</span>
            </>
          ) : enregistrement ? (
            <>
              <Square className="h-4.5 w-4.5 fill-current" />
              <span>Arrêter l&apos;enregistrement (00:{String(duree).padStart(2, '0')})</span>
            </>
          ) : (
            <>
              <Mic className="h-4.5 w-4.5" />
              <Sparkles className="h-3.5 w-3.5" />
              <span>Parler pour saisir la facture</span>
            </>
          )}
        </button>

        {enregistrement && (
          <span className="text-[11px] font-semibold text-rose-600 animate-pulse flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-600" />
            Microphone actif, ex: &quot;Amadou Fall, 3 sacs de riz à 15000 FCFA&quot;
          </span>
        )}
      </div>

      {/* Messages d'erreur ou d'information */}
      {erreur && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
          <span>{erreur}</span>
        </div>
      )}
    </div>
  );
}
