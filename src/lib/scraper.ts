import * as cheerio from "cheerio";

/**
 * Extracts clean, readable text from a URL for AI analysis.
 */
export async function scrapeWebsite(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Failed to fetch website: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove noise
    $("script, style, nav, footer, iframe, noscript").remove();

    // Get main content
    const text = $("body").text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 10000); // Cap at 10k chars for AI context

    return text;
  } catch (err) {
    console.error("Scraping error:", err);
    throw new Error("Could not read website content. Please ensure the URL is public.");
  }
}
