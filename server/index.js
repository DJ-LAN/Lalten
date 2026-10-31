const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
try { require('dotenv').config(); } catch {}

const app = express();
const PORT = process.env.PORT || 3000;
let TMDB_KEY = process.env.TMDB_API_KEY || 'cb5b31152feea19767fa37927f202c78';
const TMDB_BASE = 'https://api.themoviedb.org/3';

app.use(cors());
app.use(express.json());

async function tmdb(endpoint, params = {}) {
  const key = global._LANTERN_KEY || TMDB_KEY;
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set('api_key', key);
  url.searchParams.set('language', 'en-US');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

// ── Latest Indian series on Netflix ──────────────────────
// Three overlapping windows: Indian-made Netflix originals, Hindi Netflix
// originals, and Indian series available on Netflix India. Merged + deduped
// so the row feels like the Netflix home screen (Hindi + Tamil + Telugu...).
let _netflixCache = { at: 0, results: [] };
const NETFLIX_TTL = 30 * 60 * 1000;

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

async function latestNetflixIndia() {
  if (Date.now() - _netflixCache.at < NETFLIX_TTL && _netflixCache.results.length)
    return _netflixCache.results;

  const since = isoDaysAgo(730);            // rolling 2-year window
  const until = new Date().toISOString().slice(0, 10);
  const common = {
    sort_by: 'first_air_date.desc',
    'first_air_date.gte': since,
    'first_air_date.lte': until,
  };
  const queries = [
    { ...common, with_networks: '213', with_origin_country: 'IN' },
    { ...common, with_networks: '213', with_original_language: 'hi' },
    { ...common, with_watch_providers: '8', watch_region: 'IN', with_watch_monetization_types: 'flatrate', with_origin_country: 'IN' },
  ];

  const batches = await Promise.all(
    queries.map(q => Promise.all([1, 2].map(page => tmdb('/discover/tv', { ...q, page }))))
  );

  const seen = new Set();
  const results = [];
  for (const batch of batches) {
    for (const data of batch) {
      for (const item of data.results || []) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        results.push(item);
      }
    }
  }
  results.sort((a, b) => (b.first_air_date || '').localeCompare(a.first_air_date || ''));

  // If TMDB has nothing in the window, fall back to popular Indian Netflix titles
  // rather than leaving the row empty.
  if (!results.length) {
    const fallback = await tmdb('/discover/tv', {
      with_networks: '213',
      with_origin_country: 'IN',
      sort_by: 'popularity.desc',
    });
    results.push(...(fallback.results || []));
  }

  _netflixCache = { at: Date.now(), results };
  return results;
}

// ── Latest series across the OTTs (India availability) ───
// Provider IDs are TMDB's India watch-provider IDs. "Latest" = newest
// first-air-date available on that platform, not "most popular of all time".
const OTT_PLATFORMS = {
  netflix: { label: 'Netflix',     providers: [8]    },
  prime:   { label: 'Prime Video', providers: [119]  },
  hotstar: { label: 'JioHotstar',  providers: [2336] },
  apple:   { label: 'Apple TV+',   providers: [350]  },
  zee5:    { label: 'Zee5',        providers: [232]  },
  sonyliv: { label: 'SonyLIV',     providers: [237]  },
  mx:      { label: 'MX Player',   providers: [515]  },
  aha:     { label: 'aha',         providers: [532]  },
};

const _ottCache = new Map();

async function latestOnPlatform(platform, page = 1) {
  const cfg = OTT_PLATFORMS[platform];
  if (!cfg) return null;

  const cacheKey = `${platform}:${page}`;
  const hit = _ottCache.get(cacheKey);
  if (hit && Date.now() - hit.at < NETFLIX_TTL) return hit.data;

  const data = await tmdb('/discover/tv', {
    with_watch_providers: cfg.providers.join('|'),
    watch_region: 'IN',
    with_watch_monetization_types: 'flatrate',
    sort_by: 'first_air_date.desc',
    'first_air_date.gte': isoDaysAgo(730),   // rolling 2-year window
    'first_air_date.lte': new Date().toISOString().slice(0, 10),
    page,
  });

  const payload = { ...data, results: (data.results || []).filter(i => i.poster_path) };
  _ottCache.set(cacheKey, { at: Date.now(), data: payload });
  return payload;
}

