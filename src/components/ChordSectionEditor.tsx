import React, { useState } from 'react';
import { ChordLine, ChordItem } from '../types';
import { Plus, Minus, Trash, Check, Music } from 'lucide-react';

export const COMMON_CHORDS = [
  "C", "Cadd9", "Cmaj7", "Cm", "C/E",
  "G", "G6", "Gmaj7", "Gm", "G/B",
  "D", "Dsus4", "Dsus2", "Dm", "D7", "D/F#",
  "A", "Asus4", "Amaj7", "Am", "Am7",
  "E", "Esus4", "E7", "Em", "Em7",
  "F", "Fmaj7", "Fadd9", "Fm",
  "B", "Bm", "Bm7", "B7"
];

interface ChordSectionEditorProps {
  content: string;
  onChange: (newContent: string) => void;
}

export default function ChordSectionEditor({ content, onChange }: ChordSectionEditorProps) {
  // Parse content
  let lines: ChordLine[] = [];
  try {
    const parsed = content ? JSON.parse(content) : [];
    if (Array.isArray(parsed)) {
      lines = parsed.map(item => ({
        chords: item && Array.isArray(item.chords) ? item.chords : [],
        repeat: item && typeof item.repeat === 'number' ? item.repeat : 1
      }));
    } else {
      lines = [];
    }
  } catch (err) {
    lines = [];
  }

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [customChord, setCustomChord] = useState('');

  const save = (newLines: ChordLine[]) => {
    onChange(JSON.stringify(newLines));
  };

  const addChordToActive = (chordName: string) => {
    const lineIndex = activeIndex !== null ? activeIndex : (lines.length > 0 ? lines.length - 1 : null);
    
    if (lines.length === 0 || lineIndex === null || lineIndex < 0) {
      const newLines: ChordLine[] = [{ chords: [{ name: chordName, beats: 1 }], repeat: 1 }];
      save(newLines);
      setActiveIndex(0);
    } else {
      const updated = lines.map((line, idx) => {
        if (idx === lineIndex) {
          return {
            ...line,
            chords: [...line.chords, { name: chordName, beats: 1 }]
          };
        }
        return line;
      });
      save(updated);
    }
  };

  const updateBeat = (lineIdx: number, chordIdx: number, delta: number) => {
    const updated = lines.map((line, li) => {
      if (li === lineIdx) {
        const newChords = line.chords.map((chord, ci) => {
          if (ci === chordIdx) {
            return { ...chord, beats: Math.max(1, chord.beats + delta) };
          }
          return chord;
        });
        return { ...line, chords: newChords };
      }
      return line;
    });
    save(updated);
  };

  const removeChord = (lineIdx: number, chordIdx: number) => {
    const updated = lines.map((line, li) => {
      if (li === lineIdx) {
        const filtered = line.chords.filter((_, ci) => ci !== chordIdx);
        return { ...line, chords: filtered };
      }
      return line;
    }).filter(line => line.chords.length > 0);

    save(updated);
    if (updated.length === 0) {
      setActiveIndex(null);
    } else if (activeIndex !== null && activeIndex >= updated.length) {
      setActiveIndex(updated.length - 1);
    }
  };

  const updateRepeat = (lineIdx: number, delta: number) => {
    const updated = lines.map((line, li) => {
      if (li === lineIdx) {
        return { ...line, repeat: Math.max(1, line.repeat + delta) };
      }
      return line;
    });
    save(updated);
  };

  const addLine = () => {
    const nextLines = [...lines, { chords: [], repeat: 1 }];
    save(nextLines);
    setActiveIndex(nextLines.length - 1);
    setShowPicker(true);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customChord.trim();
    if (clean) {
      addChordToActive(clean);
      setCustomChord('');
    }
  };

  return (
    <div className="bg-zinc-50 border-3 border-black p-4 space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      {/* Existing lines */}
      {lines.length === 0 ? (
        <div className="text-center py-8 text-zinc-400 bg-white border-2 border-dashed border-zinc-300 rounded-lg p-4">
          <Music className="w-8 h-8 mx-auto stroke-[1.5] mb-2 opacity-50" />
          <p className="text-xs font-bold uppercase tracking-wider">Sección de acordes vacía</p>
          <p className="text-[11px] text-zinc-550 mt-1 font-semibold">Toca "+ Acorde" o "Nueva línea" de abajo para empezar.</p>
        </div>
      ) : (
        <div className="space-y-3 font-sans">
          {lines.map((line, li) => {
            const isActive = activeIndex === li;
            return (
              <div
                key={li}
                onClick={() => {
                  if (isActive) {
                    setActiveIndex(null);
                    setShowPicker(false);
                  } else {
                    setActiveIndex(li);
                    setShowPicker(true);
                  }
                }}
                className={`relative p-3 border-2 transition-all cursor-pointer ${
                  isActive 
                    ? 'border-black bg-yellow-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                    : 'border-zinc-300 hover:border-black bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                {/* Active Indicator Pin */}
                {isActive && (
                  <span className="absolute -top-2.5 -left-2 bg-black text-yellow-300 font-mono text-[9px] font-black uppercase px-1.5 py-0.5 border border-black z-10">
                    EDICIÓN ACTIVA
                  </span>
                )}

                <div className="flex flex-wrap items-start gap-x-5 gap-y-3 pt-1">
                  {line.chords.map((item, ci) => (
                    <div key={ci} className="flex flex-col items-center">
                      <span className="font-serif text-xl sm:text-2xl font-black text-black">
                        {item.name}
                      </span>
                      {item.beats > 1 && (
                        <span className="font-mono text-[9px] font-bold text-zinc-500 bg-zinc-100 border border-zinc-300 px-1 rounded mt-0.5">
                          {item.beats} pulsos
                        </span>
                      )}
                    </div>
                  ))}

                  {line.repeat > 1 && (
                    <span className="font-mono text-sm font-black text-zinc-600 self-center bg-zinc-100 border-2 border-black px-1.5 py-0.5 ml-auto">
                      ×{line.repeat}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor controls for active line */}
      {activeIndex !== null && lines[activeIndex] && (
        <div className="bg-white border-2 border-black p-3 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h5 className="font-black text-xs uppercase tracking-wider text-black">
              Línea #{activeIndex + 1} - Configuración
            </h5>
            <button
              onClick={() => setActiveIndex(null)}
              className="text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black hover:bg-zinc-100 cursor-pointer"
            >
              Cerrar panel
            </button>
          </div>

          {/* List of chords in active tools */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-zinc-500">
              Modificar acordes en esta línea:
            </span>
            
            <div className="flex flex-wrap gap-2">
              {lines[activeIndex].chords.map((chord, ci) => (
                <div 
                  key={ci} 
                  className="inline-flex items-center border-2 border-black bg-zinc-50 px-2 py-1 gap-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex flex-col pr-1 border-r border-zinc-300">
                    <span className="font-mono text-[9px] font-black text-zinc-400 leading-none">
                      {chord.beats}×
                    </span>
                    <span className="font-serif text-sm font-black text-black leading-tight">
                      {chord.name}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateBeat(activeIndex, ci, 1);
                      }}
                      className="p-0.5 bg-white hover:bg-zinc-200 border border-black rounded cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5 text-black" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateBeat(activeIndex, ci, -1);
                      }}
                      className="p-0.5 bg-white hover:bg-zinc-200 border border-black rounded cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5 text-black" />
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeChord(activeIndex, ci);
                    }}
                    className="p-1 hover:bg-red-100 text-red-600 rounded cursor-pointer ml-1"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Line Repeat Controller */}
          <div className="flex items-center justify-between bg-zinc-50 border-2 border-black p-2.5">
            <span className="text-xs font-black uppercase text-black">
              Repetir línea completa:
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateRepeat(activeIndex, -1);
                }}
                className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-zinc-200 font-bold text-black cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                -
              </button>
              <span className="font-mono text-sm font-black text-black text-center w-10">
                {lines[activeIndex].repeat}×
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateRepeat(activeIndex, 1);
                }}
                className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-zinc-200 font-bold text-black cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary line action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setShowPicker(!showPicker);
            if (lines.length === 0) {
              const fresh: ChordLine[] = [{ chords: [], repeat: 1 }];
              save(fresh);
              setActiveIndex(0);
            } else if (activeIndex === null) {
              setActiveIndex(lines.length - 1);
            }
          }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border-3 border-black bg-yellow-300 text-black font-black text-xs uppercase tracking-wide cursor-pointer hover:bg-yellow-400 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ Acorde</span>
        </button>

        <button
          onClick={addLine}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border-3 border-black bg-white text-black font-black text-xs uppercase tracking-wide cursor-pointer hover:bg-zinc-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
        >
          <Music className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Nueva Línea</span>
        </button>
      </div>

      {/* Chord Selection Picker Panel */}
      {showPicker && (
        <div className="bg-white border-3 border-black p-3 space-y-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
            <span className="text-[10px] font-black uppercase text-black">
              Elegir acorde {activeIndex !== null ? `para Línea #${activeIndex + 1}` : ''}
            </span>
          </div>

          {/* Custom entry form */}
          <form onSubmit={handleCustomSubmit} className="flex gap-1.5">
            <input
              type="text"
              value={customChord}
              onChange={(e) => setCustomChord(e.target.value)}
              placeholder="Ej: Cadd9, F#m, G/B..."
              className="flex-1 px-2 py-1.5 text-xs font-bold border-2 border-black bg-white text-black focus:outline-none placeholder:text-zinc-400 font-serif"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-black text-white text-xs font-black uppercase cursor-pointer hover:bg-zinc-800"
            >
              OK
            </button>
          </form>

          {/* Quick grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {COMMON_CHORDS.map((chord) => (
              <button
                key={chord}
                type="button"
                onClick={() => addChordToActive(chord)}
                className="py-1 text-center font-serif text-xs font-black bg-zinc-100 hover:bg-yellow-300 border border-black hover:border-black rounded cursor-pointer transition-colors"
              >
                {chord}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
