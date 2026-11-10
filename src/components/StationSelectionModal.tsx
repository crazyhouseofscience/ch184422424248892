import React, { useState } from 'react';
import { 
  FlaskConical, 
  Sparkles, 
  Flame, 
  Layers, 
  Cloud, 
  LineChart, 
  Globe2, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle, 
  Ruler, 
  Thermometer, 
  Eye, 
  X,
  Compass,
  FileText,
  Activity
} from 'lucide-react';
import { ActiveModule } from '../types';
import setupImgBottle1 from '../assets/images/setup_control_bottle_1790716779013.jpg';
import setupImgBottle2 from '../assets/images/setup_medium_co2_bottle_1790716788801.jpg';
import setupImgBottle3 from '../assets/images/setup_high_co2_bottle_1790716799328.jpg';

interface StationSelectionModalProps {
  isOpen: boolean;
  onSelectStation: (module: ActiveModule) => void;
  onClose?: () => void;
  isTeacherMode?: boolean;
}

interface StationChoice {
  id: ActiveModule;
  stationNumber: number;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  colorTheme: {
    border: string;
    hoverBorder: string;
    badgeBg: string;
    badgeText: string;
    btnBg: string;
    btnHover: string;
    btnText: string;
    glow: string;
    iconText: string;
  };
  icon: React.ReactNode;
  imgSrc?: string;
  parameters: { label: string; value: string }[];
}

