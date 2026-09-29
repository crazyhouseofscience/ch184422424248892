import React, { useState } from 'react';
import { 
  FileCheck2, 
  FlaskConical, 
  Sun, 
  Thermometer, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  AlertTriangle, 
  HelpCircle, 
  Eye, 
  Lock, 
  Unlock, 
  BookOpen, 
  Sparkles,
  Layers,
  Ruler
} from 'lucide-react';
import { safeLocalStorage, safeSessionStorage } from '../utils/storage';
import setupImage from '../assets/images/lab_experiment_setup_1790697813685.jpg';

interface PreLabGatingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  isTeacherMode?: boolean;
}

const PRELAB_STORAGE_KEY = 'lab_prelab_completed_v1';

export const isPreLabAlreadyCompleted = (): boolean => {
  if (typeof window === 'undefined') return true;
  const sessionCheck = safeSessionStorage.getItem(PRELAB_STORAGE_KEY);
  if (sessionCheck === 'true') return true;
  const localCheck = safeLocalStorage.getItem(PRELAB_STORAGE_KEY);
  return localCheck === 'true';
};

export const setPreLabCompletedState = () => {
  safeSessionStorage.setItem(PRELAB_STORAGE_KEY, 'true');
  safeLocalStorage.setItem(PRELAB_STORAGE_KEY, 'true');
};

export const resetPreLabState = () => {
  safeSessionStorage.removeItem(PRELAB_STORAGE_KEY);
  safeLocalStorage.removeItem(PRELAB_STORAGE_KEY);
};

