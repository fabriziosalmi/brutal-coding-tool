import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Phase1Category } from '../types';

const Phase1Card: React.FC<{ category: Phase1Category }> = ({ category }) => {
    return (
        <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-all break-inside-avoid print:bg-white print:border-black">
            <h4 className="text-terminal-green font-mono font-bold text-lg mb-4 border-b border-gray-800 pb-2 print:text-black print:border-black">
                {category.title}
            </h4>
            <div className="space-y-4">
                {category.items.map((item, idx) => {
                    let dotColor = "bg-gray-600";
                    if (item.score >= 4) dotColor = "bg-terminal-green";
                    else if (item.score >= 2) dotColor = "bg-terminal-amber";
                    else dotColor = "bg-terminal-red";

                    return (
                        <div key={idx} className="text-sm">
                            <div className="flex items-start gap-3">
                                <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dotColor} print:border print:border-black`}></div>
                                <div>
                                    <span className="font-mono font-bold text-gray-200 print:text-black">{item.label}</span>
                                    <span className="text-gray-500 font-mono text-xs ml-2 print:text-gray-600">[{item.score}/5]</span>
                                    <div className="text-gray-400 mt-1 leading-relaxed print:text-black">
                                      <ReactMarkdown>{item.description}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export const Phase1Matrix: React.FC<{ categories: Phase1Category[] }> = ({ categories }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {categories.map((cat, idx) => (
         <Phase1Card key={idx} category={cat} />
      ))}
    </div>
  );
};
