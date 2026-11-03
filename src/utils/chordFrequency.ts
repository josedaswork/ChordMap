import { Song } from '../types';

export interface ChordFrequency {
  name: string;
  count: number;
}

/**
 * Extracts and counts occurrences of all chords across all songs in the library.
 * Returns chords sorted by descending frequency.
 */
export function getCommonChords(songs: Song[]): ChordFrequency[] {
  if (!Array.isArray(songs) || songs.length === 0) return [];

  const counts: Record<string, number> = {};

  songs.forEach(song => {
    if (!song.sectionsJson) return;
    try {
      const sections = JSON.parse(song.sectionsJson);
      if (!Array.isArray(sections)) return;

      sections.forEach((sec: any) => {
        if (!sec || !sec.content) return;

        if (sec.type === 'chords') {
          try {
            const lines = JSON.parse(sec.content);
            if (Array.isArray(lines)) {
              lines.forEach((line: any) => {
                if (line && Array.isArray(line.chords)) {
                  line.chords.forEach((chord: any) => {
                    const name = typeof chord?.name === 'string' ? chord.name.trim() : '';
                    if (name) {
                      counts[name] = (counts[name] || 0) + 1;
                    }
                  });
                }
              });
            }
          } catch {}
        } else if (sec.type === 'tab') {
          try {
            const tabData = JSON.parse(sec.content);
            if (tabData && Array.isArray(tabData.chords)) {
              tabData.chords.forEach((chordName: any) => {
                const name = typeof chordName === 'string' ? chordName.trim() : '';
                if (name) {
                  counts[name] = (counts[name] || 0) + 1;
                }
              });
            }
          } catch {}
        }
      });
    } catch {}
  });

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
