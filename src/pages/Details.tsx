import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { featuredMedia, trendingMedia } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { Play, Plus, Share2, Clock, Star, ChevronDown } from 'lucide-react';

export function Details() {
  const { id } = useParams();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

  // In a real app, fetch data based on ID
  // For mock, we check both lists
  const savedSynchedMovies = localStorage.getItem('streamparty_synced_movies');
  const synchronizedMovies = savedSynchedMovies ? JSON.parse(savedSynchedMovies) : [];

  const savedSynchedSeries = localStorage.getItem('streamparty_synced_series');
  const synchronizedSeries = savedSynchedSeries ? JSON.parse(savedSynchedSeries) : [];

  let media = [...trendingMedia, featuredMedia, ...synchronizedMovies, ...synchronizedSeries].filter(Boolean).find(m => String(m.id) === String(id));
  if (!media) {
    if (featuredMedia && featuredMedia.id === id) {
      media = featuredMedia;
    } else {
      media = featuredMedia; // Fallback entirely
    }
  }

  if (!media) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold">Media not found</h1>
        <Link to="/" className="text-green-400 mt-4 block">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Backdrop */}
      {media.backdropUrl && (
        <div className="relative h-[60vh] w-full">
          <div className="absolute inset-0">
            <img
              src={media.backdropUrl}
              alt={media.title || "Media Details"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-transparent" />
          </div>
        </div>
      )}

      <div className={`px-6 md:px-12 max-w-7xl mx-auto ${media.backdropUrl ? '-mt-32' : 'mt-12'} relative z-10`}>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="w-48 md:w-64 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl shadow-black/50 mx-auto md:mx-0">
            <img
              src={media.posterUrl}
              alt={media.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 pt-4 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">{media.title}</h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-300 mb-6">
              <span className="text-green-400 font-bold">{media.rating}</span>
              <span>{media.year}</span>
              {media.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {media.duration}
                </span>
              )}
              <div className="flex gap-2">
                {media.genres.map(g => (
                  <span key={g} className="px-2 py-0.5 bg-white/10 rounded text-xs">{g}</span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-8">
              <Link to={`/watch/${media.id}`}>
                <Button size="lg" className="rounded-full px-8 gap-2">
                  <Play className="w-5 h-5 fill-current" />
                  Play
                </Button>
              </Link>
              <Button variant="secondary" className="rounded-full gap-2">
                <Plus className="w-5 h-5" />
                Add to List
              </Button>
              <Button variant="outline" className="rounded-full gap-2">
                <Share2 className="w-5 h-5" />
                Share
              </Button>
            </div>

            <div className="max-w-2xl">
              <h3 className="text-lg font-bold mb-2">Synopsis</h3>
              <p className="text-gray-300 leading-relaxed">{media.description}</p>
            </div>

            {/* Series Logic */}
            {media.type === 'tv' && media.seasons && media.seasons.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Episodes</h3>
                  {media.seasons.length > 0 && (
                    <select
                      className="px-4 py-2 bg-[#1A1A1A] border border-white/5 rounded-lg text-sm hover:bg-white/10 outline-none focus:border-green-500 transition-colors"
                      value={selectedSeasonId || media.seasons[0].id}
                      onChange={(e) => setSelectedSeasonId(e.target.value)}
                    >
                      {media.seasons.map((season) => (
                        <option key={season.id} value={season.id}>
                          {season.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-4">
                  {(() => {
                    const currentSeason = media.seasons!.find(s => s.id === (selectedSeasonId || media.seasons![0].id)) || media.seasons![0];
                    if (!currentSeason || !currentSeason.episodes || currentSeason.episodes.length === 0) {
                      return <p className="text-gray-400 text-sm">No episodes available.</p>;
                    }

                    return currentSeason.episodes.map((ep) => (
                      <Link key={ep.id} to={`/watch/${ep.id}`} className="block">
                        <div className="flex gap-4 p-4 rounded-xl bg-[#1A1A1A] border border-white/5 hover:bg-white/5 transition-colors group cursor-pointer">
                          <div className="w-32 md:w-40 aspect-video rounded-lg overflow-hidden relative flex-shrink-0">
                            <img src={ep.thumbnailUrl} alt={ep.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-8 h-8 text-white fill-current" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 py-1">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-white truncate pr-4">{ep.episodeNumber}. {ep.title}</h4>
                              <span className="text-xs text-gray-400">{ep.duration}</span>
                            </div>
                            <p className="text-sm text-gray-400 line-clamp-2">{ep.description}</p>
                          </div>
                        </div>
                      </Link>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
