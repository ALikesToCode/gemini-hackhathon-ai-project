import { buildBlueprint } from "./verimap";
import { generateNotes } from "./verinotes";
import { generateQuestionBank, regenerateQuestion } from "./veribank";
import { verifyNotes, verifyQuestion } from "./veriverify";
import { buildExam } from "./veriexam";
import { fetchTranscriptSegments, buildTranscriptText } from "./transcript";
import {
  buildLecturesFromLines,
  buildLecturesFromPlaylist,
  extractPlaylistId,
  extractVideoId,
  hydrateLectureDurations
} from "./youtube";
import { createMasteryRecord } from "./mastery";
import { delay, makeId } from "./utils";
import {
  deleteDraft,
  getDraft,
  getJob,
  getTranscript,
  getVaultDoc,
  setDraft,
  setJob,
  setPack,
  setTranscript,
  updateJob
} from "./store";
import { buildResearchReport, fetchResearchSources, searchResearchSources } from "./research";
import { buildVisualReferences } from "./storyboard";
import { buildVaultContext } from "./vaultSearch";
import { GeneratePackOptions, JobStatus, Pack, TranscriptSegment } from "./types";

export type PipelineInputs = {
  input: string;
  youtubeApiKey: string;
  geminiApiKey: string;
  models: {
    pro: string;
    flash: string;
  };
  examDate?: string;
  vaultNotes?: string;
  vaultDocIds?: string[];
  researchSources?: string[];
  researchApiKey?: string;
  researchQuery?: string;
  options: GeneratePackOptions;
  resumeJobId?: string;
};

export function normalizeOptions(options?: Partial<GeneratePackOptions>): GeneratePackOptions {
  return {
    examSize: options?.examSize ?? 12,
    formats: options?.formats ?? ["pdf", "csv"],
    language: options?.language ?? "en",
    includeResearch: options?.includeResearch ?? false,
    includeCoach: options?.includeCoach ?? true,
    includeAssist: options?.includeAssist ?? false,
    useCodeExecution: options?.useCodeExecution ?? false,
    simulateDelayMs: options?.simulateDelayMs ?? 150
  };
}

export async function createJob(traceId?: string): Promise<JobStatus> {
  const now = new Date().toISOString();
  const job: JobStatus = {
    id: makeId("job"),
    status: "queued",
    step: "Queued",
    progress: 0,
    totalLectures: 0,
    completedLectures: 0,
    errors: [],
    traceId,
    createdAt: now,
    updatedAt: now
  };

  await setJob(job);
  return job;
}

async function resolveLectures(input: string, youtubeApiKey: string) {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const playlistId = extractPlaylistId(input);
  if (playlistId) {
    return buildLecturesFromPlaylist(youtubeApiKey, playlistId);
  }

  if (lines.length > 1) {
    const parsed = buildLecturesFromLines(lines);
    const hydrated = await hydrateLectureDurations(youtubeApiKey, parsed.lectures);
    return { title: parsed.title, lectures: hydrated };
  }

  const videoId = extractVideoId(lines[0] ?? "");
  if (videoId) {
    const single = buildLecturesFromLines([lines[0] ?? videoId]);
    const hydrated = await hydrateLectureDurations(youtubeApiKey, single.lectures);
    return { title: single.title, lectures: hydrated };
  }

  throw new Error("Could not parse playlist or video input");
}

async function verifyNoteWithRetry(
  note: any,
  transcript: TranscriptSegment[],
  apiKey: string,
  flashModel: string,
  proModel: string,
  extraContext?: string
) {
  const verified = await verifyNotes(note, transcript, apiKey, flashModel);
  if (verified.verified) {
    return verified;
  }

  const retried = await generateNotes(
    {
      id: note.lectureId,
      title: note.lectureTitle,
      url: note.lectureUrl,
      videoId: note.videoId,
      durationSeconds: 0,
      order: 0
    },
    transcript,
    apiKey,
    proModel,
    extraContext
  );

  return verifyNotes(retried, transcript, apiKey, flashModel);
}

