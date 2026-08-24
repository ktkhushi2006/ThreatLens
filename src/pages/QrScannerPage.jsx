import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Upload, Globe, ArrowRight, Camera, AlertCircle, Check, XCircle } from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';
import jsQR from 'jsqr';

export function QrScannerPage() {
  const navigate = useNavigate();
  const { analyzeUrl, loading } = useAnalysis();
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedUrl, setExtractedUrl] = useState('');
  const [scanMsg, setScanMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [isUrl, setIsUrl] = useState(false);

  const processImage = (file) => {
    if (!file?.type.startsWith('image/')) {
      setScanMsg('Please upload a valid image file (PNG, JPG, WEBP).');
      setIsError(true);
      return;
    }
    
    setSelectedFile(file);
    setScanMsg('Decoding QR code...');
    setIsError(false);
    setExtractedUrl('');
    setIsUrl(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);
        
        try {
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            const text = code.data;
            setExtractedUrl(text);
            
            // Basic URL check
            if (/^https?:\/\//i.test(text.trim())) {
              setScanMsg('QR decoded successfully! A valid URL was found.');
              setIsError(false);
              setIsUrl(true);
            } else {
              setScanMsg('QR decoded, but the content is not a supported HTTP/HTTPS URL.');
              setIsError(true);
              setIsUrl(false);
            }
          } else {
            setScanMsg('No QR code detected in this image. Try another one.');
            setIsError(true);
          }
        } catch (err) {
          setScanMsg('Error decoding image. Please try again.');
          setIsError(true);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImage(e.dataTransfer.files[0]);
    }
  };

  const handleSendToAnalyzer = async () => {
    if (!extractedUrl.trim() || !isUrl) return;
    await analyzeUrl(extractedUrl.trim(), "QR");
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
          onChange={e => e.target.files?.[0] && processImage(e.target.files[0])}
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
        <div className={`flex items-start gap-3 p-4 rounded-xl border text-xs font-mono transition-all ${
          isError 
            ? 'bg-rose-950/30 border-rose-500/30 text-rose-300' 
            : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
        }`}>
          {isError ? (
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <Check className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold uppercase tracking-wider mb-0.5">
              {isError ? 'Decoding Notice' : 'QR Decoded'}
            </p>
            <p>{scanMsg}</p>
          </div>
        </div>
      )}

      {/* Manual URL entry / Display */}
      <div className="rounded-2xl bg-[#0D1322]/95 border border-slate-800/90 p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-cyan-400" />
          {extractedUrl && !isUrl ? 'QR Content (Not a URL)' : 'URL Extracted from QR Code'}
        </h3>
        <div className="relative">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400/70 pointer-events-none" />
          <input
            type="text"
            value={extractedUrl}
            readOnly
            placeholder="Upload a QR code to extract the URL..."
            className={`w-full rounded-xl bg-slate-950/95 py-3 pl-11 pr-4 text-sm font-mono transition-all border ${
              extractedUrl && !isUrl 
                ? 'text-slate-400 border-slate-700/80 cursor-not-allowed' 
                : 'text-slate-100 placeholder:text-slate-500 border-slate-700/80 focus:border-cyan-400 focus:outline-none'
            }`}
          />
        </div>
        <button
          onClick={handleSendToAnalyzer}
          disabled={!isUrl || loading}
          className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-mono"
        >
          {loading ? (
            <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          {loading ? 'Analyzing...' : 'Analyze Extracted URL'}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default QrScannerPage;
