import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusCircle, 
  BrainCircuit, 
  CheckCircle2, 
  ChevronRight,
  Database,
  CloudLightning,
  Sparkles,
  Calendar,
  Layers,
  FileText,
  LoaderCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

/**
 * @function StatCard
 */
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:border-cyan-500/30"
    >
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 ${color}`} />
      <div className="flex items-center justify-between mb-4">
        <div className={`rounded-2xl p-3 bg-white/5 ${color.replace('bg-', 'text-')}`}>
          <Icon size={24} />
        </div>
        <span className="text-2xl font-black text-white">{value}</span>
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-zinc-500">{label}</p>
    </motion.div>
  );
}

/**
 * @function FacultyDashboard
 * @description Advanced Command Center for Faculty to manage curriculum and AI-driven assessments.
 */
export default function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState('generator');
  const [formData, setFormData] = useState({
    subject: 'Computer Science',
    topic: '',
    type: 'Mixed',
    bloomLevel: 'Mixed',
    count: 10,
    deadline: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * @function handleAutomatedQuizGeneration
   */
  async function handleAutomatedQuizGeneration() {
    if (!formData.topic.trim()) {
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
          subject: `${formData.subject}: ${formData.topic}`,
          title: formData.topic,
          type: formData.type,
          bloomLevel: formData.bloomLevel,
          count: formData.count,
          deadline: formData.deadline
        })
      });

      if (res.ok) {
        toast.success(`Generated ${formData.count} questions on ${formData.topic}!`);
        setFormData(p => ({ ...p, topic: '', deadline: '' }));
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'AI Generation failed');
      }
    } catch (err) {
      toast.error('Network error during generation');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="min-h-screen bg-slate-950 p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Staff <span className="text-cyan-400">Hub</span></h1>
            <p className="mt-2 text-zinc-400 font-medium">Engineer professional-grade assessments with AI.</p>
          </div>
          <div className="flex gap-2 rounded-2xl bg-white/5 p-1 backdrop-blur-md">
            {['generator', 'analytics'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              >
                {tab === 'generator' ? 'AI Architect' : 'Insights'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <StatCard label="Assigned Exams" value="12" icon={FileText} color="bg-cyan-500" />
          <StatCard label="AI Batches" value="156" icon={BrainCircuit} color="bg-orange-500" />
          <StatCard label="Integrity Floor" value="94%" icon={CheckCircle2} color="bg-emerald-500" />
          <StatCard label="Compute Load" value="Optimal" icon={CloudLightning} color="bg-purple-500" />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'generator' ? (
            <motion.div
              key="gen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="rounded-[3rem] border border-white/10 bg-white/5 p-8 lg:p-12 backdrop-blur-3xl shadow-2xl"
            >
              <div className="grid gap-12 lg:grid-cols-[1.2fr_.8fr]">
                <div className="space-y-8">
                   <div>
                      <h3 className="text-2xl font-black text-white tracking-tight mb-2">Assessment Architect</h3>
                      <p className="text-zinc-500 text-sm">Configure strictly enforced curriculum parameters for AI question engineering.</p>
                   </div>

                   <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400 ml-1">Curriculum</label>
                        <select 
                          value={formData.subject}
                          onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500 transition-all cursor-pointer"
                        >
                          <option>Computer Science</option>
                          <option>Cyber Security</option>
                          <option>Data Structures</option>
                          <option>React Development</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400 ml-1">Sub-Topic Focus</label>
                        <input 
                          type="text"
                          value={formData.topic}
                          onChange={(e) => setFormData(p => ({ ...p, topic: e.target.value }))}
                          placeholder="e.g., Dynamic Programming"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500 transition-all font-bold"
                        />
                      </div>
                   </div>

                   <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400 ml-1">Question Engine</label>
                        <select 
                          value={formData.type}
                          onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500"
                        >
                          <option value="Mixed">Mixed (All Types)</option>
                          <option value="MCQ">Multiple Choice Only</option>
                          <option value="Coding">Coding Challenges</option>
                          <option value="Short Ans">Short Subjective</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400 ml-1">Bloom's Taxonomy</label>
                        <select 
                          value={formData.bloomLevel}
                          onChange={(e) => setFormData(p => ({ ...p, bloomLevel: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500"
                        >
                          <option value="Mixed">Mixed Complexity</option>
                          <option value="Remember">Level 1: Remember</option>
                          <option value="Understand">Level 2: Understand</option>
                          <option value="Apply">Level 3: Apply</option>
                          <option value="Analyze">Level 4: Analyze</option>
                        </select>
                      </div>
                   </div>
                </div>

                <div className="space-y-6 rounded-[2rem] bg-white/5 border border-white/5 p-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-orange-500 ml-1">Submission Deadline</label>
                      <div className="relative">
                         <input 
                            type="datetime-local"
                            value={formData.deadline}
                            onChange={(e) => setFormData(p => ({ ...p, deadline: e.target.value }))}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-orange-500 font-mono text-sm"
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-orange-500 ml-1">Question Volumetrics</label>
                      <div className="flex items-center gap-4">
                         <input 
                            type="range" min="1" max="10"
                            value={formData.count}
                            onChange={(e) => setFormData(p => ({ ...p, count: Number(e.target.value) }))}
                            className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                         />
                         <span className="text-xl font-black text-white w-10">{formData.count}</span>
                      </div>
                   </div>

                   <button 
                      onClick={handleAutomatedQuizGeneration}
                      disabled={isGenerating}
                      className="w-full group mt-4 flex items-center justify-center gap-3 rounded-2xl bg-cyan-500 py-4 font-black text-slate-950 shadow-xl shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                   >
                      {isGenerating ? <LoaderCircle className="animate-spin" size={20} /> : <Sparkles size={20} />}
                      {isGenerating ? 'LOCKING PARAMETERS...' : 'INITIALIZE GENERATION'}
                   </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="ana"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="rounded-[3rem] border border-white/10 bg-white/5 p-12 text-center"
            >
              <Database size={48} className="mx-auto mb-4 text-cyan-500" />
              <h3 className="text-xl font-bold text-white uppercase tracking-widest">Analytics Vault</h3>
              <p className="text-zinc-500 mt-2">Aggregating cohort performance data across all AI batches...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
