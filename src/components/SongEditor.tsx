import React from 'react';
import { 
  ArrowLeft, Loader2, Trash2, ChevronUp, ChevronDown, 
  Copy, AlertTriangle, Plus, FileText, Music, Guitar 
} from 'lucide-react';
import { Song, Section } from '../types';
import { ChordSectionEditor } from './ChordSectionEditor';
import { TabSectionEditor } from './TabSectionEditor';

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
  { name: "Puente", emoji: "Bridge" },
  { name: "Pre-coro", emoji: "🔄" },
  { name: "Solo", emoji: "⚡" },
  { name: "Outro", emoji: "🎶" },
  { name: "Riff", emoji: "🎸" }
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

  const getSections = (): Section[] => {
    try {
      return song.sectionsJson ? JSON.parse(song.sectionsJson) : [];
    } catch {
      return [];
    }
  };

  const updateSections = (sections: Section[]) => {
    onUpdateSong({
      sectionsJson: JSON.stringify(sections)
    });
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
    <div className="space-y-6 font-sans">
      {/* Upper action bar */}
      <div className="flex justify-between items-center bg-zinc-100 border-3 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
        <button
          onClick={onBack}
          className="px-3 py-1.5 border-2 border-black bg-white hover:bg-zinc-200 text-xs font-black uppercase tracking-wide cursor-pointer inline-flex items-center gap-1.5 transition-colors text-black"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Atrás</span>
        </button>

        <div className="flex items-center gap-3">
          {isSaving ? (
            <span className="text-[10px] sm:text-xs font-bold text-zinc-500 flex items-center gap-1.5 bg-zinc-50 border-2 border-dashed border-zinc-300 px-2.5 py-1">
              <Loader2 className="w-3 h-3 animate-spin text-black" />
              Guardando...
            </span>
          ) : (
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-green-700 bg-green-50 border-2 border-green-800 px-2 py-0.5 animate-pulse">
              ✓ Todo Guardado
            </span>
          )}
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1 px-2.5 border-2 border-black bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs uppercase cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>
      </div>

      {/* Song Header Meta Card */}
      <div className="bg-white border-4 border-black p-4 sm:p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black select-text">
        <div className="flex flex-col gap-1">
          <input
            type="text"
            value={song.title || ""}
            onChange={e => handleUpdateSongField({ title: e.target.value })}
            placeholder="Título de la Canción..."
            className="w-full text-lg sm:text-xl font-serif font-black border-none focus:outline-none placeholder:text-zinc-300 bg-transparent text-black"
          />
          <input
            type="text"
            value={song.artist || ""}
            onChange={e => handleUpdateSongField({ artist: e.target.value })}
            placeholder="Artista / Grupo..."
            className="w-full text-xs sm:text-sm font-black uppercase tracking-wider border-none focus:outline-none placeholder:text-zinc-300 bg-transparent text-zinc-500"
          />
        </div>

        <div className="h-0.5 bg-black" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Capo */}
          <div className="flex items-center justify-between border-2 border-black p-2 bg-zinc-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-xs font-black uppercase text-zinc-700">Capotraste:</span>
            <div className="flex items-center gap-1">
              <button
                disabled={(song.capo ?? 0) <= 0}
                onClick={() => handleUpdateSongField({ capo: Math.max(0, (song.capo ?? 0) - 1) })}
                className="w-8 h-8 flex items-center justify-center bg-white border border-black hover:bg-zinc-200 disabled:opacity-40 font-bold cursor-pointer text-black"
              >
                -
              </button>
              <span className="font-mono text-xs font-black text-black px-2.5 min-w-[4rem] text-center select-none">
                {(song.capo ?? 0) === 0 ? "Sin Capo" : `Traste ${song.capo}`}
              </span>
              <button
                disabled={(song.capo ?? 0) >= 12}
                onClick={() => handleUpdateSongField({ capo: Math.min(12, (song.capo ?? 0) + 1) })}
                className="w-8 h-8 flex items-center justify-center bg-white border border-black hover:bg-zinc-200 disabled:opacity-40 font-bold cursor-pointer text-black"
              >
                +
              </button>
            </div>
          </div>

          {/* Tuning */}
          <div className="flex items-center justify-between border-2 border-black p-2 bg-zinc-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-xs font-black uppercase text-zinc-700">Afinación:</span>
            <select
              value={song.tuning || "Estándar"}
              onChange={e => handleUpdateSongField({ tuning: e.target.value })}
              className="px-2.5 py-1.5 text-xs font-bold border border-black bg-white focus:outline-none cursor-pointer text-black"
            >
              {TUNINGS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sections rendering */}
      <div className="space-y-6">
        {currentSections.map((sec, idx) => (
          <div key={idx} className="space-y-2 animate-fade-in">
            <div className="flex justify-between items-center border-b-2 border-black pb-1 px-1">
              <h4 className="font-sans font-black text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-1 select-none">
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                {sec.name} - <span className="font-mono normal-case">({sec.type === "chords" ? "Acordes" : "Tablatura"})</span>
              </h4>

              {/* Section specific reorder / duplicate / delete actions */}
              <div className="flex items-center gap-1 select-none">
                <button
                  type="button"
                  title="Subir sección"
                  disabled={idx === 0}
                  onClick={() => handleMoveSectionUp(idx)}
                  className="p-1 border border-black hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent text-black rounded cursor-pointer transition-colors flex items-center"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Bajar sección"
                  disabled={idx === currentSections.length - 1}
                  onClick={() => handleMoveSectionDown(idx)}
                  className="p-1 border border-black hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent text-black rounded cursor-pointer transition-colors flex items-center"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Duplicar sección"
                  onClick={() => handleDuplicateSection(idx)}
                  className="p-1 border border-black hover:bg-zinc-200 text-black rounded cursor-pointer transition-colors flex items-center gap-0.5 text-[9px] font-black uppercase"
                >
                  <Copy className="w-3 h-3" />
                  <span className="hidden sm:inline">Duplicar</span>
                </button>
                <button
                  type="button"
                  title="Eliminar sección"
                  onClick={() => handleDeleteSection(idx)}
                  className="p-1 border border-black hover:bg-red-100 text-red-600 rounded cursor-pointer transition-colors flex items-center gap-0.5 text-[9px] font-black uppercase"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              </div>
            </div>

            {/* Embedded section editor depending on type */}
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
          </div>
        ))}

        {/* Big plus block for adding a new section */}
        <div
          onClick={() => {
            setAddSectionStep('name');
            setShowAddSectionModal(true);
          }}
          className="p-6 md:p-8 bg-zinc-50 hover:bg-zinc-100 border-4 border-dashed border-black rounded-lg text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] select-none group"
        >
          <Plus className="w-8 h-8 text-zinc-400 group-hover:text-black transition-colors stroke-[2.5]" />
          <h5 className="font-black text-xs uppercase tracking-widest text-zinc-500 group-hover:text-black">
            Añadir Sección de Canción
          </h5>
          <p className="text-[10px] text-zinc-400 font-bold">
            Crea bloques de acordes organizados o una partitura móvil interactiva de 6 cuerdas.
          </p>
        </div>
      </div>

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 z-50 select-none animate-fade-in">
          <div className="bg-white border-4 border-black w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative flex flex-col">
            <div className="bg-black text-white p-3.5 flex justify-between items-center font-bold font-sans">
              <span className="font-black text-xs uppercase tracking-widest text-white">
                Añadir nueva sección
              </span>
              <button
                onClick={() => setShowAddSectionModal(false)}
                className="text-white hover:text-yellow-300 font-bold hover:underline py-0.5 px-2 text-xs"
              >
                Cerrar
              </button>
            </div>

            <div className="p-5 space-y-4">
              {addSectionStep === 'name' ? (
                <div className="space-y-4 animate-fade-in">
                  <span className="text-xs font-black uppercase text-black block tracking-wider">
                    ¿Qué sección deseas añadir?
                  </span>
                  
                  {/* Presets Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {SECTION_PRESETS.map(preset => (
                      <button
                        key={preset.name}
                        onClick={() => handleSelectPresetName(preset.name)}
                        className="py-2 px-3 border-2 border-black bg-zinc-50 hover:bg-yellow-100 text-left font-bold text-xs uppercase cursor-pointer flex items-center gap-2 rounded transition-colors text-black"
                      >
                        <span className="text-base select-none">{preset.emoji}</span>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="h-px bg-zinc-200" />

                  {/* Custom Name input */}
                  <form onSubmit={handleCustomNameSubmit} className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-zinc-500">
                      O un nombre personalizado:
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customSectionName}
                        onChange={e => setCustomSectionName(e.target.value)}
                        placeholder="Ej: Coro Alternativo, Puente Trágico, Outro Arpegio..."
                        className="flex-1 px-3 py-1.5 text-xs font-bold border-2 border-black bg-white focus:outline-none text-black"
                      />
                      <button
                        type="submit"
                        disabled={!customSectionName.trim()}
                        className="px-4 py-1.5 bg-black text-white hover:bg-zinc-800 disabled:opacity-40 text-xs font-black uppercase tracking-wide cursor-pointer rounded"
                      >
                        OK
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Choose Section Type step */
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-black text-zinc-500 uppercase">
                    <button
                      onClick={() => setAddSectionStep('name')}
                      className="text-black underline cursor-pointer hover:no-underline"
                    >
                      ← Volver
                    </button>
                    <span>/</span>
                    <span className="text-black bg-zinc-100 border border-black px-1.5 rounded">
                      {customSectionName.trim() || selectedPresetName}
                    </span>
                  </div>

                  <span className="text-xs font-black uppercase text-black block tracking-wider">
                    ¿Qué tipo de contenido va a tener?
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Chords option */}
                    <div
                      onClick={() => handleAddSectionFinal('chords')}
                      className="bg-zinc-50 hover:bg-yellow-50 border-3 border-black p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-2 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                    >
                      <Music className="w-8 h-8 text-amber-500" />
                      <h4 className="font-serif font-black text-black text-sm">
                        Acordes
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-bold leading-normal">
                        Progresión con duraciones por pulsos.
                      </p>
                    </div>

                    {/* Tab option */}
                    <div
                      onClick={() => handleAddSectionFinal('tab')}
                      className="bg-zinc-50 hover:bg-emerald-50 border-3 border-black p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-2 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                    >
                      <Guitar className="w-8 h-8 text-emerald-500" />
                      <h4 className="font-serif font-black text-black text-sm">
                        Tablatura
                      </h4>
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
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-fade-in">
          <div className="bg-white border-4 border-black p-5 w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0 stroke-[2.5]" />
              <h3 className="font-serif text-lg font-black uppercase text-black">
                ¿Eliminar canción?
              </h3>
            </div>
            <p className="text-xs text-zinc-500 font-black leading-relaxed">
              Esta acción no se puede deshacer y borrará permanentemente la canción{" "}
              <strong>"{song.title || "Sin título"}"</strong> de tus acordes locales.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-1.5 border-2 border-black bg-white hover:bg-zinc-150 text-xs font-black uppercase cursor-pointer text-black"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteSong(song.id);
                  setShowDeleteConfirm(false);
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
};
