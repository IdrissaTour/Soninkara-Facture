
/**
 * Formats a number to FCFA currency string.
 * Example: 15000 -> "15 000 FCFA"
 */
export function formatFCFA(amount: number): string {
  if (isNaN(amount)) return '0 FCFA';
  
  // Format with french spacing
  const formatted = Math.round(amount).toLocaleString('fr-FR');
  return `${formatted} FCFA`;
}

/**
 * Calculates subtotals, VAT (18%), and final grand total for a set of line items.
 */
export function calculateInvoiceTotals(items: { quantity: number; unit_price: number }[]) {
  const subtotal = Math.round(items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    return sum + (qty * price);
  }, 0));
  
  const tva = Math.round(subtotal * 0.18);
  const total = subtotal + tva;
  
  return {
    subtotal,
    tva,
    total
  };
}

/**
 * Safely parses string inputs to numbers for currency operations
 */
export function parseCurrencyInput(value: string): number {
  const cleanValue = value.replace(/[^0-9.-]+/g, '');
  const num = parseFloat(cleanValue);
  return isNaN(num) ? 0 : num;
}

/**
 * Format string date to a friendly french format: e.g. "22 mai 2026"
 */
export function formatDateFrench(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
