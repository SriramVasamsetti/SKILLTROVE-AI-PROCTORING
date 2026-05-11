import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Lock, Trash2, AlertTriangle, X, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [updating, setUpdating] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handlePasswordUpdate(e) {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch('http://localhost:5050/api/users/me/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update password');
      
      toast.success('Password updated successfully', { theme: 'dark' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message, { theme: 'dark' });
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch('http://localhost:5050/api/users/me', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete account');
      
      toast.success('Account successfully deleted.', { theme: 'dark' });
      setDeleteModalOpen(false);
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.message, { theme: 'dark' });
      setDeleting(false);
    }
  }

  return (
    <section className="mx-auto mt-8 max-w-4xl px-6 pb-20 md:px-10">
      <h1 className="text-4xl font-extrabold text-white mb-8 tracking-tight">Account Settings</h1>
      
      <div className="grid gap-8">
        {/* Password Management */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/20 bg-black/40 p-8 backdrop-blur-2xl shadow-[0_15px_30px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-cyan-500/20 p-3 rounded-2xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Lock className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Security & Password</h2>
              <p className="text-sm text-zinc-400">Update your access credentials</p>
            </div>
          </div>
          
          <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">Current Password</label>
              <input 
                type="password" 
                value={passwords.currentPassword}
                onChange={e => setPasswords({...passwords, currentPassword: e.target.value})}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">New Password</label>
              <input 
                type="password" 
                value={passwords.newPassword}
                onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">Confirm New Password</label>
              <input 
                type="password" 
                value={passwords.confirmPassword}
                onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={updating}
              className="mt-6 rounded-xl border border-cyan-500/50 bg-cyan-600/20 px-6 py-3 text-sm font-bold uppercase tracking-wider text-cyan-50 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:bg-cyan-600/30 disabled:opacity-50"
            >
              {updating ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </motion.div>

        {/* Faculty Performance Analytics */}
        {user?.role === 'faculty' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-[2rem] border border-cyan-500/20 bg-black/40 p-8 backdrop-blur-2xl shadow-[0_15px_30px_rgba(6,182,212,0.1)]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-cyan-500/20 p-3 rounded-2xl border border-cyan-500/30">
                <BarChart className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Performance Analytics</h2>
                <p className="text-sm text-zinc-400">View analytics for quizzes you've deployed</p>
              </div>
            </div>
            
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-zinc-400 mb-4">Analytics dashboards are currently being compiled by the AI engine.</p>
              <button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors">
                Refresh Analytics
              </button>
            </div>
          </motion.div>
        )}

        {/* Account Management */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[2rem] border border-red-500/30 bg-red-950/20 p-8 backdrop-blur-2xl shadow-[0_15px_30px_rgba(239,68,68,0.1)]"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-500/20 p-3 rounded-2xl border border-red-500/30">
              <Trash2 className="text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-100">Danger Zone</h2>
              <p className="text-sm text-red-200/60">Irreversible account actions</p>
            </div>
          </div>
          
          <p className="text-zinc-300 text-sm mb-6 max-w-xl">
            Deleting your account will permanently wipe all your data, including proctoring logs, assessment scores, and community interactions. This action cannot be undone.
          </p>
          
          <button 
            onClick={() => setDeleteModalOpen(true)}
            className="rounded-xl border border-red-500/50 bg-red-600/20 px-6 py-3 text-sm font-bold uppercase tracking-wider text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all hover:bg-red-600/30"
          >
            Delete Account
          </button>
        </motion.div>
      </div>

      {/* 3D Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            style={{ perspective: 1000 }}
          >
            <motion.div 
              initial={{ rotateX: 20, scale: 0.8, opacity: 0 }}
              animate={{ rotateX: 0, scale: 1, opacity: 1 }}
              exit={{ rotateX: -20, scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="w-full max-w-md rounded-3xl border border-red-500/40 bg-zinc-950/90 p-8 shadow-[0_30px_60px_rgba(239,68,68,0.3)] transform-style-3d relative overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/20 blur-3xl rounded-full" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-orange-600/20 blur-3xl rounded-full" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-red-500/20 p-4 rounded-full border border-red-500/30 flex items-center justify-center">
                    <AlertTriangle className="text-red-400 w-8 h-8" />
                  </div>
                  <button onClick={() => setDeleteModalOpen(false)} className="text-zinc-500 hover:text-white transition">
                    <X />
                  </button>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">Are you absolutely sure?</h3>
                <p className="text-zinc-400 text-sm mb-8">
                  This will instantly obliterate your identity descriptor, historical exam reports, and community data. 
                  <strong className="text-red-400 block mt-2">There is no recovery.</strong>
                </p>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => setDeleteModalOpen(false)}
                    className="flex-1 rounded-xl border border-white/20 bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="flex-1 rounded-xl border border-red-500/60 bg-red-600/40 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-red-600/60 transition shadow-[0_0_20px_rgba(239,68,68,0.5)] disabled:opacity-50"
                  >
                    {deleting ? 'Erasing...' : 'Confirm Wipe'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
