import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SOURCES, api, isBlockedRating } from '../utils/api';
import ContentWarning from '../components/ContentWarning';
import './Player.css';

// Playing-card server picker. The chosen server is the top card of a neat
// stack; click it and the cards slide out into a row (like revealing a hand),
// click any card and they slide back with that card on top.
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['\u2660', '\u2665', '\u2663', '\u2666'];   // spade heart club diamond

const DECK_SCALE = 0.75;   // overall size of the cards (1 = full size)

function ServerDeck({ sources, selected, onSelect, visible }) {
  const [open, setOpen] = useState(false);
  const [landed, setLanded] = useState(null);
  const [nameSize, setNameSize] = useState(11);
  const [vw, setVw] = useState(window.innerWidth);
  const ref = useRef(null);
  const n = sources.length;

  const small = vw <= 600;
  const cardW = small ? 70 : 100;
  const cardH = Math.round(cardW * 0.6);
  const gap = small ? 4 : 6;
  const spacing = cardW + gap;
  const K = DECK_SCALE;
  // One row when it fits, otherwise wrap into evenly balanced rows.
  // Desktop keeps clear of the Back button on the left (the row is centred).
  const reserve = small ? 24 : 220;
  const fit = Math.max(1, Math.floor((vw - reserve + gap * K) / (spacing * K)));
  const rows = Math.ceil(n / Math.min(n, fit));
  const perRow = Math.ceil(n / rows);

  useEffect(() => {
    const f = () => setVw(window.innerWidth);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  // Tuck the deck away when the player UI fades out.
  useEffect(() => { if (!visible) setOpen(false); }, [visible]);

  // Click outside / focus moving into the video iframe / Esc closes the spread.
  useEffect(() => {
    if (!open) return undefined;
    const away = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const close = () => setOpen(false);
    const esc = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    window.addEventListener('blur', close);
    window.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      window.removeEventListener('blur', close);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  // Size the server names so the longest one spans the card width exactly.
  useEffect(() => {
    let alive = true;
    const measure = () => {
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = `800 100px ${getComputedStyle(document.body).fontFamily}`;
      const widest = Math.max(...sources.map(sr => ctx.measureText(sr.label).width));
      if (alive && widest > 0) setNameSize(Math.floor(((cardW - 14) / widest) * 1000) / 10);
    };
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    return () => { alive = false; };
  }, [sources, cardW]);

  useEffect(() => {
    if (landed === null) return undefined;
    const t = setTimeout(() => setLanded(null), 800);
    return () => clearTimeout(t);
  }, [landed]);

  const click = i => {
    if (!open) { if (i === selected) setOpen(true); return; }
    if (i !== selected) { onSelect(i); setLanded(i); }
    setOpen(false);
  };

  return (
    <div className={`player-deck ${open ? 'open' : ''}`} ref={ref} role="group" aria-label="Choose server">
      {sources.map((source, i) => {
        const isSel = i === selected;
        // Rank among the cards underneath the selected one (1..n-1).
        const depth = isSel ? 0 : (i < selected ? i + 1 : i);
        let x, y, scale, z, delay;
        if (open) {
          const row = Math.floor(i / perRow);
          const inRow = Math.min(perRow, n - row * perRow);
          const cx = (i - row * perRow) - (inRow - 1) / 2;
          x = cx * spacing * K;
          y = row * (cardH + 10) * K;
          scale = K; z = i + 1;
          delay = i * 26;               // slide out left to right, one after another
        } else {
          x = 0; y = 0; scale = 0.85 * K;       // everyone tucks under the top card
          z = isSel ? n + 1 : n - depth;
          delay = depth * 12;
        }
        const interactive = open || isSel;
        const rank = RANKS[i % RANKS.length];
        const suit = SUITS[i % SUITS.length];
        return (
          <button
            key={source.label}
            type="button"
            className={`deck-card ${isSel ? 'active' : ''} ${landed === i ? 'landed' : ''}`}
            style={{
              width: cardW,
              height: cardH,
              zIndex: z,
              // scale() is about the centre, so nudge up to keep the top edge where it was
              transform: `translate3d(${x - cardW / 2}px, ${y - (cardH * (1 - scale)) / 2}px, 0) scale(${scale})`,
              transitionDelay: `${delay}ms`,
              opacity: open || isSel ? 1 : 0,
              pointerEvents: interactive ? 'auto' : 'none',
            }}
            tabIndex={interactive ? 0 : -1}
            aria-hidden={interactive ? undefined : true}
            aria-label={`Server ${source.label}`}
            aria-expanded={isSel ? open : undefined}
            onClick={() => click(i)}
          >
            <span className="card-face">
              <span className="corner tl"><b>{rank}</b><i>{suit}</i></span>
              <span className="spark" aria-hidden="true">{'\u2726'}</span>
              <span className="name" style={{ fontSize: nameSize }}>{source.label}</span>
              <span className="corner br"><b>{rank}</b><i>{suit}</i></span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

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
    window.addEventListener('mousemove', show);
    window.addEventListener('touchstart', show, { passive: true });
    show();
    return () => { window.removeEventListener('mousemove', show); window.removeEventListener('touchstart', show); clearTimeout(t); };
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
      {/* Thin hover strip along the top edge (with a faint handle) that wakes the bar once it has faded. */}
      <div className={`player-peek ${uiVisible ? '' : 'idle'}`} aria-hidden="true" />
      <div className={`player-bar ${uiVisible ? 'show' : ''}`}>
        <Link to={isTV ? `/tv/${id}` : `/movie/${id}`} className="player-back">← Back</Link>
        <div className="player-title">{isTV ? `Season ${season}  ·  Episode ${episode}` : 'Now Playing'}</div>
        <ServerDeck
          sources={sources}
          selected={srcIdx}
          visible={uiVisible}
          onSelect={i => { setSrcIdx(i); setLoading(true); }}
        />
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
