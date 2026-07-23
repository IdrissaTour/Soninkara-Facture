-- Création de la table des abonnements
CREATE TABLE IF NOT EXISTS public.abonnements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan TEXT CHECK (plan IN ('essai', 'starter', 'pro', 'entreprise')) DEFAULT 'essai',
  statut TEXT CHECK (statut IN ('actif', 'expire', 'annule', 'en_attente_paiement')) DEFAULT 'actif',
  date_debut_essai TIMESTAMPTZ DEFAULT now(),
  date_fin_essai TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  date_debut_abonnement TIMESTAMPTZ,
  date_prochaine_facturation TIMESTAMPTZ,
  montant NUMERIC(12,2),
  cycle_facturation TEXT CHECK (cycle_facturation IN ('mensuel', 'annuel')),
  statut_paiement TEXT CHECK (statut_paiement IN ('paye', 'echec', 'en_attente')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activation de RLS
ALTER TABLE public.abonnements ENABLE ROW LEVEL SECURITY;

-- RLS Politique
CREATE POLICY "utilisateur voit son abonnement"
  ON public.abonnements FOR SELECT
  USING (utilisateur_id = auth.uid());

-- Fonction déclencheur pour créer l'essai à l'inscription
CREATE OR REPLACE FUNCTION public.creer_essai_gratuit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.abonnements (utilisateur_id, plan, statut, date_fin_essai)
  values (new.id, 'essai', 'actif', now() + interval '30 days');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users
DROP TRIGGER IF EXISTS trg_creer_essai ON auth.users;
CREATE TRIGGER trg_creer_essai
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.creer_essai_gratuit();

-- Table des transactions de paiement
CREATE TABLE IF NOT EXISTS public.transactions_paiement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT UNIQUE NOT NULL,
  utilisateur_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL,
  montant NUMERIC(12,2) NOT NULL,
  statut TEXT CHECK (statUT IN ('en_attente', 'paye', 'echec')) DEFAULT 'en_attente',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS table transactions
ALTER TABLE public.transactions_paiement ENABLE ROW LEVEL SECURITY;

-- RLS Politique transactions
CREATE POLICY "utilisateur voit ses transactions"
  ON public.transactions_paiement FOR SELECT
  USING (utilisateur_id = auth.uid());
