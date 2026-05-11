import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, Zap, TrendingUp, ArrowRight, PlusCircle, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAuth } from '../context/AuthContext';

const MOCK_CHART_DATA = [
  { name: 'Mon', attempts: 45, avgScore: 78 },
  { name: 'Tue', attempts: 52, avgScore: 82 },
  { name: 'Wed', attempts: 38, avgScore: 75 },
  { name: 'Thu', attempts: 65, avgScore: 88 },
  { name: 'Fri', attempts: 48, avgScore: 80 },
  { name: 'Sat', attempts: 25, avgScore: 92 },
  { name: 'Sun', attempts: 30, avgScore: 85 },
];

function StatCard({ title, value, icon: Icon, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative group rounded-[2rem] border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl overflow-hidden hover:border-white/20 transition-all"
    >
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-${color}-500/10 blur-3xl group-hover:bg-${color}-500/20 transition-all`} />
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">{title}</p>
          <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
        </div>
        <div className={`p-4 rounded-2xl bg-${color}-500/10 text-${color}-400 group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
        <TrendingUp size={14} className="text-emerald-400" />
        <span className="text-emerald-400 font-bold">+12%</span> vs last week
      </div>
    </motion.div>
  );
}

export default function FacultyHome() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    activeQuizzes: 0,
    passRate: '0%',
    recentActivity: []
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [studentsRes, quizzesRes] = await Promise.all([
          fetch('http://localhost:5050/api/analytics/faculty/students', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('http://localhost:5050/api/quizzes', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        const students = await studentsRes.json();
        const quizzes = await quizzesRes.json();
        
        if (studentsRes.ok && quizzesRes.ok) {
          const passCount = students.filter(s => s.accuracy >= 40).length;
          setAnalytics({
            totalStudents: students.length,
            activeQuizzes: quizzes.filter(q => !q.archived).length,
            passRate: students.length > 0 ? `${Math.round((passCount / students.length) * 100)}%` : '0%',
            recentActivity: students.flatMap(s => s.strikeHistory || []).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
          });
        }
      } catch (err) {
        console.error('Home data error:', err);
      }
    }
    fetchData();
  }, [token]);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-8 md:px-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-cyan-400">Prof. {user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-zinc-400 mt-1">SkillTrove Command Center • System Status: <span className="text-emerald-400 font-bold">Optimal</span></p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/faculty-dashboard')}
            className="flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-105 transition-all"
          >
            <PlusCircle size={18} /> Create New Quiz
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Students" value={analytics.totalStudents} icon={Users} color="cyan" delay={0.1} />
        <StatCard title="Active Quizzes" value={analytics.activeQuizzes} icon={FileText} color="orange" delay={0.2} />
        <StatCard title="Avg. Pass Rate" value={analytics.passRate} icon={Zap} color="emerald" delay={0.3} />
        <StatCard title="Total Attempts" value="1.2k" icon={TrendingUp} color="indigo" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-[2.5rem] border border-white/10 bg-slate-900/40 p-8 backdrop-blur-2xl"
        >
          <h2 className="text-xl font-bold text-white mb-8">Performance Trends</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_CHART_DATA}>
                <defs>
                  <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="attempts" stroke="#06B6D4" strokeWidth={3} fillOpacity={1} fill="url(#colorAttempts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-[2.5rem] border border-white/10 bg-slate-900/40 p-8 backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            <History size={18} className="text-zinc-500" />
          </div>
          <div className="space-y-6">
            {analytics.recentActivity.length > 0 ? analytics.recentActivity.map((activity, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0" />
                <div>
                  <p className="text-sm text-white font-medium">{activity.message}</p>
                  <p className="text-xs text-zinc-500 mt-1">{new Date(activity.date).toLocaleString()}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-zinc-500 italic">No proctoring alerts detected.</p>
            )}
          </div>
          <button 
            onClick={() => navigate('/faculty-dashboard')}
            className="w-full mt-8 flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/10 transition-all"
          >
            View Full Report <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
