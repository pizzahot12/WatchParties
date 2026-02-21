import { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { featuredMedia, trendingMedia, mockChatMessages, friendsList } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Send, Smile, Mic, Video, Users, MessageSquare, Maximize, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function WatchParty() {
  const { id } = useParams();
  const media = [...trendingMedia, featuredMedia].find(m => m.id === id) || featuredMedia;
  
  const [activeTab, setActiveTab] = useState<'chat' | 'people'>('chat');
  const [messages, setMessages] = useState(mockChatMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

        {/* Video Placeholder */}
        <div 
          className="relative w-full h-full bg-gray-900 flex items-center justify-center group"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          {/* Simulated Video Content */}
          <img 
            src={media.backdropUrl} 
            alt="Video Content" 
            className="w-full h-full object-contain opacity-50"
          />
          
          {/* Custom Controls Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 flex flex-col justify-end p-6 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">{media.title}</h2>
              {/* Progress Bar */}
              <div className="w-full h-1 bg-white/20 rounded-full cursor-pointer group/progress">
                <div className="h-full bg-green-500 w-[35%] relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg" />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2 font-mono">
                <span>24:15</span>
                <span>{media.duration}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Play/Pause, Volume, etc would go here */}
              </div>
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-white/10 rounded-full">
                  <Mic className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full md:hidden" onClick={() => setIsFullscreen(!isFullscreen)}>
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
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
