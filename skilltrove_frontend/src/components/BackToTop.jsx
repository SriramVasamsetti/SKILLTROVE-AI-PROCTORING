import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 240);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;

  return (
    <motion.button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, rotateX: -12 }}
      className="fixed bottom-7 right-7 z-40 rounded-2xl border border-orange-400/50 bg-orange-500/20 p-3 text-orange-100 shadow-[0_0_25px_rgba(255,102,44,.45)] backdrop-blur-xl"
    >
      <ArrowUp size={18} />
    </motion.button>
  );
}
