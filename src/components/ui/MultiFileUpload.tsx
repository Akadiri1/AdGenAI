"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type Props = {
  values: string[]; // array of current URLs
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
  accept?: string;
  maxSizeMb?: number;
  previewSize?: "sm" | "md" | "lg";
  maxFiles?: number;
};

export function MultiFileUpload({
  values,
  onChange,
  folder = "uploads",
  label = "Upload file(s)",
  accept = "image/png,image/jpeg,image/webp,image/svg+xml",
  maxSizeMb = 10,
  previewSize = "md",
  maxFiles = 10,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { error } = useToast();

  async function upload(files: FileList | File[]) {
    const validFiles = Array.from(files).filter(f => f.size <= maxSizeMb * 1024 * 1024);
    if (validFiles.length < files.length) {
      error(`Some files were too large (max ${maxSizeMb}MB)`);
    }
    
    if (validFiles.length + values.length > maxFiles) {
      error(`You can only upload up to ${maxFiles} files`);
      return;
    }

    setUploading(true);
    const newUrls = [...values];

    for (const file of validFiles) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        newUrls.push(data.url);
      } catch (err) {
        error((err as Error).message);
      }
    }
    
    onChange(newUrls);
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) upload(e.dataTransfer.files);
  }

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-20 w-20",
    lg: "h-28 w-28",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-4">
        {/* Previews */}
        {values.map((url, i) => (
          <div key={i} className={`flex-shrink-0 ${sizeClasses[previewSize]} overflow-hidden rounded-2xl border-2 border-black/15 bg-bg-secondary/30 relative group`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Uploaded ${i}`} className="h-full w-full object-contain p-2" />
            <button
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-danger text-white group-hover:flex"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Upload Button Area */}
        {values.length < maxFiles && (
          <div
            className={`flex flex-col items-center justify-center ${sizeClasses[previewSize]} flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-black/15 hover:border-black/30 hover:bg-black/5"
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-text-secondary mb-1" />
                <span className="text-[10px] font-semibold text-text-secondary">Add</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hidden Input & Label */}
      <div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="text-[10px] text-text-secondary">
          PNG, JPG, WebP. Max {maxSizeMb}MB. {values.length}/{maxFiles} uploaded.
        </p>
      </div>
    </div>
  );
}
