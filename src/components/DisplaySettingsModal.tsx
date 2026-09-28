import React from 'react';
import { 
  Type, 
  Sun, 
  Moon, 
  Eye, 
  Check, 
  X, 
  Palette, 
  Sparkles, 
  SlidersHorizontal,
  Monitor
} from 'lucide-react';

export type AppFontSize = 'normal' | 'large' | 'xl';
export type AppTheme = 'light' | 'dark' | 'high-contrast';

interface DisplaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fontSize: AppFontSize;
  onSelectFontSize: (size: AppFontSize) => void;
  theme: AppTheme;
  onSelectTheme: (th: AppTheme) => void;
}

export const DisplaySettingsModal: React.FC<DisplaySettingsModalProps> = ({
  isOpen,
  onClose,
  fontSize,
  onSelectFontSize,
  theme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const fontOptions: { id: AppFontSize; title: string; desc: string; badge: string; sample: string }[] = [
    {
      id: 'normal',
      title: 'Standard (100%)',
      desc: 'Balanced sizing for typical desktop monitors',
      badge: '16px Base',
      sample: 'Station 1: 0 Tablets · 23.5°C (+2.5°C)',
    },
    {
      id: 'large',
      title: 'Large (120% Zoom)',
      desc: 'Recommended for laptops, Chromebooks, and easy reading',
      badge: '19px Base · Recommended',
      sample: 'Station 2: 2 Tablets · 25.9°C (+4.9°C)',
    },
    {
      id: 'xl',
      title: 'Classroom / Smartboard (140%)',
      desc: 'Extra large fonts for classroom projectors, smartboards & accessibility',
      badge: '22px Base · High Visibility',
      sample: 'Station 3: 4 Tablets · 28.4°C (+7.4°C)',
    },
  ];

  const themeOptions: { 
    id: AppTheme; 
    name: string; 
    desc: string; 
    icon: React.ReactNode; 
    previewBg: string; 
    previewText: string;
    previewBorder: string;
  }[] = [
    {
      id: 'light',
      name: 'Classroom Light (Recommended)',
      desc: 'Bright clean white canvas with high-contrast dark text. Optimal for well-lit classrooms and projection screens.',
      icon: <Sun className="w-5 h-5 text-amber-500" />,
      previewBg: 'bg-white',
      previewText: 'text-slate-900',
      previewBorder: 'border-slate-300',
    },
    {
      id: 'dark',
      name: 'Dark Lab',
      desc: 'Deep slate-950 canvas with vivid luminous glowing text and reduced glare.',
      icon: <Moon className="w-5 h-5 text-indigo-400" />,
      previewBg: 'bg-slate-900',
      previewText: 'text-white',
      previewBorder: 'border-slate-700',
    },
    {
      id: 'high-contrast',
      name: 'High Contrast (Max Accessibility)',
      desc: 'Pure pitch black canvas with high-contrast text and bold colored accents.',
      icon: <Eye className="w-5 h-5 text-emerald-400" />,
      previewBg: 'bg-black',
      previewText: 'text-white font-bold',
      previewBorder: 'border-white',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-xl bg-slate-900 border-2 border-indigo-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="display-modal-title"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-sky-950 px-5 py-4 border-b border-indigo-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-400 text-indigo-300">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 id="display-modal-title" className="text-lg font-bold text-white flex items-center gap-2">
                <span>Display, Fonts & Color Options</span>
              </h2>
              <p className="text-xs text-indigo-200/80">
                Adjust font sizes and select color themes for optimal classroom visibility
              </p>
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Font Size Options */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Type className="w-4 h-4 text-sky-400" />
                <span>Text & Font Size Scale</span>
              </h3>
              <span className="text-xs text-sky-300 font-mono">
                {fontSize === 'normal' ? '100% Standard' : fontSize === 'large' ? '120% Large' : '140% Extra Large'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {fontOptions.map((opt) => {
                const isSelected = fontSize === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onSelectFontSize(opt.id)}
                    className={`p-3.5 rounded-xl border-2 text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-400 text-white shadow-md'
                        : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{opt.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{opt.desc}</p>
                      <div className="pt-1 font-mono text-xs text-amber-300 bg-slate-900/60 px-2 py-1 rounded inline-block">
                        {opt.sample}
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 ${
                      isSelected ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-slate-600'
                    }`}>
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Color Theme / Palette Options */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                <span>Color Theme & Contrast</span>
              </h3>
              <span className="text-xs text-amber-300 capitalize font-medium">
                {theme.replace('-', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {themeOptions.map((opt) => {
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onSelectTheme(opt.id)}
                    className={`p-3.5 rounded-xl border-2 text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-400 text-white shadow-md'
                        : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 shrink-0">
                        {opt.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{opt.name}</span>
                          {opt.id === 'light' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Best for Projectors
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">{opt.desc}</p>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 ${
                      isSelected ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-slate-600'
                    }`}>
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Preferences save automatically to your browser.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
