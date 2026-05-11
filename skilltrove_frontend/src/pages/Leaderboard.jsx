import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [toast, setToast] = useState('');

  useEffect(() => {
    let interval;
    async function fetchLeaderboard() {
      try {
        const res = await fetch('http://localhost:5050/api/leaderboard');
        const data = await res.json();
        if (res.ok) {
          setLeaders(prev => {
            // Check if rank 1 changed to trigger toast
            if (prev.length > 0 && data.length > 0 && prev[0].userId !== data[0].userId) {
              setToast('New Score Updated! Leaderboard shifted.');
              setTimeout(() => setToast(''), 3000);
            }
            return data;
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLeaderboard();
    interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const top3 = leaders.slice(0, 3);

  // Rearrange top 3 for podium: 2nd, 1st, 3rd
  const podium = [top3[1], top3[0], top3[2]];

  return (
    <section className="mx-auto mt-8 max-w-5xl px-6 pb-20">
      <div className="rounded-[2rem] border border-white/20 bg-white/5 p-8 backdrop-blur-2xl">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">Global Rankings</h2>
          <p className="mt-2 text-sm uppercase tracking-[0.2em] text-orange-200">Real-Time Performance Podium</p>
        </div>

        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/50 bg-orange-500/20 px-4 py-2 text-sm text-orange-200 shadow-[0_0_15px_rgba(255,165,0,0.4)]">
                <AlertCircle size={16} /> {toast}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-300/35 border-t-orange-400" />
          </div>
        ) : (
          <>
            {top3.length > 0 && (
              <div className="mb-16 mt-10 flex h-64 items-end justify-center gap-2 md:gap-6">
                {podium.map((l, i) => {
                  if (!l) return <div key={`empty-${i}`} className="w-24 md:w-32" />;
                  const isGold = i === 1;
                  const isSilver = i === 0;
                  const isBronze = i === 2;
                  const height = isGold ? 'h-48' : isSilver ? 'h-36' : 'h-28';
                  const color = isGold ? 'from-yellow-400/80 to-yellow-600/80 shadow-[0_0_30px_rgba(250,204,21,0.5)]' 
                            : isSilver ? 'from-zinc-300/80 to-zinc-500/80 shadow-[0_0_20px_rgba(212,212,216,0.3)]' 
                            : 'from-amber-600/80 to-amber-800/80 shadow-[0_0_20px_rgba(217,119,6,0.3)]';

                  return (
                    <motion.div key={l.userId} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="flex flex-col items-center">
                      <div className="mb-3 flex flex-col items-center">
                        <div className={`mb-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 ${isGold ? 'border-yellow-400' : isSilver ? 'border-zinc-300' : 'border-amber-600'} bg-black/40 text-sm font-bold text-white`}>
                          {l.profileImage ? <img src={l.profileImage} alt="" className="h-full w-full object-cover" /> : l.name[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-white">{l.name.split(' ')[0]}</span>
                        <span className="text-[10px] text-zinc-400">{l.highestScore} pts</span>
                      </div>
                      <div className={`w-24 rounded-t-xl bg-gradient-to-b ${color} md:w-32 ${height} flex justify-center pt-4`}>
                        <span className="text-2xl font-extrabold text-white/90 drop-shadow-md">{l.rank}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="mx-auto max-w-2xl space-y-3">
              <AnimatePresence>
                {leaders.map((l) => {
                  const isMe = user && String(l.userId) === String(user.id);
                  // Top 3 are on podium, so only show rank > 3, EXCEPT if it's the user
                  // actually, it's better to show everyone in the list too, but user specifically asked
                  // to show 'You are here'. We can show everyone, or skip top 3 unless they want to see it in the list.
                  // Let's show all in the list for clarity.
                  
                  return (
                    <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} key={l.userId} className={`flex items-center justify-between rounded-2xl border px-5 py-4 transition-all ${isMe ? 'border-orange-500/50 bg-orange-500/10 shadow-[0_0_10px_rgba(255,165,0,0.2)]' : 'border-white/10 bg-black/20'}`}>
                      <div className="flex items-center gap-4">
                        <span className="flex w-6 justify-center text-sm font-bold text-zinc-400">#{l.rank}</span>
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/5">
                          {l.profileImage ? <img src={l.profileImage} alt="" className="h-full w-full object-cover" /> : <UserCircle className="text-zinc-400" size={24} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                            {l.name}
                            {isMe && <span className="rounded-md bg-orange-500/20 px-1.5 py-0.5 text-[10px] uppercase text-orange-300">You</span>}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                            <span className="flex items-center gap-1"><span className="text-orange-400 font-bold">🔥 {l.streak}</span> Day Streak</span>
                            <span className="flex items-center gap-1"><span className="text-emerald-400 font-bold">🎯 {l.accuracy}%</span> Accuracy</span>
                            <span className="hidden md:inline-flex items-center gap-1 text-zinc-500">| {l.totalSkillPoints} Pts</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="hidden lg:flex items-center gap-1 mr-6">
                        {l.heatmap?.map((day, i) => {
                          const intensity = day.count > 3 ? 'bg-orange-500' : day.count > 1 ? 'bg-orange-600' : day.count === 1 ? 'bg-orange-800' : 'bg-white/5';
                          return (
                            <div key={i} className={`h-3 w-3 rounded-sm ${intensity} ${day.count > 0 ? 'shadow-[0_0_5px_rgba(255,165,0,0.3)]' : ''}`} title={`${day.date}: ${day.count} attempts`} />
                          );
                        })}
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-extrabold text-orange-400">{l.highestScore}</p>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Best Score</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
