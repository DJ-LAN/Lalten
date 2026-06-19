const BASE = '/api';
export const IMG = 'https://image.tmdb.org/t/p';
export const poster   = (p, s = 'w342')  => p ? `${IMG}/${s}${p}` : null;
export const backdrop = (p, s = 'w1280') => p ? `${IMG}/${s}${p}` : null;

async function get(url) {
  const res = await fetch(BASE + url);
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`API ${res.status}: ${t.slice(0,80)}`); }
  return res.json();
}

export const api = {
  trending:      (type = 'all') => get(`/trending/${type}`),
  trendingIndia: (type)         => get(`/trending-india/${type}`),
  bollywood:     ()             => get(`/bollywood`),
  southIndian:   ()             => get(`/south-indian`),
  indianSeries:  ()             => get(`/indian-series`),
  topRated:      (type)         => get(`/top-rated/${type}`),
  nowPlaying:    ()             => get(`/now-playing`),
  popular:       (type)         => get(`/popular/${type}`),
  anime:         ()             => get(`/anime`),
  movie:         (id)           => get(`/movie/${id}`),
  tv:            (id)           => get(`/tv/${id}`),
  season:        (id, s)        => get(`/tv/${id}/season/${s}`),
  search:        (q, p = 1)     => get(`/search?q=${encodeURIComponent(q)}&page=${p}`),
  discover: (type, params = {}) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v != null))).toString();
    return get(`/discover/${type}${q ? '?' + q : ''}`);
  },
};

export const SOURCES = {
  movie: [
    id => `https://vidfast.pro/movie/${id}`,
    id => `https://vidlink.pro/movie/${id}`,
    id => `https://player.videasy.net/movie/${id}`,
    id => `https://player.autoembed.cc/embed/movie/${id}`,
    id => `https://vidsrc.cc/v2/embed/movie/${id}`,
    id => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    id => `https://vidsrc.me/embed/movie?tmdb=${id}`,
    id => `https://www.2embed.cc/embed/${id}`,
  ],
  tv: [
    (id,s,e) => `https://vidfast.pro/tv/${id}/${s}/${e}`,
    (id,s,e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
    (id,s,e) => `https://player.videasy.net/tv/${id}/${s}/${e}`,
    (id,s,e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
    (id,s,e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
    (id,s,e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
    (id,s,e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
    (id,s,e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  ],
};
export const SOURCE_LABELS = ['VidFast','VidLink','Videasy','AutoEmbed','VidSrc CC','MultiEmbed','VidSrc ME','2Embed'];

// ── Lighten Up — My Shows favourites ─────────────────────
const FAV_KEY = 'lantern_myshows';

export function getFavourites() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; }
}

export function isFavourite(id) {
  return getFavourites().some(f => f.id === id);
}

export function toggleFavourite(item) {
  // item: { id, type, title, posterPath, year }
  let list = getFavourites();
  const exists = list.some(f => f.id === item.id);
  if (exists) {
    list = list.filter(f => f.id !== item.id);
  } else {
    list.unshift({ ...item, addedAt: Date.now() });
  }
  localStorage.setItem(FAV_KEY, JSON.stringify(list));
  return !exists; // returns true if now favourited
}
