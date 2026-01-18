import React, { useRef, useEffect } from "react";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

interface CoachViewProps {
    messages: { role: "user" | "assistant"; content: string }[];
    onSend: (msg: string) => void;
    isBusy: boolean;
    mode: "coach" | "viva" | "assist";
    setMode: (val: "coach" | "viva" | "assist") => void;
    useLiveApi: boolean;
    setUseLiveApi: (val: boolean) => void;
    liveReady: boolean;
    useBrowserUse: boolean;
    setUseBrowserUse: (val: boolean) => void;
    browserUseReady: boolean;
}

export const CoachView: React.FC<CoachViewProps> = ({
    messages,
    onSend,
    isBusy,
    mode,
    setMode,
    useLiveApi,
    setUseLiveApi,
    liveReady,
    useBrowserUse,
    setUseBrowserUse,
    browserUseReady
}) => {
    const [input, setInput] = React.useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        onSend(input);
        setInput("");
    };

    return (
        <Card variant="glass" className="h-[600px] flex flex-col p-0 overflow-hidden border-white/10">

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-300">Mode</label>
                    <select
                        className="rounded-lg border border-white/10 bg-slate-800 text-white px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                        value={mode}
                        onChange={(e) => setMode(e.target.value as "coach" | "viva" | "assist")}
                    >
                        <option value="coach">Coach</option>
                        <option value="viva">Viva</option>
                        <option value="assist">Assist</option>
                    </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={useLiveApi}
                        disabled={!liveReady || mode === "assist"}
                        onChange={(e) => setUseLiveApi(e.target.checked)}
                        className="accent-amber-500 w-4 h-4"
                    />
                    <span>Use Gemini Live API (ephemeral token)</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={useBrowserUse}
                        disabled={!browserUseReady || mode !== "assist"}
                        onChange={(e) => setUseBrowserUse(e.target.checked)}
                        className="accent-amber-500 w-4 h-4"
                    />
                    <span>Use Browser Use Cloud (Assist)</span>
                </label>
            </div>
            {mode === "assist" && useBrowserUse ? (
                <div className="px-6 py-2 text-xs text-slate-400 bg-white/5 border-b border-white/10">
                    Tip: prefix your message with <strong>browser:</strong> to launch a Browser Use task.
                </div>
            ) : null}
            {mode !== "assist" && useLiveApi ? (
                <div className="px-6 py-2 text-xs text-slate-400 bg-white/5 border-b border-white/10">
                    Live mode connects directly to Gemini with short-lived ephemeral tokens.
                </div>
            ) : null}
            {mode === "assist" && !browserUseReady ? (
                <div className="px-6 py-2 text-xs text-slate-500 bg-white/5 border-b border-white/10">
                    Add a Browser Use API key in the config form to enable Browser Use tasks.
                </div>
            ) : null}

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent">
                {messages.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <div className="text-4xl mb-4">💬</div>
                        <h3 className="font-serif text-xl text-slate-300">I'm your AI Coach</h3>
                        <p className="text-slate-500">Ask me anything about your lectures.</p>
                    </div>
                )}

                {messages.map((msg, idx) => {
                    const isUser = msg.role === "user";
                    return (
                        <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-[80%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed
                        ${isUser
                                        ? "bg-amber-600 text-white rounded-tr-none"
                                        : "bg-white/10 border border-white/10 text-slate-200 rounded-tl-none"
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                {isBusy && (
                    <div className="flex justify-start">
                        <div className="bg-white/10 border border-white/10 rounded-2xl p-4 rounded-tl-none flex gap-1">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/5 border-t border-white/10 flex gap-4">
                <input
                    className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none transition-all text-white placeholder-slate-500"
                    placeholder="Ask a question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !isBusy && handleSend()}
                    disabled={isBusy}
                />
                <Button onClick={handleSend} disabled={isBusy || !input.trim()}>
                    Send
                </Button>
            </div>
        </Card>
    );
};
