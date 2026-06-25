import React from 'react';
import { Play, Edit2, Check, X, ChevronLeft, ChevronRight, RefreshCw, Trash2 } from 'lucide-react';
import { ChordShape, getChordShape } from '../utils/chordShapes';
import { playChordStrum } from '../utils/audio';

interface ChordDiagramPopupProps {
  chordName: string;
  allChords: string[];
  customChords: Record<string, ChordShape>;
  capo: number;
  onClose: () => void;
  onSaveCustomChord: (chord: string, shape: ChordShape) => void;
  onDeleteCustomChord: (chord: string) => void;
}

export const ChordDiagramPopup: React.FC<ChordDiagramPopupProps> = ({
  chordName: initialChordName,
  allChords,
  customChords,
  capo,
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

  // Handle left/right navigation
  const handlePrev = () => {
    setIsEditing(false);
    setCurrentIdx(prev => (prev === 0 ? allChords.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsEditing(false);
    setCurrentIdx(prev => (prev === allChords.length - 1 ? 0 : prev + 1));
  };

  // Play strum
  const handlePlay = () => {
    const shape = isEditing ? editShape : activeShape;
    playChordStrum(shape.frets, capo);
  };

  // Keyboard controls for carousel and audio
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) return; // Disable keyboard navigation while editing text or values
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handlePlay();
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
  const width = 200;
  const height = 230;
  const xStart = 35;
  const xSpacing = 26; // 5 intervals * 26 = 130px width
  const yStart = 45;
  const ySpacing = 30; // 5 frets * 30 = 150px height
  
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
    
    // Check if clicked in the open/mute zone (above yStart - 10)
    if (clickY < yStart - 5) {
      // Toggle top status of the string: active -> open -> muted -> active
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
      // Clear note (make open or muted)
      newFrets[closestStringIdx] = 'x';
      newFingers[closestStringIdx] = 0;
    } else {
      // Set note
      newFrets[closestStringIdx] = absoluteFret;
      // Default finger is 1
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
    // Shift absolute frets so they stay aligned with the relative rows if possible,
    // or reset them to keep them in bounds.
    const newFrets = editShape.frets.map(f => {
      if (f === 'x' || f === 0) return f;
      // Keep fret within new drawing viewport if possible
      const rel = f - editShape.baseFret;
      return newBase + rel;
    });
    
    setEditShape(prev => ({
      ...prev,
      baseFret: newBase,
      frets: newFrets,
    }));
  };

  // Render variables depending on mode
  const currentShape = isEditing ? editShape : activeShape;
  const isCustomized = !!customChords[activeChordName];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-fade-in">
      <div className="bg-white border-4 border-black w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="bg-black text-white p-3.5 flex justify-between items-center select-none font-bold">
          <div className="flex items-center gap-1.5">
            <span className="font-serif text-sm font-black tracking-wide">
              {isEditing ? "EDITAR FORMA" : "FORMA DEL ACORDE"}
            </span>
            {isCustomized && (
              <span className="bg-yellow-300 text-black text-[8px] px-1 py-0.5 rounded font-black uppercase">
                Custom
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-yellow-300 font-bold hover:underline py-0.5 px-2 text-xs cursor-pointer flex items-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Body */}
        <div className="p-4 sm:p-5 flex flex-col items-center space-y-4">
          
          {/* Chord Label display */}
          <div className="text-center">
            <h2 className="font-serif text-3xl font-black text-black leading-none tracking-tight">
              {activeChordName}
            </h2>
            {capo > 0 && (
              <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">
                Capo traste {capo} (Tono real: {getRealChordName(activeChordName, capo)})
              </p>
            )}
          </div>

          {/* SVG Diagram Container */}
          <div className="relative border-2 border-black p-2 bg-white rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {isEditing && (
              <div className="absolute top-1 right-1 text-[8px] font-black uppercase bg-yellow-300 border border-black px-1.5 rounded animate-pulse">
                Click para colocar trastes
              </div>
            )}
            
            <svg
              width={width}
              height={height}
              className={`select-none ${isEditing ? "cursor-crosshair" : ""}`}
              onClick={handleSvgClick}
            >
              {/* String labels at bottom */}
              {["E", "A", "D", "G", "B", "e"].map((label, idx) => (
                <text
                  key={idx}
                  x={xStart + idx * xSpacing}
                  y={height - 5}
                  textAnchor="middle"
                  className="font-mono text-[9px] font-black fill-zinc-400"
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
                  stroke="black"
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
                  stroke="black"
                  strokeWidth={1.5}
                />
              ))}

              {/* Draw Nut (thick line at top) if baseFret === 1 */}
              {currentShape.baseFret === 1 && (
                <rect
                  x={xStart - 1.2}
                  y={yStart - 4}
                  width={5 * xSpacing + 2.4}
                  height={5}
                  fill="black"
                />
              )}

              {/* Draw Base Fret indicator on the left side */}
              {currentShape.baseFret > 1 && (
                <text
                  x={8}
                  y={yStart + ySpacing / 2 + 3}
                  textAnchor="start"
                  className="font-mono text-[10px] font-black fill-black"
                >
                  {currentShape.baseFret}fr
                </text>
              )}

              {/* Draw Open / Muted string indicators above grid */}
              {currentShape.frets.map((fret, stringIdx) => {
                const x = xStart + stringIdx * xSpacing;
                if (fret === 'x') {
                  // Muted "x" indicator
                  return (
                    <g key={stringIdx} className="stroke-[2.5] stroke-red-600">
                      <line x1={x - 4} y1={21} x2={x + 4} y2={29} />
                      <line x1={x + 4} y1={21} x2={x - 4} y2={29} />
                    </g>
                  );
                } else if (fret === 0) {
                  // Open "o" indicator
                  return (
                    <circle
                      key={stringIdx}
                      cx={x}
                      cy={25}
                      r={4.5}
                      fill="none"
                      stroke="black"
                      strokeWidth={2}
                    />
                  );
                }
                return null;
              })}

              {/* Draw Notes (Fingered frets) */}
              {currentShape.frets.map((fret, stringIdx) => {
                if (fret === 'x' || fret === 0) return null;
                
                const parsedFret = Number(fret);
                if (isNaN(parsedFret)) return null;
                
                // Draw relative to baseFret
                const relativeFret = parsedFret - currentShape.baseFret + 1;
                
                // Only draw if within our visible 5-fret grid
                if (relativeFret >= 1 && relativeFret <= 5) {
                  const cx = xStart + stringIdx * xSpacing;
                  const cy = yStart + (relativeFret - 0.5) * ySpacing;
                  const finger = currentShape.fingers[stringIdx] || 0;
                  
                  return (
                    <g key={stringIdx}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={9}
                        fill="black"
                        className="transition-all"
                      />
                      {finger > 0 && (
                        <text
                          x={cx}
                          y={cy + 3}
                          textAnchor="middle"
                          className="font-sans text-[10px] font-bold fill-white select-none pointer-events-none"
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
            <div className="w-full bg-zinc-50 border-2 border-black p-3 space-y-3 rounded">
              
              {/* Base Fret modifier */}
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                <span className="text-[10px] font-black uppercase text-zinc-500">Traste Inicial:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleBaseFretChange(-1)}
                    disabled={editShape.baseFret <= 1}
                    className="w-6 h-6 border-2 border-black bg-white hover:bg-zinc-200 text-xs font-bold disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs font-black px-2 text-black">{editShape.baseFret}</span>
                  <button
                    onClick={() => handleBaseFretChange(1)}
                    disabled={editShape.baseFret >= 15}
                    className="w-6 h-6 border-2 border-black bg-white hover:bg-zinc-200 text-xs font-bold disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Fingers configuration */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-zinc-500 block">Asignar Dedos:</span>
                <div className="space-y-1 max-h-[110px] overflow-y-auto pr-1">
                  {editShape.frets.map((fret, idx) => {
                    if (fret === 'x' || fret === 0) return null;
                    const strings = ["E (6ª)", "A (5ª)", "D (4ª)", "G (3ª)", "B (2ª)", "e (1ª)"];
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-700">{strings[idx]} - Traste {fret}:</span>
                        <div className="flex gap-0.5">
                          {[0, 1, 2, 3, 4].map(f => (
                            <button
                              key={f}
                              onClick={() => handleFingerChange(idx, f)}
                              className={`w-5 h-5 text-[9px] font-black border flex items-center justify-center rounded transition-all cursor-pointer ${
                                editShape.fingers[idx] === f
                                  ? "bg-black text-white border-black"
                                  : "bg-white hover:bg-zinc-200 text-black border-zinc-300"
                              }`}
                            >
                              {f === 0 ? "T" : f}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {!editShape.frets.some(f => f !== 'x' && f !== 0) && (
                    <p className="text-[9px] text-zinc-400 font-bold italic py-1 text-center">
                      Coloca al menos una nota en el mástil para asignar dedos.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Carousel Controls Bar (Only when not editing) */}
          {!isEditing && allChords.length > 1 && (
            <div className="flex items-center justify-center gap-4 w-full select-none">
              <button
                onClick={handlePrev}
                className="w-8 h-8 flex items-center justify-center border-2 border-black rounded-full hover:bg-zinc-100 cursor-pointer transition-colors"
                title="Acorde anterior"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5] text-black" />
              </button>
              
              <span className="font-sans text-xs font-black text-zinc-600">
                {currentIdx + 1} de {allChords.length}
              </span>

              <button
                onClick={handleNext}
                className="w-8 h-8 flex items-center justify-center border-2 border-black rounded-full hover:bg-zinc-100 cursor-pointer transition-colors"
                title="Siguiente acorde"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5] text-black" />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full pt-1 flex flex-col gap-2">
            {!isEditing ? (
              <>
                {/* Standard Mode Strum Play */}
                <button
                  onClick={handlePlay}
                  className="w-full py-2.5 bg-zinc-100 border-3 border-black text-black font-black text-sm uppercase tracking-wider cursor-pointer hover:bg-zinc-200 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-black stroke-black" />
                  <span>Reproducir</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-1.5 border-2 border-black bg-white hover:bg-zinc-100 text-black font-black text-xs uppercase tracking-wide cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Forma</span>
                  </button>
                  {isCustomized && (
                    <button
                      onClick={handleResetToDefault}
                      title="Restaurar a la forma por defecto"
                      className="py-1.5 px-3 border-2 border-red-600 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs uppercase cursor-pointer inline-flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Defecto</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* Edit Mode controls */
              <div className="space-y-2">
                <button
                  onClick={handlePlay}
                  className="w-full py-1.5 bg-zinc-50 hover:bg-zinc-100 border-2 border-black text-black font-bold text-xs uppercase cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-black stroke-black" />
                  <span>Probar Sonido</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-1.5 border-2 border-black bg-white hover:bg-zinc-100 text-black font-black text-xs uppercase cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-1.5 border-2 border-black bg-yellow-300 text-black font-black text-xs uppercase cursor-pointer hover:bg-yellow-400 inline-flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Guardar</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// Simple utility to pitch shift string frequencies
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function getRealChordName(chord: string, capo: number): string {
  if (capo <= 0) return chord;
  
  // Extract base note (e.g. C, F#, Ab, Bm -> base notes C, F#, A, B)
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;
  
  let root = match[1];
  const suffix = match[2];
  
  // Standardize flats to sharps
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
