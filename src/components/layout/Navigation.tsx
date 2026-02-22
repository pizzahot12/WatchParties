import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, Server, User, Play, Monitor, LogOut, Library, Tv, Menu, X } from 'lucide-react';
import { cn } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function Sidebar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Play, label: 'Movies', path: '/movies' },
    { icon: Monitor, label: 'TV Shows', path: '/tv-shows' },
    { icon: Tv, label: 'Rooms', path: '/rooms' },
    { icon: Users, label: 'Friends', path: '/friends' },
    { icon: Server, label: 'Servers', path: '/servers' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'User';

  const avatarUrl = user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (user?.email || 'user');

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-[#121212] border-r border-white/5 z-50">
      {/* Logo */}
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20">
          <Play className="w-4 h-4 text-white fill-current" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-white">StreamParty</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-white/10 text-white font-medium shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="px-4 py-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </button>
      </div>

      {/* User Status */}
      <div className="p-4 border-t border-white/5 bg-[#0A0A0A]">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => navigate('/profile')}>
          <div className="relative">
            <img
              src={avatarUrl}
              alt="My Avatar"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-white/20 transition-all bg-white/5"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#121212]"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate group-hover:text-gray-300">Online</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Play, label: 'Movies', path: '/movies' },
    { icon: Monitor, label: 'TV Shows', path: '/tv-shows' },
    { icon: Tv, label: 'Rooms', path: '/rooms' },
    { icon: Users, label: 'Friends', path: '/friends' },
    { icon: Server, label: 'Servers', path: '/servers' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'User';

  const avatarUrl = user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (user?.email || 'user');

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-black shadow-lg shadow-green-500/30 z-40 transition-transform active:scale-95"
      >
        <Menu className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 flex"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-64 h-full bg-[#121212] flex flex-col shadow-2xl"
            >
              {/* Logo & Close Button */}
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20">
                    <Play className="w-4 h-4 text-white fill-current" />
                  </div>
                  <span className="font-display font-bold text-xl tracking-tight text-white">StreamParty</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Menu</p>
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                        isActive
                          ? "bg-white/10 text-white font-medium shadow-sm"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn("w-5 h-5 transition-transform duration-200 group-hover:scale-110", isActive && "text-green-400")} />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>

              {/* User Status / Bottom Actions */}
              <div className="border-t border-white/5 bg-[#0A0A0A]">
                <div className="px-4 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200 group"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Log Out</span>
                  </button>
                </div>
                <div
                  className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors cursor-pointer group border-t border-white/5"
                  onClick={() => { setIsOpen(false); navigate('/profile'); }}
                >
                  <div className="relative">
                    <img
                      src={avatarUrl}
                      alt="My Avatar"
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-white/20 transition-all bg-white/5"
                    />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#121212]"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{displayName}</p>
                    <p className="text-xs text-gray-400 truncate group-hover:text-gray-300">Online</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
