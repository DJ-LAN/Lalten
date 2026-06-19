import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFavourites, toggleFavourite, poster } from '../utils/api';
import './MyShows.css';

export default function MyShows() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setItems(getFavourites());
  }, []);

  const remove = (e, item) => {
    e.stopPropagation();
    toggleFavourite(item);
    setItems(getFavourites());
  };

  return (
    <div className="ms page">
      <div className="ms-header">
        <h1 className="ms-h1">My Shows</h1>
        <p className="ms-sub">
          {items.length === 0
            ? 'Nothing here yet — hit "Lighten Up" on any title to save it.'
            : `${items.length} title${items.length > 1 ? 's' : ''} saved`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="ms-empty">
          <div className="ms-empty-icon">✧</div>
          <p className="ms-empty-title">Your list is empty</p>
          <p className="ms-empty-sub">Browse titles and hit <strong>Lighten Up</strong> to add them here.</p>
          <button className="ms-browse-btn" onClick={() => navigate('/')}>Browse Titles</button>
        </div>
      ) : (
        <div className="ms-grid">
          {items.map(item => (
            <div
              key={item.id}
              className="ms-card"
              onClick={() => navigate(item.isTV ? `/tv/${item.id}` : `/movie/${item.id}`)}
            >
              <div className="ms-card-img">
                {item.posterPath
                  ? <img src={poster(item.posterPath)} alt={item.title} loading="lazy" />
                  : <div className="ms-card-ph">{item.title?.[0]}</div>
                }
                <div className="ms-card-ov">▶</div>
                <span className="ms-card-type">{item.isTV ? 'Series' : 'Movie'}</span>
                {/* Remove button */}
                <button
                  className="ms-card-remove"
                  onClick={e => remove(e, item)}
                  title="Remove from My Shows"
                >
                  ✦ Lightened!
                </button>
              </div>
              <p className="ms-card-title">{item.title}</p>
              {item.year && <span className="ms-card-year">{item.year}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
