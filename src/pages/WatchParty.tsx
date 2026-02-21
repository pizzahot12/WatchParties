import { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { featuredMedia, trendingMedia, mockChatMessages, friendsList } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Send, Smile, Mic, Video, Users, MessageSquare, Maximize, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Plyr } from 'plyr-react';
import 'plyr-react/plyr.css';

export function WatchParty() {
  const { id } = useParams();
  const media = [...trendingMedia, featuredMedia].find(m => m.id === id) || featuredMedia;
  
  const [activeTab, setActiveTab] = useState<'chat' | 'people'>('chat');
  const [messages, setMessages] = useState(mockChatMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const videoSource = {
    type: 'video' as const,
    sources: [
      {
        src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
        type: 'video/mp4',
        size: 576,
      },
      {
        src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4',
        type: 'video/mp4',
        size: 720,
      },
      {
        src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4',
        type: 'video/mp4',
        size: 1080,
      }
    ],
    poster: media.backdropUrl,
  };

  const plyrOptions = {
    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
    settings: ['captions', 'quality', 'speed'],
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = {
      id: Date.now().toString(),
      userId: 'me',
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text' as const
    };

    setMessages([...messages, msg]);
    setNewMessage('');
  };

  return (
    <div className="h-screen w-screen bg-black overflow-hidden flex flex-col md:flex-row">
      {/* Video Player Section */}
      <div className="flex-1 relative flex flex-col h-[40vh] md:h-full bg-black">
        {/* Back Button (Overlay) */}
        <div className={`absolute top-0 left-0 right-0 p-4 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <Link to={`/details/${media.id}`}>
            <button className="p-2 rounded-full bg-black/50 text-white hover:bg-white/20 backdrop-blur-sm">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
        </div>

        {/* Video Player */}
        <div 
          className="relative w-full h-full bg-black flex items-center justify-center group [&_.plyr]:w-full [&_.plyr]:h-full [&_.plyr]:flex [&_.plyr]:items-center [&_.plyr]:justify-center [&_.plyr]:bg-black"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <Plyr 
            source={videoSource} 
            options={plyrOptions} 
          />
        </div>
      </div>

      {/* Sidebar (Chat & People) */}
      <div className="w-full md:w-96 bg-[#121212] border-l border-white/5 flex flex-col h-[60vh] md:h-full">
        {/* Tabs */}
        <div className="flex border-b border-white/5">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'chat' ? 'text-white border-b-2 border-green-500 bg-white/5' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Chat
          </button>
          <button 
            onClick={() => setActiveTab('people')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'people' ? 'text-white border-b-2 border-green-500 bg-white/5' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Users className="w-4 h-4" /> People (4)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#121212]">
          {activeTab === 'chat' ? (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.userId === 'me' ? 'flex-row-reverse' : ''}`}>
                  <img 
                    src={msg.userId === 'me' ? 'https://i.pravatar.cc/150?u=me' : (friendsList.find(u => u.id === msg.userId)?.avatarUrl || 'https://i.pravatar.cc/150')} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full object-cover mt-1 flex-shrink-0"
                  />
                  <div className={`max-w-[80%] flex flex-col ${msg.userId === 'me' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2 rounded-2xl text-sm ${
                      msg.userId === 'me' 
                        ? 'bg-green-600 text-white rounded-tr-none' 
                        : 'bg-white/10 text-gray-200 rounded-tl-none'
                    }`}>
                      {msg.type === 'emoji' ? <span className="text-2xl">{msg.content}</span> : msg.content}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="space-y-2">
              {friendsList.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={user.avatarUrl} alt={user.username} className="w-10 h-10 rounded-full" />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#121212]" />
                    </div>
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-full bg-white/5 hover:bg-white/10">
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area (Only for Chat) */}
        {activeTab === 'chat' && (
          <div className="p-4 border-t border-white/5 bg-[#121212]">
            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-[#1A1A1A] text-white rounded-full py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-gray-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button type="button" className="p-2 text-gray-400 hover:text-white transition-colors">
                  <Smile className="w-5 h-5" />
                </button>
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="p-2 bg-green-500 text-black rounded-full hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
