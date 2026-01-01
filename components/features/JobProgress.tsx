import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

interface JobProgressProps {
    job: any; // Using any for simplicity as I don't want to duplicate the full JobStatus type right now, but practically I should import it.
    // I will fix types when integrating into page.tsx
}

export const JobProgress: React.FC<JobProgressProps> = ({ job }) => {
    if (!job) return null;

    const progress = Math.round(job.progress * 100);
    const isComplete = job.status === "completed";
    const isFailed = job.status === "failed";

    return (
        <Card className="w-full max-w-2xl mx-auto my-8 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">Generation in Progress</h3>
                        <p className="text-slate-500 text-sm">Our AI is analyzing your lectures...</p>
                    </div>
                    <Badge color={isComplete ? "success" : isFailed ? "error" : "primary"}>
                        {job.status.toUpperCase()}
                    </Badge>
                </div>

                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-teal-600 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex justify-between text-sm text-slate-500 font-medium">
                    <span>{job.step}</span>
                    <span>{progress}%</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-xs uppercase tracking-wide text-slate-400 font-bold">Lectures Found</div>
                        <div className="text-xl font-serif text-slate-900">{job.totalLectures || 0}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-xs uppercase tracking-wide text-slate-400 font-bold">Processed</div>
                        <div className="text-xl font-serif text-slate-900">{job.completedLectures || 0}</div>
                    </div>
                </div>
            </div>
        </Card>
    );
};
