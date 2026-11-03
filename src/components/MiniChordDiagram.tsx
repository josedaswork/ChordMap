import React from 'react';
import { ChordShape, getChordShape } from '../utils/chordShapes';

interface MiniChordDiagramProps {
  chordName: string;
  customChords?: Record<string, ChordShape>;
  allSongs?: any[];
  width?: number;
  height?: number;
}

export const MiniChordDiagram: React.FC<MiniChordDiagramProps> = ({
  chordName,
  customChords = {},
  allSongs = [],
  width = 34,
  height = 40,
}) => {
  const shape = React.useMemo(() => {
    return getChordShape(chordName, customChords, allSongs);
  }, [chordName, customChords, allSongs]);

  // Diagram coordinates
  const xStart = 5;
  const xSpacing = 4.8; // 5 intervals * 4.8 = 24px wide grid
  const yStart = 8;
  const ySpacing = 6;   // 4 frets * 6 = 24px tall grid

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 select-none pointer-events-none opacity-85 hover:opacity-100 transition-opacity"
      aria-hidden="true"
    >
      {/* Nut if baseFret === 1, or baseFret number text */}
      {shape.baseFret === 1 ? (
        <line
          x1={xStart - 0.5}
          y1={yStart}
          x2={xStart + 5 * xSpacing + 0.5}
          y2={yStart}
          className="stroke-zinc-900 dark:stroke-zinc-200"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      ) : (
        <text
          x={1}
          y={yStart + 4}
          className="font-mono text-[7px] font-black fill-amber-600 dark:fill-amber-400 select-none"
        >
          {shape.baseFret}
        </text>
      )}

      {/* 6 Vertical string lines */}
      {Array.from({ length: 6 }).map((_, idx) => (
        <line
          key={`str-${idx}`}
          x1={xStart + idx * xSpacing}
          y1={yStart}
          x2={xStart + idx * xSpacing}
          y2={yStart + 4 * ySpacing}
          className="stroke-zinc-400 dark:stroke-zinc-500"
          strokeWidth={idx === 0 ? 0.9 : idx === 5 ? 0.6 : 0.75}
        />
      ))}

      {/* 5 Horizontal fret lines */}
      {Array.from({ length: 5 }).map((_, idx) => (
        <line
          key={`fret-${idx}`}
          x1={xStart}
          y1={yStart + idx * ySpacing}
          x2={xStart + 5 * xSpacing}
          y2={yStart + idx * ySpacing}
          className="stroke-zinc-300 dark:stroke-zinc-600"
          strokeWidth={0.6}
        />
      ))}

      {/* Open (o) and Muted (x) markers at top */}
      {shape.frets.map((fret, stringIdx) => {
        const x = xStart + stringIdx * xSpacing;
        if (fret === 'x') {
          return (
            <g key={`top-${stringIdx}`} className="stroke-rose-500" strokeWidth={0.9}>
              <line x1={x - 1.2} y1={2.2} x2={x + 1.2} y2={4.6} />
              <line x1={x + 1.2} y1={2.2} x2={x - 1.2} y2={4.6} />
            </g>
          );
        } else if (fret === 0) {
          return (
            <circle
              key={`top-${stringIdx}`}
              cx={x}
              cy={3.4}
              r={1.2}
              fill="none"
              className="stroke-zinc-600 dark:stroke-zinc-400"
              strokeWidth={0.8}
            />
          );
        }
        return null;
      })}

      {/* Notes / Fingered Frets */}
      {shape.frets.map((fret, stringIdx) => {
        if (fret === 'x' || fret === 0) return null;
        const parsed = Number(fret);
        if (isNaN(parsed)) return null;

        const rel = parsed - shape.baseFret + 1;
        if (rel >= 1 && rel <= 4) {
          const cx = xStart + stringIdx * xSpacing;
          const cy = yStart + (rel - 0.5) * ySpacing;
          return (
            <circle
              key={`dot-${stringIdx}`}
              cx={cx}
              cy={cy}
              r={1.8}
              className="fill-amber-500 dark:fill-amber-400"
            />
          );
        }
        return null;
      })}
    </svg>
  );
};
