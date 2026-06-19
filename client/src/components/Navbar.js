import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef();
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { if (searchOpen) inputRef.current?.focus(); }, [searchOpen]);

  const active = (path) => loc.pathname === path || loc.pathname.startsWith(path + '/');

  const submit = (e) => {
    e.preventDefault();
    if (query.trim()) { navigate(`/search?q=${encodeURIComponent(query.trim())}`); setSearchOpen(false); setQuery(''); }
  };

  return (
    <nav className={`navbar ${scrolled ? 'solid' : ''}`}>
      <div className="nav-inner">
        <Link to="/" className="nav-logo">L.A.N.T.E.R.N.</Link>
        <div className="nav-links">
          <Link to="/"           className={`nav-link ${loc.pathname==='/'?'active':''}`}>Home</Link>
          <Link to="/my-shows"   className={`nav-link ${active('/my-shows')?'active':''}`}>My Shows</Link>
          <Link to="/browse/movie" className={`nav-link ${active('/browse/movie')?'active':''}`}>Movies</Link>
          <Link to="/browse/tv"  className={`nav-link ${active('/browse/tv')?'active':''}`}>Series</Link>
          <Link to="/browse/kids" className={`nav-link ${active('/browse/kids')?'active':''}`}>Kids</Link>
          <Link to="/settings"   className={`nav-link ${active('/settings')?'active':''}`}>Settings</Link>
        </div>
        <div className="nav-right">
          {searchOpen ? (
            <form className="nav-search-form" onSubmit={submit}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{opacity:0.5}}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search titles..." className="nav-search-input" />
              <button type="button" className="nav-close" onClick={()=>setSearchOpen(false)}>✕</button>
            </form>
          ) : (
            <button className="nav-search-btn" onClick={()=>setSearchOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
