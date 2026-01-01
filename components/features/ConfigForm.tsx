import React from "react";
import { Card } from "../ui/Card";
import { Input, Textarea } from "../ui/Input";
import { Button } from "../ui/Button";

interface ConfigFormProps {
    input: string;
    setInput: (val: string) => void;
    examSize: number;
    setExamSize: (val: number) => void;
    language: string;
    setLanguage: (val: string) => void;
    examDate: string;
    setExamDate: (val: string) => void;

    // API Keys
    geminiApiKey: string;
    setGeminiApiKey: (val: string) => void;
    youtubeApiKey: string;
    setYoutubeApiKey: (val: string) => void;

    // Advanced Settings toggles (could be expanded)
    researchSources: string;
    setResearchSources: (val: string) => void;

    onGenerate: () => void;
    isSubmitting: boolean;
    error?: string | null;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({
    input, setInput,
    examSize, setExamSize,
    language, setLanguage,
    examDate, setExamDate,
    geminiApiKey, setGeminiApiKey,
    youtubeApiKey, setYoutubeApiKey,
    researchSources, setResearchSources,
    onGenerate, isSubmitting, error
}) => {
    return (
        <Card variant="glass" className="w-full max-w-4xl mx-auto -mt-8 relative z-20">
            <div className="grid gap-6">

                {/* Main Input */}
                <div className="grid gap-2">
                    <Input
                        label="Lecture Playlist URL"
                        placeholder="https://youtube.com/playlist?list=..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        style={{ fontSize: "1.1rem", padding: "14px" }}
                    />
                    <p className="text-sm text-slate-500">
                        Paste a link to a YouTube playlist containing the course lectures.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Gemini API Key"
                        type="password"
                        placeholder="AIzaSy..."
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                    />
                    <Input
                        label="YouTube Data API Key"
                        type="password"
                        placeholder="AIzaSy..."
                        value={youtubeApiKey}
                        onChange={(e) => setYoutubeApiKey(e.target.value)}
                    />
                </div>

                <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-slate-600 mb-2 hover:text-teal-600 transition-colors list-none flex items-center gap-2">
                        <span className="transform transition-transform group-open:rotate-90">►</span>
                        Advanced Configuration
                    </summary>
                    <div className="grid gap-4 pl-4 pt-2 border-l-2 border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                label="Exam Size (Questions)"
                                type="number"
                                min={5}
                                max={50}
                                value={examSize}
                                onChange={(e) => setExamSize(Number(e.target.value))}
                            />
                            <div className="flex flex-col gap-1.5 w-full">
                                <label className="text-sm font-semibold text-slate-900">Language</label>
                                <select
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-base focus:ring-2 focus:ring-teal-500 outline-none"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    <option value="en">English</option>
                                    <option value="es">Spanish</option>
                                    <option value="fr">French</option>
                                    <option value="de">German</option>
                                    <option value="pt">Portuguese</option>
                                    <option value="hi">Hindi</option>
                                </select>
                            </div>
                            <Input
                                label="Exam Date (Optional)"
                                type="date"
                                value={examDate}
                                onChange={(e) => setExamDate(e.target.value)}
                            />
                        </div>
                        <Textarea
                            label="Research Sources (One URL per line)"
                            placeholder="https://example.com/syllabus.pdf&#10;https://university.edu/course-page"
                            value={researchSources}
                            onChange={(e) => setResearchSources(e.target.value)}
                            rows={4}
                        />
                    </div>
                </details>

                {error && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        {error}
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <Button size="lg" onClick={onGenerate} disabled={isSubmitting} isLoading={isSubmitting} style={{ minWidth: "200px" }}>
                        Generate Pack
                    </Button>
                </div>

            </div>
        </Card>
    );
};
