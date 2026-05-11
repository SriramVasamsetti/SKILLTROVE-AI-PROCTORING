import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Users, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  MessageCircle, 
  Clock, 
  Calendar, 
  Lock, 
  Unlock, 
  ArrowRight, 
  Sparkles, 
  Layers,
  BookOpen
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

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

/**
 * @function Home
 * @description Advanced Student Dashboard integrating the core landing UI with 
 * Faculty-assigned quizzes and an AI Practice Engine.
 */
export default function Home({ normalized }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [heatmapData, setHeatmapData] = useState([]);
  const [assignedQuizzes, setAssignedQuizzes] = useState([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [practiceForm, setPracticeForm] = useState({
    subject: 'Computer Science',
    topic: '',
    type: 'MCQ',
    bloomLevel: 'Understand',
    count: 5
  });
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * @description Fetches student activity and assigned assessments on mount.
   */
  useEffect(() => {
    if (!user) return;
    
    // Fetch Heatmap Data
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

    // Fetch Assigned Quizzes
    fetch('http://localhost:5050/api/quizzes?assignedOnly=true')
      .then(res => res.json())
      .then(data => {
        setAssignedQuizzes(data);
        setIsLoadingQuizzes(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingQuizzes(false);
      });
  }, [user]);

  /**
   * @function handleStartPractice
   * @description Triggers AI generation for a personalized practice session.
   */
  const handleStartPractice = async () => {
    if (!practiceForm.topic.trim()) {
      toast.error('Please specify a sub-topic focus.');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('http://localhost:5050/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('skilltrove-token')}`
        },
        body: JSON.stringify({
          subject: `${practiceForm.subject}: ${practiceForm.topic}`,
          type: practiceForm.type,
          bloomLevel: practiceForm.bloomLevel,
          count: practiceForm.count
        })
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/check', { state: { quiz: data } });
      } else {
        toast.error(data.message || 'Generation failed');
      }
    } catch (err) {
      toast.error('Network error during generation');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="mx-auto mt-4 max-w-7xl px-6 pb-24 pt-6 md:px-10">
      {/* 1. HERO SECTION (STABLE UI) */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ perspective: 1500 }}
        className="relative overflow-hidden rounded-[3rem] border border-white/20 bg-white/5 p-8 backdrop-blur-2xl md:p-12 shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-cyan-500/10" />
        <div className="relative z-10 text-center">
          <p className="inline-flex rounded-full border border-cyan-400/50 bg-cyan-500/10 px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200">
            Authorized Access Only
          </p>
          <h1 className="mt-5 text-5xl font-black tracking-tighter text-white md:text-8xl">
            Skill<span className="text-orange-500">Trove</span>
          </h1>
          <p className="mt-4 text-lg font-bold text-zinc-400">Securing the future of academic evaluation.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/check')}
            className="mt-8 rounded-full bg-orange-500 px-10 py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-orange-500/30"
          >
            Get Started
          </motion.button>
        </div>

        <div className="relative z-10 mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {(FEATURES || []).map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                whileHover={{ y: -5 }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-20`} />
                <div className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20">
                  <Icon className="text-orange-500" size={22} />
                </div>
                <h3 className="relative text-lg font-bold text-white">{feature.title}</h3>
                <p className="relative mt-2 text-xs text-zinc-400">{feature.subtitle}</p>
              </motion.article>
            );
          })}
        </div>
      </motion.div>

      {/* 2. FACULTY ASSIGNED SECTION (NEW) */}
      <div className="mt-20">
        <div className="mb-8 flex items-end justify-between">
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500">Mandatory</p>
              <h2 className="text-3xl font-black text-white tracking-tight">Faculty <span className="text-orange-500">Assignments</span></h2>
           </div>
           <Link to="/quizzes" className="text-xs font-bold text-zinc-500 hover:text-orange-500 transition-colors">View History →</Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoadingQuizzes ? (
            <div className="col-span-full py-12 text-center text-zinc-500 uppercase tracking-widest font-black text-xs animate-pulse">Syncing assigned exams...</div>
          ) : Array.isArray(assignedQuizzes) && assignedQuizzes.length > 0 ? (
            assignedQuizzes.map(quiz => {
              const deadline = new Date(quiz.deadline);
              const isExpired = deadline < new Date();
              return (
                <motion.div 
                  key={quiz._id}
                  whileHover={{ y: -5 }}
                  className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/40 p-8 backdrop-blur-3xl"
                >
                  <div className="mb-6 flex justify-between items-center">
                    <span className="rounded-lg bg-orange-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-orange-400 border border-orange-500/20">Assignment</span>
                    {isExpired ? <Lock className="text-red-500" size={16} /> : <Unlock className="text-emerald-500" size={16} />}
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">{quiz.title || quiz.subject}</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Prof. {quiz.assignedBy?.name || 'Faculty'}</p>
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Calendar size={14} />
                      <span className="text-xs font-bold">{new Date(quiz.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock size={14} className={isExpired ? 'text-red-500' : 'text-orange-400'} />
                      <span className={`text-xs font-bold ${isExpired ? 'text-red-500' : 'text-zinc-200'}`}>
                        {isExpired ? 'Expired' : `Due: ${deadline.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                  <button 
                    disabled={isExpired}
                    onClick={() => navigate('/check', { state: { quiz } })}
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-black text-xs uppercase tracking-widest transition-all ${isExpired ? 'bg-white/5 text-zinc-700' : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:scale-[1.02]'}`}
                  >
                    {isExpired ? 'Closed' : 'Engage Exam'}
                    {!isExpired && <ArrowRight size={14} />}
                  </button>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full rounded-[2.5rem] border border-dashed border-white/10 p-12 text-center bg-white/5">
               <BookOpen className="mx-auto mb-4 text-zinc-700" size={40} />
               <p className="text-sm font-bold text-zinc-500">No active faculty assignments found.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. PRACTICE ENGINE SECTION (NEW) */}
      <div className="mt-24">
        <div className="mb-8">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500">Self-Directed</p>
           <h2 className="text-3xl font-black text-white tracking-tight">Practice <span className="text-cyan-500">Engine</span></h2>
        </div>

        <motion.div 
          className="rounded-[3rem] border border-white/10 bg-white/5 p-8 lg:p-12 backdrop-blur-3xl shadow-2xl"
          whileHover={{ boxShadow: "0 0 50px rgba(6,182,212,0.1)" }}
        >
          <div className="grid gap-12 lg:grid-cols-[1.2fr_.8fr]">
            <div className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-cyan-500 ml-1">Subject</label>
                  <select 
                    value={practiceForm.subject}
                    onChange={(e) => setPracticeForm(p => ({ ...p, subject: e.target.value }))}
                    className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500 font-bold"
                  >
                    <option>Computer Science</option>
                    <option>Mathematics</option>
                    <option>Business Ethics</option>
                    <option>Cyber Security</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-cyan-500 ml-1">Sub-Topic Focus</label>
                  <input 
                    type="text"
                    value={practiceForm.topic}
                    onChange={(e) => setPracticeForm(p => ({ ...p, topic: e.target.value }))}
                    placeholder="e.g. Asymptotic Notation"
                    className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-cyan-500 ml-1">Cognitive Level</label>
                  <select 
                    value={practiceForm.bloomLevel}
                    onChange={(e) => setPracticeForm(p => ({ ...p, bloomLevel: e.target.value }))}
                    className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500 font-bold"
                  >
                    <option value="Remember">Recall (Level 1)</option>
                    <option value="Understand">Comprehend (Level 2)</option>
                    <option value="Apply">Apply (Level 3)</option>
                    <option value="Analyze">Analyze (Level 4)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-cyan-500 ml-1">Question Type</label>
                  <select 
                    value={practiceForm.type}
                    onChange={(e) => setPracticeForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500 font-bold"
                  >
                    <option value="MCQ">Standard MCQ</option>
                    <option value="Coding">Coding Sandbox</option>
                    <option value="Short Ans">Short Answer</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-[2.5rem] bg-cyan-500/5 border border-cyan-500/10 p-8 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-cyan-500">
                  <Layers size={24} />
                  <h4 className="text-lg font-black uppercase tracking-tighter">Session Config</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span>Questions</span>
                    <span className="text-cyan-400">{practiceForm.count} items</span>
                  </div>
                  <input 
                    type="range" min="3" max="10"
                    value={practiceForm.count}
                    onChange={(e) => setPracticeForm(p => ({ ...p, count: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>
              <button 
                onClick={handleStartPractice}
                disabled={isGenerating}
                className="mt-8 group flex items-center justify-center gap-3 rounded-2xl bg-cyan-600 py-4 font-black text-white shadow-xl shadow-cyan-600/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? <LoaderCircle /> : <Sparkles size={18} />}
                {isGenerating ? 'GENERATING...' : 'BUILD PRACTICE SESSION'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 4. ACTIVITY HEATMAP */}
      {heatmapData.length > 0 && (
        <div className="mt-24 relative z-10 rounded-[3rem] border border-white/20 bg-black/25 p-10 backdrop-blur-xl">
          <h3 className="mb-6 text-xl font-black text-white text-center uppercase tracking-[0.2em]">Activity Orbit</h3>
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

      <footer className="mt-24 border-t border-white/5 pt-12 pb-6 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
          © 2026 SkillTrove — Securing Global Assessment Standards
        </p>
      </footer>
    </section>
  );
}

function LoaderCircle() {
  return (
    <div className="animate-spin rounded-full border-2 border-white/20 border-t-white h-5 w-5" />
  );
}
