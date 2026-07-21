-- Soninkara Facture - Migration Image Produit Optionnelle

ALTER TABLE public.produits 
ADD COLUMN IF NOT EXISTS image_url TEXT;
