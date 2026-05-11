import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, LoaderCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

/**
 * @function VerifyEmail
 * @description Automatic email verification page that processes the hex token from the URL.
 */
export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  /**
   * @function processVerification
   * @description Sends the token to the backend for account activation.
   */
  useEffect(() => {
    async function processVerification() {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link.');
        return;
      }

      try {
        const res = await fetch(`http://localhost:5050/api/auth/verify-email/${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage('Your account has been successfully verified.');
          toast.success('Verification successful!');
          // Redirect to login after 3 seconds
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Network error. Please try again later.');
      }
    }
    processVerification();
  }, [token, navigate]);

  return (
    <section className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-slate-900/40 p-10 backdrop-blur-3xl text-center shadow-2xl"
      >
        <div className="flex justify-center mb-8">
           {status === 'verifying' && (
              <div className="rounded-2xl bg-orange-500/10 p-4 text-orange-500 animate-spin">
                 <LoaderCircle size={40} />
              </div>
           )}
           {status === 'success' && (
              <div className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-500">
                 <CheckCircle size={40} />
              </div>
           )}
           {status === 'error' && (
              <div className="rounded-2xl bg-red-500/10 p-4 text-red-500">
                 <AlertCircle size={40} />
              </div>
           )}
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight">
          {status === 'verifying' && 'Verifying Account...'}
          {status === 'success' && 'Verification Complete'}
          {status === 'error' && 'Verification Failed'}
        </h2>
        
        <p className="mt-4 text-zinc-400 font-medium leading-relaxed">
          {status === 'verifying' && 'Communicating with SkillTrove security protocols to activate your biometric profile.'}
          {status === 'success' && message}
          {status === 'error' && message}
        </p>

        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 flex flex-col items-center"
          >
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Redirecting to Login...</p>
            <div className="mt-4 h-1 w-24 bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                className="h-full bg-emerald-500" 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 3 }}
               />
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <button 
            onClick={() => navigate('/login')}
            className="mt-8 w-full rounded-2xl bg-white/5 border border-white/10 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-white/10"
          >
            Back to Login
          </button>
        )}
      </motion.div>
    </section>
  );
}
