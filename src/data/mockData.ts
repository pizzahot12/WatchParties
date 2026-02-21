import { MediaInterface, UserInterface, ServerInterface, ChatMessageInterface } from '../types';

// Real data will be fetched from Jellyfin/Plex or Supabase
export const featuredMedia: MediaInterface | null = null;
export const trendingMedia: MediaInterface[] = [];
export const friendsList: UserInterface[] = [];
export const serversList: ServerInterface[] = [];
export const libraryMedia: MediaInterface[] = [];
export const mockChatMessages: ChatMessageInterface[] = [];
