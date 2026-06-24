import React from 'react';
import { Music, CloudUpload, CloudDownload, Settings, Search, FileText, ChevronRight, Plus } from 'lucide-react';
import { Song } from '../types';

interface SongListProps {
  songs: Song[];
  syncStatus: string;
  syncMessage: string;
  onSelectSong: (id: number | null) => void;
  onAddSong: () => void;
  onOpenSyncSettings: () => void;
  onTriggerSync: (action: 'upload' | 'download') => void;
}

export const SongList: React.FC<SongListProps> = ({
  songs,
  syncStatus,
  syncMessage,
  onSelectSong,
  onAddSong,
  onOpenSyncSettings,
  onTriggerSync,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredSongs = songs.filter(song => {
    const query = searchQuery.toLowerCase();
    const title = (song.title || "").toLowerCase();
    const artist = (song.artist || "").toLowerCase();
    return title.includes(query) || artist.includes(query);
  });

  const getSectionCount = (sectionsJson: string) => {
    if (!sectionsJson || sectionsJson === "[]") return 0;
    try {
      const parsed = JSON.parse(sectionsJson);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title & Sync Options */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight uppercase flex items-center gap-1.5">
            <Music className="w-6 h-6 stroke-[2.5] text-black" />
            Mis Canciones
          </h2>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
            Editor interactivo de acordes y tablaturas
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            onClick={() => onTriggerSync("upload")}
            disabled={syncStatus === "loading"}
            title="Subir todos los cambios locales a la nube (Excel)"
            className="flex-1 sm:flex-initial p-2.5 border-3 border-black bg-white hover:bg-zinc-100 disabled:opacity-50 text-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1"
          >
            <CloudUpload className={`w-4 h-4 stroke-[2.5] text-blue-600 ${syncStatus === "loading" ? "animate-bounce" : ""}`} />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide">
              Subir Nube
            </span>
          </button>
          
          <button
            onClick={() => onTriggerSync("download")}
            disabled={syncStatus === "loading"}
            title="Bajar todas las canciones del Excel / Nube"
            className="flex-1 sm:flex-initial p-2.5 border-3 border-black bg-white hover:bg-zinc-100 disabled:opacity-50 text-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1"
          >
            <CloudDownload className={`w-4 h-4 stroke-[2.5] text-green-600 ${syncStatus === "loading" ? "animate-bounce" : ""}`} />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide">
              Bajar Nube
            </span>
          </button>

          <button
            onClick={onOpenSyncSettings}
            title="Configurar URL de Excel"
            className="p-2.5 border-3 border-black bg-yellow-300 hover:bg-yellow-400 text-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center"
          >
            <Settings className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Sync Message banner */}
      {syncStatus !== "idle" && (
        <div className={`p-3 border-2 border-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 ${syncStatus === "loading" ? "bg-zinc-100 text-zinc-850" : syncStatus === "success" ? "bg-green-100 text-green-800 border-green-800" : "bg-red-100 text-red-800 border-red-800"}`}>
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 border border-black ${syncStatus === "loading" ? "bg-zinc-500 animate-pulse" : syncStatus === "success" ? "bg-green-500" : "bg-red-500"}`} />
          <p className="flex-1">{syncMessage}</p>
        </div>
      )}

      {/* Search Input */}
      {(songs.length > 0 || searchQuery) && (
        <div className="relative border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center bg-white">
          <Search className="w-5 h-5 ml-3 absolute top-3 text-black stroke-[2.5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por título o artista..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-bold border-none focus:outline-none placeholder:text-zinc-400 bg-white text-black"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="px-3 text-xs font-black uppercase text-zinc-400 hover:text-black shrink-0 cursor-pointer"
            >
              Borrar
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {filteredSongs.length === 0 ? (
        <div className="border-4 border-dashed border-black bg-white p-8 md:p-12 text-center rounded-xl max-w-lg mx-auto space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Music className="w-12 h-12 mx-auto stroke-[1.8] text-zinc-400" />
          <div className="space-y-1">
            <h3 className="font-black text-black uppercase tracking-wide text-sm md:text-base">
              {searchQuery ? "Sin resultados para la búsqueda" : "Guarda tu primera canción"}
            </h3>
            <p className="text-xs text-zinc-500 font-bold leading-relaxed">
              {searchQuery
                ? "No se encontraron títulos o artistas con ese nombre. Intenta con palabras clave diferentes."
                : "Toca el botón 'Añadir Canción' para escribir acordes, versos, puentes y tablaturas móviles."}
            </p>
          </div>
          <div className="pt-2">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 bg-black hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-wide cursor-pointer text-white"
              >
                Limpiar búsqueda
              </button>
            ) : (
              <button
                onClick={onAddSong}
                className="px-4 py-2 bg-yellow-300 hover:bg-yellow-400 border-2 border-black text-black font-black text-xs uppercase tracking-wide cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                + Añadir Canción
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Song Cards List */
        <div className="space-y-3 pb-20">
          <div className="flex gap-4 text-[10px] sm:text-xs">
            <span className="font-black bg-black text-white px-2.5 py-1 border border-black uppercase tracking-wider">
              Total: {songs.length} {songs.length === 1 ? 'canción' : 'canciones'}
            </span>
            <span className="font-bold border-2 border-black bg-zinc-50 px-2 py-1 text-zinc-600 uppercase tracking-widest">
              Sincronizadas con Google Sheets
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {filteredSongs.map(song => {
              const secCount = getSectionCount(song.sectionsJson);
              return (
                <div
                  key={song.id}
                  onClick={() => onSelectSong(song.id)}
                  className="bg-white border-3 border-black p-4 flex justify-between items-center cursor-pointer hover:bg-zinc-50 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] group"
                >
                  <div className="space-y-2 flex-1 pr-4">
                    <div className="space-y-0.5">
                      <h4 className="font-serif text-sm sm:text-base font-black text-black leading-tight group-hover:underline">
                        {song.title || "Sin título"}
                      </h4>
                      {song.artist && (
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-wider">
                          Por: {song.artist}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(song.capo ?? 0) > 0 && (
                        <span className="bg-yellow-200 border-2 border-black font-mono text-[9px] font-black uppercase text-black px-1.5 py-0.5">
                          Capo {song.capo}
                        </span>
                      )}
                      {song.tuning && song.tuning !== "Estándar" && (
                        <span className="bg-zinc-150 border-2 border-black font-mono text-[9px] font-black uppercase text-zinc-700 px-1.5 py-0.5">
                          Afinación: {song.tuning}
                        </span>
                      )}
                      {secCount > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-zinc-100 border-2 border-black font-mono text-[9px] font-black uppercase text-zinc-600 px-1.5 py-0.5">
                          <FileText className="w-2.5 h-2.5 shrink-0" />
                          {secCount} {secCount === 1 ? "sección" : "secciones"}
                        </span>
                      ) : (
                        <span className="font-mono text-[9px] text-zinc-400 font-bold px-1 py-0.5">
                          Sin secciones
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-auto shrink-0 select-none">
                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-black transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Plus FAB */}
      <button
        onClick={onAddSong}
        title="Añadir nueva canción"
        className="fixed bottom-6 right-6 w-14 h-14 bg-black border-4 border-black text-white hover:bg-zinc-800 rounded-full flex items-center justify-center cursor-pointer shadow-[3px_3px_0px_0px_rgba(255,235,100,1)] transition-transform hover:scale-105 active:scale-95 z-40"
      >
        <Plus className="w-7 h-7 text-yellow-300 stroke-[3]" />
      </button>
    </div>
  );
};
