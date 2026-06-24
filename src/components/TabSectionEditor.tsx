import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { TabContent } from '../types';

interface TabSectionEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const STRINGS = ["e", "B", "G", "D", "A", "E"];
const FRETS = [0, 1, 2, 3, 4, 5, 7, 9, 10, 12, 14, 15];
const TECHNIQUES = [
  { symbol: "h", label: "h", desc: "Hammer-on" },
  { symbol: "p", label: "p", desc: "Pull-off" },
  { symbol: "b", label: "b", desc: "Bend" },
  { symbol: "/", label: "/", desc: "Slide ↑" },
  { symbol: "\\", label: "\\", desc: "Slide ↓" },
  { symbol: "x", label: "x", desc: "Mute" }
];

export const TabSectionEditor: React.FC<TabSectionEditorProps> = ({
  content,
  onChange,
}) => {
  const createEmptyTab = (cols = 16): string[][] => {
    return Array(6).fill(null).map(() => Array(cols).fill("-"));
  };

  let tabData: TabContent;
  try {
    const parsed = content ? JSON.parse(content) : null;
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.tab)) {
      tabData = parsed;
    } else {
      tabData = {
        tab: createEmptyTab(16),
        repeat: 1,
        chords: []
      };
    }
  } catch {
    tabData = {
      tab: createEmptyTab(16),
      repeat: 1,
      chords: []
    };
  }

  const columns = Array.isArray(tabData.tab) && tabData.tab.length > 0 && Array.isArray(tabData.tab[0]) ? tabData.tab : createEmptyTab(16);
  const repeats = typeof tabData.repeat === 'number' ? tabData.repeat : 1;
  const colCount = Array.isArray(columns[0]) ? columns[0].length : 16;
  const chords = Array.isArray(tabData.chords) && tabData.chords.length === colCount ? tabData.chords : Array(colCount).fill("");

  const [selectedCell, setSelectedCell] = React.useState<{ s: number; c: number } | null>(null);

  const updateParent = (newTab: string[][], newRepeat: number, newChords: string[]) => {
    onChange(JSON.stringify({
      tab: newTab,
      repeat: newRepeat,
      chords: newChords
    }));
  };

  const handleAddColumns = () => {
    const updatedTab = columns.map(row => [...row, ...Array(8).fill("-")]);
    const updatedChords = [...chords, ...Array(8).fill("")];
    updateParent(updatedTab, repeats, updatedChords);
  };

  const handleRemoveColumns = () => {
    if (colCount <= 8) return;
    const updatedTab = columns.map(row => row.slice(0, colCount - 8));
    const updatedChords = chords.slice(0, colCount - 8);
    
    if (selectedCell && selectedCell.c >= colCount - 8) {
      setSelectedCell(null);
    }
    updateParent(updatedTab, repeats, updatedChords);
  };

  const handleSelectCell = (s: number, c: number) => {
    setSelectedCell({ s, c });
  };

  const handleUpdateValue = (val: string) => {
    if (!selectedCell) return;
    const { s, c } = selectedCell;
    
    if (s === -1) {
      const updatedChords = chords.map((chord, idx) => idx === c ? val.trim() : chord);
      updateParent(columns, repeats, updatedChords);
    } else {
      const cellVal = val.trim() || "-";
      const updatedTab = columns.map((row, rIdx) => 
        rIdx === s ? row.map((cell, cIdx) => cIdx === c ? cellVal : cell) : row
      );
      updateParent(updatedTab, repeats, chords);
    }
  };

  const currentValue = selectedCell 
    ? (selectedCell.s === -1 ? chords[selectedCell.c] : columns[selectedCell.s][selectedCell.c]) 
    : "";

  const handlePressFret = (fret: number) => {
    const isAdornment = TECHNIQUES.some(tech => currentValue.endsWith(tech.symbol));
    const newVal = (currentValue === "-" || currentValue === "") 
      ? fret.toString() 
      : isAdornment ? currentValue + fret : fret.toString();
    handleUpdateValue(newVal);
  };

  const handlePressTechnique = (sym: string) => {
    if (!currentValue || currentValue === "-") return;
    handleUpdateValue(currentValue + sym);
  };

  return (
    <div className="bg-zinc-50 border-3 border-black p-4 space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] select-none">
      {/* Scrollable Tab Grid */}
      <div className="bg-white border-2 border-black p-2 overflow-x-auto shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        <div className="min-w-max flex flex-col font-mono text-sm leading-tight">
          
          {/* Chord labels line */}
          <div className="flex h-9 items-center">
            <span className="w-8 text-[10px] font-black uppercase text-amber-600 text-right pr-2 select-none shrink-0">
              Aco.
            </span>
            <span className="shrink-0 w-2 text-zinc-300"> </span>
            <div className="flex gap-1">
              {chords.map((chord, cIdx) => {
                const isSel = selectedCell && selectedCell.s === -1 && selectedCell.c === cIdx;
                return (
                  <div
                    key={cIdx}
                    onClick={() => handleSelectCell(-1, cIdx)}
                    className={`w-7 h-7 flex items-center justify-center font-serif text-[11px] font-black border cursor-pointer rounded transition-all ${
                      isSel 
                        ? "border-black bg-amber-200 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" 
                        : chord 
                        ? "border-amber-400 bg-amber-50 text-amber-700" 
                        : "border-zinc-150 hover:border-black text-zinc-350"
                    }`}
                  >
                    {chord || "·"}
                  </div>
                );
              })}
            </div>
            <span className="shrink-0 w-2 text-zinc-300"> </span>
          </div>

          <div className="h-px bg-zinc-200 my-1" />

          {/* Fretboard strings */}
          {STRINGS.map((str, sIdx) => {
            const stringRow = columns[sIdx] || [];
            return (
              <div key={sIdx} className="flex h-8 items-center">
                <span className="w-8 font-black text-[15px] text-zinc-600 text-right pr-2 select-none shrink-0">
                  {str}
                </span>
                <span className="shrink-0 text-zinc-400 w-2 text-center text-sm font-light select-none">
                  |
                </span>
                <div className="flex gap-1 shrink-0">
                  {stringRow.map((cell, cIdx) => {
                    const isSel = selectedCell && selectedCell.s === sIdx && selectedCell.c === cIdx;
                    const hasNote = cell !== "-";
                    return (
                      <div
                        key={cIdx}
                        onClick={() => handleSelectCell(sIdx, cIdx)}
                        className={`w-7 h-7 flex items-center justify-center text-xs font-black cursor-pointer border rounded transition-all ${
                          isSel 
                            ? "bg-black text-yellow-300 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" 
                            : hasNote 
                            ? "bg-zinc-100 text-black border-black font-bold" 
                            : "bg-transparent text-zinc-300 border-transparent hover:border-zinc-300"
                        }`}
                      >
                        {cell}
                      </div>
                    );
                  })}
                </div>
                <span className="shrink-0 text-zinc-400 w-2 text-center text-sm font-light select-none">
                  |
                </span>
                {repeats > 1 && sIdx === 5 && (
                  <span className="font-mono text-xs font-black text-zinc-600 pl-3 self-center select-none shrink-0 border-l border-zinc-200">
                    ×{repeats}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Keyboard / Controls */}
      {selectedCell ? (
        <div className="bg-white border-2 border-black p-3 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <span className="text-[10px] font-black uppercase text-zinc-500">
              Celda {selectedCell.s === -1 ? `Acorde Columna #${selectedCell.c + 1}` : `Cuerda ${STRINGS[selectedCell.s]} - Posición #${selectedCell.c + 1}`}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-black bg-zinc-100 border border-black px-2 py-0.5 text-black">
                Valor: {currentValue === "-" ? "vacío (-)" : currentValue || "ninguno"}
              </span>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-[10px] font-black uppercase px-2 py-0.5 border border-black hover:bg-zinc-100 cursor-pointer text-black"
              >
                Listo
              </button>
            </div>
          </div>

          {/* Chord labels editor keyboard */}
          {selectedCell.s === -1 ? (
            <div className="space-y-3">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={currentValue}
                  onChange={e => handleUpdateValue(e.target.value)}
                  placeholder="Escribir acorde..."
                  className="flex-1 px-2.5 py-1 text-xs border-2 border-black font-bold focus:outline-none focus:bg-yellow-50 text-black"
                />
                <button
                  onClick={() => handleUpdateValue("")}
                  className="px-3 py-1 bg-red-100 text-red-600 border border-red-300 text-xs font-semibold hover:bg-red-200 cursor-pointer"
                >
                  Limpiar
                </button>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                  Acordes rápidos:
                </span>
                <div className="flex flex-wrap gap-1">
                  {["C", "G", "D", "Am", "Em", "F", "A", "Bm", "Cadd9", "G/B", "D/F#", "Em7"].map(ac => (
                    <button
                      key={ac}
                      type="button"
                      onClick={() => handleUpdateValue(ac)}
                      className="px-2 py-1 bg-zinc-50 border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-100 hover:border-black rounded cursor-pointer transition-all"
                    >
                      {ac}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* String Frets editor keyboard */
            <div className="space-y-3 font-mono">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                    Traste / Fretboard:
                  </span>
                  <button
                    onClick={() => handleUpdateValue("-")}
                    className="text-[9px] text-red-600 font-bold hover:underline cursor-pointer"
                  >
                    Borrar nota
                  </button>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                  {FRETS.map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => handlePressFret(f)}
                      className="py-1.5 text-center font-black text-xs bg-zinc-100 border border-black hover:bg-yellow-300 rounded cursor-pointer transition-colors text-black"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                  Adornos / Técnicas:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
                  {TECHNIQUES.map(tech => (
                    <button
                      key={tech.symbol}
                      type="button"
                      onClick={() => handlePressTechnique(tech.symbol)}
                      disabled={!currentValue || currentValue === "-"}
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
        <div className="text-center py-2 text-zinc-500 text-[11px] font-semibold">
          💡 Toca cualquier celda de cuerda o acorde arriba para colocar trastes y notas.
        </div>
      )}

      {/* Grid Width & Repeat Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t-2 border-zinc-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase text-zinc-500">
            Columnas:
          </span>
          <button
            onClick={handleRemoveColumns}
            disabled={colCount <= 8}
            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-zinc-150 disabled:opacity-40 rounded cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[15px] text-black font-bold"
          >
            -8
          </button>
          <span className="font-mono text-xs font-black text-black bg-zinc-100 border border-black px-2 py-1">
            {colCount} cols
          </span>
          <button
            onClick={handleAddColumns}
            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-zinc-150 rounded cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-[15px] text-black font-bold"
          >
            +8
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase text-zinc-500">
            Repeticiones:
          </span>
          <button
            onClick={() => updateParent(columns, Math.max(1, repeats - 1), chords)}
            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-zinc-200 rounded cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-bold text-sm text-black"
          >
            -
          </button>
          <span className="font-mono text-sm font-black w-8 text-center text-black">
            {repeats}×
          </span>
          <button
            onClick={() => updateParent(columns, repeats + 1, chords)}
            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-zinc-200 rounded cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-bold text-sm text-black"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};
