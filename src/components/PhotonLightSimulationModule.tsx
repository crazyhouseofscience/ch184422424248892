import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Sun } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'light' | 'heat';
  bounces: number;
  maxBounces: number;
  life: number;
  maxLife: number;
  bottleIdx: number; // 0: Control (0 tabs), 1: Medium CO2 (2 tabs), 2: High CO2 (4 tabs)
  canEscape: boolean; // strictly calculated based on bottle greenhouse density
}

interface Molecule {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vibratePhase: number;
  isAbsorbing: number; // frames of excited absorption vibration
  angle: number;
  rotSpeed: number;
}

interface PhotonLightSimulationProps {
  onBackToLab?: () => void;
}

export const PhotonLightSimulationModule: React.FC<PhotonLightSimulationProps> = ({ onBackToLab }) => {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [lampPowered, setLampPowered] = useState<boolean>(true);
  const [particleDensity, setParticleDensity] = useState<'low' | 'normal' | 'high'>('normal');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const moleculesRef = useRef<Molecule[][]>([[], [], []]); // [Setup 1: [], Setup 2: [...], Setup 3: [...]]
  const nextIdRef = useRef<number>(1);
  const animFrameRef = useRef<number | null>(null);
  const spawnAccumulatorRef = useRef<number>(0);

  // Initialize scientific CO2 molecules for Setups 2 and 3 in the air headspace
  useEffect(() => {
    // Setup 1 (0 Tablets): 0 CO2 molecules (ambient air)
    // Setup 2 (2 Tablets): 12 molecules
    // Setup 3 (4 Tablets): 34 molecules (dense effervescence gas)
    const bottleWidth = 120;
    const bottleTop = 135;
    const waterTop = 385;

    const setupMols: Molecule[][] = [[], [], []];

    for (let b = 1; b <= 2; b++) {
      const count = b === 1 ? 12 : 34;
      for (let m = 0; m < count; m++) {
        const u = Math.sin(m * 17.13 + b * 23.4) * 0.5 + 0.5;
        const v = Math.cos(m * 11.77 + b * 31.9) * 0.5 + 0.5;
        const relX = 20 + u * (bottleWidth - 40);
        const relY = bottleTop + 38 + v * (waterTop - bottleTop - 60);

        setupMols[b].push({
          x: relX,
          y: relY,
          baseX: relX,
          baseY: relY,
          vibratePhase: Math.random() * Math.PI * 2,
          isAbsorbing: 0,
          angle: (Math.random() - 0.5) * 0.8,
          rotSpeed: (Math.random() - 0.5) * 0.02,
        });
      }
    }

    moleculesRef.current = setupMols;
  }, []);

  const handleReset = () => {
    particlesRef.current = [];
    nextIdRef.current = 1;
    spawnAccumulatorRef.current = 0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isSubscribed = true;

    const render = () => {
      if (!isSubscribed) return;

      const width = canvas.width;
      const height = canvas.height;

      // 1. Dark Laboratory Background
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, width, height);

      const bayWidth = width / 3;

      // Bottle geometry in each bay
      const bottleWidth = 120;
      const bottleHeight = 285;
      const bottleY = 135;
      const waterHeight = 52;

      // Side Lamp geometry:
      // Lamp head positioned at mid-height (lampY ~ 275) to the side of the bottle
      const lampHeadY = 275;

      // Spawn incoming yellow light photons from SIDE lamps into bottles
      if (lampPowered && isRunning) {
        const rate = (particleDensity === 'low' ? 0.3 : particleDensity === 'normal' ? 0.6 : 1.1) * speedMultiplier;
        spawnAccumulatorRef.current += rate;

        while (spawnAccumulatorRef.current >= 1) {
          spawnAccumulatorRef.current -= 1;
          for (let b = 0; b < 3; b++) {
            const bayLeft = b * bayWidth;
            const standX = bayLeft + 35;
            const lampBulbX = standX + 42;
            const lampBulbY = lampHeadY;

            // Direct light beam horizontally toward the clear bottle wall
            const spreadY = (Math.random() - 0.5) * 40;
            const targetY = lampHeadY + spreadY;
            const angle = Math.atan2(targetY - lampBulbY, 120) + (Math.random() - 0.5) * 0.12;
            const speed = 3.2 + Math.random() * 0.4;

            particlesRef.current.push({
              id: nextIdRef.current++,
              x: lampBulbX,
              y: lampBulbY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              type: 'light',
              bounces: 0,
              maxBounces: 0,
              life: 0,
              maxLife: 900,
              bottleIdx: b,
              canEscape: true,
            });
          }
        }
      }

      // Update molecule vibrations and rotations
      if (isRunning) {
        for (let b = 1; b <= 2; b++) {
          const mols = moleculesRef.current[b];
          for (const mol of mols) {
            mol.angle += mol.rotSpeed * speedMultiplier;
            mol.vibratePhase += 0.12 * speedMultiplier;

            // When absorbing infrared heat, vibrational amplitude dramatically intensifies
            const amp = mol.isAbsorbing > 0 ? 3.8 : 0.9;
            mol.x = mol.baseX + Math.sin(mol.vibratePhase * 2.2) * amp;
            mol.y = mol.baseY + Math.cos(mol.vibratePhase * 1.8) * amp;
            if (mol.isAbsorbing > 0) mol.isAbsorbing -= 1;
          }
        }
      }

      // 2. Draw Apparatus for All 3 Setups (Pure Graphics, zero text)
      for (let b = 0; b < 3; b++) {
        const bayLeft = b * bayWidth;
        const bottleLeft = bayLeft + 185;
        const bottleRight = bottleLeft + bottleWidth;
        const bottleCenterX = bottleLeft + bottleWidth / 2;
        const bottleTop = bottleY;
        const bottleBottom = bottleY + bottleHeight;
        const waterTop = bottleBottom - waterHeight;

        // Subtle vertical division lines between bays
        if (b > 0) {
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 5]);
          ctx.beginPath();
          ctx.moveTo(bayLeft, 15);
          ctx.lineTo(bayLeft, height - 15);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Lab Bench Workbench Platform
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bayLeft + 12, height - 44, bayWidth - 24, 24);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(bayLeft + 12, height - 44, bayWidth - 24, 24);

        // --- Ring Stand & Clamp holding heat lamp from the SIDE ---
        const standX = bayLeft + 35;
        ctx.fillStyle = '#334155';
        ctx.fillRect(standX - 22, height - 46, 44, 8); // base plate
        ctx.fillStyle = '#64748b';
        ctx.fillRect(standX - 2.5, 60, 5, height - 106); // vertical steel rod
        // Clamp collar at mid height
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(standX - 4, lampHeadY - 10, 18, 20); // clamp boss
        ctx.fillRect(standX + 12, lampHeadY - 4, 16, 8);  // horizontal extension arm

        // --- SIDE REFLECTOR HEAT LAMP (Positioned at side, pointed horizontally right at the bottle) ---
        const lampX = standX + 32;
        const lampY = lampHeadY;

        // Reflector Dome profile facing RIGHT toward the bottle
        ctx.beginPath();
        ctx.moveTo(lampX, lampY - 35);
        ctx.quadraticCurveTo(lampX - 28, lampY, lampX, lampY + 35);
        ctx.lineTo(lampX + 14, lampY + 32);
        ctx.lineTo(lampX + 14, lampY - 32);
        ctx.closePath();
        ctx.fillStyle = '#334155';
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Socket and power cord at back
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(lampX - 32, lampY - 6, 12, 12);

        // Radiant Side Light Beam Cone toward bottle
        if (lampPowered) {
          const beamGrad = ctx.createLinearGradient(lampX + 12, lampY, bottleRight, lampY);
          beamGrad.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
          beamGrad.addColorStop(0.35, 'rgba(251, 191, 36, 0.22)');
          beamGrad.addColorStop(0.85, 'rgba(251, 191, 36, 0.08)');
          beamGrad.addColorStop(1, 'rgba(251, 191, 36, 0.01)');
          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(lampX + 14, lampY - 30);
          ctx.lineTo(bottleRight + 8, lampY - 80);
          ctx.lineTo(bottleRight + 8, lampY + 80);
          ctx.lineTo(lampX + 14, lampY + 30);
          ctx.closePath();
          ctx.fill();

          // Glowing Incandescent Bulb inside side reflector
          const bulbGrad = ctx.createRadialGradient(lampX + 8, lampY, 2, lampX + 8, lampY, 18);
          bulbGrad.addColorStop(0, '#ffffff');
          bulbGrad.addColorStop(0.45, '#fde047');
          bulbGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
          ctx.fillStyle = bulbGrad;
          ctx.beginPath();
          ctx.arc(lampX + 8, lampY, 18, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(lampX + 8, lampY, 8, 0, Math.PI * 2);
          ctx.fill();
        }

        // --- Bottle Atmospheric Chamber Ambient Coloration ---
        // Setup 1: Light cool sky tint
        // Setup 2: Warm ambient amber tint
        // Setup 3: Deep thermal rose-red (highest heat build-up because heat cannot escape)
        const chamberTint = b === 0 
          ? 'rgba(56, 189, 248, 0.04)' 
          : b === 1 
          ? 'rgba(245, 158, 11, 0.12)' 
          : 'rgba(244, 63, 94, 0.24)';
        ctx.fillStyle = chamberTint;
        ctx.fillRect(bottleLeft, bottleTop, bottleWidth, bottleHeight);

        // Water Layer at Bottom of Bottle
        const waterGrad = ctx.createLinearGradient(bottleLeft, waterTop, bottleLeft, bottleBottom);
        waterGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        waterGrad.addColorStop(1, 'rgba(2, 132, 199, 0.85)');
        ctx.fillStyle = waterGrad;
        ctx.fillRect(bottleLeft + 3, waterTop, bottleWidth - 6, waterHeight - 2);

        // Bottle Glass Silhouette
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const neckWidth = 44;
        ctx.moveTo(bottleCenterX - neckWidth / 2, bottleTop);
        ctx.lineTo(bottleCenterX - neckWidth / 2, bottleTop - 25);
        ctx.lineTo(bottleCenterX + neckWidth / 2, bottleTop - 25);
        ctx.lineTo(bottleCenterX + neckWidth / 2, bottleTop);
        // Shoulders & Body
        ctx.lineTo(bottleRight - 10, bottleTop + 22);
        ctx.lineTo(bottleRight, bottleTop + 38);
        ctx.lineTo(bottleRight, bottleBottom - 8);
        ctx.quadraticCurveTo(bottleRight, bottleBottom, bottleRight - 8, bottleBottom);
        ctx.lineTo(bottleLeft + 8, bottleBottom);
        ctx.quadraticCurveTo(bottleLeft, bottleBottom, bottleLeft, bottleBottom - 8);
        ctx.lineTo(bottleLeft, bottleTop + 38);
        ctx.lineTo(bottleLeft + 10, bottleTop + 22);
        ctx.closePath();
        ctx.stroke();

        // Rubber Stopper & Modeling Clay Seal at Neck
        ctx.fillStyle = '#334155';
        ctx.fillRect(bottleCenterX - neckWidth / 2 + 2, bottleTop - 28, neckWidth - 4, 10);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(bottleCenterX - neckWidth / 2 - 2, bottleTop - 35, neckWidth + 4, 9);

        // Digital Temperature Probe suspended in air headspace
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bottleCenterX, bottleTop - 36);
        ctx.lineTo(bottleCenterX, waterTop - 30);
        ctx.stroke();
        // Sensor Tip
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(bottleCenterX, waterTop - 30, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Dissolving Tablets & Rising Effervescence in Water for Setups 2 and 3
        if (b > 0) {
          const tabletCount = b === 1 ? 2 : 4;
          for (let t = 0; t < tabletCount; t++) {
            const tabSpacing = (bottleWidth - 40) / (tabletCount + 1);
            const tabX = bottleLeft + 20 + (t + 1) * tabSpacing;
            const tabY = bottleBottom - 10;
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.ellipse(tabX, tabY, 8, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Rising fizz bubbles
            if (isRunning) {
              const now = Date.now() / 150;
              for (let f = 0; f < 3; f++) {
                const bubbleY = tabY - 8 - ((now * 2.2 + t * 6 + f * 9) % (waterHeight - 14));
                const bubbleX = tabX + Math.sin(now + f + t) * 4;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
                ctx.beginPath();
                ctx.arc(bubbleX, bubbleY, 2.2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }

        // --- REALISTIC 3D-SHADED CO2 MOLECULES (O=C=O Linear Geometry) ---
        // Setup 2: 12 molecules | Setup 3: 34 molecules
        const mols = moleculesRef.current[b];
        if (mols && mols.length > 0) {
          for (const mol of mols) {
            const actualMolX = bottleLeft + mol.x;
            const actualMolY = mol.y;

            // Linear O=C=O geometry with slight thermal bending vibration
            const angle = mol.angle + Math.sin(mol.vibratePhase) * 0.15;
            const bondLen = 9.5; // realistic proportional spacing
            const rC = 4.2;      // Carbon atom radius
            const rO = 5.2;      // Oxygen atom radius (larger Van der Waals)

            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);

            // Oxygen 1 position
            const ox1X = actualMolX - cosA * bondLen;
            const ox1Y = actualMolY - sinA * bondLen;

            // Oxygen 2 position
            const ox2X = actualMolX + cosA * bondLen;
            const ox2Y = actualMolY + sinA * bondLen;

            // Excitation thermal glow when photon is absorbed
            if (mol.isAbsorbing > 0) {
              const glowGrad = ctx.createRadialGradient(actualMolX, actualMolY, 4, actualMolX, actualMolY, 18);
              glowGrad.addColorStop(0, 'rgba(244, 63, 94, 0.8)');
              glowGrad.addColorStop(0.6, 'rgba(244, 63, 94, 0.35)');
              glowGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
              ctx.fillStyle = glowGrad;
              ctx.beginPath();
              ctx.arc(actualMolX, actualMolY, 18, 0, Math.PI * 2);
              ctx.fill();
            }

            // Realistic double covalent bonds (O=C=O): Two parallel lines per bond
            const perpX = -sinA * 1.5;
            const perpY = cosA * 1.5;

            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.1;

            // Bond to Oxygen 1
            ctx.beginPath();
            ctx.moveTo(actualMolX + perpX, actualMolY + perpY);
            ctx.lineTo(ox1X + perpX, ox1Y + perpY);
            ctx.moveTo(actualMolX - perpX, actualMolY - perpY);
            ctx.lineTo(ox1X - perpX, ox1Y - perpY);
            // Bond to Oxygen 2
            ctx.moveTo(actualMolX + perpX, actualMolY + perpY);
            ctx.lineTo(ox2X + perpX, ox2Y + perpY);
            ctx.moveTo(actualMolX - perpX, actualMolY - perpY);
            ctx.lineTo(ox2X - perpX, ox2Y - perpY);
            ctx.stroke();

            // --- 3D Spherical Shaded Atoms (CPK standard: C = Dark Slate / Black, O = Vivid Red) ---
            // 1. Oxygen Atom 1
            const o1Grad = ctx.createRadialGradient(ox1X - 1.5, ox1Y - 1.5, 0.8, ox1X, ox1Y, rO);
            o1Grad.addColorStop(0, '#fca5a5'); // specular highlight
            o1Grad.addColorStop(0.4, '#ef4444'); // CPK red
            o1Grad.addColorStop(1, '#991b1b'); // deep shadow
            ctx.fillStyle = o1Grad;
            ctx.beginPath();
            ctx.arc(ox1X, ox1Y, rO, 0, Math.PI * 2);
            ctx.fill();

            // 2. Oxygen Atom 2
            const o2Grad = ctx.createRadialGradient(ox2X - 1.5, ox2Y - 1.5, 0.8, ox2X, ox2Y, rO);
            o2Grad.addColorStop(0, '#fca5a5');
            o2Grad.addColorStop(0.4, '#ef4444');
            o2Grad.addColorStop(1, '#991b1b');
            ctx.fillStyle = o2Grad;
            ctx.beginPath();
            ctx.arc(ox2X, ox2Y, rO, 0, Math.PI * 2);
            ctx.fill();

            // 3. Central Carbon Atom (drawn on top of bond overlap)
            const cGrad = ctx.createRadialGradient(actualMolX - 1.2, actualMolY - 1.2, 0.6, actualMolX, actualMolY, rC);
            cGrad.addColorStop(0, '#94a3b8'); // specular highlight
            cGrad.addColorStop(0.45, '#334155'); // CPK charcoal slate
            cGrad.addColorStop(1, '#0f172a'); // deep shadow
            ctx.fillStyle = cGrad;
            ctx.beginPath();
            ctx.arc(actualMolX, actualMolY, rC, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // 3. Process Photons & Heat Trapping Physics:
      // - Incoming side light enters through the clear bottle wall
      // - Converts to Infrared Heat
      // - ESCAPING ENERGY PHYSICS (Crucial greenhouse principle):
      //    * Setup 1 (0 Tabs - No CO2): ~80% of heat freely and rapidly escapes through walls/top!
      //    * Setup 2 (2 Tabs - Medium CO2): Only ~15% can escape. Most recirculates and bounces.
      //    * Setup 3 (4 Tabs - High CO2): Almost ZERO escaping energy (<2%). Overwhelmingly 100% trapped internally,
      //      causing back-radiation and thermal accumulation!
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        if (isRunning) {
          p.x += p.vx * speedMultiplier;
          p.y += p.vy * speedMultiplier;
          p.life += speedMultiplier;
        }

        const b = p.bottleIdx;
        const bayLeft = b * bayWidth;
        const bottleLeft = bayLeft + 185;
        const bottleRight = bottleLeft + bottleWidth;
        const bottleTop = bottleY;
        const bottleBottom = bottleY + bottleHeight;
        const waterTop = bottleBottom - waterHeight;

        // Transformation: Incoming yellow light enters bottle interior -> transforms to Infrared Heat
        if (p.type === 'light' && p.x >= bottleLeft + 12) {
          p.type = 'heat';
          p.bounces = 0;

          // Determine if this particle will EVER be allowed to escape:
          // Setup 1 (Control): 85% escape rate
          // Setup 2 (2 Tabs): Only 15% escape rate
          // Setup 3 (4 Tabs): Only 2% escape rate (near total retention!)
          const escapeRoll = Math.random();
          if (b === 0) {
            p.canEscape = escapeRoll < 0.85;
            p.maxBounces = 1;
          } else if (b === 1) {
            p.canEscape = escapeRoll < 0.15;
            p.maxBounces = p.canEscape ? 10 : 999;
          } else {
            p.canEscape = escapeRoll < 0.02; // Practically 0 escaping energy
            p.maxBounces = p.canEscape ? 25 : 999;
          }

          // Initial thermal scatter velocity
          const angle = (Math.random() - 0.5) * Math.PI * 2;
          const speed = 1.7 + Math.random() * 0.6;
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
        }

        // Behavior of Transformed Infrared Heat inside the Bottle Chamber
        if (p.type === 'heat') {
          // Check collision / absorption with realistic CO2 molecules for Setups 2 and 3
          if (b > 0) {
            const mols = moleculesRef.current[b];
            for (const mol of mols) {
              const actualMolX = bottleLeft + mol.x;
              const actualMolY = mol.y;
              const dist = Math.hypot(p.x - actualMolX, p.y - actualMolY);

              if (dist < 16) {
                mol.isAbsorbing = 16; // excited vibration glow
                p.bounces++;
                // Re-radiate back in arbitrary direction (greenhouse back-radiation)
                const scatAngle = Math.random() * Math.PI * 2;
                const spd = 1.5 + Math.random() * 0.6;
                p.vx = Math.cos(scatAngle) * spd;
                p.vy = Math.sin(scatAngle) * spd;
                break;
              }
            }
          }

          // Chamber boundary containment:
          // If particle cannot escape (or hasn't reached its max bounces), keep it strictly INSIDE the bottle
          const isStillTrapped = !p.canEscape || p.bounces < p.maxBounces;

          if (isStillTrapped) {
            if (p.x <= bottleLeft + 5) {
              p.x = bottleLeft + 5;
              p.vx = Math.abs(p.vx);
              p.bounces++;
            } else if (p.x >= bottleRight - 5) {
              p.x = bottleRight - 5;
              p.vx = -Math.abs(p.vx);
              p.bounces++;
            }

            if (p.y <= bottleTop + 14) {
              p.y = bottleTop + 14;
              p.vy = Math.abs(p.vy);
              p.bounces++;
            } else if (p.y >= waterTop) {
              p.y = waterTop;
              p.vy = -Math.abs(p.vy);
              p.bounces++;
            }
          } else {
            // Only particles flagged as permitted to escape (mostly Bottle 1, very few Bottle 2, virtually none Bottle 3)
            // Drift upward/outward into the atmosphere
            if (p.vy > -0.7) p.vy -= 0.08 * speedMultiplier;
            if (p.x < bottleLeft || p.x > bottleRight) {
              p.vx *= 1.02;
            }
          }
        }

        // Draw Particle Waves
        if (p.type === 'light') {
          // Yellow incoming side light wave
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = '#fde047';
          ctx.fill();

          ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(p.x - p.vx * 3.5, p.y - p.vy * 3.5);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        } else {
          // Infrared heat photon (warm red-orange)
          const heatColor = b === 2 ? '#f43f5e' : '#f97316';
          const glowColor = b === 2 ? 'rgba(244, 63, 94, 0.35)' : 'rgba(249, 115, 22, 0.25)';

          // Outer heat halo
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = glowColor;
          ctx.fill();

          // Core photon
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = heatColor;
          ctx.fill();

          // Infrared wave tail
          ctx.strokeStyle = b === 2 ? 'rgba(244, 63, 94, 0.65)' : 'rgba(249, 115, 22, 0.6)';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(p.x - p.vx * 3.5, p.y - p.vy * 3.5);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }

        // Remove out-of-bounds particles or particles past maximum lifetime
        if (
          p.y > height + 25 ||
          p.y < -35 ||
          p.x < bayLeft - 25 ||
          p.x > bayLeft + bayWidth + 25 ||
          p.life > p.maxLife
        ) {
          particles.splice(i, 1);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, speedMultiplier, lampPowered, particleDensity]);

  return (
    <div className="w-full h-full flex flex-col justify-between space-y-3 p-2 sm:p-4 select-none animate-fadeIn">
      {/* Visual Canvas Container */}
      <div className="relative w-full flex-1 min-h-[520px] bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={1050}
          height={560}
          className="w-full h-full object-contain block"
        />
      </div>

      {/* Pure Icon Graphic Interactive Control Bar (NO TEXT DESCRIPTORS) */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 shadow-xl backdrop-blur-md shrink-0">
        {/* Left: Play / Pause & Reset Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`p-2.5 rounded-xl font-bold transition shadow-lg flex items-center justify-center ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
            title={isRunning ? 'Pause' : 'Play'}
            aria-label={isRunning ? 'Pause' : 'Play'}
          >
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Reset"
            aria-label="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Lamp Power Toggle */}
          <button
            onClick={() => setLampPowered(!lampPowered)}
            className={`p-2.5 rounded-xl transition border shadow-md flex items-center justify-center ${
              lampPowered
                ? 'bg-yellow-500/20 border-yellow-500/60 text-yellow-300 ring-1 ring-yellow-400/40'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title="Power"
            aria-label="Power"
          >
            <Sun className={`w-5 h-5 ${lampPowered ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Center: Particle Density Selector (Icons Only) */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setParticleDensity('low')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 ${
              particleDensity === 'low'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Low"
          >
            <span>•</span>
          </button>
          <button
            onClick={() => setParticleDensity('normal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 ${
              particleDensity === 'normal'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Medium"
          >
            <span>••</span>
          </button>
          <button
            onClick={() => setParticleDensity('high')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 ${
              particleDensity === 'high'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="High"
          >
            <span>•••</span>
          </button>
        </div>

        {/* Right: Simulation Speed (1x, 2x, 3x) */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[1, 2, 3].map(s => (
            <button
              key={s}
              onClick={() => setSpeedMultiplier(s)}
              className={`px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold transition ${
                speedMultiplier === s
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
