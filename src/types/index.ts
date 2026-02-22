export interface UserInterface {
  id: string;
  username: string;
  avatarUrl: string;
  status: 'online' | 'watching' | 'busy' | 'offline';
  currentActivity?: {
    mediaId: string;
    mediaTitle: string;
    mediaType: 'movie' | 'tv';
    progress?: number; // percentage
  };
}

export interface MediaInterface {
  id: string;
  title: string;
  posterUrl: string;
  backdropUrl: string;
  type: 'movie' | 'tv';
  year: number;
  rating: string; // e.g., "PG-13"
  duration?: string; // e.g., "2h 15m"
  description: string;
  genres: string[];
  streamUrl: string; // URL for the video stream
  // For series
  seasons?: SeasonInterface[];
}

export interface SeasonInterface {
  id: string;
  seasonNumber: number;
  title: string; // e.g., "Season 1"
  episodes: EpisodeInterface[];
}

export interface EpisodeInterface {
  id: string;
  episodeNumber: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  streamUrl: string;
}

export interface ServerInterface {
  id: string;
  name: string;
  type: 'plex' | 'jellyfin';
  status: 'online' | 'offline' | 'connecting';
  url: string;
  userCount: number;
  librarySize: number;
}

export interface ChatMessageInterface {
  id: string;
  userId: string;
  content: string; // Text or emoji/gif code
  timestamp: string;
  type: 'text' | 'emoji' | 'gif' | 'system';
}

export interface RoomInterface {
  id: string;
  hostId: string;
  mediaId: string;
  participants: UserInterface[];
  status: 'playing' | 'paused';
  currentTime: number;
}
