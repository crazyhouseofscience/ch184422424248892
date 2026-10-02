import React, { useRef } from 'react';
import { ActiveModule, StationProgress } from '../types';
import { AppFontSize, AppTheme } from './DisplaySettingsModal';
import { GraphIncrement } from '../utils/sessionDataEngine';
import { 
  FlaskConical, 
  Sparkles, 
  Cloud, 
  LineChart, 
  Globe2, 
  RotateCcw,
  Info,
  Sliders,
  Lock,
  Check,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  Unlock,
  Palette,
  Type,
  Sun,
  Moon,
  Home,
  Clock,
  Flame
} from 'lucide-react';

interface HeaderProps {
  activeModule: ActiveModule;
  onSelectModule: (mod: ActiveModule) => void;
  onResetData: () => void;
  onToggleGuide: () => void;
  progressRecord: Record<1 | 2 | 3, StationProgress>;
  isTeacherMode?: boolean;
  onToggleTeacherMode?: () => void;
  onOpenTeacherModal?: () => void;
  onOpenDisplayModal?: () => void;
  onLockApp?: () => void;
  onReturnToOpeningScreen?: () => void;
  graphIncrement?: GraphIncrement;
  onToggleGraphIncrement?: () => void;
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
  currentSlideIndex?: number;
  totalSlides?: number;
  currentTheme?: AppTheme;
  currentFontSize?: AppFontSize;
}

