import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { createRoom, joinRoomByCode, leaveRoom, deleteRoom } from '../hooks/useRoomPresence';
import { Play, Plus, Hash, Users, Trash2, Copy, Check, LogOut, X, Tv, Globe, ShieldCheck, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { copyToClipboard } from '../utils/clipboard';
import { MediaInterface } from '../types';

export function Rooms() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [myRooms, setMyRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const [joining, setJoining] = useState(false);
    const [creating, setCreating] = useState(false);

    // Media picker for create
    const [allMedia, setAllMedia] = useState<MediaInterface[]>([]);
    const [selectedMedia, setSelectedMedia] = useState<MediaInterface | null>(null);
    const [mediaSearch, setMediaSearch] = useState('');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
        loadMedia();
        fetchRooms();

        // Realtime subscription for room changes
        const channel = supabase
            .channel('rooms-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => fetchRooms())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants' }, () => fetchRooms())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const loadMedia = () => {
        try {
            const movies = JSON.parse(localStorage.getItem('streamparty_synced_movies') || '[]');
            const series = JSON.parse(localStorage.getItem('streamparty_synced_series') || '[]');
            setAllMedia([...movies, ...series]);
        } catch (_) { }
    };

    const fetchRooms = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        // 1. Get rooms where user is participant
        const { data: participations } = await supabase
            .from('room_participants')
            .select('room_id')
            .eq('user_id', user.id);
        const myRoomIds = participations ? participations.map(p => p.room_id) : [];

        // 2. Get friends
        const { data: friendships } = await supabase
            .from('friendships')
            .select('requester_id, addressee_id')
            .eq('status', 'accepted')
            .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
        const friendIds = friendships
            ? friendships.map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id)
            : [];

        // 3. Fetch all active rooms and filter
        const { data: allRooms } = await supabase
            .from('rooms')
            .select('*, room_participants(count)')
            .order('created_at', { ascending: false });

        const visibleRooms = (allRooms || []).filter(room => {
            if (myRoomIds.includes(room.id)) return true;
            if (room.visibility === 'public') return true;
            if (room.visibility === 'friends' && friendIds.includes(room.host_id)) return true;
            return false;
        });

        setMyRooms(visibleRooms);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!selectedMedia) return;
        setCreating(true);
        try {
            // For series, get the first episode ID
            let mediaId = selectedMedia.id;
            if (selectedMedia.type === 'tv' && selectedMedia.seasons?.length) {
                const firstSeason = selectedMedia.seasons[0];
                if (firstSeason.episodes?.length) {
                    mediaId = firstSeason.episodes[0].id;
                }
            }

            const room = await createRoom(mediaId, selectedMedia.title, selectedMedia.posterUrl, visibility);
            setShowCreate(false);
            setSelectedMedia(null);
            setVisibility('public');
            navigate(`/watch/${mediaId}?room=${room.code}`);
        } catch (err: any) {
            alert('Error creating room: ' + err.message);
        }
        setCreating(false);
    };

    const handleJoin = async () => {
        if (!joinCode.trim()) return;
        setJoining(true);
        setJoinError('');
        try {
            const room = await joinRoomByCode(joinCode.trim());
            setShowJoin(false);
            setJoinCode('');
            navigate(`/watch/${room.media_id}?room=${room.code}`);
        } catch (err: any) {
            setJoinError(err.message || 'Room not found');
        }
        setJoining(false);
    };

    const handleLeave = async (roomId: string) => {
        await leaveRoom(roomId);
        fetchRooms();
    };

    const handleDelete = async (roomId: string) => {
        if (!confirm('Are you sure you want to delete this room?')) return;
        await deleteRoom(roomId);
        fetchRooms();
    };

    const handleCopyCode = async (code: string) => {
        const success = await copyToClipboard(code);
        if (success) {
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 2000);
        }
    };

    const filteredMedia = allMedia.filter(m =>
        m.title.toLowerCase().includes(mediaSearch.toLowerCase())
    ).slice(0, 20);

    return (
        <div className="p-6 md:p-12 pb-24 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold mb-2">Rooms</h1>
                    <p className="text-gray-400 text-sm">Create or join watch party rooms to watch together</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setShowJoin(true)} variant="secondary" className="rounded-full gap-2">
                        <Hash className="w-4 h-4" />
                        Join with Code
                    </Button>
                    <Button onClick={() => setShowCreate(true)} className="rounded-full gap-2">
                        <Plus className="w-4 h-4" />
                        Create Room
                    </Button>
                </div>
            </div>

            {/* Rooms Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-white/10 border-t-green-500 rounded-full animate-spin" />
                </div>
            ) : myRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                        <Tv className="w-10 h-10 text-gray-600" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">No rooms yet</h2>
                    <p className="text-gray-500 max-w-sm mb-6">Create a room to start watching with friends, or join one with a code.</p>
                    <div className="flex gap-3">
                        <Button onClick={() => setShowJoin(true)} variant="secondary" className="rounded-full gap-2">
                            <Hash className="w-4 h-4" /> Join Room
                        </Button>
                        <Button onClick={() => setShowCreate(true)} className="rounded-full gap-2">
                            <Plus className="w-4 h-4" /> Create Room
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myRooms.map((room, i) => (
                        <motion.div
                            key={room.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all group"
                        >
                            {/* Poster Banner */}
                            <div className="h-32 w-full relative overflow-hidden bg-gradient-to-br from-green-900/20 to-blue-900/20">
                                {room.media_poster && (
                                    <img src={room.media_poster} alt="" className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] to-transparent" />
                                <div className="absolute top-3 right-3">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/20 text-green-400 border border-green-500/30">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                        Live
                                    </span>
                                </div>
                            </div>

                            <div className="p-5">
                                <h3 className="font-bold text-white text-lg mb-1 truncate">{room.media_title || 'Watch Party'}</h3>

                                {/* Room Code */}
                                <button
                                    onClick={() => handleCopyCode(room.code)}
                                    className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
                                >
                                    <Hash className="w-3.5 h-3.5 text-green-400" />
                                    <span className="font-mono font-bold tracking-widest text-green-400">{room.code}</span>
                                    {copiedCode === room.code ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                                </button>

                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>{room.room_participants?.[0]?.count || 1} participant{(room.room_participants?.[0]?.count || 1) !== 1 ? 's' : ''}</span>
                                    {room.host_id === user?.id && (
                                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold uppercase">Host</span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="flex-1 text-xs rounded-lg gap-1"
                                        onClick={() => navigate(`/watch/${room.media_id}?room=${room.code}`)}
                                    >
                                        <Play className="w-3.5 h-3.5 fill-current" /> Enter
                                    </Button>
                                    {room.host_id === user?.id ? (
                                        <button
                                            onClick={() => handleDelete(room.id)}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleLeave(room.id)}
                                            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Join Room Modal */}
            <AnimatePresence>
                {showJoin && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowJoin(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-[#121212] rounded-2xl p-6 border border-white/10">
                            <button onClick={() => setShowJoin(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-gray-500"><X className="w-5 h-5" /></button>
                            <h2 className="text-xl font-bold mb-2">Join a Room</h2>
                            <p className="text-sm text-gray-400 mb-6">Enter the 6-character room code</p>
                            <input
                                type="text"
                                maxLength={6}
                                value={joinCode}
                                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                                placeholder="ABC123"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-center text-2xl font-mono font-bold tracking-[0.5em] text-white focus:outline-none focus:border-green-500 transition-colors uppercase"
                                autoFocus
                            />
                            {joinError && <p className="text-red-400 text-sm mt-2 text-center">{joinError}</p>}
                            <Button onClick={handleJoin} disabled={joining || joinCode.length < 4} className="w-full mt-4 py-3 rounded-xl">
                                {joining ? 'Joining...' : 'Join Room'}
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Room Modal */}
            <AnimatePresence>
                {showCreate && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-[#121212] rounded-2xl p-6 border border-white/10 max-h-[80vh] flex flex-col">
                            <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-gray-500"><X className="w-5 h-5" /></button>
                            <h2 className="text-xl font-bold mb-2">Create a Room</h2>
                            <p className="text-sm text-gray-400 mb-4">Pick what you want to watch</p>

                            <input
                                type="text"
                                value={mediaSearch}
                                onChange={e => setMediaSearch(e.target.value)}
                                placeholder="Search movies or series..."
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white mb-4 focus:outline-none focus:border-green-500"
                            />

                            <div className="flex-1 overflow-y-auto space-y-2 mb-4 custom-scrollbar max-h-[40vh]">
                                {filteredMedia.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-8">No media found. Sync your server first.</p>
                                ) : filteredMedia.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setSelectedMedia(m)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${selectedMedia?.id === m.id ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}
                                    >
                                        <img src={m.posterUrl} alt="" className="w-10 h-14 rounded object-cover flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-white truncate">{m.title}</p>
                                            <p className="text-xs text-gray-500">{m.type === 'tv' ? 'TV Show' : 'Movie'} • {m.year}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Visibility Selector */}
                            <div className="mb-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Room Privacy</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'public' as const, label: 'Public', icon: Globe, desc: 'Anyone with code' },
                                        { value: 'friends' as const, label: 'Friends', icon: ShieldCheck, desc: 'Only my friends' },
                                        { value: 'private' as const, label: 'Private', icon: Lock, desc: 'Invite only' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setVisibility(opt.value)}
                                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${visibility === opt.value
                                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            <opt.icon className="w-5 h-5" />
                                            <span className="text-xs font-bold">{opt.label}</span>
                                            <span className="text-[9px] text-gray-500">{opt.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={handleCreate} disabled={!selectedMedia || creating} className="w-full py-3 rounded-xl">
                                {creating ? 'Creating...' : selectedMedia ? `Create Room — ${selectedMedia.title}` : 'Select media to continue'}
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
