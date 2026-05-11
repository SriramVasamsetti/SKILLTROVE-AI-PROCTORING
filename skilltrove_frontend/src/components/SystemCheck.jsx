import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, LoaderCircle, LockKeyhole, Radar, ShieldCheck, Users, Video } from 'lucide-react';
import { useFacePresence } from '../hooks/useFacePresence';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5050';

function ReadyCard({ title, verified, icon: Icon, delay }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/5 p-5 backdrop-blur-xl"
      whileHover={{ y: -6 }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.35, 0.6, 0.35],
          background: verified
            ? 'linear-gradient(120deg, rgba(30,255,143,0.34), rgba(6,199,109,0.1))'
            : 'linear-gradient(120deg, rgba(255,56,84,0.36), rgba(255,56,84,0.09))',
        }}
        transition={{ duration: 1.8, repeat: Infinity }}
      />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/20 bg-black/20 p-2">
            <Icon size={18} className={verified ? 'text-emerald-300' : 'text-red-300'} />
          </div>
          <p className="text-sm font-semibold text-white">{title}</p>
        </div>
        <motion.div
          initial={false}
          animate={{ scale: verified ? [1, 1.12, 1] : 1 }}
          transition={{ duration: 0.36 }}
        >
          {verified ? (
            <CheckCircle2 size={20} className="text-emerald-300" />
          ) : (
            <LockKeyhole size={20} className="text-red-300" />
          )}
        </motion.div>
      </div>
      <p className="relative mt-3 text-xs uppercase tracking-[0.16em] text-zinc-200/80">
        {verified ? 'Verified' : 'Locked'}
      </p>
    </motion.article>
  );
}

