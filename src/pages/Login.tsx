import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Play, Mail, Lock, Github, Chrome, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // This is a hack for AI Studio preview to allow seeing the app without Supabase
    // In a real app, you'd never do this.
    window.dispatchEvent(new CustomEvent('demo-login'));
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured for OAuth.");
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) {
        if (error.message.includes('OAuth secret')) {
          throw new Error(`The ${provider} login is not configured in your Supabase dashboard yet. Please use "Demo Mode" to test the app.`);
        }
        throw error;
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0A] p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#121212] rounded-3xl p-8 border border-white/5 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 mb-4">
            <Play className="w-6 h-6 text-white fill-current" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {isSignUp ? 'Join the ultimate watch party' : 'Sign in to continue to StreamParty'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isSupabaseConfigured && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">Configuration Required</p>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Supabase credentials are missing. Real-time features and authentication will not work until configured.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!isSupabaseConfigured}
                className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!isSupabaseConfigured}
                className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-400/10 p-3 rounded-xl border border-red-400/20">
              {error}
            </p>
          )}

          <Button 
            type="submit" 
            className="w-full py-4 rounded-2xl font-bold text-lg"
            disabled={loading || !isSupabaseConfigured}
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>

          <div className="space-y-4 pt-2">
            <Button 
              type="button"
              variant="primary"
              onClick={handleDemoLogin}
              className="w-full py-4 rounded-2xl font-bold text-lg bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/20"
            >
              Enter Demo Mode (Instant Access)
            </Button>
            <p className="text-center text-[10px] text-gray-500 italic">
              Use this to skip login and see the app features immediately.
            </p>
          </div>
        </form>

        <div className="mt-8">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative px-4 text-xs font-semibold text-gray-500 uppercase bg-[#121212]">Or continue with</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl py-3 transition-colors"
            >
              <Chrome className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white">Google</span>
            </button>
            <button 
              onClick={() => handleOAuth('github')}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl py-3 transition-colors"
            >
              <Github className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white">GitHub</span>
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-green-400 hover:text-green-300 font-semibold"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
