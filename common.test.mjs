import test from "node:test";
import assert from "node:assert";
import { topGenres } from "./common.mjs";
import { getListenEvents, getSong } from "./data.mjs";

test("topGenres returns genres sorted by frequency", () => {
  const events = getListenEvents("1");

  const result = topGenres(events);

  // basic sanity check
  assert.ok(Array.isArray(result));

  // rebuild expected frequency map using real data functions
  const counts = new Map();

  for (const e of events) {
    const song = getSong(e.song_id);
    if (song?.genre) {
      counts.set(song.genre, (counts.get(song.genre) || 0) + 1);
    }
  }

  const expected = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre);

  // core non-trivial assertion: correct ordering
  assert.deepStrictEqual(result, expected);
});
