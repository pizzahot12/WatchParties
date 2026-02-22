import React, { useState, useEffect, useMemo } from 'react';
import { featuredMedia, trendingMedia as defaultTrendingMedia } from '../data/mockData';
import { MovieCard } from '../components/MovieCard';
import { Button } from '../components/ui/Button';
import { Play, Info, ChevronRight, Server, Plus, X, Clock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { eventBus } from '../utils/events';
import { MediaInterface } from '../types';

type CategoryFilter = 'all' | 'movies' | 'tv-shows';

export function Home() {
  const [movies, setMovies] = useState<MediaInterface[]>([]);
  const [series, setSeries] = useState<MediaInterface[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const location = useLocation();

  useEffect(() => {
    // Load saved data
    const savedMovies = localStorage.getItem('streamparty_synced_movies');
    const savedSeries = localStorage.getItem('streamparty_synced_series');

    if (savedSeries) {
      // New format: separate storage
      if (savedMovies) setMovies(JSON.parse(savedMovies));
      setSeries(JSON.parse(savedSeries));
    } else if (savedMovies) {
      // Legacy format: everything in one array, split by type
      const all: MediaInterface[] = JSON.parse(savedMovies);
      setMovies(all.filter(m => m.type === 'movie'));
      setSeries(all.filter(m => m.type === 'tv'));
    }

    const unsubMovies = eventBus.on('movies-synced', (data: MediaInterface[]) => {
      setMovies(data);
    });
    const unsubSeries = eventBus.on('series-synced', (data: MediaInterface[]) => {
      setSeries(data);
    });

    try {
      setContinueWatching(JSON.parse(localStorage.getItem('streamparty_continue_watching') || '[]'));
    } catch (e) { }

    return () => { unsubMovies(); unsubSeries(); };
  }, []);

  const removeContinueWatching = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = continueWatching.filter(i => i.mediaId !== targetId);
    setContinueWatching(updated);
    localStorage.setItem('streamparty_continue_watching', JSON.stringify(updated));
  };

  // Determine active filter from URL path or state
  useEffect(() => {
    if (location.pathname === '/movies') setActiveFilter('movies');
    else if (location.pathname === '/tv-shows') setActiveFilter('tv-shows');
    else setActiveFilter('all');
  }, [location.pathname]);

  const hasContent = movies.length > 0 || series.length > 0;

  // Pick a random featured item from our library based on active filter
  const heroItem = useMemo(() => {
    let collection = [...movies, ...series];
    if (activeFilter === 'movies') collection = movies;
    else if (activeFilter === 'tv-shows') collection = series;

    // Fallback if the specific category is empty
    if (collection.length === 0) {
      collection = [...movies, ...series];
    }

    if (collection.length > 0) {
      // Find the first item with a valid backdrop
      const withBackdrop = collection.find(m => m.backdropUrl && !m.backdropUrl.includes('picsum'));
      return withBackdrop || collection[0];
    }
    return featuredMedia;
  }, [movies, series, activeFilter]);

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
    { label: 'Movies', filter: 'movies', path: '/movies' },
    { label: 'TV Shows', filter: 'tv-shows', path: '/tv-shows' },
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
            <Link
              key={cat.label}
              to={cat.path}
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
            </Link>
          ))}
        </div>
      </div>

      {/* Continue Watching Section */}
      {activeFilter === 'all' && continueWatching.length > 0 && (
        <section className="px-6 md:px-12 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold flex items-center gap-3">
              <Clock className="w-5 h-5 text-green-500" />
              Continue Watching
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {continueWatching.map((item) => (
              <Link to={`/watch/${item.mediaId}`} key={item.mediaId} className="group relative block bg-[#1A1A1A] rounded-2xl border border-white/5 overflow-hidden transition-all hover:border-white/10 hover:shadow-2xl hover:scale-[1.02]">
                <div className="relative aspect-video">
                  <img src={item.backdropUrl || item.posterUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-90" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-green-500/90 text-black flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                  </div>
                  <button onClick={(e) => removeContinueWatching(e, item.mediaId)} className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all z-10">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="font-bold text-sm mb-1 truncate">{item.title}</p>
                    <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                      <span>Left at {Math.floor(item.currentTime / 60)}m</span>
                      <span>{item.duration ? Math.floor(item.duration / 60) + 'm' : ''}</span>
                    </div>
                    {item.duration > 0 && (
                      <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-green-500 h-full" style={{ width: `${Math.min(100, (item.currentTime / item.duration) * 100)}%` }}></div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
