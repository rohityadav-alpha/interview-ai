"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Webcam from "react-webcam";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import Footer from "@/components/Footer";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { useTheme } from "@/hooks/useTheme";
import ThemeToggle from "@/components/ThemeToggle";
import RecordRTC from "recordrtc";

type ScoreItem = {
  score: number;
  feedback: string;
  confidence: "low" | "medium" | "high";
};

type Results = {
  perQuestion: ScoreItem[];
  summary: {
    total: number;
    avg: number;
    strengths: string[];
    improvements: string[];
    confidenceTips: string[];
  };
};

// ✅ FIXED: Enhanced Vosk Integration with Proper Audio Conversion
const useSimpleVosk = () => {
  const [isVoskAvailable, setIsVoskAvailable] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<RecordRTC | null>(null);

  useEffect(() => {
    const checkVosk = async () => {
      try {
        const response = await fetch("http://localhost:5000/health");
        if (response.ok) {
          setIsVoskAvailable(true);
        }
      } catch (error) {
        setIsVoskAvailable(false);
      }
    };
    checkVosk();
  }, []);
  const serverUrls = [
    "http://192.168.1.100:5000", // ✅ FIXED: Use your actual desktop IP
    `http://${window.location.hostname}:5000`,
    "http://localhost:5000", // This only works on desktop
  ];
  const startVoskRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // ✅ FIXED: Direct WAV recording
      const recorder = new RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/wav",
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
        disableLogs: false,
      });

      recorderRef.current = recorder;
      recorder.startRecording();
      setIsRecording(true);
    } catch (error) {
      throw error;
    }
  };

  const stopVoskRecording = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!recorderRef.current) {
        reject(new Error("No recording"));
        return;
      }

      recorderRef.current.stopRecording(() => {
        const wavBlob = recorderRef.current!.getBlob();
        setIsRecording(false);

        // Send WAV directly to server
        const formData = new FormData();
        formData.append("audio", wavBlob, "recording.wav");

        fetch("http://localhost:5000/vosk-transcribe", {
          method: "POST",
          body: formData,
        })
          .then((response) => response.json())
          .then((result) => {
            if (result.success) {
              resolve(result.transcript || "");
            } else {
              throw new Error(result.error || "Transcription failed");
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    });
  };

  return {
    isVoskAvailable,
    isRecording,
    startVoskRecording,
    stopVoskRecording,
  };
};

async function fetchQuestions(skill: string, difficulty: string) {
  try {
    const res = await fetch("/api/generate-questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        skill: skill.trim(),
        difficulty: difficulty.trim(),
        count: 10,
      }),
    });

    if (!res.ok) {
      let errorMessage = "Failed to generate questions";
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {}
      throw new Error(errorMessage);
    }

    const data = await res.json();

    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error("Invalid response format - questions array missing");
    }

    return data.questions as string[];
  } catch (error) {
    throw error;
  }
}

