import { useState } from 'react';
import { TabData } from '../types';
import { Plus, Minus, Grid, LayoutGrid, Trash2 } from 'lucide-react';

const STRINGS = ["e", "B", "G", "D", "A", "E"];
const FRET_NUMBERS = [0, 1, 2, 3, 4, 5, 7, 9, 10, 12, 14, 15];
const TECHNIQUES = [
  { symbol: "h", label: "h", desc: "Hammer-on" },
  { symbol: "p", label: "p", desc: "Pull-off" },
  { symbol: "b", label: "b", desc: "Bend" },
  { symbol: "/", label: "/", desc: "Slide ↑" },
  { symbol: "\\", label: "\\", desc: "Slide ↓" },
  { symbol: "x", label: "x", desc: "Mute" }
];

interface TabSectionEditorProps {
  content: string;
  onChange: (newContent: string) => void;
}

export default function TabSectionEditor({ content, onChange }: TabSectionEditorProps) {
  function createEmptyTab(columns = 16): string[][] {
    return Array(6).fill(null).map(() => Array(columns).fill("-"));
  }

  let tabData: TabData;
  try {
    const parsed = content ? JSON.parse(content) : null;
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.tab)) {
      tabData = parsed;
    } else {
      tabData = { tab: createEmptyTab(16), repeat: 1, chords: [] };
    }
  } catch (err) {
    tabData = { tab: createEmptyTab(16), repeat: 1, chords: [] };
  }

  const matrix = Array.isArray(tabData.tab) && tabData.tab.length > 0 && Array.isArray(tabData.tab[0])
    ? tabData.tab 
    : createEmptyTab(16);
  const repeat = typeof tabData.repeat === 'number' ? tabData.repeat : 1;
  const numColumns = Array.isArray(matrix[0]) ? matrix[0].length : 16;
  
  // Make sure chords array has same length as columns
  const chords = Array.isArray(tabData.chords) && tabData.chords.length === numColumns 
    ? tabData.chords 
    : Array(numColumns).fill('');

  const [selected, setSelected] = useState<{ s: number; c: number } | null>(null);

  const save = (newMatrix: string[][], newRepeat: number, newChords: string[]) => {
    onChange(JSON.stringify({ tab: newMatrix, repeat: newRepeat, chords: newChords }));
  };

  const addColumns = () => {
    const nextMatrix = matrix.map(row => [...row, ...Array(8).fill("-")]);
    const nextChords = [...chords, ...Array(8).fill("")];
    save(nextMatrix, repeat, nextChords);
  };

  const removeColumns = () => {
    if (numColumns <= 8) return;
    const nextMatrix = matrix.map(row => row.slice(0, numColumns - 8));
    const nextChords = chords.slice(0, numColumns - 8);
    // make sure selection isn't lost
    if (selected && selected.c >= numColumns - 8) {
      setSelected(null);
    }
    save(nextMatrix, repeat, nextChords);
  };

  const handleCellClick = (s: number, c: number) => {
    setSelected({ s, c });
  };

  const writeCell = (value: string) => {
    if (!selected) return;
    const { s, c } = selected;

    if (s === -1) {
      // Chord header row
      const nextChords = chords.map((ch, idx) => (idx === c ? value.trim() : ch));
      save(matrix, repeat, nextChords);
    } else {
      // Fret row
      const clean = value.trim() || "-";
      const nextMatrix = matrix.map((row, rIdx) => {
        if (rIdx === s) {
          return row.map((colStr, colIdx) => (colIdx === c ? clean : colStr));
        }
        return row;
      });
      save(nextMatrix, repeat, chords);
    }
  };

  const activeValue = selected
    ? (selected.s === -1 ? chords[selected.c] : matrix[selected.s][selected.c])
    : '';

  const pasteFret = (num: number) => {
    // If empty or is -, replace. If there's ending technique, append. Else replace.
    const isTechEnding = TECHNIQUES.some(t => activeValue.endsWith(t.symbol));
    const nextVal = (activeValue === "-" || activeValue === "") 
      ? num.toString() 
      : (isTechEnding ? activeValue + num : num.toString());
    writeCell(nextVal);
  };

  const pasteTechnique = (sym: string) => {
    if (!activeValue || activeValue === "-") return;
    writeCell(activeValue + sym);
  };

  return (
    <div className="bg-zinc-50 border-3 border-black p-4 space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] select-none">
      
      {/* 2D Grid Horizontal Scrolling Container */}
      <div className="bg-white border-2 border-black p-2 overflow-x-auto shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        <div className="min-w-max flex flex-col font-mono text-sm leading-tight">
          
          {/* Chords row above the strings */}
          <div className="flex h-9 items-center">
            <span className="w-8 text-[10px] font-black uppercase text-amber-600 text-right pr-2 select-none shrink-0">
              Aco.
            </span>
            <span className="shrink-0 w-2 text-zinc-300"> </span>
            
            <div className="flex gap-1">
              {chords.map((chVal, cIdx) => {
                const isSel = selected && selected.s === -1 && selected.c === cIdx;
                return (
                  <div
                    key={cIdx}
                    onClick={() => handleCellClick(-1, cIdx)}
                    className={`w-7 h-7 flex items-center justify-center font-serif text-[11px] font-black border cursor-pointer rounded transition-all ${
                      isSel 
                        ? 'border-black bg-amber-200 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                        : (chVal ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-zinc-150 hover:border-black text-zinc-350')
                    }`}
                  >
                    {chVal || "·"}
                  </div>
                );
              })}
            </div>
            <span className="shrink-0 w-2 text-zinc-300"> </span>
          </div>

          <div className="h-px bg-zinc-200 my-1" />

          {/* Strings matrix */}
          {STRINGS.map((strName, sIdx) => (
            <div key={sIdx} className="flex h-8 items-center">
              {/* String label */}
              <span className="w-8 font-black text-[15px] text-zinc-600 text-right pr-2 select-none shrink-0">
                {strName}
              </span>

              {/* Matrix start pipe */}
              <span className="shrink-0 text-zinc-400 w-2 text-center text-sm font-light select-none">|</span>

              {/* List cells for string */}
              <div className="flex gap-1 shrink-0">
                {matrix[sIdx]?.map((cellVal, cIdx) => {
                  const isSel = selected && selected.s === sIdx && selected.c === cIdx;
                  const isOccupied = cellVal !== "-";
                  
                  return (
                    <div
                      key={cIdx}
                      onClick={() => handleCellClick(sIdx, cIdx)}
                      className={`w-7 h-7 flex items-center justify-center text-xs font-black cursor-pointer border rounded transition-all ${
                        isSel
                          ? 'bg-black text-yellow-300 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                          : (isOccupied ? 'bg-zinc-100 text-black border-black font-bold' : 'bg-transparent text-zinc-300 border-transparent hover:border-zinc-300')
                      }`}
                    >
                      {cellVal}
                    </div>
                  );
                })}
              </div>

              {/* End pipe */}
              <span className="shrink-0 text-zinc-400 w-2 text-center text-sm font-light select-none">|</span>

              {repeat > 1 && sIdx === 5 && (
                <span className="font-mono text-xs font-black text-zinc-600 pl-3 self-center select-none shrink-0 border-l border-zinc-200">
                  ×{repeat}
                </span>
              )}
            </div>
          ))}

        </div>
      </div>

      {/* Editor control values */}
      {selected ? (
        <div className="bg-white border-2 border-black p-3 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <span className="text-[10px] font-black uppercase text-zinc-500">
              Celda {selected.s === -1 ? `Acorde Columna #${selected.c + 1}` : `Cuerda ${STRINGS[selected.s]} - Posición #${selected.c + 1}`}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-black bg-zinc-100 border border-black px-2 py-0.5">
                Valor: {activeValue === "-" ? "vacío (-)" : (activeValue || "ninguno")}
              </span>
              <button
                onClick={() => setSelected(null)}
                className="text-[10px] font-black uppercase px-2 py-0.5 border border-black hover:bg-zinc-100 cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>

          {/* Subpanel depending on chord cell or fret cell */}
          {selected.s === -1 ? (
            <div className="space-y-3">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={activeValue}
                  onChange={(e) => writeCell(e.target.value)}
                  placeholder="Escribir acorde..."
                  className="flex-1 px-2.5 py-1 text-xs border-2 border-black font-bold focus:outline-none focus:bg-yellow-50"
                />
                <button
                  onClick={() => writeCell('')}
                  className="px-3 py-1 bg-red-100 text-red-600 border border-red-300 text-xs font-semibold hover:bg-red-200 cursor-pointer"
                >
                  Limpiar
                </button>
              </div>

              {/* Chord Shortcuts */}
              <div className="space-y-1">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Acordes rápidos:</span>
                <div className="flex flex-wrap gap-1">
                  {["C", "G", "D", "Am", "Em", "F", "A", "Bm", "Cadd9", "G/B", "D/F#", "Em7"].map((pre) => (
                    <button
                      key={pre}
                      type="button"
                      onClick={() => writeCell(pre)}
                      className="px-2 py-1 bg-zinc-50 border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-100 hover:border-black rounded cursor-pointer transition-all"
                    >
                      {pre}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 font-mono">
              {/* Fret numbers typing */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Traste / Fretboard:</span>
                  <button
                    onClick={() => writeCell('-')}
                    className="text-[9px] text-red-600 font-bold hover:underline cursor-pointer"
                  >
                    Borrar nota
                  </button>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                  {FRET_NUMBERS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => pasteFret(num)}
                      className="py-1.5 text-center font-black text-xs bg-zinc-100 border border-black hover:bg-yellow-300 rounded cursor-pointer transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guitar play techniques */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Adornos / Técnicas:</span>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
                  {TECHNIQUES.map((tech) => (
                    <button
                      key={tech.symbol}
                      type="button"
                      onClick={() => pasteTechnique(tech.symbol)}
                      disabled={!activeValue || activeValue === "-"}
                      className="py-1 px-1.5 border border-zinc-400 font-bold text-[10px] text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none rounded cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span className="text-black font-black text-xs">{tech.label}</span>
                      <span className="text-zinc-400 font-normal scale-90">({tech.desc})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="text-center py-2 text-zinc-550 text-[11px] font-semibold">
          💡 Toca cualquier celda de cuerda o acorde arriba para colocar trastes y notas.
        </div>
      )}

      {/* Grid Settings Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t-2 border-zinc-200">
        
        {/* Column adjustments */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase text-zinc-500">Columnas:</span>
          <button
            onClick={removeColumns}
            disabled={numColumns <= 8}
            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-zinc-100 disabled:opacity-40 rounded cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[15px]"
          >
            -8
          </button>
          <span className="font-mono text-xs font-black text-black bg-zinc-100 border border-black px-2 py-1">
            {numColumns} cols
          </span>
          <button
            onClick={addColumns}
            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-zinc-100 rounded cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[15px]"
          >
            +8
          </button>
        </div>

        {/* Tab Block Repeat Counter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase text-zinc-500">Repeticiones:</span>
          <button
            onClick={() => save(matrix, Math.max(1, repeat - 1), chords)}
            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-zinc-200 rounded cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-bold text-sm"
          >
            -
          </button>
          <span className="font-mono text-sm font-black w-8 text-center">{repeat}×</span>
          <button
            onClick={() => save(matrix, repeat + 1, chords)}
            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-zinc-200 rounded cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-bold text-sm"
          >
            +
          </button>
        </div>

      </div>

    </div>
  );
}
