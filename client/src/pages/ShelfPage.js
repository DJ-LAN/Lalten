import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MediaRow from '../components/MediaRow';
import RotatingTagline from '../components/RotatingTagline';
import './ShelfPage.css';

// Shared "curated shelves" page — same layout as the Kids section.
// Movies and Series both render through this with their own copy + API call.
export default function ShelfPage({ load, copy }) {
  const [sections, setSections] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setSections(null);
    setError(null);
    load()
      .then(d => setSections(d.sections || []))
      .catch(e => setError(e.message));
  }, [load]);

  if (error) return (
    <div className="shelf page" style={{ textAlign: 'center', padding: '120px 24px' }}>
      <p style={{ fontSize: 46, marginBottom: 12 }}>{copy.emoji}</p>
      <h2 style={{ fontSize: 22, marginBottom: 8 }}>{copy.errorTitle}</h2>
      <p style={{ color: 'var(--text-sub)', fontSize: 14 }}>{error}</p>
    </div>
  );

  if (!sections) return (
    <div className="shelf page" style={{ textAlign: 'center' }}>
      <div className="spinner" />
      <p style={{ color: '#333', letterSpacing: 3, fontSize: 11, marginTop: -40 }}>{copy.loading}</p>
    </div>
  );

  const all = sections.flatMap(s => s.items.map(i => ({ ...i, media_type: s.type })));

  // copy.taglines is the rotating headline; copy.title still works as a fallback.
  const taglines = copy.taglines
    || (Array.isArray(copy.title) ? [copy.title.join('|')] : copy.title ? [copy.title] : []);

  const surprise = () => {
    if (!all.length) return;
    const item = all[Math.floor(Math.random() * all.length)];
    navigate(item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`);
  };

  return (
    <div className="shelf page">
      <header className="shelf-header">
        <div className="shelf-glow" aria-hidden="true" />
        <p className="shelf-eyebrow">{copy.eyebrow}</p>
        <RotatingTagline lines={taglines} className="shelf-title" />
        <p className="shelf-sub">{copy.sub}</p>
        <div className="shelf-actions">
          <button className="shelf-surprise" onClick={surprise}>✦ Surprise me</button>
          <div className="shelf-badges">
            {copy.badges.map(b => <span key={b}>{b}</span>)}
          </div>
        </div>
      </header>

      <div className="shelf-rows">
        {sections.filter(s => s.items.length).map(s => (
          <MediaRow key={s.key} title={s.title} items={s.items} type={s.type} />
        ))}
      </div>

      <p className="shelf-note">{copy.note}</p>
    </div>
  );
}
