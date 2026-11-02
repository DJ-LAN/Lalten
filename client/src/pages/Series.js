import React from 'react';
import ShelfPage from './ShelfPage';
import { api } from '../utils/api';
import { LANTERN_ASKS } from '../utils/taglines';

const load = () => api.series();

const copy = {
  emoji: '📺',
  errorTitle: 'The series shelf is buffering',
  loading: 'QUEUEING THE NEXT EPISODE...',
  eyebrow: 'LANTERN SERIES',
  taglines: [
    'Just one more,|then we’ll stop.',
    'One episode,|then sleep. Maybe.',
    'Cliffhangers,|warm blankets.',
    'Next episode,|still loading.',
    'Binge gently,|glow loudly.',
	'Monkey watch Peak,|Monkey Approves!',
    'A slow night,|a long story.',
    'Chapters turn,|hours vanish.',
    'Press play,|cancel tomorrow.',
    'One season,|then we’ll talk.',
    'Small screen,|endless evenings.',
    // Heist, heroes and Hindi dubs
    'The Professor says:|one more episode.',
    'Red jumpsuits,|blue Mondays.',
	'Monkey fights,|Monkey world domination!',
	'Spoiler:,|Peak Incoming.',
    'Plan the heist,|order the snacks.',
    'Bella ciao,|bedtime bye.',
    'Team assemble...|avoid the spoilers.',
    'Previously on...|the five minutes you forgot.',
    'Season finale,|emotional damage.',
    'Cliffhanger,|again? Clever.',
    'Rudy enters,|chaos follows.',
    'Hindi dub,|full nostalgia.',
    'KAAJU|UNIVERSSS....!',
	'Fees Lauta do hamari|Warna APP Delete!!',
	'GussaSeth|was here!!!',
    'Ek episode,|phir pakka band!.',
    'Binge mode,|do not disturb.',
    'Next episode|loads in 3... 2...',
    'One season,|two brothers, zero agreement.',
    ...LANTERN_ASKS,
  ],
  sub: 'Binge-worthy dramas, Indian web series, anime and the newest drops on '
     + 'every OTT. Pick a shelf, or let the lantern choose your next obsession.',
  badges: ['Just Lit', 'Web Series', 'Anime', 'K-Drama', 'Top Rated'],
  note: 'Curated from TMDB popularity, ratings and genres. "Just Lit" shelves show the newest series on each platform in India.',
};

export default function Series() {
  return <ShelfPage load={load} copy={copy} />;
}
