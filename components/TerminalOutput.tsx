
import React, { useEffect, useState } from 'react';

const MESSAGES = [
    "Initializing heuristic scanners...",
    "Cloning repository metadata...",
    "Extracting source code intelligence...",
    "Analyzing commit history for 'wip' spam...",
    "Checking for stack overflow copy-pastes...",
    "Sampling algorithmic depth...",
    "Running vibe check...",
    "Identifying happy path programming...",
    "Searching for hardcoded secrets...",
    "Evaluating concurrency model...",
    "Judging variable naming conventions...",
    "Calculating technical debt interest rate...",
    "Finalizing brutal verdict..."
];

export const TerminalOutput: React.FC = () => {
    const [lines, setLines] = useState<string[]>([]);
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStepIndex(prev => {
                if (prev >= MESSAGES.length) {
                    clearInterval(interval);
                    return prev;
                }
                const message = MESSAGES[prev];
                setLines(old => [...old.slice(-6), `> ${message}`]);
                return prev + 1;
            });
        }, 800);
        return () => clearInterval(interval);
    }, []);

    const progress = Math.min((stepIndex / MESSAGES.length) * 100, 100);
    const eta = Math.max(0, (MESSAGES.length - stepIndex) * 0.8).toFixed(1);

    return (
        <div className="w-full font-mono text-sm bg-black border border-gray-800 p-6 rounded-xl shadow-[0_0_30px_rgba(0,255,65,0.05)] relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-900 pb-2">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-terminal-green animate-pulse"></div>
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Deep Scan Protocol</span>
                 </div>
                 <span className="text-terminal-green text-xs font-bold">{Math.round(progress)}%</span>
            </div>

            {/* Log Output */}
            <div className="h-40 flex flex-col justify-end overflow-hidden mb-6 relative">
                 <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black to-transparent z-10"></div>
                {lines.map((line, i) => (
                    <div key={i} className="text-terminal-green/80 mb-1 font-mono text-sm last:text-terminal-green last:font-bold last:text-base transition-all">
                        {line}
                    </div>
                ))}
                <div className="flex items-center text-terminal-green mt-1">
                    <span className="mr-2">_</span>
                    <span className="w-2 h-4 bg-terminal-green animate-blink"></span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500 font-mono">
                    <span>PHASE: {stepIndex < MESSAGES.length ? "PROCESSING" : "FINALIZING"}</span>
                    <span>EST. REMAINING: {eta}s</span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden border border-gray-800/50">
                    <div 
                        className="h-full bg-terminal-green shadow-[0_0_15px_rgba(0,255,65,0.8)] transition-all duration-300 ease-out" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-[10px] text-gray-700 font-mono pt-1">
                    <span>STEP {Math.min(stepIndex + 1, MESSAGES.length)}/{MESSAGES.length}</span>
                    <span>THREADS: {Math.floor(Math.random() * 4) + 4} ACTIVE</span>
                </div>
            </div>
        </div>
    );
};
