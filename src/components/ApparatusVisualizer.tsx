import React from 'react';
import { StationEquipmentSetup } from '../types';

interface ApparatusVisualizerProps {
  setup: StationEquipmentSetup;
  stationNumber: 1 | 2 | 3;
  assignedTablets: number;
  isExperimentMode?: boolean;
  lampOn?: boolean;
  currentLiveTemp?: number;
  timerSeconds?: number;
  isBubbling?: boolean;
  isHeightValid?: boolean;
  isDistanceValid?: boolean;
  isCompact?: boolean;
  dissolutionProgress?: number; // 0 (solid) to 1 (fully dissolved)
}

export const ApparatusVisualizer: React.FC<ApparatusVisualizerProps> = ({
  setup,
  stationNumber,
  assignedTablets,
  isExperimentMode = false,
  lampOn = false,
  currentLiveTemp = 21.0,
  timerSeconds = 0,
  isBubbling = false,
  isHeightValid = true,
  isDistanceValid = true,
  isCompact = false,
  dissolutionProgress = 0,
}) => {
  // Clamp vertical position based on height (2" -> 235, 14" -> 85)
  const clampedHeight = Math.max(2, Math.min(14, setup.lampHeightInches));
  const clampY = 235 - (clampedHeight - 2) * 12.5;

  // Horizontal bottle position based on distance (4" -> 160, 14" -> 290)
  const clampedDistance = Math.max(4, Math.min(14, setup.lampDistanceInches));
  const bottleX = 160 + (clampedDistance - 4) * 13;

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const bottleColor = stationNumber === 1 ? '#38bdf8' : stationNumber === 2 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="relative w-full aspect-[16/10] sm:aspect-[16/10] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center select-none shadow-inner">
      {/* Visual Status Overlay Banner */}
      <div className="absolute top-2 left-2 z-10 flex flex-wrap items-center gap-1.5 text-[10px] font-mono pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-md border border-slate-800 text-slate-300 flex items-center gap-1.5 shadow">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: bottleColor }} />
          <span className="font-bold text-white">Station {stationNumber} · {assignedTablets === 0 ? 'Ambient Air' : `${assignedTablets} CO₂ Tablets`}</span>
        </div>

        {isExperimentMode ? (
          <div className={`px-2 py-1 rounded-md border flex items-center gap-1.5 shadow font-bold ${
            lampOn ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse' : 'bg-slate-900/90 border-slate-800 text-slate-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${lampOn ? 'bg-amber-400' : 'bg-slate-600'}`} />
            <span>150W Lamp: {lampOn ? 'ON (Radiating)' : 'OFF'}</span>
          </div>
        ) : (
          <div className="bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-md border border-slate-800 text-slate-300 flex items-center gap-2 shadow">
            <span className={isHeightValid ? 'text-emerald-400' : 'text-amber-400'}>
              H: {setup.lampHeightInches}" {isHeightValid && '✓'}
            </span>
            <span className="text-slate-600">|</span>
            <span className={setup.lampDistanceInches < 5 ? 'text-rose-400' : isDistanceValid ? 'text-emerald-400' : 'text-sky-400'}>
              Dist: {setup.lampDistanceInches}" {isDistanceValid && '✓'}
            </span>
          </div>
        )}
      </div>

      {/* Live Digital Readout Badge on top-right */}
      {isExperimentMode && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 font-mono text-[10px] pointer-events-none">
          <div className="bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-emerald-500/40 text-emerald-300 shadow flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>PROBE: </span>
            <strong className="text-emerald-400 text-xs">{currentLiveTemp.toFixed(1)}°C</strong>
          </div>
        </div>
      )}

      {/* Apparatus SVG */}
      <svg viewBox="0 0 400 250" className="w-full h-full">
        <defs>
          {/* Heat Lamp Radiant Beam Gradient */}
          <linearGradient id={`heatBeam-${stationNumber}`} x1="0%" y1="0%" x2="100%" y2="10%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.03" />
          </linearGradient>

          {/* Lamp Radiant Ambient Aura */}
          <radialGradient id={`lampAura-${stationNumber}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
            <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>

          {/* Plastic Bottle Glass Gradient */}
          <linearGradient id={`bottleGrad-${stationNumber}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.12" />
            <stop offset="30%" stopColor="#94a3b8" stopOpacity="0.05" />
            <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.15" />
          </linearGradient>

          {/* Water Pool Gradient */}
          <linearGradient id={`waterGrad-${stationNumber}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
          </linearGradient>

          {/* Filter for Heat Waves */}
          <filter id="heatWaveGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Laboratory Bench Surface */}
        <line x1="10" y1="225" x2="390" y2="225" stroke="#334155" strokeWidth="4" />
        <rect x="10" y="227" width="380" height="20" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
        <line x1="10" y1="232" x2="390" y2="232" stroke="#1e293b" strokeWidth="1" strokeDasharray="6 4" />

        {/* Wall Outlet on left wall */}
        <rect x="12" y="30" width="12" height="22" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1.2" />
        <circle cx="18" cy="37" r="1.5" fill={setup.lampPluggedIn ? '#4ade80' : '#475569'} />
        <circle cx="18" cy="45" r="1.5" fill={setup.lampPluggedIn ? '#4ade80' : '#475569'} />

        {/* Heavy Insulated Electrical Cord */}
        {setup.lampPluggedIn && (
          <path
            d={`M 18 45 C 24 130, 36 210, 68 ${clampY + 4}`}
            fill="none"
            stroke="#1e293b"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        )}

        {/* Heavy Metal Ring Stand */}
        <rect x="62" y="45" width="8" height="180" fill="#475569" rx="2" stroke="#334155" strokeWidth="0.8" />
        <rect x="42" y="221" width="48" height="6" fill="#334155" rx="2" stroke="#475569" strokeWidth="1" />

        {/* Clamp and Lamp Arm Assembly */}
        {setup.lampClamped && (
          <g>
            {/* Stand Clamp block */}
            <rect x="56" y={clampY - 8} width="20" height="16" fill="#334155" rx="3" stroke="#64748b" strokeWidth="1" />
            <circle cx="66" cy={clampY} r="3" fill="#94a3b8" />
            <line x1="58" y1={clampY} x2="74" y2={clampY} stroke="#1e293b" strokeWidth="1" />

            {/* Arm Extension */}
            <path d={`M 76 ${clampY} L 100 ${clampY}`} stroke="#64748b" strokeWidth="5" strokeLinecap="round" />

            {/* Metal Parabolic Lampshade */}
            <path
              d={`M 100 ${clampY - 14} L 135 ${clampY - 30} L 135 ${clampY + 30} L 100 ${clampY + 14} Z`}
              fill="#334155"
              stroke="#64748b"
              strokeWidth="1.5"
            />
            {/* Fixture Rim */}
            <ellipse cx="135" cy={clampY} rx="3" ry="30" fill="#475569" stroke="#94a3b8" strokeWidth="1" />

            {/* Light Bulb */}
            <circle cx="120" cy={clampY} r="10" fill={lampOn ? '#fbbf24' : '#64748b'} />
            {lampOn && (
              <>
                {/* Glowing Filament Core */}
                <circle cx="120" cy={clampY} r="6" fill="#fef08a" />
                <circle cx="120" cy={clampY} r="18" fill={`url(#lampAura-${stationNumber})`} />

                {/* Radiant Heat Rays / Conical Beam striking the bottle */}
                <polygon
                  points={`135,${clampY - 26} ${bottleX + 22},${clampY - 60} ${bottleX + 22},${clampY + 90} 135,${clampY + 26}`}
                  fill={`url(#heatBeam-${stationNumber})`}
                />

                {/* Dynamic Radiating Photon Wave Lines */}
                <path
                  d={`M 142 ${clampY - 10} Q ${(142 + bottleX) / 2} ${clampY - 18} ${bottleX - 18} ${clampY - 8}`}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  opacity="0.75"
                />
                <path
                  d={`M 142 ${clampY} L ${bottleX - 20} ${clampY}`}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                  opacity="0.85"
                />
                <path
                  d={`M 142 ${clampY + 10} Q ${(142 + bottleX) / 2} ${clampY + 18} ${bottleX - 18} ${clampY + 8}`}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  opacity="0.75"
                />
              </>
            )}

            {/* Height Ruler on stand (Setup mode) */}
            {!isExperimentMode && (
              <g>
                <line x1="50" y1="225" x2="50" y2={clampY} stroke={isHeightValid ? '#4ade80' : '#f59e0b'} strokeWidth="1.8" />
                <line x1="46" y1="225" x2="54" y2="225" stroke={isHeightValid ? '#4ade80' : '#f59e0b'} strokeWidth="1.5" />
                <line x1="46" y1={clampY} x2="54" y2={clampY} stroke={isHeightValid ? '#4ade80' : '#f59e0b'} strokeWidth="1.5" />
                <text
                  x="43"
                  y={(225 + clampY) / 2 + 3}
                  fill={isHeightValid ? '#4ade80' : '#f59e0b'}
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {setup.lampHeightInches}"
                </text>
              </g>
            )}

            {/* Distance Ruler between lamp rim and bottle (Setup mode) */}
            {!isExperimentMode && (
              <g>
                <line
                  x1="135"
                  y1="216"
                  x2={bottleX - 18}
                  y2="216"
                  stroke={isDistanceValid ? '#4ade80' : setup.lampDistanceInches < 5 ? '#f43f5e' : '#38bdf8'}
                  strokeWidth="1.8"
                  strokeDasharray="3 2"
                />
                <circle cx="135" cy="216" r="2" fill={isDistanceValid ? '#4ade80' : '#38bdf8'} />
                <circle cx={bottleX - 18} cy="216" r="2" fill={isDistanceValid ? '#4ade80' : '#38bdf8'} />
                <text
                  x={(135 + bottleX - 18) / 2}
                  y="212"
                  fill={setup.lampDistanceInches < 5 ? '#f43f5e' : isDistanceValid ? '#4ade80' : '#38bdf8'}
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {setup.lampDistanceInches}"
                </text>
              </g>
            )}
          </g>
        )}

        {/* 500 mL Plastic Bottle Assembly */}
        <g transform={`translate(${bottleX}, 115)`}>
          {/* Ambient Warmth Glow behind bottle when heating */}
          {lampOn && (
            <ellipse
              cx="0"
              cy="55"
              rx="30"
              ry="55"
              fill="#f59e0b"
              opacity="0.18"
              filter="url(#heatWaveGlow)"
            />
          )}

          {/* Bottle Profile */}
          <path
            d="M -10 -15 
               L 10 -15 
               L 10 0 
               L 18 15 
               L 18 105 
               C 18 108, 14 110, 8 110 
               L -8 110 
               C -14 110, -18 108, -18 105 
               L -18 15 
               L -10 0 Z"
            fill={`url(#bottleGrad-${stationNumber})`}
            stroke="#94a3b8"
            strokeWidth="1.8"
          />

          {/* Water Pool (50 mL) */}
          {setup.waterAddedMl > 0 && (
            <path
              d="M -17 80 L 17 80 L 17 105 C 17 108, 14 110, 8 110 L -8 110 C -14 110, -17 108, -17 105 Z"
              fill={`url(#waterGrad-${stationNumber})`}
            />
          )}

          {/* Dissolving Fizzing Tablets resting at bottom (Shrink as they dissolve) */}
          {setup.tabletsAdded > 0 && setup.waterAddedMl > 0 && (
            <g>
              {(() => {
                const tabletScale = Math.max(0, 1 - dissolutionProgress);
                if (tabletScale <= 0) return null;
                const rx = 3.6 * tabletScale;
                const ry = 2.0 * tabletScale;

                return Array.from({ length: setup.tabletsAdded }).map((_, idx) => (
                  <ellipse
                    key={idx}
                    cx={-8 + idx * (16 / Math.max(1, setup.tabletsAdded - 1))}
                    cy={105}
                    rx={rx}
                    ry={ry}
                    fill="#f1f5f9"
                    stroke="#cbd5e1"
                    strokeWidth="0.8"
                  />
                ));
              })()}
            </g>
          )}

          {/* Continuous Effervescent Fizzing Bubbles Rising */}
          {setup.tabletsAdded > 0 && setup.waterAddedMl > 0 && (
            <g opacity={dissolutionProgress >= 1 ? '0.45' : '0.9'}>
              {/* Column 1 */}
              <circle cx="-6" cy="100" r={dissolutionProgress >= 1 ? '1.2' : '2' } fill="#ffffff">
                <animate attributeName="cy" values="100;80;50;20" dur="1.7s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.7;0.3;0" dur="1.7s" repeatCount="indefinite" />
              </circle>
              {/* Column 2 */}
              <circle cx="3" cy="98" r={dissolutionProgress >= 1 ? '1.4' : '2.4'} fill="#ffffff">
                <animate attributeName="cy" values="98;72;40;10" dur="1.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.7;0.2;0" dur="1.4s" repeatCount="indefinite" />
              </circle>
              {/* Column 3 */}
              <circle cx="8" cy="102" r={dissolutionProgress >= 1 ? '1.0' : '1.8'} fill="#ffffff">
                <animate attributeName="cy" values="102;76;45;15" dur="2.1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.6;0.2;0" dur="2.1s" repeatCount="indefinite" />
              </circle>
              {/* Column 4 */}
              <circle cx="-11" cy="94" r={dissolutionProgress >= 1 ? '1.0' : '1.6'} fill="#ffffff">
                <animate attributeName="cy" values="94;70;35;5" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.5;0.2;0" dur="1.8s" repeatCount="indefinite" />
              </circle>
              {/* Micro bubbles */}
              <circle cx="0" cy="90" r="1.2" fill="#ffffff">
                <animate attributeName="cy" values="90;60;25;5" dur="1.3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.4;0" dur="1.3s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* GAS ESCAPING OUT OF OPEN MOUTH (When tablets added but not yet sealed!) */}
          {setup.tabletsAdded > 0 && setup.waterAddedMl > 0 && !(setup.plasticWrapApplied || setup.claySealed) && (
            <g>
              {/* Drifting Gas Plumes drifting out of mouth */}
              <path d="M -4 -15 Q -14 -35 -8 -56" fill="none" stroke="#e2e8f0" strokeWidth="1.6" strokeDasharray="3 2" opacity="0.75">
                <animate attributeName="d" values="M -4 -15 Q -14 -35 -8 -56; M -4 -15 Q 0 -35 -14 -60; M -4 -15 Q -14 -35 -8 -56" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.85;0.25;0.85" dur="2.2s" repeatCount="indefinite" />
              </path>
              <path d="M 4 -15 Q 14 -35 8 -58" fill="none" stroke="#e2e8f0" strokeWidth="1.6" strokeDasharray="3 2" opacity="0.75">
                <animate attributeName="d" values="M 4 -15 Q 14 -35 8 -58; M 4 -15 Q 0 -35 16 -62; M 4 -15 Q 14 -35 8 -58" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.85;0.25;0.85" dur="2.5s" repeatCount="indefinite" />
              </path>

              {/* Escaping CO2 particles */}
              <circle cx="-5" cy="-20" r="1.5" fill="#f8fafc">
                <animate attributeName="cy" values="-15;-60" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="cx" values="-3;-14" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0" dur="1.6s" repeatCount="indefinite" />
              </circle>
              <circle cx="5" cy="-20" r="1.8" fill="#f8fafc">
                <animate attributeName="cy" values="-15;-65" dur="1.9s" repeatCount="indefinite" />
                <animate attributeName="cx" values="3;16" dur="1.9s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0" dur="1.9s" repeatCount="indefinite" />
              </circle>

              {/* Escaping Warning Badge */}
              <g transform="translate(0, -70)">
                <rect x="-46" y="-8" width="92" height="13" rx="2" fill="#450a0a" stroke="#ef4444" strokeWidth="0.8" opacity="0.95" />
                <text x="0" y="1" fill="#fca5a5" fontSize="5.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                  ⚠️ GAS ESCAPING (SEAL MOUTH!)
                </text>
              </g>
            </g>
          )}

          {/* TRAPPED CO2 IN HEADSPACE (When sealed with plastic wrap and/or clay!) */}
          {setup.tabletsAdded > 0 && setup.waterAddedMl > 0 && (setup.plasticWrapApplied || setup.claySealed) && (
            <g>
              {/* Headspace Greenhouse Gas Atmosphere Tint */}
              <path
                d="M -10 0 L 10 0 L 18 15 L 18 80 L -18 80 L -18 15 Z"
                fill={stationNumber === 2 ? '#f59e0b' : '#f43f5e'}
                opacity={stationNumber === 2 ? '0.12' : '0.18'}
              />

              {/* Trapped Bouncing Gas Molecules inside enclosed headspace */}
              {[-8, -2, 4, 7, -6].map((xPos, idx) => (
                <circle key={idx} cx={xPos} cy={25 + idx * 10} r="1.3" fill="#ffffff" opacity="0.6">
                  <animate attributeName="cy" values={`${25 + idx * 10};${70 - idx * 8};${25 + idx * 10}`} dur={`${1.6 + idx * 0.3}s`} repeatCount="indefinite" />
                  <animate attributeName="cx" values={`${xPos};${xPos + (idx % 2 === 0 ? 5 : -5)};${xPos}`} dur={`${2.1 + idx * 0.3}s`} repeatCount="indefinite" />
                </circle>
              ))}

              {/* Trapped Confirmation Badge above seal */}
              <g transform="translate(0, -28)">
                <rect x="-44" y="-8" width="88" height="12" rx="2" fill="#064e3b" stroke="#10b981" strokeWidth="0.8" opacity="0.95" />
                <text x="0" y="0.5" fill="#6ee7b7" fontSize="5.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                  ✓ AIRTIGHT SEAL · CO₂ TRAPPED
                </text>
              </g>
            </g>
          )}

          {/* Thermometer Probe Wire & Rod */}
          {setup.probeInserted && (
            <g>
              {/* Probe Rod */}
              <line
                x1="0"
                y1="-22"
                x2="0"
                y2={setup.probePosition === 'headspace' ? '45' : '95'}
                stroke="#cbd5e1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Sensor Bulb Tip */}
              <circle
                cx="0"
                cy={setup.probePosition === 'headspace' ? '45' : '95'}
                r="2.2"
                fill={setup.probePosition === 'headspace' ? '#10b981' : '#f43f5e'}
              />

              {/* Probe Wire extending out of the bottle mouth towards bench meter */}
              <path
                d={`M 0 -22 C 10 -35, 25 -25, 35 25 S 30 95, 32 108`}
                fill="none"
                stroke="#0f172a"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Plastic Wrap Layer */}
          {setup.plasticWrapApplied && (
            <rect x="-12" y="-17" width="24" height="6" fill="#cbd5e1" opacity="0.6" rx="1.5" />
          )}

          {/* Modeling Clay Seal Collar */}
          {setup.claySealed && (
            <ellipse cx="0" cy="-14" rx="11" ry="4.5" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
          )}
        </g>

        {/* Digital Benchtop Thermometer */}
        <g transform={`translate(${bottleX + 28}, 198)`}>
          {/* Enclosure */}
          <rect x="0" y="0" width="46" height="26" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
          {/* LCD screen bezel */}
          <rect x="3" y="3" width="40" height="14" rx="1.5" fill="#020617" />
          {/* Live Glowing Temperature reading */}
          <text
            x="23"
            y="13.5"
            fill={lampOn ? '#34d399' : '#10b981'}
            fontSize="8.5"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="monospace"
          >
            {currentLiveTemp.toFixed(1)}°C
          </text>
          {/* Tiny labels */}
          <text x="23" y="22" fill="#94a3b8" fontSize="4.5" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">
            DIGITAL PROBE
          </text>
        </g>

        {/* Stopwatch Timer on Bench (when positioned) */}
        {setup.timerPositioned && (
          <g transform={`translate(${bottleX - 68}, 200)`}>
            {/* Stopwatch casing */}
            <rect x="0" y="0" width="38" height="24" rx="3.5" fill="#334155" stroke="#64748b" strokeWidth="1" />
            {/* Bezel */}
            <rect x="3" y="3" width="32" height="13" rx="1" fill="#020617" />
            {/* Digital Timer Text */}
            <text
              x="19"
              y="12.5"
              fill={timerSeconds > 0 ? '#38bdf8' : '#94a3b8'}
              fontSize="7.5"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {timeFormatted}
            </text>
            <text x="19" y="21" fill="#94a3b8" fontSize="4.5" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">
              15-MIN TIMER
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
