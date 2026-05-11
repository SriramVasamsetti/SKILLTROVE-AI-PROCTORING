import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Award, CheckCircle, ChevronLeft, RefreshCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReportCard() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [attempt, setAttempt] = useState(null);
  const [dbProfile, setDbProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAttempt() {
      try {
        const token = localStorage.getItem('skilltrove-token');
        const [attemptRes, profileRes] = await Promise.all([
          fetch('http://localhost:5050/api/quizzes/mine/attempts', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:5050/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        const data = await attemptRes.json();
        if (!attemptRes.ok) throw new Error(data.message || 'Failed to fetch attempts');
        
        const found = data.find(a => String(a._id) === String(attemptId));
        if (!found) throw new Error('Attempt not found');
        setAttempt(found);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setDbProfile(profileData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAttempt();
  }, [attemptId]);

  if (loading) {
    return <div className="mt-20 flex justify-center"><RefreshCcw className="animate-spin text-orange-400" size={40} /></div>;
  }

  if (error) {
    return <div className="mt-20 text-center text-red-400">{error}</div>;
  }

  const percentage = Math.round((attempt.totalScore / (attempt.maxScore || 1)) * 100);

  const strengths = [];
  const weaknesses = [];
  attempt.responses.forEach((r) => {
    if (!r.type) r.type = 'Topic';
    if (r.score > 0) {
      if (!strengths.includes(r.type)) strengths.push(r.type);
    } else {
      if (!weaknesses.includes(r.type)) weaknesses.push(r.type);
    }
  });
  if (strengths.length === 0) strengths.push('Persistence');
  if (weaknesses.length === 0) weaknesses.push('None detected');

  const downloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#09090b', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SkillTrove_Report_${attemptId}.pdf`);
    } catch (err) {
      console.error('PDF Generation Failed', err);
    }
  };

  const getProfileImageUrl = (b64) => {
    if (!b64) return null;
    if (b64.startsWith('data:image')) return b64;
    return `data:image/jpeg;base64,${b64}`;
  };

  const storedUserStr = localStorage.getItem('user');
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
  const rawProfileImage = dbProfile?.profileImage || user?.profileImage || localStorage.getItem('skilltrove_profileImage');
  const profileImgUrl = getProfileImageUrl(rawProfileImage);
  
  const displayName = dbProfile?.name || user?.name || storedUser?.name || 'User';
  const displayEmail = dbProfile?.email || user?.email || storedUser?.email || 'N/A';
  const displayImage = profileImgUrl || localStorage.getItem('skilltrove_profileImage');
  
  const examDate = new Date(attempt?.completedAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <section className="mx-auto mt-8 max-w-4xl px-6 pb-16">
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
        <button onClick={downloadPDF} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 shadow-[0_0_15px_rgba(249,115,22,0.4)]">Download PDF Report</button>
      </div>

      <div id="report-content" className="rounded-[2rem] border border-white/20 bg-white/5 p-8 backdrop-blur-2xl">
        <div className="flex justify-center mb-6">
          <img src={displayImage} alt="Identity Verified" className="w-32 h-32 rounded-full border-4 border-cyan-500 mx-auto mb-4 object-cover shadow-[0_0_20px_rgba(6,182,212,0.4)]" />
        </div>
        <div className="flex flex-col items-center border-b border-white/10 pb-8 text-center md:flex-row md:items-start md:text-left">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-200">Official Evaluation</p>
            <h2 className="text-3xl font-bold text-white">{displayName}'s Report Card</h2>
            <p className="mt-1 text-sm text-zinc-300 font-semibold">{displayEmail}</p>
            <p className="mt-1 text-xs text-zinc-400">Date: {examDate}</p>
            <p className="mt-2 text-sm text-zinc-300">Attempt ID: {attemptId}</p>
            {attempt.flagged && <span className="mt-2 inline-block rounded-md border border-red-500/50 bg-red-500/20 px-2 py-1 text-xs font-bold uppercase text-red-300">Proctoring Flagged</span>}
          </div>
          <div className="mt-4 text-center md:mt-0 md:text-right">
            <p className="text-sm uppercase text-zinc-300">Overall Score</p>
            <p className="text-4xl font-extrabold text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">{percentage}%</p>
            <p className="text-xs text-zinc-400">{attempt.totalScore} / {attempt.maxScore} pts</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-6 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-300">
              <Award size={18} /> Core Strengths
            </h3>
            <ul className="space-y-3">
              {strengths.map(s => (
                <li key={s} className="flex items-start gap-3 text-sm text-zinc-300">
                  <CheckCircle size={18} className="mt-0.5 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-6 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-red-300">
              <AlertTriangle size={18} /> Improvement Areas
            </h3>
            <ul className="space-y-3">
              {weaknesses.map(w => (
                <li key={w} className="flex items-start gap-3 text-sm text-zinc-300">
                  <AlertTriangle size={18} className="mt-0.5 text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex justify-center gap-4">
          <button onClick={() => navigate('/leaderboard')} className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors">
            View Leaderboard
          </button>
        </div>
      </div>
    </section>
  );
}
