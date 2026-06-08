import { isStorageConfigured } from "./storage";

/**
 * Checks if a URL is likely unreachable by external AI providers (Replicate, Kling, Qwen).
 * Returns true if the URL is problematic (localhost, 127.0.0.1, or private IP).
 */
export function isUnreachableUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  
  // Localhost / Loopback
  if (u.includes("localhost") || u.includes("127.0.0.1")) return true;
  
  // Private IP ranges
  // 10.0.0.0 – 10.255.255.255
  // 172.16.0.0 – 172.31.255.255
  // 192.168.0.0 – 192.168.255.255
  if (u.includes("//10.") || u.includes("//192.168.") || u.includes("//172.")) {
    // Basic check for common private IP patterns
    return true;
  }

  return false;
}

/**
 * Validates that generation can proceed. 
 * Returns an error message if connectivity is broken, or null if okay.
 */
export function validateConnectivity(params: {
  actorImageUrl?: string | null;
  productImageUrls?: string[];
}): string | null {
  if (isStorageConfigured()) return null;

  if (isUnreachableUrl(params.actorImageUrl)) {
    return "Connectivity Error: Your actor image is on 'localhost'. External AI providers (Replicate/Kling) cannot reach it. Use ngrok to make your local server public.";
  }

  for (const url of params.productImageUrls ?? []) {
    if (isUnreachableUrl(url)) {
      return "Connectivity Error: One of your product images is on 'localhost'. External AI providers cannot reach it. Use ngrok.";
    }
  }

  return null;
}
