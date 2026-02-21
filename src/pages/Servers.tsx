import { serversList } from '../data/mockData';
import { Server as ServerIcon, Plus, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function Servers() {
  return (
    <div className="p-6 md:p-12 pb-24 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Media Servers</h1>
          <p className="text-gray-400 text-sm">Manage your connected Plex and Jellyfin servers</p>
        </div>
        <Button className="gap-2">
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
                Manage
              </Button>
            </div>
          </div>
        ))}
        
        {/* Add New Placeholder */}
        <button className="border-2 border-dashed border-white/5 rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all min-h-[240px]">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-medium">Connect New Server</span>
        </button>
      </div>
    </div>
  );
}
