import { useState, useEffect, useRef } from 'react';
import { SongEntity } from './types';
import SongList from './components/SongList';
import SongEditor from './components/SongEditor';
import SyncSettingsModal from './components/SyncSettingsModal';
import { 
  Clock, 
  Layers, 
  FileSpreadsheet
} from 'lucide-react';

const safeStorage = {
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
  const [songs, setSongs] = useState<SongEntity[]>([]);
  const [activeSongId, setActiveSongId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<any>(null);

  const [webAppUrl, setWebAppUrl] = useState('');
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  const [currentTime, setCurrentTime] = useState('');

  // Seed initial data
  useEffect(() => {
    // Load synchronization URL
    const savedUrl = safeStorage.getItem('chordmap_sync_url') || safeStorage.getItem('uno_sync_url');
    if (savedUrl) {
      setWebAppUrl(savedUrl);
    }

    // Load songs
    const savedSongs = safeStorage.getItem('chordmap_songs') || safeStorage.getItem('uno_songs');
    if (savedSongs) {
      try {
        const parsed = JSON.parse(savedSongs);
        if (Array.isArray(parsed)) {
          setSongs(parsed);
        } else {
          setSongs([]);
        }
      } catch (err) {
        console.error('Error parsing saved songs', err);
        setSongs([]);
      }
    } else {
      // 2 outstanding Seed songs for a beautiful initial experience
      const seedSongs: SongEntity[] = [
        {
          id: 1718910000000,
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
                  chords: [
                    { name: "C", beats: 4 },
                    { name: "D", beats: 4 }
                  ],
                  repeat: 1
                },
                {
                  chords: [
                    { name: "Am", beats: 4 },
                    { name: "G", beats: 4 }
                  ],
                  repeat: 1
                },
                {
                  chords: [
                    { name: "D", beats: 4 },
                    { name: "C", beats: 4 }
                  ],
                  repeat: 1
                },
                {
                  chords: [
                    { name: "Am", beats: 4 },
                    { name: "G", beats: 8 }
                  ],
                  repeat: 1
                }
              ])
            }
          ]),
          updatedDate: 1718910000000
        },
        {
          id: 1718920000000,
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
                  chords: [
                    { name: "C", beats: 2 },
                    { name: "F", beats: 2 },
                    { name: "G", beats: 4 }
                  ],
                  repeat: 4
                }
              ])
            }
          ]),
          updatedDate: 1718920000000
        }
      ];
      setSongs(seedSongs);
      safeStorage.setItem('chordmap_songs', JSON.stringify(seedSongs));
    }
  }, []);

  // Update real-time system clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const inv = setInterval(update, 1000);
    return () => clearInterval(inv);
  }, []);

  // Clean timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Save synchronization URL
  const handleSaveSyncUrl = (url: string) => {
    setWebAppUrl(url);
    safeStorage.setItem('chordmap_sync_url', url);
    setSyncStatus('success');
    setSyncMessage('¡Configuración guardada de manera segura!');
  };

  // Add new blank song
  const handleAddSong = () => {
    const id = Date.now();
    const newSong: SongEntity = {
      id,
      title: "",
      artist: "",
      capo: 0,
      tuning: "Estándar",
      sectionsJson: JSON.stringify([]),
      updatedDate: id
    };

    const nextSongs = [newSong, ...songs];
    setSongs(nextSongs);
    safeStorage.setItem('chordmap_songs', JSON.stringify(nextSongs));
    setActiveSongId(id);
  };

  // Update fields on currently editing song with Debounced autosave
  const handleUpdateSong = (updates: Partial<SongEntity>) => {
    if (activeSongId === null) return;
    setIsSaving(true);

    const nextSongs = songs.map(s => {
      if (s.id === activeSongId) {
        return {
          ...s,
          ...updates,
          updatedDate: Date.now()
        };
      }
      return s;
    });

    setSongs(nextSongs);

    // Cancel existing timers and reset debouncer
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      safeStorage.setItem('chordmap_songs', JSON.stringify(nextSongs));
      setIsSaving(false);
    }, 800);
  };

  // Delete song
  const handleDeleteSong = (id: number) => {
    const nextSongs = songs.filter(s => s.id !== id);
    setSongs(nextSongs);
    safeStorage.setItem('chordmap_songs', JSON.stringify(nextSongs));
    setActiveSongId(null);
  };

  // Sincronización con Google Sheets (Apps Script) - Subir o Bajar
  const handleTriggerSync = async (mode: 'upload' | 'download') => {
    if (!webAppUrl) {
      setSyncStatus('error');
      setSyncMessage('La URL de sincronización no está configurada. Haz clic en "Cloud Setup" para vincular.');
      return;
    }

    setSyncStatus('loading');
    if (mode === 'upload') {
      setSyncMessage('Subiendo todos los cambios locales a la nube de Google Sheets...');
    } else {
      setSyncMessage('Descargando todos los cambios de la nube a tu dispositivo...');
    }

    try {
      // Build transmission songs payload
      const syncPayload = {
        action: mode,
        songs: mode === 'upload'
          ? songs.map(s => ({
              title: s.title,
              artist: s.artist,
              sectionsJson: s.sectionsJson,
              updatedDate: s.updatedDate
            }))
          : [] // On download, we don't write anything on the sheet, we just fetch
      };

      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // avoid cors preflight triggers inside generic gas environments
        },
        body: JSON.stringify(syncPayload)
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const resData = await response.json();

      if (resData.status === "success" && Array.isArray(resData.songs)) {
        const incomingSongs: any[] = resData.songs;
        const localSongsCopy = [...songs];

        incomingSongs.forEach(incoming => {
          if (!incoming) return;
          const incTitle = (incoming.title || '').toString().trim().toLowerCase();
          const incArtist = (incoming.artist || '').toString().trim().toLowerCase();

          // Find identical track locally by title and artist match
          const localMatchIdx = localSongsCopy.findIndex(l => {
            const lTitle = (l.title || '').toString().trim().toLowerCase();
            const lArtist = (l.artist || '').toString().trim().toLowerCase();
            return lTitle === incTitle && lArtist === incArtist;
          });

          if (localMatchIdx !== -1) {
            // If download mode, we overwrite local changes with the sheet version!
            // If upload mode, we only update local song if the sheet has a newer version.
            const shouldOverwrite = mode === 'download' || Number(incoming.updatedDate) > Number(localSongsCopy[localMatchIdx].updatedDate);
            
            if (shouldOverwrite) {
              localSongsCopy[localMatchIdx] = {
                ...localSongsCopy[localMatchIdx],
                sectionsJson: incoming.sectionsJson || '[]',
                updatedDate: Number(incoming.updatedDate) || Date.now()
              };
            }
          } else {
            // Register as brand-new track
            localSongsCopy.push({
              id: Number(incoming.updatedDate) || Date.now(),
              title: incoming.title || '',
              artist: incoming.artist || '',
              capo: 0,
              tuning: "Estándar",
              sectionsJson: incoming.sectionsJson || '[]',
              updatedDate: Number(incoming.updatedDate) || Date.now()
            });
          }
        });

        setSongs(localSongsCopy);
        safeStorage.setItem('chordmap_songs', JSON.stringify(localSongsCopy));

        setSyncStatus('success');
        if (mode === 'upload') {
          setSyncMessage(`¡Se han subido todos tus cambios locales a la nube con éxito! (Total: ${incomingSongs.length} canciones registradas).`);
        } else {
          setSyncMessage(`¡Se han descargado todos los cambios del Excel/Nube con éxito! (Total: ${incomingSongs.length} canciones actualizadas o añadidas).`);
        }
      } else {
        throw new Error(resData.message || 'Respuesta inesperada de Google Sheets.');
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setSyncMessage(`Fallo al sincronizar: ${err.message || 'Error de conexión a internet.'}`);
    }
  };

  const currentSong = songs.find(s => s.id === activeSongId);

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col justify-start items-center p-0 sm:p-6 font-sans text-black selection:bg-yellow-300 selection:text-black">
      
      {/* Unified Mobile App View Container */}
      <div className="w-full max-w-md bg-zinc-50 border-0 sm:border-4 border-black flex flex-col min-h-screen sm:min-h-[820px] sm:max-h-[90vh] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:rounded-[36px] overflow-hidden relative">
        
        {/* Mobile Header Bar */}
        <nav className="bg-black text-white px-4 py-3.5 flex justify-between items-center border-b-2 border-black select-none shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-300 text-black px-1.5 py-0.5 font-black text-[10px] border border-black uppercase leading-none">
              CMAP
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider uppercase leading-none">
                CHORDMAP PRO <span className="text-yellow-300 text-[10px] font-black uppercase">PRO</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[9px] text-yellow-300 bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3 shrink-0 text-yellow-300" />
            <span>UTC: {currentTime || '12:00'}</span>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-grow overflow-y-auto px-4 py-4 min-h-0">
          {currentSong ? (
            <SongEditor
              song={currentSong}
              isSaving={isSaving}
              onUpdateSong={handleUpdateSong}
              onDeleteSong={handleDeleteSong}
              onBack={() => {
                if (currentSong.title.trim() === '') {
                  handleDeleteSong(currentSong.id);
                } else {
                  setActiveSongId(null);
                }
              }}
            />
          ) : (
            <SongList
              songs={songs}
              syncStatus={syncStatus}
              syncMessage={syncMessage}
              onSelectSong={setActiveSongId}
              onAddSong={handleAddSong}
              onOpenSyncSettings={() => setShowSyncSettings(true)}
              onTriggerSync={handleTriggerSync}
            />
          )}
        </main>

        {/* Compact Brutalist Mobile Footer */}
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
            <FileSpreadsheet className="w-2.5 h-2.5 text-black" />
            <span className="font-black uppercase tracking-wider">Sync ledger: Activo</span>
          </div>
        </footer>

      </div>

      {/* Synchronization Settings Modal Pop-up sheet */}
      {showSyncSettings && (
        <SyncSettingsModal
          webAppUrl={webAppUrl}
          onSave={handleSaveSyncUrl}
          onClose={() => setShowSyncSettings(false)}
        />
      )}

    </div>
  );
}
