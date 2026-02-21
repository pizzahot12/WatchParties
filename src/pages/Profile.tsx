import { User, Settings, LogOut, CreditCard, Shield, Palette } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function Profile() {
  return (
    <div className="p-6 md:p-12 pb-24 max-w-4xl mx-auto">
      <h1 className="text-3xl font-display font-bold mb-8">My Profile</h1>

      <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-green-400 to-blue-500">
            <img 
              src="https://i.pravatar.cc/150?u=me" 
              alt="Profile" 
              className="w-full h-full rounded-full object-cover border-4 border-[#1A1A1A]"
            />
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-white text-black rounded-full hover:scale-110 transition-transform">
            <Settings className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold mb-1">Alex Chen</h2>
          <p className="text-gray-400 mb-4">@alexc • Joined March 2024</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold uppercase tracking-wider border border-purple-500/20">
              Pro Member
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-xs font-bold uppercase tracking-wider border border-white/10">
              Level 12
            </span>
          </div>
        </div>

        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-mono font-bold">142</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Movies</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold">28</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Friends</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold">456h</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Time</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: User, label: 'Account Settings', desc: 'Manage your personal details' },
          { icon: Palette, label: 'Appearance', desc: 'Theme and player customization' },
          { icon: Shield, label: 'Privacy & Security', desc: 'Control who sees your activity' },
          { icon: CreditCard, label: 'Billing', desc: 'Manage your subscription' },
        ].map((item) => (
          <button key={item.label} className="flex items-center gap-4 p-4 rounded-xl bg-[#1A1A1A] border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all text-left group">
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
        <Button variant="danger" className="w-full md:w-auto px-8">
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
