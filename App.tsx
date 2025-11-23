import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Download, AlertTriangle, FileText, Flame, Github, Key, ChevronDown, ChevronUp, Loader2, RefreshCw, Printer, Cpu } from 'lucide-react';
import { AppState, AuditResult } from './types';
import { runAudit } from './services/geminiService';
import { fetchGitHubRepoData, formatContext } from './services/githubService';
import { TerminalOutput } from './components/TerminalOutput';
import { AuditDashboard } from './components/AuditDashboard';
import { Phase1Matrix } from './components/Phase1Matrix';
import { ParetoFixPlan } from './components/ParetoFixPlan';

// --- Main App ---

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [repoUrl, setRepoUrl] = useState('');
  const [ghToken, setGhToken] = useState('');
  const [fetchedContext, setFetchedContext] = useState('');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("");

  const handleAudit = async () => {
    if (!repoUrl) {
      setError("Target repository URL is required.");
      return;
    }

    setError(null);
    let auditContext = fetchedContext;

    if (!auditContext) {
      setLoadingStatus("Connecting to GitHub API...");
      setState(AppState.ANALYZING); // Start loading UI immediately
      
      try {
        setLoadingStatus("Fetching Repo Metadata...");
        const data = await fetchGitHubRepoData(repoUrl, ghToken);
        
        setLoadingStatus("Processing File Tree & Commits...");
        auditContext = formatContext(data);
        setFetchedContext(auditContext);
      } catch (e: any) {
        const msg = e.message || "Failed to fetch repository data.";
        setError(msg);
        
        // AUTO-OPEN Advanced Options if Rate Limit hit
        if (msg.includes("403") || msg.includes("Rate Limit")) {
            setShowAdvanced(true);
        }
        
        setState(AppState.IDLE);
        setLoadingStatus("");
        return;
      }
    }

    setLoadingStatus("Initiating Gemini Audit Protocol...");
    setState(AppState.ANALYZING);

    try {
      setLoadingStatus("Analyzing Code Quality...");
      const data = await runAudit(repoUrl, auditContext);
      setLoadingStatus("Finalizing Report...");
      setResult(data);
      setState(AppState.COMPLETE);
    } catch (e: any) {
      setState(AppState.ERROR);
      setError(`Audit failed: ${e.message || "Unknown error occurred"}`);
    } finally {
      setLoadingStatus("");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    
    // Construct a markdown string from the structured data for download
    let md = `# BRUTAL AUDIT REPORT: ${result.repoName}\n\n`;
    md += `## VERDICT\n${result.verdictShort}\n\n`;
    md += `## SCORE: ${result.scores.total}/100\n\n`;
    md += `${result.finalVerdictContent}\n\n`;
    
    md += `## PHASE 1: THE MATRIX\n`;
    result.phase1.forEach(cat => {
        md += `### ${cat.title}\n`;
        cat.items.forEach(item => {
            md += `- **[${item.score}/5] ${item.label}**: ${item.description}\n`;
        });
        md += `\n`;
    });

    md += `## PHASE 2: VIBE CHECK\n${result.phase2Content}\n\n`;
    
    md += `## PHASE 3: FIX PLAN\n`;
    result.phase3Plans.forEach((step, i) => {
        md += `${i+1}. ${step}\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
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
    setLoadingStatus("");
  };

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
              <p className="text-xs text-gray-500 font-mono">V2.4 // DEEP SCAN PROTOCOL</p>
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
                                <Key className="w-3 h-3" /> GITHUB TOKEN (REQUIRED FOR CLOUD/SHARED IPS)
                            </label>
                            <input
                                type="password"
                                value={ghToken}
                                onChange={(e) => setGhToken(e.target.value)}
                                placeholder="ghp_xxxxxxxxxxxx"
                                className={`w-full bg-black border rounded px-3 py-2 text-sm text-gray-400 font-mono focus:outline-none ${error && error.includes("403") ? "border-terminal-red ring-1 ring-terminal-red" : "border-gray-800 focus:border-gray-600"}`}
                            />
                            {error && error.includes("403") && (
                                <p className="text-terminal-red text-xs mt-1 font-mono">
                                    Cloud/Shared IPs have 0 anonymous quota. Please paste a token above.
                                </p>
                            )}
                        </div>

                        <div>
                             <div className="flex justify-between items-end mb-2">
                                <label className="block text-xs font-mono text-gray-500">AUDIT CONTEXT PREVIEW</label>
                            </div>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
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
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleAudit}
              disabled={state === AppState.ANALYZING}
              className="w-full py-4 bg-white text-black font-bold font-mono text-lg rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {state === AppState.ANALYZING ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> {loadingStatus || "PROCESSING..."}
                  </>
              ) : (
                <>INITIATE BRUTAL AUDIT <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse ml-2"></div></>
              )}
            </button>
          </div>
        </div>

        {state === AppState.ANALYZING && (
          <div className="mt-8 print:hidden max-w-3xl mx-auto">
            <TerminalOutput status={loadingStatus} />
          </div>
        )}

        {/* RESULTS VIEW */}
        {state === AppState.COMPLETE && result && (
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
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded bg-gray-900 border border-gray-800 text-xs font-mono text-gray-500">
                        <Cpu className={`w-3 h-3 ${result.modelUsed.includes('pro') ? 'text-terminal-green' : 'text-terminal-amber'}`} />
                        <span>MODEL: {result.modelUsed.toUpperCase()}</span>
                    </div>

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
            </div>

            {/* PRINT HEADER - Visible only in Print */}
            <div className="hidden print:block mb-8 border-b border-black pb-4">
                <h1 className="text-3xl font-bold font-mono text-black">BRUTAL REP AUDITOR REPORT</h1>
                <p className="text-sm font-mono text-gray-600">Generated: {new Date().toLocaleDateString()}</p>
                <p className="text-sm font-mono text-gray-600">Repo: {result.repoName}</p>
                <p className="text-lg font-bold mt-2 text-black">Verdict: {result.verdictShort}</p>
                <p className="text-xs font-mono mt-1 text-gray-500">Model: {result.modelUsed}</p>
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
                            "{result.verdictShort}"
                        </p>
                        <div className="mt-auto pt-6 border-t border-gray-800 print:border-black">
                             <div className="prose prose-invert prose-sm max-w-none text-gray-400 print:prose-black">
                                <ReactMarkdown>{result.finalVerdictContent}</ReactMarkdown>
                             </div>
                        </div>
                    </div>

                    {/* Chart Dashboard */}
                    <div className="print:break-inside-avoid">
                         <AuditDashboard scores={result.scores} />
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
                    <Phase1Matrix categories={result.phase1} />
                </section>

                {/* 3. PHASE 2: SCORES DETAIL */}
                <section className="bg-gray-900/20 border border-gray-800 rounded-xl p-8 print:bg-white print:border-black break-inside-avoid">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-6 bg-terminal-amber print:bg-black"></div>
                        <h2 className="text-xl font-bold font-mono text-white print:text-black">PHASE 2: VIBE CHECK & PENALTIES</h2>
                    </div>
                     <div className="prose prose-invert max-w-none text-gray-300 print:prose-black">
                        <ReactMarkdown>{result.phase2Content}</ReactMarkdown>
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
                    <ParetoFixPlan steps={result.phase3Plans} />
                </section>

            </div>
          </div>
        )}
      </main>
      
      <footer className="w-full border-t border-gray-900 bg-black py-6 text-center text-xs text-gray-700 font-mono print:hidden mt-20">
        <p>GENERATED BY BRUTAL REP AUDITOR • {result && result.modelUsed.toUpperCase()} POWERED</p>
        <p className="mt-1 opacity-50">
            STRICT LIABILITY PROTOCOL ENABLED • Made with love by <a href="https://github.com/fabriziosalmi" target="_blank" rel="noopener noreferrer" className="hover:text-terminal-green transition-colors">Fabrizio Salmi</a>
        </p>
      </footer>
    </div>
  );
};

export default App;
