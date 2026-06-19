import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, poster, backdrop } from '../utils/api';
import MediaRow from '../components/MediaRow';
import LightenUp from '../components/LightenUp';
import './DetailPage.css';

export default function MovieDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const videoEnabled = localStorage.getItem('ln_video') !== 'false';

  useEffect(() => { window.scrollTo(0,0); api.movie(id).then(setData).catch(console.error); }, [id]);

  if (!data) return <div className="detail-page"><div className="spinner" /></div>;

  const bg = backdrop(data.backdrop_path);
  const trailer = data.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const cast = data.credits?.cast?.slice(0,14) || [];
  const year = data.release_date?.slice(0,4);
  const runtime = data.runtime ? `${Math.floor(data.runtime/60)}h ${data.runtime%60}m` : null;
  const playTo = videoEnabled ? `/play/movie/${data.id}` : `/movie/${data.id}`;

  const favItem = { id: data.id, isTV: false, title: data.title, posterPath: data.poster_path, year };

  return (
    <div className="detail-page">
      {bg && <div className="detail-bg-wrap"><img src={bg} alt="" className="detail-bg-img" /><div className="detail-bg-ov" /></div>}
      <div className="detail-main">
        {data.poster_path
          ? <img src={poster(data.poster_path,'w500')} alt={data.title} className="detail-poster" />
          : <div className="detail-poster-ph">🎬</div>
        }
        <div className="detail-info fade-up">
          <div className="detail-eyebrow">FILM</div>
          <h1 className="detail-title">{data.title}</h1>
          {data.tagline && <p className="detail-tagline">"{data.tagline}"</p>}
          <div className="detail-meta">
            {year    && <span className="dbadge">{year}</span>}
            {runtime && <span className="dbadge">{runtime}</span>}
            {data.vote_average > 0 && <span className="dbadge gold">★ {data.vote_average.toFixed(1)}</span>}
            {data.genres?.map(g => <span key={g.id} className="dbadge green">{g.name}</span>)}
          </div>
          <p className="detail-overview">{data.overview}</p>
          <div className="detail-actions">
            <Link to={playTo} className="btn-play">▶ &nbsp; Play</Link>
            {trailer && (
              <a href={`https://youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noreferrer" className="btn-secondary">
                ▷ &nbsp; Trailer
              </a>
            )}
            <LightenUp item={favItem} />
          </div>
          {cast.length > 0 && <>
            <p className="section-label">Cast</p>
            <div className="cast-row">
              {cast.map(c => (
                <div key={c.id} className="cast-item">
                  <div className="cast-av">{c.profile_path ? <img src={poster(c.profile_path,'w185')} alt={c.name} /> : <span>{c.name[0]}</span>}</div>
                  <span className="cast-name">{c.name}</span>
                </div>
              ))}
            </div>
          </>}
        </div>
      </div>
      {data.similar?.results?.length > 0 && (
        <div className="detail-similar">
          <MediaRow title="More Like This" items={data.similar.results} type="movie" />
        </div>
      )}
    </div>
  );
}
