import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, poster } from '../utils/api';
import './Search.css';

export default function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    api.search(query)
      .then(d => {
        setResults((d.results||[]).filter(i => (i.media_type==='movie'||i.media_type==='tv') && i.poster_path));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [query]);

  return (
    <div className="srch page">
      <div className="srch-header">
        <h1 className="srch-h1">{query ? `Results for "${query}"` : 'Search'}</h1>
        {results.length > 0 && <p className="srch-count">{results.length} titles found</p>}
      </div>
      {loading && <div className="spinner" />}
      {!loading && results.length === 0 && query && (
        <div className="srch-empty">
          <p style={{fontSize:44,marginBottom:12}}>🔍</p>
          <p>No results for "{query}"</p>
          <p style={{color:'#555',fontSize:13,marginTop:6}}>Try a different title or genre</p>
        </div>
      )}
      <div className="srch-grid">
        {results.map(item => {
          const isTV = item.media_type === 'tv';
          const title = item.title || item.name;
          const year = (item.release_date || item.first_air_date || '').slice(0,4);
          return (
            <div key={item.id} className="srch-card"
              onClick={() => navigate(isTV ? `/tv/${item.id}` : `/movie/${item.id}`)}>
              <div className="srch-card-img">
                <img src={poster(item.poster_path)} alt={title} loading="lazy" />
                <div className="srch-card-ov">▶</div>
                {item.vote_average > 0 && <span className="srch-rating">★ {item.vote_average.toFixed(1)}</span>}
              </div>
              <p className="srch-title">{title}</p>
              {year && <span className="srch-year">{year}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
