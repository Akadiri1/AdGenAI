/**
 * Thin re-export of internal Replicate helpers needed by the finalize route.
 * Separated so we don't pollute the public replicate.ts API surface.
 */
const REPLICATE_API = "https://api.replicate.com/v1";

async function callReplicate(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${REPLICATE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export type Prediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output: unknown;
  error: string | null;
  urls: { get: string; cancel: string };
};

export async function createPrediction(
  model: string,
  version: string | undefined,
  input: Record<string, unknown>,
): Promise<Prediction> {
  const body = version ? { version, input } : { input };
  const path = version ? "/predictions" : `/models/${model}/predictions`;
  const res = await callReplicate(path, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Replicate create failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as Prediction;
}

export async function getPrediction(id: string): Promise<Prediction> {
  const res = await callReplicate(`/predictions/${id}`);
  if (!res.ok) throw new Error(`Replicate get failed: ${res.status}`);
  return (await res.json()) as Prediction;
}
