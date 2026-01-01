import React, { useRef, useEffect } from "react";
import { Card } from "../../ui/Card";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";

interface CoachViewProps {
    messages: { role: "user" | "assistant"; content: string }[];
    onSend: (msg: string) => void;
    isBusy: boolean;
}

export const CoachView: React.FC<CoachViewProps> = ({ messages, onSend, isBusy }) => {
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
        <Card className="h-[600px] flex flex-col p-0 overflow-hidden bg-white shadow-2xl border-slate-200">

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {messages.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <div className="text-4xl mb-4">💬</div>
                        <h3 className="font-serif text-xl text-slate-700">I'm your AI Coach</h3>
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
                                        ? "bg-teal-600 text-white rounded-tr-none"
                                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                {isBusy && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 rounded-tl-none flex gap-1">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 flex gap-4">
                <input
                    className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
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
