import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { eventBus } from '../utils/events';

interface FriendProfile {
    id: string;
    display_name: string;
    avatar_url: string | null;
    is_online: boolean;
}

interface DMMessage {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    read: boolean;
}

export function GlobalChatBubble() {
    const [user, setUser] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [activeChat, setActiveChat] = useState<FriendProfile | null>(null);

    const [friends, setFriends] = useState<FriendProfile[]>([]);
    const [messages, setMessages] = useState<DMMessage[]>([]);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    const [dmInput, setDmInput] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auth and init
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            if (user) loadData(user.id);
        });

        const unsubscribe = eventBus.on('open-dm', (friend: FriendProfile) => {
            setIsOpen(true);
            setActiveChat(friend);
        });

        return unsubscribe;
    }, []);

    const loadData = async (userId: string) => {
        // Load friends
        const { data: friendships } = await supabase
            .from('friendships')
            .select('requester_id, addressee_id')
            .eq('status', 'accepted')
            .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

        if (friendships) {
            const friendIds = friendships.map((f: any) => f.requester_id === userId ? f.addressee_id : f.requester_id);
            if (friendIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, display_name, avatar_url, is_online')
                    .in('id', friendIds);
                setFriends(profiles || []);
            }
        }

        // Load all unread counts
        const { data: msgs, error } = await supabase
            .from('direct_messages')
            .select('sender_id')
            .eq('receiver_id', userId)
            .eq('read', false);

        if (!error && msgs) {
            const counts: Record<string, number> = {};
            msgs.forEach(m => {
                counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
            });
            setUnreadCounts(counts);
        }
    };

    // Subscribe to real-time messages
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('global-dms')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
                const msg = payload.new as DMMessage;

                // If msg involves me
                if (msg.sender_id === user.id || msg.receiver_id === user.id) {
                    // Update main view if Active chat matches
                    setMessages(prev => {
                        const isRelevant = activeChat && ((msg.sender_id === activeChat.id && msg.receiver_id === user.id) || (msg.sender_id === user.id && msg.receiver_id === activeChat.id));
                        if (isRelevant) {
                            if (msg.receiver_id === user.id) {
                                // Mark as read immediately
                                supabase.from('direct_messages').update({ read: true }).eq('id', msg.id).then();
                            }
                            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                            return prev.find(m => m.id === msg.id) ? prev : [...prev, msg];
                        }
                        return prev;
                    });

                    // Update unread count if it's not the active chat or if the bubble is closed
                    if (msg.receiver_id === user.id && (!activeChat || activeChat.id !== msg.sender_id || !isOpen)) {
                        setUnreadCounts(prev => ({
                            ...prev,
                            [msg.sender_id]: (prev[msg.sender_id] || 0) + 1
                        }));
                    }
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
                const updatedProfile = payload.new as FriendProfile;
                setFriends(prev => prev.map(f => f.id === updatedProfile.id ? { ...f, ...updatedProfile } : f));
                // Update active chat if currently chatting with this friend
                setActiveChat(prev => (prev && prev.id === updatedProfile.id) ? { ...prev, ...updatedProfile } : prev);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user, activeChat, isOpen]);

    // Load chat messages when activeChat changes or window opens
    useEffect(() => {
        if (!user || !activeChat || !isOpen) return;

        const loadChat = async () => {
            const { data } = await supabase
                .from('direct_messages')
                .select('*')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: true })
                .limit(100);

            setMessages(data || []);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'auto' }), 100);

            // Mark unread as read
            if (unreadCounts[activeChat.id] > 0) {
                await supabase.from('direct_messages')
                    .update({ read: true })
                    .eq('sender_id', activeChat.id)
                    .eq('receiver_id', user.id)
                    .eq('read', false);
                setUnreadCounts(prev => ({ ...prev, [activeChat.id]: 0 }));
            }
        };
        loadChat();
    }, [activeChat, user, isOpen]);

    const sendMessage = async () => {
        if (!dmInput.trim() || !user || !activeChat || sending) return;
        setSending(true);

        const { error } = await supabase.from('direct_messages').insert({
            sender_id: user.id,
            receiver_id: activeChat.id,
            content: dmInput.trim(),
        });

        if (!error) setDmInput('');
        setSending(false);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const totalUnread = Object.values(unreadCounts).reduce((a: number, b: number) => a + b, 0);

    if (!user) return null;

    return (
        <div className="fixed z-[9999] bottom-24 lg:bottom-6 right-4 lg:right-6 flex flex-col items-end pointer-events-none">
            {/* Bubble Menu / Popup */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[340px] max-w-[calc(100vw-2rem)] bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
                        style={{ height: '450px' }}
                    >
                        {!activeChat ? (
                            // Friends List View
                            <>
                                <div className="p-4 border-b border-white/5 bg-[#1A1A1A] flex items-center justify-between">
                                    <h3 className="font-bold text-white">Messages</h3>
                                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                    {friends.length === 0 ? (
                                        <div className="text-center text-gray-500 mt-10 text-sm">No friends added yet.</div>
                                    ) : (
                                        friends.map(friend => {
                                            const unread = unreadCounts[friend.id] || 0;
                                            return (
                                                <button
                                                    key={friend.id}
                                                    onClick={() => setActiveChat(friend)}
                                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                                                >
                                                    <div className="relative">
                                                        <img src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`} className="w-10 h-10 rounded-full object-cover" />
                                                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#121212] ${friend.is_online ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-white truncate">{friend.display_name}</p>
                                                    </div>
                                                    {unread > 0 && (
                                                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unread}</span>
                                                    )}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </>
                        ) : (
                            // Chat View
                            <>
                                <div className="p-3 border-b border-white/5 bg-[#1A1A1A] flex items-center gap-2">
                                    <button onClick={() => setActiveChat(null)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <img src={activeChat.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat.id}`} className="w-8 h-8 rounded-full object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-white truncate">{activeChat.display_name}</p>
                                        <p className={`text-[10px] font-bold uppercase ${activeChat.is_online ? 'text-green-500' : 'text-gray-500'}`}>{activeChat.is_online ? 'Online' : 'Offline'}</p>
                                    </div>
                                    <button onClick={() => setIsOpen(false)} className="text-gray-400 p-1.5 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-[#121212]">
                                    {messages.length === 0 && (
                                        <div className="text-center text-gray-500 mt-10 text-xs">Start a conversation</div>
                                    )}
                                    {messages.map(msg => {
                                        const isMe = msg.sender_id === user.id;
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-green-600 text-white rounded-tr-sm' : 'bg-white/10 text-gray-200 rounded-tl-sm'}`}>
                                                    <p>{msg.content}</p>
                                                    <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-green-200/60' : 'text-gray-500'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={scrollRef} />
                                </div>

                                <div className="p-2 border-t border-white/5 bg-[#1A1A1A]">
                                    <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={dmInput}
                                            onChange={e => setDmInput(e.target.value)}
                                            placeholder="Message..."
                                            className="flex-1 bg-black/50 text-white border border-white/10 focus:border-green-500 rounded-full px-4 py-2 text-sm focus:outline-none transition-colors"
                                            autoFocus
                                        />
                                        <button type="submit" disabled={!dmInput.trim() || sending} className="bg-green-500 text-black p-2 rounded-full hover:bg-green-400 transition-colors disabled:opacity-50">
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-green-500 hover:bg-green-400 text-black rounded-full shadow-lg shadow-green-500/20 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 relative pointer-events-auto"
            >
                <MessageCircle className="w-6 h-6" />
                {(totalUnread as number) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#121212]">
                        {totalUnread}
                    </span>
                )}
            </button>
        </div>
    );
}
