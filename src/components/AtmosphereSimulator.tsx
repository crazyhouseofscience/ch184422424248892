import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe2, 
  Sun, 
  Layers, 
  Sparkles, 
  Flame, 
  RotateCcw, 
  Info, 
  ArrowDown, 
  ArrowUp, 
  Sliders, 
  Eye
} from 'lucide-react';
import { PLANETARY_BODIES } from '../data/labData';
import { PlanetaryAtmosphere } from '../types';

export const AtmosphereSimulator: React.FC = () => {
  // Preset selection
  const [selectedPlanet, setSelectedPlanet] = useState<string>('earth-modern');

  // Interactive custom sliders
  const [customCO2, setCustomCO2] = useState<number>(424);
  const [customSolar, setCustomSolar] = useState<number>(1361);
  const [customAlbedo, setCustomAlbedo] = useState<number>(30); // 30% Earth albedo
  const [greenhouseStrength, setGreenhouseStrength] = useState<number>(1.0);
  const [showPhotons, setShowPhotons] = useState<boolean>(true);
  const [moleculeView, setMoleculeView] = useState<'co2' | 'h2o' | 'ch4'>('co2');

  const currentPreset = PLANETARY_BODIES.find(p => p.id === selectedPlanet) || PLANETARY_BODIES[0];

  const handleSelectPreset = (id: string) => {
    setSelectedPlanet(id);
    const preset = PLANETARY_BODIES.find(p => p.id === id);
    if (preset) {
      setCustomCO2(preset.co2LevelPpm);
      setCustomSolar(preset.solarIrradiance);
    }
  };

  // Atmospheric physics calculation:
  // Effective incoming solar: S_eff = (Solar / 4) * (1 - albedo)
  // Greenhouse forcing: Delta F = 5.35 * ln(C / 280) + base_natural_greenhouse
  // T_effective = (S_eff / sigma)^0.25 - 273.15
  const S_eff = (customSolar / 4) * (1 - customAlbedo / 100);
  const sigma = 5.67e-8;
  const T_no_gh = Math.pow(S_eff / sigma, 0.25) - 273.15;

  // Radiative forcing from CO2 relative to 280 ppm
  const logRatio = customCO2 > 0 ? Math.log(Math.max(customCO2, 10) / 280) : -5;
  const co2Forcing = 5.35 * logRatio; // W/m2
  
  // Natural greenhouse effect baseline is ~33°C on Earth with ~150 W/m2 back radiation
  const naturalGHE = selectedPlanet === 'earth-nogreenhouse' ? 0 : 32.0;
  const totalWarming = selectedPlanet === 'venus' 
    ? 507 
    : selectedPlanet === 'mars' 
      ? 5 
      : selectedPlanet === 'earth-nogreenhouse'
        ? 0
        : Math.max(0, naturalGHE + co2Forcing * 0.75 * greenhouseStrength);

  const finalSurfaceTempC = Number((T_no_gh + totalWarming).toFixed(1));
  const finalSurfaceTempF = Number(((finalSurfaceTempC * 9) / 5 + 32).toFixed(1));

  // Canvas ref for animated photon particles
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!showPhotons) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = canvas.width;
    const height = canvas.height;

    // Photons state: visible (incoming sun) and infrared (outgoing earth / trapped)
    interface Photon {
      x: number;
      y: number;
      vx: number;
      vy: number;
      type: 'solar-visible' | 'thermal-ir' | 'reflected-solar';
      trappedCount: number;
    }

    const photons: Photon[] = [];
    const maxPhotons = 70;

    for (let i = 0; i < maxPhotons; i++) {
      photons.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: Math.random() > 0.4 ? 1.5 : -1.2,
        type: Math.random() > 0.5 ? 'solar-visible' : 'thermal-ir',
        trappedCount: 0,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw atmosphere layer gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.2)');
      grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
      grad.addColorStop(0.85, 'rgba(239, 68, 68, 0.05)');
      grad.addColorStop(1, 'rgba(30, 41, 59, 0.4)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw planet surface line
      ctx.fillStyle = selectedPlanet === 'venus' ? '#78350f' : selectedPlanet === 'mars' ? '#991b1b' : '#15803d';
      ctx.fillRect(0, height - 35, width, 35);

      // Label surface
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px sans-serif';
      ctx.fillText('Planetary Surface Absorbing Energy', 15, height - 12);

      // Update and draw photons
      const co2DensityFactor = Math.min(1.0, (customCO2 / 1000) * greenhouseStrength);

      photons.forEach(p => {
        // Solar visible photons stream downwards towards surface
        if (p.type === 'solar-visible') {
          p.y += 1.8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#fde047'; // bright solar yellow
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 6;
          ctx.fill();

          // Hits surface -> converted into thermal IR or reflected
          if (p.y >= height - 35) {
            if (Math.random() < customAlbedo / 100) {
              p.type = 'reflected-solar';
              p.vy = -1.8;
            } else {
              p.type = 'thermal-ir';
              p.vy = -1.5;
            }
          }
        } else if (p.type === 'reflected-solar') {
          p.y += p.vy;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#fef08a';
          ctx.fill();
          if (p.y <= 0) {
            p.y = 0;
            p.type = 'solar-visible';
            p.x = Math.random() * width;
          }
        } else {
          // Thermal IR Photons (radiated upward from ground)
          p.y += p.vy;
          p.x += p.vx;

          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#f43f5e'; // infrared magenta/red
          ctx.shadowColor = '#fb7185';
          ctx.shadowBlur = 8;
          ctx.fill();

          // Absorption and re-radiation by CO2 molecule in middle atmosphere
          if (p.y > 40 && p.y < height - 60 && Math.random() < 0.015 * (1 + co2DensityFactor * 4)) {
            // Absorbed by greenhouse gas! Re-emit in random direction (often back down to surface!)
            p.vy = Math.random() > 0.45 ? 1.4 : -1.4;
            p.vx = (Math.random() - 0.5) * 2;
            p.trappedCount++;
          }

          // Escaped to space
          if (p.y <= 0) {
            p.y = 0;
            p.type = 'solar-visible';
            p.x = Math.random() * width;
            p.trappedCount = 0;
          }

          // Re-absorbed by ground (greenhouse back-radiation!)
          if (p.y >= height - 35 && p.vy > 0) {
            p.vy = -1.5;
            p.vx = (Math.random() - 0.5) * 1.5;
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [showPhotons, customCO2, customSolar, customAlbedo, greenhouseStrength, selectedPlanet]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold mb-2">
          <Sparkles className="w-4 h-4" />
          Module 7: Planetary Atmospheric Conditions & Radiative Balance
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Greenhouse Effect & Atmospheric Simulator
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
          Compare how atmospheric composition across Earth, Venus, Mars, and paleoclimate conditions governs surface equilibrium temperatures. Witness how greenhouse gas molecules absorb outgoing thermal infrared and re-radiate heat back to the surface.
        </p>
      </div>

      {/* Planetary Atmosphere Comparison Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {PLANETARY_BODIES.map(planet => {
          const isSelected = selectedPlanet === planet.id;
          return (
            <button
              key={planet.id}
              onClick={() => handleSelectPreset(planet.id)}
              className={`text-left p-3.5 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-indigo-950/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {planet.distanceFromSunAU} AU
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                )}
              </div>
              <h4 className="text-xs font-bold text-white mt-1.5 line-clamp-1">{planet.name}</h4>
              <div className="mt-2 text-[11px] font-mono font-bold text-amber-300">
                {planet.actualSurfaceTempC}°C
              </div>
              <div className="text-[10px] text-slate-400">
                GHE: +{planet.greenhouseWarmingC}°C
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Simulation Viewport & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Animated Photon Radiation Stage (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Atmospheric Radiation Column: Visible Solar vs. Trapped Thermal IR
              </h3>
            </div>
            <button
              onClick={() => setShowPhotons(!showPhotons)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white"
            >
              {showPhotons ? 'Hide Photons' : 'Show Photons'}
            </button>
          </div>

          {/* Canvas Viewport */}
          <div className="relative w-full h-80 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <canvas
              ref={canvasRef}
              width={560}
              height={320}
              className="w-full h-full block"
            />

            {/* Sun Icon in Top Left Corner */}
            <div className="absolute top-3 left-3 bg-amber-500/20 border border-amber-500/40 rounded-xl p-2 flex items-center gap-2 text-amber-300 text-xs backdrop-blur-sm">
              <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
              <div>
                <span className="font-bold block text-[11px]">Solar Constant</span>
                <span className="font-mono text-[10px] text-amber-200">{customSolar} W/m²</span>
              </div>
            </div>

            {/* Legend Overlay */}
            <div className="absolute top-3 right-3 bg-slate-900/80 border border-slate-700/60 rounded-xl p-2 text-[10px] space-y-1 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-yellow-300">
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                <span>Visible Solar Photons (Incoming)</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span>Thermal IR Photons (Surface / Trapped)</span>
              </div>
            </div>
          </div>

          {/* Energy Budget Balance Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block uppercase">Net Solar Absorbed</span>
              <span className="font-mono font-bold text-amber-300 text-sm">
                {Math.round(S_eff)} W/m²
              </span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block uppercase">No-Greenhouse Temp</span>
              <span className="font-mono font-bold text-sky-300 text-sm">
                {T_no_gh.toFixed(1)}°C
              </span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block uppercase">Greenhouse Trapping</span>
              <span className="font-mono font-bold text-rose-400 text-sm">
                +{totalWarming.toFixed(1)}°C
              </span>
            </div>
          </div>
        </div>

        {/* Right: Interactive Atmospheric Controls & Chemistry (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Surface Temperature Outcome */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-5 border border-slate-800 shadow-xl text-center">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Equilibrium Surface Temperature
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-extrabold text-white mt-2">
              {finalSurfaceTempC > 0 ? `+${finalSurfaceTempC}` : finalSurfaceTempC}°C
            </div>
            <div className="text-xs text-slate-400 font-mono mt-1">
              ({finalSurfaceTempF > 0 ? `+${finalSurfaceTempF}` : finalSurfaceTempF}°F)
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-around">
              <div>
                <span className="text-slate-400 block text-[10px]">Active Body:</span>
                <span className="font-bold text-white">{currentPreset.name}</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-slate-400 block text-[10px]">Atmospheric Pressure:</span>
                <span className="font-bold text-sky-400">{currentPreset.surfacePressureAtm} atm</span>
              </div>
            </div>
          </div>

          {/* Interactive Atmospheric Sliders */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Adjust Atmospheric Parameters
            </h4>

            {/* CO2 Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300">Carbon Dioxide (CO₂) Concentration:</span>
                <span className="font-mono font-bold text-amber-400">
                  {customCO2 >= 10000 ? `${(customCO2 / 10000).toFixed(1)}%` : `${customCO2} ppm`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                step="20"
                value={Math.min(2000, customCO2)}
                onChange={e => setCustomCO2(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>0 ppm (Snowball)</span>
                <span>280 (Pre-Ind)</span>
                <span>424 (Today)</span>
                <span>1000+ (High)</span>
              </div>
            </div>

            {/* Albedo / Cloud Reflectivity Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300">Planetary Albedo (Cloud & Ice Reflectivity):</span>
                <span className="font-mono font-bold text-sky-400">{customAlbedo}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="85"
                step="1"
                value={customAlbedo}
                onChange={e => setCustomAlbedo(parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>5% (Dark Ocean)</span>
                <span>30% (Earth Mean)</span>
                <span>75% (Venus Clouds)</span>
              </div>
            </div>

            {/* Solar Irradiance Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300">Solar Irradiance at Orbit:</span>
                <span className="font-mono font-bold text-yellow-400">{customSolar} W/m²</span>
              </div>
              <input
                type="range"
                min="500"
                max="2700"
                step="50"
                value={customSolar}
                onChange={e => setCustomSolar(parseFloat(e.target.value))}
                className="w-full accent-yellow-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>589 (Mars)</span>
                <span>1361 (Earth)</span>
                <span>2614 (Venus)</span>
              </div>
            </div>
          </div>

          {/* Molecular Vibration & Mechanism Card */}
          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 text-xs">
            <h5 className="font-bold text-white mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-rose-400" />
              How CO₂ Traps Heat at the Molecular Level
            </h5>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Unlike symmetrical diatomic gases (<span className="text-sky-300">N₂</span> and <span className="text-sky-300">O₂</span>), the carbon dioxide molecule (<span className="text-rose-300">O=C=O</span>) has flexible bending and stretching vibrational modes that resonant with infrared radiation wavelengths (~15 micrometers). When a thermal IR photon is absorbed, the molecule vibrates vigorously before re-emitting the photon in a random direction—sending half of that thermal energy back down toward Earth.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
