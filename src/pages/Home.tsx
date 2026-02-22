import { useState, useEffect } from 'react';
import { featuredMedia, trendingMedia as defaultTrendingMedia } from '../data/mockData';
import { MovieCard } from '../components/MovieCard';
import { Button } from '../components/ui/Button';
import { Play, Info, ChevronRight, Server, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { eventBus } from '../utils/events';
import { MediaInterface } from '../types';

export function Home() {
  const [trendingMedia, setTrendingMedia] = useState<MediaInterface[]>(defaultTrendingMedia);

  useEffect(() => {
    // Check if there are already synced movies in localStorage
    const savedSynchedMovies = localStorage.getItem('streamparty_synced_movies');
    if (savedSynchedMovies) {
      setTrendingMedia(JSON.parse(savedSynchedMovies));
    }

    const unsubsribe = eventBus.on('movies-synced', (movies: MediaInterface[]) => {
      setTrendingMedia(movies);
      localStorage.setItem('streamparty_synced_movies', JSON.stringify(movies));
    });

    return unsubsribe;
  }, []);

  if (!featuredMedia && trendingMedia.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <Server className="w-10 h-10 text-gray-600" />
        </div>
        <h1 className="text-3xl font-display font-bold mb-4">Welcome to StreamParty</h1>
        <p className="text-gray-400 max-w-md mb-8">
          Your library is currently empty. Connect a Jellyfin or Plex server to start watching your favorite content with friends.
        </p>
        <Link to="/servers">
          <Button size="lg" className="gap-2 rounded-full px-8">
            <Plus className="w-5 h-5" />
            Connect Your First Server
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Hero Section */}
      {featuredMedia && featuredMedia.backdropUrl && (
        <div className="relative h-[70vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={featuredMedia.backdropUrl}
              alt={featuredMedia.title || "Featured Media"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[#121212]/30 to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full md:w-2/3 lg:w-1/2 z-10">
            <span className="inline-block px-2 py-1 mb-4 text-xs font-bold tracking-wider text-green-400 uppercase bg-green-500/10 border border-green-500/20 rounded">
              Featured
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-4 leading-tight">
              {featuredMedia.title}
            </h1>
            <p className="text-gray-300 text-sm md:text-base mb-6 line-clamp-3 md:line-clamp-none max-w-xl">
              {featuredMedia.description}
            </p>

            <div className="flex items-center gap-4">
              <Link to={`/watch/${featuredMedia.id}`}>
                <Button size="lg" className="gap-2 rounded-full px-8">
                  <Play className="w-5 h-5 fill-current" />
                  Watch Now
                </Button>
              </Link>
              <Link to={`/details/${featuredMedia.id}`}>
                <Button variant="secondary" size="lg" className="gap-2 rounded-full px-8 bg-white/10 backdrop-blur-md hover:bg-white/20">
                  <Info className="w-5 h-5" />
                  More Info
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="px-6 md:px-12 mt-8 mb-8 overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          {[
            { label: 'All', path: '/' },
            { label: 'Movies', path: '/movies' },
            { label: 'TV Shows', path: '/tv-shows' },
            { label: 'Live', path: '/live' },
            { label: 'My List', path: '/my-list' }
          ].map((cat, i) => (
            <Link
              key={cat.label}
              to={cat.path}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${cat.path === '/'
                ? 'bg-white text-black'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Trending Section */}
      {trendingMedia.length > 0 && (
        <section className="px-6 md:px-12 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold">Trending Now</h2>
            <button className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1">
              See All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {trendingMedia.map((media) => (
              <MovieCard key={media.id} media={media} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
