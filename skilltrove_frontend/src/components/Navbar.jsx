import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { Bell, Search, User, LogOut, ShieldCheck, BadgeCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

/**
 * @function LogoBadge
 * @description Renders the SkillTrove brand identity with a security badge.
 */
const LogoBadge = React.memo(() => {
  return (
    <NavLink to="/" className="group flex items-center gap-3">
      <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-orange-500 shadow-lg transition-transform group-hover:scale-110">
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-600 to-orange-400" />
        <span className="relative flex h-full items-center justify-center font-black text-white italic">ST</span>
      </div>
      <div className="hidden sm:block">
        <h1 className="text-xl font-black tracking-tighter text-white">
          SKILL<span className="text-orange-500">TROVE</span>
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 leading-none">AI Proctoring</p>
      </div>
    </NavLink>
  );
});

/**
 * @function StudentNavbar
 * @description Navigation component for Student users with role-based links and glassmorphism UI.
 */
const Navbar = ({ normalized, unreadCount, setUnreadCount }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);

  const navClass = useCallback(({ isActive }) =>
    `relative text-sm font-bold tracking-tight transition-colors ${
      isActive ? 'text-orange-500' : 'text-zinc-400 hover:text-white'
    }`, []);

  const handleToggleNotif = useCallback(() => {
    setNotifOpen(prev => !prev);
  }, []);

  const handleCloseNotif = useCallback(() => {
    setNotifOpen(false);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-[100] border-b border-white/5 bg-slate-950/80 py-4 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-10">
        <LogoBadge />

        <div className="hidden items-center gap-8 md:flex">
          {isAuthenticated ? (
            <>
              <NavLink to="/" className={navClass}>Assessment</NavLink>
              <NavLink to="/community" className={navClass}>Community</NavLink>
              <NavLink to="/leaderboard" className={navClass}>Rankings</NavLink>
              <NavLink to="/about" className={navClass}>About Us</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/about" className={navClass}>Mission</NavLink>
              <NavLink to="/login" className={navClass}>Login</NavLink>
            </>
          )}
        </div>

        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <div className="relative">
                <div 
                  onClick={handleToggleNotif}
                  className={`relative cursor-pointer transition-colors ${notifOpen ? 'text-orange-500' : 'text-zinc-400 hover:text-white'}`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-black text-white shadow-lg">
                      {unreadCount}
                    </span>
                  )}
                </div>
                
                <NotificationCenter 
                  isOpen={notifOpen} 
                  onClose={handleCloseNotif}
                  setUnreadCount={setUnreadCount}
                />
              </div>
              <div className="h-8 w-[1px] bg-white/5" />
              <div className="flex items-center gap-3">
                 <NavLink to="/settings" className="group h-10 w-10 overflow-hidden rounded-xl border-2 border-white/10 transition-all hover:border-orange-500">
                   <img 
                    src={user?.profileImage || localStorage.getItem('skilltrove_profileImage') || 'https://dummyimage.com/100x100/151515/ff6a00.jpg&text=Avatar'} 
                    alt="Profile" 
                    className="h-full w-full object-cover" 
                   />
                 </NavLink>
                 <button 
                  onClick={logout}
                  className="rounded-xl bg-white/5 p-2 text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-500"
                  title="Logout"
                 >
                   <LogOut size={20} />
                 </button>
              </div>
            </>
          ) : (
            <NavLink
              to="/signup"
              className="rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95"
            >
              Sign Up
            </NavLink>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default React.memo(Navbar);
