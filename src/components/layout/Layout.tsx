import { ReactNode } from 'react';
import { Sidebar, MobileNav } from './Navigation';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  // Hide navigation on the watch party page for immersive experience
  const isWatchParty = location.pathname.includes('/watch/');

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-green-500/30">
      {!isWatchParty && <Sidebar />}
      
      <main className={`
        min-h-screen transition-all duration-300
        ${!isWatchParty ? 'xl:pl-64 pb-20 xl:pb-0' : ''}
      `}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {!isWatchParty && <MobileNav />}
    </div>
  );
}
