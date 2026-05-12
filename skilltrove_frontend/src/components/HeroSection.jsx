import { motion } from 'framer-motion';
import { Camera, Users, ShieldCheck, FileText, CheckCircle2, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    title: 'Identity Lock',
    subtitle: 'Login vs Quiz face match prevents substitute test-takers.',
    icon: Users,
    accent: 'from-orange-500/45 to-red-500/20',
  },
  {
    title: '3-Strike Proctoring',
    subtitle: 'Auto-termination upon head movement or missing faces.',
    icon: ShieldCheck,
    accent: 'from-cyan-500/45 to-blue-500/20',
  },
  {
    title: 'Analytics & Reports',
    subtitle: 'High-fidelity PDF reports with embedded snapshot proof.',
    icon: FileText,
    accent: 'from-amber-400/40 to-orange-500/20',
  },
];

const TIMELINE = [
  { step: 1, title: 'Signup', desc: 'Face Biometric Capture', icon: Camera },
  { step: 2, title: 'System Check', desc: 'Hardware Verification', icon: CheckCircle2 },
  { step: 3, title: 'AI Exam', desc: 'Continuous Proctoring', icon: ShieldCheck },
  { step: 4, title: 'Instant Report', desc: 'AI-Powered Analysis', icon: FileText },
];

