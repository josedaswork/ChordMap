export interface SongVersion {
  id: string;
  name: string; // e.g. "Original", "Capo 3", "Acordes Fáciles", "Afinación Eb"
  capo: number;
  tuning: string;
  sectionsJson: string; // Serialized Section[]
  isDefault?: boolean; // Whether this is the principal version
  lyrics?: string;
  notes?: string;
  mainChords?: string[]; // Main song chords palette (Acordes Principales)
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  capo: number;
  tuning: string;
  sectionsJson: string; // Serialized Section[]
  lyrics?: string;
  scrollSpeed?: number;
  updatedDate: number;
  versions?: SongVersion[];
  defaultVersionId?: string;
  mainChords?: string[]; // Main song chords palette
}

export interface Section {
  name: string;
  type: 'chords' | 'tab';
  content: string; // Serialized ChordLine[] or TabContent
}

export interface ChordLine {
  chords: ChordItem[];
  repeat: number;
}

export interface ChordItem {
  name: string;
  beats: number;
}

export interface TabContent {
  tab: string[][]; // 6 rows (strings) x N columns
  repeat: number;
  chords: string[]; // chord labels corresponding to each column
}
