import React, { useState, useEffect } from 'react';
import { isFavourite, toggleFavourite } from '../utils/api';
import './LightenUp.css';

export default function LightenUp({ item }) {
  const [faved, setFaved] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    setFaved(isFavourite(item.id));
  }, [item.id]);

  const handle = () => {
    setAnimating(true);
    setBurst(true);

    const nowFaved = toggleFavourite({
      id: item.id,
      isTV: item.isTV,
      title: item.title,
      posterPath: item.posterPath,
      year: item.year,
    });
    setFaved(nowFaved);

    setTimeout(() => setAnimating(false), 600);
    setTimeout(() => setBurst(false), 800);
  };

  return (
    <div className="lu-wrap">
      <button
        className={`lu-btn ${faved ? 'lightened' : 'unlightened'} ${animating ? 'animating' : ''}`}
        onClick={handle}
      >
        {/* Burst particles — only on fave */}
        {burst && faved && (
          <span className="lu-burst" aria-hidden="true">
            {[...Array(16)].map((_, i) => <span key={i} className={`lu-particle p${i}`} />)}
          </span>
        )}

        <span className="lu-icon">{faved ? '✦' : '✧'}</span>
        <span className="lu-text">{faved ? 'Lightened!' : 'Lighten Up'}</span>
      </button>
    </div>
  );
}
