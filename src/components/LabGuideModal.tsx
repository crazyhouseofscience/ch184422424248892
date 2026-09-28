import React from 'react';
import { X, BookOpen, ShieldAlert, Sparkles, Sun, CheckCircle2, Flame } from 'lucide-react';

interface LabGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LabGuideModal: React.FC<LabGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4" />
          OpenSciEd Science Lab Guide
        </div>
        <h3 className="text-xl font-bold text-white">
          Greenhouse Effect & Bottle Atmosphere Investigation
        </h3>

        <div className="mt-4 space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Core Scientific Concept
            </h4>
            <p className="mt-1">
              Sunlight strikes Earth primarily as visible light. Earth's surface absorbs this energy and re-radiates it outward as lower-energy <strong>thermal infrared radiation</strong>. Greenhouse gases like carbon dioxide (CO₂) and water vapor (H₂O) have molecular bonds that bend and stretch at infrared frequencies, absorbing and re-emitting this heat back down toward the surface.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-400" />
              Chemical Effervescence Reaction
            </h4>
            <p className="mt-1 font-mono text-[11px] text-amber-300">
              3 NaHCO₃ (s) + C₆H₈O₇ (aq) → 3 CO₂ (g) + 3 H₂O (l) + Na₃C₆H₅O₇ (aq)
            </p>
            <p className="mt-1 text-slate-400 text-[11px]">
              When fizzing tablets dissolve in water, sodium bicarbonate reacts with citric acid to rapidly produce gaseous carbon dioxide, which fills the bottle headspace.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/50">
            <h4 className="font-bold text-rose-300 text-sm flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Critical OpenSciEd Safety Directives
            </h4>
            <ul className="mt-2 space-y-1.5 list-disc list-inside text-rose-200 text-[11px]">
              <li>Never place the plastic bottle closer than 6 inches from the heat lamp bulb to prevent melting.</li>
              <li>Separate water stations from electrical outlets. Use only GFI-protected circuits.</li>
              <li>Allow heat lamps to cool for 30 minutes after unplugging before touching metal parts.</li>
              <li>Always wear chemical splash goggles, nitrile gloves, and non-latex aprons.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow"
          >
            Got it, Return to Investigation
          </button>
        </div>
      </div>
    </div>
  );
};
