import * as dotenv from 'dotenv';
dotenv.config();

async function testFal() {
  const FAL_KEY = process.env.FAL_KEY;
  if (!FAL_KEY) {
    console.log("No FAL_KEY");
    return;
  }
  
  try {
    const res = await fetch("https://queue.fal.run/fal-ai/faceswap", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        swap_image_url: "https://famousli.vercel.app/actors/ava-001.png",
        target_image_url: "https://famousli.vercel.app/actors/ethan-001.png"
      })
    });
    console.log(res.status, await res.text());
  } catch (e) {
    console.error(e);
  }
}

testFal();
