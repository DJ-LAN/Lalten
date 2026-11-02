const BASE = '/api';

// Pick the best available YouTube trailer for buttons / background autoplay.
export function pickTrailer(videos = []) {
  const yt = (videos || []).filter(v => v.site === 'YouTube' && v.key);
  return yt.find(v => v.type === 'Trailer' && v.official)
      || yt.find(v => v.type === 'Trailer')
      || yt.find(v => v.type === 'Teaser')
      || yt[0] || null;
}
export const IMG = 'https://image.tmdb.org/t/p';
export const poster   = (p, s = 'w342')  => p ? `${IMG}/${s}${p}` : null;
export const backdrop = (p, s = 'w1280') => p ? `${IMG}/${s}${p}` : null;

async function get(url) {
  const res = await fetch(BASE + url);
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`API ${res.status}: ${t.slice(0,80)}`); }
  return res.json();
}

// Read the US certification from a TMDB movie detail response.
export function usRating(type, data) {
  if (!data) return null;
  if (type === 'movie') {
    const us = (data.release_dates?.results || []).find(r => r.iso_3166_1 === 'US');
    const entries = us?.release_dates || [];
    const theatrical = entries.find(r => r.release_type === 3 && r.certification);
    return (theatrical || entries.find(r => r.certification))?.certification || null;
  }
  const us = (data.content_ratings?.results || []).find(r => r.iso_3166_1 === 'US');
  return us?.rating || null;
}

export function isBlockedRating(type, rating) {
  if (!rating) return false;
  return type === 'tv'
    ? rating === 'TV-MA'
    : rating === 'R' || rating === 'NC-17';
}

export const api = {
  trending:      (type = 'all') => get(`/trending/${type}`),
  trendingIndia: (type)         => get(`/trending-india/${type}`),
  bollywood:     ()             => get(`/bollywood`),
  southIndian:   ()             => get(`/south-indian`),
  indianSeries:  ()             => get(`/indian-series`),
  netflixIndia:  (p = 1)        => get(`/netflix-india?page=${p}`),
  newOn:         (platform, p = 1) => get(`/new-on/${platform}?page=${p}`),
  kids:          ()             => get(`/kids`),
  movies:        ()             => get(`/movies`),
  series:        ()             => get(`/series`),
  topRated:      (type)         => get(`/top-rated/${type}`),
  nowPlaying:    ()             => get(`/now-playing`),
  popular:       (type)         => get(`/popular/${type}`),
  anime:         ()             => get(`/anime`),
  movie:         (id)           => get(`/movie/${id}`),
  tv:            (id)           => get(`/tv/${id}`),
  season:        (id, s)        => get(`/tv/${id}/season/${s}`),
  externalIds:   (type, id)     => get(`/external-ids/${type}/${id}`),
  rating:        (type, id)     => get(`/rating/${type}/${id}`),
  search:        (q, p = 1)     => get(`/search?q=${encodeURIComponent(q)}&page=${p}`),
  discover: (type, params = {}) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v != null))).toString();
    return get(`/discover/${type}${q ? '?' + q : ''}`);
  },
};

// One descriptor per provider keeps the button label and URL in sync.
// `meta.imdbId` is only needed by VaPlayer, which addresses movies by IMDb ID.
// Order matters: index 0 is the default source.
export const SOURCES = {
  movie: [
    { label: 'Vidrift',  build: (id) => `https://embed.vidrift.net/embed/movie/${id}?autoplay=true` },
    { label: 'RGL Play', build: (id) => `https://rozgarlelo.modiplay.xyz/embed/tmdb/movie?id=${id}` },
    { label: 'Nxsha 1',  build: (id) => `https://nxsha.space/embed/movie/${id}?lang=en&autoplay=true&one_server=true&server=OrV${id}-%5BMulti-Lang%5D` },
    { label: 'Nxsha 2',  build: (id) => `https://nxsha.space/embed/movie/${id}?lang=en&autoplay=true&one_server=true&server=ZetPly-%5BMulti-Lang%5D` },
    { label: 'YTHD',     build: (id) => `https://ythd.org/embed/${id}?autoplay=1` },
    { label: 'VaPlayer', build: (id, meta = {}) => `https://vaplayer.ru/embed/movie/${meta.imdbId || id}` },
    { label: 'Vidy',     build: (id) => `https://www.vidy.st/movie/${id}?color=DC2626&autoplay=true` },
    { label: 'VidNest',  build: (id) => `https://vidnest.pro/movie/${id}?autoplay=true` },
    { label: 'VidFast',  build: (id) => `https://vidfast.vc/movie/${id}?autoplay=true` },
    { label: 'XPass',    build: (id) => `https://play.xpass.top/e/movie/${id}` },
  ],
  tv: [
    { label: 'Vidrift',  build: (id, meta, s, e) => `https://embed.vidrift.net/embed/tv/${id}/${s}/${e}?autoplay=true` },
    { label: 'RGL Play', build: (id, meta, s, e) => `https://rozgarlelo.modiplay.xyz/embed/tmdb/tv?id=${id}&s=${s}&e=${e}` },
    { label: 'Nxsha 1',  build: (id, meta, s, e) => `https://nxsha.space/embed/tv/${id}/${s}/${e}?lang=en&autoplay=true&one_server=true&server=OrV${id}-%5BMulti-Lang%5D` },
    { label: 'Nxsha 2',  build: (id, meta, s, e) => `https://nxsha.space/embed/tv/${id}/${s}/${e}?lang=en&autoplay=true&one_server=true&server=ZetPly-%5BMulti-Lang%5D` },
    { label: 'YTHD',     build: (id, meta, s, e) => `https://ythd.org/embed/${id}/${s}-${e}?autoplay=1` },
    { label: 'VaPlayer', build: (id, meta, s, e) => `https://vaplayer.ru/embed/tv/${id}/${s}/${e}` },
    { label: 'Vidy',     build: (id, meta, s, e) => `https://www.vidy.st/tv/${id}/${s}/${e}?color=DC2626&nextEpisode=true&episodeSelector=true&autoplayNextEpisode=true&autoplay=true` },
    { label: 'VidNest',  build: (id, meta, s, e) => `https://vidnest.pro/tv/${id}/${s}/${e}?autoplay=true` },
    { label: 'VidFast',  build: (id, meta, s, e) => `https://vidfast.vc/tv/${id}/${s}/${e}?autoplay=true` },
    { label: 'XPass',    build: (id, meta, s, e) => `https://play.xpass.top/e/tv/${id}/${s}/${e}` },
  ],
};

// Kept for any older imports; labels for the movie list are the same in both.
export const SOURCE_LABELS = SOURCES.movie.map(s => s.label);

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
