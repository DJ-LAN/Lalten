import React from 'react';
import { Link } from 'react-router-dom';
import './ContentWarning.css';

// Shown when the Block R-rated filter is on and a restricted title is opened.
export default function ContentWarning({ title, rating, type = 'movie', onProceed }) {
  const label = type === 'tv' ? 'series' : 'movie';
  return (
    <div className="cw-page" role="dialog" aria-modal="true" aria-labelledby="cw-title">
      <div className="cw-card">
        <div className="cw-shield" aria-hidden="true">⚠</div>
        <div className="cw-badge">{rating || 'RESTRICTED'}</div>
        <h1 className="cw-title" id="cw-title">This {label} is rated {rating || 'restricted'}.</h1>
        <p className="cw-name">“{title}”</p>
        <p className="cw-body">
          LANTERN's R-rated filter is on. This title is not intended for everyone
          in the room tonight, so playback is paused until you choose to continue.
        </p>
        <div className="cw-actions">
          <Link to="/" className="cw-back">Take me back</Link>
          <button type="button" className="cw-proceed" onClick={onProceed}>
            I understand — continue
          </button>
        </div>
        <p className="cw-hint">You can turn the filter off any time in Settings.</p>
      </div>
    </div>
  );
}
