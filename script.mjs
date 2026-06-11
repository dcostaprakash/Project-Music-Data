// This is a placeholder file which shows how you can access functions defined in other files.
// It can be loaded into index.html.
// You can delete the contents of the file once you have understood how it works.
// Note that when running locally, in order to open a web page which uses modules, you must serve the directory over HTTP e.g. with https://www.npmjs.com/package/http-server
// You can't open the index.html file using a file:// URL.

import { getUserIDs, getListenEvents, getSong } from "./data.mjs";

function getDuration(e) {
  return safeSong(e.song_id).duration_seconds ?? 0;
}

function safeSong(song_id) {
  return getSong(song_id) || { title: song_id, artist: "Unknown", genres: [] };
}

function isFridayNight(date) {
  const day = date.getDay();
  const hour = date.getHours();

  if (day === 5) return hour >= 17;
  if (day === 6) return hour < 4;
  return false;
}

function songTitle(id) {
  const song = safeSong(id);
  return `${song.artist} - ${song.title}`;
}

/* ---------------- stats helpers ---------------- */

function mostByCount(events, keyFn) {
  const map = new Map();

  for (const e of events) {
    const key = keyFn(e);
    map.set(key, (map.get(key) || 0) + 1);
  }

  return [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function mostByTime(events, keyFn) {
  const map = new Map();

  for (const e of events) {
    const key = keyFn(e);
    map.set(key, (map.get(key) || 0) + getDuration(e));
  }

  return [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function longestStreak(events) {
  let best = { song: null, count: 0 };
  let current = null;
  let count = 0;

  for (const e of events) {
    if (e.song_id === current) {
      count++;
    } else {
      current = e.song_id;
      count = 1;
    }

    if (count > best.count) {
      best = { song: current, count };
    }
  }

  return best;
}

function everyDaySongs(events) {
  const days = new Set();
  const songDays = new Map();

  for (const e of events) {
    const day = new Date(e.timestamp).toDateString();
    days.add(day);

    if (!songDays.has(e.song_id)) songDays.set(e.song_id, new Set());
    songDays.get(e.song_id).add(day);
  }

  const result = [];

  for (const [song, set] of songDays.entries()) {
    let ok = true;
    for (const d of days) {
      if (!set.has(d)) {
        ok = false;
        break;
      }
    }
    if (ok) result.push(song);
  }

  return result;
}

function topGenres(events) {
  const map = new Map();

  for (const e of events) {
    const song = getSong(e.song_id);

    if (song?.genre) {
      map.set(song.genre, (map.get(song.genre) || 0) + 1);
    }
  }

  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([genre]) => genre);
}

/* ---------------- render ---------------- */

function render(userID) {
  const container = document.getElementById("results");

  if (!userID) {
    container.innerHTML = "";
    return;
  }

  const events = getListenEvents(userID);

  if (!events.length) {
    container.innerHTML = `
      <section>
        <p>This user didn’t listen to any songs.</p>
      </section>
    `;
    return;
  }

  const fridayEvents = events.filter((e) =>
    isFridayNight(new Date(e.timestamp)),
  );

  const mostSong = mostByCount(events, (e) => e.song_id);
  const mostArtist = mostByCount(events, (e) => safeSong(e.song_id).artist);

  const mostSongTime = mostByTime(events, (e) => e.song_id);
  const mostArtistTime = mostByTime(events, (e) => safeSong(e.song_id).artist);

  const streak = longestStreak(events);
  const daily = everyDaySongs(events);
  const genres = topGenres(events).slice(0, 3);

  container.innerHTML = `
    <h2>Results</h2>

    <section>
      <h3>Most listened song (count)</h3>
      <p>${songTitle(mostSong)}</p>
    </section>

    <section>
      <h3>Most listened song (time)</h3>
      <p>${songTitle(mostSongTime)}</p>
    </section>

    <section>
      <h3>Most listened artist (count)</h3>
      <p>${mostArtist}</p>
    </section>

    <section>
      <h3>Most listened artist (time)</h3>
      <p>${mostArtistTime}</p>
    </section>

    ${
      fridayEvents.length
        ? `
      <section>
        <h3>Friday night song (count)</h3>
        <p>${songTitle(mostByCount(fridayEvents, (e) => e.song_id))}</p>
      </section>
    `
        : ""
    }

    ${
      fridayEvents.length
        ? `
      <section>
        <h3>Friday night song (time)</h3>
        <p>${songTitle(mostByTime(fridayEvents, (e) => e.song_id))}</p>
      </section>
    `
        : ""
    }

    <section>
      <h3>Longest streak song</h3>
      <p>${songTitle(streak.song)} (length:${streak.count})</p>
    </section>

    ${
      daily.length
        ? `
      <section>
        <h3>Every day songs</h3>
        <ul>
          ${daily.map((id) => `<li>${songTitle(id)}</li>`).join("")}
        </ul>
      </section>
    `
        : ""
    }

    <section>
      <h3>${genres.length >= 3 ? "Top three genres" : "Top genres"}</h3>
      <ol>
        ${genres.map((g) => `<li>${g}</li>`).join("")}
      </ol>
    </section>
  `;
}

/* ---------------- init ---------------- */

function init() {
  const select = document.getElementById("userSelect");

  for (const id of getUserIDs()) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = id;
    select.appendChild(opt);
  }

  select.addEventListener("change", (e) => {
    render(e.target.value);
  });
}

init();
