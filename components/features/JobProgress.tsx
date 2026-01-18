import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { JobStatus } from "../../lib/types";

interface JobProgressProps {
    job: JobStatus;
}

export const JobProgress: React.FC<JobProgressProps> = ({ job }) => {
    if (!job) return null;

    const progress = Math.round(job.progress * 100);
    const isComplete = job.status === "completed";
    const isFailed = job.status === "failed";

    return (
        <Card variant="glass" className="w-full max-w-2xl mx-auto my-8 animate-in fade-in zoom-in duration-300 border-white/10">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Generation in Progress</h3>
                        <p className="text-slate-400 text-sm">Our AI is analyzing your lectures...</p>
                    </div>
                    <Badge color={isComplete ? "success" : isFailed ? "error" : "primary"}>
                        {job.status.toUpperCase()}
                    </Badge>
                </div>

                <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-amber-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex justify-between text-sm text-slate-400 font-medium">
                    <span>{job.step}</span>
                    <span>{progress}%</span>
                </div>
                {job.currentLecture ? (
                    <div className="text-xs text-slate-500">
                        Current: {job.currentLecture}
                    </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-xs uppercase tracking-wide text-slate-400 font-bold">Lectures Found</div>
                        <div className="text-xl font-serif text-white">{job.totalLectures || 0}</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-xs uppercase tracking-wide text-slate-400 font-bold">Processed</div>
                        <div className="text-xl font-serif text-white">{job.completedLectures || 0}</div>
                    </div>
                </div>

                {job.errors?.length ? (
                    <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                        <div className="font-semibold uppercase tracking-wide text-amber-300">
                            Notes
                        </div>
                        <ul className="mt-2 list-disc pl-4">
                            {job.errors.slice(-3).map((error, index) => (
                                <li key={`${job.id}-error-${index}`}>{error}</li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </div>
        </Card>
    );
};
