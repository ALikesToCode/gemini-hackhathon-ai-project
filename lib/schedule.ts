import { Blueprint } from "./types";

function dayStart(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function buildStudySchedule(blueprint: Blueprint, examDate: string) {
  const exam = new Date(examDate);
  if (Number.isNaN(exam.getTime())) return [];

  const start = dayStart(new Date());
  const end = dayStart(exam);
  const diffMs = end.getTime() - start.getTime();
  const days = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));

  const topics = blueprint.topics
    .slice()
    .sort((a, b) => a.revisionOrder - b.revisionOrder);
  const perDay = Math.max(1, Math.ceil(topics.length / days));

  const schedule = [];
  for (let i = 0; i < days; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const slice = topics.slice(i * perDay, (i + 1) * perDay);
    if (!slice.length) break;
    schedule.push({
      date: day.toISOString().slice(0, 10),
      topics: slice.map((topic) => ({ id: topic.id, title: topic.title }))
    });
  }

  return schedule;
}