export const PreLabGatingModal: React.FC<PreLabGatingModalProps> = ({
  isOpen,
  onComplete,
  isTeacherMode = false
}) => {
  // Required student acknowledgment checkboxes
  const [readInvestigationQuestion, setReadInvestigationQuestion] = useState(false);
  const [completedHandoutPacket, setCompletedHandoutPacket] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [period, setPeriod] = useState('');
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const canAdvance = 
    readInvestigationQuestion && 
    completedHandoutPacket && 
    studentName.trim().length > 0;

  const handleAdvance = () => {
    if (!canAdvance && !isTeacherMode) {
      setErrorMessage('Please enter your name and confirm you have completed the physical pre-lab handout.');
      return;
    }
    setPreLabCompletedState();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div 
        className="w-full max-w-4xl bg-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prelab-gate-title"
      >
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 p-4 sm:p-5 border-b border-amber-500/40 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50">
                  Pre-Lab Gate · Required Reading
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Keith Chapman 2026 v1.1</span>
              </div>
              <h2 id="prelab-gate-title" className="text-base sm:text-lg font-bold text-white mt-0.5">
                PART 1: Experimental Setup & Variable Identification
              </h2>
            </div>
          </div>

          {isTeacherMode && (
            <button
              onClick={handleAdvance}
              className="px-3 py-1.5 rounded-lg bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-500/50 text-xs font-semibold flex items-center gap-1.5 transition shadow"
              title="Instructor Mode: Bypass pre-lab verification"
            >
              <Unlock className="w-3.5 h-3.5 text-purple-300" />
              <span className="hidden sm:inline">Teacher Bypass</span>
            </button>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-200 text-xs sm:text-sm leading-relaxed flex-1">
          {/* Question Callout Box */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/80 to-slate-900 border-2 border-indigo-500/50 shadow-inner">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              <span>Investigation Driving Question</span>
            </div>
            <p className="mt-2 text-sm sm:text-base font-semibold text-white leading-snug">
              "How does the concentration of atmospheric carbon dioxide (CO₂) affect the temperature of a closed system exposed to a heat source over time?"
            </p>
          </div>

          {/* Background and Investigation Question */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wide">
              <BookOpen className="w-4 h-4" />
              <span>Background and Investigation Question</span>
            </h3>
            <p className="text-slate-300 leading-relaxed">
              In our previous lessons, we learned that global sea levels and global temperatures have risen over the last 150 years, and that atmospheric carbon dioxide (CO₂) levels match this exact timeline. But how can an invisible gas in the air affect temperature?
            </p>
            <p className="text-slate-300 leading-relaxed">
              To find out, our class will investigate this question: <strong>How does the amount of carbon dioxide in the air affect the temperature of a system when exposed to a light and heat source?</strong>
            </p>
          </div>

          {/* Experimental Setup Visual Diagram */}
          <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-2 uppercase tracking-wider">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Apparatus Setup Diagram: Three Atmospheric Chambers</span>
              </span>
              <button
                type="button"
                onClick={() => setShowImageZoom(prev => !prev)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showImageZoom ? 'Collapse' : 'Expand Setup Photo'}</span>
              </button>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-black/60 group">
              <img 
                src={setupImage} 
                alt="Apparatus Setup: 3 bottles with heat lamp at 15 cm distance" 
                className={`w-full object-cover rounded-lg transition-all duration-300 ${
                  showImageZoom ? 'max-h-[500px]' : 'max-h-[280px] sm:max-h-[320px]'
                }`}
              />
              <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur-md p-2 rounded-lg border border-slate-700/80 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-amber-300">
                  Heat Lamp: 15 cm Measured Distance · 100 mL Water per Bottle
                </span>
                <span className="text-slate-400 text-[10px]">
                  Bottle 1: 0 Tablets · Bottle 2: 2 Tablets · Bottle 3: 4 Tablets
                </span>
              </div>
            </div>
          </div>

          {/* How the Experiment Works */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wide">
              <FlaskConical className="w-4 h-4" />
              <span>How the Experiment Works</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-1">
                <span className="font-bold text-white text-xs block">1. Three Identical Bottle Systems</span>
                <p className="text-[12px] text-slate-300">
                  You will set up three identical, clear plastic bottles to represent simplified models of Earth's atmosphere. Each bottle starts with the <strong>exact same volume of water (100 mL)</strong> at the bottom.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-1">
                <span className="font-bold text-white text-xs block">2. Creating Different CO₂ Concentrations</span>
                <p className="text-[12px] text-slate-300">
                  To change the amount of CO₂ gas inside the bottles, you will drop fizzing tablets into the water:
                </p>
                <ul className="text-[11px] text-slate-300 space-y-0.5 mt-1 list-disc list-inside">
                  <li><strong>Bottle 1 (Control / Normal Air):</strong> Water only with 0 tablets. Normal atmospheric air.</li>
                  <li><strong>Bottle 2 (Low CO₂):</strong> Water plus 2 fizzing tablets for low elevated CO₂.</li>
                  <li><strong>Bottle 3 (High CO₂):</strong> Water plus 4 fizzing tablets for high elevated CO₂.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-1">
                <span className="font-bold text-white text-xs block">3. Sealing the Systems</span>
                <p className="text-[12px] text-slate-300">
                  Each bottle is immediately capped tightly with a rubber stopper containing a digital temperature sensor inserted into the <strong>air space above the water</strong> (headspace).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-1">
                <span className="font-bold text-white text-xs block">4. Applying Thermal Energy & Collecting Data</span>
                <p className="text-[12px] text-slate-300">
                  All three bottles are placed at the <strong>exact same measured distance (15 cm)</strong> and angle in front of a heat lamp (radiant light and thermal energy source representing the Sun). Turn on the heat lamp and record the air temperature in degrees Celsius inside all three bottles <strong>every 2 minutes for a total of 20 minutes</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Student Handout Confirmation Section */}
          <div className="p-4 rounded-xl bg-amber-950/30 border-2 border-amber-500/60 space-y-3">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              <span>Student Pre-Lab Verification (Mandatory Before Accessing Lab)</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Students cannot advance into the virtual laboratory stations until they have completed the paper Pre-Lab handout handed out to them in class by the teacher.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Student Name (First and Last) *
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="e.g., Alex Johnson"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Class Period / Group
                </label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="e.g., Period 3, Station Table 2"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-amber-900/40">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={readInvestigationQuestion}
                  onChange={(e) => {
                    setReadInvestigationQuestion(e.target.checked);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-900 w-4 h-4 cursor-pointer"
                />
                <span>
                  I have read the Background, Driving Question, and Experimental Setup instructions shown above.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={completedHandoutPacket}
                  onChange={(e) => {
                    setCompletedHandoutPacket(e.target.checked);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-900 w-4 h-4 cursor-pointer"
                />
                <span>
                  <strong>I have completed the paper Pre-Lab handout</strong> that was handed out to me in class.
                </span>
              </label>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-700 text-xs text-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Advance Button */}
        <div className="bg-slate-950 px-4 sm:px-6 py-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Station Access is locked until pre-lab requirements are satisfied</span>
          </div>

          <button
            onClick={handleAdvance}
            disabled={!canAdvance && !isTeacherMode}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-lg ${
              canAdvance || isTeacherMode
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 cursor-pointer active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <span>Proceed to Virtual Laboratory</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
