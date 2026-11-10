import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Eye,
  Play,
  Pause,
  Activity,
  CheckCircle2,
  Atom,
  HelpCircle,
  Zap,
  TrendingUp,
  Maximize2,
  Calendar,
  History
} from 'lucide-react';
import { PLANETARY_BODIES } from '../data/labData';

interface Molecule {
  id: number;
  type: 'co2' | 'ch4';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  vibratingUntil: number; // timestamp for absorption excitation vibration
  pulseRadius: number; // expanding absorption wave ring
  absorbedWavelength?: string; // '15 μm' or '7.66 μm'
}

interface Photon {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'solar-visible' | 'thermal-ir' | 'reflected-solar';
  tracked?: boolean;
  bounces: number;
  trail: { x: number; y: number }[];
  origin?: 'sun' | 'surface-conversion' | 'back-radiation';
}

interface SurfaceConversionEvent {
  id: number;
  x: number;
  y: number;
  timestamp: number;
  radius: number;
}

export interface EarthYearPreset {
  year: string;
  shortLabel: string;
  co2: number;
  ch4: number;
  period: string;
  description: string;
}

export const EARTH_HISTORICAL_YEARS: EarthYearPreset[] = [
  { 
    year: '20,000 BCE', 
    shortLabel: '20k BCE (Ice Age)', 
    co2: 185, 
    ch4: 350, 
    period: 'Last Glacial Maximum',
    description: 'Mile-thick continental ice sheets, sea level 120m lower, mean temp ~9°C colder.'
  },
  { 
    year: '1750', 
    shortLabel: '1750 (Pre-Ind)', 
    co2: 280, 
    ch4: 720, 
    period: 'Pre-Industrial Baseline',
    description: 'Stable Holocene agricultural climate baseline before widespread fossil fuel combustion.'
  },
  { 
    year: '1960', 
    shortLabel: '1960 (Keeling Start)', 
    co2: 317, 
    ch4: 1260, 
    period: 'Early Post-War Boom',
    description: 'Charles David Keeling begins continuous high-precision atmospheric CO₂ logging at Mauna Loa.'
  },
  { 
    year: '1980', 
    shortLabel: '1980', 
    co2: 339, 
    ch4: 1570, 
    period: 'Late 20th Century',
    description: 'Accelerating industrial emissions and early climate science consensus warnings.'
  },
  { 
    year: '2000', 
    shortLabel: '2000 (Millennium)', 
    co2: 370, 
    ch4: 1770, 
    period: 'Turn of Millennium',
    description: 'Rapid global economic expansion and worldwide fossil fuel combustion acceleration.'
  },
  { 
    year: '2026', 
    shortLabel: '2026 (Present Day)', 
    co2: 425, 
    ch4: 1925, 
    period: 'Present Day Measurement',
    description: 'Current real-time atmospheric milestone (>50% above pre-industrial levels).'
  },
  { 
    year: '2050', 
    shortLabel: '2050 (Mid-Century)', 
    co2: 490, 
    ch4: 2150, 
    period: 'Mid-Century Trajectory',
    description: 'Intermediate emissions path; intense Arctic sea ice loss and extreme weather frequency.'
  },
  { 
    year: '2100', 
    shortLabel: '2100 (High Emissions)', 
    co2: 680, 
    ch4: 3500, 
    period: 'IPCC SSP5-8.5 Projection',
    description: 'Unmitigated high emissions pathway leading to +3°C to +4.5°C global mean warming.'
  },
];

