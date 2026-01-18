"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  GradeResult,
  JobStatus,
  Pack,
  PackSummary,
  RemediationItem
} from "../lib/types";
import { buildCoachSystem } from "../lib/coach";

// Components
import { Hero } from "../components/features/Hero";
import { ConfigForm } from "../components/features/ConfigForm";
import { JobProgress } from "../components/features/JobProgress";
import { PackViewer } from "../components/features/PackViewer";
import { PackList } from "../components/features/PackList";

const DEFAULT_INPUT = "https://youtube.com/playlist?list=PL123_VERILEARN";
const DEFAULT_PRO_MODEL = "gemini-3-pro-preview";
const DEFAULT_FLASH_MODEL = "gemini-3-flash-preview";
const DEFAULT_LIVE_MODEL = "gemini-live-2.5-flash-preview";

const STORAGE_KEYS = {
  youtube: "verilearn_youtube_key",
  gemini: "verilearn_gemini_key",
  pro: "verilearn_model_pro",
  flash: "verilearn_model_flash",
  research: "verilearn_research_key",
  researchQuery: "verilearn_research_query",
  browserUse: "verilearn_browser_use_key"
};

type CoachMessage = { role: "user" | "assistant"; content: string };
type CoachMode = "coach" | "viva" | "assist";

