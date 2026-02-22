import { MediaInterface } from '../types';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FC } from 'react';

interface MovieCardProps {
  media: MediaInterface;
  compact?: boolean;
}

export const MovieCard: FC<MovieCardProps> = ({ media, compact = false }) => {
  return (
    <Link to={`/details/${media.id}`}>
      <motion.div
        className="group relative rounded-lg overflow-hidden cursor-pointer bg-gray-900"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ 
          y: -5,
          scale: 1.02,
          transition: { duration: 0.2, ease: "easeOut" }
        }}
      >
        {/* Image Container */}
        <div className={`relative aspect-[2/3] w-full overflow-hidden`}>
          <img
            src={media.posterUrl}
            alt={media.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4">
            <motion.button 
              className="bg-white text-black rounded-full p-3 hover:scale-110 transition-transform"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Play className="w-5 h-5 fill-current" />
            </motion.button>
            <div className="text-center">
              <p className="text-xs font-bold text-green-400 mb-1">{media.rating}</p>
              <p className="text-xs text-gray-300">{media.genres.slice(0, 2).join(' • ')}</p>
            </div>
          </div>
        </div>

        {/* Info (Visible always, but styled minimally) */}
        {!compact && (
          <div className="p-3">
            <h3 className="font-medium text-sm text-white truncate">{media.title}</h3>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-400">{media.year}</span>
              {media.type === 'tv' && (
                <span className="text-[10px] uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded text-gray-300">
                  TV
                </span>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </Link>
  );
}
