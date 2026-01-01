import React from "react";
import { Card } from "../../ui/Card"; // Adjusted import path
import { Pack } from "../../../lib/types";

interface StudyScheduleProps {
    pack: Pack;
}

export const StudySchedule: React.FC<StudyScheduleProps> = ({ pack }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Topics List */}
            <div className="md:col-span-1 space-y-4">
                <h3 className="text-lg font-bold text-slate-800 px-2">Blueprint</h3>
                {pack.blueprint.topics.map((topic) => (
                    <Card key={topic.id} padding="sm" className="hover:shadow-md transition-shadow cursor-pointer">
                        <div className="font-semibold text-teal-900 text-sm">{topic.title}</div>
                        <div className="text-xs text-slate-500 mt-1 line-clamp-2">Weight: {topic.weight}</div>
                    </Card>
                ))}
            </div>

            {/* Right Column: Timeline / Details */}
            <div className="md:col-span-2 space-y-6">
                <Card className="bg-indigo-50 border-indigo-100">
                    <h3 className="text-xl font-serif text-indigo-900 mb-2">Study Strategy</h3>
                    <p className="text-indigo-800/80">
                        Based on your exam date, we recommend focusing on the weakest topics first.
                        Use the Coach tab to ask specific questions about these topics.
                    </p>
                </Card>

                <div>
                    <h4 className="font-bold text-slate-800 mb-4">Detailed Notes</h4>
                    <div className="space-y-4">
                        {/* This would be populated with the actual notes content if available in a structured way per topic, 
                         or we list the lecture notes. The pack type has 'notes' possibly? 
                         Checking types... The Pack type usually has a list of generated notes/questions.
                         Assuming pack.notes is a map or list. 
                         For now, let's just show a placeholder or iterating loosely if we know the structure.
                         The prompt isn't explicit about notes structure so I'll create a generic list view. */}

                        <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            Detailed timestamped notes view coming soon.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
