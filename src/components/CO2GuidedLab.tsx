import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sun, 
  Thermometer, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Layers, 
  Droplets, 
  Flame, 
  Eye, 
  TrendingUp, 
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { StationDataPoint, StationEquipmentSetup } from '../types';
import { playLampClickSound } from '../utils/audio';

interface CO2GuidedLabProps {
  labData: StationDataPoint[];
  setLabData: React.Dispatch<React.SetStateAction<StationDataPoint[]>>;
  onGoToVisualization: () => void;
  equipmentSetup?: StationEquipmentSetup;
  onModifySetup?: () => void;
}

export const CO2GuidedLab: React.FC<CO2GuidedLabProps> = ({
  labData,
  setLabData,
  onGoToVisualization,
  equipmentSetup,
  onModifySetup,
}) => {
  // Investigation Wizard Steps:
  // 1: Select Condition (0, 2, or 4 tablets)
  // 2: Materials & Seal Preparation
  // 3: Run Experiment with Recording Prompts
  // 4: Heat-Trapping Explanation & Comparison
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(equipmentSetup?.isComplete ? 2 : 1);

  // Selected tablet condition for this guided run
  const [activeTablets, setActiveTablets] = useState<0 | 2 | 4>(
    equipmentSetup ? (equipmentSetup.tabletsAdded as 0 | 2 | 4) : 0
  );

  // Live experiment state
  const [lampOn, setLampOn] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(5);

  // Preparation checklist states
  const [prepChecklist, setPrepChecklist] = useState({
    waterAdded: equipmentSetup ? equipmentSetup.waterAddedMl >= 50 : false,
    tabletsDropped: equipmentSetup ? (equipmentSetup.tabletsAdded > 0 || equipmentSetup.selectedStation === 1) : false,
    plasticWrapSealed: equipmentSetup ? equipmentSetup.plasticWrapApplied : false,
    claySealedAroundProbe: equipmentSetup ? equipmentSetup.claySealed : false,
    probeInAirHeadspace: equipmentSetup ? equipmentSetup.probePosition === 'headspace' : false,
    sixInchDistanceVerified: equipmentSetup ? equipmentSetup.lampDistanceInches >= 5 : false,
  });

  // Prompt alert for student recording
  const [pendingPromptMinute, setPendingPromptMinute] = useState<number | null>(0);
  const [recordedMinutes, setRecordedMinutes] = useState<Record<number, number>>({});

  // Dynamic lamp thermal segment tracking for heating and cooling
  const [lampSegments, setLampSegments] = useState<{ startMin: number; lampOn: boolean }[]>([
    { startMin: 0, lampOn: false }
  ]);

  // Physics simulation temperature for current condition (with real Newton cooling and re-heating recovery)
  const getPhysicsTemp = (timeMinutes: number, tablets: number) => {
    const ambient = 21.0;
    const maxDelta = tablets === 0 ? 2.6 : tablets === 2 ? 5.1 : 7.6;
    const tauHeat = tablets === 0 ? 6.5 : tablets === 2 ? 7.2 : 8.0;
    const tauCool = tablets === 0 ? 4.8 : tablets === 2 ? 7.8 : 11.2;
    const maxHeatedTemp = ambient + maxDelta;

    if (timeMinutes <= 0) return ambient;

    let currentTemp = ambient;
    let prevTime = 0;
    let prevLampOn = lampSegments[0]?.lampOn ?? lampOn;

    for (let i = 1; i < lampSegments.length; i++) {
      const seg = lampSegments[i];
      if (seg.startMin >= timeMinutes) break;

      const dt = seg.startMin - prevTime;
      if (dt > 0) {
        if (prevLampOn) {
          currentTemp = maxHeatedTemp - (maxHeatedTemp - currentTemp) * Math.exp(-dt / tauHeat);
        } else {
          currentTemp = ambient + (currentTemp - ambient) * Math.exp(-dt / tauCool);
        }
      }

      prevTime = seg.startMin;
      prevLampOn = seg.lampOn;
    }

    const dtFinal = Math.max(0, timeMinutes - prevTime);
    if (dtFinal > 0) {
      if (prevLampOn) {
        currentTemp = maxHeatedTemp - (maxHeatedTemp - currentTemp) * Math.exp(-dtFinal / tauHeat);
      } else {
        currentTemp = ambient + (currentTemp - ambient) * Math.exp(-dtFinal / tauCool);
      }
    }

    return Number(currentTemp.toFixed(1));
  };

  const currentMinute = Math.floor(timerSeconds / 60);
  const currentLiveTemp = getPhysicsTemp(timerSeconds / 60, activeTablets);

  // Timer interval: continues whether lamp is on or off so students observe cooling
  useEffect(() => {
    let timer: any = null;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setTimerSeconds(prev => {
          const next = prev + 1 * simSpeed;
          const nextMin = Math.floor(next / 60);
          const prevMin = Math.floor(prev / 60);

          // Check if we hit a new minute mark that hasn't been prompted yet
          if (nextMin > prevMin && nextMin <= 15) {
            setPendingPromptMinute(nextMin);
          }

          if (next >= 15 * 60) {
            setIsTimerRunning(false);
            return 15 * 60;
          }
          return next;
        });
      }, 1000 / simSpeed);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, simSpeed]);

  // Log temperature for prompted minute
  const handleLogPromptedTemp = (minute: number, tempVal: number) => {
    setRecordedMinutes(prev => ({ ...prev, [minute]: tempVal }));
    setPendingPromptMinute(null);

    // Also update global labData
    setLabData(prev => {
      const copy = [...prev];
      if (!copy[minute]) {
        copy[minute] = {
          timeMinute: minute,
          temp0Tabs: activeTablets === 0 ? tempVal : getPhysicsTemp(minute, 0),
          temp2Tabs: activeTablets === 2 ? tempVal : getPhysicsTemp(minute, 2),
          temp4Tabs: activeTablets === 4 ? tempVal : getPhysicsTemp(minute, 4),
        };
      } else {
        const field = activeTablets === 0 ? 'temp0Tabs' : activeTablets === 2 ? 'temp2Tabs' : 'temp4Tabs';
        copy[minute] = {
          ...copy[minute],
          [field]: tempVal,
        };
      }
      return copy;
    });
  };

  const allPrepCompleted = Object.values(prepChecklist).every(Boolean);

  const handleStartLampAndTimer = () => {
    setLampOn(true);
    setIsTimerRunning(true);
    playLampClickSound(true);
    const curMin = timerSeconds / 60;
    setLampSegments(prev => {
      if (curMin === 0 && prev.length <= 1) {
        return [{ startMin: 0, lampOn: true }];
      }
      return [...prev, { startMin: curMin, lampOn: true }];
    });
    // Initial minute 0 prompt
    if (recordedMinutes[0] === undefined) {
      setPendingPromptMinute(0);
    }
  };

  const handleToggleLamp = () => {
    const nextState = !lampOn;
    setLampOn(nextState);
    playLampClickSound(nextState);
    const curMin = timerSeconds / 60;
    setLampSegments(prev => {
      if (curMin === 0 && prev.length <= 1) {
        return [{ startMin: 0, lampOn: nextState }];
      }
      const last = prev[prev.length - 1];
      if (last && Math.abs(last.startMin - curMin) < 0.01) {
        return [...prev.slice(0, -1), { startMin: curMin, lampOn: nextState }];
      }
      return [...prev, { startMin: curMin, lampOn: nextState }];
    });
  };

  const handleResetRun = () => {
    setIsTimerRunning(false);
    setLampOn(false);
    setTimerSeconds(0);
    setRecordedMinutes({});
    setPendingPromptMinute(null);
    setLampSegments([{ startMin: 0, lampOn: false }]);
  };

  // Helper labels
  const tabletNames = {
    0: '0 Fizzing Tablets (Station 1: Ambient Air Control ~420 ppm)',
    2: '2 Fizzing Tablets (Station 2: Moderate Elevated CO₂ ~1,200 ppm)',
    4: '4 Fizzing Tablets (Station 3: Saturated High CO₂ ~2,500 ppm)',
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 border border-indigo-900/60 shadow-xl">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3 w-fit">
          <Sparkles className="w-3.5 h-3.5" />
          Guided Investigation: Varying CO₂ Concentrations
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          How Increased CO₂ Traps Heat in an Enclosed Atmosphere
        </h2>
        <p className="mt-2 text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
          Walk through the complete scientific method: configure the bottle with <strong>0, 2, or 4 fizzing tablets</strong>, record temperature changes at 1-minute intervals under the heat lamp, and discover the molecular mechanism of greenhouse heat trapping.
        </p>

        {/* Step Indicator Progress Bar */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium">
          {[
            { num: 1, label: '1. Select CO₂ Level' },
            { num: 2, label: '2. Setup & Clay Seal' },
            { num: 3, label: '3. Heat & Record Prompts' },
            { num: 4, label: '4. Heat-Trapping Explanation' },
          ].map(s => {
            const isCurrent = currentStep === s.num;
            const isDone = currentStep > s.num;
            return (
              <button
                key={s.num}
                onClick={() => setCurrentStep(s.num as any)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                  isCurrent
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold shadow'
                    : isDone
                      ? 'bg-slate-800/80 border-slate-700 text-emerald-400'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCurrent ? 'bg-amber-500 text-slate-950' : isDone ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isDone ? '✓' : s.num}
                </span>
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Select CO2 Concentration Condition */}
      {currentStep === 1 && (
        <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-md space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Step 1: Choose Your Investigation Condition
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select which fizzing tablet concentration you are currently investigating at your lab station.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Condition 1: 0 Tablets */}
            <div
              onClick={() => setActiveTablets(0)}
              className={`cursor-pointer rounded-2xl p-5 border transition-all ${
                activeTablets === 0
                  ? 'bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/20 shadow-lg'
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950/60 px-2.5 py-1 rounded-full border border-sky-800">
                  Control Group
                </span>
                <span className="text-xs text-slate-400 font-mono">0 Tablets</span>
              </div>
              <h4 className="text-base font-bold text-white mt-3">Station 1: Ambient Room Air</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Represents natural atmospheric conditions (~420 ppm CO₂ baseline). 50 mL water with 0 fizzing tablets. This control isolates the heating caused purely by lamp radiation on normal air and water.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-700/60 text-xs flex justify-between">
                <span className="text-slate-400">Baseline CO₂:</span>
                <strong className="text-sky-300">~420 ppm</strong>
              </div>
            </div>

            {/* Condition 2: 2 Tablets */}
            <div
              onClick={() => setActiveTablets(2)}
              className={`cursor-pointer rounded-2xl p-5 border transition-all ${
                activeTablets === 2
                  ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20 shadow-lg'
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800">
                  Moderate Elevation
                </span>
                <span className="text-xs text-slate-400 font-mono">2 Tablets</span>
              </div>
              <h4 className="text-base font-bold text-white mt-3">Station 2: Moderate CO₂ Level</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                50 mL water + 2 fizzing tablets (sodium bicarbonate + citric acid). Effervescence fills the bottle headspace with elevated carbon dioxide gas, modeling elevated greenhouse forcing.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-700/60 text-xs flex justify-between">
                <span className="text-slate-400">Estimated Headspace CO₂:</span>
                <strong className="text-amber-300">~1,200 ppm</strong>
              </div>
            </div>

            {/* Condition 3: 4 Tablets */}
            <div
              onClick={() => setActiveTablets(4)}
              className={`cursor-pointer rounded-2xl p-5 border transition-all ${
                activeTablets === 4
                  ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20 shadow-lg'
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-800">
                  High Concentration
                </span>
                <span className="text-xs text-slate-400 font-mono">4 Tablets</span>
              </div>
              <h4 className="text-base font-bold text-white mt-3">Station 3: Saturated High CO₂</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                50 mL water + 4 fizzing tablets. Dense effervescence rapidly purges lighter gases, leaving the bottle headspace rich in thermal infrared-absorbing CO₂ molecules.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-700/60 text-xs flex justify-between">
                <span className="text-slate-400">Estimated Headspace CO₂:</span>
                <strong className="text-rose-300">~2,500+ ppm</strong>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
            >
              <span>Continue to Apparatus Setup ({activeTablets} Tablets)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Guided Preparation Checklist */}
      {currentStep === 2 && (
        <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-md space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Step 2: Bottle & Sensor Setup Checklist ({activeTablets} Tablets)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Carefully complete and verify each physical preparation step to ensure valid, airtight experimental conditions.
              </p>
            </div>
            <button
              onClick={() => setPrepChecklist({
                waterAdded: true,
                tabletsDropped: true,
                plasticWrapSealed: true,
                claySealedAroundProbe: true,
                probeInAirHeadspace: true,
                sixInchDistanceVerified: true,
              })}
              className="text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700"
            >
              Check All
            </button>
          </div>

          {/* Checklist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                key: 'waterAdded',
                title: '1. Add 50 mL Water',
                desc: 'Use the 100-mL graduated cylinder to precisely measure 50 mL of room-temperature tap water into the 16.9 oz plastic water bottle.',
                icon: <Droplets className="w-4 h-4 text-sky-400" />,
              },
              {
                key: 'tabletsDropped',
                title: `2. Add ${activeTablets} Fizzing Tablets`,
                desc: activeTablets === 0 
                  ? 'For Control (Station 1), do NOT add any tablets. Leave pure water.' 
                  : `Drop exactly ${activeTablets} fizzing tablets into the water. Prepare to seal immediately!`,
                icon: <Sparkles className="w-4 h-4 text-amber-400" />,
              },
              {
                key: 'plasticWrapSealed',
                title: '3. Seal with Plastic Wrap',
                desc: 'Quickly cover the mouth of the bottle with plastic wrap and secure it tightly using a rubber band or clear tape.',
                icon: <Layers className="w-4 h-4 text-indigo-400" />,
              },
              {
                key: 'claySealedAroundProbe',
                title: '4. Modeling Clay Collar',
                desc: 'Insert the digital probe through a small opening, then pack modeling clay tightly around the probe wire to make an airtight seal.',
                icon: <Flame className="w-4 h-4 text-rose-400" />,
              },
              {
                key: 'probeInAirHeadspace',
                title: '5. Suspend Probe in Air Headspace',
                desc: 'CRITICAL: Ensure the metal thermometer probe tip hangs ~2 inches above the water line in the air cavity (do NOT submerge in liquid!).',
                icon: <Thermometer className="w-4 h-4 text-emerald-400" />,
              },
              {
                key: 'sixInchDistanceVerified',
                title: '6. Check 6-Inch Distance from Bulb',
                desc: 'Use a ruler to verify the plastic bottle is at least 6 inches (15 cm) away from the 150W bulb to prevent plastic melting.',
                icon: <Sun className="w-4 h-4 text-yellow-400" />,
              },
            ].map(item => {
              const checked = (prepChecklist as any)[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => setPrepChecklist(prev => ({ ...prev, [item.key]: !checked }))}
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex items-start gap-3 ${
                    checked
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-200'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
                  }`}
                >
                  <button type="button" className="mt-0.5">
                    {checked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-600 block" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h4 className={`text-xs font-bold flex items-center gap-1.5 ${checked ? 'text-white' : 'text-slate-300'}`}>
                      {item.icon}
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Condition</span>
            </button>

            <button
              onClick={() => setCurrentStep(3)}
              disabled={!allPrepCompleted}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
            >
              <span>Ready: Start Heat Lamp & Recording Prompts</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Run Experiment with Recording Prompts */}
      {currentStep === 3 && (
        <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-md space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Step 3: Live Heat Lamp Run & Interval Recording Prompts
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Active Condition: <strong className="text-amber-300">{tabletNames[activeTablets]}</strong>
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={timerSeconds === 0 && !isTimerRunning ? handleStartLampAndTimer : handleToggleLamp}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition ${
                  lampOn 
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <Sun className={`w-4 h-4 ${lampOn ? 'animate-spin-slow' : 'text-slate-500'}`} />
                <span>{lampOn ? 'Lamp: ON' : 'Lamp: OFF (Cooling)'}</span>
              </button>

              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                  isTimerRunning
                    ? 'bg-slate-800 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isTimerRunning ? 'Pause Timer' : 'Resume Timer'}</span>
              </button>

              <button
                onClick={handleResetRun}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Reset Run"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Student Prompt Notification Banner when a minute mark is ready */}
          {pendingPromptMinute !== null && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/60 to-indigo-950/60 border border-amber-500/50 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-bounce-subtle">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                    Recording Prompt: Minute {pendingPromptMinute} Data Point
                  </h4>
                  <p className="text-xs text-slate-200 mt-0.5">
                    Look at the digital thermometer probe. Record the current temperature for <strong>{activeTablets} Tablets</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="font-mono text-sm font-bold text-white bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-700">
                  {getPhysicsTemp(pendingPromptMinute, activeTablets)} °C
                </span>
                <button
                  onClick={() => handleLogPromptedTemp(pendingPromptMinute, getPhysicsTemp(pendingPromptMinute, activeTablets))}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition"
                >
                  Save Reading
                </button>
              </div>
            </div>
          )}

          {/* Instrumentation Displays */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Live Probe Display */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Live Headspace Thermometer Probe
              </span>
              <div className="text-3xl font-mono font-extrabold text-rose-400 mt-2">
                {currentLiveTemp}°C
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Warming: +{(currentLiveTemp - 21.0).toFixed(1)}°C
              </div>
            </div>

            {/* Elapsed Timer Display */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Stopwatch / Elapsed Investigation
              </span>
              <div className="text-3xl font-mono font-extrabold text-amber-400 mt-2">
                {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:
                {String(timerSeconds % 60).padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                Speed: {simSpeed}x multiplier
              </div>
            </div>

            {/* Assigned Condition Info */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Condition Tested
              </span>
              <div className="text-lg font-bold text-white mt-2">
                {activeTablets} Fizzing Tablets
              </div>
              <div className="text-xs text-indigo-300 mt-1">
                {activeTablets === 0 ? 'Ambient Control' : activeTablets === 2 ? 'Elevated CO₂' : 'Saturated CO₂'}
              </div>
            </div>
          </div>

          {/* Logged Readings Table for this Condition */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Recorded Time-Series Data Points ({activeTablets} Tablets)
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 font-mono text-xs">
              {[0, 1, 2, 3, 4, 5, 7, 10, 12, 15].map(m => {
                const recorded = recordedMinutes[m];
                return (
                  <div
                    key={m}
                    className={`p-2 rounded-lg border text-center ${
                      recorded !== undefined
                        ? 'bg-slate-800/80 border-slate-700 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-600'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400">{m} min</div>
                    <div className="font-bold mt-0.5">
                      {recorded !== undefined ? `${recorded}°C` : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advance to Explanation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Setup</span>
            </button>

            <button
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
            >
              <span>Explain How CO₂ Traps Heat & Compare</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Explaining How Increased CO2 Traps Heat */}
      {currentStep === 4 && (
        <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-md space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-rose-400" />
              Step 4: The Physics Mechanism: How Increased CO₂ Traps Heat
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Connect your observations of temperature rise to the molecular and electromagnetic behavior of greenhouse gases.
            </p>
          </div>

          {/* Visual 3-Stage Mechanism Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/60">
              <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold mb-2">
                <Sun className="w-4 h-4 text-yellow-400" />
                <span>1. Incoming Radiant Energy</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The heat lamp emits electromagnetic radiation across both visible light and near-infrared wavelengths. These incoming high-frequency waves pass directly through the transparent plastic bottle wall and through atmospheric gases with little absorption.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/60">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>2. Absorption & Re-Radiation as IR</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                When radiant energy strikes the liquid water and the bottom surfaces inside the bottle, it is absorbed and converted into thermal energy (heat). These warm interior surfaces then radiate lower-frequency, longer-wavelength <strong>thermal infrared (IR) rays</strong>.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/60">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold mb-2">
                <Sparkles className="w-4 h-4 text-rose-400" />
                <span>3. CO₂ Molecular Trapping</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Diatomic air molecules (<span className="text-sky-300">N₂</span>, <span className="text-sky-300">O₂</span>) let IR escape easily. But carbon dioxide (<span className="text-rose-300">CO₂</span>) is a triatomic molecule whose bonds bend and vibrate at infrared frequencies. More tablets = denser CO₂ = more IR photons trapped and re-radiated back into the headspace!
              </p>
            </div>
          </div>

          {/* Quantitative Comparison Summary of the 3 Stations */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Experimental Comparison: 0 vs. 2 vs. 4 Fizzing Tablets
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-800/50">
                <span className="text-sky-400 font-bold block">Station 1: 0 Tablets</span>
                <div className="text-base font-bold text-white mt-1">ΔT: +2.5 °C</div>
                <p className="text-[11px] text-slate-400 mt-1">Transparent air allows most re-radiated thermal IR to pass outward.</p>
              </div>

              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/50">
                <span className="text-amber-400 font-bold block">Station 2: 2 Tablets</span>
                <div className="text-base font-bold text-white mt-1">ΔT: +4.8 °C</div>
                <p className="text-[11px] text-slate-400 mt-1">Moderate CO₂ density increases thermal absorption, producing ~1.9x greater warming.</p>
              </div>

              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50">
                <span className="text-rose-400 font-bold block">Station 3: 4 Tablets</span>
                <div className="text-base font-bold text-white mt-1">ΔT: +7.1 °C</div>
                <p className="text-[11px] text-slate-400 mt-1">High CO₂ concentration captures the vast majority of outgoing IR, producing ~2.8x greater warming.</p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                // Switch to next tablet condition
                const nextTab = activeTablets === 0 ? 2 : activeTablets === 2 ? 4 : 0;
                setActiveTablets(nextTab);
                setCurrentStep(1);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Investigate Next Condition ({activeTablets === 0 ? '2 Tablets' : activeTablets === 2 ? '4 Tablets' : '0 Tablets'})</span>
            </button>

            <button
              onClick={onGoToVisualization}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
            >
              <span>Compare All Data in Visualization Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
