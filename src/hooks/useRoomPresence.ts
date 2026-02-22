import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface RoomParticipant {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
}

export function useRoomPresence(roomId: string | null) {
    const [participants, setParticipants] = useState<RoomParticipant[]>([]);
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!roomId) return;

        const channel = supabase.channel(`room-presence-${roomId}`, {
            config: { presence: { key: 'user_id' } }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const users: RoomParticipant[] = [];
                Object.values(state).forEach((presences: any[]) => {
                    presences.forEach((p) => {
                        if (!users.find(u => u.user_id === p.user_id)) {
                            users.push({
                                user_id: p.user_id,
                                display_name: p.display_name || 'Anonymous',
                                avatar_url: p.avatar_url || null,
                            });
                        }
                    });
                });
                setParticipants(users);
                setCount(users.length);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await channel.track({
                            user_id: user.id,
                            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                            avatar_url: user.user_metadata?.avatar_url || null,
                        });
                    }
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    return { participants, count };
}

// Generate a 6-char room code
export function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// Create a room in Supabase
export async function createRoom(mediaId: string, mediaTitle: string, mediaPoster: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const code = generateRoomCode();

    const { data, error } = await supabase
        .from('rooms')
        .insert({
            code,
            host_id: user.id,
            media_id: mediaId,
            media_title: mediaTitle,
            media_poster: mediaPoster,
        })
        .select()
        .single();

    if (error) throw error;

    // Host joins as participant
    await supabase.from('room_participants').insert({
        room_id: data.id,
        user_id: user.id,
    });

    return data;
}

// Join a room by code
export async function joinRoomByCode(code: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: room, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

    if (error || !room) throw new Error('Room not found. Check your code.');

    // Add as participant
    await supabase.from('room_participants').upsert({
        room_id: room.id,
        user_id: user.id,
    }, { onConflict: 'room_id,user_id' });

    return room;
}

// Leave a room
export async function leaveRoom(roomId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);
}

// Delete a room (host only)
export async function deleteRoom(roomId: string) {
    await supabase.from('rooms').delete().eq('id', roomId);
}

// Kick a user from a room (sends realtime event)
export async function kickUser(roomId: string, userId: string) {
    const channel = supabase.channel(`room-${roomId}`);
    await channel.send({
        type: 'broadcast',
        event: 'kick',
        payload: { userId },
    });

    await supabase.from('room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);
}
