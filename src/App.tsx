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
import { Login } from './pages/Login';

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
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/friends" element={<Layout><Friends /></Layout>} />
        <Route path="/servers" element={<Layout><Servers /></Layout>} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />
        <Route path="/details/:id" element={<Layout><Details /></Layout>} />
        <Route path="/watch/:id" element={<WatchParty />} />
        <Route path="/category/:type" element={<Layout><Placeholder title="Category" /></Layout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
