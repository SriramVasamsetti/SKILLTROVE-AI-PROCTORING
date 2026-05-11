import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Send, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const TOPICS = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'General Knowledge'];

export default function FacultyDashboard() {
  const { token } = useAuth();
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [questions, setQuestions] = useState([]);
  const [deploying, setDeploying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analytics, setAnalytics] = useState([]);
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'analytics'

  function addQuestion() {
    if (questions.length >= 10) {
      toast.warning('Maximum 10 questions allowed per quiz.', { theme: 'dark' });
      return;
    }
    setQuestions([
      ...questions,
      {
        type: 'MCQ',
        level: 'Understand',
        prompt: '',
        options: ['', '', '', ''],
        correctKey: '0',
        points: 10,
      }
    ]);
  }

  function updateQuestion(idx, field, value) {
    const updated = [...questions];
    updated[idx][field] = value;
    setQuestions(updated);
  }

  function updateOption(qIdx, optIdx, value) {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = value;
    setQuestions(updated);
  }

  function removeQuestion(idx) {
    setQuestions(questions.filter((_, i) => i !== idx));
  }

  async function handleDeploy() {
    if (!subject.trim()) {
      toast.error('Please provide a specific sub-topic (subject title).', { theme: 'dark' });
      return;
    }
    if (questions.length === 0) {
      toast.error('Please add at least one question.', { theme: 'dark' });
      return;
    }

    const hasEmpty = questions.some(q => !q.prompt.trim() || (q.type === 'MCQ' && q.options.some(o => !o.trim())));
    if (hasEmpty) {
      toast.error('Please fill out all prompts and options before deploying.', { theme: 'dark' });
      return;
    }

    setDeploying(true);
    try {
      const formattedQuestions = questions.map(q => {
        if (q.type === 'MCQ') {
          return { ...q, correctKey: String(q.correctKey) };
        } else if (q.type === 'Short Ans') {
          return { ...q, options: [], correctKey: 'rubric-aligned' };
        } else if (q.type === 'Fill-up') {
          return { ...q, options: [] }; // correctKey is the text itself
        }
        return q;
      });

      const res = await fetch('http://localhost:5050/api/quizzes/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: `${topic}: ${subject}`,
          questions: formattedQuestions
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to deploy quiz');
      
      toast.success('Quiz deployed successfully! It is now live for all students.', { theme: 'dark' });
      setSubject('');
      setQuestions([]);
    } catch (err) {
      toast.error(err.message, { theme: 'dark' });
    } finally {
      setDeploying(false);
    }
  }

  async function handleAIGenerate() {
    if (!subject.trim()) {
      toast.error('Please specify a sub-topic for the AI to focus on.', { theme: 'dark' });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('http://localhost:5050/api/quizzes/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: `${topic}: ${subject}`,
          count: 10,
          provider: 'gemini'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI Generation failed');
      
      toast.success('AI Quiz generated and deployed live!', { theme: 'dark' });
      setSubject('');
      setQuestions([]);
    } catch (err) {
      toast.error(err.message, { theme: 'dark' });
    } finally {
      setGenerating(false);
    }
  }

  async function fetchAnalytics() {
    try {
      const res = await fetch('http://localhost:5050/api/analytics/faculty/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <section className="mx-auto mt-8 max-w-5xl px-6 pb-20 md:px-10">

      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-orange-400 mb-2">Faculty Command Center</h1>
      <p className="text-zinc-400 mb-8">Create and deploy high-integrity assessments instantly.</p>
      
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('create')}
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'create' ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'bg-slate-900 text-zinc-400 border border-white/5'}`}
        >
          Create Quiz
        </button>
        <button 
          onClick={() => { setActiveTab('analytics'); fetchAnalytics(); }}
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'analytics' ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-slate-900 text-zinc-400 border border-white/5'}`}
        >
          Student Progress
        </button>
      </div>

      {activeTab === 'create' ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
          {/* Left Column: Quiz Metadata */}
          <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[2rem] border border-cyan-500/20 bg-slate-900 p-6 backdrop-blur-2xl shadow-[0_10px_30px_rgba(6,182,212,0.1)]"
          >
            <h2 className="text-xl font-bold text-white mb-4">Quiz Definition</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">Main Topic</label>
                <select 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500/50 outline-none appearance-none"
                >
                  {TOPICS.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">Specific Sub-Topic</label>
                <input 
                  type="text" 
                  placeholder="e.g. Recursion & Dynamic Programming"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500/50 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleDeploy}
                  disabled={deploying || generating}
                  className="flex-1 mt-4 flex items-center justify-center gap-2 rounded-xl border border-orange-500/50 bg-orange-600/20 px-4 py-4 text-xs font-bold uppercase tracking-wider text-orange-100 shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all hover:bg-orange-600/30 disabled:opacity-50"
                >
                  {deploying ? 'Deploying...' : <><Send size={16} /> Deploy Manual</>}
                </button>
                <button 
                  onClick={handleAIGenerate}
                  disabled={generating || deploying}
                  className="flex-1 mt-4 flex items-center justify-center gap-2 rounded-xl border border-cyan-500/50 bg-cyan-600/20 px-4 py-4 text-xs font-bold uppercase tracking-wider text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:bg-cyan-600/30 disabled:opacity-50"
                >
                  {generating ? 'Generating...' : <><PlusCircle size={16} /> Auto AI Gen</>}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Question Builder */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-[2rem] border border-white/10 bg-slate-900 p-6 backdrop-blur-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Question Matrix <span className="text-cyan-400">({questions.length}/10)</span></h2>
            <button 
              onClick={addQuestion}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              <PlusCircle size={16} /> Add Question
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl">
              <p className="text-zinc-500">No questions added yet.<br/>Click "Add Question" to begin.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="relative rounded-2xl border border-white/10 bg-slate-800/50 p-5">
                  <button 
                    onClick={() => removeQuestion(qIdx)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 pr-8">
                    <select 
                      value={q.type} 
                      onChange={(e) => updateQuestion(qIdx, 'type', e.target.value)}
                      className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none appearance-none"
                    >
                      <option value="MCQ">Multiple Choice</option>
                      <option value="Fill-up">Fill in the Blanks</option>
                      <option value="Short Ans">2-Marks Subjective</option>
                    </select>

                    <select 
                      value={q.level} 
                      onChange={(e) => updateQuestion(qIdx, 'level', e.target.value)}
                      className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none appearance-none"
                    >
                      <option value="Remember">Remember (L1)</option>
                      <option value="Understand">Understand (L2)</option>
                      <option value="Apply">Apply (L3)</option>
                      <option value="Analyze">Analyze (L4)</option>
                    </select>
                  </div>

                  <textarea 
                    placeholder="Enter question prompt..."
                    value={q.prompt}
                    onChange={(e) => updateQuestion(qIdx, 'prompt', e.target.value)}
                    className="w-full mb-4 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none min-h-[80px]"
                  />

                  {q.type === 'MCQ' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 p-4 border border-cyan-500/20 bg-cyan-950/10 rounded-xl">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name={`correct-${qIdx}`} 
                            checked={q.correctKey === String(optIdx)}
                            onChange={() => updateQuestion(qIdx, 'correctKey', String(optIdx))}
                            className="w-4 h-4 text-cyan-500 bg-slate-950 border-white/20 focus:ring-cyan-500/50"
                          />
                          <input 
                            type="text" 
                            placeholder={`Option ${optIdx + 1}`}
                            value={opt}
                            onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'Fill-up' && (
                    <div className="mt-4 p-4 border border-orange-500/20 bg-orange-950/10 rounded-xl">
                      <label className="block text-xs uppercase tracking-widest text-orange-200 mb-1">Exact Answer Key</label>
                      <input 
                        type="text" 
                        placeholder="Expected exact word/phrase"
                        value={q.correctKey}
                        onChange={(e) => updateQuestion(qIdx, 'correctKey', e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                  )}

                  {q.type === 'Short Ans' && (
                    <div className="mt-4 p-4 border border-zinc-500/20 bg-zinc-950/10 rounded-xl">
                      <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">Grading Rubric (Model Answer)</label>
                      <textarea 
                        placeholder="What should the AI look for to award full 2 marks?"
                        value={q.modelAnswer}
                        onChange={(e) => updateQuestion(qIdx, 'modelAnswer', e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none min-h-[60px]"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/10 bg-slate-900 p-8 overflow-hidden"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Student Analytics <span className="text-cyan-400">({analytics.length})</span></h2>
            <button onClick={fetchAnalytics} className="text-sm text-zinc-400 hover:text-white transition-colors underline">Refresh Data</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-zinc-500">
                  <th className="pb-4 font-medium">Student Name</th>
                  <th className="pb-4 font-medium">Roll No</th>
                  <th className="pb-4 font-medium">Avg Accuracy</th>
                  <th className="pb-4 font-medium">Total Strikes</th>
                  <th className="pb-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {analytics.map((s) => (
                  <tr key={s.userId} className="group hover:bg-white/5 transition-colors">
                    <td className="py-5 font-semibold text-white">{s.name}</td>
                    <td className="py-5 text-zinc-400">{s.roll}</td>
                    <td className="py-5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${s.accuracy > 75 ? 'from-green-500 to-emerald-400' : s.accuracy > 40 ? 'from-orange-500 to-yellow-400' : 'from-red-600 to-pink-500'}`} style={{ width: `${s.accuracy}%` }} />
                        </div>
                        <span className="text-xs font-bold text-white">{s.accuracy}%</span>
                      </div>
                    </td>
                    <td className="py-5">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${s.strikes > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {s.strikes} Strikes
                      </span>
                    </td>
                    <td className="py-5 text-right">
                      {s.strikes > 2 ? (
                        <span className="text-xs font-bold text-red-500 animate-pulse flex items-center justify-end gap-1">⚠️ Restricted</span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">✅ Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </section>
  );
}
