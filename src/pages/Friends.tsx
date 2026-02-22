import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageCircle, Play, UserPlus, UserCheck, UserX, X, Copy, Check, Hash, Clock, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { eventBus } from '../utils/events';

interface FriendProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  friend_code: string;
  is_online: boolean;
  last_seen: string;
}

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  // Joined profile
  profile?: FriendProfile;
}

interface DMMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export function Friends() {
  const [user, setUser] = useState<any>(null);
  const [myProfile, setMyProfile] = useState<FriendProfile | null>(null);
  const [friends, setFriends] = useState<(FriendProfile & { friendshipId: string })[]>([]);
  const [pendingReceived, setPendingReceived] = useState<(FriendProfile & { friendshipId: string })[]>([]);
  const [pendingSent, setPendingSent] = useState<(FriendProfile & { friendshipId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Track which friends are in rooms
  const [friendRooms, setFriendRooms] = useState<Record<string, { code: string; media_title: string; media_id: string }>>({});

  // Add Friend Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [friendCode, setFriendCode] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    // Get own profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setMyProfile(profile);

    await fetchFriendships(user.id);

    // Realtime for friendship changes
    const channel = supabase
      .channel('friendships-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        fetchFriendships(user.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const fetchFriendships = async (userId: string) => {
    setLoading(true);

    // Get all friendships involving this user
    const { data: rows } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (!rows) { setLoading(false); return; }

    const friendIds = new Set<string>();
    rows.forEach(r => {
      if (r.requester_id !== userId) friendIds.add(r.requester_id);
      if (r.addressee_id !== userId) friendIds.add(r.addressee_id);
    });

    // Fetch all relevant profiles
    let profiles: Record<string, FriendProfile> = {};
    if (friendIds.size > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(friendIds));
      if (profs) {
        profs.forEach(p => { profiles[p.id] = p; });
      }
    }

    const accepted: (FriendProfile & { friendshipId: string })[] = [];
    const pendingIn: (FriendProfile & { friendshipId: string })[] = [];
    const pendingOut: (FriendProfile & { friendshipId: string })[] = [];

    rows.forEach(r => {
      const otherId = r.requester_id === userId ? r.addressee_id : r.requester_id;
      const profile = profiles[otherId];
      if (!profile) return;

      const entry = { ...profile, friendshipId: r.id };

      if (r.status === 'accepted') {
        accepted.push(entry);
      } else if (r.status === 'pending') {
        if (r.addressee_id === userId) {
          pendingIn.push(entry);
        } else {
          pendingOut.push(entry);
        }
      }
    });

    setFriends(accepted);
    setPendingReceived(pendingIn);
    setPendingSent(pendingOut);

    // Always reset room activity — will be repopulated if any friend is in a room
    let newRoomMap: Record<string, { code: string; media_title: string; media_id: string }> = {};

    // Fetch which friends are currently in rooms
    const friendIdList = accepted.map(f => f.id);
    if (friendIdList.length > 0) {
      const { data: participations } = await supabase
        .from('room_participants')
        .select('user_id, room_id')
        .in('user_id', friendIdList);

      if (participations && participations.length > 0) {
        const roomIds = [...new Set(participations.map(p => p.room_id))];
        const { data: rooms } = await supabase
          .from('rooms')
          .select('id, code, media_title, media_id, visibility')
          .in('id', roomIds);

        if (rooms) {
          participations.forEach(p => {
            const room = rooms.find(r => r.id === p.room_id);
            if (room && room.visibility !== 'private') {
              newRoomMap[p.user_id] = { code: room.code, media_title: room.media_title, media_id: room.media_id };
            }
          });
        }
      }
    }
    setFriendRooms(newRoomMap);

    // Clean up stale rooms (empty for > 2 minutes)
    try {
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: allRooms } = await supabase
        .from('rooms')
        .select('id, created_at, room_participants(count)')
        .lt('created_at', twoMinAgo);

      if (allRooms) {
        for (const room of allRooms) {
          const count = room.room_participants?.[0]?.count || 0;
          if (count === 0) {
            await supabase.from('rooms').delete().eq('id', room.id);
          }
        }
      }
    } catch (_) { /* cleanup is best-effort */ }

    setLoading(false);
  };

