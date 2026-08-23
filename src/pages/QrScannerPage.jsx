import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Upload, Globe, ArrowRight, Camera, AlertCircle, Check } from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

export function QrScannerPage() {
  const navigate = useNavigate();
  const { analyzeUrl, loading } = useAnalysis();
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedUrl, setExtractedUrl] = useState('');
  const [scanMsg, setScanMsg] = useState('');

  const handleFile = (file) => {
    if (!file?.type.startsWith('image/')) {
      setScanMsg('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    setSelectedFile(file);
    setScanMsg('QR image loaded. QR decoding requires a backend endpoint (not yet connected). You can manually enter the URL extracted from your QR code below.');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleSendToAnalyzer = async () => {
    if (!extractedUrl.trim()) return;
    await analyzeUrl(extractedUrl);
    navigate('/analyze');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <QrCode className="h-5 w-5 text-cyan-400" /> QR Code Scanner
        </h1>
        <p className="text-xs font-mono text-slate-400 mt-0.5">
          Upload a QR code image to extract and analyze the embedded URL
        </p>
      </div>

      {/* Status notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs font-mono">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
        <div>
          <p className="font-bold text-amber-200 uppercase tracking-wider mb-0.5">QR Backend Not Connected</p>
          <p>Automatic QR decoding requires a backend endpoint which is not yet implemented. Upload your QR image and manually enter the URL below to analyze it.</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-cyan-400 bg-cyan-950/20'
            : selectedFile
            ? 'border-emerald-500/50 bg-emerald-950/10'
            : 'border-slate-700/60 bg-[#0D1322]/60 hover:border-slate-600 hover:bg-[#0D1322]/80'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />
        <div className="space-y-3">
          {selectedFile ? (
            <>
              <div className="h-14 w-14 mx-auto rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Check className="h-7 w-7 text-emerald-400" />
              </div>
              <p className="text-sm font-mono font-bold text-emerald-300">{selectedFile.name}</p>
              <p className="text-xs font-mono text-slate-400">Click to replace</p>
            </>
          ) : (
            <>
              <div className="h-14 w-14 mx-auto rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Upload className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-sm font-mono font-semibold text-slate-300">
                Drop a QR code image here
              </p>
              <p className="text-xs font-mono text-slate-500">or click to browse (PNG, JPG, WEBP)</p>
            </>
          )}
        </div>
      </div>

      {scanMsg && (
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs font-mono text-slate-300">
          {scanMsg}
        </div>
      )}

      {/* Manual URL entry */}
      <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-cyan-400" />
          URL Extracted from QR Code
        </h3>
        <div className="relative">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400/70 pointer-events-none" />
          <input
            type="text"
            value={extractedUrl}
            onChange={e => setExtractedUrl(e.target.value)}
            placeholder="https://extracted-url-from-qr-code.com"
            className="w-full rounded-xl bg-slate-950/95 py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-500 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none font-mono transition-all"
          />
        </div>
        <button
          onClick={handleSendToAnalyzer}
          disabled={!extractedUrl.trim() || loading}
          className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-mono"
        >
          <Globe className="h-4 w-4" />
          Analyze Extracted URL
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Future Features */}
      <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Camera className="h-3.5 w-3.5 text-cyan-400" /> Planned QR Capabilities
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            'Auto QR decode from image upload',
            'Live camera QR scanning',
            'Batch QR image processing',
            'QR payload type detection (URL, vCard, WiFi)',
            'Embedded malicious payload detection',
            'QR history & export',
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

export default QrScannerPage;
