import React from 'react';
import { 
  Plus, Minus, Trash2, Music, Sparkles, X, Check, 
  GripVertical, ChevronLeft, ChevronRight, Flame, Star, Edit3, Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChordLine, ChordItem, Song } from '../types';
import { getCommonChords } from '../utils/chordFrequency';
import { getGlobalCustomChords, ChordShape, getChordShape } from '../utils/chordShapes';
import { MiniChordDiagram } from './MiniChordDiagram';
import { playChordStrum } from '../utils/audio';

interface ChordSectionEditorProps {
  content: string;
  onChange: (content: string) => void;
  allSongs?: Song[];
  customChords?: Record<string, ChordShape>;
  mainChords?: string[];
  isEditing?: boolean;
  onToggleEdit?: () => void;
  onChordClick?: (name: string) => void;
  tuning?: string;
  capo?: number;
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
  allSongs = [],
  customChords = {},
  mainChords = [],
  isEditing = false,
  onToggleEdit,
  onChordClick,
  tuning = "Estándar",
  capo = 0,
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

  // Drag and drop states
  const [draggedChord, setDraggedChord] = React.useState<{ lineIdx: number; chordIdx: number } | null>(null);
  const [dragOverInfo, setDragOverInfo] = React.useState<{ lineIdx: number; chordIdx: number; pos: 'before' | 'after' } | null>(null);
  const [dragOverLine, setDragOverLine] = React.useState<number | null>(null);

  // Common chords across all songs in the library
  const commonChords = React.useMemo(() => {
    return getCommonChords(allSongs);
  }, [allSongs]);

  // Global custom / rare chords that were edited or saved
  const globalCustomChords = React.useMemo(() => {
    const globalDict = getGlobalCustomChords(allSongs);
    return { ...globalDict, ...customChords };
  }, [allSongs, customChords]);

  const customChordNames = React.useMemo(() => {
    return Object.keys(globalCustomChords);
  }, [globalCustomChords]);

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

  const handleSetChordBeats = (lineIdx: number, chordIdx: number, beats: number) => {
    const updated = lines.map((line, lIdx) => {
      if (lIdx === lineIdx) {
        const updatedChords = line.chords.map((chord, cIdx) => cIdx === chordIdx ? {
          ...chord,
          beats: Math.max(1, beats)
        } : chord);
        return { ...line, chords: updatedChords };
      }
      return line;
    });
    updateParent(updated);
  };

