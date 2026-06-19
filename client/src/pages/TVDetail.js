import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, poster, backdrop } from '../utils/api';
import MediaRow from '../components/MediaRow';
import LightenUp from '../components/LightenUp';
import './DetailPage.css';

export default function TVDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [selSeason, setSelSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEps, setLoadingEps] = useState(false);
  const videoEnabled = localStorage.getItem('ln_video') !== 'false';

  useEffect(() => {
    window.scrollTo(0,0);
    api.tv(id).then(d => { setData(d); setSelSeason(1); }).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!data) return;
    setLoadingEps(true);
    api.season(id, selSeason)
      .then(s => { setEpisodes(s.episodes || []); setLoadingEps(false); })
      .catch(() => setLoadingEps(false));
  }, [id, data, selSeason]);

  if (!data) return <div className="detail-page"><div className="spinner" /></div>;

  const bg = backdrop(data.backdrop_path);
  const trailer = data.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const cast = data.credits?.cast?.slice(0,14) || [];
  const year = data.first_air_date?.slice(0,4);
  const seasons = (data.seasons || []).filter(s => s.season_number > 0);
  const playTo = (s, e) => videoEnabled ? `/play/tv/${data.id}/${s}/${e}` : `/tv/${data.id}`;

  const favItem = { id: data.id, isTV: true, title: data.name, posterPath: data.poster_path, year };

  return (
    <div className="detail-page">
      {bg && <div className="detail-bg-wrap"><img src={bg} alt="" className="detail-bg-img" /><div className="detail-bg-ov" /></div>}
      <div className="detail-main">
        {data.poster_path
          ? <img src={poster(data.poster_path,'w500')} alt={data.name} className="detail-poster" />
          : <div className="detail-poster-ph">📺</div>
        }
        <div className="detail-info fade-up">
          <div className="detail-eyebrow">SERIES</div>
          <h1 className="detail-title">{data.name}</h1>
          {data.tagline && <p className="detail-tagline">"{data.tagline}"</p>}
          <div className="detail-meta">
            {year && <span className="dbadge">{year}</span>}
            {data.number_of_seasons && <span className="dbadge">{data.number_of_seasons} Season{data.number_of_seasons>1?'s':''}</span>}
            {data.vote_average > 0 && <span className="dbadge gold">★ {data.vote_average.toFixed(1)}</span>}
            {data.status && <span className="dbadge">{data.status}</span>}
            {data.genres?.map(g => <span key={g.id} className="dbadge green">{g.name}</span>)}
          </div>
          <p className="detail-overview">{data.overview}</p>
          <div className="detail-actions">
            <Link to={playTo(1,1)} className="btn-play">▶ &nbsp; Play S1 E1</Link>
            {trailer && (
              <a href={`https://youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noreferrer" className="btn-secondary">
                ▷ &nbsp; Trailer
              </a>
            )}
            <LightenUp item={favItem} />
          </div>
          {seasons.length > 0 && <>
            <p className="section-label">Season</p>
            <div className="season-tabs">
              {seasons.map(s => (
                <button key={s.season_number} className={`stab ${selSeason===s.season_number?'active':''}`}
                  onClick={() => setSelSeason(s.season_number)}>
                  S{s.season_number}
                  {s.episode_count && <span style={{fontSize:10,opacity:0.6,marginLeft:4}}>{s.episode_count}ep</span>}
                </button>
              ))}
            </div>
          </>}
          <p className="section-label">Episodes — Season {selSeason}</p>
          {loadingEps
            ? <div className="spinner" style={{margin:'16px 0',width:28,height:28}} />
            : <div className="ep-list">
                {episodes.map(ep => (
                  <Link key={ep.episode_number} to={playTo(selSeason, ep.episode_number)} className="ep-row">
                    <div className="ep-thumb">
                      {ep.still_path ? <img src={poster(ep.still_path,'w300')} alt="" /> : <div className="ep-thumb-ph">E{ep.episode_number}</div>}
                    </div>
                    <div className="ep-info">
                      <p className="ep-label">Episode {ep.episode_number}</p>
                      <p className="ep-name">{ep.name}</p>
                      {ep.runtime && <span className="ep-time">{ep.runtime}m</span>}
                    </div>
                    <span style={{color:'#444',fontSize:20}}>›</span>
                  </Link>
                ))}
              </div>
          }
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
          <MediaRow title="More Like This" items={data.similar.results} type="tv" />
        </div>
      )}
    </div>
  );
}
