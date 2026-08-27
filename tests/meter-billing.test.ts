import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import {
  calculateConsumption,
  calculateTieredPrice,
  getDefaultTarifs,
  generateMeterInvoiceDescription
} from '../lib/utils/meter-billing';

describe('Tests du Module de Facturation par Compteur (Soninkara Facture)', () => {

  describe('1. Calcul de Consommation', () => {
    test('devrait calculer correctement la consommation positive', () => {
      const result = calculateConsumption(1321, 1250);
      assert.strictEqual(result, 71);
    });

    test('devrait retourner 0 si le nouvel index est égal au précédent', () => {
      const result = calculateConsumption(1000, 1000);
      assert.strictEqual(result, 0);
    });

    test('devrait lever une erreur si le nouvel index est inférieur à l\'ancien', () => {
      assert.throws(() => {
        calculateConsumption(900, 1000);
      }, (err: Error) => {
        return err.message.includes('ne peut pas être inférieur');
      });
    });

    test('devrait gérer le premier relevé quand previousIndex est 0', () => {
      const result = calculateConsumption(150, 0);
      assert.strictEqual(result, 150);
    });
  });

  describe('2. Tarification Progressive par Tranches (Eau)', () => {
    const tarifsEau = getDefaultTarifs('eau'); // Tranches: 0-20 @ 250, 20-50 @ 400, >50 @ 600

    test('devrait calculer la tarification pour 15 m³ (Tranche 1 uniquement)', () => {
      const res = calculateTieredPrice(15, tarifsEau);
      assert.strictEqual(res.consumption, 15);
      assert.strictEqual(res.totalAmount, 3750); // 15 * 250
      assert.strictEqual(res.breakdown.length, 1);
      assert.strictEqual(res.breakdown[0].volume, 15);
    });

    test('devrait calculer la tarification pour 35 m³ (Tranche 1 + Tranche 2)', () => {
      const res = calculateTieredPrice(35, tarifsEau);
      // Tranche 1: 20 * 250 = 5000
      // Tranche 2: 15 * 400 = 6000
      // Total = 11 000 FCFA
      assert.strictEqual(res.consumption, 35);
      assert.strictEqual(res.totalAmount, 11000);
      assert.strictEqual(res.breakdown.length, 2);
    });

    test('devrait calculer la tarification pour 71 m³ (Tranche 1 + Tranche 2 + Tranche 3)', () => {
      const res = calculateTieredPrice(71, tarifsEau);
      // Tranche 1: 20 * 250 = 5000
      // Tranche 2: 30 * 400 = 12000
      // Tranche 3: 21 * 600 = 12600
      // Total = 29 600 FCFA
      assert.strictEqual(res.consumption, 71);
      assert.strictEqual(res.totalAmount, 29600);
      assert.strictEqual(res.breakdown.length, 3);
      assert.strictEqual(res.breakdown[2].volume, 21);
    });
  });

  describe('3. Tarification Progressive par Tranches (Électricité)', () => {
    const tarifsElec = getDefaultTarifs('electricite'); // 0-50 @ 90, 50-250 @ 125, >250 @ 165

    test('devrait calculer la tarification pour 250 kWh', () => {
      const res = calculateTieredPrice(250, tarifsElec);
      // Tranche 1: 50 * 90 = 4500
      // Tranche 2: 200 * 125 = 25000
      // Total = 29 500 FCFA
      assert.strictEqual(res.totalAmount, 29500);
    });
  });

  describe('4. Descriptions de Facture', () => {
    test('devrait générer une description lisible pour l\'eau avec index', () => {
      const desc = generateMeterInvoiceDescription('eau', 71, 'm³', 1250, 1321);
      assert.strictEqual(desc, 'Consommation eau 71 m³ (index 1250 à 1321)');
    });

    test('devrait générer une description pour un forfait connexion', () => {
      const desc = generateMeterInvoiceDescription('connexion', 3, 'mois');
      assert.strictEqual(desc, 'Abonnement Connexion Internet (3 mois)');
    });
  });
});