  const handleShiftChord = (lineIdx: number, chordIdx: number, direction: -1 | 1) => {
    const line = lines[lineIdx];
    if (!line) return;
    const targetIdx = chordIdx + direction;
    if (targetIdx < 0 || targetIdx >= line.chords.length) return;

    const updated = lines.map((l, lIdx) => {
      if (lIdx !== lineIdx) return l;
      const chords = [...l.chords];
      const temp = chords[chordIdx];
      chords[chordIdx] = chords[targetIdx];
      chords[targetIdx] = temp;
      return { ...l, chords };
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

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, lineIdx: number, chordIdx: number) => {
    e.stopPropagation();
    setDraggedChord({ lineIdx, chordIdx });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ lineIdx, chordIdx }));
  };

  const handleDragOverChord = (e: React.DragEvent, lineIdx: number, chordIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const pos = relX < rect.width / 2 ? 'before' : 'after';
    setDragOverInfo({ lineIdx, chordIdx, pos });
    setDragOverLine(lineIdx);
  };

  const handleDragOverLine = (e: React.DragEvent, lineIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverLine(lineIdx);
  };

  const handleDropChord = (e: React.DragEvent, targetLineIdx: number, targetChordIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedChord) return;

    const { lineIdx: fromLine, chordIdx: fromChord } = draggedChord;
    const pos = dragOverInfo?.pos || 'after';
    let targetIdx = pos === 'after' ? targetChordIdx + 1 : targetChordIdx;

    if (fromLine === targetLineIdx && fromChord === targetChordIdx) {
      setDraggedChord(null);
      setDragOverInfo(null);
      setDragOverLine(null);
      return;
    }

    const updated = lines.map(line => ({ ...line, chords: [...line.chords] }));
    const [movedItem] = updated[fromLine].chords.splice(fromChord, 1);
    if (!movedItem) return;

    if (fromLine === targetLineIdx && fromChord < targetIdx) {
      targetIdx--;
    }

    updated[targetLineIdx].chords.splice(targetIdx, 0, movedItem);
    updateParent(updated);
    setDraggedChord(null);
    setDragOverInfo(null);
    setDragOverLine(null);
  };

  const handleDropOnLine = (e: React.DragEvent, targetLineIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedChord) return;

    const { lineIdx: fromLine, chordIdx: fromChord } = draggedChord;
    if (fromLine === targetLineIdx && lines[targetLineIdx].chords.length <= 1) {
      setDraggedChord(null);
      setDragOverInfo(null);
      setDragOverLine(null);
      return;
    }

    const updated = lines.map(line => ({ ...line, chords: [...line.chords] }));
    const [movedItem] = updated[fromLine].chords.splice(fromChord, 1);
    if (!movedItem) return;

    updated[targetLineIdx].chords.push(movedItem);
    updateParent(updated);
    setDraggedChord(null);
    setDragOverInfo(null);
    setDragOverLine(null);
  };

  const handleDragEnd = () => {
    setDraggedChord(null);
    setDragOverInfo(null);
    setDragOverLine(null);
  };

  // Clean View (Performance / Reading Mode)
  if (!isEditing) {
    const hasAnyChords = lines.some(l => l.chords && l.chords.length > 0);

    return (
      <div className="bg-white/80 dark:bg-zinc-850/80 border border-zinc-200/80 dark:border-zinc-800 p-3 sm:p-4 rounded-2xl space-y-3 shadow-2xs font-sans text-zinc-900 dark:text-zinc-100">
        {!hasAnyChords ? (
          <div className="text-center py-6 px-4 bg-zinc-50/70 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-750 rounded-2xl space-y-2">
            <Music className="w-6 h-6 mx-auto stroke-[1.8] text-zinc-300 dark:text-zinc-600" />
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Esta sección aún no tiene acordes
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
              Entra al modo edición para agregar acordes o líneas.
            </p>
            {onToggleEdit && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.94 }}
                type="button"
                onClick={onToggleEdit}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-zinc-950 font-extrabold text-xs cursor-pointer shadow-2xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Editar acordes</span>
              </motion.button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {lines.map((line, lineIdx) => {
              if (!line.chords || line.chords.length === 0) return null;

              return (
                <div
                  key={lineIdx}
                  className="flex flex-wrap items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-750/70"
                >
                  {lines.length > 1 && (
                    <span className="w-5 h-5 rounded-full bg-zinc-200/70 dark:bg-zinc-700/60 text-zinc-500 dark:text-zinc-400 font-mono text-[9px] font-bold flex items-center justify-center shrink-0">
                      {lineIdx + 1}
                    </span>
                  )}

                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 flex-1">
                    {line.chords.map((chord, chordIdx) => {
                      const isCustom = !!globalCustomChords[chord.name];

                      return (
                        <motion.button
                          key={chordIdx}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.94 }}
                          transition={{ type: "spring", stiffness: 450, damping: 25 }}
                          type="button"
                          onClick={() => {
                            const shape = getChordShape(chord.name, globalCustomChords, allSongs);
                            playChordStrum(shape.frets, capo, tuning);
                            onChordClick?.(chord.name);
                          }}
                          title={`Toca para escuchar e inspeccionar ${chord.name}`}
                          className={`flex flex-col items-center px-2.5 py-1.5 rounded-xl border cursor-pointer select-none transition-all shadow-2xs group ${
                            isCustom
                              ? "border-amber-300 dark:border-amber-700/70 bg-amber-50/80 dark:bg-amber-950/30 hover:border-amber-400 hover:shadow-xs"
                              : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span className="font-serif text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight">
                              {chord.name}
                            </span>
                            {isCustom && (
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500 shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center gap-1 mt-0.5">
                            {chord.beats > 1 ? (
                              <span className="font-mono text-[8px] font-black text-amber-900 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/60 px-1.5 py-0.2 rounded-full">
                                {chord.beats} pulsos
                              </span>
                            ) : (
                              <span className="font-mono text-[8px] text-zinc-400 dark:text-zinc-500">
                                1 pulso
                              </span>
                            )}
                          </div>

                          {/* Mini Preview Diagram */}
                          <div className="mt-1 pt-0.5 border-t border-zinc-200/70 dark:border-zinc-700/60 flex justify-center">
                            <MiniChordDiagram
                              chordName={chord.name}
                              customChords={globalCustomChords}
                              allSongs={allSongs}
                              width={32}
                              height={38}
                            />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {line.repeat > 1 && (
                    <span className="font-mono text-[11px] font-black text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 px-2.5 py-0.5 rounded-full ml-auto shrink-0 shadow-2xs">
                      ×{line.repeat} repeticiones
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Clean View Bottom Helper */}
        <div className="flex items-center justify-between pt-1 px-1 text-[11px] text-zinc-400 dark:text-zinc-500 select-none">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Toca cualquier acorde para escuchar su sonido o ver diagrama</span>
          </span>
          {onToggleEdit && (
            <button
              type="button"
              onClick={onToggleEdit}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Editar</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Interactive Edit Mode
  return (
    <div className="bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/90 dark:border-zinc-800 p-3 sm:p-4 rounded-2xl space-y-3 shadow-2xs font-sans text-zinc-900 dark:text-zinc-100">
      
      {/* Edit Mode Top Banner */}
      <div className="flex items-center justify-between pb-1 border-b border-zinc-200/70 dark:border-zinc-750/70 text-[11px] text-zinc-600 dark:text-zinc-300 select-none">
        <span className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
          <GripVertical className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Arrastra acordes para reordenar, ajusta pulsos o añade</span>
        </span>
        {onToggleEdit && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={onToggleEdit}
            className="px-2.5 py-0.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Listo</span>
          </motion.button>
        )}
      </div>

      {lines.length === 0 ? (
        <div className="text-center py-6 text-zinc-400 bg-white border border-dashed border-zinc-300 rounded-2xl p-4 space-y-1">
          <Music className="w-7 h-7 mx-auto stroke-[1.8] text-zinc-400 opacity-60" />
          <p className="text-xs font-bold text-zinc-700">
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
            const isLineDropTarget = dragOverLine === lineIdx;

            return (
              <motion.div
                key={lineIdx}
                layout
                onDragOver={(e) => handleDragOverLine(e, lineIdx)}
                onDrop={(e) => handleDropOnLine(e, lineIdx)}
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
                    ? "border-amber-400 bg-amber-50/70 shadow-xs ring-1 ring-amber-400/40" 
                    : isLineDropTarget && draggedChord && draggedChord.lineIdx !== lineIdx
                    ? "border-amber-400 bg-amber-50/40 border-dashed"
                    : "border-zinc-200 hover:border-zinc-300 bg-white shadow-2xs"
                }`}
              >
                {isActive && (
                  <span className="absolute -top-2.5 left-3 bg-amber-400 text-zinc-950 font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs">
                    Línea #{lineIdx + 1}
                  </span>
                )}
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-0.5">
                  {line.chords.length === 0 ? (
                    <span className="text-xs italic text-zinc-400">
                      Línea vacía. Elige un acorde del panel inferior o arrastra uno aquí...
                    </span>
                  ) : (
                    line.chords.map((chord, chordIdx) => {
                      const isDragging = draggedChord?.lineIdx === lineIdx && draggedChord?.chordIdx === chordIdx;
                      const isDropTarget = dragOverInfo?.lineIdx === lineIdx && dragOverInfo?.chordIdx === chordIdx;
                      const isCustom = !!globalCustomChords[chord.name];

                      return (
                        <div
                          key={chordIdx}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lineIdx, chordIdx)}
                          onDragOver={(e) => handleDragOverChord(e, lineIdx, chordIdx)}
                          onDrop={(e) => handleDropChord(e, lineIdx, chordIdx)}
                          onDragEnd={handleDragEnd}
                          className={`relative flex items-center group cursor-grab active:cursor-grabbing transition-transform ${
                            isDragging ? "opacity-35 scale-95" : ""
                          }`}
                        >
                          {/* Insertion bar indicator */}
                          {isDropTarget && dragOverInfo.pos === 'before' && (
                            <div className="absolute -left-1.5 top-0 bottom-0 w-1 bg-amber-500 rounded-full shadow-sm animate-pulse z-20" />
                          )}
                          
                          <div 
                            className={`flex flex-col items-center bg-zinc-100 hover:bg-zinc-200/90 px-2.5 py-1.5 rounded-xl border transition-all ${
                              isCustom 
                                ? "border-amber-300 bg-amber-50/80 shadow-2xs" 
                                : "border-zinc-200 shadow-2xs"
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <GripVertical className="w-3 h-3 text-zinc-400 group-hover:text-amber-500 shrink-0 cursor-grab" />
                              <span className="font-serif text-lg sm:text-xl font-black text-zinc-900 leading-tight">
                                {chord.name}
                              </span>
                              {isCustom && (
                                <span title="Acorde modificado/personalizado">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            
                            {chord.beats > 1 ? (
                              <span className="font-mono text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 rounded-full mt-0.5">
                                {chord.beats} pulsos
                              </span>
                            ) : (
                              <span className="font-mono text-[8px] text-zinc-400">
                                1 pulso
                              </span>
                            )}

                            {/* Mini preview diagram directly underneath */}
                            <div className="mt-1 pt-0.5 border-t border-zinc-200/70 flex justify-center">
                              <MiniChordDiagram
                                chordName={chord.name}
                                customChords={globalCustomChords}
                                allSongs={allSongs}
                                width={32}
                                height={38}
                              />
                            </div>
                          </div>

                          {/* Insertion bar indicator after */}
                          {isDropTarget && dragOverInfo.pos === 'after' && (
                            <div className="absolute -right-1.5 top-0 bottom-0 w-1 bg-amber-500 rounded-full shadow-sm animate-pulse z-20" />
                          )}
                        </div>
                      );
                    })
                  )}

                  {line.repeat > 1 && (
                    <span className="font-mono text-xs font-bold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full ml-auto">
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
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs cursor-pointer border border-zinc-200 shadow-2xs transition-colors"
        >
          <Music className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Nueva Línea</span>
        </motion.button>
      </div>

      {/* Active Line Detailed Controls (Reorder with buttons or drag, Beats Adjust, Line Repeat) */}
      <AnimatePresence>
        {activeLineIndex !== null && lines[activeLineIndex] && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.97 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="bg-white border border-zinc-200 p-3 sm:p-4 rounded-2xl space-y-3.5 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center">
                  {activeLineIndex + 1}
                </span>
                <h5 className="font-extrabold text-xs text-zinc-800">
                  Ajustes de Línea #{activeLineIndex + 1}
                </h5>
              </div>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setActiveLineIndex(null)}
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 cursor-pointer"
              >
                Cerrar
              </motion.button>
            </div>

            {/* Reorder and beats adjustment list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <span>Reordenar & Pulsos por acorde:</span>
                </span>
                <span className="text-[10px] text-zinc-400">
                  Usa las flechas ◀ ▶ para cambiar posición
                </span>
              </div>

              {lines[activeLineIndex].chords.length === 0 ? (
                <p className="text-xs text-zinc-400 italic py-2">
                  No hay acordes en esta línea. Elige uno abajo.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {lines[activeLineIndex].chords.map((chord, chordIdx) => {
                    const isFirst = chordIdx === 0;
                    const isLast = chordIdx === lines[activeLineIndex].chords.length - 1;
                    const isCustom = !!globalCustomChords[chord.name];

                    return (
                      <motion.div 
                        key={chordIdx} 
                        layout
                        className="inline-flex items-center border border-zinc-200 bg-zinc-50/90 px-2.5 py-1.5 rounded-xl gap-2 shadow-2xs group"
                      >
                        {/* Position Shift buttons for touch/accessibility */}
                        <div className="flex items-center gap-0.5 mr-0.5">
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={(e) => { e.stopPropagation(); handleShiftChord(activeLineIndex, chordIdx, -1); }}
                            title="Mover acorde a la izquierda"
                            className="p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-20 disabled:pointer-events-none hover:bg-zinc-200 rounded cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={(e) => { e.stopPropagation(); handleShiftChord(activeLineIndex, chordIdx, 1); }}
                            title="Mover acorde a la derecha"
                            className="p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-20 disabled:pointer-events-none hover:bg-zinc-200 rounded cursor-pointer"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Mini Chord preview in active line editor */}
                        <div className="shrink-0 flex items-center justify-center">
                          <MiniChordDiagram
                            chordName={chord.name}
                            customChords={globalCustomChords}
                            allSongs={allSongs}
                            width={28}
                            height={34}
                          />
                        </div>

                        {/* Chord Name & Beats indicator */}
                        <div className="flex flex-col pr-1.5 border-r border-zinc-200">
                          <div className="flex items-center gap-1">
                            <span className="font-serif text-sm font-black text-zinc-900 leading-tight">
                              {chord.name}
                            </span>
                            {isCustom && (
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500 shrink-0" />
                            )}
                          </div>
                          <span className="font-mono text-[9px] font-bold text-amber-700 leading-none">
                            {chord.beats}× {chord.beats === 1 ? 'pulso' : 'pulsos'}
                          </span>
                        </div>

                        {/* Quick Beats selector pills */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 4, 8].map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleSetChordBeats(activeLineIndex, chordIdx, p); }}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition-colors ${
                                chord.beats === p 
                                  ? "bg-amber-400 text-zinc-950 font-black shadow-2xs" 
                                  : "bg-white text-zinc-600 hover:bg-zinc-200 border border-zinc-200"
                              }`}
                              title={`Asignar ${p} ${p === 1 ? 'pulso' : 'pulsos'}`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>

                        {/* Beats Stepper (+ / -) */}
                        <div className="flex flex-col gap-0.5">
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={(e) => { e.stopPropagation(); handleAdjustBeats(activeLineIndex, chordIdx, 1); }}
                            className="p-1 bg-white hover:bg-zinc-100 rounded-md cursor-pointer border border-zinc-200 shadow-2xs"
                            title="Aumentar pulsos"
                          >
                            <Plus className="w-2.5 h-2.5 text-zinc-800" />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={(e) => { e.stopPropagation(); handleAdjustBeats(activeLineIndex, chordIdx, -1); }}
                            className="p-1 bg-white hover:bg-zinc-100 rounded-md cursor-pointer border border-zinc-200 shadow-2xs"
                            title="Reducir pulsos"
                          >
                            <Minus className="w-2.5 h-2.5 text-zinc-800" />
                          </motion.button>
                        </div>

                        {/* Remove chord */}
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={(e) => { e.stopPropagation(); handleRemoveChord(activeLineIndex, chordIdx); }}
                          className="p-1 hover:bg-rose-50 text-rose-500 rounded-md cursor-pointer ml-0.5"
                          title="Eliminar acorde de la línea"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Adjust Line Repeat */}
            <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 p-2.5 rounded-xl">
              <span className="text-xs font-bold text-zinc-700">
                Repetir línea completa:
              </span>
              <div className="flex items-center gap-1.5">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => { e.stopPropagation(); handleAdjustLineRepeat(activeLineIndex, -1); }}
                  className="w-7 h-7 flex items-center justify-center bg-white border border-zinc-200 rounded-lg font-bold text-zinc-900 cursor-pointer shadow-2xs"
                >
                  -
                </motion.button>
                <span className="font-mono text-xs font-bold text-zinc-900 text-center w-8">
                  {lines[activeLineIndex].repeat}×
                </span>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => { e.stopPropagation(); handleAdjustLineRepeat(activeLineIndex, 1); }}
                  className="w-7 h-7 flex items-center justify-center bg-white border border-zinc-200 rounded-lg font-bold text-zinc-900 cursor-pointer shadow-2xs"
                >
                  +
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preset, Common & Custom Chord Picker with Spring */}
      <AnimatePresence>
        {showChordPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="bg-white border border-zinc-200 p-3 sm:p-4 rounded-2xl space-y-3.5 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Elegir acorde {activeLineIndex !== null ? `para Línea #${activeLineIndex + 1}` : ""}</span>
              </span>
              <button 
                type="button" 
                onClick={() => setShowChordPicker(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Custom chord input */}
            <form onSubmit={handleAddCustomChord} className="flex gap-2">
              <input
                type="text"
                value={customChordName}
                onChange={e => setCustomChordName(e.target.value)}
                placeholder="Escribe cualquier acorde (ej: Cadd9, F#m, C#m7b5, G/B...)"
                className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400/50 font-serif"
              />
              <motion.button
                whileTap={{ scale: 0.92 }}
                type="submit"
                className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 text-xs font-bold rounded-xl cursor-pointer shadow-2xs"
              >
                Añadir
              </motion.button>
            </form>

            {/* SUGGESTION SECTION 0: Acordes Principales de la Canción */}
            {mainChords && mainChords.length > 0 && (
              <div className="space-y-1.5 p-3 bg-amber-50/90 border border-amber-300 rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>Acordes Principales de esta canción:</span>
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => {
                      mainChords.forEach(c => handleAddChordToActiveLine(c));
                    }}
                    className="text-[10px] font-bold text-amber-900 bg-amber-200/90 hover:bg-amber-300 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                    title="Añade toda la secuencia de acordes principales a esta línea"
                  >
                    + Insertar todos en orden
                  </motion.button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {mainChords.map(name => (
                    <motion.button
                      key={name}
                      whileHover={{ scale: 1.06, y: -1 }}
                      whileTap={{ scale: 0.92 }}
                      type="button"
                      onClick={() => handleAddChordToActiveLine(name)}
                      className="px-3 py-1.5 font-serif text-xs font-black bg-white hover:bg-amber-100 text-zinc-950 border border-amber-300 rounded-xl cursor-pointer shadow-2xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>{name}</span>
                      <Plus className="w-3 h-3 text-amber-600 stroke-[3]" />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* SUGGESTION SECTION 1: Acordes Frecuentes en el repertorio (Requisito #2) */}
            {commonChords.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-700 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                    <span>Frecuentes en tu repertorio:</span>
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Calculado de todas tus canciones
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {commonChords.slice(0, 14).map(item => (
                    <motion.button
                      key={item.name}
                      whileHover={{ scale: 1.07 }}
                      whileTap={{ scale: 0.92 }}
                      type="button"
                      onClick={() => handleAddChordToActiveLine(item.name)}
                      className="px-2.5 py-1 font-serif text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 hover:border-amber-400 rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <span>{item.name}</span>
                      <span className="font-mono text-[9px] font-semibold text-amber-600 bg-amber-200/60 px-1 rounded-full">
                        {item.count}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* SUGGESTION SECTION 2: Acordes Raros y Modificados Guardados (Requisito #3) */}
            {customChordNames.length > 0 && (
              <div className="space-y-1.5 pt-1 bg-amber-50/40 p-2.5 rounded-xl border border-amber-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>Tus Acordes Personalizados & Raros Guardados:</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium">
                    Digitaciones listas para reusar
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {customChordNames.map(chord => (
                    <motion.button
                      key={chord}
                      whileHover={{ scale: 1.07 }}
                      whileTap={{ scale: 0.92 }}
                      type="button"
                      onClick={() => handleAddChordToActiveLine(chord)}
                      className="px-2.5 py-1 font-serif text-xs font-bold bg-white hover:bg-amber-100 text-zinc-900 border border-amber-300 hover:border-amber-500 rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                      <span>{chord}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Standard Presets Library */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Biblioteca estándar de acordes:
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {CHORD_PRESETS.map(chord => (
                  <motion.button
                    key={chord}
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.90 }}
                    type="button"
                    onClick={() => handleAddChordToActiveLine(chord)}
                    className="py-1.5 text-center font-serif text-xs font-bold bg-zinc-100 hover:bg-amber-100 text-zinc-900 border border-zinc-200 hover:border-amber-400 rounded-xl cursor-pointer transition-colors"
                  >
                    {chord}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
