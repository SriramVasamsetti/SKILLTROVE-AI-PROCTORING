import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as faceapi from 'face-api.js';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

async function loadFaceModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
  await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
}

export default function Signup() {
  const videoRef = useRef(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [descriptor, setDescriptor] = useState(null);
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    localStorage.clear();
  }, []);

  async function startCam() {
    try {
      setMsg('');
      await loadFaceModels();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onplay = () => {
          setScanning(true);
          setDescriptor(null);
          const interval = setInterval(async () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
              clearInterval(interval);
              return;
            }
            const detection = await faceapi
              .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.6 }))
              .withFaceLandmarks()
              .withFaceDescriptor();
            
            if (detection) {
              setDescriptor(Array.from(detection.descriptor));
              
              const canvas = document.createElement('canvas');
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              const b64 = canvas.toDataURL('image/jpeg', 0.5);
              setForm((p) => ({ ...p, profileImage: b64 }));
              localStorage.setItem('skilltrove_profileImage', b64);
              
              setScanning(false);
              clearInterval(interval);
            }
          }, 500);
        };
      }
    } catch (err) {
      setMsg('Error accessing camera or models: ' + err.message);
    }
  }

  async function doSignup() {
    if (!descriptor) {
      setMsg('Please scan your face first.');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const res = await api.post('/auth/signup', {
        ...form,
        faceDescriptor: descriptor
      });
      
      // Auto-login or redirect to login
      if (res.data.token) {
        login(res.data.token);
        navigate('/');
      } else {
        navigate('/login');
      }

    } catch (e) {
      setMsg(e.response?.data?.message || e.message);
      if (e.response?.data?.message?.toLowerCase().includes('biometric')) {
         setTimeout(() => navigate('/login'), 2500);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto mt-8 max-w-xl px-6">
      <div className="rounded-[2rem] border border-white/10 bg-slate-900 p-6 backdrop-blur-2xl">
        <h2 className="text-2xl font-bold text-white">Face Signup</h2>
        <video ref={videoRef} autoPlay muted playsInline className="mt-4 h-56 w-full rounded-2xl object-cover border border-cyan-500/30" />
        <div className="mt-4 space-y-3">
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 outline-none" />
          <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 outline-none" />
          <input value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} type="password" placeholder="Password" className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 outline-none" />
          <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 outline-none appearance-none">
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
          </select>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={startCam} type="button" className="glass-chip border-orange-500/40 hover:border-orange-500 text-orange-200">Start Camera</button>
          <motion.button disabled={!descriptor || busy} whileTap={{ scale: (!descriptor || busy) ? 1 : 0.98 }} onClick={doSignup} type="button" className={`rounded-xl border border-cyan-500/50 px-4 py-2 font-semibold ${!descriptor || busy ? 'bg-black/50 text-cyan-400/50 opacity-50 cursor-not-allowed' : 'bg-cyan-500/20 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.4)]'}`}>
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <LoaderCircle size={14} className="animate-spin" /> Creating...
              </span>
            ) : scanning ? (
              <span className="inline-flex items-center gap-2">
                <LoaderCircle size={14} className="animate-spin text-cyan-400" /> Scanning Face...
              </span>
            ) : descriptor ? (
              'Create Account'
            ) : (
              'Face Scan Required'
            )}
          </motion.button>
        </div>
        {msg && <p className="mt-3 text-sm text-red-400">{msg}</p>}
      </div>
    </section>
  );
}
