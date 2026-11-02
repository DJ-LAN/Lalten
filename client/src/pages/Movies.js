import React from 'react';
import ShelfPage from './ShelfPage';
import { api } from '../utils/api';
import { LANTERN_ASKS } from '../utils/taglines';

const load = () => api.movies();

const copy = {
  emoji: '🎬',
  errorTitle: 'The movie reel snapped',
  loading: 'THREADING THE PROJECTOR...',
  eyebrow: 'LANTERN MOVIES',
  taglines: [
    'Lights on?,|Liieghts off!.',
    'Nachos ready,|worlds waiting.',
    'One screen,|a thousand lives.',
    'Dim the room,|light the story.',
    'Big screen,|bigger feelings.',
    'Sit back,| ANd Re-laxx.',
    'Two hours,|a whole other life.',
    'Curtain up,|But somewhere else.',
    'Night in,|cinema on.',
	'KAAJU|UNIVERSSS....!',
	'Fees Lauta do hamari|Warna APP Delete!!',
    'Grab a seat,|lose yourself.',
    // Comic-book and arcade energy
    'With great power,|comes great popcorn.',
	'Raja ka beta |Raja nhi banega....',
    'Suit up,|snacks out.',
	'Spoiler:,|Peak Incoming.',
	'Monkey fights,|Monkey world domination!',
	'Best dish award:|Aloo',
    'Post-credits scene?|Not worth that slap.',
    'Flawless victory,|zero snacks left.',
    'Round one,|fight for the remote.',
    'Fatality,|but make it feelings.',
    'Choose your fighter,|choose your film.',
    'Giant robot,|bigger popcorn.',
	'Roses r RED, Voilets r Blue,|CTRL C, CTRL V',
    'Morphin’ time,|movie night.',
    'Kaiju on screen,|cushion on floor.',
    // Hindi picture vibes
    'Hindi picture,|with english subtitles?',
    'Picture shuru,|phone silent.',
    'Ek picture,|do baar?',
    'Bhaisaab!,|ek aur movie?',
    'GussaSeth|was here!!!',
    'Plot twist,|where did the Pepsi Go?.',
    'One screen,|two brothers, zero agreement.',
    ...LANTERN_ASKS,
  ],
  sub: 'Fresh from theatres, all-time greats, Bollywood and beyond — every shelf '
     + 'hand-tuned. Pick a genre, or let the lantern choose tonight’s film.',
  badges: ['In Theatres', 'Bollywood', 'South Indian', 'Top Rated', 'All Genres'],
  note: 'Curated from TMDB popularity, ratings and genres. Theatre listings are for India.',
};

export default function Movies() {
  return <ShelfPage load={load} copy={copy} />;
}
