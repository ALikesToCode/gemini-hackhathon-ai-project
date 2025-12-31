export type Lecture = {
  id: string;
  title: string;
  url: string;
  videoId: string;
  durationSeconds: number;
  order: number;
};

export type TranscriptSegment = {
  start: number;
  duration: number;
  end: number;
  text: string;
  timestamp: string;
};

export type BlueprintTopic = {
  id: string;
  title: string;
  weight: number;
  prerequisites: string[];
  revisionOrder: number;
};

export type Blueprint = {
  title: string;
  topics: BlueprintTopic[];
  revisionOrder: string[];
};

export type Citation = {
  label: string;
  timestamp: string;
  source: string;
  url: string;
  snippet?: string;
};

export type VisualReference = {
  url: string;
  timestamp: string;
  description: string;
};

export type NoteSection = {
  heading: string;
  bullets: string[];
  timestamps: string[];
};

export type NoteDocument = {
  lectureId: string;
  lectureTitle: string;
  lectureUrl: string;
  videoId: string;
  summary: string;
  sections: NoteSection[];
  keyTakeaways: string[];
  citations: Citation[];
  verified: boolean;
  verificationNotes?: string[];
  visuals?: VisualReference[];
};

export type QuestionOption = {
  id: string;
  text: string;
};

export type Question = {
  id: string;
  type: "mcq" | "short" | "true_false";
  difficulty: "easy" | "medium" | "hard";
  bloom: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
  timeSeconds: number;
  tags: string[];
  stem: string;
  options?: QuestionOption[];
  answer: string;
  rationale: string;
  citations: Citation[];
  verified: boolean;
  verificationNotes?: string[];
};

export type ExamSection = {
  title: string;
  questionIds: string[];
  timeMinutes: number;
};

export type Exam = {
  id: string;
  title: string;
  totalTimeMinutes: number;
  sections: ExamSection[];
};

export type Pack = {
  id: string;
  title: string;
  input: string;
  createdAt: string;
  blueprint: Blueprint;
  notes: NoteDocument[];
  questions: Question[];
  exam: Exam;
  mastery: Record<string, MasteryRecord>;
  researchReport?: ResearchReport;
  exports?: ExportLinks;
};

export type JobStatus = {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  step: string;
  progress: number;
  totalLectures: number;
  completedLectures: number;
  packId?: string;
  errors: string[];
  createdAt: string;
  updatedAt: string;
  currentLecture?: string;
};

export type GradeResult = {
  questionId: string;
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  citations: Citation[];
  mastery?: MasteryRecord;
};

export type GeneratePackOptions = {
  examSize: number;
  formats: string[];
  language: string;
  includeResearch: boolean;
  includeCoach: boolean;
  includeAssist: boolean;
  simulateDelayMs: number;
};

export type MasteryRecord = {
  topicId: string;
  score: number;
  streak: number;
  lastSeen: string;
  nextReviewAt: string;
};

export type ResearchSource = {
  title: string;
  url: string;
  excerpt: string;
};

export type ResearchReport = {
  summary: string;
  sources: ResearchSource[];
};

export type ExportLinks = {
  pdf?: string;
  ankiCsv?: string;
  ankiTsv?: string;
};

export type PackSummary = {
  id: string;
  title: string;
  createdAt: string;
  input: string;
};

export type VaultDoc = {
  id: string;
  name: string;
  content: string;
  createdAt: string;
};
