-- Soninkara Facture - Migration Table Factures Autres (Eau, Électricité, Wifi, Forfait)

CREATE TABLE IF NOT EXISTS factures_autres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  compteur_id UUID REFERENCES compteurs(id) ON DELETE SET NULL,
  invoice_number VARCHAR NOT NULL,
  type_facture VARCHAR NOT NULL DEFAULT 'eau',
  status VARCHAR NOT NULL DEFAULT 'sent',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ancien_index NUMERIC,
  nouveau_index NUMERIC,
  consommation NUMERIC,
  prix_unitaire NUMERIC,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tva NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  periode_debut DATE,
  periode_fin DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active RLS
ALTER TABLE factures_autres ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'factures_autres' AND policyname = 'Users can manage factures_autres of their company'
  ) THEN
    CREATE POLICY "Users can manage factures_autres of their company" ON factures_autres
      FOR ALL USING (
        company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
      );
  END IF;
END $$;
