import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  ShieldCheck, 
  Sun, 
  Users, 
  Trash2, 
  Archive, 
  Flame, 
  Zap, 
  Droplets, 
  Eye, 
  ArrowRight,
  Sparkles,
  Layers,
  Thermometer,
  Clock,
  FlaskConical,
  TestTube2
} from 'lucide-react';
import { INITIAL_MATERIALS, SAFETY_RULES, STUDENT_ROLES } from '../data/labData';
import { MaterialItem, SafetyRule } from '../types';

interface LabMaterialsAndSetupProps {
  onProceedToSim: () => void;
}

export const LabMaterialsAndSetup: React.FC<LabMaterialsAndSetupProps> = ({ onProceedToSim }) => {
  const [materials, setMaterials] = useState<MaterialItem[]>(INITIAL_MATERIALS);
  const [safetyList, setSafetyList] = useState<SafetyRule[]>(SAFETY_RULES);
  const [selectedStation, setSelectedStation] = useState<1 | 2 | 3>(1);
  const [setupMode, setSetupMode] = useState<'3-stations' | '3-bottles-one-station'>('3-stations');

  const toggleMaterial = (id: string) => {
    setMaterials(prev =>
      prev.map(m => (m.id === id ? { ...m, checked: !m.checked } : m))
    );
  };

  const toggleSafety = (id: string) => {
    setSafetyList(prev =>
      prev.map(s => (s.id === id ? { ...s, verified: !s.verified } : s))
    );
  };

  const allSafetyVerified = safetyList.filter(s => s.critical).every(s => s.verified);
  const totalVerifiedCount = safetyList.filter(s => s.verified).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Banner with OpenSciEd Context */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Module 1: Classroom Lab Setup & Safety Protocol
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Investigating Carbon Dioxide & Heat Absorption
          </h2>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            In this hands-on lab, students model how varying concentrations of greenhouse gas (<span className="text-amber-300 font-medium">CO₂</span>) trap radiant thermal energy inside an enclosed atmosphere. Follow the rigorous <span className="text-indigo-300 font-medium">OpenSciEd High School Science</span> safety guidelines before energizing heat lamps.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 text-xs text-slate-200">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Radiant Energy Source: <strong>150W Clamped Heat Lamp</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 text-xs text-slate-200">
              <Thermometer className="w-4 h-4 text-rose-400" />
              <span>Air Temp Sensor: <strong>Digital Probe in Headspace</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 text-xs text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Safety Check: <strong>{totalVerifiedCount}/{safetyList.length} Verified</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Classroom Setup Architecture */}
      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" />
              Classroom Station Configuration
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select your classroom layout model below to review assigned conditions and tablet counts.
            </p>
          </div>

          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 self-start">
            <button
              id="mode-3stations-btn"
              onClick={() => setSetupMode('3-stations')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                setupMode === '3-stations'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Standard: 3 Separate Classroom Stations
            </button>
            <button
              id="mode-3bottles-btn"
              onClick={() => setSetupMode('3-bottles-one-station')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                setupMode === '3-bottles-one-station'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Alternative: 3 Bottles at 1 Heat Lamp
            </button>
          </div>
        </div>

        {/* Stations Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Station 1 */}
          <div 
            onClick={() => setSelectedStation(1)}
            className={`cursor-pointer rounded-xl p-5 border transition-all ${
              selectedStation === 1 
                ? 'bg-slate-800/90 border-sky-500 ring-2 ring-sky-500/20 shadow-lg' 
                : 'bg-slate-800/40 border-slate-700/70 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950/60 px-2.5 py-1 rounded-full border border-sky-800/60">
                Station 1 • Control
              </span>
              <span className="text-xs text-slate-400">Ambient Air</span>
            </div>
            <h4 className="text-base font-bold text-white mt-3">0 Fizzing Tablets</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Standard room air control (~420 ppm CO₂ baseline). 50 mL room-temp water added without effervescent tablets. Sealed with plastic wrap and clay.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Expected ΔT:</span>
              <span className="font-semibold text-sky-300">+2.0 to +2.5 °C</span>
            </div>
          </div>

          {/* Station 2 */}
          <div 
            onClick={() => setSelectedStation(2)}
            className={`cursor-pointer rounded-xl p-5 border transition-all ${
              selectedStation === 2 
                ? 'bg-slate-800/90 border-amber-500 ring-2 ring-amber-500/20 shadow-lg' 
                : 'bg-slate-800/40 border-slate-700/70 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800/60">
                Station 2 • Medium CO₂
              </span>
              <span className="text-xs text-slate-400">Elevated</span>
            </div>
            <h4 className="text-base font-bold text-white mt-3">2 Fizzing Tablets</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              50 mL water + 2 crushed/whole fizzing tablets. Rapid bubbling yields moderate CO₂ enrichment in the headspace before quick seal.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Expected ΔT:</span>
              <span className="font-semibold text-amber-300">+4.5 to +5.0 °C</span>
            </div>
          </div>

          {/* Station 3 */}
          <div 
            onClick={() => setSelectedStation(3)}
            className={`cursor-pointer rounded-xl p-5 border transition-all ${
              selectedStation === 3 
                ? 'bg-slate-800/90 border-rose-500 ring-2 ring-rose-500/20 shadow-lg' 
                : 'bg-slate-800/40 border-slate-700/70 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-800/60">
                Station 3 • High CO₂
              </span>
              <span className="text-xs text-slate-400">Heavy Concentration</span>
            </div>
            <h4 className="text-base font-bold text-white mt-3">4 Fizzing Tablets</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              50 mL water + 4 fizzing tablets. Vigorous effervescence completely saturates the bottle headspace with dense CO₂ gas.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Expected ΔT:</span>
              <span className="font-semibold text-rose-300">+6.8 to +7.5 °C</span>
            </div>
          </div>
        </div>

        {setupMode === '3-bottles-one-station' && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-medium">Instructor Note on 3-Bottle Single-Station Option:</strong>
              Placing 3 bottles equidistant in front of 1 heat lamp gives direct simultaneous comparison data points. However, ensure all 3 bottles are sealed rapidly to prevent gas escape, and verify each bottle sits at exactly the same radial distance (e.g. 7 inches) from the bulb center to ensure equal radiant flux.
            </div>
          </div>
        )}
      </div>

      {/* Materials Checklist (Exact items from prompt) */}
      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-amber-400" />
              Required Lab Materials Checklist
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Confirm every item is prepared and inspected at your station before beginning.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            {materials.filter(m => m.checked).length} of {materials.length} Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {materials.map(mat => (
            <div
              key={mat.id}
              onClick={() => toggleMaterial(mat.id)}
              className={`cursor-pointer flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                mat.checked 
                  ? 'bg-slate-800/80 border-slate-700 text-slate-200' 
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
              }`}
            >
              <button 
                type="button" 
                className="mt-0.5 text-slate-400 hover:text-white"
                aria-label={`Toggle ${mat.name}`}
              >
                {mat.checked ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-semibold text-white truncate">{mat.name}</h4>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    mat.reusable ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                  }`}>
                    {mat.reusable ? 'Reusable' : 'Consumable'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{mat.quantity}</p>
                <p className="text-[11px] text-slate-400 italic mt-1">{mat.purpose}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Roles & Heat Lamp Manager Safety Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heat Lamp Manager Highlight */}
        <div className="lg:col-span-1 bg-gradient-to-b from-amber-950/40 to-slate-900 rounded-2xl p-6 border border-amber-800/50 shadow-lg relative">
          <div className="flex items-center gap-2 text-amber-400 mb-3">
            <Flame className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Critical Student Assignment</span>
          </div>
          <h3 className="text-lg font-bold text-white">Heat Lamp Manager Duties</h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Each heat lamp gets hot during the investigation. The designated Heat Lamp Manager must enforce strict safety rules:
          </p>

          <ul className="mt-4 space-y-2.5 text-xs text-slate-200">
            <li className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Clamp & Aim Outward:</strong> Firmly clamp lamp to bench pointing outward away from cords and workspace.</span>
            </li>
            <li className="flex items-start gap-2">
              <Flame className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>6-Inch Rule:</strong> Measure with a ruler to ensure the plastic bottle is at least 6 inches from bulb to prevent plastic melting.</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>No Touch Policy:</strong> Never touch the bulb or metal shade while plugged in, and for 30 minutes after unplugging.</span>
            </li>
            <li className="flex items-start gap-2">
              <Droplets className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span><strong>Dry Hands Only:</strong> Never handle plugs or switches with wet hands or near the 100-mL graduated cylinder.</span>
            </li>
          </ul>

          <div className="mt-6 pt-4 border-t border-amber-900/40 flex items-center justify-between text-xs text-amber-300">
            <span>Cooldown Period:</span>
            <span className="font-bold">30 Minutes Required</span>
          </div>
        </div>

        {/* All 4 Student Investigation Procedures */}
        <div className="lg:col-span-2 bg-slate-900/60 rounded-2xl p-6 border border-slate-800 shadow-md">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-indigo-400" />
            Independent Investigation Procedure Checklist
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STUDENT_ROLES.map((role, idx) => (
              <div key={idx} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/70">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{role.title}</h4>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">Role {idx + 1}</span>
                </div>
                <ul className="mt-2.5 space-y-1 text-xs text-slate-300">
                  {role.responsibilities.map((resp, rIdx) => (
                    <li key={rIdx} className="flex items-start gap-1.5">
                      <span className="text-amber-400 text-xs">•</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-2 border-t border-slate-700/50 text-[11px] text-indigo-300">
                  <strong>Safety focus:</strong> {role.safetyFocus}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* OpenSciEd High School Science Safety Checklist */}
      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              OpenSciEd Teacher Handbook Safety Checklist
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Verify and check off all high school lab safety considerations before starting the heat lamp.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSafetyList(prev => prev.map(s => ({ ...s, verified: true })))}
              className="text-xs px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              Verify All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {safetyList.map(rule => (
            <div
              key={rule.id}
              onClick={() => toggleSafety(rule.id)}
              className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                rule.verified 
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-200' 
                  : rule.critical 
                    ? 'bg-rose-950/20 border-rose-900/50 text-slate-300' 
                    : 'bg-slate-800/40 border-slate-800 text-slate-400'
              }`}
            >
              <button 
                type="button" 
                className="mt-0.5"
                aria-label={`Toggle safety verification for ${rule.title}`}
              >
                {rule.verified ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className={`text-xs font-bold ${rule.verified ? 'text-white' : 'text-slate-200'}`}>
                    {rule.title}
                  </h4>
                  {rule.critical && (
                    <span className="text-[10px] bg-rose-900/60 text-rose-300 px-2 py-0.5 rounded font-medium border border-rose-800/50">
                      CRITICAL
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {rule.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Disposal and Storage Procedures */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60 flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-bold text-white text-sm">Disposal Protocol</h4>
              <p className="text-slate-300 mt-1 leading-relaxed">
                All liquid waste (effervescent tablet solution) can be disposed of safely down the drain with running water. Non-reusable solids go into the garbage bin. Clean and preserve plastic bottles and modeling clay for reuse.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60 flex items-start gap-3">
            <Archive className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-bold text-white text-sm">Secure Storage Protocol</h4>
              <p className="text-slate-300 mt-1 leading-relaxed">
                Allow heat lamp to cool completely (min 30 min). Coil cords neatly. Keep heat lamps secured in a teacher supply cabinet not easily accessible by students when not in use.
              </p>
            </div>
          </div>
        </div>

        {/* Proceed to Simulator CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-800 to-indigo-950 border border-indigo-900/60">
          <div className="text-xs text-slate-300 mb-3 sm:mb-0">
            {allSafetyVerified ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> All critical safety requirements verified. You are cleared to proceed!
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Please verify all critical safety items above before starting the live experiment.
              </span>
            )}
          </div>

          <button
            id="proceed-to-lab-sim-btn"
            onClick={onProceedToSim}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition"
          >
            <span>Proceed to Interactive Bottle Lab Simulator</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
