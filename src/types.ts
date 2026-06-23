export interface SongEntity {
  id: number;
  title: string;
  artist: string;
  capo: number;
  tuning: string;
  sectionsJson: string; // stringified list of Section
  updatedDate: number;
}

export interface Section {
  name: string;
  type: 'chords' | 'tab';
  content: string; // JSON holding ChordLine[] or TabData
}

export interface ChordItem {
  name: string;
  beats: number;
}

export interface ChordLine {
  chords: ChordItem[];
  repeat: number;
}

export interface TabData {
  tab: string[][]; // 6 strings (e, B, G, D, A, E) x N columns
  repeat: number;
  chords: string[]; // Chords belonging to each column
}
