import React, { useState, useEffect } from 'react';
import './Settings.css';

const ACCENTS = [
  { name: 'Standard Green (Default)', value: '#46d369' },
  { name: 'Jade Green',               value: '#00b86b' },
  { name: 'Sky Blue',                 value: '#0779FF' },
  { name: 'Netflix Red',              value: '#e50914' },
  { name: 'Gold',                     value: '#f5a623' },
  { name: 'Purple',                   value: '#9b59b6' },
];
const BGS = [
  { name: 'Pure Black (Default)', value: '#000000' },
  { name: 'Dark Gray',            value: '#0a0a0a' },
  { name: 'Dark Blue-Black',      value: '#050a18' },
  { name: 'Dark Green-Black',     value: '#030d08' },
];

export default function Settings() {
  const [accent, setAccent]           = useState(localStorage.getItem('ln_accent') || '#46d369');
  const [bg, setBg]                   = useState(localStorage.getItem('ln_bg') || '#000000');
  const [customAccent, setCustomAccent] = useState(localStorage.getItem('ln_custom_accent') || '');
  const [apiKey, setApiKey]           = useState(localStorage.getItem('ln_apikey') || '');
  const [showKey, setShowKey]         = useState(false);
  const [apiStatus, setApiStatus]     = useState(null);
  const [colorSaved, setColorSaved]   = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(localStorage.getItem('ln_video') !== 'false');

  useEffect(() => {
    const a = localStorage.getItem('ln_accent');
    const b = localStorage.getItem('ln_bg');
    if (a) applyAccent(a);
    if (b) document.documentElement.style.setProperty('--bg', b);
  }, []);

  const applyAccent = val => {
    document.documentElement.style.setProperty('--accent', val);
    document.documentElement.style.setProperty('--accent-dim', val + '26');
    document.documentElement.style.setProperty('--accent-glow', val + '4D');
  };

  const saveColors = () => {
    applyAccent(accent);
    document.documentElement.style.setProperty('--bg', bg);
    localStorage.setItem('ln_accent', accent);
    localStorage.setItem('ln_bg', bg);
    setColorSaved(true);
    setTimeout(() => setColorSaved(false), 2200);
  };

  const resetColors = () => {
    ['--accent','--accent-dim','--accent-glow','--bg'].forEach(v => document.documentElement.style.removeProperty(v));
    ['ln_accent','ln_bg'].forEach(k => localStorage.removeItem(k));
    setAccent('#46d369'); setBg('#000000');
  };

  const testApiKey = async () => {
    const k = apiKey.trim();
    if (!k) return;
    setApiStatus('testing');
    try {
      const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${k}`);
      if (res.ok) {
        localStorage.setItem('ln_apikey', k);
        await fetch('/api/set-key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: k }) }).catch(() => {});
        setApiStatus('ok');
      } else setApiStatus('fail');
    } catch { setApiStatus('fail'); }
    setTimeout(() => setApiStatus(null), 4000);
  };

  const toggleVideo = () => {
    const next = !videoEnabled;
    setVideoEnabled(next);
    localStorage.setItem('ln_video', String(next));
  };

  return (
    <div className="sp page">
      <div className="sp-inner">
        <h1 className="sp-h1">Settings</h1>
        <p className="sp-sub">Customise your LANTERN experience.</p>

        {/* API KEY */}
        <div className="sp-section">
          <h2 className="sp-stitle">TMDB API Key</h2>
          <p className="sp-hint">Powers all metadata. Get a free key at <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">themoviedb.org</a></p>
          <div className="sp-key-row">
            <input type={showKey ? 'text' : 'password'} className="sp-key-input" value={apiKey}
              onChange={e => setApiKey(e.target.value)} placeholder="Paste your TMDB API key" autoComplete="off" />
            <button className="sp-key-toggle" onClick={() => setShowKey(v => !v)}>{showKey ? '🙈' : '👁'}</button>
            <button className={`sp-key-btn ${apiStatus==='ok'?'ok':apiStatus==='fail'?'fail':''}`}
              onClick={testApiKey} disabled={apiStatus==='testing'}>
              {apiStatus==='testing'?'...':apiStatus==='ok'?'✓ Saved':apiStatus==='fail'?'✗ Invalid':'Test & Save'}
            </button>
          </div>
          {apiStatus==='ok'   && <p className="sp-key-msg ok">Key valid and saved!</p>}
          {apiStatus==='fail' && <p className="sp-key-msg fail">Invalid key — check and try again.</p>}
        </div>

        {/* VIDEO TOGGLE */}
        <div className="sp-section">
          <h2 className="sp-stitle">Video Playback</h2>
          <div className="sp-toggle-row">
            <div>
              <p className="sp-toggle-label">Enable embed player</p>
              <p className="sp-hint" style={{marginBottom:0}}>When off, Play opens the detail page instead of launching the stream.</p>
            </div>
            <button className={`sp-toggle ${videoEnabled?'on':'off'}`} onClick={toggleVideo}>
              <span className="sp-toggle-knob" />
            </button>
          </div>
          <p className="sp-toggle-status">Playback is <strong style={{color:videoEnabled?'var(--accent)':'#e74c3c'}}>{videoEnabled?'enabled':'disabled'}</strong>.</p>
        </div>

        {/* ACCENT */}
        <div className="sp-section">
          <h2 className="sp-stitle">Accent Color</h2>
          <div className="sp-colors">
            {ACCENTS.map(c => (
              <button key={c.value} className={`sp-color ${accent===c.value?'sel':''}`}
                onClick={() => setAccent(c.value)} style={{'--sw':c.value}}>
                <span className="sp-swatch" />
                <span className="sp-cname">{c.name}</span>
                {accent===c.value && <span style={{color:c.value,fontWeight:700}}>✓</span>}
              </button>
            ))}
            <div className="sp-color custom" style={{'--sw': customAccent || '#333'}}>
              <input
                type="color"
                value={customAccent || '#0779FF'}
                onChange={e => {
                  const val = e.target.value;
                  setCustomAccent(val);
                  localStorage.setItem('ln_custom_accent', val);
                  setAccent(val);
                }}
                className="sp-custom-color-input"
                title="Custom color"
              />
              <span className="sp-cname">Custom</span>
              {accent===customAccent && customAccent && <span style={{color:customAccent,fontWeight:700}}>✓</span>}
            </div>
          </div>
        </div>

        {/* BACKGROUND */}
        <div className="sp-section">
          <h2 className="sp-stitle">Background Color</h2>
          <div className="sp-colors">
            {BGS.map(c => (
              <button key={c.value} className={`sp-color ${bg===c.value?'sel':''}`}
                onClick={() => setBg(c.value)} style={{'--sw':c.value}}>
                <span className="sp-swatch" style={{border:'1px solid #333'}} />
                <span className="sp-cname">{c.name}</span>
                {bg===c.value && <span style={{color:'var(--accent)',fontWeight:700}}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* PREVIEW */}
        <div className="sp-section">
          <h2 className="sp-stitle">Preview</h2>
          <div className="sp-preview" style={{background:bg}}>
            <div className="sp-prev-pill" style={{background:accent}}>L.A.N.T.E.R.N.</div>
            <div className="sp-prev-card" style={{background:accent+'22',border:`1px solid ${accent}44`}}>Sample Card</div>
          </div>
        </div>

        <div className="sp-actions">
          <button className="sp-apply" onClick={saveColors}>{colorSaved?'✓ Applied!':'Apply Theme'}</button>
          <button className="sp-reset" onClick={resetColors}>Reset to Default</button>
        </div>

        {/* ABOUT */}
        <div className="sp-section">
          <h2 className="sp-stitle">About</h2>
          <div className="sp-about">
            <p><strong>LANTERN</strong> — Local Area Network Television, Every Room Now</p>
            <p>Metadata by <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer">TMDB</a>. Playback via third-party embed services.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
