"use client";

import { useState, useRef, useEffect } from "react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Scissors, Type, Music, Loader2,
  Check, ChevronDown, ChevronUp, Play, Pause,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type Scene = {
  id: string;
  sceneNumber: number;
  spokenLine: string | null;
  finalClipUrl: string | null;
  videoClipUrl: string | null;
  durationSeconds: number;
};

type Props = { adId: string; scenes: Scene[] };

// ── Sortable scene row ──────────────────────────────────────────────────────
function SortableScene({ scene, index }: { scene: Scene; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: scene.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const clip = scene.finalClipUrl ?? scene.videoClipUrl;
  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-3">
      <button {...attributes} {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-text-secondary hover:text-primary">
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-shrink-0 w-12 h-16 rounded-lg overflow-hidden bg-bg-secondary">
        {clip && <video src={clip} className="h-full w-full object-cover" muted />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-text-primary">Scene {index + 1}</div>
        <div className="text-[10px] text-text-secondary line-clamp-2 mt-0.5">
          {scene.spokenLine ?? "(no spoken line)"}
        </div>
      </div>
      <div className="text-[10px] text-text-secondary flex-shrink-0">{scene.durationSeconds}s</div>
    </div>
  );
}

// ── Captions section ────────────────────────────────────────────────────────
function CaptionsSection({ clips }: { clips: string[] }) {
  const [text, setText] = useState("");
  const [position, setPosition] = useState<"top" | "center" | "bottom">("bottom");
  const [color, setColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#000000");
  const [processing, setProcessing] = useState(false);
  const { error, success } = useToast();

  async function burnCaptions() {
    if (!text.trim() || clips.length === 0) return;
    setProcessing(true);
    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL("https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js", "text/javascript"),
        wasmURL: await toBlobURL("https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm", "application/wasm"),
      });

      const yPos = position === "top" ? "h/8" : position === "center" ? "(h-text_h)/2" : "h-h/8-text_h";
      const escaped = text.replace(/'/g, "\\'").replace(/:/g, "\\:");
      const boxColor = bgColor + "aa"; // semi-transparent

      for (let i = 0; i < clips.length; i++) {
        const data = await fetchFile(clips[i]);
        await ffmpeg.writeFile(`in${i}.mp4`, data);
        await ffmpeg.exec([
          "-i", `in${i}.mp4`,
          "-vf", `drawtext=text='${escaped}':fontcolor=${color}:fontsize=24:x=(w-text_w)/2:y=${yPos}:box=1:boxcolor=${boxColor}:boxborderw=8`,
          "-c:a", "copy", `out${i}.mp4`,
        ]);
        const out = await ffmpeg.readFile(`out${i}.mp4`) as Uint8Array;
        const plain = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
        const blob = new Blob([plain], { type: "video/mp4" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `scene${i + 1}-captioned.mp4`;
        a.click();
        URL.revokeObjectURL(url);
      }
      success("Captioned clips downloaded");
    } catch (err) {
      error(`Caption failed: ${(err as Error).message.slice(0, 100)}`);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-secondary">Add text that appears in every scene clip.</p>
      <input value={text} onChange={e => setText(e.target.value)}
        placeholder='e.g. "Link in bio 👆" or your brand name'
        className="w-full rounded-xl border-2 border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary" />
      <div className="flex gap-3 flex-wrap">
        <div>
          <label className="block text-[10px] font-bold text-text-secondary mb-1">Position</label>
          <div className="flex gap-1">
            {(["top", "center", "bottom"] as const).map(p => (
              <button key={p} onClick={() => setPosition(p)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors ${position === p ? "bg-primary text-white" : "bg-bg-secondary text-text-secondary"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-text-secondary mb-1">Text color</label>
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="h-8 w-12 rounded-lg border border-black/10 cursor-pointer" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-text-secondary mb-1">Box color</label>
          <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
            className="h-8 w-12 rounded-lg border border-black/10 cursor-pointer" />
        </div>
      </div>
      <button onClick={burnCaptions} disabled={processing || !text.trim() || clips.length === 0}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50">
        {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding captions…</> : <><Type className="h-4 w-4" /> Burn captions into clips</>}
      </button>
    </div>
  );
}

// ── Music section ────────────────────────────────────────────────────────────
const MUSIC_PRESETS = [
  { name: "Afrobeats energy", url: "https://www.bensound.com/bensound-music/bensound-ukulele.mp3" },
  { name: "Warm acoustic", url: "https://www.bensound.com/bensound-music/bensound-sunny.mp3" },
  { name: "Confident hype", url: "https://www.bensound.com/bensound-music/bensound-epic.mp3" },
  { name: "Calm & soft", url: "https://www.bensound.com/bensound-music/bensound-slowmotion.mp3" },
];

function MusicSection({ clips }: { clips: string[] }) {
  const [musicUrl, setMusicUrl] = useState("");
  const [volume, setVolume] = useState(0.3);
  const [processing, setProcessing] = useState(false);
  const { error, success } = useToast();

  async function addMusic() {
    if (!musicUrl || clips.length === 0) return;
    setProcessing(true);
    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL("https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js", "text/javascript"),
        wasmURL: await toBlobURL("https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm", "application/wasm"),
      });

      const musicData = await fetchFile(musicUrl);
      await ffmpeg.writeFile("music.mp3", musicData);

      for (let i = 0; i < clips.length; i++) {
        const data = await fetchFile(clips[i]);
        await ffmpeg.writeFile(`in${i}.mp4`, data);
        await ffmpeg.exec([
          "-i", `in${i}.mp4`, "-i", "music.mp3",
          "-filter_complex", `[1:a]volume=${volume}[music];[0:a][music]amix=inputs=2:duration=first[aout]`,
          "-map", "0:v", "-map", "[aout]", "-c:v", "copy", `out${i}.mp4`,
        ]);
        const out = await ffmpeg.readFile(`out${i}.mp4`) as Uint8Array;
        const plain = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
        const blob = new Blob([plain], { type: "video/mp4" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `scene${i + 1}-with-music.mp4`;
        a.click();
        URL.revokeObjectURL(url);
      }
      success("Clips with music downloaded");
    } catch (err) {
      error(`Music failed: ${(err as Error).message.slice(0, 100)}`);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-secondary">Add background music to all clips.</p>
      <div>
        <div className="text-[10px] font-bold text-text-secondary mb-1.5">Quick picks</div>
        <div className="flex flex-wrap gap-1.5">
          {MUSIC_PRESETS.map(p => (
            <button key={p.name} onClick={() => setMusicUrl(p.url)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${musicUrl === p.url ? "bg-primary text-white" : "bg-bg-secondary text-text-secondary hover:bg-black/10"}`}>
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-text-secondary mb-1">
          Music volume — {Math.round(volume * 100)}%
        </label>
        <input type="range" min={0.05} max={0.8} step={0.05} value={volume}
          onChange={e => setVolume(Number(e.target.value))}
          className="w-full accent-primary" />
        <div className="flex justify-between text-[9px] text-text-secondary mt-0.5">
          <span>Subtle background</span><span>Loud</span>
        </div>
      </div>
      <button onClick={addMusic} disabled={processing || !musicUrl || clips.length === 0}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50">
        {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding music…</> : <><Music className="h-4 w-4" /> Mix music into clips</>}
      </button>
    </div>
  );
}

// ── Trim section ─────────────────────────────────────────────────────────────
function TrimSection({ clips }: { clips: { url: string; scene: number }[] }) {
  const [selected, setSelected] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [processing, setProcessing] = useState(false);
  const { error, success } = useToast();
  const clip = clips[selected];

  async function applyTrim() {
    if (!clip) return;
    setProcessing(true);
    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL("https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js", "text/javascript"),
        wasmURL: await toBlobURL("https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm", "application/wasm"),
      });
      const data = await fetchFile(clip.url);
      await ffmpeg.writeFile("input.mp4", data);
      await ffmpeg.exec(["-i", "input.mp4", "-t", String(trimEnd), "-c", "copy", "out.mp4"]);
      const out = await ffmpeg.readFile("out.mp4") as Uint8Array;
      const plain = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
      const blob = new Blob([plain], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scene${clip.scene}-trimmed.mp4`;
      a.click();
      URL.revokeObjectURL(url);
      success("Trimmed clip downloaded");
    } catch (err) {
      error(`Trim failed: ${(err as Error).message.slice(0, 100)}`);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-secondary">Cut a clip shorter so it matches the spoken audio.</p>
      <div className="flex gap-1.5">
        {clips.map((c, i) => (
          <button key={c.scene} onClick={() => setSelected(i)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${selected === i ? "bg-primary text-white" : "bg-bg-secondary text-text-secondary"}`}>
            Scene {c.scene}
          </button>
        ))}
      </div>
      {clip && (
        <>
          <video src={clip.url} controls className="w-full rounded-xl max-h-[200px]"
            onLoadedMetadata={e => {
              const d = (e.target as HTMLVideoElement).duration;
              setDuration(d);
              setTrimEnd(d);
            }} />
          <div>
            <label className="block text-[10px] font-bold text-text-secondary mb-1">
              Trim to — {trimEnd.toFixed(1)}s (original: {duration.toFixed(1)}s)
            </label>
            <input type="range" min={0.5} max={duration || 10} step={0.1} value={trimEnd}
              onChange={e => setTrimEnd(Number(e.target.value))}
              className="w-full accent-primary" />
          </div>
          <button onClick={applyTrim} disabled={processing || trimEnd >= duration}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50">
            {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Trimming…</> : <><Scissors className="h-4 w-4" /> Download trimmed clip</>}
          </button>
        </>
      )}
    </div>
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────
export function VideoEditorPanel({ adId, scenes: initialScenes }: Props) {
  const [scenes, setScenes] = useState(initialScenes);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const readyScenes = scenes.filter(s => s.finalClipUrl || s.videoClipUrl);
  const clips = readyScenes.map(s => ({
    url: (s.finalClipUrl ?? s.videoClipUrl)!,
    scene: s.sceneNumber,
  }));
  const clipUrls = clips.map(c => c.url);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = scenes.findIndex(s => s.id === active.id);
    const newIndex = scenes.findIndex(s => s.id === over.id);
    const reordered = arrayMove(scenes, oldIndex, newIndex);
    setScenes(reordered);
    setSaving(true);
    try {
      const res = await fetch(`/api/ads/${adId}/reorder-scenes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: reordered.map(s => s.id) }),
      });
      if (!res.ok) throw new Error("Reorder failed");
      success("Scene order saved");
    } catch (err) {
      error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (readyScenes.length === 0) return null;

  const sections = [
    { id: "reorder", icon: GripVertical, label: "Reorder scenes", hint: "Drag to change the order" },
    { id: "trim",    icon: Scissors,    label: "Trim clips",      hint: "Cut clips to match audio" },
    { id: "caption", icon: Type,        label: "Add captions",    hint: "Burn text into clips" },
    { id: "music",   icon: Music,       label: "Background music", hint: "Add music track" },
  ];

  return (
    <div className="mb-6 rounded-3xl border border-black/5 bg-white p-5 shadow-sm space-y-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-text-primary">Edit your clips</h2>
          <p className="text-xs text-text-secondary">All edits export as new files — originals stay safe</p>
        </div>
        {saving && <div className="flex items-center gap-1 text-xs text-text-secondary"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</div>}
      </div>

      {sections.map(({ id, icon: Icon, label, hint }) => (
        <div key={id} className="rounded-2xl border border-black/5 overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenSection(openSection === id ? null : id)}
            className="flex w-full items-center justify-between px-4 py-3 hover:bg-bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-text-primary">{label}</div>
                <div className="text-[10px] text-text-secondary">{hint}</div>
              </div>
            </div>
            {openSection === id
              ? <ChevronUp className="h-4 w-4 text-text-secondary" />
              : <ChevronDown className="h-4 w-4 text-text-secondary" />}
          </button>

          {openSection === id && (
            <div className="px-4 pb-4 border-t border-black/5 pt-3">
              {id === "reorder" && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {scenes.map((scene, i) => (
                        <SortableScene key={scene.id} scene={scene} index={i} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
              {id === "trim"    && <TrimSection clips={clips} />}
              {id === "caption" && <CaptionsSection clips={clipUrls} />}
              {id === "music"   && <MusicSection clips={clipUrls} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
