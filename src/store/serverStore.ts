import { create } from 'zustand';

interface ServerConfig {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  type: 'jellyfin' | 'plex';
}

interface ServerState {
  servers: ServerConfig[];
  activeServerId: string | null;
  addServer: (server: ServerConfig) => void;
  removeServer: (id: string) => void;
  setActiveServer: (id: string) => void;
  updateServer: (id: string, updates: Partial<ServerConfig>) => void;
}

export const useServerStore = create<ServerState>((set) => ({
  servers: [],
  activeServerId: null,
  addServer: (server) => set((state) => ({ 
    servers: [...state.servers, server],
    activeServerId: state.activeServerId || server.id 
  })),
  removeServer: (id) => set((state) => ({ 
    servers: state.servers.filter((s) => s.id !== id),
    activeServerId: state.activeServerId === id ? null : state.activeServerId
  })),
  setActiveServer: (id) => set({ activeServerId: id }),
  updateServer: (id, updates) => set((state) => ({
    servers: state.servers.map((s) => s.id === id ? { ...s, ...updates } : s)
  })),
}));
