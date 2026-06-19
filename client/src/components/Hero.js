import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { backdrop } from '../utils/api';
import './Hero.css';

export default function Hero({ items = [] }) {
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx(c => (c + 1) % Math.min(items.length, 8)), 9000);
    return () => clearInterval(t);
  }, [items]);

  if (!items.length) return <div className="hero-skeleton" />;

  const item = items[idx];
  const isTV = item.media_type === 'tv' || item.first_air_date;
  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const bg = backdrop(item.backdrop_path);
  const rating = item.vote_average > 0 ? item.vote_average.toFixed(1) : null;
  const open = () => navigate(isTV ? `/tv/${item.id}` : `/movie/${item.id}`);

  return (
    <div className="hero">
      <div className="hero-bg" key={item.id} style={{ backgroundImage: bg ? `url(${bg})` : 'none' }} />
      <div className="hero-grad-left" />
      <div className="hero-grad-bottom" />
      <div className="hero-grad-top" />

      <div className="hero-content fade-up">
        <div className="hero-eyebrow">{isTV ? 'SERIES' : 'FILM'}</div>
        <h1 className="hero-title">{title}</h1>
        <div className="hero-meta">
          {year && <span>{year}</span>}
          {rating && <span className="hero-rating">★ {rating}</span>}
          {item.number_of_seasons && <span>{item.number_of_seasons} Seasons</span>}
        </div>
        <p className="hero-overview">
          {item.overview?.slice(0, 220)}{(item.overview?.length || 0) > 220 ? '…' : ''}
        </p>
        <div className="hero-btns">
          <button className="hero-btn-play" onClick={open}><span>▶</span> Play</button>
          <button className="hero-btn-info" onClick={open}><span>ℹ</span> More Info</button>
        </div>
      </div>

      <div className="hero-dots">
        {items.slice(0, 8).map((_, i) => (
          <button key={i} className={`hero-dot ${i === idx ? 'on' : ''}`} onClick={() => setIdx(i)} />
        ))}
      </div>
    </div>
  );
}
