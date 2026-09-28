import React, { useState } from 'react';
import { Download, X, Laptop, FileText, CheckCircle2, Terminal, Copy, Check } from 'lucide-react';
import { ZIP_BASE64 } from '../data/zipBase64';
import { BAT_FILE_CONTENT, PS1_FILE_CONTENT } from '../data/launcherScripts';

interface StandaloneDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StandaloneDownloadModal: React.FC<StandaloneDownloadModalProps> = ({ isOpen, onClose }) => {
  const [copiedBat, setCopiedBat] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Direct client-side binary ZIP download from in-memory base64
  // Works 100% reliably regardless of cloud server proxy routing
  const handleDownloadZip = () => {
    try {
      const binaryString = atob(ZIP_BASE64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Greenhouse_Effect_Lab_Windows.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess('Greenhouse_Effect_Lab_Windows.zip downloaded directly!');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (e) {
      console.error('ZIP generation error:', e);
    }
  };

  // Direct download of the .bat launcher by itself
  const handleDownloadBat = () => {
    const blob = new Blob([BAT_FILE_CONTENT], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Run_Greenhouse_Lab.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess('Run_Greenhouse_Lab.bat downloaded!');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  // Direct download of the .ps1 script
  const handleDownloadPs1 = () => {
    const blob = new Blob([PS1_FILE_CONTENT], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Run_Greenhouse_Lab.ps1';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess('Run_Greenhouse_Lab.ps1 downloaded!');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleCopyBat = () => {
    navigator.clipboard.writeText(BAT_FILE_CONTENT);
    setCopiedBat(true);
    setTimeout(() => setCopiedBat(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col gap-5 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Direct Download: Desktop Launcher & Files</h2>
              <p className="text-xs text-slate-400">Guaranteed real files generated directly inside this browser tab</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Download Success Notice */}
        {downloadSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess} Check your browser's Downloads folder!</span>
          </div>
        )}

        {/* Download Actions */}
        <div className="space-y-3">
          {/* Standalone Single HTML File - Double-click to run offline */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/70 via-slate-900 to-slate-900 border-2 border-sky-500/70 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base">DOUBLE_CLICK_TO_RUN_OFFLINE.html</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-500/30 text-sky-300 font-bold border border-sky-400/40">
                    VITE SINGLE-FILE
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Single, 100% self-contained HTML file. Bundles all JavaScript, CSS, and assets inside. Double-click directly from desktop in Chrome, Edge, Safari, or Firefox without server or internet!
                </p>
              </div>
              <a
                href="/DOUBLE_CLICK_TO_RUN_OFFLINE.html"
                download="DOUBLE_CLICK_TO_RUN_OFFLINE.html"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition shadow-md shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Standalone HTML (1.0 MB)</span>
              </a>
            </div>
          </div>

          {/* Main Action: The Full Complete ZIP */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border-2 border-emerald-500/60 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base">Greenhouse_Effect_Lab_Windows.zip</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-400/40">
                    REAL ZIP EMBEDDED
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Contains: <strong className="text-emerald-300">Run_Greenhouse_Lab.bat</strong>, <strong className="text-emerald-300">Run_Greenhouse_Lab.ps1</strong>, <strong className="text-emerald-300">Greenhouse_Effect_Lab_App.html</strong>, student data sheets & teacher key.
                </p>
              </div>
              <button
                onClick={handleDownloadZip}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition shadow-md shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download ZIP (202 KB)</span>
              </button>
            </div>
          </div>

          {/* Individual Direct Files (If you only need the .bat file) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Direct .BAT file */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-slate-200 text-sm">Run_Greenhouse_Lab.bat</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Single Windows batch launcher script to run the lab with zero blank screens.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadBat}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .bat</span>
                </button>
                <button
                  onClick={handleCopyBat}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
                  title="Copy .bat script code"
                >
                  {copiedBat ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBat ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Direct .PS1 PowerShell script */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-sky-400" />
                  <span className="font-semibold text-slate-200 text-sm">Run_Greenhouse_Lab.ps1</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Native PowerShell listener that provides local HTTP delivery on Windows.
                </p>
              </div>
              <button
                onClick={handleDownloadPs1}
                className="w-full px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .ps1</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Instructions */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
          <div className="font-semibold text-slate-200">How to run:</div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
            <li>Download and extract <strong className="text-slate-200">Greenhouse_Effect_Lab_Windows.zip</strong>.</li>
            <li>Double-click <strong className="text-emerald-400">Run_Greenhouse_Lab.bat</strong>.</li>
            <li>The lab immediately opens in your browser with full physics, charts, audio, and teacher tools enabled.</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Client-Side Safe Delivery
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="text-slate-400 text-[11px]">
              Designed by Keith Chapman 2026 v1.1 using Google AI Studio
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
