import React, { useEffect, useState } from 'react';
import './BackgroundTrailer.css';

const DEFAULT_DELAY = 5000;

/**
 * Netflix-style ambient trailer: waits a few seconds on a detail page,
 * then plays a muted, looping YouTube trailer behind the information.
 * Respects reduced-motion, data-saver, and the Settings toggle.
 */
export default function BackgroundTrailer({ videoKey, enabled = true, delay = DEFAULT_DELAY }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(false);
    if (!videoKey || !enabled) return undefined;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const small = window.matchMedia?.('(max-width: 768px)')?.matches;
    const conn = navigator.connection;
    const saveData = conn?.saveData;
    const slow = /(^|-)2g$/.test(conn?.effectiveType || '');
    if (reduced || small || saveData || slow) return undefined;

    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [videoKey, enabled, delay]);

  if (!videoKey || !show) return null;

  const src = 'https://www.youtube-nocookie.com/embed/' + videoKey
    + '?autoplay=1&mute=1&controls=0&loop=1&playlist=' + videoKey
    + '&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0';

  return (
    <div className="detail-trailer" aria-hidden="true">
      <iframe
        src={src}
        title="Background trailer"
        tabIndex={-1}
        allow="autoplay; encrypted-media"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
