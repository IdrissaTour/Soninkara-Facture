-- Soninkara Facture - Migration Module Facturation par Compteur (Eau, Électricité, Connexion)

-- Create compteurs table
CREATE TABLE IF NOT EXISTS public.compteurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  boutique_id UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('eau', 'electricite', 'connexion')),
  numero_compteur TEXT,
  unite TEXT NOT NULL, -- 'm3', 'kWh', 'Go', 'forfait'
  date_installation DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create releves table
CREATE TABLE IF NOT EXISTS public.releves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compteur_id UUID NOT NULL REFERENCES public.compteurs(id) ON DELETE CASCADE,
  index_value NUMERIC NOT NULL,
  date_releve DATE NOT NULL,
  source TEXT DEFAULT 'manuel' CHECK (source IN ('manuel', 'estime')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tarifs table
CREATE TABLE IF NOT EXISTS public.tarifs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('eau', 'electricite', 'connexion')),
  tranche_min NUMERIC NOT NULL DEFAULT 0,
  tranche_max NUMERIC, -- NULL = pas de plafond
  prix_unitaire NUMERIC NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT true,
  date_debut DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin DATE
);

-- Alter invoices table (additive, optional columns)
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS type_facture TEXT DEFAULT 'produits' CHECK (type_facture IN ('produits', 'eau', 'electricite', 'connexion')),
  ADD COLUMN IF NOT EXISTS compteur_id UUID REFERENCES public.compteurs(id) ON DELETE SET NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.compteurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.releves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarifs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for compteurs
CREATE POLICY "Users can manage compteurs belonging to their boutiques" ON public.compteurs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.boutiques
            JOIN public.companies ON public.boutiques.company_id = public.companies.id
            WHERE public.boutiques.id = public.compteurs.boutique_id
            AND public.companies.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.boutiques
            JOIN public.companies ON public.boutiques.company_id = public.companies.id
            WHERE public.boutiques.id = public.compteurs.boutique_id
            AND public.companies.owner_id = auth.uid()
        )
    );

-- RLS Policies for releves
CREATE POLICY "Users can manage releves belonging to their compteurs" ON public.releves
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.compteurs
            JOIN public.boutiques ON public.compteurs.boutique_id = public.boutiques.id
            JOIN public.companies ON public.boutiques.company_id = public.companies.id
            WHERE public.compteurs.id = public.releves.compteur_id
            AND public.companies.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.compteurs
            JOIN public.boutiques ON public.compteurs.boutique_id = public.boutiques.id
            JOIN public.companies ON public.boutiques.company_id = public.companies.id
            WHERE public.compteurs.id = public.releves.compteur_id
            AND public.companies.owner_id = auth.uid()
        )
    );

-- RLS Policies for tarifs
CREATE POLICY "Users can manage tarifs belonging to their boutiques" ON public.tarifs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.boutiques
            JOIN public.companies ON public.boutiques.company_id = public.companies.id
            WHERE public.boutiques.id = public.tarifs.boutique_id
            AND public.companies.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.boutiques
            JOIN public.companies ON public.boutiques.company_id = public.companies.id
            WHERE public.boutiques.id = public.tarifs.boutique_id
            AND public.companies.owner_id = auth.uid()
        )
    );
