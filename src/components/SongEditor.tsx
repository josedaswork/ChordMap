import React from 'react';
import { 
  ArrowLeft, Loader2, Trash2, ChevronUp, ChevronDown, 
  Copy, AlertTriangle, Plus, FileText, Music, Guitar,
  Play, Pause, Sparkles, Check, Edit3, Settings2, X, Star,
  GitBranch, CheckCircle2, ChevronLeft, ChevronRight, Layers, Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Song, Section, SongVersion } from '../types';
import { ChordSectionEditor } from './ChordSectionEditor';
import { TabSectionEditor } from './TabSectionEditor';
import { MiniChordDiagram } from './MiniChordDiagram';
import { 
  extractSongChords, loadCustomChords, saveCustomChords, 
  ChordShape, getGlobalCustomChords, saveGlobalCustomChord, deleteGlobalCustomChord 
} from '../utils/chordShapes';
import { ChordDiagramPopup } from './ChordDiagramPopup';
import { 
  ensureSongVersions, getPrincipalVersion, getActiveVersion, 
  applyVersionUpdate, setPrincipalVersion, duplicateVersion, 
  addNewVersion, deleteVersion 
} from '../utils/versionUtils';
import { 
  getAllAvailableTunings, saveCustomTuning, deleteCustomTuning, 
  CustomTuning, getTuningInfo 
} from '../utils/tuningUtils';

