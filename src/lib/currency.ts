// Rough FX — in production fetch daily rates from an API like fixer.io or openexchangerates.org
export const USD_TO: Record<string, number> = {
  NGN: 1500,
  GHS: 12,
  ZAR: 18,
  KES: 130,
  EGP: 48,
  RWF: 1300,
  XOF: 600,
};

export function convertUsdToLocal(usdAmount: number, currency: string): number {
  const rate = USD_TO[currency] ?? 1;
  return usdAmount * rate;
}

export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
