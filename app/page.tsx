"use client";

import { useEffect, useMemo, useState } from "react";
import type { GradeResult, JobStatus, Pack, Question } from "../lib/types";

const DEFAULT_INPUT = "https://youtube.com/playlist?list=PL123_VERILEARN";
const DEFAULT_PRO_MODEL = "gemini-1.5-pro";
const DEFAULT_FLASH_MODEL = "gemini-1.5-flash";

const STORAGE_KEYS = {
  youtube: "verilearn_youtube_key",
  gemini: "verilearn_gemini_key",
  pro: "verilearn_model_pro",
  flash: "verilearn_model_flash"
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
  const [includeResearch, setIncludeResearch] = useState(false);
  const [includeCoach, setIncludeCoach] = useState(true);
  const [includeAssist, setIncludeAssist] = useState(false);

  const [youtubeApiKey, setYoutubeApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [proModel, setProModel] = useState(DEFAULT_PRO_MODEL);
  const [flashModel, setFlashModel] = useState(DEFAULT_FLASH_MODEL);

  const [job, setJob] = useState<JobStatus | null>(null);
  const [pack, setPack] = useState<Pack | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examResults, setExamResults] = useState<Record<string, GradeResult>>({});
  const [examStarted, setExamStarted] = useState(false);
  const [examTimeLeft, setExamTimeLeft] = useState<number | null>(null);

  const [coachMode, setCoachMode] = useState<CoachMode>("coach");
  const [coachInput, setCoachInput] = useState("");
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [coachBusy, setCoachBusy] = useState(false);

  const progressPercent = job ? Math.round(job.progress * 100) : 0;

  useEffect(() => {
    if (typeof window === "undefined") return;
    setYoutubeApiKey(localStorage.getItem(STORAGE_KEYS.youtube) ?? "");
    setGeminiApiKey(localStorage.getItem(STORAGE_KEYS.gemini) ?? "");
    setProModel(localStorage.getItem(STORAGE_KEYS.pro) ?? DEFAULT_PRO_MODEL);
    setFlashModel(localStorage.getItem(STORAGE_KEYS.flash) ?? DEFAULT_FLASH_MODEL);
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
    if (!job || job.status === "completed" || job.status === "failed") {
      return;
    }

    const interval = setInterval(async () => {
      const response = await fetch(`/api/status/${job.id}`);
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as JobStatus;
      setJob(data);

      if (data.status === "completed" && data.packId) {
        const packResponse = await fetch(`/api/study-pack/${data.packId}`);
        if (packResponse.ok) {
          const packData = (await packResponse.json()) as Pack;
          setPack(packData);
        }
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [job]);

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
        options: {
          examSize,
          language,
          includeResearch,
          includeCoach,
          includeAssist
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

  const downloadPdf = () => {
    if (!pack) return;
    window.open(`/api/export/pdf?packId=${pack.id}`, "_blank");
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

    const response = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packId: pack.id,
        message,
        history,
        mode: coachMode,
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
                          <img src={visual.url} alt={visual.description} />
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
                <button
                  className="button secondary"
                  onClick={handleCoachSend}
                  disabled={coachBusy}
                >
                  {coachBusy ? "Thinking..." : "Send to coach"}
                </button>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