export default function HeroSection({ normalized, onStartCheck }) {
  const { user } = useAuth();
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetch('http://localhost:5050/api/leaderboard')
      .then(res => res.json())
      .then(data => {
         if (!Array.isArray(data)) return;
         const me = data.find(d => String(d.userId) === String(user?.id));
         if (me?.heatmap) {
           setHeatmapData(me.heatmap.map(h => ({ date: h.date, count: h.count })));
         }
      })
      .catch(console.error);
  }, [user]);

  return (
    <section className="mx-auto mt-4 max-w-7xl px-6 pb-16 pt-6 md:px-10">
      <motion.div
        initial={{ opacity: 0, y: 25, rotateX: 5, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
        whileHover={{
          rotateX: -normalized.y * 5,
          rotateY: normalized.x * 5,
        }}
        style={{ transformStyle: 'preserve-3d', perspective: 1500 }}
        className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/5 p-8 backdrop-blur-2xl md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-cyan-500/10" />
        
        {/* Animated Background SVG Accents */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
           <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                 <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                 </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <circle cx="80%" cy="20%" r="150" fill="rgba(6,182,212,0.1)" filter="blur(60px)" />
              <circle cx="20%" cy="80%" r="200" fill="rgba(249,115,22,0.1)" filter="blur(80px)" />
           </svg>
        </div>
        <motion.div
          className="absolute -right-28 -top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl"
          animate={{
            x: normalized.x * 45,
            y: normalized.y * 35,
          }}
        />
        <motion.div
          className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-red-500/15 blur-3xl"
          animate={{
            x: -normalized.x * 50,
            y: -normalized.y * 40,
          }}
        />

        <div className="relative z-10 text-center" style={{ transform: 'translate3d(0px, 0px, 50px)' }}>
          <p className="inline-flex rounded-full border border-cyan-400/50 bg-cyan-500/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
            Welcome to the future of exams
          </p>
          <h1 
            className="mt-5 max-w-3xl mx-auto text-5xl font-extrabold tracking-tight text-white dark:text-white md:text-7xl"
            style={{ textShadow: "0 10px 25px rgba(0,0,0,0.5), 0 0 45px rgba(249,115,22,0.6)" }}
          >
            SkillTrove
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-zinc-200/85 dark:text-zinc-200/85 md:text-xl font-medium">
            Securing Proctoring Platform
          </p>
          <motion.button
            type="button"
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartCheck}
            className="mt-8 rounded-full border border-cyan-400/60 bg-gradient-to-r from-cyan-600/50 to-blue-600/50 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_35px_rgba(6,182,212,.5)] backdrop-blur-md transition-all hover:shadow-[0_0_50px_rgba(6,182,212,.8)]"
          >
            Get Started
          </motion.button>
        </div>
        <div className="relative z-10 mt-16 grid grid-cols-1 md:grid-cols-3 gap-6" style={{ transform: 'translate3d(0px, 0px, 30px)' }}>
          {[
            { label: 'Total Assessments', value: '24,000+' },
            { label: 'Verified Identities', value: '99.9%' },
            { label: 'Security Strikes Prevented', value: '1,200+' }
          ].map(stat => (
            <motion.div key={stat.label} whileHover={{ y: -5, scale: 1.02 }} className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
               <h4 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">{stat.value}</h4>
               <p className="mt-2 text-sm uppercase tracking-widest text-zinc-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 mt-20" style={{ transform: 'translate3d(0px, 0px, 20px)' }}>
          <h2 className="mb-8 text-center text-2xl font-bold uppercase tracking-[0.15em] text-white">How It Works</h2>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-center">
            {TIMELINE.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="flex flex-col items-center flex-1">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.2 }}
                    className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-orange-400/50 bg-black/40 shadow-[0_0_20px_rgba(249,115,22,0.3)] backdrop-blur-md"
                  >
                    <Icon className="text-orange-300" size={24} />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-xs font-bold text-white shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                      {item.step}
                    </span>
                  </motion.div>
                  <h4 className="mt-4 text-center font-bold text-white">{item.title}</h4>
                  <p className="text-center text-xs text-zinc-400 mt-1 max-w-[150px]">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 mt-20">
          <h2 className="mb-8 text-center text-2xl font-bold uppercase tracking-[0.15em] text-white">Core Features</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  key={feature.title}
                  className="group relative overflow-hidden rounded-3xl border border-white/20 bg-black/25 p-5 backdrop-blur-xl"
                  style={{ transformStyle: 'preserve-3d' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.1 }}
                  whileHover={{
                    rotateX: -normalized.y * 8,
                    rotateY: normalized.x * 12,
                    y: -8,
                  }}
                >
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.accent}`}
                    animate={{ opacity: [0.35, 0.55, 0.35] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                  />
                  <motion.div
                    className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-300/30 bg-orange-500/15"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 2.8, delay: i * 0.2 }}
                  >
                    <Icon className="text-orange-200" size={22} />
                  </motion.div>
                  <h3 className="relative text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="relative mt-2 text-sm text-zinc-200/85">{feature.subtitle}</p>
                </motion.article>
              );
            })}
          </div>
          </div>

        <div className="relative z-10 mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <h2 className="text-2xl font-bold uppercase tracking-[0.15em] text-white">Community Orbit</h2>
            <Link to="/community" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300">View All Discussions →</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-4 md:grid-rows-2">
            <motion.div whileHover={{ y:-4, rotateX: 2, rotateY: -2 }} className="md:col-span-2 md:row-span-2 rounded-[2rem] border border-white/20 bg-black/40 p-8 backdrop-blur-xl flex flex-col justify-between group shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
              <div className="bg-orange-500/20 w-12 h-12 rounded-2xl flex justify-center items-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                <MessageCircle className="text-orange-300" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">Trending Discussion</p>
                <h3 className="text-2xl font-bold text-white leading-tight">Best strategies for handling false-positive movement warnings during Bloom-level assessments?</h3>
                <p className="text-sm text-zinc-400 mt-4">12 Replies • Posted by Sriram</p>
              </div>
            </motion.div>
            
            <motion.div whileHover={{ y:-4 }} className="md:col-span-2 rounded-[2rem] border border-white/20 bg-black/40 p-6 backdrop-blur-xl flex flex-col justify-between shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
              <h4 className="text-lg font-bold text-white">Is faceapi.js strictly running client-side?</h4>
              <p className="text-xs text-zinc-400 mt-2">8 Replies • Posted by Sarah</p>
            </motion.div>

            <motion.div whileHover={{ y:-4 }} className="rounded-[2rem] border border-cyan-500/30 bg-cyan-900/20 p-6 backdrop-blur-xl flex flex-col justify-between shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
              <h4 className="text-sm font-bold text-cyan-100">Weekly Challenge</h4>
              <p className="text-xs text-cyan-300/60 mt-1">Join the React quiz</p>
            </motion.div>

            <motion.div whileHover={{ y:-4 }} className="rounded-[2rem] border border-orange-500/30 bg-orange-900/20 p-6 backdrop-blur-xl flex flex-col justify-between shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
              <h4 className="text-sm font-bold text-orange-100">Live Webinar</h4>
              <p className="text-xs text-orange-300/60 mt-1">Starting in 2 hours</p>
            </motion.div>
          </div>
        </div>
          {heatmapData.length > 0 && (
            <div className="mt-20 relative z-10 rounded-[2rem] border border-white/20 bg-black/25 p-8 backdrop-blur-xl">
              <style>{`
                .react-calendar-heatmap .color-empty { fill: rgba(255, 255, 255, 0.05); }
                .react-calendar-heatmap .color-scale-1 { fill: #c2410c; }
                .react-calendar-heatmap .color-scale-2 { fill: #ea580c; }
                .react-calendar-heatmap .color-scale-3 { fill: #f97316; }
                .react-calendar-heatmap .color-scale-4 { fill: #fdba74; }
                .react-calendar-heatmap text { fill: #a1a1aa; font-size: 10px; }
              `}</style>
              <h3 className="mb-4 text-xl font-bold text-white text-center">Your 30-Day Activity Heatmap</h3>
              <CalendarHeatmap
                startDate={new Date(new Date().setDate(new Date().getDate() - 30))}
                endDate={new Date()}
                values={heatmapData}
                classForValue={(value) => {
                  if (!value || value.count === 0) return 'color-empty';
                  return `color-scale-${Math.min(value.count, 4)}`;
                }}
              />
            </div>
          )}
      </motion.div>
      
      <footer className="mt-16 border-t border-white/10 pt-8 pb-4 text-center">
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} SkillTrove. All rights reserved. <br/>
          <span className="text-cyan-500/80">Securing Proctoring Platform</span>
        </p>
      </footer>
    </section>
  );
}