export default function InterviewPage() {
  const [hydrated, setHydrated] = useState(false);

  const { themeColors, isDark } = useTheme();

  const params = useSearchParams();
  const router = useRouter();
  const rawSkill = params.get("skill") || "";
  const difficulty = params.get("difficulty") || "";

  const skillsArray = rawSkill.includes(",")
    ? rawSkill.split(",").map((s) => s.trim())
    : [rawSkill.trim()];
  const skill =
    skillsArray.length > 1 ? skillsArray.join(", ") : skillsArray[0];
  const isMultiSkill = skillsArray.length > 1;

  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(10).fill(""));
  const [manualTranscript, setManualTranscript] = useState("");
  const [scoring, setScoring] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [isTextMode, setIsTextMode] = useState(false);

  const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(
    null
  );
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [quitReason, setQuitReason] = useState<string>("");

  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const webcamRef = useRef<Webcam | null>(null);

  // ✅ ENHANCED: Browser STT + Simple Vosk Integration with Audio Conversion
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();
  const {
    isVoskAvailable,
    isRecording,
    startVoskRecording,
    stopVoskRecording,
  } = useSimpleVosk();

  const {
    userId,
    isAuthenticated,
    getUserProfileData,
    isLoading: authLoading,
  } = useCustomAuth();

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!startTime && questions.length > 0) {
      const now = new Date();
      setStartTime(now);
      setInterviewStartTime(now);
    }

    const timer = setInterval(() => {
      if (startTime) {
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setElapsedTime(
          `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, questions.length]);

  useEffect(() => {
    if (!skill || !difficulty) {
      setQuestions([]);
      setLoading(false);
      setError("Missing skill or difficulty parameter");
      return;
    }

    let active = true;
    let retryCount = 0;
    const maxRetries = 3;

    const fetchWithRetry = async () => {
      while (retryCount < maxRetries && active) {
        try {
          setLoading(true);
          setError(null);

          const qs = await fetchQuestions(skill, difficulty);

          if (!active) return;

          if (qs.length === 0) {
            throw new Error("No questions received from API");
          }

          setQuestions(qs);
          setAnswers(Array(qs.length).fill(""));
          setCurrent(0);
          setManualTranscript("");
          setResults(null);
          setResponseTimes(Array(qs.length).fill(0));
          resetTranscript();

          return;
        } catch (e: any) {
          retryCount++;
          if (retryCount >= maxRetries) {
            setError(
              e.message ||
                "Failed to generate questions after multiple attempts"
            );
            setQuestions([]);
          } else {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * retryCount)
            );
          }
        } finally {
          if (active) setLoading(false);
        }
      }
    };

    fetchWithRetry();

    return () => {
      active = false;
    };
  }, [skill, difficulty]);

  useEffect(() => {
    if (listening && !isTextMode) {
      setManualTranscript(transcript);
    }
  }, [transcript, listening, isTextMode]);

  useEffect(() => {
    setManualTranscript(answers[current] || "");
    setQuestionStartTime(new Date());
    resetTranscript();

    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [current]);

  const handleQuitInterview = async () => {
    setShowQuitConfirm(true);
  };

  const confirmQuitInterview = async (reason: string) => {
    try {
      setScoring(true);
      setQuitReason(reason);

      if (userId && isAuthenticated) {
        await saveQuitReasonWithUserData(reason);
      }

      router.push("/");
    } catch (error) {
      router.push("/");
    } finally {
      setScoring(false);
      setShowQuitConfirm(false);
    }
  };

  const saveQuitReasonWithUserData = async (reason: string) => {
    try {
      const userProfile = getUserProfileData();
      const interviewDuration = interviewStartTime
        ? Math.floor(
            (new Date().getTime() - interviewStartTime.getTime()) / 1000
          )
        : 0;

      const quitPayload = {
        user_id: userProfile.userId || null,
        user_email: userProfile.email || null,
        user_first_name: userProfile.firstName || null,
        user_last_name: userProfile.lastName || null,
        user_username: userProfile.username || userProfile.displayName || null,
        skill: skill || null,
        difficulty: difficulty ? difficulty.trim() : null,
        total_score: 0,
        avg_score: 0.0,
        questions_attempted: current,
        is_completed: false,
        quit_reason: reason,
        interview_duration: interviewDuration,
        questions_with_answers: [],
        is_multi_skill: skillsArray.length > 1,
        primary_skill: skillsArray[0] || skill || null,
        all_skills: skillsArray,
      };

      const saveResponse = await fetch("/api/save-detailed-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quitPayload),
      });

      if (saveResponse.ok) {
        const result = await saveResponse.json();
      } else {
        const errorData = await saveResponse.json().catch(() => ({}));
      }
    } catch (error) {}
  };

  const saveInterviewResults = async (
    scoringData: Results,
    questionsUsed: string[],
    answersGiven: string[],
    isPartial = false,
    quitReason?: string
  ) => {
    try {
      const userProfile = getUserProfileData();
      const interviewDuration = interviewStartTime
        ? Math.floor(
            (new Date().getTime() - interviewStartTime.getTime()) / 1000
          )
        : 0;

      const savePayload = {
        user_id: userProfile.userId || null,
        user_email: userProfile.email || null,
        user_first_name: userProfile.firstName || null,
        user_last_name: userProfile.lastName || null,
        user_username: userProfile.username || userProfile.displayName || null,
        skill: skill,
        difficulty: difficulty.trim(),
        total_score: scoringData.summary.total,
        avg_score: scoringData.summary.avg,
        questions_attempted: questionsUsed.length,
        is_completed: !isPartial,
        quit_reason: quitReason,
        interview_duration: interviewDuration,
        improvements: scoringData.summary.improvements,
        confidence_tips: scoringData.summary.confidenceTips,
        is_multi_skill: skillsArray.length > 1,
        primary_skill: skillsArray[0] || skill.split(",")[0].trim(),
        all_skills: skillsArray,
        questions_with_answers: questionsUsed.map((question, index) => ({
          question_number: index + 1,
          question_text: question,
          user_answer: answersGiven[index] || "",
          ai_score: scoringData.perQuestion[index]?.score || 0,
          ai_feedback: scoringData.perQuestion[index]?.feedback || "",
          confidence: scoringData.perQuestion[index]?.confidence || "medium",
          response_time: responseTimes[index] || 0,
        })),
      };

      const saveResponse = await fetch("/api/save-detailed-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savePayload),
      });

      if (saveResponse.ok) {
        const result = await saveResponse.json();
      } else {
        const errorData = await saveResponse.json().catch(() => ({}));
      }
    } catch (error) {}
  };

  const LoadingSpinner = ({ text }: { text: string }) => (
    <div
      className={`flex items-center justify-center min-h-screen bg-gradient-to-br ${themeColors.primary}`}
    >
      <div
        className={`flex flex-col items-center gap-6 ${themeColors.cardBg} backdrop-blur-sm rounded-3xl p-12 ${themeColors.cardBorder} border shadow-2xl`}
      >
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-400"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="animate-pulse w-6 h-6 bg-blue-400 rounded-full"></div>
          </div>
        </div>
        <div className="text-center">
          <div className={`text-2xl ${themeColors.text} font-bold mb-2`}>
            {text}
          </div>
          <div className="text-blue-200 text-lg">
            {isMultiSkill ? `Mixed Skills: ${skill}` : skill} • {difficulty}
          </div>
          <div className="text-blue-300 text-sm mt-2">
            Powered by Google Gemini ✨
          </div>
        </div>
      </div>
    </div>
  );

  const ScoringSpinner = () => (
    <div className="absolute inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 rounded-3xl">
      <div
        className={`flex flex-col items-center gap-6 ${themeColors.cardBg} backdrop-blur-sm rounded-2xl p-8 ${themeColors.cardBorder} border shadow-2xl`}
      >
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-400"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="animate-pulse w-4 h-4 bg-blue-400 rounded-full"></div>
          </div>
        </div>
        <div className="text-center">
          <div className={`text-lg ${themeColors.text} font-semibold mb-1`}>
            {results
              ? "Saving to database..."
              : "AI is evaluating your answers..."}
          </div>
          <div className="text-sm text-blue-200">
            {results
              ? "Almost done! 💾"
              : "Please wait, this may take a few moments ⏳"}
          </div>
          <div className="text-xs text-blue-300 mt-2">
            Powered by Google Gemini 2.5 Flash ⚡
          </div>
        </div>
      </div>
    </div>
  );

  const QuitConfirmationModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${themeColors.cardBg} backdrop-blur-md rounded-3xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl ${themeColors.cardBorder} border`}
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🚪</div>
          <h3
            className={`text-xl sm:text-2xl font-bold ${themeColors.text} mb-2`}
          >
            Quit Interview?
          </h3>
          <p className={themeColors.textSecondary}>
            You've seen{" "}
            <span className="font-bold text-blue-300">{current + 1}</span> out
            of {questions.length} questions.
          </p>

          <div className="mt-4 p-3 bg-blue-500/10 backdrop-blur-sm border border-blue-400/30 rounded-xl">
            <p className="text-blue-200 text-sm">
              📝 We'll save your quit reason with user details and redirect you
              to homepage.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className={`${themeColors.textSecondary} text-sm mb-4`}>
            Why are you leaving this interview?
          </p>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {[
              {
                id: "too_difficult",
                label: "😰 Questions too difficult",
                color: "red",
              },
              {
                id: "not_enough_time",
                label: "⏰ Not enough time",
                color: "amber",
              },
              {
                id: "technical_issues",
                label: "🔧 Technical issues",
                color: "orange",
              },
              {
                id: "just_testing",
                label: "🧪 Just testing the app",
                color: "blue",
              },
              {
                id: "changed_mind",
                label: "🤔 Changed my mind",
                color: "purple",
              },
              {
                id: "wrong_skill",
                label: "🎯 Wrong skill selected",
                color: "pink",
              },
              {
                id: "personal_emergency",
                label: "🚨 Personal emergency",
                color: "rose",
              },
              { id: "other", label: "📝 Other reason", color: "gray" },
            ].map((reason) => (
              <button
                key={reason.id}
                onClick={() => confirmQuitInterview(reason.id)}
                disabled={scoring}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all hover:scale-[1.02] backdrop-blur-sm text-sm sm:text-base ${
                  reason.color === "red"
                    ? "border-red-400/30 hover:bg-red-500/20 text-red-200"
                    : reason.color === "amber"
                    ? "border-amber-400/30 hover:bg-amber-500/20 text-amber-200"
                    : reason.color === "orange"
                    ? "border-orange-400/30 hover:bg-orange-500/20 text-orange-200"
                    : reason.color === "blue"
                    ? "border-blue-400/30 hover:bg-blue-500/20 text-blue-200"
                    : reason.color === "purple"
                    ? "border-purple-400/30 hover:bg-purple-500/20 text-purple-200"
                    : reason.color === "pink"
                    ? "border-pink-400/30 hover:bg-pink-500/20 text-pink-200"
                    : reason.color === "rose"
                    ? "border-rose-400/30 hover:bg-rose-500/20 text-rose-200"
                    : "border-gray-400/30 hover:bg-gray-500/20 text-gray-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="font-medium">{reason.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowQuitConfirm(false)}
            disabled={scoring}
            className={`flex-1 px-4 py-3 ${themeColors.cardBg} hover:bg-white/20 ${themeColors.text} rounded-xl font-medium transition-all duration-200 backdrop-blur-sm ${themeColors.cardBorder} border disabled:opacity-50`}
          >
            Continue Interview
          </button>
        </div>

        {scoring && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
            <span className={`${themeColors.text} text-sm`}>
              Saving with user details & redirecting...
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (!hydrated) return null;

  if (!browserSupportsSpeechRecognition && !isVoskAvailable) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${themeColors.primary}`}
      >
        <div
          className={`${themeColors.cardBg} backdrop-blur-sm rounded-3xl p-8 sm:p-12 text-center max-w-md mx-4 shadow-2xl ${themeColors.cardBorder} border`}
        >
          <div className="text-6xl mb-6">🚫</div>
          <h2 className={`text-2xl font-bold ${themeColors.text} mb-4`}>
            Voice Input Not Supported
          </h2>
          <p className={`${themeColors.textSecondary} mb-6`}>
            {!isVoskAvailable
              ? "Vosk server is not running and browser STT is not supported. Please start the Vosk server or use text input only."
              : "Speech recognition requires Chrome or Edge browser."}
          </p>
          <div className="space-y-2 text-sm text-gray-400">
            <p>✅ Chrome (Recommended)</p>
            <p>✅ Edge</p>
            <p>✅ Opera</p>
            <p>❌ Firefox (Limited support)</p>
            <p>❌ Safari (Not supported)</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <LoadingSpinner text="Generating personalized questions… AI is working ⚡" />
    );
  }

  if (error || !skill || !difficulty || questions.length === 0) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${themeColors.primary}`}
      >
        <div
          className={`${themeColors.cardBg} backdrop-blur-sm rounded-3xl p-8 sm:p-12 text-center max-w-md mx-4 shadow-2xl ${themeColors.cardBorder} border`}
        >
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className={`text-2xl font-bold ${themeColors.text} mb-4`}>
            {error ? "Interview Setup Failed" : "Interview Setup Incomplete"}
          </h2>
          <p className={`${themeColors.textSecondary} mb-6`}>
            {error ||
              "Skill or difficulty level is missing. Please start from the beginning."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push("/start-interview")}
              className="px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:scale-105"
            >
              Start New Interview
            </button>
            {error && (
              <button
                onClick={() => window.location.reload()}
                className={`px-6 sm:px-8 py-3 ${themeColors.cardBg} hover:bg-white/20 ${themeColors.text} rounded-xl font-medium transition-all duration-200 ${themeColors.cardBorder} border`}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderQuestionSlot = (idx: number) => {
    const pos = idx - current;
    let opacity = 0.3,
      scale = 0.82,
      y = 0,
      z = 0,
      pointerEvents: React.CSSProperties["pointerEvents"] = "none";

    if (pos === 0) {
      opacity = isTransitioning ? 0.7 : 1;
      scale = 1;
      y = -20;
      z = 10;
      pointerEvents = "auto";
    } else if (pos === -1) {
      opacity = 0.45;
      scale = 0.86;
      y = 200;
      z = 2;
    } else if (pos === 1) {
      opacity = 0.45;
      scale = 0.86;
      y = -220;
      z = 2;
    } else {
      return null;
    }

    const isAnswered = answers[idx] && answers[idx].trim().length > 0;
    const isCurrent = pos === 0;

    return (
      <div
        key={idx}
        className={`absolute w-full flex justify-center transition-all duration-500 ease-in-out pointer-events-none select-none ${
          isTransitioning && isCurrent ? "animate-pulse" : ""
        }`}
        style={{
          opacity,
          transform: `scale(${scale}) translateY(${y}px)`,
          zIndex: z,
          pointerEvents,
          overflow: "visible",
          transitionDuration: isCurrent ? "300ms" : "500ms",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          className={`relative border-2 rounded-2xl shadow-2xl px-4 sm:px-6 py-4 text-center font-bold text-base sm:text-lg md:text-xl transition-all duration-500 backdrop-blur-sm ${
            isCurrent
              ? `bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400 text-blue-200 shadow-blue-500/25 ${
                  isTransitioning ? "scale-105" : ""
                }`
              : isAnswered
              ? "bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-400 text-green-200"
              : `${themeColors.cardBg} ${themeColors.cardBorder} ${themeColors.textSecondary}`
          }`}
          style={{
            boxShadow:
              pos === 0 ? "0 8px 32px 0 #3b82f630" : "0 4px 16px 0 #00000010",
            minHeight: 60,
            maxWidth:
              pos === 0
                ? window.innerWidth < 640
                  ? 320
                  : 450
                : window.innerWidth < 640
                ? 280
                : 380,
            borderRadius: "1rem",
          }}
        >
          <div
            className={`absolute -top-3 -right-3 w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center ${
              isCurrent
                ? "bg-blue-600 text-white shadow-lg animate-pulse"
                : isAnswered
                ? "bg-green-600 text-white shadow-lg"
                : "bg-gray-500 text-white"
            }`}
          >
            {idx + 1}
          </div>

          {isAnswered && !isCurrent && (
            <div className="absolute -top-2 -left-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>
          )}

          <div className="pr-6 sm:pr-8 break-words">{questions[idx]}</div>
        </div>
      </div>
    );
  };

  // ✅ ENHANCED: Smart STT with WebM to WAV Audio Conversion
  // Update your handleStartListening function
  const handleStartListening = async () => {
    // ✅ FIXED: Force browser STT on mobile devices
    const isMobile =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (isMobile || !isVoskAvailable) {
      // Use browser STT for mobile devices
      if (browserSupportsSpeechRecognition) {
        resetTranscript();
        setManualTranscript("");
        SpeechRecognition.startListening({
          continuous: true,
          interimResults: true, // Better for mobile
        });
      } else {
        alert(
          "❌ Voice input not supported on this mobile browser. Please use text input."
        );
      }
    } else {
      // Use Vosk for desktop
      try {
        resetTranscript();
        setManualTranscript("");
        await startVoskRecording();
      } catch (error) {
        if (browserSupportsSpeechRecognition) {
          SpeechRecognition.startListening({ continuous: true });
        }
      }
    }
  };

  const handleStopListening = async () => {
    if (isRecording && isVoskAvailable) {
      // Stop Vosk recording and get transcript
      try {
        const voskTranscript = await stopVoskRecording();
        setManualTranscript(voskTranscript);
      } catch (error) {
        // Fallback to browser STT
        SpeechRecognition.stopListening();
      }
    } else if (listening) {
      // Stop browser STT
      SpeechRecognition.stopListening();
    }
  };

  const handleToggleTextMode = () => {
    if (listening || isRecording) {
      handleStopListening();
    }
    setIsTextMode(!isTextMode);
    if (!isTextMode) {
      resetTranscript();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setManualTranscript(e.target.value);
  };

  const handleNext = async () => {
    if (!manualTranscript.trim()) {
      alert(
        "⚠️ Please provide an answer before proceeding. If you don't know, just say 'Sorry, I don't know'"
      );
      return;
    }

    const responseTime = Math.floor(
      (new Date().getTime() - questionStartTime.getTime()) / 1000
    );
    const newResponseTimes = [...responseTimes];
    newResponseTimes[current] = responseTime;
    setResponseTimes(newResponseTimes);

    await handleStopListening();

    const finalAnswers = [...answers];
    finalAnswers[current] = manualTranscript;

    if (current < questions.length - 1) {
      setAnswers(finalAnswers);
      setCurrent((c) => c + 1);
      setIsTextMode(false);
      return;
    }

    try {
      setScoring(true);
      const response = await fetch("/api/score-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: skill,
          difficulty,
          questions,
          answers: finalAnswers,
          isPartialInterview: false,
          questionsAttempted: questions.length,
          totalQuestions: questions.length,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnswers(finalAnswers);
        setResults(data);

        if (userId && isAuthenticated) {
          await saveInterviewResults(data, questions, finalAnswers, false);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to score complete interview"
        );
      }
    } catch (error: any) {
      alert(
        `Interview scoring failed: ${
          error.message || "Unknown error"
        }. Your answers have been saved, please try again later.`
      );
      router.push("/dashboard");
    } finally {
      setScoring(false);
    }
  };

  const handlePrev = () => {
    if (current === 0) return;

    handleStopListening();
    setCurrent((c) => c - 1);
    resetTranscript();
    setIsTextMode(false);
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-gradient-to-br ${themeColors.primary}`}
      suppressHydrationWarning
    >
      <ThemeToggle />

      {!results && questions.length > 0 && (
        <div
          className={`${themeColors.cardBg} backdrop-blur-md ${themeColors.cardBorder} border-b shadow-xl`}
        >
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                <div
                  className={`${themeColors.text} font-bold text-lg flex items-center space-x-2`}
                >
                  <span className="text-2xl">🧠</span>
                  <span>
                    Question {current + 1} of {questions.length}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-blue-100 text-sm">
                  <span
                    className={`${themeColors.cardBg} backdrop-blur-sm px-3 py-1 rounded-full ${themeColors.cardBorder} border`}
                  >
                    📚 {skill}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full font-medium border ${
                      difficulty === "easy"
                        ? "bg-green-500/20 text-green-200 border-green-400/30"
                        : difficulty === "medium"
                        ? "bg-yellow-500/20 text-yellow-200 border-yellow-400/30"
                        : "bg-red-500/20 text-red-200 border-red-400/30"
                    }`}
                  >
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </span>
                  <span
                    className={`${themeColors.cardBg} backdrop-blur-sm px-3 py-1 rounded-full ${themeColors.cardBorder} border`}
                  >
                    ⏱️ {elapsedTime}
                  </span>
                </div>
              </div>
              <button
                onClick={handleQuitInterview}
                disabled={scoring}
                className="px-4 sm:px-6 py-2 bg-red-500/20 hover:bg-red-600/30 text-red-200 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border border-red-400/30 shadow-lg hover:shadow-red-500/25"
              >
                <span className="flex items-center space-x-2">
                  <span>🚪</span>
                  <span className="hidden sm:inline">Quit Interview</span>
                  <span className="sm:hidden">Quit</span>
                </span>
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2 text-xs text-blue-200">
                <span>Progress</span>
                <span>
                  {Math.round(
                    ((current + (manualTranscript.trim() ? 1 : 0)) /
                      questions.length) *
                      100
                  )}
                  % Complete
                </span>
              </div>
              <div
                className={`w-full ${themeColors.cardBg} backdrop-blur-sm rounded-full h-3 overflow-hidden shadow-inner ${themeColors.cardBorder} border`}
              >
                <div
                  className={`bg-gradient-to-r ${themeColors.accent} h-3 rounded-full transition-all duration-500 ease-out shadow-sm`}
                  style={{
                    width: `${
                      ((current + (manualTranscript.trim() ? 1 : 0)) /
                        questions.length) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex items-center justify-center p-2 sm:p-4">
        <div
          className={`
            flex w-full max-w-7xl ${
              themeColors.cardBg
            } backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden ${
            themeColors.cardBorder
          } border
            ${
              results
                ? "flex-col items-center justify-center"
                : "flex-col lg:flex-row"
            }
            min-h-[500px] sm:min-h-[600px] relative
          `}
        >
          {scoring && <ScoringSpinner />}
          {showQuitConfirm && <QuitConfirmationModal />}

          {!results && (
            <>
              <div
                ref={containerRef}
                className={`lg:w-2/5 w-full flex flex-col justify-center items-center px-4 sm:px-6 py-6 sm:py-8 bg-gradient-to-br ${themeColors.secondary} min-h-[400px] sm:min-h-[500px] overflow-visible border-r ${themeColors.cardBorder} backdrop-blur-sm`}
                tabIndex={0}
              >
                <div
                  className="flex-1 flex flex-col justify-center items-center relative w-full"
                  style={{ overflow: "visible" }}
                >
                  <div
                    className="relative w-full flex justify-center"
                    style={{ minHeight: 200, height: 280, overflow: "visible" }}
                  >
                    {questions.map((_, idx) => renderQuestionSlot(idx))}
                  </div>
                </div>

                <div className="flex items-center justify-center mt-4 sm:mt-6">
                  <div
                    className={`${themeColors.cardBg} backdrop-blur-sm px-6 sm:px-8 py-3 sm:py-4 rounded-2xl ${themeColors.cardBorder} border shadow-xl`}
                  >
                    <div className="flex items-center space-x-4 sm:space-x-6">
                      <span
                        className={`${themeColors.text} font-bold text-lg sm:text-xl`}
                      >
                        {current + 1} / {questions.length}
                      </span>
                      <div className="flex space-x-1">
                        {questions.map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-2 sm:w-3 h-2 sm:h-3 rounded-full transition-all duration-300 ${
                              idx === current
                                ? "bg-blue-400 w-6 sm:w-8 shadow-lg"
                                : answers[idx] && answers[idx].trim()
                                ? "bg-green-400 shadow-md"
                                : "bg-white/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 bg-gradient-to-br from-gray-500/5 to-blue-500/10 backdrop-blur-sm`}
              >
                <div className="relative">
                  <Webcam
                    ref={webcamRef}
                    audio={true}
                    className="rounded-2xl shadow-xl border-4 border-blue-400/30 backdrop-blur-sm"
                    width={280}
                    height={210}
                    screenshotFormat="image/jpeg"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs px-2 sm:px-3 py-1 rounded-full font-bold shadow-lg border border-green-400">
                    LIVE
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <button
                    onClick={handlePrev}
                    disabled={current === 0 || scoring}
                    className={`px-6 sm:px-8 py-3 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm ${
                      current === 0 || scoring
                        ? `${themeColors.cardBg} text-gray-400 cursor-not-allowed ${themeColors.cardBorder} border`
                        : "bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 shadow-lg hover:shadow-xl hover:scale-105 border border-blue-400/30"
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>⬅️</span>
                      <span className="hidden sm:inline">Previous</span>
                    </span>
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={!manualTranscript.trim() || scoring}
                    className={`px-8 sm:px-10 py-3 font-bold rounded-xl transition-all duration-200 backdrop-blur-sm ${
                      !manualTranscript.trim() || scoring
                        ? `${themeColors.cardBg} text-gray-400 cursor-not-allowed ${themeColors.cardBorder} border`
                        : "bg-gradient-to-r from-green-600/80 to-blue-600/80 text-white hover:from-green-700/90 hover:to-blue-700/90 shadow-xl hover:shadow-2xl hover:scale-105 border border-green-400/30"
                    }`}
                    title={
                      !manualTranscript.trim()
                        ? "Answer is required to proceed"
                        : ""
                    }
                  >
                    <span className="flex items-center space-x-2">
                      <span>
                        {current === questions.length - 1
                          ? scoring
                            ? "Scoring..."
                            : "🏁 Finish"
                          : "Next"}
                      </span>
                      <span>
                        {current === questions.length - 1 ? "" : "➡️"}
                      </span>
                    </span>
                  </button>
                </div>

                <div className="w-full max-w-lg">
                  {/* ✅ STT Status Indicator with Vosk + Audio Conversion */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
                    <div
                      className={`${themeColors.text} font-semibold text-base sm:text-lg text-center sm:text-left flex items-center space-x-2`}
                    >
                      {isVoskAvailable && (
                        <span className="text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded-full border border-green-400/30">
                          ✅ Vosk + WAV
                        </span>
                      )}
                      <span>
                        {isTextMode
                          ? "✍️ Type your answer:"
                          : "🎤 Speak your answer:"}
                      </span>
                    </div>
                    <button
                      onClick={handleToggleTextMode}
                      className={`px-4 sm:px-6 py-2 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm ${
                        isTextMode
                          ? "bg-purple-600/80 text-white hover:bg-purple-700/90 shadow-lg border border-purple-400/30"
                          : "bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 border border-purple-400/30"
                      }`}
                      disabled={scoring}
                      title={
                        isTextMode
                          ? "Switch to voice input"
                          : "Switch to text input"
                      }
                    >
                      {isTextMode ? "📝 Text Mode" : "🎤 Voice Mode"}
                    </button>
                  </div>

                  {!isTextMode && (
                    <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 mb-4">
                      {!(listening || isRecording) ? (
                        <button
                          onClick={handleStartListening}
                          className="flex items-center justify-center space-x-2 bg-green-600/80 text-white px-6 sm:px-8 py-3 rounded-xl hover:bg-green-700/90 transition-all duration-200 font-medium shadow-xl hover:shadow-2xl backdrop-blur-sm border border-green-400/30"
                          disabled={scoring}
                        >
                          <span>🎤</span>
                          <span>
                            Start {isVoskAvailable ? "Vosk + WAV" : "Browser"}{" "}
                            Recording
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={handleStopListening}
                          className="flex items-center justify-center space-x-2 bg-red-600/80 text-white px-6 sm:px-8 py-3 rounded-xl hover:bg-red-700/90 transition-all duration-200 font-medium shadow-xl hover:shadow-2xl animate-pulse backdrop-blur-sm border border-red-400/30"
                          disabled={scoring}
                        >
                          <span>⏹️</span>
                          <span>Stop Recording</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          resetTranscript();
                          setManualTranscript("");
                        }}
                        className="flex items-center justify-center space-x-2 bg-gray-600/80 text-white px-4 sm:px-6 py-3 rounded-xl hover:bg-gray-700/90 transition-all duration-200 font-medium shadow-lg backdrop-blur-sm border border-gray-400/30"
                        disabled={scoring}
                      >
                        <span>🔄</span>
                        <span>Reset</span>
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <textarea
                      value={manualTranscript}
                      onChange={isTextMode ? handleTextChange : undefined}
                      readOnly={!isTextMode}
                      className={`w-full h-32 sm:h-36 border-2 rounded-2xl p-4 sm:p-6 ${
                        themeColors.text
                      } ${
                        themeColors.cardBg
                      } backdrop-blur-sm transition-all duration-200 resize-none placeholder-gray-400 ${
                        isTextMode
                          ? "border-purple-400/50 focus:outline-none focus:ring-4 focus:ring-purple-500/25 focus:border-purple-500"
                          : listening || isRecording
                          ? "border-green-400/50 animate-pulse"
                          : `${themeColors.cardBorder}`
                      }`}
                      placeholder={
                        isTextMode
                          ? "Type your answer here..."
                          : "Your voice input will appear here..."
                      }
                      disabled={scoring}
                    />

                    <div
                      className={`absolute bottom-3 right-3 text-xs text-gray-400 ${themeColors.cardBg} backdrop-blur-sm px-3 py-1 rounded-full ${themeColors.cardBorder} border`}
                    >
                      {manualTranscript.length} chars
                    </div>
                  </div>

                  <div className="text-center mt-4">
                    <div
                      className={`font-medium ${
                        isTextMode
                          ? "text-purple-300"
                          : listening || isRecording
                          ? "text-green-300"
                          : "text-blue-300"
                      }`}
                    >
                      {isTextMode
                        ? "✍️ Text mode active - Type your answer above"
                        : listening || isRecording
                        ? `🎙️ ${
                            isVoskAvailable
                              ? "Vosk + WAV conversion"
                              : "Browser"
                          } listening... speak clearly into your microphone`
                        : `🎤 Click the microphone button to start ${
                            isVoskAvailable ? "Vosk + WAV" : "browser"
                          } recording`}
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6 p-4 bg-blue-500/10 backdrop-blur-sm border border-blue-400/30 rounded-xl text-center">
                    <div className="text-blue-300 font-medium mb-2 flex items-center justify-center">
                      <span className="mr-2">💡</span>
                      Interview Tips{" "}
                      {isVoskAvailable && (
                        <span className="ml-2 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full border border-green-400/30">
                          Vosk + WAV Enhanced
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-blue-200 space-y-1">
                      <p>
                        • Answer is required - If you don't know, say "Sorry, I
                        don't know"
                      </p>
                      <p>• Use navigation buttons to move between questions</p>
                      <p>• Your progress is automatically saved</p>
                      {isMultiSkill && (
                        <p>
                          • Mixed Skills Interview - Questions cover multiple
                          technologies
                        </p>
                      )}
                      {isVoskAvailable && (
                        <p>
                          • Enhanced accuracy with Vosk STT + automatic WebM to
                          WAV conversion
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {results && (
            <div className="w-full max-w-5xl p-4 sm:p-8">
              <div className="text-center mb-6 sm:mb-8">
                <div className="text-4xl sm:text-6xl mb-4">
                  {results.summary.avg >= 8
                    ? "🎉"
                    : results.summary.avg >= 6
                    ? "👏"
                    : results.summary.avg >= 4
                    ? "💪"
                    : "📚"}
                </div>
                <h2
                  className={`text-3xl sm:text-4xl font-bold ${themeColors.text} mb-2`}
                >
                  Interview Complete!
                  {results.summary.total < questions.length * 5 && (
                    <span className="text-amber-400 text-xl sm:text-2xl ml-2">
                      (Partial)
                    </span>
                  )}
                </h2>
                <div
                  className={`text-xl sm:text-2xl ${themeColors.textSecondary} mb-4`}
                >
                  Final Score:{" "}
                  <span
                    className={`font-bold ${
                      results.summary.avg >= 8
                        ? "text-green-400"
                        : results.summary.avg >= 6
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {results.summary.total}/{questions.length * 10}
                  </span>{" "}
                  (Average: {results.summary.avg.toFixed(1)}/10)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {results.summary.strengths.length > 0 && (
                  <div className="bg-green-500/10 backdrop-blur-sm border border-green-400/30 rounded-2xl p-4 sm:p-6">
                    <h3 className="font-bold text-green-300 text-base sm:text-lg mb-3 flex items-center">
                      <span className="mr-2">💪</span>
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {results.summary.strengths.map((s, i) => (
                        <li
                          key={i}
                          className="text-green-200 text-sm flex items-start"
                        >
                          <span className="mr-2 mt-1">✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.summary.improvements.length > 0 && (
                  <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-400/30 rounded-2xl p-4 sm:p-6">
                    <h3 className="font-bold text-amber-300 text-base sm:text-lg mb-3 flex items-center">
                      <span className="mr-2">🎯</span>
                      Improvements
                    </h3>
                    <ul className="space-y-2">
                      {results.summary.improvements.map((s, i) => (
                        <li
                          key={i}
                          className="text-amber-200 text-sm flex items-start"
                        >
                          <span className="mr-2 mt-1">→</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.summary.confidenceTips.length > 0 && (
                  <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-4 sm:p-6">
                    <h3 className="font-bold text-blue-300 text-base sm:text-lg mb-3 flex items-center">
                      <span className="mr-2">🚀</span>
                      Confidence Tips
                    </h3>
                    <ul className="space-y-2">
                      {results.summary.confidenceTips.map((s, i) => (
                        <li
                          key={i}
                          className="text-blue-200 text-sm flex items-start"
                        >
                          <span className="mr-2 mt-1">💡</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mb-6 sm:mb-8">
                <h3
                  className={`text-2xl sm:text-3xl font-bold ${themeColors.text} mb-4 sm:mb-6 text-center flex items-center justify-center`}
                >
                  <span className="mr-3">📋</span>
                  Detailed Question Feedback
                </h3>
                <div className="space-y-4 sm:space-y-6 max-h-96 overflow-y-auto">
                  {questions
                    .slice(0, answers.filter(Boolean).length)
                    .map((q, i) => (
                      <div
                        key={i}
                        className={`${themeColors.cardBg} backdrop-blur-sm border-2 ${themeColors.cardBorder} rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-200 hover:bg-white/10`}
                      >
                        <div className="flex flex-col lg:flex-row items-start justify-between mb-4 gap-4">
                          <div className="flex-1">
                            <div
                              className={`font-bold ${themeColors.text} text-base sm:text-lg mb-3`}
                            >
                              Question {i + 1}: {q}
                            </div>
                            <div
                              className={`${themeColors.textSecondary} text-sm mb-3`}
                            >
                              <strong>Your answer:</strong>{" "}
                              {answers[i] || "No answer provided"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-2xl font-bold ${
                                results.perQuestion[i]?.score >= 8
                                  ? "text-green-400"
                                  : results.perQuestion[i]?.score >= 6
                                  ? "text-amber-400"
                                  : "text-red-400"
                              }`}
                            >
                              {results.perQuestion[i]?.score || 0}/10
                            </div>
                            <div
                              className={`text-xs ${themeColors.textSecondary} capitalize`}
                            >
                              {results.perQuestion[i]?.confidence || "medium"}{" "}
                              confidence
                            </div>
                          </div>
                        </div>

                        {results.perQuestion[i]?.feedback && (
                          <div className="p-3 bg-blue-500/10 backdrop-blur-sm border border-blue-400/30 rounded-lg">
                            <div className="text-blue-200 text-sm">
                              <strong>AI Feedback:</strong>{" "}
                              {results.perQuestion[i].feedback}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              <div className="text-center">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push("/start-interview")}
                    className={`px-8 py-4 bg-gradient-to-r ${themeColors.accent} text-white rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl`}
                  >
                    🔄 Take Another Interview
                  </button>
                  <button
                    onClick={() => router.push("/leaderboard")}
                    className={`px-8 py-4 ${themeColors.cardBg} hover:bg-white/20 ${themeColors.text} rounded-2xl font-bold transition-all duration-200 ${themeColors.cardBorder} border shadow-lg`}
                  >
                    🏆 View Leaderboard
                  </button>
                  <button
                    onClick={() => router.push("/progress")}
                    className={`px-8 py-4 ${themeColors.cardBg} hover:bg-white/20 ${themeColors.text} rounded-2xl font-bold transition-all duration-200 ${themeColors.cardBorder} border shadow-lg`}
                  >
                    📊 View Progress
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className={`px-8 py-4 ${themeColors.cardBg} hover:bg-white/20 ${themeColors.text} rounded-2xl font-bold transition-all duration-200 ${themeColors.cardBorder} border shadow-lg`}
                  >
                    🏠 Back to Home
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
