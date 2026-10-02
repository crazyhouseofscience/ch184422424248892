import React, { useState } from 'react';
import { 
  BarChart3, 
  LineChart, 
  Table, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  RotateCcw, 
  TrendingUp, 
  Sparkles, 
  Printer, 
  CheckCircle2, 
  Info,
  Maximize2
} from 'lucide-react';
import { StationDataPoint, StationProgress } from '../types';
import { BENCHMARK_LAB_DATA } from '../data/labData';
import { GraphIncrement, getIntervalMilestones, getSessionVariances } from '../utils/sessionDataEngine';
import { Clock } from 'lucide-react';

interface DataVisualizationStudioProps {
  labData: StationDataPoint[];
  setLabData: React.Dispatch<React.SetStateAction<StationDataPoint[]>>;
  progressRecord?: Record<1 | 2 | 3, StationProgress>;
  graphIncrement?: GraphIncrement;
  onToggleGraphIncrement?: () => void;
}

export const DataVisualizationStudio: React.FC<DataVisualizationStudioProps> = ({
  labData,
  setLabData,
  progressRecord,
  graphIncrement = 3,
  onToggleGraphIncrement,
}) => {
  const [activeChartType, setActiveChartType] = useState<'line' | 'bar' | 'scatter'>('line');
  const [showBestFit, setShowBestFit] = useState<boolean>(true);
  const [hoveredMinute, setHoveredMinute] = useState<number | null>(null);

  // Student conclusion notes
  const [conclusionNotes, setConclusionNotes] = useState<string>(
    'The graph clearly demonstrates that higher CO₂ concentrations (4 tablets) result in both a steeper rate of temperature rise and a significantly higher final plateau temperature compared to the ambient air control (0 tablets).'
  );

  // Check if student has recorded data across stations
  const hasRecordedStationData = Boolean(
    progressRecord && (
      Object.keys(progressRecord[1]?.recordedData || {}).length > 1 ||
      Object.keys(progressRecord[2]?.recordedData || {}).length > 1 ||
      Object.keys(progressRecord[3]?.recordedData || {}).length > 1
    )
  );

  // Import student recorded station data from the live experiment trials
  const handleImportMyRecordedData = () => {
    if (!progressRecord) return;
    const intervals = getIntervalMilestones(graphIncrement);
    const variances = getSessionVariances();
    const importedRows: StationDataPoint[] = intervals.map(m => {
      // Calculate realistic curve fallback if station wasn't manually logged
      const amb0 = variances.station1.ambient;
      const calcT0 = Number((amb0 + (2.5 + variances.station1.deltaNoise) * (1 - Math.exp(-m / (6.5 + variances.station1.tauOffset)))).toFixed(1));
      const calcT2 = Number((variances.station2.ambient + (4.9 + variances.station2.deltaNoise) * (1 - Math.exp(-m / (7.2 + variances.station2.tauOffset)))).toFixed(1));
      const calcT4 = Number((variances.station3.ambient + (7.4 + variances.station3.deltaNoise) * (1 - Math.exp(-m / (8.0 + variances.station3.tauOffset)))).toFixed(1));

      const t0 = progressRecord[1]?.recordedData?.[m] ?? calcT0;
      const t2 = progressRecord[2]?.recordedData?.[m] ?? calcT2;
      const t4 = progressRecord[3]?.recordedData?.[m] ?? calcT4;
      return {
        timeMinute: m,
        temp0Tabs: t0,
        temp2Tabs: t2,
        temp4Tabs: t4,
      };
    });
    setLabData(importedRows);
  };

  // Add a new row to the data table
  const handleAddRow = () => {
    const nextMinute = labData.length > 0 ? labData[labData.length - 1].timeMinute + 1 : 0;
    const lastRow = labData[labData.length - 1] || { temp0Tabs: 21, temp2Tabs: 21, temp4Tabs: 21 };
    setLabData([
      ...labData,
      {
        timeMinute: nextMinute,
        temp0Tabs: lastRow.temp0Tabs,
        temp2Tabs: lastRow.temp2Tabs,
        temp4Tabs: lastRow.temp4Tabs,
      },
    ]);
  };

  // Delete a specific row
  const handleDeleteRow = (index: number) => {
    if (labData.length <= 2) {
      alert('You need at least 2 time points to generate a valid graph.');
      return;
    }
    const updated = labData.filter((_, i) => i !== index);
    setLabData(updated);
  };

  // Update a single cell
  const handleCellChange = (index: number, field: keyof StationDataPoint, val: string) => {
    const num = parseFloat(val);
    const updated = [...labData];
    updated[index] = {
      ...updated[index],
      [field]: isNaN(num) ? 0 : num,
    };
    setLabData(updated);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'Time (min),0 Tablets (Control °C),2 Tablets (Elevated CO2 °C),4 Tablets (High CO2 °C)\n';
    const rows = labData
      .map(r => `${r.timeMinute},${r.temp0Tabs},${r.temp2Tabs},${r.temp4Tabs}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greenhouse_lab_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load benchmark default data
  const handleResetToBenchmark = () => {
    if (window.confirm('Reset data table to sample benchmark dataset?')) {
      setLabData(BENCHMARK_LAB_DATA);
    }
  };

  // Statistics
  const t0_init = labData[0]?.temp0Tabs ?? 21;
  const t2_init = labData[0]?.temp2Tabs ?? 21;
  const t4_init = labData[0]?.temp4Tabs ?? 21;

  const lastIdx = labData.length - 1;
  const t0_final = labData[lastIdx]?.temp0Tabs ?? t0_init;
  const t2_final = labData[lastIdx]?.temp2Tabs ?? t2_init;
  const t4_final = labData[lastIdx]?.temp4Tabs ?? t4_init;

  const d0 = Number((t0_final - t0_init).toFixed(1));
  const d2 = Number((t2_final - t2_init).toFixed(1));
  const d4 = Number((t4_final - t4_init).toFixed(1));

  const totalMin = Math.max(labData[lastIdx]?.timeMinute || 15, 1);
  const rate0 = (d0 / totalMin).toFixed(2);
  const rate2 = (d2 / totalMin).toFixed(2);
  const rate4 = (d4 / totalMin).toFixed(2);

  // SVG Chart Geometry
  const cW = 720;
  const cH = 320;
  const pL = 50;
  const pR = 30;
  const pT = 25;
  const pB = 45;

  const allTemps = labData.flatMap(d => [d.temp0Tabs, d.temp2Tabs, d.temp4Tabs]);
  const minTemp = Math.floor(Math.min(...allTemps, 20));
  const maxTemp = Math.ceil(Math.max(...allTemps, 30));
  const maxTime = Math.max(...labData.map(d => d.timeMinute), 15);

  const getX = (t: number) => pL + (t / maxTime) * (cW - pL - pR);
  const getY = (v: number) => pT + (1 - (v - minTemp) / Math.max(maxTemp - minTemp, 1)) * (cH - pT - pB);

  const poly0 = labData.map(d => `${getX(d.timeMinute)},${getY(d.temp0Tabs)}`).join(' ');
  const poly2 = labData.map(d => `${getX(d.timeMinute)},${getY(d.temp2Tabs)}`).join(' ');
  const poly4 = labData.map(d => `${getX(d.timeMinute)},${getY(d.temp4Tabs)}`).join(' ');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-2">
            <LineChart className="w-4 h-4" />
            Module 6: Student Data Visualization & Graphing Studio
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Lab Data Input, Multi-Curve Graphing & Conclusion Analysis
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Enter your group's recorded thermometer readings from the 0, 2, and 4 tablet trials. Generate interactive multi-line graphs, delta warming bars, and correlation scatter plots.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {onToggleGraphIncrement && (
            <button
              onClick={onToggleGraphIncrement}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-700/60 text-xs font-bold transition shadow-sm"
              title={`Switch graphing milestones between 2m and 3m intervals (Current: ${graphIncrement}m)`}
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interval: {graphIncrement}m (Switch to {graphIncrement === 3 ? '2m' : '3m'})</span>
            </button>
          )}
          {hasRecordedStationData && (
            <button
              onClick={handleImportMyRecordedData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md text-xs font-bold transition animate-pulse"
              title="Pull in recorded readings from Stations 1, 2, and 3"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Import My Station Data</span>
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleResetToBenchmark}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sample Data</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Data Table (5 cols) & Interactive Graphs (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Editable Student Data Input Table (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Table className="w-4 h-4 text-emerald-400" />
                Input Collected Lab Data (°C)
              </h3>
              <button
                onClick={handleAddRow}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Time Point</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Click any value to type your group's thermometer measurements:
            </p>

            {/* Scrollable Table */}
            <div className="mt-3 max-h-[360px] overflow-y-auto border border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10 text-[10px] uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-2 text-center w-14">Time (min)</th>
                    <th className="py-2 px-2 text-sky-400">0 Tabs (Ctrl)</th>
                    <th className="py-2 px-2 text-amber-400">2 Tabs</th>
                    <th className="py-2 px-2 text-rose-400">4 Tabs</th>
                    <th className="py-2 px-1 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {labData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-1.5 px-2 text-center text-slate-400">
                        <input
                          type="number"
                          value={row.timeMinute}
                          onChange={e => handleCellChange(idx, 'timeMinute', e.target.value)}
                          className="w-12 bg-slate-950/80 border border-slate-800 rounded px-1.5 py-0.5 text-center text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          step="0.1"
                          value={row.temp0Tabs}
                          onChange={e => handleCellChange(idx, 'temp0Tabs', e.target.value)}
                          className="w-16 bg-slate-950/80 border border-slate-800 text-sky-300 rounded px-1.5 py-0.5 text-xs focus:border-sky-500 focus:outline-none font-bold"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          step="0.1"
                          value={row.temp2Tabs}
                          onChange={e => handleCellChange(idx, 'temp2Tabs', e.target.value)}
                          className="w-16 bg-slate-950/80 border border-slate-800 text-amber-300 rounded px-1.5 py-0.5 text-xs focus:border-amber-500 focus:outline-none font-bold"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          step="0.1"
                          value={row.temp4Tabs}
                          onChange={e => handleCellChange(idx, 'temp4Tabs', e.target.value)}
                          className="w-16 bg-slate-950/80 border border-slate-800 text-rose-300 rounded px-1.5 py-0.5 text-xs focus:border-rose-500 focus:outline-none font-bold"
                        />
                      </td>
                      <td className="py-1.5 px-1 text-center">
                        <button
                          onClick={() => handleDeleteRow(idx)}
                          className="p-1 text-slate-600 hover:text-rose-400 rounded transition"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-slate-800">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-sky-900/50">
              <span className="text-[10px] text-sky-400 font-bold block">0 Tabs (Ctrl)</span>
              <div className="font-bold text-white mt-0.5 font-mono">+{d0}°C</div>
              <span className="text-[10px] text-slate-400 font-mono">{rate0} °C/m</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-amber-900/50">
              <span className="text-[10px] text-amber-400 font-bold block">2 Tabs</span>
              <div className="font-bold text-white mt-0.5 font-mono">+{d2}°C</div>
              <span className="text-[10px] text-slate-400 font-mono">{rate2} °C/m</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-rose-900/50">
              <span className="text-[10px] text-rose-400 font-bold block">4 Tabs</span>
              <div className="font-bold text-white mt-0.5 font-mono">+{d4}°C</div>
              <span className="text-[10px] text-slate-400 font-mono">{rate4} °C/m</span>
            </div>
          </div>
        </div>

        {/* Right: Interactive Graphing Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            {/* Chart Type Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveChartType('line')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    activeChartType === 'line'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <LineChart className="w-3.5 h-3.5" />
                  <span>Temperature vs. Time</span>
                </button>

                <button
                  onClick={() => setActiveChartType('bar')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    activeChartType === 'bar'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Total ΔT & Warming Rates</span>
                </button>

                <button
                  onClick={() => setActiveChartType('scatter')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    activeChartType === 'scatter'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>CO₂ vs. ΔT Correlation</span>
                </button>
              </div>

              {/* Best Fit Toggle */}
              {activeChartType === 'line' && (
                <label className="text-[11px] text-slate-400 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBestFit}
                    onChange={e => setShowBestFit(e.target.checked)}
                    className="accent-indigo-500 rounded"
                  />
                  <span>Show Data Points</span>
                </label>
              )}
            </div>

            {/* CHART 1: LINE GRAPH (Temperature vs. Time) */}
            {activeChartType === 'line' && (
              <div className="mt-4">
                {/* Legend */}
                <div className="flex items-center justify-between text-xs px-2 mb-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                      <span className="w-3 h-0.5 bg-sky-400 inline-block" /> 0 Tablets (Control)
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                      <span className="w-3 h-0.5 bg-amber-400 inline-block" /> 2 Tablets (Medium CO₂)
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                      <span className="w-3 h-0.5 bg-rose-400 inline-block" /> 4 Tablets (High CO₂)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">15-minute investigation</span>
                </div>

                {/* SVG Line Graph */}
                <div className="w-full overflow-x-auto">
                  <svg viewBox={`0 0 ${cW} ${cH}`} className="w-full h-64 bg-slate-950 rounded-xl border border-slate-800">
                    {/* Y-Axis Gridlines */}
                    {[minTemp, Math.round(minTemp + (maxTemp - minTemp) * 0.33), Math.round(minTemp + (maxTemp - minTemp) * 0.66), maxTemp].map(t => (
                      <g key={t}>
                        <line x1={pL} y1={getY(t)} x2={cW - pR} y2={getY(t)} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                        <text x={pL - 8} y={getY(t) + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">{t}°C</text>
                      </g>
                    ))}

                    {/* X-Axis Time Grid */}
                    {labData.map(d => (
                      <g key={d.timeMinute}>
                        <line x1={getX(d.timeMinute)} y1={pT} x2={getX(d.timeMinute)} y2={cH - pB} stroke="#1e293b" strokeWidth="1" />
                        <text x={getX(d.timeMinute)} y={cH - pB + 16} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                          {d.timeMinute}m
                        </text>
                      </g>
                    ))}

                    {/* Polylines */}
                    <polyline points={poly0} fill="none" stroke="#38bdf8" strokeWidth="3" />
                    <polyline points={poly2} fill="none" stroke="#f59e0b" strokeWidth="3" />
                    <polyline points={poly4} fill="none" stroke="#f43f5e" strokeWidth="3.5" />

                    {/* Data Points */}
                    {showBestFit && labData.map(d => (
                      <g key={d.timeMinute}>
                        <circle cx={getX(d.timeMinute)} cy={getY(d.temp0Tabs)} r="3.5" fill="#38bdf8" />
                        <circle cx={getX(d.timeMinute)} cy={getY(d.temp2Tabs)} r="3.5" fill="#f59e0b" />
                        <circle cx={getX(d.timeMinute)} cy={getY(d.temp4Tabs)} r="4" fill="#f43f5e" />
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            )}

            {/* CHART 2: BAR COMPARISON (Total Delta T and Rate) */}
            {activeChartType === 'bar' && (
              <div className="mt-4 space-y-4">
                <div className="text-xs text-slate-400">
                  Compare total temperature rise (&Delta;T = T_final - T_initial) and average heating rates across the three greenhouse configurations:
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  {[
                    { label: '0 Tablets (Control)', delta: d0, rate: rate0, color: 'bg-sky-500', text: 'text-sky-400', max: Math.max(d4, 8) },
                    { label: '2 Tablets (Medium CO₂)', delta: d2, rate: rate2, color: 'bg-amber-500', text: 'text-amber-400', max: Math.max(d4, 8) },
                    { label: '4 Tablets (High CO₂)', delta: d4, rate: rate4, color: 'bg-rose-500', text: 'text-rose-400', max: Math.max(d4, 8) },
                  ].map(b => (
                    <div key={b.label} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                      <span className={`text-xs font-bold ${b.text}`}>{b.label}</span>
                      <div className="h-32 flex items-end justify-center py-2">
                        <div
                          className={`w-12 rounded-t-lg ${b.color} transition-all duration-500 relative group`}
                          style={{ height: `${Math.max((b.delta / b.max) * 100, 10)}%` }}
                        >
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-xs font-bold text-white whitespace-nowrap">
                            +{b.delta}°C
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-1 border-t border-slate-800 pt-1">
                        Rate: <strong className="text-white">{b.rate}</strong> °C/min
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHART 3: SCATTER PLOT & CORRELATION */}
            {activeChartType === 'scatter' && (
              <div className="mt-4 space-y-4">
                <div className="text-xs text-slate-400">
                  Scatter plot correlating <strong>Fizzing Tablet Count (CO₂ Proxy)</strong> against <strong>Total Temperature Increase ($\Delta T$)</strong>:
                </div>

                <div className="w-full overflow-x-auto">
                  <svg viewBox="0 0 600 240" className="w-full h-56 bg-slate-950 rounded-xl border border-slate-800">
                    {/* Y Grid */}
                    {[0, 2, 4, 6, 8].map(v => (
                      <g key={v}>
                        <line x1="50" y1={200 - (v / 8) * 160} x2="560" y2={200 - (v / 8) * 160} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="42" y={204 - (v / 8) * 160} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">+{v}°C</text>
                      </g>
                    ))}

                    {/* X Grid (0, 2, 4 tablets) */}
                    {[0, 1, 2, 3, 4].map(tabs => {
                      const x = 70 + (tabs / 4) * 460;
                      return (
                        <g key={tabs}>
                          <line x1={x} y1="20" x2={x} y2="200" stroke="#1e293b" strokeWidth="1" />
                          <text x={x} y="220" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                            {tabs} Tablets
                          </text>
                        </g>
                      );
                    })}

                    {/* Regression Line */}
                    <line
                      x1={70}
                      y1={200 - (d0 / 8) * 160}
                      x2={70 + 460}
                      y2={200 - (d4 / 8) * 160}
                      stroke="#818cf8"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />

                    {/* Data Points */}
                    <circle cx={70} cy={200 - (d0 / 8) * 160} r="6" fill="#38bdf8" />
                    <circle cx={70 + (2 / 4) * 460} cy={200 - (d2 / 8) * 160} r="6" fill="#f59e0b" />
                    <circle cx={70 + 460} cy={200 - (d4 / 8) * 160} r="7" fill="#f43f5e" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Student Guided Conclusions Input */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Student Scientific Conclusions & Inferences:
            </label>
            <textarea
              rows={2}
              value={conclusionNotes}
              onChange={e => setConclusionNotes(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed"
              placeholder="State what your graph proves regarding the relationship between CO₂ concentration and heating rate..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
