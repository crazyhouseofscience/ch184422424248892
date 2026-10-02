import React, { useState, useCallback, useEffect } from 'react';
import { ActiveModule, StationDataPoint, StationEquipmentSetup, StationProgress } from './types';
import { BENCHMARK_LAB_DATA } from './data/labData';
import { Header } from './components/Header';
import { StationInvestigationModule } from './components/StationInvestigationModule';
import { ThreeStationSummarySlide } from './components/ThreeStationSummarySlide';
import { AtmosphericConditionsExplorer } from './components/AtmosphericConditionsExplorer';
import { DataVisualizationStudio } from './components/DataVisualizationStudio';
import { AtmosphereSimulator } from './components/AtmosphereSimulator';
import { PhotonLightSimulationModule } from './components/PhotonLightSimulationModule';
import { LabGuideModal } from './components/LabGuideModal';
import { TeacherUnlockModal } from './components/TeacherUnlockModal';
import { DisplaySettingsModal, AppFontSize, AppTheme } from './components/DisplaySettingsModal';
import { StandaloneDownloadModal } from './components/StandaloneDownloadModal';
import { AccessGateModal, isAlreadyAuthorized, revokeAuthorization } from './components/AccessGateModal';
import { PreLabGatingModal, isPreLabAlreadyCompleted, resetPreLabState } from './components/PreLabGatingModal';
import { Sparkles, CheckCircle2, X, Unlock } from 'lucide-react';
import { safeLocalStorage, safeSessionStorage } from './utils/storage';
import { 
  GraphIncrement, 
  getStoredGraphIncrement, 
  setStoredGraphIncrement, 
  refreshSessionVariances 
} from './utils/sessionDataEngine';

const MODULE_ORDER: ActiveModule[] = [
  'station-1',
  'station-2',
  'station-3',
  'station-summary',
  'light-heat-radiation',
  'atmospheric-conditions',
  'data-visualization',
  'atmosphere',
];

const createInitialSetup = (st: 1 | 2 | 3): StationEquipmentSetup => ({
  stationMode: '3-stations',
  selectedStation: st,
  lampClamped: false,
  lampPluggedIn: false,
  lampHeightInches: 4,
  lampDistanceInches: 12,
  waterAddedMl: 0,
  cylinderFilledMl: 0,
  tabletsAdded: 0,
  probeInserted: false,
  probePosition: 'outside',
  plasticWrapApplied: false,
  claySealed: false,
  fastenedWithBand: false,
  timerPositioned: false,
  isComplete: false,
});

