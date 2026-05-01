/**
 * Veo 2 video generation — calls Vertex AI REST API directly from Next.js.
 * Authenticates using a Google service account key stored in GOOGLE_SERVICE_ACCOUNT_JSON.
 *
 * Setup:
 *   1. gcloud iam service-accounts keys create veo-key.json --iam-account=famousli-veo@famousli.iam.gserviceaccount.com
 *   2. Add contents of veo-key.json as GOOGLE_SERVICE_ACCOUNT_JSON in Vercel env vars
 *   3. Grant service account roles/aiplatform.user on the famousli project
 */

export function isVeoConfigured(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
}

const PROJECT  = "famousli";
const LOCATION = "us-central1";
const MODEL    = "veo-2.0-generate-001";

/** Get a short-lived Google OAuth2 access token from the service account JSON */
async function getAccessToken(): Promise<string> {
  const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);

  // Build the JWT header + claim
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim  = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  const unsigned = `${encode(header)}.${encode(claim)}`;

  // Sign with RSA-SHA256 using the private key from the service account JSON
  const { createSign } = await import("crypto");
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const sig = signer.sign(sa.private_key, "base64url");
  const jwt = `${unsigned}.${sig}`;

  // Exchange JWT for access token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`GCP auth failed: ${await res.text()}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

type VeoParams = {
  prompt: string;
  imageUrl?: string;
  duration?: 5 | 10;
  aspectRatio?: "9:16" | "16:9" | "1:1";
};

/** Generate a video with Veo 2. Returns the GCS URI (gs://...) of the clip. */
export async function generateVeoClip(params: VeoParams): Promise<string> {
  const token = await getAccessToken();
  const base  = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}`;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const instance: Record<string, unknown> = { prompt: params.prompt };
  if (params.imageUrl) {
    const imgRes  = await fetch(params.imageUrl);
    const imgBuf  = Buffer.from(await imgRes.arrayBuffer());
    instance.image = { bytesBase64Encoded: imgBuf.toString("base64") };
  }

  // Start long-running operation
  const startRes = await fetch(`${base}:generateVideo`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      instances: [instance],
      parameters: {
        duration_seconds: params.duration ?? 5,
        aspect_ratio: params.aspectRatio ?? "9:16",
        number_of_videos: 1,
      },
    }),
  });
  if (!startRes.ok) throw new Error(`Veo start failed: ${await startRes.text()}`);
  const { name: opName } = await startRes.json() as { name: string };

  // Poll until done (max 5 min)
  const opUrl = `https://${LOCATION}-aiplatform.googleapis.com/v1/${opName}`;
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const tok = await getAccessToken();
    const poll = await fetch(opUrl, { headers: { Authorization: `Bearer ${tok}` } });
    const result = await poll.json() as { done?: boolean; error?: { message: string }; response?: { videos: { uri: string }[] } };
    if (result.done) {
      if (result.error) throw new Error(`Veo failed: ${result.error.message}`);
      const uri = result.response?.videos?.[0]?.uri;
      if (!uri) throw new Error("Veo returned no video URI");
      return uri;
    }
  }
  throw new Error("Veo timed out after 5 minutes");
}
