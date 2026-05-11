import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const SCORE_THRESHOLD = 0.6;
const SMOOTHING_MS = 2000;
const MISSING_PAUSE_MS = 3000;

/**
 * @function useFacePresence
 * @description Hook to monitor face presence, count, and identity during an assessment.
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
  
  const stateRef = useRef({
    multiSince: null,
    noneSince: null,
    headTurnSince: null,
    loopId: null,
    modelLoadError: false,
    lastWarning: '',
    unauthCount: 0,
    lastIdentityCheck: 0,
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
        } else if (count === 1) {
          setNoFaceTooLong(false);
          
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
    scoreThreshold: SCORE_THRESHOLD,
    smoothingMs: SMOOTHING_MS,
    retryModels: () => {
      setModelReady(false);
      setRetryTick((x) => x + 1);
    },
  };
}
