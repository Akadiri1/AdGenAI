"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X, Image as ImageIcon, Plus } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const MAX_IMAGES = 5;

export function ProductImageUploader({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { error } = useToast();

  async function uploadFiles(files: FileList) {
    if (urls.length + files.length > MAX_IMAGES) {
      error(`Max ${MAX_IMAGES} product images. Remove some first.`);
      return;
    }
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "products");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        newUrls.push(data.url);
      }
      onChange([...urls, ...newUrls]);
    } catch (err) {
      error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function removeAt(i: number) {
    onChange(urls.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Product images ({urls.length}/{MAX_IMAGES})
        </span>
        <span className="text-[10px] text-text-secondary">More angles = better ads</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {urls.map((url, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-black/10 bg-bg-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Product ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-danger text-white shadow group-hover:flex"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {urls.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
            }}
            className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-black/15 bg-bg-secondary/30 hover:border-black/25"
            }`}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-text-secondary" />
            ) : urls.length === 0 ? (
              <>
                <ImageIcon className="h-5 w-5 text-text-secondary" />
                <span className="text-[10px] font-semibold text-text-secondary">Drop here</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-text-secondary" />
                <span className="text-[10px] font-semibold text-text-secondary">Add</span>
              </>
            )}
          </button>
        )}
      </div>

      {urls.length === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload product images
        </button>
      )}
    </div>
  );
}
