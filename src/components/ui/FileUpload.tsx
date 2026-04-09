"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type Props = {
  value: string; // current URL
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  accept?: string;
  maxSizeMb?: number;
  previewSize?: "sm" | "md" | "lg";
};

export function FileUpload({
  value,
  onChange,
  folder = "uploads",
  label = "Upload file",
  accept = "image/png,image/jpeg,image/webp,image/svg+xml",
  maxSizeMb = 10,
  previewSize = "md",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { error } = useToast();

  async function upload(file: File) {
    if (file.size > maxSizeMb * 1024 * 1024) {
      error(`File too large (max ${maxSizeMb}MB)`);
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (err) {
      error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-20 w-20",
    lg: "h-28 w-28",
  };

  return (
    <div className="flex items-start gap-4">
      {/* Preview */}
      <div
        className={`flex-shrink-0 ${sizeClasses[previewSize]} overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-black/15 bg-bg-secondary/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {value ? (
          <div className="relative h-full w-full group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Uploaded" className="h-full w-full object-contain p-2" />
            <button
              onClick={() => onChange("")}
              className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-danger text-white group-hover:flex"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-text-secondary">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ImageIcon className="h-6 w-6" />
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-1 space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-9 items-center gap-1.5 rounded-xl border-2 border-black/10 bg-white px-3 text-xs font-semibold text-text-primary hover:bg-bg-secondary disabled:opacity-50 transition-colors"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Uploading..." : label}
        </button>
        <p className="text-[10px] text-text-secondary">
          Or drag & drop. PNG, JPG, WebP, SVG. Max {maxSizeMb}MB.
        </p>
        {/* URL input as fallback */}
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste a URL"
          className="w-full rounded-lg border-2 border-black/10 bg-white px-3 py-1.5 text-xs outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}
