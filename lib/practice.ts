import { BlueprintTopic, MasteryRecord, Pack, Question } from "./types";

type DueTopic = {
  id: string;
  title: string;
  score: number;
  nextReviewAt: string;
  due: boolean;
};

function isDue(record?: MasteryRecord) {
  if (!record?.nextReviewAt) return true;
  return new Date(record.nextReviewAt).getTime() <= Date.now();
}

function rankTopics(topics: BlueprintTopic[], mastery: Record<string, MasteryRecord>) {
  return topics
    .map((topic) => {
      const record = mastery[topic.id];
      return {
        topic,
        due: isDue(record),
        score: record?.score ?? 0
      };
    })
    .sort((a, b) => {
      if (a.due !== b.due) return a.due ? -1 : 1;
      if (a.score !== b.score) return a.score - b.score;
      return a.topic.revisionOrder - b.topic.revisionOrder;
    });
}

function matchQuestionToTopic(question: Question, topic: BlueprintTopic) {
  return question.tags.some(
    (tag) =>
      tag.toLowerCase() === topic.title.toLowerCase() ||
      tag.toLowerCase() === topic.id.toLowerCase()
  );
}

export function buildPracticeSet(pack: Pack, limit = 5) {
  const ranked = rankTopics(pack.blueprint.topics, pack.mastery);
  const dueTopics: DueTopic[] = ranked.slice(0, Math.min(5, ranked.length)).map((entry) => ({
    id: entry.topic.id,
    title: entry.topic.title,
    score: entry.score,
    nextReviewAt: pack.mastery[entry.topic.id]?.nextReviewAt ?? new Date().toISOString(),
    due: entry.due
  }));

  const selectedQuestions: Question[] = [];
  const usedIds = new Set<string>();

  for (const entry of ranked) {
    if (selectedQuestions.length >= limit) break;
    const candidates = pack.questions.filter((question) =>
      matchQuestionToTopic(question, entry.topic)
    );
    for (const question of candidates) {
      if (selectedQuestions.length >= limit) break;
      if (usedIds.has(question.id)) continue;
      usedIds.add(question.id);
      selectedQuestions.push(question);
    }
  }

  return { dueTopics, questions: selectedQuestions };
}
