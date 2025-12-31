"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  GradeResult,
  JobStatus,
  Pack,
  PackSummary,
  PracticePlan,
  Question,
  RemediationItem
} from "../lib/types";
import { buildStudySchedule } from "../lib/schedule";

const DEFAULT_INPUT = "https://youtube.com/playlist?list=PL123_VERILEARN";
const DEFAULT_PRO_MODEL = "gemini-3-pro";
const DEFAULT_FLASH_MODEL = "gemini-3-flash";

const STORAGE_KEYS = {
  youtube: "verilearn_youtube_key",
  gemini: "verilearn_gemini_key",
  pro: "verilearn_model_pro",
  flash: "verilearn_model_flash",
  research: "verilearn_research_key",
  researchQuery: "verilearn_research_query"
};

type CoachMessage = { role: "user" | "assistant"; content: string };

type CoachMode = "coach" | "viva" | "assist";

export default function Home() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [examSize, setExamSize] = useState(12);
  const [language, setLanguage] = useState("en");
  const [examDate, setExamDate] = useState("");
  const [vaultNotes, setVaultNotes] = useState("");
  const [vaultFiles, setVaultFiles] = useState<File[]>([]);
  const [vaultDocs, setVaultDocs] = useState<Array<{ id: string; name: string; chars: number }>>(
    []
  );
  const [researchSources, setResearchSources] = useState("");
  const [researchApiKey, setResearchApiKey] = useState("");
  const [researchQuery, setResearchQuery] = useState("");
  const [includeResearch, setIncludeResearch] = useState(false);
  const [includeCoach, setIncludeCoach] = useState(true);
  const [includeAssist, setIncludeAssist] = useState(false);
  const [useCodeExecution, setUseCodeExecution] = useState(false);
  const [useFileSearch, setUseFileSearch] = useState(false);
  const [useInteractions, setUseInteractions] = useState(false);
  const [resumeJobId, setResumeJobId] = useState("");

  const [youtubeApiKey, setYoutubeApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [proModel, setProModel] = useState(DEFAULT_PRO_MODEL);
  const [flashModel, setFlashModel] = useState(DEFAULT_FLASH_MODEL);

  const [job, setJob] = useState<JobStatus | null>(null);
  const [pack, setPack] = useState<Pack | null>(null);
  const [packList, setPackList] = useState<PackSummary[]>([]);
  const [packListLoading, setPackListLoading] = useState(false);
  const [packListError, setPackListError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examResults, setExamResults] = useState<Record<string, GradeResult>>({});
  const [examStarted, setExamStarted] = useState(false);
  const [examTimeLeft, setExamTimeLeft] = useState<number | null>(null);
  const [remediation, setRemediation] = useState<RemediationItem[] | null>(null);
  const [remediationLoading, setRemediationLoading] = useState(false);
  const [remediationError, setRemediationError] = useState<string | null>(null);
  const [practicePlan, setPracticePlan] = useState<PracticePlan | null>(null);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [practiceResults, setPracticeResults] = useState<Record<string, GradeResult>>({});
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);

  const [coachMode, setCoachMode] = useState<CoachMode>("coach");
  const [coachInput, setCoachInput] = useState("");
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [coachBusy, setCoachBusy] = useState(false);
  const [coachSessionId, setCoachSessionId] = useState<string | null>(null);
  const [useWebSocket, setUseWebSocket] = useState(false);
  const [useLiveApi, setUseLiveApi] = useState(false);
  const [wsStatus, setWsStatus] = useState<"idle" | "connecting" | "open" | "error">("idle");
  const wsRef = useRef<WebSocket | null>(null);

  const progressPercent = job ? Math.round(job.progress * 100) : 0;
  const spriteScale = 2;

  const buildSpriteStyle = (sprite: {
    spriteUrl: string;
    width: number;
    height: number;
    columns: number;
    rows: number;
    col: number;
    row: number;
  }) => ({
    width: sprite.width * spriteScale,
    height: sprite.height * spriteScale,
    backgroundImage: `url(${sprite.spriteUrl})`,
    backgroundPosition: `-${sprite.col * sprite.width * spriteScale}px -${sprite.row * sprite.height * spriteScale}px`,
    backgroundSize: `${sprite.columns * sprite.width * spriteScale}px ${sprite.rows * sprite.height * spriteScale}px`
  });

  const fetchPackList = useCallback(async () => {
    setPackListLoading(true);
    setPackListError(null);
    try {
      const response = await fetch("/api/packs");
      if (!response.ok) {
        throw new Error("Failed to load packs");
      }
      const data = (await response.json()) as { packs?: PackSummary[] };
      setPackList(data.packs ?? []);
    } catch (err) {
      setPackListError(err instanceof Error ? err.message : "Failed to load packs");
    } finally {
      setPackListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setYoutubeApiKey(localStorage.getItem(STORAGE_KEYS.youtube) ?? "");
    setGeminiApiKey(localStorage.getItem(STORAGE_KEYS.gemini) ?? "");
    setProModel(localStorage.getItem(STORAGE_KEYS.pro) ?? DEFAULT_PRO_MODEL);
    setFlashModel(localStorage.getItem(STORAGE_KEYS.flash) ?? DEFAULT_FLASH_MODEL);
    setResearchApiKey(localStorage.getItem(STORAGE_KEYS.research) ?? "");
    setResearchQuery(localStorage.getItem(STORAGE_KEYS.researchQuery) ?? "");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.youtube, youtubeApiKey);
  }, [youtubeApiKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.gemini, geminiApiKey);
  }, [geminiApiKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.pro, proModel);
  }, [proModel]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.flash, flashModel);
  }, [flashModel]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.research, researchApiKey);
  }, [researchApiKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.researchQuery, researchQuery);
  }, [researchQuery]);

  useEffect(() => {
    if (!job?.id || job.status === "completed" || job.status === "failed") {
      return;
    }

    let active = true;
    let interval: ReturnType<typeof setInterval> | null = null;
    let eventSource: EventSource | null = null;

    const handleUpdate = async (data: JobStatus) => {
      if (!active) return;
      setJob(data);
      if (data.status === "completed" || data.status === "failed") {
        if (interval) clearInterval(interval);
        eventSource?.close();
      }
      if (data.status === "completed" && data.packId) {
        const packResponse = await fetch(`/api/study-pack/${data.packId}`);
        if (packResponse.ok) {
          const packData = (await packResponse.json()) as Pack;
          setPack(packData);
          fetchPackList();
        }
      }
    };

    const pollStatus = async () => {
      const response = await fetch(`/api/status/${job.id}`);
      if (!response.ok) return;
      const data = (await response.json()) as JobStatus;
      handleUpdate(data);
    };

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(pollStatus, 1500);
    };

    if (typeof EventSource !== "undefined") {
      eventSource = new EventSource(`/api/status/stream/${job.id}`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as JobStatus;
          handleUpdate(data);
          if (data.status === "completed" || data.status === "failed") {
            eventSource?.close();
          }
        } catch {
          // ignore malformed events
        }
      };
      eventSource.onerror = () => {
        eventSource?.close();
        startPolling();
      };
    } else {
      startPolling();
    }

    return () => {
      active = false;
      eventSource?.close();
      if (interval) clearInterval(interval);
    };
  }, [job?.id, fetchPackList]);

  useEffect(() => {
    if (!examStarted || !pack) return;
    setExamTimeLeft(pack.exam.totalTimeMinutes * 60);
    const timer = setInterval(() => {
      setExamTimeLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted, pack]);

  useEffect(() => {
    fetchPackList();
  }, [fetchPackList]);

  useEffect(() => {
    setRemediation(null);
    setRemediationError(null);
    setPracticePlan(null);
    setPracticeResults({});
    setPracticeAnswers({});
    setPracticeError(null);
  }, [pack?.id]);

  useEffect(() => {
    setCoachSessionId(null);
    setCoachMessages([]);
  }, [coachMode, pack?.id]);

  useEffect(() => {
    if (!useWebSocket) {
      setUseLiveApi(false);
    }
  }, [useWebSocket]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!useWebSocket || !pack || !geminiApiKey) {
      wsRef.current?.close();
      wsRef.current = null;
      setWsStatus("idle");
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws/coach`);
    wsRef.current = ws;
    setWsStatus("connecting");

    ws.onopen = () => {
      setWsStatus("open");
      ws.send(
        JSON.stringify({
          type: "init",
          packId: pack.id,
          mode: coachMode,
          geminiApiKey,
          model: proModel,
          useLive: useLiveApi,
          researchApiKey: researchApiKey || undefined,
          researchQuery: researchQuery || undefined
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          type: "chunk" | "done" | "error";
          content?: string;
          message?: string;
        };
        if (data.type === "chunk" && data.content) {
          setCoachMessages((prev) => {
            if (!prev.length) return prev;
            const next = prev.slice(0, -1);
            const last = prev[prev.length - 1];
            if (last.role !== "assistant") return prev;
            return [...next, { ...last, content: `${last.content}${data.content}` }];
          });
        }
        if (data.type === "done") {
          setCoachBusy(false);
        }
        if (data.type === "error") {
          setCoachBusy(false);
          setWsStatus("error");
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      setWsStatus("error");
      setCoachBusy(false);
    };

    ws.onclose = () => {
      setWsStatus("idle");
    };

    return () => {
      ws.close();
    };
  }, [useWebSocket, pack?.id, coachMode, geminiApiKey, proModel, useLiveApi, researchApiKey, researchQuery]);

  const handleGenerate = async () => {
    if (!youtubeApiKey || !geminiApiKey) {
      setError("Provide both YouTube and Gemini API keys.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setPack(null);
    setExamAnswers({});
    setExamResults({});
    setExamStarted(false);
    setExamTimeLeft(null);
    setRemediation(null);
    setRemediationError(null);
    setPracticePlan(null);
    setPracticeResults({});
    setPracticeAnswers({});
    setPracticeError(null);

    let vaultDocIds: string[] = vaultDocs.map((doc) => doc.id);
    if (vaultFiles.length) {
      const formData = new FormData();
      vaultFiles.forEach((file) => formData.append("files", file));
      const uploadResponse = await fetch("/api/vault", {
        method: "POST",
        body: formData
      });
      if (!uploadResponse.ok) {
        setError("Failed to ingest vault documents.");
        setIsSubmitting(false);
        return;
      }
      const uploadData = (await uploadResponse.json()) as {
        docs?: Array<{ id: string; name: string; chars: number }>;
      };
      setVaultDocs(uploadData.docs ?? []);
      vaultDocIds = (uploadData.docs ?? []).map((doc) => doc.id);
    }

    const response = await fetch("/api/generate-pack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input,
        youtubeApiKey,
        geminiApiKey,
        models: { pro: proModel, flash: flashModel },
        examDate: examDate || undefined,
        vaultNotes: vaultNotes || undefined,
        vaultDocIds: vaultDocIds.length ? vaultDocIds : undefined,
        researchSources: researchSources
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean),
        researchApiKey: researchApiKey || undefined,
        researchQuery: researchQuery || undefined,
        resumeJobId: resumeJobId || undefined,
        options: {
          examSize,
          language,
          includeResearch,
          includeCoach,
          includeAssist,
          useCodeExecution,
          useFileSearch,
          useInteractions
        }
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "Unknown error" }));
      setError(data.error || "Failed to start generation");
      setIsSubmitting(false);
      return;
    }

    const data = (await response.json()) as { jobId: string };
    setJob({
      id: data.jobId,
      status: "queued",
      step: "Queued",
      progress: 0,
      totalLectures: 0,
      completedLectures: 0,
      errors: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsSubmitting(false);
  };

  const examQuestions = useMemo(() => {
    if (!pack) return [];
    const ids = pack.exam.sections.flatMap((section) => section.questionIds);
    return ids
      .map((id) => pack.questions.find((question) => question.id === id))
      .filter(Boolean) as Question[];
  }, [pack]);

  const examScore = useMemo(() => {
    const results = Object.values(examResults);
    if (!results.length) return null;
    const correct = results.filter((result) => result.correct).length;
    return {
      correct,
      total: results.length,
      percent: Math.round((correct / results.length) * 100)
    };
  }, [examResults]);

  const topicAccuracy = useMemo(() => {
    if (!pack) return [];
    const questionMap = new Map(pack.questions.map((question) => [question.id, question]));
    const totals = new Map<string, { correct: number; total: number }>();

    Object.values(examResults).forEach((result) => {
      const question = questionMap.get(result.questionId);
      if (!question) return;
      const topic = pack.blueprint.topics.find((candidate) =>
        question.tags.some(
          (tag) =>
            tag.toLowerCase() === candidate.title.toLowerCase() ||
            tag.toLowerCase() === candidate.id.toLowerCase()
        )
      );
      const topicId = topic?.id ?? "general";
      const current = totals.get(topicId) ?? { correct: 0, total: 0 };
      totals.set(topicId, {
        correct: current.correct + (result.correct ? 1 : 0),
        total: current.total + 1
      });
    });

    return pack.blueprint.topics.map((topic) => {
      const record = totals.get(topic.id) ?? { correct: 0, total: 0 };
      return {
        id: topic.id,
        title: topic.title,
        correct: record.correct,
        total: record.total
      };
    });
  }, [pack, examResults]);

  const studySchedule = useMemo(() => {
    if (!pack || !examDate) return [];
    return buildStudySchedule(pack.blueprint, examDate);
  }, [pack, examDate]);

  const reviewQueue = useMemo(() => {
    if (!pack) return [];
    return pack.blueprint.topics
      .map((topic) => ({
        id: topic.id,
        title: topic.title,
        score: pack.mastery[topic.id]?.score ?? 0,
        nextReviewAt: pack.mastery[topic.id]?.nextReviewAt ?? new Date().toISOString()
      }))
      .sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime())
      .slice(0, 6);
  }, [pack]);

  const formatTime = (totalSeconds: number | null) => {
    if (totalSeconds === null) return "";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const handleAnswerCheck = async (question: Question) => {
    const answer = examAnswers[question.id];
    if (!answer || !pack) {
      return;
    }

    const response = await fetch("/api/submit-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packId: pack.id,
        questionId: question.id,
        answer
      })
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as GradeResult;
    setExamResults((prev) => ({ ...prev, [question.id]: data }));
    if (data.mastery) {
      setPack((prev) =>
        prev
          ? {
              ...prev,
              mastery: {
                ...prev.mastery,
                [data.mastery.topicId]: data.mastery
              }
            }
          : prev
      );
    }
  };

  const handlePracticeLoad = async () => {
    if (!pack) return;
    setPracticeLoading(true);
    setPracticeError(null);
    try {
      const response = await fetch(`/api/practice?packId=${pack.id}&limit=5`);
      if (!response.ok) {
        throw new Error("Failed to build practice set");
      }
      const data = (await response.json()) as PracticePlan;
      setPracticePlan(data);
      setPracticeAnswers({});
      setPracticeResults({});
    } catch (err) {
      setPracticeError(err instanceof Error ? err.message : "Practice request failed");
    } finally {
      setPracticeLoading(false);
    }
  };

  const handlePracticeCheck = async (question: Question) => {
    const answer = practiceAnswers[question.id];
    if (!answer || !pack) {
      return;
    }

    const response = await fetch("/api/submit-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packId: pack.id,
        questionId: question.id,
        answer
      })
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as GradeResult;
    setPracticeResults((prev) => ({ ...prev, [question.id]: data }));
    if (data.mastery) {
      setPack((prev) =>
        prev
          ? {
              ...prev,
              mastery: {
                ...prev.mastery,
                [data.mastery.topicId]: data.mastery
              }
            }
          : prev
      );
    }
  };

  const downloadPdf = () => {
    if (!pack) return;
    window.open(`/api/export/pdf?packId=${pack.id}`, "_blank");
  };

  const downloadHtml = () => {
    if (!pack) return;
    window.open(`/api/export/html?packId=${pack.id}`, "_blank");
  };

  const downloadAnki = (format: "csv" | "tsv") => {
    if (!pack) return;
    window.open(`/api/export/anki?packId=${pack.id}&format=${format}`, "_blank");
  };

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !pack) return "";
    return `${window.location.origin}/pack/${pack.id}`;
  }, [pack]);

  const handleCopyShare = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
  };

  const handleCoachSend = async () => {
    if (!coachInput.trim() || !pack || !geminiApiKey) return;
    const history = coachMessages.slice();
    const message = coachInput.trim();
    setCoachInput("");
    setCoachMessages([...history, { role: "user", content: message }, { role: "assistant", content: "" }]);
    setCoachBusy(true);

    if (useWebSocket && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          content: message
        })
      );
      return;
    }

    let sessionId = coachSessionId;
    if (!sessionId) {
      const sessionResponse = await fetch("/api/coach/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: pack.id,
          mode: coachMode,
          researchApiKey: researchApiKey || undefined,
          researchQuery: researchQuery || undefined
        })
      });
      if (!sessionResponse.ok) {
        setCoachBusy(false);
        return;
      }
      const sessionData = (await sessionResponse.json()) as { sessionId: string };
      sessionId = sessionData.sessionId;
      setCoachSessionId(sessionId);
    }

    const response = await fetch(`/api/coach/session/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        geminiApiKey,
        model: proModel
      })
    });

    if (!response.body) {
      setCoachBusy(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let assistantText = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      assistantText += decoder.decode(value || new Uint8Array(), { stream: true });
      setCoachMessages((prev) => {
        const next = prev.slice(0, -1);
        return [...next, { role: "assistant", content: assistantText }];
      });
    }

    setCoachBusy(false);
  };

  const handleCoachReset = async () => {
    if (coachSessionId) {
      await fetch(`/api/coach/session/${coachSessionId}`, { method: "DELETE" });
    }
    setCoachSessionId(null);
    setCoachMessages([]);
    setCoachBusy(false);
    if (useWebSocket) {
      wsRef.current?.close();
      wsRef.current = null;
      setWsStatus("idle");
    }
  };

  const handleLoadPack = async (packId: string) => {
    const response = await fetch(`/api/study-pack/${packId}`);
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as Pack;
    setPack(data);
    setJob(null);
  };

  const handleDeletePack = async (packId: string) => {
    const response = await fetch(`/api/study-pack/${packId}`, { method: "DELETE" });
    if (!response.ok) {
      return;
    }
    setPackList((prev) => prev.filter((item) => item.id !== packId));
    if (pack?.id === packId) {
      setPack(null);
    }
  };

  const handleRemediation = async () => {
    if (!pack) return;
    setRemediationLoading(true);
    setRemediationError(null);
    try {
      const incorrectIds = Object.values(examResults)
        .filter((result) => !result.correct)
        .map((result) => result.questionId);

      const response = await fetch("/api/remediation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: pack.id,
          incorrectQuestionIds: incorrectIds.length ? incorrectIds : undefined,
          geminiApiKey: geminiApiKey || undefined,
          model: geminiApiKey ? proModel : undefined
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate remediation plan.");
      }

      const data = (await response.json()) as { remediation: RemediationItem[] };
      setRemediation(data.remediation ?? []);
    } catch (err) {
      setRemediationError(err instanceof Error ? err.message : "Failed to generate remediation plan.");
    } finally {
      setRemediationLoading(false);
    }
  };

  return (
    <main>
      <div className="shell">
        <section className="hero fade-in">
          <div>
            <div className="eyebrow">VeriLearn Exam Pack</div>
            <h1>Turn lecture playlists into evidence-backed exam prep.</h1>
            <p>
              Paste a playlist, connect Gemini 3 Pro + Flash, and generate a blueprint,
              timestamped notes, verified questions, and a mock exam with remediation.
            </p>
            <div className="hero-actions">
              <button
                className="button primary"
                onClick={handleGenerate}
                disabled={isSubmitting}
              >
                Generate Exam Pack
              </button>
              <button className="button secondary" onClick={downloadPdf} disabled={!pack}>
                Download PDF
              </button>
            </div>
          </div>
          <div className="card">
            <div className="form-grid">
              <div className="form-row">
                <label htmlFor="playlist">Playlist or lecture list</label>
                <textarea
                  id="playlist"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="exam-size">Exam questions</label>
                <input
                  id="exam-size"
                  type="number"
                  min={5}
                  max={50}
                  value={examSize}
                  onChange={(event) => setExamSize(Number(event.target.value))}
                />
              </div>
              <div className="form-row">
                <label htmlFor="exam-date">Exam date (optional)</label>
                <input
                  id="exam-date"
                  type="date"
                  value={examDate}
                  onChange={(event) => setExamDate(event.target.value)}
                />
              </div>
              {error ? <p className="feedback bad">{error}</p> : null}
            </div>
          </div>
        </section>

        <section className="grid-2 fade-in">
          <div className="card">
            <div className="section-title">Keys + Models</div>
            <div className="form-grid">
              <div className="form-row">
                <label htmlFor="youtube-key">YouTube API key</label>
                <input
                  id="youtube-key"
                  type="password"
                  value={youtubeApiKey}
                  onChange={(event) => setYoutubeApiKey(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="gemini-key">Gemini API key</label>
                <input
                  id="gemini-key"
                  type="password"
                  value={geminiApiKey}
                  onChange={(event) => setGeminiApiKey(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="pro-model">Gemini Pro model</label>
                <input
                  id="pro-model"
                  value={proModel}
                  onChange={(event) => setProModel(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="flash-model">Gemini Flash model</label>
                <input
                  id="flash-model"
                  value={flashModel}
                  onChange={(event) => setFlashModel(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-title">Options</div>
            <div className="form-grid">
              <div className="form-row">
                <label htmlFor="language">Transcript language</label>
                <input
                  id="language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label>Features</label>
                <div className="list">
                  <label className="option">
                    <input
                      type="checkbox"
                      checked={includeResearch}
                      onChange={(event) => setIncludeResearch(event.target.checked)}
                    />
                    <span>Deep research blueprint</span>
                  </label>
                  <label className="option">
                    <input
                      type="checkbox"
                      checked={includeCoach}
                      onChange={(event) => setIncludeCoach(event.target.checked)}
                    />
                    <span>Coach mode</span>
                  </label>
                  <label className="option">
                    <input
                      type="checkbox"
                      checked={includeAssist}
                      onChange={(event) => setIncludeAssist(event.target.checked)}
                    />
                    <span>Assist mode</span>
                  </label>
                  <label className="option">
                    <input
                      type="checkbox"
                      checked={useCodeExecution}
                      onChange={(event) => setUseCodeExecution(event.target.checked)}
                    />
                    <span>Use code execution tool</span>
                  </label>
                  <label className="option">
                    <input
                      type="checkbox"
                      checked={useFileSearch}
                      onChange={(event) => setUseFileSearch(event.target.checked)}
                    />
                    <span>Use file search (vault)</span>
                  </label>
                  <label className="option">
                    <input
                      type="checkbox"
                      checked={useInteractions}
                      onChange={(event) => setUseInteractions(event.target.checked)}
                    />
                    <span>Use Interactions API</span>
                  </label>
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="vault-notes">Extra notes / syllabus</label>
                <textarea
                  id="vault-notes"
                  value={vaultNotes}
                  onChange={(event) => setVaultNotes(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="vault-files">Upload docs (PDF/TXT)</label>
                <input
                  id="vault-files"
                  type="file"
                  multiple
                  onChange={(event) =>
                    setVaultFiles(Array.from(event.target.files ?? []))
                  }
                />
                {vaultDocs.length ? (
                  <div className="list">
                    {vaultDocs.map((doc) => (
                      <div key={doc.id} className="note-block">
                        <strong>{doc.name}</strong>
                        <p>{doc.chars} chars indexed</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="form-row">
                <label htmlFor="research">Research source URLs (one per line)</label>
                <textarea
                  id="research"
                  value={researchSources}
                  onChange={(event) => setResearchSources(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="research-key">Research API key (Serper)</label>
                <input
                  id="research-key"
                  type="password"
                  value={researchApiKey}
                  onChange={(event) => setResearchApiKey(event.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="research-query">Research query override</label>
                <input
                  id="research-query"
                  value={researchQuery}
                  onChange={(event) => setResearchQuery(event.target.value)}
                  placeholder="e.g. course name syllabus past papers"
                />
              </div>
              <div className="form-row">
                <label htmlFor="resume-job">Resume job id (optional)</label>
                <input
                  id="resume-job"
                  value={resumeJobId}
                  onChange={(event) => setResumeJobId(event.target.value)}
                  placeholder="job_..."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="card fade-in">
          <div className="section-title">Pipeline status</div>
          <div className="grid-2">
            <div>
              <div className="tag">{job?.status ?? "idle"}</div>
              <p>{job ? job.step : "Awaiting a playlist."}</p>
              {job?.currentLecture ? <p>Now: {job.currentLecture}</p> : null}
              {job?.id ? <p className="muted">Job ID: {job.id}</p> : null}
              {job?.traceId ? <p className="muted">Trace ID: {job.traceId}</p> : null}
              {job?.fileSearchStoreName ? (
                <p className="muted">File search: {job.fileSearchStoreName}</p>
              ) : null}
            </div>
            <div>
              <div className="progress">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <p>
                {job
                  ? `${job.completedLectures}/${job.totalLectures} lectures`
                  : "0/0 lectures"}
              </p>
              {job?.errors?.length ? (
                <p className="feedback bad">{job.errors[job.errors.length - 1]}</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="card fade-in">
          <div className="section-title">Saved packs</div>
          {packListLoading ? <p>Loading packs...</p> : null}
          {packListError ? <p className="feedback bad">{packListError}</p> : null}
          {packList.length ? (
            <div className="list">
              {packList.map((summary) => (
                <div key={summary.id} className="note-block">
                  <div className="pack-row">
                    <div>
                      <strong>{summary.title}</strong>
                      <p className="muted">
                        {new Date(summary.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="pack-actions">
                      <button
                        className="button secondary"
                        onClick={() => handleLoadPack(summary.id)}
                      >
                        Open
                      </button>
                      <a className="button secondary" href={`/pack/${summary.id}`}>
                        Share
                      </a>
                      <button
                        className="button danger"
                        onClick={() => handleDeletePack(summary.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {!packListLoading && !packList.length ? (
            <p className="muted">No packs yet. Generate one to start.</p>
          ) : null}
        </section>

        {pack ? (
          <section className="grid-2 fade-in">
            <div className="card">
              <div className="section-title">Share + Exports</div>
              <p className="kicker">Share link</p>
              <div className="list">
                <input value={shareUrl} readOnly />
                <button className="button secondary" onClick={handleCopyShare}>
                  Copy link
                </button>
                <div className="pill-list">
                  <button className="button secondary" onClick={downloadPdf}>
                    PDF
                  </button>
                  <button className="button secondary" onClick={downloadHtml}>
                    HTML
                  </button>
                  <button className="button secondary" onClick={() => downloadAnki("csv")}>
                    Anki CSV
                  </button>
                  <button className="button secondary" onClick={() => downloadAnki("tsv")}>
                    Anki TSV
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-title">Mastery</div>
              <div className="list">
                {pack.blueprint.topics.map((topic) => {
                  const record = pack.mastery[topic.id];
                  return (
                    <div key={topic.id} className="note-block">
                      <strong>{topic.title}</strong>
                      <p>Score: {Math.round((record?.score ?? 0) * 100)}%</p>
                      <p>Next review: {record?.nextReviewAt?.slice(0, 10)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {pack.researchReport ? (
              <div className="card">
                <div className="section-title">Research report</div>
                <p>{pack.researchReport.summary}</p>
                <div className="list">
                  {pack.researchReport.sources.map((source) => (
                    <div key={source.url} className="note-block">
                      <strong>{source.title}</strong>
                      <p>{source.excerpt}</p>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="card">
              <div className="section-title">Blueprint</div>
              <p className="kicker">Revision order + weights</p>
              <div className="list">
                {pack.blueprint.topics.map((topic) => (
                  <div key={topic.id} className="note-block">
                    <strong>{topic.title}</strong>
                    <div className="pill-list">
                      <span className="pill">Weight {topic.weight}%</span>
                      <span className="pill">Order {topic.revisionOrder}</span>
                    </div>
                    {topic.prerequisites.length ? (
                      <p>Prereq: {topic.prerequisites.join(", ")}</p>
                    ) : (
                      <p>No prerequisites</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="section-title">Notes</div>
              {pack.notes.map((note) => (
                <div key={note.lectureId} className="note-block">
                  <div className="kicker">{note.lectureTitle}</div>
                  <p>{note.summary}</p>
                  {!note.verified && note.verificationNotes?.length ? (
                    <p className="feedback bad">
                      Needs review: {note.verificationNotes[0]}
                    </p>
                  ) : null}
                  <div className="list">
                    {note.sections.map((section) => (
                      <div key={section.heading}>
                        <strong>{section.heading}</strong>
                        <ul className="list">
                          {section.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="pill-list">
                    {note.citations.slice(0, 4).map((citation) => (
                      <a
                        key={citation.label}
                        className="pill"
                        href={citation.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {citation.timestamp}
                      </a>
                    ))}
                  </div>
                  {note.visuals?.length ? (
                    <div className="visuals">
                      {note.visuals.map((visual, index) => (
                        <div key={`${visual.timestamp}-${index}`} className="visual-card">
                          {visual.sprite ? (
                            <div className="sprite-frame" style={buildSpriteStyle(visual.sprite)} />
                          ) : (
                            <img src={visual.url} alt={visual.description} />
                          )}
                          <div className="kicker">{visual.timestamp}</div>
                          <p>{visual.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="card">
              <div className="section-title">Question bank</div>
              <div className="list">
                {pack.questions.map((question) => (
                  <div key={question.id} className="question">
                    <strong>{question.stem}</strong>
                    {question.options ? (
                      <div className="options">
                        {question.options.map((option) => (
                          <div key={option.id} className="option">
                            <span>{option.id}.</span>
                            <span>{option.text}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {!question.verified && question.verificationNotes?.length ? (
                      <p className="feedback bad">
                        Needs review: {question.verificationNotes[0]}
                      </p>
                    ) : null}
                    <div className="pill-list">
                      {question.citations.slice(0, 2).map((citation) => (
                        <a
                          key={citation.label}
                          className="pill"
                          href={citation.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {citation.timestamp}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="section-title">Adaptive practice</div>
              <p className="kicker">Spaced repetition based on mastery scores.</p>
              <div className="pack-actions">
                <button
                  className="button secondary"
                  onClick={handlePracticeLoad}
                  disabled={practiceLoading}
                >
                  {practiceLoading ? "Building practice set..." : "Generate practice set"}
                </button>
              </div>
              {practiceError ? <p className="feedback bad">{practiceError}</p> : null}
              {practicePlan?.dueTopics?.length ? (
                <div className="pill-list">
                  {practicePlan.dueTopics.map((topic) => (
                    <span key={topic.id} className="pill">
                      {topic.title} {topic.due ? "• due" : ""} ({Math.round(topic.score * 100)}%)
                    </span>
                  ))}
                </div>
              ) : (
                <p className="muted">No practice set loaded yet.</p>
              )}
              {practicePlan?.questions?.length ? (
                <div className="list">
                  {practicePlan.questions.map((question) => {
                    const result = practiceResults[question.id];
                    return (
                      <div key={question.id} className="question">
                        <strong>{question.stem}</strong>
                        {question.options ? (
                          <div className="options">
                            {question.options.map((option) => (
                              <label key={option.id} className="option">
                                <input
                                  type="radio"
                                  name={`practice-${question.id}`}
                                  value={option.id}
                                  checked={practiceAnswers[question.id] === option.id}
                                  onChange={(event) =>
                                    setPracticeAnswers((prev) => ({
                                      ...prev,
                                      [question.id]: event.target.value
                                    }))
                                  }
                                />
                                <span>
                                  {option.id}. {option.text}
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Type your answer"
                            value={practiceAnswers[question.id] ?? ""}
                            onChange={(event) =>
                              setPracticeAnswers((prev) => ({
                                ...prev,
                                [question.id]: event.target.value
                              }))
                            }
                          />
                        )}
                        <button
                          className="button secondary"
                          onClick={() => handlePracticeCheck(question)}
                        >
                          Check answer
                        </button>
                        {result ? (
                          <div className={`feedback ${result.correct ? "" : "bad"}`}>
                            {result.correct
                              ? "Correct."
                              : `Not quite. Correct answer: ${result.correctAnswer}`}
                            <div>{result.explanation}</div>
                            <div className="pill-list">
                              {result.citations.map((citation) => (
                                <a
                                  key={citation.label}
                                  className="pill"
                                  href={citation.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {citation.timestamp}
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="card">
              <div className="section-title">Mock exam</div>
              <p className="kicker">
                {pack.exam.totalTimeMinutes} min - {examQuestions.length} questions
              </p>
              {examStarted ? (
                <p className="kicker">Time left: {formatTime(examTimeLeft)}</p>
              ) : (
                <button className="button secondary" onClick={() => setExamStarted(true)}>
                  Start timed exam
                </button>
              )}
              {examScore ? (
                <p className="kicker">
                  Score: {examScore.correct}/{examScore.total} ({examScore.percent}%)
                </p>
              ) : null}
              <div className="list">
                {examQuestions.map((question) => {
                  const result = examResults[question.id];
                  return (
                    <div key={question.id} className="question">
                      <strong>{question.stem}</strong>
                      {question.options ? (
                        <div className="options">
                          {question.options.map((option) => (
                            <label key={option.id} className="option">
                              <input
                                type="radio"
                                name={question.id}
                                value={option.id}
                                checked={examAnswers[question.id] === option.id}
                                onChange={(event) =>
                                  setExamAnswers((prev) => ({
                                    ...prev,
                                    [question.id]: event.target.value
                                  }))
                                }
                              />
                              <span>
                                {option.id}. {option.text}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="Type your answer"
                          value={examAnswers[question.id] ?? ""}
                          onChange={(event) =>
                            setExamAnswers((prev) => ({
                              ...prev,
                              [question.id]: event.target.value
                            }))
                          }
                        />
                      )}
                      <button
                        className="button secondary"
                        onClick={() => handleAnswerCheck(question)}
                      >
                        Check answer
                      </button>
                      {result ? (
                        <div className={`feedback ${result.correct ? "" : "bad"}`}>
                          {result.correct
                            ? "Correct."
                            : `Not quite. Correct answer: ${result.correctAnswer}`}
                          <div>{result.explanation}</div>
                          <div className="pill-list">
                            {result.citations.map((citation) => (
                              <a
                                key={citation.label}
                                className="pill"
                                href={citation.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {citation.timestamp}
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div className="section-title">Remediation plan</div>
              <p className="kicker">Focus on weak topics and evidence-backed review.</p>
              <button
                className="button secondary"
                onClick={handleRemediation}
                disabled={remediationLoading}
              >
                {remediationLoading ? "Building plan..." : "Generate remediation"}
              </button>
              {remediationError ? <p className="feedback bad">{remediationError}</p> : null}
              {remediation?.length ? (
                <div className="list">
                  {remediation.map((item) => (
                    <div key={item.topicId} className="note-block">
                      <strong>{item.topicTitle}</strong>
                      <p>{item.advice}</p>
                      <div className="pill-list">
                        {item.citations.slice(0, 3).map((citation) => (
                          <a
                            key={citation.label}
                            className="pill"
                            href={citation.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {citation.timestamp}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">Generate a plan after answering questions.</p>
              )}
            </div>

            <div className="card">
              <div className="section-title">Analytics + schedule</div>
              <p className="kicker">Topic accuracy and upcoming review plan.</p>
              {topicAccuracy.some((item) => item.total > 0) ? (
                <div className="list">
                  {topicAccuracy
                    .filter((item) => item.total > 0)
                    .map((item) => (
                      <div key={item.id} className="note-block">
                        <strong>{item.title}</strong>
                        <div className="pill-list">
                          <span className="pill">
                            Accuracy {Math.round((item.correct / item.total) * 100)}%
                          </span>
                          <span className="pill">
                            {item.correct}/{item.total} correct
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="muted">Answer some questions to see analytics.</p>
              )}
              {reviewQueue.length ? (
                <div className="list">
                  {reviewQueue.map((topic) => (
                    <div key={topic.id} className="note-block">
                      <strong>{topic.title}</strong>
                      <div className="pill-list">
                        <span className="pill">
                          Next review {new Date(topic.nextReviewAt).toLocaleDateString()}
                        </span>
                        <span className="pill">Mastery {Math.round(topic.score * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {studySchedule.length ? (
                <div className="list">
                  {studySchedule.map((day) => (
                    <div key={day.date} className="note-block">
                      <strong>{day.date}</strong>
                      <div className="pill-list">
                        {day.topics.map((topic) => (
                          <span key={topic.id} className="pill">
                            {topic.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">Add an exam date to generate a study schedule.</p>
              )}
            </div>

            {includeCoach ? (
              <div className="card">
                <div className="section-title">Coach + Live Viva</div>
                <div className="form-row">
                  <label htmlFor="coach-mode">Mode</label>
                  <select
                    id="coach-mode"
                    value={coachMode}
                    onChange={(event) => setCoachMode(event.target.value as CoachMode)}
                  >
                    <option value="coach">Coach</option>
                    <option value="viva">Oral Viva</option>
                    <option value="assist">Assist</option>
                  </select>
                </div>
                <div className="form-row">
                  <label className="option">
                    <input
                      type="checkbox"
                      checked={useWebSocket}
                      onChange={(event) => setUseWebSocket(event.target.checked)}
                    />
                    <span>Use WebSocket (local dev)</span>
                  </label>
                  <label className="option">
                    <input
                      type="checkbox"
                      checked={useLiveApi}
                      onChange={(event) => setUseLiveApi(event.target.checked)}
                      disabled={!useWebSocket}
                    />
                    <span>Use Gemini Live API (WS only)</span>
                  </label>
                  <p className="muted">WS status: {wsStatus}</p>
                </div>
                <p className="kicker">
                  Live session: {coachSessionId ? "Active" : "Not started"}
                </p>
                <div className="list">
                  {coachMessages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className="note-block">
                      <strong>{message.role === "user" ? "You" : "Coach"}</strong>
                      <p>{message.content}</p>
                    </div>
                  ))}
                </div>
                <div className="form-row">
                  <textarea
                    value={coachInput}
                    onChange={(event) => setCoachInput(event.target.value)}
                    placeholder="Ask for a viva question or request clarification"
                  />
                </div>
                <div className="pill-list">
                  <button
                    className="button secondary"
                    onClick={handleCoachSend}
                    disabled={coachBusy}
                  >
                    {coachBusy ? "Thinking..." : "Send to coach"}
                  </button>
                  <button className="button secondary" onClick={handleCoachReset}>
                    Reset session
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