interface SongEditorProps {
  song: Song;
  allSongs?: Song[];
  isSaving: boolean;
  onUpdateSong: (updatedFields: Partial<Song>) => void;
  onDeleteSong: (id: number) => void;
  onBack: () => void;
}

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
  allSongs = [],
  isSaving,
  onUpdateSong,
  onDeleteSong,
  onBack,
}) => {
  const versions = React.useMemo(() => ensureSongVersions(song), [song]);
  
  const [activeVersionId, setActiveVersionId] = React.useState<string>(() => {
    return getPrincipalVersion(song).id;
  });

  // Ensure activeVersion always points to a valid version
  const activeVersion = React.useMemo(() => {
    return getActiveVersion(song, activeVersionId);
  }, [song, activeVersionId]);

  // Keep activeVersionId updated if versions change or current gets deleted
  React.useEffect(() => {
    if (!versions.some(v => v.id === activeVersionId)) {
      setActiveVersionId(activeVersion.id);
    }
  }, [versions, activeVersionId, activeVersion.id]);

  // States for Version Modals and Notifications
  const [showNewVersionModal, setShowNewVersionModal] = React.useState(false);
  const [newVersionName, setNewVersionName] = React.useState("");
  const [newVersionBaseType, setNewVersionBaseType] = React.useState<'duplicate' | 'template' | 'blank'>('duplicate');

  const [showRenameVersionModal, setShowRenameVersionModal] = React.useState(false);
  const [renameVersionName, setRenameVersionName] = React.useState("");

  const [showDeleteVersionConfirm, setShowDeleteVersionConfirm] = React.useState(false);
  const [principalToast, setPrincipalToast] = React.useState<string | null>(null);

  const [showAddSectionModal, setShowAddSectionModal] = React.useState(false);
  const [addSectionStep, setAddSectionStep] = React.useState<'name' | 'type'>('name');
  const [selectedPresetName, setSelectedPresetName] = React.useState("");
  const [customSectionName, setCustomSectionName] = React.useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [selectedChordForDiagram, setSelectedChordForDiagram] = React.useState<string | null>(null);

  // States for Custom Tunings
  const [availableTunings, setAvailableTunings] = React.useState(() => getAllAvailableTunings());
  const [showAddTuningModal, setShowAddTuningModal] = React.useState(false);
  const [newTuningName, setNewTuningName] = React.useState("");
  const [newTuningStrings, setNewTuningStrings] = React.useState<string[]>(["E", "A", "D", "G", "B", "e"]);

  // States for Main Chords (Acordes Principales)
  const [showAddMainChordModal, setShowAddMainChordModal] = React.useState(false);
  const [newMainChordInput, setNewMainChordInput] = React.useState("");

  const refreshTunings = () => {
    setAvailableTunings(getAllAvailableTunings());
  };

  const handleCreateCustomTuning = () => {
    const tName = newTuningName.trim();
    if (!tName) return;
    saveCustomTuning({
      id: `tune_${Date.now()}`,
      name: tName,
      strings: newTuningStrings.map(s => s.trim().toUpperCase() || "E")
    });
    refreshTunings();
    handleUpdateActiveVersion({ tuning: tName });
    setShowAddTuningModal(false);
    setNewTuningName("");
    setNewTuningStrings(["E", "A", "D", "G", "B", "e"]);
  };

  const handleDeleteCurrentCustomTuning = (tuningToDelete: string) => {
    deleteCustomTuning(tuningToDelete);
    refreshTunings();
    handleUpdateActiveVersion({ tuning: "Estándar" });
  };

  const handleAddMainChord = (chordName: string) => {
    const clean = chordName.trim();
    if (!clean) return;
    const current = activeVersion.mainChords ? [...activeVersion.mainChords] : (song.mainChords ? [...song.mainChords] : []);
    if (!current.includes(clean)) {
      current.push(clean);
      handleUpdateActiveVersion({ mainChords: current });
    }
    setNewMainChordInput("");
    setShowAddMainChordModal(false);
  };

  const handleRemoveMainChord = (idx: number) => {
    const current = activeVersion.mainChords ? [...activeVersion.mainChords] : (song.mainChords ? [...song.mainChords] : []);
    current.splice(idx, 1);
    handleUpdateActiveVersion({ mainChords: current });
  };

  const handleShiftMainChord = (idx: number, direction: -1 | 1) => {
    const current = activeVersion.mainChords ? [...activeVersion.mainChords] : (song.mainChords ? [...song.mainChords] : []);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= current.length) return;
    const temp = current[idx];
    current[idx] = current[targetIdx];
    current[targetIdx] = temp;
    handleUpdateActiveVersion({ mainChords: current });
  };

  // States for Editing Section (Requisito #4: cambiar tipo/nombre una vez creada)
  const [editingSectionIdx, setEditingSectionIdx] = React.useState<number | null>(null);
  const [editSectionName, setEditSectionName] = React.useState<string>("");
  const [editSectionType, setEditSectionType] = React.useState<'chords' | 'tab'>('chords');

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

  // Helper to update active version and synchronize if principal
  const handleUpdateActiveVersion = (updates: Partial<SongVersion>) => {
    const updatedSong = applyVersionUpdate(song, activeVersion.id, updates);
    onUpdateSong(updatedSong);
  };

  // Set active version as Principal
  const handleSetAsPrincipal = (versionId: string) => {
    const updated = setPrincipalVersion(song, versionId);
    onUpdateSong(updated);
    setPrincipalToast(`⭐ ¡"${activeVersion.name}" ahora es la versión principal mostrada en el menú!`);
    setTimeout(() => setPrincipalToast(null), 3500);
  };

  // Create new version
  const handleCreateNewVersion = () => {
    const vName = newVersionName.trim() || `Versión ${versions.length + 1}`;
    let secJson = "[]";
    let capoVal = 0;
    let tuningVal = "Estándar";

    if (newVersionBaseType === 'duplicate') {
      secJson = activeVersion.sectionsJson;
      capoVal = activeVersion.capo;
      tuningVal = activeVersion.tuning;
    } else if (newVersionBaseType === 'template') {
      secJson = JSON.stringify([
        { name: "Verso", type: "chords", content: JSON.stringify([{ chords: [], repeat: 1 }]) },
        { name: "Pre-coro", type: "chords", content: JSON.stringify([{ chords: [], repeat: 1 }]) },
        { name: "Coro", type: "chords", content: JSON.stringify([{ chords: [], repeat: 1 }]) },
        { name: "Puente", type: "chords", content: JSON.stringify([{ chords: [], repeat: 1 }]) }
      ]);
      capoVal = activeVersion.capo;
      tuningVal = activeVersion.tuning;
    }

    const result = addNewVersion(song, vName, {
      capo: capoVal,
      tuning: tuningVal,
      sectionsJson: secJson,
      lyrics: activeVersion.lyrics || song.lyrics
    });

    onUpdateSong(result.song);
    setActiveVersionId(result.newVersion.id);
    setShowNewVersionModal(false);
    setNewVersionName("");
  };

  // Duplicate current active version
  const handleDuplicateActiveVersion = () => {
    const result = duplicateVersion(song, activeVersion.id);
    onUpdateSong(result.song);
    setActiveVersionId(result.newVersion.id);
    setPrincipalToast(`📋 Se ha creado una copia: "${result.newVersion.name}"`);
    setTimeout(() => setPrincipalToast(null), 3000);
  };

  // Rename current active version
  const handleRenameCurrentVersion = () => {
    if (renameVersionName.trim()) {
      handleUpdateActiveVersion({ name: renameVersionName.trim() });
      setShowRenameVersionModal(false);
    }
  };

  // Delete current active version
  const handleDeleteCurrentVersion = () => {
    if (versions.length <= 1) return;
    const result = deleteVersion(song, activeVersion.id);
    onUpdateSong(result.song);
    setActiveVersionId(result.nextActiveVersionId);
    setShowDeleteVersionConfirm(false);
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
    return extractSongChords(activeVersion.sectionsJson);
  }, [activeVersion.sectionsJson]);

  const customChords = React.useMemo(() => {
    const songLocal = loadCustomChords(activeVersion.sectionsJson);
    const globalDict = getGlobalCustomChords(allSongs);
    return { ...globalDict, ...songLocal };
  }, [activeVersion.sectionsJson, allSongs]);

  const handleSaveCustomChord = (chordName: string, shape: ChordShape) => {
    // Save globally so all songs and picker suggestions have it immediately
    saveGlobalCustomChord(chordName, shape);
    const updatedCustom = { ...customChords, [chordName]: shape };
    const updatedSectionsJson = saveCustomChords(activeVersion.sectionsJson, updatedCustom);
    handleUpdateActiveVersion({ sectionsJson: updatedSectionsJson });
  };

  const handleDeleteCustomChord = (chordName: string) => {
    deleteGlobalCustomChord(chordName);
    const updatedCustom = { ...customChords };
    delete updatedCustom[chordName];
    const updatedSectionsJson = saveCustomChords(activeVersion.sectionsJson, updatedCustom);
    handleUpdateActiveVersion({ sectionsJson: updatedSectionsJson });
  };

  const getSections = (): Section[] => {
    try {
      const all = activeVersion.sectionsJson ? JSON.parse(activeVersion.sectionsJson) : [];
      if (!Array.isArray(all)) return [];
      return all.filter((s: any) => s && (s.type === 'chords' || s.type === 'tab')) as Section[];
    } catch {
      return [];
    }
  };

  const updateSections = (visibleSections: Section[]) => {
    try {
      const all = activeVersion.sectionsJson ? JSON.parse(activeVersion.sectionsJson) : [];
      const metadataSections = Array.isArray(all) 
        ? all.filter((s: any) => s && s.type !== 'chords' && s.type !== 'tab') 
        : [];
      
      const newAll = [...visibleSections, ...metadataSections];
      handleUpdateActiveVersion({
        sectionsJson: JSON.stringify(newAll)
      });
    } catch {
      handleUpdateActiveVersion({
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

  const handleOpenEditSection = (index: number) => {
    const sections = getSections();
    const target = sections[index];
    if (!target) return;
    setEditingSectionIdx(index);
    setEditSectionName(target.name);
    setEditSectionType(target.type);
  };

  const handleSaveSectionConfig = () => {
    if (editingSectionIdx === null) return;
    const sections = getSections();
    const current = sections[editingSectionIdx];
    if (!current) return;

    const finalName = editSectionName.trim() || current.name;
    let newContent = current.content;

    // Convert chords -> tab
    if (current.type === 'chords' && editSectionType === 'tab') {
      let extractedChords: string[] = [];
      try {
        const lines = JSON.parse(current.content || "[]");
        if (Array.isArray(lines)) {
          lines.forEach((l: any) => {
            if (l && Array.isArray(l.chords)) {
              l.chords.forEach((c: any) => {
                if (c && typeof c.name === 'string' && c.name.trim()) {
                  extractedChords.push(c.name.trim());
                }
              });
            }
          });
        }
      } catch {}

      const colCount = Math.max(16, extractedChords.length * 4);
      const emptyTabGrid = Array(6).fill(null).map(() => Array(colCount).fill("-"));
      const tabChords = Array(colCount).fill("");
      extractedChords.forEach((ch, cIdx) => {
        const colPos = cIdx * 4;
        if (colPos < colCount) {
          tabChords[colPos] = ch;
        }
      });

      newContent = JSON.stringify({
        tab: emptyTabGrid,
        repeat: 1,
        chords: tabChords
      });
    } 
    // Convert tab -> chords
    else if (current.type === 'tab' && editSectionType === 'chords') {
      let extractedChords: string[] = [];
      try {
        const tabData = JSON.parse(current.content || "{}");
        if (tabData && Array.isArray(tabData.chords)) {
          extractedChords = tabData.chords.filter((c: any) => typeof c === 'string' && c.trim() !== "");
        }
      } catch {}

      const chordItems = extractedChords.length > 0 
        ? extractedChords.map(name => ({ name, beats: 4 }))
        : [];
      newContent = JSON.stringify(chordItems.length > 0 ? [{ chords: chordItems, repeat: 1 }] : []);
    }

    const updated = [...sections];
    updated[editingSectionIdx] = {
      ...current,
      name: finalName,
      type: editSectionType,
      content: newContent
    };

    updateSections(updated);
    setEditingSectionIdx(null);
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

        {/* Version Switcher and Controls */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <GitBranch className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Versión activa:
              </span>
            </div>
            
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                setNewVersionName("");
                setNewVersionBaseType("duplicate");
                setShowNewVersionModal(true);
              }}
              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/40 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3 h-3 stroke-[2.5]" />
              <span>Nueva Versión</span>
            </motion.button>
          </div>

          {/* Version Pills Carousel / Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {versions.map(v => {
              const isSelected = v.id === activeVersion.id;
              const isPrincipal = v.isDefault || v.id === song.defaultVersionId;
              return (
                <motion.button
                  key={v.id}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActiveVersionId(v.id)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-amber-400 text-zinc-950 border-amber-500/50 shadow-xs ring-2 ring-amber-400/30'
                      : 'bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {isPrincipal && (
                    <Star className={`w-3.5 h-3.5 fill-current ${isSelected ? 'text-zinc-950' : 'text-amber-500'}`} />
                  )}
                  <span>{v.name}</span>
                  {(v.capo ?? 0) > 0 && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                      isSelected ? 'bg-zinc-950/15 text-zinc-950' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}>
                      Capo {v.capo}
                    </span>
                  )}
                  {v.tuning && v.tuning !== "Estándar" && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                      isSelected ? 'bg-zinc-950/15 text-zinc-950' : 'bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300'
                    }`}>
                      {v.tuning}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Active Version Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-zinc-50/90 dark:bg-zinc-800/50 border border-zinc-200/90 dark:border-zinc-750 text-xs">
            {/* Principal Version Status & Button */}
            <div className="flex items-center gap-2">
              {activeVersion.isDefault || activeVersion.id === song.defaultVersionId ? (
                <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700 font-extrabold px-2.5 py-1 rounded-full text-[11px] shadow-2xs">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  Versión Principal (mostrada en el menú)
                </span>
              ) : (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleSetAsPrincipal(activeVersion.id)}
                  title="Hacer que esta versión sea la predeterminada y se muestre en el menú principal"
                  className="inline-flex items-center gap-1.5 bg-white dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-zinc-800 dark:text-zinc-200 hover:text-amber-700 dark:hover:text-amber-300 border border-zinc-300 dark:border-zinc-700 hover:border-amber-300 font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all shadow-2xs text-[11px]"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500 stroke-[2]" />
                  <span>⭐ Seleccionar como Principal</span>
                </motion.button>
              )}
            </div>

            {/* Quick Actions: Duplicate, Rename, Delete */}
            <div className="flex items-center gap-1.5">
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleDuplicateActiveVersion}
                title="Duplicar esta versión para crear una variante con otros acordes o afinación"
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Copy className="w-3 h-3 text-zinc-500" />
                <span>Duplicar</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  setRenameVersionName(activeVersion.name);
                  setShowRenameVersionModal(true);
                }}
                title="Cambiar el nombre de esta versión"
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3 h-3 text-zinc-500" />
                <span>Renombrar</span>
              </motion.button>

              {versions.length > 1 && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setShowDeleteVersionConfirm(true)}
                  title="Eliminar esta versión"
                  className="px-2 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 font-semibold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden xs:inline">Eliminar</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Toast Notification for Principal status change */}
          <AnimatePresence>
            {principalToast && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-2 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{principalToast}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-px bg-zinc-200/80 dark:bg-zinc-800" />

        {/* Capo & Tuning Selectors for active version */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Capo */}
          <div className="flex items-center justify-between border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
              Capotraste:
            </span>
            <div className="flex items-center gap-1.5">
              <motion.button
                whileTap={{ scale: 0.85 }}
                disabled={(activeVersion.capo ?? 0) <= 0}
                onClick={() => handleUpdateActiveVersion({ capo: Math.max(0, (activeVersion.capo ?? 0) - 1) })}
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 disabled:opacity-30 font-bold cursor-pointer shadow-2xs"
              >
                -
              </motion.button>
              <span className="font-mono text-xs font-bold px-2 text-center select-none text-zinc-900 dark:text-zinc-100 min-w-[4rem]">
                {(activeVersion.capo ?? 0) === 0 ? "Sin Capo" : `Traste ${activeVersion.capo}`}
              </span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                disabled={(activeVersion.capo ?? 0) >= 12}
                onClick={() => handleUpdateActiveVersion({ capo: Math.min(12, (activeVersion.capo ?? 0) + 1) })}
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 disabled:opacity-30 font-bold cursor-pointer shadow-2xs"
              >
                +
              </motion.button>
            </div>
          </div>

          {/* Tuning */}
          <div className="flex items-center justify-between border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
              Afinación:
            </span>
            <div className="flex items-center gap-1.5">
              <select
                value={activeVersion.tuning || "Estándar"}
                onChange={e => handleUpdateActiveVersion({ tuning: e.target.value })}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer shadow-2xs max-w-[130px] truncate"
              >
                {availableTunings.map(t => (
                  <option key={t.name} value={t.name}>
                    {t.name}{t.isCustom ? " ★" : ""}
                  </option>
                ))}
              </select>

              {/* Add Custom Tuning Button */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setNewTuningName("");
                  setNewTuningStrings(["E", "A", "D", "G", "B", "e"]);
                  setShowAddTuningModal(true);
                }}
                className="p-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs cursor-pointer shadow-2xs flex items-center gap-0.5"
                title="Añadir una afinación personalizada adicional"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
              </motion.button>

              {/* Delete custom tuning if active */}
              {availableTunings.find(t => t.name === (activeVersion.tuning || "Estándar"))?.isCustom && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDeleteCurrentCustomTuning(activeVersion.tuning)}
                  className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold cursor-pointer shadow-2xs"
                  title="Eliminar esta afinación personalizada"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </div>
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

      {/* Acordes Principales de la Canción (Banco de Acordes Base) */}
      <div className="bg-white/95 dark:bg-zinc-850/95 border border-amber-200/90 dark:border-amber-800/60 p-3.5 sm:p-4 rounded-3xl space-y-3 shadow-xs select-none">
        <div className="flex items-center justify-between border-b border-amber-100 dark:border-amber-900/40 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>Acordes Principales</span>
                <span className="bg-amber-400 text-zinc-950 text-[10px] font-black px-2 py-0.2 rounded-full">
                  {(activeVersion.mainChords || []).length}
                </span>
              </h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Paleta base para ordenar y asignar pulsos rápidamente en cada sección
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => setShowAddMainChordModal(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Añadir</span>
          </motion.button>
        </div>

        {/* List of Main Chords with Reordering and Mini Preview */}
        {(activeVersion.mainChords || []).length > 0 ? (
          <div className="flex flex-wrap gap-2.5 pt-1">
            {(activeVersion.mainChords || []).map((chord, cIdx) => (
              <motion.div
                key={`${chord}-${cIdx}`}
                layout
                className="flex flex-col items-center bg-zinc-50 dark:bg-zinc-800/80 border border-amber-200/80 dark:border-amber-800/60 p-2 rounded-2xl shadow-2xs group relative"
              >
                {/* Reorder Left/Right & Delete */}
                <div className="flex items-center justify-between w-full mb-1 gap-1">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={cIdx === 0}
                      onClick={() => handleShiftMainChord(cIdx, -1)}
                      className="p-0.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-20 cursor-pointer"
                      title="Mover acorde a la izquierda"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={cIdx === (activeVersion.mainChords || []).length - 1}
                      onClick={() => handleShiftMainChord(cIdx, 1)}
                      className="p-0.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-20 cursor-pointer"
                      title="Mover acorde a la derecha"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMainChord(cIdx)}
                    className="p-0.5 text-rose-400 hover:text-rose-600 cursor-pointer"
                    title="Eliminar de acordes principales"
                  >
                    <X className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>

                {/* Chord Name Badge */}
                <button
                  type="button"
                  onClick={() => setSelectedChordForDiagram(chord)}
                  className="font-serif text-sm font-black text-zinc-900 dark:text-zinc-100 hover:text-amber-600 transition-colors cursor-pointer"
                  title="Ver diagrama y rasgueo de este acorde"
                >
                  {chord}
                </button>

                {/* Mini Preview directly underneath */}
                <div className="mt-1 flex justify-center">
                  <MiniChordDiagram
                    chordName={chord}
                    customChords={customChords}
                    allSongs={allSongs}
                    width={32}
                    height={38}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-2.5 px-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-dashed border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-amber-900/80 dark:text-amber-200/80 text-center sm:text-left">
              Define aquí los acordes base de tu canción (ej: <strong>C, G, Am, F</strong>) para insertarlos y ordenarlos en segundos en las secciones.
            </p>
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={() => setShowAddMainChordModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs cursor-pointer shrink-0 shadow-2xs"
            >
              + Añadir Acordes Principales
            </motion.button>
          </div>
        )}
      </div>

      {/* Unique Chords Overview Bar with Mini Preview */}
      <div className="bg-white/80 dark:bg-zinc-850/80 border border-zinc-200/80 dark:border-zinc-800 p-3.5 sm:p-4 rounded-3xl space-y-2.5 shadow-xs select-none">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Guitar className="w-4 h-4 text-amber-500" />
            <span>Todos los acordes de la canción</span>
            <span className="bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-extrabold px-2 py-0.2 rounded-full leading-none">
              {songChords.length}
            </span>
          </h4>
          <span className="text-[10px] text-zinc-400 font-semibold">
            Toca para forma & audio
          </span>
        </div>

        {songChords.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {songChords.map(chord => {
              const isCustom = !!customChords[chord];
              return (
                <motion.button
                  key={chord}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 450, damping: 22 }}
                  onClick={() => setSelectedChordForDiagram(chord)}
                  className={`px-2.5 py-1.5 rounded-2xl font-serif text-xs font-bold cursor-pointer flex flex-col items-center gap-1 border shadow-2xs ${
                    isCustom
                      ? "bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                      : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="font-bold">{chord}</span>
                    {isCustom && (
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" title="Forma personalizada" />
                    )}
                  </div>
                  {/* Mini preview diagram directly underneath */}
                  <MiniChordDiagram
                    chordName={chord}
                    customChords={customChords}
                    allSongs={allSongs}
                    width={30}
                    height={36}
                  />
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
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2 px-1 select-none">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-500 flex items-center justify-center font-black text-xs shrink-0">
                  {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenEditSection(idx)}
                  className="font-extrabold text-xs sm:text-sm text-zinc-900 flex items-center gap-1.5 hover:text-amber-600 transition-colors cursor-pointer group text-left"
                  title="Toca para cambiar nombre o tipo (Intro, Coro, Puente, etc.)"
                >
                  <span>{sec.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase group-hover:bg-amber-100 group-hover:text-amber-900 group-hover:border-amber-300 transition-colors">
                    {sec.type === "chords" ? "Acordes" : "Tablatura"}
                  </span>
                  <Edit3 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>

              {/* Action Buttons (Change Type/Name, Reorder, Duplicate, Delete) */}
              <div className="flex items-center gap-1">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  title="Cambiar categoría (Intro, Coro...) o formato"
                  onClick={() => handleOpenEditSection(idx)}
                  className="px-2 py-1 rounded-lg flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold cursor-pointer transition-colors border border-zinc-200"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden xs:inline">Cambiar</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  title="Subir sección"
                  disabled={idx === 0}
                  onClick={() => handleMoveSectionUp(idx)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronUp className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  title="Bajar sección"
                  disabled={idx === currentSections.length - 1}
                  onClick={() => handleMoveSectionDown(idx)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  title="Duplicar sección"
                  onClick={() => handleDuplicateSection(idx)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  title="Eliminar sección"
                  onClick={() => handleDeleteSection(idx)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-500 cursor-pointer"
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
                  allSongs={allSongs}
                  customChords={customChords}
                  mainChords={activeVersion.mainChords || song.mainChords || []}
                  onChange={(newContent) => {
                    const updated = currentSections.map((s, sIdx) => sIdx === idx ? { ...s, content: newContent } : s);
                    updateSections(updated);
                  }}
                />
              ) : (
                <TabSectionEditor
                  content={sec.content}
                  allSongs={allSongs}
                  customChords={customChords}
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

      {/* Change Section Type & Name Modal (Requisito #4: cambiar sección una vez creada) */}
      <AnimatePresence>
        {editingSectionIdx !== null && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="bg-white border border-zinc-200 p-5 rounded-3xl w-full max-w-md shadow-2xl text-zinc-900 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-zinc-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center">
                    {editingSectionIdx + 1}
                  </span>
                  <h3 className="font-extrabold text-base text-zinc-900">
                    Cambiar Sección #{editingSectionIdx + 1}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingSectionIdx(null)}
                  className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Presets Selection */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Cambiar a tipo/categoría:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {SECTION_PRESETS.map(preset => (
                    <motion.button
                      key={preset.name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      type="button"
                      onClick={() => setEditSectionName(preset.name)}
                      className={`p-2 rounded-xl text-center flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                        editSectionName === preset.name
                          ? "bg-amber-400 text-zinc-950 font-extrabold border-amber-500 shadow-xs ring-1 ring-amber-400"
                          : "bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-bold border-zinc-200"
                      }`}
                    >
                      <span className="text-base select-none">{preset.emoji}</span>
                      <span className="text-[11px]">{preset.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Custom Name */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Nombre de la sección:
                </span>
                <input
                  type="text"
                  value={editSectionName}
                  onChange={e => setEditSectionName(e.target.value)}
                  placeholder="Ej: Intro, Coro 2, Puente acústico..."
                  className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>

              {/* Format / Type Switcher */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Formato de la sección:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditSectionType('chords')}
                    className={`p-3 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                      editSectionType === 'chords'
                        ? "bg-amber-50 border-amber-400 text-amber-950 font-extrabold ring-1 ring-amber-400/40 shadow-xs"
                        : "bg-zinc-50 border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-100"
                    }`}
                  >
                    <Music className="w-4 h-4 text-amber-500" />
                    <span className="text-xs">Acordes (Pulsos)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditSectionType('tab')}
                    className={`p-3 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                      editSectionType === 'tab'
                        ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-extrabold ring-1 ring-emerald-400/40 shadow-xs"
                        : "bg-zinc-50 border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-100"
                    }`}
                  >
                    <Guitar className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs">Tablatura (6 Cuerdas)</span>
                  </button>
                </div>
                {currentSections[editingSectionIdx] && currentSections[editingSectionIdx].type !== editSectionType && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-xl mt-1 leading-snug">
                    ℹ️ Se adaptarán automáticamente los acordes al nuevo formato.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => setEditingSectionIdx(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={handleSaveSectionConfig}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-zinc-950 text-xs font-extrabold cursor-pointer shadow-xs transition-colors"
                >
                  Guardar Cambios
                </motion.button>
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

      {/* New Version Modal */}
      <AnimatePresence>
        {showNewVersionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="bg-white border border-zinc-200 p-5 rounded-3xl w-full max-w-md shadow-2xl text-zinc-900 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-zinc-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-amber-400/20 text-amber-600 flex items-center justify-center">
                    <GitBranch className="w-4 h-4 stroke-[2.5]" />
                  </span>
                  <h3 className="font-extrabold text-base text-zinc-900">
                    Nueva Versión de la Canción
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewVersionModal(false)}
                  className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Version Name Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Nombre de la versión:
                </label>
                <input
                  type="text"
                  value={newVersionName}
                  onChange={e => setNewVersionName(e.target.value)}
                  placeholder="ej. Acordes Fáciles, Capo 3, Afinación Eb..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />

                {/* Quick Name Suggestions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["Acordes Fáciles", "Capo 2", "Capo 3", "Afinación Eb", "En Vivo", "Acústica", "Drop D"].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNewVersionName(tag)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-zinc-100 hover:bg-amber-100 text-zinc-700 hover:text-amber-900 border border-zinc-200 cursor-pointer transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Starting Content Base */}
              <div className="space-y-2 pt-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Punto de partida:
                </label>
                <div className="space-y-1.5">
                  <label
                    onClick={() => setNewVersionBaseType('duplicate')}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                      newVersionBaseType === 'duplicate'
                        ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400/30'
                        : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="baseType"
                      checked={newVersionBaseType === 'duplicate'}
                      onChange={() => setNewVersionBaseType('duplicate')}
                      className="mt-0.5 accent-amber-500 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold text-zinc-900">
                        Copiar acordes y afinación de "{activeVersion.name}"
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Ideal para cambiar el capo o sustituir acordes sin empezar desde cero.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setNewVersionBaseType('template')}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                      newVersionBaseType === 'template'
                        ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400/30'
                        : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="baseType"
                      checked={newVersionBaseType === 'template'}
                      onChange={() => setNewVersionBaseType('template')}
                      className="mt-0.5 accent-amber-500 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold text-zinc-900">
                        Plantilla básica (Verso, Pre-coro, Coro, Puente)
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Crea las secciones comunes listas para rellenar acordes.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setNewVersionBaseType('blank')}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                      newVersionBaseType === 'blank'
                        ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400/30'
                        : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="baseType"
                      checked={newVersionBaseType === 'blank'}
                      onChange={() => setNewVersionBaseType('blank')}
                      className="mt-0.5 accent-amber-500 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold text-zinc-900">
                        En blanco
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Empieza con un lienzo completamente vacío.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={() => setShowNewVersionModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={handleCreateNewVersion}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-zinc-950 text-xs font-extrabold cursor-pointer shadow-xs transition-colors"
                >
                  Crear Versión
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rename Version Modal */}
      <AnimatePresence>
        {showRenameVersionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="bg-white border border-zinc-200 p-5 rounded-3xl w-full max-w-sm shadow-2xl text-zinc-900 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-zinc-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-amber-400/20 text-amber-600 flex items-center justify-center">
                    <Edit3 className="w-4 h-4 stroke-[2.2]" />
                  </span>
                  <h3 className="font-extrabold text-base text-zinc-900">
                    Renombrar Versión
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRenameVersionModal(false)}
                  className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Nuevo nombre:
                </label>
                <input
                  type="text"
                  value={renameVersionName}
                  onChange={e => setRenameVersionName(e.target.value)}
                  placeholder="ej. Acordes Fáciles, Capo 4..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={() => setShowRenameVersionModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={handleRenameCurrentVersion}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-zinc-950 text-xs font-extrabold cursor-pointer shadow-xs transition-colors"
                >
                  Guardar Nombre
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Version Confirmation Modal */}
      <AnimatePresence>
        {showDeleteVersionConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="bg-white border border-zinc-200 p-5 rounded-3xl w-full max-w-sm shadow-2xl text-zinc-900 space-y-4"
            >
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle className="w-6 h-6 shrink-0 stroke-[2.2]" />
                <h3 className="font-extrabold text-base text-zinc-900">
                  ¿Eliminar versión?
                </h3>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Esta acción borrará la versión{" "}
                <strong className="text-zinc-800">"{activeVersion.name}"</strong>{" "}
                con sus acordes y configuraciones específicas.
              </p>
              {activeVersion.isDefault && versions.length > 1 && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-xl leading-snug">
                  ℹ️ Esta versión es la principal. Al eliminarla, otra versión pasará a ser la principal automáticamente.
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setShowDeleteVersionConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-bold cursor-pointer text-zinc-800"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleDeleteCurrentVersion}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-sm shadow-rose-600/30"
                >
                  Eliminar Versión
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Añadir Acorde Principal */}
      <AnimatePresence>
        {showAddMainChordModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl w-full max-w-md shadow-2xl text-zinc-900 dark:text-zinc-100 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-500 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base">
                      Añadir Acorde Principal
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Agrégalo a tu paleta rápida para esta canción
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMainChordModal(false)}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddMainChord(newMainChordInput);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={newMainChordInput}
                  onChange={(e) => setNewMainChordInput(e.target.value)}
                  placeholder="Escribe un acorde (ej: C, G, Dm, B7...)"
                  autoFocus
                  className="flex-1 px-3.5 py-2 text-xs font-semibold font-serif rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="submit"
                  disabled={!newMainChordInput.trim()}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-zinc-950 text-xs font-black rounded-xl cursor-pointer shadow-xs"
                >
                  Añadir
                </motion.button>
              </form>

              {/* Quick Select Presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Sugerencias Rápidas:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {["C", "G", "D", "A", "E", "Am", "Em", "Dm", "F", "B7", "Cadd9", "Dsus4", "Asus4", "Amaj7", "G6", "Bm"].map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => handleAddMainChord(ch)}
                      className="px-3 py-1 font-serif text-xs font-bold rounded-xl bg-zinc-100 hover:bg-amber-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 cursor-pointer transition-colors"
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddMainChordModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  Listo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Añadir Afinación Personalizada */}
      <AnimatePresence>
        {showAddTuningModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl w-full max-w-md shadow-2xl text-zinc-900 dark:text-zinc-100 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-500 flex items-center justify-center font-bold">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base">
                      Nueva Afinación de Guitarra
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Sonidos y diagramas se ajustarán a esta afinación
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddTuningModal(false)}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tuning Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Nombre de la Afinación:
                </label>
                <input
                  type="text"
                  value={newTuningName}
                  onChange={(e) => setNewTuningName(e.target.value)}
                  placeholder="ej: Drop C#, Open C, C-G-C-F-A-D..."
                  autoFocus
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>

              {/* 6 Strings Note Configuration */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  Notas de las 6 Cuerdas (de 6ª más grave a 1ª más aguda):
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {newTuningStrings.map((strNote, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-mono font-bold text-zinc-400">
                        {6 - idx}ª
                      </span>
                      <input
                        type="text"
                        maxLength={3}
                        value={strNote}
                        onChange={(e) => {
                          const updated = [...newTuningStrings];
                          updated[idx] = e.target.value.toUpperCase();
                          setNewTuningStrings(updated);
                        }}
                        className="w-full text-center px-1 py-1.5 font-mono text-xs font-black rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Presets Helpers */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Plantillas Rápidas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Drop D", strings: ["D", "A", "D", "G", "B", "E"] },
                    { label: "Drop C#", strings: ["C#", "G#", "C#", "F#", "A#", "D#"] },
                    { label: "Drop C", strings: ["C", "G", "C", "F", "A", "D"] },
                    { label: "DADGAD", strings: ["D", "A", "D", "G", "A", "D"] },
                    { label: "Open D", strings: ["D", "A", "D", "F#", "A", "D"] },
                    { label: "Open G", strings: ["D", "G", "D", "G", "B", "D"] },
                    { label: "Open C", strings: ["C", "G", "C", "G", "C", "E"] },
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setNewTuningName(p.label);
                        setNewTuningStrings(p.strings);
                      }}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-zinc-100 hover:bg-amber-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddTuningModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  Cancelar
                </button>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  disabled={!newTuningName.trim()}
                  onClick={handleCreateCustomTuning}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-zinc-950 text-xs font-extrabold cursor-pointer shadow-xs transition-colors"
                >
                  Guardar Afinación
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
          capo={activeVersion.capo ?? 0}
          tuning={activeVersion.tuning || song.tuning || "Estándar"}
          onClose={() => setSelectedChordForDiagram(null)}
          onSaveCustomChord={handleSaveCustomChord}
          onDeleteCustomChord={handleDeleteCustomChord}
        />
      )}
    </div>
  );
};

