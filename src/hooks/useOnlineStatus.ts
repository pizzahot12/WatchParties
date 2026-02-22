import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Global hook: tracks the current user's online status in the profiles table.
 * Should be called ONCE at the App level.
 *
 * - Sets is_online=true + last_seen=now on mount
 * - Heartbeats every 30s to keep last_seen fresh
 * - Sets is_online=false on beforeunload / unmount
 */
export function useOnlineStatus() {
    const userIdRef = useRef<string | null>(null);

    useEffect(() => {
        let heartbeat: ReturnType<typeof setInterval> | null = null;

        const goOnline = async (userId: string) => {
            await supabase.from('profiles').update({
                is_online: true,
                last_seen: new Date().toISOString(),
            }).eq('id', userId);
        };

        const goOffline = async (userId: string) => {
            // Use a sync request on beforeunload for reliability
            await supabase.from('profiles').update({
                is_online: false,
                last_seen: new Date().toISOString(),
            }).eq('id', userId);
        };

        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            userIdRef.current = user.id;

            // Mark online immediately
            await goOnline(user.id);

            // Heartbeat: update last_seen every 30s
            heartbeat = setInterval(() => {
                if (userIdRef.current) {
                    supabase.from('profiles').update({
                        is_online: true,
                        last_seen: new Date().toISOString(),
                    }).eq('id', userIdRef.current).then(() => { });
                }
            }, 30_000);
        };

        const handleBeforeUnload = () => {
            if (userIdRef.current) {
                // Best-effort offline: use sendBeacon for reliability
                const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userIdRef.current}`;
                const body = JSON.stringify({ is_online: false, last_seen: new Date().toISOString() });
                navigator.sendBeacon?.(url, new Blob([body], { type: 'application/json' }));
                // Also try the normal way
                goOffline(userIdRef.current);
            }
        };

        const handleVisibilityChange = () => {
            if (!userIdRef.current) return;
            if (document.hidden) {
                goOffline(userIdRef.current);
            } else {
                goOnline(userIdRef.current);
            }
        };

        init();

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (heartbeat) clearInterval(heartbeat);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (userIdRef.current) {
                goOffline(userIdRef.current);
            }
        };
    }, []);
}
