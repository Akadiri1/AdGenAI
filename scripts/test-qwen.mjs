import "dotenv/config";

async function testQwenVideo() {
  console.log("Testing Qwen Video (WanX 2.1)...");
  const key = process.env.QWEN_API_KEY;
  if (!key) {
    console.log("❌ QWEN_API_KEY not set");
    return;
  }

  try {
    const res = await fetch("https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable"
      },
      body: JSON.stringify({
        model: "wan2.1-t2v-plus",
        input: {
          prompt: "A beautiful sunrise over a Nigerian landscape, cinematic 4k"
        },
        parameters: {
          resolution: "1280*720",
          duration: 5
        }
      }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log("✅ Qwen Video Request Sent. Task ID:", data.output?.task_id);
    } else {
      console.log("❌ Qwen Video Error:", res.status, JSON.stringify(data));
    }
  } catch (e) {
    console.log("❌ Qwen Video failed:", e.message);
  }
}

testQwenVideo();
