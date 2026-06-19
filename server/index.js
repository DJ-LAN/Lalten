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

app.get('/api/trending/:type',     async (req, res) => { try { res.json(await tmdb(`/trending/${req.params.type}/week`)); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get('/api/top-rated/:type',    async (req, res) => { try { res.json(await tmdb(`/${req.params.type}/top_rated`)); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get('/api/popular/:type',      async (req, res) => { try { res.json(await tmdb(`/${req.params.type}/popular`)); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get('/api/now-playing',        async (req, res) => { try { res.json(await tmdb('/movie/now_playing')); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get('/api/anime',              async (req, res) => { try { res.json(await tmdb('/discover/tv', { with_genres: '16', sort_by: 'popularity.desc', with_original_language: 'ja', 'vote_count.gte': 100 })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get('/api/bollywood',          async (req, res) => { try { res.json(await tmdb('/discover/movie', { sort_by: 'popularity.desc', with_original_language: 'hi', 'vote_count.gte': 100, region: 'IN' })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get('/api/indian-series',      async (req, res) => { try { res.json(await tmdb('/discover/tv', { sort_by: 'popularity.desc', with_original_language: 'hi', 'vote_count.gte': 20 })); } catch (e) { res.status(500).json({ error: e.message }); } });
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
    const { genre, sort_by = 'popularity.desc', page = 1, with_networks } = req.query;
    const params = { sort_by, page, 'vote_count.gte': 20 };
    if (genre) params.with_genres = genre;
    if (with_networks) params.with_networks = with_networks;
    res.json(await tmdb(`/discover/${req.params.type}`, params));
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
