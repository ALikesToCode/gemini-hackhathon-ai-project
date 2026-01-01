import React from "react";
import { Button } from "../ui/Button";

interface HeroProps {
    onStart: () => void;
    isLoading?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onStart, isLoading }) => {
    return (
        <section className="hero fade-in relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-xl p-8 md:p-12 md:grid md:grid-cols-2 gap-8 items-center">

            {/* Background Decor - mimicking the radial gradients in CSS but scoped here if needed, 
          though the main CSS handles global background. We can add local flourishes. */}
            <div
                className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
            />

            <div className="relative z-10 flex flex-col gap-6">
                <div className="text-sm font-bold tracking-widest uppercase text-teal-600" style={{ color: "var(--primary)" }}>
                    VeriLearn Exam Pack
                </div>

                <h1 className="text-5xl md:text-6xl text-slate-900 leading-tight font-serif">
                    Turn lecture playlists into <span className="italic text-teal-700" style={{ color: "var(--primary)" }}>evidence-backed</span> exam prep.
                </h1>

                <p className="text-lg text-slate-600 leading-relaxed max-w-md">
                    Paste a playlist, connect Gemini 3 Pro + Flash, and generate a blueprint,
                    timestamped notes, verified questions, and a mock exam with remediation.
                </p>

                <div className="flex flex-wrap gap-4 mt-2">
                    {/* Note: In the original page, this button scrolled to the form or was the start action. 
                I'll assume it might focus the input or just be a CTA. */}
                    <Button size="lg" onClick={onStart} disabled={isLoading} isLoading={isLoading}>
                        Generate Exam Pack
                    </Button>

                    <Button variant="secondary" size="lg" onClick={() => window.open("https://github.com/ALikesToCode", "_blank")}>
                        View on GitHub
                    </Button>
                </div>
            </div>

            <div className="hidden md:flex justify-center items-center relative z-10">
                {/* Placeholder for a hero image or visualization if the user wants one later. 
            For now, we can perhaps use an abstract shape or the existing decorative elements. 
            I'll add a simple visual representation of a 'pack' */}
                <div className="w-full max-w-sm aspect-square bg-slate-50 rounded-2xl border border-slate-100 shadow-inner flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: "radial-gradient(circle at 50% 50%, var(--primary) 2px, transparent 2px)", backgroundSize: "24px 24px" }}>
                    </div>
                    <div className="glass-card p-6 rounded-xl shadow-lg transform rotate-[-6deg] absolute top-1/4 left-1/4 w-48 h-64 border-slate-200 bg-white">
                        <div className="h-4 w-3/4 bg-slate-200 rounded mb-4"></div>
                        <div className="h-3 w-full bg-slate-100 rounded mb-2"></div>
                        <div className="h-3 w-full bg-slate-100 rounded mb-2"></div>
                        <div className="h-3 w-5/6 bg-slate-100 rounded mb-2"></div>
                    </div>
                    <div className="glass-card p-6 rounded-xl shadow-xl transform rotate-[6deg] absolute top-1/3 right-1/4 w-48 h-64 border-slate-200 bg-white z-10 flex flex-col justify-between">
                        <div>
                            <div className="h-8 w-8 bg-teal-100 rounded-full mb-4 flex items-center justify-center text-teal-600 font-bold">A+</div>
                            <div className="h-4 w-5/6 bg-slate-800 rounded mb-3"></div>
                            <div className="h-3 w-full bg-slate-200 rounded mb-2"></div>
                            <div className="h-3 w-full bg-slate-200 rounded mb-2"></div>
                        </div>
                        <div className="h-8 w-full bg-teal-600 rounded-lg opacity-20"></div>
                    </div>
                </div>
            </div>

        </section>
    );
};
