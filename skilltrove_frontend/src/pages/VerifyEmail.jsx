import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoaderCircle, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

/**
 * @function VerifyEmail
 * @description Page for entering the 6-digit OTP received via email to activate account.
 */
export default function VerifyEmail() {
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      toast.warn('Session expired. Please login to resend verification.');
      navigate('/login');
    }
  }, [email, navigate]);

  /**
   * @function handleVerify
   * @description Sends the OTP and email to the backend for verification.
   */
  async function handleVerify(e) {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('http://localhost:5050/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Email verified successfully! You can now login.');
        navigate('/login');
      } else {
        toast.error(data.message || 'Verification failed');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex min-h-[80vh] items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-slate-900/50 p-10 backdrop-blur-3xl shadow-2xl"
      >
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500/10 border border-orange-500/20">
            <Mail className="text-orange-500" size={36} />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">Check your <span className="text-orange-500">Inbox</span></h2>
          <p className="mt-3 text-sm font-medium text-zinc-400">
            We've sent a 6-digit verification code to <br />
            <span className="text-zinc-200 font-bold">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="mt-10 space-y-8">
          <div className="space-y-2 text-center">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Enter OTP Code</label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full bg-transparent border-b-2 border-white/10 py-4 text-center text-4xl font-black tracking-[0.5em] text-white outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <button
            disabled={busy || otp.length !== 6}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-orange-500 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {busy ? <LoaderCircle className="animate-spin" /> : <ShieldCheck size={18} />}
            {busy ? 'Verifying...' : 'Verify Account'}
            {!busy && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <p className="mt-8 text-center text-xs font-bold text-zinc-500">
          Didn't receive the code? <button className="text-orange-400 hover:underline">Resend OTP</button>
        </p>
      </motion.div>
    </section>
  );
}
