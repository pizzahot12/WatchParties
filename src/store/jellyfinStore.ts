import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface JellyfinState {
  serverUrl: string;
  accessToken: string;
  userId: string;
  setServerUrl: (url: string) => void;
  setAccessToken: (token: string) => void;
  setUserId: (id: string) => void;
  clearConfig: () => void;
}

export const useJellyfinStore = create<JellyfinState>()(
  persist(
    (set) => ({
      serverUrl: '',
      accessToken: '',
      userId: '',
      setServerUrl: (url) => set({ serverUrl: url }),
      setAccessToken: (token) => set({ accessToken: token }),
      setUserId: (id) => set({ userId: id }),
      clearConfig: () => set({ serverUrl: '', accessToken: '', userId: '' }),
    }),
    {
      name: 'jellyfin-storage',
    }
  )
);