export default function Home() {
  // --- State Management ---
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [examSize, setExamSize] = useState(12);
  const [language, setLanguage] = useState("en");
  const [examDate, setExamDate] = useState("");

  // View Modes
  const [viewMode, setViewMode] = useState<"landing" | "dashboard">("landing");
  const [dashboardTab, setDashboardTab] = useState<"create" | "library">("create");

  // Vault / Files (Kept minimal for now as per refactor plan focusing on core flow)
  const [vaultNotes, setVaultNotes] = useState("");
  const [vaultFiles, setVaultFiles] = useState<File[]>([]);
  const [vaultDocs, setVaultDocs] = useState<Array<{ id: string; name: string; chars: number }>>([]);

  // Research
  const [researchSources, setResearchSources] = useState("");
  const [researchApiKey, setResearchApiKey] = useState<string>("");
  const [researchQuery, setResearchQuery] = useState("");
  const [includeResearch, setIncludeResearch] = useState(false);
  const [useDeepResearch, setUseDeepResearch] = useState(false);
  const [useVideoUnderstanding, setUseVideoUnderstanding] = useState(false);

  // Toggles
  const [includeCoach, setIncludeCoach] = useState(true);
  const [includeAssist, setIncludeAssist] = useState(false);
  const [useCodeExecution, setUseCodeExecution] = useState(false);
  const [useFileSearch, setUseFileSearch] = useState(false);
  const [useInteractions, setUseInteractions] = useState(false);
  const [useBrowserUse, setUseBrowserUse] = useState(false);

  // Keys & Models
  const [youtubeApiKey, setYoutubeApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [browserUseApiKey, setBrowserUseApiKey] = useState("");
  const [proModel, setProModel] = useState(DEFAULT_PRO_MODEL);
  const [flashModel, setFlashModel] = useState(DEFAULT_FLASH_MODEL);
  const [resumeJobId, setResumeJobId] = useState("");

  // Job & Pack State
  const [job, setJob] = useState<JobStatus | null>(null);
  const [pack, setPack] = useState<Pack | null>(null);
  const [packList, setPackList] = useState<PackSummary[]>([]);
  const [packListLoading, setPackListLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exam State
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examResults, setExamResults] = useState<Record<string, GradeResult>>({});
  const [examStarted, setExamStarted] = useState(false);
  const [examTimeLeft, setExamTimeLeft] = useState<number | null>(null);

  // Remediation
  const [remediation, setRemediation] = useState<RemediationItem[] | null>(null);
  const [remediationLoading, setRemediationLoading] = useState(false);

  // Coach State
  const [coachMode, setCoachMode] = useState<CoachMode>("coach");
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [coachBusy, setCoachBusy] = useState(false);
  const [coachSessionId, setCoachSessionId] = useState<string | null>(null);
  const [useLiveApi, setUseLiveApi] = useState(false);
  const liveSessionRef = useRef<any>(null);
  const liveBufferRef = useRef<string>("");
  const liveModelRef = useRef(DEFAULT_LIVE_MODEL);
  const liveSystemRef = useRef<string>("");
  const [vaultUploadBusy, setVaultUploadBusy] = useState(false);

  // --- Effects ---

  // Load from LocalStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    setYoutubeApiKey(localStorage.getItem(STORAGE_KEYS.youtube) ?? "");
    setGeminiApiKey(localStorage.getItem(STORAGE_KEYS.gemini) ?? "");
    setProModel(localStorage.getItem(STORAGE_KEYS.pro) ?? DEFAULT_PRO_MODEL);
    setFlashModel(localStorage.getItem(STORAGE_KEYS.flash) ?? DEFAULT_FLASH_MODEL);
    setResearchApiKey(localStorage.getItem(STORAGE_KEYS.research) ?? "");
    setResearchQuery(localStorage.getItem(STORAGE_KEYS.researchQuery) ?? "");
    setBrowserUseApiKey(localStorage.getItem(STORAGE_KEYS.browserUse) ?? "");
  }, []);

  // Sync to LocalStorage
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEYS.youtube, youtubeApiKey); }, [youtubeApiKey]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEYS.gemini, geminiApiKey); }, [geminiApiKey]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEYS.pro, proModel); }, [proModel]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEYS.flash, flashModel); }, [flashModel]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEYS.research, researchApiKey); }, [researchApiKey]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEYS.researchQuery, researchQuery); }, [researchQuery]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEYS.browserUse, browserUseApiKey); }, [browserUseApiKey]);

  useEffect(() => {
    if (!browserUseApiKey) {
      setUseBrowserUse(false);
    }
  }, [browserUseApiKey]);

  useEffect(() => {
    if (coachMode !== "assist") {
      setUseBrowserUse(false);
    }
  }, [coachMode]);

  useEffect(() => {
    if (!includeResearch) {
      setUseDeepResearch(false);
    }
  }, [includeResearch]);
  // ... (Other keys can be synced similarly if needed, keeping it concise)

  const loadPacks = useCallback(async () => {
    setPackListLoading(true);
    try {
      const response = await fetch("/api/packs");
      if (!response.ok) throw new Error("Failed to load packs");
      const data = await response.json();
      setPackList(data.packs ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setPackListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPacks();
  }, [loadPacks]);

  const disconnectLiveSession = useCallback(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }
    liveBufferRef.current = "";
    setCoachBusy(false);
  }, []);

  const resetPackView = useCallback(() => {
    setPack(null);
    setJob(null);
    setExamAnswers({});
    setExamResults({});
    setExamStarted(false);
    setExamTimeLeft(null);
    setRemediation(null);
    setRemediationLoading(false);
    setCoachMessages([]);
    setCoachSessionId(null);
    setUseLiveApi(false);
    disconnectLiveSession();
  }, [disconnectLiveSession]);

  useEffect(() => {
    if (!useLiveApi) {
      disconnectLiveSession();
    }
  }, [useLiveApi, disconnectLiveSession]);

  useEffect(() => {
    if (!geminiApiKey) {
      setUseLiveApi(false);
      disconnectLiveSession();
    }
  }, [geminiApiKey, disconnectLiveSession]);

  useEffect(() => {
    return () => {
      disconnectLiveSession();
    };
  }, [disconnectLiveSession]);

  // Job Polling
  useEffect(() => {
    if (!job?.id || job.status === "completed" || job.status === "failed") return;

    let active = true;
    let interval: ReturnType<typeof setInterval> | null = null;
    let eventSource: EventSource | null = null;

    const handleUpdate = async (data: JobStatus) => {
      if (!active) return;
      setJob(data);
      if (data.status === "completed" && data.packId) {
        const packResponse = await fetch(`/api/study-pack/${data.packId}`);
        if (packResponse.ok) {
          const packData = (await packResponse.json()) as Pack;
          setPack(packData);
          setJob(null);
          loadPacks();
        }
      }
      if (data.status === "completed" || data.status === "failed") {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    };

    const pollStatus = async () => {
      const response = await fetch(`/api/status/${job.id}`);
      if (!response.ok) return;
      handleUpdate(await response.json());
    };

    const startPolling = () => {
      if (!interval) {
        interval = setInterval(pollStatus, 2000);
      }
    };

    if (typeof window !== "undefined" && "EventSource" in window) {
      eventSource = new EventSource(`/api/status/stream/${job.id}`);
      eventSource.onmessage = (event) => {
        try {
          handleUpdate(JSON.parse(event.data) as JobStatus);
        } catch (err) {
          console.error(err);
        }
      };
      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        startPolling();
      };
    } else {
      startPolling();
    }

    return () => {
      active = false;
      if (eventSource) eventSource.close();
      if (interval) clearInterval(interval);
    };
  }, [job?.id, loadPacks]);

  // Timer
  useEffect(() => {
    if (!examStarted || !pack) return;
    setExamTimeLeft(pack.exam.totalTimeMinutes * 60);
    const timer = setInterval(() => {
      setExamTimeLeft((prev) => {
        if (prev === null || prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted, pack]);

  useEffect(() => {
    setCoachSessionId(null);
    setCoachMessages([]);
    setUseLiveApi(false);
    disconnectLiveSession();
  }, [coachMode, disconnectLiveSession]);

  // --- Handlers ---

  const handleLiveMessage = useCallback(
    (message: any) => {
      if (message?.serverContent?.interrupted) {
        liveBufferRef.current = "";
        return;
      }

      const parts = message?.serverContent?.modelTurn?.parts ?? [];
      const chunk = parts.map((part: any) => part.text ?? "").join("");
      if (chunk) {
        liveBufferRef.current += chunk;
        setCoachMessages((prev) => {
          if (!prev.length) return prev;
          const next = [...prev];
          const lastIndex = next.length - 1;
          if (next[lastIndex]?.role === "assistant") {
            next[lastIndex] = { role: "assistant", content: liveBufferRef.current };
          }
          return next;
        });
      }

      if (message?.serverContent?.turnComplete) {
        setCoachBusy(false);
      }
    },
    [setCoachMessages]
  );

  const ensureLiveSession = useCallback(
    async (systemInstruction: string) => {
      if (!geminiApiKey) {
        throw new Error("Missing Gemini API key.");
      }

      if (
        liveSessionRef.current &&
        liveSystemRef.current === systemInstruction
      ) {
        return liveSessionRef.current;
      }

      disconnectLiveSession();
      liveSystemRef.current = systemInstruction;

      const tokenResponse = await fetch("/api/live-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geminiApiKey,
          model: liveModelRef.current,
          responseModalities: ["TEXT"]
        })
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to provision live token.");
      }

      const tokenData = await tokenResponse.json();
      const token = tokenData?.token;
      if (!token) {
        throw new Error("Live token missing.");
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: token, apiVersion: "v1alpha" });

      const session = await ai.live.connect({
        model: liveModelRef.current,
        config: {
          responseModalities: ["TEXT" as any],
          systemInstruction,
          sessionResumption: {}
        },
        callbacks: {
          onmessage: handleLiveMessage,
          onerror: () => {
            disconnectLiveSession();
          },
          onclose: () => {
            disconnectLiveSession();
          }
        }
      });

      liveSessionRef.current = session;
      return session;
    },
    [geminiApiKey, handleLiveMessage, disconnectLiveSession]
  );

  const handleVaultUpload = async () => {
    if (!vaultFiles.length) return;
    setVaultUploadBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      vaultFiles.forEach((file) => formData.append("files", file));
      const response = await fetch("/api/vault", {
        method: "POST",
        body: formData
      });
      if (!response.ok) throw new Error("Vault upload failed");
      const data = await response.json();
      setVaultDocs((prev) => [...prev, ...(data.docs ?? [])]);
      setVaultFiles([]);
    } catch (err) {
      setError("Vault upload failed. Please try again.");
    } finally {
      setVaultUploadBusy(false);
    }
  };

  const handleOpenPack = async (packId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/study-pack/${packId}`);
      if (!response.ok) throw new Error("Failed to load pack");
      const packData = (await response.json()) as Pack;
      resetPackView();
      setPack(packData);
    } catch (err) {
      console.error(err);
      setError("Failed to load saved pack.");
    }
  };

  const handleDeletePack = async (packId: string) => {
    try {
      if (typeof window !== "undefined") {
        const ok = window.confirm("Delete this saved pack? This cannot be undone.");
        if (!ok) return;
      }
      const response = await fetch(`/api/study-pack/${packId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete pack");

      if (pack?.id === packId) {
        setPack(null); // Just clear pack, don't reset everything else
      }
      await loadPacks();
    } catch (err) {
      console.error(err);
      setError("Failed to delete the pack.");
    }
  };

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError("Please provide a playlist or video URL.");
      return;
    }
    if (!youtubeApiKey || !geminiApiKey) {
      setError("Please provide both YouTube and Gemini API keys.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    // Don't reset view, just start job
    setPack(null);

    try {
      const researchUrls = researchSources
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const response = await fetch("/api/generate-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input, youtubeApiKey, geminiApiKey,
          models: { pro: proModel, flash: flashModel },
          examDate: examDate || undefined,
          vaultNotes: vaultNotes || undefined,
          vaultDocIds: vaultDocs.map((doc) => doc.id),
          researchSources: researchUrls.length ? researchUrls : undefined,
          researchApiKey: researchApiKey || undefined,
          researchQuery: researchQuery || undefined,
          resumeJobId: resumeJobId || undefined,
          options: {
            examSize,
            language,
            includeCoach,
            includeResearch,
            includeAssist,
            useDeepResearch,
            useVideoUnderstanding,
            useFileSearch,
            useCodeExecution,
            useInteractions
          }
        })
      });

      if (!response.ok) throw new Error("Failed to start generation");
      const data = await response.json();

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

    } catch (err) {
      setError("Failed to start generation. Please check your keys and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render ---

  if (viewMode === "landing") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
        <Hero
          onStart={() => setViewMode("dashboard")}
          isLoading={false}
        />
      </main>
    );
  }

  // Dashboard View
  return (
    <main className="h-screen w-full flex overflow-hidden bg-[#0f172a] text-slate-200">

      {/* Sidebar */}
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-slate-900/40 backdrop-blur-xl flex flex-col z-50">
        <div className="p-8">
          <h1 className="text-2xl font-serif text-white tracking-tight">
            VeriLearn <span className="text-amber-400">.</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => { setPack(null); setJob(null); setDashboardTab("create"); }}
            className={`w-full text-left px-5 py-3.5 rounded-xl transition-all font-medium flex items-center gap-3 relative overflow-hidden group
                ${!pack && !job && dashboardTab === "create"
                ? "bg-white/5 text-amber-50 shadow-[0_0_20px_-5px_rgba(251,191,36,0.1)] border border-white/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"}`}
          >
            {(!pack && !job && dashboardTab === "create") && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_10px_2px_rgba(251,191,36,0.5)]" />
            )}
            <span className="relative z-10">Create Pack</span>
          </button>

          <button
            onClick={() => {
              setPack(null);
              setJob(null);
              setDashboardTab("library");
              loadPacks();
            }}
            className={`w-full text-left px-5 py-3.5 rounded-xl transition-all font-medium flex items-center gap-3 relative overflow-hidden group
              ${!pack && !job && dashboardTab === "library"
                ? "bg-white/5 text-amber-50 shadow-[0_0_20px_-5px_rgba(251,191,36,0.1)] border border-white/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"}`}
          >
            {(!pack && !job && dashboardTab === "library") && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_10px_2px_rgba(251,191,36,0.5)]" />
            )}
            <span className="relative z-10">My Library</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${geminiApiKey ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-slate-600"}`} />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {geminiApiKey ? "System Online" : "Configuration Required"}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md z-10 shrink-0">
          <h2 className="text-lg font-medium text-white">
            {pack ? (pack.blueprint.title || "Viewing Pack") : (
              job ? "Generating Pack..." : (
                dashboardTab === "create" ? "Flash Configuration" : "Pack Library"
              )
            )}
          </h2>
          {pack && (
            <button onClick={resetPackView} className="text-sm text-slate-400 hover:text-white transition-colors">
              Close Viewer
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
          <div className="max-w-5xl mx-auto pb-20">

            {/* CONTENT AREA */}
            {pack ? (
              <PackViewer
                key={pack.id}
                pack={pack}
                examStarted={examStarted}
                setExamStarted={setExamStarted}
                examTimeLeft={examTimeLeft}
                examAnswers={examAnswers}
                setExamAnswers={setExamAnswers}
                examResults={examResults}
                onAnswerCheck={handleAnswerCheck}
                remediation={remediation}
                onRemediationRequest={handleRemediation}
                remediationLoading={remediationLoading}
                coachMessages={coachMessages}
                onCoachSend={handleCoachSend}
                coachBusy={coachBusy}
                coachMode={coachMode}
                setCoachMode={setCoachMode}
                useLiveApi={useLiveApi}
                setUseLiveApi={setUseLiveApi}
                liveReady={Boolean(geminiApiKey)}
                useBrowserUse={useBrowserUse}
                setUseBrowserUse={setUseBrowserUse}
                browserUseReady={Boolean(browserUseApiKey)}
                onDownloadPdf={downloadPdf}
                onBack={resetPackView}
              />
            ) : job ? (
              <JobProgress job={job} />
            ) : dashboardTab === "create" ? (
              <ConfigForm
                input={input} setInput={setInput}
                examSize={examSize} setExamSize={setExamSize}
                language={language} setLanguage={setLanguage}
                examDate={examDate} setExamDate={setExamDate}
                geminiApiKey={geminiApiKey} setGeminiApiKey={setGeminiApiKey}
                youtubeApiKey={youtubeApiKey} setYoutubeApiKey={setYoutubeApiKey}
                proModel={proModel} setProModel={setProModel}
                flashModel={flashModel} setFlashModel={setFlashModel}
                resumeJobId={resumeJobId} setResumeJobId={setResumeJobId}
                researchSources={researchSources} setResearchSources={setResearchSources}
                includeResearch={includeResearch} setIncludeResearch={setIncludeResearch}
                researchApiKey={researchApiKey} setResearchApiKey={setResearchApiKey}
                researchQuery={researchQuery} setResearchQuery={setResearchQuery}
                useDeepResearch={useDeepResearch} setUseDeepResearch={setUseDeepResearch}
                useVideoUnderstanding={useVideoUnderstanding} setUseVideoUnderstanding={setUseVideoUnderstanding}
                useFileSearch={useFileSearch} setUseFileSearch={setUseFileSearch}
                useCodeExecution={useCodeExecution} setUseCodeExecution={setUseCodeExecution}
                useInteractions={useInteractions} setUseInteractions={setUseInteractions}
                vaultNotes={vaultNotes} setVaultNotes={setVaultNotes}
                vaultFiles={vaultFiles} setVaultFiles={setVaultFiles}
                vaultDocs={vaultDocs}
                onVaultUpload={handleVaultUpload}
                vaultUploadBusy={vaultUploadBusy}
                browserUseApiKey={browserUseApiKey} setBrowserUseApiKey={setBrowserUseApiKey}
                onGenerate={handleGenerate}
                isSubmitting={isSubmitting}
                error={error}
              />
            ) : (
              <PackList
                packs={packList}
                isLoading={packListLoading}
                onOpen={handleOpenPack}
                onDelete={handleDeletePack}
                onRefresh={loadPacks}
              />
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
