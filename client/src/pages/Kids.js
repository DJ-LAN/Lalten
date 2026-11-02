import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RotatingTagline from '../components/RotatingTagline';
import ShelfRow from '../components/ShelfRow';
import { api } from '../utils/api';
import { LANTERN_ASKS } from '../utils/taglines';
import './Kids.css';

// A random one greets you on each visit, then swaps every few seconds.
const KIDS_TAGLINES = [
  'Small viewers,|big adventures.',
  'Tiny hands,|Now much bigger',
  'Monkey watch Peak,|Monkey Approves!',
  'Random Text Here!,|I mean what are the chances U get this!',
  'Little lanterns,|big bright worlds.',
  'Warm light,|wild stories.',
  'Snacks ready,|stories glowing.',
  'Small seats,|grand journeys.',
  'Soft glow,|big giggles.',
  'Safe corners,|brave little heroes.',
  'Cartoons first,|bedtime later.',
  // Saturday-morning squad
  'Ten aliens,|one kid, endless trouble.',
  'Hero time,|right after homework.',
  'RayvieDham,|Lives forever!!',
  'Five heroes,|one giant robot.',
  'Spandex squad,|snack attack.',
  'KAAJU|UNIVERSSS....!',
  'Fees Lauta do hamari|Warna APP Delete!!',
  'GussaSeth|was here!!!',
  'Giant hero,|tiny remote.',
  'Kaiju-sized trouble,|snack-sized hero.',
  'Oggy’s House,|= Jack’s chaos.',
  'Cockroaches in the kitchen,|chaos on the couch.',
  'Chalo,|cartoon time!',
  'Papa,|Iss Duniya ka Papa!',
  'ITS,|HERO TIME!',
  'Ek aur episode,|phir so jaate hain.',
  'Web-slinging,|cereal-eating.',
  'Team assemble...|the snacks.',
  'Save the world,|then clean your room.',
  'Cape optional,|courage included.',
  'Mighty heroes,|tiny pyjamas.',
  'Pow! Bam!|Bedtime!!',
  ...LANTERN_ASKS,
];

export default function Kids() {
  const [sections, setSections] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.kids()
      .then(d => setSections(d.sections || []))
      .catch(e => setError(e.message));
  }, []);

  if (error) return (
    <div className="kids page" style={{ textAlign: 'center', padding: '120px 24px' }}>
      <p style={{ fontSize: 46, marginBottom: 12 }}>🧸</p>
      <h2 style={{ fontSize: 22, marginBottom: 8 }}>The kids shelf is napping</h2>
      <p style={{ color: 'var(--text-sub)', fontSize: 14 }}>{error}</p>
    </div>
  );

  if (!sections) return (
    <div className="kids page" style={{ textAlign: 'center' }}>
      <div className="spinner" />
      <p style={{ color: '#333', letterSpacing: 3, fontSize: 11, marginTop: -40 }}>LIGHTING THE KIDS ROOM...</p>
    </div>
  );

  const all = sections.flatMap(s => s.items.map(i => ({ ...i, media_type: i.media_type || s.type })));

  const surprise = () => {
    if (!all.length) return;
    const item = all[Math.floor(Math.random() * all.length)];
    if (item.media_type === 'tv') navigate(`/tv/${item.id}${item.season_number ? `?season=${item.season_number}` : ''}`);
    else navigate(`/movie/${item.id}`);
  };

  return (
    <div className="kids page">
      <header className="kids-header">
        <div className="kids-glow" aria-hidden="true" />
        <p className="kids-eyebrow">LANTERN KIDS</p>
        <RotatingTagline lines={KIDS_TAGLINES} className="kids-title" />
        <p className="kids-sub">
          A calmer corner of LANTERN — G / PG movies and kids TV only, with the
          grown-up stuff left outside. Pick a shelf, or let the lantern choose.
        </p>
        <div className="kids-actions">
          <button className="kids-surprise" onClick={surprise}>✦ Surprise me</button>
          <div className="kids-badges">
            <span>G</span>
            <span>PG</span>
            <span>Kids TV</span>
            <span>No horror / crime</span>
          </div>
        </div>
      </header>

      <div className="kids-rows">
        {sections.filter(s => s.items.length).map(s => (
          <ShelfRow key={s.key} title={s.title} items={s.items} type={s.type} />
        ))}
      </div>

      <p className="kids-note">
        Curated from TMDB age ratings, animation and kids genres. Grown-up genres
        like horror, thriller, crime and war are filtered out.
      </p>
    </div>
  );
}
