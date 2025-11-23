
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

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            // Safety check: if index exceeds bounds, stop
            if (index >= MESSAGES.length) {
                clearInterval(interval);
                return;
            }

            const message = MESSAGES[index];
            // Ensure message exists before updating state to prevent "undefined"
            if (message) {
                setLines(prev => [...prev.slice(-6), `> ${message}`]);
            }
            index++;
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full font-mono text-sm bg-black border border-gray-800 p-4 rounded-md h-48 flex flex-col justify-end overflow-hidden shadow-[0_0_20px_rgba(0,255,65,0.1)]">
            {lines.map((line, i) => (
                <div key={i} className="text-terminal-green animate-pulse">
                    {line}
                </div>
            ))}
            <div className="flex items-center text-terminal-green">
                <span>></span>
                <span className="w-2 h-4 bg-terminal-green ml-2 animate-blink"></span>
            </div>
        </div>
    );
};
