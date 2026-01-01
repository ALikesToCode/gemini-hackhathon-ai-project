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
            <Card className="flex flex-col items-center justify-center py-20 gap-6 text-center">
                <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl">📝</span>
                </div>
                <h3 className="text-2xl font-serif text-slate-800">Ready to test your knowledge?</h3>
                <p className="text-slate-500 max-w-md">
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
                <div className="bg-slate-900 text-white px-6 py-2 rounded-full shadow-lg font-mono font-bold text-lg pointer-events-auto">
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className="grid gap-8">
                {allQuestions.map((q, idx) => {
                    const result = results[q.id];
                    const isCorrect = result?.correct;
                    const currentAnswer = answers[q.id] || "";

                    return (
                        <Card key={q.id} className={`transition-all duration-300 ${result ? (isCorrect ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30") : ""}`}>
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                                        {idx + 1}
                                    </span>
                                    <div className="prose prose-slate max-w-none">
                                        <p className="font-medium text-lg leading-relaxed">{q.stem}</p>
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
                                        className={`flex items-center gap-3 p-4 rounded-xl border border-slate-200 cursor-pointer transition-all hover:bg-slate-50
                                    ${currentAnswer === opt.id ? "ring-2 ring-teal-500 bg-teal-50/50 border-teal-500" : ""}
                                    ${result && q.answer === opt.id ? "bg-green-100 border-green-300" : ""}
                                    ${result && currentAnswer === opt.id && !isCorrect ? "bg-red-100 border-red-300" : ""}
                                `}
                                    >
                                        <input
                                            type="radio"
                                            name={q.id}
                                            value={opt.id}
                                            checked={currentAnswer === opt.id}
                                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                            disabled={!!result}
                                            className="accent-teal-600 w-4 h-4"
                                        />
                                        <span className="text-slate-700">{opt.text}</span>
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
                                <div className="mt-6 ml-11 p-4 bg-white rounded-xl border border-slate-200 text-sm animate-in fade-in">
                                    <strong className="block mb-1 text-slate-900">Explanation</strong>
                                    <p className="text-slate-600">{result.explanation}</p>
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
                    Generate Remediation Plan
                </Button>
            </div>

            {remediation && (
                <Card className="bg-orange-50 border-orange-100">
                    <h3 className="text-xl font-serif text-orange-900 mb-4">Remediation Plan</h3>
                    <div className="grid gap-4">
                        {remediation.map((item, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                                <div className="font-bold text-slate-800 mb-1">{item.topicTitle} ({item.topicId})</div>
                                <p className="text-slate-600 text-sm mb-3">{item.advice}</p>
                                <div className="flex gap-2 text-xs flex-wrap">
                                    {item.citations.map((res, r) => (
                                        <a key={r} href={res.url} target="_blank" className="text-blue-600 underline hover:text-blue-800">
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
