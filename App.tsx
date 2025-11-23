
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Download, AlertTriangle, Terminal, Code, FileText, Flame, Github, Key, ChevronDown, ChevronUp, Loader2, RefreshCw, Printer, ArrowRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { AppState, AuditResult } from './types';
import { runAudit } from './services/geminiService';
import { fetchGitHubRepoData, formatContext } from './services/githubService';
import { TerminalOutput } from './components/TerminalOutput';
import { AuditDashboard } from './components/AuditDashboard';

// --- Report Parsing Helpers ---

const parseReport = (markdown: string) => {
  const sections = {
    phase1: "",
    phase2: "",
    phase3: "",
    verdict: "",
  };

  const phase1Match = markdown.match(/## 📊 PHASE 1: THE 20-POINT MATRIX([\s\S]*?)(?=## 📉 PHASE 2)/);
  const phase2Match = markdown.match(/## 📉 PHASE 2: THE SCORES([\s\S]*?)(?=## 🛠️ PHASE 3)/);
  const phase3Match = markdown.match(/## 🛠️ PHASE 3: THE PARETO FIX PLAN([\s\S]*?)(?=## 🔥 FINAL VERDICT)/);
  const verdictMatch = markdown.match(/## 🔥 FINAL VERDICT([\s\S]*?)$/);

  if (phase1Match) sections.phase1 = phase1Match[1].trim();
  if (phase2Match) sections.phase2 = phase2Match[1].trim();
  if (phase3Match) sections.phase3 = phase3Match[1].trim();
  if (verdictMatch) sections.verdict = verdictMatch[1].trim();

  const isParsed = !!phase1Match;
  return { sections, isParsed };
};

// --- Specialized Components for Better Readability ---

const Phase1Card: React.FC<{ title: string; items: string[] }> = ({ title, items }) => {
    return (
        <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-all break-inside-avoid print:bg-white print:border-black">
            <h4 className="text-terminal-green font-mono font-bold text-lg mb-4 border-b border-gray-800 pb-2 print:text-black print:border-black">
                {title.replace('### ', '').trim()}
            </h4>
            <div className="space-y-4">
                {items.map((item, idx) => {
                    // Try to extract score [x/5]
                    const scoreMatch = item.match(/\*\*\[(\d)\/5\](.*?)\*\*:(.*)/);
                    if (scoreMatch) {
                        const score = parseInt(scoreMatch[1]);
                        const metric = scoreMatch[2];
                        const desc = scoreMatch[3];
                        
                        let dotColor = "bg-gray-600";
                        if (score >= 4) dotColor = "bg-terminal-green";
                        else if (score >= 2) dotColor = "bg-terminal-amber";
                        else dotColor = "bg-terminal-red";

                        return (
                            <div key={idx} className="text-sm">
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dotColor} print:border print:border-black`}></div>
                                    <div>
                                        <span className="font-mono font-bold text-gray-200 print:text-black">{metric}</span>
                                        <span className="text-gray-500 font-mono text-xs ml-2 print:text-gray-600">[{score}/5]</span>
                                        <p className="text-gray-400 mt-1 leading-relaxed print:text-black">{desc}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    // Fallback
                    return <div key={idx} className="text-sm text-gray-400 print:text-black"><ReactMarkdown>{item}</ReactMarkdown></div>
                })}
            </div>
        </div>
    )
}

const Phase1Grid: React.FC<{ content: string }> = ({ content }) => {
  const sections = content.split(/(?=### )/g).filter(s => s.trim().length > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {sections.map((section, idx) => {
         const lines = section.split('\n').filter(l => l.trim().length > 0);
         const title = lines[0];
         const items = lines.slice(1).join('\n').split(/(?=\d\. \*\*)/g).filter(s => s.trim().length > 0);
         
         if (items.length === 0) return null;

         return <Phase1Card key={idx} title={title} items={items} />;
      })}
    </div>
  );
};

const FixPlanList: React.FC<{ content: string }> = ({ content }) => {
    // Split by numbered list "1. ", "2. " etc
    const items = content.split(/\n(?=\d+\.)/).filter(s => s.trim().length > 0);

    return (
        <div className="space-y-3">
            {items.map((item, idx) => {
                const cleanItem = item.replace(/^\d+\.\s*/, '');
                return (
                    <div key={idx} className="flex gap-4 p-4 bg-black/40 border border-gray-800 rounded-lg hover:bg-gray-900/40 transition-colors print:bg-white print:border-black">
                        <div className="flex-shrink-0 pt-1">
                            <div className="w-6 h-6 rounded border border-gray-700 flex items-center justify-center text-xs font-mono text-gray-500 print:border-black print:text-black">
                                {idx + 1}
                            </div>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none print:prose-black">
                             <ReactMarkdown>{cleanItem}</ReactMarkdown>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

// --- Main App ---

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [repoUrl, setRepoUrl] = useState('');
  const [ghToken, setGhToken] = useState('');
  const [fetchedContext, setFetchedContext] = useState('');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const handleAudit = async () => {
    if (!repoUrl) {
      setError("Target repository URL is required.");
      return;
    }

    setError(null);
    let auditContext = fetchedContext;

    if (!auditContext) {
      setIsFetching(true);
      try {
        const data = await fetchGitHubRepoData(repoUrl, ghToken);
        auditContext = formatContext(data);
        setFetchedContext(auditContext);
      } catch (e: any) {
        setError(e.message || "Failed to fetch repository data.");
        setIsFetching(false);
        return;
      }
      setIsFetching(false);
    }

    setState(AppState.ANALYZING);
    try {
      const data = await runAudit(repoUrl, auditContext);
      setResult(data);
      setState(AppState.COMPLETE);
    } catch (e: any) {
      setState(AppState.ERROR);
      // Display the actual error message (e.g., API Key invalid, Quota exceeded)
      setError(`Audit failed: ${e.message || "Unknown error occurred"}`);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.markdownReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BRUTAL_AUDIT_${result.repoName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
      window.print();
  };

  const handleReset = () => {
    setState(AppState.IDLE);
    setFetchedContext('');
    setRepoUrl('');
    setResult(null);
    setError(null);
  };

  const parsedReport = result ? parseReport(result.markdownReport) : null;

  return (
    <div className="min-h-screen bg-terminal-black text-gray-300 font-sans selection:bg-terminal-red selection:text-white pb-20 print:bg-white print:text-black print:pb-0">
      {/* Header - Hidden in Print */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-md sticky top-0 z-50 print:hidden">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-terminal-red/10 rounded border border-terminal-red/20">
              <Flame className="w-6 h-6 text-terminal-red" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-mono">BRUTAL REP AUDITOR</h1>
              <p className="text-xs text-gray-500 font-mono">V2.2 // DEEP SCAN PROTOCOL</p>
            </div>
          </div>
          <div className="text-xs font-mono text-gray-500 border border-gray-800 px-3 py-1 rounded-full">
            STATUS: <span className="text-terminal-green">ONLINE</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 print:px-0 print:py-0 print:max-w-none">
        
        {/* Intro Section - Hidden in Print */}
        {state === AppState.IDLE && (
          <div className="mb-12 text-center max-w-2xl mx-auto print:hidden">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Is your code <span className="text-terminal-green">Engineering Substance</span> or <span className="text-terminal-red">AI Slop</span>?
            </h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Generate a ruthless, no-nonsense technical due diligence report for any public Git repository. 
              Automatically fetches history, structure, and docs for deep analysis.
            </p>
          </div>
        )}

        {/* Input Section - Hidden in Print */}
        <div className={`transition-all duration-500 print:hidden ${state === AppState.COMPLETE ? 'hidden' : 'opacity-100'}`}>
          <div className="grid gap-6 bg-gray-900/30 border border-gray-800 p-6 rounded-xl relative overflow-hidden max-w-3xl mx-auto">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-terminal-red to-transparent opacity-20"></div>

            <div className="grid md:grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">TARGET REPOSITORY URL (GITHUB)</label>
                <div className="relative group">
                  <Github className="absolute left-3 top-3 w-5 h-5 text-gray-600 group-focus-within:text-white transition-colors" />
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => {
                        setRepoUrl(e.target.value);
                        setFetchedContext('');
                    }}
                    placeholder="https://github.com/username/repo"
                    className="w-full bg-black border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white font-mono focus:outline-none focus:border-terminal-green focus:ring-1 focus:ring-terminal-green transition-colors"
                  />
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-white transition-colors mb-4"
                >
                    {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    ADVANCED OPTIONS
                </button>

                {showAdvanced && (
                    <div className="grid gap-4 animate-fade-in">
                        <div>
                            <label className="block text-xs font-mono text-gray-500 mb-2 flex items-center gap-2">
                                <Key className="w-3 h-3" /> GITHUB TOKEN (OPTIONAL - FOR HIGHER RATE LIMITS)
                            </label>
                            <input
                                type="password"
                                value={ghToken}
                                onChange={(e) => setGhToken(e.target.value)}
                                placeholder="ghp_xxxxxxxxxxxx"
                                className="w-full bg-black border border-gray-800 rounded px-3 py-2 text-sm text-gray-400 font-mono focus:border-gray-600 focus:outline-none"
                            />
                        </div>

                        <div>
                             <div className="flex justify-between items-end mb-2">
                                <label className="block text-xs font-mono text-gray-500">AUDIT CONTEXT PREVIEW</label>
                            </div>
                            <div className="relative">
                                <Code className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
                                <textarea
                                    value={fetchedContext}
                                    readOnly={true}
                                    placeholder="Context will be auto-fetched from GitHub..."
                                    className="w-full bg-black border border-gray-800 rounded-lg py-3 pl-10 pr-4 h-32 text-gray-500 font-mono text-xs focus:outline-none transition-colors resize-y opacity-70"
                                />
                            </div>
                        </div>
                    </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-900 rounded-lg text-red-400 text-sm font-mono flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                {error}
              </div>
            )}

            <button
              onClick={handleAudit}
              disabled={state === AppState.ANALYZING || isFetching}
              className="w-full py-4 bg-white text-black font-bold font-mono text-lg rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isFetching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> FETCHING REPO DATA...
                  </>
              ) : state === AppState.ANALYZING ? (
                <>PROCESSING...</>
              ) : (
                <>INITIATE BRUTAL AUDIT <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse ml-2"></div></>
              )}
            </button>
          </div>
        </div>

        {state === AppState.ANALYZING && (
          <div className="mt-8 print:hidden max-w-3xl mx-auto">
            <TerminalOutput />
          </div>
        )}

        {/* RESULTS VIEW */}
        {state === AppState.COMPLETE && result && parsedReport && (
          <div className="mt-8 animate-fade-in-up">
            
            {/* ACTION BAR - Hidden in Print */}
            <div className="flex justify-between items-center mb-8 print:hidden sticky top-20 z-40 bg-black/80 backdrop-blur py-4 border-b border-gray-800">
                 <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 hover:border-terminal-red rounded-lg font-mono text-sm transition-all group"
                >
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                    AUDIT ANOTHER
                </button>
                <div className="flex gap-2">
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-terminal-gray hover:bg-gray-800 text-white rounded-lg font-mono text-sm border border-gray-700 transition-all"
                    >
                        <Printer className="w-4 h-4" />
                        PRINT
                    </button>
                    <button 
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-terminal-gray hover:bg-gray-800 text-white rounded-lg font-mono text-sm border border-gray-700 transition-all"
                    >
                        <Download className="w-4 h-4" />
                        .MD
                    </button>
                </div>
            </div>

            {/* PRINT HEADER - Visible only in Print */}
            <div className="hidden print:block mb-8 border-b border-black pb-4">
                <h1 className="text-3xl font-bold font-mono text-black">BRUTAL REP AUDITOR REPORT</h1>
                <p className="text-sm font-mono text-gray-600">Generated: {new Date().toLocaleDateString()}</p>
                <p className="text-sm font-mono text-gray-600">Repo: {result.repoName}</p>
                <p className="text-lg font-bold mt-2 text-black">Verdict: {result.verdict}</p>
            </div>

            {/* REPORT LAYOUT */}
            <div className="space-y-12">
                
                {/* 1. TOP ROW: DASHBOARD & VERDICT */}
                <div className="grid lg:grid-cols-2 gap-8 break-inside-avoid">
                    
                    {/* Verdict Card */}
                    <div className="flex flex-col bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-8 relative overflow-hidden print:bg-white print:border-black print:text-black">
                        <div className="absolute top-0 right-0 p-4 opacity-10 print:hidden">
                            <FileText className="w-40 h-40 text-white" />
                        </div>
                        <h3 className="text-gray-500 font-mono uppercase text-xs mb-3 tracking-[0.2em] print:text-gray-600">Executive Summary</h3>
                        <p className="text-2xl md:text-3xl font-bold text-white leading-tight font-sans italic mb-6 print:text-black">
                            "{result.verdict}"
                        </p>
                        <div className="mt-auto pt-6 border-t border-gray-800 print:border-black">
                             <div className="prose prose-invert prose-sm max-w-none text-gray-400 print:prose-black">
                                <ReactMarkdown>{parsedReport.sections.verdict}</ReactMarkdown>
                             </div>
                        </div>
                    </div>

                    {/* Chart Dashboard */}
                    <div className="print:break-inside-avoid">
                         {result.scores && <AuditDashboard scores={result.scores} />}
                    </div>
                </div>

                {/* 2. PHASE 1: THE MATRIX (GRID) */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-4 border-b border-gray-800 pb-4 print:border-black">
                        <div className="w-2 h-8 bg-terminal-green print:bg-black"></div>
                        <div>
                             <h2 className="text-2xl font-bold font-mono text-white print:text-black">PHASE 1: THE MATRIX</h2>
                             <p className="text-xs text-gray-500 font-mono">20-POINT DEEP DIVE ANALYSIS</p>
                        </div>
                    </div>
                    {parsedReport.isParsed ? (
                        <Phase1Grid content={parsedReport.sections.phase1} />
                    ) : (
                        <div className="bg-gray-900/50 p-6 rounded border border-gray-800 print:bg-white print:border-black">
                             <ReactMarkdown className="prose prose-invert max-w-none print:prose-black">{result.markdownReport}</ReactMarkdown>
                        </div>
                    )}
                </section>

                {/* 3. PHASE 2: SCORES DETAIL */}
                <section className="bg-gray-900/20 border border-gray-800 rounded-xl p-8 print:bg-white print:border-black break-inside-avoid">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-6 bg-terminal-amber print:bg-black"></div>
                        <h2 className="text-xl font-bold font-mono text-white print:text-black">PHASE 2: VIBE CHECK & PENALTIES</h2>
                    </div>
                     <div className="prose prose-invert max-w-none text-gray-300 print:prose-black">
                        <ReactMarkdown>{parsedReport.sections.phase2}</ReactMarkdown>
                    </div>
                </section>

                 {/* 4. PHASE 3: FIX PLAN */}
                 <section className="bg-terminal-gray/10 border border-gray-800 rounded-xl p-8 print:bg-white print:border-black">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-8 bg-terminal-red print:bg-black"></div>
                        <div>
                            <h2 className="text-2xl font-bold font-mono text-white print:text-black">PHASE 3: THE FIX PLAN</h2>
                            <p className="text-xs text-gray-500 font-mono">PRIORITIZED REMEDIATION STEPS</p>
                        </div>
                    </div>
                    <FixPlanList content={parsedReport.sections.phase3} />
                </section>

            </div>
          </div>
        )}
      </main>
      
      <footer className="w-full border-t border-gray-900 bg-black py-6 text-center text-xs text-gray-700 font-mono print:hidden mt-20">
        <p>GENERATED BY BRUTAL REP AUDITOR • GEMINI 3.0 PRO POWERED</p>
        <p className="mt-1 opacity-50">
            STRICT LIABILITY PROTOCOL ENABLED • Made with love by <a href="https://github.com/fabriziosalmi" target="_blank" rel="noopener noreferrer" className="hover:text-terminal-green transition-colors">Fabrizio Salmi</a>
        </p>
      </footer>
    </div>
  );
};

export default App;
