import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SOURCES, api, isBlockedRating } from '../utils/api';
import ContentWarning from '../components/ContentWarning';
import './Player.css';

export default function Player() {
  const { type, id, season, episode } = useParams();
  const [srcIdx, setSrcIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uiVisible, setUiVisible] = useState(true);
  const [meta, setMeta] = useState({});
  const [rating, setRating] = useState(undefined);
  const [title, setTitle] = useState(null);
  const [proceed, setProceed] = useState(false);
  const isTV = type === 'tv';
  const safeMode = localStorage.getItem('ln_safe') === 'true';
  const sources = SOURCES[isTV ? 'tv' : 'movie'];

  // A direct /play link should still hit the R-rated gate.
  useEffect(() => {
    setProceed(false);
    if (!safeMode || (type !== 'movie' && type !== 'tv')) { setRating(null); return undefined; }
    let alive = true;
    setRating(undefined);
    api.rating(type, id)
      .then(r => { if (alive) { setRating(r?.rating || null); setTitle(r?.title || null); } })
      .catch(() => { if (alive) setRating(null); });
    return () => { alive = false; };
  }, [id, type, safeMode]);

  // VaPlayer needs an IMDb ID for movies, so look it up once and let the
  // build functions fall back to the TMDB ID if the lookup fails.
  useEffect(() => {
    let alive = true;
    if (isTV) { setMeta({}); return undefined; }
    api.externalIds('movie', id)
      .then(ext => { if (alive) setMeta({ imdbId: ext?.imdb_id || null }); })
      .catch(() => { if (alive) setMeta({}); });
    return () => { alive = false; };
  }, [id, isTV]);

  const url = useMemo(() => {
    const source = sources[srcIdx] || sources[0];
    return isTV
      ? source.build(id, meta, season, episode)
      : source.build(id, meta);
  }, [sources, srcIdx, id, meta, isTV, season, episode]);

  useEffect(() => {
    let t;
    const show = () => { setUiVisible(true); clearTimeout(t); t = setTimeout(() => setUiVisible(false), 4000); };
    window.addEventListener('mousemove', show); show();
    return () => { window.removeEventListener('mousemove', show); clearTimeout(t); };
  }, []);

  useEffect(() => { setLoading(true); }, [srcIdx, url]);

  if (safeMode && rating === undefined) {
    return <div className="player-page"><div className="spinner" /></div>;
  }
  if (safeMode && isBlockedRating(type, rating) && !proceed) {
    return (
      <ContentWarning
        type={type}
        title={title || 'This title'}
        rating={rating}
        onProceed={() => setProceed(true)}
      />
    );
  }

  return (
    <div className="player-page">
      <div className={`player-bar ${uiVisible ? 'show' : ''}`}>
        <Link to={isTV ? `/tv/${id}` : `/movie/${id}`} className="player-back">← Back</Link>
        <div className="player-title">{isTV ? `Season ${season}  ·  Episode ${episode}` : 'Now Playing'}</div>
        <div className="player-sources">
          {sources.map((source, i) => (
            <button key={source.label} className={`player-src-btn ${i === srcIdx ? 'active' : ''}`}
              onClick={() => { setSrcIdx(i); setLoading(true); }}>{source.label}</button>
          ))}
        </div>
      </div>
      {loading && (
        <div className="player-loading">
          <div className="spinner" />
          <p>Loading via <strong>{sources[srcIdx]?.label}</strong>...</p>
          <p className="player-loading-hint">If it stalls, try another source above.</p>
          {srcIdx < sources.length - 1 && (
            <button className="player-try-next" onClick={() => { setSrcIdx(srcIdx + 1); setLoading(true); }}>
              Try {sources[srcIdx + 1].label} →
            </button>
          )}
        </div>
      )}
      <iframe key={url} src={url} className="player-iframe" allowFullScreen
        allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
        title="LANTERN Player" onLoad={() => setLoading(false)} referrerPolicy="no-referrer" />
    </div>
  );
}
