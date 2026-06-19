import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { poster, backdrop } from '../utils/api';
import './MediaRow.css';

export default function MediaRow({ title, items = [], type, browseType }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [focusedItem, setFocusedItem] = useState(null);
  const navigate = useNavigate();
  const enterT = useRef(null);
  const leaveT = useRef(null);

  if (!items.length) return null;
  const list = items.map(i => ({ ...i, media_type: i.media_type || type }));

  const onEnter = (idx, item) => {
    clearTimeout(leaveT.current);
    enterT.current = setTimeout(() => { setHoveredIdx(idx); setFocusedItem(item); }, 200);
  };
  const onLeave = () => {
    clearTimeout(enterT.current);
    leaveT.current = setTimeout(() => { setHoveredIdx(null); setFocusedItem(null); }, 280);
  };
  const open = (item) => {
    const tv = item.media_type === 'tv' || item.first_air_date;
    navigate(tv ? `/tv/${item.id}` : `/movie/${item.id}`);
  };

  return (
    <section className="mrow">
      <div className="mrow-header">
        <h2 className="mrow-title">{title}</h2>
        {browseType && (
          <button className="mrow-seeall" onClick={() => navigate(`/browse/${browseType}`)}>
            See all <span>›</span>
          </button>
        )}
      </div>

      <div className="mrow-track">
        {list.map((item, i) => {
          const exp = hoveredIdx === i;
          // On expand show backdrop, on collapse immediately switch back to poster
          // so the shrink animation shows portrait image (no aspect ratio jump)
          const src = exp && item.backdrop_path
            ? backdrop(item.backdrop_path, 'w780')
            : poster(item.poster_path);
          const t = item.title || item.name;
          const rating = item.vote_average?.toFixed(1);

          return (
            <div
              key={item.id}
              className={`mcard ${exp ? 'expanded' : ''}`}
              onMouseEnter={() => onEnter(i, item)}
              onMouseLeave={onLeave}
              onClick={() => open(item)}
            >
              <div className="mcard-inner">
                {src
                  ? <img src={src} alt={t} loading="lazy" />
                  : <div className="mcard-no-img">{t?.[0]}</div>
                }
                <div className="mcard-overlay">
                  <div className="mcard-play-btn">▶</div>
                </div>
                {rating && !exp && <span className="mcard-badge-rating">★ {rating}</span>}
                {exp && (
                  <div className="mcard-expanded-bar">
                    <span className="mcard-exp-title">{t}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Description panel below row */}
      <div className={`mrow-info-panel ${focusedItem ? 'show' : ''}`}>
        {focusedItem && (
          <div className="mrow-info-inner fade-up">
            <div className="mrow-info-text">
              <p className="mrow-info-title">{focusedItem.title || focusedItem.name}</p>
              <div className="mrow-info-meta">
                {focusedItem.vote_average > 0 && (
                  <span className="mrow-info-rating">★ {focusedItem.vote_average.toFixed(1)}</span>
                )}
                {(focusedItem.release_date || focusedItem.first_air_date) && (
                  <span>{(focusedItem.release_date || focusedItem.first_air_date).slice(0,4)}</span>
                )}
                <span className="mrow-info-type">
                  {focusedItem.media_type === 'tv' || focusedItem.first_air_date ? 'Series' : 'Movie'}
                </span>
              </div>
              <p className="mrow-info-overview">
                {focusedItem.overview?.slice(0,200)}{(focusedItem.overview?.length||0)>200?'…':''}
              </p>
            </div>
            <button className="mrow-info-cta" onClick={e => { e.stopPropagation(); open(focusedItem); }}>
              More Info ›
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
