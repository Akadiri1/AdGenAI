/**
 * Group word-level timestamps from TTS into TikTok-style chunks.
 */

export type WordTimestamp = {
  text: string;
  start: number;
  end: number;
};

export type CaptionChunk = {
  text: string;
  start: number;
  end: number;
  words: WordTimestamp[];
};

/**
 * Groups words into 3-5 word chunks, ensuring they don't exceed 2 seconds
 * or cross major punctuation boundaries.
 */
export function groupWordsIntoChunks(
  words: WordTimestamp[],
  config = { minWords: 3, maxWords: 5, maxDuration: 2 }
): CaptionChunk[] {
  const chunks: CaptionChunk[] = [];
  let currentWords: WordTimestamp[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentWords.push(word);

    const chunkDuration = word.end - currentWords[0].start;
    const hasPunctuation = /[.!?]$/.test(word.text);
    const reachedMaxSize = currentWords.length >= config.maxWords;
    const reachedMaxDuration = chunkDuration >= config.maxDuration;

    // Determine if we should end the chunk here
    const shouldEnd =
      (currentWords.length >= config.minWords && hasPunctuation) ||
      reachedMaxSize ||
      reachedMaxDuration ||
      i === words.length - 1;

    if (shouldEnd) {
      chunks.push({
        text: currentWords.map((w) => w.text).join(" "),
        start: currentWords[0].start,
        end: word.end,
        words: [...currentWords],
      });
      currentWords = [];
    }
  }

  return chunks;
}

export type CaptionStyle = "classic" | "viral" | "cyber";

export const CAPTION_STYLES: Record<CaptionStyle, {
  font: string;
  color: string;
  highlight: string;
  shadow?: string;
  bg?: string;
  outline?: string;
}> = {
  classic: {
    font: "font-black uppercase tracking-tighter italic",
    color: "text-white",
    highlight: "text-white",
    outline: "1px black",
  },
  viral: {
    font: "font-black uppercase tracking-tighter italic",
    color: "text-white",
    highlight: "text-yellow-400",
    bg: "bg-black/90",
    shadow: "0px 0px 12px rgba(0,0,0,0.5)",
  },
  cyber: {
    font: "font-mono font-black uppercase tracking-widest",
    color: "text-green-500",
    highlight: "text-green-300",
    shadow: "0px 0px 10px rgba(34,197,94,0.8)",
  },
};
