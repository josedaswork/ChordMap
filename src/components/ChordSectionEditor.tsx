import React from 'react';
import { Plus, Minus, Trash2, Music, Sparkles, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
    <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 p-3 sm:p-4 rounded-2xl space-y-3 shadow-2xs font-sans text-zinc-900 dark:text-zinc-100">
      {lines.length === 0 ? (
        <div className="text-center py-6 text-zinc-400 bg-white/60 dark:bg-zinc-800/40 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-4 space-y-1">
          <Music className="w-7 h-7 mx-auto stroke-[1.8] text-zinc-400 opacity-60" />
          <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
            Sección de acordes vacía
          </p>
          <p className="text-[11px] text-zinc-400 font-medium">
            Pulsa "+ Acorde" o "Nueva línea" abajo para comenzar.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {lines.map((line, lineIdx) => {
            const isActive = activeLineIndex === lineIdx;
            return (
              <motion.div
                key={lineIdx}
                layout
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  if (isActive) {
                    setActiveLineIndex(null);
                    setShowChordPicker(false);
                  } else {
                    setActiveLineIndex(lineIdx);
                    setShowChordPicker(true);
                  }
                }}
                className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  isActive 
                    ? "border-amber-400/80 bg-amber-50/60 dark:bg-amber-950/30 shadow-xs ring-1 ring-amber-400/30" 
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 bg-white dark:bg-zinc-850 shadow-2xs"
                }`}
              >
                {isActive && (
                  <span className="absolute -top-2.5 left-3 bg-amber-400 text-zinc-950 font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs">
                    Editando Línea
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-0.5">
                  {line.chords.length === 0 ? (
                    <span className="text-xs italic text-zinc-400">
                      Línea vacía. Elige un acorde del panel inferior...
                    </span>
                  ) : (
                    line.chords.map((chord, chordIdx) => (
                      <motion.div 
                        key={chordIdx}
                        layout
                        whileHover={{ scale: 1.05 }}
                        className="flex flex-col items-center bg-zinc-100/80 dark:bg-zinc-800/80 px-2.5 py-1 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60"
                      >
                        <span className="font-serif text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                          {chord.name}
                        </span>
                        {chord.beats > 1 ? (
                          <span className="font-mono text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/50 px-1.5 rounded-full mt-0.5">
                            {chord.beats} pulsos
                          </span>
                        ) : (
                          <span className="font-mono text-[8px] text-zinc-400">
                            1 pulso
                          </span>
                        )}
                      </motion.div>
                    ))
                  )}
                  {line.repeat > 1 && (
                    <span className="font-mono text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-full ml-auto">
                      ×{line.repeat} repeticiones
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Control Actions */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
          onClick={() => {
            setShowChordPicker(!showChordPicker);
            if (lines.length === 0) {
              updateParent([{ chords: [], repeat: 1 }]);
              setActiveLineIndex(0);
            } else if (activeLineIndex === null) {
              setActiveLineIndex(lines.length - 1);
            }
          }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-zinc-950 font-extrabold text-xs cursor-pointer shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
          <span>+ Acorde</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
          onClick={handleAddNewLine}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs cursor-pointer border border-zinc-200 dark:border-zinc-700 shadow-2xs transition-colors"
        >
          <Music className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Nueva Línea</span>
        </motion.button>
      </div>

      {/* Chord Line Controls Panel (Beats Adjust & Delete) */}
      <AnimatePresence>
        {activeLineIndex !== null && lines[activeLineIndex] && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.96 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 p-3 sm:p-3.5 rounded-2xl space-y-3 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <h5 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-200">
                Ajustes de Línea #{activeLineIndex + 1}
              </h5>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setActiveLineIndex(null)}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                Cerrar
              </motion.button>
            </div>

            {/* Adjust Chords inside line */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Pulsos por acorde:
              </span>
              <div className="flex flex-wrap gap-2">
                {lines[activeLineIndex].chords.map((chord, chordIdx) => (
                  <motion.div 
                    key={chordIdx} 
                    layout
                    className="inline-flex items-center border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-2.5 py-1 rounded-xl gap-2 shadow-2xs"
                  >
                    <div className="flex flex-col pr-1 border-r border-zinc-200 dark:border-zinc-700">
                      <span className="font-mono text-[9px] font-bold text-amber-600 dark:text-amber-400 leading-none">
                        {chord.beats}×
                      </span>
                      <span className="font-serif text-sm font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                        {chord.name}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={(e) => { e.stopPropagation(); handleAdjustBeats(activeLineIndex, chordIdx, 1); }}
                        className="p-1 bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 rounded-md cursor-pointer border border-zinc-200 dark:border-zinc-600"
                      >
                        <Plus className="w-2.5 h-2.5 text-zinc-800 dark:text-zinc-200" />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={(e) => { e.stopPropagation(); handleAdjustBeats(activeLineIndex, chordIdx, -1); }}
                        className="p-1 bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 rounded-md cursor-pointer border border-zinc-200 dark:border-zinc-600"
                      >
                        <Minus className="w-2.5 h-2.5 text-zinc-800 dark:text-zinc-200" />
                      </motion.button>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={(e) => { e.stopPropagation(); handleRemoveChord(activeLineIndex, chordIdx); }}
                      className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 rounded-md cursor-pointer ml-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Adjust Line Repeat */}
            <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-750 p-2.5 rounded-xl">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Repetir línea completa:
              </span>
              <div className="flex items-center gap-1.5">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => { e.stopPropagation(); handleAdjustLineRepeat(activeLineIndex, -1); }}
                  className="w-7 h-7 flex items-center justify-center bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer shadow-2xs"
                >
                  -
                </motion.button>
                <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 text-center w-8">
                  {lines[activeLineIndex].repeat}×
                </span>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => { e.stopPropagation(); handleAdjustLineRepeat(activeLineIndex, 1); }}
                  className="w-7 h-7 flex items-center justify-center bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer shadow-2xs"
                >
                  +
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preset & Custom Chord Picker with Spring */}
      <AnimatePresence>
        {showChordPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 p-3 sm:p-3.5 rounded-2xl space-y-3 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
              <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                Elegir acorde {activeLineIndex !== null ? `para Línea #${activeLineIndex + 1}` : ""}
              </span>
            </div>
            
            <form onSubmit={handleAddCustomChord} className="flex gap-2">
              <input
                type="text"
                value={customChordName}
                onChange={e => setCustomChordName(e.target.value)}
                placeholder="Ej: Cadd9, F#m, G/B..."
                className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40 font-serif"
              />
              <motion.button
                whileTap={{ scale: 0.92 }}
                type="submit"
                className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 text-xs font-bold rounded-xl cursor-pointer shadow-2xs"
              >
                Añadir
              </motion.button>
            </form>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-44 overflow-y-auto pr-1">
              {CHORD_PRESETS.map(chord => (
                <motion.button
                  key={chord}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.90 }}
                  type="button"
                  onClick={() => handleAddChordToActiveLine(chord)}
                  className="py-1.5 text-center font-serif text-xs font-bold bg-zinc-100 hover:bg-amber-100 dark:bg-zinc-800 dark:hover:bg-amber-950/60 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 hover:border-amber-400 rounded-xl cursor-pointer transition-colors"
                >
                  {chord}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
