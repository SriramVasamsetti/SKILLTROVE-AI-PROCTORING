import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const SCORE_THRESHOLD = 0.6;
const SMOOTHING_MS = 2000;
const MISSING_PAUSE_MS = 3000;
const EAR_THRESHOLD = 0.25;   // Eye Aspect Ratio - blink detect
const BLINK_CONSEC_FRAMES = 2; // Minimum frames eye must be closed

/**
 * @function getEyeAspectRatio
 * @description Calculates Eye Aspect Ratio (EAR) to detect blinks.
 * EAR < threshold means eye is closed (blink).
 */
function getEyeAspectRatio(eyePoints) {
  if (!eyePoints || eyePoints.length < 6) return 1.0;
  const A = Math.hypot(eyePoints[1].x - eyePoints[5].x, eyePoints[1].y - eyePoints[5].y);
  const B = Math.hypot(eyePoints[2].x - eyePoints[4].x, eyePoints[2].y - eyePoints[4].y);
  const C = Math.hypot(eyePoints[0].x - eyePoints[3].x, eyePoints[0].y - eyePoints[3].y);
  if (C === 0) return 1.0;
  return (A + B) / (2.0 * C);
}

/**
 * @function useFacePresence
 * @description Hook to monitor face presence, count, identity, and eye blink during an assessment.
 * @param {React.RefObject} videoRef - Reference to the video element.
 * @param {boolean} enabled - Whether the proctoring logic is active.
 * @param {Function} onTerminate - Callback function to call when a critical security violation occurs.
 * @param {Array<number>|Object} originalDescriptor - The face descriptor of the authorized user.
 * @returns {Object} - Detection stats and status flags.
 */
