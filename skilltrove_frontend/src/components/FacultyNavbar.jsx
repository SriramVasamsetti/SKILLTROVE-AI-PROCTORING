import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { Bell, LogOut, LayoutDashboard, PlusCircle, Users, Settings, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';
import { useState } from 'react';


/**
 * @function FacultyNavbar
 * @description specialized navigation for Faculty/Staff users.
 * Features a distinct Slate/Cyan theme to differentiate from the Student environment.
 */
export default function FacultyNavbar({ unreadCount, setUnreadCount }) {
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const navClass = ({ isActive }) =>
    `relative text-xs font-black uppercase tracking-widest transition-all ${
      isActive ? 'text-cyan-400' : 'text-zinc-500 hover:text-white'
    }`;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-[100] border-b border-cyan-500/10 bg-slate-950/90 py-5 backdrop-blur-2xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-10">
        <NavLink to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500 flex items-center justify-center font-black text-slate-950 italic shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            FAC
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white">
              STAFF<span className="text-cyan-400">HUB</span>
            </h1>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 leading-none">Command Center</p>
          </div>
        </NavLink>

        <div className="hidden items-center gap-10 lg:flex">
          <NavLink to="/" className={navClass}>Dashboard</NavLink>
          <NavLink to="/faculty-dashboard" className={navClass}>AI Generator</NavLink>
          <NavLink to="/community" className={navClass}>Faculty Forum</NavLink>
          <NavLink to="/settings" className={navClass}>Preferences</NavLink>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <div 
              onClick={() => setNotifOpen(!notifOpen)}
              className={`relative cursor-pointer transition-colors ${notifOpen ? 'text-cyan-400' : 'text-zinc-500 hover:text-cyan-400'}`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[8px] font-black text-slate-950">
                  {unreadCount}
                </span>
              )}
            </div>
            
            <NotificationCenter 
              isOpen={notifOpen} 
              onClose={() => setNotifOpen(false)}
              setUnreadCount={setUnreadCount}
            />
          </div>
          
          <div className="h-8 w-[1px] bg-white/5" />
          
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-white uppercase tracking-wider">{user?.name || 'Professor'}</p>
                <p className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest">Authorized Faculty</p>
             </div>
             <div className="h-10 w-10 overflow-hidden rounded-xl border-2 border-cyan-500/30">
               <img 
                src={user?.profileImage || localStorage.getItem('skilltrove_profileImage') || 'https://dummyimage.com/100x100/151515/06b6d4.jpg&text=F'} 
                alt="Faculty Profile" 
                className="h-full w-full object-cover" 
               />
             </div>
             <button 
              onClick={logout}
              className="rounded-xl bg-white/5 p-2 text-zinc-500 transition-all hover:bg-red-500/10 hover:text-red-500"
              title="Secure Logout"
             >
               <LogOut size={18} />
             </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
