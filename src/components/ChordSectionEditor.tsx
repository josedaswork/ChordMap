import React from 'react';
import { Plus, Minus, Trash2, Music } from 'lucide-react';
import { ChordLine, ChordItem } from '../types';

interface ChordSectionEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export const CHORD_PRESETS = [
  "C", "Cadd9", "Cmaj7", "Cm", "C/E", 
  "G", "G6", "Gmaj7", "Gm", "G/B", 
  "D", "Dsus4", "Dsus2", "Dm", "D7", "D/F#", 
  "A", "Asus4", "Amaj7", "Am", "Am7", 
  "E", "Esus4", "E7", "Em", "Em7", 
  "F", "Fmaj7", "Fadd9", "Fm", 
  "B", "Bm", "Bm7", "B7"
];

export const ChordSectionEditor: React.FC<ChordSectionEditorProps> = ({
  content,
  onChange,
}) => {
  let lines: ChordLine[] = [];
  try {
    const parsed = content ? JSON.parse(content) : [];
    if (Array.isArray(parsed)) {
      lines = parsed.map(line => ({
        chords: line && Array.isArray(line.chords) ? line.chords : [],
        repeat: line && typeof line.repeat === 'number' ? line.repeat : 1
      }));
    } else {
      lines = [];
    }
  } catch {
    lines = [];
  }

  const [activeLineIndex, setActiveLineIndex] = React.useState<number | null>(null);
  const [showChordPicker, setShowChordPicker] = React.useState(false);
  const [customChordName, setCustomChordName] = React.useState("");

  const updateParent = (newLines: ChordLine[]) => {
    onChange(JSON.stringify(newLines));
  };

  const handleAddChordToActiveLine = (chordName: string) => {
    const lineIndex = activeLineIndex !== null ? activeLineIndex : lines.length > 0 ? lines.length - 1 : null;
    
    if (lines.length === 0 || lineIndex === null || lineIndex < 0) {
      updateParent([{
        chords: [{ name: chordName, beats: 1 }],
        repeat: 1
      }]);
      setActiveLineIndex(0);
    } else {
      const updated = lines.map((line, idx) => idx === lineIndex ? {
        ...line,
        chords: [...line.chords, { name: chordName, beats: 1 }]
      } : line);
      updateParent(updated);
    }
  };

  const handleAdjustBeats = (lineIdx: number, chordIdx: number, delta: number) => {
    const updated = lines.map((line, lIdx) => {
      if (lIdx === lineIdx) {
        const updatedChords = line.chords.map((chord, cIdx) => cIdx === chordIdx ? {
          ...chord,
          beats: Math.max(1, chord.beats + delta)
        } : chord);
        return { ...line, chords: updatedChords };
      }
      return line;
    });
    updateParent(updated);
  };

  const handleRemoveChord = (lineIdx: number, chordIdx: number) => {
    const updated = lines.map((line, lIdx) => {
      if (lIdx === lineIdx) {
        const filteredChords = line.chords.filter((_, cIdx) => cIdx !== chordIdx);
        return { ...line, chords: filteredChords };
      }
      return line;
    }).filter(line => line.chords.length > 0);
    
    updateParent(updated);
    if (updated.length === 0) {
      setActiveLineIndex(null);
    } else if (activeLineIndex !== null && activeLineIndex >= updated.length) {
      setActiveLineIndex(updated.length - 1);
    }
  };

  const handleAdjustLineRepeat = (lineIdx: number, delta: number) => {
    const updated = lines.map((line, idx) => idx === lineIdx ? {
      ...line,
      repeat: Math.max(1, line.repeat + delta)
    } : line);
    updateParent(updated);
  };

  const handleAddNewLine = () => {
    const newLines = [...lines, { chords: [], repeat: 1 }];
    updateParent(newLines);
    setActiveLineIndex(newLines.length - 1);
    setShowChordPicker(true);
  };

  const handleAddCustomChord = (e: React.FormEvent) => {
    e.preventDefault();
    const chord = customChordName.trim();
    if (chord) {
      handleAddChordToActiveLine(chord);
      setCustomChordName("");
    }
  };

  return (
    <div className="bg-zinc-50 border-3 border-black p-4 space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      {lines.length === 0 ? (
        <div className="text-center py-8 text-zinc-400 bg-white border-2 border-dashed border-zinc-300 rounded-lg p-4">
          <Music className="w-8 h-8 mx-auto stroke-[1.5] mb-2 opacity-50 text-zinc-400" />
          <p className="text-xs font-bold uppercase tracking-wider">
            Sección de acordes vacía
          </p>
          <p className="text-[11px] text-zinc-500 mt-1 font-semibold">
            Toca "+ Acorde" o "Nueva línea" de abajo para empezar.
          </p>
        </div>
      ) : (
        <div className="space-y-3 font-sans">
          {lines.map((line, lineIdx) => {
            const isActive = activeLineIndex === lineIdx;
            return (
              <div
                key={lineIdx}
                onClick={() => {
                  if (isActive) {
                    setActiveLineIndex(null);
                    setShowChordPicker(false);
                  } else {
                    setActiveLineIndex(lineIdx);
                    setShowChordPicker(true);
                  }
                }}
                className={`relative p-3 border-2 transition-all cursor-pointer ${isActive ? "border-black bg-yellow-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "border-zinc-300 hover:border-black bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"}`}
              >
                {isActive && (
                  <span className="absolute -top-2.5 -left-2 bg-black text-yellow-300 font-mono text-[9px] font-black uppercase px-1.5 py-0.5 border border-black z-10">
                    EDICIÓN ACTIVA
                  </span>
                )}
                <div className="flex flex-wrap items-start gap-x-5 gap-y-3 pt-1">
                  {line.chords.map((chord, chordIdx) => (
                    <div key={chordIdx} className="flex flex-col items-center">
                      <span className="font-serif text-xl sm:text-2xl font-black text-black">
                        {chord.name}
                      </span>
                      {chord.beats > 1 && (
                        <span className="font-mono text-[9px] font-bold text-zinc-500 bg-zinc-100 border border-zinc-300 px-1 rounded mt-0.5">
                          {chord.beats} pulsos
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

      {/* Control Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setShowChordPicker(!showChordPicker);
            if (lines.length === 0) {
              updateParent([{ chords: [], repeat: 1 }]);
              setActiveLineIndex(0);
            } else if (activeLineIndex === null) {
              setActiveLineIndex(lines.length - 1);
            }
          }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border-3 border-black bg-yellow-300 text-black font-black text-xs uppercase tracking-wide cursor-pointer hover:bg-yellow-400 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ Acorde</span>
        </button>
        <button
          onClick={handleAddNewLine}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border-3 border-black bg-white text-black font-black text-xs uppercase tracking-wide cursor-pointer hover:bg-zinc-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
        >
          <Music className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Nueva Línea</span>
        </button>
      </div>

      {/* Chord Line Controls Panel (Beats Adjust & Delete) */}
      {activeLineIndex !== null && lines[activeLineIndex] && (
        <div className="bg-white border-2 border-black p-3 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h5 className="font-black text-xs uppercase tracking-wider text-black">
              Línea #{activeLineIndex + 1} - Configuración
            </h5>
            <button
              onClick={() => setActiveLineIndex(null)}
              className="text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black hover:bg-zinc-100 cursor-pointer text-black"
            >
              Cerrar panel
            </button>
          </div>

          {/* Adjust Chords inside line */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-zinc-500">
              Modificar acordes en esta línea:
            </span>
            <div className="flex flex-wrap gap-2">
              {lines[activeLineIndex].chords.map((chord, chordIdx) => (
                <div key={chordIdx} className="inline-flex items-center border-2 border-black bg-zinc-50 px-2 py-1 gap-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
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
                      onClick={(e) => { e.stopPropagation(); handleAdjustBeats(activeLineIndex, chordIdx, 1); }}
                      className="p-0.5 bg-white hover:bg-zinc-200 border border-black rounded cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5 text-black" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAdjustBeats(activeLineIndex, chordIdx, -1); }}
                      className="p-0.5 bg-white hover:bg-zinc-200 border border-black rounded cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5 text-black" />
                    </button>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveChord(activeLineIndex, chordIdx); }}
                    className="p-1 hover:bg-red-100 text-red-600 rounded cursor-pointer ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Adjust Line Repeat */}
          <div className="flex items-center justify-between bg-zinc-50 border-2 border-black p-2.5">
            <span className="text-xs font-black uppercase text-black">
              Repetir línea completa:
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleAdjustLineRepeat(activeLineIndex, -1); }}
                className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-zinc-200 font-bold text-black cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                -
              </button>
              <span className="font-mono text-sm font-black text-black text-center w-10">
                {lines[activeLineIndex].repeat}×
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleAdjustLineRepeat(activeLineIndex, 1); }}
                className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-zinc-200 font-bold text-black cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preset & Custom Chord Picker */}
      {showChordPicker && (
        <div className="bg-white border-3 border-black p-3 space-y-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
            <span className="text-[10px] font-black uppercase text-black">
              Elegir acorde {activeLineIndex !== null ? `para Línea #${activeLineIndex + 1}` : ""}
            </span>
          </div>
          
          <form onSubmit={handleAddCustomChord} className="flex gap-1.5">
            <input
              type="text"
              value={customChordName}
              onChange={e => setCustomChordName(e.target.value)}
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

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {CHORD_PRESETS.map(chord => (
              <button
                key={chord}
                type="button"
                onClick={() => handleAddChordToActiveLine(chord)}
                className="py-1 text-center font-serif text-xs font-black bg-zinc-100 hover:bg-yellow-300 border border-black hover:border-black rounded cursor-pointer transition-colors text-black"
              >
                {chord}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
