export interface Song {
  id: number;
  title: string;
  artist: string;
  capo: number;
  tuning: string;
  sectionsJson: string; // Serialized Section[]
  updatedDate: number;
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
