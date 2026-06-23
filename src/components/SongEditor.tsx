import React, { useState, useEffect } from 'react';
import { SongEntity, Section } from '../types';
import ChordSectionEditor from './ChordSectionEditor';
import TabSectionEditor from './TabSectionEditor';
import { 
  ArrowLeft, 
  Trash2, 
  Copy, 
  Plus, 
  Layers, 
  Loader2, 
  AlertTriangle,
  PlayCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const TUNINGS = ["Estándar", "Drop D", "Eb Estándar", "DADGAD", "Open G", "Open D"];

const SECTION_PRESETS = [
  { name: "Intro", emoji: "🎸" },
  { name: "Verso", emoji: "📖" },
  { name: "Coro", emoji: "🎵" },
  { name: "Puente", emoji: "🌉" },
  { name: "Pre-coro", emoji: "🔄" },
  { name: "Solo", emoji: "⚡" },
  { name: "Outro", emoji: "🎶" },
  { name: "Riff", emoji: "🎸" }
];

interface SongEditorProps {
  song: SongEntity;
  isSaving: boolean;
  onUpdateSong: (updates: Partial<SongEntity>) => void;
  onDeleteSong: (id: number) => void;
  onBack: () => void;
}

export default function SongEditor({
  song,
  isSaving,
  onUpdateSong,
  onDeleteSong,
  onBack
}: SongEditorProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState<'name' | 'type'>('name');
  const [selectedName, setSelectedName] = useState('');
  const [customName, setCustomName] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Helper to parse sections stored inside song.sectionsJson
  const getSections = (): Section[] => {
    try {
      return song.sectionsJson ? JSON.parse(song.sectionsJson) : [];
    } catch {
      return [];
    }
  };

  const saveSections = (secs: Section[]) => {
    onUpdateSong({ sectionsJson: JSON.stringify(secs) });
  };

  const handleMetadataChange = (fields: Partial<SongEntity>) => {
    onUpdateSong(fields);
  };

  const handleDeleteSection = (index: number) => {
    const secs = getSections();
    const updated = secs.filter((_, idx) => idx !== index);
    saveSections(updated);
  };

  const handleDuplicateSection = (index: number) => {
    const secs = getSections();
    const matched = secs[index];
    if (!matched) return;

    const cloned: Section = {
      ...matched,
      name: `${matched.name} (copia)`
    };

    const nextSecs = [...secs];
    nextSecs.splice(index + 1, 0, cloned);
    saveSections(nextSecs);
  };

  const handleMoveSectionUp = (index: number) => {
    if (index <= 0) return;
    const secs = getSections();
    const copy = [...secs];
    const prev = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = prev;
    saveSections(copy);
  };

  const handleMoveSectionDown = (index: number) => {
    const secs = getSections();
    if (index >= secs.length - 1) return;
    const copy = [...secs];
    const next = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = next;
    saveSections(copy);
  };

  const handleAddNewSection = (type: 'chords' | 'tab') => {
    const secs = getSections();
    const finalName = customName.trim() || selectedName || "Sección sin nombre";

    let initialContent = '[]'; // For chords
    if (type === 'tab') {
      // Default blank 16-columns matrix for tabs
      const emptyTab = Array(6).fill(null).map(() => Array(16).fill("-"));
      initialContent = JSON.stringify({ tab: emptyTab, repeat: 1, chords: Array(16).fill('') });
    }

    const newSec: Section = {
      name: finalName,
      type,
      content: initialContent
    };

    saveSections([...secs, newSec]);
    
    // reset states
    setShowAddModal(false);
    setAddStep('name');
    setSelectedName('');
    setCustomName('');
  };

  const handlePresetSelect = (name: string) => {
    setSelectedName(name);
    setAddStep('type');
  };

  const handleCustomNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim()) {
      setAddStep('type');
    }
  };

  const sectionsList = getSections();

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top action nav header bar */}
      <div className="flex justify-between items-center bg-zinc-100 border-3 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
        
        <button
          onClick={onBack}
          className="px-3 py-1.5 border-2 border-black bg-white hover:bg-zinc-200 text-xs font-black uppercase tracking-wide cursor-pointer inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Atrás</span>
        </button>

        <div className="flex items-center gap-3">
          {isSaving ? (
            <span className="text-[10px] sm:text-xs font-bold text-zinc-550 flex items-center gap-1.5 bg-zinc-50 border-2 border-dashed border-zinc-300 px-2.2 py-1">
              <Loader2 className="w-3 h-3 animate-spin text-black" />
              Guardando...
            </span>
          ) : (
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-green-700 bg-green-50 border-2 border-green-800 px-2 py-0.5 animate-pulse">
              ✓ Todo Guardado
            </span>
          )}

          <button
            onClick={() => setShowConfirmDelete(true)}
            className="p-1 px-2.5 border-2 border-black bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs uppercase cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>
      </div>

      {/* Main Metadata card */}
      <div className="bg-white border-4 border-black p-4 sm:p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black select-text">
        <div className="flex flex-col gap-1">
          {/* Title Input */}
          <input
            type="text"
            value={song.title || ''}
            onChange={(e) => handleMetadataChange({ title: e.target.value })}
            placeholder="Título de la Canción..."
            className="w-full text-lg sm:text-xl font-serif font-black border-none focus:outline-none placeholder:text-zinc-300 bg-transparent text-black"
          />

          {/* Artist Input */}
          <input
            type="text"
            value={song.artist || ''}
            onChange={(e) => handleMetadataChange({ artist: e.target.value })}
            placeholder="Artista / Grupo..."
            className="w-full text-xs sm:text-sm font-black uppercase tracking-wider border-none focus:outline-none placeholder:text-zinc-300 bg-transparent text-zinc-550"
          />
        </div>

        <div className="h-0.5 bg-black" />

        {/* Capo and Tuning settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Capo stepper */}
          <div className="flex items-center justify-between border-2 border-black p-2 bg-zinc-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-xs font-black uppercase text-zinc-700">Capotraste:</span>
            <div className="flex items-center gap-1">
              <button
                disabled={(song.capo ?? 0) <= 0}
                onClick={() => handleMetadataChange({ capo: Math.max(0, (song.capo ?? 0) - 1) })}
                className="w-8 h-8 flex items-center justify-center bg-white border border-black hover:bg-zinc-200 disabled:opacity-40 font-bold cursor-pointer"
              >
                -
              </button>
              <span className="font-mono text-xs font-black text-black px-2.5 min-w-16 text-center select-none">
                {(song.capo ?? 0) === 0 ? "Sin Capo" : `Traste ${song.capo ?? 0}`}
              </span>
              <button
                disabled={(song.capo ?? 0) >= 12}
                onClick={() => handleMetadataChange({ capo: Math.min(12, (song.capo ?? 0) + 1) })}
                className="w-8 h-8 flex items-center justify-center bg-white border border-black hover:bg-zinc-200 disabled:opacity-40 font-bold cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Tuning selector */}
          <div className="flex items-center justify-between border-2 border-black p-2 bg-zinc-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-xs font-black uppercase text-zinc-700">Afinación:</span>
            <select
              value={song.tuning || 'Estándar'}
              onChange={(e) => handleMetadataChange({ tuning: e.target.value })}
              className="px-2.5 py-1.5 text-xs font-bold border border-black bg-white focus:outline-none cursor-pointer"
            >
              {TUNINGS.map((tune) => (
                <option key={tune} value={tune}>
                  {tune}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Sections Lists of Songs */}
      <div className="space-y-6">
        
        {sectionsList.map((section, sIdx) => (
          <div key={sIdx} className="space-y-2 animate-fade-in">
            {/* Section heading info with duplicates/deletes options */}
            <div className="flex justify-between items-center border-b-2 border-black pb-1 px-1">
              <h4 className="font-sans font-black text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-1 select-none">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                {section.name} - <span className="font-mono normal-case">({section.type === 'chords' ? 'Acordes' : 'Tablatura'})</span>
              </h4>

              {/* Little duplicate/delete buttons */}
              <div className="flex items-center gap-1 select-none">
                <button
                  type="button"
                  title="Subir sección"
                  disabled={sIdx === 0}
                  onClick={() => handleMoveSectionUp(sIdx)}
                  className="p-1 border border-black hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent text-black rounded cursor-pointer transition-colors flex items-center text-[9px] font-black uppercase"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  title="Bajar sección"
                  disabled={sIdx === sectionsList.length - 1}
                  onClick={() => handleMoveSectionDown(sIdx)}
                  className="p-1 border border-black hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent text-black rounded cursor-pointer transition-colors flex items-center text-[9px] font-black uppercase"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  title="Duplicar sección"
                  onClick={() => handleDuplicateSection(sIdx)}
                  className="p-1 border border-black hover:bg-zinc-200 text-black rounded cursor-pointer transition-colors flex items-center gap-0.5 text-[9px] font-black uppercase"
                >
                  <Copy className="w-3 h-3" />
                  <span className="hidden sm:inline">Duplicar</span>
                </button>
                <button
                  type="button"
                  title="Eliminar sección"
                  onClick={() => handleDeleteSection(sIdx)}
                  className="p-1 border border-black hover:bg-red-100 text-red-600 rounded cursor-pointer transition-colors flex items-center gap-0.5 text-[9px] font-black uppercase"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              </div>
            </div>

            {/* Inlines screen sections editor depending on type ('chords' vs 'tab') */}
            <div>
              {section.type === 'chords' ? (
                <ChordSectionEditor
                  content={section.content}
                  onChange={(newSecContent) => {
                    const next = sectionsList.map((sc, scIdx) => 
                      scIdx === sIdx ? { ...sc, content: newSecContent } : sc
                    );
                    saveSections(next);
                  }}
                />
              ) : (
                <TabSectionEditor
                  content={section.content}
                  onChange={(newSecContent) => {
                    const next = sectionsList.map((sc, scIdx) => 
                      scIdx === sIdx ? { ...sc, content: newSecContent } : sc
                    );
                    saveSections(next);
                  }}
                />
              )}
            </div>
          </div>
        ))}

        {/* Add section block trigger */}
        <div
          onClick={() => {
            setAddStep('name');
            setShowAddModal(true);
          }}
          className="p-6 md:p-8 bg-zinc-50 hover:bg-zinc-100 border-4 border-dashed border-black rounded-lg text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] select-none group"
        >
          <Plus className="w-8 h-8 text-zinc-400 group-hover:text-black transition-colors stroke-[2.5]" />
          <h5 className="font-black text-xs uppercase tracking-widest text-zinc-500 group-hover:text-black">
            Añadir Sección de Canción
          </h5>
          <p className="text-[10px] text-zinc-450 font-bold">
            Crea bloques de acordes organizados o una partitura móvil interactiva de 6 cuerdas.
          </p>
        </div>

      </div>

      {/* Adding custom Section Modal sheet */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 z-50 select-none animate-fade-in">
          <div className="bg-white border-4 border-black w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative flex flex-col">
            
            {/* Header */}
            <div className="bg-black text-white p-3.5 flex justify-between items-center font-bold font-sans">
              <span className="font-black text-xs uppercase tracking-widest text-white">Añadir nueva sección</span>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white hover:text-yellow-300 font-bold hover:underline py-0.5 px-2 text-xs"
              >
                Cerrar
              </button>
            </div>

            {/* Steps block */}
            <div className="p-5 space-y-4">
              
              {addStep === 'name' ? (
                <div className="space-y-4 animate-fade-in">
                  <span className="text-xs font-black uppercase text-black block tracking-wider">
                    ¿Qué sección deseas añadir?
                  </span>

                  {/* Preset quick buttons list */}
                  <div className="grid grid-cols-2 gap-2">
                    {SECTION_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handlePresetSelect(preset.name)}
                        className="py-2 px-3 border-2 border-black bg-zinc-50 hover:bg-yellow-100 text-left font-bold text-xs uppercase cursor-pointer flex items-center gap-2 rounded transition-colors"
                      >
                        <span className="text-base select-none">{preset.emoji}</span>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="h-px bg-zinc-200" />

                  {/* Custom Name entry */}
                  <form onSubmit={handleCustomNameSubmit} className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-zinc-500">
                      O un nombre personalizado:
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Ej: Coro Alternativo, Puente Trágico, Outro Arpegio..."
                        className="flex-1 px-3 py-1.5 text-xs font-bold border-2 border-black bg-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!customName.trim()}
                        className="px-4 py-1.5 bg-black text-white hover:bg-zinc-800 disabled:opacity-40 text-xs font-black uppercase tracking-wide cursor-pointer rounded"
                      >
                        OK
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-black text-zinc-500 uppercase">
                    <button
                      onClick={() => setAddStep('name')}
                      className="text-black underline cursor-pointer hover:no-underline"
                    >
                      &larr; Volver
                    </button>
                    <span>/</span>
                    <span className="text-black bg-zinc-100 border border-black px-1.5 rounded">
                      {customName.trim() || selectedName}
                    </span>
                  </div>

                  <span className="text-xs font-black uppercase text-black block tracking-wider">
                    ¿Qué tipo de contenido va a tener?
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    {/* Chords option card */}
                    <div
                      onClick={() => handleAddNewSection('chords')}
                      className="bg-zinc-50 hover:bg-yellow-50 border-3 border-black p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-2 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] auto-cols-max"
                    >
                      <PlayCircle className="w-8 h-8 text-amber-500" />
                      <h4 className="font-serif font-black text-black text-sm">Acordes</h4>
                      <p className="text-[10px] text-zinc-500 font-bold leading-normal">
                        Progresión con duraciones por pulsos.
                      </p>
                    </div>

                    {/* Tab Option card */}
                    <div
                      onClick={() => handleAddNewSection('tab')}
                      className="bg-zinc-50 hover:bg-emerald-50 border-3 border-black p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-2 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] auto-cols-max"
                    >
                      <Layers className="w-8 h-8 text-emerald-500" />
                      <h4 className="font-serif font-black text-black text-sm">Tablatura</h4>
                      <p className="text-[10px] text-zinc-500 font-bold leading-normal">
                        Fretboard interactivo móvil de 6 cuerdas.
                      </p>
                    </div>

                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Delete Song Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-fade-in">
          <div className="bg-white border-4 border-black p-5 w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0 stroke-[2.5]" />
              <h3 className="font-serif text-lg font-black uppercase text-black">¿Eliminar canción?</h3>
            </div>
            <p className="text-xs text-zinc-500 font-black leading-relaxed">
              Esta acción no se puede deshacer y borrará permanentemente la canción <strong>"{song.title || 'Sin título'}"</strong> de tus acordes locales.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-3.5 py-1.5 border-2 border-black bg-white hover:bg-zinc-150 text-xs font-black uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteSong(song.id);
                  setShowConfirmDelete(false);
                }}
                className="px-3.5 py-1.5 border-2 border-black bg-red-600 text-white hover:bg-red-700 text-xs font-black uppercase cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
