import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Globe, AlertCircle, ArrowRight, Link2, Inbox } from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

// Simple URL extractor regex
function extractUrls(text) {
  const urlRegex = /https?:\/\/[^\s"'<>()[\]]+/gi;
  return [...new Set(text.match(urlRegex) || [])];
}

export function EmailAnalyzerPage() {
  const navigate = useNavigate();
  const { analyzeUrl, loading } = useAnalysis();
  const [emailContent, setEmailContent] = useState('');
  const [extractedLinks, setExtractedLinks] = useState([]);
  const [analyzed, setAnalyzed] = useState(false);

  const handleExtract = () => {
    const urls = extractUrls(emailContent);
    setExtractedLinks(urls);
    setAnalyzed(true);
  };

  const handleAnalyzeLink = async (url) => {
    await analyzeUrl(url);
    navigate('/analyze');
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

      {/* Status notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 text-xs font-mono">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-cyan-400" />
        <div>
          <p className="font-bold text-slate-200 uppercase tracking-wider mb-0.5">Frontend URL Extraction Active</p>
          <p>Full email header parsing and body analysis requires a backend endpoint (coming soon). URL extraction from pasted email text is available now.</p>
        </div>
      </div>

      {/* Email Input */}
      <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl space-y-4">
        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-cyan-400" /> Paste Email Content
        </label>
        <textarea
          value={emailContent}
          onChange={e => { setEmailContent(e.target.value); setAnalyzed(false); setExtractedLinks([]); }}
          rows={10}
          placeholder={`Paste the full email content here, including:
- Email headers (From, To, Subject, Date)
- Email body text
- Any HTML content

Example suspicious email:
From: security@paypa1.com
Subject: Urgent: Your account is suspended

Dear customer, click here to verify:
https://paypa1-secure.com/login?token=abc123

ThreatLens will extract all URLs for threat analysis.`}
          className="w-full rounded-xl bg-slate-950/95 p-4 text-sm text-slate-100 placeholder:text-slate-600 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none font-mono resize-none transition-all leading-relaxed"
        />
        <button
          onClick={handleExtract}
          disabled={!emailContent.trim()}
          className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-mono"
        >
          <Mail className="h-4 w-4" />
          Extract & Analyze Links
        </button>
      </div>

      {/* Extracted Links */}
      {analyzed && (
        <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Extracted URLs</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {extractedLinks.length} URL{extractedLinks.length !== 1 ? 's' : ''} found
            </span>
          </div>

          {extractedLinks.length > 0 ? (
            <div className="space-y-2.5">
              {extractedLinks.map((url, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span className="text-xs font-mono text-slate-200 truncate">{url}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAnalyzeLink(url)}
                    disabled={loading}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-500/20 transition-all"
                  >
                    Analyze <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
              <Inbox className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-xs font-mono text-slate-400 font-semibold">No URLs Found</p>
              <p className="text-[11px] font-mono text-slate-500">
                No HTTP/HTTPS links were found in the pasted email content.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Planned Features */}
      <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-cyan-400" /> Planned Email Analysis Capabilities
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            'Full email header parsing (SPF, DKIM, DMARC)',
            'Sender domain reputation check',
            'Attachment hash scanning',
            'Brand impersonation in subject/body',
            'Bulk email campaign detection',
            'Email forwarding chain analysis',
          ].map((feat, i) => (
            <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
              {feat}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EmailAnalyzerPage;
