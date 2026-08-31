/**
 * Convertit un nombre entier en sa représentation textuelle en français (Majuscules).
 * Exemple: 28400 -> "Vingt Huit Mille Quatre Cent"
 */
export function numberToWordsFrench(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return 'Zéro';
  num = Math.floor(Math.abs(num));
  if (num === 0) return 'Zéro';

  const units = ['', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf'];
  const teens = ['Dix', 'Onze', 'Douze', 'Treize', 'Quatorze', 'Quinze', 'Seize', 'Dix-Sept', 'Dix-Huit', 'Dix-Neuf'];
  const tens = ['', 'Dix', 'Vingt', 'Trente', 'Quarante', 'Cinquante', 'Soixante', 'Soixante-Dix', 'Quatre-Vingts', 'Quatre-Vingt-Dix'];

  function convertBelowThousand(n: number): string {
    let str = '';
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;

    if (hundred > 0) {
      if (hundred === 1) {
        str += 'Cent';
      } else {
        str += units[hundred] + ' Cent';
      }
    }

    if (remainder > 0) {
      if (str.length > 0) str += ' ';

      if (remainder < 10) {
        str += units[remainder];
      } else if (remainder < 20) {
        str += teens[remainder - 10];
      } else {
        const ten = Math.floor(remainder / 10);
        const unit = remainder % 10;

        if (ten === 7) {
          str += 'Soixante ' + teens[unit];
        } else if (ten === 9) {
          str += 'Quatre-Vingt ' + teens[unit];
        } else {
          str += tens[ten];
          if (unit > 0) {
            str += ' ' + units[unit];
          }
        }
      }
    }

    return str;
  }

  function convert(n: number): string {
    if (n === 0) return '';

    if (n < 1000) {
      return convertBelowThousand(n);
    }

    if (n < 1000000) {
      const thousands = Math.floor(n / 1000);
      const remainder = n % 1000;
      let thousandStr = thousands === 1 ? 'Mille' : convertBelowThousand(thousands) + ' Mille';
      if (remainder > 0) {
        thousandStr += ' ' + convertBelowThousand(remainder);
      }
      return thousandStr;
    }

    if (n < 1000000000) {
      const millions = Math.floor(n / 1000000);
      const remainder = n % 1000000;
      let millionStr = millions === 1 ? 'Un Million' : convertBelowThousand(millions) + ' Millions';
      if (remainder > 0) {
        millionStr += ' ' + convert(remainder);
      }
      return millionStr;
    }

    return n.toString();
  }

  return convert(num).trim();
}
