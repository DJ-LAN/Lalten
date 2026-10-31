import React, { useEffect, useState } from 'react';
import './RotatingTagline.css';

const DEFAULT_INTERVAL = 7500;

/**
 * A big section headline that picks a random line on every visit and quietly
 * swaps to another one every few seconds. Lines may use "|" to force a line
 * break: "Lights off,|story on."
 *
 * Respects prefers-reduced-motion by holding the first line still.
 */
export default function RotatingTagline({
  lines = [],
  className = '',
  as: Tag = 'h1',
  interval = DEFAULT_INTERVAL,
}) {
  const [index, setIndex] = useState(() =>
    lines.length ? Math.floor(Math.random() * lines.length) : 0
  );

  useEffect(() => {
    if (lines.length < 2) return undefined;
    if (typeof window === 'undefined') return undefined;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduced) return undefined;

    let timer;

    // Re-schedule each swap so the rhythm feels alive, not like a metronome.
    const schedule = () => {
      const wait = interval + Math.floor(Math.random() * 3500);
      timer = setTimeout(() => {
        setIndex(prev => {
          if (lines.length < 2) return prev;
          let next = prev;
          // Never repeat the line that is already on screen.
          while (next === prev) next = Math.floor(Math.random() * lines.length);
          return next;
        });
        schedule();
      }, wait);
    };

    schedule();
    return () => clearTimeout(timer);
  }, [lines, interval]);

  if (!lines.length) return null;

  const text = lines[index] ?? lines[0];
  const parts = String(text).split('|');

  return (
    <Tag className={`rotating-tagline ${className}`.trim()}>
      <span key={index} className="rotating-tagline-inner">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {part}
          </React.Fragment>
        ))}
      </span>
    </Tag>
  );
}
