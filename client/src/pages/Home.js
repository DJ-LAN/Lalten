import React, { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import MediaRow from '../components/MediaRow';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';

async function safe(fn) {
  try { const d = await fn(); return d.results || []; } catch { return []; }
}
function pick(arr) { return [...arr].sort(() => Math.random() - 0.5).slice(0, 20); }

export default function Home() {
  const [sections, setSections] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      safe(() => api.trendingIndia('movie')),
      safe(() => api.bollywood()),
      safe(() => api.southIndian()),
      safe(() => api.trending('all')),
      safe(() => api.nowPlaying()),
      safe(() => api.discover('movie', { genre: '35,10751', sort_by: 'popularity.desc' })),
      safe(() => api.discover('tv', { genre: '10759,35', sort_by: 'popularity.desc' })),
      safe(() => api.indianSeries()),
      safe(() => api.topRated('movie')),
      safe(() => api.topRated('tv')),
      safe(() => api.discover('tv', { with_networks: '213',  sort_by: 'popularity.desc' })),
      safe(() => api.discover('tv', { with_networks: '1024', sort_by: 'popularity.desc' })),
      safe(() => api.discover('tv', { with_networks: '3919', sort_by: 'popularity.desc' })),
      safe(() => api.anime()),
      safe(() => api.discover('movie', { genre: '28,878', sort_by: 'popularity.desc' })),
      safe(() => api.discover('movie', { genre: '27,53',  sort_by: 'popularity.desc' })),
      safe(() => api.discover('tv',    { genre: '80',     sort_by: 'popularity.desc' })),
    ]).then(r => setSections(r)).catch(e => setError(e.message));
  }, []);

  if (!sections && !error) return (
    <div className="page" style={{ textAlign: 'center' }}>
      <div className="spinner" />
      <p style={{ color: '#333', letterSpacing: 3, fontSize: 11, marginTop: -40 }}>LOADING LANTERN...</p>
    </div>
  );

  if (error) return (
    <div className="page" style={{ textAlign: 'center', padding: '120px 24px' }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>🔦</p>
      <h2 style={{ fontSize: 22, marginBottom: 10 }}>Can't reach the server</h2>
      <p style={{ color: '#aaa', fontSize: 14 }}>Make sure LANTERN is running and your API key is set.</p>
      <p style={{ color: 'var(--accent)', fontSize: 12, marginTop: 12 }}>{error}</p>
      <button onClick={() => navigate('/settings')}
        style={{ marginTop: 20, padding: '10px 24px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--radius)', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
        Open Settings
      </button>
    </div>
  );

  const [indMov, bolly, south, global, nowPlay, casual, adventure,
         indSer, topMov, topTV, netflix, prime, hotstar,
         anime, actionSci, horror, crime] = sections;

  const heroItems = pick([...indMov, ...global]).slice(0, 10);

  return (
    <div>
      <Hero items={heroItems} />
      <div style={{ position: 'relative', zIndex: 1, paddingTop: 8 }}>
        <MediaRow title="Casual Entertainment"     items={pick(casual)}    type="movie" browseType="comedy" />
        <MediaRow title="Adventure Series"         items={pick(adventure)} type="tv"    browseType="adventure" />
        <MediaRow title="Anime"                    items={pick(anime)}     type="tv"    browseType="anime" />
        <MediaRow title="Top Rated Series"         items={pick(topTV)}     type="tv"    browseType="top-series" />
        <MediaRow title="Trending on Netflix"      items={pick(netflix)}   type="tv"    browseType="netflix" />
        <MediaRow title="Trending on Prime Video"  items={pick(prime)}     type="tv"    browseType="prime" />
        <MediaRow title="Trending Worldwide"       items={pick(global)}                 browseType="trending" />
        <MediaRow title="In Theatres Now"          items={pick(nowPlay)}   type="movie" browseType="now-playing" />
        <MediaRow title="Trending on Hotstar"      items={pick(hotstar)}   type="tv"    browseType="hotstar" />
        <MediaRow title="Indian Web Series"        items={pick(indSer)}    type="tv"    browseType="indian-series" />
        <MediaRow title="Trending in India"        items={pick(indMov)}    type="movie" browseType="trending-india" />
        <MediaRow title="Bollywood"                items={pick(bolly)}     type="movie" browseType="bollywood" />
        <MediaRow title="South Indian"             items={pick(south)}     type="movie" browseType="south-indian" />
        <MediaRow title="Top Rated Movies"         items={pick(topMov)}    type="movie" browseType="top-movies" />
        <MediaRow title="Action and Sci-Fi"        items={pick(actionSci)} type="movie" browseType="action" />
        <MediaRow title="Crime and Thriller"       items={pick(crime)}     type="tv"    browseType="crime" />
        <MediaRow title="Horror and Suspense"      items={pick(horror)}    type="movie" browseType="horror" />
        <div style={{ height: 60 }} />
      </div>
    </div>
  );
}