export default function SystemCheck({ normalized, onBack, onStartQuiz }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [audioCtx, setAudioCtx] = useState(null);
  const [cameraOk, setCameraOk] = useState(false);
  const [micOk, setMicOk] = useState(false);
  const [movementOk, setMovementOk] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState('Operating Systems');
  const [error, setError] = useState('');
  const { user } = useAuth();
  
  const {
    peopleCount,
    warning,
    noFaceTooLong,
    modelLoading,
    modelError,
    retryModels,
  } = useFacePresence(videoRef, Boolean(stream), null, user?.faceDescriptor);

  useEffect(() => {
    let mounted = true;
    async function initMedia() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) return;
        setStream(s);
        setCameraOk(true);
        setMicOk(true);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }

        const ctx = new window.AudioContext();
        const source = ctx.createMediaStreamSource(s);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        setAudioCtx({ ctx, analyser });
      } catch (e) {
        setError('Camera/Mic permission denied. Please allow and retry.');
      }
    }
    initMedia();
    return () => {
      mounted = false;
      stream?.getTracks?.().forEach((t) => t.stop());
      audioCtx?.ctx?.close?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!audioCtx?.analyser || !canvasRef.current) return undefined;
    const canvas = canvasRef.current;
    const c = canvas.getContext('2d');
    const values = new Uint8Array(audioCtx.analyser.frequencyBinCount);
    let raf = 0;
    const draw = () => {
      audioCtx.analyser.getByteFrequencyData(values);
      c.clearRect(0, 0, canvas.width, canvas.height);
      c.fillStyle = 'rgba(255,130,74,.9)';
      const step = canvas.width / values.length;
      values.forEach((v, i) => {
        const h = (v / 255) * canvas.height;
        c.fillRect(i * step, canvas.height - h, Math.max(2, step - 1), h);
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [audioCtx]);

  async function requestMovement() {
    try {
      if (typeof window.DeviceMotionEvent?.requestPermission === 'function') {
        const status = await window.DeviceMotionEvent.requestPermission();
        setMovementOk(status === 'granted');
      } else {
        setMovementOk(true);
      }
    } catch {
      setMovementOk(false);
      setError('Movement permission blocked on this device/browser.');
    }
  }

  const peopleStable = peopleCount === 1 && !warning;
  const allGreen = cameraOk && micOk && movementOk && peopleStable;

  const progress = useMemo(() => {
    const done = [cameraOk, micOk, movementOk, peopleStable].filter(Boolean).length;
    return Math.round((done / 4) * 100);
  }, [cameraOk, micOk, movementOk, peopleStable]);

  async function handleStartQuiz() {
    if (!allGreen || isLoading) return;
    setIsLoading(true);
    setError('');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const response = await fetch(`${API_BASE}/api/quiz/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: topic || 'General Knowledge', provider: 'openai' }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('Non-JSON response:', text);
        throw new Error('Server returned HTML instead of JSON. Check backend CORS or endpoints.');
      }
      
      if (!response.ok) throw new Error(data?.message || 'Failed to generate quiz');
      onStartQuiz({
        quizId: data?._id,
        questions: data?.questions || [],
        subject: data?.subject || topic || 'General Knowledge',
        stream,
      });
    } catch (e) {
      setError(e.message || 'Unable to start quiz');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className={`mx-auto mt-4 max-w-7xl px-6 pb-16 pt-4 md:px-10 ${warning ? 'quiz-warning-pulse' : ''}`}>
      <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/5 p-7 backdrop-blur-2xl md:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/15 via-transparent to-red-500/8" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-orange-200">Pre-Flight Dashboard</p>
              <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">System Readiness Matrix</h2>
            </div>
            <div className="rounded-2xl border border-orange-300/30 bg-black/20 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-200">Readiness Score</p>
              <p className="text-2xl font-bold text-white">{progress}%</p>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
            <motion.div
              animate={{ x: normalized.x * 12, y: normalized.y * 8 }}
              className="relative flex items-center justify-center rounded-3xl border border-white/20 bg-black/25 p-6 backdrop-blur-xl"
            >
              <motion.div
                className="relative h-72 w-72 overflow-hidden rounded-full border-2 border-orange-300/40 bg-black/60"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                style={{ boxShadow: '0 0 35px rgba(255,132,58,.45)' }}
              >
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
              </motion.div>
            </motion.div>

            <div className="space-y-5">
              <ReadyCard title="Camera Access" verified={cameraOk} icon={Video} delay={0.1} />
              <ReadyCard title="Microphone Access" verified={micOk} icon={Radar} delay={0.2} />
              <ReadyCard title="Movement Sensor" verified={movementOk} icon={ShieldCheck} delay={0.3} />
              <ReadyCard title="Single Face Presence" verified={peopleStable} icon={Users} delay={0.4} />
              <button
                type="button"
                onClick={requestMovement}
                className="rounded-2xl border border-orange-300/40 bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-100"
              >
                Verify Movement Sensor
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/15 bg-black/30 p-4">
            {modelLoading && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-100">
                <LoaderCircle size={16} className="animate-spin" />
                Model Loading... preparing face detector
              </div>
            )}
            {modelError && (
              <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-red-400/45 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                <span>{modelError}</span>
                <button
                  type="button"
                  onClick={retryModels}
                  className="rounded-lg border border-red-300/45 bg-red-500/15 px-2 py-1 text-xs font-semibold"
                >
                  Retry
                </button>
              </div>
            )}
            <div className="mb-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em]">
              <span className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-zinc-200">
                [PEOPLE: {peopleCount > 1 ? 'MULTIPLE!' : peopleCount}]
              </span>
              {warning && warning !== 'STOP! Unauthorized User Detected' && (
                <span className="rounded-lg border border-red-400/50 bg-red-500/15 px-2 py-1 text-red-200">
                  [{warning}]
                </span>
              )}
              {warning === 'STOP! Unauthorized User Detected' && (
                <span className="rounded-lg border border-red-500 bg-red-600/30 px-3 py-1 font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse">
                  [UNAUTHORIZED USER DETECTED]
                </span>
              )}
              {noFaceTooLong && (
                <span className="rounded-lg border border-red-400/50 bg-red-500/15 px-2 py-1 text-red-200">
                  [NO FACE {'>'} 3S]
                </span>
              )}
            </div>
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-orange-200">Live Voice Visualizer</p>
            <canvas ref={canvasRef} width={980} height={120} className="h-28 w-full rounded-2xl bg-black/40" />
          </div>

          {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

          <div className="mt-6">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-orange-200">Quiz Topic</p>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., ReactJS, Aptitude, Operating Systems"
              className="w-full max-w-sm rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50"
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <motion.button
              type="button"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartQuiz}
              disabled={!allGreen || isLoading}
              className={`rounded-2xl px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] ${
                allGreen
                  ? 'border border-emerald-400/60 bg-emerald-500/20 text-emerald-100'
                  : 'cursor-not-allowed border border-red-400/40 bg-red-500/15 text-red-200/80'
              }`}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle size={14} className="animate-spin" /> Generating...
                </span>
              ) : (
                'Start Quiz'
              )}
            </motion.button>

            <button
              type="button"
              onClick={onBack}
              className="rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white/90"
            >
              Back to Hero
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
