import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Sparkles, 
  Clock, 
  Calendar, 
  ArrowRight, 
  BookOpen, 
  Layers,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

/**
 * @function Home
 * @description The main Student Dashboard featuring a dual-mode system: 
 * Faculty-assigned assessments and AI-driven Practice Engine.
 */
export default function Home({ normalized, mouse }) {
  const [activeTab, setActiveTab] = useState('assigned');
  const [assignedQuizzes, setAssignedQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [practiceForm, setPracticeForm] = useState({
    subject: 'Computer Science',
    topic: '',
    type: 'MCQ',
    bloomLevel: 'Understand',
    count: 5
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  /**
   * @description Fetches quizzes assigned by faculty.
   */
  useEffect(() => {
    if (activeTab === 'assigned') {
      fetch('http://localhost:5050/api/quizzes?assignedOnly=true')
        .then(res => res.json())
        .then(data => {
          setAssignedQuizzes(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [activeTab]);

  /**
   * @function handleStartPractice
   * @description Generates a custom practice quiz based on user selections.
   */
  const handleStartPractice = async () => {
    if (!practiceForm.topic.trim()) {
      toast.error('Please specify a sub-topic for practice.');
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
      toast.error('Network error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="mx-auto mt-4 max-w-7xl px-6 pb-16 pt-6 md:px-10">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500">Academic Portal</p>
           <h1 className="mt-2 text-3xl font-black text-white md:text-5xl tracking-tight">Student <span className="text-orange-500">Dashboard</span></h1>
        </div>
        <div className="flex gap-2 rounded-2xl bg-white/5 p-1 backdrop-blur-md border border-white/5">
           {['assigned', 'practice'].map(tab => (
             <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-500 hover:text-white'}`}
             >
                {tab === 'assigned' ? 'Assigned Quizzes' : 'Practice Mode'}
             </button>
           ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'assigned' ? (
          <motion.div 
            key="assigned"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {loading ? (
               <div className="col-span-full py-20 text-center">
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-orange-500/20 border-t-orange-500" />
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Syncing Assigned Tasks...</p>
               </div>
            ) : assignedQuizzes.length === 0 ? (
               <div className="col-span-full rounded-[2.5rem] border border-white/5 bg-white/5 p-16 text-center backdrop-blur-xl">
                  <BookOpen className="mx-auto mb-4 text-zinc-600" size={48} />
                  <h3 className="text-xl font-bold text-white">No Assigned Quizzes</h3>
                  <p className="mt-2 text-zinc-500">Your faculty hasn't assigned any exams to your profile yet.</p>
               </div>
            ) : (
              assignedQuizzes.map(quiz => {
                const deadline = new Date(quiz.deadline);
                const isExpired = deadline < new Date();
                return (
                  <motion.div 
                    key={quiz._id}
                    whileHover={{ y: -5 }}
                    className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900/40 p-8 backdrop-blur-3xl"
                  >
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl" />
                    
                    <div className="flex justify-between items-start mb-6">
                       <span className="rounded-lg bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-400 border border-orange-500/20">Faculty Assigned</span>
                       {isExpired ? <Lock className="text-red-500" size={18} /> : <Unlock className="text-emerald-500" size={18} />}
                    </div>

                    <h3 className="text-xl font-black text-white leading-tight mb-2">{quiz.title || quiz.subject}</h3>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-6">Assigned by Prof. {quiz.assignedBy?.name || 'Faculty'}</p>
                    
                    <div className="space-y-4 mb-8">
                       <div className="flex items-center gap-3 text-zinc-400">
                          <Calendar size={16} />
                          <span className="text-xs font-bold">{new Date(quiz.createdAt).toLocaleDateString()}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <Clock size={16} className={isExpired ? 'text-red-500' : 'text-orange-400'} />
                          <span className={`text-xs font-bold ${isExpired ? 'text-red-500' : 'text-zinc-200'}`}>
                             {isExpired ? 'Deadline Expired' : `Deadline: ${deadline.toLocaleString()}`}
                          </span>
                       </div>
                    </div>

                    <button 
                      disabled={isExpired}
                      onClick={() => navigate('/check', { state: { quiz } })}
                      className={`group flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-black text-xs uppercase tracking-widest transition-all ${isExpired ? 'bg-white/5 text-zinc-700 cursor-not-allowed' : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:scale-[1.02]'}`}
                    >
                       {isExpired ? 'Locked' : 'Engage Assessment'}
                       {!isExpired && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="practice"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="rounded-[3rem] border border-white/10 bg-white/5 p-8 lg:p-12 backdrop-blur-3xl shadow-2xl"
          >
            <div className="grid gap-12 lg:grid-cols-[1.2fr_.8fr]">
               <div className="space-y-8">
                  <div>
                     <h3 className="text-2xl font-black text-white tracking-tight mb-2">Practice Engine</h3>
                     <p className="text-zinc-500 text-sm">Configure your personal learning session. AI will generate specialized questions.</p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-orange-500 ml-1">Subject</label>
                        <select 
                          value={practiceForm.subject}
                          onChange={(e) => setPracticeForm(p => ({ ...p, subject: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-orange-500"
                        >
                           <option>Computer Science</option>
                           <option>AI & Machine Learning</option>
                           <option>Modern Web Development</option>
                           <option>Data Structures</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-orange-500 ml-1">Sub-Topic Focus</label>
                        <input 
                           type="text"
                           value={practiceForm.topic}
                           onChange={(e) => setPracticeForm(p => ({ ...p, topic: e.target.value }))}
                           placeholder="e.g., Recursion in Python"
                           className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-orange-500 font-bold"
                        />
                     </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-orange-500 ml-1">Question Type</label>
                        <select 
                           value={practiceForm.type}
                           onChange={(e) => setPracticeForm(p => ({ ...p, type: e.target.value }))}
                           className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-orange-500"
                        >
                           <option value="MCQ">MCQ (Single Select)</option>
                           <option value="Coding">Coding Sandbox</option>
                           <option value="Short Ans">Short Subjective</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-orange-500 ml-1">Complexity (Bloom's)</label>
                        <select 
                           value={practiceForm.bloomLevel}
                           onChange={(e) => setPracticeForm(p => ({ ...p, bloomLevel: e.target.value }))}
                           className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-orange-500"
                        >
                           <option value="Remember">Level 1: Recall</option>
                           <option value="Understand">Level 2: Concepts</option>
                           <option value="Apply">Level 3: Scenarios</option>
                           <option value="Analyze">Level 4: Logical</option>
                        </select>
                     </div>
                  </div>
               </div>

               <div className="rounded-[2.5rem] bg-orange-500/5 border border-orange-500/10 p-8 flex flex-col justify-between">
                  <div className="space-y-4">
                     <div className="flex items-center gap-3 text-orange-500">
                        <Layers size={24} />
                        <h4 className="text-lg font-black uppercase tracking-tighter">Session Specs</h4>
                     </div>
                     <p className="text-xs text-zinc-500 leading-relaxed">
                        Practice mode bypasses faculty grading and allows you to experiment with AI-generated challenges. Continuous proctoring is still active for self-discipline.
                     </p>
                  </div>

                  <div className="mt-8 space-y-6">
                     <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                           <span>Questions</span>
                           <span className="text-orange-500">{practiceForm.count} items</span>
                        </div>
                        <input 
                           type="range" min="3" max="10"
                           value={practiceForm.count}
                           onChange={(e) => setPracticeForm(p => ({ ...p, count: Number(e.target.value) }))}
                           className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                     </div>

                     <button 
                        onClick={handleStartPractice}
                        disabled={isGenerating}
                        className="w-full group flex items-center justify-center gap-3 rounded-2xl bg-orange-500 py-4 font-black text-white shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                     >
                        {isGenerating ? <LoaderCircle className="animate-spin" size={20} /> : <Sparkles size={20} />}
                        {isGenerating ? 'GENERATING...' : 'START PRACTICE'}
                     </button>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function LoaderCircle({ className, size }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-white/20 border-t-white ${className}`} style={{ width: size, height: size }} />
  );
}
