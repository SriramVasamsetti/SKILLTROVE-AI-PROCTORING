import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, CheckCircle, AlertCircle, Calendar, Target, Award, LoaderCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

/**
 * @function ReportCard
 * @description Renders a high-resolution, secure performance report with PDF export functionality.
 * Includes biometric identity verification proof (snapshot).
 */
export default function ReportCard() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [dbProfile, setDbProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  /**
   * @function fetchReportData
   * @description Fetches exam attempt, quiz metadata, and user profile information with a retry mechanism.
   */
  useEffect(() => {
    let active = true;
    async function fetchReportData() {
      try {
        const token = localStorage.getItem('skilltrove-token');
        if (!token || !attemptId) return;

        const [repRes, profRes] = await Promise.all([
          fetch(`http://localhost:5050/api/reports/attempt/${attemptId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('http://localhost:5050/api/users/profile', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (repRes.status === 404 && retryCount < 5) {
           // Report might still be saving, retry after 2 seconds
           setTimeout(() => {
             if (active) setRetryCount(prev => prev + 1);
           }, 2000);
           return;
        }

        const repData = await repRes.json();
        const profData = await profRes.json();

        if (repRes.ok && active) {
          setReportData(repData);
        }
        if (profRes.ok && active) {
          setDbProfile(profData);
        }
      } catch (err) {
        console.error('Data fetch error:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchReportData();
    return () => { active = false; };
  }, [attemptId, retryCount]);

  /**
   * @function handleExportPDF
   * @description Captures the report DOM element and exports it as a high-resolution PDF.
   */
  const handleExportPDF = async () => {
    const element = document.getElementById('secure-report-content');
    if (!element) return;

    try {
      toast.info("Generating high-resolution report...", { toastId: 'pdf-gen' });
      const canvas = await html2canvas(element, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#0f172a',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`SkillTrove_Report_${attemptId}.pdf`);
      toast.success("Report downloaded successfully!");
    } catch (err) {
      console.error('PDF Export failed:', err);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  if (loading || (retryCount > 0 && !reportData)) return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-950">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500/20 border-t-orange-500 mb-4" />
      <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
        {retryCount > 0 ? `Syncing Report Data (Attempt ${retryCount}/5)...` : 'Authenticating Secure Report...'}
      </p>
    </div>
  );

  if (!reportData?.attempt) return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-white">
      <AlertCircle size={48} className="mb-4 text-red-500" />
      <h2 className="text-2xl font-bold">Report Sequence Not Found</h2>
      <p className="text-zinc-500 mt-2">The requested attempt record could not be retrieved.</p>
      <button onClick={() => navigate('/')} className="mt-6 px-8 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all font-bold">Return to Dashboard</button>
    </div>
  );

  const attempt = reportData.attempt;
  const quiz = reportData.quiz;
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const displayName = dbProfile?.name || user?.name || storedUser?.name || 'User';
  const displayEmail = dbProfile?.email || user?.email || storedUser?.email || 'N/A';
  const displayRoll = dbProfile?.rollNumber || 'ST-2026-X';
  const displayImage = user?.profileImage || localStorage.getItem('skilltrove_profileImage') || 'https://dummyimage.com/100x100/151515/ff6a00.jpg&text=ID';

  return (
    <section className="min-h-screen bg-slate-950 py-12 px-6">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Performance <span className="text-orange-500">Record</span></h1>
            <p className="text-zinc-400 font-medium">Verified Assessment Integrity Certificate</p>
          </div>
          <button
            onClick={handleExportPDF}
            className="group flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white shadow-xl shadow-orange-500/20 transition-all hover:scale-105 hover:bg-orange-600 active:scale-95"
          >
            <Download size={20} className="group-hover:animate-bounce" />
            Download PDF
          </button>
        </motion.div>

        <div id="secure-report-content" className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-slate-900 p-10 shadow-2xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-cyan-500/5" />
          
          <div className="relative z-10 flex flex-col items-center md:flex-row md:items-start gap-10 border-b border-white/10 pb-10">
            <div className="relative">
              <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-orange-500/30 p-1 shadow-[0_0_30px_rgba(249,115,22,0.2)] bg-black/40">
                <img 
                  src={displayImage} 
                  crossOrigin="anonymous"
                  alt="Biometric Identity" 
                  className="h-full w-full rounded-full object-cover" 
                />
              </div>
              <div className="absolute -bottom-2 -right-2 rounded-full bg-emerald-500 p-2 text-white shadow-lg">
                <CheckCircle size={20} />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-4xl font-black text-white tracking-tighter">{displayName}</h2>
              <p className="mt-1 text-lg font-bold text-orange-400 uppercase tracking-widest">{displayRoll}</p>
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold">
                  <Calendar size={16} />
                  {new Date(attempt.completedAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
                </div>
                <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold">
                  <Target size={16} />
                  {quiz?.title || 'General Aptitude'}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/5 p-6 text-center backdrop-blur-md border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Final Score</p>
              <div className="text-5xl font-black text-white leading-none">
                {Math.round((attempt.totalScore / attempt.maxScore) * 100)}<span className="text-2xl text-orange-500">%</span>
              </div>
              <p className="mt-2 text-[10px] text-zinc-400 font-bold tracking-widest">{attempt.totalScore} / {attempt.maxScore} PTS</p>
            </div>
          </div>

          <div className="relative z-10 grid gap-6 mt-10 grid-cols-1 sm:grid-cols-3">
             <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
                <Award className="text-orange-500 mb-2" size={24} />
                <h4 className="text-zinc-500 text-[10px] font-black uppercase tracking-tighter">Status</h4>
                <p className="text-white font-bold">{attempt.totalScore >= (attempt.maxScore * 0.4) ? 'QUALIFIED' : 'NOT QUALIFIED'}</p>
             </div>
             <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
                <Target className="text-cyan-500 mb-2" size={24} />
                <h4 className="text-zinc-500 text-[10px] font-black uppercase tracking-tighter">Accuracy</h4>
                <p className="text-white font-bold">{Math.round((attempt.totalScore / attempt.maxScore) * 100)}%</p>
             </div>
             <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
                <CheckCircle className="text-emerald-500 mb-2" size={24} />
                <h4 className="text-zinc-500 text-[10px] font-black uppercase tracking-tighter">AI Proctoring</h4>
                <p className="text-white font-bold">{attempt.flagged ? 'FLAGGED' : 'SECURE'}</p>
             </div>
          </div>

          <div className="relative z-10 mt-10 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6">
             <h4 className="text-xs font-black text-orange-400 uppercase tracking-widest mb-4">Integrity Certificate</h4>
             <p className="text-sm text-zinc-400 leading-relaxed italic">
               "This document certifies that the candidate completed the assessment under real-time AI proctoring. 
               Identity was verified via continuous biometric facial recognition and eyeball tracking algorithms."
             </p>
             <div className="mt-6 flex justify-between items-end border-t border-white/10 pt-4">
                <div>
                   <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Verification Hash</p>
                   <p className="text-xs text-zinc-300 font-mono tracking-tighter">ST-AUTH-{attemptId.toUpperCase()}</p>
                </div>
                <div className="h-12 w-12 bg-white flex items-center justify-center p-1 rounded-md opacity-20 grayscale">
                   <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://skilltrove.ai/verify/${attemptId}`} alt="QR Code" className="h-full w-full" />
                </div>
             </div>
          </div>
        </div>

        <div className="mt-8 text-center">
           <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">End of Official Record</p>
        </div>
      </div>
    </section>
  );
}
