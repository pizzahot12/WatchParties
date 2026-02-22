import React, { useEffect, useRef, useState } from 'react';
import { User as UserIcon, Settings, LogOut, CreditCard, Shield, Palette, Camera, Upload } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';

export function Profile() {
  const [user, setUser] = useState<any>(null);
  const [movieCount, setMovieCount] = useState(0);
  const [seriesCount, setSeriesCount] = useState(0);

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Avatar upload states
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        setEditName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '');
        setEditBio(user.user_metadata?.bio || '');
        setAvatarPreview(user.user_metadata?.avatar_url || null);
      }
    });

    try {
      const movies = JSON.parse(localStorage.getItem('streamparty_synced_movies') || '[]');
      const series = JSON.parse(localStorage.getItem('streamparty_synced_series') || '[]');
      setMovieCount(movies.length);
      setSeriesCount(series.length);
    } catch (_) { }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image is too large. Please choose an image under 5 MB.');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, GIF, WebP).');
      return;
    }

    setAvatarFile(file);
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    let newAvatarUrl = user?.user_metadata?.avatar_url || null;

    // Upload avatar if a new file was picked
    if (avatarFile && user) {
      setIsUploadingAvatar(true);
      const ext = avatarFile.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true, contentType: avatarFile.type });

      setIsUploadingAvatar(false);

      if (uploadError) {
        alert('Error uploading avatar: ' + uploadError.message);
        setIsSaving(false);
        return;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      // Append a cache-busting timestamp so the browser always shows the new image
      newAvatarUrl = urlData.publicUrl + '?t=' + Date.now();
    }

    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: editName,
        avatar_url: newAvatarUrl,
        bio: editBio
      }
    });

    setIsSaving(false);

    if (error) {
      alert('Error saving profile: ' + error.message);
    } else if (data.user) {
      setUser(data.user);
      setAvatarFile(null);
      setIsEditing(false);
    }
  };

  const handleOpenEdit = () => {
    setAvatarPreview(user?.user_metadata?.avatar_url || null);
    setAvatarFile(null);
    setIsEditing(true);
  };

  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'User';
  const email = user?.email || 'user@example.com';
  const bio = user?.user_metadata?.bio || 'No bio provided.';
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const currentAvatar = user?.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${user?.id || 'me'}`;

  return (
    <div className="p-6 md:p-12 pb-24 max-w-4xl mx-auto">
      <h1 className="text-3xl font-display font-bold mb-8">My Profile</h1>

      {/* Profile Card */}
      <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-green-400 to-blue-500">
            <img
              src={currentAvatar}
              alt="Profile"
              className="w-full h-full rounded-full object-cover border-4 border-[#1A1A1A]"
            />
          </div>
          <button
            className="absolute bottom-0 right-0 p-2 bg-white text-black rounded-full hover:scale-110 transition-transform"
            onClick={handleOpenEdit}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold mb-1">{displayName}</h2>
          <p className="text-gray-400 mb-2">{email} • Joined {joinDate}</p>
          <p className="text-sm text-gray-300 mb-4 max-w-md mx-auto md:mx-0">{bio}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold uppercase tracking-wider border border-purple-500/20">
              Pro Member
            </span>
          </div>
        </div>

        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-mono font-bold">{movieCount}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Movies</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold">{seriesCount}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Series</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold">{movieCount + seriesCount}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { id: 'settings', icon: UserIcon, label: 'Account Settings', desc: 'Manage your personal details', action: handleOpenEdit },
          { id: 'appearance', icon: Palette, label: 'Appearance', desc: 'Theme and player customization', action: () => { } },
          { id: 'privacy', icon: Shield, label: 'Privacy & Security', desc: 'Control who sees your activity', action: () => { } },
          { id: 'billing', icon: CreditCard, label: 'Billing', desc: 'Manage your subscription', action: () => { } },
        ].map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className="flex items-center gap-4 p-4 rounded-xl bg-[#1A1A1A] border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <item.icon className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">{item.label}</h3>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button variant="danger" className="w-full md:w-auto px-8" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-6">Edit Profile</h2>

            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-green-400 to-blue-500">
                  <img
                    src={avatarPreview || currentAvatar}
                    alt="Avatar Preview"
                    className="w-full h-full rounded-full object-cover border-4 border-[#1A1A1A]"
                  />
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {avatarFile ? avatarFile.name : 'Choose image from device'}
              </button>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF or WebP — max 5 MB</p>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Display Name</label>
                <input
                  type="text"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Bio</label>
                <textarea
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors h-24 resize-none"
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Tell us about your favorite movies..."
                  maxLength={150}
                />
                <p className="text-xs text-gray-600 text-right">{editBio.length}/150</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSaveProfile} disabled={isSaving || isUploadingAvatar}>
                {isUploadingAvatar ? 'Uploading...' : isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
