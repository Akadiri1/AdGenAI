"""
Veo 2 video generation service for Famousli.
Runs on Cloud Run with a service account — no API keys needed.

POST /generate
  { "prompt": str, "image_url": str|None, "duration": 5|10, "aspect_ratio": "9:16"|"16:9"|"1:1" }
  -> { "video_url": str, "prediction_id": str }

POST /status/<prediction_id>
  -> { "status": "generating"|"ready"|"failed", "video_url": str|None }
"""
import os, time, requests
from flask import Flask, request, jsonify
import vertexai
from vertexai.preview.vision_models import VideoGenerationModel

app = Flask(__name__)

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "famousli")
LOCATION   = os.environ.get("LOCATION", "us-central1")

# ADC via service account — no credentials file needed on Cloud Run
vertexai.init(project=PROJECT_ID, location=LOCATION)

_model = None
def get_model():
    global _model
    if _model is None:
        _model = VideoGenerationModel.from_pretrained("veo-2.0-generate-001")
    return _model

@app.route("/health")
def health():
    return {"status": "ok", "project": PROJECT_ID}

@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json(force=True)
    prompt       = data.get("prompt", "")
    image_url    = data.get("image_url")     # optional: image-to-video
    duration     = int(data.get("duration", 5))
    aspect_ratio = data.get("aspect_ratio", "9:16")
    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    try:
        model = get_model()
        kwargs = dict(
            prompt=prompt,
            duration_seconds=duration,
            aspect_ratio=aspect_ratio,
            number_of_videos=1,
        )
        if image_url:
            # Download image bytes for image-to-video
            img_bytes = requests.get(image_url, timeout=15).content
            from vertexai.vision_models import Image
            kwargs["image"] = Image(img_bytes)

        operation = model.generate_video(**kwargs)
        # operation.result() blocks until done (up to 5 min)
        videos = operation.result(timeout=300)
        video = videos[0]
        video_uri = video.uri

        return jsonify({
            "status": "ready",
            "video_url": video_uri,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
