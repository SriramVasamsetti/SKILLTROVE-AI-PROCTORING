import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, LoaderCircle, LockKeyhole, Radar, ShieldCheck, Users, Video, Camera, ShieldAlert } from 'lucide-react';
import { useFacePresence } from '../hooks/useFacePresence';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5050';

/**
 * @function ReadyCard
 * @description specialized card for system readiness status.
 */
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

/**
 * @function SystemCheck
 * @description Comprehensive hardware and biometric verification before exam initialization.
 * Implements hardware-locked camera logic to prioritize integrated webcams.
 */
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
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isHardwareLocked, setIsHardwareLocked] = useState(false);
  const location = useLocation();
  const passedQuiz = location.state?.quiz;
  
  const { user } = useAuth();
  
  const {
    peopleCount,
    warning,
    noFaceTooLong,
    modelLoading,
    modelError,
    retryModels,
  } = useFacePresence(videoRef, Boolean(stream), null, user?.faceDescriptor);

  /**
   * @function initMedia
   * @description Enumerates media devices and initializes the primary camera stream.
   * Prioritizes 'Integrated' or 'Built-in' cameras as per security policy.
   * @param {string} deviceId - Optional specific device ID to use.
   */
  async function initMedia(deviceId = '') {
    try {
      // Stop existing tracks
      stream?.getTracks?.().forEach((t) => t.stop());
      audioCtx?.ctx?.close?.();

      // Enumerate all video sources first if not done
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const vDevices = allDevices.filter(d => d.kind === 'videoinput');
      setVideoDevices(vDevices);

      // Identify integrated camera
      const integrated = vDevices.find(d => 
        /integrated|built-in|front/i.test(d.label)
      );

      let targetId = deviceId;
      if (!targetId && integrated) {
        targetId = integrated.deviceId;
        setIsHardwareLocked(true);
      } else if (!targetId && vDevices.length > 0) {
        targetId = vDevices[0].deviceId;
        setIsHardwareLocked(false);
      }

      const constraints = {
        audio: true,
        video: targetId ? { deviceId: { exact: targetId } } : true
      };

      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      setCameraOk(true);
      setMicOk(true);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      if (targetId) setSelectedDeviceId(targetId);

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaStreamSource(s);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      setAudioCtx({ ctx, analyser });
      setError('');
    } catch (e) {
      console.error('Media init error:', e);
      setError('Camera/Mic permission denied or hardware missing. Please check connection.');
      setCameraOk(false);
      setMicOk(false);
    }
  }

  useEffect(() => {
    initMedia();
    return () => {
      stream?.getTracks?.().forEach((t) => t.stop());
      audioCtx?.ctx?.close?.();
    };
  }, []);

  /**
   * @description Visualizes live microphone frequency data on a canvas.
   */
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

  /**
   * @function requestMovement
   * @description Requests permission for accelerometer/gyroscope sensors.
   */
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
      setError('Movement permission blocked on this device.');
    }
  }

  // Biometric Lock: Must match signup snapshot (handled by useFacePresence and user.faceDescriptor)
  const isBiometricallyVerified = peopleCount === 1 && !warning?.includes('Identity Mismatch') && !warning;
  const peopleStable = peopleCount === 1 && !warning;
  const allGreen = cameraOk && micOk && movementOk && isBiometricallyVerified;

  const progress = useMemo(() => {
    const done = [cameraOk, micOk, movementOk, isBiometricallyVerified].filter(Boolean).length;
    return Math.round((done / 4) * 100);
  }, [cameraOk, micOk, movementOk, isBiometricallyVerified]);

  /**
   * @function handleStartQuiz
   * @description Final validation and quiz generation trigger.
   */
  async function handleStartQuiz() {
    if (!allGreen || isLoading) return;
    setIsLoading(true);
    setError('');
    
    // If quiz was already passed (from Assigned or Practice Selection)
    if (passedQuiz) {
      onStartQuiz({
        quizId: passedQuiz._id,
        questions: passedQuiz.questions || [],
        subject: passedQuiz.subject || topic,
        stream,
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/quiz/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('skilltrove-token')}`
        },
        body: JSON.stringify({ subject: topic || 'General Knowledge' }),
      });
      
      const data = await response.json();
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
      <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-slate-900/40 p-8 backdrop-blur-3xl md:p-12">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500">Security Diagnostic</p>
              <h2 className="mt-2 text-3xl font-black text-white md:text-5xl tracking-tight">System <span className="text-orange-500">Readiness</span></h2>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Score</p>
              <p className="text-3xl font-black text-white">{progress}%</p>
            </div>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_.8fr]">
            <div className="flex flex-col gap-6">
              <div className="relative flex items-center justify-center rounded-[2.5rem] border border-white/10 bg-black/20 p-8">
                 <div className="relative h-80 w-80 overflow-hidden rounded-full border-4 border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.15)]">
                   <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                 </div>
                 {isHardwareLocked && (
                   <div className="absolute top-4 right-4 flex items-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/20 px-3 py-1 text-[10px] font-black text-orange-500 uppercase tracking-widest">
                     <ShieldCheck size={14} />
                     Hardware Locked
                   </div>
                 )}
              </div>

              {videoDevices.length > 1 && (
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-2 block">Available Video Sources</label>
                  <div className="flex items-center gap-3">
                    <Camera size={18} className="text-zinc-500" />
                    <select 
                      disabled={isHardwareLocked}
                      value={selectedDeviceId}
                      onChange={(e) => {
                        setSelectedDeviceId(e.target.value);
                        initMedia(e.target.value);
                      }}
                      className="flex-1 bg-transparent text-sm text-white font-bold outline-none cursor-pointer disabled:opacity-50"
                    >
                      {videoDevices.map((device, i) => (
                        <option key={device.deviceId} value={device.deviceId} className="bg-slate-900">
                          {device.label || `Camera ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  {isHardwareLocked && <p className="mt-2 text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Integrated camera enforced for maximum integrity.</p>}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <ReadyCard title="Optical Presence" verified={cameraOk} icon={Video} delay={0.1} />
              <ReadyCard title="Audio Spectrum" verified={micOk} icon={Radar} delay={0.2} />
              <ReadyCard title="Inertial Link" verified={movementOk} icon={ShieldCheck} delay={0.3} />
              <ReadyCard title="Biometric Lock" verified={isBiometricallyVerified} icon={Users} delay={0.4} />
              
              {!movementOk && (
                <button
                  type="button"
                  onClick={requestMovement}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/10"
                >
                  Request Sensor Access
                </button>
              )}
            </div>
          </div>

          <div className="mt-10 space-y-6">
            <div className="rounded-3xl border border-white/5 bg-black/40 p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-4 text-center">Acoustic Signal Analysis</p>
              <canvas ref={canvasRef} width={980} height={100} className="h-24 w-full rounded-2xl" />
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-end">
              <div className="flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Assessment Focus</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Computer Networks, ReactJS, Data Structures"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-6 py-4 text-white outline-none focus:border-orange-500 transition-all font-bold"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/10"
                >
                  Abort
                </button>
                <button
                  type="button"
                  onClick={handleStartQuiz}
                  disabled={!allGreen || isLoading}
                  className={`rounded-2xl px-10 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                    allGreen
                      ? 'bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95'
                      : 'bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? 'Engineering Quiz...' : 'Engage Assessment'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
              <ShieldAlert className="text-red-500" size={20} />
              <p className="text-sm font-bold text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
