import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key, { typescript: true });
  return _stripe;
}

// Compatibility export (wraps lazy getter)
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const s = getStripe();
    return (s as unknown as Record<string | symbol, unknown>)[prop as string];
  },
});
