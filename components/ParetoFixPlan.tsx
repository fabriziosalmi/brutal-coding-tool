import React from 'react';
import ReactMarkdown from 'react-markdown';

export const ParetoFixPlan: React.FC<{ steps: string[] }> = ({ steps }) => {
    return (
        <div className="space-y-3">
            {steps.map((item, idx) => {
                return (
                    <div key={idx} className="flex gap-4 p-4 bg-black/40 border border-gray-800 rounded-lg hover:bg-gray-900/40 transition-colors print:bg-white print:border-black">
                        <div className="flex-shrink-0 pt-1">
                            <div className="w-6 h-6 rounded border border-gray-700 flex items-center justify-center text-xs font-mono text-gray-500 print:border-black print:text-black">
                                {idx + 1}
                            </div>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none print:prose-black">
                             <ReactMarkdown>{item}</ReactMarkdown>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};
