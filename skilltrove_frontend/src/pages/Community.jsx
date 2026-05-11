import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LoaderCircle, MessageCircle, Pencil, Plus, Send, ThumbsUp, Trash2, X, BadgeCheck, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

function FloatingCard({ children, i }) {
  return (
    <motion.div
      className="rounded-3xl border border-white/20 bg-white/5 p-5 backdrop-blur-xl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07 }}
      whileHover={{ y: -8, rotateX: -4, rotateY: 5 }}
    >
      {children}
    </motion.div>
  );
}

export default function Community({ onNotify }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [qa, setQa] = useState([
    { id: 1, q: 'How do we reduce proctoring false positives?', helpful: 12 },
    { id: 2, q: 'Best strategy for Bloom-level mixed quizzes?', helpful: 8 },
  ]);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState({ name: '', description: '' });
  const [questionInput, setQuestionInput] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [savingGroup, setSavingGroup] = useState(false);

  useEffect(() => {
    let alive = true;
    async function loadGroups() {
      try {
        const res = await fetch('http://localhost:5050/api/groups');
        const data = await res.json();
        if (alive && Array.isArray(data)) {
          setGroups(
            data.map((g) => ({
              id: g._id,
              name: g.name,
              description: g.description,
              members: g.members || []
            })),
          );
        }
      } catch {
      } finally {
        if (alive) setLoadingGroups(false);
      }
    }
    loadGroups();
    return () => {
      alive = false;
    };
  }, []);

  const drift = useMemo(
    () => ({
      y: [0, -6, 0],
      rotateZ: [0, 0.6, -0.6, 0],
    }),
    [],
  );

  async function saveGroup() {
    if (!draft.name.trim()) return;
    setSavingGroup(true);
    const optimistic = { id: Date.now(), ...draft };
    if (editing) {
      setGroups((prev) => prev.map((g) => (g.id === editing ? { ...g, ...draft } : g)));
      try {
        await fetch(`http://localhost:5050/api/groups/${editing}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: draft.name, description: draft.description }),
        });
      } catch {}
    } else {
      setGroups((prev) => [optimistic, ...prev]);
      onNotify?.(1);
      try {
        const res = await fetch('http://localhost:5050/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: draft.name, description: draft.description }),
        });
        const data = await res.json();
        setGroups((prev) =>
          prev.map((g) =>
            g.id === optimistic.id
              ? {
                  ...g,
                  id: data?._id ?? g.id,
                }
              : g,
          ),
        );
      } catch {}
    }
    setDraft({ name: '', description: '' });
    setEditing(null);
    setModalOpen(false);
    setSavingGroup(false);
  }

  async function removeGroup(id) {
    const snapshot = groups;
    setGroups((prev) => prev.filter((g) => g.id !== id));
    onNotify?.(1);
    try {
      await fetch(`http://localhost:5050/api/groups/${id}`, { method: 'DELETE' });
    } catch {
      setGroups(snapshot);
    }
  }

  async function postQuestion() {
    const text = questionInput.trim();
    if (!text) return;
    const optimistic = { id: Date.now(), q: text, helpful: 0 };
    setQa((prev) => [optimistic, ...prev]);
    setQuestionInput('');
    onNotify?.(1);
    try {} catch {}
  }

  /**
   * @function handleJoinGroup
   * @description Sends a join request to the server and updates local state.
   */
  async function handleJoinGroup(groupId) {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:5050/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('skilltrove-token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setGroups(prev => prev.map(g => 
          g.id === groupId ? { ...g, members: [...(g.members || []), user.id] } : g
        ));
        toast.success('Joined group successfully!');
      } else {
        toast.error(data.message || 'Failed to join');
      }
    } catch (err) {
      toast.error('Network error');
    }
  }

  return (
    <section className="mx-auto mt-4 max-w-7xl px-6 pb-16 md:px-10">
      <div className="rounded-[2rem] border border-white/20 bg-white/5 p-8 backdrop-blur-2xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-orange-200">Social & Collaboration</p>
            <h2 className="text-3xl font-bold text-white">Community Hub</h2>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-orange-400/60 bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-100"
          >
            <Plus size={16} /> New Group
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {loadingGroups && (
            <div className="rounded-2xl border border-white/20 bg-black/20 p-4 text-sm text-zinc-200">
              Loading groups...
            </div>
          )}
          {groups.map((group, i) => (
            <motion.div key={group.id} animate={drift} transition={{ duration: 6, repeat: Infinity, delay: i * 0.4 }}>
              <FloatingCard i={i}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                    <p className="mt-1 text-sm text-zinc-200/85 mb-3">{group.description}</p>
                    {group.members?.includes(user?.id) ? (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-1.5">
                        <BadgeCheck size={12} /> Joined
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleJoinGroup(group.id)}
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition border border-cyan-500/30 rounded-lg px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20"
                      >
                        <Users size={12} /> Join Group
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-white/20 bg-white/10 p-2 text-zinc-100"
                      onClick={() => {
                        setEditing(group.id);
                        setDraft({ name: group.name, description: group.description });
                        setModalOpen(true);
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-red-400/30 bg-red-500/10 p-2 text-red-200"
                      onClick={() => removeGroup(group.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </FloatingCard>
            </motion.div>
          ))}
        </div>

        <h3 className="mt-10 text-xl font-semibold text-white">Q&A Orbit</h3>
        <div className="mt-3 flex gap-2">
          <input
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            placeholder="Post a new question..."
            className="w-full rounded-xl border border-white/20 bg-black/25 px-3 py-2 text-sm text-white"
          />
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={postQuestion}
            className="inline-flex items-center gap-2 rounded-xl border border-orange-400/45 bg-orange-500/20 px-3 py-2 text-sm font-semibold text-orange-100"
          >
            <Send size={14} /> Post Question
          </motion.button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {qa.map((item, i) => (
            <FloatingCard key={item.id} i={i + 3}>
              <p className="text-sm text-zinc-100 mb-2">{item.q}</p>
              
              {user?.role === 'faculty' && (
                <div className="mb-3 flex items-center gap-1 text-[10px] uppercase tracking-widest text-blue-400 font-bold bg-blue-500/10 border border-blue-500/30 rounded-md px-2 py-0.5 w-max">
                  <BadgeCheck size={12} /> Verified Faculty Member
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <motion.button
                  type="button"
                  whileTap={{ scale: 1.07 }}
                  className="inline-flex items-center gap-2 rounded-xl border border-orange-300/40 bg-orange-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-orange-100"
                  onClick={() =>
                    setQa((prev) => prev.map((row) => (row.id === item.id ? { ...row, helpful: row.helpful + 1 } : row)))
                  }
                >
                  <ThumbsUp size={14} />
                  Helpful ({item.helpful})
                </motion.button>
                {user?.role === 'faculty' && (
                  <button className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-cyan-200 hover:bg-cyan-500/20 transition">
                    <MessageCircle size={14} /> Official Answer
                  </button>
                )}
              </div>
            </FloatingCard>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg rounded-3xl border border-white/20 bg-zinc-950/85 p-6 backdrop-blur-2xl"
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 12 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white">
                  {editing ? 'Update Discussion Group' : 'Create Discussion Group'}
                </h4>
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-zinc-300">
                  <X size={16} />
                </button>
              </div>
              <input
                value={draft.name}
                onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                placeholder="Group name"
                className="mb-3 w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
              />
              <textarea
                value={draft.description}
                onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description"
                className="h-28 w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
              />
              <button
                type="button"
                onClick={saveGroup}
                disabled={savingGroup}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-orange-400/50 bg-orange-500/20 px-4 py-2 text-sm font-semibold text-orange-100"
              >
                {savingGroup ? (
                  <>
                    <LoaderCircle size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <MessageCircle size={15} />
                    Save Group
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
