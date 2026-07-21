-- Soninkara Facture - Migration Liaison Dépenses aux Boutiques

ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS boutique_id UUID REFERENCES public.boutiques(id) ON DELETE SET NULL;

-- Index pour accélérer les filtres et agrégations par boutique
CREATE INDEX IF NOT EXISTS idx_expenses_boutique_id ON public.expenses(boutique_id);
