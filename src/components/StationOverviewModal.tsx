import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  FlaskConical, 
  Sparkles, 
  Thermometer, 
  Sun, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Eye,
  Sliders,
  Scale,
  Zap,
  Gauge
} from 'lucide-react';
import setupImgBottle1 from '../assets/images/setup_control_bottle_1790716779013.jpg';
import setupImgBottle2 from '../assets/images/setup_medium_co2_bottle_1790716788801.jpg';
import setupImgBottle3 from '../assets/images/setup_high_co2_bottle_1790716799328.jpg';

interface StationOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStation?: (station: 1 | 2 | 3) => void;
  initialTab?: 1 | 2 | 3 | 'all';
}

export const StationOverviewModal: React.FC<StationOverviewModalProps> = ({
  isOpen,
  onClose,
  onSelectStation,
  initialTab = 'all'
}) => {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 'all'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-4xl bg-slate-900 border-2 border-indigo-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="overview-modal-title"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-4 border-b border-indigo-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-400 text-indigo-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-900/90 text-indigo-200 border border-indigo-700/60">
                  Student Pre-Lab Briefing
                </span>
                <span className="text-[10px] text-amber-400 font-mono">Keith Chapman 2026 v1.1</span>
              </div>
              <h2 id="overview-modal-title" className="text-lg font-bold text-white mt-0.5">
                Lab Guide: Parts 1, 2, and 3 Explained (Setup & Purpose)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-slate-800 flex gap-2 overflow-x-auto shrink-0 bg-slate-950/60">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'border-indigo-400 text-white bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Overview & Comparison</span>
          </button>

          <button
            onClick={() => setActiveTab(1)}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 1
                ? 'border-sky-400 text-sky-200 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-sky-400" />
            <span>Part 1: Control (0 Tablets)</span>
          </button>

          <button
            onClick={() => setActiveTab(2)}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 2
                ? 'border-amber-400 text-amber-200 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Part 2: Medium CO₂ (2 Tablets)</span>
          </button>

          <button
            onClick={() => setActiveTab(3)}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 3
                ? 'border-rose-400 text-rose-200 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span>Part 3: High CO₂ (4 Tablets)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-300 text-xs leading-relaxed">
          {/* TAB: ALL / OVERVIEW */}
          {(activeTab === 'all') && (
            <div className="space-y-4">
              {/* Introduction Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/70 to-slate-900 border border-indigo-500/40">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>The Big Scientific Question: How Does Carbon Dioxide Trap Heat?</span>
                </h3>
                <p className="mt-1.5 text-slate-300 text-xs leading-relaxed">
                  In this multi-station investigation, you will test how different amounts of <strong>Carbon Dioxide (CO₂)</strong> in a closed atmosphere affect the temperature inside a bottle when exposed to a steady source of radiant heat (the heat lamp). You will run 3 sequential stations, record temperature, and compare your curves!
                </p>
              </div>

              {/* Apparatus Setup: 3 Distinct Setups */}
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between text-xs font-bold text-sky-400 uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-amber-400" />
                    <span>Apparatus Setup: Three Controlled Systems (15 cm Distance · 21.0 °C Ambient)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">100 mL Water & Headspace Probe Each</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div className="rounded-lg border border-sky-500/40 bg-slate-900/90 overflow-hidden">
                    <div className="px-2 py-1 bg-sky-950/80 border-b border-sky-800/60 text-[11px] font-bold text-sky-300 flex justify-between items-center">
                      <span>Setup 1: Control</span>
                      <span className="text-[10px] text-emerald-400 font-mono">21.0 °C</span>
                    </div>
                    <img src={setupImgBottle1} alt="Setup 1: 0 Tablets" className="w-full aspect-video object-cover" />
                    <p className="p-1.5 text-[10px] text-slate-300">0 tablets, still water, probe in headspace, 15 cm distance.</p>
                  </div>

                  <div className="rounded-lg border border-amber-500/40 bg-slate-900/90 overflow-hidden">
                    <div className="px-2 py-1 bg-amber-950/80 border-b border-amber-800/60 text-[11px] font-bold text-amber-300 flex justify-between items-center">
                      <span>Setup 2: Low CO₂</span>
                      <span className="text-[10px] text-emerald-400 font-mono">21.0 °C</span>
                    </div>
                    <img src={setupImgBottle2} alt="Setup 2: 2 Tablets" className="w-full aspect-video object-cover" />
                    <p className="p-1.5 text-[10px] text-slate-300">2 tablets bubbling, probe in headspace, 15 cm distance.</p>
                  </div>

                  <div className="rounded-lg border border-rose-500/40 bg-slate-900/90 overflow-hidden">
                    <div className="px-2 py-1 bg-rose-950/80 border-b border-rose-800/60 text-[11px] font-bold text-rose-300 flex justify-between items-center">
                      <span>Setup 3: High CO₂</span>
                      <span className="text-[10px] text-emerald-400 font-mono">21.0 °C</span>
                    </div>
                    <img src={setupImgBottle3} alt="Setup 3: 4 Tablets" className="w-full aspect-video object-cover" />
                    <p className="p-1.5 text-[10px] text-slate-300">4 tablets dense fizzing, probe in headspace, 15 cm distance.</p>
                  </div>
                </div>
              </div>

              {/* 3-Part Quick Comparison Table */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Station 1 Card */}
                <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-500/40 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                        <FlaskConical className="w-4 h-4 text-sky-400" />
                        Part 1: Control Station
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-900/60 text-sky-200 border border-sky-700/60">
                        0 Tablets
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-300 space-y-1">
                      <p><strong>Atmosphere:</strong> Regular ambient room air (~420 ppm CO₂).</p>
                      <p><strong>Setup:</strong> 50 mL tap water, <strong>0 fizzing tablets</strong>, sealed tightly.</p>
                      <p><strong>Expected Warming:</strong> +4.3°C increase (from 21.0°C to 25.3°C).</p>
                      <p><strong>Why do this?</strong> Acts as the experimental baseline control to see how much heat regular air traps by itself.</p>
                    </div>
                  </div>
                  {onSelectStation && (
                    <button
                      onClick={() => { onSelectStation(1); onClose(); }}
                      className="w-full mt-2 py-1.5 rounded-lg bg-sky-600/80 hover:bg-sky-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition"
                    >
                      <span>Go to Part 1</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Station 2 Card */}
                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Part 2: Medium CO₂
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-700/60">
                        2 Tablets
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-300 space-y-1">
                      <p><strong>Atmosphere:</strong> Enriched Carbon Dioxide (~1,800 ppm CO₂).</p>
                      <p><strong>Setup:</strong> 50 mL water + <strong>2 fizzing tablets</strong> dropped in to produce CO₂ gas.</p>
                      <p><strong>Expected Warming:</strong> +6.5°C increase (from 21.0°C to 27.5°C).</p>
                      <p><strong>Why do this?</strong> Tests how moderate greenhouse gas enrichment accelerates thermal retention.</p>
                    </div>
                  </div>
                  {onSelectStation && (
                    <button
                      onClick={() => { onSelectStation(2); onClose(); }}
                      className="w-full mt-2 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition"
                    >
                      <span>Go to Part 2</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Station 3 Card */}
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-rose-400" />
                        Part 3: High CO₂
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 border border-rose-700/60">
                        4 Tablets
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-300 space-y-1">
                      <p><strong>Atmosphere:</strong> Heavy Greenhouse Gas Concentration (~3,200 ppm CO₂).</p>
                      <p><strong>Setup:</strong> 50 mL water + <strong>4 fizzing tablets</strong>, sealed immediately.</p>
                      <p><strong>Expected Warming:</strong> +8.2°C increase (from 21.0°C to 29.2°C).</p>
                      <p><strong>Why do this?</strong> Demonstrates the dramatic greenhouse amplification of heavily enriched atmospheres.</p>
                    </div>
                  </div>
                  {onSelectStation && (
                    <button
                      onClick={() => { onSelectStation(3); onClose(); }}
                      className="w-full mt-2 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition"
                    >
                      <span>Go to Part 3</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Standardized Apparatus Setup Requirements */}
              <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>The 4-Step Standardized Apparatus Setup (Must Be Done at Each Station)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80">
                    <strong className="text-amber-300 block mb-0.5">Step 1: Clamp Lamp & Connect Power</strong>
                    Clamp the 150W metal reflector heat lamp firmly to the ring stand pointing toward the bottle and plug into a grounded 120V outlet.
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80">
                    <strong className="text-amber-300 block mb-0.5">Step 2: Distance & Height Calibration (6–8")</strong>
                    Adjust lamp height to 6–8 inches and horizontal distance to 6–8 inches. This controlled variable ensures equal radiant energy flux across all 3 stations!
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80">
                    <strong className="text-amber-300 block mb-0.5">Step 3: Measure Water & Add Tablets</strong>
                    Pour exactly 50 mL of water into the bottle. Add 0 tablets (Part 1), 2 tablets (Part 2), or 4 tablets (Part 3) to trigger effervescence.
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80">
                    <strong className="text-amber-300 block mb-0.5">Step 4: Suspend Probe, Seal & Place Timer</strong>
                    Suspend the temperature probe in the air headspace (do NOT submerge in liquid), cover with plastic wrap, seal with clay, and position the timer.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PART 1 */}
          {activeTab === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sky-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4" />
                    <span>Station 1 Investigation</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    Part 1: The Control Setup (Ambient Air · 0 Tablets)
                  </h3>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-sky-900/80 border border-sky-600/70 text-right shrink-0">
                  <div className="text-[10px] text-sky-200">Starting Ambient</div>
                  <div className="text-base font-bold font-mono text-white">21.0°C → 25.3°C</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-1.5">
                  <h4 className="font-bold text-sky-300 text-xs">What is Part 1 Doing?</h4>
                  <p>
                    Part 1 serves as your <strong>experimental control</strong>. In any valid scientific experiment, you need a baseline to measure changes against. The air trapped inside the bottle is ordinary room air containing the standard ambient concentration of carbon dioxide (~420 parts per million, or ppm).
                  </p>
                  <p>
                    When the heat lamp shines on the bottle, the plastic and internal air absorb radiation. Over 15 minutes, temperature will increase from 21.0°C to approximately 25.3°C (a total rise of +4.3°C). Any temperature increase you see in Part 2 and Part 3 above this +4.3°C baseline is directly attributable to the added greenhouse gas!
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-2">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-sky-400" />
                    <span>Part 1 Step-by-Step Setup Guide:</span>
                  </h4>
                  <ol className="space-y-1.5 list-decimal list-inside text-slate-200">
                    <li><strong>Clamp & Plug In:</strong> Clamp the metal reflector heat lamp to the ring stand and plug the cord into the 120V outlet.</li>
                    <li><strong>Calibrate Geometry:</strong> Use the sliders to position the lamp between 6 and 8 inches in height and 6 to 8 inches in distance from the bottle.</li>
                    <li><strong>Add Liquid Only:</strong> Fill the graduated cylinder to 50 mL with water and pour it into the bottle. <em>Do NOT add any fizzing tablets!</em></li>
                    <li><strong>Seal the Bottle:</strong> Hang the temperature sensor in the air headspace above the water. Cover the opening with plastic wrap, seal the rim tightly with modeling clay, and secure with a rubber band.</li>
                    <li><strong>Collect Data:</strong> Turn the heat lamp ON, click "Start Timer", and record the temperature at 0, 3, 6, 9, 12, and 15 minutes.</li>
                  </ol>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/50 text-[11px] text-indigo-200">
                  <strong>Student Takeaway for Part 1:</strong> Even without extra CO₂, the closed bottle warms up under the lamp. Write down your final 15-minute temperature so you can compare it directly with Station 2!
                </div>
              </div>
            </div>
          )}

          {/* TAB: PART 2 */}
          {activeTab === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Station 2 Investigation</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    Part 2: Medium CO₂ Enrichment (2 Fizzing Tablets)
                  </h3>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-900/80 border border-amber-600/70 text-right shrink-0">
                  <div className="text-[10px] text-amber-200">Projected Warming</div>
                  <div className="text-base font-bold font-mono text-white">21.0°C → 27.5°C (+6.5°C)</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-1.5">
                  <h4 className="font-bold text-amber-300 text-xs">What is Part 2 Doing?</h4>
                  <p>
                    In Part 2, you introduce <strong>2 effervescent fizzing tablets</strong> (containing sodium bicarbonate and citric acid) into the 50 mL of water. When these tablets dissolve, they trigger an immediate chemical reaction that liberates gaseous carbon dioxide:
                  </p>
                  <p className="font-mono text-[11px] text-amber-300 bg-slate-950/60 p-2 rounded border border-slate-800">
                    3 NaHCO₃ (s) + C₆H₈O₇ (aq) → 3 CO₂ (g) + 3 H₂O (l) + Na₃C₆H₅O₇ (aq)
                  </p>
                  <p>
                    Because you seal the bottle right away, the released CO₂ gas is trapped inside the headspace, elevating the carbon dioxide concentration to roughly <strong>1,800 ppm</strong> (more than 4 times normal room air!). Carbon dioxide molecules readily absorb infrared radiation radiating from the heated bottle surfaces and re-radiate it in all directions, trapping heat.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-2">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Part 2 Step-by-Step Setup Guide:</span>
                  </h4>
                  <ol className="space-y-1.5 list-decimal list-inside text-slate-200">
                    <li><strong>Maintain Controlled Variables:</strong> Keep the heat lamp at the identical 6–8" distance and height as Station 1.</li>
                    <li><strong>Add Water & 2 Tablets:</strong> Measure 50 mL of water, add <strong>exactly 2 fizzing tablets</strong>, and watch the bubbles actively foam and dissolve.</li>
                    <li><strong>Seal Promptly:</strong> Suspend the probe in the headspace, cover with plastic wrap, modeling clay, and the rubber band to lock all the generated CO₂ inside.</li>
                    <li><strong>Run & Observe:</strong> Start the timer and notice how much steeper the thermal curve climbs compared to Station 1! Over 15 minutes, temperature reaches ~27.5°C (+6.5°C rise).</li>
                  </ol>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 text-[11px] text-amber-200">
                  <strong>Key Comparison:</strong> Notice that Station 2 warmed by +6.5°C, compared to Station 1's +4.3°C. The extra +2.2°C of heat retention is purely due to the presence of the 2 dissolved tablets' carbon dioxide!
                </div>
              </div>
            </div>
          )}

          {/* TAB: PART 3 */}
          {activeTab === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-rose-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Station 3 Investigation</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    Part 3: Heavy Greenhouse Forcing (4 Fizzing Tablets)
                  </h3>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-rose-900/80 border border-rose-600/70 text-right shrink-0">
                  <div className="text-[10px] text-rose-200">Maximum Warming</div>
                  <div className="text-base font-bold font-mono text-white">21.0°C → 29.2°C (+8.2°C)</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-1.5">
                  <h4 className="font-bold text-rose-300 text-xs">What is Part 3 Doing?</h4>
                  <p>
                    Part 3 doubles the dose again by adding <strong>4 effervescent tablets</strong> into the 50 mL of water. This creates vigorous foaming and releases a dense cloud of CO₂ into the bottle headspace, driving the gas concentration to roughly <strong>3,200 ppm</strong>.
                  </p>
                  <p>
                    With double the density of carbon dioxide molecules, infrared radiation passing through the air has a much higher probability of being absorbed by CO₂ molecular vibrational bonds (bending and stretching modes) and re-radiated back downward before it can escape through the bottle walls.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-2">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-rose-400" />
                    <span>Part 3 Step-by-Step Setup Guide:</span>
                  </h4>
                  <ol className="space-y-1.5 list-decimal list-inside text-slate-200">
                    <li><strong>Confirm Distance Standards:</strong> Check that lamp height and horizontal distance are both strictly 6–8" to preserve fair testing.</li>
                    <li><strong>Add 4 Tablets:</strong> Pour 50 mL of water and drop in <strong>all 4 fizzing tablets</strong>. The effervescence will be twice as intense as Station 2!</li>
                    <li><strong>Airtight Seal:</strong> Immediately seal the bottle top with the probe suspended in the headspace. Clay must be pinched tightly around the probe wire.</li>
                    <li><strong>Record Peak Heat Retention:</strong> Start the timer. The temperature surges from 21.0°C up to ~29.2°C (a massive +8.2°C increase).</li>
                  </ol>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 text-[11px] text-rose-200">
                  <strong>Synthesis for Students:</strong> After finishing Part 3, advance to Slide 4 (3-Station Comparative Summary) to see all 3 curves plotted simultaneously side-by-side! You will see clear proof that as CO₂ concentration increases, heat retention increases dramatically.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>OpenSciEd Standardized Multi-Station Investigation</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow"
          >
            I'm Ready to Start Lab
          </button>
        </div>
      </div>
    </div>
  );
};
