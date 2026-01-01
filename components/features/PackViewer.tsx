import React, { useState } from "react";
import { Pack, GradeResult, PracticePlan, RemediationItem } from "../../../lib/types"; // Ensure this path is correct relative to where I put it. 
// Wait, I am putting this in components/features/PackViewer.tsx or similar.
// The file path in write_to_file will be components/features/PackViewer.tsx
// So path to lib/types is ../../lib/types

import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

// Sub-views
import { ExamView } from "./pack/ExamView";
import { StudySchedule } from "./pack/StudySchedule";
import { CoachView } from "./pack/CoachView";

type ViewMode = "exam" | "schedule" | "coach";

interface PackViewerProps {
    pack: Pack;

    // Exam Props
    examStarted: boolean;
    setExamStarted: (val: boolean) => void;
    examTimeLeft: number | null;
    examAnswers: Record<string, string>;
    setExamAnswers: (val: Record<string, string>) => void;
    examResults: Record<string, GradeResult>;
    onAnswerCheck: (questionId: string) => void;

    // Practice/Remediation Props
    remediation: RemediationItem[] | null;
    onRemediationRequest: () => void;
    remediationLoading: boolean;

    // Coach Props
    coachMessages: any[]; // Type properly later
    onCoachSend: (msg: string) => void;
    coachBusy: boolean;

    // Export Actions
    onDownloadPdf: () => void;
}

export const PackViewer: React.FC<PackViewerProps> = ({
    pack,
    examStarted, setExamStarted,
    examTimeLeft,
    examAnswers, setExamAnswers,
    examResults,
    onAnswerCheck,
    remediation, onRemediationRequest, remediationLoading,
    coachMessages, onCoachSend, coachBusy,
    onDownloadPdf
}) => {
    const [view, setView] = useState<ViewMode>("schedule");

    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header / Tabs */}
            <Card variant="glass" padding="sm" className="sticky top-4 z-40 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 px-2">
                    <h2 className="text-xl font-serif text-slate-800">
                        {pack.blueprint.title || "Exam Pack"}
                    </h2>
                    <Badge color="primary">{pack.blueprint.topics.length} Topics</Badge>
                </div>

                <div className="flex bg-slate-100/50 p-1 rounded-xl">
                    {(["schedule", "exam", "coach"] as ViewMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setView(mode)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === mode
                                    ? "bg-white text-teal-700 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                }`}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={onDownloadPdf}>
                        Download PDF
                    </Button>
                </div>
            </Card>

            {/* Main Content Area */}
            <div className="min-h-[600px]">
                {view === "schedule" && (
                    <StudySchedule pack={pack} />
                )}

                {view === "exam" && (
                    <ExamView
                        pack={pack}
                        started={examStarted}
                        onStart={() => setExamStarted(true)}
                        timeLeft={examTimeLeft}
                        answers={examAnswers}
                        setAnswers={setExamAnswers}
                        results={examResults}
                        onCheck={onAnswerCheck}
                        remediation={remediation}
                        onRemediationRequest={onRemediationRequest}
                        remediationLoading={remediationLoading}
                    />
                )}

                {view === "coach" && (
                    <CoachView
                        messages={coachMessages}
                        onSend={onCoachSend}
                        isBusy={coachBusy}
                    />
                )}
            </div>

        </div>
    );
};
