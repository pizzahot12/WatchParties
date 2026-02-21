/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Friends } from './pages/Friends';
import { Servers } from './pages/Servers';
import { Profile } from './pages/Profile';
import { WatchParty } from './pages/WatchParty';
import { Details } from './pages/Details';

// Placeholder components for pages not yet implemented
function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-8 flex flex-col items-center justify-center h-full min-h-[50vh]">
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <p className="text-gray-400">Coming soon...</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/servers" element={<Servers />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/details/:id" element={<Details />} />
          <Route path="/watch/:id" element={<WatchParty />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
