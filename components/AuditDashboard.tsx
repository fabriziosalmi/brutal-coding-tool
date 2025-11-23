
import React from 'react';
import { AuditScores } from '../types';
import ScoreChart from './ScoreChart';

interface AuditDashboardProps {
  scores: AuditScores;
}

const ScoreBar: React.FC<{ label: string; score: number; max: number }> = ({ label, score, max }) => {
    const percentage = (score / max) * 100;
    
    let colorClass = "bg-terminal-green";
    let textClass = "text-terminal-green";
    
    if (percentage < 40) {
        colorClass = "bg-terminal-red";
        textClass = "text-terminal-red";
    } else if (percentage < 70) {
        colorClass = "bg-terminal-amber";
        textClass = "text-terminal-amber";
    }

    return (
        <div className="mb-4 last:mb-0">
            <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">{label}</span>
                <span className={`text-sm font-bold font-mono ${textClass}`}>{score}/{max}</span>
            </div>
            <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                <div 
                    className={`h-full ${colorClass} transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

export const AuditDashboard: React.FC<AuditDashboardProps> = ({ scores }) => {
    const getGrade = (total: number) => {
        if (total >= 90) return { grade: 'A+', color: 'text-terminal-green' };
        if (total >= 80) return { grade: 'A', color: 'text-terminal-green' };
        if (total >= 70) return { grade: 'B', color: 'text-terminal-green' };
        if (total >= 50) return { grade: 'C', color: 'text-terminal-amber' };
        if (total >= 30) return { grade: 'D', color: 'text-terminal-red' };
        return { grade: 'F', color: 'text-terminal-red' };
    };

    const { grade, color } = getGrade(scores.total);

    return (
        <div className="grid md:grid-cols-2 gap-6 bg-black border border-gray-800 rounded-xl p-6 relative overflow-hidden print:border-black print:bg-white">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-800/10 rounded-full blur-3xl pointer-events-none print:hidden"></div>

            {/* Left: Chart */}
            <div className="h-[250px] relative flex flex-col items-center justify-center border-r border-gray-800 pr-6 print:border-none">
                 <div className="absolute top-0 left-0">
                    <div className="text-xs text-gray-600 font-mono">OVERALL SCORE</div>
                    <div className={`text-5xl font-bold font-mono ${color} print:text-black`}>
                        {scores.total}
                    </div>
                 </div>
                 <div className="absolute top-0 right-6 text-right">
                    <div className="text-xs text-gray-600 font-mono">GRADE</div>
                    <div className={`text-5xl font-bold font-mono ${color} print:text-black`}>
                        {grade}
                    </div>
                 </div>
                 <div className="w-full h-full mt-8">
                     <ScoreChart scores={scores} />
                 </div>
            </div>

            {/* Right: Breakdown */}
            <div className="flex flex-col justify-center pl-2">
                <h3 className="text-sm font-mono text-gray-500 mb-4 border-b border-gray-800 pb-2 print:text-black">CATEGORY BREAKDOWN</h3>
                <ScoreBar label="Architecture & Vibe" score={scores.architecture} max={20} />
                <ScoreBar label="Core Engineering" score={scores.core} max={20} />
                <ScoreBar label="Performance & Scale" score={scores.performance} max={20} />
                <ScoreBar label="Security & Robustness" score={scores.security} max={20} />
                <ScoreBar label="QA & Operations" score={scores.qa} max={20} />
            </div>
        </div>
    );
};
