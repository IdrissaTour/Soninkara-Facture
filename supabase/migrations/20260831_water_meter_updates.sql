-- Migration: 20260831_water_meter_updates.sql
-- Description: Ajout du prix unitaire sur la table compteurs et des métadonnées de relevé/période sur la table invoices

-- 1. Ajout de prix_unitaire sur la table compteurs
ALTER TABLE compteurs 
ADD COLUMN IF NOT EXISTS prix_unitaire NUMERIC(12,2) DEFAULT NULL;

-- 2. Ajout des colonnes de relevé et de période sur la table invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS ancien_index NUMERIC(12,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS nouveau_index NUMERIC(12,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS consommation NUMERIC(12,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS prix_unitaire_compteur NUMERIC(12,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS periode_debut DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS periode_fin DATE DEFAULT NULL;
