import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Music, Layers, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { Section } from '../types';

interface NewSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSong: (params: {
    title: string;
    artist: string;
    useTemplate: boolean;
  }) => void;
}

export const NewSongModal: React.FC<NewSongModalProps> = ({
  isOpen,
  onClose,
  onCreateSong,
}) => {
  const [title, setTitle] = React.useState('');
  const [artist, setArtist] = React.useState('');
  const [useTemplate, setUseTemplate] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTitle('');
      setArtist('');
      setUseTemplate(true);
      // Focus title input on open
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onCreateSong({
      title: title.trim(),
      artist: artist.trim(),
      useTemplate,
    });
  };

  const templateSections = ['Verso', 'Pre-coro', 'Coro', 'Puente'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-zinc-950 flex items-center justify-center shadow-2xs font-black">
                <Music className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-extrabold text-zinc-900 text-base leading-tight">
                  Nueva Canción
                </h3>
                <p className="text-[11px] text-zinc-500 font-medium">
                  Configura el inicio de tu canción
                </p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            {/* Song Metadata Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Título de la canción
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ej. De Música Ligera, Wonderwall..."
                  className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-2xl bg-zinc-50 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 placeholder:text-zinc-400 transition-all text-zinc-900 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Artista / Banda <span className="font-normal text-zinc-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="ej. Soda Stereo, Oasis..."
                  className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-2xl bg-zinc-50 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 placeholder:text-zinc-400 transition-all text-zinc-900 shadow-2xs"
                />
              </div>
            </div>

            {/* Template Selection Question */}
            <div className="pt-2">
              <label className="block text-xs font-extrabold text-zinc-800 mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                ¿Cómo deseas estructurar la canción?
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Option 1: Plantilla de acordes (Recomendada) */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setUseTemplate(true)}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all relative ${
                    useTemplate
                      ? 'border-amber-400 bg-amber-50/70 shadow-xs'
                      : 'border-zinc-200 hover:border-zinc-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                        useTemplate
                          ? 'bg-amber-400 text-zinc-950'
                          : 'border-2 border-zinc-300'
                      }`}
                    >
                      {useTemplate && <CheckCircle2 className="w-4 h-4 fill-zinc-950 text-amber-400" />}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-zinc-900">
                          Plantilla de acordes completa
                        </span>
                        <span className="bg-amber-400/20 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                          Recomendado
                        </span>
                      </div>

                      <p className="text-xs text-zinc-600 leading-relaxed">
                        Añade de inmediato las 4 secciones estándar con cuadrícula de acordes lista para rellenar:
                      </p>

                      {/* Badges of template sections */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {templateSections.map((sec) => (
                          <span
                            key={sec}
                            className="bg-white border border-amber-300 text-zinc-800 font-bold text-[11px] px-2.5 py-0.5 rounded-lg shadow-2xs flex items-center gap-1"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                            {sec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Option 2: En blanco */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setUseTemplate(false)}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all relative ${
                    !useTemplate
                      ? 'border-amber-400 bg-amber-50/70 shadow-xs'
                      : 'border-zinc-200 hover:border-zinc-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                        !useTemplate
                          ? 'bg-amber-400 text-zinc-950'
                          : 'border-2 border-zinc-300'
                      }`}
                    >
                      {!useTemplate && <CheckCircle2 className="w-4 h-4 fill-zinc-950 text-amber-400" />}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <span className="font-extrabold text-sm text-zinc-900">
                        Canción en blanco
                      </span>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Empieza desde cero sin secciones creadas. Podrás añadir secciones personalizadas de acordes o tablaturas de 6 cuerdas a tu ritmo.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                Cancelar
              </motion.button>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.94 }}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-black text-xs shadow-md shadow-amber-400/20 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Music className="w-3.5 h-3.5" />
                <span>Crear Canción</span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
