import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, poster } from '../utils/api';
import './Browse.css';

const CATS = {
  'movie':          { label: 'Movies',               fn: p => api.discover('movie', { sort_by: 'popularity.desc', page: p }) },
  'tv':             { label: 'Series',               fn: p => api.discover('tv',    { sort_by: 'popularity.desc', page: p }) },
  'comedy':         { label: 'Casual Entertainment', fn: p => api.discover('movie', { genre: '35,10751', sort_by: 'popularity.desc', page: p }) },
  'adventure':      { label: 'Adventure Series',     fn: p => api.discover('tv',    { genre: '10759,35', sort_by: 'popularity.desc', page: p }) },
  'trending-india': { label: 'Trending in India',    fn: ()  => api.trendingIndia('movie') },
  'bollywood':      { label: 'Bollywood',            fn: ()  => api.bollywood() },
  'south-indian':   { label: 'South Indian',         fn: ()  => api.southIndian() },
  'trending':       { label: 'Trending Worldwide',   fn: ()  => api.trending('all') },
  'now-playing':    { label: 'In Theatres Now',      fn: ()  => api.nowPlaying() },
  'netflix':        { label: 'Just Lit on Netflix',      chrono: true, fn: p => api.newOn('netflix', p) },
  'netflix-india':  { label: 'New on Netflix India',     chrono: true, fn: p => api.netflixIndia(p) },
  'prime':          { label: 'Just Lit on Prime Video',  chrono: true, fn: p => api.newOn('prime', p) },
  'hotstar':        { label: 'Just Lit on JioHotstar',   chrono: true, fn: p => api.newOn('hotstar', p) },
  'apple':          { label: 'Just Lit on Apple TV+',    chrono: true, fn: p => api.newOn('apple', p) },
  'sonyliv':        { label: 'Just Lit on SonyLIV',      chrono: true, fn: p => api.newOn('sonyliv', p) },
  'zee5':           { label: 'Just Lit on Zee5',         chrono: true, fn: p => api.newOn('zee5', p) },
  'mx':             { label: 'Just Lit on MX Player',    chrono: true, fn: p => api.newOn('mx', p) },
  'top-movies':     { label: 'Top Rated Movies',     fn: p  => api.discover('movie', { sort_by: 'vote_average.desc', 'vote_count.gte': 200, page: p }) },
  'top-series':     { label: 'Top Rated Series',     fn: p  => api.discover('tv',    { sort_by: 'vote_average.desc', 'vote_count.gte': 100, page: p }) },
  'indian-series':  { label: 'Indian Web Series',   fn: ()  => api.indianSeries() },
  'anime':          { label: 'Anime',                fn: ()  => api.anime() },
  'action':         { label: 'Action and Sci-Fi',    fn: p  => api.discover('movie', { genre: '28,878', sort_by: 'popularity.desc', page: p }) },
  'crime':          { label: 'Crime and Thriller',   fn: p  => api.discover('tv',    { genre: '80,9648', sort_by: 'popularity.desc', page: p }) },
  'horror':         { label: 'Horror and Suspense',  fn: p  => api.discover('movie', { genre: '27,53',   sort_by: 'popularity.desc', page: p }) },
};

function Card({ item }) {
  const navigate = useNavigate();
  const isTV = item.media_type === 'tv' || item.first_air_date;
  const title = item.title || item.name;
  const rating = item.vote_average?.toFixed(1);
  const year = (item.release_date || item.first_air_date || '').slice(0,4);
  return (
    <div className="bc" onClick={() => navigate(isTV ? `/tv/${item.id}` : `/movie/${item.id}`)}>
      <div className="bc-img">
        {item.poster_path ? <img src={poster(item.poster_path)} alt={title} loading="lazy" /> : <div className="bc-ph">{title?.[0]}</div>}
        <div className="bc-ov">▶</div>
        {rating && <span className="bc-rating">★ {rating}</span>}
      </div>
      <p className="bc-title">{title}</p>
      {year && <span className="bc-year">{year}</span>}
    </div>
  );
}

export default function Browse() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cat = CATS[type] || CATS['movie'];

  const load = useCallback(async (pg) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await cat.fn(pg);
      const results = (data.results || []).filter(i => i.poster_path);
      // Keep newest-first ordering for the "Just Lit" shelves; shuffle the rest.
      if (!cat.chrono) results.sort(() => Math.random() - 0.5);
      setItems(prev => pg === 1 ? results : [...prev, ...results]);
      setHasMore(results.length > 0);
      setPage(pg + 1);
    } catch {}
    setLoading(false);
  }, [type]); // eslint-disable-line

  useEffect(() => { setItems([]); setPage(1); setHasMore(true); load(1); }, [type]); // eslint-disable-line

  return (
    <div className="bp page">
      <div className="bp-header">
        <button className="bp-back" onClick={() => navigate(-1)}>← Back</button>
        <h1 className="bp-h1">{cat.label}</h1>
      </div>
      <div className="bp-grid">
        {items.map(item => <Card key={item.id} item={item} />)}
      </div>
      {loading && <div className="spinner" />}
      {!loading && hasMore && (
        <div style={{ textAlign: 'center', padding: '24px 0 48px' }}>
          <button className="bp-more" onClick={() => load(page)}>Load More</button>
        </div>
      )}
    </div>
  );
}
