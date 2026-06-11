import { getSong } from "./data.mjs";

export function topGenres(events) {
  const map = new Map();

  for (const e of events) {
    const song = getSong(e.song_id);

    if (song?.genre) {
      map.set(song.genre, (map.get(song.genre) || 0) + 1);
    }
  }

  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([genre]) => genre);
}
