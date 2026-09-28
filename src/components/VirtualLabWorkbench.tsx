import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sun, 
  Thermometer, 
  Clock, 
  Sparkles, 
  Droplets, 
  Flame, 
  Layers, 
  Info, 
  TrendingUp, 
  Sliders, 
  CheckCircle2, 
  Maximize2,
  Table,
  ArrowRight,
  Eye,
  Volume2,
  VolumeX,
  ShieldAlert,
  Plus,
  Minus,
  Wind
} from 'lucide-react';
import { StationDataPoint, StationEquipmentSetup } from '../types';
import { 
  playLampClickSound, 
  startFizzingSound, 
  stopFizzingSound, 
  playTimerBeep, 
  toggleMuteAudio, 
  getIsAudioMuted 
} from '../utils/audio';

interface VirtualLabWorkbenchProps {
  labData: StationDataPoint[];
  setLabData: React.Dispatch<React.SetStateAction<StationDataPoint[]>>;
  onGoToNextModule: () => void;
  equipmentSetup?: StationEquipmentSetup;
  onModifySetup?: () => void;
}

export const VirtualLabWorkbench: React.FC<VirtualLabWorkbenchProps> = ({
  labData,
  setLabData,
  onGoToNextModule,
  equipmentSetup,
  onModifySetup,
}) => {
  // Viewing & Interaction Mode
  const [viewMode, setViewMode] = useState<'parallel' | 'single'>(
    equipmentSetup?.stationMode === '3-bottles-one-station' ? 'parallel' : 'single'
  );
  const [selectedStation, setSelectedStation] = useState<1 | 2 | 3>(
    equipmentSetup?.selectedStation || 3
  ); // 1 = 0 tabs, 2 = 2 tabs, 3 = 4 tabs
  const [thermalCamMode, setThermalCamMode] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(getIsAudioMuted());
  const [showMolecularZoom, setShowMolecularZoom] = useState<boolean>(false);

  // Apparatus Controls
  const [lampOn, setLampOn] = useState<boolean>(true);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(5); // 1x, 5x, 15x
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');

  // Physical Parameters
  const [lampDistanceInches, setLampDistanceInches] = useState<number>(
    equipmentSetup?.lampDistanceInches || 7
  ); // 6" to 14"
  const [lampAngle, setLampAngle] = useState<90 | 60 | 30>(90);
  const [isSealedWithClay, setIsSealedWithClay] = useState<boolean>(
    equipmentSetup ? equipmentSetup.claySealed : true
  ); // Clay & plastic wrap
  const [singleModeTablets, setSingleModeTablets] = useState<number>(
    equipmentSetup ? equipmentSetup.tabletsAdded : 4
  ); // For interactive customized station

  // Live dynamic temperature states (starts at room temp 21.0°C)
  const [temp0, setTemp0] = useState<number>(21.0);
  const [temp2, setTemp2] = useState<number>(21.0);
  const [temp4, setTemp4] = useState<number>(21.0);

  // Time log history for the dynamic graph [minute, t0, t2, t4, lampState]
  const [history, setHistory] = useState<{ minute: number; t0: number; t2: number; t4: number; lampOn: boolean }[]>([
    { minute: 0, t0: 21.0, t2: 21.0, t4: 21.0, lampOn: true },
  ]);

  // Keep track of when lamp state changed to show on graph
  const [lampShutoffMinute, setLampShutoffMinute] = useState<number | null>(null);

  // Tooltip inspection
  const [inspectedPart, setInspectedPart] = useState<string | null>(null);

  // Ambient room temperature
  const AMBIENT_TEMP = 21.0;

  // Sound mute toggle handler
  const handleToggleMute = () => {
    const next = toggleMuteAudio();
    setIsAudioMuted(next);
  };

  // Lamp switch toggle handler with audio
  const handleToggleLamp = () => {
    const nextState = !lampOn;
    setLampOn(nextState);
    playLampClickSound(nextState);
    if (!nextState && isRunning) {
      setLampShutoffMinute(Number((timerSeconds / 60).toFixed(1)));
    }
  };

  // Sound effect when tablet dissolves
  useEffect(() => {
    if (isRunning && (selectedStation > 1 || singleModeTablets > 0) && timerSeconds < 180) {
      startFizzingSound();
    } else {
      stopFizzingSound();
    }
    return () => {
      stopFizzingSound();
    };
  }, [isRunning, selectedStation, singleModeTablets, timerSeconds]);

  // Physical calculation helper
  const getRadiationIntensity = (dist: number, angle: number) => {
    // Inverse distance drop-off from 6 inches baseline
    const distFactor = Math.pow(6 / Math.max(dist, 5), 1.35);
    const angleFactor = Math.sin((angle * Math.PI) / 180);
    return distFactor * angleFactor;
  };

  // Continuous Dynamic Physics Tick Engine
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prevSec => {
          const stepSec = 1 * simSpeed;
          const nextSec = prevSec + stepSec;
          const currentMin = nextSec / 60;
          const dtMinutes = stepSec / 60; // elapsed time slice in minutes

          // Radiation input factor
          const radFlux = getRadiationIntensity(lampDistanceInches, lampAngle);

          // Update each station according to thermodynamics
          const updateStationTemp = (currentTemp: number, tabs: number) => {
            if (lampOn) {
              // HEATING PHASE:
              // Max equilibrium temp above ambient depending on CO2 tablets
              // 0 tabs = +2.6°C, 2 tabs = +5.1°C, 4 tabs = +7.6°C
              const maxDelta = tabs === 0 ? 2.6 : tabs === 2 ? 5.1 : 7.6 + (tabs > 4 ? (tabs - 4) * 0.8 : 0);
              
              let targetTemp = AMBIENT_TEMP + maxDelta * radFlux;
              
              // If unsealed, heat rapidly escapes by convection
              if (!isSealedWithClay) {
                targetTemp = AMBIENT_TEMP + (maxDelta * 0.35) * radFlux;
              }

              // Thermal response time constant (minutes)
              const tauHeat = isSealedWithClay ? (tabs === 0 ? 6.5 : tabs === 2 ? 7.2 : 8.0) : 2.5;
              const deltaT = (targetTemp - currentTemp) * (1 - Math.exp(-dtMinutes / (tauHeat / 3)));
              return Number(Math.max(AMBIENT_TEMP, currentTemp + deltaT).toFixed(2));
            } else {
              // COOLING PHASE (Lamp is OFF!):
              // Newton's Law of Cooling toward room temperature (21.0°C)
              // CO2 traps heat and slows down thermal IR dissipation!
              // 0 tabs cools fastest; 4 tabs retains heat longest!
              const tauCool = isSealedWithClay ? (tabs === 0 ? 4.8 : tabs === 2 ? 7.8 : 11.2) : 1.5;
              const deltaT = (currentTemp - AMBIENT_TEMP) * (1 - Math.exp(-dtMinutes / (tauCool / 3)));
              return Number(Math.max(AMBIENT_TEMP, currentTemp - deltaT).toFixed(2));
            }
          };

          const nextT0 = updateStationTemp(temp0, 0);
          const nextT2 = updateStationTemp(temp2, 2);
          const nextT4 = updateStationTemp(temp4, viewMode === 'single' ? singleModeTablets : 4);

          setTemp0(nextT0);
          setTemp2(nextT2);
          setTemp4(nextT4);

          // Record whole minute marks to history and labData
          const prevWholeMin = Math.floor(prevSec / 60);
          const nextWholeMin = Math.floor(nextSec / 60);

          if (nextWholeMin > prevWholeMin && nextWholeMin <= 20) {
            playTimerBeep();
            setHistory(prev => [
              ...prev,
              { minute: nextWholeMin, t0: nextT0, t2: nextT2, t4: nextT4, lampOn },
            ]);

            // Sync with global labData
            setLabData(prevData => {
              const copy = [...prevData];
              copy[nextWholeMin] = {
                timeMinute: nextWholeMin,
                temp0Tabs: Number(nextT0.toFixed(1)),
                temp2Tabs: Number(nextT2.toFixed(1)),
                temp4Tabs: Number(nextT4.toFixed(1)),
              };
              return copy;
            });
          }

          if (nextSec >= 20 * 60) {
            setIsRunning(false);
            return 20 * 60;
          }
          return nextSec;
        });
      }, 1000 / simSpeed);
    }
    return () => clearInterval(interval);
  }, [isRunning, lampOn, simSpeed, lampDistanceInches, lampAngle, isSealedWithClay, singleModeTablets, temp0, temp2, temp4, viewMode]);

  // Reset experiment
  const handleReset = () => {
    setIsRunning(false);
    setTimerSeconds(0);
    setTemp0(AMBIENT_TEMP);
    setTemp2(AMBIENT_TEMP);
    setTemp4(AMBIENT_TEMP);
    setLampShutoffMinute(null);
    setHistory([{ minute: 0, t0: AMBIENT_TEMP, t2: AMBIENT_TEMP, t4: AMBIENT_TEMP, lampOn: true }]);
  };

  // Quick 5m Heat + 5m Cool automated cycle test
  const handleQuickCycle = () => {
    handleReset();
    setLampOn(true);
    setIsRunning(true);
    setSimSpeed(15); // Fast forward for quick student demonstration
  };

  // Auto-switch lamp off at 10 minutes if running cycle
  useEffect(() => {
    const currentMin = Math.floor(timerSeconds / 60);
    if (timerSeconds > 0 && currentMin === 10 && lampOn && isRunning) {
      setLampOn(false);
      setLampShutoffMinute(10);
      playLampClickSound(false);
    }
  }, [timerSeconds, lampOn, isRunning]);

  // Active station data
  const stations = [
    {
      num: 1,
      tabs: 0,
      title: 'Station 1: Control Air (0 Tablets)',
      co2Ppm: isSealedWithClay ? 420 : 420,
      temp: temp0,
      color: '#38bdf8',
      desc: 'Ambient air (~420 ppm CO₂). Low infrared opacity; heats slightly and cools quickly when lamp is turned off.',
    },
    {
      num: 2,
      tabs: 2,
      title: 'Station 2: Moderate CO₂ (2 Tablets)',
      co2Ppm: isSealedWithClay ? 1200 : 450,
      temp: temp2,
      color: '#f59e0b',
      desc: 'Elevated CO₂ (~1,200 ppm). Traps infrared radiation in the bottle headspace; cools more slowly than control.',
    },
    {
      num: 3,
      tabs: viewMode === 'single' ? singleModeTablets : 4,
      title: viewMode === 'single' ? `Station 3: Custom (${singleModeTablets} Tablets)` : 'Station 3: Dense CO₂ (4 Tablets)',
      co2Ppm: isSealedWithClay ? (viewMode === 'single' ? 420 + singleModeTablets * 520 : 2500) : 460,
      temp: temp4,
      color: '#f43f5e',
      desc: 'High-density CO₂ atmosphere. Strong infrared back-radiation traps heat during lamp run and retains thermal energy longest during cooling.',
    },
  ];

  const activeStation = stations.find(s => s.num === selectedStation) || stations[2];

  // Temperature display format
  const formatTemp = (celsius: number) => {
    if (tempUnit === 'F') {
      return `${((celsius * 9) / 5 + 32).toFixed(1)}°F`;
    }
    return `${celsius.toFixed(1)}°C`;
  };

  // SVG Chart Setup
  const cW = 520;
  const cH = 180;
  const pL = 45;
  const pR = 20;
  const pT = 15;
  const pB = 30;

  const minT = 20.0;
  const maxT = 30.0;
  const getX = (m: number) => pL + (m / 20) * (cW - pL - pR);
  const getY = (v: number) => pT + (1 - (Math.min(Math.max(v, minT), maxT) - minT) / (maxT - minT)) * (cH - pT - pB);

  const poly0 = history.map(d => `${getX(d.minute)},${getY(d.t0)}`).join(' ');
  const poly2 = history.map(d => `${getX(d.minute)},${getY(d.t2)}`).join(' ');
  const poly4 = history.map(d => `${getX(d.minute)},${getY(d.t4)}`).join(' ');

  // Thermal Camera False-Color Map generator based on temperature
  const getThermalFill = (t: number) => {
    if (!thermalCamMode) return 'rgba(56, 189, 248, 0.08)';
    // Normalized 21°C (blue) to 29°C (bright magenta/red)
    const norm = Math.min(Math.max((t - 21.0) / 8.0, 0), 1);
    if (norm < 0.25) return '#1e3a8a'; // Deep blue
    if (norm < 0.5) return '#0284c7';  // Cyan
    if (norm < 0.7) return '#eab308';  // Yellow
    if (norm < 0.85) return '#f97316'; // Orange
    return '#ec4899';                 // Hot magenta
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner with Quick Mode Toggles */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-7 border border-indigo-900/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Module 1: Interactive Virtual Heat Lamp & Bottle Lab
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Thermodynamic Greenhouse Investigation Workbench
          </h2>
          <p className="mt-1 text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
            Directly manipulate the 150W clamped heat lamp, sealed 16.9 oz bottles, and fizzing tablet effervescence. Observe both <strong>active radiant heating</strong> and <strong>Newton's law cooling</strong> when the lamp is turned off to explore greenhouse heat retention.
          </p>
        </div>

        {/* Action Toggles: Sound, Thermal Cam, View Mode */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Audio toggle */}
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
              isAudioMuted
                ? 'bg-slate-800 border-slate-700 text-slate-400'
                : 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200'
            }`}
            title={isAudioMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            <span className="hidden sm:inline">{isAudioMuted ? 'Muted' : 'Sound ON'}</span>
          </button>

          {/* FLIR Thermal Camera toggle */}
          <button
            onClick={() => setThermalCamMode(!thermalCamMode)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              thermalCamMode
                ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle Infrared Thermal Camera False-Color View"
          >
            <Eye className="w-4 h-4 text-amber-300" />
            <span>{thermalCamMode ? 'Thermal Cam: ON' : 'Thermal Cam'}</span>
          </button>

          {/* 3-Station Parallel vs Single Focus */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('parallel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'parallel'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3 Stations
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'single'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Interactive Focus
            </button>
          </div>
        </div>
      </div>

      {/* Equipment Setup Calibration Banner */}
      {equipmentSetup && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="leading-snug">
              <span className="font-bold text-white">Active Station Setup: </span>
              <span className="text-amber-300">Station {equipmentSetup.selectedStation}</span>
              <span className="text-slate-400"> ({equipmentSetup.selectedStation === 1 ? 'Control - 0 Tabs' : equipmentSetup.selectedStation === 2 ? 'Medium - 2 Tabs' : 'High - 4 Tabs'}) • </span>
              <span className="text-slate-300">Height: <strong className="text-white">{equipmentSetup.lampHeightInches}"</strong> • </span>
              <span className="text-slate-300">Distance: <strong className="text-sky-300">{lampDistanceInches}"</strong> • </span>
              <span className="text-slate-300">Water: <strong className="text-cyan-300">{equipmentSetup.waterAddedMl} mL</strong> • </span>
              <span className="text-slate-300">Containment: <strong className="text-emerald-300">{isSealedWithClay ? 'Airtight Clay Seal' : 'Unsealed'}</strong></span>
            </div>
          </div>
          {onModifySetup && (
            <button
              onClick={onModifySetup}
              className="text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-950/60 hover:bg-amber-900/60 px-3 py-1.5 rounded-lg border border-amber-800/60 transition shadow-sm"
            >
              Re-adjust Equipment
            </button>
          )}
        </div>
      )}

      {/* Main Virtual Lab Bench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive SVG Apparatus Workbench (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            {/* Primary Controls */}
            <div className="flex items-center gap-2">
              {/* Lamp ON/OFF Switch */}
              <button
                onClick={handleToggleLamp}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow ${
                  lampOn
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                }`}
              >
                <Sun className={`w-4 h-4 ${lampOn ? 'animate-spin-slow text-slate-950' : 'text-slate-500'}`} />
                <span>{lampOn ? '150W Heat Lamp: ON' : 'Heat Lamp: OFF (Cooling)'}</span>
              </button>

              {/* Run / Pause Timer */}
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  isRunning
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRunning ? 'Pause' : 'Start Timer'}</span>
              </button>

              {/* Reset */}
              <button
                onClick={handleReset}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Reset Experiment & Temperatures back to 21°C"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Sim Speed & Preset Run Cycle */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleQuickCycle}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition"
                title="Run rapid automated 10m Heat + 10m Cool cycle"
              >
                Auto Day/Night Cycle
              </button>

              <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                {[1, 5, 15].map(s => (
                  <button
                    key={s}
                    onClick={() => setSimSpeed(s)}
                    className={`px-2 py-1 rounded font-mono text-[11px] transition ${
                      simSpeed === s ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              <button
                onClick={() => setTempUnit(tempUnit === 'C' ? 'F' : 'C')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700"
              >
                °{tempUnit}
              </button>
            </div>
          </div>

          {/* Real-time Status Banner */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${lampOn ? 'bg-amber-400 animate-ping' : 'bg-sky-400'}`} />
              <span className="text-slate-300 font-medium">
                {lampOn ? (
                  <span className="text-amber-300 font-semibold">Active Heating Phase: Radiant light converting to thermal infrared</span>
                ) : (
                  <span className="text-sky-300 font-semibold">Cooling Phase: Newton's dissipation toward 21.0°C ambient room</span>
                )}
              </span>
            </div>
            <div className="font-mono text-slate-400 text-[11px]">
              Room Temp: <strong className="text-slate-200">21.0°C</strong>
            </div>
          </div>

          {/* Interactive Apparatus SVG Visualization */}
          <div className="relative w-full h-84 bg-slate-950 rounded-2xl border border-slate-800 p-2 flex items-center justify-center overflow-hidden select-none">
            {/* Thermal Camera Palette Legend */}
            {thermalCamMode && (
              <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700 p-2 rounded-lg text-[10px] z-20 flex flex-col gap-1">
                <span className="font-bold text-slate-300">FLIR Thermal Scale:</span>
                <div className="w-24 h-2.5 rounded bg-gradient-to-r from-blue-900 via-cyan-500 via-yellow-400 to-rose-600" />
                <div className="flex justify-between font-mono text-slate-400 text-[9px]">
                  <span>21°C</span>
                  <span>25°C</span>
                  <span>29°C+</span>
                </div>
              </div>
            )}

            <svg viewBox="0 0 700 360" className="w-full h-full">
              {/* Benchtop Surface */}
              <rect x="20" y="320" width="660" height="25" fill="#1e293b" rx="4" />
              <line x1="20" y1="320" x2="680" y2="320" stroke="#334155" strokeWidth="2" />

              {/* 150W Clamped Heat Lamp */}
              <g 
                className="cursor-pointer group"
                onClick={() => setInspectedPart('heat-lamp')}
              >
                {/* Clamp to vertical stand */}
                <rect x="40" y="80" width="16" height="240" fill="#475569" rx="2" />
                <rect x="32" y="310" width="32" height="10" fill="#334155" rx="2" />
                {/* Clamp bracket */}
                <rect x="36" y="130" width="30" height="25" fill="#64748b" rx="4" />
                <circle cx="51" cy="142" r="5" fill="#94a3b8" />

                {/* Metal Lampshade */}
                <path d="M 66 142 L 140 100 L 150 180 Z" fill={thermalCamMode ? (lampOn ? '#b91c1c' : '#334155') : '#475569'} stroke="#64748b" strokeWidth="2" />
                
                {/* 150W Bulb */}
                <circle 
                  cx="130" 
                  cy="140" 
                  r="18" 
                  fill={lampOn ? (thermalCamMode ? '#fbbf24' : '#fbbf24') : '#334155'} 
                />
                
                {/* Lamp Glow */}
                {lampOn && (
                  <circle cx="130" cy="140" r="28" fill="#fbbf24" opacity="0.35" className="animate-pulse" />
                )}

                {/* Radiant Heat Rays streaming to bottle */}
                {lampOn && (
                  <g opacity={Math.min(getRadiationIntensity(lampDistanceInches, lampAngle), 1.2)}>
                    <polygon points="145,115 440,50 440,310 145,170" fill="url(#lampRayGrad)" opacity="0.45" />
                    <line x1="150" y1="125" x2="430" y2="100" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" />
                    <line x1="150" y1="140" x2="430" y2="170" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="6 4" />
                    <line x1="150" y1="155" x2="430" y2="240" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" />
                  </g>
                )}

                {/* Cooling IR dissipation waves when lamp is OFF */}
                {!lampOn && isRunning && (
                  <g opacity="0.6" className="animate-pulse">
                    <path d="M 440 180 Q 420 170 410 180 T 400 180" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                    <path d="M 530 180 Q 550 170 560 180 T 570 180" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="485" y="60" fill="#38bdf8" fontSize="10" textAnchor="middle" fontFamily="sans-serif">
                      Radiative Cooling: Heat Dissipating
                    </text>
                  </g>
                )}

                <text x="60" y="65" fill="#f59e0b" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                  150W Clamped Heat Lamp ({lampDistanceInches}" Distance)
                </text>
              </g>

              {/* Distance Ruler between Lamp and Bottle */}
              <g>
                <line x1="150" y1="300" x2="440" y2="300" stroke="#64748b" strokeWidth="2" />
                <line x1="150" y1="295" x2="150" y2="305" stroke="#94a3b8" strokeWidth="2" />
                <line x1="440" y1="295" x2="440" y2="305" stroke="#94a3b8" strokeWidth="2" />
                <rect x="260" y="288" width="80" height="18" fill="#0f172a" rx="4" stroke="#475569" />
                <text x="300" y="301" fill="#e2e8f0" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {lampDistanceInches} Inches
                </text>
              </g>

              {/* 16.9 oz Plastic Water Bottle */}
              <g 
                className="cursor-pointer group"
                onClick={() => setInspectedPart('plastic-bottle')}
              >
                {/* Bottle body */}
                <rect 
                  x="440" 
                  y="110" 
                  width="90" 
                  height="210" 
                  rx="18" 
                  fill={getThermalFill(activeStation.temp)} 
                  stroke={thermalCamMode ? '#f43f5e' : '#38bdf8'} 
                  strokeWidth="2.5" 
                />
                
                {/* Bottle neck */}
                <rect 
                  x="465" 
                  y="75" 
                  width="40" 
                  height="35" 
                  rx="4" 
                  fill={getThermalFill(activeStation.temp)} 
                  stroke={thermalCamMode ? '#f43f5e' : '#38bdf8'} 
                  strokeWidth="2" 
                />

                {/* 50 mL Water at bottom */}
                <path d="M 442 270 Q 485 265 528 270 L 528 310 Q 528 320 515 320 L 455 320 Q 442 320 442 310 Z" fill={thermalCamMode ? '#1e3a8a' : '#0284c7'} opacity="0.65" />
                <text x="485" y="295" fill="#e0f2fe" fontSize="10" textAnchor="middle" fontWeight="bold">50 mL H₂O</text>

                {/* Fizzing Tablets in liquid with bubbling */}
                {activeStation.tabs > 0 && (
                  <g>
                    {/* Tablet solids */}
                    <ellipse cx="465" cy="312" rx="10" ry="4" fill="#f8fafc" stroke="#94a3b8" />
                    {activeStation.tabs >= 2 && (
                      <ellipse cx="485" cy="313" rx="10" ry="4" fill="#f8fafc" stroke="#94a3b8" />
                    )}
                    {activeStation.tabs >= 4 && (
                      <>
                        <ellipse cx="505" cy="312" rx="10" ry="4" fill="#f8fafc" stroke="#94a3b8" />
                        <ellipse cx="475" cy="310" rx="9" ry="3.5" fill="#f8fafc" stroke="#94a3b8" />
                      </>
                    )}

                    {/* Effervescent bubbles */}
                    {isRunning && (
                      <g fill="#ffffff" opacity="0.85">
                        <circle cx="465" cy="285" r="2.5" className="animate-ping" />
                        <circle cx="485" cy="275" r="3" className="animate-ping" />
                        <circle cx="505" cy="280" r="2" className="animate-ping" />
                        <circle cx="475" cy="250" r="2" />
                        <circle cx="495" cy="230" r="2.5" />
                        <circle cx="460" cy="210" r="3" />
                      </g>
                    )}
                  </g>
                )}

                {/* Modeling Clay & Plastic Wrap Seal */}
                {isSealedWithClay ? (
                  <g onClick={(e) => { e.stopPropagation(); setIsSealedWithClay(false); }}>
                    {/* Clear Plastic Wrap */}
                    <rect x="460" y="70" width="50" height="12" rx="2" fill="#e0e7ff" opacity="0.85" stroke="#818cf8" strokeWidth="1.5" />
                    <line x1="460" y1="78" x2="510" y2="78" stroke="#f43f5e" strokeWidth="2" />
                    {/* Modeling Clay airtight collar */}
                    <ellipse cx="485" cy="74" rx="14" ry="7" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
                    <text x="515" y="72" fill="#f59e0b" fontSize="8" fontWeight="bold">Sealed</text>
                  </g>
                ) : (
                  <g onClick={(e) => { e.stopPropagation(); setIsSealedWithClay(true); }}>
                    {/* Open top with escaping heat convection plumes */}
                    <text x="485" y="65" fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="middle">
                      UNSEALED (Heat Leaking!)
                    </text>
                    <path d="M 475 70 Q 470 50 480 35" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 2" className="animate-pulse" />
                    <path d="M 495 70 Q 500 50 490 35" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 2" className="animate-pulse" />
                  </g>
                )}

                {/* Digital Thermometer Probe suspended in Air Headspace */}
                <g onClick={() => setInspectedPart('digital-probe')}>
                  {/* Wire */}
                  <path d="M 485 74 Q 530 40 570 60" fill="none" stroke="#64748b" strokeWidth="3" />
                  {/* Metal Probe hanging in air headspace */}
                  <rect x="483" y="74" width="4" height="130" fill="#94a3b8" rx="2" stroke="#475569" strokeWidth="1" />
                  {/* Sensor Tip */}
                  <circle cx="485" cy="204" r="5" fill="#f43f5e" />
                  <text x="430" y="200" fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="end">
                    Headspace Probe
                  </text>
                  <line x1="435" y1="198" x2="478" y2="204" stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" />
                </g>
              </g>

              {/* Digital Thermometer LCD Console Unit */}
              <g 
                transform="translate(560, 45)"
                className="cursor-pointer"
                onClick={() => setInspectedPart('thermometer-console')}
              >
                <rect x="0" y="0" width="115" height="90" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <rect x="8" y="10" width="99" height="42" rx="6" fill="#022c22" stroke="#065f46" strokeWidth="1.5" />
                <text x="98" y="38" fill="#34d399" fontSize="20" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                  {formatTemp(activeStation.temp)}
                </text>
                <text x="12" y="24" fill="#059669" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  AIR HEADSPACE
                </text>
                <text x="57" y="75" fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="bold">
                  Digital Thermometer
                </text>
              </g>

              {/* Gradient defs */}
              <defs>
                <linearGradient id="lampRayGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inspect Tooltip Overlay */}
            {inspectedPart && (
              <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 p-3 rounded-xl border border-indigo-500/50 shadow-2xl flex items-center justify-between text-xs animate-fadeIn z-30">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-slate-200">
                    {inspectedPart === 'heat-lamp' && '150W Clamped Radiant Lamp: Radiates energy outward. Turn it OFF to observe the bottle cool down via Newton\'s law of cooling.'}
                    {inspectedPart === 'plastic-bottle' && '16.9 oz Plastic Bottle: Simulates a planetary atmosphere container holding CO₂ gas and air.'}
                    {inspectedPart === 'digital-probe' && 'Headspace Probe: Measures air temperature 2" above water to register trapped greenhouse heat.'}
                    {inspectedPart === 'thermometer-console' && 'Digital LCD Thermometer: Displays the live temperature inside the bottle in real time.'}
                  </span>
                </div>
                <button
                  onClick={() => setInspectedPart(null)}
                  className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 text-[11px]"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Interactive Bottle Controls Panel: Seal toggle, Tablet Dropper, Lamp Distance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
            {/* Clay & Plastic Seal Toggle */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Airtight Clay Seal
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isSealedWithClay ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                  {isSealedWithClay ? 'Sealed' : 'Open / Leaking'}
                </span>
              </div>
              <button
                onClick={() => setIsSealedWithClay(!isSealedWithClay)}
                className={`mt-2 py-1.5 px-3 rounded-lg text-xs font-semibold border transition ${
                  isSealedWithClay 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                }`}
              >
                {isSealedWithClay ? 'Remove Clay Seal (Test Convection Leak)' : 'Re-Seal with Clay & Wrap'}
              </button>
            </div>

            {/* Interactive Fizzing Tablet Dropper */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  Fizzing Tablets
                </span>
                <strong className="font-mono text-amber-300 text-sm">
                  {viewMode === 'single' ? singleModeTablets : activeStation.tabs} Tabs
                </strong>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  disabled={viewMode === 'single' ? singleModeTablets <= 0 : true}
                  onClick={() => {
                    if (viewMode === 'single') setSingleModeTablets(Math.max(0, singleModeTablets - 1));
                  }}
                  className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 font-bold border border-slate-700"
                >
                  -
                </button>
                <button
                  disabled={viewMode === 'single' ? singleModeTablets >= 6 : true}
                  onClick={() => {
                    if (viewMode === 'single') {
                      setSingleModeTablets(Math.min(6, singleModeTablets + 1));
                      startFizzingSound();
                      setTimeout(() => stopFizzingSound(), 3000);
                    }
                  }}
                  className="flex-1 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-bold"
                >
                  + Add Tablet
                </button>
              </div>
              {viewMode === 'parallel' && (
                <span className="text-[10px] text-slate-500 mt-1">Switch to 'Interactive Focus' to modify tablets</span>
              )}
            </div>

            {/* Lamp Distance */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-300">Lamp Distance:</span>
                <strong className="text-amber-300 font-mono">{lampDistanceInches}"</strong>
              </div>
              <input
                type="range"
                min="6"
                max="14"
                value={lampDistanceInches}
                onChange={e => setLampDistanceInches(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">6" Safe Minimum (prevents bottle melting)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Multi-Station Telemetry & Live Cooling Graph (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            {/* Timer Header with Cooldown Status */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Investigation Time
                </span>
              </div>
              <div className="text-2xl font-mono font-black text-amber-400">
                {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:
                {String(timerSeconds % 60).padStart(2, '0')}
              </div>
            </div>

            {/* 3 Parallel Station Telemetry Cards */}
            <div className="mt-4 space-y-2.5">
              {stations.map(st => {
                const isSelected = selectedStation === st.num;
                const deltaT = Number((st.temp - AMBIENT_TEMP).toFixed(1));
                return (
                  <div
                    key={st.num}
                    onClick={() => setSelectedStation(st.num as any)}
                    className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 ring-2 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                    style={{ borderColor: isSelected ? st.color : undefined }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: st.color }}
                        />
                        <span className="text-xs font-bold text-white">{st.title}</span>
                      </div>
                      <span className="text-base font-mono font-bold text-white">
                        {formatTemp(st.temp)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-400">
                      <span>CO₂ Concentration: ~{st.co2Ppm} ppm</span>
                      <span className={`font-mono font-bold ${deltaT > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        ΔT: {deltaT > 0 ? `+${deltaT}` : deltaT}°C
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Real-time Dynamic Heating & Cooling SVG Chart */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  Live Thermal Curves (Heating & Cooling)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">0m to 20m</span>
              </div>

              <div className="relative">
                <svg viewBox={`0 0 ${cW} ${cH}`} className="w-full h-40 bg-slate-950 rounded-xl border border-slate-800">
                  {/* Horizontal Gridlines */}
                  {[21, 24, 27, 30].map(t => (
                    <g key={t}>
                      <line x1={pL} y1={getY(t)} x2={cW - pR} y2={getY(t)} stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />
                      <text x={pL - 6} y={getY(t) + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">{t}°</text>
                    </g>
                  ))}

                  {/* X Axis Time Marks */}
                  {[0, 5, 10, 15, 20].map(m => (
                    <g key={m}>
                      <line x1={getX(m)} y1={pT} x2={getX(m)} y2={cH - pB} stroke="#1e293b" strokeWidth="1" />
                      <text x={getX(m)} y={cH - pB + 14} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">{m}m</text>
                    </g>
                  ))}

                  {/* Marker for Lamp Shutoff Point if lamp was turned off */}
                  {lampShutoffMinute !== null && (
                    <g>
                      <line 
                        x1={getX(lampShutoffMinute)} 
                        y1={pT} 
                        x2={getX(lampShutoffMinute)} 
                        y2={cH - pB} 
                        stroke="#f43f5e" 
                        strokeWidth="1.5" 
                        strokeDasharray="4 2" 
                      />
                      <text x={getX(lampShutoffMinute)} y={pT + 10} fill="#f43f5e" fontSize="8" textAnchor="middle" fontWeight="bold">
                        Lamp OFF
                      </text>
                    </g>
                  )}

                  {/* Polylines for 0, 2, 4 tabs */}
                  <polyline points={poly0} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                  <polyline points={poly2} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                  <polyline points={poly4} fill="none" stroke="#f43f5e" strokeWidth="3" />

                  {/* Current Time Indicator Marker */}
                  <line
                    x1={getX(timerSeconds / 60)}
                    y1={pT}
                    x2={getX(timerSeconds / 60)}
                    y2={cH - pB}
                    stroke="#a855f7"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" /> Control (0 tabs)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> 2 Tabs
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> 4 Tabs (Traps & Retains)
                </span>
              </div>
            </div>
          </div>

          {/* Molecular Headspace Inspection Drawer Trigger */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={() => setShowMolecularZoom(!showMolecularZoom)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Eye className="w-4 h-4 text-sky-400" />
              <span>{showMolecularZoom ? 'Hide Headspace Molecules' : 'Inspect Headspace Molecules'}</span>
            </button>

            <button
              onClick={onGoToNextModule}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition"
            >
              <span>Varying CO₂ Module</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Molecular Zoom Drawer */}
      {showMolecularZoom && (
        <div className="bg-slate-900/95 rounded-2xl p-6 border border-indigo-500/50 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                Molecular Headspace Microscopic View ({activeStation.tabs} Tablets Active)
              </h3>
            </div>
            <button
              onClick={() => setShowMolecularZoom(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="h-56 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center p-4">
              <svg viewBox="0 0 300 200" className="w-full h-full">
                {/* Nitrogen & Oxygen molecules (transparent to IR) */}
                <g opacity="0.6">
                  <circle cx="50" cy="40" r="5" fill="#38bdf8" />
                  <circle cx="58" cy="40" r="5" fill="#38bdf8" />
                  <circle cx="120" cy="140" r="5" fill="#38bdf8" />
                  <circle cx="128" cy="140" r="5" fill="#38bdf8" />
                  <circle cx="220" cy="60" r="5" fill="#38bdf8" />
                  <circle cx="228" cy="60" r="5" fill="#38bdf8" />
                </g>

                {/* Triatomic CO2 Molecules with vibration animation */}
                {Array.from({ length: Math.max(activeStation.tabs * 3, 2) }).map((_, i) => {
                  const x = 60 + (i * 45) % 200;
                  const y = 40 + ((i * 35) % 120);
                  return (
                    <g key={i} className={lampOn ? 'animate-bounce' : ''}>
                      {/* Carbon (Black) */}
                      <circle cx={x} cy={y} r="7" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                      {/* Oxygens (Red) */}
                      <circle cx={x - 12} cy={y} r="5.5" fill="#f43f5e" />
                      <circle cx={x + 12} cy={y} r="5.5" fill="#f43f5e" />
                      {/* Bonds */}
                      <line x1={x - 12} y1={y} x2={x - 7} y2={y} stroke="#94a3b8" strokeWidth="1.5" />
                      <line x1={x + 7} y1={y} x2={x + 12} y2={y} stroke="#94a3b8" strokeWidth="1.5" />
                    </g>
                  );
                })}

                {/* Infrared photon waves */}
                {lampOn ? (
                  <g>
                    <path d="M 20 180 Q 50 160 80 180 T 140 180" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" />
                    <path d="M 140 180 Q 170 160 200 180 T 260 180" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" />
                    <text x="150" y="195" fill="#f59e0b" fontSize="10" textAnchor="middle" fontWeight="bold">
                      Thermal Infrared (IR) Trapped by CO₂
                    </text>
                  </g>
                ) : (
                  <text x="150" y="195" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">
                    Lamp Off: Gradual Thermal Dissipation
                  </text>
                )}
              </svg>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong>Diatomic Air (N₂ & O₂):</strong> Comprises 99% of ambient air. Because their molecular dipoles do not change when stretched, they cannot absorb thermal infrared radiation. Heat radiates straight through them.
              </p>
              <p>
                <strong>Triatomic Carbon Dioxide (CO₂):</strong> The carbon-oxygen bonds bend and vibrate at infrared wavelengths (around 15 µm). This enables each CO₂ molecule to absorb upward-moving heat and re-radiate it in all directions—including back down into the bottle headspace.
              </p>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <strong>Cooling Retention Principle:</strong> When the heat lamp is switched off, the high-CO₂ bottle takes significantly longer to return to 21°C because greenhouse molecules continually intercept and delay outgoing thermal radiation.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
