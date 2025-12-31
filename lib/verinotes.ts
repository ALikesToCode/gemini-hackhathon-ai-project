import { generateJson } from "./gemini";
import { buildTranscriptText } from "./transcript";
import {
  Citation,
  Lecture,
  NoteDocument,
  NoteSection,
  TranscriptSegment,
  VisualReference
} from "./types";

const NOTE_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
          timestamps: { type: "array", items: { type: "string" } }
        },
        required: ["heading", "bullets", "timestamps"]
      }
    },
    keyTakeaways: { type: "array", items: { type: "string" } },
    citations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          timestamp: { type: "string" },
          snippet: { type: "string" }
        },
        required: ["label", "timestamp", "snippet"]
      }
    }
  },
  required: ["summary", "sections", "keyTakeaways", "citations"]
};

function timestampToSeconds(timestamp: string) {
  const [min, sec] = timestamp.split(":").map((part) => Number(part));
  if (Number.isNaN(min) || Number.isNaN(sec)) return 0;
  return min * 60 + sec;
}

function toCitation(lecture: Lecture, item: { label: string; timestamp: string; snippet?: string }): Citation {
  const seconds = timestampToSeconds(item.timestamp);
  return {
    label: item.label,
    timestamp: item.timestamp,
    source: lecture.title,
    url: `${lecture.url}&t=${seconds}s`,
    snippet: item.snippet
  };
}

function buildVisuals(
  lecture: Lecture,
  citations: { label: string; timestamp: string; snippet?: string }[]
): VisualReference[] {
  const baseUrl = `https://i.ytimg.com/vi/${lecture.videoId}/hqdefault.jpg`;
  return citations.slice(0, 2).map((item, index) => ({
    url: baseUrl,
    timestamp: item.timestamp,
    description: item.snippet ?? `Keyframe ${index + 1}`
  }));
}

export async function generateNotes(
  lecture: Lecture,
  segments: TranscriptSegment[],
  apiKey: string,
  model: string,
  extraContext?: string
): Promise<NoteDocument> {
  const transcriptText = buildTranscriptText(segments);
  const prompt = `You are producing exam-ready notes for a lecture.
Lecture title: ${lecture.title}
Your job: create a concise summary, 3-5 sections with bullet points, key takeaways, and timestamped citations.
Rules:
- Each section bullet must be supported by the transcript.
- Citations must include a mm:ss timestamp present in the transcript.
- Keep language crisp and study-focused.
Transcript:
${transcriptText}
${extraContext ? `Additional context:\n${extraContext}` : ""}
Return JSON matching the schema.`;

  const response = await generateJson<{
    summary: string;
    sections: NoteSection[];
    keyTakeaways: string[];
    citations: { label: string; timestamp: string; snippet?: string }[];
  }>({
    apiKey,
    model,
    prompt,
    config: {
      responseSchema: NOTE_SCHEMA,
      maxOutputTokens: 1400,
      temperature: 0.4
    }
  });

  const citations = response.citations.map((item) => toCitation(lecture, item));
  const visuals = buildVisuals(lecture, response.citations);

  return {
    lectureId: lecture.id,
    lectureTitle: lecture.title,
    lectureUrl: lecture.url,
    videoId: lecture.videoId,
    summary: response.summary,
    sections: response.sections,
    keyTakeaways: response.keyTakeaways,
    citations,
    verified: false,
    visuals
  };
}
