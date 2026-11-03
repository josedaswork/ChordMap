export interface CustomTuning {
  id: string;
  name: string;
  strings: string[]; // 6 strings from low (6th) to high (1st), e.g. ["D", "A", "D", "G", "B", "E"]
}

export interface TuningInfo {
  name: string;
  labels: string[]; // 6 labels: 6th string to 1st string
  freqs: number[];  // 6 base frequencies in Hz
}

// Built-in presets with precise MIDI pitches (A4 = 440Hz, MIDI 69)
const BUILT_IN_TUNINGS: Record<string, { labels: string[]; midis: number[] }> = {
  "Estándar": {
    labels: ["E", "A", "D", "G", "B", "e"],
    midis: [40, 45, 50, 55, 59, 64], // E2, A2, D3, G3, B3, E4
  },
  "Drop D": {
    labels: ["D", "A", "D", "G", "B", "e"],
    midis: [38, 45, 50, 55, 59, 64], // D2, A2, D3, G3, B3, E4
  },
  "Eb Estándar": {
    labels: ["Eb", "Ab", "Db", "Gb", "Bb", "eb"],
    midis: [39, 44, 49, 54, 58, 63], // Eb2, Ab2, Db3, Gb3, Bb3, Eb4
  },
  "Medio tono abajo": {
    labels: ["Eb", "Ab", "Db", "Gb", "Bb", "eb"],
    midis: [39, 44, 49, 54, 58, 63],
  },
  "D Estándar": {
    labels: ["D", "G", "C", "F", "A", "d"],
    midis: [38, 43, 48, 53, 57, 62],
  },
  "Drop C": {
    labels: ["C", "G", "C", "F", "A", "d"],
    midis: [36, 43, 48, 53, 57, 62],
  },
  "Drop C#": {
    labels: ["C#", "G#", "C#", "F#", "A#", "d#"],
    midis: [37, 44, 49, 54, 58, 63],
  },
  "DADGAD": {
    labels: ["D", "A", "D", "G", "A", "d"],
    midis: [38, 45, 50, 55, 57, 62],
  },
  "Open G": {
    labels: ["D", "G", "D", "G", "B", "d"],
    midis: [38, 43, 50, 55, 59, 62],
  },
  "Open D": {
    labels: ["D", "A", "D", "F#", "A", "d"],
    midis: [38, 45, 50, 54, 57, 62],
  },
  "Open E": {
    labels: ["E", "B", "E", "G#", "B", "e"],
    midis: [40, 47, 52, 56, 59, 64],
  },
  "Open C": {
    labels: ["C", "G", "C", "G", "C", "e"],
    midis: [36, 43, 48, 55, 60, 64],
  },
  "Double Drop D": {
    labels: ["D", "A", "D", "G", "B", "d"],
    midis: [38, 45, 50, 55, 59, 62],
  }
};

export const BUILT_IN_TUNING_NAMES = Object.keys(BUILT_IN_TUNINGS);

export const CUSTOM_TUNINGS_STORAGE_KEY = "chordmap_custom_tunings";

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Map note name (e.g. "C", "C#", "Db", "D", etc.) to semitone offset from C (0)
const NOTE_SEMITONES: Record<string, number> = {
  "C": 0, "B#": 0,
  "C#": 1, "DB": 1,
  "D": 2,
  "D#": 3, "EB": 3,
  "E": 4, "FB": 4,
  "F": 5, "E#": 5,
  "F#": 6, "GB": 6,
  "G": 7,
  "G#": 8, "AB": 8,
  "A": 9,
  "A#": 10, "BB": 10,
  "B": 11, "CB": 11
};

// Default guitar octaves for strings 6 to 1 (E2=40, A2=45, D3=50, G3=55, B3=59, E4=64)
const DEFAULT_STRING_BASE_OCTAVES = [2, 2, 3, 3, 3, 4];

export function getCustomTunings(): CustomTuning[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TUNINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading custom tunings", e);
  }
  return [];
}

export function saveCustomTuning(tuning: CustomTuning): void {
  try {
    const current = getCustomTunings();
    const existingIdx = current.findIndex(t => t.id === tuning.id || t.name.toLowerCase() === tuning.name.toLowerCase());
    if (existingIdx >= 0) {
      current[existingIdx] = tuning;
    } else {
      current.push(tuning);
    }
    localStorage.setItem(CUSTOM_TUNINGS_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error("Error saving custom tuning", e);
  }
}

export function deleteCustomTuning(idOrName: string): void {
  try {
    const current = getCustomTunings();
    const filtered = current.filter(t => t.id !== idOrName && t.name !== idOrName);
    localStorage.setItem(CUSTOM_TUNINGS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Error deleting custom tuning", e);
  }
}

export function getAllAvailableTunings(): { name: string; isCustom: boolean }[] {
  const customs = getCustomTunings();
  const list = BUILT_IN_TUNING_NAMES.map(name => ({ name, isCustom: false }));
  customs.forEach(c => {
    if (!list.some(item => item.name.toLowerCase() === c.name.toLowerCase())) {
      list.push({ name: c.name, isCustom: true });
    }
  });
  return list;
}

/**
 * Returns labels and fundamental frequencies for the 6 strings of any tuning
 */
export function getTuningInfo(tuningName?: string): TuningInfo {
  const norm = (tuningName || "Estándar").trim();
  
  // 1. Check built-ins
  if (BUILT_IN_TUNINGS[norm]) {
    const t = BUILT_IN_TUNINGS[norm];
    return {
      name: norm,
      labels: t.labels,
      freqs: t.midis.map(m => midiToFreq(m))
    };
  }

  // 2. Check custom tunings
  const customs = getCustomTunings();
  const custom = customs.find(c => c.name.toLowerCase() === norm.toLowerCase());
  if (custom && Array.isArray(custom.strings) && custom.strings.length === 6) {
    const freqs = custom.strings.map((strNote, idx) => {
      const cleanNote = strNote.toUpperCase().replace(/\s+/g, '');
      const semitone = NOTE_SEMITONES[cleanNote] ?? (idx === 0 || idx === 5 ? 4 : idx === 1 ? 9 : idx === 2 ? 2 : idx === 3 ? 7 : 11);
      const defaultOctave = DEFAULT_STRING_BASE_OCTAVES[idx];
      // MIDI note formula: (octave + 1) * 12 + semitone
      const midi = (defaultOctave + 1) * 12 + semitone;
      return midiToFreq(midi);
    });

    return {
      name: custom.name,
      labels: custom.strings.map((s, idx) => idx === 5 ? s.toLowerCase() : s),
      freqs
    };
  }

  // Default fallback to Estándar
  const def = BUILT_IN_TUNINGS["Estándar"];
  return {
    name: "Estándar",
    labels: def.labels,
    freqs: def.midis.map(m => midiToFreq(m))
  };
}
