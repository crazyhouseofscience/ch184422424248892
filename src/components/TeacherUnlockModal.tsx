import React, { useState } from 'react';
import { 
  Unlock, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  X, 
  ChevronRight, 
  ShieldCheck, 
  HelpCircle,
  FlaskConical,
  Layers,
  Cloud,
  LineChart,
  Globe2,
  KeyRound,
  Download,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import { ActiveModule } from '../types';
import { getExpectedPassword, setCustomPassword, DEFAULT_PASSCODE, revokeAuthorization } from './AccessGateModal';

interface TeacherUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTeacherMode: boolean;
  onToggleTeacherMode: () => void;
  onSelectModule: (mod: ActiveModule) => void;
  activeModule: ActiveModule;
  onQuickFillAllData: () => void;
  onNextSlide: () => void;
  onPrevSlide: () => void;
  currentSlideIndex: number;
  totalSlides: number;
}

export const TeacherUnlockModal: React.FC<TeacherUnlockModalProps> = ({
  isOpen,
  onClose,
  isTeacherMode,
  onToggleTeacherMode,
  onSelectModule,
  activeModule,
  onQuickFillAllData,
  onNextSlide,
  onPrevSlide,
  currentSlideIndex,
  totalSlides,
}) => {
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Classroom Access Gate Management
  const [currentPasscode, setCurrentPasscode] = useState(() => getExpectedPassword());
  const [newPasscode, setNewPasscode] = useState('');
  const [passcodeSavedMsg, setPasscodeSavedMsg] = useState<string | null>(null);

  const handleSaveNewPasscode = () => {
    if (!newPasscode.trim()) return;
    setCustomPassword(newPasscode.trim());
    setCurrentPasscode(newPasscode.trim());
    setNewPasscode('');
    setPasscodeSavedMsg('Updated classroom access password successfully!');
    setTimeout(() => setPasscodeSavedMsg(null), 3000);
  };

  const handleResetPasscodeDefault = () => {
    setCustomPassword(DEFAULT_PASSCODE);
    setCurrentPasscode(DEFAULT_PASSCODE);
    setNewPasscode('');
    setPasscodeSavedMsg('Reset password to default: ' + DEFAULT_PASSCODE);
    setTimeout(() => setPasscodeSavedMsg(null), 3000);
  };

  const handleTestLockScreen = () => {
    revokeAuthorization();
    window.location.reload();
  };

  if (!isOpen) return null;

  const slides: { id: ActiveModule; title: string; subtitle: string; icon: React.ReactNode }[] = [
    {
      id: 'station-1',
      title: '1. Station 1 Investigation',
      subtitle: '0 Tablets (Control · Ambient 420 ppm CO₂)',
      icon: <FlaskConical className="w-5 h-5 text-sky-400" />,
    },
    {
      id: 'station-2',
      title: '2. Station 2 Investigation',
      subtitle: '2 Tablets (Medium CO₂ · ~1,500 ppm)',
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'station-3',
      title: '3. Station 3 Investigation',
      subtitle: '4 Tablets (High CO₂ · ~3,200 ppm)',
      icon: <Sparkles className="w-5 h-5 text-rose-400" />,
    },
    {
      id: 'station-summary',
      title: '4. 3-Station Comparative Summary',
      subtitle: 'Side-by-side data table & simultaneous thermal curves',
      icon: <Layers className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: 'atmospheric-conditions',
      title: '5. Clouds, Angles & Other Gases',
      subtitle: 'Albedo, solar inclination, CH₄, H₂O, N₂O effects',
      icon: <Cloud className="w-5 h-5 text-sky-400" />,
    },
    {
      id: 'data-visualization',
      title: '6. Data & Graphing Studio',
      subtitle: 'Interactive multi-series plot with CSV export & regression',
      icon: <LineChart className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: 'atmosphere',
      title: '7. Planetary Atmosphere Simulator',
      subtitle: 'Solar radiation balance for Earth, Mars, Venus, and Ice Age',
      icon: <Globe2 className="w-5 h-5 text-indigo-400" />,
    },
  ];

  const handleToggle = () => {
    onToggleTeacherMode();
    setActionSuccess(
      isTeacherMode 
        ? 'Restored normal sequential student locks.' 
        : 'All 7 slides and controls are now unlocked!'
    );
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleQuickFill = () => {
    onQuickFillAllData();
    setActionSuccess('Populated all 3 stations with full 15-minute benchmark data!');
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleJump = (mod: ActiveModule) => {
    onSelectModule(mod);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-slate-900 border-2 border-purple-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-modal-title"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 px-5 py-4 border-b border-purple-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${isTeacherMode ? 'bg-purple-600/30 border-purple-400 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
              {isTeacherMode ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
            <div>
              <h2 id="teacher-modal-title" className="text-lg font-bold text-white flex items-center gap-2">
                <span>Teacher & Facilitator Controls</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  isTeacherMode 
                    ? 'bg-purple-900/90 text-purple-200 border-purple-400' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {isTeacherMode ? 'UNLOCKED' : 'LOCKED (STUDENT MODE)'}
                </span>
              </h2>
              <p className="text-xs text-purple-200/80">
                Unlock all slides, bypass sequential requirements, or jump to any module
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Action Success Alert */}
          {actionSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-200 text-sm flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-medium">{actionSuccess}</span>
            </div>
          )}

          {/* Master Unlock / Lock Toggle Card */}
          <div className={`p-4 rounded-xl border-2 transition-all ${
            isTeacherMode 
              ? 'bg-purple-950/40 border-purple-500' 
              : 'bg-slate-800/60 border-slate-700'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Slide & Station Lock Gating</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-md leading-relaxed">
                  {isTeacherMode 
                    ? 'All 7 slides are currently UNLOCKED. You can jump directly to any station, summary, or extension module without students having to complete prerequisites.'
                    : 'Currently in standard Student Mode. Students must complete Station 1 setup and collect data before advancing to Station 2, Station 3, and Summary.'}
                </p>
              </div>

              <button
                onClick={handleToggle}
                className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shrink-0 ${
                  isTeacherMode
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40'
                }`}
              >
                {isTeacherMode ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Lock Back (Student Mode)</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Unlock All 7 Slides Now</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Classroom Access Gate & Passcode Security */}
          <div className="p-4 bg-slate-800/80 border border-indigo-500/50 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-400" />
                <span>Classroom Access Password Protection</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/80 text-indigo-200 border border-indigo-700/60 font-semibold">
                ACTIVE
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Prevents outsiders from accessing the laboratory without the classroom passcode. Works both online and on offline standalone HTML files.
            </p>

            {passcodeSavedMsg && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/60 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{passcodeSavedMsg}</span>
              </div>
            )}

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/80 space-y-2.5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <span className="text-slate-400">Current Classroom Password:</span>
                <span className="px-2.5 py-1 bg-slate-950 text-amber-300 font-mono font-bold rounded-lg border border-slate-700">
                  {currentPasscode}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  placeholder="Set custom password..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveNewPasscode}
                  disabled={!newPasscode.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Save Code
                </button>
                <button
                  type="button"
                  onClick={handleResetPasscodeDefault}
                  title="Reset to PAPS2026"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>Reset Default</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Want to test the student lock screen?</span>
                <button
                  type="button"
                  onClick={handleTestLockScreen}
                  className="text-amber-400 hover:underline font-medium cursor-pointer"
                >
                  Lock Laboratory & Test Screen
                </button>
              </div>
            </div>
          </div>

          {/* Quick Demonstration Tools */}
          <div className="p-4 bg-slate-800/70 border border-slate-700 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Instant Demonstration Fill</span>
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Presenting to a class? Click below to instantly complete all 3 station apparatus setups and populate full 15-minute temperature curves. You can immediately show the comparative summary and graphing studio without waiting for timers.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                onClick={handleQuickFill}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-md"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Auto-Fill All 3 Stations (0m to 15m Data)</span>
              </button>

              <a
                href="/Greenhouse_Effect_Lab.exe"
                download="Greenhouse_Effect_Lab.exe"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Self-Running .EXE</span>
              </a>

              <a
                href="/Greenhouse_Effect_Lab_Windows.zip"
                download="Greenhouse_Effect_Lab_Windows.zip"
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Desktop ZIP Package</span>
              </a>
            </div>
          </div>

          {/* Direct Slide Jump Menu */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-bold text-slate-200">
                Direct Slide Jump (Click any slide to jump)
              </h3>
              <span className="text-xs text-purple-300 font-mono">
                Current: Slide {currentSlideIndex + 1} of {totalSlides}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {slides.map((s, idx) => {
                const isCurrent = activeModule === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleJump(s.id)}
                    className={`p-3 rounded-xl border text-left transition flex items-center justify-between group ${
                      isCurrent
                        ? 'bg-purple-900/60 border-purple-400 text-white shadow-md'
                        : 'bg-slate-800/70 border-slate-700/80 text-slate-200 hover:bg-slate-700/90 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 shrink-0">{s.icon}</div>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>{s.title}</span>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-purple-500 text-white rounded font-mono">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 group-hover:text-slate-200 transition">
                          {s.subtitle}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition shrink-0 ml-1" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Keyboard Shortcuts Reference */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-1.5">
            <span className="font-semibold text-slate-300">Quick Keyboard Shortcuts:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                <span className="text-purple-300 font-bold">Ctrl + Shift + T</span>
                <span className="block text-[10px] text-slate-400">Toggle Unlock</span>
              </div>
              <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                <span className="text-amber-300 font-bold">Alt + Right Arrow</span>
                <span className="block text-[10px] text-slate-400">Next Slide</span>
              </div>
              <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                <span className="text-amber-300 font-bold">Alt + Left Arrow</span>
                <span className="block text-[10px] text-slate-400">Previous Slide</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Facilitator permissions apply to this browser session.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
