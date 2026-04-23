import { SignJWT } from "jose";
import "dotenv/config";

async function testSiliconFlow() {
  console.log("Testing SiliconFlow...");
  try {
    const res = await fetch("https://api.siliconflow.cn/v1/user/info", {
      headers: { Authorization: `Bearer ${process.env.SILICONFLOW_API_KEY}` }
    });
    const data = await res.json();
    console.log("✅ SiliconFlow:", res.ok ? "Working" : "Error: " + JSON.stringify(data));
  } catch (e) { console.log("❌ SiliconFlow failed:", (e as Error).message); }
}

async function testGemini() {
  console.log("Testing Gemini...");
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
    });
    const data = await res.json();
    console.log("✅ Gemini:", res.ok ? "Working" : "Error: " + JSON.stringify(data));
  } catch (e) { console.log("❌ Gemini failed:", (e as Error).message); }
}

async function testFal() {
  console.log("Testing Fal.ai...");
  try {
    const res = await fetch("https://queue.fal.run/fal-ai/hunyuan-video/requests/test", {
      headers: { Authorization: `Key ${process.env.FAL_KEY}` }
    });
    // This will 404 because request doesn't exist, but we check if auth is accepted
    console.log("✅ Fal.ai:", res.status !== 401 ? "Key Accepted" : "Auth Failed");
  } catch (e) { console.log("❌ Fal failed:", (e as Error).message); }
}

async function testMagic() {
  console.log("Testing Magic API...");
  try {
    const res = await fetch("https://api.magicapi.com/v1/user/info", {
      headers: { "x-magicapi-key": process.env.MAGIC_API_KEY || "" }
    });
    const data = await res.json();
    console.log("✅ Magic API:", res.ok ? "Working" : "Error: " + JSON.stringify(data));
  } catch (e) { console.log("❌ Magic failed:", (e as Error).message); }
}

async function testKling() {
  console.log("Testing Kling...");
  try {
    const accessKey = process.env.KLING_ACCESS_KEY;
    const secretKey = process.env.KLING_SECRET_KEY;
    if (!accessKey || !secretKey) throw new Error("No Kling keys");
    
    const secret = new TextEncoder().encode(secretKey);
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer(accessKey)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(secret);
      
    const res = await fetch("https://api.klingai.com/v1/user/balance", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log("✅ Kling:", res.ok ? "Working" : "Error: " + JSON.stringify(data));
  } catch (e) { console.log("❌ Kling failed:", (e as Error).message); }
}

async function main() {
  console.log("--- STARTING API TESTS ---");
  await testSiliconFlow();
  await testGemini();
  await testFal();
  await testMagic();
  await testKling();
  console.log("--- TESTS COMPLETE ---");
}

main().catch(console.error);
