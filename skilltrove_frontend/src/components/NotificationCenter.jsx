import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function NotificationCenter() {
  const { token, user } = useAuth();
  const [lastKnownCount, setLastKnownCount] = useState(0);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // Only poll for students. Faculty shouldn't get notified of their own quizzes here, 
    // or maybe they do, but the prompt says "to all online Students".
    if (!token || user?.role !== 'student') return;

    let intervalId;

    async function checkForNewQuizzes() {
      try {
        const res = await fetch('http://localhost:5050/api/quizzes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        
        const quizzes = await res.json();
        
        if (isFirstLoad.current) {
          setLastKnownCount(quizzes.length);
          isFirstLoad.current = false;
          return;
        }

        if (quizzes.length > lastKnownCount) {
          // Calculate how many new quizzes appeared
          // const newQuizzes = quizzes.length - lastKnownCount;
          // Notify for the most recent one (top of list assuming backend sorts by createdAt descending)
          const latestQuiz = quizzes[0]; 
          
          toast.info(`New Quiz Assigned: ${latestQuiz.subject}!`, {
            position: "top-right",
            theme: "dark",
            icon: "🔔"
          });
          
          setLastKnownCount(quizzes.length);
        }
      } catch (err) {
        // silently fail polling to avoid console spam
      }
    }

    checkForNewQuizzes();
    // Poll every 10 seconds
    intervalId = setInterval(checkForNewQuizzes, 10000);

    return () => clearInterval(intervalId);
  }, [token, user, lastKnownCount]);

  return null; // This is a logic-only component
}
