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
    "Validating dependency tree...",
    "Applying ruthless filters...",
    "Calibrating verdict severity...",
    "Generating score visualizations...",
    "Finalizing brutal verdict..."
];

const STEP_DURATION = 1500; 

interface TerminalOutputProps {
    status?: string;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({ status }) => {
    const [lines, setLines] = useState<string[]>([]);
    const [stepIndex, setStepIndex] = useState(0);
    const totalSteps = MESSAGES.length;

    // Auto-advance simulated steps
    useEffect(() => {
        const interval = setInterval(() => {
            setStepIndex(prev => {
                if (prev >= totalSteps) return prev;
                return prev + 1;
            });
        }, STEP_DURATION);
        return () => clearInterval(interval);
    }, [totalSteps]);

    // Effect to handle both simulated messages AND real status updates
    useEffect(() => {
        let newMessage = "";
        
        // Priority 1: Real status from parent
        if (status) {
            setLines(old => {
                const lastLine = old[old.length - 1];
                if (lastLine !== `> ${status}`) {
                    return [...old.slice(-7), `> ${status}`];
                }
                return old;
            });
            return;
        }

        // Priority 2: Simulated messages
        if (stepIndex < totalSteps) {
            newMessage = MESSAGES[stepIndex];
            setLines(old => [...old.slice(-7), `> ${newMessage}`]);
        }
    }, [stepIndex, status, totalSteps]);

    const progress = Math.min(((stepIndex) / totalSteps) * 100, 100);
    const displayStep = Math.min(stepIndex + 1, totalSteps);
    
    return (
        <div className="w-full font-mono text-sm bg-black border border-gray-800 p-6 rounded-xl shadow-[0_0_30px_rgba(0,255,65,0.05)] relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-900 pb-2">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-terminal-green animate-pulse"></div>
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Deep Scan Protocol</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="text-gray-600 text-xs font-mono">STEP {displayStep}/{totalSteps}</span>
                    <span className="text-terminal-green text-xs font-bold">{Math.round(progress)}%</span>
                 </div>
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
                    <span>PHASE: {status ? status.toUpperCase() : "PROCESSING"}</span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden border border-gray-800/50">
                    <div 
                        className="h-full bg-terminal-green shadow-[0_0_15px_rgba(0,255,65,0.8)] transition-all duration-300 ease-out" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};