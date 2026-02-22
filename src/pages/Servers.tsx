import React, { useState, useEffect } from 'react';
import { Server as ServerIcon, Plus, RefreshCw, Wifi, WifiOff, X, Settings, Shield, Link as LinkIcon, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { eventBus } from '../utils/events';
import { MediaInterface } from '../types';

interface ServerData {
  id: string;
  name: string;
  type: 'plex' | 'jellyfin';
  url: string;
  token: string;
  status: 'online' | 'offline' | 'connecting';
  librarySize: number;
  userCount: number;
}

export function Servers() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [serverType, setServerType] = useState<'plex' | 'jellyfin'>('plex');
  const [serverName, setServerName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [serverToken, setServerToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Load servers from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('streamparty_servers');
    if (saved) {
      setServers(JSON.parse(saved));
    }
  }, []);

  // Save servers to localStorage when they change
  useEffect(() => {
    localStorage.setItem('streamparty_servers', JSON.stringify(servers));
  }, [servers]);

  const testJellyfinConnection = async (url: string, token: string) => {
    try {
      // Clean URL (remove trailing slash)
      const baseUrl = url.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/System/Info/Public?api_key=${token}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error('Server returned an error. Check URL and Token.');

      const data = await response.json();
      return { success: true, data };
    } catch (err: any) {
      console.error('Connection error:', err);
      throw new Error(err.message || 'Failed to connect to server');
    }
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setError(null);

    try {
      if (serverType === 'jellyfin') {
        await testJellyfinConnection(serverUrl, serverToken);
      } else {
        // Plex simulation for now as it requires complex OAuth
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      const newServer: ServerData = {
        id: `srv-${Date.now()}`,
        name: serverName,
        type: serverType,
        url: serverUrl,
        token: serverToken,
        status: 'online',
        librarySize: 0, // In a real app, we'd fetch this
        userCount: 1
      };

      setServers([...servers, newServer]);
      setShowAddModal(false);
      setServerName('');
      setServerUrl('');
      setServerToken('');

      alert(`Successfully connected to ${serverName}!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const deleteServer = (id: string) => {
    if (confirm('Are you sure you want to disconnect this server?')) {
      const remainingServers = servers.filter(s => s.id !== id);
      setServers(remainingServers);
      if (remainingServers.length === 0) {
        localStorage.removeItem('streamparty_synced_movies');
        localStorage.removeItem('streamparty_synced_series');
        eventBus.emit('movies-synced', []);
        eventBus.emit('series-synced', []);
      }
    }
  };

  const syncServer = async (server: ServerData) => {
    setSyncingId(server.id);
    try {
      if (server.type === 'jellyfin') {
        const baseUrl = server.url.replace(/\/$/, '');

        // Fetch movies and series. We include 'Episode' and 'Video' to catch unclassified library items.
        const response = await fetch(`${baseUrl}/Items?api_key=${server.token}&Recursive=true&IncludeItemTypes=Movie,Series,Episode,Video&Fields=Overview,Genres,PrimaryImageAspectRatio,BackdropImageTags,ImageTags&Limit=20000`, {
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Jellyfin API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[Sync] Jellyfin returned ${data.TotalRecordCount} total items (Movies + Series/Episodes)`);

        let syncedMovies: MediaInterface[] = [];
        let seriesMap = new Map<string, MediaInterface>();

        (data.Items || []).forEach((item: any) => {
          const hasPrimary = item.ImageTags && item.ImageTags.Primary;
          const hasBackdrop = item.ImageTags && item.ImageTags.Backdrop || (item.BackdropImageTags && item.BackdropImageTags.length > 0);
          const poster = hasPrimary ? `${baseUrl}/Items/${item.Id}/Images/Primary?api_key=${server.token}` : `https://picsum.photos/seed/jf${item.Id}/400/600`;
          const backdrop = hasBackdrop ? `${baseUrl}/Items/${item.Id}/Images/Backdrop?api_key=${server.token}` : poster;

          const streamUrl = `${baseUrl}/Videos/${item.Id}/stream?api_key=${server.token}`;

          const itemType = item.Type || 'Movie';

          if (itemType === 'Episode') {
            const seriesId = String(item.SeriesId || `series-${item.Id}`);
            if (!seriesMap.has(seriesId)) {
              seriesMap.set(seriesId, {
                id: seriesId,
                title: item.SeriesName || 'Unknown Series',
                posterUrl: poster, // fallback
                backdropUrl: backdrop, // fallback
                type: 'tv',
                year: item.ProductionYear || new Date().getFullYear(),
                rating: item.OfficialRating || 'NR',
                description: item.Overview || 'No description available.',
                genres: item.Genres || [],
                streamUrl: '',
                seasons: []
              });
            }

            const series = seriesMap.get(seriesId)!;
            const seasonNumber = item.ParentIndexNumber || 1;
            const seasonId = String(item.SeasonId || `season-${seriesId}-${seasonNumber}`);

            let season = series.seasons!.find(s => s.id === seasonId);
            if (!season) {
              season = {
                id: seasonId,
                seasonNumber: seasonNumber,
                title: item.SeasonName || `Season ${seasonNumber}`,
                episodes: []
              };
              series.seasons!.push(season);
            }

            season.episodes.push({
              id: String(item.Id),
              episodeNumber: item.IndexNumber || 1,
              title: item.Name || `Episode ${item.IndexNumber || 1}`,
              description: item.Overview || '',
              thumbnailUrl: poster,
              duration: item.RunTimeTicks ? `${Math.round(item.RunTimeTicks / 10000000 / 60)}m` : '',
              streamUrl: streamUrl
            });

          } else if (itemType === 'Series') {
            const sid = String(item.Id);
            if (!seriesMap.has(sid)) {
              seriesMap.set(sid, {
                id: sid,
                title: item.Name || 'Unknown Title',
                posterUrl: poster,
                backdropUrl: backdrop,
                type: 'tv',
                year: item.ProductionYear || new Date().getFullYear(),
                rating: item.OfficialRating || 'NR',
                description: item.Overview || 'No description available for this item.',
                genres: item.Genres || [],
                streamUrl: '',
                seasons: []
              });
            } else {
              // Update explicit series metadata if it arrived after an episode created a stub
              const series = seriesMap.get(sid)!;
              series.title = item.Name || series.title;
              series.posterUrl = poster;
              series.backdropUrl = backdrop;
              series.description = item.Overview || series.description;
              series.genres = item.Genres || series.genres;
            }
          } else {
            syncedMovies.push({
              id: String(item.Id),
              title: item.Name || 'Unknown Title',
              posterUrl: poster,
              backdropUrl: backdrop,
              type: 'movie',
              year: item.ProductionYear || new Date().getFullYear(),
              rating: item.OfficialRating || 'NR',
              description: item.Overview || 'No description available for this item.',
              genres: item.Genres || [],
              streamUrl: streamUrl
            });
          }
        });

        const syncedSeries = Array.from(seriesMap.values()).filter(s => s.seasons && s.seasons.length > 0 && s.seasons.some(season => season.episodes && season.episodes.length > 0));
        // Sort effectively to keep logical order
        syncedSeries.forEach(series => {
          if (series.seasons) {
            series.seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
            series.seasons.forEach(season => {
              season.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
            });
          }
        });

        const totalCount = syncedMovies.length + syncedSeries.reduce((acc, current) => acc + (current.seasons?.reduce((c, s) => c + s.episodes.length, 0) || 0), 0);
        setServers(prev => prev.map(s => s.id === server.id ? { ...s, librarySize: totalCount } : s));
        console.log(`[Sync] Mapped into ${syncedMovies.length} movies, and ${syncedSeries.length} distinct Series entries (Totals to ${totalCount} individual items)`);

        localStorage.setItem('streamparty_synced_movies', JSON.stringify(syncedMovies));
        localStorage.setItem('streamparty_synced_series', JSON.stringify(syncedSeries));
        eventBus.emit('movies-synced', syncedMovies);
        eventBus.emit('series-synced', syncedSeries);

      } else {
        // Real sync for Plex
        console.log(`[Sync] Triggered Plex sync for server: ${server.name}`);
        const plexUrl = server.url.endsWith('/') ? server.url.slice(0, -1) : server.url;

        const response = await fetch(`${plexUrl}/library/recentlyAdded?X-Plex-Token=${server.token}`, {
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Plex API Error: ${response.status}`);
        }

        const data = await response.json();
        const items = data.MediaContainer?.Metadata || [];

        const syncedMovies = items.map((item: any) => {
          const poster = item.thumb ? `${plexUrl}${item.thumb}?X-Plex-Token=${server.token}` : `https://picsum.photos/seed/plex${item.ratingKey}/400/600`;
          const backdrop = item.art ? `${plexUrl}${item.art}?X-Plex-Token=${server.token}` : poster;

          let streamKey = '';
          if (item.Media && item.Media[0] && item.Media[0].Part && item.Media[0].Part[0]) {
            streamKey = item.Media[0].Part[0].key;
          }

          return {
            id: item.ratingKey,
            title: item.title || 'Unknown Title',
            posterUrl: poster,
            backdropUrl: backdrop,
            type: item.type === 'show' ? 'tv' as const : 'movie' as const,
            year: item.year || new Date().getFullYear(),
            rating: item.contentRating || 'NR',
            description: item.summary || 'Sourced directly from your Plex server!',
            genres: item.Genre ? item.Genre.map((g: any) => g.tag) : [],
            streamUrl: streamKey ? `${plexUrl}${streamKey}?X-Plex-Token=${server.token}` : ''
          };
        });

        setServers(prev => prev.map(s => s.id === server.id ? { ...s, librarySize: items.length } : s));
        localStorage.setItem('streamparty_synced_movies', JSON.stringify(syncedMovies));
        eventBus.emit('movies-synced', syncedMovies);
      }
    } catch (err: any) {
      console.error('Sync error:', err);
    } finally {
      setSyncingId(null);
    }
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
        {servers.map((server) => (
          <div key={server.id} className="bg-[#1A1A1A] border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${server.type === 'plex' ? 'bg-orange-500/10 text-orange-500' : 'bg-purple-500/10 text-purple-500'
                  }`}>
                  <ServerIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{server.name}</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{server.type} • {new URL(server.url).hostname}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${server.status === 'online' ? 'bg-green-500/10 text-green-500' :
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
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => syncServer(server)}
                disabled={syncingId === server.id}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncingId === server.id ? 'animate-spin' : ''}`} />
                {syncingId === server.id ? 'Syncing...' : 'Sync'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="w-full"
                onClick={() => deleteServer(server.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
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
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${serverType === 'plex' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                      }`}
                  >
                    Plex
                  </button>
                  <button
                    type="button"
                    onClick={() => setServerType('jellyfin')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${serverType === 'jellyfin' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
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
                        placeholder="https://your-server.com:8096"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">API Key</label>
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

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                    {error}
                  </div>
                )}

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
                  ) : 'Connect Server'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
