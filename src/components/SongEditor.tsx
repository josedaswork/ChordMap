import React from 'react';
import { 
  ArrowLeft, Loader2, Trash2, ChevronUp, ChevronDown, 
  Copy, AlertTriangle, Plus, FileText, Music, Guitar,
  Play, Pause, Sparkles, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Song, Section } from '../types';
import { ChordSectionEditor } from './ChordSectionEditor';
import { TabSectionEditor } from './TabSectionEditor';
import { extractSongChords, loadCustomChords, saveCustomChords, ChordShape } from '../utils/chordShapes';
import { ChordDiagramPopup } from './ChordDiagramPopup';

interface SongEditorProps {
  song: Song;
  isSaving: boolean;
  onUpdateSong: (updatedFields: Partial<Song>) => void;
  onDeleteSong: (id: number) => void;
  onBack: () => void;
}

const TUNINGS = ["Estándar", "Drop D", "Eb Estándar", "DADGAD", "Open G", "Open D"];

const SECTION_PRESETS = [
  { name: "Intro", emoji: "🎸" },
  { name: "Verso", emoji: "📖" },
  { name: "Coro", emoji: "🎵" },
  { name: "Puente", emoji: "🌉" },
  { name: "Pre-coro", emoji: "🔄" },
  { name: "Solo", emoji: "⚡" },
  { name: "Outro", emoji: "🎶" },
  { name: "Riff", emoji: "🔥" }
];

