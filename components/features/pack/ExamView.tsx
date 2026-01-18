import React from "react";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Badge } from "../../ui/Badge";
import { Pack, GradeResult, RemediationItem } from "../../../lib/types";

interface ExamViewProps {
    pack: Pack;
    started: boolean;
    onStart: () => void;
    timeLeft: number | null;
    answers: Record<string, string>;
    setAnswers: (vals: Record<string, string>) => void;
    results: Record<string, GradeResult>;
    onCheck: (id: string) => void;
    remediation: RemediationItem[] | null;
    onRemediationRequest: () => void;
    remediationLoading: boolean;
}

export const ExamView: React.FC<ExamViewProps> = ({
    pack, started, onStart, timeLeft, answers, setAnswers, results, onCheck,
    remediation, onRemediationRequest, remediationLoading
}) => {

    const formatTime = (seconds: number | null) => {
        if (seconds === null) return "--:--";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (!started) {
        return (
            <Card className="flex flex-col items-center justify-center py-20 gap-6 text-center glass border-white/10">
                <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl">📝</span>
                </div>
                <h3 className="text-2xl font-serif text-white">Ready to test your knowledge?</h3>
                <p className="text-slate-400 max-w-md">
                    You have {pack.exam.sections.length} sections covering {pack.questions.length} questions.
                    The estimated time is {pack.exam.totalTimeMinutes} minutes.
                </p>
                <Button size="lg" onClick={onStart}>Start Mock Exam</Button>
            </Card>
        );
    }

    // Flatten questions for display
    const allQuestions = pack.questions; // Or filter by section if we want pagination

    return (
        <div className="flex flex-col gap-8 pb-20">

            {/* Sticky Timer */}
            <div className="sticky top-24 z-30 flex justify-center pointer-events-none">
                <div className="bg-amber-400 text-slate-900 px-6 py-2 rounded-full shadow-lg font-mono font-bold text-lg pointer-events-auto border-2 border-slate-900">
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className="grid gap-8">
                {allQuestions.map((q, idx) => {
                    const result = results[q.id];
                    const isCorrect = result?.correct;
                    const currentAnswer = answers[q.id] || "";

                    return (
                        <Card key={q.id} variant="glass" className={`transition-all duration-300 border-white/5 ${result ? (isCorrect ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10") : ""}`}>
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-amber-500 text-sm">
                                        {idx + 1}
                                    </span>
                                    <div className="prose prose-invert max-w-none">
                                        <p className="font-medium text-lg text-slate-200 leading-relaxed">{q.stem}</p>
                                    </div>
                                </div>
                                {result && (
                                    <Badge color={isCorrect ? "success" : "error"}>
                                        {isCorrect ? "Correct" : "Incorrect"}
                                    </Badge>
                                )}
                            </div>

                            <div className="grid gap-3 pl-11">
                                {q.options?.map((opt, optIdx) => (
                                    <label
                                        key={opt.id}
                                        className={`flex items-center gap-3 p-4 rounded-xl border border-white/5 cursor-pointer transition-all hover:bg-white/5
                                    ${currentAnswer === opt.id ? "ring-2 ring-amber-500 bg-amber-500/10 border-amber-500" : ""}
                                    ${result && q.answer === opt.id ? "bg-green-500/20 border-green-500/50" : ""}
                                    ${result && currentAnswer === opt.id && !isCorrect ? "bg-red-500/20 border-red-500/50" : ""}
                                `}
                                    >
                                        <input
                                            type="radio"
                                            name={q.id}
                                            value={opt.id}
                                            checked={currentAnswer === opt.id}
                                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                            disabled={!!result}
                                            className="accent-amber-500 w-4 h-4"
                                        />
                                        <span className="text-slate-300">{opt.text}</span>
                                    </label>
                                ))}
                            </div>

                            {!result ? (
                                <div className="pl-11 mt-6">
                                    <Button
                                        size="sm"
                                        onClick={() => onCheck(q.id)}
                                        disabled={!currentAnswer}
                                    >
                                        Check Answer
                                    </Button>
                                </div>
                            ) : (
                                <div className="mt-6 ml-11 p-4 bg-white/5 rounded-xl border border-white/10 text-sm animate-in fade-in">
                                    <strong className="block mb-1 text-white">Explanation</strong>
                                    <p className="text-slate-300">{result.explanation}</p>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            <div className="flex justify-center pt-8">
                <Button
                    variant="secondary"
                    onClick={onRemediationRequest}
                    isLoading={remediationLoading}
                    disabled={Object.keys(results).length === 0}
                >
                    Remediation Plan
                </Button>
            </div>

            {remediation && (
                <Card className="bg-orange-500/10 border-orange-500/20">
                    <h3 className="text-xl font-serif text-orange-400 mb-4">Remediation Plan</h3>
                    <div className="grid gap-4">
                        {remediation.map((item, i) => (
                            <div key={i} className="bg-slate-900/50 p-4 rounded-xl border border-orange-500/10 shadow-sm">
                                <div className="font-bold text-white mb-1">{item.topicTitle} ({item.topicId})</div>
                                <p className="text-slate-300 text-sm mb-3">{item.advice}</p>
                                <div className="flex gap-2 text-xs flex-wrap">
                                    {item.citations.map((res, r) => (
                                        <a key={r} href={res.url} target="_blank" className="text-blue-400 underline hover:text-blue-300">
                                            {res.label}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

        </div>
    );
};