export function useFacePresence(videoRef, enabled = true, onTerminate = null, originalDescriptor = null) {
  const [peopleCount, setPeopleCount] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState('');
  const [warning, setWarning] = useState('');
  const [warningsCount, setWarningsCount] = useState(0);
  const [noFaceTooLong, setNoFaceTooLong] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0); // Eye blink counter

  const stateRef = useRef({
    multiSince: null,
    noneSince: null,
    headTurnSince: null,
    loopId: null,
    modelLoadError: false,
    lastWarning: '',
    unauthCount: 0,
    lastIdentityCheck: 0,
    blinkFrameCounter: 0,  // Consecutive frames where eye is closed
    blinkTotal: 0,         // Total blinks detected in session
  });

  const matcherRef = useRef(null);

  /**
   * @description Initializes the FaceMatcher with the authorized user's descriptor.
   */
  useEffect(() => {
    if (originalDescriptor) {
      try {
        const arr = Array.isArray(originalDescriptor)
          ? originalDescriptor
          : Object.values(originalDescriptor);
        const float32Desc = new Float32Array(arr);
        const labeledDescriptor = new faceapi.LabeledFaceDescriptors('user', [float32Desc]);
        // Set strict threshold to 0.42 for production-grade security
        matcherRef.current = new faceapi.FaceMatcher([labeledDescriptor], 0.42);
      } catch (err) {
        console.error('Failed to parse face descriptor:', err);
      }
    }
  }, [originalDescriptor]);

  /**
   * @description Loads the required face-api models.
   */
  useEffect(() => {
    let active = true;
    async function loadModels() {
      setModelLoading(true);
      setModelError('');
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        if (!active) return;
        setModelReady(true);
        setModelLoading(false);
      } catch {
        stateRef.current.modelLoadError = true;
        setWarning('Face model not loaded (/public/models required)');
        setModelError('Model Missing: /public/models is empty or unavailable.');
        setModelReady(false);
        setModelLoading(false);
      }
    }
    if (enabled) loadModels();
    return () => {
      active = false;
    };
  }, [enabled, retryTick]);

  /**
   * @description Main proctoring loop that runs every 500ms.
   * Detects: face count, identity, head movement, and eye blinks.
   */
  useEffect(() => {
    if (!enabled || !modelReady) return undefined;

    const runProctoringCheck = async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      try {
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: SCORE_THRESHOLD,
          }),
        ).withFaceLandmarks().withFaceDescriptors();

        const count = detections.length;
        setPeopleCount(count);

        const now = Date.now();
        if (count > 1) {
          if (!stateRef.current.multiSince) stateRef.current.multiSince = now;
        } else {
          stateRef.current.multiSince = null;
        }
        if (count === 0) {
          if (!stateRef.current.noneSince) stateRef.current.noneSince = now;
        } else {
          stateRef.current.noneSince = null;
        }

        let newWarning = '';
        if (count > 1) {
          newWarning = 'Multiple Persons Detected!';
        } else if (count === 0) {
          setNoFaceTooLong(true);
          newWarning = 'Face Missing!';
          // Reset blink counter when face is missing
          stateRef.current.blinkFrameCounter = 0;
        } else if (count === 1) {
          setNoFaceTooLong(false);

          // ── EYE BLINK DETECTION ──────────────────────────────────────
          // Uses Eye Aspect Ratio (EAR). When both eyes close (blink),
          // EAR drops below threshold for BLINK_CONSEC_FRAMES frames.
          if (detections[0].landmarks) {
            const landmarks = detections[0].landmarks;
            const leftEye = landmarks.getLeftEye();   // 6 points
            const rightEye = landmarks.getRightEye(); // 6 points

            const leftEAR = getEyeAspectRatio(leftEye);
            const rightEAR = getEyeAspectRatio(rightEye);
            const avgEAR = (leftEAR + rightEAR) / 2.0;

            if (avgEAR < EAR_THRESHOLD) {
              // Eye is closed this frame
              stateRef.current.blinkFrameCounter += 1;
            } else {
              // Eye just opened — check if it was a valid blink
              if (stateRef.current.blinkFrameCounter >= BLINK_CONSEC_FRAMES) {
                stateRef.current.blinkTotal += 1;
                setBlinkCount(stateRef.current.blinkTotal);
              }
              stateRef.current.blinkFrameCounter = 0;
            }
          }
          // ── END EYE BLINK DETECTION ──────────────────────────────────

          // Identity Verification Check every 30 seconds
          if (matcherRef.current && detections[0].descriptor && (now - stateRef.current.lastIdentityCheck > 30000)) {
            const match = matcherRef.current.findBestMatch(detections[0].descriptor);
            stateRef.current.lastIdentityCheck = now;

            if (match.label === 'unknown') {
              newWarning = 'Identity Mismatch Detected! Please stay in front of the camera.';
              stateRef.current.unauthCount += 1;

              // Strict policy: Terminate after 2 identity mismatches
              if (stateRef.current.unauthCount >= 2 && onTerminate) {
                onTerminate();
              }
            }
          }

          if (!newWarning) {
            const angle = detections[0]?.angle;
            const isYawHigh = angle && (angle.yaw > 0.2 || angle.yaw < -0.2);
            const isPitchHigh = angle && (angle.pitch > 0.1 || angle.pitch < -0.1);

            let headTurned = isYawHigh || isPitchHigh;

            if (!angle && detections[0]?.landmarks) {
              const landmarks = detections[0].landmarks;
              const leftEye = landmarks.getLeftEye();
              const rightEye = landmarks.getRightEye();
              const nose = landmarks.getNose();
              const leftEyeX = leftEye.reduce((acc, p) => acc + p.x, 0) / leftEye.length;
              const rightEyeX = rightEye.reduce((acc, p) => acc + p.x, 0) / rightEye.length;
              const leftDist = Math.abs(nose[0].x - leftEyeX);
              const rightDist = Math.abs(rightEyeX - nose[0].x);
              if (leftDist / rightDist > 3.0 || rightDist / leftDist > 3.0) headTurned = true;
            }

            if (headTurned) {
              if (!stateRef.current.headTurnSince) stateRef.current.headTurnSince = now;
              if (now - stateRef.current.headTurnSince >= 500) {
                newWarning = 'Head Movement Detected!';
              }
            } else {
              stateRef.current.headTurnSince = null;
            }
          }
        }

        if (newWarning && newWarning !== stateRef.current.lastWarning) {
          setWarningsCount(prev => {
            const next = prev + 1;
            // Terminate after 3 general proctoring warnings
            if (next >= 3 && onTerminate) {
              onTerminate();
            }
            return next;
          });
        }
        stateRef.current.lastWarning = newWarning;
        setWarning(newWarning);
      } catch {
        setWarning('Detection error');
      }
    };

    stateRef.current.loopId = window.setInterval(runProctoringCheck, 500);
    return () => {
      if (stateRef.current.loopId) {
        window.clearInterval(stateRef.current.loopId);
      }
    };
  }, [enabled, modelReady, videoRef, onTerminate]);

  return {
    peopleCount,
    modelReady,
    modelLoading,
    modelError,
    warning,
    warningsCount,
    noFaceTooLong,
    blinkCount,          // NEW: total blinks detected in session
    scoreThreshold: SCORE_THRESHOLD,
    smoothingMs: SMOOTHING_MS,
    retryModels: () => {
      setModelReady(false);
      setRetryTick((x) => x + 1);
    },
  };
}