export const Header: React.FC<HeaderProps> = ({
  activeModule,
  onSelectModule,
  onResetData,
  onToggleGuide,
  progressRecord,
  isTeacherMode = false,
  onToggleTeacherMode,
  onOpenTeacherModal,
  onOpenDisplayModal,
  onLockApp,
  onReturnToOpeningScreen,
  graphIncrement = 3,
  onToggleGraphIncrement,
  onNextSlide,
  onPrevSlide,
  currentSlideIndex = 0,
  totalSlides = 7,
  currentTheme = 'light',
  currentFontSize = 'large',
}) => {
  const isStation1Done = progressRecord[1]?.setupComplete && progressRecord[1]?.dataRecorded;
  const isStation2Done = progressRecord[2]?.setupComplete && progressRecord[2]?.dataRecorded;
  const isStation3Done = progressRecord[3]?.setupComplete && progressRecord[3]?.dataRecorded;

  // Secret gesture: Triple-click the logo within 1.5 seconds to toggle Teacher Mode
  const clickTimesRef = useRef<number[]>([]);
  const handleLogoClick = () => {
    const now = Date.now();
    clickTimesRef.current = [...clickTimesRef.current.filter(t => now - t < 1500), now];
    if (clickTimesRef.current.length >= 3) {
      clickTimesRef.current = [];
      if (onOpenTeacherModal) {
        onOpenTeacherModal();
      } else if (onToggleTeacherMode) {
        onToggleTeacherMode();
      }
    }
  };

  const navItems: { 
    id: ActiveModule; 
    label: string; 
    icon: React.ReactNode; 
    badge?: string;
    isLocked: boolean;
    lockReason?: string;
    isDone?: boolean;
  }[] = [
    {
      id: 'station-1',
      label: '1. Station 1 (0 Tablets)',
      icon: <FlaskConical className="w-4 h-4 text-sky-500" />,
      badge: isStation1Done ? 'Done ✓' : 'Current',
      isLocked: false,
      isDone: isStation1Done,
    },
    {
      id: 'station-2',
      label: '2. Station 2 (2 Tablets)',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      badge: isStation2Done ? 'Done ✓' : isStation1Done ? 'Unlocked' : isTeacherMode ? 'Unlocked 🔓' : 'Locked',
      isLocked: isTeacherMode ? false : !isStation1Done,
      lockReason: 'Complete Station 1 setup and record data first.',
      isDone: isStation2Done,
    },
    {
      id: 'station-3',
      label: '3. Station 3 (4 Tablets)',
      icon: <Sparkles className="w-4 h-4 text-rose-500" />,
      badge: isStation3Done ? 'Done ✓' : isStation2Done ? 'Unlocked' : isTeacherMode ? 'Unlocked 🔓' : 'Locked',
      isLocked: isTeacherMode ? false : !isStation2Done,
      lockReason: 'Complete Station 2 setup and record data first.',
      isDone: isStation3Done,
    },
    {
      id: 'station-summary',
      label: '4. 3-Station Summary',
      icon: <Layers className="w-4 h-4 text-emerald-500" />,
      badge: isStation3Done ? 'Ready' : isTeacherMode ? 'Unlocked 🔓' : 'Locked',
      isLocked: isTeacherMode ? false : !isStation3Done,
      lockReason: 'Complete all 3 stations first.',
    },
    {
      id: 'light-heat-radiation',
      label: '5. Radiation Sim',
      icon: <Flame className="w-4 h-4 text-amber-500" />,
      badge: isStation3Done ? 'Visual Sim' : isTeacherMode ? 'Unlocked 🔓' : 'Locked',
      isLocked: isTeacherMode ? false : !isStation3Done,
      lockReason: 'Complete all 3 stations first.',
    },
    {
      id: 'atmospheric-conditions',
      label: '6. Clouds & Gases',
      icon: <Cloud className="w-4 h-4 text-sky-500" />,
      badge: isTeacherMode ? 'Unlocked 🔓' : 'Extension',
      isLocked: isTeacherMode ? false : !isStation3Done,
      lockReason: 'Complete all 3 stations first.',
    },
    {
      id: 'data-visualization',
      label: '7. Graphing Studio',
      icon: <LineChart className="w-4 h-4 text-emerald-500" />,
      badge: isTeacherMode ? 'Unlocked 🔓' : 'Input & Plot',
      isLocked: isTeacherMode ? false : !isStation3Done,
      lockReason: 'Complete all 3 stations first.',
    },
    {
      id: 'atmosphere',
      label: '8. Planetary Sim',
      icon: <Globe2 className="w-4 h-4 text-indigo-500" />,
      badge: isTeacherMode ? 'Unlocked 🔓' : 'Planets',
      isLocked: isTeacherMode ? false : !isStation3Done,
      lockReason: 'Complete all 3 stations first.',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-13 sm:h-14 gap-2">
          {/* Brand & Title */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <div 
              onClick={handleLogoClick}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-sm text-white shrink-0 cursor-pointer select-none active:scale-95 transition"
              title="Greenhouse Effect Lab"
            >
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>Greenhouse Effect & Climate Change Lab</span>
                <span className="hidden xl:inline text-xs text-amber-400 font-mono font-medium">· Virtual Station Investigation</span>
              </h1>
              <div className="text-[10px] text-slate-400 leading-none mt-0.5 hidden sm:block">
                Designed by <span className="text-slate-300 font-semibold">Keith Chapman 2026 v1.2.1</span> using Google AI Studio
              </div>
            </div>
          </div>

          {/* Center: Slide Controls & Status when Teacher Mode is ON */}
          {isTeacherMode && (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-purple-950/90 border-2 border-purple-500/80 rounded-xl px-2.5 sm:px-3 py-1 text-purple-200 text-xs shadow-md animate-fadeIn">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse hidden sm:inline-block"></span>
              <span className="font-bold text-xs text-purple-200 whitespace-nowrap">
                Instructor Mode:
              </span>
              <div className="flex items-center gap-1 border-l border-purple-700/80 pl-2">
                <button
                  onClick={onPrevSlide}
                  disabled={currentSlideIndex === 0}
                  title="Previous Slide (Alt + Left Arrow)"
                  className="p-1 rounded hover:bg-purple-800 disabled:opacity-30 disabled:cursor-not-allowed text-white transition flex items-center gap-0.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Prev</span>
                </button>

                <button
                  onClick={onOpenTeacherModal}
                  title="Click to jump to any slide"
                  className="font-mono text-xs px-2 py-0.5 rounded bg-purple-900 hover:bg-purple-800 font-bold text-amber-300 whitespace-nowrap border border-purple-600 transition"
                >
                  Slide {currentSlideIndex + 1}/{totalSlides} ▾
                </button>

                <button
                  onClick={onNextSlide}
                  disabled={currentSlideIndex >= totalSlides - 1}
                  title="Next Slide (Alt + Right Arrow)"
                  className="p-1 rounded hover:bg-purple-800 disabled:opacity-30 disabled:cursor-not-allowed text-white transition flex items-center gap-0.5"
                >
                  <span className="hidden sm:inline text-xs">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={onToggleTeacherMode}
                title="Lock for Students"
                className="text-purple-300 hover:text-white p-1 rounded hover:bg-purple-800/80 transition ml-1"
                aria-label="Lock for students"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Actions (Right Zone) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Graph Increment Option Toggle (2m vs 3m intervals) */}
            {onToggleGraphIncrement && (
              <button
                id="header-increment-btn"
                onClick={onToggleGraphIncrement}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 transition"
                title={`Click to switch between 2-minute and 3-minute graph milestone intervals (Currently: ${graphIncrement}m)`}
              >
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden xl:inline">Interval:</span>
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/50">
                  {graphIncrement}m
                </span>
              </button>
            )}

            {/* Return to Main Opening Screen Button */}
            {onReturnToOpeningScreen && (
              <button
                id="header-opening-screen-btn"
                onClick={onReturnToOpeningScreen}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-amber-200 hover:text-white bg-amber-950/70 hover:bg-amber-900 border border-amber-600/60 shadow-sm transition"
                title="Return to the Main Opening Screen (Pre-Lab Setup & Driving Question)"
              >
                <Home className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Opening Screen</span>
              </button>
            )}

            {/* Display / Font Size / Theme Button */}
            <button
              id="header-display-btn"
              onClick={onOpenDisplayModal}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 transition"
              title="Change Font Size & Color Theme (Classroom Light / Dark / High Contrast)"
            >
              <Palette className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Display & Fonts</span>
              <span className="text-[11px] font-mono px-1 py-0.2 rounded bg-slate-700 text-amber-300">
                {currentFontSize === 'large' ? '120%' : currentFontSize === 'xl' ? '140%' : '100%'}
              </span>
            </button>

            {/* Guide Button */}
            <button
              id="header-guide-btn"
              onClick={onToggleGuide}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 transition"
              title="View Investigation Overview & Setup Info"
            >
              <Info className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Guide</span>
            </button>

            {/* Reset Button */}
            <button
              id="header-reset-btn"
              onClick={onResetData}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 transition"
              title="Reset Simulated Data"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Lock / Security Button */}
            {onLockApp && (
              <button
                id="header-lock-btn"
                onClick={onLockApp}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 transition"
                title="Lock Laboratory (Requires Passcode to re-enter)"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden lg:inline">Lock</span>
              </button>
            )}
          </div>
        </div>

        {/* Module Navigation Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-1.5 no-scrollbar border-t border-slate-800/60 text-xs sm:text-sm">
          {navItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                disabled={item.isLocked}
                onClick={() => {
                  if (!item.isLocked) {
                    onSelectModule(item.id);
                  }
                }}
                title={item.isLocked ? item.lockReason : item.label}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500/25 text-amber-300 border-2 border-amber-500/60 shadow-sm font-bold'
                    : item.isLocked
                    ? 'text-slate-500 cursor-not-allowed opacity-60 border border-transparent'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                {item.isLocked ? (
                  <Lock className="w-4 h-4 text-slate-500" />
                ) : (
                  item.icon
                )}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-md font-semibold ${
                      isActive
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                        : item.isDone
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        : item.isLocked
                        ? 'bg-slate-900 text-slate-500'
                        : isTeacherMode && item.badge.includes('Unlocked')
                        ? 'bg-purple-950 text-purple-300 border border-purple-800/70'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
