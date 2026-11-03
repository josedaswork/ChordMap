import React from 'react';
import { Plus, Minus, Trash2, FileText, Check, AlertTriangle, AlertCircle, X, RotateCcw, Edit3, Eye, ZoomIn, ZoomOut, Flame, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TabContent, Song } from '../types';
import { parseTextTab } from '../utils/tabParser';
import { getCommonChords } from '../utils/chordFrequency';
import { getGlobalCustomChords, ChordShape } from '../utils/chordShapes';

interface TabSectionEditorProps {
  content: string;
  onChange: (content: string) => void;
  allSongs?: Song[];
  customChords?: Record<string, ChordShape>;
}

const STRINGS = ["e", "B", "G", "D", "A", "E"];
// Ensure all frets 0 through 24 are explicitly present and complete
const FRETS = Array.from({ length: 25 }, (_, i) => i);
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
  allSongs = [],
  customChords = {},
}) => {
  const commonChords = React.useMemo(() => {
    return getCommonChords(allSongs);
  }, [allSongs]);

  const globalCustomChords = React.useMemo(() => {
    const globalDict = getGlobalCustomChords(allSongs);
    return { ...globalDict, ...customChords };
  }, [allSongs, customChords]);

  const customChordNames = React.useMemo(() => {
    return Object.keys(globalCustomChords);
  }, [globalCustomChords]);

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
    
    pushToHistoryAndUpdate(result.tab, result.repeat, result.chords);
    
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
    <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 p-3 sm:p-4 rounded-2xl space-y-3.5 shadow-2xs font-sans text-zinc-900 dark:text-zinc-100 select-none">
      
      {/* Import Text Tab Section */}
      <div className="bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 p-3 sm:p-3.5 rounded-2xl shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-300">
              <FileText className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="font-sans font-extrabold text-xs text-zinc-800 dark:text-zinc-200">
              Lector de Tablatura
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {history.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.88 }}
                type="button"
                onClick={handleUndo}
                title={`Deshacer último cambio (${history.length})`}
                className="w-8 h-8 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 shadow-2xs relative"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="absolute -top-1 -right-1 bg-amber-500 text-zinc-950 text-[8px] font-black w-3.5 h-3.5 flex items-center justify-center rounded-full">
                  {history.length}
                </span>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.90 }}
              type="button"
              onClick={() => {
                setIsImporting(!isImporting);
                setImportError(null);
                setImportWarnings([]);
              }}
              title={isImporting ? "Cerrar Lector" : "Pegar Tablatura de Texto"}
              className={`h-8 px-2.5 flex items-center justify-center gap-1.5 rounded-xl cursor-pointer font-bold text-xs shadow-2xs transition-colors ${
                isImporting 
                  ? "bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" 
                  : "bg-amber-400 hover:bg-amber-500 text-zinc-950"
              }`}
            >
              {isImporting ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Cerrar</span>
                </>
              ) : (
                <>
                  <span className="font-serif italic font-black text-sm">T</span>
                  <span>Pegar texto</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {isImporting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="pt-2.5 border-t border-dashed border-zinc-200 dark:border-zinc-750 space-y-2.5 overflow-hidden"
            >
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Pega tablatura de guitarra (6 líneas de texto con guiones como <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-amber-600 dark:text-amber-400 font-bold">e|---</code>). Se detectarán acordes superiores y repeticiones como <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-amber-600 dark:text-amber-400 font-bold">x2</code>.
              </p>

              <div className="relative">
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`Ejemplo:\n Em           C                    D             Em\ne|---------------------------x----------------x---------------x--|\nB|-------------0h1-----------x------3---3-----x---0-----------x--|\nG|2h4p20---0---0-------------x------0h2-2-----x---0-----------x--|\nD|------0h2----0h2-----------x------0---------x---2-----------x--|\nA|-------------3-------------x----------------x---------------x--|\nE|0-------------------------------------------x---0-----------x--| x2`}
                  rows={7}
                  className="w-full p-2.5 font-mono text-xs border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-400/40 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900 leading-relaxed rounded-xl resize-y"
                />
                {importText && (
                  <button
                    type="button"
                    onClick={() => setImportText("")}
                    className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer shadow-2xs"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {importError && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-2.5 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-700 dark:text-rose-300">
                    <span className="font-bold block text-[10px] uppercase mb-0.5">Error de Formato:</span>
                    <p>{importError}</p>
                  </div>
                </div>
              )}

              {importWarnings.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-2.5 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-200 space-y-0.5">
                    <span className="font-bold block text-[10px] uppercase">Aviso de importación:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {importWarnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
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
                  className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={handleImportTab}
                  disabled={!importText.trim()}
                  className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 rounded-xl text-xs font-bold disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.8]" />
                  <span>Analizar y Cargar</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toolbar: Edit mode + Font size */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 p-2.5 rounded-2xl shadow-2xs gap-2">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => {
              setIsEditing(prev => {
                if (prev) {
                  setSelectedCell(null);
                }
                return !prev;
              });
            }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs ${
              isEditing 
                ? "bg-amber-400 text-zinc-950 font-extrabold" 
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
            }`}
          >
            {isEditing ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isEditing ? "Modo Edición Activo" : "Editar Tablatura"}</span>
          </motion.button>
        </div>
        
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mr-1">Zoom:</span>
          <motion.button
            whileTap={{ scale: 0.85 }}
            type="button"
            onClick={() => setTabFontSize(prev => Math.max(9, prev - 1))}
            className="w-7 h-7 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-zinc-200 dark:border-zinc-700 shadow-2xs"
            title="Reducir escala"
          >
            -
          </motion.button>
          <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 px-2 py-0.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md min-w-[34px] text-center">
            {tabFontSize}px
          </span>
          <motion.button
            whileTap={{ scale: 0.85 }}
            type="button"
            onClick={() => setTabFontSize(prev => Math.min(22, prev + 1))}
            className="w-7 h-7 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer border border-zinc-200 dark:border-zinc-700 shadow-2xs"
            title="Aumentar escala"
          >
            +
          </motion.button>
        </div>
      </div>

      {/* Scrollable Tab Grid */}
      <div className="bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 p-3 rounded-2xl overflow-x-auto shadow-2xs">
        <div className="min-w-max flex flex-col font-mono text-sm leading-tight">
          
          {isEditing && (
            <>
              {/* Column deletion row */}
              <div className="flex items-center" style={{ height: `${Math.round(tabFontSize * 1.9)}px` }}>
                <span className="w-8 text-[9px] font-bold uppercase text-rose-500 text-right pr-2 select-none shrink-0">
                  Elim.
                </span>
                <span className="shrink-0 w-2 text-zinc-300"> </span>
                <div className="flex gap-0.5">
                  {chords.map((_, cIdx) => (
                    <motion.button
                      key={cIdx}
                      whileTap={{ scale: 0.8 }}
                      type="button"
                      title={`Eliminar columna #${cIdx + 1}`}
                      onClick={() => handleDeleteColumn(cIdx)}
                      className="flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-300 rounded cursor-pointer transition-colors"
                      style={{
                        width: `${Math.round(tabFontSize * 1.7)}px`,
                        height: `${Math.round(tabFontSize * 1.5)}px`
                      }}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </motion.button>
                  ))}
                </div>
                <span className="shrink-0 w-2 text-zinc-300"> </span>
              </div>

              {/* Column insertion row */}
              <div className="flex items-center mt-1" style={{ height: `${Math.round(tabFontSize * 1.9)}px` }}>
                <span className="w-8 text-[9px] font-bold uppercase text-emerald-500 text-right pr-2 select-none shrink-0">
                  Ins.
                </span>
                <span className="shrink-0 w-2 text-zinc-300"> </span>
                <div className="flex gap-0.5">
                  {chords.map((_, cIdx) => (
                    <motion.button
                      key={cIdx}
                      whileTap={{ scale: 0.8 }}
                      type="button"
                      title={`Insertar columna vacía antes de la #${cIdx + 1}`}
                      onClick={() => handleInsertColumn(cIdx)}
                      className="flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-300 rounded cursor-pointer transition-colors"
                      style={{
                        width: `${Math.round(tabFontSize * 1.7)}px`,
                        height: `${Math.round(tabFontSize * 1.5)}px`
                      }}
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </motion.button>
                  ))}
                </div>
                <span className="shrink-0 w-2 text-zinc-300"> </span>
              </div>

              <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-2" />
            </>
          )}

          {/* Chord labels line */}
          {(isEditing || chords.some(c => c && c.trim() !== "")) && (
            <>
              <div className="flex items-center" style={{ height: `${Math.round(tabFontSize * 2.8)}px` }}>
                <span className="w-8 text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 text-right pr-2 select-none shrink-0" style={{ fontSize: `${Math.max(8, tabFontSize - 3)}px` }}>
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
                        className={`flex items-center justify-center font-serif font-extrabold border rounded transition-all select-none ${
                          isEditing && isSel 
                            ? "border-amber-400 bg-amber-400 text-zinc-950 shadow-xs ring-1 ring-amber-300" 
                            : chord 
                            ? "border-amber-300/80 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200" 
                            : isEditing 
                            ? "border-zinc-200 dark:border-zinc-750 hover:border-zinc-400 text-zinc-400 cursor-pointer"
                            : "border-transparent text-zinc-300 dark:text-zinc-600"
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
              <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1.5" />
            </>
          )}

          {/* Fretboard strings */}
          {STRINGS.map((str, sIdx) => {
            const stringRow = columns[sIdx] || [];
            return (
              <div key={sIdx} className="flex items-center" style={{ height: `${Math.round(tabFontSize * 2.5)}px` }}>
                <span className="w-8 font-bold text-zinc-600 dark:text-zinc-400 text-right pr-2 select-none shrink-0" style={{ fontSize: `${Math.round(tabFontSize * 1.15)}px` }}>
                  {str}
                </span>
                <span className="shrink-0 text-zinc-300 dark:text-zinc-600 w-2 text-center font-light select-none" style={{ fontSize: `${tabFontSize}px` }}>
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
                        className={`flex items-center justify-center font-bold border rounded transition-all select-none ${
                          isEditing && isSel 
                            ? "bg-amber-400 text-zinc-950 border-amber-400 shadow-xs ring-1 ring-amber-300" 
                            : hasNote 
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 font-extrabold" 
                            : isEditing
                            ? "bg-transparent text-zinc-300 dark:text-zinc-600 border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 cursor-pointer"
                            : "bg-transparent text-zinc-300 dark:text-zinc-700 border-transparent"
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
                <span className="shrink-0 text-zinc-300 dark:text-zinc-600 w-2 text-center font-light select-none" style={{ fontSize: `${tabFontSize}px` }}>
                  |
                </span>
                {repeats > 1 && sIdx === 5 && (
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 pl-3 self-center select-none shrink-0 border-l border-zinc-200 dark:border-zinc-700">
                    ×{repeats}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Keyboard / Controls with Spring Motion */}
      <AnimatePresence>
        {selectedCell && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 p-3 sm:p-3.5 rounded-2xl space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                {selectedCell.s === -1 ? `Acorde Columna #${selectedCell.c + 1}` : `Cuerda ${STRINGS[selectedCell.s]} · Posición #${selectedCell.c + 1}`}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-md">
                  {currentValue === "-" ? "vacío (-)" : currentValue || "ninguno"}
                </span>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setSelectedCell(null)}
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Listo
                </motion.button>
              </div>
            </div>

            {/* Chord labels editor keyboard */}
            {selectedCell.s === -1 ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentValue}
                    onChange={e => handleUpdateValue(e.target.value)}
                    placeholder="Escribir acorde..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-zinc-200 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/40 bg-zinc-50 text-zinc-900 font-serif"
                  />
                  <motion.button
                    whileTap={{ scale: 0.90 }}
                    onClick={() => handleUpdateValue("")}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Borrar
                  </motion.button>
                </div>

                {/* Common Chords suggestions */}
                {commonChords.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                      <span>Frecuentes en tu repertorio:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {commonChords.slice(0, 10).map(ac => (
                        <motion.button
                          key={ac.name}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.90 }}
                          type="button"
                          onClick={() => handleUpdateValue(ac.name)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-900 rounded-xl cursor-pointer transition-colors border border-amber-200 flex items-center gap-1"
                        >
                          <span>{ac.name}</span>
                          <span className="font-mono text-[9px] text-amber-600 bg-amber-200/50 px-1 rounded-full">{ac.count}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Saved Custom / Rare Chords */}
                {customChordNames.length > 0 && (
                  <div className="space-y-1.5 bg-amber-50/50 p-2 rounded-xl border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      <span>Personalizados / Raros:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {customChordNames.map(ac => (
                        <motion.button
                          key={ac}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.90 }}
                          type="button"
                          onClick={() => handleUpdateValue(ac)}
                          className="px-2 py-0.5 bg-white hover:bg-amber-100 text-xs font-bold text-zinc-900 rounded-xl cursor-pointer transition-colors border border-amber-300 flex items-center gap-1 shadow-2xs"
                        >
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                          <span>{ac}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Acordes rápidos:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {["C", "G", "D", "Am", "Em", "F", "A", "Bm", "Cadd9", "G/B", "D/F#", "Em7"].map(ac => (
                      <motion.button
                        key={ac}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.90 }}
                        type="button"
                        onClick={() => handleUpdateValue(ac)}
                        className="px-2.5 py-1 bg-zinc-100 hover:bg-amber-100 text-xs font-bold text-zinc-800 rounded-xl cursor-pointer transition-colors border border-zinc-200"
                      >
                        {ac}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* String Frets editor keyboard with ALL frets 0-24 including 6, 8, 11, 13 */
              <div className="space-y-3 font-mono">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Traste / Fretboard (0-24):
                    </span>
                    <button
                      onClick={() => handleUpdateValue("-")}
                      className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
                    >
                      Borrar nota (-)
                    </button>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-13 gap-1.5">
                    {FRETS.map(f => (
                      <motion.button
                        key={f}
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.88 }}
                        type="button"
                        onClick={() => handlePressFret(f)}
                        className="py-1.5 text-center font-extrabold text-xs bg-zinc-100 hover:bg-amber-200 dark:bg-zinc-800 dark:hover:bg-amber-950/60 rounded-xl cursor-pointer transition-colors text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                      >
                        {f}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Adornos / Técnicas:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {TECHNIQUES.map(tech => (
                      <motion.button
                        key={tech.symbol}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.90 }}
                        type="button"
                        onClick={() => handlePressTechnique(tech.symbol)}
                        disabled={tech.symbol !== "x" && (!currentValue || currentValue === "-")}
                        className="py-1.5 px-2 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <span className="text-zinc-900 dark:text-zinc-100 font-extrabold text-xs">{tech.label}</span>
                        <span className="text-zinc-400 font-normal scale-90">({tech.desc})</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Width & Repeat Controls with Spring Motion */}
      {isEditing && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
              Columnas:
            </span>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleRemoveColumns}
              disabled={colCount <= 8}
              className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 rounded-xl cursor-pointer shadow-2xs text-xs font-bold text-zinc-900 dark:text-zinc-100"
            >
              -8
            </motion.button>
            <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-lg">
              {colCount} cols
            </span>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleAddColumns}
              className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl cursor-pointer shadow-2xs text-xs font-bold text-zinc-900 dark:text-zinc-100"
            >
              +8
            </motion.button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
              Repeticiones:
            </span>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => pushToHistoryAndUpdate(columns, Math.max(1, repeats - 1), chords)}
              className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl cursor-pointer shadow-2xs font-bold text-sm text-zinc-900 dark:text-zinc-100"
            >
              -
            </motion.button>
            <span className="font-mono text-xs font-bold w-8 text-center text-zinc-900 dark:text-zinc-100">
              {repeats}×
            </span>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => pushToHistoryAndUpdate(columns, repeats + 1, chords)}
              className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl cursor-pointer shadow-2xs font-bold text-sm text-zinc-900 dark:text-zinc-100"
            >
              +
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