export const StationSelectionModal: React.FC<StationSelectionModalProps> = ({
  isOpen,
  onSelectStation,
  onClose,
  isTeacherMode = false,
}) => {
  const [showPreLabDetails, setShowPreLabDetails] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleLaunch = (mod: ActiveModule) => {
    onSelectStation(mod);
    if (onClose) onClose();
  };

  const stations: StationChoice[] = [
    {
      id: 'station-1',
      stationNumber: 1,
      title: 'Station 1: Control (Air)',
      subtitle: '0 Tablets · Ambient Air (~420 ppm CO₂)',
      description: 'Baseline experimental control measuring radiant lamp heating in normal room air with 50 mL water.',
      badge: 'Control Air',
      colorTheme: {
        border: 'border-sky-500/50',
        hoverBorder: 'hover:border-sky-400',
        badgeBg: 'bg-sky-950 text-sky-300 border-sky-800',
        badgeText: 'text-sky-300',
        btnBg: 'bg-sky-600',
        btnHover: 'hover:bg-sky-500',
        btnText: 'text-white',
        glow: 'hover:shadow-sky-500/20',
        iconText: 'text-sky-400',
      },
      icon: <FlaskConical className="w-5 h-5 text-sky-400" />,
      imgSrc: setupImgBottle1,
      parameters: [
        { label: 'Reactants', value: '0 Tablets + 50 mL H₂O' },
        { label: 'Headspace Gas', value: 'Ambient Air (~420 ppm)' },
        { label: 'Expected ΔT', value: '+2.5°C over 15 min' },
      ],
    },
    {
      id: 'station-2',
      stationNumber: 2,
      title: 'Station 2: Medium CO₂',
      subtitle: '2 Tablets · Medium Forcing (~1,500 ppm)',
      description: 'Moderate greenhouse effect created by dissolving 2 effervescent tablets into 50 mL water under airtight seal.',
      badge: 'Medium CO₂',
      colorTheme: {
        border: 'border-amber-500/50',
        hoverBorder: 'hover:border-amber-400',
        badgeBg: 'bg-amber-950 text-amber-300 border-amber-800',
        badgeText: 'text-amber-300',
        btnBg: 'bg-amber-600',
        btnHover: 'hover:bg-amber-500',
        btnText: 'text-slate-950 font-bold',
        glow: 'hover:shadow-amber-500/20',
        iconText: 'text-amber-400',
      },
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      imgSrc: setupImgBottle2,
      parameters: [
        { label: 'Reactants', value: '2 Tablets + 50 mL H₂O' },
        { label: 'Headspace Gas', value: 'Medium CO₂ (~1,500 ppm)' },
        { label: 'Expected ΔT', value: '+4.7°C over 15 min' },
      ],
    },
    {
      id: 'station-3',
      stationNumber: 3,
      title: 'Station 3: High CO₂',
      subtitle: '4 Tablets · High Forcing (~3,200 ppm)',
      description: 'Maximum greenhouse gas forcing with 4 effervescent tablets producing high CO₂ concentration in sealed bottle.',
      badge: 'High CO₂',
      colorTheme: {
        border: 'border-rose-500/50',
        hoverBorder: 'hover:border-rose-400',
        badgeBg: 'bg-rose-950 text-rose-300 border-rose-800',
        badgeText: 'text-rose-300',
        btnBg: 'bg-rose-600',
        btnHover: 'hover:bg-rose-500',
        btnText: 'text-white',
        glow: 'hover:shadow-rose-500/20',
        iconText: 'text-rose-400',
      },
      icon: <Sparkles className="w-5 h-5 text-rose-400" />,
      imgSrc: setupImgBottle3,
      parameters: [
        { label: 'Reactants', value: '4 Tablets + 50 mL H₂O' },
        { label: 'Headspace Gas', value: 'High CO₂ (~3,200 ppm)' },
        { label: 'Expected ΔT', value: '+7.0°C over 15 min' },
      ],
    },
    {
      id: 'station-summary',
      stationNumber: 4,
      title: 'Station 4: 3-Station Summary',
      subtitle: 'Side-by-Side Comparison & Curves',
      description: 'Comparative multi-station dashboard showing 0 vs 2 vs 4 tablet data tables, simultaneous curves, and heating rates.',
      badge: 'Comparative Data',
      colorTheme: {
        border: 'border-emerald-500/50',
        hoverBorder: 'hover:border-emerald-400',
        badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-800',
        badgeText: 'text-emerald-300',
        btnBg: 'bg-emerald-600',
        btnHover: 'hover:bg-emerald-500',
        btnText: 'text-white',
        glow: 'hover:shadow-emerald-500/20',
        iconText: 'text-emerald-400',
      },
      icon: <Layers className="w-5 h-5 text-emerald-400" />,
      parameters: [
        { label: 'Dataset', value: 'All 3 Stations (0, 2, 4 Tabs)' },
        { label: 'Key Metric', value: 'Heating Rate (°C/min) & ΔT' },
        { label: 'Visual', value: 'Simultaneous 15m Curves' },
      ],
    },
    {
      id: 'light-heat-radiation',
      stationNumber: 5,
      title: 'Station 5: Radiation Sim',
      subtitle: 'Light-to-Heat & Trapping Animation',
      description: 'Pure graphic simulation showing visible photons entering bottles, converting to thermal IR, and getting trapped by CO₂.',
      badge: 'Radiation Physics',
      colorTheme: {
        border: 'border-amber-500/50',
        hoverBorder: 'hover:border-amber-400',
        badgeBg: 'bg-amber-950 text-amber-300 border-amber-800',
        badgeText: 'text-amber-300',
        btnBg: 'bg-amber-600',
        btnHover: 'hover:bg-amber-500',
        btnText: 'text-slate-950 font-bold',
        glow: 'hover:shadow-amber-500/20',
        iconText: 'text-amber-400',
      },
      icon: <Flame className="w-5 h-5 text-amber-400" />,
      parameters: [
        { label: 'Simulation', value: '3 Parallel Bottles' },
        { label: 'Key Concept', value: 'Light ➔ Heat Transformation' },
        { label: 'CO₂ Effect', value: 'Reduces Escaping Photons' },
      ],
    },
    {
      id: 'atmospheric-conditions',
      stationNumber: 6,
      title: 'Station 6: Clouds & Gases',
      subtitle: 'Albedo, Solar Angles, CH₄, H₂O',
      description: 'Investigate how planetary clouds, surface albedo, solar sun angle, methane, and water vapor influence greenhouse heating.',
      badge: 'Atmosphere Explorer',
      colorTheme: {
        border: 'border-cyan-500/50',
        hoverBorder: 'hover:border-cyan-400',
        badgeBg: 'bg-cyan-950 text-cyan-300 border-cyan-800',
        badgeText: 'text-cyan-300',
        btnBg: 'bg-cyan-600',
        btnHover: 'hover:bg-cyan-500',
        btnText: 'text-white',
        glow: 'hover:shadow-cyan-500/20',
        iconText: 'text-cyan-400',
      },
      icon: <Cloud className="w-5 h-5 text-cyan-400" />,
      parameters: [
        { label: 'Variables', value: 'Cloud Cover, Surface Albedo' },
        { label: 'Greenhouse Gases', value: 'CO₂, CH₄, H₂O, N₂O' },
        { label: 'Solar Angles', value: '0° to 90° Incident Energy' },
      ],
    },
    {
      id: 'data-visualization',
      stationNumber: 7,
      title: 'Station 7: Graphing Studio',
      subtitle: 'Interactive Plotting & CSV Export',
      description: 'Full graphing laboratory where students log intervals, plot custom temperature curves, compute linear regression, and export data.',
      badge: 'Data & Plotting',
      colorTheme: {
        border: 'border-emerald-500/50',
        hoverBorder: 'hover:border-emerald-400',
        badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-800',
        badgeText: 'text-emerald-300',
        btnBg: 'bg-emerald-600',
        btnHover: 'hover:bg-emerald-500',
        btnText: 'text-white',
        glow: 'hover:shadow-emerald-500/20',
        iconText: 'text-emerald-400',
      },
      icon: <LineChart className="w-5 h-5 text-emerald-400" />,
      parameters: [
        { label: 'Interval Options', value: '2-Minute or 3-Minute Steps' },
        { label: 'Analytics', value: 'Slope (°C/min), R² Fit, ΔT' },
        { label: 'Export', value: 'CSV Spreadsheet & PNG Chart' },
      ],
    },
    {
      id: 'atmosphere',
      stationNumber: 8,
      title: 'Station 8: Planetary Sim',
      subtitle: 'Planetary Radiative Balance & IR Trapping',
      description: 'Compare Earth, Venus, Mars, and paleoclimate eras. Observe molecular CO₂ and CH₄ absorbing thermal IR and back-radiating heat.',
      badge: 'Planetary & IR Trapping',
      colorTheme: {
        border: 'border-indigo-500/50',
        hoverBorder: 'hover:border-indigo-400',
        badgeBg: 'bg-indigo-950 text-indigo-300 border-indigo-800',
        badgeText: 'text-indigo-300',
        btnBg: 'bg-indigo-600',
        btnHover: 'hover:bg-indigo-500',
        btnText: 'text-white',
        glow: 'hover:shadow-indigo-500/20',
        iconText: 'text-indigo-400',
      },
      icon: <Globe2 className="w-5 h-5 text-indigo-400" />,
      parameters: [
        { label: 'Planets Modeled', value: 'Earth, Venus, Mars, Ice Age' },
        { label: 'Molecular Physics', value: 'CO₂ (15 μm) & CH₄ (7.66 μm)' },
        { label: 'Gauges', value: 'Trapped IR % vs Escaping IR %' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/95 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div 
        className="w-full max-w-7xl bg-slate-900 border-2 border-indigo-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[96vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="station-select-title"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-amber-950 px-4 py-3 sm:px-6 sm:py-3.5 border-b border-indigo-500/40 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400 text-indigo-300 shrink-0">
              <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/50">
                  Laboratory Station Hub · Choose Where to Begin
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Keith Chapman 2026 v1.2.1</span>
              </div>
              <h2 id="station-select-title" className="text-base sm:text-xl font-bold text-white mt-0.5">
                Select Which Station You Want to Go to First:
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPreLabDetails(prev => !prev)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 text-amber-300 border border-slate-700 hover:bg-slate-700 flex items-center gap-1.5 transition font-semibold"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showPreLabDetails ? 'Hide Pre-Lab Notes' : 'Pre-Lab Instructions'}</span>
              <span className="sm:hidden">Pre-Lab</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Close modal and return to workstation"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-4 text-slate-200">
          {/* Driving Question Banner */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-500/50 shadow-inner flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Laboratory Driving Question
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white leading-snug">
                &quot;How does the concentration of carbon dioxide (CO₂) in an enclosed atmosphere affect the absorption and trapping of radiant heat over time?&quot;
              </p>
            </div>
            <div className="text-[11px] font-bold text-emerald-400 shrink-0 bg-emerald-950/70 border border-emerald-600/40 px-2.5 py-1 rounded-lg">
              ✓ All 8 Stations Unlocked
            </div>
          </div>

          {/* Collapsible Pre-Lab Details */}
          {showPreLabDetails && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 animate-fadeIn text-xs text-slate-300">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Experimental Design & Controlled Variables
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="font-bold text-amber-300 block mb-0.5">1. Fixed Lamp Distance:</span>
                  Bulb clamped exactly 6 inches (15 cm) from each bottle face across all stations.
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="font-bold text-sky-300 block mb-0.5">2. Suspended Headspace Probe:</span>
                  Digital probe monitors air temperature only (must never touch water at bottom).
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="font-bold text-emerald-300 block mb-0.5">3. Airtight Clay Seal:</span>
                  Plastic wrap and modeling clay prevent gas escape while transmitting radiant heat.
                </div>
              </div>
            </div>
          )}

          {/* THE 8 STATIONS SELECTION GRID (4 columns on desktop, 2 on tablet) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {stations.map(st => {
              return (
                <div
                  key={st.id}
                  onClick={() => handleLaunch(st.id)}
                  className={`group bg-slate-900/90 hover:bg-slate-850 rounded-2xl border-2 ${st.colorTheme.border} ${st.colorTheme.hoverBorder} p-3 sm:p-3.5 transition-all shadow-lg ${st.colorTheme.glow} cursor-pointer flex flex-col justify-between`}
                >
                  <div className="space-y-2">
                    {/* Header line: Station # badge & Type badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-lg bg-slate-800 border border-slate-700 ${st.colorTheme.iconText}`}>
                          {st.icon}
                        </span>
                        <span className="font-black text-xs sm:text-sm text-white tracking-tight">
                          Station {st.stationNumber}
                        </span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold border ${st.colorTheme.badgeBg}`}>
                        {st.badge}
                      </span>
                    </div>

                    {/* Image if available (Stations 1, 2, 3) or Graphic Card Header */}
                    {st.imgSrc ? (
                      <div className="h-28 rounded-xl overflow-hidden border border-slate-700/60 relative bg-slate-950">
                        <img 
                          src={st.imgSrc} 
                          alt={st.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute bottom-1 right-1 bg-slate-950/80 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-amber-300 backdrop-blur-sm">
                          Setup Photo
                        </div>
                      </div>
                    ) : (
                      <div className="h-16 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-2 flex flex-col justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Module Focus
                        </span>
                        <span className="text-xs font-semibold text-white line-clamp-1">
                          {st.subtitle}
                        </span>
                      </div>
                    )}

                    {/* Station Title & Subtitle */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition line-clamp-1">
                        {st.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {st.description}
                      </p>
                    </div>

                    {/* Key Parameters Table */}
                    <div className="pt-2 border-t border-slate-800/80 text-[10px] space-y-1 text-slate-400">
                      {st.parameters.map((param, pIdx) => (
                        <div key={pIdx} className="flex justify-between items-baseline gap-1">
                          <span className="shrink-0 text-slate-500">{param.label}:</span>
                          <strong className="text-slate-200 text-right truncate">{param.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Launch Button */}
                  <button
                    type="button"
                    className={`mt-3 w-full py-2 px-3 rounded-xl ${st.colorTheme.btnBg} ${st.colorTheme.btnHover} ${st.colorTheme.btnText} font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md cursor-pointer`}
                  >
                    <span>Launch Station {st.stationNumber}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="bg-slate-950 px-4 sm:px-6 py-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Click any of the 8 stations above to begin your laboratory investigation.</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Need to switch later? Use the top navigation bar anytime.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
