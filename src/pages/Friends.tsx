import { friendsList } from '../data/mockData';
import { Search, MoreHorizontal, MessageCircle, Play } from 'lucide-react';

export function Friends() {
  return (
    <div className="p-6 md:p-12 pb-24 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-bold">Friends</h1>
        <button className="p-2 rounded-full bg-white/5 hover:bg-white/10">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input 
          type="text" 
          placeholder="Search friends..." 
          className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-white/10 focus:ring-1 focus:ring-white/10 transition-all"
        />
      </div>

      <div className="space-y-4">
        {friendsList.map((friend) => (
          <div key={friend.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#1A1A1A] border border-white/5 hover:border-white/10 transition-colors group">
            <div className="relative">
              <img 
                src={friend.avatarUrl} 
                alt={friend.username} 
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#1A1A1A] ${
                friend.status === 'online' ? 'bg-green-500' :
                friend.status === 'watching' ? 'bg-blue-500' :
                friend.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white">{friend.username}</h3>
              <p className="text-xs text-gray-400 truncate">
                {friend.status === 'watching' && friend.currentActivity ? (
                  <span className="text-blue-400">Watching {friend.currentActivity.mediaTitle}</span>
                ) : (
                  <span className="capitalize">{friend.status}</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5" />
              </button>
              {friend.status === 'watching' && (
                <button className="px-4 py-2 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20 text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-colors">
                  <Play className="w-3 h-3 fill-current" />
                  Join
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
