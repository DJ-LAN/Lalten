import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import TVDetail from './pages/TVDetail';
import Player from './pages/Player';
import Search from './pages/Search';
import Browse from './pages/Browse';
import MyShows from './pages/MyShows';
import Settings from './pages/Settings';
import Kids from './pages/Kids';
import Movies from './pages/Movies';
import Series from './pages/Series';

function App() {
  useEffect(() => {
    const a = localStorage.getItem('ln_accent');
    const b = localStorage.getItem('ln_bg');
    if (a) { document.documentElement.style.setProperty('--accent', a); document.documentElement.style.setProperty('--accent-dim', a+'26'); document.documentElement.style.setProperty('--accent-glow', a+'4D'); }
    if (b) document.documentElement.style.setProperty('--bg', b);
  }, []);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"                                element={<Home />} />
        <Route path="/movie/:id"                       element={<MovieDetail />} />
        <Route path="/tv/:id"                          element={<TVDetail />} />
        <Route path="/play/:type/:id"                  element={<Player />} />
        <Route path="/play/:type/:id/:season/:episode" element={<Player />} />
        <Route path="/search"                          element={<Search />} />
        <Route path="/kids"                            element={<Kids />} />
        <Route path="/browse/kids"                     element={<Kids />} />
        <Route path="/movies"                          element={<Movies />} />
        <Route path="/browse/movie"                    element={<Movies />} />
        <Route path="/series"                          element={<Series />} />
        <Route path="/browse/tv"                       element={<Series />} />
        <Route path="/browse/:type"                    element={<Browse />} />
        <Route path="/my-shows"                        element={<MyShows />} />
        <Route path="/settings"                        element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
