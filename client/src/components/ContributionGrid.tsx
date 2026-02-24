import React, { useMemo } from 'react';

const LEVEL_COLORS = [
  '#161b22',
  '#0e4429',
  '#006d32',
  '#26a641',
  '#39d353',
];

interface Props {
  seed: string;
  intensity: number;
}

export const ContributionGrid: React.FC<Props> = ({ seed, intensity }) => {
  const cells = useMemo(() => {
    const values: number[] = [];
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    for (let i = 0; i < 28; i += 1) {
      hash = (hash * 31 + i) >>> 0;
      const base = hash % 5;
      const level = Math.min(4, Math.floor((base + intensity / 2) % 5));
      values.push(level);
    }
    return values;
  }, [seed, intensity]);

  return (
    <div className="contrib-grid" aria-hidden="true">
      {cells.map((level, idx) => (
        <span
          key={idx}
          className="contrib-cell"
          style={{ backgroundColor: LEVEL_COLORS[level] }}
        />
      ))}
    </div>
  );
};

