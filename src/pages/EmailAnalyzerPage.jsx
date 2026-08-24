import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Globe, AlertCircle, ArrowRight, Link2, Inbox, Shield, AlertTriangle } from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

// Simple URL extractor regex
function extractUrls(text) {
  const urlRegex = /https?:\/\/[^\s"'<>()[\]]+/gi;
  return [...new Set(text.match(urlRegex) || [])];
}

const RISK_COLORS = {
  LOW: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const RISK_WEIGHTS = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

export function EmailAnalyzerPage() {
  const navigate = useNavigate();
  const { analyzeUrl } = useAnalysis();
  const [emailContent, setEmailContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  
  const handleExtractAndAnalyze = async () => {
    const urls = extractUrls(emailContent);
    if (urls.length === 0) {
      setResults({ urls: [], summary: null });
      return;
    }

    setAnalyzing(true);
    setResults(null);

    const analyzedUrls = [];
    for (const url of urls) {
      try {
        const res = await analyzeUrl(url, "EMAIL");
        analyzedUrls.push({ url, result: res, error: null });
      } catch (err) {
        analyzedUrls.push({ url, result: null, error: err.message });
      }
    }

    // Determine overall risk
    let highestRiskLevel = 'LOW';
    let highestRiskUrl = null;
    let highestRiskScore = -1;

    for (const item of analyzedUrls) {
      if (item.result) {
        const score = item.result.risk_score || 0;
        const level = item.result.risk_level || 'LOW';
        
        if (RISK_WEIGHTS[level] > RISK_WEIGHTS[highestRiskLevel] || (RISK_WEIGHTS[level] === RISK_WEIGHTS[highestRiskLevel] && score > highestRiskScore)) {
          highestRiskLevel = level;
          highestRiskUrl = item.result;
          highestRiskScore = score;
        }
      }
    }

    setResults({
      urls: analyzedUrls,
      overallRisk: highestRiskLevel,
      highestRiskUrl: highestRiskUrl
    });
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Mail className="h-5 w-5 text-cyan-400" /> Email Analyzer
        </h1>
        <p className="text-xs font-mono text-slate-400 mt-0.5">
          Paste email content to extract and analyze embedded URLs for threats
        </p>
      </div>

      {/* Email Input */}
      <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl space-y-4">
        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-cyan-400" /> Paste Email Content
        </label>
        <textarea
          value={emailContent}
          onChange={e => { setEmailContent(e.target.value); setResults(null); }}
          rows={10}
          placeholder={`Paste the full email content here...`}
          className="w-full rounded-xl bg-slate-950/95 p-4 text-sm text-slate-100 placeholder:text-slate-600 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none font-mono resize-none transition-all leading-relaxed"
        />
        <button
          onClick={handleExtractAndAnalyze}
          disabled={!emailContent.trim() || analyzing}
          className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-mono"
        >
          {analyzing ? (
            <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          {analyzing ? 'Analyzing Links...' : 'Extract & Analyze Links'}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {results.urls.length > 0 ? (
            <>
              {/* Summary Card */}
              <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl flex flex-col md:flex-row items-center gap-6 justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-full flex items-center justify-center border-2 ${RISK_COLORS[results.overallRisk]}`}>
                    {results.overallRisk === 'LOW' ? <Shield className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                  </div>
                  <div>
                    <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Overall Email Risk</p>
                    <p className={`text-2xl font-black font-mono ${RISK_COLORS[results.overallRisk].split(' ')[0]}`}>
                      {results.overallRisk}
                    </p>
                  </div>
                </div>
                
                {results.highestRiskUrl && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex-1 w-full">
                    <p className="text-[10px] font-mono text-slate-500 mb-1">Highest Risk URL ({results.highestRiskUrl.risk_score}/100)</p>
                    <p className="text-xs font-mono text-slate-200 truncate">{results.highestRiskUrl.url}</p>
                    <button 
                      onClick={() => navigate('/report')}
                      className="mt-2 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      View Security Report <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* URL List */}
              <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Analyzed URLs</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {results.urls.length} URL{results.urls.length !== 1 ? 's' : ''} found
                  </span>
                </div>

                <div className="space-y-3">
                  {results.urls.map((item, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                          <span className="text-xs font-mono text-slate-200 truncate">{item.url}</span>
                        </div>
                      </div>
                      
                      {item.result ? (
                        <div className="flex items-center gap-3 shrink-0">
                          <div className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase border ${RISK_COLORS[item.result.risk_level || 'LOW']}`}>
                            {item.result.risk_level || 'LOW'} — {item.result.risk_score || 0}
                          </div>
                          <button
                            onClick={async () => {
                              // We just re-analyze or we can just fetch history. Re-analyze is safest to load it into context.
                              await analyzeUrl(item.url, "EMAIL");
                              navigate('/report');
                            }}
                            className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                          >
                            Report <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-rose-400 border border-rose-500/30 bg-rose-500/10 px-2 py-1 rounded shrink-0">
                          Analysis Failed
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-8 text-center space-y-2">
              <Inbox className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-xs font-mono text-slate-400 font-semibold">No URLs Found</p>
              <p className="text-[11px] font-mono text-slate-500">
                No HTTP/HTTPS links were found in the pasted email content.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EmailAnalyzerPage;
