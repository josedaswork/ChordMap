export interface ParsedTabResult {
  tab: string[][]; // 6 strings x N columns
  chords: string[]; // N columns
  repeat: number;
  warnings: string[];
  error?: string;
}

/**
 * Parses a standard plain-text ASCII guitar tablature block.
 * Recognizes 6-string formats (high e to low E), extracts notes & techniques,
 * detects repeat markers (e.g., "x2"), and aligns chord symbols placed above the tab.
 */
export function parseTextTab(text: string): ParsedTabResult {
  const warnings: string[] = [];
  
  if (!text || !text.trim()) {
    return {
      tab: [],
      chords: [],
      repeat: 1,
      warnings: [],
      error: "El texto está vacío. Por favor, pega una tablatura válida."
    };
  }

  // Split into lines
  const lines = text.split(/\r?\n/);
  
  // Find lines that look like fretboard lines
  // A string line typically contains many dashes '-' and might have vertical pipes '|' or colons ':'
  interface TabLineInfo {
    originalIndex: number;
    text: string;
    dashCount: number;
    tuning?: string;
  }
  
  const lineInfos: TabLineInfo[] = lines.map((line, idx) => {
    const dashCount = (line.match(/-/g) || []).length;
    // Check if it starts with standard tuning markers (e.g. e|, B|, G:, etc.)
    const tuningMatch = line.trim().match(/^([eBgDAE]|[1-6])\s*[|:]/i);
    return {
      originalIndex: idx,
      text: line,
      dashCount,
      tuning: tuningMatch ? tuningMatch[1] : undefined
    };
  });

  // We are looking for a consecutive (or closely grouped) set of 6 lines that are the strings.
  // Let's search for the best candidate block of 6 lines.
  // We can scan and score blocks of 6 lines by their dash count.
  let bestStartIndex = -1;
  let bestScore = -1;
  
  for (let i = 0; i <= lineInfos.length - 6; i++) {
    const subset = lineInfos.slice(i, i + 6);
    // Score based on how many lines have a solid number of hyphens
    const score = subset.reduce((acc, info) => acc + (info.dashCount >= 5 ? info.dashCount : 0), 0);
    // Also reward if they have tuning labels or pipes
    const tuningCount = subset.filter(info => info.tuning !== undefined || info.text.includes('|')).length;
    const totalScore = score + (tuningCount * 10);
    
    if (totalScore > bestScore && subset.filter(info => info.dashCount >= 4).length >= 4) {
      bestScore = totalScore;
      bestStartIndex = i;
    }
  }

  if (bestStartIndex === -1) {
    return {
      tab: [],
      chords: [],
      repeat: 1,
      warnings,
      error: "No se pudieron identificar las 6 líneas de la tablatura. Asegúrate de que contengan guiones '-' para representar las cuerdas (mínimo 6 líneas)."
    };
  }

  const tabLines = lineInfos.slice(bestStartIndex, bestStartIndex + 6);
  
  // Warn if any string lines have very few hyphens
  tabLines.forEach((line, idx) => {
    if (line.dashCount < 5) {
      warnings.push(`La cuerda #${idx + 1} ("${line.text.slice(0, 15)}...") tiene muy pocos guiones (-). Podría no haberse detectado correctamente.`);
    }
  });

  // Try to find the first pipe '|' or colon ':' or start of hyphens in these lines to establish the start of the fretboard
  let firstPipeIdx = -1;
  for (const line of tabLines) {
    const pipeIdx = line.text.indexOf('|');
    const colonIdx = line.text.indexOf(':');
    const firstFretboardChar = pipeIdx !== -1 ? pipeIdx : (colonIdx !== -1 ? colonIdx : line.text.search(/-|[0-9]/));
    if (firstFretboardChar !== -1) {
      if (firstPipeIdx === -1 || firstFretboardChar < firstPipeIdx) {
        firstPipeIdx = firstFretboardChar;
      }
    }
  }
  if (firstPipeIdx === -1) firstPipeIdx = 0;

  // Extract raw fretboard content for each string
  // Also find where the fretboard ends (usually at the last pipe '|')
  const rawContents: string[] = [];
  tabLines.forEach((line) => {
    let content = line.text.slice(firstPipeIdx + 1);
    // Remove ending pipe and everything after it
    const lastPipe = content.lastIndexOf('|');
    if (lastPipe !== -1) {
      content = content.slice(0, lastPipe);
    } else {
      // If no ending pipe, just trim space
      content = content.trimEnd();
    }
    rawContents.push(content);
  });

  // Align contents to the same length (pad with '-')
  const maxLength = Math.max(...rawContents.map(c => c.length));
  if (maxLength === 0) {
    return {
      tab: [],
      chords: [],
      repeat: 1,
      warnings,
      error: "La tablatura parece estar vacía o no tiene contenido de trastes válido."
    };
  }
  
  const alignedStrings = rawContents.map(c => c.padEnd(maxLength, '-'));

  // Detect repeat marker (e.g. x2, x3, x4, *2, (x2))
  // Look in the original lines of the tab (especially the last one or around them)
  let repeat = 1;
  const repeatRegex = /\b(?:[xX×]|\*\s*)\s*(\d+)\b|\b(\d+)\s*[xX×]\b/;
  
  // Search the 6 lines and the line immediately below them for a repeat indicator
  const linesToSearch = [
    ...tabLines.map(l => l.text),
    lines[tabLines[5].originalIndex + 1] || ""
  ];
  
  for (const lText of linesToSearch) {
    const match = lText.match(repeatRegex);
    if (match) {
      const val = parseInt(match[1] || match[2], 10);
      if (val > 1 && val <= 16) {
        repeat = val;
        break;
      }
    }
  }

  // Parse Chords line
  // Check the line immediately above the first string line
  let chordsLineText = "";
  if (tabLines[0].originalIndex > 0) {
    chordsLineText = lines[tabLines[0].originalIndex - 1];
  }

  // Extract chords with their original string index positions
  interface RawChord {
    name: string;
    originalStartIdx: number;
  }
  
  const rawChords: RawChord[] = [];
  if (chordsLineText && chordsLineText.trim()) {
    // Find all non-space words that look like chord names
    const chordWordRegex = /[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|maj7|m7|7|6|9|11|13|5|sus2|sus4|add9|\/[A-G][#b]?)*/g;
    let match;
    while ((match = chordWordRegex.exec(chordsLineText)) !== null) {
      const word = match[0].trim();
      // Ensure it starts with an actual capital note letter
      if (word && /^[A-G]/.test(word)) {
        rawChords.push({
          name: word,
          originalStartIdx: match.index
        });
      }
    }
  }

  // Scan column by column to extract formatted tab columns for the editor
  const parsedTabColumns: string[][] = Array(6).fill(null).map(() => []);
  const parsedChords: string[] = [];
  
  for (let colIdx = 0; colIdx < maxLength; colIdx++) {
    // Extract character for each string at this exact column index
    for (let s = 0; s < 6; s++) {
      const char = alignedStrings[s][colIdx];
      if (char === '-' || char === ' ' || char === '|') {
        parsedTabColumns[s].push("-");
      } else {
        parsedTabColumns[s].push(char);
      }
    }
    
    // Find chord aligned with this beat/column
    const chord = findChordAtCol(colIdx, firstPipeIdx, rawChords);
    parsedChords.push(chord || "");
  }

  // Validation / check for weird columns
  // Standardise columns: limit count to multiple of 8 if possible, or just keep what we have
  // Let's ensure columns are at least 8 or 16
  const finalColCount = Math.max(8, parsedTabColumns[0].length);
  const paddedTab: string[][] = Array(6).fill(null).map((_, s) => {
    const arr = [...parsedTabColumns[s]];
    while (arr.length < finalColCount) {
      arr.push("-");
    }
    return arr;
  });
  
  const paddedChords = [...parsedChords];
  while (paddedChords.length < finalColCount) {
    paddedChords.push("");
  }

  return {
    tab: paddedTab,
    chords: paddedChords,
    repeat,
    warnings
  };
}

/**
 * Finds if there is a chord name aligned with a given fretboard column index.
 * Matches chords within a small horizontal tolerance (e.g., +/- 2 characters).
 */
function findChordAtCol(colIdx: number, firstPipeIdx: number, rawChords: { name: string; originalStartIdx: number }[]): string | undefined {
  // Map fretboard colIdx to the approximate character index in the original chords line
  const targetCharIdx = firstPipeIdx + 1 + colIdx;
  
  // Find a chord that starts very close to targetCharIdx
  // We use a tolerance of 2 characters to account for slight misalignment
  const match = rawChords.find(rc => Math.abs(rc.originalStartIdx - targetCharIdx) <= 2);
  return match?.name;
}
