import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
  status: 'online' | 'watching' | 'busy' | 'offline';
  current_activity?: {
    media_id: string;
    media_title: string;
    progress: number;
    timestamp: number;
  };
}

export const authService = {
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
};

export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  async updateStatus(userId: string, status: UserProfile['status'], activity?: UserProfile['current_activity']) {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        status, 
        current_activity: activity,
        last_seen: new Date().toISOString()
      })
      .eq('id', userId);
    return { error };
  },

  subscribeToFriendsStatus(friendIds: string[], callback: (payload: any) => void) {
    return supabase
      .channel('friends-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=in.(${friendIds.join(',')})`,
        },
        callback
      )
      .subscribe();
  },
};

export const watchPartyService = {
  createRoom(hostId: string, mediaId: string) {
    return supabase
      .from('watch_parties')
      .insert({
        host_id: hostId,
        media_id: mediaId,
        status: 'active',
        current_time: 0,
        is_playing: false,
      })
      .select()
      .single();
  },

  subscribeToRoom(roomId: string, onSync: (payload: any) => void) {
    return supabase
      .channel(`room:${roomId}`)
      .on(
        'broadcast',
        { event: 'sync' },
        (payload) => onSync(payload)
      )
      .subscribe();
  },

  broadcastSync(roomId: string, time: number, isPlaying: boolean) {
    return supabase
      .channel(`room:${roomId}`)
      .send({
        type: 'broadcast',
        event: 'sync',
        payload: { time, isPlaying, timestamp: Date.now() },
      });
  },
};
