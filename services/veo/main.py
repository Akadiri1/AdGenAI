"""
Veo 2 video generation service for Famousli.
Uses Vertex AI REST API + Application Default Credentials (ADC).
Lightweight — no heavy google-cloud-aiplatform SDK needed.
"""
import os, time, json
import google.auth
import google.auth.transport.requests
import requests as req
from flask import Flask, request, jsonify

app = Flask(__name__)

PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT", "famousli")
LOCATION = "us-central1"
MODEL = "veo-2.0-generate-001"
BASE = f"https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/{LOCATION}/publishers/google/models/{MODEL}"

def get_token():
    creds, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    creds.refresh(google.auth.transport.requests.Request())
    return creds.token

@app.route("/health")
def health():
    return {"status": "ok", "project": PROJECT, "model": MODEL}

@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json(force=True)
    prompt       = data.get("prompt", "")
    image_url    = data.get("image_url")
    duration     = int(data.get("duration", 5))
    aspect_ratio = data.get("aspect_ratio", "9:16")

    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    body = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "duration_seconds": duration,
            "aspect_ratio": aspect_ratio,
            "number_of_videos": 1,
        }
    }
    if image_url:
        # Download and base64-encode the image for image-to-video
        import base64
        img_bytes = req.get(image_url, timeout=15).content
        body["instances"][0]["image"] = {
            "bytesBase64Encoded": base64.b64encode(img_bytes).decode()
        }

    # Start the long-running operation
    r = req.post(f"{BASE}:generateVideo", json=body, headers=headers, timeout=30)
    if not r.ok:
        return jsonify({"error": f"Veo API error {r.status_code}: {r.text[:300]}"}), 500

    op_name = r.json().get("name")
    if not op_name:
        return jsonify({"error": "No operation returned"}), 500

    # Poll until done (max 5 min)
    op_url = f"https://{LOCATION}-aiplatform.googleapis.com/v1/{op_name}"
    for _ in range(60):
        time.sleep(5)
        poll = req.get(op_url, headers={"Authorization": f"Bearer {get_token()}"}, timeout=15)
        result = poll.json()
        if result.get("done"):
            if "error" in result:
                return jsonify({"error": result["error"].get("message", "Veo failed")}), 500
            videos = result.get("response", {}).get("videos", [])
            if videos:
                return jsonify({"status": "ready", "video_url": videos[0].get("uri", "")})
            return jsonify({"error": "No video in response"}), 500

    return jsonify({"error": "Veo timed out after 5 minutes"}), 504

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
