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
    browserUseApiKey: string;
    setBrowserUseApiKey: (val: string) => void;
    proModel: string;
    setProModel: (val: string) => void;
    flashModel: string;
    setFlashModel: (val: string) => void;
    resumeJobId: string;
    setResumeJobId: (val: string) => void;

    // Advanced Settings toggles (could be expanded)
    researchSources: string;
    setResearchSources: (val: string) => void;
    includeResearch: boolean;
    setIncludeResearch: (val: boolean) => void;
    researchApiKey: string;
    setResearchApiKey: (val: string) => void;
    researchQuery: string;
    setResearchQuery: (val: string) => void;
    useDeepResearch: boolean;
    setUseDeepResearch: (val: boolean) => void;
    useVideoUnderstanding: boolean;
    setUseVideoUnderstanding: (val: boolean) => void;
    useFileSearch: boolean;
    setUseFileSearch: (val: boolean) => void;
    useCodeExecution: boolean;
    setUseCodeExecution: (val: boolean) => void;
    useInteractions: boolean;
    setUseInteractions: (val: boolean) => void;
    vaultNotes: string;
    setVaultNotes: (val: string) => void;
    vaultFiles: File[];
    setVaultFiles: (files: File[]) => void;
    vaultDocs: Array<{ id: string; name: string; chars: number }>;
    onVaultUpload: () => void;
    vaultUploadBusy: boolean;

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
    browserUseApiKey, setBrowserUseApiKey,
    proModel, setProModel,
    flashModel, setFlashModel,
    resumeJobId, setResumeJobId,
    researchSources, setResearchSources,
    includeResearch, setIncludeResearch,
    researchApiKey, setResearchApiKey,
    researchQuery, setResearchQuery,
    useDeepResearch, setUseDeepResearch,
    useVideoUnderstanding, setUseVideoUnderstanding,
    useFileSearch, setUseFileSearch,
    useCodeExecution, setUseCodeExecution,
    useInteractions, setUseInteractions,
    vaultNotes, setVaultNotes,
    vaultFiles, setVaultFiles,
    vaultDocs,
    onVaultUpload,
    vaultUploadBusy,
    onGenerate, isSubmitting, error
}) => {
    return (
        <Card variant="glass" className="w-full max-w-5xl mx-auto relative z-20">
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
                    <p className="text-sm text-slate-400">
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
                    <summary className="cursor-pointer text-sm font-medium text-slate-400 mb-2 hover:text-amber-400 transition-colors list-none flex items-center gap-2">
                        <span className="transform transition-transform group-open:rotate-90">►</span>
                        Advanced Configuration
                    </summary>
                    <div className="grid gap-4 pl-4 pt-2 border-l-2 border-white/10">
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
                                <label className="text-sm font-semibold text-white">Language</label>
                                <select
                                    className="w-full p-3 rounded-xl border border-white/10 bg-slate-800 text-base text-white focus:ring-2 focus:ring-amber-500 outline-none"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Gemini Pro Model"
                                placeholder="gemini-3-pro-preview"
                                value={proModel}
                                onChange={(e) => setProModel(e.target.value)}
                            />
                            <Input
                                label="Gemini Flash Model"
                                placeholder="gemini-3-flash-preview"
                                value={flashModel}
                                onChange={(e) => setFlashModel(e.target.value)}
                            />
                        </div>
                        <Textarea
                            label="Research Sources (One URL per line)"
                            placeholder="https://example.com/syllabus.pdf&#10;https://university.edu/course-page"
                            value={researchSources}
                            onChange={(e) => setResearchSources(e.target.value)}
                            rows={4}
                        />
                        <div className="grid gap-3">
                            <label className="flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={includeResearch}
                                    onChange={(e) => setIncludeResearch(e.target.checked)}
                                    className="accent-amber-500 w-4 h-4"
                                />
                                <span>Include research blueprint</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={useDeepResearch}
                                    disabled={!includeResearch}
                                    onChange={(e) => setUseDeepResearch(e.target.checked)}
                                    className="accent-amber-500 w-4 h-4"
                                />
                                <span>Use Deep Research agent (Gemini)</span>
                            </label>
                            {includeResearch ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Research API Key (Serper)"
                                        type="password"
                                        placeholder="serper_..."
                                        value={researchApiKey}
                                        onChange={(e) => setResearchApiKey(e.target.value)}
                                    />
                                    <Input
                                        label="Research Query (Optional)"
                                        placeholder="syllabus, exam topics"
                                        value={researchQuery}
                                        onChange={(e) => setResearchQuery(e.target.value)}
                                    />
                                </div>
                            ) : null}
                        </div>
                        <Input
                            label="Browser Use API Key (optional)"
                            type="password"
                            placeholder="bu_..."
                            value={browserUseApiKey}
                            onChange={(e) => setBrowserUseApiKey(e.target.value)}
                        />
                        <div className="grid gap-3">
                            <label className="flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={useVideoUnderstanding}
                                    onChange={(e) => setUseVideoUnderstanding(e.target.checked)}
                                    className="accent-amber-500 w-4 h-4"
                                />
                                <span>Fallback to Gemini video understanding</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={useFileSearch}
                                    onChange={(e) => setUseFileSearch(e.target.checked)}
                                    className="accent-amber-500 w-4 h-4"
                                />
                                <span>Enable File Search grounding (Vault)</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={useCodeExecution}
                                    onChange={(e) => setUseCodeExecution(e.target.checked)}
                                    className="accent-amber-500 w-4 h-4"
                                />
                                <span>Enable Code Execution verification</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={useInteractions}
                                    onChange={(e) => setUseInteractions(e.target.checked)}
                                    className="accent-amber-500 w-4 h-4"
                                />
                                <span>Use Interactions API for structured output</span>
                            </label>
                        </div>
                        <Textarea
                            label="Vault Notes (Optional)"
                            placeholder="Add syllabus notes or extra context for grounding."
                            value={vaultNotes}
                            onChange={(e) => setVaultNotes(e.target.value)}
                            rows={3}
                        />
                        <Input
                            label="Resume Job ID (Optional)"
                            placeholder="job_..."
                            value={resumeJobId}
                            onChange={(e) => setResumeJobId(e.target.value)}
                        />
                        <div className="grid gap-3">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-white">
                                    Vault Docs (PDF/TXT)
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    className="text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                                    onChange={(e) => setVaultFiles(Array.from(e.target.files ?? []))}
                                />
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onVaultUpload}
                                disabled={!vaultFiles.length || vaultUploadBusy}
                            >
                                {vaultUploadBusy ? "Uploading..." : "Upload Vault Files"}
                            </Button>
                            {vaultDocs.length ? (
                                <div className="text-xs text-slate-400">
                                    Uploaded: {vaultDocs.map((doc) => doc.name).join(", ")}
                                </div>
                            ) : null}
                        </div>
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
