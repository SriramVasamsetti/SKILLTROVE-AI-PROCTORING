import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, Info, ShieldAlert, X, CheckCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

/**
 * @function NotificationCenter
 * @description Manages real-time notification polling and provides the interactive dropdown UI.
 * @param {Object} props - Component properties.
 * @param {boolean} props.isOpen - Whether the dropdown panel is visible.
 * @param {Function} props.onClose - Callback to close the panel.
 * @param {Function} props.setUnreadCount - State setter for the badge count.
 */
export default function NotificationCenter({ isOpen, onClose, setUnreadCount }) {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const isFirstLoad = useRef(true);
  const lastKnownId = useRef(null);

  /**
   * @description Polls for new notifications and updates the local list.
   */
  useEffect(() => {
    if (!token || !user) return;

    async function fetchNotifications() {
      try {
        const res = await fetch('http://localhost:5050/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        
        const data = await res.json();
        if (!Array.isArray(data)) return;

        setNotifications(data);

        // Check for new items to trigger toasts
        if (data.length > 0 && data[0]._id !== lastKnownId.current) {
          if (!isFirstLoad.current) {
            const latest = data[0];
            toast.info(latest.title, { icon: "🔔", theme: "dark" });
            setUnreadCount(prev => prev + 1);
          }
          lastKnownId.current = data[0]._id;
        }
        
        isFirstLoad.current = false;
      } catch (err) {
        console.error('[Notification Polling] Error:', err.message);
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [token, user, setUnreadCount]);

  /**
   * @function handleMarkRead
   * @description Marks a specific notification as read on the server.
   */
  const handleMarkRead = async (id) => {
    try {
      await fetch(`http://localhost:5050/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, readAt: new Date() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  /**
   * @function handleMarkAllRead
   * @description Marks all notifications for the user as read.
   */
  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('http://localhost:5050/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date() })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (err) {
      toast.error('Failed to clear notifications');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-4 w-80 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-2xl z-[9999]"
            style={{ transformOrigin: 'top right' }}
          >
            <div className="flex items-center justify-between border-b border-white/5 bg-white/5 p-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-white">Notifications</h4>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                  <Bell size={32} className="mb-2 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No new alerts</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n._id} 
                    className={`relative border-b border-white/5 p-4 transition-colors hover:bg-white/5 ${!n.readAt ? 'bg-orange-500/5' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${!n.readAt ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-zinc-700'}`} />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">{n.title}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{n.detail}</p>
                        <p className="mt-2 text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">
                          {new Date(n.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      {!n.readAt && (
                        <button 
                          onClick={() => handleMarkRead(n._id)}
                          className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white/5 p-3 text-center">
              <button 
                onClick={handleMarkAllRead}
                className="flex items-center justify-center gap-2 w-full text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-orange-500 transition-colors"
              >
                <CheckCheck size={14} /> Mark all as read
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