  // Refresh friends' online status and room activity every 15s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => fetchFriendships(user.id), 15_000);
    return () => clearInterval(interval);
  }, [user]);

  const handleAddFriend = async () => {
    if (!friendCode.trim() || !user) return;
    setAdding(true);
    setAddError('');

    const code = friendCode.trim().toUpperCase();

    if (myProfile?.friend_code === code) {
      setAddError("That's your own code!");
      setAdding(false);
      return;
    }

    // Find user by friend code
    const { data: target } = await supabase
      .from('profiles')
      .select('id')
      .eq('friend_code', code)
      .single();

    if (!target) {
      setAddError('No user found with that code.');
      setAdding(false);
      return;
    }

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${user.id})`);

    if (existing && existing.length > 0) {
      setAddError('Friend request already exists.');
      setAdding(false);
      return;
    }

    const { error } = await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: target.id,
    });

    if (error) {
      setAddError('Failed to send request.');
    } else {
      setFriendCode('');
      setShowAddModal(false);
      fetchFriendships(user.id);
    }
    setAdding(false);
  };

  const handleAccept = async (friendshipId: string) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
    if (user) fetchFriendships(user.id);
  };

  const handleReject = async (friendshipId: string) => {
    await supabase.from('friendships').delete().eq('id', friendshipId);
    if (user) fetchFriendships(user.id);
  };

  const handleCopyCode = () => {
    if (myProfile?.friend_code) {
      navigator.clipboard.writeText(myProfile.friend_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };
  // ---- DM Chat Functions ----
  const openChat = async (friend: FriendProfile) => {
    eventBus.emit('open-dm', friend);
  };

  const filteredFriends = friends.filter(f =>
    f.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const defaultAvatar = (id: string) => `https://i.pravatar.cc/150?u=${id}`;

  return (
    <div className="p-6 md:p-12 pb-24 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Friends</h1>
          <p className="text-gray-400 text-sm">Your friend code: <button onClick={handleCopyCode} className="inline-flex items-center gap-1 font-mono font-bold text-green-400 hover:text-green-300 transition-colors">
            {myProfile?.friend_code || '------'}
            {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button></p>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white/10 focus:ring-1 focus:ring-white/10 transition-all placeholder-gray-600 text-white"
            />
          </div>
          <Button onClick={() => setShowAddModal(true)} variant="secondary" className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingReceived.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Friend Requests ({pendingReceived.length})
          </h2>
          <div className="space-y-3">
            {pendingReceived.map(p => (
              <motion.div
                key={p.friendshipId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 rounded-xl bg-[#1A1A1A] border border-amber-500/20"
              >
                <div className="flex items-center gap-3">
                  <img src={p.avatar_url || defaultAvatar(p.id)} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-medium text-white">{p.display_name}</p>
                    <p className="text-xs text-gray-500">Wants to be your friend</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAccept(p.friendshipId)} className="text-xs rounded-lg gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Accept
                  </Button>
                  <button onClick={() => handleReject(p.friendshipId)} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {pendingSent.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Sent Requests ({pendingSent.length})
          </h2>
          <div className="space-y-3">
            {pendingSent.map(p => (
              <div key={p.friendshipId} className="flex items-center justify-between p-4 rounded-xl bg-[#1A1A1A] border border-white/5">
                <div className="flex items-center gap-3">
                  <img src={p.avatar_url || defaultAvatar(p.id)} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-medium text-white">{p.display_name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending...</p>
                  </div>
                </div>
                <button onClick={() => handleReject(p.friendshipId)} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Cancel</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-white/10 border-t-green-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFriends.map((friend, index) => {
            const roomInfo = friendRooms[friend.id];
            const isWatching = !!roomInfo;
            return (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 hover:bg-[#222] transition-all duration-300 flex flex-col"
              >
                {/* Header */}
                <div className={`h-24 w-full relative ${isWatching ? 'bg-blue-500/10' : friend.is_online ? 'bg-green-500/5' : 'bg-gray-800/20'}`}>
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isWatching ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      friend.is_online ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isWatching ? 'bg-blue-400 animate-pulse' : friend.is_online ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                      {isWatching ? 'Watching' : friend.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                {/* Avatar & Info */}
                <div className="px-5 pb-5 flex-1 flex flex-col -mt-10 relative z-10">
                  <div className="mb-3">
                    <div className="w-20 h-20 rounded-2xl p-1 bg-[#1A1A1A] inline-block">
                      <img
                        src={friend.avatar_url || defaultAvatar(friend.id)}
                        alt={friend.display_name}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-1">{friend.display_name}</h3>
                    {isWatching ? (
                      <div className="text-sm">
                        <span className="text-blue-400 text-xs font-bold uppercase tracking-wide block mb-1">Watching Now</span>
                        <p className="text-gray-300 line-clamp-1 font-medium">{roomInfo.media_title || 'A movie'}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {friend.is_online ? 'Online now' : `Last seen ${new Date(friend.last_seen).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/5 flex gap-2">
                    {isWatching && (
                      <Link to={`/watch/${roomInfo.media_id}?room=${roomInfo.code}`} className="flex-1">
                        <Button size="sm" className="w-full h-9 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-900/20 gap-1">
                          <Play className="w-3.5 h-3.5 fill-current" /> Join
                        </Button>
                      </Link>
                    )}
                    <button
                      onClick={() => openChat(friend)}
                      className={`${isWatching ? 'w-9 h-9 px-0' : 'flex-1 h-9 px-3'} flex-shrink-0 flex items-center justify-center gap-2 text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white transition-colors`}
                      title="Send Message"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {!isWatching && <span>Message</span>}
                    </button>
                    <button
                      onClick={() => handleReject(friend.friendshipId)}
                      className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-white/5 text-gray-500 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-colors"
                      title="Remove friend"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Add Friend Card */}
          <motion.button
            onClick={() => setShowAddModal(true)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: filteredFriends.length * 0.05 }}
            className="group flex flex-col items-center justify-center h-full min-h-[280px] rounded-2xl border-2 border-dashed border-white/5 hover:border-white/20 hover:bg-white/5 transition-all"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UserPlus className="w-6 h-6 text-gray-400 group-hover:text-white" />
            </div>
            <span className="font-medium text-gray-400 group-hover:text-white">Add Friend</span>
          </motion.button>
        </div>
      )}

      {/* Add Friend Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#121212] rounded-2xl p-6 border border-white/10">
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-gray-500"><X className="w-5 h-5" /></button>

              <h2 className="text-xl font-bold mb-2">Add Friend</h2>
              <p className="text-sm text-gray-400 mb-6">Enter your friend's 6-character code</p>

              {/* Show own code */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your Code</p>
                <button onClick={handleCopyCode} className="flex items-center gap-2 mx-auto text-2xl font-mono font-bold tracking-[0.3em] text-green-400 hover:text-green-300">
                  {myProfile?.friend_code || '------'}
                  {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
                <p className="text-xs text-gray-600 mt-2">Share this code with friends</p>
              </div>

              <div className="relative mb-1">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  maxLength={6}
                  value={friendCode}
                  onChange={e => { setFriendCode(e.target.value.toUpperCase()); setAddError(''); }}
                  placeholder="ABC123"
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-lg font-mono font-bold tracking-[0.3em] text-white focus:outline-none focus:border-green-500 transition-colors uppercase text-center"
                  autoFocus
                />
              </div>
              {addError && <p className="text-red-400 text-sm mt-1 text-center">{addError}</p>}

              <Button onClick={handleAddFriend} disabled={adding || friendCode.length < 4} className="w-full mt-4 py-3 rounded-xl font-bold">
                {adding ? 'Sending...' : 'Send Friend Request'}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
