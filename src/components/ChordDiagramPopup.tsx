import React from 'react';
import { Play, Edit2, Check, X, ChevronLeft, ChevronRight, RotateCcw, Volume2, Sparkles, Eraser } from 'lucide-react';
import { motion } from 'motion/react';
import { ChordShape, getChordShape } from '../utils/chordShapes';
import { playChordStrum } from '../utils/audio';
import { getTuningInfo } from '../utils/tuningUtils';

interface ChordDiagramPopupProps {
  chordName: string;
  allChords: string[];
  customChords: Record<string, ChordShape>;
  capo: number;
  tuning?: string;
  onClose: () => void;
  onSaveCustomChord: (chord: string, shape: ChordShape) => void;
  onDeleteCustomChord: (chord: string) => void;
}

export const ChordDiagramPopup: React.FC<ChordDiagramPopupProps> = ({
  chordName: initialChordName,
  allChords,
  customChords,
  capo,
  tuning = "Estándar",
  onClose,
  onSaveCustomChord,
  onDeleteCustomChord,
}) => {
  // Navigation / carousel of chords
  const [currentIdx, setCurrentIdx] = React.useState(() => {
    const idx = allChords.indexOf(initialChordName);
    return idx >= 0 ? idx : 0;
  });

  const activeChordName = allChords[currentIdx] || initialChordName;

  // Edit Mode state
  const [isEditing, setIsEditing] = React.useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);
  
  // Local state for editing shape
  const [editShape, setEditShape] = React.useState<ChordShape>({
    frets: ['x', 'x', 'x', 'x', 'x', 'x'],
    fingers: [0, 0, 0, 0, 0, 0],
    baseFret: 1,
  });

  // Current shape loaded from DB or defaults
  const activeShape = React.useMemo(() => {
    return getChordShape(activeChordName, customChords);
  }, [activeChordName, customChords]);

  // Sync editShape when activeShape changes or we enter editing
  React.useEffect(() => {
    setEditShape({
      frets: [...activeShape.frets],
      fingers: [...activeShape.fingers],
      baseFret: activeShape.baseFret,
    });
  }, [activeShape, isEditing]);

  const tuningInfo = React.useMemo(() => {
    return getTuningInfo(tuning);
  }, [tuning]);

  // Handle left/right navigation
  const handlePrev = () => {
    setIsEditing(false);
    setCurrentIdx(prev => (prev === 0 ? allChords.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsEditing(false);
    setCurrentIdx(prev => (prev === allChords.length - 1 ? 0 : prev + 1));
  };

  // Play strum with quick haptic animation using song tuning
  const handlePlay = () => {
    const shape = isEditing ? editShape : activeShape;
    setIsPlayingAudio(true);
    playChordStrum(shape.frets, capo, tuning);
    setTimeout(() => setIsPlayingAudio(false), 800);
  };

  // Clear all notes from diagram
  const handleClearDiagram = () => {
    setEditShape({
      frets: ['x', 'x', 'x', 'x', 'x', 'x'],
      fingers: [0, 0, 0, 0, 0, 0],
      baseFret: 1,
    });
  };

  // Keyboard controls for carousel and audio
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handlePlay();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, isEditing, editShape, activeShape]);

  // Save changes
  const handleSave = () => {
    onSaveCustomChord(activeChordName, editShape);
    setIsEditing(false);
  };

  const handleResetToDefault = () => {
    onDeleteCustomChord(activeChordName);
    setIsEditing(false);
  };

  // SVG dimensions & grid configuration
  const width = 220;
  const height = 240;
  const xStart = 40;
  const xSpacing = 28; // 5 intervals * 28 = 140px width
  const yStart = 45;
  const ySpacing = 32; // 5 frets * 32 = 160px height
  
  // Interactive clicking inside SVG
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isEditing) return;
    
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Convert clickX to string index (0 to 5)
    let closestStringIdx = Math.round((clickX - xStart) / xSpacing);
    closestStringIdx = Math.max(0, Math.min(5, closestStringIdx));
    
    // Check if clicked in the open/mute zone (above yStart - 5)
    if (clickY < yStart - 5) {
      const newFrets = [...editShape.frets];
      const newFingers = [...editShape.fingers];
      const current = newFrets[closestStringIdx];
      
      if (current === 'x') {
        newFrets[closestStringIdx] = 0; // open
        newFingers[closestStringIdx] = 0;
      } else if (current === 0) {
        newFrets[closestStringIdx] = 'x'; // muted
        newFingers[closestStringIdx] = 0;
      } else {
        newFrets[closestStringIdx] = 'x'; // muted
        newFingers[closestStringIdx] = 0;
      }
      
      setEditShape(prev => ({
        ...prev,
        frets: newFrets,
        fingers: newFingers,
      }));
      return;
    }
    
    // Otherwise, click inside fretboard rows (fretRelative 1 to 5)
    let closestFretRel = Math.ceil((clickY - yStart) / ySpacing);
    closestFretRel = Math.max(1, Math.min(5, closestFretRel));
    
    const absoluteFret = editShape.baseFret + closestFretRel - 1;
    
    const newFrets = [...editShape.frets];
    const newFingers = [...editShape.fingers];
    
    // Toggle note
    if (newFrets[closestStringIdx] === absoluteFret) {
      newFrets[closestStringIdx] = 'x';
      newFingers[closestStringIdx] = 0;
    } else {
      newFrets[closestStringIdx] = absoluteFret;
      newFingers[closestStringIdx] = 1;
    }
    
    setEditShape(prev => ({
      ...prev,
      frets: newFrets,
      fingers: newFingers,
    }));
  };

  const handleFingerChange = (stringIdx: number, finger: number) => {
    if (!isEditing) return;
    const newFingers = [...editShape.fingers];
    newFingers[stringIdx] = finger;
    setEditShape(prev => ({ ...prev, fingers: newFingers }));
  };

  const handleBaseFretChange = (delta: number) => {
    if (!isEditing) return;
    const newBase = Math.max(1, editShape.baseFret + delta);
    const newFrets = editShape.frets.map(f => {
      if (f === 'x' || f === 0) return f;
      const rel = f - editShape.baseFret;
      return newBase + rel;
    });
    
    setEditShape(prev => ({
      ...prev,
      baseFret: newBase,
      frets: newFrets,
    }));
  };

  const currentShape = isEditing ? editShape : activeShape;
  const isCustomized = !!customChords[activeChordName];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 16 }}
        transition={{ type: "spring", damping: 26, stiffness: 360 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100"
      >
        {/* Pixel 10 Header Bar */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-850/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">
                {isEditing ? "Editar Diagrama" : "Diagrama de Acorde"}
              </h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                {isEditing ? "Personaliza notas y digitación" : "Forma estándar para guitarra"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-zinc-200 dark:border-zinc-700">
              {tuningInfo.name}
            </span>
            {isCustomized && (
              <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-amber-300 dark:border-amber-700/60">
                Personalizado
              </span>
            )}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="p-5 flex flex-col items-center space-y-4">
          
          {/* Chord Title & Capo calculation */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center gap-2">
              <span className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white">
                {activeChordName}
              </span>
            </div>
            {capo > 0 && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
                Capo traste {capo} • Tono real: <strong className="text-amber-600 dark:text-amber-400 font-bold">{getRealChordName(activeChordName, capo)}</strong>
              </p>
            )}
          </div>

          {/* SVG Diagram Container */}
          <div className="relative border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/80 dark:bg-zinc-800/40 rounded-3xl shadow-inner flex flex-col items-center">
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-2.5 right-3 text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-400/20 dark:bg-amber-900/40 border border-amber-400/40 px-2 py-0.5 rounded-full"
              >
                Toca para editar
              </motion.div>
            )}
            
            <svg
              width={width}
              height={height}
              className={`select-none ${isEditing ? "cursor-crosshair" : ""}`}
              onClick={handleSvgClick}
            >
              {/* String labels at bottom with active tuning notes */}
              {tuningInfo.labels.map((label, idx) => (
                <text
                  key={idx}
                  x={xStart + idx * xSpacing}
                  y={height - 6}
                  textAnchor="middle"
                  className="font-mono text-[10px] font-bold fill-zinc-500 dark:fill-zinc-400"
                >
                  {label}
                </text>
              ))}

              {/* Draw Vertical Strings */}
              {Array.from({ length: 6 }).map((_, idx) => (
                <line
                  key={idx}
                  x1={xStart + idx * xSpacing}
                  y1={yStart}
                  x2={xStart + idx * xSpacing}
                  y2={yStart + 5 * ySpacing}
                  className="stroke-zinc-400 dark:stroke-zinc-600"
                  strokeWidth={idx === 0 ? 2.5 : idx === 5 ? 1 : 1.5}
                />
              ))}

              {/* Draw Fretboard Grid Lines (horizontal) */}
              {Array.from({ length: 6 }).map((_, idx) => (
                <line
                  key={idx}
                  x1={xStart}
                  y1={yStart + idx * ySpacing}
                  x2={xStart + 5 * xSpacing}
                  y2={yStart + idx * ySpacing}
                  className="stroke-zinc-300 dark:stroke-zinc-700"
                  strokeWidth={1.5}
                />
              ))}

              {/* Nut (thick line at top) if baseFret === 1 */}
              {currentShape.baseFret === 1 && (
                <rect
                  x={xStart - 1.5}
                  y={yStart - 4}
                  width={5 * xSpacing + 3}
                  height={5}
                  className="fill-zinc-900 dark:fill-zinc-200"
                  rx={1.5}
                />
              )}

              {/* Base Fret indicator on the left side */}
              {currentShape.baseFret > 1 && (
                <text
                  x={10}
                  y={yStart + ySpacing / 2 + 4}
                  textAnchor="start"
                  className="font-mono text-[11px] font-black fill-amber-600 dark:fill-amber-400"
                >
                  {currentShape.baseFret}fr
                </text>
              )}

              {/* Open / Muted string indicators above grid */}
              {currentShape.frets.map((fret, stringIdx) => {
                const x = xStart + stringIdx * xSpacing;
                if (fret === 'x') {
                  return (
                    <g key={stringIdx} className="stroke-[2.5] stroke-rose-500">
                      <line x1={x - 4} y1={21} x2={x + 4} y2={29} />
                      <line x1={x + 4} y1={21} x2={x - 4} y2={29} />
                    </g>
                  );
                } else if (fret === 0) {
                  return (
                    <circle
                      key={stringIdx}
                      cx={x}
                      cy={25}
                      r={4.5}
                      fill="none"
                      className="stroke-zinc-700 dark:stroke-zinc-300"
                      strokeWidth={2}
                    />
                  );
                }
                return null;
              })}

              {/* Notes (Fingered frets) */}
              {currentShape.frets.map((fret, stringIdx) => {
                if (fret === 'x' || fret === 0) return null;
                
                const parsedFret = Number(fret);
                if (isNaN(parsedFret)) return null;
                
                const relativeFret = parsedFret - currentShape.baseFret + 1;
                
                if (relativeFret >= 1 && relativeFret <= 5) {
                  const cx = xStart + stringIdx * xSpacing;
                  const cy = yStart + (relativeFret - 0.5) * ySpacing;
                  const finger = currentShape.fingers[stringIdx] || 0;
                  
                  return (
                    <g key={stringIdx}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={10}
                        className="fill-amber-500 dark:fill-amber-400 shadow-md"
                      />
                      {finger > 0 && (
                        <text
                          x={cx}
                          y={cy + 3.5}
                          textAnchor="middle"
                          className="font-sans text-[11px] font-black fill-zinc-950 select-none pointer-events-none"
                        >
                          {finger}
                        </text>
                      )}
                    </g>
                  );
                }
                return null;
              })}
            </svg>
          </div>

          {/* Fingering Editors - Only visible in Edit Mode */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 p-3.5 space-y-3 rounded-2xl"
            >
              {/* Base Fret modifier */}
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">Traste Inicial:</span>
                <div className="flex items-center gap-1.5">
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => handleBaseFretChange(-1)}
                    disabled={editShape.baseFret <= 1}
                    className="w-7 h-7 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 hover:bg-zinc-100 text-xs font-bold disabled:opacity-30 cursor-pointer flex items-center justify-center shadow-xs"
                  >
                    -
                  </motion.button>
                  <span className="font-mono text-xs font-black px-2 text-zinc-900 dark:text-zinc-100">{editShape.baseFret}</span>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => handleBaseFretChange(1)}
                    disabled={editShape.baseFret >= 15}
                    className="w-7 h-7 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 hover:bg-zinc-100 text-xs font-bold disabled:opacity-30 cursor-pointer flex items-center justify-center shadow-xs"
                  >
                    +
                  </motion.button>
                </div>
              </div>

              {/* Fingers configuration */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block">Asignar Dedos:</span>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {editShape.frets.map((fret, idx) => {
                    if (fret === 'x' || fret === 0) return null;
                    const strings = ["E (6ª)", "A (5ª)", "D (4ª)", "G (3ª)", "B (2ª)", "e (1ª)"];
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{strings[idx]} - Traste {fret}:</span>
                        <div className="flex gap-1">
                          {[0, 1, 2, 3, 4].map(f => (
                            <motion.button
                              key={f}
                              whileTap={{ scale: 0.85 }}
                              onClick={() => handleFingerChange(idx, f)}
                              className={`w-6 h-6 text-[10px] font-black rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                editShape.fingers[idx] === f
                                  ? "bg-amber-400 text-zinc-950 font-bold shadow-xs scale-105"
                                  : "bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-600"
                              }`}
                            >
                              {f === 0 ? "T" : f}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {!editShape.frets.some(f => f !== 'x' && f !== 0) && (
                    <p className="text-[10px] text-zinc-400 font-medium italic py-1 text-center">
                      Coloca al menos una nota en el mástil para asignar dedos.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Carousel Controls Bar (Only when not editing) */}
          {!isEditing && allChords.length > 1 && (
            <div className="flex items-center justify-between gap-2 w-full px-2 select-none">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handlePrev}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 cursor-pointer transition-colors"
                title="Acorde anterior"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </motion.button>
              
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                {currentIdx + 1} / {allChords.length} acordes
              </span>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleNext}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 cursor-pointer transition-colors"
                title="Siguiente acorde"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </motion.button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full pt-1 flex flex-col gap-2">
            {!isEditing ? (
              <>
                {/* Standard Mode Strum Play */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePlay}
                  className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider cursor-pointer transition-all shadow-md inline-flex items-center justify-center gap-2 ${
                    isPlayingAudio
                      ? 'bg-amber-400 text-zinc-950 scale-98 shadow-amber-400/30'
                      : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100'
                  }`}
                >
                  <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                  <span>{isPlayingAudio ? "Sonando..." : "Escuchar Rasgueo"}</span>
                </motion.button>

                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Personalizar</span>
                  </motion.button>
                  {isCustomized && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleResetToDefault}
                      title="Restaurar a la forma por defecto"
                      className="py-2 px-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Defecto</span>
                    </motion.button>
                  )}
                </div>
              </>
            ) : (
              /* Edit Mode controls */
              <div className="space-y-2">
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePlay}
                    className="flex-1 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Probar Sonido</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClearDiagram}
                    className="py-2.5 px-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
                    title="Limpiar todas las notas del diagrama a posición muda"
                  >
                    <Eraser className="w-4 h-4" />
                    <span>Limpiar</span>
                  </motion.button>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    className="flex-1 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs cursor-pointer shadow-md inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Guardar</span>
                  </motion.button>
                </div>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
};

// Simple utility to pitch shift string frequencies
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function getRealChordName(chord: string, capo: number): string {
  if (capo <= 0) return chord;
  
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;
  
  let root = match[1];
  const suffix = match[2];
  
  if (root === "Db") root = "C#";
  if (root === "Eb") root = "D#";
  if (root === "Gb") root = "F#";
  if (root === "Ab") root = "G#";
  if (root === "Bb") root = "A#";
  
  const rootIdx = NOTE_NAMES.indexOf(root);
  if (rootIdx === -1) return chord;
  
  const shiftedIdx = (rootIdx + capo) % 12;
  const shiftedRoot = NOTE_NAMES[shiftedIdx];
  
  return shiftedRoot + suffix;
}
