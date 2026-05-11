import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Route, Routes, useLocation, useNavigate, Navigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useParallax } from './hooks/useParallax';
import Navbar from './components/Navbar';
import FacultyNavbar from './components/FacultyNavbar';
import { useAuth } from './context/AuthContext';
import HeroSection from './components/HeroSection';
import SystemCheck from './components/SystemCheck';
import QuizInterface from './components/QuizInterface';
import BackToTop from './components/BackToTop';
import PrivateRoute from './components/PrivateRoute';
import Community from './pages/Community';
import Leaderboard from './pages/Leaderboard';
import VerifyEmail from './pages/VerifyEmail';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ReportCard from './pages/ReportCard';
import Settings from './pages/Settings';
import NotificationCenter from './components/NotificationCenter';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyHome from './pages/FacultyHome';
import FacultyRoute from './components/FacultyRoute';
import Home from './pages/Home';


function Scene() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { mouse, normalized, offset } = useParallax(0.02);
  const [quizPayload, setQuizPayload] = useState({ quizId: null, questions: [], subject: '', stream: null });
  const [unreadCount, setUnreadCount] = useState(3);
  const [modelsReady, setModelsReady] = useState(false);
  const [modelsError, setModelsError] = useState('');

  const particleStyle = useMemo(
    () => ({
      transform: `translate3d(${offset.x * 2}px, ${offset.y * 2}px, 0px)`,
    }),
    [offset.x, offset.y],
  );

  useEffect(() => {
    let alive = true;
    async function preloadModels() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        if (alive) setModelsReady(true);
      } catch {
        if (alive) {
          setModelsError('Face models missing in /public/models. Some features may degrade.');
          setModelsReady(true);
        }
      }
    }
    preloadModels();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div
      className="min-h-screen overflow-hidden transition-colors duration-500"
      data-theme={theme}
      style={{ perspective: 1200 }}
    >
      <div className="mesh-bg" />
      <motion.div
        className="pointer-events-none fixed inset-0 opacity-70"
        animate={particleStyle}
      >
        <div className="particles-layer" />
      </motion.div>
      {user?.role === 'faculty' ? (
        <FacultyNavbar normalized={normalized} unreadCount={unreadCount} setUnreadCount={setUnreadCount} />
      ) : (
        <Navbar normalized={normalized} unreadCount={unreadCount} setUnreadCount={setUnreadCount} />
      )}
      <main className="relative z-10">
        {!modelsReady ? (
          <section className="mx-auto mt-16 max-w-3xl px-6">
            <div className="rounded-[2rem] border border-white/20 bg-black/30 p-8 text-center backdrop-blur-xl">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-orange-300/35 border-t-orange-400" />
              <p className="text-sm uppercase tracking-[0.2em] text-orange-200">Loading AI Models</p>
            </div>
          </section>
        ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.995 }}
            transition={{ duration: 0.35 }}
          >
            <Routes location={location}>
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    {user?.role === 'faculty' ? (
                      <FacultyHome />
                    ) : (
                      <Home normalized={normalized} mouse={mouse} />
                    )}
                  </PrivateRoute>
                }
              />
              <Route
                path="/check"
                element={
                  <PrivateRoute>
                    <SystemCheck
                      normalized={normalized}
                      onBack={() => navigate('/')}
                      onStartQuiz={(payload) => {
                        setQuizPayload(payload);
                        navigate('/quiz');
                      }}
                    />
                  </PrivateRoute>
                }
              />
              <Route
                path="/quiz"
                element={
                  <PrivateRoute>
                    {quizPayload.quizId ? (
                      <QuizInterface
                        normalized={normalized}
                        quizId={quizPayload.quizId}
                        questions={quizPayload.questions}
                        subject={quizPayload.subject}
                        stream={quizPayload.stream}
                        onExit={() => navigate('/check')}
                      />
                    ) : (
                      <Navigate to="/check" replace />
                    )}
                  </PrivateRoute>
                }
              />
              <Route
                path="/community"
                element={
                  <PrivateRoute>
                    <Community
                      onNotify={(delta = 1) =>
                        setUnreadCount((prev) => Math.max(0, prev + delta))
                      }
                    />
                  </PrivateRoute>
                }
              />
              <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
              <Route path="/report/:attemptId" element={<PrivateRoute><ReportCard /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
              <Route path="/about" element={<PrivateRoute><About /></PrivateRoute>} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Strict Faculty Guarded Route */}
              <Route element={<FacultyRoute />}>
                <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
              </Route>
            </Routes>
          </motion.div>
        </AnimatePresence>
        )}
        {modelsError && (
          <div className="mx-auto mt-3 max-w-4xl rounded-xl border border-red-400/45 bg-red-500/10 px-4 py-2 text-sm text-red-200">
            {modelsError}
          </div>
        )}
      </main>
      <BackToTop />
      <AnimatePresence>
        <motion.div
          key={theme}
          className="fixed inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background:
              theme === 'dark'
                ? 'radial-gradient(circle at 80% 10%, rgba(255,86,20,.24), transparent 55%)'
                : 'radial-gradient(circle at 80% 10%, rgba(255,154,121,.22), transparent 55%)',
          }}
        />
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Scene />
        <ToastContainer theme="dark" position="top-center" autoClose={4000} />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
