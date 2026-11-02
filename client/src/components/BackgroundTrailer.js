import React, { useEffect, useRef, useState } from 'react';
import './BackgroundTrailer.css';

const DEFAULT_DELAY = 5000;

function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (window.__lnYouTubeApiPromise) return window.__lnYouTubeApiPromise;

  window.__lnYouTubeApiPromise = new Promise(resolve => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === 'function') previousCallback();
      resolve(window.YT);
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return window.__lnYouTubeApiPromise;
}

/**
 * Netflix-style ambient trailer. It starts muted so browser autoplay policies
 * do not prevent the video itself from playing. If trailer audio is enabled,
 * the first interaction with the page unmutes it at the user's chosen volume.
 */
export default function BackgroundTrailer({
  videoKey,
  enabled = true,
  audioEnabled = true,
  volume = 55,
  delay = DEFAULT_DELAY
}) {
  const [show, setShow] = useState(false);
  const playerHostRef = useRef(null);
  const playerRef = useRef(null);
  const interactedRef = useRef(false);
  const settingsRef = useRef({ audioEnabled, volume });

  useEffect(() => {
    settingsRef.current = { audioEnabled, volume };
    const player = playerRef.current;
    if (!player || !player.setVolume) return;

    player.setVolume(Number(volume));
    if (audioEnabled && interactedRef.current) {
      player.unMute();
      player.playVideo();
    } else {
      player.mute();
    }
  }, [audioEnabled, volume]);

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

  useEffect(() => {
    if (!videoKey || !show || !playerHostRef.current) return undefined;
    let cancelled = false;
    let player;

    loadYouTubeAPI().then(YT => {
      if (cancelled || !playerHostRef.current) return;
      player = new YT.Player(playerHostRef.current, {
        videoId: videoKey,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          loop: 1,
          playlist: videoKey,
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0
        },
        events: {
          onReady: event => {
            playerRef.current = event.target;
            event.target.setVolume(Number(settingsRef.current.volume));
            // Start muted for reliable autoplay. Sound is enabled after a
            // genuine user gesture, as required by modern browsers.
            if (settingsRef.current.audioEnabled && interactedRef.current) {
              event.target.unMute();
            } else {
              event.target.mute();
            }
            event.target.playVideo();
          }
        }
      });
      playerRef.current = player;
    }).catch(() => {});

    const enableAudioAfterInteraction = () => {
      interactedRef.current = true;
      const currentPlayer = playerRef.current;
      if (settingsRef.current.audioEnabled && currentPlayer) {
        currentPlayer.setVolume(Number(settingsRef.current.volume));
        currentPlayer.unMute();
        currentPlayer.playVideo();
      }
    };

    window.addEventListener('pointerdown', enableAudioAfterInteraction, { passive: true });
    window.addEventListener('keydown', enableAudioAfterInteraction);

    return () => {
      cancelled = true;
      window.removeEventListener('pointerdown', enableAudioAfterInteraction);
      window.removeEventListener('keydown', enableAudioAfterInteraction);
      playerRef.current = null;
      if (player && player.destroy) player.destroy();
    };
  }, [videoKey, show]);

  if (!videoKey || !show) return null;

  return (
    <div className="detail-trailer" aria-hidden="true">
      <div className="detail-trailer-player" ref={playerHostRef} />
    </div>
  );
}
