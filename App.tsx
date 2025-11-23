
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Download, AlertTriangle, Terminal, Code, FileText, Flame, Github, Key, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { AppState, AuditResult } from './types';
import { runAudit } from './services/geminiService';
import { fetchGitHubRepoData, formatContext } from './services/githubService';
import ScoreChart from './components/ScoreChart';
import { TerminalOutput } from './components/TerminalOutput';

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

    // Phase 1: Fetch Data if not already fetched or if URL changed
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

    // Phase 2: Analyze with Gemini
    setState(AppState.ANALYZING);
    try {
      const data = await runAudit(repoUrl, auditContext);
      setResult(data);
      setState(AppState.COMPLETE);
    } catch (e) {
      setState(AppState.ERROR);
      setError("Audit failed. The codebase might be too messy even for me.");
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

  const handleReset = () => {
    setState(AppState.IDLE);
    setFetchedContext('');
    setRepoUrl('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-terminal-black text-gray-300 font-sans selection:bg-terminal-red selection:text-white pb-20">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-terminal-red/10 rounded border border-terminal-red/20">
              <Flame className="w-6 h-6 text-terminal-red" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-mono">BRUTAL REP AUDITOR</h1>
              <p className="text-xs text-gray-500 font-mono">V2.1 // AUTO-RECONNAISSANCE MODE</p>
            </div>
          </div>
          <div className="text-xs font-mono text-gray-500 border border-gray-800 px-3 py-1 rounded-full">
            STATUS: <span className="text-terminal-green">ONLINE</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        
        {/* Intro Section */}
        {state === AppState.IDLE && (
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Is your code <span className="text-terminal-green">Engineering Substance</span> or <span className="text-terminal-red">AI Slop</span>?
            </h2>
            <p className="text-gray-400 mb-8">
              Generate a ruthless, no-nonsense technical due diligence report for any public Git repository. 
              Automatically fetches history, structure, and docs for deep analysis.
            </p>
          </div>
        )}

        {/* Input Section */}
        <div className={`transition-all duration-500 ${state === AppState.COMPLETE ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
          <div className="grid gap-6 bg-gray-900/30 border border-gray-800 p-6 rounded-xl relative overflow-hidden">
             {/* Decorative Scan Line */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-terminal-red to-transparent opacity-20"></div>

            <div className="grid md:grid-cols-1 gap-6">
              
              {/* Repository URL Input */}
              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">TARGET REPOSITORY URL (GITHUB)</label>
                <div className="relative group">
                  <Github className="absolute left-3 top-3 w-5 h-5 text-gray-600 group-focus-within:text-white transition-colors" />
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => {
                        setRepoUrl(e.target.value);
                        setFetchedContext(''); // Clear context if URL changes
                    }}
                    placeholder="https://github.com/username/repo"
                    className="w-full bg-black border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white font-mono focus:outline-none focus:border-terminal-green focus:ring-1 focus:ring-terminal-green transition-colors"
                  />
                </div>
              </div>

              {/* Advanced / Optional Options */}
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

        {/* Loading Terminal */}
        {state === AppState.ANALYZING && (
          <div className="mt-8">
            <TerminalOutput />
          </div>
        )}

        {/* Results View */}
        {state === AppState.COMPLETE && result && (
          <div className="mt-12 animate-fade-in-up">
            
            {/* Scorecard Dashboard */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Visual Chart */}
                <div className="md:col-span-1">
                    {result.scores && <ScoreChart scores={result.scores} />}
                </div>

                {/* Verdict Box */}
                <div className="md:col-span-2 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-lg p-6 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <FileText className="w-32 h-32 text-white" />
                    </div>
                    <h3 className="text-gray-500 font-mono uppercase text-sm mb-2">Final Verdict</h3>
                    <p className="text-2xl md:text-3xl font-bold text-white leading-tight font-sans">
                        "{result.verdict}"
                    </p>
                    <div className="mt-6 flex gap-4">
                         <button 
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded font-mono text-sm border border-gray-700 transition-all"
                        >
                            <Download className="w-4 h-4" />
                            DOWNLOAD .MD
                        </button>
                        <button 
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white font-mono text-sm transition-all"
                        >
                            RESET
                        </button>
                    </div>
                </div>
            </div>

            {/* Markdown Report Render */}
            <div className="bg-black border border-gray-800 rounded-xl p-8 shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-terminal-gray"></div>
                
                <article className="prose prose-invert prose-headings:font-mono prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300 max-w-none">
                     <ReactMarkdown
                        components={{
                            h1: ({node, ...props}) => <h1 className="text-3xl font-bold border-b border-gray-800 pb-4 mb-6 text-terminal-green" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-10 mb-4 text-white flex items-center gap-2" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-6 mb-3 text-gray-200" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-terminal-red pl-4 italic bg-red-900/10 py-2 pr-2 my-4 rounded-r" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 my-4" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                            code: ({node, ...props}) => {
                                const { className, children, ...rest } = props;
                                const match = /language-(\w+)/.exec(className || '');
                                const isInline = !match && !String(children).includes('\n');
                                
                                return isInline ? (
                                    <code className="bg-gray-800 text-terminal-amber px-1 py-0.5 rounded font-mono text-sm" {...rest}>
                                        {children}
                                    </code>
                                ) : (
                                    <pre className="bg-gray-900 border border-gray-800 p-4 rounded-lg overflow-x-auto my-4 text-sm text-gray-300">
                                        <code className={className} {...rest}>
                                            {children}
                                        </code>
                                    </pre>
                                );
                            }
                        }}
                     >
                        {result.markdownReport}
                     </ReactMarkdown>
                </article>
            </div>
          </div>
        )}
      </main>
      
      <footer className="fixed bottom-0 w-full border-t border-gray-900 bg-black/80 backdrop-blur text-center py-2 text-xs text-gray-700 font-mono">
        GENERATED BY GEMINI 2.5 FLASH • STRICT LIABILITY PROTOCOL ENABLED
      </footer>
    </div>
  );
};

export default App;
