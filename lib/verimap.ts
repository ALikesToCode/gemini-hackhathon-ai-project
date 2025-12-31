import { generateJson } from "./gemini";
import { Blueprint, BlueprintTopic, Lecture, ResearchReport } from "./types";
import { slugify } from "./utils";

const RESEARCH_BLUEPRINT_SCHEMA = {
  type: "object",
  properties: {
    topics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          weight: { type: "number" },
          prerequisites: { type: "array", items: { type: "string" } },
          revisionOrder: { type: "number" }
        },
        required: ["title", "weight", "revisionOrder"]
      }
    }
  },
  required: ["topics"]
};

export function buildBlueprint(courseTitle: string, lectures: Lecture[]): Blueprint {
  const totalSeconds = lectures.reduce(
    (sum, item) => sum + Math.max(1, item.durationSeconds),
    0
  );
  const rawWeights = lectures.map(
    (lecture) => (Math.max(1, lecture.durationSeconds) / totalSeconds) * 100
  );
  const rounded = rawWeights.map((weight) => Math.round(weight));
  const diff = 100 - rounded.reduce((sum, weight) => sum + weight, 0);

  if (diff !== 0) {
    const maxIndex = rawWeights.indexOf(Math.max(...rawWeights));
    rounded[maxIndex] += diff;
  }

  const topics: BlueprintTopic[] = lectures.map((lecture, index) => ({
    id: `topic_${slugify(lecture.title)}_${index + 1}`,
    title: lecture.title,
    weight: rounded[index],
    prerequisites: index === 0 ? [] : [lectures[index - 1].title],
    revisionOrder: index + 1
  }));

  const revisionOrder = topics
    .slice()
    .sort((a, b) => a.revisionOrder - b.revisionOrder)
    .map((topic) => topic.id);

  return {
    title: `${courseTitle} Blueprint`,
    topics,
    revisionOrder
  };
}

function normalizeWeights(topics: BlueprintTopic[]) {
  const total = topics.reduce((sum, topic) => sum + (Number.isFinite(topic.weight) ? topic.weight : 0), 0);
  if (total <= 0) return topics;
  const scaled = topics.map((topic) => ({
    ...topic,
    weight: Math.max(1, Math.round((topic.weight / total) * 100))
  }));
  if (!scaled.length) return scaled;
  const diff = 100 - scaled.reduce((sum, topic) => sum + topic.weight, 0);
  if (diff !== 0) {
    scaled[0] = { ...scaled[0], weight: scaled[0].weight + diff };
  }
  return scaled;
}

function normalizeResearchTopics(rawTopics: Array<{
  title: string;
  weight: number;
  prerequisites?: string[];
  revisionOrder: number;
}>): BlueprintTopic[] {
  const topics = rawTopics
    .map((topic, index) => ({
      id: `topic_${slugify(topic.title)}_${index + 1}`,
      title: topic.title.trim(),
      weight: Number.isFinite(topic.weight) ? topic.weight : 1,
      prerequisites: (topic.prerequisites ?? []).map((entry) => entry.trim()).filter(Boolean),
      revisionOrder: Number.isFinite(topic.revisionOrder) ? topic.revisionOrder : index + 1
    }))
    .filter((topic) => topic.title.length > 0);

  const byTitle = new Map(topics.map((topic) => [topic.title.toLowerCase(), topic.id]));
  const mapped = topics.map((topic) => ({
    ...topic,
    prerequisites: topic.prerequisites
      .map((entry) => byTitle.get(entry.toLowerCase()))
      .filter(Boolean) as string[]
  }));

  const sorted = mapped.slice().sort((a, b) => a.revisionOrder - b.revisionOrder);
  return normalizeWeights(sorted);
}

export async function buildResearchBlueprint(
  courseTitle: string,
  lectures: Lecture[],
  report: ResearchReport,
  apiKey: string,
  model: string
): Promise<Blueprint | null> {
  if (!report?.summary || !report.sources?.length) return null;

  const lectureTitles = lectures.map((lecture) => lecture.title).join(" | ");
  const prompt = `Use the research memo to build a study blueprint for ${courseTitle}.
Lecture titles: ${lectureTitles}
Research summary: ${report.summary}
Sources:\n${report.sources
    .map((source) => `- ${source.title} (${source.url})`)
    .join("\n")}
Return 5-12 topics with weights that sum to ~100, prerequisites by topic title, and revision order (1 = earliest).
Keep topics aligned to the lecture titles when possible. Return JSON matching the schema.`;

  const response = await generateJson<{
    topics: Array<{
      title: string;
      weight: number;
      prerequisites?: string[];
      revisionOrder: number;
    }>;
  }>({
    apiKey,
    model,
    prompt,
    config: {
      responseSchema: RESEARCH_BLUEPRINT_SCHEMA,
      maxOutputTokens: 1200,
      temperature: 0.3,
      retry: { maxRetries: 2, baseDelayMs: 600 }
    }
  });

  if (!response.topics?.length) return null;
  const topics = normalizeResearchTopics(response.topics);
  if (topics.length < 3) return null;

  return {
    title: `${courseTitle} Blueprint`,
    topics,
    revisionOrder: topics.map((topic) => topic.id)
  };
}
