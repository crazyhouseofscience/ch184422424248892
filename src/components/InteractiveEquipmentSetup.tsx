import React, { useState } from 'react';
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
  ShieldCheck, 
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  Check,
  ChevronRight
} from 'lucide-react';
import { StationEquipmentSetup } from '../types';
import { 
  playClampSnapSound, 
  playWaterPourSound, 
  startFizzingSound, 
  stopFizzingSound, 
  playSuccessChime,
  playLampClickSound 
} from '../utils/audio';

interface InteractiveEquipmentSetupProps {
  setup: StationEquipmentSetup;
  onUpdateSetup: (updated: Partial<StationEquipmentSetup>) => void;
  onProceedToLab: () => void;
  onProceedToGuidedLab: () => void;
}

export const InteractiveEquipmentSetup: React.FC<InteractiveEquipmentSetupProps> = ({
  setup,
  onUpdateSetup,
  onProceedToLab,
  onProceedToGuidedLab,
}) => {
  const [activeStepTab, setActiveStepTab] = useState<'station' | 'lamp' | 'bottle' | 'seal'>('station');
  const [isPouringAnimation, setIsPouringAnimation] = useState<boolean>(false);
  const [isBubbling, setIsBubbling] = useState<boolean>(false);

  // Setup completion check
  const isLampReady = setup.lampClamped && setup.lampPluggedIn && setup.lampHeightInches >= 4 && setup.lampDistanceInches >= 5;
  const isBottleReady = setup.waterAddedMl >= 45 && setup.probeInserted && setup.probePosition === 'headspace';
  const isSealReady = setup.plasticWrapApplied && setup.claySealed && setup.timerPositioned;
  const isFullySetup = isLampReady && isBottleReady && isSealReady;

  // Actions
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

  const handleHeightChange = (height: number) => {
    onUpdateSetup({ lampHeightInches: height });
  };

  const handleDistanceChange = (dist: number) => {
    onUpdateSetup({ lampDistanceInches: dist });
  };

  const handleFillCylinder = () => {
    onUpdateSetup({ cylinderFilledMl: 50 });
  };

  const handlePourWater = () => {
    if (setup.cylinderFilledMl <= 0) return;
    setIsPouringAnimation(true);
    playWaterPourSound();
    setTimeout(() => {
      onUpdateSetup({ 
        waterAddedMl: 50,
        cylinderFilledMl: 0 
      });
      setIsPouringAnimation(false);
    }, 700);
  };

  const handleAddTablets = (count: number) => {
    onUpdateSetup({ tabletsAdded: count });
    if (count > 0 && setup.waterAddedMl > 0) {
      setIsBubbling(true);
      startFizzingSound();
      setTimeout(() => {
        setIsBubbling(false);
        stopFizzingSound();
      }, 3500);
    }
  };

  const handleInsertProbe = (pos: 'headspace' | 'submerged') => {
    onUpdateSetup({ 
      probeInserted: true, 
      probePosition: pos 
    });
  };

  const handleApplyWrap = () => {
    onUpdateSetup({ plasticWrapApplied: !setup.plasticWrapApplied });
  };

  const handleApplyClay = () => {
    onUpdateSetup({ claySealed: !setup.claySealed });
  };

  const handleFastenBand = () => {
    onUpdateSetup({ fastenedWithBand: !setup.fastenedWithBand });
  };

  const handleSetTimer = () => {
    onUpdateSetup({ timerPositioned: true });
    playClampSnapSound();
  };

  const handleResetSetup = () => {
    if (window.confirm('Reset all equipment setup adjustments back to starting state?')) {
      onUpdateSetup({
        lampClamped: false,
        lampPluggedIn: false,
        lampHeightInches: 4,
        lampDistanceInches: 12,
        waterAddedMl: 0,
        cylinderFilledMl: 0,
        tabletsAdded: setup.selectedStation === 1 ? 0 : setup.selectedStation === 2 ? 2 : 4,
        probeInserted: false,
        probePosition: 'outside',
        plasticWrapApplied: false,
        claySealed: false,
        fastenedWithBand: false,
        timerPositioned: false,
        isComplete: false,
      });
    }
  };

  const handleCompleteAndLaunch = (destination: 'workbench' | 'guided') => {
    onUpdateSetup({ isComplete: true });
    playSuccessChime();
    if (destination === 'workbench') {
      onProceedToLab();
    } else {
      onProceedToGuidedLab();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner: Hands-on Setup Mandatory Requirement */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-7 border border-indigo-900/60 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Independent Virtual Lab Prep & Apparatus Assembly (Required Step)
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Station Equipment Assembly & Calibration
          </h2>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            Before powering on the heat lamp, set up your station near the electrical outlet. Adjust the 
            <span className="text-amber-300 font-semibold"> lamp height</span>, clamp the fixture pointing outward, set the 
            <span className="text-amber-300 font-semibold"> distance from the bottle</span>, measure and add 
            <span className="text-sky-300 font-semibold"> 50 mL of water</span>, drop the assigned fizzing tablets, and make an airtight seal around the thermometer probe.
          </p>

          {/* Quick Setup Checklist Bar */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
              setup.lampClamped && setup.lampPluggedIn 
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}>
              {setup.lampClamped && setup.lampPluggedIn ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-slate-500 text-[10px] flex items-center justify-center">1</div>}
              <span className="truncate font-medium">Lamp Clamped & Plugged</span>
            </div>

            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
              setup.lampHeightInches >= 4 && setup.lampDistanceInches >= 5 
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}>
              {setup.lampHeightInches >= 4 && setup.lampDistanceInches >= 5 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-slate-500 text-[10px] flex items-center justify-center">2</div>}
              <span className="truncate font-medium">Height & Distance Set</span>
            </div>

            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
              setup.waterAddedMl >= 45 
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}>
              {setup.waterAddedMl >= 45 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-slate-500 text-[10px] flex items-center justify-center">3</div>}
              <span className="truncate font-medium">50 mL Water Added</span>
            </div>

            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
              setup.claySealed && setup.plasticWrapApplied 
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}>
              {setup.claySealed && setup.plasticWrapApplied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-slate-500 text-[10px] flex items-center justify-center">4</div>}
              <span className="truncate font-medium">Airtight Clay Seal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Classroom Station Mode Selector */}
      <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Classroom Station Configuration
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Follow the teacher setup: 3 separate stations in the classroom, or 3 bottles at one heat lamp.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateSetup({ stationMode: '3-stations' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                setup.stationMode === '3-stations'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Option 1: 3 Classroom Stations (1 Lamp per Station)
            </button>
            <button
              onClick={() => onUpdateSetup({ stationMode: '3-bottles-one-station' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                setup.stationMode === '3-bottles-one-station'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Option 2: 3 Bottles at 1 Heat Lamp
            </button>
          </div>
        </div>

        {/* 3 Stations Cards */}
        {setup.stationMode === '3-stations' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
            {/* Station 1 */}
            <div
              onClick={() => {
                onUpdateSetup({ 
                  selectedStation: 1, 
                  tabletsAdded: 0 
                });
              }}
              className={`cursor-pointer rounded-xl p-4 border transition ${
                setup.selectedStation === 1
                  ? 'bg-slate-800/90 border-sky-500 ring-2 ring-sky-500/20'
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 bg-sky-950/70 px-2 py-0.5 rounded border border-sky-800/60">
                  Station 1 • Control
                </span>
                <span className="text-[11px] text-slate-400">Ambient Air</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-2">0 Fizzing Tablets</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                1 plastic water bottle with 50 mL room-temp water. No tablets added. Serves as baseline air control (~420 ppm).
              </p>
              <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Assigned Heat Lamp:</span>
                <span className="font-semibold text-sky-300">Lamp #1 (Clamped)</span>
              </div>
            </div>

            {/* Station 2 */}
            <div
              onClick={() => {
                onUpdateSetup({ 
                  selectedStation: 2, 
                  tabletsAdded: 2 
                });
              }}
              className={`cursor-pointer rounded-xl p-4 border transition ${
                setup.selectedStation === 2
                  ? 'bg-slate-800/90 border-amber-500 ring-2 ring-amber-500/20'
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-800/60">
                  Station 2 • Medium CO₂
                </span>
                <span className="text-[11px] text-slate-400">Elevated</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-2">2 Fizzing Tablets</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                1 plastic water bottle with 50 mL water + 2 fizzing tablets. Effervescing CO₂ enriches bottle headspace before quick sealing.
              </p>
              <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Assigned Heat Lamp:</span>
                <span className="font-semibold text-amber-300">Lamp #2 (Clamped)</span>
              </div>
            </div>

            {/* Station 3 */}
            <div
              onClick={() => {
                onUpdateSetup({ 
                  selectedStation: 3, 
                  tabletsAdded: 4 
                });
              }}
              className={`cursor-pointer rounded-xl p-4 border transition ${
                setup.selectedStation === 3
                  ? 'bg-slate-800/90 border-rose-500 ring-2 ring-rose-500/20'
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/70 px-2 py-0.5 rounded border border-rose-800/60">
                  Station 3 • High CO₂
                </span>
                <span className="text-[11px] text-slate-400">Heavy Saturation</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-2">4 Fizzing Tablets</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                1 plastic water bottle with 50 mL water + 4 fizzing tablets. Heavy CO₂ saturation produces maximum heat trapping.
              </p>
              <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Assigned Heat Lamp:</span>
                <span className="font-semibold text-rose-300">Lamp #3 (Clamped)</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white font-medium block">Option 2: 3 Bottles at One Heat Lamp Station</strong>
                Placing 3 plastic water bottles (0, 2, and 4 tablets) in a semicircle in front of 1 heat lamp provides simultaneous comparison data points. However, this is more difficult in real lab conditions due to the necessity of quickly sealing all 3 bottles before carbon dioxide gas escapes.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Interactive Assembly Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Step Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveStepTab('station')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 ${
                activeStepTab === 'station'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>1. Clamp & Outlet</span>
              {setup.lampClamped && setup.lampPluggedIn && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              onClick={() => setActiveStepTab('lamp')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 ${
                activeStepTab === 'lamp'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>2. Height & Distance</span>
              {setup.lampHeightInches >= 4 && setup.lampDistanceInches >= 5 && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              onClick={() => setActiveStepTab('bottle')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 ${
                activeStepTab === 'bottle'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>3. Water & Tablets</span>
              {setup.waterAddedMl >= 45 && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              onClick={() => setActiveStepTab('seal')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 ${
                activeStepTab === 'seal'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>4. Probe & Seal</span>
              {setup.claySealed && setup.plasticWrapApplied && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>

          {/* TAB 1: Clamp & Outlet */}
          {activeStepTab === 'station' && (
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  Heat Lamp Placement, Clamp & Electrical Cord
                </h4>
                <span className="text-[11px] text-slate-400">Step 1 of 4</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Each heat lamp consists of a bulb, metal lampshade, electrical cord, and clamp. Clamp the fixture securely to the lab bench or stand pointing outward, near a safe electrical outlet.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Clamp Button */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                  setup.lampClamped 
                    ? 'bg-emerald-950/30 border-emerald-800/80 text-white' 
                    : 'bg-slate-800/50 border-slate-700 text-slate-300'
                }`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fixture Clamp</span>
                      {setup.lampClamped ? (
                        <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded font-bold">Clamped ✓</span>
                      ) : (
                        <span className="text-[10px] bg-amber-900/80 text-amber-300 px-2 py-0.5 rounded font-bold">Unclamped</span>
                      )}
                    </div>
                    <p className="text-xs mt-2 text-slate-300">
                      Attach clamp to lab stand or bench edge pointing outward away from electrical cords.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleClamp}
                    className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      setup.lampClamped
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20'
                    }`}
                  >
                    {setup.lampClamped ? 'Unclamp Lamp' : 'Clamp Lamp to Stand / Bench'}
                  </button>
                </div>

                {/* Electrical Plug Button */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                  setup.lampPluggedIn 
                    ? 'bg-emerald-950/30 border-emerald-800/80 text-white' 
                    : 'bg-slate-800/50 border-slate-700 text-slate-300'
                }`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Electrical Cord</span>
                      {setup.lampPluggedIn ? (
                        <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded font-bold">Plugged In ✓</span>
                      ) : (
                        <span className="text-[10px] bg-amber-900/80 text-amber-300 px-2 py-0.5 rounded font-bold">Unplugged</span>
                      )}
                    </div>
                    <p className="text-xs mt-2 text-slate-300">
                      Route cord away from water vessels and plug into the designated classroom GFI electrical outlet.
                    </p>
                  </div>
                  <button
                    onClick={handleTogglePlug}
                    className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      setup.lampPluggedIn
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {setup.lampPluggedIn ? 'Unplug Electrical Cord' : 'Plug Cord into Outlet'}
                  </button>
                </div>
              </div>

              {/* Next Step CTA */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveStepTab('lamp')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow"
                >
                  <span>Next: Adjust Height & Distance</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Height & Distance */}
          {activeStepTab === 'lamp' && (
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-md space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  Adjust Height of Lamp & Distance from Bottle
                </h4>
                <span className="text-[11px] text-slate-400">Step 2 of 4</span>
              </div>

              {/* Lamp Height Slider */}
              <div className="space-y-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Lamp Vertical Height:</span>
                    <span className="text-amber-400 font-mono text-sm">{setup.lampHeightInches} inches</span>
                    <span className="text-slate-400 font-normal text-[11px]">({(setup.lampHeightInches * 2.54).toFixed(1)} cm)</span>
                  </label>
                  <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800/60">
                    Recommended: 6–8 in
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={14}
                  step={1}
                  value={setup.lampHeightInches}
                  onChange={e => handleHeightChange(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-700 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>2" (Low table level)</span>
                  <span>7" (Standard lab height)</span>
                  <span>14" (Elevated)</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Align the center of the metal lampshade with the middle of the plastic bottle's headspace so radiant energy is centered on the gas column.
                </p>
              </div>

              {/* Lamp Distance from Bottle Slider */}
              <div className="space-y-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Distance from Bottle Wall:</span>
                    <span className="text-sky-400 font-mono text-sm">{setup.lampDistanceInches} inches</span>
                    <span className="text-slate-400 font-normal text-[11px]">({(setup.lampDistanceInches * 2.54).toFixed(1)} cm)</span>
                  </label>
                  <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800/60">
                    Standard: 6–8 in
                  </span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={14}
                  step={1}
                  value={setup.lampDistanceInches}
                  onChange={e => handleDistanceChange(Number(e.target.value))}
                  className="w-full accent-sky-500 bg-slate-700 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>4" (Too close / danger)</span>
                  <span>7" (Optimal 6-8 in)</span>
                  <span>14" (Low radiation flux)</span>
                </div>

                {setup.lampDistanceInches < 5 ? (
                  <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-[11px] text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span><strong>Hazard Warning:</strong> Lamp is closer than 5 inches! Heat from the 150W bulb could deform or melt the plastic bottle. Maintain at least 6 inches.</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-300">
                    Rigorous scientific control: Every station must maintain the exact same distance (6–8 in) so differences in temperature are due solely to carbon dioxide concentration!
                  </p>
                )}
              </div>

              {/* Navigation */}
              <div className="pt-2 flex justify-between">
                <button
                  onClick={() => setActiveStepTab('station')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Back to Clamp
                </button>
                <button
                  onClick={() => setActiveStepTab('bottle')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow"
                >
                  <span>Next: Measure Water & Tablets</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Water & Tablets */}
          {activeStepTab === 'bottle' && (
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  Measure & Add Water (100-mL Cylinder) & Fizzing Tablets
                </h4>
                <span className="text-[11px] text-slate-400">Step 3 of 4</span>
              </div>

              {/* Graduated Cylinder Interactive Pouring Widget */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">100-mL Graduated Cylinder</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-300">
                    {setup.waterAddedMl > 0 ? '50 mL in Bottle ✓' : `${setup.cylinderFilledMl} mL in Cylinder`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={handleFillCylinder}
                    disabled={setup.waterAddedMl >= 50 || setup.cylinderFilledMl >= 50}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      setup.cylinderFilledMl >= 50
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-cyan-700 hover:bg-cyan-600 text-white shadow'
                    }`}
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    1. Fill Cylinder to 50 mL
                  </button>

                  <button
                    onClick={handlePourWater}
                    disabled={setup.cylinderFilledMl < 50 || setup.waterAddedMl >= 50}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      setup.waterAddedMl >= 50
                        ? 'bg-emerald-800/80 text-emerald-200 cursor-default'
                        : setup.cylinderFilledMl >= 50
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow animate-pulse'
                          : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    2. Pour into Plastic Bottle
                  </button>
                </div>

                {setup.waterAddedMl >= 50 ? (
                  <p className="text-[11px] text-emerald-300 flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 50 mL of room-temperature water is now measured and added to the bottle.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Use the 100-mL graduated cylinder to accurately measure 50 mL of water, then pour it into the plastic bottle.
                  </p>
                )}
              </div>

              {/* Fizzing Tablets Section */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Assigned Effervescent Fizzing Tablets</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400">
                    {setup.tabletsAdded} Tablets Selected
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleAddTablets(0)}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold border transition ${
                      setup.tabletsAdded === 0
                        ? 'bg-sky-900/60 border-sky-500 text-sky-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    0 Tablets (Control)
                  </button>
                  <button
                    onClick={() => handleAddTablets(2)}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold border transition ${
                      setup.tabletsAdded === 2
                        ? 'bg-amber-900/60 border-amber-500 text-amber-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    2 Tablets (Medium)
                  </button>
                  <button
                    onClick={() => handleAddTablets(4)}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold border transition ${
                      setup.tabletsAdded === 4
                        ? 'bg-rose-900/60 border-rose-500 text-rose-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    4 Tablets (High CO₂)
                  </button>
                </div>

                <p className="text-[11px] text-slate-300">
                  {setup.tabletsAdded === 0 && 'Station 1 Control: 0 tablets ensures only ambient atmospheric air is in the bottle.'}
                  {setup.tabletsAdded === 2 && 'Station 2: 2 tablets react with water to generate moderate CO₂ gas saturation in the headspace.'}
                  {setup.tabletsAdded === 4 && 'Station 3: 4 tablets produce rapid bubbling and high concentration CO₂.'}
                </p>
              </div>

              {/* Navigation */}
              <div className="pt-2 flex justify-between">
                <button
                  onClick={() => setActiveStepTab('lamp')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Back to Height
                </button>
                <button
                  onClick={() => setActiveStepTab('seal')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow"
                >
                  <span>Next: Insert Probe & Seal</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Probe & Seal */}
          {activeStepTab === 'seal' && (
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-rose-400" />
                  Thermometer Probe Placement & Modeling Clay Seal
                </h4>
                <span className="text-[11px] text-slate-400">Step 4 of 4</span>
              </div>

              {/* Probe Placement Selection */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Digital Thermometer Metal Probe Placement:</label>
                  {setup.probeInserted ? (
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                      Probe Inserted ✓
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                      Pending
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleInsertProbe('headspace')}
                    className={`p-3 rounded-lg text-xs font-semibold border text-left transition ${
                      setup.probePosition === 'headspace'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span>In Air Headspace</span>
                      <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-1.5 py-0.2 rounded font-mono">CORRECT</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Probe suspended in air above water. Measures gas warming directly.
                    </p>
                  </button>

                  <button
                    onClick={() => handleInsertProbe('submerged')}
                    className={`p-3 rounded-lg text-xs font-semibold border text-left transition ${
                      setup.probePosition === 'submerged'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span>Submerged in Water</span>
                      <span className="text-[10px] bg-rose-900/80 text-rose-300 px-1.5 py-0.2 rounded font-mono">INCORRECT</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Submerging measures water heating, not the air greenhouse effect!
                    </p>
                  </button>
                </div>
              </div>

              {/* Airtight Sealing Controls */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <span className="text-xs font-bold text-white block">Airtight Containment Protocol:</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={handleApplyWrap}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition flex items-center justify-between ${
                      setup.plasticWrapApplied
                        ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Plastic Wrap Sheet</span>
                    {setup.plasticWrapApplied ? <Check className="w-3.5 h-3.5 text-indigo-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                  </button>

                  <button
                    onClick={handleApplyClay}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition flex items-center justify-between ${
                      setup.claySealed
                        ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Modeling Clay Plug</span>
                    {setup.claySealed ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                  </button>

                  <button
                    onClick={handleFastenBand}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition flex items-center justify-between ${
                      setup.fastenedWithBand
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Rubber Band / Tape</span>
                    {setup.fastenedWithBand ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-300">Station Timer (15-min stopwatch):</span>
                  </div>
                  <button
                    onClick={handleSetTimer}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                      setup.timerPositioned
                        ? 'bg-emerald-900/60 border border-emerald-700 text-emerald-300'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {setup.timerPositioned ? 'Timer Ready (00:00) ✓' : 'Position Timer at Station'}
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <div className="pt-2 flex justify-between">
                <button
                  onClick={() => setActiveStepTab('bottle')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Back to Water
                </button>
              </div>
            </div>
          )}

          {/* Setup Verification & Launch Bar */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/70 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Station Verification Status</h4>
                <p className="text-xs text-white mt-0.5">
                  {isFullySetup ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      All apparatus items verified! Ready to conduct the greenhouse heat experiment.
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Complete all 4 tabs above (clamp, height/distance, water, and seal) to unlock the live lab.
                    </span>
                  )}
                </p>
              </div>

              <button
                onClick={handleResetSetup}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 self-start sm:self-auto"
                title="Reset apparatus configuration"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Setup</span>
              </button>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={() => handleCompleteAndLaunch('workbench')}
                disabled={!isFullySetup}
                className={`flex-1 w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isFullySetup
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <span>Launch Virtual Bottle Lab with this Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleCompleteAndLaunch('guided')}
                disabled={!isFullySetup}
                className={`w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isFullySetup
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Guided CO₂ Wizard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: High-Fidelity SVG Interactive Workbench Render (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Live Apparatus Visualizer</span>
              </div>
              <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                Scale: Real Proportions
              </span>
            </div>

            {/* SVG Interactive Canvas */}
            <div className="mt-3 relative w-full aspect-[4/3] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
              {/* Distance and Height readouts overlay */}
              <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 text-[10px] font-mono bg-slate-900/80 backdrop-blur-sm p-1.5 rounded-lg border border-slate-800">
                <span className="text-amber-400">Height: {setup.lampHeightInches}"</span>
                <span className="text-sky-400">Distance: {setup.lampDistanceInches}"</span>
                <span className="text-cyan-400">Water: {setup.waterAddedMl} mL</span>
              </div>

              {/* Outlet Indicator */}
              <div className="absolute top-4 left-3 z-0 flex flex-col items-center opacity-80">
                <div className="w-6 h-8 bg-slate-800 rounded border border-slate-700 flex flex-col items-center justify-center gap-1 p-0.5">
                  <div className="w-2 h-1 bg-slate-950 rounded-sm" />
                  <div className="w-2 h-1 bg-slate-950 rounded-sm" />
                </div>
                <span className="text-[8px] text-slate-500 font-mono mt-0.5">Outlet</span>
              </div>

              <svg 
                viewBox="0 0 400 300" 
                className="w-full h-full select-none"
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
              >
                <defs>
                  {/* Gradients */}
                  <linearGradient id="shadeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#94a3b8" />
                    <stop offset="70%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>

                  <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
                    <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
                  </radialGradient>

                  <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
                  </linearGradient>

                  <linearGradient id="clayGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="50%" stopColor="#b45309" />
                    <stop offset="100%" stopColor="#78350f" />
                  </linearGradient>
                </defs>

                {/* Lab Bench Surface */}
                <line x1="20" y1="260" x2="380" y2="260" stroke="#334155" strokeWidth="4" />
                <rect x="20" y="262" width="360" height="20" fill="#1e293b" />

                {/* Cord running from wall outlet (x: 25, y: 35) to clamp base */}
                {setup.lampPluggedIn && (
                  <path
                    d={`M 25 35 C 30 120, 40 200, 75 ${255 - (setup.lampHeightInches - 2) * 8}`}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                )}

                {/* Stand & Clamp */}
                <rect x="68" y="50" width="8" height="210" fill="#64748b" rx="2" />
                <rect x="50" y="256" width="44" height="6" fill="#475569" rx="2" />

                {/* Clamp position depends on lampHeightInches (2" -> y: 240, 14" -> y: 70) */}
                {(() => {
                  const clampY = 245 - (setup.lampHeightInches - 2) * 14;
                  // Lamp horizontal position depends on lampDistanceInches (4" -> bottle is closer, 14" -> bottle further)
                  // Let lamp base be at x: 75, shade extends rightward to x: 120
                  // Bottle position x depends on distance:
                  const bottleX = 140 + (setup.lampDistanceInches - 4) * 16;

                  return (
                    <g>
                      {/* Clamp attached to stand */}
                      {setup.lampClamped && (
                        <g>
                          <rect x="62" y={clampY - 8} width="20" height="16" fill="#334155" rx="3" stroke="#475569" />
                          <circle cx="72" cy={clampY} r="3" fill="#cbd5e1" />
                          {/* Clamp arm pointing outward toward the right */}
                          <path d={`M 82 ${clampY} L 105 ${clampY}`} stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
                          
                          {/* Metal Lampshade pointing outward (right) */}
                          <path
                            d={`M 105 ${clampY - 14} L 140 ${clampY - 32} L 140 ${clampY + 32} L 105 ${clampY + 14} Z`}
                            fill="url(#shadeGrad)"
                            stroke="#cbd5e1"
                            strokeWidth="1.2"
                          />
                          {/* Bulb inside metal lampshade */}
                          <circle cx="122" cy={clampY} r="12" fill="url(#bulbGlow)" />
                          <circle cx="122" cy={clampY} r="6" fill="#fff" opacity="0.9" />

                          {/* Radiant Energy Rays */}
                          <g opacity="0.6">
                            <line x1="142" y1={clampY - 20} x2={bottleX - 25} y2={clampY - 20} stroke="#fde047" strokeWidth="1" strokeDasharray="3 3" />
                            <line x1="142" y1={clampY} x2={bottleX - 25} y2={clampY} stroke="#fde047" strokeWidth="1.5" strokeDasharray="4 2" />
                            <line x1="142" y1={clampY + 20} x2={bottleX - 25} y2={clampY + 20} stroke="#fde047" strokeWidth="1" strokeDasharray="3 3" />
                          </g>

                          {/* Distance Tape Measure Ruler Line */}
                          <g opacity="0.85">
                            <line x1="140" y1="245" x2={bottleX} y2="245" stroke="#38bdf8" strokeWidth="2" strokeDasharray="2 2" />
                            <line x1="140" y1="240" x2="140" y2="250" stroke="#38bdf8" strokeWidth="2" />
                            <line x1={bottleX} y1="240" x2={bottleX} y2="250" stroke="#38bdf8" strokeWidth="2" />
                            <text x={(140 + bottleX) / 2} y="240" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                              {setup.lampDistanceInches}" distance
                            </text>
                          </g>

                          {/* Height Ruler on Stand */}
                          <g opacity="0.8">
                            <line x1="56" y1="260" x2="56" y2={clampY} stroke="#f59e0b" strokeWidth="2" />
                            <line x1="52" y1={clampY} x2="60" y2={clampY} stroke="#f59e0b" strokeWidth="2" />
                            <text x="48" y={(260 + clampY) / 2} fill="#f59e0b" fontSize="9" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                              {setup.lampHeightInches}"
                            </text>
                          </g>
                        </g>
                      )}

                      {/* Plastic Water Bottle Assembly */}
                      <g transform={`translate(${bottleX}, 130)`}>
                        {/* Bottle Body: 40 wide, 130 tall, sitting on bench (y: 260 -> relative y: 130) */}
                        {/* Bottle Contour */}
                        <path
                          d="M -12 -5 
                             L 12 -5 
                             L 12 10 
                             L 22 25 
                             L 22 125 
                             C 22 128, 18 130, 10 130 
                             L -10 130 
                             C -18 130, -22 128, -22 125 
                             L -22 25 
                             L -12 10 Z"
                          fill="#0f172a"
                          fillOpacity="0.4"
                          stroke="#94a3b8"
                          strokeWidth="2"
                        />

                        {/* 50 mL Water at bottom (height: ~35px) */}
                        {setup.waterAddedMl > 0 && (
                          <g>
                            <path
                              d="M -21 95 
                                 L 21 95 
                                 L 21 125 
                                 C 21 128, 18 129, 10 129 
                                 L -10 129 
                                 C -18 129, -21 128, -21 125 Z"
                              fill="url(#waterGrad)"
                            />
                            {/* Water Surface Meniscus */}
                            <ellipse cx="0" cy="95" rx="20.5" ry="3.5" fill="#7dd3fc" opacity="0.8" />
                          </g>
                        )}

                        {/* Fizzing Bubbles if tablets added & bubbling */}
                        {(isBubbling || setup.tabletsAdded > 0) && setup.waterAddedMl > 0 && (
                          <g opacity="0.9">
                            <circle cx="-6" cy="115" r="2.5" fill="#f8fafc" />
                            <circle cx="4" cy="118" r="3" fill="#f8fafc" />
                            <circle cx="8" cy="105" r="2" fill="#f8fafc" />
                            <circle cx="-10" cy="100" r="2" fill="#f8fafc" />
                            <circle cx="2" cy="92" r="1.5" fill="#f8fafc" />
                            {/* Rising CO2 particles into headspace */}
                            <circle cx="-4" cy="70" r="2" fill="#fef08a" opacity="0.7" />
                            <circle cx="6" cy="50" r="2.5" fill="#fef08a" opacity="0.7" />
                            <circle cx="-2" cy="35" r="3" fill="#fef08a" opacity="0.7" />
                          </g>
                        )}

                        {/* Thermometer Probe */}
                        {setup.probeInserted && (
                          <g>
                            {/* Metal Probe Rod */}
                            <line 
                              x1="0" 
                              y1="-15" 
                              x2="0" 
                              y2={setup.probePosition === 'headspace' ? '50' : '110'} 
                              stroke="#cbd5e1" 
                              strokeWidth="3" 
                              strokeLinecap="round" 
                            />
                            {/* Metal Probe Tip */}
                            <circle 
                              cx="0" 
                              cy={setup.probePosition === 'headspace' ? '50' : '110'} 
                              r="2.5" 
                              fill="#94a3b8" 
                            />
                            {/* Wire leading to digital display */}
                            <path 
                              d="M 0 -15 C 10 -25, 30 -30, 45 10" 
                              fill="none" 
                              stroke="#e2e8f0" 
                              strokeWidth="1.5" 
                            />
                          </g>
                        )}

                        {/* Plastic Wrap & Clay Seal around Bottle Neck */}
                        {setup.plasticWrapApplied && (
                          <rect x="-15" y="-7" width="30" height="7" fill="#cbd5e1" opacity="0.6" rx="1" />
                        )}

                        {setup.claySealed && (
                          <path
                            d="M -14 -6 Q 0 -14 14 -6 L 12 3 Q 0 8 -12 3 Z"
                            fill="url(#clayGrad)"
                            stroke="#78350f"
                            strokeWidth="1"
                          />
                        )}

                        {setup.fastenedWithBand && (
                          <line x1="-13" y1="-2" x2="13" y2="-2" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                        )}

                        {/* Label on Bottle */}
                        <rect x="-16" y="60" width="32" height="18" fill="#1e293b" opacity="0.85" rx="2" />
                        <text x="0" y="72" fill="#f8fafc" fontSize="8" fontWeight="bold" textAnchor="middle">
                          {setup.tabletsAdded} TABS
                        </text>
                      </g>

                      {/* Digital Thermometer Unit on Bench */}
                      <g transform={`translate(${bottleX + 40}, 235)`}>
                        <rect x="0" y="0" width="34" height="22" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <rect x="3" y="3" width="28" height="12" rx="1" fill="#0f172a" />
                        <text x="17" y="12" fill="#4ade80" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                          21.0°C
                        </text>
                        <text x="17" y="19" fill="#94a3b8" fontSize="6" textAnchor="middle">
                          PROBE
                        </text>
                      </g>

                      {/* Digital Timer Unit on Bench */}
                      {setup.timerPositioned && (
                        <g transform={`translate(${bottleX - 70}, 236)`}>
                          <rect x="0" y="0" width="34" height="20" rx="3" fill="#334155" stroke="#64748b" strokeWidth="1" />
                          <rect x="3" y="3" width="28" height="10" rx="1" fill="#020617" />
                          <text x="17" y="11" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                            00:00
                          </text>
                          <circle cx="10" cy="16" r="2" fill="#e2e8f0" />
                          <circle cx="24" cy="16" r="2" fill="#ef4444" />
                        </g>
                      )}
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Independent Setup Notes */}
          <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>Independent Investigation Setup</span>
            </div>
            <p>
              Each virtual station operates 1 heat lamp clamped to a stand pointing outward. Calibrate your station carefully to ensure reliable and repeatable data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
