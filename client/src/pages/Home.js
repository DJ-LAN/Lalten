import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import ShelfRow from '../components/ShelfRow';
import { api, poster } from '../utils/api';
import './Home.css';

async function safe(fn) {
  try { const d = await fn(); return d.results || []; } catch { return []; }
}

// Kids comes back as curated sections rather than a single results list.
async function shelfItems(fn) {
  try {
    const d = await fn();
    if (d.sections) return d.sections.flatMap(s => s.items.map(i => ({ ...i, media_type: i.media_type || s.type })));
    return d.results || [];
  } catch { return []; }
}

function pick(arr, n = 20) { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }

function doorArt(...lists) {
  const seen = new Set();
  const art = [];
  for (const item of lists.flat()) {
    if (!item?.poster_path || seen.has(item.id)) continue;
    seen.add(item.id);
    art.push(item);
    if (art.length === 3) break;
  }
  return art;
}

const MOODS = [
  { label: 'Comedy',      to: '/browse/comedy' },
  { label: 'Action',      to: '/browse/action' },
  { label: 'Horror',      to: '/browse/horror' },
  { label: 'Crime',       to: '/browse/crime' },
  { label: 'Anime',       to: '/browse/anime' },
  { label: 'Indian',      to: '/browse/indian-series' },
  { label: 'Top Rated',   to: '/browse/top-movies' },
  { label: 'In Theatres', to: '/browse/now-playing' },
];

export default function Home() {
  const [sections, setSections] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
  	  safe(() => api.trendingIndia('movie')),
      safe(() => api.trending('all')),
      safe(() => api.nowPlaying()),
      safe(() => api.indianSeries()),
      safe(() => api.anime()),
      safe(() => api.topRated('movie')),
      safe(() => api.newOn('netflix')),
      safe(() => api.netflixIndia()),
      safe(() => api.newOn('hotstar')),
      shelfItems(() => api.kids()),
]).then(r => setSections(r)).catch(e => setError(e.message));
  }, []);

  if (!sections && !error) return (
    <div className="page" style={{ textAlign: 'center' }}>
      <div className="spinner" />
      <p style={{ color: '#333', letterSpacing: 3, fontSize: 11, marginTop: -40 }}>LOADING LANTERN...</p>
    </div>
  );

  if (error) return (
    <div className="page" style={{ textAlign: 'center', padding: '120px 24px' }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>🔦</p>
      <h2 style={{ fontSize: 22, marginBottom: 10 }}>Can't reach the server</h2>
      <p style={{ color: '#aaa', fontSize: 14 }}>Make sure LANTERN is running and your API key is set.</p>
      <p style={{ color: 'var(--accent)', fontSize: 12, marginTop: 12 }}>{error}</p>
      <button onClick={() => navigate('/settings')}
        style={{ marginTop: 20, padding: '10px 24px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--radius)', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
        Open Settings
      </button>
    </div>
  );

  const [indMov, global, nowPlay, indSer, anime, topMov, netflix, netflixIndia, hotstar, kids] = sections;

  const heroItems = pick([...indMov, ...global], 10);
  const all = [...indMov, ...global, ...nowPlay, ...indSer, ...anime, ...topMov, ...netflix, ...netflixIndia, ...hotstar, ...kids];

  const surprise = () => {
    if (!all.length) return;
    const item = all[Math.floor(Math.random() * all.length)];
    const isTV = item.media_type === 'tv' || item.first_air_date;
    navigate(isTV ? `/tv/${item.id}` : `/movie/${item.id}`);
  };

  const doors = [
    {
      to: '/movies',
      num: '01',
      title: 'Movies',
      desc: 'Theatres, Bollywood, South Indian, classics and every mood in between.',
      art: doorArt(nowPlay, topMov, indMov),
      cta: 'Open Movies',
    },
    {
      to: '/series',
      num: '02',
      title: 'Series',
      desc: 'Just-lit OTT drops, Indian web series, anime and very long nights.',
      art: doorArt(netflix, hotstar, indSer),
      cta: 'Open Series',
    },
    {
      to: '/kids',
      num: '03',
      title: 'Kids',
      desc: 'A calmer corner with small heroes, big adventures and no grown-up stuff.',
      art: doorArt(kids),
      cta: 'Open Kids',
    },
  ];

  return (
    <div className="home">
      <Hero items={heroItems} />

      <div className="home-body">
        

        <section className="home-shortlist-head">
          <p className="home-eyebrow">TONIGHT'S SHORTLIST</p>
          <h2 className="home-shortlist-title">Six shelves to start with.</h2>
          <p className="home-shortlist-sub">Everything else is waiting in Movies and Series.</p>
        </section>

        <div className="home-rows">
          <ShelfRow title="Just Lit on Netflix"      items={netflix}         type="tv"    browseType="netflix" />
          <ShelfRow title="New on Netflix India"     items={netflixIndia}    type="tv"    browseType="netflix-india" />

		  
          <section className="home-front">
          <div className="home-glow" aria-hidden="true" />
          <p className="home-eyebrow">THE FRONT PORCH</p>
          <div className="home-front-row">
            <div>
              <h2 className="home-title">Three doors,<br /><span>one lantern.</span></h2>
              <p className="home-sub">
                Home stays short on purpose. Pick a door for the full shelf — Movies,
                Series and Kids each hold far more than this page shows.
              </p>
            </div>
            <button className="home-surprise" onClick={surprise}>✦ Surprise me</button>
          </div>
        </section>

        <section className="home-doors">
          {doors.map(door => (
            <Link key={door.to} to={door.to} className="home-door">
              <div className="home-door-art" aria-hidden="true">
                {door.art.map(item => (
                  <img key={item.id} src={poster(item.poster_path)} alt="" loading="lazy" />
                ))}
              </div>
              <div className="home-door-copy">
                <div className="home-door-top">
                  <span className="home-door-num">{door.num}</span>
                  <h3 className="home-door-title">{door.title}</h3>
                </div>
                <p className="home-door-desc">{door.desc}</p>
                <span className="home-door-cta">{door.cta} <span aria-hidden="true">›</span></span>
              </div>
            </Link>
          ))}
        </section>

        <section className="home-moods" aria-label="Browse by mood">
          <span className="home-moods-label">Jump to a mood</span>
          {MOODS.map(m => (
            <Link key={m.to} to={m.to} className="home-mood">{m.label}</Link>
          ))}
        </section>


          <ShelfRow title="Just Lit on JioHotstar"  items={hotstar}  type="tv"    browseType="hotstar" />
          <ShelfRow title="In Theatres Now"         items={nowPlay}  type="movie" browseType="now-playing" />
          <ShelfRow title="Indian Web Series"       items={indSer}   type="tv"    browseType="indian-series" />
          <ShelfRow title="Anime"                   items={anime}    type="tv"    browseType="anime" />
          <ShelfRow title="Top Rated Movies"        items={topMov}   type="movie" browseType="top-movies" />
        </div>

        <section className="home-rest">
          <div>
            <p className="home-eyebrow">STILL LOOKING?</p>
            <h2 className="home-rest-title">The rest of the lantern is one door away.</h2>
          </div>
          <div className="home-rest-links">
            <Link to="/movies">Movies <span aria-hidden="true">›</span></Link>
            <Link to="/series">Series <span aria-hidden="true">›</span></Link>
            <Link to="/kids">Kids <span aria-hidden="true">›</span></Link>
          </div>
        </section>
      </div>
    </div>
  );
}
