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
    "Compiling Phase 1 Matrix...", 
    "Synthesizing vibe check scores...", 
    "Drafting Pareto Fix Plan...", 
    "Verifying architectural consistency...",
    "Formatting final brutal verdict...",
    "Generating report markdown..." 
];

const OVERTIME_MESSAGES = [
    "Deepening analysis of edge cases...",
    "Refining score calculations...",
    "Polishing output format...",
    "Double-checking logic consistency...",
    "Almost there..."
];

const STEP_DURATION = 1200; // 1.2s per step

export const TerminalOutput: React.FC = () => {
    const [lines, setLines] = useState<string[]>([]);
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStepIndex(prev => prev + 1);
        }, STEP_DURATION);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Logic to update the terminal lines based on stepIndex
        let message = "";
        
        if (stepIndex < MESSAGES.length) {
            message = MESSAGES[stepIndex];
        } else {
            // Overtime logic: Show a keep-alive message every 2 ticks (approx 2.4s)
            // to avoid spamming the log but keep it alive.
            const overtimeIndex = stepIndex - MESSAGES.length;
            if (overtimeIndex % 2 === 0) {
                const msgIndex = (overtimeIndex / 2) % OVERTIME_MESSAGES.length;
                message = OVERTIME_MESSAGES[msgIndex];
            }
        }

        if (message) {
            setLines(old => [...old.slice(-7), `> ${message}`]);
        }
    }, [stepIndex]);

    // Progress Calculation
    // We cap it at 98% if we go into overtime until the parent component unmounts this.
    const rawProgress = ((stepIndex + 1) / MESSAGES.length) * 100;
    const progress = Math.min(rawProgress, stepIndex >= MESSAGES.length ? 99 : 100);
    
    // ETA Calculation
    // If inside normal steps, calculate remaining. If overtime, just show generic.
    const remainingSteps = Math.max(0, MESSAGES.length - stepIndex);
    const eta = remainingSteps > 0 
        ? (remainingSteps * (STEP_DURATION / 1000)).toFixed(0) 
        : "CALCULATING";

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
                    <span>EST. REMAINING: {eta === "CALCULATING" ? "..." : `${eta}s`}</span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden border border-gray-800/50">
                    <div 
                        className="h-full bg-terminal-green shadow-[0_0_15px_rgba(0,255,65,0.8)] transition-all duration-300 ease-out" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-[10px] text-gray-700 font-mono pt-1">
                    <span>STEP {Math.min(stepIndex + 1, MESSAGES.length + (stepIndex >= MESSAGES.length ? 1 : 0))}/{MESSAGES.length}</span>
                    <span>THREADS: {Math.floor(Math.random() * 4) + 4} ACTIVE</span>
                </div>
            </div>
        </div>
    );
};