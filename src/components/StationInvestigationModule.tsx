import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, 
  Thermometer, 
  Clock, 
  Droplets, 
  Flame, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  Sliders, 
  Zap, 
  FlaskConical, 
  Sparkles,
  Play,
  Pause,
  ChevronRight,
  Info,
  Check,
  Table,
  Lightbulb,
  X,
  Lock,
  Volume2,
  VolumeX,
  Bell,
  LineChart,
  BookOpen
} from 'lucide-react';
import { StationEquipmentSetup, StationProgress } from '../types';
import { StationOverviewModal } from './StationOverviewModal';
import { 
  playClampSnapSound, 
  playWaterPourSound, 
  startFizzingSound, 
  stopFizzingSound, 
  playSuccessChime,
  playLampClickSound,
  playTimerBeep,
  playDataLogSound,
  toggleMuteAudio,
  getIsAudioMuted
} from '../utils/audio';
import { ApparatusVisualizer } from './ApparatusVisualizer';

interface StationInvestigationModuleProps {
  stationNumber: 1 | 2 | 3;
  setup: StationEquipmentSetup;
  onUpdateSetup: (update: Partial<StationEquipmentSetup>) => void;
  progress: StationProgress;
  onUpdateProgress: (update: Partial<StationProgress>) => void;
  onProceedToNext: () => void;
  isTeacherMode?: boolean;
}

