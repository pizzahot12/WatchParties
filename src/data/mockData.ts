import { MediaInterface, UserInterface, ServerInterface, ChatMessageInterface } from '../types';

// BACKEND_INTEGRATION: This file simulates the response from GET /api/media/featured
export const featuredMedia: MediaInterface = {
  id: 'm-1',
  title: 'Dune: Part Two',
  posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
  type: 'movie',
  year: 2024,
  rating: 'PG-13',
  duration: '2h 46m',
  description: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
  genres: ['Sci-Fi', 'Adventure'],
  streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', // Example stream
};

// BACKEND_INTEGRATION: This file simulates the response from GET /api/media/trending
export const trendingMedia: MediaInterface[] = [
  {
    id: 'm-2',
    title: 'Civil War',
    posterUrl: 'https://image.tmdb.org/t/p/w500/sh7Rg8Er3tFcN9BpKIPOMvALgZd.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/z121dSTR7PY9KxKuvwiIFSYW8cf.jpg',
    type: 'movie',
    year: 2024,
    rating: 'R',
    duration: '1h 49m',
    description: "A journey across a dystopian future America, following a team of military-embedded journalists as they race against time to reach DC before rebel factions descend upon the White House.",
    genres: ['Action', 'Thriller'],
    streamUrl: '',
  },
  {
    id: 's-1',
    title: 'Fallout',
    posterUrl: 'https://image.tmdb.org/t/p/w500/4woSOUD0equAYzvwhWBHIJDCM88.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/p1DVEf5449M8BiG4Y6UAdM87uX9.jpg',
    type: 'tv',
    year: 2024,
    rating: 'TV-MA',
    description: "In a future, post-apocalyptic Los Angeles brought about by nuclear decimation, citizens must live in underground bunkers to protect themselves from radiation, mutants and bandits.",
    genres: ['Sci-Fi', 'Drama'],
    streamUrl: '',
    seasons: [
      {
        id: 'sea-1',
        seasonNumber: 1,
        title: 'Season 1',
        episodes: [
          {
            id: 'ep-1',
            episodeNumber: 1,
            title: 'The End',
            description: 'A peaceful dweller of Vault 33 is forced to the surface to find her father.',
            thumbnailUrl: 'https://image.tmdb.org/t/p/w500/p1DVEf5449M8BiG4Y6UAdM87uX9.jpg',
            duration: '1h 14m',
            streamUrl: ''
          },
          {
            id: 'ep-2',
            episodeNumber: 2,
            title: 'The Target',
            description: 'Lucy encounters the harsh reality of the Wasteland.',
            thumbnailUrl: 'https://image.tmdb.org/t/p/w500/p1DVEf5449M8BiG4Y6UAdM87uX9.jpg',
            duration: '1h 05m',
            streamUrl: ''
          }
        ]
      }
    ]
  },
  {
    id: 'm-3',
    title: 'Godzilla x Kong: The New Empire',
    posterUrl: 'https://image.tmdb.org/t/p/w500/tM26baWgQyQuQ8FAnp4c6U3G2O6.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/qrGtVFxaD8c7et0jU2dJvECf62k.jpg',
    type: 'movie',
    year: 2024,
    rating: 'PG-13',
    duration: '1h 55m',
    description: "Following their explosive showdown, Godzilla and Kong must reunite against a colossal undiscovered threat hidden within our world, challenging their very existence – and our own.",
    genres: ['Action', 'Sci-Fi'],
    streamUrl: '',
  },
  {
    id: 'm-4',
    title: 'Kung Fu Panda 4',
    posterUrl: 'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/1XDDXPXGiI8id7MrUxK36ke7gkX.jpg',
    type: 'movie',
    year: 2024,
    rating: 'PG',
    duration: '1h 34m',
    description: "Po is gearing up to become the spiritual leader of his Valley of Peace, but also needs someone to take his place as Dragon Warrior.",
    genres: ['Animation', 'Action'],
    streamUrl: '',
  },
   {
    id: 'm-5',
    title: 'Kingdom of the Planet of the Apes',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/fqv8v6AycXKsivp1T5yKtLbGXce.jpg',
    type: 'movie',
    year: 2024,
    rating: 'PG-13',
    duration: '2h 25m',
    description: "Several generations in the future following Caesar's reign, apes are now the dominant species and live harmoniously while humans have been reduced to living in the shadows.",
    genres: ['Sci-Fi', 'Action'],
    streamUrl: '',
  },
];

// BACKEND_INTEGRATION: This file simulates the response from GET /api/users/friends
export const friendsList: UserInterface[] = [
  {
    id: 'u-2',
    username: 'Sarah Connor',
    avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
    status: 'watching',
    currentActivity: {
      mediaId: 'm-1',
      mediaTitle: 'Dune: Part Two',
      mediaType: 'movie',
      progress: 45
    }
  },
  {
    id: 'u-3',
    username: 'John Wick',
    avatarUrl: 'https://i.pravatar.cc/150?u=john',
    status: 'online',
  },
  {
    id: 'u-4',
    username: 'Ellen Ripley',
    avatarUrl: 'https://i.pravatar.cc/150?u=ellen',
    status: 'busy',
  },
  {
    id: 'u-5',
    username: 'Marty McFly',
    avatarUrl: 'https://i.pravatar.cc/150?u=marty',
    status: 'offline',
  }
];

// BACKEND_INTEGRATION: This file simulates the response from GET /api/servers
export const serversList: ServerInterface[] = [
  {
    id: 'srv-1',
    name: 'Home Plex',
    type: 'plex',
    status: 'online',
    url: 'https://plex.local:32400',
    userCount: 3,
    librarySize: 1240
  },
  {
    id: 'srv-2',
    name: 'Friend Jellyfin',
    type: 'jellyfin',
    status: 'connecting',
    url: 'https://jellyfin.friend.net',
    userCount: 0,
    librarySize: 500
  }
];

// BACKEND_INTEGRATION: This file simulates the response from GET /api/room/:id/messages
export const mockChatMessages: ChatMessageInterface[] = [
  {
    id: 'msg-1',
    userId: 'u-2',
    content: 'This scene is incredible!',
    timestamp: '20:45',
    type: 'text'
  },
  {
    id: 'msg-2',
    userId: 'u-3',
    content: 'Yeah, the cinematography is top notch.',
    timestamp: '20:46',
    type: 'text'
  },
  {
    id: 'msg-3',
    userId: 'u-2',
    content: '🔥',
    timestamp: '20:46',
    type: 'emoji'
  }
];
