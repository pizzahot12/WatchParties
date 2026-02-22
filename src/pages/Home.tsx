import { useState, useEffect, useMemo } from 'react';
import { featuredMedia, trendingMedia as defaultTrendingMedia } from '../data/mockData';
import { MovieCard } from '../components/MovieCard';
import { Button } from '../components/ui/Button';
import { Play, Info, ChevronRight, Server, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { eventBus } from '../utils/events';
import { MediaInterface } from '../types';

type CategoryFilter = 'all' | 'movies' | 'tv-shows';

export function Home() {
  const [movies, setMovies] = useState<MediaInterface[]>([]);
  const [series, setSeries] = useState<MediaInterface[]>([]);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const location = useLocation();

  useEffect(() => {
    // Load saved data
    const savedMovies = localStorage.getItem('streamparty_synced_movies');
    const savedSeries = localStorage.getItem('streamparty_synced_series');
    if (savedMovies) setMovies(JSON.parse(savedMovies));
    if (savedSeries) setSeries(JSON.parse(savedSeries));

    // Fallback: if no separate storage, load legacy 'synced_movies' and split
    if (!savedMovies && !savedSeries) {
      const legacy = localStorage.getItem('streamparty_synced_movies');
      if (legacy) {
        const all: MediaInterface[] = JSON.parse(legacy);
        setMovies(all.filter(m => m.type === 'movie'));
        setSeries(all.filter(m => m.type === 'tv'));
      }
    }

    const unsubMovies = eventBus.on('movies-synced', (data: MediaInterface[]) => {
      setMovies(data);
    });
    const unsubSeries = eventBus.on('series-synced', (data: MediaInterface[]) => {
      setSeries(data);
    });

    return () => { unsubMovies(); unsubSeries(); };
  }, []);

  // Determine active filter from URL path or state
  useEffect(() => {
    if (location.pathname === '/movies') setActiveFilter('movies');
    else if (location.pathname === '/tv-shows') setActiveFilter('tv-shows');
    else setActiveFilter('all');
  }, [location.pathname]);

  const hasContent = movies.length > 0 || series.length > 0;

  // Pick a random featured item from our library
  const heroItem = useMemo(() => {
    const all = [...movies, ...series];
    if (all.length > 0 && all[0].backdropUrl) return all[0];
    return featuredMedia;
  }, [movies, series]);

  if (!hasContent && !featuredMedia) {
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

  const categories: { label: string; filter: CategoryFilter; path: string }[] = [
    { label: 'All', filter: 'all', path: '/' },
    { label: 'Movies', filter: 'movies', path: '/' },
    { label: 'TV Shows', filter: 'tv-shows', path: '/' },
  ];

  return (
    <div className="pb-20">
      {/* Hero Section */}
      {heroItem && heroItem.backdropUrl && (
        <div className="relative h-[70vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroItem.backdropUrl}
              alt={heroItem.title || "Featured Media"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[#121212]/30 to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full md:w-2/3 lg:w-1/2 z-10">
            <span className="inline-block px-2 py-1 mb-4 text-xs font-bold tracking-wider text-green-400 uppercase bg-green-500/10 border border-green-500/20 rounded">
              {heroItem.type === 'tv' ? 'TV Series' : 'Movie'}
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-4 leading-tight">
              {heroItem.title}
            </h1>
            <p className="text-gray-300 text-sm md:text-base mb-6 line-clamp-3 md:line-clamp-none max-w-xl">
              {heroItem.description}
            </p>

            <div className="flex items-center gap-4">
              <Link to={`/watch/${heroItem.id}`}>
                <Button size="lg" className="gap-2 rounded-full px-8">
                  <Play className="w-5 h-5 fill-current" />
                  Watch Now
                </Button>
              </Link>
              <Link to={`/details/${heroItem.id}`}>
                <Button variant="secondary" size="lg" className="gap-2 rounded-full px-8 bg-white/10 backdrop-blur-md hover:bg-white/20">
                  <Info className="w-5 h-5" />
                  More Info
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="px-6 md:px-12 mt-8 mb-8 overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveFilter(cat.filter)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === cat.filter
                ? 'bg-white text-black'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
            >
              {cat.label}
              {cat.filter === 'movies' && movies.length > 0 && (
                <span className="ml-2 text-xs opacity-60">({movies.length})</span>
              )}
              {cat.filter === 'tv-shows' && series.length > 0 && (
                <span className="ml-2 text-xs opacity-60">({series.length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Movies Section */}
      {(activeFilter === 'all' || activeFilter === 'movies') && movies.length > 0 && (
        <section className="px-6 md:px-12 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold flex items-center gap-3">
              🎬 Movies
              <span className="text-sm font-normal text-gray-500">({movies.length})</span>
            </h2>
            {activeFilter === 'all' && movies.length > 5 && (
              <button
                onClick={() => setActiveFilter('movies')}
                className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
              >
                See All <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {(activeFilter === 'all' ? movies.slice(0, 10) : movies).map((media) => (
              <MovieCard key={media.id} media={media} />
            ))}
          </div>
        </section>
      )}

      {/* TV Shows Section */}
      {(activeFilter === 'all' || activeFilter === 'tv-shows') && series.length > 0 && (
        <section className="px-6 md:px-12 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold flex items-center gap-3">
              📺 TV Shows
              <span className="text-sm font-normal text-gray-500">({series.length})</span>
            </h2>
            {activeFilter === 'all' && series.length > 5 && (
              <button
                onClick={() => setActiveFilter('tv-shows')}
                className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
              >
                See All <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {(activeFilter === 'all' ? series.slice(0, 10) : series).map((media) => (
              <MovieCard key={media.id} media={media} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state per filter */}
      {activeFilter === 'movies' && movies.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg mb-2">No movies synced yet</p>
          <Link to="/servers" className="text-green-400 hover:underline">Connect a server to sync</Link>
        </div>
      )}
      {activeFilter === 'tv-shows' && series.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg mb-2">No TV shows synced yet</p>
          <Link to="/servers" className="text-green-400 hover:underline">Connect a server to sync</Link>
        </div>
      )}
    </div>
  );
}
