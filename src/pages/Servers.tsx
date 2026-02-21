import React, { useState } from 'react';
import { serversList } from '../data/mockData';
import { Server as ServerIcon, Plus, RefreshCw, Wifi, WifiOff, X, Settings, Shield, Link as LinkIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion, AnimatePresence } from 'motion/react';

export function Servers() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [serverType, setServerType] = useState<'plex' | 'jellyfin'>('plex');
  const [serverName, setServerName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [serverToken, setServerToken] = useState('');

  const [isConnecting, setIsConnecting] = useState(false);

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert(`Successfully connected to ${serverName}!`);
    setIsConnecting(false);
    setShowAddModal(false);
  };

  return (
    <div className="p-6 md:p-12 pb-24 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Media Servers</h1>
          <p className="text-gray-400 text-sm">Manage your connected Plex and Jellyfin servers</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Server
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {serversList.map((server) => (
          <div key={server.id} className="bg-[#1A1A1A] border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  server.type === 'plex' ? 'bg-orange-500/10 text-orange-500' : 'bg-purple-500/10 text-purple-500'
                }`}>
                  <ServerIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{server.name}</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{server.type}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                server.status === 'online' ? 'bg-green-500/10 text-green-500' : 
                server.status === 'connecting' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {server.status === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {server.status}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Library Size</p>
                <p className="font-mono text-lg">{server.librarySize.toLocaleString()} Items</p>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Active Users</p>
                <p className="font-mono text-lg">{server.userCount}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync
              </Button>
              <Button variant="secondary" size="sm" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </Button>
            </div>
          </div>
        ))}
        
        {/* Add New Placeholder */}
        <button 
          onClick={() => setShowAddModal(true)}
          className="border-2 border-dashed border-white/5 rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all min-h-[240px]"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-medium">Connect New Server</span>
        </button>
      </div>

      {/* Add Server Modal */}
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
                <h2 className="text-2xl font-display font-bold mb-2">Connect Server</h2>
                <p className="text-gray-400 text-sm">Link your media library to StreamParty</p>
              </div>

              <form onSubmit={handleAddServer} className="space-y-6">
                <div className="flex p-1 bg-black/40 rounded-2xl">
                  <button 
                    type="button"
                    onClick={() => setServerType('plex')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                      serverType === 'plex' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Plex
                  </button>
                  <button 
                    type="button"
                    onClick={() => setServerType('jellyfin')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                      serverType === 'jellyfin' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Jellyfin
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Server Name</label>
                    <div className="relative">
                      <ServerIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input 
                        type="text"
                        value={serverName}
                        onChange={(e) => setServerName(e.target.value)}
                        required
                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                        placeholder="e.g. My Home Media"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Server URL</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input 
                        type="url"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                        required
                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                        placeholder="https://your-server.com:32400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Access Token / API Key</label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input 
                        type="password"
                        value={serverToken}
                        onChange={(e) => setServerToken(e.target.value)}
                        required
                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                        placeholder="••••••••••••••••"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isConnecting}
                  className="w-full py-4 rounded-2xl font-bold text-lg"
                >
                  {isConnecting ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Connecting...
                    </div>
                  ) : 'Test Connection'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
