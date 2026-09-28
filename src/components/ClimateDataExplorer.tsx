import React, { useState } from 'react';
import { 
  TrendingUp, 
  Layers, 
  Activity, 
  Repeat, 
  Snowflake, 
  Droplets, 
  Flame, 
  ArrowRight, 
  Info, 
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { KEELING_CURVE_DATA, ICE_CORE_PALEOCLIMATE } from '../data/labData';

export const ClimateDataExplorer: React.FC = () => {
  const [activeDataset, setActiveDataset] = useState<'keeling' | 'ice-core'>('keeling');
  const [activeFeedback, setActiveFeedback] = useState<'albedo' | 'watervapor' | 'permafrost'>('albedo');
  const [feedbackStep, setFeedbackStep] = useState<number>(1);

  // SVG dimensions for climate curves
  const w = 620;
  const h = 260;
  const pL = 50;
  const pR = 50;
  const pT = 20;
  const pB = 40;

  // Keeling scale: Year 1960 to 2026, CO2 310 to 440 ppm, Temp Anomaly -0.2 to +1.5 °C
  const getKeelingX = (yr: number) => pL + ((yr - 1960) / (2026 - 1960)) * (w - pL - pR);
  const getKeelingY_CO2 = (co2: number) => pT + (1 - (co2 - 310) / (440 - 310)) * (h - pT - pB);
  const getKeelingY_Temp = (t: number) => pT + (1 - (t - (-0.2)) / (1.5 - (-0.2))) * (h - pT - pB);

  const keelingCo2Poly = KEELING_CURVE_DATA.map(d => `${getKeelingX(d.year)},${getKeelingY_CO2(d.co2)}`).join(' ');
  const keelingTempPoly = KEELING_CURVE_DATA.map(d => `${getKeelingX(d.year)},${getKeelingY_Temp(d.tempAnomaly)}`).join(' ');

  // Ice Core scale: 800k years ago to 0, CO2 160 to 440 ppm, Temp -10 to +3 °C
  const getIceX = (kyr: number) => pL + ((800 - kyr) / 800) * (w - pL - pR);
  const getIceY_CO2 = (co2: number) => pT + (1 - (co2 - 160) / (440 - 160)) * (h - pT - pB);
  const getIceY_Temp = (t: number) => pT + (1 - (t - (-10)) / (3 - (-10))) * (h - pT - pB);

  const iceCo2Poly = ICE_CORE_PALEOCLIMATE.map(d => `${getIceX(d.kYearsAgo)},${getIceY_CO2(d.co2)}`).join(' ');
  const iceTempPoly = ICE_CORE_PALEOCLIMATE.map(d => `${getIceX(d.kYearsAgo)},${getIceY_Temp(d.tempRelC)}`).join(' ');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-2">
          <Activity className="w-4 h-4" />
          Module 4: Real-World Global Data & Self-Reinforcing Feedbacks
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Empirical Climate Records & Dynamic Earth Systems
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
          Connect your classroom bottle lab results to global planetary observations. Explore empirical atmospheric measurements from Mauna Loa, 800,000 years of ice-core paleoclimate archives, and the critical feedback loops accelerating Earth system changes.
        </p>
      </div>

      {/* Dataset Toggle & Graph Section */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Empirical Atmospheric CO₂ vs. Temperature Trajectories
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select between the modern high-precision instrumental record or the 800,000-year ice core record.
            </p>
          </div>

          {/* Selector buttons */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 self-start sm:self-auto">
            <button
              onClick={() => setActiveDataset('keeling')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeDataset === 'keeling'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Modern Record (1960–2026)
            </button>
            <button
              onClick={() => setActiveDataset('ice-core')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeDataset === 'ice-core'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ice Cores (800,000 Years)
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <span className="w-3 h-0.5 bg-rose-500 inline-block border-t-2 border-rose-500" />
              <span>CO₂ Concentration (ppm) - Left Axis</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <span className="w-3 h-0.5 bg-amber-500 inline-block border-t-2 border-amber-500" />
              <span>Global Temperature Anomaly (°C) - Right Axis</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Data: NOAA GML & EPICA Dome C Ice Core
          </span>
        </div>

        {/* SVG Visualization */}
        <div className="mt-4 w-full overflow-x-auto">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-72 bg-slate-950 rounded-xl border border-slate-800">
            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const y = pT + ratio * (h - pT - pB);
              return (
                <line
                  key={ratio}
                  x1={pL}
                  y1={y}
                  x2={w - pR}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
              );
            })}

            {activeDataset === 'keeling' ? (
              <>
                {/* Left Axis Labels: CO2 ppm */}
                <text x={pL - 8} y={getKeelingY_CO2(320)} fill="#f43f5e" fontSize="9" textAnchor="end" fontFamily="monospace">320</text>
                <text x={pL - 8} y={getKeelingY_CO2(360)} fill="#f43f5e" fontSize="9" textAnchor="end" fontFamily="monospace">360</text>
                <text x={pL - 8} y={getKeelingY_CO2(400)} fill="#f43f5e" fontSize="9" textAnchor="end" fontFamily="monospace">400</text>
                <text x={pL - 8} y={getKeelingY_CO2(430)} fill="#f43f5e" fontSize="9" textAnchor="end" fontFamily="monospace">430</text>

                {/* Right Axis Labels: Temp Anomaly */}
                <text x={w - pR + 8} y={getKeelingY_Temp(0.0)} fill="#f59e0b" fontSize="9" textAnchor="start" fontFamily="monospace">0.0°C</text>
                <text x={w - pR + 8} y={getKeelingY_Temp(0.5)} fill="#f59e0b" fontSize="9" textAnchor="start" fontFamily="monospace">+0.5°C</text>
                <text x={w - pR + 8} y={getKeelingY_Temp(1.0)} fill="#f59e0b" fontSize="9" textAnchor="start" fontFamily="monospace">+1.0°C</text>
                <text x={w - pR + 8} y={getKeelingY_Temp(1.3)} fill="#f59e0b" fontSize="9" textAnchor="start" fontFamily="monospace">+1.3°C</text>

                {/* X Axis Time Marks */}
                {[1960, 1975, 1990, 2005, 2020, 2026].map(yr => (
                  <text key={yr} x={getKeelingX(yr)} y={h - 10} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                    {yr}
                  </text>
                ))}

                {/* Polylines */}
                <polyline points={keelingCo2Poly} fill="none" stroke="#f43f5e" strokeWidth="2.5" />
                <polyline points={keelingTempPoly} fill="none" stroke="#f59e0b" strokeWidth="2.5" />

                {/* Points */}
                {KEELING_CURVE_DATA.map(d => (
                  <g key={d.year}>
                    <circle cx={getKeelingX(d.year)} cy={getKeelingY_CO2(d.co2)} r="3" fill="#f43f5e" />
                    <circle cx={getKeelingX(d.year)} cy={getKeelingY_Temp(d.tempAnomaly)} r="3" fill="#f59e0b" />
                  </g>
                ))}
              </>
            ) : (
              <>
                {/* Ice core Left Axis */}
                <text x={pL - 8} y={getIceY_CO2(180)} fill="#f43f5e" fontSize="9" textAnchor="end" fontFamily="monospace">180</text>
                <text x={pL - 8} y={getIceY_CO2(280)} fill="#f43f5e" fontSize="9" textAnchor="end" fontFamily="monospace">280</text>
                <text x={pL - 8} y={getIceY_CO2(420)} fill="#f43f5e" fontSize="9" textAnchor="end" fontFamily="monospace">420</text>

                {/* Ice core Right Axis */}
                <text x={w - pR + 8} y={getIceY_Temp(-8)} fill="#f59e0b" fontSize="9" textAnchor="start" fontFamily="monospace">-8°C</text>
                <text x={w - pR + 8} y={getIceY_Temp(0)} fill="#f59e0b" fontSize="9" textAnchor="start" fontFamily="monospace">0°C</text>
                <text x={w - pR + 8} y={getIceY_Temp(2)} fill="#f59e0b" fontSize="9" textAnchor="start" fontFamily="monospace">+2°C</text>

                {/* X Axis Time Marks (Thousands of Years Ago) */}
                {[800, 600, 400, 200, 0].map(kyr => (
                  <text key={kyr} x={getIceX(kyr)} y={h - 10} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                    {kyr === 0 ? 'Today' : `${kyr}k YA`}
                  </text>
                ))}

                {/* Polylines */}
                <polyline points={iceCo2Poly} fill="none" stroke="#f43f5e" strokeWidth="2.5" />
                <polyline points={iceTempPoly} fill="none" stroke="#f59e0b" strokeWidth="2.5" />

                {ICE_CORE_PALEOCLIMATE.map(d => (
                  <g key={d.kYearsAgo}>
                    <circle cx={getIceX(d.kYearsAgo)} cy={getIceY_CO2(d.co2)} r="3" fill="#f43f5e" />
                    <circle cx={getIceX(d.kYearsAgo)} cy={getIceY_Temp(d.tempRelC)} r="3" fill="#f59e0b" />
                  </g>
                ))}

                {/* Present Day Spike Annotation */}
                <g transform={`translate(${getIceX(0) - 95}, ${getIceY_CO2(425) - 10})`}>
                  <rect width="90" height="20" rx="4" fill="#991b1b" />
                  <text x="45" y="14" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                    425 ppm (Today)
                  </text>
                </g>
              </>
            )}
          </svg>
        </div>

        {/* Insight note */}
        <div className="mt-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
          <strong className="text-white block font-semibold mb-1">
            Scientific Synthesis: Bottle Lab vs. Global Scale
          </strong>
          Notice the strong mathematical coupling: whenever CO₂ concentrations rise (whether from 2 to 4 fizzing tablets in your 16.9 oz bottle, or from 280 to 425 ppm in Earth's atmosphere), radiant thermal energy is trapped more efficiently, driving steady temperature increases. For 800,000 years, atmospheric CO₂ naturally hovered strictly between 180 ppm (ice ages) and 280 ppm (warm interglacials). Today's level of 425+ ppm has no precedent in human history.
        </div>
      </div>

      {/* Interactive Climate Feedback Loop Simulator */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Repeat className="w-5 h-5 text-amber-400" />
              Self-Reinforcing (Positive) Climate Feedback Loops
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select a planetary feedback mechanism and step through the cyclical chain reaction.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveFeedback('albedo'); setFeedbackStep(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                activeFeedback === 'albedo'
                  ? 'bg-sky-950/80 text-sky-300 border-sky-500 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              1. Ice-Albedo
            </button>
            <button
              onClick={() => { setActiveFeedback('watervapor'); setFeedbackStep(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                activeFeedback === 'watervapor'
                  ? 'bg-blue-950/80 text-blue-300 border-blue-500 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              2. Water Vapor
            </button>
            <button
              onClick={() => { setActiveFeedback('permafrost'); setFeedbackStep(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                activeFeedback === 'permafrost'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              3. Permafrost Thaw
            </button>
          </div>
        </div>

        {/* Feedback Steps Visual Cycle */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {activeFeedback === 'albedo' && (
            <>
              <div className={`p-4 rounded-xl border transition-all ${feedbackStep >= 1 ? 'bg-indigo-950/40 border-indigo-500 text-white' : 'bg-slate-800/30 border-slate-800 text-slate-500'}`}>
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-2">
                  <span className="text-amber-400">STAGE 1</span>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <h4 className="text-xs font-bold text-white">Atmospheric Warming</h4>
                <p className="text-[11px] text-slate-300 mt-1">Elevated CO₂ traps infrared heat, warming the global climate.</p>
              </div>

              <div className={`p-4 rounded-xl border transition-all ${feedbackStep >= 2 ? 'bg-indigo-950/40 border-indigo-500 text-white' : 'bg-slate-800/30 border-slate-800 text-slate-500'}`}>
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-2">
                  <span className="text-sky-400">STAGE 2</span>
                  <Snowflake className="w-4 h-4 text-sky-400" />
                </div>
                <h4 className="text-xs font-bold text-white">Ice & Snow Melt</h4>
                <p className="text-[11px] text-slate-300 mt-1">Reflective Arctic sea ice, glaciers, and snowpacks recede.</p>
              </div>

              <div className={`p-4 rounded-xl border transition-all ${feedbackStep >= 3 ? 'bg-indigo-950/40 border-indigo-500 text-white' : 'bg-slate-800/30 border-slate-800 text-slate-500'}`}>
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-2">
                  <span className="text-emerald-400">STAGE 3</span>
                  <Layers className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-xs font-bold text-white">Albedo Drops</h4>
                <p className="text-[11px] text-slate-300 mt-1">Dark ocean surface (albedo ~6%) replaces bright white ice (albedo ~80%).</p>
              </div>

              <div className={`p-4 rounded-xl border transition-all ${feedbackStep >= 4 ? 'bg-rose-950/40 border-rose-500 text-white' : 'bg-slate-800/30 border-slate-800 text-slate-500'}`}>
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-2">
                  <span className="text-rose-400">STAGE 4</span>
                  <Repeat className="w-4 h-4 text-rose-400" />
                </div>
                <h4 className="text-xs font-bold text-white">Amplified Warming</h4>
                <p className="text-[11px] text-slate-300 mt-1">Darker ocean absorbs more solar radiation, accelerating the loop back to Stage 1!</p>
              </div>
            </>
          )}

          {activeFeedback === 'watervapor' && (
            <>
              <div className={`p-4 rounded-xl border transition-all ${feedbackStep >= 1 ? 'bg-indigo-950/40 border-indigo-500 text-white' : 'bg-slate-800/30 border-slate-800 text-slate-500'}`}>
                <div className="text-xs font-mono font-bold text-amber-400 mb-2">STAGE 1</div>
                <h4 className="text-xs font-bold text-white">Initial CO₂ Warming</h4>
                <p className="text-[11px] text-slate-300 mt-1">Global air and surface ocean temperatures rise.</p>
              </div>
              <div className={`p-4 rounded-xl border transition-all ${feedbackStep >= 2 ? 'bg-indigo-950/40 border-indigo-500 text-white' : 'bg-slate-800/30 border-slate-800 text-slate-500'}`}>
                <div className="text-xs font-mono font-bold text-sky-400 mb-2">STAGE 2</div>
                <h4 className="text-xs font-bold text-white">Higher Evaporation</h4>
                <p className="text-[11px] text-slate-300 mt-1">Clausius-Clapeyron relation: warm air holds ~7% more moisture per 1°C.</p>
              </div>
              <div className={`p-4 rounded-xl border transition-all ${feedbackStep >= 3 ? 'bg-indigo-950/40 border-indigo-500 text-white' : 'bg-slate-800/30 border-slate-800 text-slate-500'}`}>
                <div className="text-xs font-mono font-bold text-blue-400 mb-2">STAGE 3</div>
                <h4 className="text-xs font-bold text-white">Water Vapor Greenhouse</h4>
                <p className="text-[11px] text-slate-300 mt-1">H₂O vapor is Earth's most abundant greenhouse gas, absorbing additional IR bands.</p>
              </div>
              <div className={`p-4 rounded-xl border transition-all ${feedbackStep >= 4 ? 'bg-rose-950/40 border-rose-500 text-white' : 'bg-slate-800/30 border-slate-800 text-slate-500'}`}>
                <div className="text-xs font-mono font-bold text-rose-400 mb-2">STAGE 4</div>
                <h4 className="text-xs font-bold text-white">Doubled Warming</h4>
                <p className="text-[11px] text-slate-300 mt-1">Water vapor approximately doubles the warming initiated by carbon dioxide alone.</p>
              </div>
            </>
          )}

          {activeFeedback === 'permafrost' && (
            <>
              <div className={`p-4 rounded-xl border transition-all ${feedbackStep >= 1 ? 'bg-indigo-950/40 border-indigo-500 text-white' : 'bg-slate-800/30 border-slate-800 text-slate-500'}`}>
                <div className="text-xs font-mono font-bold text-amber-400 mb-2">STAGE 1</div>
                <h4 className="text-xs font-bold text-white">Arctic Amplification</h4>
                <p className="text-[11px] text-slate-300 mt-1">The Arctic warms 2–3x faster than the global planetary average.</p>
              </div>
              <div className={`p-4 rounded-xl border transition-all ${feedbackStep >= 2 ? 'bg-indigo-950/40 border-indigo-500 text-white' : 'bg-slate-800/30 border-slate-800 text-slate-500'}`}>
                <div className="text-xs font-mono font-bold text-amber-400 mb-2">STAGE 2</div>
                <h4 className="text-xs font-bold text-white">Permafrost Thaws</h4>
                <p className="text-[11px] text-slate-300 mt-1">Previously permanently frozen soils containing ancient organic carbon thaw.</p>
              </div>
              <div className={`p-4 rounded-xl border transition-all ${feedbackStep >= 3 ? 'bg-indigo-950/40 border-indigo-500 text-white' : 'bg-slate-800/30 border-slate-800 text-slate-500'}`}>
                <div className="text-xs font-mono font-bold text-rose-400 mb-2">STAGE 3</div>
                <h4 className="text-xs font-bold text-white">Methane & CO₂ Outgassing</h4>
                <p className="text-[11px] text-slate-300 mt-1">Microbes digest thawed matter, venting high quantities of CH₄ and CO₂ into the air.</p>
              </div>
              <div className={`p-4 rounded-xl border transition-all ${feedbackStep >= 4 ? 'bg-rose-950/40 border-rose-500 text-white' : 'bg-slate-800/30 border-slate-800 text-slate-500'}`}>
                <div className="text-xs font-mono font-bold text-rose-400 mb-2">STAGE 4</div>
                <h4 className="text-xs font-bold text-white">Accelerated Global Heating</h4>
                <p className="text-[11px] text-slate-300 mt-1">Methane possesses 28x the 100-year warming potential of CO₂, multiplying feedbacks.</p>
              </div>
            </>
          )}
        </div>

        {/* Step Controls */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Step <strong>{feedbackStep}</strong> of 4
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFeedbackStep(prev => (prev > 1 ? prev - 1 : 1))}
              disabled={feedbackStep === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 disabled:opacity-40"
            >
              Previous Step
            </button>
            <button
              onClick={() => setFeedbackStep(prev => (prev < 4 ? prev + 1 : 1))}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow"
            >
              <span>{feedbackStep < 4 ? 'Advance Feedback Step' : 'Restart Loop'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
