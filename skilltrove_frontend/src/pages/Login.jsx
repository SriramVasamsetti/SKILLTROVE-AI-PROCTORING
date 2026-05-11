import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as faceapi from 'face-api.js';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

async function loadFaceModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
  await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
}

export default function Login() {
  const videoRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [descriptor, setDescriptor] = useState(null);
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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

  async function doLogin() {
    if (!descriptor) {
      setMsg('Please scan your face first.');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('http://localhost:5050/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, faceDescriptor: descriptor }),
      });
      
      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('Non-JSON response:', text);
        throw new Error('Server returned HTML instead of JSON. Check console.');
      }

      if (!res.ok) throw new Error(data?.message || 'Login failed');
      login(data.token);
      if (data.user.role === 'faculty') {
        navigate('/faculty-dashboard');
      } else {
        navigate('/');
      }
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto mt-8 max-w-xl px-6">
      <div className="rounded-[2rem] border border-white/20 bg-white/5 p-6 backdrop-blur-2xl">
        <h2 className="text-2xl font-bold text-white">Face Login</h2>
        <p className="text-sm text-zinc-300">Authenticate with password + live face descriptor.</p>
        <video ref={videoRef} autoPlay muted playsInline className="mt-4 h-56 w-full rounded-2xl object-cover" />
        <div className="mt-4 space-y-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-white/20 bg-black/25 px-3 py-2 text-white" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full rounded-xl border border-white/20 bg-black/25 px-3 py-2 text-white" />
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={startCam} type="button" className="glass-chip">Start Camera</button>
          <motion.button disabled={!descriptor || busy} whileTap={{ scale: (!descriptor || busy) ? 1 : 0.98 }} onClick={doLogin} type="button" className={`rounded-xl border border-orange-400/50 px-4 py-2 text-orange-100 ${!descriptor || busy ? 'bg-orange-500/10 opacity-50 cursor-not-allowed' : 'bg-orange-500/20'}`}>
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <LoaderCircle size={14} className="animate-spin" /> Verifying...
              </span>
            ) : scanning ? (
              <span className="inline-flex items-center gap-2">
                <LoaderCircle size={14} className="animate-spin" /> Scanning Face...
              </span>
            ) : descriptor ? (
              'Login'
            ) : (
              'Face Scan Required'
            )}
          </motion.button>
        </div>
        {msg && <p className="mt-3 text-sm text-red-300">{msg}</p>}
      </div>
    </section>
  );
}
