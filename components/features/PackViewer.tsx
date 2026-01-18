import React, { useState } from "react";
import { Pack, GradeResult, RemediationItem } from "../../lib/types";

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
    coachMessages: Array<{ role: "user" | "assistant"; content: string }>;
    onCoachSend: (msg: string) => void;
    coachBusy: boolean;
    coachMode: "coach" | "viva" | "assist";
    setCoachMode: (val: "coach" | "viva" | "assist") => void;
    useLiveApi: boolean;
    setUseLiveApi: (val: boolean) => void;
    liveReady: boolean;
    useBrowserUse: boolean;
    setUseBrowserUse: (val: boolean) => void;
    browserUseReady: boolean;

    // Export Actions
    onDownloadPdf: () => void;
    onBack?: () => void;
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
    coachMode, setCoachMode,
    useLiveApi, setUseLiveApi, liveReady,
    useBrowserUse, setUseBrowserUse, browserUseReady,
    onDownloadPdf,
    onBack
}) => {
    const [view, setView] = useState<ViewMode>("schedule");
    const openExport = (path: string) => {
        if (typeof window === "undefined") return;
        window.open(path, "_blank");
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header / Tabs */}
            <Card variant="glass" padding="sm" className="sticky top-4 z-40 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 px-2">
                    <h2 className="text-xl font-serif text-white">
                        {pack.blueprint.title || "Exam Pack"}
                    </h2>
                    <Badge color="primary">{pack.blueprint.topics.length} Topics</Badge>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    {(["schedule", "exam", "coach"] as ViewMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setView(mode)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === mode
                                ? "bg-slate-800 text-amber-500 shadow-sm border border-white/10"
                                : "text-slate-400 hover:text-white hover:bg-white/10"
                                }`}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2">
                    {onBack ? (
                        <Button variant="ghost" size="sm" onClick={onBack}>
                            Back to Builder
                        </Button>
                    ) : null}
                    <Button variant="secondary" size="sm" onClick={onDownloadPdf}>
                        Download PDF
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openExport(`/api/export/html?packId=${pack.id}`)}
                    >
                        View HTML
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openExport(`/api/export/anki?packId=${pack.id}`)}
                    >
                        Download Anki
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openExport(`/pack/${pack.id}`)}
                    >
                        Share Pack
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
                        mode={coachMode}
                        setMode={setCoachMode}
                        useLiveApi={useLiveApi}
                        setUseLiveApi={setUseLiveApi}
                        liveReady={liveReady}
                        useBrowserUse={useBrowserUse}
                        setUseBrowserUse={setUseBrowserUse}
                        browserUseReady={browserUseReady}
                    />
                )}
            </div>

        </div>
    );
};
