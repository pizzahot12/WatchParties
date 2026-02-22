import { useState, useEffect, useRef, FormEvent, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { featuredMedia, trendingMedia, mockChatMessages, friendsList, libraryMedia } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Send, Smile, Mic, Video, Users, MessageSquare, Maximize, Minimize, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Plyr } from 'plyr-react';
import 'plyr-react/plyr.css';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import Hls from 'hls.js';

export function WatchParty() {
  const { id } = useParams();

  const savedSynchedMovies = localStorage.getItem('streamparty_synced_movies');
  const synchronizedMovies = savedSynchedMovies ? JSON.parse(savedSynchedMovies) : [];

  const savedSynchedSeries = localStorage.getItem('streamparty_synced_series');
  const synchronizedSeries = savedSynchedSeries ? JSON.parse(savedSynchedSeries) : [];

  let media = [...trendingMedia, featuredMedia, ...libraryMedia, ...synchronizedMovies, ...synchronizedSeries].filter(Boolean).find(m => String(m.id) === String(id));

  // If not found at the top level, search inside seasons/episodes
  if (!media) {
    for (const seriesObj of synchronizedSeries) {
      if (seriesObj.seasons) {
        for (const season of seriesObj.seasons) {
          const episode = season.episodes.find((ep: any) => String(ep.id) === String(id));
          if (episode) {
            media = {
              ...seriesObj,
              id: episode.id,
              title: `${seriesObj.title} - ${episode.episodeNumber}. ${episode.title}`,
              description: episode.description || seriesObj.description,
              backdropUrl: episode.thumbnailUrl || seriesObj.backdropUrl,
              streamUrl: episode.streamUrl
            };
            break;
          }
        }
      }
      if (media) break;
    }
  }

  if (!media) {
    if (featuredMedia && featuredMedia.id === id) {
      media = featuredMedia;
    } else {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Media not found</h1>
            <p className="text-gray-400 mb-6">The requested movie or series could not be found.</p>
            <Link to="/home">
              <Button>Return to Home</Button>
            </Link>
          </div>
        </div>
      );
    }
  }

  const [activeTab, setActiveTab] = useState<'chat' | 'people'>('chat');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [messages, setMessages] = useState(mockChatMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const [jellyfinSources, setJellyfinSources] = useState<any[]>([]);
  const [jellyfinQualitiesLabels, setJellyfinQualitiesLabels] = useState<Record<number, string>>({});

  const [audioStreams, setAudioStreams] = useState<any[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<number | null>(null);

  const [subtitleStreams, setSubtitleStreams] = useState<any[]>([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState<number>(-1);

  useEffect(() => {
    if (!media.streamUrl || !media.streamUrl.includes('api_key=')) return;

    // match baseUrl and apiKey from streamUrl
    const match = media.streamUrl.match(/^(https?:\/\/[^\/]+)\/.*api_key=([^&]+)/);
    if (!match) return;

    const baseUrl = match[1];
    const apiKey = match[2];

    const fetchJellyfinExtras = async () => {
      try {
        const response = await fetch(`${baseUrl}/Items?api_key=${apiKey}&Ids=${media.id}&Fields=MediaSources`);
        if (!response.ok) return;
        const data = await response.json();
        const item = data.Items?.[0];
        if (!item || !item.MediaSources || !item.MediaSources[0]) return;

        const source = item.MediaSources[0];

        // Fetch Subtitle streams for burn-in (no VTT — that causes CORS errors from localhost)
        const subs = source.MediaStreams?.filter((s: any) => s.Type === 'Subtitle') || [];
        setSubtitleStreams(subs);

        // Default subtitle: prefer Spanish or first available
        let defaultSub = subs?.find((s: any) => s.IsDefault || s.Language === 'spa')?.Index ?? -1;
        setSelectedSubtitle(prev => prev === -1 ? defaultSub : prev);

        // Fetch Audio Streams
        const audios = source.MediaStreams?.filter((s: any) => s.Type === 'Audio');
        setAudioStreams(audios || []);
        let defaultAudio = audios?.find((a: any) => a.IsDefault)?.Index;
        if (defaultAudio === undefined && audios && audios.length > 0) defaultAudio = audios[0].Index;

        let targetAudio = selectedAudio !== null ? selectedAudio : defaultAudio;
        if (selectedAudio === null && targetAudio !== undefined) {
          setSelectedAudio(targetAudio);
        }

        const videoStream = source.MediaStreams?.find((s: any) => s.Type === 'Video');
        const originalHeight = videoStream?.Height || 1080;

        const labels: Record<number, string> = {};
        labels[originalHeight] = `Original (${originalHeight}p)`;

        // HLS endpoint: supports seeking on transcoded streams
        // Requires: MediaSourceId, DeviceId, PlaySessionId — otherwise Jellyfin returns 400
        const sessionId = `wp_${Date.now()}`;
        const activeSub = selectedSubtitle > -1 ? selectedSubtitle : -1;
        const subParam = activeSub > -1
          ? `&SubtitleStreamIndex=${activeSub}&SubtitleMethod=Encode`
          : '';
        const hlsBase = (
          `${baseUrl}/Videos/${item.Id}/master.m3u8` +
          `?api_key=${apiKey}` +
          `&MediaSourceId=${item.Id}` +
          `&DeviceId=watchparty` +
          `&PlaySessionId=${sessionId}` +
          `&VideoCodec=h264` +
          `&AudioCodec=aac` +
          `&AudioStreamIndex=${targetAudio}` +
          `&TranscodingMaxAudioChannels=2` +
          subParam
        );

        // bitrateMap with user-specified values
        const bitrateMap = [
          { kbps: 20000, label: '1080p (20 Mbps)', maxW: 1920, maxH: 1080, id: 108020 },
          { kbps: 12000, label: '1080p (12 Mbps)', maxW: 1920, maxH: 1080, id: 108012 },
          { kbps: 10000, label: '1080p (10 Mbps)', maxW: 1920, maxH: 1080, id: 108010 },
          { kbps: 8000, label: '720p  (8 Mbps)', maxW: 1280, maxH: 720, id: 72008 },
          { kbps: 4000, label: '720p  (4 Mbps)', maxW: 1280, maxH: 720, id: 72004 },
          { kbps: 3000, label: '720p  (3 Mbps)', maxW: 1280, maxH: 720, id: 72003 },
          { kbps: 2000, label: '480p  (2 Mbps)', maxW: 720, maxH: 480, id: 48002 },
          { kbps: 1500, label: '480p  (1.5 Mbps)', maxW: 720, maxH: 480, id: 48001 },
          { kbps: 720, label: '360p  (720 kbps)', maxW: 480, maxH: 320, id: 36000 },
          { kbps: 320, label: '240p  (320 kbps)', maxW: 480, maxH: 240, id: 24000 },
        ];

        const qualitiesCounted = bitrateMap
          .filter(opt => opt.maxH <= originalHeight)
          .map(opt => {
            labels[opt.id] = opt.label;
            return {
              src: `${hlsBase}&VideoBitrate=${opt.kbps * 1000}&MaxWidth=${opt.maxW}&MaxHeight=${opt.maxH}`,
              type: 'application/x-mpegURL',
              size: opt.id
            };
          });

        // Original quality: no bitrate cap
        qualitiesCounted.unshift({
          src: hlsBase,
          type: 'application/x-mpegURL',
          size: originalHeight
        });

        setJellyfinQualitiesLabels(labels);
        setJellyfinSources(qualitiesCounted);
      } catch (err) {
        console.error('Failed to fetch extras', err);
      }
    };
    fetchJellyfinExtras();
  }, [media.id, media.streamUrl, selectedAudio, selectedSubtitle]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [plyrInstance, setPlyrInstance] = useState<any>(null);
  const isRemoteAction = useRef(false);
  const channelRef = useRef<any>(null);

  // Helper: shorten audio/subtitle label to just language + codec
  const shortLabel = (s: any) => {
    const lang = (s.Language || '').toUpperCase().slice(0, 3) || '??';
    const codec = (s.Codec || s.DisplayTitle || '').split(' ')[0].toUpperCase().slice(0, 4);
    return codec ? `${lang} · ${codec}` : lang;
  };

  // Reset unread messages when switching to chat tab
  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadMessages(0);
    }
  }, [activeTab]);

  // Callback ref to capture the Plyr instance when it's ready
  const setPlayerRef = useCallback((node: any) => {
    if (node) {
      playerRef.current = node;
      if (node.plyr) {
        setPlyrInstance(node.plyr);
      } else if (!node.plyr) {
        const interval = setInterval(() => {
          if (node.plyr) {
            setPlyrInstance(node.plyr);
            clearInterval(interval);
          }
        }, 50);
        setTimeout(() => clearInterval(interval), 2000);
      }
    } else {
      playerRef.current = null;
      setPlyrInstance(null);
    }
  }, []);

  // HLS.js: attach to video element for m3u8 sources — enables seeking
  useEffect(() => {
    if (!plyrInstance || !plyrInstance.elements?.wrapper) return;
    const videoEl = plyrInstance.elements.wrapper.querySelector('video') as HTMLVideoElement;
    if (!videoEl) return;

    const loadHls = () => {
      const src = videoEl.src || videoEl.querySelector('source')?.src;
      if (!src || !src.includes('.m3u8')) return;
      if (Hls.isSupported()) {
        if (hlsRef.current) hlsRef.current.destroy();
        hlsRef.current = new Hls({ maxLoadingDelay: 30, manifestLoadingTimeOut: 60000 });
        hlsRef.current.loadSource(src);
        hlsRef.current.attachMedia(videoEl);
        // Don't autoplay — let user click play to avoid NotAllowedError
      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        videoEl.src = src;
      }
    };

    plyrInstance.on('ready', loadHls);
    videoEl.addEventListener('loadstart', loadHls);
    loadHls();

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      plyrInstance.off('ready', loadHls);
      videoEl.removeEventListener('loadstart', loadHls);
    };
  }, [plyrInstance, jellyfinSources]);

  // Inject Audio + Subtitle as proper Plyr sub-panels (identical animation/style to Quality)
  useEffect(() => {
    if (!plyrInstance) return;
    if (audioStreams.length === 0 && subtitleStreams.length === 0) return;

    const injectIntoSettings = () => {
      const menuContainer = document.querySelector('.plyr__menu__container') as HTMLElement;
      if (!menuContainer) return;

      const homePanel = menuContainer.querySelector('[id$="-home"]') as HTMLElement;
      if (!homePanel) return;

      // Remove previous injections
      menuContainer.querySelectorAll('.cj-panel').forEach(el => el.remove());
      homePanel.querySelectorAll('.cj-nav-btn').forEach(el => el.remove());

      // Track all our custom panels for safe show/hide (never touch Plyr's native panels)
      const cjPanels: HTMLElement[] = [];

      // ── helpers ────────────────────────────────────────────────────────────
      /** Show a custom sub-panel, hide homePanel and other cj-panels only */
      const showPanel = (target: HTMLElement) => {
        homePanel.hidden = true;
        cjPanels.forEach(p => { p.hidden = (p !== target); });
        target.hidden = false;
      };

      /** Return to the home panel, hiding all custom sub-panels */
      const showHome = () => {
        cjPanels.forEach(p => { p.hidden = true; });
        homePanel.hidden = false;
      };

      /** Create nav button for the home panel – exactly like the Quality button */
      const makeNavBtn = (labelText: string, currentValueText: string) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'plyr__control cj-nav-btn';
        btn.setAttribute('role', 'menuitem');
        btn.setAttribute('aria-haspopup', 'true');
        btn.innerHTML = `
          <span>${labelText}</span>
          <span class="plyr__menu__value cj-value">${currentValueText}</span>
        `;
        return btn;
      };

      /** Create a sub-panel div with back button and radio-style option buttons */
      const makeSubPanel = (panelLabel: string) => {
        const panel = document.createElement('div');
        // Do NOT use role=menu — avoids conflict with Plyr's native panel selectors
        panel.className = 'plyr__menu__container cj-panel';
        panel.style.cssText = 'position:absolute;bottom:100%;right:0;width:auto;min-width:150px;';
        panel.hidden = true;

        // Back button (exact same structure as Plyr's native back button)
        const backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.className = 'plyr__control plyr__menu__back';
        backBtn.setAttribute('role', 'menuitem');
        backBtn.innerHTML = `<span aria-hidden="true"></span><span>${panelLabel}</span>`;
        backBtn.addEventListener('click', () => showHome());
        panel.appendChild(backBtn);

        return panel;
      };

      /** Create a radio-style option button (like Quality options) */
      const makeOptionBtn = (label: string, isSelected: boolean, onClick: () => void) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'plyr__control';
        btn.setAttribute('role', 'menuitemradio');
        btn.setAttribute('aria-checked', String(isSelected));
        if (isSelected) btn.setAttribute('data-plyr-active', 'true');
        btn.innerHTML = `<span>${label}</span>`;
        btn.addEventListener('click', () => {
          btn.closest('.cj-panel')?.querySelectorAll('[role="menuitemradio"]').forEach((b: any) => {
            b.setAttribute('aria-checked', 'false');
            b.removeAttribute('data-plyr-active');
          });
          btn.setAttribute('aria-checked', 'true');
          btn.setAttribute('data-plyr-active', 'true');
          onClick();
          showHome(); // return to main settings panel after selection
        });
        return btn;
      };

      // ── AUDIO sub-panel ────────────────────────────────────────────────────
      if (audioStreams.length > 0) {
        const currentAudio = audioStreams.find((a: any) => a.Index === selectedAudio) || audioStreams[0];
        const currentLabel = shortLabel(currentAudio);

        const audioPanel = makeSubPanel('Audio');
        audioPanel.id = 'cj-audio-panel';

        audioStreams.forEach((a: any) => {
          const lbl = shortLabel(a);
          const isSelected = a.Index === selectedAudio;
          audioPanel.appendChild(makeOptionBtn(lbl, isSelected, () => {
            setSelectedAudio(a.Index);
            // Update value badge in nav button
            const badge = homePanel.querySelector('.cj-audio-value');
            if (badge) badge.textContent = lbl;
            setTimeout(() => { if (plyrInstance) plyrInstance.play(); }, 500);
          }));
        });

        const audioNavBtn = makeNavBtn('Audio', currentLabel);
        audioNavBtn.querySelector('.cj-value')?.classList.add('cj-audio-value');
        audioNavBtn.addEventListener('click', () => showPanel(audioPanel));
        homePanel.insertBefore(audioNavBtn, homePanel.firstChild);
        cjPanels.push(audioPanel);
        menuContainer.appendChild(audioPanel);
      }

      // ── SUBTITLES sub-panel ────────────────────────────────────────────────
      if (subtitleStreams.length > 0) {
        const currentSub = selectedSubtitle === -1 ? null : subtitleStreams.find((s: any) => s.Index === selectedSubtitle);
        const currentLabel = currentSub ? shortLabel(currentSub) : 'Off';

        const subPanel = makeSubPanel('Subtitles');
        subPanel.id = 'cj-sub-panel';

        // Off option
        subPanel.appendChild(makeOptionBtn('Off', selectedSubtitle === -1, () => {
          setSelectedSubtitle(-1);
          const badge = homePanel.querySelector('.cj-sub-value');
          if (badge) badge.textContent = 'Off';
        }));

        subtitleStreams.forEach((s: any) => {
          const lbl = shortLabel(s);
          const isSelected = s.Index === selectedSubtitle;
          subPanel.appendChild(makeOptionBtn(lbl, isSelected, () => {
            setSelectedSubtitle(s.Index);
            const badge = homePanel.querySelector('.cj-sub-value');
            if (badge) badge.textContent = lbl;
          }));
        });

        const subNavBtn = makeNavBtn('Subtitles', currentLabel);
        subNavBtn.querySelector('.cj-value')?.classList.add('cj-sub-value');
        subNavBtn.addEventListener('click', () => showPanel(subPanel));
        // Insert after audio nav btn (or first)
        const audioNavBtn = homePanel.querySelector('.cj-nav-btn');
        if (audioNavBtn && audioNavBtn.nextSibling) {
          homePanel.insertBefore(subNavBtn, audioNavBtn.nextSibling);
        } else {
          homePanel.insertBefore(subNavBtn, homePanel.firstChild);
        }
        cjPanels.push(subPanel);
        menuContainer.appendChild(subPanel);
      }
    };

    const settingsBtn = plyrInstance.elements.controls?.querySelector('[data-plyr="settings"]');
    if (settingsBtn) settingsBtn.addEventListener('click', injectIntoSettings);
    return () => {
      if (settingsBtn) settingsBtn.removeEventListener('click', injectIntoSettings);
    };
  }, [plyrInstance, audioStreams, subtitleStreams, selectedAudio, selectedSubtitle]);

  // Use ref for activeTab so channel effect doesn't re-subscribe on tab change
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  useEffect(() => {
    if (!id) return;

    const channel = supabase.channel(`watch-party-${id}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    let lastRemoteAt = 0;
    const markRemote = () => { lastRemoteAt = Date.now(); };
    const isFromRemote = () => Date.now() - lastRemoteAt < 1000;

    const safePlay = (p: any) => {
      try { const r = p.play(); if (r?.catch) r.catch(() => { }); } catch (_) { }
    };

    channel
      .on('broadcast', { event: 'video-state' }, ({ payload }) => {
        const player = plyrInstance || playerRef.current?.plyr;
        if (!player) return;
        markRemote();
        isRemoteAction.current = true;
        if (payload.action === 'play') {
          if (Math.abs(player.currentTime - payload.time) > 1) player.currentTime = payload.time;
          safePlay(player);
        } else if (payload.action === 'pause') {
          player.currentTime = payload.time;
          if (typeof player.pause === 'function') player.pause();
        } else if (payload.action === 'seek') {
          player.currentTime = payload.time;
        }
        setTimeout(() => { isRemoteAction.current = false; }, 1000);
      })
      .on('broadcast', { event: 'heartbeat' }, ({ payload }) => {
        const player = plyrInstance || playerRef.current?.plyr;
        if (!player) return;
        if (payload.playing && player.playing && Math.abs(player.currentTime - payload.time) > 1) {
          markRemote();
          isRemoteAction.current = true;
          player.currentTime = payload.time;
          setTimeout(() => { isRemoteAction.current = false; }, 500);
        }
      })
      .on('broadcast', { event: 'chat-message' }, ({ payload }) => {
        setMessages(prev => [...prev, payload]);
        if (activeTabRef.current !== 'chat') setUnreadMessages(prev => prev + 1);
      })
      .on('broadcast', { event: 'request-sync' }, () => {
        const player = plyrInstance || playerRef.current?.plyr;
        if (player) {
          channel.send({
            type: 'broadcast', event: 'sync-response',
            payload: { time: player.currentTime, playing: player.playing }
          });
        }
      })
      .on('broadcast', { event: 'sync-response' }, ({ payload }) => {
        const player = plyrInstance || playerRef.current?.plyr;
        if (!player) return;
        markRemote();
        isRemoteAction.current = true;
        player.currentTime = payload.time;
        if (payload.playing) safePlay(player);
        else if (typeof player.pause === 'function') player.pause();
        setTimeout(() => { isRemoteAction.current = false; }, 1000);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
          channel.send({ type: 'broadcast', event: 'request-sync', payload: {} });
        } else {
          setIsRealtimeConnected(false);
        }
      });

    // Heartbeat: broadcast position every 3s while playing
    const hb = setInterval(() => {
      const player = plyrInstance || playerRef.current?.plyr;
      if (player?.playing && channelRef.current && !isFromRemote()) {
        channelRef.current.send({
          type: 'broadcast', event: 'heartbeat',
          payload: { time: player.currentTime, playing: true }
        });
      }
    }, 3000);

    return () => {
      clearInterval(hb);
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsRealtimeConnected(false);
    };
  }, [id, plyrInstance]);

  // Broadcast local play/pause/seek with 500ms debounce
  useEffect(() => {
    const player = plyrInstance || playerRef.current?.plyr;
    if (!player || !id || typeof player.on !== 'function') return;

    let lastBroadcast = 0;
    const canBroadcast = () => {
      if (isRemoteAction.current || !channelRef.current) return false;
      const now = Date.now();
      if (now - lastBroadcast < 500) return false;
      lastBroadcast = now;
      return true;
    };

    const onPlay = () => {
      if (!canBroadcast()) return;
      channelRef.current!.send({
        type: 'broadcast', event: 'video-state',
        payload: { action: 'play', time: player.currentTime }
      });
    };
    const onPause = () => {
      if (!canBroadcast()) return;
      channelRef.current!.send({
        type: 'broadcast', event: 'video-state',
        payload: { action: 'pause', time: player.currentTime }
      });
    };
    const onSeek = () => {
      if (!canBroadcast()) return;
      channelRef.current!.send({
        type: 'broadcast', event: 'video-state',
        payload: { action: 'seek', time: player.currentTime }
      });
    };

    player.on('play', onPlay);
    player.on('pause', onPause);
    player.on('seeked', onSeek);

    return () => {
      if (player && typeof player.off === 'function') {
        player.off('play', onPlay);
        player.off('pause', onPause);
        player.off('seeked', onSeek);
      }
    };
  }, [id, plyrInstance]);

  const isCustomStream = media.streamUrl && media.streamUrl.trim() !== '';
  // True while fetching HLS sources from Jellyfin (stream URL present but HLS not ready yet)
  const isLoadingJellyfin = isCustomStream && media.streamUrl.includes('api_key=') && jellyfinSources.length === 0;

  const videoSource = useMemo(() => {
    // Jellyfin HLS sources ready — use them (best: quality selector, subtitles, audio)
    if (jellyfinSources.length > 0) {
      return {
        type: 'video' as const,
        sources: jellyfinSources,
        poster: media.backdropUrl,
      };
    }

    // Jellyfin is still loading — use the raw streamUrl as a hold-over
    // This avoids showing a test video while the HLS manifest is being built
    if (isCustomStream) {
      return {
        type: 'video' as const,
        sources: [
          {
            src: media.streamUrl,
            type: media.streamUrl.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4',
            size: 1080
          }
        ],
        poster: media.backdropUrl,
      };
    }

    // No stream source at all — empty placeholder (do not play demo)
    return {
      type: 'video' as const,
      sources: [],
      poster: media.backdropUrl,
    };
  }, [media.backdropUrl, media.streamUrl, isCustomStream, jellyfinSources]);

  const plyrOptions = useMemo(() => ({
    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
    settings: ['captions', 'quality', 'speed'],
    quality: {
      default: jellyfinSources.length > 0 ? jellyfinSources[0].size : 1080,
      options: jellyfinSources.length > 0 ? jellyfinSources.map(s => s.size) : [1080, 720, 480],
      forced: true,
      onChange: (qualityId: number) => {
        // Quality changed: swap HLS source, preserve current time
        const target = jellyfinSources.find(s => s.size === qualityId);
        if (!target) return;
        const instance = playerRef.current?.plyr;
        if (!instance?.elements?.wrapper) return;
        const videoEl = instance.elements.wrapper.querySelector('video') as HTMLVideoElement;
        if (!videoEl) return;
        const currentTime = instance.currentTime || 0;
        const wasPlaying = instance.playing;

        if (Hls.isSupported() && target.src.includes('.m3u8')) {
          if (hlsRef.current) hlsRef.current.destroy();
          hlsRef.current = new Hls({ maxLoadingDelay: 30, manifestLoadingTimeOut: 60000 });
          hlsRef.current.loadSource(target.src);
          hlsRef.current.attachMedia(videoEl);
          hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
            videoEl.currentTime = currentTime;
            if (wasPlaying) videoEl.play().catch(() => { });
          });
        } else {
          videoEl.src = target.src;
          videoEl.load();
          videoEl.addEventListener('loadeddata', () => {
            videoEl.currentTime = currentTime;
            if (wasPlaying) videoEl.play().catch(() => { });
          }, { once: true });
        }
      }
    },
    i18n: {
      qualityLabel: jellyfinQualitiesLabels
    },
    captions: {
      active: false,
      update: true,
    },
  }), [jellyfinSources, jellyfinQualitiesLabels]);

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

    // Broadcast message to others
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'chat-message',
        payload: msg
      });
    }
  };

  return (
    <div className="h-screen w-screen bg-black overflow-hidden flex flex-col md:flex-row">
      {/* Video Player Section */}
      <div className="flex-1 relative flex flex-col h-[40vh] md:h-full bg-black">
        {/* Back Button (Overlay) */}
        <div className={`absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <Link to={`/details/${media.id}`}>
            <button className="p-2 rounded-full bg-black/50 text-white hover:bg-white/20 backdrop-blur-sm" aria-label="Back to details">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>

          <div className="flex flex-col items-end gap-2">
            {isRealtimeConnected && isSupabaseConfigured ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 backdrop-blur-md">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Live Sync Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 backdrop-blur-md">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Demo Mode (No Sync)</span>
              </div>
            )}
          </div>
        </div>

        {/* Video Player */}
        <div
          className="relative w-full h-full bg-black flex items-center justify-center group [&_.plyr]:w-full [&_.plyr]:h-full [&_.plyr]:flex [&_.plyr]:items-center [&_.plyr]:justify-center [&_.plyr]:bg-black"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <Plyr
            key={media.id}
            ref={setPlayerRef}
            source={videoSource}
            options={plyrOptions}
          />
          {/* Jellyfin loading overlay */}
          {isLoadingJellyfin && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none">
              <div className="w-12 h-12 border-4 border-white/20 border-t-green-500 rounded-full animate-spin mb-4" />
              <p className="text-white font-semibold text-sm">Cargando episodio...</p>
              <p className="text-gray-400 text-xs mt-1">{media.title}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar (Chat & People) */}
      <div className="w-full md:w-96 bg-[#121212] border-l border-white/5 flex flex-col h-[60vh] md:h-full">
        {/* Tabs */}
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'chat' ? 'text-white border-b-2 border-green-500 bg-white/5' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
            {unreadMessages > 0 && activeTab !== 'chat' && (
              <span className="absolute top-3 right-8 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'people' ? 'text-white border-b-2 border-green-500 bg-white/5' : 'text-gray-500 hover:text-gray-300'
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
                    <div className={`px-4 py-2 rounded-2xl text-sm ${msg.userId === 'me'
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
                    <button className="p-2 rounded-full bg-white/5 hover:bg-white/10" aria-label={`Mute ${user.username}`}>
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
                aria-label="Chat message"
                className="w-full bg-[#1A1A1A] text-white rounded-full py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-gray-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button type="button" className="p-2 text-gray-400 hover:text-white transition-colors" aria-label="Add emoji">
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  aria-label="Send message"
                  className="p-2 bg-green-500 text-black rounded-full hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div >
  );
}
