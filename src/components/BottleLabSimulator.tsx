import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Sun, 
  Thermometer, 
  Clock, 
  Plus, 
  Download, 
  Sparkles, 
  AlertTriangle, 
  Flame, 
  Check, 
  TrendingUp, 
  Info,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { StationDataPoint } from '../types';
import { BENCHMARK_LAB_DATA } from '../data/labData';

interface BottleLabSimulatorProps {
  labData: StationDataPoint[];
  setLabData: React.Dispatch<React.SetStateAction<StationDataPoint[]>>;
  onGoToAnalysis: () => void;
}

export const BottleLabSimulator: React.FC<BottleLabSimulatorProps> = ({
  labData,
  setLabData,
  onGoToAnalysis,
}) => {
  // Simulator State
  const [lampOn, setLampOn] = useState<boolean>(false);
  const [lampDistanceInches, setLampDistanceInches] = useState<number>(7); // >= 6 inches
  const [activeStation, setActiveStation] = useState<'station1' | 'station2' | 'station3' | 'parallel'>('parallel');
  const [simTimeSeconds, setSimTimeSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(5); // 1x, 5x, 15x
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [lampSegments, setLampSegments] = useState<{ startMin: number; lampOn: boolean }[]>([
    { startMin: 0, lampOn: false }
  ]);

  // Cooldown timer state for safety
  const [cooldownRemainingSec, setCooldownRemainingSec] = useState<number>(0);

  // Dynamic live temperatures calculated based on physics model with piecewise thermodynamic integration
  // Factors in exact duration the light was off and the dissipation of absorbed heat!
  const getPhysicsTemp = (timeMinutes: number, tabletCount: number, distInches: number, _isLampEnergized?: boolean) => {
    const ambient = 21.0;
    const distFactor = Math.pow(6 / Math.max(distInches, 5), 1.4); // inverse square-ish radiant flux
    
    // Radiative greenhouse factor
    let maxRise = 2.5; // 0 tabs
    if (tabletCount === 2) maxRise = 4.8;
    if (tabletCount === 4) maxRise = 7.1;

    const targetDelta = maxRise * distFactor;
    const tauHeat = tabletCount === 0 ? 6.5 : tabletCount === 2 ? 7.2 : 8.0;
    const tauCool = tabletCount === 0 ? 4.8 : tabletCount === 2 ? 7.8 : 11.2;

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
          const maxHeatedTemp = ambient + targetDelta;
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
        const maxHeatedTemp = ambient + targetDelta;
        currentTemp = maxHeatedTemp - (maxHeatedTemp - currentTemp) * Math.exp(-dtFinal / tauHeat);
      } else {
        currentTemp = ambient + (currentTemp - ambient) * Math.exp(-dtFinal / tauCool);
      }
    }

    return Number(currentTemp.toFixed(1));
  };

  const currentMinute = Math.floor(simTimeSeconds / 60);

  // Live temps right now
  const liveTemp0 = getPhysicsTemp(simTimeSeconds / 60, 0, lampDistanceInches, lampOn);
  const liveTemp2 = getPhysicsTemp(simTimeSeconds / 60, 2, lampDistanceInches, lampOn);
  const liveTemp4 = getPhysicsTemp(simTimeSeconds / 60, 4, lampDistanceInches, lampOn);

  // Interval ticker
  useEffect(() => {
    let interval: any = null;
    if (isRunning && lampOn) {
      interval = setInterval(() => {
        setSimTimeSeconds(prev => {
          const next = prev + 1 * simSpeed;
          if (next >= 15 * 60) {
            setIsRunning(false);
            return 15 * 60;
          }
          return next;
        });
      }, 1000 / simSpeed);
    }
    return () => clearInterval(interval);
  }, [isRunning, lampOn, simSpeed]);

  // Sync simulated data with table automatically when time advances
  useEffect(() => {
    const min = Math.min(15, Math.floor(simTimeSeconds / 60));
    setLabData(prev => {
      const copy = [...prev];
      for (let i = 0; i <= min; i++) {
        if (!copy[i]) {
          copy[i] = {
            timeMinute: i,
            temp0Tabs: getPhysicsTemp(i, 0, lampDistanceInches, true),
            temp2Tabs: getPhysicsTemp(i, 2, lampDistanceInches, true),
            temp4Tabs: getPhysicsTemp(i, 4, lampDistanceInches, true),
          };
        } else {
          // update up to current minute
          copy[i] = {
            ...copy[i],
            temp0Tabs: getPhysicsTemp(i, 0, lampDistanceInches, true),
            temp2Tabs: getPhysicsTemp(i, 2, lampDistanceInches, true),
            temp4Tabs: getPhysicsTemp(i, 4, lampDistanceInches, true),
          };
        }
      }
      return copy;
    });
  }, [simTimeSeconds, lampDistanceInches, lampOn]);

  const handleToggleLamp = () => {
    const nextState = !lampOn;
    setLampOn(nextState);
    const curMin = simTimeSeconds / 60;
    setLampSegments(prev => {
      if (curMin === 0 && prev.length <= 1) {
        return [{ startMin: 0, lampOn: nextState }];
      }
      return [...prev, { startMin: curMin, lampOn: nextState }];
    });
    if (!nextState) {
      setIsRunning(false);
      setCooldownRemainingSec(30 * 60); // 30 min cooldown safety rule
    } else {
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSimTimeSeconds(0);
    setLampOn(false);
    setLampSegments([{ startMin: 0, lampOn: false }]);
    setLabData(BENCHMARK_LAB_DATA);
  };

  const handlePopulateBenchmark = () => {
    setLabData(BENCHMARK_LAB_DATA);
    setSimTimeSeconds(15 * 60);
  };

  const handleCellEdit = (index: number, field: keyof StationDataPoint, val: string) => {
    const num = parseFloat(val);
    setLabData(prev => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = {
          ...copy[index],
          [field]: isNaN(num) ? 0 : num,
        };
      }
      return copy;
    });
  };

  const exportCSV = () => {
    const headers = 'Time (min),Station 1 (0 Tablets °C),Station 2 (2 Tablets °C),Station 3 (4 Tablets °C)\n';
    const rows = labData.map(d => `${d.timeMinute},${d.temp0Tabs},${d.temp2Tabs},${d.temp4Tabs}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'greenhouse_bottle_lab_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Convert to F if selected
  const toDisplayTemp = (c: number) => {
    if (tempUnit === 'F') {
      return ((c * 9) / 5 + 32).toFixed(1);
    }
    return c.toFixed(1);
  };

  // Summary Statistics
  const initial0 = labData[0]?.temp0Tabs ?? 21;
  const initial2 = labData[0]?.temp2Tabs ?? 21;
  const initial4 = labData[0]?.temp4Tabs ?? 21;

  const final0 = labData[labData.length - 1]?.temp0Tabs ?? initial0;
  const final2 = labData[labData.length - 1]?.temp2Tabs ?? initial2;
  const final4 = labData[labData.length - 1]?.temp4Tabs ?? initial4;

  const delta0 = Number((final0 - initial0).toFixed(1));
  const delta2 = Number((final2 - initial2).toFixed(1));
  const delta4 = Number((final4 - initial4).toFixed(1));

  const totalMin = labData[labData.length - 1]?.timeMinute || 15;
  const rate0 = (delta0 / totalMin).toFixed(2);
  const rate2 = (delta2 / totalMin).toFixed(2);
  const rate4 = (delta4 / totalMin).toFixed(2);

  // SVG Chart Dimensions
  const chartW = 600;
  const chartH = 260;
  const padL = 45;
  const padR = 25;
  const padT = 20;
  const padB = 35;

  const minTemp = 20.0;
  const maxTemp = 30.0;

  const getX = (tMin: number) => padL + (tMin / 15) * (chartW - padL - padR);
  const getY = (tC: number) => padT + (1 - (tC - minTemp) / (maxTemp - minTemp)) * (chartH - padT - padB);

  const makePolyline = (key: 'temp0Tabs' | 'temp2Tabs' | 'temp4Tabs') => {
    return labData.map(d => `${getX(d.timeMinute)},${getY(d[key])}`).join(' ');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Module 2: Interactive Apparatus & Multi-Condition Data Logger
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Bottle Atmosphere Heat Lamp Simulation
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
            Control the 150W radiant heat lamp, monitor the headspace digital thermometer probe, and record temperatures across <strong>Station 1 (0 tablets)</strong>, <strong>Station 2 (2 tablets)</strong>, and <strong>Station 3 (4 tablets)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center text-xs">
            <button
              onClick={() => setTempUnit('C')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                tempUnit === 'C' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setTempUnit('F')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                tempUnit === 'F' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              °F
            </button>
          </div>

          <button
            onClick={handlePopulateBenchmark}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            title="Load realistic classroom benchmark data"
          >
            Load Benchmark
          </button>
        </div>
      </div>

      {/* Main Interactive Apparatus Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Visual Apparatus (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden">
          {/* Status & Warning Bar */}
          <div className="flex items-center justify-between gap-2 mb-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                lampOn 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                <Sun className="w-3.5 h-3.5" />
                {lampOn ? 'HEAT LAMP ACTIVE (150W)' : 'HEAT LAMP OFF'}
              </span>

              {lampDistanceInches < 6 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                  <AlertTriangle className="w-3 h-3" /> &lt;6" MELT HAZARD!
                </span>
              )}
            </div>

            {/* View Selector */}
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setActiveStation('parallel')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition ${
                  activeStation === 'parallel'
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                All 3 Stations
              </button>
              <button
                onClick={() => setActiveStation('station1')}
                className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition ${
                  activeStation === 'station1'
                    ? 'bg-sky-600 border-sky-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Stn 1 (0)
              </button>
              <button
                onClick={() => setActiveStation('station2')}
                className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition ${
                  activeStation === 'station2'
                    ? 'bg-amber-600 border-amber-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Stn 2 (2)
              </button>
              <button
                onClick={() => setActiveStation('station3')}
                className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition ${
                  activeStation === 'station3'
                    ? 'bg-rose-600 border-rose-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Stn 3 (4)
              </button>
            </div>
          </div>

          {/* SVG Apparatus Graphic */}
          <div className="relative w-full h-80 sm:h-96 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-800/90 flex items-center justify-center p-2 overflow-hidden">
            {/* Ambient heat rays when lamp is on */}
            {lampOn && (
              <div 
                className="absolute inset-0 pointer-events-none transition-opacity duration-700"
                style={{
                  background: 'radial-gradient(circle at 18% 45%, rgba(245, 158, 11, 0.28) 0%, rgba(239, 68, 68, 0.12) 40%, transparent 70%)',
                }}
              />
            )}

            <svg viewBox="0 0 700 400" className="w-full h-full">
              <defs>
                {/* Heat Lamp Glow Gradient */}
                <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fffbeb" stopOpacity="1" />
                  <stop offset="30%" stopColor="#fbbf24" stopOpacity="0.9" />
                  <stop offset="70%" stopColor="#f97316" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>

                {/* Heat Wave Pattern */}
                <linearGradient id="heatBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#f97316" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
                </linearGradient>

                <linearGradient id="bottleGlass" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.25" />
                </linearGradient>
              </defs>

              {/* Lab Bench Table Surface */}
              <rect x="20" y="340" width="660" height="24" rx="4" fill="#334155" stroke="#475569" strokeWidth="2" />
              <rect x="40" y="364" width="20" height="30" fill="#1e293b" />
              <rect x="640" y="364" width="20" height="30" fill="#1e293b" />

              {/* 1. HEAT LAMP ASSEMBLY (Left Side, Clamped & Pointing Outward) */}
              <g id="heat-lamp-assembly">
                {/* Clamp & Stand Attached to Table Edge */}
                <rect x="60" y="240" width="12" height="105" fill="#475569" stroke="#64748b" strokeWidth="1" />
                <rect x="52" y="325" width="28" height="20" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                <circle cx="66" cy="335" r="4" fill="#94a3b8" />
                {/* Arm bending outward */}
                <path d="M 66 240 L 66 180 Q 66 150 95 150 L 120 150" fill="none" stroke="#475569" strokeWidth="12" strokeLinecap="round" />
                
                {/* Electrical Cord Routing */}
                <path d="M 66 250 Q 40 280 35 340 L 30 380" fill="none" stroke="#0f172a" strokeWidth="4" />
                <text x="25" y="395" fill="#64748b" fontSize="9" fontFamily="monospace">GFI Cord Off Floor</text>

                {/* Metal Lampshade (Pointed Outward towards bottles) */}
                <path d="M 120 120 L 185 90 L 185 210 L 120 180 Z" fill="#64748b" stroke="#94a3b8" strokeWidth="2" />
                {/* Ceramic Socket */}
                <rect x="110" y="138" width="16" height="24" rx="2" fill="#e2e8f0" />

                {/* 150W Incandescent Heat Bulb */}
                <ellipse cx="170" cy="150" rx="22" ry="26" fill={lampOn ? '#fef08a' : '#cbd5e1'} stroke={lampOn ? '#f59e0b' : '#94a3b8'} strokeWidth="2" />
                
                {lampOn && (
                  <>
                    {/* Glowing Filament */}
                    <path d="M 158 144 L 165 156 L 172 144 L 178 156" fill="none" stroke="#ef4444" strokeWidth="2.5" />
                    {/* Radial Light Glow */}
                    <circle cx="170" cy="150" r="45" fill="url(#lampGlow)" pointerEvents="none" />
                    {/* Radiant Heat Rays Cone */}
                    <polygon points="185,90 480,40 480,340 185,210" fill="url(#heatBeam)" opacity="0.45" pointerEvents="none" />
                    {/* Infrared Radiation Wave Indicators */}
                    <path d="M 210 130 Q 230 150 250 130" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" />
                    <path d="M 230 160 Q 250 180 270 160" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" />
                    <path d="M 270 140 Q 290 160 310 140" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="4 2" />
                  </>
                )}

                {/* Hot Surface Warning Tag */}
                <g transform="translate(115, 75)">
                  <rect width="64" height="16" rx="4" fill="#991b1b" />
                  <text x="32" y="11" fill="#fecaca" fontSize="8" fontWeight="bold" textAnchor="middle">HOT SURFACE</text>
                </g>
              </g>

              {/* Distance Ruler Gauge Between Lamp and Bottle */}
              <g id="distance-gauge">
                <line x1="185" y1="310" x2="330" y2="310" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="185" cy="310" r="3" fill="#f59e0b" />
                <circle cx="330" cy="310" r="3" fill="#f59e0b" />
                <rect x="220" y="296" width="75" height="18" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
                <text x="257" y="309" fill="#fcd34d" fontSize="10" fontWeight="bold" textAnchor="middle">
                  {lampDistanceInches}" ({Math.round(lampDistanceInches * 2.54)} cm)
                </text>
              </g>

              {/* 2. PLASTIC WATER BOTTLE APPARATUS (Center-Right) */}
              {/* Bottle 1 / Main View */}
              <g id="bottle-apparatus-1" transform="translate(330, 100)">
                {/* Bottle Cap / Seal: Plastic Wrap & Modeling Clay */}
                {/* Bottle Neck */}
                <rect x="25" y="55" width="20" height="25" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                {/* Modeling Clay Collar (Sealing Probe) */}
                <ellipse cx="35" cy="55" rx="16" ry="8" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
                <text x="35" y="42" fill="#fde68a" fontSize="8" textAnchor="middle" fontWeight="bold">Clay Seal</text>

                {/* Plastic Wrap Layer with Rubber Band */}
                <path d="M 18 55 Q 35 50 52 55" stroke="#e0f2fe" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
                <ellipse cx="35" cy="62" rx="13" ry="3" fill="none" stroke="#ea580c" strokeWidth="2" />

                {/* 16.9 oz (500 mL) Plastic Bottle Body */}
                <path
                  d="M 25 75 
                     C 25 90, 8 105, 8 130 
                     L 8 230 
                     C 8 238, 15 240, 20 240 
                     L 50 240 
                     C 55 240, 62 238, 62 230 
                     L 62 130 
                     C 62 105, 45 90, 45 75 
                     Z"
                  fill="url(#bottleGlass)"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />

                {/* Bottle Ribs / Contours */}
                <line x1="12" y1="150" x2="58" y2="150" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
                <line x1="12" y1="180" x2="58" y2="180" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />

                {/* 50 mL Water Level at Bottom */}
                <path
                  d="M 9 205 Q 35 203 61 205 L 61 230 C 61 238, 55 240, 50 240 L 20 240 C 15 240, 9 238, 9 230 Z"
                  fill="#0284c7"
                  opacity="0.5"
                />
                <text x="70" y="220" fill="#38bdf8" fontSize="9">50 mL H2O</text>

                {/* Fizzing Tablets & Bubbles in Water */}
                {activeStation !== 'station1' && (
                  <g id="tablets-and-effervescence">
                    {/* Tablet silhouettes at bottom */}
                    <rect x="22" y="230" width="12" height="5" rx="2" fill="#f8fafc" stroke="#94a3b8" />
                    {activeStation === 'station3' && (
                      <rect x="36" y="230" width="12" height="5" rx="2" fill="#f8fafc" stroke="#94a3b8" />
                    )}
                    {/* Animated CO2 effervescence bubbles rising into headspace */}
                    <circle cx="25" cy="218" r="2" fill="#bae6fd" opacity="0.8" />
                    <circle cx="30" cy="210" r="2.5" fill="#bae6fd" opacity="0.9" />
                    <circle cx="38" cy="215" r="1.8" fill="#bae6fd" opacity="0.7" />
                    <circle cx="44" cy="208" r="2.2" fill="#bae6fd" opacity="0.85" />
                    {/* CO2 gas molecules in headspace */}
                    <circle cx="20" cy="165" r="3" fill="#cbd5e1" opacity="0.6" />
                    <circle cx="48" cy="145" r="3" fill="#cbd5e1" opacity="0.6" />
                    <circle cx="32" cy="120" r="3" fill="#cbd5e1" opacity="0.6" />
                  </g>
                )}

                {/* Metal Thermometer Probe (Suspended 2 inches above water level in AIR) */}
                <g id="thermometer-probe">
                  {/* Wire entering from top */}
                  <path d="M 35 30 L 35 155" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Metal Probe Tip in Air Space */}
                  <rect x="33.5" y="150" width="3" height="30" rx="1.5" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.5" />
                  <circle cx="35" cy="180" r="2.5" fill="#ef4444" />
                  {/* Air probe indicator note */}
                  <line x1="38" y1="165" x2="85" y2="165" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="90" y="168" fill="#cbd5e1" fontSize="9" fontWeight="bold">Probe in Air Headspace</text>
                  <text x="90" y="179" fill="#94a3b8" fontSize="8">(Not touching water)</text>
                </g>

                {/* Station Label under bottle */}
                <text x="35" y="260" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
                  {activeStation === 'station1' ? 'Station 1 (0 Tabs)' : activeStation === 'station2' ? 'Station 2 (2 Tabs)' : activeStation === 'station3' ? 'Station 3 (4 Tabs)' : 'Bottle 1 (0 Tabs)'}
                </text>
              </g>

              {/* Parallel Bottles View if 'parallel' mode */}
              {activeStation === 'parallel' && (
                <>
                  {/* Bottle 2: 2 Tablets */}
                  <g id="bottle-apparatus-2" transform="translate(450, 100)">
                    <rect x="25" y="55" width="20" height="25" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                    <ellipse cx="35" cy="55" rx="16" ry="8" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
                    <path d="M 18 55 Q 35 50 52 55" stroke="#e0f2fe" strokeWidth="3" fill="none" />
                    <path
                      d="M 25 75 C 25 90, 8 105, 8 130 L 8 230 C 8 238, 15 240, 20 240 L 50 240 C 55 240, 62 238, 62 230 L 62 130 C 62 105, 45 90, 45 75 Z"
                      fill="url(#bottleGlass)"
                      stroke="#f59e0b"
                      strokeWidth="2"
                    />
                    <path d="M 9 205 Q 35 203 61 205 L 61 230 C 61 238, 55 240, 50 240 L 20 240 C 15 240, 9 238, 9 230 Z" fill="#0284c7" opacity="0.5" />
                    <circle cx="28" cy="214" r="2" fill="#bae6fd" />
                    <circle cx="42" cy="211" r="2.2" fill="#bae6fd" />
                    <path d="M 35 30 L 35 155" stroke="#94a3b8" strokeWidth="2.5" />
                    <rect x="33.5" y="150" width="3" height="30" rx="1.5" fill="#e2e8f0" stroke="#64748b" />
                    <circle cx="35" cy="180" r="2.5" fill="#ef4444" />
                    <text x="35" y="260" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle">
                      Bottle 2 (2 Tabs)
                    </text>
                  </g>

                  {/* Bottle 3: 4 Tablets */}
                  <g id="bottle-apparatus-3" transform="translate(560, 100)">
                    <rect x="25" y="55" width="20" height="25" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                    <ellipse cx="35" cy="55" rx="16" ry="8" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
                    <path d="M 18 55 Q 35 50 52 55" stroke="#e0f2fe" strokeWidth="3" fill="none" />
                    <path
                      d="M 25 75 C 25 90, 8 105, 8 130 L 8 230 C 8 238, 15 240, 20 240 L 50 240 C 55 240, 62 238, 62 230 L 62 130 C 62 105, 45 90, 45 75 Z"
                      fill="url(#bottleGlass)"
                      stroke="#f43f5e"
                      strokeWidth="2"
                    />
                    <path d="M 9 205 Q 35 203 61 205 L 61 230 C 61 238, 55 240, 50 240 L 20 240 C 15 240, 9 238, 9 230 Z" fill="#0284c7" opacity="0.5" />
                    <circle cx="26" cy="214" r="2.5" fill="#bae6fd" />
                    <circle cx="34" cy="210" r="2.2" fill="#bae6fd" />
                    <circle cx="44" cy="216" r="2" fill="#bae6fd" />
                    <path d="M 35 30 L 35 155" stroke="#94a3b8" strokeWidth="2.5" />
                    <rect x="33.5" y="150" width="3" height="30" rx="1.5" fill="#e2e8f0" stroke="#64748b" />
                    <circle cx="35" cy="180" r="2.5" fill="#ef4444" />
                    <text x="35" y="260" fill="#f43f5e" fontSize="11" fontWeight="bold" textAnchor="middle">
                      Bottle 3 (4 Tabs)
                    </text>
                  </g>
                </>
              )}
            </svg>
          </div>

          {/* Interactive Lab Controls Bar */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {/* Lamp Toggle & Timer Buttons */}
            <div className="flex items-center gap-2">
              <button
                id="toggle-lamp-btn"
                onClick={handleToggleLamp}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition ${
                  lampOn
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>{lampOn ? 'Turn Off Heat Lamp' : 'Energize Heat Lamp'}</span>
              </button>

              <button
                id="timer-play-btn"
                onClick={() => setIsRunning(!isRunning)}
                disabled={!lampOn}
                className={`p-2 rounded-xl border text-xs font-medium transition ${
                  isRunning
                    ? 'bg-slate-800 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={isRunning ? 'Pause Lab Timer' : 'Start Lab Timer'}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                id="timer-reset-btn"
                onClick={handleReset}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Reset Apparatus & Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Distance Slider (6 inch rule) */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <label htmlFor="distance-range" className="text-xs text-slate-300 flex items-center gap-1">
                Distance: <strong className="text-amber-300">{lampDistanceInches}"</strong>
              </label>
              <input
                id="distance-range"
                type="range"
                min="5"
                max="12"
                step="0.5"
                value={lampDistanceInches}
                onChange={e => setLampDistanceInches(parseFloat(e.target.value))}
                className="w-24 accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Speed Multiplier */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-[11px]">
              <span className="text-slate-400 px-1">Speed:</span>
              {[1, 5, 15].map(spd => (
                <button
                  key={spd}
                  onClick={() => setSimSpeed(spd)}
                  className={`px-2 py-0.5 rounded font-mono font-medium transition ${
                    simSpeed === spd ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Digital Sensor Displays & Live Metrics (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Digital Thermometer Instrument Readout */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-5 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Digital Thermometer LCD Readout
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                PROBE ACTIVE
              </span>
            </div>

            {/* Large LED/LCD Display Readouts */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {/* Station 1 Readout */}
              <div className="bg-slate-950 p-3 rounded-xl border border-sky-900/60 text-center relative overflow-hidden">
                <div className="text-[10px] font-bold text-sky-400 uppercase">Station 1</div>
                <div className="text-[10px] text-slate-400">0 Tabs (Control)</div>
                <div className="text-2xl font-mono font-bold text-sky-300 mt-2">
                  {toDisplayTemp(liveTemp0)}°{tempUnit}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  ΔT: +{(liveTemp0 - initial0).toFixed(1)}°
                </div>
              </div>

              {/* Station 2 Readout */}
              <div className="bg-slate-950 p-3 rounded-xl border border-amber-900/60 text-center relative overflow-hidden">
                <div className="text-[10px] font-bold text-amber-400 uppercase">Station 2</div>
                <div className="text-[10px] text-slate-400">2 Tabs (Med CO₂)</div>
                <div className="text-2xl font-mono font-bold text-amber-300 mt-2">
                  {toDisplayTemp(liveTemp2)}°{tempUnit}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  ΔT: +{(liveTemp2 - initial2).toFixed(1)}°
                </div>
              </div>

              {/* Station 3 Readout */}
              <div className="bg-slate-950 p-3 rounded-xl border border-rose-900/60 text-center relative overflow-hidden">
                <div className="text-[10px] font-bold text-rose-400 uppercase">Station 3</div>
                <div className="text-[10px] text-slate-400">4 Tabs (High CO₂)</div>
                <div className="text-2xl font-mono font-bold text-rose-300 mt-2">
                  {toDisplayTemp(liveTemp4)}°{tempUnit}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  ΔT: +{(liveTemp4 - initial4).toFixed(1)}°
                </div>
              </div>
            </div>

            {/* Timer Display */}
            <div className="mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300 text-xs">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>Elapsed Investigation Time:</span>
              </div>
              <div className="font-mono text-lg font-bold text-amber-400">
                {String(Math.floor(simTimeSeconds / 60)).padStart(2, '0')}:
                {String(simTimeSeconds % 60).padStart(2, '0')}{' '}
                <span className="text-xs text-slate-400 font-sans">/ 15:00 min</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Summary Box */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-md">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Thermal Absorption Comparison Metrics
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                <span className="text-slate-300">Station 1 Total Warming (0 tabs):</span>
                <span className="font-bold text-sky-400">+{delta0} °C ({rate0} °C/min)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                <span className="text-slate-300">Station 2 Total Warming (2 tabs):</span>
                <span className="font-bold text-amber-400">+{delta2} °C ({rate2} °C/min)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                <span className="text-slate-300">Station 3 Total Warming (4 tabs):</span>
                <span className="font-bold text-rose-400">+{delta4} °C ({rate4} °C/min)</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-200">Key Observation:</strong> High CO₂ (4 tablets) absorbs and holds infrared energy, producing approximately <strong className="text-rose-300">{((delta4 / Math.max(delta0, 0.1))).toFixed(1)}x greater total temperature rise</strong> than the ambient air bottle under identical radiant lamp conditions.
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Condition Real-Time SVG Graph */}
      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Temperature vs. Time Comparison Graph
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Real-time plot showing heating trajectories for all 3 classroom conditions over 15 minutes.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-sky-400">
              <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
              <span>Station 1 (0 Tabs Control)</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span>Station 2 (2 Tabs)</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span>Station 3 (4 Tabs)</span>
            </div>
          </div>
        </div>

        {/* SVG Graph Canvas */}
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-64 bg-slate-950 rounded-xl border border-slate-800/80">
            {/* Grid lines */}
            {[20, 22, 24, 26, 28, 30].map(temp => (
              <g key={temp}>
                <line
                  x1={padL}
                  y1={getY(temp)}
                  x2={chartW - padR}
                  y2={getY(temp)}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text x={padL - 8} y={getY(temp) + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                  {temp}°C
                </text>
              </g>
            ))}

            {/* Time Grid X-axis */}
            {[0, 3, 6, 9, 12, 15].map(time => (
              <g key={time}>
                <line
                  x1={getX(time)}
                  y1={padT}
                  x2={getX(time)}
                  y2={chartH - padB}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text x={getX(time)} y={chartH - padB + 16} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                  {time}m
                </text>
              </g>
            ))}

            {/* Axis Titles */}
            <text x={chartW / 2} y={chartH - 6} fill="#94a3b8" fontSize="11" textAnchor="middle">
              Elapsed Time (Minutes)
            </text>

            {/* Station 1 Line */}
            <polyline
              points={makePolyline('temp0Tabs')}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Station 2 Line */}
            <polyline
              points={makePolyline('temp2Tabs')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Station 3 Line */}
            <polyline
              points={makePolyline('temp4Tabs')}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Data Points on Line */}
            {labData.map(d => (
              <g key={d.timeMinute}>
                <circle cx={getX(d.timeMinute)} cy={getY(d.temp0Tabs)} r="3" fill="#38bdf8" />
                <circle cx={getX(d.timeMinute)} cy={getY(d.temp2Tabs)} r="3" fill="#f59e0b" />
                <circle cx={getX(d.timeMinute)} cy={getY(d.temp4Tabs)} r="3.5" fill="#f43f5e" />
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Classroom Data Collection Table (Editable by students) */}
      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Classroom Investigation Data Table
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              You can manually enter your station's real physical lab probe readings below or use the simulation outputs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onGoToAnalysis}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition"
            >
              <span>Analyze in CER Report</span>
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-200 uppercase font-mono text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Time (min)</th>
                <th className="py-2.5 px-3 text-sky-400">Station 1 (0 Tabs) [°C]</th>
                <th className="py-2.5 px-3 text-amber-400">Station 2 (2 Tabs) [°C]</th>
                <th className="py-2.5 px-3 text-rose-400">Station 3 (4 Tabs) [°C]</th>
                <th className="py-2.5 px-3 text-slate-400">CO₂ Difference vs Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {labData.map((row, idx) => {
                const diff = (row.temp4Tabs - row.temp0Tabs).toFixed(1);
                return (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-2 px-3 font-bold text-slate-200">
                      {row.timeMinute} min
                    </td>
                    <td className="py-1 px-3">
                      <input
                        type="number"
                        step="0.1"
                        value={row.temp0Tabs}
                        onChange={e => handleCellEdit(idx, 'temp0Tabs', e.target.value)}
                        className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sky-300 focus:border-sky-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-1 px-3">
                      <input
                        type="number"
                        step="0.1"
                        value={row.temp2Tabs}
                        onChange={e => handleCellEdit(idx, 'temp2Tabs', e.target.value)}
                        className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-300 focus:border-amber-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-1 px-3">
                      <input
                        type="number"
                        step="0.1"
                        value={row.temp4Tabs}
                        onChange={e => handleCellEdit(idx, 'temp4Tabs', e.target.value)}
                        className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-rose-300 focus:border-rose-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 text-emerald-400 font-semibold">
                      +{diff} °C
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
