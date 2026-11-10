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
    detail?: string;
    icon: React.ReactNode; 
    badge?: string;
    isLocked: boolean;
    lockReason?: string;
    isDone?: boolean;
  }[] = [
    {
      id: 'station-1',
      label: '1. Station 1',
      detail: '(0 Tab)',
      icon: <FlaskConical className="w-3.5 h-3.5 text-sky-500 shrink-0" />,
      badge: isStation1Done ? 'Done ✓' : 'Control',
      isLocked: false,
      isDone: isStation1Done,
    },
    {
      id: 'station-2',
      label: '2. Station 2',
      detail: '(2 Tab)',
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
      badge: isStation2Done ? 'Done ✓' : 'Med CO₂',
      isLocked: false,
      isDone: isStation2Done,
    },
    {
      id: 'station-3',
      label: '3. Station 3',
      detail: '(4 Tab)',
      icon: <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />,
      badge: isStation3Done ? 'Done ✓' : 'High CO₂',
      isLocked: false,
      isDone: isStation3Done,
    },
    {
      id: 'station-summary',
      label: '4. Summary',
      icon: <Layers className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
      badge: isStation3Done ? 'Done ✓' : 'Summary',
      isLocked: false,
    },
    {
      id: 'light-heat-radiation',
      label: '5. Radiation Sim',
      icon: <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
      badge: 'Visual Sim',
      isLocked: false,
    },
    {
      id: 'atmospheric-conditions',
      label: '6. Clouds & Gases',
      icon: <Cloud className="w-3.5 h-3.5 text-sky-500 shrink-0" />,
      badge: 'Gases',
      isLocked: false,
    },
    {
      id: 'data-visualization',
      label: '7. Graphing Studio',
      icon: <LineChart className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
      badge: 'Plot',
      isLocked: false,
    },
    {
      id: 'atmosphere',
      label: '8. Planetary Sim',
      icon: <Globe2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />,
      badge: 'Planets & IR',
      isLocked: false,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-5">
        <div className="flex items-center justify-between min-h-[3rem] sm:min-h-[3.25rem] py-1 gap-2 flex-wrap sm:flex-nowrap">
          {/* Brand & Title */}
          <div className="flex items-center space-x-2 shrink min-w-0">
            <div 
              onClick={handleLogoClick}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-sm text-white shrink-0 cursor-pointer select-none active:scale-95 transition"
              title="Greenhouse Effect Lab"
            >
              <FlaskConical className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm lg:text-base font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
                <span>Greenhouse Effect Lab</span>
                <span className="hidden xl:inline text-xs text-amber-400 font-mono font-medium">· Virtual Station Investigation</span>
              </h1>
              <div className="text-[9.5px] text-slate-400 leading-none mt-0.5 hidden sm:block truncate">
                Designed by <span className="text-slate-300 font-semibold">Keith Chapman 2026 v1.2.1</span> using Google AI Studio
              </div>
            </div>
          </div>

          {/* Center: Slide Controls & Status when Teacher Mode is ON */}
          {isTeacherMode && (
            <div className="flex items-center gap-1 sm:gap-1.5 bg-purple-950/90 border-2 border-purple-500/80 rounded-xl px-2 py-0.5 text-purple-200 text-xs shadow-md shrink-0">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse hidden sm:inline-block"></span>
              <span className="font-bold text-[11px] text-purple-200 whitespace-nowrap hidden md:inline">
                Instructor Mode:
              </span>
              <div className="flex items-center gap-0.5 border-l border-purple-700/80 pl-1.5">
                <button
                  onClick={onPrevSlide}
                  disabled={currentSlideIndex === 0}
                  title="Previous Slide (Alt + Left Arrow)"
                  className="p-0.5 rounded hover:bg-purple-800 disabled:opacity-30 disabled:cursor-not-allowed text-white transition flex items-center gap-0.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Prev</span>
                </button>

                <button
                  onClick={onOpenTeacherModal}
                  title="Click to jump to any slide"
                  className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-purple-900 hover:bg-purple-800 font-bold text-amber-300 whitespace-nowrap border border-purple-600 transition"
                >
                  Slide {currentSlideIndex + 1}/{totalSlides} ▾
                </button>

                <button
                  onClick={onNextSlide}
                  disabled={currentSlideIndex >= totalSlides - 1}
                  title="Next Slide (Alt + Right Arrow)"
                  className="p-0.5 rounded hover:bg-purple-800 disabled:opacity-30 disabled:cursor-not-allowed text-white transition flex items-center gap-0.5"
                >
                  <span className="hidden sm:inline text-[11px]">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={onToggleTeacherMode}
                title="Lock for Students"
                className="text-purple-300 hover:text-white p-0.5 rounded hover:bg-purple-800/80 transition ml-0.5"
                aria-label="Lock for students"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Actions (Right Zone) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap sm:flex-nowrap justify-end">
            {/* Graph Increment Option Toggle (2m vs 3m intervals) */}
            {onToggleGraphIncrement && (
              <button
                id="header-increment-btn"
                onClick={onToggleGraphIncrement}
                className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 transition"
                title={`Click to switch between 2-minute and 3-minute graph milestone intervals (Currently: ${graphIncrement}m)`}
              >
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden xl:inline">Interval:</span>
                <span className="font-mono text-[11px] px-1 py-0.2 rounded bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/50">
                  {graphIncrement}m
                </span>
              </button>
            )}

            {/* Return to Main Opening Screen Button */}
            {onReturnToOpeningScreen && (
              <button
                id="header-opening-screen-btn"
                onClick={onReturnToOpeningScreen}
                className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-amber-200 hover:text-white bg-amber-950/70 hover:bg-amber-900 border border-amber-600/60 shadow-sm transition"
                title="Return to the Main Opening Screen (Pre-Lab Setup & Driving Question)"
              >
                <Home className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Hub</span>
              </button>
            )}

            {/* Display / Font Size / Theme Button */}
            <button
              id="header-display-btn"
              onClick={onOpenDisplayModal}
              className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 transition"
              title="Change Font Size & Color Theme (Classroom Light / Dark / High Contrast)"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Display</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-700 text-amber-300">
                {currentFontSize === 'large' ? '120%' : currentFontSize === 'xl' ? '140%' : '100%'}
              </span>
            </button>

            {/* Guide Button */}
            <button
              id="header-guide-btn"
              onClick={onToggleGuide}
              className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 transition"
              title="View Investigation Overview & Setup Info"
            >
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Guide</span>
            </button>

            {/* Reset Button */}
            <button
              id="header-reset-btn"
              onClick={onResetData}
              className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 transition"
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
                className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 transition"
                title="Lock Laboratory (Requires Passcode to re-enter)"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden lg:inline">Lock</span>
              </button>
            )}
          </div>
        </div>

        {/* Module Navigation Tabs (Selector 2) */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-1 no-scrollbar border-t border-slate-800/60 text-xs w-full pr-8">
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
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl font-medium whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-amber-500/25 text-amber-300 border-2 border-amber-500/60 shadow-sm font-bold'
                    : item.isLocked
                    ? 'text-slate-500 cursor-not-allowed opacity-60 border border-transparent'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                {item.isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                ) : (
                  item.icon
                )}
                <span>{item.label}</span>
                {item.detail && (
                  <span className="hidden xl:inline text-[9.5px] text-slate-400 font-normal">
                    {item.detail}
                  </span>
                )}
                {item.badge && (
                  <span
                    className={`text-[9.5px] px-1.5 py-0.2 rounded font-semibold ${
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
