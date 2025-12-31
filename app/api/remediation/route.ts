import { NextResponse } from "next/server";
import { remediationSchema } from "../../../lib/schemas";
import { generateText } from "../../../lib/gemini";
import { getPack } from "../../../lib/store";
import { RemediationItem } from "../../../lib/types";
import { makeId } from "../../../lib/utils";

function matchTopicId(titleOrId: string, topics: { id: string; title: string }[]) {
  const normalized = titleOrId.trim().toLowerCase();
  return (
    topics.find((topic) => topic.id.toLowerCase() === normalized)?.id ??
    topics.find((topic) => topic.title.toLowerCase() === normalized)?.id
  );
}

export async function POST(request: Request) {
  const traceId = makeId("trace");
  const json = (body: unknown, init?: ResponseInit) => {
    const response = NextResponse.json(body, init);
    response.headers.set("x-request-id", traceId);
    return response;
  };

  const body = await request.json().catch(() => null);
  const parsed = remediationSchema.safeParse(body);

  if (!parsed.success) {
    return json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const pack = await getPack(parsed.data.packId);
  if (!pack) {
    return json({ error: "Pack not found" }, { status: 404 });
  }

  const maxTopics = parsed.data.maxTopics ?? 5;
  const topics = pack.blueprint.topics;
  const topicIds = new Set<string>();

  if (parsed.data.topics?.length) {
    parsed.data.topics.forEach((topic) => {
      const id = matchTopicId(topic, topics);
      if (id) topicIds.add(id);
    });
  }

  const incorrectIds = parsed.data.incorrectQuestionIds ?? [];
  const questionMap = new Map(pack.questions.map((question) => [question.id, question]));
  incorrectIds.forEach((id) => {
    const question = questionMap.get(id);
    if (!question) return;
    const matched = topics.find((topic) =>
      question.tags.some(
        (tag) =>
          tag.toLowerCase() === topic.title.toLowerCase() ||
          tag.toLowerCase() === topic.id.toLowerCase()
      )
    );
    if (matched) topicIds.add(matched.id);
  });

  if (!topicIds.size) {
    topics
      .map((topic) => ({
        id: topic.id,
        score: pack.mastery[topic.id]?.score ?? 0
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, maxTopics)
      .forEach((topic) => topicIds.add(topic.id));
  }

  const selectedTopics = topics.filter((topic) => topicIds.has(topic.id)).slice(0, maxTopics);
  const remediation: RemediationItem[] = [];

  for (const topic of selectedTopics) {
    const relatedQuestions = pack.questions.filter((question) =>
      question.tags.some(
        (tag) =>
          tag.toLowerCase() === topic.title.toLowerCase() ||
          tag.toLowerCase() === topic.id.toLowerCase()
      )
    );
    const relatedNotes = pack.notes.filter(
      (note) => note.lectureTitle.toLowerCase() === topic.title.toLowerCase()
    );
    const citations = [
      ...relatedQuestions.flatMap((question) => question.citations).slice(0, 2),
      ...relatedNotes.flatMap((note) => note.citations).slice(0, 2)
    ];

    const fallbackAdvice = [
      `Review ${topic.title} with the lecture notes and key takeaways.`,
      relatedNotes[0]?.summary ? `Summary: ${relatedNotes[0].summary}` : "",
      relatedNotes[0]?.keyTakeaways?.length
        ? `Key takeaways: ${relatedNotes[0].keyTakeaways.slice(0, 4).join(" - ")}`
        : ""
    ]
      .filter(Boolean)
      .join(" ");

    let advice = fallbackAdvice;

    if (parsed.data.geminiApiKey && parsed.data.model) {
      const prompt = `Create 3 concise remediation steps for the topic "${topic.title}".
Use the notes summary and question stems to focus practice.
Notes summary: ${relatedNotes[0]?.summary ?? "No summary available."}
Key takeaways: ${relatedNotes[0]?.keyTakeaways?.join(" | ") ?? "None"}
Question stems: ${relatedQuestions.map((question) => question.stem).slice(0, 4).join(" | ")}
Keep it under 90 words.`;
      try {
        const response = await generateText({
          apiKey: parsed.data.geminiApiKey,
          model: parsed.data.model,
          prompt,
          config: {
            temperature: 0.4,
            maxOutputTokens: 200,
            retry: { maxRetries: 2, baseDelayMs: 500 }
          }
        });
        if (response.trim()) {
          advice = response.trim();
        }
      } catch {
        advice = fallbackAdvice;
      }
    }

    remediation.push({
      topicId: topic.id,
      topicTitle: topic.title,
      advice,
      questionIds: relatedQuestions.map((question) => question.id),
      citations
    });
  }

  return json({ packId: pack.id, remediation });
}
