import React, { useState } from 'react';
import { 
  Cloud, 
  Sun, 
  Wind, 
  Layers, 
  Compass, 
  TrendingUp, 
  Droplets, 
  Flame, 
  Sparkles, 
  RotateCcw, 
  Info,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { DiffuserType, GasType } from '../types';

export const AtmosphericConditionsExplorer: React.FC = () => {
  // Atmospheric parameter states
  const [lampDistanceInches, setLampDistanceInches] = useState<number>(8); // 6" to 14"
  const [lampAngleDegrees, setLampAngleDegrees] = useState<90 | 60 | 30>(90);
  const [diffuserMaterial, setDiffuserMaterial] = useState<DiffuserType>('none');
  const [selectedGas, setSelectedGas] = useState<GasType>('co2-2tabs');

  // Baseline comparison condition: 0 tabs control, 2 tabs, or 4 tabs
  const [baselineComparison, setBaselineComparison] = useState<'0tabs' | '2tabs' | '4tabs'>('0tabs');
  const [cycleMode, setCycleMode] = useState<'heat-only' | 'day-night'>('day-night');

  // Physics model for alternative condition:
  // Flux factor = (6 / distance)^1.4 * sin(angle * PI / 180) * diffuserTransmission
  const getDiffuserFactor = (diffuser: DiffuserType) => {
    switch (diffuser) {
      case 'none': return 1.0; // 100% direct solar
      case 'thin-cirrus': return 0.82; // 18% scattered/reflected
      case 'overcast-stratus': return 0.52; // 48% reflected/diffused
      case 'condensation-film': return 0.68; // 32% diffused
    }
  };

  const getGasMaxDelta = (gas: GasType) => {
    switch (gas) {
      case 'air-control': return 2.5; // baseline air
      case 'co2-2tabs': return 4.8; // 2 tabs CO2
      case 'co2-4tabs': return 7.1; // 4 tabs CO2
      case 'methane-ch4': return 8.9; // CH4 has high GWP
      case 'water-vapor': return 5.9; // H2O vapor greenhouse
      case 'nitrous-oxide-n2o': return 9.4; // N2O
      case 'cfc-12': return 11.2; // intense synthetic GHG
    }
  };

  const getGasCoolingTau = (gas: GasType) => {
    switch (gas) {
      case 'air-control': return 4.5;
      case 'co2-2tabs': return 7.5;
      case 'co2-4tabs': return 11.0;
      case 'methane-ch4': return 13.0;
      case 'water-vapor': return 9.5;
      case 'nitrous-oxide-n2o': return 14.0;
      case 'cfc-12': return 16.0;
    }
  };

  const getGasDescription = (gas: GasType) => {
    switch (gas) {
      case 'air-control':
        return 'Standard dry air (78% N₂, 21% O₂, 0.93% Ar, 420 ppm CO₂). Transparent to most infrared.';
      case 'co2-2tabs':
        return 'Elevated CO₂ (~1,200 ppm) generated from 2 fizzing tablets. Traps infrared around 15 µm.';
      case 'co2-4tabs':
        return 'Dense CO₂ (~2,500 ppm) generated from 4 fizzing tablets. Strong infrared back-radiation.';
      case 'methane-ch4':
        return 'Methane (CH₄): 28x the global warming potential of CO₂ over a 100-year scale, absorbing distinct IR bands (~7.7 µm).';
      case 'water-vapor':
        return 'Water Vapor (H₂O): Earth’s most voluminous greenhouse gas. Enhances thermal retention and adds latent heat buffering.';
      case 'nitrous-oxide-n2o':
        return 'Nitrous Oxide (N₂O): ~273x GWP of CO₂. Stays in atmosphere for over a century.';
      case 'cfc-12':
        return 'CFC-12 (Dichlorodifluoromethane): Extreme GWP (>10,000x CO₂). Highly persistent synthetic greenhouse agent.';
    }
  };

  // Compute temperature curves (handles both heating and Newton cooling)
  const maxMinutes = cycleMode === 'day-night' ? 20 : 15;
  const generateCurve = (gas: GasType, dist: number, angle: number, diffuser: DiffuserType) => {
    const points: number[] = [];
    const base = 21.0;
    const flux = Math.pow(6 / Math.max(dist, 5), 1.3) * Math.sin((angle * Math.PI) / 180) * getDiffuserFactor(diffuser);
    const maxDelta = getGasMaxDelta(gas) * flux;
    const tauHeat = 7.5;
    const tauCool = getGasCoolingTau(gas);

    for (let t = 0; t <= maxMinutes; t++) {
      if (cycleMode === 'heat-only' || t <= 10) {
        // Active Heating
        const rise = maxDelta * (1 - Math.exp(-t / tauHeat));
        points.push(Number((base + rise).toFixed(1)));
      } else {
        // Cooling Phase (Lamp turned off at 10m): Newton's law of cooling
        const peakTemp = base + maxDelta * (1 - Math.exp(-10 / tauHeat));
        const decay = (peakTemp - base) * Math.exp(-(t - 10) / tauCool);
        points.push(Number((base + decay).toFixed(1)));
      }
    }
    return points;
  };

  // Baseline standard curve (0, 2, or 4 tablets at 7" direct 90° no diffuser)
  const baselineGas: GasType = baselineComparison === '0tabs' ? 'air-control' : baselineComparison === '2tabs' ? 'co2-2tabs' : 'co2-4tabs';
  const baselineCurve = generateCurve(baselineGas, 7, 90, 'none');
  const customCurve = generateCurve(selectedGas, lampDistanceInches, lampAngleDegrees, diffuserMaterial);

  const deltaBaseline = Number((baselineCurve[maxMinutes] - baselineCurve[0]).toFixed(1));
  const deltaCustom = Number((customCurve[maxMinutes] - customCurve[0]).toFixed(1));
  const diff = Number((deltaCustom - deltaBaseline).toFixed(1));

  // SVG Chart Dimensions
  const cW = 600;
  const cH = 250;
  const pL = 45;
  const pR = 25;
  const pT = 20;
  const pB = 35;

  const minT = 20.0;
  const maxT = 32.0;

  const getX = (t: number) => pL + (t / maxMinutes) * (cW - pL - pR);
  const getY = (v: number) => pT + (1 - (v - minT) / (maxT - minT)) * (cH - pT - pB);

  const baselinePoly = baselineCurve.map((val, t) => `${getX(t)},${getY(val)}`).join(' ');
  const customPoly = customCurve.map((val, t) => `${getX(t)},${getY(val)}`).join(' ');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold mb-2">
          <Cloud className="w-4 h-4" />
          Module 5: Clouds, Solar Angles & Alternative Atmospheric Gases
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Beyond CO₂: Simulating Cloud Cover & Other Greenhouse Gases
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
          Explore how real-world atmospheric conditions alter warming dynamics: adjust cloud cover diffusers, vary solar incident angles (latitude / seasons), change radiant distance, and test alternative greenhouse gases (<strong>Methane, Water Vapor, N₂O</strong>) against the baseline CO₂ lab trial.
        </p>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Controls (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Atmospheric & Radiation Controls
          </h3>

          {/* 1. Cloud Cover & Light Diffusers */}
          <div>
            <label className="text-xs font-bold text-slate-200 block mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-sky-400" />
                Cloud Cover / Light Diffusing Barrier:
              </span>
              <span className="text-[11px] font-mono text-sky-300">
                {Math.round(getDiffuserFactor(diffuserMaterial) * 100)}% Transmittance
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'none', label: 'Clear Sky', desc: 'No barrier (100% direct solar beam)' },
                { id: 'thin-cirrus', label: 'Thin Cirrus Clouds', desc: 'Light mesh / gauze (~18% diffusion)' },
                { id: 'overcast-stratus', label: 'Overcast Stratus', desc: 'Translucent paper (~48% albedo reflection)' },
                { id: 'condensation-film', label: 'Condensation / Mist', desc: 'Water droplet fog layer (~32% diffusion)' },
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => setDiffuserMaterial(d.id as any)}
                  className={`p-3 rounded-xl border text-left transition ${
                    diffuserMaterial === d.id
                      ? 'bg-sky-950/60 border-sky-500 text-white shadow'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs">{d.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Heat Lamp Angle (Solar Zenith / Latitude Effect) */}
          <div>
            <label className="text-xs font-bold text-slate-200 block mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400" />
                Lamp Angle (Solar Zenith / Latitude Simulation):
              </span>
              <span className="text-[11px] font-mono text-amber-300">{lampAngleDegrees}° Angle</span>
            </label>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { angle: 90, label: '90° Direct (Equator / Noon)', desc: '100% radiant flux density' },
                { angle: 60, label: '60° Angled (Mid-Latitude)', desc: '86.6% flux (cosine effect)' },
                { angle: 30, label: '30° Grazing (Sub-Polar)', desc: '50% flux (spread out)' },
              ].map(a => (
                <button
                  key={a.angle}
                  onClick={() => setLampAngleDegrees(a.angle as any)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    lampAngleDegrees === a.angle
                      ? 'bg-amber-950/60 border-amber-500 text-white shadow'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs">{a.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{a.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Heat Lamp Distance Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-200 font-bold flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-yellow-400" />
                Lamp Distance from Bottle:
              </span>
              <span className="font-mono font-bold text-amber-300">{lampDistanceInches} inches</span>
            </div>
            <input
              type="range"
              min="6"
              max="14"
              step="1"
              value={lampDistanceInches}
              onChange={e => setLampDistanceInches(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>6" (Max Intensity)</span>
              <span>10" (Moderate)</span>
              <span>14" (Low Radiant Flux)</span>
            </div>
          </div>

          {/* 4. Alternative Gas Selector */}
          <div>
            <label className="text-xs font-bold text-slate-200 block mb-2 flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-emerald-400" />
              Select Atmospheric Gas to Test:
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { id: 'air-control', label: 'Normal Air (Control)', badge: 'Baseline' },
                { id: 'co2-2tabs', label: 'CO₂ (2 Tablets)', badge: 'Elevated' },
                { id: 'co2-4tabs', label: 'CO₂ (4 Tablets)', badge: 'High CO₂' },
                { id: 'methane-ch4', label: 'Methane (CH₄)', badge: '28x GWP' },
                { id: 'water-vapor', label: 'Water Vapor (H₂O)', badge: 'Humidity' },
                { id: 'nitrous-oxide-n2o', label: 'Nitrous Oxide (N₂O)', badge: '273x GWP' },
              ].map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGas(g.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    selectedGas === g.id
                      ? 'bg-emerald-950/70 border-emerald-500 text-white shadow'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs truncate">{g.label}</div>
                  <span className="text-[10px] text-emerald-400 font-mono">{g.badge}</span>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 mt-2 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              {getGasDescription(selectedGas)}
            </p>
          </div>
        </div>

        {/* Right: Comparative Temperature Trajectory & Analysis (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Comparative Warming Trajectory
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Side-by-side plot of your custom atmospheric condition vs. baseline experiment.
                </p>
              </div>

              {/* Cycle Mode & Baseline picker */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-[11px] bg-slate-800 p-1 rounded-lg border border-slate-700">
                  <span className="text-slate-400 px-1">Cycle:</span>
                  <button
                    onClick={() => setCycleMode('heat-only')}
                    className={`px-2 py-0.5 rounded font-medium ${cycleMode === 'heat-only' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
                  >
                    15m Heat Only
                  </button>
                  <button
                    onClick={() => setCycleMode('day-night')}
                    className={`px-2 py-0.5 rounded font-medium ${cycleMode === 'day-night' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    10m Heat + 10m Cool
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[11px] bg-slate-800 p-1 rounded-lg border border-slate-700">
                  <span className="text-slate-400 px-1">Compare vs:</span>
                  <button
                    onClick={() => setBaselineComparison('0tabs')}
                    className={`px-2 py-0.5 rounded font-medium ${baselineComparison === '0tabs' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    0 Tabs
                  </button>
                  <button
                    onClick={() => setBaselineComparison('2tabs')}
                    className={`px-2 py-0.5 rounded font-medium ${baselineComparison === '2tabs' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    2 Tabs
                  </button>
                  <button
                    onClick={() => setBaselineComparison('4tabs')}
                    className={`px-2 py-0.5 rounded font-medium ${baselineComparison === '4tabs' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    4 Tabs
                  </button>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-xs mt-3">
              <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
                <span className="w-3 h-0.5 bg-sky-400 border-t-2 border-sky-400 inline-block" />
                <span>Baseline ({baselineComparison === '0tabs' ? 'Control 0 Tabs' : baselineComparison === '2tabs' ? '2 Tabs CO₂' : '4 Tabs CO₂'})</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                <span className="w-3 h-0.5 bg-rose-400 border-t-2 border-rose-400 inline-block" />
                <span>Custom Condition Trial</span>
              </div>
            </div>

            {/* SVG Comparison Graph */}
            <div className="mt-3 w-full overflow-x-auto">
              <svg viewBox={`0 0 ${cW} ${cH}`} className="w-full h-56 bg-slate-950 rounded-xl border border-slate-800">
                {/* Horizontal Grid */}
                {[20, 23, 26, 29, 32].map(temp => (
                  <g key={temp}>
                    <line x1={pL} y1={getY(temp)} x2={cW - pR} y2={getY(temp)} stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
                    <text x={pL - 8} y={getY(temp) + 4} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">{temp}°C</text>
                  </g>
                ))}

                {/* Vertical Grid Time */}
                {(cycleMode === 'day-night' ? [0, 5, 10, 15, 20] : [0, 3, 6, 9, 12, 15]).map(t => (
                  <g key={t}>
                    <line x1={getX(t)} y1={pT} x2={getX(t)} y2={cH - pB} stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
                    <text x={getX(t)} y={cH - pB + 14} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">{t}m</text>
                  </g>
                ))}

                {/* Night / Cooling separator marker */}
                {cycleMode === 'day-night' && (
                  <g>
                    <line x1={getX(10)} y1={pT} x2={getX(10)} y2={cH - pB} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
                    <text x={getX(10)} y={pT + 12} fill="#f59e0b" fontSize="8" textAnchor="middle" fontWeight="bold">Lamp OFF (Cooling)</text>
                  </g>
                )}

                {/* Polylines */}
                <polyline points={baselinePoly} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 2" />
                <polyline points={customPoly} fill="none" stroke="#f43f5e" strokeWidth="3" />

                {/* End Point Labels */}
                <circle cx={getX(maxMinutes)} cy={getY(baselineCurve[maxMinutes])} r="4" fill="#38bdf8" />
                <circle cx={getX(maxMinutes)} cy={getY(customCurve[maxMinutes])} r="4.5" fill="#f43f5e" />
              </svg>
            </div>
          </div>

          {/* Numerical Delta Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-sky-900/60">
              <span className="text-[10px] text-slate-400 block uppercase">Baseline ΔT</span>
              <span className="font-mono font-bold text-sky-400 text-sm">+{deltaBaseline} °C</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-rose-900/60">
              <span className="text-[10px] text-slate-400 block uppercase">Custom Condition ΔT</span>
              <span className="font-mono font-bold text-rose-400 text-sm">+{deltaCustom} °C</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Difference</span>
              <span className={`font-mono font-bold text-sm ${diff >= 0 ? 'text-amber-400' : 'text-sky-300'}`}>
                {diff >= 0 ? `+${diff}` : diff} °C
              </span>
            </div>
          </div>

          {/* Scientific Insight Box */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <strong className="text-white block font-semibold mb-1 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-sky-400" />
              Real-World Climate Insight:
            </strong>
            {diffuserMaterial !== 'none' ? (
              <p>
                <strong>Cloud Albedo Effect:</strong> The diffusing barrier reflects incoming radiant visible light away before it can heat the bottle, reducing net surface warming. On Earth, low thick clouds reflect ~50% of incoming sunlight (cooling), while thin high clouds allow sunlight to penetrate but trap outgoing heat (warming).
              </p>
            ) : selectedGas === 'methane-ch4' ? (
              <p>
                <strong>Potent Greenhouse Forcing:</strong> Methane is significantly more potent per molecule than carbon dioxide at absorbing thermal infrared wavelengths. Its tetrahedral chemical geometry offers multiple vibrational degrees of freedom that trap escaping terrestrial heat.
              </p>
            ) : (
              <p>
                <strong>Solar Insolation:</strong> Notice how angling the lamp (from 90° overhead down to 30°) spreads the beam over a broader area, directly modeling why Earth's poles remain cold despite having long daylight hours during summer.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
