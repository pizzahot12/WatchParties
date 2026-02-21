import { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import * as dashjs from 'dashjs';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onTimeUpdate?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  initialTime?: number;
}

export function VideoPlayer({ src, poster, onTimeUpdate, onPlay, onPause, initialTime = 0 }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr>();
  // @ts-ignore
  const dashRef = useRef<dashjs.MediaPlayerClass>();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Cleanup previous instances
    const cleanup = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = undefined;
      }
      if (dashRef.current) {
        dashRef.current.destroy();
        dashRef.current = undefined;
      }
    };

    cleanup();

    const initPlayer = (qualityOptions: number[] = []) => {
      const defaultOptions: Plyr.Options = {
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'mute',
          'volume',
          'captions',
          'settings',
          'pip',
          'airplay',
          'fullscreen',
        ],
        settings: ['captions', 'quality', 'speed', 'loop'],
        quality: {
          default: 720,
          options: qualityOptions.length > 0 ? qualityOptions : [720],
          forced: true,
          onChange: (newQuality: number) => {
            if (dashRef.current) {
              const bitrates = dashRef.current.getBitrateInfoListFor('video');
              const index = bitrates.findIndex(b => b.height === newQuality);
              if (index !== -1) {
                const settings = dashRef.current.getSettings();
                settings.streaming.abr.autoSwitchBitrate.video = false;
                dashRef.current.updateSettings(settings);
                dashRef.current.setQualityFor('video', index);
              }
            }
          },
        },
      };

      playerRef.current = new Plyr(video, defaultOptions);
    };

    try {
      if (src.endsWith('.mpd')) {
        console.log('Initializing DASH player for:', src);
        // @ts-ignore
        const dash = dashjs.MediaPlayer().create();
        dashRef.current = dash;
        
        dash.initialize(video, src, false);

        // Wait for stream initialization to get bitrates
        // @ts-ignore
        dash.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
          // @ts-ignore
          const bitrates = dash.getBitrateInfoListFor('video');
          const qualities = bitrates.map((b: any) => b.height).sort((a: number, b: number) => b - a);
          
          // Initialize Plyr with the extracted qualities
          initPlayer(qualities);
          
          // Handle captions from Dash
          const textTracks = dash.getTracksFor('text');
          // Plyr handles text tracks automatically if they are in the DOM, 
          // but Dash.js adds them dynamically. Plyr might need a refresh or we rely on native behavior.
        });

      } else {
        // Fallback for standard sources
        video.src = src;
        initPlayer();
      }
    } catch (error) {
      console.error('Error initializing player:', error);
    }

    // Sync Events
    const handleTimeUpdate = () => onTimeUpdate?.(video.currentTime);
    const handlePlay = () => onPlay?.();
    const handlePause = () => onPause?.();

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    if (initialTime > 0) {
      video.currentTime = initialTime;
    }

    return () => {
      cleanup();
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [src]);

  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        className="plyr-react plyr"
        poster={poster}
        crossOrigin="anonymous"
        playsInline
      />
      {/* Custom styles to match the blue theme from the screenshot if needed, 
          though Plyr defaults to a similar blue. 
          We override some variables just in case the global CSS interferes. */}
      <style>{`
        .plyr {
          --plyr-color-main: #00b3ff; /* Match the screenshot's blue */
          height: 100%;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
