import React from 'react';
import { 
  Music, CloudUpload, CloudDownload, Settings, Search, 
  FileText, ChevronRight, Plus, Sparkles, X, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
    <div className="space-y-4 font-sans text-zinc-900">
      
      {/* Top Banner Card with Sync Actions */}
      <div className="bg-zinc-50/90 border border-zinc-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-amber-400/20 text-amber-500 flex items-center justify-center">
                <Music className="w-4 h-4 stroke-[2.5]" />
              </span>
              Mis Canciones
            </h2>
            <p className="text-[11px] text-zinc-500 font-medium">
              Biblioteca musical y acordes
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-zinc-700 border border-zinc-200 shadow-2xs">
              {songs.length} {songs.length === 1 ? 'canción' : 'canciones'}
            </span>
          </div>
        </div>

        {/* Sync Buttons Row */}
        <div className="flex items-center gap-2 pt-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            onClick={() => onTriggerSync("upload")}
            disabled={syncStatus === "loading"}
            title="Subir todos los cambios locales a Google Sheets"
            className="flex-1 py-2 px-3 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
          >
            <CloudUpload className={`w-4 h-4 text-blue-500 ${syncStatus === "loading" ? "animate-bounce" : ""}`} />
            <span>Subir</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            onClick={() => onTriggerSync("download")}
            disabled={syncStatus === "loading"}
            title="Descargar canciones de Google Sheets"
            className="flex-1 py-2 px-3 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
          >
            <CloudDownload className={`w-4 h-4 text-emerald-500 ${syncStatus === "loading" ? "animate-bounce" : ""}`} />
            <span>Bajar</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.08, rotate: 30 }}
            whileTap={{ scale: 0.90 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            onClick={onOpenSyncSettings}
            title="Configurar Google Sheets"
            className="w-9 h-9 rounded-2xl bg-amber-400 hover:bg-amber-500 text-zinc-950 flex items-center justify-center cursor-pointer shadow-xs transition-colors shrink-0"
          >
            <Settings className="w-4 h-4 stroke-[2.2]" />
          </motion.button>
        </div>
      </div>

      {/* Sync Status Banner */}
      <AnimatePresence>
        {syncStatus !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border shadow-xs ${
              syncStatus === "loading" 
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/60" 
                : syncStatus === "success" 
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60" 
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800/60"
            }`}
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${
              syncStatus === "loading" ? "bg-amber-500 animate-pulse" : syncStatus === "success" ? "bg-emerald-500" : "bg-rose-500"
            }`} />
            <p className="flex-1 leading-snug">{syncMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.2] pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar por título o artista..."
          className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium rounded-full bg-white text-zinc-900 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 placeholder:text-zinc-400 shadow-xs transition-all"
        />
        {searchQuery && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>

      {/* Empty State or Song List */}
      {filteredSongs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-dashed border-zinc-300 p-8 text-center rounded-3xl space-y-4 shadow-xs"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-500 flex items-center justify-center mx-auto">
            <Music className="w-7 h-7 stroke-[2]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-zinc-900 text-sm sm:text-base">
              {searchQuery ? "Sin resultados" : "Tu repertorio está vacío"}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
              {searchQuery
                ? `No encontramos canciones con "${searchQuery}". Prueba con otras palabras clave.`
                : "Agrega tu primera canción para componer progresiones de acordes y tablaturas de 6 cuerdas."}
            </p>
          </div>
          <div className="pt-1">
            {searchQuery ? (
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 bg-zinc-800 text-zinc-100 font-bold text-xs rounded-full cursor-pointer hover:bg-zinc-700 transition-colors"
              >
                Limpiar búsqueda
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.94 }}
                onClick={onAddSong}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 font-extrabold text-xs rounded-full shadow-md shadow-amber-500/20 cursor-pointer"
              >
                + Añadir Primera Canción
              </motion.button>
            )}
          </div>
        </motion.div>
      ) : (
        /* Song Cards List with Staggered Motion */
        <div className="space-y-2.5 pb-20">
          <div className="flex items-center justify-between px-1 text-[11px] text-zinc-400 font-semibold select-none">
            <span>Repertorio ({filteredSongs.length})</span>
            <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
              <Sparkles className="w-3 h-3" />
              Sincronizado
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {filteredSongs.map((song, idx) => {
              const secCount = getSectionCount(song.sectionsJson);
              return (
                <motion.div
                  key={song.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3), type: "spring", stiffness: 400, damping: 28 }}
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectSong(song.id)}
                  className="bg-white border border-zinc-200/90 hover:border-amber-400/80 p-3.5 sm:p-4 rounded-3xl flex items-center justify-between cursor-pointer shadow-xs hover:shadow-sm transition-all group select-none"
                >
                  <div className="space-y-1.5 flex-1 pr-3">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-sm sm:text-base text-zinc-900 group-hover:text-amber-600 transition-colors leading-tight">
                        {song.title || "Sin título"}
                      </h4>
                      {song.artist && (
                        <p className="text-xs font-semibold text-zinc-500">
                          {song.artist}
                        </p>
                      )}
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(song.capo ?? 0) > 0 && (
                        <span className="bg-amber-50 text-amber-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                          Capo {song.capo}
                        </span>
                      )}
                      {song.tuning && song.tuning !== "Estándar" && (
                        <span className="bg-sky-50 text-sky-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-200">
                          {song.tuning}
                        </span>
                      )}
                      {secCount > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-200">
                          <Layers className="w-2.5 h-2.5 text-zinc-400" />
                          {secCount} {secCount === 1 ? "sección" : "secciones"}
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-zinc-400 font-medium px-1">
                          Sin secciones
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-zinc-100 group-hover:bg-amber-400 text-zinc-400 group-hover:text-zinc-950 flex items-center justify-center transition-colors shrink-0 shadow-2xs">
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Material 3 Expressive Floating Action Button (FAB) for Pixel 10 */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 450, damping: 20 }}
        onClick={onAddSong}
        title="Añadir nueva canción"
        className="fixed bottom-6 right-6 sm:absolute sm:bottom-6 sm:right-6 w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-500/30 cursor-pointer z-40 border border-amber-300/40"
      >
        <Plus className="w-7 h-7 stroke-[3]" />
      </motion.button>
    </div>
  );
};