export const AtmosphereSimulator: React.FC = () => {
  // Preset planetary body
  const [selectedPlanet, setSelectedPlanet] = useState<string>('earth-modern');

  // Selected Earth Historical Year Preset
  const [selectedYearPreset, setSelectedYearPreset] = useState<string>('2026');

  // Atmospheric gas concentrations (Separated CO2 and CH4)
  const [customCO2, setCustomCO2] = useState<number>(424); // ppm
  const [customCH4, setCustomCH4] = useState<number>(1925); // ppb (Methane)
  const [customWaterVapor, setCustomWaterVapor] = useState<number>(1.0); // 0.0 to 2.0x relative humidity feedback
  const [customSolar, setCustomSolar] = useState<number>(1361); // W/m²
  const [customAlbedo, setCustomAlbedo] = useState<number>(30); // 30% Earth albedo

  // Simulation play controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1.0); // 0.35x slow-mo, 1.0x normal
  const [tracePhoton, setTracePhoton] = useState<boolean>(true);
  const [moleculeFilter, setMoleculeFilter] = useState<'all' | 'co2' | 'ch4'>('all');
  const [showRays, setShowRays] = useState<boolean>(true);

  // Inspector & Guided Story mode
  const [activeTab, setActiveTab] = useState<'inspector' | 'guide'>('inspector');
  const [inspectedGas, setInspectedGas] = useState<'co2' | 'ch4'>('co2');
  const [storyStep, setStoryStep] = useState<number>(0); // 0: all, 1: sunlight, 2: conversion, 3: absorption, 4: back-radiation

  // Real-time photon statistics counters
  const [escapedCount, setEscapedCount] = useState<number>(0);
  const [trappedBackCount, setTrappedBackCount] = useState<number>(0);

  // Synchronize presets
  const handleSelectPreset = (id: string) => {
    setSelectedPlanet(id);
    const preset = PLANETARY_BODIES.find(p => p.id === id);
    if (!preset) return;

    if (id === 'earth-modern') {
      setCustomCO2(424);
      setCustomCH4(1925);
      setCustomSolar(1361);
      setCustomAlbedo(30);
      setCustomWaterVapor(1.0);
      setSelectedYearPreset('2026');
    } else if (id === 'earth-preindustrial') {
      setCustomCO2(280);
      setCustomCH4(720);
      setCustomSolar(1361);
      setCustomAlbedo(30);
      setCustomWaterVapor(1.0);
      setSelectedYearPreset('1750');
    } else if (id === 'earth-future') {
      setCustomCO2(680);
      setCustomCH4(3500);
      setCustomSolar(1361);
      setCustomAlbedo(28);
      setCustomWaterVapor(1.15);
      setSelectedYearPreset('2100');
    } else if (id === 'venus') {
      setCustomCO2(2000); // representative top value on slider
      setCustomCH4(50);
      setCustomSolar(2614);
      setCustomAlbedo(75);
      setCustomWaterVapor(0.1);
    } else if (id === 'mars') {
      setCustomCO2(200); // 0.006 atm column density
      setCustomCH4(10);
      setCustomSolar(589);
      setCustomAlbedo(25);
      setCustomWaterVapor(0.05);
    } else if (id === 'earth-nogreenhouse') {
      setCustomCO2(0);
      setCustomCH4(0);
      setCustomSolar(1361);
      setCustomAlbedo(30);
      setCustomWaterVapor(0.0);
    }
    handleResetCounters();
  };

  const handleApplyYearPreset = (yearKey: string) => {
    setSelectedYearPreset(yearKey);
    const found = EARTH_HISTORICAL_YEARS.find(y => y.year === yearKey);
    if (found) {
      setCustomCO2(found.co2);
      setCustomCH4(found.ch4);
      setCustomSolar(1361);
      setCustomAlbedo(yearKey === '20,000 BCE' ? 36 : 30);
      setCustomWaterVapor(yearKey === '20,000 BCE' ? 0.7 : 1.0);
      if (yearKey === '2100') {
        setSelectedPlanet('earth-future');
      } else if (yearKey === '1750') {
        setSelectedPlanet('earth-preindustrial');
      } else {
        setSelectedPlanet('earth-modern');
      }
      handleResetCounters();
    }
  };

  const handleResetCounters = () => {
    setEscapedCount(0);
    setTrappedBackCount(0);
  };

  // Atmospheric physics model (IPCC Radiative Forcing & Stefan-Boltzmann)
  const S_eff = (customSolar / 4) * (1 - customAlbedo / 100);
  const sigma = 5.67e-8; // Stefan-Boltzmann constant
  const T_no_gh = Math.pow(Math.max(1, S_eff) / sigma, 0.25) - 273.15; // Bare rock equilibrium temp

  // 1. CO2 Radiative Forcing relative to pre-industrial 280 ppm: ΔF = 5.35 * ln(C / 280)
  const co2Forcing = customCO2 > 0 ? 5.35 * Math.log(Math.max(customCO2, 10) / 280) : -32;

  // 2. Methane (CH4) Radiative Forcing: Methane has 28x-84x GWP and absorbs in the 7.66 μm window
  const ch4Forcing = customCH4 > 0 ? 0.036 * (Math.sqrt(customCH4) - Math.sqrt(722)) * 1.65 : -6;

  // 3. Natural Earth Greenhouse Baseline is ~33°C warming
  const isNoGreenhouse = selectedPlanet === 'earth-nogreenhouse' || (customCO2 === 0 && customCH4 === 0 && customWaterVapor === 0);
  const baseNaturalGHE = isNoGreenhouse ? 0 : 33.0 * customWaterVapor;

  // Climate sensitivity parameter λ ~ 0.75 °C / (W/m²)
  const totalAnthropogenicWarming = Math.max(0, (co2Forcing + ch4Forcing) * 0.75 * (customWaterVapor || 0.5));
  
  const totalWarming = selectedPlanet === 'venus' 
    ? 507 
    : selectedPlanet === 'mars' 
      ? 5 
      : isNoGreenhouse 
        ? 0 
        : Math.max(0, baseNaturalGHE + totalAnthropogenicWarming);

  const finalSurfaceTempC = Number((T_no_gh + totalWarming).toFixed(1));
  const finalSurfaceTempF = Number(((finalSurfaceTempC * 9) / 5 + 32).toFixed(1));

  // Trapping ratio (0% to ~98%)
  const greenhouseIndex = useMemo(() => {
    if (selectedPlanet === 'venus') return 0.98;
    if (selectedPlanet === 'mars') return 0.08;
    if (isNoGreenhouse) return 0.02;

    const co2Term = Math.min(0.5, (customCO2 / 1000) * 0.34);
    const ch4Term = Math.min(0.35, (customCH4 / 5000) * 0.28);
    const h2oTerm = customWaterVapor * 0.35;
    return Math.min(0.96, Math.max(0.03, 0.22 + co2Term + ch4Term + h2oTerm));
  }, [selectedPlanet, isNoGreenhouse, customCO2, customCH4, customWaterVapor]);

  // Canvas Reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Responsive canvas resolution matching container size
    const resizeCanvas = () => {
      if (containerRef.current && canvas) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 50 && rect.height > 50) {
          canvas.width = Math.round(rect.width);
          canvas.height = Math.round(rect.height);
        }
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial canvas dimensions
    const initialW = canvas.width || 680;
    const initialH = canvas.height || 540;
    const initialGroundH = 44;
    const initialSurfaceY = initialH - initialGroundH;
    const initialAtmosTopY = 40;

    // Floating molecules in greenhouse layer
    const molecules: Molecule[] = [];
    const co2Count = Math.max(0, Math.min(42, Math.round((customCO2 / 2000) * 34) + (customCO2 > 50 ? 4 : 0)));
    const ch4Count = Math.max(0, Math.min(28, Math.round((customCH4 / 5000) * 22) + (customCH4 > 100 ? 3 : 0)));

    let molId = 0;
    if (moleculeFilter === 'all' || moleculeFilter === 'co2') {
      for (let i = 0; i < co2Count; i++) {
        molecules.push({
          id: molId++,
          type: 'co2',
          x: 35 + Math.random() * (initialW - 70),
          y: initialAtmosTopY + 18 + Math.random() * (initialSurfaceY - initialAtmosTopY - 36),
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.35,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.025,
          vibratingUntil: 0,
          pulseRadius: 0,
          absorbedWavelength: '15 μm',
        });
      }
    }

    if (moleculeFilter === 'all' || moleculeFilter === 'ch4') {
      for (let i = 0; i < ch4Count; i++) {
        molecules.push({
          id: molId++,
          type: 'ch4',
          x: 35 + Math.random() * (initialW - 70),
          y: initialAtmosTopY + 18 + Math.random() * (initialSurfaceY - initialAtmosTopY - 36),
          vx: (Math.random() - 0.5) * 0.55,
          vy: (Math.random() - 0.5) * 0.45,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.035,
          vibratingUntil: 0,
          pulseRadius: 0,
          absorbedWavelength: '7.66 μm',
        });
      }
    }

    // Photons
    const photons: Photon[] = [];
    let photonIdCounter = 0;
    const maxPhotons = 50;

    for (let i = 0; i < maxPhotons; i++) {
      const isSolar = Math.random() > 0.45;
      photons.push({
        id: photonIdCounter++,
        x: Math.random() * initialW,
        y: isSolar ? Math.random() * (initialSurfaceY - 20) : initialSurfaceY - Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.7,
        vy: isSolar ? 1.9 : -1.6,
        type: isSolar ? 'solar-visible' : 'thermal-ir',
        tracked: i === 0 && tracePhoton,
        bounces: 0,
        trail: [],
        origin: isSolar ? 'sun' : 'surface-conversion',
      });
    }

    // Surface Conversion visual shockwaves (when visible light converts to IR)
    const conversionEvents: SurfaceConversionEvent[] = [];
    let nextConversionId = 0;

    let localEscaped = 0;
    let localTrapped = 0;

    const render = () => {
      const now = performance.now();

      // DYNAMIC DIMENSIONS EVALUATED ON EVERY FRAME
      const currentW = canvas.width || 680;
      const currentH = canvas.height || 540;
      const groundH = 44; // Fixed 44px ground layer at bottom
      const curSurfaceY = currentH - groundH; // Ground line
      const curAtmosTopY = 40; // Exosphere boundary line

      ctx.clearRect(0, 0, currentW, currentH);

      // 1. Deep Space (Top layer: 0 to curAtmosTopY)
      const spaceGrad = ctx.createLinearGradient(0, 0, 0, curAtmosTopY);
      spaceGrad.addColorStop(0, '#020617');
      spaceGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, currentW, curAtmosTopY);

      // Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(40, 10, 1.5, 1.5);
      ctx.fillRect(160, 18, 2, 2);
      ctx.fillRect(280, 8, 1.5, 1.5);
      ctx.fillRect(420, 14, 2, 2);
      ctx.fillRect(560, 9, 1.5, 1.5);
      ctx.fillRect(720, 16, 2, 2);

      // Top of atmosphere dashed boundary line
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, curAtmosTopY);
      ctx.lineTo(currentW, curAtmosTopY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('EXOSPHERE BOUNDARY · ESCAPE TO DEEP SPACE', 10, curAtmosTopY - 5);

      // 2. Atmospheric Column Layer with Dynamic Thermal Blanket Glow (curAtmosTopY to curSurfaceY)
      const atmosGrad = ctx.createLinearGradient(0, curAtmosTopY, 0, curSurfaceY);
      const glowAlpha = Math.min(0.48, 0.03 + greenhouseIndex * 0.45);
      atmosGrad.addColorStop(0, 'rgba(14, 165, 233, 0.08)');
      atmosGrad.addColorStop(0.5, `rgba(244, 63, 94, ${glowAlpha * 0.75})`);
      atmosGrad.addColorStop(1, `rgba(239, 68, 68, ${glowAlpha})`);
      ctx.fillStyle = atmosGrad;
      ctx.fillRect(0, curAtmosTopY, currentW, curSurfaceY - curAtmosTopY);

      // Pedagogical Callout in Atmosphere Layer
      ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(
        '☀️ Incoming Visible Sunlight: Transparent to CO₂ & CH₄ (Passes through freely)', 
        Math.max(12, currentW / 2 - 200), 
        curAtmosTopY + 16
      );

      // 3. Planetary Surface (Fixed bottom 44px ground layer)
      const groundGrad = ctx.createLinearGradient(0, curSurfaceY, 0, currentH);
      if (selectedPlanet === 'venus') {
        groundGrad.addColorStop(0, '#b45309');
        groundGrad.addColorStop(1, '#451a03');
      } else if (selectedPlanet === 'mars') {
        groundGrad.addColorStop(0, '#b91c1c');
        groundGrad.addColorStop(1, '#7f1d1d');
      } else if (isNoGreenhouse) {
        groundGrad.addColorStop(0, '#e2e8f0'); // Snowball Earth
        groundGrad.addColorStop(1, '#94a3b8');
      } else {
        groundGrad.addColorStop(0, '#15803d'); // Earth greenery & oceans
        groundGrad.addColorStop(1, '#0f172a');
      }
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, curSurfaceY, currentW, groundH);

      // Ground Top Line Highlight
      ctx.strokeStyle = selectedPlanet === 'venus' ? '#f59e0b' : selectedPlanet === 'mars' ? '#ef4444' : isNoGreenhouse ? '#f8fafc' : '#4ade80';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, curSurfaceY);
      ctx.lineTo(currentW, curSurfaceY);
      ctx.stroke();
      ctx.lineWidth = 1;

      // Surface Conversion Callout on Ground
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(
        '⚡ SURFACE ENERGY CONVERSION: Absorbs Visible Light (0.5 μm) ➔ Radiates Thermal Infrared (10-15 μm)', 
        12, 
        curSurfaceY + 22
      );

      // Draw surface conversion visual ripples
      for (let c = conversionEvents.length - 1; c >= 0; c--) {
        const ev = conversionEvents[c];
        ctx.beginPath();
        ctx.arc(ev.x, curSurfaceY, ev.radius, Math.PI, 0, false);
        ctx.strokeStyle = `rgba(251, 146, 60, ${Math.max(0, 1 - ev.radius / 32)})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (isPlaying) {
          ev.radius += 1.2 * simSpeed;
        }
        if (ev.radius > 32) {
          conversionEvents.splice(c, 1);
        }
      }

      // Draw Visible Light Ray Beams if enabled
      if (showRays) {
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.12)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(30, 2);
        ctx.lineTo(currentW * 0.18, curSurfaceY);
        ctx.moveTo(70, 2);
        ctx.lineTo(currentW * 0.42, curSurfaceY);
        ctx.moveTo(110, 2);
        ctx.lineTo(currentW * 0.68, curSurfaceY);
        ctx.moveTo(150, 2);
        ctx.lineTo(currentW * 0.92, curSurfaceY);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      // 4. Update and Render Actual Labeled Molecules
      molecules.forEach(mol => {
        if (isPlaying) {
          mol.x += mol.vx * simSpeed;
          mol.y += mol.vy * simSpeed;
          mol.rotation += mol.vRot * simSpeed;

          if (mol.y < curAtmosTopY + 16 || mol.y > curSurfaceY - 20) mol.vy *= -1;
          if (mol.x < 20 || mol.x > currentW - 20) mol.vx *= -1;
        }

        const isVibrating = now < mol.vibratingUntil;
        const vibX = isVibrating ? (Math.random() - 0.5) * 4 : 0;
        const vibY = isVibrating ? (Math.random() - 0.5) * 4 : 0;

        // Expanding Resonance Pulse Ring when molecule absorbs IR
        if (isVibrating && mol.pulseRadius > 0) {
          ctx.beginPath();
          ctx.arc(mol.x, mol.y, mol.pulseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = mol.type === 'co2' ? 'rgba(244, 63, 94, 0.85)' : 'rgba(56, 189, 248, 0.9)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Absorption Callout Text
          ctx.fillStyle = mol.type === 'co2' ? '#fda4af' : '#7dd3fc';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText(
            `${mol.type.toUpperCase()} Absorbed ${mol.absorbedWavelength}!`, 
            mol.x - 28, 
            mol.y - mol.pulseRadius - 4
          );

          if (isPlaying) mol.pulseRadius += 1.0 * simSpeed;
        }

        ctx.save();
        ctx.translate(mol.x + vibX, mol.y + vibY);
        ctx.rotate(mol.rotation);

        if (mol.type === 'co2') {
          // Carbon Dioxide: O = C = O (Linear Triatomic)
          const bondLength = 12;

          ctx.strokeStyle = isVibrating ? '#f43f5e' : '#cbd5e1';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(-bondLength, -1.8);
          ctx.lineTo(bondLength, -1.8);
          ctx.moveTo(-bondLength, 1.8);
          ctx.lineTo(bondLength, 1.8);
          ctx.stroke();

          // Central Carbon Atom
          ctx.beginPath();
          ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = isVibrating ? '#be123c' : '#1e293b';
          ctx.fill();
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 6.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('C', 0, 0);

          // Two Oxygen Atoms
          [-bondLength, bondLength].forEach(oxX => {
            ctx.beginPath();
            ctx.arc(oxX, 0, 6, 0, Math.PI * 2);
            ctx.fillStyle = isVibrating ? '#f43f5e' : '#ef4444';
            ctx.fill();
            ctx.strokeStyle = '#991b1b';
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 6.5px sans-serif';
            ctx.fillText('O', oxX, 0);
          });
        } else {
          // Methane: CH4 (Tetrahedral)
          const bondR = 10;
          ctx.strokeStyle = isVibrating ? '#38bdf8' : '#94a3b8';
          ctx.lineWidth = 1.8;

          const angles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3, -Math.PI / 2];
          angles.forEach(ang => {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(ang) * bondR, Math.sin(ang) * bondR);
            ctx.stroke();

            const hx = Math.cos(ang) * bondR;
            const hy = Math.sin(ang) * bondR;
            ctx.beginPath();
            ctx.arc(hx, hy, 4, 0, Math.PI * 2);
            ctx.fillStyle = isVibrating ? '#7dd3fc' : '#f0fdf4';
            ctx.fill();
            ctx.strokeStyle = '#0284c7';
            ctx.stroke();

            ctx.fillStyle = '#0369a1';
            ctx.font = 'bold 5.5px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('H', hx, hy);
          });

          // Central Carbon Atom
          ctx.beginPath();
          ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = isVibrating ? '#0284c7' : '#1e293b';
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 6.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('C', 0, 0);
        }

        ctx.restore();
      });

      // 5. Update and Render Photons
      photons.forEach(p => {
        if (isPlaying) {
          if (p.tracked) {
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 25) p.trail.shift();
          }

          if (p.type === 'solar-visible') {
            p.y += 2.0 * simSpeed;
            p.x += p.vx * simSpeed;

            // STRIKES GROUND: Visible Light Transformed to Thermal Infrared!
            if (p.y >= curSurfaceY) {
              p.y = curSurfaceY - 2;

              if (Math.random() < customAlbedo / 100) {
                p.type = 'reflected-solar';
                p.vy = -2.0;
                p.vx = (Math.random() - 0.5) * 1.0;
              } else {
                p.type = 'thermal-ir';
                p.vy = -1.6;
                p.vx = (Math.random() - 0.5) * 1.2;
                p.bounces = 0;
                p.origin = 'surface-conversion';

                conversionEvents.push({
                  id: nextConversionId++,
                  x: p.x,
                  y: curSurfaceY,
                  timestamp: now,
                  radius: 4,
                });
              }
            }
          } else if (p.type === 'reflected-solar') {
            p.y += p.vy * simSpeed;
            p.x += p.vx * simSpeed;

            if (p.y <= 0) {
              p.y = 0;
              p.type = 'solar-visible';
              p.x = 25 + Math.random() * (currentW - 50);
              p.vy = 2.0;
            }
          } else {
            // Thermal Infrared
            p.y += p.vy * simSpeed;
            p.x += p.vx * simSpeed;

            // Collision with molecules
            if (molecules.length > 0 && p.y > curAtmosTopY + 8 && p.y < curSurfaceY - 10) {
              for (const mol of molecules) {
                const distSq = (p.x - mol.x) * (p.x - mol.x) + (p.y - mol.y) * (p.y - mol.y);
                if (distSq < 280) {
                  mol.vibratingUntil = now + 450;
                  mol.pulseRadius = 6;
                  p.bounces++;
                  localTrapped++;

                  const angle = Math.random() * Math.PI * 2;
                  const speed = 1.6;
                  p.vx = Math.cos(angle) * speed;
                  p.vy = Math.sin(angle) * speed;

                  if (p.vy > 0) {
                    p.origin = 'back-radiation';
                  }

                  p.x += p.vx * 3;
                  p.y += p.vy * 3;
                  break;
                }
              }
            }

            // Downward Back-radiation hits ground: Re-absorbed by Earth!
            if (p.y >= curSurfaceY && p.vy > 0) {
              p.y = curSurfaceY - 2;
              p.vy = -1.5;
              p.vx = (Math.random() - 0.5) * 1.5;
            }

            // Reaches top of atmosphere: Escapes to Space!
            if (p.y <= curAtmosTopY) {
              localEscaped++;
              p.y = 2;
              p.type = 'solar-visible';
              p.x = 25 + Math.random() * (currentW - 50);
              p.vy = 2.0;
              p.vx = (Math.random() - 0.5) * 0.8;
              p.trail = [];
            }
          }

          if (p.x < 5) p.x = currentW - 8;
          if (p.x > currentW - 5) p.x = 8;
        }

        // Draw Trails for Tracked Photon
        if (p.tracked && p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let t = 1; t < p.trail.length; t++) {
            ctx.lineTo(p.trail[t].x, p.trail[t].y);
          }
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 9.5px sans-serif';
          ctx.fillText(
            p.type === 'thermal-ir' ? `Tracked IR (${p.bounces} Bounces)` : 'Tracked Solar', 
            p.x + 8, 
            p.y - 4
          );
        }

        // Draw Photon shape
        if (p.type === 'solar-visible') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#fde047';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (p.type === 'reflected-solar') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#fef08a';
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.tracked ? 4.5 : 3.2, 0, Math.PI * 2);
          ctx.fillStyle = p.origin === 'back-radiation' ? '#f59e0b' : '#f43f5e';
          ctx.shadowColor = '#fb7185';
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Update counters periodically
      if (Math.random() < 0.08) {
        setEscapedCount(prev => prev + localEscaped);
        setTrappedBackCount(prev => prev + localTrapped);
        localEscaped = 0;
        localTrapped = 0;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [
    isPlaying, 
    simSpeed, 
    tracePhoton, 
    moleculeFilter, 
    showRays,
    customCO2, 
    customCH4, 
    customSolar, 
    customAlbedo, 
    customWaterVapor, 
    greenhouseIndex, 
    selectedPlanet, 
    isNoGreenhouse
  ]);

  // Derived Trapping vs Escaping Percentages
  const totalInteractions = escapedCount + trappedBackCount;
  const trappedPercent = totalInteractions > 20 
    ? Math.round((trappedBackCount / totalInteractions) * 100) 
    : Math.round(greenhouseIndex * 100);
  const escapedPercent = 100 - trappedPercent;

  return (
    <div className="flex flex-col space-y-3 text-slate-100 select-none pb-4">
      {/* Top Bar: Compact Planet Presets & Story Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold uppercase text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
            Preset:
          </span>
          {PLANETARY_BODIES.map(planet => {
            const isSelected = selectedPlanet === planet.id;
            return (
              <button
                key={planet.id}
                onClick={() => handleSelectPreset(planet.id)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span>{planet.name.split('(')[0].trim()}</span>
                <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                  isSelected ? 'bg-indigo-900/90 text-amber-300' : 'bg-slate-900 text-slate-400'
                }`}>
                  {planet.actualSurfaceTempC > 0 ? `+${planet.actualSurfaceTempC}` : planet.actualSurfaceTempC}°C
                </span>
              </button>
            );
          })}
        </div>

        {/* Story / Guided Walkthrough Pill */}
        <div className="flex items-center gap-1.5 shrink-0 text-xs">
          <span className="text-[11px] text-slate-400 font-medium hidden md:inline">Guided View:</span>
          {[
            { s: 0, label: 'Full Sim' },
            { s: 1, label: '1. Sunlight In' },
            { s: 2, label: '2. Ground Converts IR' },
            { s: 3, label: '3. IR Trapping' },
          ].map(st => (
            <button
              key={st.s}
              onClick={() => {
                setStoryStep(st.s);
                if (st.s === 1) {
                  setShowRays(true);
                  setSimSpeed(0.35);
                } else if (st.s === 2) {
                  setSimSpeed(0.35);
                  setTracePhoton(true);
                } else if (st.s === 3) {
                  setSimSpeed(1.0);
                  setTracePhoton(true);
                } else {
                  setSimSpeed(1.0);
                }
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                storyStep === st.s
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3-Column Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        
        {/* LEFT TOOLBAR (3 cols): Sliders & Energy Balance */}
        <div className="lg:col-span-3 space-y-3">
          {/* Surface Temperature Outcome Display */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-3.5 rounded-2xl border border-slate-800 text-center shadow-md">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Equilibrium Surface Temperature
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-black text-white mt-0.5 tracking-tight">
              {finalSurfaceTempC > 0 ? `+${finalSurfaceTempC}` : finalSurfaceTempC}°C
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              ({finalSurfaceTempF > 0 ? `+${finalSurfaceTempF}` : finalSurfaceTempF}°F)
            </div>

            <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80 text-[10px]">
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">No-GHG Temp:</span>
                <span className="font-mono font-bold text-sky-300">{T_no_gh.toFixed(1)}°C</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">GHE Warmth:</span>
                <span className="font-mono font-bold text-rose-400">+{totalWarming.toFixed(1)}°C</span>
              </div>
            </div>
          </div>

          {/* Interactive Gas Controls */}
          <div className="space-y-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Gas Concentrations
              </span>
              <button 
                onClick={handleResetCounters} 
                className="text-[10px] text-indigo-400 hover:underline font-normal"
                title="Reset simulation statistics"
              >
                Reset Stats
              </button>
            </div>

            {/* Earth Historical Year Timeline Presets */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-amber-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Earth Historical Year Presets:
                </span>
                <span className="text-[9px] text-slate-400 font-mono">185 to 680 ppm</span>
              </div>

              <select
                value={selectedYearPreset}
                onChange={(e) => handleApplyYearPreset(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 hover:border-amber-400 rounded-lg px-2 py-1 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer transition"
              >
                {EARTH_HISTORICAL_YEARS.map(y => (
                  <option key={y.year} value={y.year}>
                    {y.shortLabel} · {y.co2} ppm CO₂ ({y.ch4} ppb CH₄)
                  </option>
                ))}
              </select>

              {/* Quick clickable era badges */}
              <div className="grid grid-cols-4 gap-1 text-[9px] pt-0.5">
                {[
                  { y: '20,000 BCE', label: 'Ice Age' },
                  { y: '1750', label: '1750 Pre-Ind' },
                  { y: '1960', label: '1960 Keeling' },
                  { y: '2026', label: '2026 Now' },
                ].map(item => (
                  <button
                    key={item.y}
                    type="button"
                    onClick={() => handleApplyYearPreset(item.y)}
                    className={`py-0.5 px-1 rounded text-center font-bold transition truncate ${
                      selectedYearPreset === item.y
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Historical context note */}
              {EARTH_HISTORICAL_YEARS.find(y => y.year === selectedYearPreset) && (
                <div className="text-[9.5px] text-amber-200/90 leading-tight pt-1 border-t border-slate-800/80 italic">
                  💡 {EARTH_HISTORICAL_YEARS.find(y => y.year === selectedYearPreset)?.description}
                </div>
              )}
            </div>

            {/* 1. CO2 Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  Carbon Dioxide (CO₂):
                </span>
                <span className="font-mono font-bold text-amber-400 text-xs">
                  {customCO2 >= 10000 ? `${(customCO2 / 10000).toFixed(1)}%` : `${customCO2} ppm`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                step="20"
                value={Math.min(2000, customCO2)}
                onChange={e => {
                  setCustomCO2(parseFloat(e.target.value));
                  handleResetCounters();
                }}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <button onClick={() => setCustomCO2(0)} className="hover:text-slate-300">0 ppm</button>
                <button onClick={() => setCustomCO2(280)} className="hover:text-slate-300">280 (1750)</button>
                <button onClick={() => setCustomCO2(424)} className="hover:text-amber-400 font-bold">424 (Now)</button>
                <button onClick={() => setCustomCO2(700)} className="hover:text-slate-300">700 (2100)</button>
                <button onClick={() => setCustomCO2(2000)} className="hover:text-slate-300">2000+</button>
              </div>
            </div>

            {/* 2. Methane (CH4) Slider */}
            <div className="space-y-1 pt-1.5 border-t border-slate-800/60">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                  <span className="font-bold text-slate-200">Methane (CH₄):</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                    28× Potent
                  </span>
                </div>
                <span className="font-mono font-bold text-sky-400 text-xs">
                  {customCH4} ppb
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={customCH4}
                onChange={e => {
                  setCustomCH4(parseFloat(e.target.value));
                  handleResetCounters();
                }}
                className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <button onClick={() => setCustomCH4(0)} className="hover:text-slate-300">0 ppb</button>
                <button onClick={() => setCustomCH4(720)} className="hover:text-slate-300">720 (Pre-Ind)</button>
                <button onClick={() => setCustomCH4(1925)} className="hover:text-sky-400 font-bold">1925 (Now)</button>
                <button onClick={() => setCustomCH4(3500)} className="hover:text-slate-300">3500</button>
                <button onClick={() => setCustomCH4(5000)} className="hover:text-rose-400 font-bold">5000</button>
              </div>
            </div>

            {/* 3. Water Vapor Feedback & Cloud Albedo */}
            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800/60 text-[10px]">
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="text-slate-400">Water Vapor:</span>
                  <span className="font-mono font-bold text-indigo-300">{customWaterVapor.toFixed(1)}×</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2.0"
                  step="0.1"
                  value={customWaterVapor}
                  onChange={e => setCustomWaterVapor(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800"
                />
              </div>

              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="text-slate-400">Albedo:</span>
                  <span className="font-mono font-bold text-cyan-300">{customAlbedo}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  step="1"
                  value={customAlbedo}
                  onChange={e => setCustomAlbedo(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer h-1 bg-slate-800"
                />
              </div>
            </div>

            {/* 4. Solar Constant */}
            <div className="pt-1.5 border-t border-slate-800/60 text-[10px]">
              <div className="flex justify-between mb-0.5">
                <span className="text-slate-400">Solar Irradiance (Orbit):</span>
                <span className="font-mono font-bold text-yellow-300">{customSolar} W/m²</span>
              </div>
              <input
                type="range"
                min="500"
                max="2650"
                step="50"
                value={customSolar}
                onChange={e => setCustomSolar(parseFloat(e.target.value))}
                className="w-full accent-yellow-500 cursor-pointer h-1 bg-slate-800"
              />
            </div>
          </div>

          {/* Radiative Forcing Breakdown Callout */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-[11px] space-y-1.5 text-slate-300 shadow-md">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px] block">
              Radiative Energy Balance:
            </span>
            <div className="flex justify-between text-[10px]">
              <span>Net Solar Absorbed:</span>
              <span className="font-mono text-amber-300 font-bold">{Math.round(S_eff)} W/m²</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>CO₂ Radiative Forcing:</span>
              <span className="font-mono text-rose-400 font-bold">{co2Forcing > 0 ? `+${co2Forcing.toFixed(1)}` : co2Forcing.toFixed(1)} W/m²</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>CH₄ Radiative Forcing:</span>
              <span className="font-mono text-sky-400 font-bold">{ch4Forcing > 0 ? `+${ch4Forcing.toFixed(1)}` : ch4Forcing.toFixed(1)} W/m²</span>
            </div>
          </div>
        </div>

        {/* CENTER STAGE (6 cols): The Main Radiation & Transformation Canvas */}
        <div className="lg:col-span-6 space-y-2 flex flex-col">
          {/* Top Canvas Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs shadow-md">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Activity className="w-3.5 h-3.5 text-rose-400" />
                Visible-to-IR Radiation Stage
              </span>
            </div>

            {/* Play/Pause & Speed Tools */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  isPlaying ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                onClick={() => setSimSpeed(prev => prev === 1.0 ? 0.35 : 1.0)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  simSpeed === 0.35 ? 'bg-indigo-950 text-indigo-300 border border-indigo-600' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Slow-motion enables easy observation of each photon hitting molecules and bouncing back down"
              >
                {simSpeed === 0.35 ? '🐢 0.35x Slow-Mo' : '⚡ 1.0x Normal'}
              </button>

              <button
                onClick={() => setTracePhoton(!tracePhoton)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  tracePhoton ? 'bg-sky-950 text-sky-300 border border-sky-600' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tracePhoton ? 'Trace IR: ON' : 'Trace: OFF'}
              </button>

              <button
                onClick={() => setShowRays(!showRays)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  showRays ? 'bg-amber-950 text-amber-300 border border-amber-600' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {showRays ? 'Sun Rays: ON' : 'Rays: OFF'}
              </button>
            </div>
          </div>

          {/* Full-Height Spacious Canvas Viewport (Fixed 560px-600px height for optimal view) */}
          <div 
            ref={containerRef} 
            className="relative w-full h-[520px] sm:h-[560px] lg:h-[600px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl"
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full block"
            />

            {/* Sun Badge (Top Left) */}
            <div className="absolute top-2.5 left-2.5 bg-slate-900/85 border border-amber-500/50 rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-amber-300 text-xs backdrop-blur-md shadow-lg">
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow shrink-0" />
              <div>
                <span className="font-mono text-xs font-bold text-white leading-tight block">{customSolar} W/m²</span>
                <span className="text-[9px] text-amber-300/80 leading-none block">Visible Solar</span>
              </div>
            </div>

            {/* Escaping to Space Badge (Top Right) */}
            <div className="absolute top-2.5 right-2.5 bg-slate-900/85 border border-sky-500/50 rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-sky-300 text-xs backdrop-blur-md shadow-lg">
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-sky-300 leading-tight block">{escapedPercent}%</span>
                <span className="text-[9px] text-slate-400 leading-none block">Escaping to Deep Space</span>
              </div>
              <ArrowUp className="w-3.5 h-3.5 text-sky-400 animate-bounce" />
            </div>

            {/* Molecule Filter Tabs on Canvas (Bottom Left) */}
            <div className="absolute bottom-13 left-2.5 flex items-center gap-1 bg-slate-950/90 border border-slate-800 rounded-xl p-1 text-[10px] backdrop-blur-md shadow-md">
              <span className="text-slate-400 px-1 font-semibold">Filter:</span>
              <button
                onClick={() => setMoleculeFilter('all')}
                className={`px-2 py-0.5 rounded-lg font-bold transition ${
                  moleculeFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Gases
              </button>
              <button
                onClick={() => setMoleculeFilter('co2')}
                className={`px-2 py-0.5 rounded-lg font-bold transition ${
                  moleculeFilter === 'co2' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                CO₂ Only
              </button>
              <button
                onClick={() => setMoleculeFilter('ch4')}
                className={`px-2 py-0.5 rounded-lg font-bold transition ${
                  moleculeFilter === 'ch4' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                CH₄ (Methane) Only
              </button>
            </div>

            {/* Legend Overlay on Canvas (Bottom Right) */}
            <div className="absolute bottom-13 right-2.5 bg-slate-950/90 border border-slate-800 rounded-xl p-2 text-[9.5px] space-y-1 backdrop-blur-md shadow-md">
              <div className="flex items-center gap-1 text-yellow-300">
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                <span>Visible Solar (passes through GHG)</span>
              </div>
              <div className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span>Thermal IR (emitted by warm ground)</span>
              </div>
              <div className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span>Trapped Back-Radiation (scattered down)</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT TOOLBAR (3 cols): Chemistry Inspector & Absorption Gauges */}
        <div className="lg:col-span-3 space-y-3">
          {/* Real-Time Trapping & Escaping Gauges (Moved to top of right column for immediate visibility!) */}
          <div className="space-y-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shadow-md">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px] block">
              Real-Time Atmospheric Energy Gauges:
            </span>

            {/* Trapped & Back-Radiated Bar */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-rose-950 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-300 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  Thermal IR Trapped:
                </span>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  {trappedPercent}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 transition-all duration-300"
                  style={{ width: `${trappedPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>0% (No GHG)</span>
                <span className="text-amber-300 font-semibold">{trappedBackCount} Trapped & Scattered Down</span>
                <span>100%</span>
              </div>
            </div>

            {/* Escaping to Space Bar */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-sky-950 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-sky-300 flex items-center gap-1">
                  <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
                  Thermal IR Escaping:
                </span>
                <span className="font-mono font-bold text-sky-400 text-sm">
                  {escapedPercent}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-300"
                  style={{ width: `${escapedPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>{escapedCount} Escaped to Deep Space</span>
                <span className="text-sky-300 font-semibold">{escapedPercent > 50 ? 'Cold Loss' : 'Blanket Retained'}</span>
              </div>
            </div>
          </div>

          {/* Molecular Chemistry Inspector Card */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shadow-md space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setActiveTab('inspector')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    activeTab === 'inspector'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Molecular Chemistry
                </button>
                <button
                  onClick={() => setActiveTab('guide')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    activeTab === 'guide'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  4-Step Guide
                </button>
              </div>
            </div>

            {/* TAB 1: Molecular Chemistry & Wavelength Inspector */}
            {activeTab === 'inspector' && (
              <div className="space-y-2.5">
                {/* Molecule Switcher */}
                <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs text-center font-bold">
                  <button
                    onClick={() => setInspectedGas('co2')}
                    className={`py-1 rounded-lg transition ${
                      inspectedGas === 'co2' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    CO₂ (Carbon Dioxide)
                  </button>
                  <button
                    onClick={() => setInspectedGas('ch4')}
                    className={`py-1 rounded-lg transition ${
                      inspectedGas === 'ch4' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    CH₄ (Methane)
                  </button>
                </div>

                {/* Animated Molecular Structure Card */}
                {inspectedGas === 'co2' ? (
                  <div className="bg-slate-950 p-3 rounded-xl border border-rose-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">Linear Triatomic (O = C = O)</span>
                      <span className="text-[10px] font-mono text-rose-300 font-bold bg-rose-950 px-1.5 py-0.2 rounded border border-rose-800">
                        15 μm IR Band
                      </span>
                    </div>

                    {/* Diagram of CO2 */}
                    <div className="h-14 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800 relative overflow-hidden">
                      <div className="flex items-center gap-1">
                        <div className="w-7 h-7 rounded-full bg-rose-600 border border-red-400 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                          O
                        </div>
                        <div className="w-4 h-1.5 bg-slate-400"></div>
                        <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
                          C
                        </div>
                        <div className="w-4 h-1.5 bg-slate-400"></div>
                        <div className="w-7 h-7 rounded-full bg-rose-600 border border-red-400 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                          O
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-tight">
                      • <strong className="text-white">Bending Vibration Mode:</strong> When hit by 15 μm thermal IR, the Oxygen atoms bend up and down, altering the dipole moment and trapping the heat energy.
                    </p>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      • <strong className="text-white">Abundance:</strong> Measured in <strong className="text-amber-400">ppm</strong> (~424 ppm today). High baseline presence in Earth&apos;s atmosphere.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-950 p-3 rounded-xl border border-sky-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">Tetrahedral (CH₄)</span>
                      <span className="text-[10px] font-mono text-sky-300 font-bold bg-sky-950 px-1.5 py-0.2 rounded border border-sky-800">
                        7.66 μm IR Band
                      </span>
                    </div>

                    {/* Diagram of CH4 */}
                    <div className="h-14 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800 relative overflow-hidden">
                      <div className="relative w-16 h-12 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-sky-400 flex items-center justify-center text-xs font-bold text-white z-10">
                          C
                        </div>
                        <div className="absolute top-0 w-3.5 h-3.5 rounded-full bg-sky-100 border border-sky-500 flex items-center justify-center text-[7px] font-bold text-sky-900">
                          H
                        </div>
                        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full bg-sky-100 border border-sky-500 flex items-center justify-center text-[7px] font-bold text-sky-900">
                          H
                        </div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-sky-100 border border-sky-500 flex items-center justify-center text-[7px] font-bold text-sky-900">
                          H
                        </div>
                        <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-sky-100 border border-sky-500 flex items-center justify-center text-[7px] font-bold text-sky-900">
                          H
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-tight">
                      • <strong className="text-white">28×–84× Heat-Trapping Potency:</strong> Methane absorbs in the 7.66 μm &quot;atmospheric window&quot; where CO₂ and H₂O do not absorb, making each molecule far more lethal at trapping escaping heat.
                    </p>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      • <strong className="text-white">Abundance:</strong> Measured in <strong className="text-sky-400">ppb</strong> (~1925 ppb today). Even tiny increases produce an outsized warming burst.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Step-by-Step Guided Walkthrough */}
            {activeTab === 'guide' && (
              <div className="space-y-2 text-[11px] text-slate-300">
                <div className={`p-2 rounded-xl border transition ${
                  storyStep === 1 ? 'bg-amber-950/80 border-amber-500 text-white' : 'bg-slate-950 border-slate-800'
                }`}>
                  <strong className="text-amber-400 block font-bold">1. Sunlight Arrives (Shortwave)</strong>
                  Yellow solar photons stream from space. The greenhouse gases (CO₂ & CH₄) are completely transparent to shortwave light!
                </div>

                <div className={`p-2 rounded-xl border transition ${
                  storyStep === 2 ? 'bg-orange-950/80 border-orange-500 text-white' : 'bg-slate-950 border-slate-800'
                }`}>
                  <strong className="text-orange-400 block font-bold">2. Ground Conversion to Thermal IR</strong>
                  The planetary ground absorbs incoming visible photons, warms up, and converts that energy into longwave Thermal Infrared (red rays)!
                </div>

                <div className={`p-2 rounded-xl border transition ${
                  storyStep === 3 ? 'bg-rose-950/80 border-rose-500 text-white' : 'bg-slate-950 border-slate-800'
                }`}>
                  <strong className="text-rose-400 block font-bold">3. IR Absorption & Downward Back-Radiation</strong>
                  Outgoing IR photons strike CO₂ and CH₄ molecules. The molecules vibrate and re-radiate ~50% BACK DOWN to the surface, trapping heat like an insulating blanket.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
