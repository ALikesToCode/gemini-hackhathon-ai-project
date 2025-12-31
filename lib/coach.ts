import { Pack } from "./types";

export function summarizePack(pack: Pack) {
  const topics = pack.blueprint.topics
    .map((topic) => `${topic.title} (${topic.weight}%)`)
    .join(" | ");
  const takeaways = pack.notes
    .flatMap((note) => note.keyTakeaways.slice(0, 2))
    .slice(0, 8)
    .join(" | ");

  return `Blueprint topics: ${topics}\nKey takeaways: ${takeaways}`;
}

function pickVivaQuestions(pack: Pack, count = 6) {
  const scoredTopics = pack.blueprint.topics
    .map((topic) => ({
      topic,
      score: pack.mastery[topic.id]?.score ?? 0
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, Math.max(3, Math.min(count, pack.blueprint.topics.length)));

  const questions: Pack["questions"] = [];
  const used = new Set<string>();

  scoredTopics.forEach(({ topic }) => {
    pack.questions.forEach((question) => {
      if (questions.length >= count) return;
      if (used.has(question.id)) return;
      if (
        question.tags.some(
          (tag) =>
            tag.toLowerCase() === topic.title.toLowerCase() ||
            tag.toLowerCase() === topic.id.toLowerCase()
        )
      ) {
        used.add(question.id);
        questions.push(question);
      }
    });
  });

  return questions.slice(0, count);
}

export function buildCoachPrompt(
  pack: Pack,
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
  mode: "coach" | "viva" | "assist"
) {
  const base = summarizePack(pack);
  const system = `You are VeriCoach, an exam prep tutor.\n${base}`;
  const modeInstruction =
    mode === "viva"
      ? "Run a strict oral-viva session: ask one question, wait, grade the response (0-5), give concise feedback with evidence, then ask the next question."
      : mode === "assist"
        ? "Assist the learner with explanations, quick checks, and concise worked examples."
        : "Coach the learner: answer questions, quiz them, and point to evidence timestamps.";

  const vivaBank =
    mode === "viva"
      ? pickVivaQuestions(pack, 6)
          .map(
            (question, index) =>
              `${index + 1}. ${question.stem}\nAnswer: ${question.answer}\nEvidence: ${question.citations
                .slice(0, 2)
                .map((citation) => `${citation.timestamp} ${citation.url}`)
                .join(" | ")}`
          )
          .join("\n\n")
      : "";

  const historyText = history
    .map((turn) => `${turn.role === "user" ? "User" : "Coach"}: ${turn.content}`)
    .join("\n");

  const prompt = `${modeInstruction}
${mode === "viva" ? "Use the viva question bank below. Do NOT reveal the answer until the user responds." : ""}
${vivaBank ? `Viva question bank:\n${vivaBank}\n` : ""}
Use evidence timestamps when possible.
Conversation:
${historyText}
User: ${message}
Coach:`;

  return { system, prompt };
}