// ── Curated Kids shelves ─────────────────────────────────
// G / PG movies + kids TV only. No horror, thriller, crime or war genres.
let _kidsCache = { at: 0, data: null };
const KID_SAFE = {
  include_adult: false,
  sort_by: 'popularity.desc',
  without_genres: '27,53,80,10752',
  'vote_count.gte': 20,
};
const KIDS_SECTIONS = [
  { key: 'cn-classics',   title: 'Cartoon Network Classics', type: 'tv', params: { with_networks: '56', 'first_air_date.lte': '2012-12-31', with_genres: '16', sort_by: 'vote_count.desc' } },
  { key: 'nick-classics', title: 'Nickelodeon Classics',     type: 'tv', params: { with_networks: '13', 'first_air_date.lte': '2012-12-31', sort_by: 'vote_count.desc' } },
  { key: 'cartoons',  title: 'Morning Cartoons',      type: 'movie', params: { with_genres: '16', certification_country: 'US', certification: 'G|PG' } },
  { key: 'family',    title: 'Family Movie Night',    type: 'movie', params: { with_genres: '10751', without_genres: '16,27,53,80,10752', certification_country: 'US', certification: 'G|PG', 'vote_count.gte': 50 } },
  { key: 'rangers',   title: 'Power Rangers',         type: 'tv',    path: '/search/tv', params: { query: 'Power Rangers' }, exclude: /sentai/i },
  { key: 'ultraman',  title: 'Ultraman & Kaiju',      type: 'tv',    params: { with_keywords: '281450|161791', sort_by: 'popularity.desc' }, exclude: /power rangers|sentai/i },
  { key: 'little',    title: 'Little Ones',           type: 'tv',    params: { with_genres: '10762', with_networks: '281|35' } },
  { key: 'toons',     title: 'Animated Adventures',   type: 'tv',    params: { with_genres: '16,10762' } },
  { key: 'magic',     title: 'Magic & Make-Believe',  type: 'movie', params: { with_genres: '10751,14', certification_country: 'US', certification: 'G|PG' } },
  { key: 'disney',    title: 'Disney Classics',       type: 'movie', params: { with_companies: '2', with_genres: '16,10751' } },
  { key: 'pixar',     title: 'Pixar Picks',           type: 'movie', params: { with_companies: '3' } },
  { key: 'classics',  title: 'All-Time Kid Classics', type: 'movie', params: { with_genres: '16,10751', certification_country: 'US', certification: 'G|PG', sort_by: 'vote_average.desc', 'vote_count.gte': 500 } },
];

