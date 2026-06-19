import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SOURCES, SOURCE_LABELS } from '../utils/api';
import './Player.css';

export default function Player() {
  const { type, id, season, episode } = useParams();
  const [srcIdx, setSrcIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uiVisible, setUiVisible] = useState(true);
  const isTV = type === 'tv';
  const sources = SOURCES[isTV ? 'tv' : 'movie'];
  const url = isTV ? sources[srcIdx](id, season, episode) : sources[srcIdx](id);

  useEffect(() => {
    let t;
    const show = () => { setUiVisible(true); clearTimeout(t); t = setTimeout(() => setUiVisible(false), 4000); };
    window.addEventListener('mousemove', show); show();
    return () => { window.removeEventListener('mousemove', show); clearTimeout(t); };
  }, []);

  useEffect(() => { setLoading(true); }, [srcIdx, url]);

  return (
    <div className="player-page">
      <div className={`player-bar ${uiVisible ? 'show' : ''}`}>
        <Link to={isTV ? `/tv/${id}` : `/movie/${id}`} className="player-back">← Back</Link>
        <div className="player-title">{isTV ? `Season ${season}  ·  Episode ${episode}` : 'Now Playing'}</div>
        <div className="player-sources">
          {SOURCE_LABELS.map((label, i) => (
            <button key={i} className={`player-src-btn ${i === srcIdx ? 'active' : ''}`}
              onClick={() => { setSrcIdx(i); setLoading(true); }}>{label}</button>
          ))}
        </div>
      </div>
      {loading && (
        <div className="player-loading">
          <div className="spinner" />
          <p>Loading via <strong>{SOURCE_LABELS[srcIdx]}</strong>...</p>
          <p className="player-loading-hint">If it stalls, try another source above.</p>
          {srcIdx < sources.length - 1 && (
            <button className="player-try-next" onClick={() => { setSrcIdx(srcIdx + 1); setLoading(true); }}>
              Try {SOURCE_LABELS[srcIdx + 1]} →
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
