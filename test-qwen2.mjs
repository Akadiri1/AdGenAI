import { config } from "dotenv";
config();

const DASHSCOPE_INTL_BASE = "https://dashscope-intl.aliyuncs.com/api/v1";
const key = process.env.QWEN_API_KEY;

console.log("🎬 Submitting test (removing duration parameter)...");
const submitRes = await fetch(`${DASHSCOPE_INTL_BASE}/services/aigc/video-generation/video-synthesis`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "X-DashScope-Async": "enable"
  },
  body: JSON.stringify({
    model: "wan2.1-t2v-turbo",
    input: {
      prompt: "A woman smiling and waving at the camera in a bright office. Natural lighting."
    },
    parameters: {
      resolution: "720P",
      // Removed duration parameter completely to test if it fixes 'duration customization is not supported'
      prompt_extend: true,
      aspect_ratio: "9:16"
    }
  }),
});

console.log("Submit HTTP Status:", submitRes.status);
const submitData = await submitRes.json();
console.log("Submit Response:", JSON.stringify(submitData, null, 2));

const taskId = submitData.output?.task_id;
if (!taskId) { console.error("❌ No task_id"); process.exit(1); }

console.log(`✅ Task: ${taskId}\n⏳ Polling...\n`);

for (let i = 0; i < 60; i++) {
  await new Promise(r => setTimeout(r, 10000));
  const statusRes = await fetch(`${DASHSCOPE_INTL_BASE}/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${key}` }
  });
  const statusData = await statusRes.json();
  const status = statusData.output?.task_status;
  console.log(`[${new Date().toLocaleTimeString()}] Status: ${status}`);
  
  if (status === "SUCCEEDED") {
    console.log("\n🎉 SUCCESS!");
    process.exit(0);
  }
  if (status === "FAILED") {
    console.error("\n❌ FAILED:", JSON.stringify(statusData.output, null, 2));
    process.exit(1);
  }
}
