import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJellyfinStore } from '../store/jellyfinStore';
import { supabase } from '../lib/supabase';

export function Login() {
  const navigate = useNavigate();
  const { setServerUrl, setAccessToken, setUserId } = useJellyfinStore();
  
  const [serverUrlInput, setServerUrlInput] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJellyfinLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Basic Jellyfin authentication logic
      // In a real app, you would call the Jellyfin API: /Users/AuthenticateByName
      const authUrl = `${serverUrlInput}/Users/AuthenticateByName`;
      
      // Mocking the request for demonstration if no real server is available
      // Or implementing the actual fetch if the user provides a real URL
      
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Emby-Authorization': 'MediaBrowser Client="Jellyfin React", Device="Web", DeviceId="random-device-id", Version="1.0.0"'
        },
        body: JSON.stringify({
          Username: username,
          Pw: password
        })
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with Jellyfin');
      }

      const data = await response.json();
      
      setServerUrl(serverUrlInput);
      setAccessToken(data.AccessToken);
      setUserId(data.User.Id);
      
      navigate('/watch-party/demo'); // Redirect to a demo watch party or dashboard
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Login failed');
      // For demo purposes, allow bypassing if it fails (mock mode)
      if (serverUrlInput === 'demo') {
          setServerUrl('https://demo.jellyfin.org/stable');
          setAccessToken('demo-token');
          setUserId('demo-user');
          navigate('/watch-party/demo');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSupabaseLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/watch-party/demo`
      }
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121212] p-8 rounded-2xl border border-white/10">
        <h1 className="text-3xl font-bold mb-6 text-center">Jellyfin Watch Party</h1>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleJellyfinLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Server URL</label>
            <input
              type="text"
              value={serverUrlInput}
              onChange={(e) => setServerUrlInput(e.target.value)}
              placeholder="https://jellyfin.example.com"
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-green-500 transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-green-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-green-500 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect to Jellyfin'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10">
          <button
            onClick={handleSupabaseLogin}
            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
