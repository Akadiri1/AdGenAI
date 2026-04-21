/**
 * Famousli Music Library.
 * Maps genres to royalty-free audio tracks.
 * Using hosted assets for reliability.
 */

export const GENRE_MUSIC_MAP: Record<string, string> = {
  "pop": "https://cdn.famousli.com/assets/music/pop-vibe.mp3",
  "cinematic": "https://cdn.famousli.com/assets/music/cinematic-epic.mp3",
  "corporate": "https://cdn.famousli.com/assets/music/corporate-clean.mp3",
  "hip-hop": "https://cdn.famousli.com/assets/music/hiphop-beat.mp3",
  "lo-fi": "https://cdn.famousli.com/assets/music/lofi-chill.mp3",
  "electronic": "https://cdn.famousli.com/assets/music/electronic-energy.mp3",
  "afrobeats": "https://cdn.famousli.com/assets/music/afrobeats-rhythm.mp3",
  "amapiano": "https://cdn.famousli.com/assets/music/amapiano-groove.mp3",
  "jazz": "https://cdn.famousli.com/assets/music/jazz-smooth.mp3",
  "classical": "https://cdn.famousli.com/assets/music/classical-elegant.mp3",
  "motivational": "https://cdn.famousli.com/assets/music/motivational-inspire.mp3",
  "chill": "https://cdn.famousli.com/assets/music/chill-lounge.mp3",
  "trending-tiktok": "https://cdn.famousli.com/assets/music/tiktok-viral.mp3",
  "trending-reels": "https://cdn.famousli.com/assets/music/reels-upbeat.mp3",
  "rock": "https://cdn.famousli.com/assets/music/rock-energetic.mp3",
  "country": "https://cdn.famousli.com/assets/music/country-acoustic.mp3",
  "funk": "https://cdn.famousli.com/assets/music/funk-groove.mp3",
  "synthwave": "https://cdn.famousli.com/assets/music/synthwave-retro.mp3",
  "ambient": "https://cdn.famousli.com/assets/music/ambient-space.mp3",
  "acoustic": "https://cdn.famousli.com/assets/music/acoustic-guitar.mp3",
  "uplifting": "https://cdn.famousli.com/assets/music/uplifting-happy.mp3",
  "dark-trap": "https://cdn.famousli.com/assets/music/trap-dark.mp3",
  "uk-drill": "https://cdn.famousli.com/assets/music/uk-drill-beat.mp3",
  "rnb": "https://cdn.famousli.com/assets/music/rnb-soul.mp3",
  "indie-folk": "https://cdn.famousli.com/assets/music/indie-folk-warm.mp3",
};

export function getMusicUrlForGenre(genre: string | null): string | undefined {
  if (!genre) return undefined;
  return GENRE_MUSIC_MAP[genre.toLowerCase()];
}
