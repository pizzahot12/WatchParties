import React, { useState, useRef } from 'react';
import { Upload, FileVideo, Trash2, Play, Plus, Search, Filter, MoreVertical, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface MediaFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
  thumbnailUrl: string;
  duration: string;
}

const initialLibrary: MediaFile[] = [
  {
    id: 'lib-1',
    name: 'Summer Vacation 2023.mp4',
    size: '1.2 GB',
    type: 'video/mp4',
    uploadDate: '2023-08-15',
    thumbnailUrl: 'https://picsum.photos/seed/vacation/400/225',
    duration: '12:45'
  },
  {
    id: 'lib-2',
    name: 'Wedding Ceremony.mkv',
    size: '4.5 GB',
    type: 'video/x-matroska',
    uploadDate: '2023-12-20',
    thumbnailUrl: 'https://picsum.photos/seed/wedding/400/225',
    duration: '45:12'
  }
];

export function Library() {
  const [library, setLibrary] = useState<MediaFile[]>(initialLibrary);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          const newFile: MediaFile = {
            id: `lib-${Date.now()}`,
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            type: file.type,
            uploadDate: new Date().toISOString().split('T')[0],
            thumbnailUrl: `https://picsum.photos/seed/${file.name}/400/225`,
            duration: '00:00' // Mock duration
          };

          setLibrary([newFile, ...library]);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const deleteFile = (id: string) => {
    setLibrary(library.filter(f => f.id !== id));
  };

  const startWatchParty = (file: MediaFile) => {
    // In a real app, we'd pass the file ID or URL to the watch party
    navigate(`/watch/${file.id}`);
  };

  return (
    <div className="p-6 md:p-12 pb-24 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Personal Library</h1>
          <p className="text-gray-400 text-sm">Upload and stream your own media files</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search library..."
              className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            className="hidden" 
            accept="video/*"
          />
          <Button onClick={() => fileInputRef.current?.click()} className="gap-2 shrink-0">
            <Upload className="w-4 h-4" />
            Upload Media
          </Button>
        </div>
      </div>

      {isUploading && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-green-500/10 border border-green-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-green-500 animate-spin" />
              </div>
              <div>
                <p className="font-bold text-white">Uploading Media...</p>
                <p className="text-xs text-gray-400">Please don't close this tab</p>
              </div>
            </div>
            <span className="font-mono font-bold text-green-500">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
            />
          </div>
        </motion.div>
      )}

      {library.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <FileVideo className="w-10 h-10 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Your library is empty</h2>
          <p className="text-gray-500 max-w-xs mb-8">Upload your first video file to start a private watch party with friends.</p>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            Browse Files
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {library.map((file) => (
            <motion.div 
              layout
              key={file.id}
              className="group bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all"
            >
              <div className="relative aspect-video">
                <img 
                  src={file.thumbnailUrl} 
                  alt={file.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <Button onClick={() => startWatchParty(file)} size="sm" className="rounded-full">
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Watch
                  </Button>
                </div>
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-md rounded text-[10px] font-bold font-mono text-white">
                  {file.duration}
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-white truncate flex-1" title={file.name}>
                    {file.name}
                  </h3>
                  <button 
                    onClick={() => deleteFile(file.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                  <span>{file.size}</span>
                  <span>{file.uploadDate}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