export async function runPackPipeline(jobId: string, inputs: PipelineInputs) {
  const job = await getJob(jobId);
  if (!job) return;
  let jobErrors = job.errors ?? [];

  try {
    await updateJob(jobId, {
      status: "processing",
      step: "Mapping playlist",
      progress: 0.05
    });

    const { title, lectures } = await resolveLectures(
      inputs.input,
      inputs.youtubeApiKey
    );

    let resumeNotesMap = new Map<string, Pack["notes"][number]>();
    if (inputs.resumeJobId) {
      const draft = await getDraft(inputs.resumeJobId);
      if (draft && draft.input === inputs.input) {
        resumeNotesMap = new Map(draft.notes.map((note) => [note.lectureId, note]));
      }
      await deleteDraft(inputs.resumeJobId);
    }

    await updateJob(jobId, {
      totalLectures: lectures.length,
      completedLectures: 0,
      currentLecture: undefined,
      progress: 0.1
    });

    const blueprint = buildBlueprint(title, lectures);
    let researchReport;

    if (inputs.options.includeResearch) {
      await updateJob(jobId, {
        step: "Building research blueprint",
        progress: 0.15
      });

      try {
        let sources = [] as Awaited<ReturnType<typeof fetchResearchSources>>;
        if (inputs.researchSources?.length) {
          sources = await fetchResearchSources(inputs.researchSources);
        } else if (inputs.researchApiKey) {
          const query = inputs.researchQuery ?? `${title} syllabus past paper topics`;
          const searchResults = await searchResearchSources(query, inputs.researchApiKey, 5);
          const urls = searchResults.map((result) => result.url);
          sources = await fetchResearchSources(urls, searchResults);
        }

        if (sources.length) {
          researchReport = await buildResearchReport(
            title,
            sources,
            inputs.geminiApiKey,
            inputs.models.pro
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Research failed";
        jobErrors = [...jobErrors, `Research error: ${message}`];
        await updateJob(jobId, { errors: jobErrors });
      }
    }

    await updateJob(jobId, {
      step: "Generating evidence-backed notes",
      progress: 0.2
    });

    const notes = [] as Pack["notes"];
    const transcripts: Record<string, TranscriptSegment[]> = {};
    const vaultDocs = inputs.vaultDocIds?.length
      ? (await Promise.all(inputs.vaultDocIds.map((id) => getVaultDoc(id)))).filter(Boolean)
      : [];
    const baseContextParts = [
      inputs.vaultNotes,
      inputs.examDate ? `Exam date: ${inputs.examDate}` : ""
    ].filter(Boolean);
    const globalVaultContext = buildVaultContext(title, vaultDocs);
    const globalContext = [...baseContextParts, globalVaultContext]
      .filter(Boolean)
      .join("\n")
      .slice(0, 20000);

    for (let index = 0; index < lectures.length; index += 1) {
      const lecture = lectures[index];
      try {
        const cachedNote = resumeNotesMap.get(lecture.id);
        if (cachedNote) {
          notes.push(cachedNote);
          await updateJob(jobId, {
            completedLectures: index + 1,
            progress: 0.2 + ((index + 1) / lectures.length) * 0.4
          });
          await setDraft({
            jobId,
            input: inputs.input,
            notes,
            updatedAt: new Date().toISOString()
          });
          continue;
        }

        await updateJob(jobId, {
          currentLecture: lecture.title,
          step: `Transcribing ${lecture.title}`
        });

        const cached = await getTranscript(lecture.videoId);
        const segments =
          cached ??
          (await fetchTranscriptSegments(lecture.videoId, inputs.options.language));
        transcripts[lecture.id] = segments;
        if (!cached) {
          await setTranscript(lecture.videoId, segments);
        }

        await updateJob(jobId, {
          step: `Generating notes for ${lecture.title}`
        });

        const lectureVaultContext = buildVaultContext(lecture.title, vaultDocs);
        const lectureContext = [...baseContextParts, lectureVaultContext]
          .filter(Boolean)
          .join("\n")
          .slice(0, 20000);

        const note = await generateNotes(
          lecture,
          segments,
          inputs.geminiApiKey,
          inputs.models.pro,
          lectureContext
        );

        const verified = await verifyNoteWithRetry(
          note,
          segments,
          inputs.geminiApiKey,
          inputs.models.flash,
          inputs.models.pro,
          lectureContext
        );

        let visuals = [] as Pack["notes"][number]["visuals"];
        try {
          visuals = await buildVisualReferences(lecture, verified.citations);
        } catch {
          visuals = [];
        }
        notes.push({ ...verified, visuals });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        jobErrors = [...jobErrors, `Lecture ${lecture.title} failed: ${message}`];
        await updateJob(jobId, {
          errors: jobErrors,
          step: `Skipped ${lecture.title}`
        });
        notes.push({
          lectureId: lecture.id,
          lectureTitle: lecture.title,
          lectureUrl: lecture.url,
          videoId: lecture.videoId,
          summary: "Transcript unavailable or generation failed.",
          sections: [],
          keyTakeaways: [],
          citations: [],
          verified: false,
          verificationNotes: [message]
        });
      }

      await updateJob(jobId, {
        completedLectures: index + 1,
        progress: 0.2 + ((index + 1) / lectures.length) * 0.4
      });
      await setDraft({
        jobId,
        input: inputs.input,
        notes,
        updatedAt: new Date().toISOString()
      });
      await delay(inputs.options.simulateDelayMs);
    }

    await updateJob(jobId, {
      step: "Building question bank",
      progress: 0.65
    });

    const questions = await generateQuestionBank(
      notes,
      inputs.geminiApiKey,
      inputs.models.pro,
      4,
      globalContext
    );

    await updateJob(jobId, {
      step: "Verifying questions",
      progress: 0.72
    });

    const transcriptContext = notes
      .map((note) => buildTranscriptText(transcripts[note.lectureId] ?? []))
      .join("\n");

    const verifiedQuestions: Pack["questions"] = [];
    for (const question of questions) {
      let current = question;
      let verified = await verifyQuestion(
        current,
        transcriptContext,
        inputs.geminiApiKey,
        inputs.models.flash,
        inputs.options.useCodeExecution
      );

      if (!verified.verified) {
        const noteMatch = notes.find((note) =>
          current.tags.some(
            (tag) => tag === note.lectureTitle || tag === note.lectureId
          )
        );
        if (noteMatch) {
          for (let attempt = 0; attempt < 2; attempt += 1) {
            const issues = verified.verificationNotes?.join(" | ") ?? "Unsupported answer";
            current = await regenerateQuestion(
              noteMatch,
              inputs.geminiApiKey,
              inputs.models.pro,
              issues,
              globalContext,
              current.id
            );
            verified = await verifyQuestion(
              current,
              transcriptContext,
              inputs.geminiApiKey,
              inputs.models.flash,
              inputs.options.useCodeExecution
            );
            if (verified.verified) {
              break;
            }
          }
        }
      }

      verifiedQuestions.push(verified);
    }

    const coverage = new Map<string, number>();
    verifiedQuestions.forEach((question) => {
      blueprint.topics.forEach((topic) => {
        if (
          question.tags.includes(topic.title) ||
          question.tags.includes(topic.id)
        ) {
          coverage.set(topic.id, (coverage.get(topic.id) ?? 0) + 1);
        }
      });
    });

    const missingTopics = blueprint.topics.filter(
      (topic) => !coverage.has(topic.id)
    );
    for (const topic of missingTopics) {
      const noteMatch = notes.find((note) => note.lectureTitle === topic.title);
      if (!noteMatch) continue;
      const extraQuestions = await generateQuestionBank(
        [noteMatch],
        inputs.geminiApiKey,
        inputs.models.pro,
        1,
        globalContext
      );
      for (const question of extraQuestions) {
        const verified = await verifyQuestion(
          question,
          transcriptContext,
          inputs.geminiApiKey,
          inputs.models.flash,
          inputs.options.useCodeExecution
        );
        verifiedQuestions.push(verified);
      }
    }

    await updateJob(jobId, {
      step: "Assembling mock exam",
      progress: 0.78
    });

    const exam = buildExam(
      verifiedQuestions,
      inputs.options.examSize,
      `${title} Mock Exam`
    );

    const mastery: Pack["mastery"] = {};
    blueprint.topics.forEach((topic) => {
      mastery[topic.id] = createMasteryRecord(topic.id);
    });

    const packId = makeId("pack");
    const pack: Pack = {
      id: packId,
      title: `${title} Exam Pack`,
      input: inputs.input,
      createdAt: new Date().toISOString(),
      blueprint,
      notes,
      questions: verifiedQuestions,
      exam,
      mastery,
      researchReport,
      exports: {}
    };

    await setPack(pack);
    await deleteDraft(jobId);
    await updateJob(jobId, {
      status: "completed",
      step: "Ready",
      progress: 1,
      packId,
      currentLecture: undefined
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await updateJob(jobId, {
      status: "failed",
      step: "Failed",
      errors: [...jobErrors, message]
    });
  }
}
