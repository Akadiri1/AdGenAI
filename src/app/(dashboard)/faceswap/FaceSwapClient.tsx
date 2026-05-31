"use client";

import { useState } from "react";
import { Upload, Wand2, Image as ImageIcon, Loader2, FileVideo, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function FaceSwapClient({ initialCredits }: { initialCredits: number }) {
  const [credits, setCredits] = useState(initialCredits);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const [faceSource, setFaceSource] = useState<"upload" | "text">("upload");
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [faceUrl, setFaceUrl] = useState<string>("");
  const [isUploadingFace, setIsUploadingFace] = useState(false);

  const [textPrompt, setTextPrompt] = useState("");
  const [isGeneratingFace, setIsGeneratingFace] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const { error: toastError, success: toastSuccess } = useToast();

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) {
      toastError("Video is too large (max 500MB)");
      return;
    }
    setVideoFile(file);
    setIsUploadingVideo(true);
    try {
      let uploadUrlToUse = "";
      let finalPublicUrl = "";

      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, folder: "videos" })
      });
      
      const presignData = await presignRes.json();
      
      if (presignRes.status === 503) {
        // Fallback for local development if R2 is not in .env
        console.warn("Storage not configured for presigned URLs. Falling back to direct upload (Local Dev Mode).");
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "videos");
        const fallbackRes = await fetch("/api/upload", { method: "POST", body: fd });
        const fallbackData = await fallbackRes.json();
        if (!fallbackRes.ok) throw new Error(fallbackData.error || "Fallback upload failed");
        finalPublicUrl = fallbackData.url;
      } else {
        if (!presignRes.ok) throw new Error(presignData.error || "Failed to initialize upload");

        const uploadRes = await fetch(presignData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file
        });
        
        if (!uploadRes.ok) {
          const errorText = await uploadRes.text();
          console.error("S3 Upload Error:", errorText);
          throw new Error("Cloud storage rejected the file. Check if Cloudflare CORS is configured properly.");
        }
        finalPublicUrl = presignData.publicUrl;
      }

      setVideoUrl(finalPublicUrl);
      toastSuccess("Video uploaded successfully");
    } catch (err: any) {
      console.error(err);
      if (err.name === "TypeError" && err.message.includes("Failed to fetch")) {
        toastError("Upload blocked by browser. You MUST configure Cloudflare CORS settings.");
      } else {
        toastError(err.message || "An unexpected error occurred during upload.");
      }
      setVideoFile(null);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleFaceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFaceFile(file);
    setIsUploadingFace(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "faces");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload face image");
      setFaceUrl(data.url);
      toastSuccess("Face image uploaded successfully");
    } catch (err: any) {
      toastError(err.message);
      setFaceFile(null);
    } finally {
      setIsUploadingFace(false);
    }
  };

  const handleGenerateFace = async () => {
    if (!textPrompt.trim()) {
      toastError("Please enter a prompt to generate a face");
      return;
    }
    setIsGeneratingFace(true);
    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate face");
      setFaceUrl(data.url);
      toastSuccess("Face generated successfully");
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsGeneratingFace(false);
    }
  };

  const handleStartSwap = async () => {
    if (!videoUrl) {
      toastError("Please upload a video first");
      return;
    }
    if (!faceUrl) {
      toastError("Please provide a face image (upload or generate)");
      return;
    }
    if (credits < 3) {
      toastError("Not enough credits. Face Swap requires 3 credits.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/generate/faceswap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetVideoUrl: videoUrl, sourceImageUrl: faceUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start face swap");
      
      setJobId(data.jobId);
      setCredits(prev => prev - 3);
      toastSuccess("Face Swap job started! This usually takes 1-2 minutes.");
    } catch (err: any) {
      toastError(err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* LEFT COLUMN: Inputs */}
      <div className="space-y-6">
        
        {/* Step 1: Video */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <h2 className="text-xl font-bold font-heading text-text-primary mb-1">1. Target Video</h2>
          <p className="text-sm text-text-secondary mb-2">Upload the video you want to edit (Max 500MB).</p>
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 mb-4">
            <p className="text-xs text-text-primary font-medium flex items-center gap-2">
              <span className="text-accent">💡</span> <strong>Tip:</strong> For best results, use videos with only one clearly visible person speaking to the camera.
            </p>
          </div>
          
          {!videoUrl ? (
            <div className="relative border-2 border-dashed border-black/10 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors bg-bg-secondary/30">
              <input 
                type="file" 
                accept="video/mp4,video/webm,video/quicktime" 
                onChange={handleVideoUpload}
                disabled={isUploadingVideo}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
              />
              <div className="flex flex-col items-center">
                {isUploadingVideo ? (
                  <>
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                    <p className="text-sm font-bold text-text-primary">Uploading Video...</p>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      <FileVideo className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-bold text-text-primary">Click or drag video here</p>
                    <p className="text-xs text-text-secondary mt-1">MP4, WebM (max 500MB)</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-black/10 bg-black aspect-video flex items-center justify-center group">
              <video src={videoUrl} controls className="w-full h-full object-contain" />
              <button 
                onClick={() => { setVideoUrl(""); setVideoFile(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white text-xs px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Change Video
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Face */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <h2 className="text-xl font-bold font-heading text-text-primary mb-1">2. Source Face</h2>
          <p className="text-sm text-text-secondary mb-4">Upload a clear photo of a face, or let AI generate one.</p>

          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setFaceSource("upload")}
              className={`flex-1 py-2 text-sm font-bold rounded-xl border-2 transition-colors ${faceSource === "upload" ? "border-primary bg-primary/5 text-primary" : "border-black/5 text-text-secondary hover:border-black/10"}`}
            >
              Upload Photo
            </button>
            <button 
              onClick={() => setFaceSource("text")}
              className={`flex-1 py-2 text-sm font-bold rounded-xl border-2 transition-colors ${faceSource === "text" ? "border-primary bg-primary/5 text-primary" : "border-black/5 text-text-secondary hover:border-black/10"}`}
            >
              Generate AI Face
            </button>
          </div>

          {!faceUrl ? (
            faceSource === "upload" ? (
              <div className="relative border-2 border-dashed border-black/10 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors bg-bg-secondary/30">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFaceUpload}
                  disabled={isUploadingFace}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                />
                <div className="flex flex-col items-center">
                  {isUploadingFace ? (
                    <>
                      <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                      <p className="text-sm font-bold text-text-primary">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                        <Upload className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-sm font-bold text-text-primary">Upload Face Photo</p>
                      <p className="text-xs text-text-secondary mt-1">Clear, front-facing portrait</p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  placeholder="E.g. A young Indian female with a warm smile and dark hair..."
                  rows={3}
                  className="w-full resize-none rounded-xl border-2 border-black/10 p-3 text-sm focus:border-primary outline-none"
                />
                <button
                  onClick={handleGenerateFace}
                  disabled={isGeneratingFace || !textPrompt.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-text-primary text-white py-3 rounded-xl font-bold disabled:opacity-50 transition-opacity"
                >
                  {isGeneratingFace ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  {isGeneratingFace ? "Generating..." : "Generate AI Face"}
                </button>
              </div>
            )
          ) : (
            <div className="flex items-center gap-4 p-4 border border-black/10 rounded-2xl bg-bg-secondary">
              <img src={faceUrl} alt="Face" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
              <div className="flex-1">
                <p className="text-sm font-bold text-text-primary flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Face Ready
                </p>
              </div>
              <button 
                onClick={() => setFaceUrl("")}
                className="text-xs font-bold text-danger hover:underline px-2"
              >
                Change
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Output */}
      <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-heading text-text-primary">Final Output</h2>
          <div className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
            {credits} Credits Available
          </div>
        </div>

        <div className="flex-1 min-h-[300px] border-2 border-dashed border-black/5 rounded-2xl flex flex-col items-center justify-center bg-bg-secondary/30 relative overflow-hidden">
          {jobId ? (
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 relative">
                <Wand2 className="w-8 h-8 text-primary animate-pulse" />
                <div className="absolute inset-0 border-4 border-primary rounded-full animate-spin border-t-transparent" style={{ animationDuration: '3s' }} />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Enhancing Face & Swapping...</h3>
              <p className="text-sm text-text-secondary max-w-[250px] mx-auto">
                Step 1: Upscaling face to 4K<br />
                Step 2: Merging with video
              </p>
              <p className="text-xs text-text-secondary mt-4">Job ID: {jobId}</p>
            </div>
          ) : (
            <div className="text-center p-6 opacity-50">
              <Wand2 className="h-12 w-12 text-text-secondary mx-auto mb-3" />
              <p className="text-sm font-bold text-text-primary">Ready to swap</p>
              <p className="text-xs text-text-secondary mt-1">Provide a video and face, then click Generate.</p>
            </div>
          )}
        </div>

        <button
          onClick={handleStartSwap}
          disabled={!videoUrl || !faceUrl || isProcessing}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none hover:bg-primary-hover transition-all"
        >
          {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
          {isProcessing ? "Processing..." : "Generate Face Swap (3 Credits)"}
        </button>
      </div>
    </div>
  );
}
