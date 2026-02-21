/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Friends } from './pages/Friends';
import { Servers } from './pages/Servers';
import { Profile } from './pages/Profile';
import { Library } from './pages/Library';
import { WatchParty } from './pages/WatchParty';
import { Details } from './pages/Details';
import { Login } from './pages/Login';
import { supabase } from './lib/supabase';

// Media Pages
function MediaPage({ title, type }: { title: string, type: string }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">{title}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {/* Filtered content would go here */}
        <p className="text-gray-400 col-span-full">No {title.toLowerCase()} found in your library.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle demo login for preview
    const handleDemo = () => {
      setSession({ user: { id: 'demo-user', email: 'demo@example.com' } });
    };
    window.addEventListener('demo-login', handleDemo);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('demo-login', handleDemo);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0A0A0A]">
        <div className="w-12 h-12 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<MediaPage title="Movies" type="movie" />} />
          <Route path="/tv-shows" element={<MediaPage title="TV Shows" type="tv" />} />
          <Route path="/live" element={<MediaPage title="Live TV" type="live" />} />
          <Route path="/my-list" element={<MediaPage title="My List" type="mylist" />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/servers" element={<Servers />} />
          <Route path="/library" element={<Library />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/details/:id" element={<Details />} />
          <Route path="/watch/:id" element={<WatchParty />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
