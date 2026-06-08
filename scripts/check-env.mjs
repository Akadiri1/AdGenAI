import "dotenv/config";
console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
console.log("R2_BUCKET:", process.env.R2_BUCKET ? "Set" : "Not set");