export const SongEditor: React.FC<SongEditorProps> = ({
  song,
  isSaving,
  onUpdateSong,
  onDeleteSong,
  onBack,
}) => {
  const [showAddSectionModal, setShowAddSectionModal] = React.useState(false);
  const [addSectionStep, setAddSectionStep] = React.useState<'name' | 'type'>('name');
  const [selectedPresetName, setSelectedPresetName] = React.useState("");
  const [customSectionName, setCustomSectionName] = React.useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [selectedChordForDiagram, setSelectedChordForDiagram] = React.useState<string | null>(null);

  // States for Lyrics & Autoscroll
  const [showLyricsPanel, setShowLyricsPanel] = React.useState(false);
  const [isEditingLyrics, setIsEditingLyrics] = React.useState(false);
  const [isScrolling, setIsScrolling] = React.useState(false);
  const lyricsContainerRef = React.useRef<HTMLDivElement>(null);
  const [lyricsFontSize, setLyricsFontSize] = React.useState<number>(() => {
    return Number(localStorage.getItem('lyricsFontSize') || '14');
  });

  const changeFontSize = (newSize: number) => {
    setLyricsFontSize(newSize);
    localStorage.setItem('lyricsFontSize', String(newSize));
  };

  // Autoscrolling logic
  React.useEffect(() => {
    if (!isScrolling) return;

    const activeEl = lyricsContainerRef.current;
    if (!activeEl) {
      setIsScrolling(false);
      return;
    }

    let lastTime = performance.now();
    let accumulatedScroll = activeEl.scrollTop;
    let animationFrameId: number;

    const scrollStep = (time: number) => {
      const el = lyricsContainerRef.current;
      if (!el) {
        setIsScrolling(false);
        return;
      }

      const delta = time - lastTime;
      lastTime = time;

      const speed = song.scrollSpeed || 3;
      const factor = (speed * speed) * 0.0012 + speed * 0.0015;
      const pixelsToScroll = factor * delta;

      const currentScrollTop = el.scrollTop;
      if (Math.abs(currentScrollTop - accumulatedScroll) > 10) {
        accumulatedScroll = currentScrollTop;
      }

      accumulatedScroll += pixelsToScroll;
      el.scrollTop = Math.round(accumulatedScroll);

      const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 5;
      if (reachedBottom) {
        setIsScrolling(false);
        return;
      }

      animationFrameId = requestAnimationFrame(scrollStep);
    };

    animationFrameId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isScrolling, song.scrollSpeed]);

  const songChords = React.useMemo(() => {
    return extractSongChords(song.sectionsJson);
  }, [song.sectionsJson]);

  const customChords = React.useMemo(() => {
    return loadCustomChords(song.sectionsJson);
  }, [song.sectionsJson]);

  const handleSaveCustomChord = (chordName: string, shape: ChordShape) => {
    const updatedCustom = { ...customChords, [chordName]: shape };
    const updatedSectionsJson = saveCustomChords(song.sectionsJson, updatedCustom);
    onUpdateSong({ sectionsJson: updatedSectionsJson });
  };

  const handleDeleteCustomChord = (chordName: string) => {
    const updatedCustom = { ...customChords };
    delete updatedCustom[chordName];
    const updatedSectionsJson = saveCustomChords(song.sectionsJson, updatedCustom);
    onUpdateSong({ sectionsJson: updatedSectionsJson });
  };

  const getSections = (): Section[] => {
    try {
      const all = song.sectionsJson ? JSON.parse(song.sectionsJson) : [];
      if (!Array.isArray(all)) return [];
      return all.filter((s: any) => s && (s.type === 'chords' || s.type === 'tab')) as Section[];
    } catch {
      return [];
    }
  };

  const updateSections = (visibleSections: Section[]) => {
    try {
      const all = song.sectionsJson ? JSON.parse(song.sectionsJson) : [];
      const metadataSections = Array.isArray(all) 
        ? all.filter((s: any) => s && s.type !== 'chords' && s.type !== 'tab') 
        : [];
      
      const newAll = [...visibleSections, ...metadataSections];
      onUpdateSong({
        sectionsJson: JSON.stringify(newAll)
      });
    } catch {
      onUpdateSong({
        sectionsJson: JSON.stringify(visibleSections)
      });
    }
  };

  const handleUpdateSongField = (fields: Partial<Song>) => {
    onUpdateSong(fields);
  };

  const handleDeleteSection = (index: number) => {
    const filtered = getSections().filter((_, idx) => idx !== index);
    updateSections(filtered);
  };

  const handleDuplicateSection = (index: number) => {
    const sections = getSections();
    const target = sections[index];
    if (!target) return;
    
    const duplicated: Section = {
      ...target,
      name: `${target.name} (copia)`
    };
    
    const updated = [...sections];
    updated.splice(index + 1, 0, duplicated);
    updateSections(updated);
  };

  const handleMoveSectionUp = (index: number) => {
    if (index <= 0) return;
    const sections = [...getSections()];
    const temp = sections[index - 1];
    sections[index - 1] = sections[index];
    sections[index] = temp;
    updateSections(sections);
  };

  const handleMoveSectionDown = (index: number) => {
    const sections = getSections();
    if (index >= sections.length - 1) return;
    const updated = [...sections];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    updateSections(updated);
  };

  const handleAddSectionFinal = (type: 'chords' | 'tab') => {
    const sections = getSections();
    const finalName = customSectionName.trim() || selectedPresetName || "Sección sin nombre";
    
    let content = "[]";
    if (type === 'tab') {
      const emptyTabGrid = Array(6).fill(null).map(() => Array(16).fill("-"));
      content = JSON.stringify({
        tab: emptyTabGrid,
        repeat: 1,
        chords: Array(16).fill("")
      });
    }

    const newSec: Section = {
      name: finalName,
      type,
      content
    };

    updateSections([...sections, newSec]);
    setShowAddSectionModal(false);
    setAddSectionStep('name');
    setSelectedPresetName("");
    setCustomSectionName("");
  };

  const handleSelectPresetName = (name: string) => {
    setSelectedPresetName(name);
    setAddSectionStep('type');
  };

  const handleCustomNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSectionName.trim()) {
      setAddSectionStep('type');
    }
  };

  const currentSections = getSections();

  return (
    <div className="space-y-4 font-sans text-zinc-900 dark:text-zinc-100">
      
      {/* Upper Navigation Action Bar */}
      <div className="flex justify-between items-center bg-white/80 dark:bg-zinc-850/80 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 p-2 sm:p-2.5 rounded-2xl shadow-xs select-none">
        <motion.button
          whileHover={{ scale: 1.04, x: -2 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
          onClick={onBack}
          className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer text-zinc-800 dark:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          <span>Volver</span>
        </motion.button>

        <div className="flex items-center gap-2">
          {isSaving ? (
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/60 px-2.5 py-1 rounded-full">
              <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
              Guardando...
            </span>
          ) : (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[2.5]" />
              Guardado
            </span>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 sm:px-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-xs cursor-pointer flex items-center gap-1 border border-rose-200 dark:border-rose-800/50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Borrar</span>
          </motion.button>
        </div>
      </div>

      {/* Song Header Meta Card */}
      <div className="bg-white/90 dark:bg-zinc-850/90 border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 rounded-3xl space-y-4 shadow-sm text-zinc-900 dark:text-zinc-100 select-text">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 flex flex-col gap-1">
            <input
              type="text"
              value={song.title || ""}
              onChange={e => handleUpdateSongField({ title: e.target.value })}
              placeholder="Título de la Canción..."
              className="w-full text-lg sm:text-xl font-extrabold border-none focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 bg-transparent text-zinc-900 dark:text-white"
            />
            <input
              type="text"
              value={song.artist || ""}
              onChange={e => handleUpdateSongField({ artist: e.target.value })}
              placeholder="Artista / Banda..."
              className="w-full text-xs sm:text-sm font-semibold tracking-wide border-none focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 bg-transparent text-zinc-500 dark:text-zinc-400"
            />
          </div>

          {/* Letra & Scroll Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            onClick={() => {
              setShowLyricsPanel(prev => {
                if (prev) {
                  setIsScrolling(false);
                }
                return !prev;
              });
              if (!showLyricsPanel) {
                setIsEditingLyrics(!song.lyrics);
              }
            }}
            className={`px-3 py-2 rounded-2xl font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 border shadow-xs select-none shrink-0 ${
              showLyricsPanel 
                ? 'bg-amber-400 text-zinc-950 border-amber-500/50 shadow-md shadow-amber-400/20' 
                : 'bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">Letra & Scroll</span>
            <span className="inline xs:hidden">Letra</span>
          </motion.button>
        </div>

        <div className="h-px bg-zinc-200/80 dark:bg-zinc-800" />

        {/* Capo & Tuning Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Capo */}
          <div className="flex items-center justify-between border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Capotraste:</span>
            <div className="flex items-center gap-1.5">
              <motion.button
                whileTap={{ scale: 0.85 }}
                disabled={(song.capo ?? 0) <= 0}
                onClick={() => handleUpdateSongField({ capo: Math.max(0, (song.capo ?? 0) - 1) })}
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 disabled:opacity-30 font-bold cursor-pointer shadow-2xs"
              >
                -
              </motion.button>
              <span className="font-mono text-xs font-bold px-2 text-center select-none text-zinc-900 dark:text-zinc-100 min-w-[4rem]">
                {(song.capo ?? 0) === 0 ? "Sin Capo" : `Traste ${song.capo}`}
              </span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                disabled={(song.capo ?? 0) >= 12}
                onClick={() => handleUpdateSongField({ capo: Math.min(12, (song.capo ?? 0) + 1) })}
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 disabled:opacity-30 font-bold cursor-pointer shadow-2xs"
              >
                +
              </motion.button>
            </div>
          </div>

          {/* Tuning */}
          <div className="flex items-center justify-between border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Afinación:</span>
            <select
              value={song.tuning || "Estándar"}
              onChange={e => handleUpdateSongField({ tuning: e.target.value })}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer shadow-2xs"
            >
              {TUNINGS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expandable Lyrics and Auto-scroll Panel with Spring Animation */}
      <AnimatePresence>
        {showLyricsPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.97 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="bg-white/95 dark:bg-zinc-850/95 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-3xl space-y-4 shadow-md text-zinc-900 dark:text-zinc-100 overflow-hidden"
          >
            {/* Panel Header */}
            <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center border-b border-zinc-200 dark:border-zinc-800 pb-2.5 gap-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Letra & Autoscroll</span>
              </h4>
              
              <div className="flex items-center gap-2.5 w-full xs:w-auto justify-between xs:justify-end">
                {!isEditingLyrics && song.lyrics && (
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Zoom:</span>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      type="button"
                      onClick={() => changeFontSize(Math.max(10, lyricsFontSize - 1))}
                      className="w-5 h-5 flex items-center justify-center bg-white dark:bg-zinc-700 rounded-full font-bold text-xs cursor-pointer shadow-2xs"
                    >
                      -
                    </motion.button>
                    <span className="font-mono text-[10px] font-bold px-1 text-center select-none">
                      {lyricsFontSize}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      type="button"
                      onClick={() => changeFontSize(Math.min(24, lyricsFontSize + 1))}
                      className="w-5 h-5 flex items-center justify-center bg-white dark:bg-zinc-700 rounded-full font-bold text-xs cursor-pointer shadow-2xs"
                    >
                      +
                    </motion.button>
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={() => {
                    setIsEditingLyrics(prev => !prev);
                    setIsScrolling(false);
                  }}
                  className="px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  {isEditingLyrics ? "Ver Letra" : "Editar Letra"}
                </motion.button>
              </div>
            </div>

            {/* Body Content */}
            {isEditingLyrics ? (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Introduce o pega la letra:
                </span>
                <textarea
                  value={song.lyrics || ""}
                  onChange={e => handleUpdateSongField({ lyrics: e.target.value })}
                  placeholder="Escribe o pega aquí la letra de la canción..."
                  className="w-full h-44 p-3 font-sans text-xs sm:text-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 text-zinc-900 dark:text-zinc-100 leading-relaxed"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div 
                  ref={lyricsContainerRef} 
                  className="bg-amber-50/40 dark:bg-zinc-900/50 border border-amber-200/50 dark:border-zinc-800 p-4 max-h-64 overflow-y-auto rounded-2xl"
                >
                  {song.lyrics ? (
                    <p 
                      className="font-serif text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed select-text"
                      style={{ fontSize: `${lyricsFontSize}px` }}
                    >
                      {song.lyrics}
                    </p>
                  ) : (
                    <div className="text-center py-6 space-y-2">
                      <p className="text-xs text-zinc-400 italic">
                        No hay letras añadidas para esta canción aún.
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        type="button"
                        onClick={() => setIsEditingLyrics(true)}
                        className="px-3 py-1.5 text-xs font-bold rounded-full bg-amber-400 text-zinc-950 cursor-pointer shadow-xs"
                      >
                        + Añadir Letra
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Autoscroll Controls Row */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.93 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                type="button"
                onClick={() => setIsScrolling(prev => !prev)}
                className={`w-full sm:w-auto px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xs ${
                  isScrolling 
                    ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-rose-500/30' 
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
                }`}
              >
                {isScrolling ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pausar Scroll</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Autoscroll</span>
                  </>
                )}
              </motion.button>

              {/* Scroll Speed Stepper */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">Velocidad:</span>
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    type="button"
                    disabled={(song.scrollSpeed || 3) <= 1}
                    onClick={() => handleUpdateSongField({ scrollSpeed: Math.max(1, (song.scrollSpeed || 3) - 1) })}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-30 font-bold cursor-pointer shadow-2xs"
                  >
                    -
                  </motion.button>
                  <span className="font-mono text-xs font-bold px-2 text-center min-w-[2rem]">
                    {song.scrollSpeed || 3}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    type="button"
                    disabled={(song.scrollSpeed || 3) >= 15}
                    onClick={() => handleUpdateSongField({ scrollSpeed: Math.min(15, (song.scrollSpeed || 3) + 1) })}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-30 font-bold cursor-pointer shadow-2xs"
                  >
                    +
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unique Chords Overview Bar */}
      <div className="bg-white/80 dark:bg-zinc-850/80 border border-zinc-200/80 dark:border-zinc-800 p-3.5 sm:p-4 rounded-3xl space-y-2.5 shadow-xs select-none">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Guitar className="w-4 h-4 text-amber-500" />
            <span>Acordes de la canción</span>
            <span className="bg-amber-400 text-zinc-950 text-[10px] font-extrabold px-2 py-0.2 rounded-full leading-none">
              {songChords.length}
            </span>
          </h4>
          <span className="text-[10px] text-zinc-400 font-semibold">
            Toca para forma & audio
          </span>
        </div>

        {songChords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {songChords.map(chord => {
              const isCustom = !!customChords[chord];
              return (
                <motion.button
                  key={chord}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 450, damping: 22 }}
                  onClick={() => setSelectedChordForDiagram(chord)}
                  className={`px-3 py-1.5 rounded-xl font-serif text-xs font-bold cursor-pointer flex items-center gap-1 border shadow-2xs ${
                    isCustom
                      ? "bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                      : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <span>{chord}</span>
                  {isCustom && (
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" title="Forma personalizada" />
                  )}
                </motion.button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-zinc-400 italic py-1 text-center">
            Aún no hay acordes en esta canción. Añade acordes en las secciones.
          </p>
        )}
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {currentSections.map((sec, idx) => (
          <motion.div
            key={idx}
            layout
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="space-y-2 bg-white/90 dark:bg-zinc-850/90 border border-zinc-200/80 dark:border-zinc-800 p-3 sm:p-4 rounded-3xl shadow-xs"
          >
            {/* Section Header Controls */}
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2 px-1 select-none">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-500 flex items-center justify-center font-black text-xs">
                  {idx + 1}
                </span>
                <h4 className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  {sec.name}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase">
                    {sec.type === "chords" ? "Acordes" : "Tablatura"}
                  </span>
                </h4>
              </div>

              {/* Action Buttons (Reorder, Duplicate, Delete) */}
              <div className="flex items-center gap-1">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  title="Subir sección"
                  disabled={idx === 0}
                  onClick={() => handleMoveSectionUp(idx)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronUp className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  title="Bajar sección"
                  disabled={idx === currentSections.length - 1}
                  onClick={() => handleMoveSectionDown(idx)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  title="Duplicar sección"
                  onClick={() => handleDuplicateSection(idx)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  title="Eliminar sección"
                  onClick={() => handleDeleteSection(idx)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-500 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>

            {/* Embedded Section Editor */}
            <div>
              {sec.type === 'chords' ? (
                <ChordSectionEditor
                  content={sec.content}
                  onChange={(newContent) => {
                    const updated = currentSections.map((s, sIdx) => sIdx === idx ? { ...s, content: newContent } : s);
                    updateSections(updated);
                  }}
                />
              ) : (
                <TabSectionEditor
                  content={sec.content}
                  onChange={(newContent) => {
                    const updated = currentSections.map((s, sIdx) => sIdx === idx ? { ...s, content: newContent } : s);
                    updateSections(updated);
                  }}
                />
              )}
            </div>
          </motion.div>
        ))}

        {/* Add Section Button CTA */}
        <motion.div
          whileHover={{ scale: 1.015, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
          onClick={() => {
            setAddSectionStep('name');
            setShowAddSectionModal(true);
          }}
          className="p-6 bg-white/70 dark:bg-zinc-850/60 hover:bg-white dark:hover:bg-zinc-850 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl text-center flex flex-col items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors group select-none"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 stroke-[2.8]" />
          </div>
          <h5 className="font-extrabold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">
            Añadir Sección de Canción
          </h5>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium max-w-xs">
            Agrega bloques de acordes organizados o una partitura interactiva de 6 cuerdas.
          </p>
        </motion.div>
      </div>

      {/* Add Section Modal with Spring Motion */}
      <AnimatePresence>
        {showAddSectionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 z-50 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-[#1c1d22] text-white p-4 flex justify-between items-center border-b border-zinc-800">
                <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Añadir nueva sección
                </span>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setShowAddSectionModal(false)}
                  className="text-zinc-400 hover:text-white text-xs font-bold px-2 py-1"
                >
                  Cerrar
                </motion.button>
              </div>

              <div className="p-5 space-y-4">
                {addSectionStep === 'name' ? (
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 block">
                      ¿Qué sección deseas añadir?
                    </span>
                    
                    {/* Presets Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {SECTION_PRESETS.map(preset => (
                        <motion.button
                          key={preset.name}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSelectPresetName(preset.name)}
                          className="py-2.5 px-3 rounded-2xl bg-zinc-100 hover:bg-amber-100/70 dark:bg-zinc-800 dark:hover:bg-amber-950/40 text-left font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                        >
                          <span className="text-base select-none">{preset.emoji}</span>
                          <span>{preset.name}</span>
                        </motion.button>
                      ))}
                    </div>

                    <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                    {/* Custom Name Input */}
                    <form onSubmit={handleCustomNameSubmit} className="space-y-2">
                      <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                        O nombre personalizado:
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customSectionName}
                          onChange={e => setCustomSectionName(e.target.value)}
                          placeholder="Ej: Coro Alternativo, Outro..."
                          className="flex-1 px-3 py-2 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400/40 text-zinc-900 dark:text-zinc-100"
                        />
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          type="submit"
                          disabled={!customSectionName.trim()}
                          className="px-4 py-2 bg-amber-400 text-zinc-950 hover:bg-amber-500 disabled:opacity-40 text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Siguiente
                        </motion.button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* Choose Section Type */
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
                      <button
                        onClick={() => setAddSectionStep('name')}
                        className="text-amber-500 underline cursor-pointer hover:no-underline"
                      >
                        ← Cambiar nombre
                      </button>
                      <span>/</span>
                      <span className="text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                        {customSectionName.trim() || selectedPresetName}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                      Selecciona el formato de contenido:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Chords option */}
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleAddSectionFinal('chords')}
                        className="bg-zinc-50 dark:bg-zinc-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-zinc-200 dark:border-zinc-700 hover:border-amber-400 p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-2 rounded-2xl shadow-xs transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-400/20 text-amber-500 flex items-center justify-center">
                          <Music className="w-5 h-5" />
                        </div>
                        <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                          Acordes
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                          Progresiones con pulsos y repeticiones.
                        </p>
                      </motion.div>

                      {/* Tab option */}
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleAddSectionFinal('tab')}
                        className="bg-zinc-50 dark:bg-zinc-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-400 p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-2 rounded-2xl shadow-xs transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-emerald-400/20 text-emerald-500 flex items-center justify-center">
                          <Guitar className="w-5 h-5" />
                        </div>
                        <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                          Tablatura
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                          Fretboard interactivo de 6 cuerdas.
                        </p>
                      </motion.div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Song Confirmation Modal with Spring */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl w-full max-w-sm shadow-2xl text-zinc-900 dark:text-zinc-100 space-y-4"
            >
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle className="w-6 h-6 shrink-0 stroke-[2.2]" />
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">
                  ¿Eliminar canción?
                </h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Esta acción borrará permanentemente{" "}
                <strong className="text-zinc-800 dark:text-zinc-200">"{song.title || "Sin título"}"</strong>{" "}
                de tu repertorio local.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold cursor-pointer text-zinc-800 dark:text-zinc-200"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    onDeleteSong(song.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-sm shadow-rose-600/30"
                >
                  Eliminar
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Chord Diagram & Edit Popup */}
      {selectedChordForDiagram && (
        <ChordDiagramPopup
          chordName={selectedChordForDiagram}
          allChords={songChords.length > 0 ? songChords : [selectedChordForDiagram]}
          customChords={customChords}
          capo={song.capo ?? 0}
          onClose={() => setSelectedChordForDiagram(null)}
          onSaveCustomChord={handleSaveCustomChord}
          onDeleteCustomChord={handleDeleteCustomChord}
        />
      )}
    </div>
  );
};

