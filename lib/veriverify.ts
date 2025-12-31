import { generateJson } from "./gemini";
import { buildTranscriptText } from "./transcript";
import { NoteDocument, Question, TranscriptSegment } from "./types";

const VERIFY_SCHEMA = {
  type: "object",
  properties: {
    supported: { type: "boolean" },
    issues: { type: "array", items: { type: "string" } }
  },
  required: ["supported", "issues"]
};

export async function verifyNotes(
  note: NoteDocument,
  transcript: TranscriptSegment[],
  apiKey: string,
  model: string
): Promise<NoteDocument> {
  const transcriptText = buildTranscriptText(transcript);
  const prompt = `Check whether the following study notes are supported by the transcript.
If unsupported claims exist, list them briefly in issues.
Transcript:
${transcriptText}
Notes:
Summary: ${note.summary}
Sections:
${note.sections
    .map((section) => `- ${section.heading}: ${section.bullets.join(" | ")}`)
    .join("\n")}
Key takeaways: ${note.keyTakeaways.join(" | ")}
Return JSON matching the schema.`;

  const response = await generateJson<{ supported: boolean; issues: string[] }>({
    apiKey,
    model,
    prompt,
    config: {
      responseSchema: VERIFY_SCHEMA,
      temperature: 0.2,
      maxOutputTokens: 600,
      retry: { maxRetries: 2, baseDelayMs: 500 }
    }
  });

  return {
    ...note,
    verified: response.supported,
    verificationNotes: response.issues
  };
}

export async function verifyQuestion(
  question: Question,
  context: string,
  apiKey: string,
  model: string,
  useCodeExecution = false
): Promise<Question> {
  const heuristicIssues: string[] = [];
  if (question.type === "mcq") {
    if (!question.options || question.options.length < 3) {
      heuristicIssues.push("MCQ has fewer than 3 options.");
    }
    const optionTexts = question.options?.map((option) => option.text.trim()) ?? [];
    const uniqueOptions = new Set(optionTexts.map((option) => option.toLowerCase()));
    if (uniqueOptions.size !== optionTexts.length) {
      heuristicIssues.push("MCQ options include duplicates.");
    }
    if (question.answer && optionTexts.length && !optionTexts.includes(question.answer.trim())) {
      heuristicIssues.push("Answer is not present in the options.");
    }
  }
  if (question.type === "true_false") {
    const normalized = question.answer.trim().toLowerCase();
    if (normalized !== "true" && normalized !== "false") {
      heuristicIssues.push("True/false answer is not 'true' or 'false'.");
    }
  }

  const prompt = `Check whether the answer and rationale are supported by the context.
Also flag ambiguity (more than one correct option) and weak distractors if this is MCQ.
Context:
${context}
Question: ${question.stem}
Answer: ${question.answer}
Rationale: ${question.rationale}
Return JSON matching the schema.`;

  const wantsCodeExecution =
    useCodeExecution &&
    /\d/.test(`${question.stem} ${question.answer} ${question.rationale}`);

  const response = await generateJson<{ supported: boolean; issues: string[] }>({
    apiKey,
    model,
    prompt,
    tools: wantsCodeExecution ? [{ code_execution: {} }] : undefined,
    config: {
      responseSchema: VERIFY_SCHEMA,
      temperature: 0.2,
      maxOutputTokens: 400,
      retry: { maxRetries: 2, baseDelayMs: 500 }
    }
  });

  const issues = [...heuristicIssues, ...(response.issues ?? [])];
  const supported = Boolean(response.supported);
  return {
    ...question,
    verified: supported && heuristicIssues.length === 0,
    verificationNotes: issues
  };
}
