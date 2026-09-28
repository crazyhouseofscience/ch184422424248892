import React, { useState } from 'react';
import { 
  Sun, 
  Thermometer, 
  Layers, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw, 
  Table, 
  Cloud, 
  LineChart, 
  Globe2,
  Sliders,
  Flame,
  Droplets
} from 'lucide-react';
import { StationEquipmentSetup, StationProgress } from '../types';
import { playLampClickSound } from '../utils/audio';

interface ThreeStationSummarySlideProps {
  progressRecord: Record<1 | 2 | 3, StationProgress>;
  setupsRecord: Record<1 | 2 | 3, StationEquipmentSetup>;
  onGoToAtmosphericExplorer: () => void;
  onGoToVisualization: () => void;
  onGoToAtmosphereSim: () => void;
  onRevisitStation: (st: 1 | 2 | 3) => void;
}

export const ThreeStationSummarySlide: React.FC<ThreeStationSummarySlideProps> = ({
  progressRecord,
  setupsRecord,
  onGoToAtmosphericExplorer,
  onGoToVisualization,
  onGoToAtmosphereSim,
  onRevisitStation,
}) => {
  const [allLampsOn, setAllLampsOn] = useState<boolean>(true);
  const [coolingElapsedMinutes, setCoolingElapsedMinutes] = useState<number>(0);
  const [selectedHighlight, setSelectedHighlight] = useState<1 | 2 | 3 | 'all'>('all');

  // Real-time cooling simulation when lamps are turned OFF
  React.useEffect(() => {
    let coolTimer: any = null;
    if (!allLampsOn) {
      coolTimer = setInterval(() => {
        setCoolingElapsedMinutes(prev => prev + 0.2);
      }, 500);
    } else {
      setCoolingElapsedMinutes(0);
    }
    return () => clearInterval(coolTimer);
  }, [allLampsOn]);

  const handleToggleAllLamps = () => {
    const next = !allLampsOn;
    setAllLampsOn(next);
    playLampClickSound(next);
  };

  // Temperature calculations at minute 15 (with cooling when lamps off)
  const getFinalTemp = (station: 1 | 2 | 3) => {
    const data = progressRecord[station]?.recordedData;
    let base = data && data[15] !== undefined ? data[15] : (station === 1 ? 23.5 : station === 2 ? 25.9 : 28.4);
    if (!allLampsOn && coolingElapsedMinutes > 0) {
      const ambient = 21.0;
      const tauCool = station === 1 ? 5.0 : station === 2 ? 8.0 : 11.5;
      base = ambient + (base - ambient) * Math.exp(-coolingElapsedMinutes / tauCool);
    }
    return Number(base.toFixed(1));
  };

  const t1 = getFinalTemp(1);
  const t2 = getFinalTemp(2);
  const t3 = getFinalTemp(3);

  const delta1 = Number((t1 - 21.0).toFixed(1));
  const delta2 = Number((t2 - 21.0).toFixed(1));
  const delta3 = Number((t3 - 21.0).toFixed(1));
  const maxDiff = Number((t3 - t1).toFixed(1));

  // Time series points for the graph
  const timePoints = [0, 3, 6, 9, 12, 15];
  const getCurveAtMin = (station: 1 | 2 | 3, m: number) => {
    const data = progressRecord[station]?.recordedData;
    if (data && data[m] !== undefined) return data[m];
    const ambient = 21.0;
    const maxDelta = station === 1 ? 2.5 : station === 2 ? 4.9 : 7.4;
    const tau = station === 1 ? 6.5 : station === 2 ? 7.2 : 8.0;
    return Number((ambient + maxDelta * (1 - Math.exp(-m / tau))).toFixed(1));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-7 border border-indigo-900/60 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Module 4: 3-Station Comparative Investigation Completed!
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            All 3 Station Setups Running & Comparison Summary
          </h2>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            You have successfully assembled each apparatus, measured and added water, introduced varying carbon dioxide quantities (<span className="text-sky-300 font-semibold">0</span>, <span className="text-amber-300 font-semibold">2</span>, and <span className="text-rose-300 font-semibold">4</span> fizzing tablets), and recorded data over time. Now observe all 3 stations running in parallel to synthesize how elevated greenhouse gas concentration traps radiant thermal energy.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-200">
              Station 1 (Control): <strong className="text-sky-300">+{delta1}°C</strong>
            </div>
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-200">
              Station 2 (Medium CO₂): <strong className="text-amber-300">+{delta2}°C</strong>
            </div>
            <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-200">
              Station 3 (High CO₂): <strong className="text-rose-300">+{delta3}°C</strong>
            </div>
            <div className="bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-800 text-xs text-emerald-300 font-bold">
              Greenhouse Trapping Delta: +{maxDiff}°C Extra Heat
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: ALL 3 STATIONS RUNNING (Visual Apparatus Slide) */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Live Comparative Slide: All 3 Stations Running Side-by-Side
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Each setup is clamped at its calibrated distance with heat lamp energized, plastic wrap, and modeling clay seal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAllLamps}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow ${
                allLampsOn
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <Sun className={`w-3.5 h-3.5 ${allLampsOn ? 'animate-spin text-slate-950' : 'text-slate-500'}`} />
              <span>{allLampsOn ? 'All 3 Lamps: ON' : 'All 3 Lamps: OFF (Cooling)'}</span>
            </button>
          </div>
        </div>

        {/* 3 Stations Visual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Station 1 Card */}
          <div className="bg-slate-950 rounded-xl p-4 border border-sky-900/60 shadow-lg flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                Station 1 • Control
              </span>
              <span className="text-xs font-mono font-bold text-sky-300">{t1.toFixed(1)}°C</span>
            </div>

            {/* SVG Mini Station 1 */}
            <div className="relative w-full aspect-[16/9] bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 200 120" className="w-full h-full select-none">
                <line x1="10" y1="105" x2="190" y2="105" stroke="#334155" strokeWidth="2" />
                {/* Stand & Clamp */}
                <rect x="25" y="20" width="4" height="85" fill="#64748b" />
                <rect x="22" y="45" width="10" height="8" fill="#475569" />
                {/* Lamp */}
                <path d="M 32 49 L 55 35 L 55 63 Z" fill="#64748b" stroke="#cbd5e1" strokeWidth="0.8" />
                {allLampsOn && <circle cx="45" cy="49" r="6" fill="#f59e0b" opacity="0.8" />}
                {allLampsOn && (
                  <line x1="56" y1="49" x2="110" y2="49" stroke="#fde047" strokeWidth="1" strokeDasharray="3 2" />
                )}
                {/* Bottle */}
                <g transform="translate(125, 45)">
                  <rect x="-8" y="0" width="16" height="58" rx="2" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
                  <rect x="-7" y="40" width="14" height="17" fill="#0284c7" opacity="0.8" />
                  <ellipse cx="0" cy="0" rx="6" ry="2" fill="#b45309" />
                  <line x1="0" y1="-5" x2="0" y2="25" stroke="#cbd5e1" strokeWidth="1.5" />
                </g>
                {/* Temp Display */}
                <rect x="155" y="85" width="35" height="16" rx="2" fill="#1e293b" />
                <text x="172" y="96" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {t1.toFixed(1)}°
                </text>
              </svg>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Tablets: <strong>0 (Ambient Air)</strong></span>
                <span className="text-sky-400 font-bold">ΔT: +{delta1}°C</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Standard air (~420 ppm CO₂). Minimal thermal radiation is absorbed by the transparent air column.
              </p>
            </div>

            <button
              onClick={() => onRevisitStation(1)}
              className="w-full py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition"
            >
              Revisit Station 1 Setup
            </button>
          </div>

          {/* Station 2 Card */}
          <div className="bg-slate-950 rounded-xl p-4 border border-amber-900/60 shadow-lg flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                Station 2 • Medium CO₂
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">{t2.toFixed(1)}°C</span>
            </div>

            {/* SVG Mini Station 2 */}
            <div className="relative w-full aspect-[16/9] bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 200 120" className="w-full h-full select-none">
                <line x1="10" y1="105" x2="190" y2="105" stroke="#334155" strokeWidth="2" />
                <rect x="25" y="20" width="4" height="85" fill="#64748b" />
                <rect x="22" y="45" width="10" height="8" fill="#475569" />
                <path d="M 32 49 L 55 35 L 55 63 Z" fill="#64748b" stroke="#cbd5e1" strokeWidth="0.8" />
                {allLampsOn && <circle cx="45" cy="49" r="6" fill="#f59e0b" opacity="0.8" />}
                {allLampsOn && (
                  <line x1="56" y1="49" x2="110" y2="49" stroke="#fde047" strokeWidth="1" strokeDasharray="3 2" />
                )}
                {/* Bottle with effervescence */}
                <g transform="translate(125, 45)">
                  <rect x="-8" y="0" width="16" height="58" rx="2" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
                  <rect x="-7" y="40" width="14" height="17" fill="#0284c7" opacity="0.8" />
                  <ellipse cx="0" cy="0" rx="6" ry="2" fill="#b45309" />
                  <line x1="0" y1="-5" x2="0" y2="25" stroke="#cbd5e1" strokeWidth="1.5" />
                  {/* Bubbles */}
                  <circle cx="-3" cy="48" r="1.2" fill="#fff" />
                  <circle cx="2" cy="45" r="1.5" fill="#fff" />
                  <circle cx="0" cy="25" r="1.2" fill="#fef08a" opacity="0.7" />
                </g>
                <rect x="155" y="85" width="35" height="16" rx="2" fill="#1e293b" />
                <text x="172" y="96" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {t2.toFixed(1)}°
                </text>
              </svg>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Tablets: <strong>2 Tablets</strong></span>
                <span className="text-amber-400 font-bold">ΔT: +{delta2}°C</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Moderate CO₂ effervescence increased molecular infrared absorption, trapping significantly more heat.
              </p>
            </div>

            <button
              onClick={() => onRevisitStation(2)}
              className="w-full py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition"
            >
              Revisit Station 2 Setup
            </button>
          </div>

          {/* Station 3 Card */}
          <div className="bg-slate-950 rounded-xl p-4 border border-rose-900/60 shadow-lg flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                Station 3 • High CO₂
              </span>
              <span className="text-xs font-mono font-bold text-rose-300">{t3.toFixed(1)}°C</span>
            </div>

            {/* SVG Mini Station 3 */}
            <div className="relative w-full aspect-[16/9] bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 200 120" className="w-full h-full select-none">
                <line x1="10" y1="105" x2="190" y2="105" stroke="#334155" strokeWidth="2" />
                <rect x="25" y="20" width="4" height="85" fill="#64748b" />
                <rect x="22" y="45" width="10" height="8" fill="#475569" />
                <path d="M 32 49 L 55 35 L 55 63 Z" fill="#64748b" stroke="#cbd5e1" strokeWidth="0.8" />
                {allLampsOn && <circle cx="45" cy="49" r="6" fill="#f59e0b" opacity="0.8" />}
                {allLampsOn && (
                  <line x1="56" y1="49" x2="110" y2="49" stroke="#fde047" strokeWidth="1" strokeDasharray="3 2" />
                )}
                {/* Bottle with dense bubbles */}
                <g transform="translate(125, 45)">
                  <rect x="-8" y="0" width="16" height="58" rx="2" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
                  <rect x="-7" y="40" width="14" height="17" fill="#0284c7" opacity="0.8" />
                  <ellipse cx="0" cy="0" rx="6" ry="2" fill="#b45309" />
                  <line x1="0" y1="-5" x2="0" y2="25" stroke="#cbd5e1" strokeWidth="1.5" />
                  {/* Heavy Bubbles */}
                  <circle cx="-3" cy="50" r="1.5" fill="#fff" />
                  <circle cx="3" cy="46" r="1.5" fill="#fff" />
                  <circle cx="-2" cy="42" r="1.5" fill="#fff" />
                  <circle cx="-2" cy="20" r="2" fill="#fef08a" opacity="0.8" />
                  <circle cx="2" cy="12" r="2" fill="#fef08a" opacity="0.8" />
                </g>
                <rect x="155" y="85" width="35" height="16" rx="2" fill="#1e293b" />
                <text x="172" y="96" fill="#f43f5e" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {t3.toFixed(1)}°
                </text>
              </svg>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Tablets: <strong>4 Tablets</strong></span>
                <span className="text-rose-400 font-bold">ΔT: +{delta3}°C</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Dense CO₂ saturation creates maximum thermal opacity, trapping radiant energy and warming the headspace to {t3.toFixed(1)}°C.
              </p>
            </div>

            <button
              onClick={() => onRevisitStation(3)}
              className="w-full py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition"
            >
              Revisit Station 3 Setup
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: COMPARATIVE GRAPH & DATA TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Multi-Line Graph (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Multi-Station Divergence Curve Comparison
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Directly overlaying all three conditions over the 15-minute radiation cycle.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> St 1 (0 tabs)
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> St 2 (2 tabs)
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> St 3 (4 tabs)
              </span>
            </div>
          </div>

          {/* SVG Multi Curve Chart */}
          <div className="relative w-full aspect-[16/10] bg-slate-950 rounded-xl p-3 border border-slate-800">
            <svg viewBox="0 0 360 220" className="w-full h-full select-none">
              {/* Y Grid */}
              {[20, 22, 24, 26, 28, 30].map((t, idx) => {
                const y = 180 - ((t - 20) / 10) * 150;
                return (
                  <g key={t}>
                    <line x1="38" y1={y} x2="345" y2={y} stroke="#1e293b" strokeWidth="1" />
                    <text x="32" y={y + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
                      {t}°C
                    </text>
                  </g>
                );
              })}

              {/* X Grid */}
              {[0, 3, 6, 9, 12, 15].map(m => {
                const x = 45 + (m / 15) * 295;
                return (
                  <g key={m}>
                    <line x1={x} y1="30" x2={x} y2="180" stroke="#1e293b" strokeWidth="1" />
                    <text x={x} y="195" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
                      {m} min
                    </text>
                  </g>
                );
              })}

              {/* Curve Station 1 (Sky Blue) */}
              {(() => {
                const points = timePoints.map(m => {
                  const x = 45 + (m / 15) * 295;
                  const temp = getCurveAtMin(1, m);
                  const y = 180 - ((temp - 20) / 10) * 150;
                  return `${m === 0 ? 'M' : 'L'} ${x} ${y}`;
                });
                return <path d={points.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="2.5" />;
              })()}

              {/* Curve Station 2 (Amber) */}
              {(() => {
                const points = timePoints.map(m => {
                  const x = 45 + (m / 15) * 295;
                  const temp = getCurveAtMin(2, m);
                  const y = 180 - ((temp - 20) / 10) * 150;
                  return `${m === 0 ? 'M' : 'L'} ${x} ${y}`;
                });
                return <path d={points.join(' ')} fill="none" stroke="#f59e0b" strokeWidth="2.5" />;
              })()}

              {/* Curve Station 3 (Rose) */}
              {(() => {
                const points = timePoints.map(m => {
                  const x = 45 + (m / 15) * 295;
                  const temp = getCurveAtMin(3, m);
                  const y = 180 - ((temp - 20) / 10) * 150;
                  return `${m === 0 ? 'M' : 'L'} ${x} ${y}`;
                });
                return <path d={points.join(' ')} fill="none" stroke="#f43f5e" strokeWidth="3" />;
              })()}

              {/* Plotted Data Dots */}
              {timePoints.map(m => {
                const x = 45 + (m / 15) * 295;
                const temp1 = getCurveAtMin(1, m);
                const temp2 = getCurveAtMin(2, m);
                const temp3 = getCurveAtMin(3, m);

                const y1 = 180 - ((temp1 - 20) / 10) * 150;
                const y2 = 180 - ((temp2 - 20) / 10) * 150;
                const y3 = 180 - ((temp3 - 20) / 10) * 150;

                return (
                  <g key={m}>
                    <circle cx={x} cy={y1} r="3" fill="#38bdf8" stroke="#0f172a" strokeWidth="1" />
                    <circle cx={x} cy={y2} r="3" fill="#f59e0b" stroke="#0f172a" strokeWidth="1" />
                    <circle cx={x} cy={y3} r="3.5" fill="#f43f5e" stroke="#0f172a" strokeWidth="1" />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Comparative Data Table (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Table className="w-4 h-4 text-sky-400" />
                Synchronized Data Points Table
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparing temperatures across all 3 stations side-by-side.
              </p>
            </div>

            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-slate-800/90 text-slate-300 font-bold border-b border-slate-700">
                  <tr>
                    <th className="py-2 px-2.5">Time</th>
                    <th className="py-2 px-2.5 text-sky-300">St 1 (0t)</th>
                    <th className="py-2 px-2.5 text-amber-300">St 2 (2t)</th>
                    <th className="py-2 px-2.5 text-rose-300">St 3 (4t)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {timePoints.map(m => {
                    const temp1 = getCurveAtMin(1, m);
                    const temp2 = getCurveAtMin(2, m);
                    const temp3 = getCurveAtMin(3, m);
                    return (
                      <tr key={m} className="hover:bg-slate-800/40">
                        <td className="py-2 px-2.5 font-bold text-white">{m}m</td>
                        <td className="py-2 px-2.5 text-sky-400">{temp1.toFixed(1)}°</td>
                        <td className="py-2 px-2.5 text-amber-400">{temp2.toFixed(1)}°</td>
                        <td className="py-2 px-2.5 text-rose-400 font-bold">{temp3.toFixed(1)}°</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Conclusion Callout */}
          <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-indigo-200 block">Scientific Mechanism:</span>
            <p>
              Carbon dioxide molecules absorb infrared photon wavelengths emitted by the warmed bottle surfaces. This vibrational absorption slows radiative heat escape, causing Station 3 (4 tablets) to maintain a higher equilibrium temperature (+{maxDiff}°C greater than ambient air).
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: EXTENSION MODULES NAVIGATION */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Core Investigation Complete: Explore Advanced Modules
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Now that you have completed all three bottle stations and analyzed the baseline carbon dioxide greenhouse curves, proceed to test other atmospheric variables or customize your data.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={onGoToAtmosphericExplorer}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/60 transition text-left space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-800 flex items-center justify-center text-sky-400 group-hover:scale-105 transition">
              <Cloud className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition">
              Module 5: Clouds & Other Gases
            </h4>
            <p className="text-xs text-slate-400">
              Simulate cloud cover (cirrus, stratus diffusers), solar incidence angles, and alternative gases like Methane (CH₄) and Water Vapor (H₂O).
            </p>
          </button>

          <button
            onClick={onGoToVisualization}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/60 transition text-left space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
              <LineChart className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
              Module 6: Data & Graphing Studio
            </h4>
            <p className="text-xs text-slate-400">
              Plot custom series, edit recorded measurements, compute heating slopes, and export lab graphs for science reporting.
            </p>
          </button>

          <button
            onClick={onGoToAtmosphereSim}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/60 transition text-left space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition">
              <Globe2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
              Module 7: Planetary Simulator
            </h4>
            <p className="text-xs text-slate-400">
              Compare Earth's greenhouse balance against the runaway greenhouse effect of Venus and the thin atmosphere of Mars.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