export const StationInvestigationModule: React.FC<StationInvestigationModuleProps> = ({
  stationNumber,
  setup,
  onUpdateSetup,
  progress,
  onUpdateProgress,
  onProceedToNext,
  isTeacherMode = false,
}) => {
  // Main phase: 'setup' -> 'experiment'
  const [phase, setPhase] = useState<'setup' | 'experiment'>(
    progress.setupComplete ? 'experiment' : 'setup'
  );

  // Setup Step: 1 (clamp), 2 (dimensions), 3 (water & reactants), 4 (seal & timer)
  const [setupStep, setSetupStep] = useState<1 | 2 | 3 | 4>(1);

  // Active Hint Modal
  const [showHintModal, setShowHintModal] = useState<boolean>(false);
  const [showOverviewModal, setShowOverviewModal] = useState<boolean>(false);

  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(getIsAudioMuted());

  // Animations & Audio
  const [isBubbling, setIsBubbling] = useState<boolean>(false);
  const [isPouring, setIsPouring] = useState<boolean>(false);

  // Experiment Live States
  const [lampOn, setLampOn] = useState<boolean>(progress.lampOn ?? false);
  const [timerSeconds, setTimerSeconds] = useState<number>(progress.timerSeconds ?? 0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(5); // Default 5x so line visibly moves smoothly
  const [recordedTemps, setRecordedTemps] = useState<Record<number, number>>(
    progress.recordedData || { 0: 21.0 }
  );
  // Thermal segment history tracking when the heat lamp is ON vs OFF
  // Enables true piecewise thermodynamic integration:
  // Heating up when ON -> Newton cooling toward ambient when OFF ->
  // Resuming heating from the cooled temperature when turned back ON!
  // Factors in the exact duration the light was off AND the loss of added heat!
  interface ThermalSegment {
    startMin: number;
    lampOn: boolean;
  }
  const [lampSegments, setLampSegments] = useState<ThermalSegment[]>(
    progress.lampSegments || [{ startMin: 0, lampOn: false }]
  );

  // Auto-record milestones toggle
  const [autoLogEnabled, setAutoLogEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Dissolution progress (0 to 1) for fizzing tablets
  const [dissolutionProgress, setDissolutionProgress] = useState<number>(
    setup.tabletsAdded > 0 ? (progress.setupComplete ? 1.0 : 0.25) : 0
  );

  const assignedTablets = stationNumber === 1 ? 0 : stationNumber === 2 ? 2 : 4;
  const stationSubTitle = stationNumber === 1 
    ? 'Control (Ambient Air, 0 Fizzing Tablets)' 
    : stationNumber === 2 
    ? 'Medium CO₂ (2 Fizzing Tablets)' 
    : 'High CO₂ (4 Fizzing Tablets)';

  // Continuous dissolution progress & active effervescence
  useEffect(() => {
    let dissolveInterval: any = null;
    if (setup.tabletsAdded > 0 && setup.waterAddedMl >= 50 && dissolutionProgress < 1.0) {
      if (!isMuted) startFizzingSound();
      dissolveInterval = setInterval(() => {
        setDissolutionProgress(prev => {
          // Accelerate dissolution if experiment timer is fast-forwarding, or 1.2% per second
          const stepRate = isRunning ? 0.015 * simSpeed : 0.012;
          const next = prev + stepRate;
          if (next >= 1.0) {
            stopFizzingSound();
            return 1.0;
          }
          return next;
        });
      }, 1000);
    } else if (dissolutionProgress >= 1.0 || setup.tabletsAdded === 0) {
      stopFizzingSound();
    }

    return () => {
      if (dissolveInterval) clearInterval(dissolveInterval);
    };
  }, [setup.tabletsAdded, setup.waterAddedMl, dissolutionProgress, isRunning, simSpeed, isMuted]);

  // Validation rules for each step
  // Step 1: Clamp & Outlet
  const isStep1Complete = setup.lampClamped && setup.lampPluggedIn;

  // Step 2: Dimensions (Height 6-8", Distance 6-8")
  const isHeightValid = setup.lampHeightInches >= 6 && setup.lampHeightInches <= 8;
  const isDistanceValid = setup.lampDistanceInches >= 6 && setup.lampDistanceInches <= 8;
  const isStep2Complete = isHeightValid && isDistanceValid;

  // Step 3: Water & Tablets
  const isWaterAdded = setup.waterAddedMl >= 50;
  const isTabletsAdded = setup.tabletsAdded === assignedTablets;
  const isStep3Complete = isWaterAdded && isTabletsAdded;

  // Step 4: Probe & Seal
  const isProbeValid = setup.probeInserted && setup.probePosition === 'headspace';
  const isWrapValid = setup.plasticWrapApplied;
  const isClayValid = setup.claySealed;
  const isTimerValid = setup.timerPositioned;
  const isStep4Complete = isProbeValid && isWrapValid && isClayValid && isTimerValid;

  const isAllSetupComplete = isStep1Complete && isStep2Complete && isStep3Complete && isStep4Complete;

  // Continuous Thermodynamic Piecewise Integration Engine
  // Accounts for exact periods when lamp is ON (heating) and OFF (Newton cooling),
  // strictly factoring in both:
  // 1) The exact duration the light was off (zero radiant energy received during that period)
  // 2) The loss of added heat (Newton cooling actively dissipates absorbed thermal energy)
  // When turned back on, the temperature does NOT jump back to the assumed position;
  // instead, radiant heating resumes from the cooled temperature, with equivalent thermal
  // progress age (tEquiv) set back by the cooling loss, ensuring a realistic thermal lag!
  const getPhysicsTemp = (targetMin: number, customSegments?: { startMin: number; lampOn: boolean }[]) => {
    const ambient = 21.0;
    const maxDelta = assignedTablets === 0 ? 2.5 : assignedTablets === 2 ? 4.9 : 7.4;
    const tauHeat = assignedTablets === 0 ? 6.5 : assignedTablets === 2 ? 7.2 : 8.0;
    const tauCool = assignedTablets === 0 ? 5.0 : assignedTablets === 2 ? 8.0 : 11.5;

    // Adjust for distance from bottle: baseline is 7 inches
    const distFactor = Math.pow(7 / Math.max(setup.lampDistanceInches, 5), 1.25);
    const targetDelta = maxDelta * distFactor * (setup.claySealed ? 1.0 : 0.4);

    if (targetMin <= 0) return ambient;

    const segments = customSegments || lampSegments;
    let currentTemp = ambient;
    let prevTime = 0;
    let prevLampOn = segments[0]?.lampOn ?? lampOn;

    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.startMin >= targetMin) break;

      const dt = seg.startMin - prevTime;
      if (dt > 0) {
        if (prevLampOn) {
          // Heating up: compute equivalent radiant heating time from currentTemp
          const ratio = Math.max(0, Math.min(0.999, (currentTemp - ambient) / targetDelta));
          const tEquiv = -tauHeat * Math.log(1 - ratio);
          const tNew = tEquiv + dt;
          currentTemp = ambient + targetDelta * (1 - Math.exp(-tNew / tauHeat));
        } else {
          // Cooling down toward ambient (Newton's law of cooling: loss of added heat)
          currentTemp = ambient + (currentTemp - ambient) * Math.exp(-dt / tauCool);
        }
      }

      prevTime = seg.startMin;
      prevLampOn = seg.lampOn;
    }

    // Final slice up to targetMin
    const dtFinal = Math.max(0, targetMin - prevTime);
    if (dtFinal > 0) {
      if (prevLampOn) {
        const ratio = Math.max(0, Math.min(0.999, (currentTemp - ambient) / targetDelta));
        const tEquiv = -tauHeat * Math.log(1 - ratio);
        const tNew = tEquiv + dtFinal;
        currentTemp = ambient + targetDelta * (1 - Math.exp(-tNew / tauHeat));
      } else {
        currentTemp = ambient + (currentTemp - ambient) * Math.exp(-dtFinal / tauCool);
      }
    }

    return Number(currentTemp.toFixed(1));
  };

  // Theoretical continuous uninterrupted baseline curve (constant heat with no lamp-off interruption)
  const getUninterruptedTemp = (targetMin: number) => {
    const ambient = 21.0;
    const maxDelta = assignedTablets === 0 ? 2.5 : assignedTablets === 2 ? 4.9 : 7.4;
    const tauHeat = assignedTablets === 0 ? 6.5 : assignedTablets === 2 ? 7.2 : 8.0;
    const distFactor = Math.pow(7 / Math.max(setup.lampDistanceInches, 5), 1.25);
    const targetDelta = maxDelta * distFactor * (setup.claySealed ? 1.0 : 0.4);
    if (targetMin <= 0) return ambient;
    return Number((ambient + targetDelta * (1 - Math.exp(-targetMin / tauHeat))).toFixed(1));
  };

  // Calculate cumulative minutes the lamp was switched OFF up to current time
  const calculateLampOffMinutes = (upToMin: number) => {
    let offMinutes = 0;
    let prevT = 0;
    let wasOn = lampSegments[0]?.lampOn ?? lampOn;
    for (let i = 1; i < lampSegments.length; i++) {
      const seg = lampSegments[i];
      if (seg.startMin >= upToMin) break;
      if (!wasOn) {
        offMinutes += seg.startMin - prevT;
      }
      prevT = seg.startMin;
      wasOn = seg.lampOn;
    }
    if (!wasOn && upToMin > prevT) {
      offMinutes += upToMin - prevT;
    }
    return offMinutes;
  };

  const currentMinutes = Math.floor(timerSeconds / 60);
  const currentTimeMinutes = timerSeconds / 60;
  const currentLiveTemp = getPhysicsTemp(currentTimeMinutes);

  // Flash toast helper
  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          const next = prev + 1 * simSpeed;
          const prevMin = Math.floor(prev / 60);
          const nextMin = Math.floor(next / 60);

          if (nextMin > prevMin) {
            playTimerBeep();
          }

          if (next >= 900) { // 15 min limit
            setIsRunning(false);
            return 900;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, simSpeed]);

  // Milestone Auto-Record Effect (Triggered cleanly when timer crosses milestone marks)
  useEffect(() => {
    if (!autoLogEnabled || !isRunning) return;
    const currentMin = Math.floor(timerSeconds / 60);
    const milestoneTargets = [0, 3, 6, 9, 12, 15];
    if (milestoneTargets.includes(currentMin) && recordedTemps[currentMin] === undefined) {
      const recordedVal = getPhysicsTemp(currentMin);
      const updated = { ...recordedTemps, [currentMin]: recordedVal };
      setRecordedTemps(updated);
      onUpdateProgress({
        recordedData: updated,
        dataRecorded: milestoneTargets.every(m => updated[m] !== undefined),
      });
      playDataLogSound();
      showToast(`Auto-plotted ${currentMin}m data point: ${recordedVal.toFixed(1)}°C ✓`);
    }
  }, [timerSeconds, autoLogEnabled, isRunning, recordedTemps, onUpdateProgress]);

  // Bubble sound for tablets
  useEffect(() => {
    if (assignedTablets > 0 && setup.waterAddedMl > 0 && isBubbling) {
      startFizzingSound();
    } else {
      stopFizzingSound();
    }
    return () => stopFizzingSound();
  }, [isBubbling, assignedTablets, setup.waterAddedMl]);

  // Handlers for Setup
  const handleToggleClamp = () => {
    const next = !setup.lampClamped;
    onUpdateSetup({ lampClamped: next });
    playClampSnapSound();
  };

  const handleTogglePlug = () => {
    const next = !setup.lampPluggedIn;
    onUpdateSetup({ lampPluggedIn: next });
    playClampSnapSound();
  };

  const handleFillCylinder = () => {
    onUpdateSetup({ cylinderFilledMl: 50 });
  };

  const handlePourWater = () => {
    if (setup.cylinderFilledMl < 50 && setup.waterAddedMl === 0) return;
    setIsPouring(true);
    playWaterPourSound();
    setTimeout(() => {
      onUpdateSetup({ cylinderFilledMl: 0, waterAddedMl: 50 });
      setIsPouring(false);
    }, 600);
  };

  const handleAddTablets = () => {
    onUpdateSetup({ tabletsAdded: assignedTablets });
    if (assignedTablets > 0) {
      setDissolutionProgress(0.02);
      setIsBubbling(true);
      if (!isMuted) startFizzingSound();
      showToast(`${assignedTablets} fizzing tablets added! Chemical reaction is actively fizzing — seal the bottle promptly!`);
    }
  };

  const handleInsertProbe = (pos: 'headspace' | 'submerged') => {
    onUpdateSetup({ probeInserted: true, probePosition: pos });
  };

  const handleVerifySetupAndProceed = () => {
    if (!isAllSetupComplete) return;
    onUpdateProgress({ setupComplete: true });
    playSuccessChime();
    setPhase('experiment');
    // Pre-activate heat lamp and initial thermal heating segment
    if (!lampOn) {
      setLampOn(true);
      playLampClickSound(true);
      const initSegments = [{ startMin: 0, lampOn: true }];
      setLampSegments(initSegments);
      onUpdateProgress({ lampOn: true, lampSegments: initSegments });
    }
  };

  // Handlers for Experiment
  const handleToggleLamp = () => {
    const next = !lampOn;
    setLampOn(next);
    playLampClickSound(next);
    const curMin = timerSeconds / 60;

    const last = lampSegments[lampSegments.length - 1];
    let updatedSegments: ThermalSegment[];
    if (curMin === 0 && lampSegments.length <= 1) {
      updatedSegments = [{ startMin: 0, lampOn: next }];
    } else if (last && Math.abs(last.startMin - curMin) < 0.005) {
      updatedSegments = [...lampSegments.slice(0, -1), { startMin: curMin, lampOn: next }];
    } else {
      updatedSegments = [...lampSegments, { startMin: curMin, lampOn: next }];
    }

    setLampSegments(updatedSegments);
    onUpdateProgress({ lampOn: next, lampSegments: updatedSegments });

    if (!next) {
      const curTemp = getPhysicsTemp(curMin, updatedSegments);
      showToast(`150W Lamp OFF at ${curMin.toFixed(1)}m (${curTemp.toFixed(1)}°C) · Radiant heat stopped, bottle is cooling to ambient (21.0°C)!`);
    } else {
      const curTemp = getPhysicsTemp(curMin, updatedSegments);
      showToast(`150W Lamp back ON at ${curMin.toFixed(1)}m · Resuming radiant heating from cooled state (${curTemp.toFixed(1)}°C). Lost heat and off-time factored in!`);
    }
  };

  const handleStartPause = () => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    // Only auto-turn on lamp if starting timer at 0:00 initially
    if (nextRunning && !lampOn && timerSeconds === 0) {
      setLampOn(true);
      playLampClickSound(true);
      const initSegs = [{ startMin: 0, lampOn: true }];
      setLampSegments(initSegs);
      onUpdateProgress({ lampOn: true, lampSegments: initSegs });
      showToast('Heat lamp ON · Radiant energy heating activated!');
    }
  };

  const handleLogDataPoint = (minuteMark?: number) => {
    const min = minuteMark !== undefined ? minuteMark : currentMinutes;
    // Cannot log future milestones before reaching them in time
    if (min > currentMinutes) {
      showToast(`Cannot log ${min}m reading before stopwatch reaches ${min}:00!`);
      return;
    }
    const tempToRecord = getPhysicsTemp(min);
    const updated = { ...recordedTemps, [min]: tempToRecord };
    setRecordedTemps(updated);
    onUpdateProgress({ recordedData: updated });
    playDataLogSound();
    showToast(`Plotted & Logged ${min}m point: ${tempToRecord.toFixed(1)}°C ✓`);

    const requiredIntervals = [0, 3, 6, 9, 12, 15];
    const hasAll = requiredIntervals.every(int => updated[int] !== undefined);
    if (hasAll || Object.keys(updated).length >= 6) {
      onUpdateProgress({ dataRecorded: true });
    }
  };

  const handleResetExperiment = () => {
    if (window.confirm('Reset this station experiment timer and logged data?')) {
      setIsRunning(false);
      setLampOn(false);
      setTimerSeconds(0);
      setLampSegments([{ startMin: 0, lampOn: false }]);
      setRecordedTemps({ 0: 21.0 });
      onUpdateProgress({ dataRecorded: false, recordedData: { 0: 21.0 } });
      showToast('Experiment reset to 00:00.');
    }
  };

  // Instructor Facilitator Overrides
  const handleTeacherCompleteSetup = () => {
    onUpdateSetup({
      lampClamped: true,
      lampPluggedIn: true,
      lampHeightInches: 7,
      lampDistanceInches: 7,
      waterAddedMl: 50,
      cylinderFilledMl: 0,
      tabletsAdded: assignedTablets,
      probeInserted: true,
      probePosition: 'headspace',
      plasticWrapApplied: true,
      claySealed: true,
      timerPositioned: true,
      isComplete: true,
    });
    onUpdateProgress({ setupComplete: true });
    setPhase('experiment');
    if (!lampOn) {
      setLampOn(true);
      const initSegs = [{ startMin: 0, lampOn: true }];
      setLampSegments(initSegs);
      onUpdateProgress({ setupComplete: true, lampOn: true, lampSegments: initSegs });
    }
    showToast(`Instructor Mode: Station ${stationNumber} setup auto-verified & launched.`);
  };

  const handleTeacherQuickFill = () => {
    const benchmarkTemps: Record<number, number> = {
      0: 21.0,
      3: stationNumber === 1 ? 22.0 : stationNumber === 2 ? 22.8 : 23.6,
      6: stationNumber === 1 ? 22.7 : stationNumber === 2 ? 24.1 : 25.5,
      9: stationNumber === 1 ? 23.1 : stationNumber === 2 ? 24.9 : 26.8,
      12: stationNumber === 1 ? 23.4 : stationNumber === 2 ? 25.5 : 27.7,
      15: stationNumber === 1 ? 23.5 : stationNumber === 2 ? 25.9 : 28.4,
    };
    setRecordedTemps(benchmarkTemps);
    setTimerSeconds(15 * 60);
    setLampOn(true);
    setLampSegments([{ startMin: 0, lampOn: true }]);
    onUpdateProgress({
      setupComplete: true,
      dataRecorded: true,
      recordedData: benchmarkTemps,
      lampOn: true,
      timerSeconds: 15 * 60,
    });
    showToast(`Instructor Mode: All 6 interval readings populated for Station ${stationNumber}.`);
  };

  const intervalMinutes = [0, 3, 6, 9, 12, 15];
  const recordedCount = intervalMinutes.filter(m => recordedTemps[m] !== undefined).length;
  const isDataCollectionComplete = recordedCount === intervalMinutes.length || progress.dataRecorded;

  // Find due milestones (any interval <= currentMinutes that hasn't been logged yet)
  const unloggedDueMilestone = intervalMinutes.find(m => currentMinutes >= m && recordedTemps[m] === undefined);
  const nextUpcomingMilestone = intervalMinutes.find(m => currentMinutes < m);
  const secondsToNextMilestone = nextUpcomingMilestone !== undefined 
    ? nextUpcomingMilestone * 60 - timerSeconds 
    : 0;

  // Active milestone for table card highlight
  const currentIntervalSegment = intervalMinutes.find(m => Math.abs(currentMinutes - m) <= 1) ?? intervalMinutes[0];

  // -------------------------------------------------------------
  // DYNAMIC GRAPH LINE & COORDINATE MATH
  // Width: 580px, Height: 200px
  // X Margins: 45 to 555 (width 510px)
  // Y Margins: 20 to 165 (height 145px)
  // -------------------------------------------------------------
  const GRAPH_LEFT = 45;
  const GRAPH_WIDTH = 510;
  const GRAPH_TOP = 20;
  const GRAPH_BOTTOM = 165;
  const GRAPH_HEIGHT = GRAPH_BOTTOM - GRAPH_TOP; // 145px

  const getGraphX = (min: number) => GRAPH_LEFT + (Math.max(0, Math.min(15, min)) / 15) * GRAPH_WIDTH;
  const getGraphY = (temp: number) => GRAPH_BOTTOM - ((Math.max(20, Math.min(30, temp)) - 20) / 10) * GRAPH_HEIGHT;

  // Highest minute where we have live progress or logged points
  const recordedMinKeys = Object.keys(recordedTemps).map(Number);
  const highestLoggedMin = recordedMinKeys.length > 0 ? Math.max(...recordedMinKeys) : 0;
  const activeDrawLimitMin = Math.max(currentTimeMinutes, Math.min(currentTimeMinutes + 0.05, 15));

  // Build the live heating line path points strictly up to the current progress
  const linePoints: { x: number; y: number }[] = [];
  
  // Starting point at t=0
  const startX = getGraphX(0);
  const startY = getGraphY(21.0);
  linePoints.push({ x: startX, y: startY });

  // Generate points as time advances
  if (timerSeconds > 0 || highestLoggedMin > 0) {
    const endMin = Math.max(activeDrawLimitMin, 0.01);
    const step = 0.15; // smooth resolution
    for (let m = step; m <= endMin; m += step) {
      linePoints.push({
        x: getGraphX(m),
        y: getGraphY(getPhysicsTemp(m))
      });
    }
    // Add current live head point
    linePoints.push({
      x: getGraphX(endMin),
      y: getGraphY(currentLiveTemp)
    });
  }

  const livePathD = linePoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');

  const currentUninterruptedTemp = getUninterruptedTemp(currentTimeMinutes);
  const heatDeficitDeg = Math.max(0, Number((currentUninterruptedTemp - currentLiveTemp).toFixed(1)));
  const totalOffTimeMin = calculateLampOffMinutes(currentTimeMinutes);

  // Theoretical continuous uninterrupted baseline curve points (ONLY drawn up to current time, and ONLY if lamp was turned off to show contrast)
  const uninterruptedPoints: { x: number; y: number }[] = [];
  if (totalOffTimeMin > 0.05 && currentTimeMinutes > 0.1) {
    for (let m = 0; m <= currentTimeMinutes; m += 0.15) {
      uninterruptedPoints.push({
        x: getGraphX(m),
        y: getGraphY(getUninterruptedTemp(m))
      });
    }
  }
  const uninterruptedPathD = uninterruptedPoints.length > 1
    ? uninterruptedPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ')
    : '';

  // Gradient area fill polygon
  const areaPolygonD = linePoints.length > 1
    ? `${livePathD} L ${linePoints[linePoints.length - 1].x.toFixed(1)} ${GRAPH_BOTTOM} L ${startX} ${GRAPH_BOTTOM} Z`
    : '';

  // Current advancing cursor position
  const currentCursorX = getGraphX(currentTimeMinutes);
  const currentCursorY = getGraphY(currentLiveTemp);

  const stationThemeColor = stationNumber === 1 ? '#38bdf8' : stationNumber === 2 ? '#f59e0b' : '#f43f5e';

  // Scientific guidance content
  const getHintContent = () => {
    if (phase === 'experiment') {
      return {
        title: 'Experiment Phase Guidance',
        requirements: [
          'Switch the 150W heat lamp to ON to radiate infrared energy towards the bottle.',
          'Click "Start Timer" (simulation runs at 5x or 15x speed so the line visibly advances across the graph in real time).',
          'Watch the glowing curve draw live across the screen as time elapses.',
          'Notice: Turning the heat lamp OFF stops thermal energy input and starts active cooling toward ambient (21.0°C). When turned back ON, the simulation factors in both the duration the light was off and the loss of added heat — the curve resumes from the cooled state and does not jump to the assumed position!',
          'Click "Plot" to stamp your interval data points at 0, 3, 6, 9, 12, and 15 minutes, or leave Auto-Record enabled!',
        ],
        science: 'As infrared photons strike the plastic bottle, carbon dioxide molecules absorb and re-emit thermal energy. Higher CO₂ concentrations lead to a steeper heating curve. When the lamp is turned off, radiant photon flux ceases immediately and the bottle loses heat to the ambient air. When radiant heating resumes, it must first recover this lost thermal energy, causing an enduring lag compared to the uninterrupted baseline.',
      };
    }
    return {
      title: 'Apparatus Setup Guidance',
      requirements: [
        'Step 1: Clamp the heat lamp firmly to the ring stand and plug the electrical cord into the outlet.',
        'Step 2: Calibrate both vertical height (6–8") and horizontal distance (6–8") using the lab sliders.',
        'Step 3: Measure 50 mL of water with the cylinder, pour into the bottle, and add the assigned fizzing tablets.',
        'Step 4: Suspend the probe in the air headspace, seal with plastic wrap & modeling clay, and place the timer.',
      ],
      science: 'Consistent geometric distances between trials prevent confounding variables from the inverse-square law. Suspending the probe in the air headspace ensures we measure atmospheric greenhouse warming rather than liquid water heating.',
    };
  };

  const hintData = getHintContent();

  return (
    <div className="flex flex-col h-full space-y-2 select-none animate-fadeIn">
      {/* COMPACT TOP STATION HEADER BAR (Height ~38px) */}
      <div className="bg-slate-900/90 rounded-xl px-3 py-1.5 border border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stationThemeColor }} />
          <span className="text-xs sm:text-sm font-bold text-white">
            Station {stationNumber}: <span className="font-normal text-slate-300">{stationSubTitle}</span>
          </span>
        </div>

        {/* Phase Segmented Switch */}
        <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setPhase('setup')}
            className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
              phase === 'setup'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>1. Setup</span>
            {progress.setupComplete && <Check className="w-3 h-3 text-emerald-400" />}
          </button>

          <button
            onClick={() => {
              if (isAllSetupComplete || isTeacherMode) setPhase('experiment');
            }}
            disabled={!isAllSetupComplete && !isTeacherMode}
            className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
              phase === 'experiment'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isAllSetupComplete || isTeacherMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <LineChart className="w-3 h-3" />
            <span>2. Live Run & Graph</span>
            {isDataCollectionComplete ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : !isAllSetupComplete && !isTeacherMode ? (
              <Lock className="w-2.5 h-2.5 text-slate-600" />
            ) : null}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1.5 text-xs">
          <button
            onClick={() => setShowOverviewModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/50 transition text-[11px] font-semibold"
            title="Read detailed explanation of Part 1, 2, and 3 before starting"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Read Parts 1, 2, & 3 Guide</span>
          </button>

          <button
            onClick={() => setShowHintModal(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition text-[11px] font-semibold"
          >
            <Lightbulb className="w-3 h-3" />
            <span>Hints</span>
          </button>

          <button
            onClick={() => {
              const next = toggleMuteAudio();
              setIsMuted(next);
            }}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-950/95 border border-emerald-500/60 text-emerald-200 px-3 py-2 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-semibold animate-slideUp">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Guidance Modal */}
      {showHintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-3 relative">
            <button
              onClick={() => setShowHintModal(false)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{hintData.title}</span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <span className="font-bold text-sky-300 block">Procedures:</span>
                <ul className="space-y-1 text-slate-200">
                  {hintData.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-400">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 space-y-1">
                <span className="font-bold text-indigo-300 block">Scientific Principles:</span>
                <p className="leading-relaxed text-slate-300">{hintData.science}</p>
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                onClick={() => setShowHintModal(false)}
                className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 1: APPARATUS SETUP (ZERO-SCROLL WORKBENCH) */}
      {phase === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
          {/* Left Column: 4-Step Setup Controls (6 cols) */}
          <div className="lg:col-span-6 bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex flex-col justify-between space-y-2 overflow-hidden">
            {/* Step Navigation Stepper */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs text-center font-medium">
              {[
                { s: 1, label: '1. Clamp', valid: isStep1Complete, active: setupStep === 1 },
                { s: 2, label: '2. Distance', valid: isStep2Complete, active: setupStep === 2, locked: !isStep1Complete && !isTeacherMode },
                { s: 3, label: '3. Reactants', valid: isStep3Complete, active: setupStep === 3, locked: !isStep2Complete && !isTeacherMode },
                { s: 4, label: '4. Seal', valid: isStep4Complete, active: setupStep === 4, locked: !isStep3Complete && !isTeacherMode },
              ].map(item => (
                <button
                  key={item.s}
                  onClick={() => {
                    if (!item.locked) setSetupStep(item.s as any);
                  }}
                  disabled={item.locked}
                  className={`py-1.5 px-1 rounded-md transition flex items-center justify-center gap-1 text-[11px] ${
                    item.active
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : item.locked
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.valid && <Check className={`w-2.5 h-2.5 ${item.active ? 'text-slate-950' : 'text-emerald-400'}`} />}
                </button>
              ))}
            </div>

            {/* Pre-Lab Student Purpose Callout */}
            <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="text-[11px] leading-tight">
                  <span className="font-bold text-white">
                    {stationNumber === 1 && 'Part 1 Purpose: Experimental Control with Ambient Air (0 Tablets)'}
                    {stationNumber === 2 && 'Part 2 Purpose: Medium Greenhouse Gas Forcing (~1,800 ppm CO₂, 2 Tablets)'}
                    {stationNumber === 3 && 'Part 3 Purpose: High Greenhouse Gas Concentration (~3,200 ppm CO₂, 4 Tablets)'}
                  </span>
                  <span className="text-slate-400 block mt-0.5">
                    {stationNumber === 1 && 'Provides the baseline heating rate (+4.3°C rise) for comparison.'}
                    {stationNumber === 2 && 'Tests how adding 2 fizzing tablets accelerates thermal retention (+6.5°C rise).'}
                    {stationNumber === 3 && 'Tests maximum infrared trapping (+8.2°C rise) from 4 fizzing tablets.'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOverviewModal(true)}
                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] shrink-0 transition"
              >
                Read Details
              </button>
            </div>

            {/* Instructor Auto-Complete Setup Shortcut */}
            {isTeacherMode && !isAllSetupComplete && (
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-purple-950/70 border border-purple-600/50 text-xs animate-fadeIn">
                <span className="text-[11px] text-purple-200 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Instructor Mode Active</span>
                </span>
                <button
                  onClick={handleTeacherCompleteSetup}
                  className="px-2.5 py-1 rounded bg-purple-800 hover:bg-purple-700 text-white font-semibold text-[11px] transition shadow flex items-center gap-1"
                  title="Auto-fill all setup steps and launch experiment"
                >
                  <span>Auto-Complete Setup & Launch →</span>
                </button>
              </div>
            )}

            {/* Step 1: Clamp & Outlet */}
            {setupStep === 1 && (
              <div className="space-y-2.5 p-1">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Step 1: Secure Heat Lamp & Power Connection
                  </span>
                  <span className="text-[10px] text-slate-400">Step 1/4</span>
                </div>

                <p className="text-[11px] text-slate-300">
                  Position apparatus safely. Firmly clamp the metal reflector lamp to the stand pointing outward and plug into the 120V outlet.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleToggleClamp}
                    className={`p-3 rounded-lg border text-left transition flex flex-col justify-between gap-1.5 ${
                      setup.lampClamped 
                        ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200 ring-1 ring-emerald-500/30' 
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Clamp Lamp to Stand</span>
                      {setup.lampClamped && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {setup.lampClamped ? 'Secured firmly ✓' : 'Click to clamp fixture'}
                    </span>
                  </button>

                  <button
                    onClick={handleTogglePlug}
                    className={`p-3 rounded-lg border text-left transition flex flex-col justify-between gap-1.5 ${
                      setup.lampPluggedIn 
                        ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200 ring-1 ring-emerald-500/30' 
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Plug into Outlet</span>
                      {setup.lampPluggedIn && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {setup.lampPluggedIn ? 'Connected to 120V ✓' : 'Click to plug in cord'}
                    </span>
                  </button>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      if (isStep1Complete) setSetupStep(2);
                    }}
                    disabled={!isStep1Complete}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      isStep1Complete ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Next: Calibrate Distance</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Dimensions */}
            {setupStep === 2 && (
              <div className="space-y-2 p-1">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-sky-400" />
                    Step 2: Lamp Height & Distance Calibration
                  </span>
                  <span className="text-[10px] text-slate-400">Step 2/4</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Vertical Height (6–8" zone):</span>
                    <span className={`font-mono font-bold ${isHeightValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {setup.lampHeightInches}" {isHeightValid && '✓'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="14"
                    step="1"
                    value={setup.lampHeightInches}
                    onChange={(e) => onUpdateSetup({ lampHeightInches: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Distance from Bottle (6–8" zone):</span>
                    <span className={`font-mono font-bold ${setup.lampDistanceInches < 5 ? 'text-rose-400' : isDistanceValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {setup.lampDistanceInches}" {isDistanceValid && '✓'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="14"
                    step="1"
                    value={setup.lampDistanceInches}
                    onChange={(e) => onUpdateSetup({ lampDistanceInches: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
                  />
                  {setup.lampDistanceInches < 5 && (
                    <span className="text-[10px] text-rose-400 font-semibold block">
                      ⚠️ Under 5" will melt the bottle! Move back to 6–8".
                    </span>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button onClick={() => setSetupStep(1)} className="text-xs text-slate-400 hover:text-white">
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      if (isStep2Complete) setSetupStep(3);
                    }}
                    disabled={!isStep2Complete}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      isStep2Complete ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Next: Water & Tablets</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Water & Reactants */}
            {setupStep === 3 && (
              <div className="space-y-2 p-1">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    Step 3: Measure Water & Add Reactants
                  </span>
                  <span className="text-[10px] text-slate-400">Step 3/4</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleFillCylinder}
                    disabled={setup.waterAddedMl >= 50 || setup.cylinderFilledMl >= 50}
                    className={`p-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      setup.waterAddedMl >= 50 
                        ? 'bg-slate-800 text-slate-500 cursor-default' 
                        : setup.cylinderFilledMl >= 50 
                        ? 'bg-emerald-900/60 border border-emerald-700 text-emerald-300' 
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow'
                    }`}
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>{setup.cylinderFilledMl >= 50 ? 'Cylinder Filled (50 mL)' : '1. Fill 50 mL Water'}</span>
                  </button>

                  <button
                    onClick={handlePourWater}
                    disabled={setup.cylinderFilledMl < 50 || setup.waterAddedMl >= 50}
                    className={`p-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      setup.waterAddedMl >= 50 
                        ? 'bg-emerald-800 text-emerald-200 cursor-default' 
                        : setup.cylinderFilledMl >= 50 
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow animate-pulse' 
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>2. Pour into Bottle</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Station {stationNumber} Assignment:</span>
                    <span className="font-bold text-amber-400">{assignedTablets} Fizzing Tablets</span>
                  </div>

                  <button
                    onClick={handleAddTablets}
                    disabled={setup.waterAddedMl < 50 || setup.tabletsAdded === assignedTablets}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      setup.tabletsAdded === assignedTablets
                        ? 'bg-emerald-900/60 border border-emerald-700 text-emerald-300 cursor-default'
                        : setup.waterAddedMl >= 50
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {setup.tabletsAdded === assignedTablets
                        ? `✓ Assigned ${assignedTablets} Tablets Loaded`
                        : `Add Assigned ${assignedTablets} Tablets`}
                    </span>
                  </button>

                  {/* Active Reaction & Gas Venting Notification */}
                  {setup.tabletsAdded > 0 && setup.waterAddedMl >= 50 && (
                    <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-500/60 text-[10px] text-amber-200 space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1 text-amber-400">
                          <Flame className="w-3 h-3" />
                          <span>Active Effervescence Reaction</span>
                        </span>
                        <span className="font-mono text-amber-300">
                          {dissolutionProgress >= 1 ? '100% Dissolved' : `${Math.round(dissolutionProgress * 100)}% Dissolved`}
                        </span>
                      </div>
                      <p className="text-amber-200 leading-tight">
                        ⚠️ <strong>Notice:</strong> The bottle mouth is open! Carbon dioxide gas is actively fizzing and escaping into the room. Click <strong>"Next: Probe & Seal"</strong> immediately to seal with plastic wrap and clay before the gas is lost!
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button onClick={() => setSetupStep(2)} className="text-xs text-slate-400 hover:text-white">
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      if (isStep3Complete) setSetupStep(4);
                    }}
                    disabled={!isStep3Complete}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      isStep3Complete ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Next: Probe & Seal</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Seal & Timer */}
            {setupStep === 4 && (
              <div className="space-y-2 p-1">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                    Step 4: Probe Placement & Airtight Seal
                  </span>
                  <span className="text-[10px] text-slate-400">Step 4/4</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleInsertProbe('headspace')}
                    className={`p-2.5 rounded-lg text-xs font-semibold border text-left transition ${
                      setup.probePosition === 'headspace'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/30'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <span>In Air Headspace</span>
                      <span className="text-[9px] bg-emerald-900 text-emerald-300 px-1 rounded font-mono">CORRECT</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Measures greenhouse gas air</span>
                  </button>

                  <button
                    onClick={() => handleInsertProbe('submerged')}
                    className={`p-2.5 rounded-lg text-xs font-semibold border text-left transition ${
                      setup.probePosition === 'submerged'
                        ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <span>Submerged in Water</span>
                      <span className="text-[9px] bg-rose-900 text-rose-300 px-1 rounded font-mono">WRONG</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Measures liquid, not gas!</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onUpdateSetup({ plasticWrapApplied: !setup.plasticWrapApplied })}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition flex items-center justify-between ${
                      setup.plasticWrapApplied ? 'bg-indigo-950 border-indigo-500 text-indigo-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>Plastic Wrap</span>
                    {setup.plasticWrapApplied && <Check className="w-3 h-3 text-indigo-400" />}
                  </button>

                  <button
                    onClick={() => onUpdateSetup({ claySealed: !setup.claySealed })}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition flex items-center justify-between ${
                      setup.claySealed ? 'bg-amber-950 border-amber-500 text-amber-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>Clay Seal</span>
                    {setup.claySealed && <Check className="w-3 h-3 text-amber-400" />}
                  </button>

                  <button
                    onClick={() => onUpdateSetup({ timerPositioned: true })}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition ${
                      setup.timerPositioned ? 'bg-emerald-900/60 border border-emerald-700 text-emerald-300' : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {setup.timerPositioned ? 'Timer Ready ✓' : 'Position Timer'}
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button onClick={() => setSetupStep(3)} className="text-xs text-slate-400 hover:text-white">
                    ← Back
                  </button>

                  <button
                    onClick={handleVerifySetupAndProceed}
                    disabled={!isAllSetupComplete && !isTeacherMode}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      isAllSetupComplete || isTeacherMode
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white shadow'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <span>Launch Experiment →</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Apparatus Visualizer (6 cols) */}
          <div className="lg:col-span-6 bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs font-bold text-white">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Real-Time Apparatus Visualizer</span>
              </span>
              <span className="font-mono text-[10px] text-amber-400">
                {assignedTablets === 0 ? 'Ambient Air' : `${assignedTablets} CO₂ Tablets`}
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <ApparatusVisualizer
                setup={setup}
                stationNumber={stationNumber}
                assignedTablets={assignedTablets}
                isExperimentMode={false}
                isHeightValid={isHeightValid}
                isDistanceValid={isDistanceValid}
                isBubbling={isBubbling}
                dissolutionProgress={dissolutionProgress}
              />
            </div>

            {/* Checklist strip */}
            <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-mono">
              <div className={`p-1 rounded bg-slate-950/70 border ${setup.lampClamped && setup.lampPluggedIn ? 'border-emerald-500/40 text-emerald-400' : 'border-slate-800 text-slate-500'}`}>
                1. Clamp & Cord {setup.lampClamped && setup.lampPluggedIn ? '✓' : '○'}
              </div>
              <div className={`p-1 rounded bg-slate-950/70 border ${isHeightValid && isDistanceValid ? 'border-emerald-500/40 text-emerald-400' : 'border-slate-800 text-slate-500'}`}>
                2. Dist (6–8") {isHeightValid && isDistanceValid ? '✓' : '○'}
              </div>
              <div className={`p-1 rounded bg-slate-950/70 border ${setup.waterAddedMl >= 50 && setup.tabletsAdded === assignedTablets ? 'border-emerald-500/40 text-emerald-400' : 'border-slate-800 text-slate-500'}`}>
                3. Reactants {setup.waterAddedMl >= 50 && setup.tabletsAdded === assignedTablets ? '✓' : '○'}
              </div>
              <div className={`p-1 rounded bg-slate-950/70 border ${isStep4Complete ? 'border-emerald-500/40 text-emerald-400' : 'border-slate-800 text-slate-500'}`}>
                4. Seal & Timer {isStep4Complete ? '✓' : '○'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 2: EXPERIMENT & DATA COLLECTION (LARGE GRAND GRAPH & FULL CONTROL COCKPIT) */}
      {phase === 'experiment' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0">
          {/* Left Column: Live Apparatus in Action + Milestone Logging Prompt (4.5 cols on lg) */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-2">
            {/* Apparatus Container Card */}
            <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 shadow-md space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-white pb-1 border-b border-slate-800/80">
                <span className="flex items-center gap-1.5">
                  <Sun className={`w-3.5 h-3.5 ${lampOn ? 'text-amber-400 animate-spin' : 'text-slate-500'}`} />
                  <span>Station Apparatus Live</span>
                </span>
                <button
                  onClick={() => setPhase('setup')}
                  className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold"
                >
                  Adjust Setup
                </button>
              </div>

              {/* Apparatus Visualizer (No tab sticker, real-time lamp & meter) */}
              <ApparatusVisualizer
                setup={setup}
                stationNumber={stationNumber}
                assignedTablets={assignedTablets}
                isExperimentMode={true}
                lampOn={lampOn}
                currentLiveTemp={currentLiveTemp}
                timerSeconds={timerSeconds}
                isBubbling={isBubbling}
                isCompact={true}
                dissolutionProgress={dissolutionProgress}
              />

              {/* Quick Specs strip */}
              <div className="grid grid-cols-3 gap-1 text-[10px] text-center font-mono">
                <div className="bg-slate-950/80 p-1 rounded border border-slate-800 text-emerald-400">
                  {setup.lampDistanceInches}" Dist
                </div>
                <div className="bg-slate-950/80 p-1 rounded border border-slate-800 text-cyan-400">
                  {assignedTablets === 0 ? 'Ambient Air' : dissolutionProgress >= 1 ? 'CO₂ Trapped ✓' : `${Math.round(dissolutionProgress * 100)}% Dissolved`}
                </div>
                <div className="bg-slate-950/80 p-1 rounded border border-slate-800 text-amber-400">
                  {setup.claySealed && setup.plasticWrapApplied ? 'Clay Sealed ✓' : 'Sealed ✓'}
                </div>
              </div>
            </div>

            {/* UNMISTAKABLE DATA PLOTTING ACTION PROMPTER */}
            <div className={`p-2.5 rounded-xl border shadow-md space-y-2 transition ${
              unloggedDueMilestone !== undefined
                ? 'bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-amber-500/80 ring-2 ring-amber-500/40'
                : 'bg-slate-900/90 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    unloggedDueMilestone !== undefined ? 'bg-amber-500 text-slate-950 animate-bounce' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {unloggedDueMilestone !== undefined ? <Bell className="w-3.5 h-3.5" /> : <Table className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">
                      {unloggedDueMilestone !== undefined 
                        ? `Milestone Ready: ${unloggedDueMilestone} Minutes!` 
                        : 'Interval Data Logger'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {unloggedDueMilestone !== undefined
                        ? `Click button below to stamp point onto the graph & table.`
                        : nextUpcomingMilestone !== undefined
                        ? `Next milestone: ${nextUpcomingMilestone}m (in ${Math.floor(secondsToNextMilestone / 60)}m ${secondsToNextMilestone % 60}s)`
                        : 'All 6 interval readings logged!'}
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[9px] text-slate-400 block uppercase">Headspace</span>
                  <span className="text-xs font-bold text-emerald-400">{currentLiveTemp.toFixed(1)}°C</span>
                </div>
              </div>

              {/* Big, Unmissable Hit to Plot Action Button */}
              {unloggedDueMilestone !== undefined ? (
                <button
                  onClick={() => handleLogDataPoint(unloggedDueMilestone)}
                  className="w-full py-2.5 px-3 rounded-lg text-xs font-extrabold bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-105 transition flex items-center justify-center gap-1.5 animate-pulse"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Plot & Log Minute {unloggedDueMilestone} Data Point ({getPhysicsTemp(unloggedDueMilestone).toFixed(1)}°C)</span>
                </button>
              ) : (
                <button
                  onClick={() => handleLogDataPoint()}
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600/90 hover:bg-indigo-600 text-white shadow-sm flex items-center justify-center gap-1 transition"
                >
                  <span>Plot Current Instant ({currentMinutes}m · {currentLiveTemp.toFixed(1)}°C)</span>
                </button>
              )}

              {/* Auto-Record Toggle */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                <span className="text-slate-300">Auto-Plot Milestones (0, 3, 6, 9, 12, 15m)</span>
                <button
                  onClick={() => setAutoLogEnabled(!autoLogEnabled)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                    autoLogEnabled
                      ? 'bg-emerald-900/70 border border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {autoLogEnabled ? 'Enabled ✓' : 'Manual'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Master Controls + GRAND REAL-TIME GRAPH + Horizontal Table (7.5 cols on lg) */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-2">
            {/* Top Command Deck & Readouts Bar (Height ~40px) */}
            <div className="bg-slate-900/90 rounded-xl px-3 py-1.5 border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center space-x-1.5">
                {/* Heat Lamp Switch */}
                <button
                  onClick={handleToggleLamp}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${
                    lampOn
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 ring-1 ring-amber-400'
                      : 'bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/70 ring-1 ring-cyan-500/30'
                  }`}
                >
                  <Sun className={`w-3.5 h-3.5 ${lampOn ? 'animate-spin text-slate-950' : 'text-cyan-400'}`} />
                  <span>{lampOn ? '150W Lamp: ON' : 'Lamp: OFF (Cooling)'}</span>
                </button>

                {/* Real-time Heat Deficit / Cooling Notification Pill */}
                {!lampOn ? (
                  <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono bg-cyan-950/80 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-800/80 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>Cooling Active · Heat Lost: -{heatDeficitDeg.toFixed(1)}°C</span>
                  </div>
                ) : heatDeficitDeg > 0.1 ? (
                  <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono bg-amber-950/80 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-800/80" title="Thermal lag and lost heat are factored into current temperature">
                    <span>Off: {totalOffTimeMin.toFixed(1)}m · Heat lag: -{heatDeficitDeg.toFixed(1)}°C</span>
                  </div>
                ) : null}

                {/* Stopwatch Play/Pause */}
                <button
                  onClick={handleStartPause}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    isRunning
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 animate-pulse'
                  }`}
                >
                  {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isRunning ? 'Pause Timer' : 'Start Experiment Run'}</span>
                </button>

                {/* Reset */}
                <button
                  onClick={handleResetExperiment}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  title="Reset experiment timer and table"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Speed buttons */}
                <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-400 px-1 font-mono">Speed:</span>
                  {[1, 5, 15].map(s => (
                    <button
                      key={s}
                      onClick={() => setSimSpeed(s)}
                      className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold transition ${
                        simSpeed === s ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Digital Readouts */}
              <div className="flex items-center space-x-3 text-xs font-mono">
                <div>
                  <span className="text-[9px] text-slate-400 font-sans block">Stopwatch</span>
                  <span className="font-bold text-sky-400 text-sm">
                    {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:
                    {String(timerSeconds % 60).padStart(2, '0')}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="text-[9px] text-slate-400 font-sans block">Headspace</span>
                  <span className="font-bold text-emerald-400 text-sm">{currentLiveTemp.toFixed(1)}°C</span>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="text-[9px] text-slate-400 font-sans block">Rise (ΔT)</span>
                  <span className="font-bold text-amber-400 text-sm">+{(currentLiveTemp - 21.0).toFixed(1)}°C</span>
                </div>
              </div>
            </div>

            {/* GRAND REAL-TIME TEMPERATURE GRAPH (PROMINENT, WIDE & DYNAMICALLY DRAWN) */}
            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 shadow-md space-y-1 flex-1 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between pb-1 border-b border-slate-800 text-xs font-bold text-white gap-2">
                <span className="flex items-center gap-1.5">
                  <LineChart className="w-3.5 h-3.5 text-amber-400" />
                  <span>Real-Time Temperature Curve · Thermal Radiation Heating</span>
                </span>
                <div className="flex items-center gap-2.5 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-slate-300">
                    <span className="w-2.5 h-1 rounded-full inline-block" style={{ backgroundColor: stationThemeColor }} />
                    <span>Actual Run</span>
                  </span>
                  {uninterruptedPathD && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <span className="w-2.5 h-0.5 border-t border-dashed border-slate-400 inline-block" />
                      <span>Uninterrupted Power Baseline</span>
                    </span>
                  )}
                  {heatDeficitDeg > 0.1 && (
                    <span className="bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800 font-bold">
                      -{heatDeficitDeg.toFixed(1)}°C lag factored in
                    </span>
                  )}
                  <span className="text-slate-400">
                    {timerSeconds === 0 
                      ? 'Ready (Click "Start Experiment Run" to draw curve)' 
                      : `⏱ ${(timerSeconds / 60).toFixed(1)}m elapsed`}
                  </span>
                  <span className="w-2 h-2 rounded-full inline-block animate-ping" style={{ backgroundColor: stationThemeColor }} />
                </div>
              </div>

              {/* High-Resolution SVG Graphic Canvas */}
              <div className="relative w-full aspect-[2.6/1] sm:aspect-[2.8/1] bg-slate-950 rounded-lg p-1 border border-slate-800/80 overflow-hidden select-none">
                <svg viewBox="0 0 600 200" className="w-full h-full select-none">
                  <defs>
                    <linearGradient id={`curveAreaGradient-${stationNumber}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={stationThemeColor} stopOpacity="0.35" />
                      <stop offset="60%" stopColor={stationThemeColor} stopOpacity="0.1" />
                      <stop offset="100%" stopColor={stationThemeColor} stopOpacity="0.0" />
                    </linearGradient>

                    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Horizontal Temperature Grid Lines & Y-Axis Labels */}
                  {[
                    { temp: 30, label: '30°C' },
                    { temp: 28, label: '28°C' },
                    { temp: 26, label: '26°C' },
                    { temp: 24, label: '24°C' },
                    { temp: 22, label: '22°C' },
                    { temp: 20, label: '20°C' },
                  ].map(item => {
                    const y = getGraphY(item.temp);
                    return (
                      <g key={item.temp}>
                        <line x1={GRAPH_LEFT} y1={y} x2={GRAPH_LEFT + GRAPH_WIDTH} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray={item.temp === 20 ? 'none' : '3 3'} />
                        <text x={GRAPH_LEFT - 6} y={y + 3.5} fill="#64748b" fontSize="8.5" textAnchor="end" fontFamily="monospace">
                          {item.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Vertical Time Interval Grid Lines & X-Axis Labels */}
                  {intervalMinutes.map(min => {
                    const x = getGraphX(min);
                    const isPassed = currentTimeMinutes >= min;
                    return (
                      <g key={min}>
                        <line 
                          x1={x} 
                          y1={GRAPH_TOP} 
                          x2={x} 
                          y2={GRAPH_BOTTOM} 
                          stroke={isPassed ? '#334155' : '#1e293b'} 
                          strokeWidth={min === 0 ? '1.5' : '1'} 
                        />
                        <text 
                          x={x} 
                          y={GRAPH_BOTTOM + 13} 
                          fill={isPassed ? '#cbd5e1' : '#64748b'} 
                          fontSize="9" 
                          fontWeight="bold" 
                          textAnchor="middle" 
                          fontFamily="monospace"
                        >
                          {min}m
                        </text>
                      </g>
                    );
                  })}

                  {/* Baseline Ambient Reference Line at 21.0°C */}
                  <line
                    x1={GRAPH_LEFT}
                    y1={getGraphY(21.0)}
                    x2={GRAPH_LEFT + GRAPH_WIDTH}
                    y2={getGraphY(21.0)}
                    stroke="#475569"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />
                  <text x={GRAPH_LEFT + GRAPH_WIDTH - 2} y={getGraphY(21.0) - 4} fill="#64748b" fontSize="7.5" textAnchor="end" fontFamily="monospace">
                    Ambient Baseline (21.0°C)
                  </text>

                  {/* Theoretical Uninterrupted Continuous Heating Curve (Dashed Baseline) */}
                  {uninterruptedPathD && (
                    <g>
                      <path
                        d={uninterruptedPathD}
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        opacity="0.45"
                      />
                      <text
                        x={getGraphX(currentTimeMinutes) - 4}
                        y={getGraphY(getUninterruptedTemp(currentTimeMinutes)) - 4}
                        fill="#94a3b8"
                        fontSize="7"
                        textAnchor="end"
                        fontFamily="monospace"
                        opacity="0.9"
                      >
                        Uninterrupted ({getUninterruptedTemp(currentTimeMinutes).toFixed(1)}°C)
                      </text>
                    </g>
                  )}

                  {/* Gradient Area Fill Under the Drawn Line */}
                  {areaPolygonD && (
                    <polygon
                      points={areaPolygonD.replace(/[MLZ]/g, ' ').trim()}
                      fill={`url(#curveAreaGradient-${stationNumber})`}
                    />
                  )}

                  {/* Real-Time Advancing Heating Curve (Drawn Strictly as Time Increases!) */}
                  {livePathD && (
                    <path
                      d={livePathD}
                      fill="none"
                      stroke={stationThemeColor}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#glowFilter)"
                    />
                  )}

                  {/* Plotted Milestone Points (Stamped in Real-Time when logged!) */}
                  {Object.entries(recordedTemps).map(([mStr, temp]) => {
                    const m = Number(mStr);
                    const ptX = getGraphX(m);
                    const ptY = getGraphY(temp);

                    return (
                      <g key={m} className="animate-fadeIn">
                        {/* Outer Glow Halo */}
                        <circle cx={ptX} cy={ptY} r="7" fill={stationThemeColor} opacity="0.3" />
                        {/* Point Body */}
                        <circle cx={ptX} cy={ptY} r="5" fill="#ffffff" stroke={stationThemeColor} strokeWidth="2.5" />
                        {/* Temperature Callout Tag above point */}
                        <rect
                          x={ptX - 14}
                          y={ptY - 17}
                          width="28"
                          height="12"
                          rx="3"
                          fill="#020617"
                          stroke={stationThemeColor}
                          strokeWidth="1"
                          opacity="0.95"
                        />
                        <text
                          x={ptX}
                          y={ptY - 8}
                          fill="#f8fafc"
                          fontSize="7"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {temp.toFixed(1)}°
                        </text>
                      </g>
                    );
                  })}

                  {/* Advancing Live Sensor Cursor at the tip of the line */}
                  {timerSeconds > 0 && (
                    <g>
                      {/* Vertical Scrubber Line */}
                      <line
                        x1={currentCursorX}
                        y1={GRAPH_TOP}
                        x2={currentCursorX}
                        y2={GRAPH_BOTTOM}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                        opacity="0.85"
                      />
                      {/* Moving Probe Head Cursor */}
                      <circle cx={currentCursorX} cy={currentCursorY} r="5.5" fill="#ffffff" stroke={stationThemeColor} strokeWidth="2.5" />
                      <circle cx={currentCursorX} cy={currentCursorY} r="9" fill="none" stroke={stationThemeColor} strokeWidth="1.5" opacity="0.8">
                        <animate attributeName="r" values="5.5;12;5.5" dur="1.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.9;0.1;0.9" dur="1.2s" repeatCount="indefinite" />
                      </circle>

                      {/* Real-time Cursor Readout Tooltip */}
                      <g transform={`translate(${Math.min(GRAPH_LEFT + GRAPH_WIDTH - 45, Math.max(GRAPH_LEFT + 25, currentCursorX))}, ${Math.max(GRAPH_TOP + 14, currentCursorY - 18)})`}>
                        <rect x="-24" y="-10" width="48" height="15" rx="3" fill="#020617" stroke="#ffffff" strokeWidth="1" opacity="0.9" />
                        <text x="0" y="0.5" fill="#ffffff" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                          {currentLiveTemp.toFixed(1)}°C
                        </text>
                      </g>
                    </g>
                  )}
                </svg>
              </div>
            </div>

            {/* COMPACT HORIZONTAL 6-CELL DATA TABLE STRIP (Height ~65px) */}
            <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800 shadow-md shrink-0">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] font-bold text-white mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-sky-400" />
                  <span>Logged Milestone Data ({recordedCount} of 6 Recorded)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Milestones unlock as stopwatch reaches each time mark</span>
              </div>

              {/* 6 Interval Cards Side-by-Side */}
              <div className="grid grid-cols-6 gap-1.5 font-mono">
                {intervalMinutes.map(m => {
                  const recorded = recordedTemps[m];
                  const isCurrentActive = currentIntervalSegment === m;
                  const isReached = currentMinutes >= m;
                  const isDueUnlogged = isReached && recorded === undefined;
                  const isFuture = !isReached;

                  return (
                    <div
                      key={m}
                      className={`p-1.5 rounded-lg border text-center transition flex flex-col justify-between ${
                        recorded !== undefined
                          ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                          : isDueUnlogged
                          ? 'bg-amber-950/50 border-amber-500 ring-1 ring-amber-500/40 text-amber-200 animate-pulse'
                          : isCurrentActive
                          ? 'bg-sky-950/30 border-sky-500/50 text-sky-200'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-500 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between font-sans text-[10px] font-bold text-slate-300">
                        <span>{m}m</span>
                        {recorded !== undefined ? (
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                        ) : isFuture ? (
                          <Lock className="w-2.5 h-2.5 text-slate-600" />
                        ) : null}
                      </div>

                      <div className="my-0.5">
                        {recorded !== undefined ? (
                          <div className="text-xs font-bold text-emerald-400">{recorded.toFixed(1)}°C</div>
                        ) : isDueUnlogged || isCurrentActive ? (
                          <div className="text-xs font-bold text-amber-300 animate-pulse">{currentLiveTemp.toFixed(1)}°C</div>
                        ) : (
                          <div className="text-xs text-slate-600 font-mono">—</div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div>
                        {recorded !== undefined ? (
                          <button
                            onClick={() => handleLogDataPoint(m)}
                            className="w-full text-[9px] text-slate-400 hover:text-white py-0.5 rounded bg-slate-900 border border-slate-800 transition font-sans"
                            title="Re-plot point"
                          >
                            Re-log
                          </button>
                        ) : isFuture ? (
                          <button
                            disabled={true}
                            className="w-full py-0.5 rounded text-[9px] font-medium bg-slate-900/60 text-slate-500 border border-slate-800/60 cursor-not-allowed font-sans flex items-center justify-center gap-0.5"
                            title={`Stopwatch must reach ${m}:00 before logging`}
                          >
                            <Lock className="w-2.5 h-2.5 text-slate-600" />
                            <span>At {m}m</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLogDataPoint(m)}
                            className={`w-full py-0.5 rounded text-[10px] font-bold transition font-sans ${
                              isDueUnlogged
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm animate-pulse'
                                : 'bg-sky-900/80 text-sky-200 hover:bg-sky-800'
                            }`}
                          >
                            Plot {m}m
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom 1-Line Gating Bar (Height ~36px) */}
            <div className="bg-slate-900/90 rounded-xl px-3 py-1.5 border border-slate-800 shadow-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Station Progress:
                </span>
                {isDataCollectionComplete ? (
                  <span className="text-xs text-emerald-300 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    All 6 Milestones Plotted on Graph!
                  </span>
                ) : (
                  <span className="text-xs text-amber-300 font-medium">
                    {recordedCount} of 6 intervals logged (Log at 0, 3, 6, 9, 12, 15m to unlock next station)
                  </span>
                )}
                {isTeacherMode && !isDataCollectionComplete && (
                  <button
                    onClick={handleTeacherQuickFill}
                    className="ml-2 px-2 py-0.5 rounded bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-600/50 text-[10px] font-semibold flex items-center gap-1 transition shadow-sm"
                    title="Instructor Mode: Populate all 6 benchmark readings instantly for class demonstration"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-purple-300" />
                    <span>Quick-Fill 15m Data</span>
                  </button>
                )}
              </div>

              <button
                onClick={onProceedToNext}
                disabled={!isDataCollectionComplete && !isTeacherMode}
                className={`py-1.5 px-4 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  isDataCollectionComplete || isTeacherMode
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <span>
                  {stationNumber === 1 && 'Advance to Station 2 (2 Tablets)'}
                  {stationNumber === 2 && 'Advance to Station 3 (4 Tablets)'}
                  {stationNumber === 3 && 'View 3-Station Comparative Summary'}
                </span>
                {isTeacherMode && !isDataCollectionComplete && (
                  <span className="text-[9px] bg-purple-900/90 text-purple-200 px-1 py-0.2 rounded border border-purple-500/50 font-mono">
                    Bypass
                  </span>
                )}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parts 1, 2, & 3 Pre-Lab Overview Guide Modal */}
      <StationOverviewModal
        isOpen={showOverviewModal}
        onClose={() => setShowOverviewModal(false)}
        initialTab={stationNumber}
      />
    </div>
  );
};
