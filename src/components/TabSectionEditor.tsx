import React from 'react';
import { Plus, Minus, Trash2, FileText, Check, AlertTriangle, AlertCircle, X, RotateCcw } from 'lucide-react';
import { TabContent } from '../types';
import { parseTextTab } from '../utils/tabParser';

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
  const [isEditing, setIsEditing] = React.useState(false);

  const [isImporting, setIsImporting] = React.useState(false);
  const [importText, setImportText] = React.useState("");
  const [importError, setImportError] = React.useState<string | null>(null);
  const [importWarnings, setImportWarnings] = React.useState<string[]>([]);

  // History state for Undo functionality
  const [history, setHistory] = React.useState<string[]>([]);
  const [tabFontSize, setTabFontSize] = React.useState<number>(12); // default 12px

  const updateParent = (newTab: string[][], newRepeat: number, newChords: string[]) => {
    onChange(JSON.stringify({
      tab: newTab,
      repeat: newRepeat,
      chords: newChords
    }));
  };

  const pushToHistoryAndUpdate = (newTab: string[][], newRepeat: number, newChords: string[]) => {
    setHistory(prev => {
      // Avoid pushing consecutive identical states to save memory
      const nextHistory = [...prev, content];
      if (nextHistory.length > 30) {
        return nextHistory.slice(nextHistory.length - 30);
      }
      return nextHistory;
    });
    updateParent(newTab, newRepeat, newChords);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prevContent = history[history.length - 1];
    setHistory(prev => prev.slice(0, prev.length - 1));
    onChange(prevContent);
    
    // Clear selection if it is out of bounds in the undone state
    try {
      const parsed = JSON.parse(prevContent);
      if (parsed && Array.isArray(parsed.tab)) {
        const undoneColCount = parsed.tab[0]?.length || 0;
        if (selectedCell && selectedCell.c >= undoneColCount) {
          setSelectedCell(null);
        }
      }
    } catch {
      // Ignore parsing errors
    }
  };

  const handleImportTab = () => {
    setImportError(null);
    setImportWarnings([]);
    
    const result = parseTextTab(importText);
    if (result.error) {
      setImportError(result.error);
      return;
    }
    
    if (result.warnings && result.warnings.length > 0) {
      setImportWarnings(result.warnings);
    }
    
    // Apply parsed values and push to history
    pushToHistoryAndUpdate(result.tab, result.repeat, result.chords);
    
    // Auto close if there are no warnings. If there are warnings, keep it open so they see them, but they can dismiss.
    if (!result.warnings || result.warnings.length === 0) {
      setIsImporting(false);
      setImportText("");
    }
  };

  const handleAddColumns = () => {
    const updatedTab = columns.map(row => [...row, ...Array(8).fill("-")]);
    const updatedChords = [...chords, ...Array(8).fill("")];
    pushToHistoryAndUpdate(updatedTab, repeats, updatedChords);
  };

  const handleRemoveColumns = () => {
    if (colCount <= 8) return;
    const updatedTab = columns.map(row => row.slice(0, colCount - 8));
    const updatedChords = chords.slice(0, colCount - 8);
    
    if (selectedCell && selectedCell.c >= colCount - 8) {
      setSelectedCell(null);
    }
    pushToHistoryAndUpdate(updatedTab, repeats, updatedChords);
  };

  const handleDeleteColumn = (colIdx: number) => {
    if (colCount <= 1) return;
    
    const updatedTab = columns.map(row => {
      const nextRow = [...row];
      nextRow.splice(colIdx, 1);
      return nextRow;
    });
    
    const updatedChords = [...chords];
    updatedChords.splice(colIdx, 1);
    
    if (selectedCell) {
      if (selectedCell.c === colIdx) {
        setSelectedCell(null);
      } else if (selectedCell.c > colIdx) {
        setSelectedCell({ ...selectedCell, c: selectedCell.c - 1 });
      }
    }
    
    pushToHistoryAndUpdate(updatedTab, repeats, updatedChords);
  };

  const handleInsertColumn = (colIdx: number) => {
    const updatedTab = columns.map(row => {
      const nextRow = [...row];
      nextRow.splice(colIdx, 0, "-");
      return nextRow;
    });
    
    const updatedChords = [...chords];
    updatedChords.splice(colIdx, 0, "");
    
    if (selectedCell) {
      if (selectedCell.c >= colIdx) {
        setSelectedCell({ ...selectedCell, c: selectedCell.c + 1 });
      }
    }
    
    pushToHistoryAndUpdate(updatedTab, repeats, updatedChords);
  };

  const handleSelectCell = (s: number, c: number) => {
    setSelectedCell({ s, c });
  };

  const handleUpdateValue = (val: string) => {
    if (!selectedCell) return;
    const { s, c } = selectedCell;
    
    if (s === -1) {
      const updatedChords = chords.map((chord, idx) => idx === c ? val.trim() : chord);
      pushToHistoryAndUpdate(columns, repeats, updatedChords);
    } else {
      const cellVal = val.trim() || "-";
      const updatedTab = columns.map((row, rIdx) => 
        rIdx === s ? row.map((cell, cIdx) => cIdx === c ? cellVal : cell) : row
      );
      pushToHistoryAndUpdate(updatedTab, repeats, chords);
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
    if (sym === "x") {
      if (!currentValue || currentValue === "-") {
        handleUpdateValue("x");
      } else {
        handleUpdateValue(currentValue + "x");
      }
    } else {
      if (!currentValue || currentValue === "-") return;
      handleUpdateValue(currentValue + sym);
    }
  };

  return (
    <div className="bg-zinc-50 border-3 border-black p-4 space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] select-none">
      
      {/* Import Text Tab Section */}
      <div className="bg-white border-2 border-black p-3.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-black" />
            <span className="font-sans font-black text-xs uppercase tracking-widest text-black">Lector de Tablatura</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleUndo}
                title={`Deshacer último cambio (${history.length})`}
                className="w-8 h-8 flex items-center justify-center border-2 border-black rounded-sm cursor-pointer transition-all bg-zinc-100 hover:bg-zinc-200 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none relative"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white">
                  {history.length}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsImporting(!isImporting);
                setImportError(null);
                setImportWarnings([]);
              }}
              title={isImporting ? "Cerrar Lector" : "Pegar Tablatura de Texto (T)"}
              className={`w-8 h-8 flex items-center justify-center border-2 border-black rounded-sm cursor-pointer transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                isImporting ? "bg-red-150 hover:bg-red-200 text-red-800" : "bg-yellow-350 hover:bg-yellow-400 text-black"
              }`}
            >
              {isImporting ? (
                <X className="w-4 h-4" />
              ) : (
                <span 
                  className="font-serif font-black italic text-[17px] leading-none select-none animate-pulse-subtle" 
                  style={{ fontFamily: "'Times New Roman', Times, serif" }}
                >
                  T
                </span>
              )}
            </button>
          </div>
        </div>

        {isImporting && (
          <div className="pt-3 border-t-2 border-dashed border-zinc-200 space-y-3 animate-fade-in">
            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
              Pega un fragmento de tablatura de guitarra (6 líneas de texto con guiones como <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-black font-black">e|---</code>). Detectaremos los acordes alineados arriba y repeticiones como <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-black font-black">x2</code>.
            </p>

            <div className="relative">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`Ejemplo:\n Em           C                    D             Em\ne|---------------------------x----------------x---------------x--|\nB|-------------0h1-----------x------3---3-----x---0-----------x--|\nG|2h4p20---0---0-------------x------0h2-2-----x---0-----------x--|\nD|------0h2----0h2-----------x------0---------x---2-----------x--|\nA|-------------3-------------x----------------x---------------x--|\nE|0-------------------------------------------x---0-----------x--| x2`}
                rows={8}
                className="w-full p-2.5 font-mono text-xs border-2 border-black focus:outline-none focus:bg-yellow-50/20 text-black bg-zinc-50 leading-relaxed rounded-sm resize-y"
              />
              {importText && (
                <button
                  type="button"
                  onClick={() => setImportText("")}
                  className="absolute top-2 right-2 text-[10px] font-black uppercase px-2 py-0.5 border border-zinc-450 bg-white hover:bg-zinc-100 text-zinc-500 rounded cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>

            {importError && (
              <div className="bg-red-50 border-2 border-red-600 p-3 rounded flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-800">
                  <span className="font-black uppercase block tracking-wider text-[10px] text-red-600 mb-0.5">Error de Formato:</span>
                  <p className="font-bold">{importError}</p>
                </div>
              </div>
            )}

            {importWarnings.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-500 p-3 rounded flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 space-y-1">
                  <span className="font-black uppercase block tracking-wider text-[10px] text-amber-600">¡Cargado con advertencias!</span>
                  <ul className="list-disc list-inside space-y-0.5 font-medium">
                    {importWarnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-zinc-500 italic mt-1 font-bold">Hemos adaptado el contenido al editor, puedes seguir editándolo a mano.</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsImporting(false);
                  setImportError(null);
                  setImportWarnings([]);
                  setImportText("");
                }}
                className="px-4 py-2 border-2 border-black text-xs font-black uppercase bg-white hover:bg-zinc-100 text-black cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleImportTab}
                disabled={!importText.trim()}
                className="px-4 py-2 bg-yellow-300 text-black border-2 border-black text-xs font-black uppercase hover:bg-yellow-400 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Analizar y Cargar</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Zoom / Font Size Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-100 border-2 border-black p-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-xs font-black uppercase text-black select-none gap-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-wider text-zinc-600 font-sans font-black">Visualización</span>
          <button
            type="button"
            onClick={() => {
              setIsEditing(prev => {
                if (prev) {
                  setSelectedCell(null);
                }
                return !prev;
              });
            }}
            className={`px-3 py-1 border-2 border-black font-black text-[10px] uppercase cursor-pointer transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 ${
              isEditing ? "bg-yellow-350 text-black font-black" : "bg-white text-zinc-600 hover:text-black hover:bg-zinc-50"
            }`}
          >
            <span className="text-xs">{isEditing ? "✓" : "✎"}</span>
            <span>{isEditing ? "Modo Edición" : "Editar Tablatura"}</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-zinc-500 font-black font-sans">Escala:</span>
          <button
            type="button"
            onClick={() => setTabFontSize(prev => Math.max(9, prev - 1))}
            className="w-6 h-6 flex items-center justify-center bg-white border border-black hover:bg-zinc-200 text-[10px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all cursor-pointer text-black"
            title="Reducir tamaño de letra"
          >
            A-
          </button>
          <span className="font-mono text-xs font-black text-black bg-white px-2 py-0.5 border border-black min-w-[34px] text-center">
            {tabFontSize}px
          </span>
          <button
            type="button"
            onClick={() => setTabFontSize(prev => Math.min(22, prev + 1))}
            className="w-6 h-6 flex items-center justify-center bg-white border border-black hover:bg-zinc-200 text-[10px] font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all cursor-pointer text-black"
            title="Aumentar tamaño de letra"
          >
            A+
          </button>
        </div>
      </div>

      {/* Scrollable Tab Grid */}
      <div className="bg-white border-2 border-black p-2 overflow-x-auto shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        <div className="min-w-max flex flex-col font-mono text-sm leading-tight">
          
          {isEditing && (
            <>
              {/* Column deletion row */}
              <div className="flex items-center animate-fade-in" style={{ height: `${Math.round(tabFontSize * 1.9)}px` }}>
                <span className="w-8 text-[9px] font-black uppercase text-red-500 text-right pr-2 select-none shrink-0">
                  Elim.
                </span>
                <span className="shrink-0 w-2 text-zinc-300"> </span>
                <div className="flex gap-0.5">
                  {chords.map((_, cIdx) => (
                    <button
                      key={cIdx}
                      type="button"
                      title={`Eliminar columna #${cIdx + 1}`}
                      onClick={() => handleDeleteColumn(cIdx)}
                      className="flex items-center justify-center bg-red-50 hover:bg-red-200 border border-red-300 hover:border-red-600 text-red-600 rounded cursor-pointer transition-colors"
                      style={{
                        width: `${Math.round(tabFontSize * 1.7)}px`,
                        height: `${Math.round(tabFontSize * 1.5)}px`
                      }}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  ))}
                </div>
                <span className="shrink-0 w-2 text-zinc-300"> </span>
              </div>

              {/* Column insertion row */}
              <div className="flex items-center mt-1 animate-fade-in" style={{ height: `${Math.round(tabFontSize * 1.9)}px` }}>
                <span className="w-8 text-[9px] font-black uppercase text-emerald-500 text-right pr-2 select-none shrink-0">
                  Ins.
                </span>
                <span className="shrink-0 w-2 text-zinc-300"> </span>
                <div className="flex gap-0.5">
                  {chords.map((_, cIdx) => (
                    <button
                      key={cIdx}
                      type="button"
                      title={`Insertar columna vacía antes de la #${cIdx + 1}`}
                      onClick={() => handleInsertColumn(cIdx)}
                      className="flex items-center justify-center bg-emerald-50 hover:bg-emerald-200 border border-emerald-300 hover:border-emerald-600 text-emerald-600 rounded cursor-pointer transition-colors"
                      style={{
                        width: `${Math.round(tabFontSize * 1.7)}px`,
                        height: `${Math.round(tabFontSize * 1.5)}px`
                      }}
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  ))}
                </div>
                <span className="shrink-0 w-2 text-zinc-300"> </span>
              </div>

              <div className="h-px bg-zinc-200 my-1.5" />
            </>
          )}

          {/* Chord labels line */}
          {(isEditing || chords.some(c => c && c.trim() !== "")) && (
            <>
              <div className="flex items-center" style={{ height: `${Math.round(tabFontSize * 2.8)}px` }}>
                <span className="w-8 text-[10px] font-black uppercase text-amber-600 text-right pr-2 select-none shrink-0" style={{ fontSize: `${Math.max(8, tabFontSize - 3)}px` }}>
                  Aco.
                </span>
                <span className="shrink-0 w-2 text-zinc-300"> </span>
                <div className="flex gap-0.5 flex-row">
                  {chords.map((chord, cIdx) => {
                    const isSel = selectedCell && selectedCell.s === -1 && selectedCell.c === cIdx;
                    return (
                      <div
                        key={cIdx}
                        onClick={() => isEditing && handleSelectCell(-1, cIdx)}
                        className={`flex items-center justify-center font-serif font-black border rounded transition-all ${
                          isEditing && isSel 
                            ? "border-black bg-amber-200 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" 
                            : chord 
                            ? "border-amber-400 bg-amber-50 text-amber-700 font-bold" 
                            : isEditing 
                            ? "border-zinc-150 hover:border-black text-zinc-350 cursor-pointer"
                            : "border-transparent text-zinc-200"
                        }`}
                        style={{
                          width: `${Math.round(tabFontSize * 1.7)}px`,
                          height: `${Math.round(tabFontSize * 2.2)}px`,
                          fontSize: `${Math.max(8, tabFontSize - 1)}px`
                        }}
                      >
                        {chord || (isEditing ? "·" : "")}
                      </div>
                    );
                  })}
                </div>
                <span className="shrink-0 w-2 text-zinc-300"> </span>
              </div>
              <div className="h-px bg-zinc-200 my-1.5" />
            </>
          )}

          {/* Fretboard strings */}
          {STRINGS.map((str, sIdx) => {
            const stringRow = columns[sIdx] || [];
            return (
              <div key={sIdx} className="flex items-center" style={{ height: `${Math.round(tabFontSize * 2.5)}px` }}>
                <span className="w-8 font-black text-zinc-600 text-right pr-2 select-none shrink-0" style={{ fontSize: `${Math.round(tabFontSize * 1.15)}px` }}>
                  {str}
                </span>
                <span className="shrink-0 text-zinc-400 w-2 text-center font-light select-none" style={{ fontSize: `${tabFontSize}px` }}>
                  |
                </span>
                <div className="flex gap-0.5 shrink-0">
                  {stringRow.map((cell, cIdx) => {
                    const isSel = selectedCell && selectedCell.s === sIdx && selectedCell.c === cIdx;
                    const hasNote = cell !== "-";
                    return (
                      <div
                        key={cIdx}
                        onClick={() => isEditing && handleSelectCell(sIdx, cIdx)}
                        className={`flex items-center justify-center font-black border rounded transition-all ${
                          isEditing && isSel 
                            ? "bg-black text-yellow-300 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" 
                            : hasNote 
                            ? "bg-zinc-100 text-black border-black font-bold" 
                            : isEditing
                            ? "bg-transparent text-zinc-300 border-transparent hover:border-zinc-300 cursor-pointer"
                            : "bg-transparent text-zinc-350 border-transparent"
                        }`}
                        style={{
                          width: `${Math.round(tabFontSize * 1.7)}px`,
                          height: `${Math.round(tabFontSize * 2.2)}px`,
                          fontSize: `${Math.max(9, tabFontSize)}px`
                        }}
                      >
                        {cell}
                      </div>
                    );
                  })}
                </div>
                <span className="shrink-0 text-zinc-400 w-2 text-center font-light select-none" style={{ fontSize: `${tabFontSize}px` }}>
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
                      disabled={tech.symbol !== "x" && (!currentValue || currentValue === "-")}
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
        isEditing && (
          <div className="text-center py-2 text-zinc-500 text-[11px] font-semibold animate-fade-in">
            💡 Toca cualquier celda de cuerda o acorde arriba para colocar trastes y notas.
          </div>
        )
      )}

      {/* Grid Width & Repeat Controls */}
      {isEditing && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t-2 border-zinc-200 animate-fade-in">
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
              onClick={() => pushToHistoryAndUpdate(columns, Math.max(1, repeats - 1), chords)}
              className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-zinc-200 rounded cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-bold text-sm text-black"
            >
              -
            </button>
            <span className="font-mono text-sm font-black w-8 text-center text-black">
              {repeats}×
            </span>
            <button
              onClick={() => pushToHistoryAndUpdate(columns, repeats + 1, chords)}
              className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black hover:bg-zinc-200 rounded cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-bold text-sm text-black"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
