// Paystack REST helper — regional processor for Africa (NGN, GHS, ZAR, KES, etc.)
const PAYSTACK_BASE = "https://api.paystack.co";

async function paystackRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Paystack error: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data: { authorization_url: string; access_code: string; reference: string };
};

export async function initializeTransaction(params: {
  email: string;
  amountKobo: number; // amount in lowest currency unit (kobo for NGN, pesewas for GHS)
  currency: string;
  reference?: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  plan?: string; // Paystack plan code for recurring
}): Promise<PaystackInitializeResponse> {
  return paystackRequest<PaystackInitializeResponse>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      currency: params.currency,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
      plan: params.plan,
    }),
  });
}

export type PaystackVerifyResponse = {
  status: boolean;
  data: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    customer: { email: string };
    metadata: Record<string, unknown>;
  };
};

export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  return paystackRequest<PaystackVerifyResponse>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
}
