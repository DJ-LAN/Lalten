import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MediaRow from './MediaRow';
import { poster } from '../utils/api';
import './ShelfRow.css';

// How many random titles a shelf shows before "View all".
const PREVIEW = 16;

function shuffled(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A shelf that shows a random handful of its titles, with Shuffle and a
// "View all" that unfolds the whole list into a grid.
export default function ShelfRow({ title, items = [], type }) {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState(0);
  const navigate = useNavigate();

  // New random picks on every page load and every Shuffle.
  const preview = useMemo(() => shuffled(items).slice(0, PREVIEW), [items, seed]); // eslint-disable-line

  if (!items.length) return null;

  // Short shelves have nothing hidden, but still render as a shelf (with
  // Shuffle) so every curated row looks and behaves the same.
  const canExpand = items.length > PREVIEW;

  const actions = (
    <div className="sr-actions">
      {!open && items.length > 1 && (
        <button type="button" className="sr-btn" onClick={() => setSeed(s => s + 1)} aria-label={`Shuffle ${title}`}>
          <span className="sr-dice" aria-hidden="true">🎲</span> Shuffle
        </button>
      )}
      {canExpand && (
        <button type="button" className="sr-btn sr-all" onClick={() => setOpen(o => !o)} aria-expanded={open}>
          {open ? 'Show less' : `View all ${items.length}`}
          <span className={`sr-chev ${open ? 'up' : ''}`} aria-hidden="true">›</span>
        </button>
      )}
    </div>
  );

  if (!open) {
    // key={seed} remounts the row so the cards deal in again after a shuffle
    return (
      <div className="sr-row" key={seed}>
        <MediaRow title={title} items={preview} type={type} actions={actions} />
      </div>
    );
  }

  const go = item => {
    const tv = (item.media_type || type) === 'tv' || item.first_air_date;
    if (tv) navigate(`/tv/${item.id}${item.season_number ? `?season=${item.season_number}` : ''}`);
    else navigate(`/movie/${item.id}`);
  };

  return (
    <section className="mrow sr-open">
      <div className="mrow-header">
        <h2 className="mrow-title">{title}</h2>
        {actions}
      </div>
      <div className="sr-grid">
        {items.map((item, i) => {
          const name = item.title || item.name;
          const year = (item.release_date || item.first_air_date || '').slice(0, 4);
          return (
            <button
              key={`${item.id}-${item.season_number || 0}`}
              type="button"
              className="sr-card"
              style={{ '--i': Math.min(i, 30), '--r': `${((i * 37) % 9) - 4}deg` }}
              onClick={() => go(item)}
              title={name}
            >
              <span className="sr-poster">
                {item.poster_path
                  ? <img src={poster(item.poster_path)} alt={name} loading="lazy" />
                  : <span className="sr-noimg">{name?.[0]}</span>}
                {item.vote_average > 0 && <span className="sr-rate">★ {item.vote_average.toFixed(1)}</span>}
              </span>
              <span className="sr-name">{name}</span>
              {year && <span className="sr-year">{year}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