// ── R-rated warning gate ─────────────────────────────────
// The filter only warns on the detail/player pages — it never hides titles
// from rows, so browsing stays exactly the same with the setting on or off.
function usRating(type, data) {
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

// Generic shelf builder shared by Kids / Movies / Series.
// A shelf is either a /discover query (default) or a direct TMDB `path`.
async function buildShelves(cache, defs, base = {}) {
  if (Date.now() - cache.at < NETFLIX_TTL && cache.data) return cache.data;

  const sections = await Promise.all(defs.map(async s => {
    try {
      const data = s.path
        ? await tmdb(s.path, s.params || {})
        : await tmdb(`/discover/${s.type}`, { ...base, ...s.params });
      return { key: s.key, title: s.title, type: s.type, items: (data.results || []).filter(i =>
        i.poster_path && (!s.exclude || !s.exclude.test(i.name || i.title || ''))) };
    } catch {
      return { key: s.key, title: s.title, type: s.type, items: [] };
    }
  }));

  const data = sections.filter(s => s.items.length);
  cache.at = Date.now();
  cache.data = data;
  return data;
}

const kidsSections = () => buildShelves(_kidsCache, KIDS_SECTIONS, KID_SAFE);

// ── Curated Movies shelves ───────────────────────────────
let _moviesCache = { at: 0, data: null };
const MOVIE_BASE = { include_adult: false, sort_by: 'popularity.desc', 'vote_count.gte': 100 };
const MOVIES_SECTIONS = [
  { key: 'trending',  title: 'Trending This Week',      type: 'movie', path: '/trending/movie/week' },
  { key: 'theatres',  title: 'In Theatres Now',         type: 'movie', path: '/movie/now_playing', params: { region: 'IN' } },
  { key: 'popular',   title: 'Popular Right Now',       type: 'movie', params: {} },
  { key: 'top',       title: 'Top Rated of All Time',   type: 'movie', params: { sort_by: 'vote_average.desc', 'vote_count.gte': 2000 } },
  { key: 'classics',  title: 'Must-Watch Classics',     type: 'movie', params: { sort_by: 'vote_average.desc', 'vote_count.gte': 5000, 'primary_release_date.lte': '2005-12-31', with_genres: '28|12|878' } },
  { key: 'bollywood', title: 'Bollywood',               type: 'movie', params: { with_original_language: 'hi', region: 'IN' } },
  { key: 'south',     title: 'South Indian Cinema',     type: 'movie', params: { with_original_language: 'ta|te|ml|kn', region: 'IN' } },
  { key: 'action',    title: 'Action & Sci-Fi',         type: 'movie', params: { with_genres: '28|878' } },
  { key: 'comedy',    title: 'Laugh Out Loud',          type: 'movie', params: { with_genres: '35' } },
  { key: 'drama',     title: 'Drama & Emotion',         type: 'movie', params: { with_genres: '18' } },
  { key: 'romance',   title: 'Romance',                 type: 'movie', params: { with_genres: '10749' } },
  { key: 'thriller',  title: 'Thrillers & Suspense',    type: 'movie', params: { with_genres: '53|9648' } },
  { key: 'horror',    title: 'Horror Nights',           type: 'movie', params: { with_genres: '27' } },
  { key: 'animated',  title: 'Animated Worlds',         type: 'movie', params: { with_genres: '16' } },
];

// ── Curated Series shelves ───────────────────────────────
let _seriesCache = { at: 0, data: null };
const SERIES_BASE = { include_adult: false, sort_by: 'popularity.desc', 'vote_count.gte': 50 };
const SERIES_SECTIONS = [
  { key: 'trending', title: 'Trending This Week',      type: 'tv', path: '/trending/tv/week' },
  { key: 'airing',   title: 'On the Air',              type: 'tv', path: '/tv/on_the_air' },
  { key: 'popular',  title: 'Popular Right Now',       type: 'tv', params: {} },
  { key: 'top',      title: 'Top Rated Series',        type: 'tv', params: { sort_by: 'vote_average.desc', 'vote_count.gte': 1000 } },
  { key: 'indian',   title: 'Indian Web Series',       type: 'tv', params: { with_origin_country: 'IN', 'vote_count.gte': 20 } },
  { key: 'netflix',  title: 'Just Lit on Netflix',     type: 'tv', params: { with_watch_providers: '8',    watch_region: 'IN', with_watch_monetization_types: 'flatrate', sort_by: 'first_air_date.desc', 'first_air_date.lte': 'TODAY', 'vote_count.gte': 0 } },
  { key: 'prime',    title: 'Just Lit on Prime Video', type: 'tv', params: { with_watch_providers: '119',  watch_region: 'IN', with_watch_monetization_types: 'flatrate', sort_by: 'first_air_date.desc', 'first_air_date.lte': 'TODAY', 'vote_count.gte': 0 } },
  { key: 'hotstar',  title: 'Just Lit on JioHotstar',  type: 'tv', params: { with_watch_providers: '2336', watch_region: 'IN', with_watch_monetization_types: 'flatrate', sort_by: 'first_air_date.desc', 'first_air_date.lte': 'TODAY', 'vote_count.gte': 0 } },
  { key: 'crime',    title: 'Crime & Mystery',         type: 'tv', params: { with_genres: '80|9648' } },
  { key: 'scifi',    title: 'Sci-Fi & Fantasy',        type: 'tv', params: { with_genres: '10765' } },
  { key: 'action',   title: 'Action & Adventure',      type: 'tv', params: { with_genres: '10759' } },
  { key: 'comedy',   title: 'Sitcoms & Comedy',        type: 'tv', params: { with_genres: '35' } },
  { key: 'drama',    title: 'Binge-Worthy Drama',      type: 'tv', params: { with_genres: '18' } },
  { key: 'anime',    title: 'Anime',                   type: 'tv', params: { with_genres: '16', with_original_language: 'ja', 'vote_count.gte': 100 } },
  { key: 'kdrama',   title: 'K-Drama',                 type: 'tv', params: { with_original_language: 'ko', with_genres: '18' } },
  { key: 'docs',     title: 'Documentaries',           type: 'tv', params: { with_genres: '99' } },
];

const moviesSections = (safe = false) => buildShelves(_moviesCache, MOVIES_SECTIONS, MOVIE_BASE, safe);
// "TODAY" is resolved per request so the Just Lit shelves never go stale.
const seriesSections = (safe = false) => {
  const today = new Date().toISOString().slice(0, 10);
  const defs = SERIES_SECTIONS.map(s => s.params && s.params['first_air_date.lte'] === 'TODAY'
    ? { ...s, params: { ...s.params, 'first_air_date.lte': today, 'first_air_date.gte': isoDaysAgo(730) } }
    : s);
  return buildShelves(_seriesCache, defs, SERIES_BASE, safe);
};

app.get('/api/trending/:type', async (req, res) => {
  try {
    const type = req.params.type;
    if (req.query.safe === '1' && (type === 'movie' || type === 'tv')) {
      const dateKey = type === 'movie' ? 'primary_release_date' : 'first_air_date';
      return res.json(await tmdb(`/discover/${type}`, {
        sort_by: 'popularity.desc',
        [`${dateKey}.gte`]: isoDaysAgo(60),
        ...safeParams(type),
      }));
    }
    res.json(await tmdb(`/trending/${type}/week`));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/top-rated/:type', async (req, res) => {
  try {
    const type = req.params.type;
    const safe = req.query.safe === '1';
    if (safe) {
      return res.json(await tmdb(`/discover/${type}`, {
        sort_by: 'vote_average.desc',
        'vote_count.gte': type === 'movie' ? 2000 : 500,
        ...safeParams(type),
      }));
    }
    res.json(await tmdb(`/${type}/top_rated`));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/popular/:type', async (req, res) => {
  try {
    const type = req.params.type;
    const safe = req.query.safe === '1';
    if (safe) {
      return res.json(await tmdb(`/discover/${type}`, {
        sort_by: 'popularity.desc',
        'vote_count.gte': 100,
        ...safeParams(type),
      }));
    }
    res.json(await tmdb(`/${type}/popular`));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/now-playing', async (req, res) => {
  try {
    if (req.query.safe === '1') {
      return res.json(await tmdb('/discover/movie', {
        sort_by: 'popularity.desc',
        region: 'IN',
        with_release_type: '2|3',
        'primary_release_date.gte': isoDaysAgo(45),
        'primary_release_date.lte': new Date().toISOString().slice(0, 10),
        ...safeParams('movie'),
      }));
    }
    res.json(await tmdb('/movie/now_playing'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/anime',              async (req, res) => { try { res.json(await tmdb('/discover/tv', { with_genres: '16', sort_by: 'popularity.desc', with_original_language: 'ja', 'vote_count.gte': 100 })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get('/api/bollywood',          async (req, res) => { try { res.json(await tmdb('/discover/movie', { sort_by: 'popularity.desc', with_original_language: 'hi', 'vote_count.gte': 100, region: 'IN' })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get('/api/indian-series',      async (req, res) => { try { res.json(await tmdb('/discover/tv', { sort_by: 'popularity.desc', with_original_language: 'hi', 'vote_count.gte': 20 })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get('/api/netflix-india', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const perPage = 20;
    const all = await latestNetflixIndia();
    res.json({
      page,
      total_results: all.length,
      total_pages: Math.max(1, Math.ceil(all.length / perPage)),
      results: all.slice((page - 1) * perPage, page * perPage),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/kids', async (req, res) => {
  try { res.json({ sections: await kidsSections() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/movies', async (req, res) => {
  try { res.json({ sections: await moviesSections(req.query.safe === '1') }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/series', async (req, res) => {
  try { res.json({ sections: await seriesSections(req.query.safe === '1') }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/new-on/:platform', async (req, res) => {
  const cfg = OTT_PLATFORMS[req.params.platform];
  if (!cfg) return res.status(404).json({ error: 'Unknown platform' });
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const data = await latestOnPlatform(req.params.platform, page);
    res.json({ platform: req.params.platform, label: cfg.label, ...data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/trending-india/:type', async (req, res) => { try { res.json(await tmdb(`/discover/${req.params.type}`, { sort_by: 'popularity.desc', with_original_language: 'hi|ta|te|ml|bn|mr|kn', 'vote_count.gte': 50, region: 'IN' })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get('/api/south-indian', async (req, res) => {
  try {
    const [ta, te] = await Promise.all([
      tmdb('/discover/movie', { sort_by: 'popularity.desc', with_original_language: 'ta', 'vote_count.gte': 50 }),
      tmdb('/discover/movie', { sort_by: 'popularity.desc', with_original_language: 'te', 'vote_count.gte': 50 }),
    ]);
    const results = [];
    const a = ta.results || [], b = te.results || [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) { if (a[i]) results.push(a[i]); if (b[i]) results.push(b[i]); }
    res.json({ results: results.slice(0, 20) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/discover/:type', async (req, res) => {
  try {
    const { genre, sort_by = 'popularity.desc', page = 1, with_networks, safe } = req.query;
    const params = { sort_by, page, 'vote_count.gte': 20 };
    if (genre) params.with_genres = genre;
    if (with_networks) params.with_networks = with_networks;
    if (safe === '1') Object.assign(params, safeParams(req.params.type));
    res.json(await tmdb(`/discover/${req.params.type}`, params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
// VaPlayer addresses movies by IMDb ID, so the player asks for it once.
app.get('/api/external-ids/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  if (type !== 'movie' && type !== 'tv') return res.status(400).json({ error: 'Bad type' });
  try { res.json(await tmdb(`/${type}/${id}/external_ids`)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
// US certification for the R-rated warning gate.
app.get('/api/rating/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  if (type !== 'movie' && type !== 'tv') return res.status(400).json({ error: 'Bad type' });
  try {
    const data = type === 'movie'
      ? await tmdb(`/movie/${id}`, { append_to_response: 'release_dates' })
      : await tmdb(`/tv/${id}`, { append_to_response: 'content_ratings' });
    res.json({ type, id: Number(id), rating: usRating(type, data), title: data.title || data.name || null });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/search', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q) return res.json({ results: [] });
    res.json(await tmdb('/search/multi', { query: q, page, include_adult: false }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/movie/:id', async (req, res) => {
  try { res.json(await tmdb(`/movie/${req.params.id}`, { append_to_response: 'credits,videos,similar,external_ids' })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/tv/:id', async (req, res) => {
  try { res.json(await tmdb(`/tv/${req.params.id}`, { append_to_response: 'credits,videos,similar,external_ids' })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/tv/:id/season/:season', async (req, res) => {
  try { res.json(await tmdb(`/tv/${req.params.id}/season/${req.params.season}`)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/set-key', (req, res) => {
  const { key } = req.body;
  if (!key || key.length < 10) return res.status(400).json({ error: 'Invalid key' });
  global._LANTERN_KEY = key;
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build/index.html')));

app.listen(PORT, '0.0.0.0', () => {
  const ifaces = os.networkInterfaces();
  console.log('\n🔦  LANTERN is on!\n');
  console.log(`   Local:   http://localhost:${PORT}`);
  Object.values(ifaces).flat().forEach(i => {
    if (i.family === 'IPv4' && !i.internal)
      console.log(`   Network: http://${i.address}:${PORT}  ← open on TV/phone`);
  });
  console.log('\n');
});
