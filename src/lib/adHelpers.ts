// Helpers for SQLite storage — platforms stored as CSV, images as JSON string.

export function platformsToString(platforms: string[]): string {
  return platforms.join(",");
}

export function stringToPlatforms(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv.split(",").map((p) => p.trim()).filter(Boolean);
}

export function imagesToString(images: string[]): string {
  return JSON.stringify(images);
}

export function stringToImages(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
