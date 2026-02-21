import { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { MediaPlayer, MediaPlayerClass } from 'dashjs';
import { useJellyfinStore } from '../store/jellyfinStore';

interface DashPlayerProps {
  source: string; // The .mpd URL
  options?: Plyr.Options;
  onTimeUpdate?: (currentTime: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onSeeked?: (currentTime: number) => void;
  initialTime?: number;
  isHost?: boolean;
}

export function DashPlayer({ source, options, onTimeUpdate, onPlay, onPause, onSeeked, initialTime, isHost }: DashPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const dashRef = useRef<MediaPlayerClass | null>(null);
  const { accessToken } = useJellyfinStore();

  useEffect(() => {
    if (!videoRef.current || !source) return;

    // Initialize Dash.js
    const dash = MediaPlayer().create();
    dashRef.current = dash;

    // Configure Dash.js for Jellyfin auth if token exists
    if (accessToken) {
      dash.extend("RequestModifier", function () {
        return {
          modifyRequestHeader: function (xhr: XMLHttpRequest) {
            xhr.setRequestHeader('X-Emby-Token', accessToken);
            return xhr;
          },
          modifyRequestURL: function (url: string) {
            return url;
          }
        };
      }, true);
    }

    dash.initialize(videoRef.current, source, true);

    // Initialize Plyr
    const plyr = new Plyr(videoRef.current, {
      ...options,
      controls: options?.controls || [
        'play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
      ],
      settings: options?.settings || ['captions', 'quality', 'speed', 'audio'],
    });
    playerRef.current = plyr;

    // Expose Plyr to window for debugging
    (window as any).plyr = plyr;

    // Handle events
    plyr.on('timeupdate', () => onTimeUpdate?.(plyr.currentTime));
    plyr.on('play', () => onPlay?.());
    plyr.on('pause', () => onPause?.());
    plyr.on('seeked', () => onSeeked?.(plyr.currentTime));

    // Handle initial time
    if (initialTime && initialTime > 0) {
      dash.seek(initialTime);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      if (dashRef.current) {
        dashRef.current.reset();
      }
    };
  }, [source, accessToken]);

  // Sync effect: If initialTime changes significantly (from remote), seek
  useEffect(() => {
    if (playerRef.current && initialTime !== undefined && !isHost) {
      const diff = Math.abs(playerRef.current.currentTime - initialTime);
      if (diff > 2) {
        console.log(`Syncing: Seeking to ${initialTime}`);
        playerRef.current.currentTime = initialTime;
      }
    }
  }, [initialTime, isHost]);

  return (
    <div className="w-full h-full">
      <video
        ref={videoRef}
        className="plyr-react plyr"
        crossOrigin="anonymous"
        playsInline
      />
    </div>
  );
}

