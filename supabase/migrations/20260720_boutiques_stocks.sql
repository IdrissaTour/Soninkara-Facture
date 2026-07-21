-- Soninkara Facture - Migration Module Boutiques, Stocks & Ventes

CREATE TABLE IF NOT EXISTS public.boutiques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    adresse TEXT,
    devise TEXT NOT NULL DEFAULT 'FCFA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.produits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boutique_id UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    reference TEXT,
    prix_achat NUMERIC(12,2) NOT NULL DEFAULT 0,
    prix_vente NUMERIC(12,2) NOT NULL DEFAULT 0,
    quantite_stock INTEGER NOT NULL DEFAULT 0,
    seuil_alerte INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mouvements_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('entree', 'sortie', 'ajustement')),
    quantite INTEGER NOT NULL,
    motif TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ventes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boutique_id UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
    produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    prix_unitaire NUMERIC(12,2) NOT NULL DEFAULT 0,
    facture_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.boutiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mouvements_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage boutiques belonging to their companies" ON public.boutiques
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE public.companies.id = public.boutiques.company_id 
            AND public.companies.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE public.companies.id = public.boutiques.company_id 
            AND public.companies.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage produits belonging to their boutiques" ON public.produits
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.boutiques
            JOIN public.companies ON public.boutiques.company_id = public.companies.id
            WHERE public.boutiques.id = public.produits.boutique_id
            AND public.companies.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.boutiques
            JOIN public.companies ON public.boutiques.company_id = public.companies.id
            WHERE public.boutiques.id = public.produits.boutique_id
            AND public.companies.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage mouvements belonging to their produits" ON public.mouvements_stock
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.produits
            JOIN public.boutiques ON public.produits.boutique_id = public.boutiques.id
            JOIN public.companies ON public.boutiques.company_id = public.companies.id
            WHERE public.produits.id = public.mouvements_stock.produit_id
            AND public.companies.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.produits
            JOIN public.boutiques ON public.produits.boutique_id = public.boutiques.id
            JOIN public.companies ON public.boutiques.company_id = public.companies.id
            WHERE public.produits.id = public.mouvements_stock.produit_id
            AND public.companies.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage ventes belonging to their boutiques" ON public.ventes
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.boutiques
            JOIN public.companies ON public.boutiques.company_id = public.companies.id
            WHERE public.boutiques.id = public.ventes.boutique_id
            AND public.companies.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.boutiques
            JOIN public.companies ON public.boutiques.company_id = public.companies.id
            WHERE public.boutiques.id = public.ventes.boutique_id
            AND public.companies.owner_id = auth.uid()
        )
    );

-- Auto decrement stock trigger
CREATE OR REPLACE FUNCTION public.decrementer_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.produits
  SET quantite_stock = quantite_stock - NEW.quantite,
      updated_at = now()
  WHERE id = NEW.produit_id;

  INSERT INTO public.mouvements_stock (produit_id, type, quantite, motif)
  VALUES (NEW.produit_id, 'sortie', NEW.quantite, 'Vente #' || substring(NEW.id::text, 1, 8));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_decrementer_stock ON public.ventes;
CREATE TRIGGER trg_decrementer_stock
AFTER INSERT ON public.ventes
FOR EACH ROW EXECUTE FUNCTION public.decrementer_stock();

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_boutiques_updated_at ON public.boutiques;
CREATE TRIGGER update_boutiques_updated_at BEFORE UPDATE ON public.boutiques
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_produits_updated_at ON public.produits;
CREATE TRIGGER update_produits_updated_at BEFORE UPDATE ON public.produits
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
