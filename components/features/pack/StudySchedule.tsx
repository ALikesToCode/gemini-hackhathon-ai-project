import React from "react";
import { Card } from "../../ui/Card";
import { Pack } from "../../../lib/types";
import { buildStudySchedule } from "../../../lib/schedule";

interface StudyScheduleProps {
    pack: Pack;
}

export const StudySchedule: React.FC<StudyScheduleProps> = ({ pack }) => {
    const schedule = pack.examDate
        ? buildStudySchedule(pack.blueprint, pack.examDate)
        : [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Topics List */}
            <div className="md:col-span-1 space-y-4">
                <h3 className="text-lg font-bold text-white px-2">Blueprint</h3>
                {pack.blueprint.topics.map((topic) => (
                    <Card key={topic.id} padding="sm" className="hover:shadow-md transition-shadow cursor-pointer bg-white/5 border-white/10">
                        <div className="font-semibold text-amber-400 text-sm">{topic.title}</div>
                        <div className="text-xs text-slate-400 mt-1 line-clamp-2">Weight: {topic.weight}</div>
                    </Card>
                ))}
            </div>

            {/* Right Column: Timeline / Details */}
            <div className="md:col-span-2 space-y-6">
                <Card className="bg-indigo-500/10 border-indigo-500/20">
                    <h3 className="text-xl font-serif text-indigo-300 mb-2">Study Strategy</h3>
                    <p className="text-indigo-200/80">
                        Focus on lower mastery topics first, then cycle back based on your schedule.
                        Use the Coach tab to drill weak areas before each session.
                    </p>
                </Card>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white">Study Schedule</h4>
                        {pack.examDate ? (
                            <span className="text-xs text-slate-400">
                                Exam date: {pack.examDate}
                            </span>
                        ) : null}
                    </div>

                    {!pack.examDate ? (
                        <div className="p-6 text-center text-slate-400 bg-white/5 rounded-xl border border-dashed border-white/10">
                            Add an exam date when generating the pack to see a day-by-day schedule.
                        </div>
                    ) : schedule.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 bg-white/5 rounded-xl border border-dashed border-white/10">
                            Schedule unavailable. Try a future exam date.
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {schedule.map((day) => (
                                <Card key={day.date} padding="sm" className="flex flex-col gap-2 bg-white/5 border-white/10">
                                    <div className="text-sm font-semibold text-slate-300">{day.date}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {day.topics.map((topic) => (
                                            <span
                                                key={topic.id}
                                                className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300"
                                            >
                                                {topic.title}
                                            </span>
                                        ))}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
