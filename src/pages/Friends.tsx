import React, { useState } from 'react';
import { friendsList } from '../data/mockData';
import { Search, MoreHorizontal, MessageCircle, Play, UserPlus, Monitor, X, Mail, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export function Friends() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const inviteLink = "https://streamparty.app/join/alex-chen-123";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Invite sent to ${inviteEmail}!`);
    setInviteEmail('');
    setShowAddModal(false);
  };

  return (
    <div className="p-6 md:p-12 pb-24 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Friends</h1>
          <p className="text-gray-400 text-sm">See what your friends are watching right now</p>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search friends..." 
              className="w-full bg-[#1A1A1A] border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white/10 focus:ring-1 focus:ring-white/10 transition-all placeholder-gray-600 text-white"
            />
          </div>
          <Button onClick={() => setShowAddModal(true)} variant="secondary" className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {friendsList.map((friend, index) => (
          <motion.div
            key={friend.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 hover:bg-[#222] transition-all duration-300 flex flex-col"
          >
            {/* Header / Status Banner */}
            <div className={`h-24 w-full relative ${
              friend.status === 'watching' ? 'bg-blue-500/10' : 
              friend.status === 'online' ? 'bg-green-500/5' : 'bg-gray-800/20'
            }`}>
              {friend.status === 'watching' && (
                <div className="absolute inset-0 flex items-center justify-center">
                   <Monitor className="w-12 h-12 text-blue-500/20" />
                </div>
              )}
              <div className="absolute top-3 right-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  friend.status === 'online' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  friend.status === 'watching' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  friend.status === 'busy' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                  'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    friend.status === 'online' ? 'bg-green-400' :
                    friend.status === 'watching' ? 'bg-blue-400 animate-pulse' :
                    friend.status === 'busy' ? 'bg-red-400' : 'bg-gray-400'
                  }`} />
                  {friend.status}
                </span>
              </div>
            </div>

            {/* Avatar & Info */}
            <div className="px-5 pb-5 flex-1 flex flex-col -mt-10 relative z-10">
              <div className="mb-3">
                <div className="w-20 h-20 rounded-2xl p-1 bg-[#1A1A1A] inline-block text-white">
                  <img 
                    src={friend.avatarUrl} 
                    alt={friend.username} 
                    className="w-full h-full rounded-xl object-cover"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-1">{friend.username}</h3>
                {friend.status === 'watching' && friend.currentActivity ? (
                  <div className="text-sm text-gray-300">
                    <span className="text-blue-400 text-xs font-bold uppercase tracking-wide block mb-1">Watching Now</span>
                    <p className="line-clamp-1 font-medium">{friend.currentActivity.mediaTitle}</p>
                    {friend.currentActivity.progress && (
                      <div className="w-full h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${friend.currentActivity.progress}%` }} 
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    {friend.status === 'online' ? 'Just hanging out' : 
                     friend.status === 'busy' ? 'Do not disturb' : 'Last seen recently'}
                  </p>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-white/5 flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/5">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
                {friend.status === 'watching' && friend.currentActivity ? (
                  <Link to={`/watch/${friend.currentActivity.mediaId}`} className="flex-1">
                    <Button size="sm" className="w-full text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-900/20">
                      <Play className="w-3 h-3 fill-current mr-2" />
                      Join
                    </Button>
                  </Link>
                ) : (
                  <Button variant="ghost" size="sm" className="px-3 text-gray-500 hover:text-white">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* Add Friend Card */}
        <motion.button
          onClick={() => setShowAddModal(true)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: friendsList.length * 0.05 }}
          className="group flex flex-col items-center justify-center h-full min-h-[280px] rounded-2xl border-2 border-dashed border-white/5 hover:border-white/20 hover:bg-white/5 transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UserPlus className="w-6 h-6 text-gray-400 group-hover:text-white" />
          </div>
          <span className="font-medium text-gray-400 group-hover:text-white">Invite Friend</span>
        </motion.button>
      </div>

      {/* Add Friend Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#121212] rounded-3xl p-8 border border-white/5 shadow-2xl"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-display font-bold mb-2">Invite Friends</h2>
                <p className="text-gray-400 text-sm">Grow your watch party circle</p>
              </div>

              <div className="space-y-6">
                {/* Copy Link Section */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Share Invite Link</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        type="text"
                        readOnly
                        value={inviteLink}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm text-gray-400 focus:outline-none"
                      />
                    </div>
                    <button 
                      onClick={handleCopyLink}
                      className={`px-4 rounded-2xl border border-white/5 transition-all flex items-center justify-center min-w-[100px] ${
                        copied ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 mr-2" />}
                      <span className="text-xs font-bold uppercase">{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <span className="relative px-4 text-xs font-semibold text-gray-500 uppercase bg-[#121212]">Or send email</span>
                </div>

                {/* Email Invite Section */}
                <form onSubmit={handleSendInvite} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input 
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                        placeholder="friend@example.com"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full py-4 rounded-2xl font-bold text-lg">
                    Send Invitation
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
