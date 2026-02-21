import { featuredMedia, trendingMedia } from '../data/mockData';
import { MovieCard } from '../components/MovieCard';
import { Button } from '../components/ui/Button';
import { Play, Info, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="pb-20">
      {/* Hero Section */}
      <div className="relative h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={featuredMedia.backdropUrl} 
            alt={featuredMedia.title} 
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

      {/* Categories */}
      <div className="px-6 md:px-12 mt-8 mb-8 overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          {[
            { label: 'All', path: '/' },
            { label: 'Movies', path: '/category/movies' },
            { label: 'TV Shows', path: '/category/tv' },
            { label: 'Live', path: '/category/live' },
            { label: 'My List', path: '/category/mylist' }
          ].map((cat, i) => (
            <Link 
              key={cat.label}
              to={cat.path}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                i === 0 
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

      {/* Continue Watching Section (Mock) */}
      <section className="px-6 md:px-12 mb-12">
        <h2 className="text-xl font-display font-bold mb-6">Continue Watching</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div className="relative group cursor-pointer rounded-xl overflow-hidden bg-gray-900 aspect-video">
            <img 
              src="https://image.tmdb.org/t/p/w500/4woSOUD0equAYzvwhWBHIJDCM88.jpg" 
              alt="Fallout" 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
              <div className="bg-white/20 backdrop-blur-md p-3 rounded-full">
                <Play className="w-6 h-6 fill-white text-white" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
              <h3 className="font-medium text-sm">Fallout</h3>
              <p className="text-xs text-gray-400 mb-2">S1:E2 • The Target</p>
              <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[45%]" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
