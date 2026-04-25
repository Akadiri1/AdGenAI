// Quick health check for the Replicate API token.
// Run with: node scripts/test-replicate.mjs
import "dotenv/config";

const token = process.env.REPLICATE_API_TOKEN;
if (!token) {
  console.error("❌ REPLICATE_API_TOKEN not set in .env");
  process.exit(1);
}

console.log("Token prefix:", token.slice(0, 6) + "..." + token.slice(-4));

const res = await fetch("https://api.replicate.com/v1/account", {
  headers: { Authorization: `Bearer ${token}` },
});

const body = await res.text();
if (res.ok) {
  console.log("✅ Replicate auth OK");
  console.log(body);
} else {
  console.error(`❌ Replicate returned ${res.status}`);
  console.error(body);
  process.exit(1);
}
