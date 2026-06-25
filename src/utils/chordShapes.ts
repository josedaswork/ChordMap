export interface ChordShape {
  frets: (number | 'x')[]; // 6 elements: [E-low, A, D, G, B, e-high]
  fingers: number[];       // 6 elements: finger 0 (none), 1, 2, 3, 4
  baseFret: number;        // Starting fret (usually 1)
}

export const DEFAULT_CHORD_SHAPES: Record<string, ChordShape> = {
  // C family
  "C": { frets: ['x', 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 },
  "Cadd9": { frets: ['x', 3, 2, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4], baseFret: 1 },
  "Cmaj7": { frets: ['x', 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], baseFret: 1 },
  "Cm": { frets: ['x', 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3 },
  "C/E": { frets: [0, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 },
  
  // G family
  "G": { frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4], baseFret: 1 },
  "G6": { frets: [3, 2, 0, 0, 0, 0], fingers: [2, 1, 0, 0, 0, 0], baseFret: 1 },
  "Gmaj7": { frets: [3, 2, 0, 0, 0, 2], fingers: [2, 1, 0, 0, 0, 3], baseFret: 1 },
  "Gm": { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3 },
  "G/B": { frets: ['x', 2, 0, 0, 3, 3], fingers: [0, 1, 0, 0, 3, 4], baseFret: 1 },

  // D family
  "D": { frets: ['x', 'x', 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], baseFret: 1 },
  "Dsus4": { frets: ['x', 'x', 0, 2, 3, 3], fingers: [0, 0, 0, 1, 3, 4], baseFret: 1 },
  "Dsus2": { frets: ['x', 'x', 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0], baseFret: 1 },
  "Dm": { frets: ['x', 'x', 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], baseFret: 1 },
  "D7": { frets: ['x', 'x', 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], baseFret: 1 },
  "D/F#": { frets: [2, 'x', 0, 2, 3, 2], fingers: [1, 0, 0, 2, 4, 3], baseFret: 1 },

  // A family
  "A": { frets: ['x', 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 },
  "Asus4": { frets: ['x', 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 4, 0], baseFret: 1 },
  "Amaj7": { frets: ['x', 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0], baseFret: 1 },
  "Am": { frets: ['x', 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], baseFret: 1 },
  "Am7": { frets: ['x', 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], baseFret: 1 },

  // E family
  "E": { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], baseFret: 1 },
  "Esus4": { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0], baseFret: 1 },
  "E7": { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], baseFret: 1 },
  "Em": { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], baseFret: 1 },
  "Em7": { frets: [0, 2, 2, 0, 3, 0], fingers: [0, 2, 3, 0, 4, 0], baseFret: 1 },

  // F family
  "F": { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1 },
  "Fmaj7": { frets: ['x', 'x', 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0], baseFret: 1 },
  "Fadd9": { frets: ['x', 'x', 3, 2, 1, 3], fingers: [0, 0, 2, 1, 0, 4], baseFret: 1 },
  "Fm": { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1 },

  // B family
  "B": { frets: ['x', 2, 4, 4, 4, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2 },
  "Bm": { frets: ['x', 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2 },
  "Bm7": { frets: ['x', 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], baseFret: 2 },
  "B7": { frets: ['x', 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], baseFret: 1 }
};

export function getChordShape(chordName: string, customChords: Record<string, ChordShape> = {}): ChordShape {
  // Normalize key slightly
  const normalized = chordName.trim();
  
  if (customChords[normalized]) {
    return customChords[normalized];
  }
  
  if (DEFAULT_CHORD_SHAPES[normalized]) {
    return DEFAULT_CHORD_SHAPES[normalized];
  }
  
  // Generic guess / fallback
  return getFallbackChordShape(normalized);
}

function getFallbackChordShape(name: string): ChordShape {
  // Let's create an empty shape but guess basic shapes
  // if they match simple root notes
  const clean = name.replace(/[0-9m+-\/a-zA-Z#]/g, '');
  
  if (name.startsWith('C')) {
    return { frets: ['x', 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 };
  }
  if (name.startsWith('A')) {
    return { frets: ['x', 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 };
  }
  if (name.startsWith('G')) {
    return { frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4], baseFret: 1 };
  }
  if (name.startsWith('E')) {
    return { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], baseFret: 1 };
  }
  if (name.startsWith('D')) {
    return { frets: ['x', 'x', 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], baseFret: 1 };
  }
  if (name.startsWith('F')) {
    return { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1 };
  }
  if (name.startsWith('B')) {
    return { frets: ['x', 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2 };
  }

  // Pure fallback: Open strings
  return {
    frets: [0, 0, 0, 0, 0, 0],
    fingers: [0, 0, 0, 0, 0, 0],
    baseFret: 1
  };
}

// Extract all unique chords from a song
export function extractSongChords(sectionsJson: string): string[] {
  const unique = new Set<string>();
  try {
    const sections = sectionsJson ? JSON.parse(sectionsJson) : [];
    if (!Array.isArray(sections)) return [];
    
    sections.forEach((sec: any) => {
      if (sec.type === 'chords' && sec.content) {
        try {
          const lines = JSON.parse(sec.content);
          if (Array.isArray(lines)) {
            lines.forEach((line: any) => {
              if (line && Array.isArray(line.chords)) {
                line.chords.forEach((chord: any) => {
                  if (chord && typeof chord.name === 'string' && chord.name.trim()) {
                    unique.add(chord.name.trim());
                  }
                });
              }
            });
          }
        } catch {}
      } else if (sec.type === 'tab' && sec.content) {
        try {
          const tabData = JSON.parse(sec.content);
          if (tabData && Array.isArray(tabData.chords)) {
            tabData.chords.forEach((ch: any) => {
              if (typeof ch === 'string' && ch.trim()) {
                unique.add(ch.trim());
              }
            });
          }
        } catch {}
      }
    });
  } catch {}
  
  return Array.from(unique).sort();
}

// Load custom chords dictionary from a song's sectionsJson metadata
export function loadCustomChords(sectionsJson: string): Record<string, ChordShape> {
  try {
    const sections = sectionsJson ? JSON.parse(sectionsJson) : [];
    if (!Array.isArray(sections)) return {};
    const metadataSec = sections.find((s: any) => s.type === 'custom_chords');
    if (metadataSec && metadataSec.content) {
      return JSON.parse(metadataSec.content);
    }
  } catch (e) {
    console.error("Error loading custom chords", e);
  }
  return {};
}

// Save/Update custom chords dictionary inside a song's sectionsJson metadata
export function saveCustomChords(
  sectionsJson: string, 
  customChords: Record<string, ChordShape>
): string {
  try {
    const sections = sectionsJson ? JSON.parse(sectionsJson) : [];
    if (!Array.isArray(sections)) return sectionsJson;
    
    // Filter out previous custom_chords section if any
    const filtered = sections.filter((s: any) => s.type !== 'custom_chords');
    
    // Add new one
    filtered.push({
      name: "Custom Chords Metadata",
      type: "custom_chords" as any,
      content: JSON.stringify(customChords)
    });
    
    return JSON.stringify(filtered);
  } catch (e) {
    console.error("Error saving custom chords", e);
    return sectionsJson;
  }
}

