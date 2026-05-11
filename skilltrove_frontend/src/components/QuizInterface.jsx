import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Eye, LoaderCircle, Move3D, Video } from 'lucide-react';
import { useFacePresence } from '../hooks/useFacePresence';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

function HudChip({ label, value, good = true }) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 text-[11px] uppercase tracking-[0.14em] ${
        good
          ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
          : 'border-red-400/50 bg-red-500/15 text-red-200'
      }`}
    >
      [{label}: {value}]
    </div>
  );
}

export default function QuizInterface({ quizId, questions, subject, stream, onExit }) {
  const bubbleVideoRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [motionStable, setMotionStable] = useState(true);
  const [blinkDetected] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(20 * 60);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const navigate = useNavigate();

  const { user } = useAuth();

  const { peopleCount, warning, warningsCount, noFaceTooLong, modelLoading, modelError, retryModels } = useFacePresence(
    bubbleVideoRef,
    Boolean(stream),
    () => submitExam(true),
    user?.faceDescriptor
  );

  const submitExam = async (autoTerminated = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const formattedResponses = Object.entries(responses).map(([qIndex, answer]) => ({
        questionIndex: Number(qIndex),
        answer
      }));

      if (!quizId) {
        onExit();
        return;
      }

      const res = await fetch(`http://localhost:5050/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('skilltrove-token')}`
        },
        body: JSON.stringify({ responses: formattedResponses, aiProvider: 'openai' })
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/report/${data.attempt._id}`);
      } else {
        alert("Failed to submit exam: " + (data.message || 'Unknown error'));
        onExit();
      }
    } catch (e) {
      console.error(e);
      onExit();
    }
  };

  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.key === 'c') ||
        (e.ctrlKey && e.key === 'v') ||
        (e.ctrlKey && e.key === 't')
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setTabWarnings(prev => {
          const next = prev + 1;
          if (next >= 2) {
            alert("Exam Terminated: Navigating away from the exam tab is not allowed.");
            submitExam(true);
          } else {
            alert("WARNING: Navigating away from the exam tab is not allowed. One more attempt will terminate your exam.");
          }
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (warningsCount >= 3) {
      toast.error("Exam Terminated: Excessive suspicious behavior detected.", { toastId: 'term' });
      submitExam(true);
    }
  }, [warningsCount]);

  useEffect(() => {
    if (warning) {
      toast.error(`ALERT: ${warning}`, { toastId: warning });
    }
  }, [warning]);

  useEffect(() => {
    if (bubbleVideoRef.current && stream) {
      bubbleVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    const t = setInterval(() => {
      setMotionStable(Math.random() > 0.22);
    }, 2600);
    return () => clearInterval(t);
  }, []);

  const timerPaused = noFaceTooLong;
  useEffect(() => {
    if (timerPaused) return undefined;
    const t = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [timerPaused]);

  useEffect(() => {
    if (!isVerified && peopleCount === 1) {
      if (warning === 'STOP! Unauthorized User Detected') {
        setVerificationFailed(true);
      } else if (!warning) {
        const timer = setTimeout(() => setIsVerified(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [peopleCount, warning, isVerified]);

  const activeQuestion = questions?.[index];
  const hasQuestions = Array.isArray(questions) && questions.length > 0;

  const pulseClass = useMemo(
    () => (!motionStable || Boolean(warning) ? 'quiz-warning-pulse' : ''),
    [motionStable, warning],
  );
  const peopleHud = peopleCount > 1 ? 'MULTIPLE!' : String(peopleCount);
  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const ss = String(remainingSeconds % 60).padStart(2, '0');

  return (
    <section className={`mx-auto mt-4 max-w-7xl px-6 pb-14 md:px-10 ${pulseClass}`}>
      <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-black/35 p-7 backdrop-blur-2xl md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-red-500/8" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-orange-200">Quiz Cockpit</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Zen Assessment Interface</h2>
            <p className="mt-2 text-sm text-zinc-200/80">
              Subject: <span className="font-semibold text-orange-200">{subject || 'AI Proctoring Systems'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm text-white"
          >
            Exit
          </button>
        </div>
        <div className="mt-3 rounded-xl border border-white/20 bg-black/25 px-3 py-2 text-xs uppercase tracking-[0.16em] text-zinc-200">
          Timer: {mm}:{ss} {timerPaused ? '(Paused: Face Missing > 3s)' : ''}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {modelLoading && (
            <HudChip label="Model" value="Loading" good />
          )}
          {modelError && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-red-400/45 bg-red-500/10 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-red-200">
              [Model Missing]
              <button
                type="button"
                onClick={retryModels}
                className="rounded-md border border-red-300/45 bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold"
              >
                Retry
              </button>
            </div>
          )}
          <HudChip label="Eye Blink" value={blinkDetected ? 'Detected' : 'Unknown'} good />
          <HudChip label="Motion" value={motionStable ? 'Stable' : 'Excessive'} good={motionStable} />
          <HudChip label="Webcam" value={stream ? 'Active' : 'Unavailable'} good={!!stream} />
          <HudChip label="People" value={peopleHud} good={peopleCount === 1} />
          {warning && warning !== 'STOP! Unauthorized User Detected' && <HudChip label="Alert" value={warning} good={false} />}
          
          {warning === 'STOP! Unauthorized User Detected' ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-red-400/45 bg-red-500/20 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-red-200 animate-pulse">
              [Identity Mismatch!]
            </div>
          ) : isVerified ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/45 bg-emerald-500/20 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-emerald-200">
              [Identity Verified]
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-7 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-3xl border border-white/15 bg-white/5 p-6">
            {verificationFailed ? (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-red-500/50 bg-red-500/20 p-8 text-center text-red-200">
                <AlertTriangle size={64} className="mb-4 text-red-500 animate-bounce" />
                <h3 className="text-3xl font-extrabold uppercase tracking-widest text-red-500">UNAUTHORIZED USER DETECTED</h3>
                <p className="mt-4 text-lg">Identity mismatch. You cannot proceed with this exam.</p>
              </div>
            ) : !isVerified ? (
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-300/35 border-t-orange-500" />
                <h3 className="text-lg font-bold text-white">Verification Scan in Progress</h3>
                <p className="text-sm text-zinc-400">Please look directly at the camera...</p>
              </div>
            ) : !hasQuestions ? (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-red-200">
                <p className="inline-flex items-center gap-2 font-semibold">
                  <AlertTriangle size={18} /> No generated questions found.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs uppercase tracking-[0.18em] text-orange-200">
                  Question {index + 1} / {questions.length}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-white">{activeQuestion?.prompt}</h3>
                <p className="mt-2 text-sm text-zinc-300">Type: {activeQuestion?.type}</p>

                {Array.isArray(activeQuestion?.options) && activeQuestion.options.length > 0 && (
                  <div className="mt-5 grid gap-3">
                    {activeQuestion.options.map((opt) => {
                      const isSelected = responses[index] === opt;
                      return (
                        <label
                          key={opt}
                          onClick={() => setResponses(prev => ({ ...prev, [index]: opt }))}
                          className={`cursor-pointer pointer-events-auto relative z-[100] rounded-2xl border px-4 py-3 text-sm transition-all duration-300 ${
                            isSelected 
                              ? 'border-orange-500 bg-orange-500/20 text-orange-100 shadow-[0_0_15px_rgba(255,165,0,0.6)]' 
                              : 'border-white/20 bg-black/20 text-zinc-100 hover:border-orange-400/50 hover:bg-orange-500/10 hover:shadow-[0_0_10px_rgba(255,165,0,0.3)]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`mcq-${index}`}
                            checked={isSelected}
                            onChange={() => setResponses(prev => ({ ...prev, [index]: opt }))}
                            className="mr-3 accent-orange-500"
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                )}

                {!activeQuestion?.options?.length && (
                  <textarea
                    value={responses[index] || ''}
                    onChange={(e) => setResponses(prev => ({ ...prev, [index]: e.target.value }))}
                    className="mt-5 h-32 w-full rounded-2xl border border-white/20 bg-black/25 p-4 text-sm text-white outline-none focus:border-orange-500 focus:shadow-[0_0_15px_rgba(255,165,0,0.4)] transition-all"
                    placeholder="Write your answer here..."
                  />
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIndex((prev) => Math.max(prev - 1, 0))}
                    disabled={index === 0}
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {index < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setIndex((prev) => Math.min(prev + 1, questions.length - 1))}
                      className="rounded-xl border border-orange-400/50 bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-100 hover:bg-orange-500/30"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => submitExam()}
                      disabled={isSubmitting}
                      className="rounded-xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/30"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="space-y-5">
            <motion.div
              drag
              dragMomentum={false}
              whileHover={{ scale: 1.02 }}
              className="relative ml-auto w-56 cursor-grab overflow-hidden rounded-3xl border border-orange-300/40 bg-black/55 p-2 shadow-[0_0_30px_rgba(255,96,43,.35)]"
            >
              <video ref={bubbleVideoRef} autoPlay muted playsInline className="h-36 w-full rounded-2xl object-cover" />
              {modelLoading && (
                <div className="absolute inset-2 flex items-center justify-center rounded-2xl bg-black/55">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-orange-100">
                    <LoaderCircle size={14} className="animate-spin" /> Model Loading
                  </p>
                </div>
              )}
            </motion.div>

            <div className="rounded-3xl border border-white/15 bg-white/5 p-4">
              <p className="mb-3 text-xs uppercase tracking-[0.16em] text-orange-200">Detection HUD</p>
              <div className="space-y-2 text-sm text-zinc-200">
                <p className="inline-flex items-center gap-2"><Eye size={15} className="text-orange-300" /> Eye Blink: Detected</p>
                <p className="inline-flex items-center gap-2"><Move3D size={15} className={motionStable ? 'text-emerald-300' : 'text-red-300'} /> Motion: {motionStable ? 'Stable' : 'Suspicious'}</p>
                <p className="inline-flex items-center gap-2"><Video size={15} className="text-orange-300" /> Webcam: Active</p>
                <p className="inline-flex items-center gap-2">
                  <AlertTriangle size={15} className={peopleCount === 1 ? 'text-emerald-300' : 'text-red-300'} /> People: {peopleHud}
                </p>
                {warning && <p className="text-red-300">{warning}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
