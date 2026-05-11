import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Moon, SunMedium, ChevronDown } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

function LogoBadge({ normalized }) {
  return (
    <motion.div
      className="relative flex items-center gap-3 rounded-3xl border border-white/20 bg-white/5 px-4 py-2 backdrop-blur-xl"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      whileHover={{
        rotateX: -normalized.y * 9,
        rotateY: normalized.x * 14,
        scale: 1.02,
      }}
    >
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-black/40 shadow-[0_0_15px_rgba(249,115,22,0.2)] border border-white/10">
        <img src={require('../assets/logo.jpeg')} alt="SkillTrove Logo" className="h-7 w-auto drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
      </div>
      <div>
        <h1 className="text-xl font-black tracking-tight text-white">SkillTrove</h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Securing Proctoring Platform</p>
      </div>
    </motion.div>
  );
}

export default function Navbar({ normalized, unreadCount = 0 }) {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout, user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navClass = ({ isActive }) => `px-4 py-2 text-sm font-semibold transition-colors ${isActive ? 'text-orange-600' : 'text-slate-600 hover:text-orange-500'}`;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/40 backdrop-blur-md border-b border-white/10 py-2' : 'bg-transparent py-4'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-10">
        <LogoBadge normalized={normalized} />
        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <NavLink to="/" className={navClass}>AI Quiz</NavLink>
              <NavLink to="/check" className={navClass}>Check</NavLink>
              <NavLink to="/quiz" className={navClass}>Quiz</NavLink>
              <NavLink to="/community" className={navClass}>Community</NavLink>
              <NavLink to="/leaderboard" className={navClass}>Leaderboard</NavLink>
              <NavLink to="/about" className={navClass}>About</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navClass}>Login</NavLink>
              <NavLink to="/signup" className={navClass}>Signup</NavLink>
            </>
          )}
          <motion.button
            className="relative rounded-2xl border border-orange-300/40 bg-black/25 p-2 text-orange-200"
            whileHover={{ y: -2 }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <>
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_15px_rgba(255,120,40,.85)] animate-pulse" />
                <span className="absolute -right-2 -top-2 rounded-full border border-orange-200/40 bg-orange-500/80 px-1 text-[10px] font-bold leading-4 text-white">
                  {unreadCount}
                </span>
              </>
            )}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ y: -2 }}
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-2xl border border-orange-400/40 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-100 backdrop-blur-xl"
          >
            {theme === 'dark' ? <SunMedium size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Crystal Light' : 'Cyber Neon'}
          </motion.button>
          {isAuthenticated && (
            <div className="relative ml-2 z-50">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
                className="flex items-center gap-2 rounded-full border border-orange-400/40 p-1 pr-3 hover:bg-white/5 transition-colors backdrop-blur-md bg-black/20"
              >
                <img 
                   src={user?.profileImage || localStorage.getItem('skilltrove_profileImage') || 'https://dummyimage.com/100x100/151515/ff6a00.jpg&text=Avatar'} 
                   alt="Avatar" 
                   className="h-8 w-8 rounded-full object-cover border border-orange-500/50" 
                />
                <span className="text-sm font-semibold text-white">{user?.name || 'User'}</span>
                <ChevronDown size={14} className="text-zinc-400" />
              </button>
              
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-white/20 bg-black/60 backdrop-blur-3xl shadow-[0_0_20px_rgba(249,115,22,0.15)]"
                  >
                    <div className="p-4 border-b border-white/10">
                       <p className="text-sm font-bold text-white truncate">{user?.name || 'Student'}</p>
                       <p className="text-xs text-zinc-400 truncate">{user?.email || 'N/A'}</p>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                       <NavLink to="/settings" onClick={() => setDropdownOpen(false)} className="block w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-white/10 rounded-xl transition">Profile Settings</NavLink>
                       <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 rounded-xl transition">Logout</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
