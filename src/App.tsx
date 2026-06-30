import React from 'react';
import { Clock, Database } from 'lucide-react';
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
  const [currentTime, setCurrentTime] = React.useState("");

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

  // Sync clock
  React.useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
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
          scrollSpeed: s.scrollSpeed || 0
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
                updatedDate: Number(cSong.updatedDate) || Date.now()
              };
            }
          } else {
            mergedSongs.push({
              id: Number(cSong.updatedDate) || Date.now(),
              title: cSong.title || "",
              artist: cSong.artist || "",
              capo: 0,
              tuning: "Estándar",
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
          ? `¡Se han subido todos tus cambios locales a la nube con éxito! (Total: ${cloudSongs.length} canciones registradas).`
          : `¡Se han descargado todos los cambios del Excel/Nube con éxito! (Total: ${cloudSongs.length} canciones actualizadas o añadidas).`
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
    <div className="min-h-screen bg-zinc-100 flex flex-col justify-start items-center p-0 sm:p-6 font-sans text-black selection:bg-yellow-300 selection:text-black">
      <div className="w-full max-w-md bg-zinc-50 border-0 sm:border-4 border-black flex flex-col min-h-screen sm:min-h-[820px] sm:max-h-[90vh] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:rounded-[36px] overflow-hidden relative">
        {/* Navigation Bar */}
        <nav className="bg-black text-white px-4 py-3.5 flex justify-between items-center border-b-2 border-black select-none shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-300 text-black px-1.5 py-0.5 font-black text-[10px] border border-black uppercase leading-none">
              CMAP
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider uppercase leading-none text-white">
                CHORDMAP PRO <span className="text-yellow-300 text-[10px] font-black uppercase">PRO</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-yellow-300 bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3 shrink-0 text-yellow-300" />
            <span>UTC: {currentTime || "12:00"}</span>
          </div>
        </nav>

        {/* Main Workspace */}
        <main className="flex-grow overflow-y-auto px-4 py-4 min-h-0 bg-zinc-50">
          {selectedSong ? (
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
          ) : (
            <SongList
              songs={songs}
              syncStatus={syncStatus}
              syncMessage={syncMessage}
              onSelectSong={setSelectedSongId}
              onAddSong={handleAddSong}
              onOpenSyncSettings={() => setShowSyncModal(true)}
              onTriggerSync={handleTriggerSync}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t-2 border-black p-3 flex flex-col justify-center items-center text-center shrink-0 select-none">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black tracking-widest uppercase text-zinc-400">
              Persistencia Cloud - Excel Ledger v2.1
            </p>
            <p className="text-[10px] font-black uppercase text-black">
              © 2026 CHORDMAP ARCHITECTURE
            </p>
          </div>
          <div className="flex items-center gap-1 font-mono text-[8px] mt-1.5 bg-yellow-300 text-black border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <Database className="w-2.5 h-2.5 text-black" />
            <span className="font-black uppercase tracking-wider">
              Sync ledger: Activo
            </span>
          </div>
        </footer>
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
