import React from 'react';
import { Database, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Song } from './types';
import { SongList } from './components/SongList';
import { SongEditor } from './components/SongEditor';
import { SyncSettingsModal } from './components/SyncSettingsModal';

const He = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to read ${key} from localStorage:`, e);
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Storage] Failed to write ${key} to localStorage:`, e);
    }
  }
};

export default function App() {
  const [songs, setSongs] = React.useState<Song[]>([]);
  const [selectedSongId, setSelectedSongId] = React.useState<number | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const [syncUrl, setSyncUrl] = React.useState("");
  const [showSyncModal, setShowSyncModal] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = React.useState("");

  // Load initial data
  React.useEffect(() => {
    const savedUrl = He.getItem("chordmap_sync_url") || He.getItem("uno_sync_url");
    if (savedUrl) {
      setSyncUrl(savedUrl);
    }

    const savedSongs = He.getItem("chordmap_songs") || He.getItem("uno_songs");
    if (savedSongs) {
      try {
        const parsed = JSON.parse(savedSongs);
        if (Array.isArray(parsed)) {
          setSongs(parsed);
        } else {
          setSongs([]);
        }
      } catch (err) {
        console.error("Error parsing saved songs", err);
        setSongs([]);
      }
    } else {
      // Default demo songs
      const defaultSongs: Song[] = [
        {
          id: 17189100,
          title: "Wish You Were Here",
          artist: "Pink Floyd",
          capo: 0,
          tuning: "Estándar",
          sectionsJson: JSON.stringify([
            {
              name: "Intro Riff",
              type: "tab",
              content: JSON.stringify({
                tab: [
                  ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
                  ["-", "-", "-", "3", "-", "-", "-", "3", "-", "-", "-", "3", "-", "-", "-", "-"],
                  ["-", "-", "0", "-", "0", "-", "-", "0", "-", "-", "-", "0", "-", "-", "-", "-"],
                  ["-", "2", "-", "-", "-", "2", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
                  ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
                  ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"]
                ],
                repeat: 2,
                chords: ["", "G", "", "", "", "C", "", "", "", "G", "", "", "", "C", "", ""]
              })
            },
            {
              name: "Coro",
              type: "chords",
              content: JSON.stringify([
                {
                  chords: [{ name: "C", beats: 4 }, { name: "D", beats: 4 }],
                  repeat: 1
                },
                {
                  chords: [{ name: "Am", beats: 4 }, { name: "G", beats: 4 }],
                  repeat: 1
                },
                {
                  chords: [{ name: "D", beats: 4 }, { name: "C", beats: 4 }],
                  repeat: 1
                },
                {
                  chords: [{ name: "Am", beats: 4 }, { name: "G", beats: 8 }],
                  repeat: 1
                }
              ])
            }
          ]),
          updatedDate: 17189100
        },
        {
          id: 17189200,
          title: "La Bamba",
          artist: "Ritchie Valens",
          capo: 2,
          tuning: "Estándar",
          sectionsJson: JSON.stringify([
            {
              name: "Puente Riff",
              type: "tab",
              content: JSON.stringify({
                tab: [
                  ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
                  ["-", "-", "-", "1", "3", "1", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"],
                  ["-", "-", "2", "-", "-", "-", "2", "0", "-", "-", "-", "0", "-", "-", "-", "-"],
                  ["-", "3", "-", "-", "-", "-", "-", "-", "2", "3", "2", "-", "-", "-", "-", "-"],
                  ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "3", "-", "-", "-", "-"],
                  ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"]
                ],
                repeat: 1,
                chords: ["", "", "C", "", "F", "", "", "G", "", "", "C", "", "F", "", "G", ""]
              })
            },
            {
              name: "Verso",
              type: "chords",
              content: JSON.stringify([
                {
                  chords: [{ name: "C", beats: 2 }, { name: "F", beats: 2 }, { name: "G", beats: 4 }],
                  repeat: 4
                }
              ])
            }
          ]),
          updatedDate: 17189200
        }
      ];
      setSongs(defaultSongs);
      He.setItem("chordmap_songs", JSON.stringify(defaultSongs));
    }
  }, []);

  // Cleanup autosave timeout
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSaveSyncUrl = (url: string) => {
    setSyncUrl(url);
    He.setItem("chordmap_sync_url", url);
    setSyncStatus("success");
    setSyncMessage("¡Configuración guardada de manera segura!");
  };

  const handleAddSong = () => {
    const now = Date.now();
    const newSong: Song = {
      id: now,
      title: "",
      artist: "",
      capo: 0,
      tuning: "Estándar",
      sectionsJson: JSON.stringify([]),
      updatedDate: now
    };
    const updatedSongs = [newSong, ...songs];
    setSongs(updatedSongs);
    He.setItem("chordmap_songs", JSON.stringify(updatedSongs));
    setSelectedSongId(now);
  };

  const handleUpdateSong = (updatedFields: Partial<Song>) => {
    if (selectedSongId === null) return;
    setIsSaving(true);
    const updatedSongs = songs.map(song => 
      song.id === selectedSongId 
        ? { ...song, ...updatedFields, updatedDate: Date.now() } 
        : song
    );
    setSongs(updatedSongs);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      He.setItem("chordmap_songs", JSON.stringify(updatedSongs));
      setIsSaving(false);
    }, 800);
  };

  const handleDeleteSong = (id: number) => {
    const filteredSongs = songs.filter(song => song.id !== id);
    setSongs(filteredSongs);
    He.setItem("chordmap_songs", JSON.stringify(filteredSongs));
    setSelectedSongId(null);
  };

  const handleTriggerSync = async (action: 'upload' | 'download') => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      He.setItem("chordmap_songs", JSON.stringify(songs));
      setIsSaving(false);
    }

    if (!syncUrl) {
      setSyncStatus("error");
      setSyncMessage('La URL de sincronización no está configurada. Haz clic en "Cloud Setup" para vincular.');
      return;
    }
    setSyncStatus("loading");
    setSyncMessage(action === 'upload' 
      ? "Subiendo todos los cambios locales a la nube de Google Sheets..." 
      : "Descargando todos los cambios de la nube a tu dispositivo..."
    );

    try {
      const payload = {
        action,
        songs: action === 'upload' ? songs.map(s => ({
          title: s.title,
          artist: s.artist,
          sectionsJson: s.sectionsJson,
          updatedDate: s.updatedDate,
          lyrics: s.lyrics || "",
          scrollSpeed: s.scrollSpeed || 0,
          capo: s.capo || 0,
          tuning: s.tuning || "Estándar"
        })) : []
      };

      const response = await fetch(syncUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const resData = await response.json();
      if (resData.status === "success" && Array.isArray(resData.songs)) {
        const cloudSongs = resData.songs;
        const mergedSongs = [...songs];

        cloudSongs.forEach((cSong: any) => {
          if (!cSong) return;
          const cTitle = (cSong.title || "").toString().trim().toLowerCase();
          const cArtist = (cSong.artist || "").toString().trim().toLowerCase();
          
          const matchIndex = mergedSongs.findIndex(s => {
            const sTitle = (s.title || "").toString().trim().toLowerCase();
            const sArtist = (s.artist || "").toString().trim().toLowerCase();
            return sTitle === cTitle && sArtist === cArtist;
          });

          if (matchIndex !== -1) {
            if (action === 'download' || Number(cSong.updatedDate) > Number(mergedSongs[matchIndex].updatedDate)) {
              mergedSongs[matchIndex] = {
                ...mergedSongs[matchIndex],
                sectionsJson: cSong.sectionsJson || "[]",
                lyrics: cSong.lyrics || "",
                scrollSpeed: cSong.scrollSpeed !== undefined ? Number(cSong.scrollSpeed) : 0,
                capo: (cSong.capo !== undefined && cSong.capo !== null && cSong.capo !== "")
                  ? Number(cSong.capo)
                  : (mergedSongs[matchIndex].capo ?? 0),
                tuning: (cSong.tuning && cSong.tuning !== "") 
                  ? cSong.tuning 
                  : (mergedSongs[matchIndex].tuning || "Estándar"),
                updatedDate: Number(cSong.updatedDate) || Date.now()
              };
            }
          } else {
            mergedSongs.push({
              id: Number(cSong.updatedDate) || Date.now(),
              title: cSong.title || "",
              artist: cSong.artist || "",
              capo: (cSong.capo !== undefined && cSong.capo !== null && cSong.capo !== "") ? Number(cSong.capo) : 0,
              tuning: cSong.tuning || "Estándar",
              sectionsJson: cSong.sectionsJson || "[]",
              lyrics: cSong.lyrics || "",
              scrollSpeed: cSong.scrollSpeed !== undefined ? Number(cSong.scrollSpeed) : 0,
              updatedDate: Number(cSong.updatedDate) || Date.now()
            });
          }
        });

        setSongs(mergedSongs);
        He.setItem("chordmap_songs", JSON.stringify(mergedSongs));
        setSyncStatus("success");
        setSyncMessage(action === 'upload'
          ? `¡Se han subido tus cambios a la nube! (${cloudSongs.length} canciones registradas)`
          : `¡Canciones descargadas con éxito! (${cloudSongs.length} sincronizadas)`
        );
      } else {
        throw new Error(resData.message || "Respuesta inesperada de Google Sheets.");
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus("error");
      setSyncMessage(`Fallo al sincronizar: ${err.message || "Error de conexión a internet."}`);
    }
  };

  const selectedSong = songs.find(s => s.id === selectedSongId);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-start p-0 sm:py-6 sm:px-4 font-sans text-zinc-900 selection:bg-amber-400 selection:text-zinc-950">
      
      {/* Main Responsive Clean White Container */}
      <div className="w-full max-w-4xl bg-white min-h-screen sm:min-h-[860px] sm:rounded-3xl border-x sm:border border-zinc-200 shadow-sm flex flex-col overflow-hidden relative">
        
        {/* Clean Light Header */}
        <header className="bg-white text-zinc-900 px-4 sm:px-6 py-3.5 flex justify-between items-center border-b border-zinc-200 select-none shrink-0 shadow-xs z-20">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="w-9 h-9 rounded-2xl bg-amber-400 text-zinc-950 flex items-center justify-center shadow-xs font-black text-sm"
            >
              C
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-zinc-900">
                  Chordmap Pro
                </h1>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium">Acordes & Tablaturas</p>
            </div>
          </div>

          {/* Quick Cloud Status Indicator */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setShowSyncModal(true)}
              className="flex items-center gap-1.5 font-sans text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 px-3 py-1.5 rounded-full cursor-pointer transition-colors shadow-2xs"
            >
              <div className={`w-2 h-2 rounded-full ${
                syncStatus === 'loading' ? 'bg-amber-400 animate-pulse' :
                syncStatus === 'success' ? 'bg-emerald-500' :
                syncStatus === 'error' ? 'bg-rose-500' : 'bg-zinc-400'
              }`} />
              <span>
                {syncUrl ? "Nube Activa" : "Configurar Nube"}
              </span>
            </motion.button>
          </div>
        </header>

        {/* Main Workspace with Fluid Motion Transition */}
        <main className="flex-grow overflow-y-auto min-h-0 bg-white relative">
          <AnimatePresence mode="wait">
            {selectedSong ? (
              <motion.div
                key="editor"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="p-3 sm:p-5 pb-12"
              >
                <SongEditor
                  song={selectedSong}
                  isSaving={isSaving}
                  onUpdateSong={handleUpdateSong}
                  onDeleteSong={handleDeleteSong}
                  onBack={() => {
                    if (selectedSong.title.trim() === "") {
                      handleDeleteSong(selectedSong.id);
                    } else {
                      setSelectedSongId(null);
                    }
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="p-3 sm:p-5 pb-12"
              >
                <SongList
                  songs={songs}
                  syncStatus={syncStatus}
                  syncMessage={syncMessage}
                  onSelectSong={setSelectedSongId}
                  onAddSong={handleAddSong}
                  onOpenSyncSettings={() => setShowSyncModal(true)}
                  onTriggerSync={handleTriggerSync}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Cloud Excel Sync Settings Modal */}
      {showSyncModal && (
        <SyncSettingsModal
          webAppUrl={syncUrl}
          onSave={handleSaveSyncUrl}
          onClose={() => setShowSyncModal(false)}
        />
      )}
    </div>
  );
}