export default function App() {
  // Always start at Station 1
  const [activeModule, setActiveModule] = useState<ActiveModule>('station-1');
  const [labData, setLabData] = useState<StationDataPoint[]>(BENCHMARK_LAB_DATA);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false);
  const [isDisplayModalOpen, setIsDisplayModalOpen] = useState<boolean>(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);

  // Classroom Passcode Protection Gate
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return isAlreadyAuthorized();
  });

  // Pre-Lab Reading & Handout Completion Gate
  const [isPreLabCompleted, setIsPreLabCompleted] = useState<boolean>(() => {
    return isPreLabAlreadyCompleted();
  });

  // Explicit user trigger to return to the Opening Screen modal
  const [isViewingOpeningScreen, setIsViewingOpeningScreen] = useState<boolean>(false);

  // Graph Milestone Interval Option (2m vs 3m increments)
  const [graphIncrement, setGraphIncrement] = useState<GraphIncrement>(() => {
    return getStoredGraphIncrement();
  });

  const handleToggleGraphIncrement = useCallback(() => {
    setGraphIncrement(prev => {
      const next = prev === 3 ? 2 : 3;
      setStoredGraphIncrement(next);
      return next;
    });
  }, []);

  // Display Settings: Theme and Font Size
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (safeLocalStorage.getItem('lab_app_theme') as AppTheme) || 'light';
  });

  const [fontSize, setFontSize] = useState<AppFontSize>(() => {
    return (safeLocalStorage.getItem('lab_app_font_size') as AppFontSize) || 'large';
  });

  // Apply Theme and Font Size to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    safeLocalStorage.setItem('lab_app_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    safeLocalStorage.setItem('lab_app_font_size', fontSize);
  }, [fontSize]);

  // Instructor / Facilitator Mode
  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('teacher') === 'true' || params.get('teacher') === '1') {
          return true;
        }
      } catch {
        // file:/// or restricted context
      }
      return safeSessionStorage.getItem('lab_teacher_mode') === 'true';
    }
    return false;
  });
  const [teacherToast, setTeacherToast] = useState<string | null>(null);

  // Setups for each of the 3 stations
  const [setupsRecord, setSetupsRecord] = useState<Record<1 | 2 | 3, StationEquipmentSetup>>({
    1: createInitialSetup(1),
    2: createInitialSetup(2),
    3: createInitialSetup(3),
  });

  // Gated progress for each of the 3 stations
  const [progressRecord, setProgressRecord] = useState<Record<1 | 2 | 3, StationProgress>>({
    1: { setupComplete: false, dataRecorded: false, recordedData: { 0: 21.0 } },
    2: { setupComplete: false, dataRecorded: false, recordedData: { 0: 21.0 } },
    3: { setupComplete: false, dataRecorded: false, recordedData: { 0: 21.0 } },
  });

  const handleToggleTeacherMode = useCallback(() => {
    setIsTeacherMode((prev) => {
      const next = !prev;
      safeSessionStorage.setItem('lab_teacher_mode', next ? 'true' : 'false');
      setTeacherToast(
        next
          ? 'Instructor Mode Activated: All 7 slides, tables, and controls unlocked!'
          : 'Instructor Mode Deactivated: Normal student gating restored.'
      );
      return next;
    });
  }, []);

  // Quick-Fill All 3 Stations (0m to 15m) for demonstrations
  const handleQuickFillAllData = useCallback(() => {
    setSetupsRecord({
      1: {
        stationMode: '3-stations',
        selectedStation: 1,
        lampClamped: true,
        lampPluggedIn: true,
        lampHeightInches: 4,
        lampDistanceInches: 12,
        waterAddedMl: 100,
        cylinderFilledMl: 100,
        tabletsAdded: 0,
        probeInserted: true,
        probePosition: 'headspace',
        plasticWrapApplied: true,
        claySealed: true,
        fastenedWithBand: true,
        timerPositioned: true,
        isComplete: true,
      },
      2: {
        stationMode: '3-stations',
        selectedStation: 2,
        lampClamped: true,
        lampPluggedIn: true,
        lampHeightInches: 4,
        lampDistanceInches: 12,
        waterAddedMl: 100,
        cylinderFilledMl: 100,
        tabletsAdded: 2,
        probeInserted: true,
        probePosition: 'headspace',
        plasticWrapApplied: true,
        claySealed: true,
        fastenedWithBand: true,
        timerPositioned: true,
        isComplete: true,
      },
      3: {
        stationMode: '3-stations',
        selectedStation: 3,
        lampClamped: true,
        lampPluggedIn: true,
        lampHeightInches: 4,
        lampDistanceInches: 12,
        waterAddedMl: 100,
        cylinderFilledMl: 100,
        tabletsAdded: 4,
        probeInserted: true,
        probePosition: 'headspace',
        plasticWrapApplied: true,
        claySealed: true,
        fastenedWithBand: true,
        timerPositioned: true,
        isComplete: true,
      },
    });

    setProgressRecord({
      1: {
        setupComplete: true,
        dataRecorded: true,
        recordedData: { 0: 21.0, 3: 21.6, 6: 22.2, 9: 22.7, 12: 23.1, 15: 23.5 },
      },
      2: {
        setupComplete: true,
        dataRecorded: true,
        recordedData: { 0: 21.0, 3: 22.1, 6: 23.3, 9: 24.3, 12: 25.2, 15: 25.9 },
      },
      3: {
        setupComplete: true,
        dataRecorded: true,
        recordedData: { 0: 21.0, 3: 22.8, 6: 24.5, 9: 26.0, 12: 27.3, 15: 28.4 },
      },
    });

    setIsTeacherMode(true);
    setTeacherToast('All 3 stations populated with complete 15-minute curves & unlocked!');
  }, []);

  // Slide navigation
  const currentSlideIndex = MODULE_ORDER.indexOf(activeModule);

  const handleNextSlide = useCallback(() => {
    setActiveModule((curr) => {
      const idx = MODULE_ORDER.indexOf(curr);
      if (idx < MODULE_ORDER.length - 1) {
        return MODULE_ORDER[idx + 1];
      }
      return curr;
    });
  }, []);

  const handlePrevSlide = useCallback(() => {
    setActiveModule((curr) => {
      const idx = MODULE_ORDER.indexOf(curr);
      if (idx > 0) {
        return MODULE_ORDER[idx - 1];
      }
      return curr;
    });
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret combination: Ctrl + Shift + T or Cmd + Shift + T or Alt + T
      const isTeacherKey =
        e.key.toLowerCase() === 't' &&
        ((e.ctrlKey && e.shiftKey) || (e.metaKey && e.shiftKey) || e.altKey);

      if (isTeacherKey) {
        e.preventDefault();
        setIsTeacherModalOpen(prev => !prev);
        return;
      }

      if (isTeacherMode) {
        // Slide advancement shortcuts when in Teacher Mode
        if ((e.ctrlKey || e.altKey) && e.key === 'ArrowRight') {
          e.preventDefault();
          handleNextSlide();
        } else if ((e.ctrlKey || e.altKey) && e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrevSlide();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTeacherMode, handleToggleTeacherMode, handleNextSlide, handlePrevSlide]);

  // Auto-dismiss teacher notification toast
  useEffect(() => {
    if (teacherToast) {
      const timer = setTimeout(() => setTeacherToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [teacherToast]);

  const handleUpdateSetup = useCallback((st: 1 | 2 | 3, updated: Partial<StationEquipmentSetup>) => {
    setSetupsRecord(prev => ({
      ...prev,
      [st]: { ...prev[st], ...updated },
    }));
  }, []);

  const handleUpdateProgress = useCallback((st: 1 | 2 | 3, updated: Partial<StationProgress>) => {
    setProgressRecord(prev => ({
      ...prev,
      [st]: { ...prev[st], ...updated },
    }));
  }, []);

  const handleResetData = () => {
    if (window.confirm('Reset all station investigation setups and recorded data?')) {
      setActiveModule('station-1');
      setSetupsRecord({
        1: createInitialSetup(1),
        2: createInitialSetup(2),
        3: createInitialSetup(3),
      });
      setProgressRecord({
        1: { setupComplete: false, dataRecorded: false, recordedData: { 0: 21.0 } },
        2: { setupComplete: false, dataRecorded: false, recordedData: { 0: 21.0 } },
        3: { setupComplete: false, dataRecorded: false, recordedData: { 0: 21.0 } },
      });
      setLabData(BENCHMARK_LAB_DATA);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Header
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onResetData={handleResetData}
        onToggleGuide={() => setIsGuideOpen(true)}
        progressRecord={progressRecord}
        isTeacherMode={isTeacherMode}
        onToggleTeacherMode={handleToggleTeacherMode}
        onOpenTeacherModal={() => setIsTeacherModalOpen(true)}
        onOpenDisplayModal={() => setIsDisplayModalOpen(true)}
        onLockApp={() => {
          revokeAuthorization();
          resetPreLabState();
          setIsAuthenticated(false);
          setIsPreLabCompleted(false);
        }}
        onReturnToOpeningScreen={() => setIsViewingOpeningScreen(true)}
        graphIncrement={graphIncrement}
        onToggleGraphIncrement={handleToggleGraphIncrement}
        onNextSlide={handleNextSlide}
        onPrevSlide={handlePrevSlide}
        currentSlideIndex={currentSlideIndex}
        totalSlides={MODULE_ORDER.length}
        currentTheme={theme}
        currentFontSize={fontSize}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-2 sm:px-4 py-2 sm:py-3 flex flex-col min-h-0">
        {/* Module 1: Station 1 Investigation (0 Tablets - Control) */}
        {activeModule === 'station-1' && (
          <StationInvestigationModule
            stationNumber={1}
            setup={setupsRecord[1]}
            onUpdateSetup={(up) => handleUpdateSetup(1, up)}
            progress={progressRecord[1]}
            onUpdateProgress={(up) => handleUpdateProgress(1, up)}
            onProceedToNext={() => setActiveModule('station-2')}
            isTeacherMode={isTeacherMode}
            graphIncrement={graphIncrement}
            onToggleGraphIncrement={handleToggleGraphIncrement}
          />
        )}

        {/* Module 2: Station 2 Investigation (2 Tablets - Medium CO2) */}
        {activeModule === 'station-2' && (
          <StationInvestigationModule
            stationNumber={2}
            setup={setupsRecord[2]}
            onUpdateSetup={(up) => handleUpdateSetup(2, up)}
            progress={progressRecord[2]}
            onUpdateProgress={(up) => handleUpdateProgress(2, up)}
            onProceedToNext={() => setActiveModule('station-3')}
            isTeacherMode={isTeacherMode}
            graphIncrement={graphIncrement}
            onToggleGraphIncrement={handleToggleGraphIncrement}
          />
        )}

        {/* Module 3: Station 3 Investigation (4 Tablets - High CO2) */}
        {activeModule === 'station-3' && (
          <StationInvestigationModule
            stationNumber={3}
            setup={setupsRecord[3]}
            onUpdateSetup={(up) => handleUpdateSetup(3, up)}
            progress={progressRecord[3]}
            onUpdateProgress={(up) => handleUpdateProgress(3, up)}
            onProceedToNext={() => setActiveModule('station-summary')}
            isTeacherMode={isTeacherMode}
            graphIncrement={graphIncrement}
            onToggleGraphIncrement={handleToggleGraphIncrement}
          />
        )}

        {/* Module 4: 3-Station Comparative Summary Slide */}
        {activeModule === 'station-summary' && (
          <ThreeStationSummarySlide
            progressRecord={progressRecord}
            setupsRecord={setupsRecord}
            onGoToAtmosphericExplorer={() => setActiveModule('atmospheric-conditions')}
            onGoToVisualization={() => setActiveModule('data-visualization')}
            onGoToAtmosphereSim={() => setActiveModule('atmosphere')}
            onRevisitStation={(st) => setActiveModule(`station-${st}` as ActiveModule)}
            onGoToRadiationSim={() => setActiveModule('light-heat-radiation')}
          />
        )}

        {/* Module 5: Pure Graphic Light-to-Heat & CO2 Trapping Simulation (No Text Descriptors) */}
        {activeModule === 'light-heat-radiation' && (
          <PhotonLightSimulationModule
            onBackToLab={() => setActiveModule('station-summary')}
          />
        )}

        {/* Module 6: Clouds, Angles & Other Atmospheric Gases */}
        {activeModule === 'atmospheric-conditions' && (
          <AtmosphericConditionsExplorer />
        )}

        {/* Module 6: Data & Graphing Studio */}
        {activeModule === 'data-visualization' && (
          <DataVisualizationStudio
            labData={labData}
            setLabData={setLabData}
            progressRecord={progressRecord}
            graphIncrement={graphIncrement}
            onToggleGraphIncrement={handleToggleGraphIncrement}
          />
        )}

        {/* Module 7: Planetary Atmosphere Simulator */}
        {activeModule === 'atmosphere' && (
          <AtmosphereSimulator />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/90 py-2.5 text-xs text-slate-500 print:hidden shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1">
            <span className="font-semibold text-slate-300">Greenhouse Effect & Climate Change Lab</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-medium">
              Designed by Keith Chapman 2026 v1.1 using Google AI Studio
            </span>
          </div>
          <div className="flex items-center space-x-3 text-slate-500 text-xs">
            <span className="hidden sm:inline">IPCC WG1 Physical Basis</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <button
              onClick={() => setIsDisplayModalOpen(true)}
              className="text-indigo-400 hover:underline font-medium"
            >
              Display Options ({fontSize === 'normal' ? '100%' : fontSize === 'large' ? '120%' : '140%'} · {theme})
            </button>
          </div>
        </div>
      </footer>

      {/* Teacher / Facilitator Modal */}
      <TeacherUnlockModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        isTeacherMode={isTeacherMode}
        onToggleTeacherMode={handleToggleTeacherMode}
        onSelectModule={setActiveModule}
        activeModule={activeModule}
        onQuickFillAllData={handleQuickFillAllData}
        onNextSlide={handleNextSlide}
        onPrevSlide={handlePrevSlide}
        currentSlideIndex={currentSlideIndex}
        totalSlides={MODULE_ORDER.length}
      />

      {/* Display & Fonts Settings Modal */}
      <DisplaySettingsModal
        isOpen={isDisplayModalOpen}
        onClose={() => setIsDisplayModalOpen(false)}
        fontSize={fontSize}
        onSelectFontSize={setFontSize}
        theme={theme}
        onSelectTheme={setTheme}
      />

      {/* Quick Scientific Guide Modal */}
      <LabGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Standalone Offline & Sharing Modal */}
      <StandaloneDownloadModal 
        isOpen={isDownloadModalOpen} 
        onClose={() => setIsDownloadModalOpen(false)} 
      />

      {/* Classroom Access Password Gate Modal */}
      {!isAuthenticated && (
        <AccessGateModal onAuthorized={() => setIsAuthenticated(true)} />
      )}

      {/* Mandatory Pre-Lab Reading & Handout Gate Modal (Appears after password, or on clicking 'Opening Screen') */}
      {isAuthenticated && (!isPreLabCompleted || isViewingOpeningScreen) && (
        <PreLabGatingModal 
          isOpen={true} 
          onComplete={() => {
            setIsPreLabCompleted(true);
            setIsViewingOpeningScreen(false);
          }}
          onClose={isPreLabCompleted ? () => setIsViewingOpeningScreen(false) : undefined}
          isTeacherMode={isTeacherMode}
        />
      )}

      {/* Teacher Notification Toast */}
      {teacherToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-4 py-3 rounded-2xl border-2 border-purple-500/80 shadow-2xl shadow-purple-950 flex items-center gap-3 backdrop-blur-md animate-fadeIn">
          <div className="w-3 h-3 rounded-full bg-purple-400 animate-ping shrink-0"></div>
          <span className="text-sm font-semibold text-purple-200">{teacherToast}</span>
          <button
            onClick={() => setTeacherToast(null)}
            className="text-slate-400 hover:text-white ml-2 p-1 rounded-md hover:bg-slate-800 transition"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
