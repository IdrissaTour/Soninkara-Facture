import { CompteurType, Tarif } from '@/lib/types';

export interface TierBreakdown {
  trancheMin: number;
  trancheMax: number | null;
  volume: number;
  prixUnitaire: number;
  totalTier: number;
}

export interface MeterCalculationResult {
  consumption: number;
  totalAmount: number;
  averageUnitPrice: number;
  breakdown: TierBreakdown[];
}

/**
 * Calcule la consommation à partir de l'index précédent et du nouvel index.
 * Throws an error if newIndex is strictly less than previousIndex.
 */
export function calculateConsumption(newIndex: number, previousIndex: number): number {
  if (isNaN(newIndex) || isNaN(previousIndex)) {
    return 0;
  }
  if (newIndex < previousIndex) {
    throw new Error(`Le nouvel index (${newIndex}) ne peut pas être inférieur à l'index précédent (${previousIndex}).`);
  }
  return newIndex - previousIndex;
}

/**
 * Obtenir les grilles tarifaires par défaut si aucune n'est configurée dans la base
 */
export function getDefaultTarifs(type: CompteurType): Tarif[] {
  const dummyBoutiqueId = 'default';
  const dummyDate = new Date().toISOString().split('T')[0];

  if (type === 'eau') {
    return [
      { id: 'def-eau-1', boutique_id: dummyBoutiqueId, type: 'eau', tranche_min: 0, tranche_max: 20, prix_unitaire: 250, actif: true, date_debut: dummyDate },
      { id: 'def-eau-2', boutique_id: dummyBoutiqueId, type: 'eau', tranche_min: 20, tranche_max: 50, prix_unitaire: 400, actif: true, date_debut: dummyDate },
      { id: 'def-eau-3', boutique_id: dummyBoutiqueId, type: 'eau', tranche_min: 50, tranche_max: null, prix_unitaire: 600, actif: true, date_debut: dummyDate },
    ];
  }

  if (type === 'electricite') {
    return [
      { id: 'def-elec-1', boutique_id: dummyBoutiqueId, type: 'electricite', tranche_min: 0, tranche_max: 50, prix_unitaire: 90, actif: true, date_debut: dummyDate },
      { id: 'def-elec-2', boutique_id: dummyBoutiqueId, type: 'electricite', tranche_min: 50, tranche_max: 250, prix_unitaire: 125, actif: true, date_debut: dummyDate },
      { id: 'def-elec-3', boutique_id: dummyBoutiqueId, type: 'electricite', tranche_min: 250, tranche_max: null, prix_unitaire: 165, actif: true, date_debut: dummyDate },
    ];
  }

  // Connexion forfait
  return [
    { id: 'def-conn-1', boutique_id: dummyBoutiqueId, type: 'connexion', tranche_min: 0, tranche_max: null, prix_unitaire: 25000, actif: true, date_debut: dummyDate },
  ];
}

/**
 * Calcule la tarification par tranche progressive en fonction du volume consommé
 */
export function calculateTieredPrice(consumption: number, tarifs: Tarif[]): MeterCalculationResult {
  if (consumption <= 0 || !tarifs || tarifs.length === 0) {
    return {
      consumption: Math.max(0, consumption),
      totalAmount: 0,
      averageUnitPrice: 0,
      breakdown: []
    };
  }

  // Trier les tranches par tranche_min croissante
  const sortedTarifs = [...tarifs]
    .filter(t => t.actif)
    .sort((a, b) => a.tranche_min - b.tranche_min);

  let totalAmount = 0;
  const breakdown: TierBreakdown[] = [];

  for (const tarif of sortedTarifs) {
    const min = tarif.tranche_min;
    const max = tarif.tranche_max;

    if (consumption > min) {
      const volumeInTier = max !== null 
        ? Math.min(consumption - min, max - min)
        : consumption - min;

      if (volumeInTier > 0) {
        const totalTier = volumeInTier * tarif.prix_unitaire;
        totalAmount += totalTier;
        breakdown.push({
          trancheMin: min,
          trancheMax: max,
          volume: volumeInTier,
          prixUnitaire: tarif.prix_unitaire,
          totalTier
        });
      }
    }
  }

  const averageUnitPrice = consumption > 0 ? totalAmount / consumption : 0;

  return {
    consumption,
    totalAmount,
    averageUnitPrice,
    breakdown
  };
}

/**
 * Génère la description textuelle de la facture de compteur/abonnement
 */
export function generateMeterInvoiceDescription(
  type: CompteurType,
  volumeOrDuration: number,
  unit: string,
  previousIndex?: number,
  newIndex?: number
): string {
  if (type === 'connexion') {
    return `Abonnement Connexion Internet (${volumeOrDuration} ${volumeOrDuration > 1 ? 'mois' : 'mois'})`;
  }

  const typeName = type === 'eau' ? 'eau' : 'électricité';
  
  if (previousIndex !== undefined && newIndex !== undefined) {
    return `Consommation ${typeName} ${volumeOrDuration} ${unit} (index ${previousIndex} à ${newIndex})`;
  }

  return `Consommation ${typeName} ${volumeOrDuration} ${unit}`;
}
