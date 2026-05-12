import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { useFacePresence } from '../hooks/useFacePresence';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5050';

function HudChip({ label, value, good = true }) {
  return (
    <div className={`rounded-xl border px-3 py-2 text-[11px] uppercase tracking-[0.14em] ${good ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' : 'border-red-400/50 bg-red-500/15 text-red-200'}`}>
      [{label}: {value}]
    </div>
  );
}

export default function QuizInterface({ quizId, questions, subject, stream, onExit }) {
  const bubbleVideoRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [motionStable, setMotionStable] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(20 * 60);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { peopleCount, warning, noFaceTooLong, blinkCount } = useFacePresence(
    bubbleVideoRef,
    Boolean(stream),
    () => handleAutoSubmit(true),
    user?.faceDescriptor
  );

  const handleAutoSubmit = async (autoTerminated = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (autoTerminated) {
      toast.error("IDENTITY COMPROMISED: Exam auto-submitted due to security violation.", { toastId: 'termination' });
    }
    try {
      const formattedResponses = Object.entries(responses).map(([qIndex, answer]) => ({
        questionIndex: Number(qIndex),
        answer
      }));
      if (!quizId) { onExit(); return; }
      const res = await fetch(`${API_BASE}/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('skilltrove-token')}`
        },
        body: JSON.stringify({ responses: formattedResponses, aiProvider: 'openai', flagged: autoTerminated })
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/report/${data.attempt._id}`);
      } else {
        toast.error("Failed to submit exam: " + (data.message || 'Unknown error'));
        onExit();
      }
    } catch (e) {
      console.error('Submission error:', e);
      onExit();
    }
  };

  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (e.key === 'F12' || (e.ctrlKey && e.key === 'c') || (e.ctrlKey && e.key === 'v') || (e.ctrlKey && e.key === 't')) {
        e.preventDefault();
      }
    };
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('contextmenu', handleContextMenu); window.removeEventListener('keydown', handleKeyDown); };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabWarnings(prev => {
          const next = prev + 1;
          if (next >= 2) { handleAutoSubmit(true); } else { toast.warning("WARNING: Navigating away from the exam tab is not allowed."); }
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (bubbleVideoRef.current && stream) { bubbleVideoRef.current.srcObject = stream; }
  }, [stream]);

  useEffect(() => {
    if (!isVerified && peopleCount === 1) {
      if (warning?.includes('Identity Mismatch')) { setVerificationFailed(true); }
      else if (!warning) { const timer = setTimeout(() => setIsVerified(true), 1500); return () => clearTimeout(timer); }
    }
  }, [peopleCount, warning, isVerified]);

  // Countdown timer
  useEffect(() => {
    if (noFaceTooLong) return;
    const t = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) { handleAutoSubmit(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [noFaceTooLong]);

  const activeQuestion = questions?.[index];
  const hasQuestions = Array.isArray(questions) && questions.length > 0;
  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const ss = String(remainingSeconds % 60).padStart(2, '0');

  return (
    <section className="mx-auto mt-4 max-w-7xl px-6 pb-14 md:px-10">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900/40 p-8 backdrop-blur-2xl md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-cyan-500/5" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-orange-400 font-bold">Secure Assessment Protocol</p>
            <h2 className="mt-1 text-3xl font-black text-white tracking-tight">SkillTrove <span className="text-cyan-400">Zen</span> Interface</h2>
            <p className="mt-1 text-sm text-zinc-400">Exam Subject: <span className="font-bold text-zinc-200">{subject || 'Skill Assessment'}</span></p>
          </div>
          <div className="flex flex-col items-end">
            <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-xl font-black text-white shadow-inner">{mm}:{ss}</div>
            {noFaceTooLong && <p className="text-[10px] text-red-400 font-bold mt-1 animate-pulse">TIMER PAUSED: FACE MISSING</p>}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <HudChip label="Status" value={isVerified ? 'Verified' : 'Scanning'} good={isVerified} />
          <HudChip label="Motion" value={motionStable ? 'Stable' : 'Excessive'} good={motionStable} />
          <HudChip label="People" value={peopleCount > 1 ? 'Alert!' : peopleCount} good={peopleCount === 1} />
          <HudChip label="Blinks" value={blinkCount} good={true} />
          {warning && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] uppercase tracking-widest text-red-400 font-bold animate-pulse">[{warning}]</div>}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-3xl">
            {verificationFailed ? (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                <AlertTriangle size={64} className="mb-4 text-red-500" />
                <h3 className="text-2xl font-black uppercase text-red-500">IMPERSONATION_DETECTED</h3>
                <p className="mt-4 text-zinc-300">Biometric identity mismatch. This session has been flagged for review.</p>
              </div>
            ) : !isVerified ? (
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-500/20 border-t-orange-500" />
                <h3 className="text-lg font-bold text-white">Biometric Handshake...</h3>
                <p className="text-sm text-zinc-400">Verifying identity against profile...</p>
              </div>
            ) : !hasQuestions ? (
              <div className="text-center p-10"><p className="text-red-400 font-bold">Error: Question stream corrupted or empty.</p></div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-xs uppercase tracking-widest text-orange-400 font-bold">Progress: {index + 1} / {questions.length}</p>
                  <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white leading-tight mb-8">{activeQuestion?.prompt}</h3>
                {activeQuestion?.type === 'MCQ' ? (
                  <div className="grid gap-4">
                    {activeQuestion.options.map((opt) => {
                      const isSelected = responses[index] === opt;
                      return (
                        <motion.label key={opt} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className={`cursor-pointer rounded-2xl border p-5 transition-all ${isSelected ? 'border-orange-500 bg-orange-500/10 text-white shadow-[0_0_20px_rgba(249,115,22,0.2)]' : 'border-white/5 bg-white/5 text-zinc-300 hover:bg-white/10'}`}>
                          <input type="radio" name={`q-${index}`} className="hidden" checked={isSelected} onChange={() => setResponses(p => ({ ...p, [index]: opt }))} />
                          <div className="flex items-center gap-4">
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-orange-500' : 'border-white/20'}`}>
                              {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />}
                            </div>
                            <span className="font-medium">{opt}</span>
                          </div>
                        </motion.label>
                      );
                    })}
                  </div>
                ) : (
                  <textarea value={responses[index] || ''} onChange={(e) => setResponses(p => ({ ...p, [index]: e.target.value }))} className="w-full h-48 rounded-2xl border border-white/10 bg-black/20 p-6 text-white outline-none focus:border-orange-500 transition-all placeholder:text-zinc-600" placeholder="Provide your subjective response here..." />
                )}
                <div className="mt-10 flex gap-4">
                  <button onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0} className="px-8 py-3 rounded-xl bg-white/5 text-white font-bold disabled:opacity-30">Previous</button>
                  {index < questions.length - 1 ? (
                    <button onClick={() => setIndex(i => i + 1)} className="px-8 py-3 rounded-xl bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/20">Next Question</button>
                  ) : (
                    <button onClick={() => handleAutoSubmit()} disabled={isSubmitting} className="px-8 py-3 rounded-xl bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20">
                      {isSubmitting ? <span className="inline-flex items-center gap-2"><LoaderCircle size={14} className="animate-spin" /> Submitting...</span> : 'Finalize Submission'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="space-y-6">
            <motion.div drag dragMomentum={false} className="relative cursor-grab rounded-[2.5rem] border border-cyan-500/30 bg-slate-900/80 p-2 shadow-2xl overflow-hidden">
              <video ref={bubbleVideoRef} autoPlay muted playsInline className="h-48 w-full rounded-[2rem] object-cover" />
              <div className="absolute top-4 right-4 flex h-3 w-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]" />
              <div className="absolute bottom-4 left-4 right-4 py-2 px-4 bg-black/60 backdrop-blur-md rounded-xl text-[10px] text-zinc-300 font-bold uppercase tracking-widest text-center border border-white/10">AI Proctoring Active</div>
            </motion.div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h4 className="text-xs uppercase tracking-widest text-cyan-400 font-black mb-4">Security Telemetry</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-xs text-zinc-400">Eye Blinks</span><span className="text-xs text-emerald-400 font-bold">{blinkCount} detected</span></div>
                <div className="flex justify-between items-center"><span className="text-xs text-zinc-400">Identity Lock</span><span className="text-xs text-emerald-400 font-bold">{isVerified ? 'Active' : 'Pending'}</span></div>
                <div className="flex justify-between items-center"><span className="text-xs text-zinc-400">Tab Switches</span><span className={`text-xs font-bold ${tabWarnings > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{tabWarnings}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
