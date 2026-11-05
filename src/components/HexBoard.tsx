import React, { useState } from 'react';
import {
  getHexCenter,
  getRoundedHexPath,
  GRID_COLS,
  GRID_ROWS,
} from '../game/hexMath';
import { CellOwner, HexCell, TeamConfig, VisualThemeId } from '../types/game';

interface HexBoardProps {
  cells: HexCell[];
  selectedCellId: number | null;
  winningPath: number[];
  team1: TeamConfig;
  team2: TeamConfig;
  theme: VisualThemeId;
  fontFamily: string;
  showLettersOnOwnedCells: boolean;
  isDisplayOnly: boolean;
  correctionMode: boolean;
  onSelectCell: (cellId: number) => void;
  onCorrectCellOwner: (cellId: number, newOwner: CellOwner) => void;
}

export const HexBoard: React.FC<HexBoardProps> = ({
  cells,
  selectedCellId,
  winningPath,
  team1,
  team2,
  theme,
  fontFamily,
  showLettersOnOwnedCells,
  isDisplayOnly,
  correctionMode,
  onSelectCell,
  onCorrectCellOwner,
}) => {
  const [recentlyClaimedId, setRecentlyClaimedId] = useState<number | null>(null);

  // SVG coordinate system: 1000 x 880 viewBox to fill the 16:9 board arena cleanly
  const VIEW_W = 1000;
  const VIEW_H = 880;
  const CENTER_X = VIEW_W / 2;
  const CENTER_Y = VIEW_H / 2;

  // Hexagon geometry
  const HEX_RADIUS = 82;
  const HEX_GAP = 4;
  const hexWidth = Math.sqrt(3) * HEX_RADIUS + HEX_GAP;
  const vertSpacing = 1.5 * HEX_RADIUS + HEX_GAP * 0.866;

  // Total grid span from center of (0,0) to center of (4,4) + odd row shift
  const totalGridSpanX = (GRID_COLS - 1) * hexWidth + hexWidth * 0.5;
  const totalGridSpanY = (GRID_ROWS - 1) * vertSpacing;

  const originX = CENTER_X - totalGridSpanX / 2;
  const originY = CENTER_Y - totalGridSpanY / 2;

  const winningSet = new Set(winningPath);

  // Border and neutral styling per theme
  const hexBorderColor =
    theme === 'elite_clash'
      ? '#d4af37'
      : theme === 'royal_night'
      ? '#38bdf8'
      : '#68329A';

  const letterDefaultColor =
    theme === 'elite_clash'
      ? '#1e1b4b'
      : theme === 'royal_night'
      ? '#0f172a'
      : '#632B96';

  const handleHexClick = (cell: HexCell) => {
    if (isDisplayOnly) return;

    if (correctionMode) {
      // Cycle owner: none -> team1 -> team2 -> none
      const nextOwner: CellOwner =
        cell.owner === 'none'
          ? 'team1'
          : cell.owner === 'team1'
          ? 'team2'
          : 'none';
      setRecentlyClaimedId(cell.id);
      setTimeout(() => setRecentlyClaimedId(null), 500);
      onCorrectCellOwner(cell.id, nextOwner);
      return;
    }

    if (cell.owner === 'none') {
      onSelectCell(cell.id);
    }
  };

  // Compute centers of winning path for drawing a glowing connection line
  const winningCenters = winningPath
    .map((id) => {
      const c = cells[id];
      if (!c) return null;
      return getHexCenter(c.row, c.col, HEX_RADIUS, originX, originY, HEX_GAP);
    })
    .filter((pt): pt is { cx: number; cy: number } => pt !== null);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden select-none"
      data-testid="hex-board-container"
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full max-w-full max-h-full block"
        role="group"
        aria-label="لوحة حروف المسابقة المكونة من 25 خلية سداسية"
      >
        <defs>
          {/* Subtle 3D drop shadow for the hexagonal grid */}
          <filter id="hex-shadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.28" />
          </filter>

          {/* Bright glow for winning path cells */}
          <filter id="win-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#fde047" floodOpacity="0.95" />
          </filter>

          {/* Inner highlight gradient for elite clash theme */}
          <linearGradient id="selected-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE600" />
            <stop offset="100%" stopColor="#F2C200" />
          </linearGradient>
        </defs>

        {/* 4 Directional Arena Quadrants (Top/Bottom = Team 1 Green, Left/Right = Team 2 Orange) */}
        <g aria-hidden="true">
          {/* Top Quadrant (Team 1) */}
          <polygon
            points={`-500,-500 ${VIEW_W + 500},-500 ${CENTER_X},${CENTER_Y}`}
            fill={team1.color}
          />
          {/* Bottom Quadrant (Team 1) */}
          <polygon
            points={`-500,${VIEW_H + 500} ${VIEW_W + 500},${VIEW_H + 500} ${CENTER_X},${CENTER_Y}`}
            fill={team1.color}
          />
          {/* Left Quadrant (Team 2) */}
          <polygon
            points={`-500,-500 -500,${VIEW_H + 500} ${CENTER_X},${CENTER_Y}`}
            fill={team2.color}
          />
          {/* Right Quadrant (Team 2) */}
          <polygon
            points={`${VIEW_W + 500},-500 ${VIEW_W + 500},${VIEW_H + 500} ${CENTER_X},${CENTER_Y}`}
            fill={team2.color}
          />

          {/* Subtle diagonal seam lines between quadrants */}
          <line
            x1="-500"
            y1="-500"
            x2={VIEW_W + 500}
            y2={VIEW_H + 500}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="3"
          />
          <line
            x1={VIEW_W + 500}
            y1="-500"
            x2="-500"
            y2={VIEW_H + 500}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="3"
          />

          {/* Subtle Elite Clash arena vignette when in elite_clash mode */}
          {theme === 'elite_clash' && (
            <rect
              x="-200"
              y="-200"
              width={VIEW_W + 400}
              height={VIEW_H + 400}
              fill="rgba(10, 10, 22, 0.22)"
            />
          )}
        </g>

        {/* Outer unified board backing silhouette for deep broadcast border */}
        <g filter="url(#hex-shadow)" aria-hidden="true">
          {cells.map((cell) => {
            const { cx, cy } = getHexCenter(
              cell.row,
              cell.col,
              HEX_RADIUS,
              originX,
              originY,
              HEX_GAP
            );
            return (
              <path
                key={`backing_${cell.id}`}
                d={getRoundedHexPath(cx, cy, HEX_RADIUS + 10, 12)}
                fill={hexBorderColor}
                stroke={hexBorderColor}
                strokeWidth="6"
                strokeLinejoin="round"
              />
            );
          })}
        </g>

        {/* Interactive 25 Hexagonal Cells */}
        <g>
          {cells.map((cell) => {
            const { cx, cy } = getHexCenter(
              cell.row,
              cell.col,
              HEX_RADIUS,
              originX,
              originY,
              HEX_GAP
            );
            const isSelected = selectedCellId === cell.id;
            const isWinningCell = winningSet.has(cell.id);
            const isRecentlyClaimed = recentlyClaimedId === cell.id;

            let fillColor = '#FFFFFF';
            if (cell.owner === 'team1') {
              fillColor = team1.color;
            } else if (cell.owner === 'team2') {
              fillColor = team2.color;
            } else if (isSelected) {
              fillColor = 'url(#selected-grad)';
            }

            const showLetter =
              cell.owner === 'none' || showLettersOnOwnedCells || correctionMode;

            const letterFill =
              cell.owner !== 'none'
                ? 'rgba(255,255,255,0.92)'
                : isSelected
                ? '#5B2C86'
                : letterDefaultColor;

            const hexPath = getRoundedHexPath(cx, cy, HEX_RADIUS - 3.5, 8);
            const canClick =
              !isDisplayOnly && (correctionMode || cell.owner === 'none');

            const ownerStatusLabel =
              cell.owner === 'team1'
                ? `مملوكة لـ ${team1.name}`
                : cell.owner === 'team2'
                ? `مملوكة لـ ${team2.name}`
                : isSelected
                ? 'محددة حاليًا'
                : 'متاحة';

            return (
              <g
                key={cell.id}
                role="button"
                tabIndex={canClick ? 0 : -1}
                aria-label={`خلية رقم ${cell.id + 1} حرف ${cell.letter} - ${ownerStatusLabel}`}
                data-testid={`hex-cell-${cell.id}`}
                data-owner={cell.owner}
                data-selected={isSelected ? 'true' : 'false'}
                data-letter={cell.letter}
                onClick={() => handleHexClick(cell)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleHexClick(cell);
                  }
                }}
                className={`${
                  canClick ? 'cursor-pointer' : 'cursor-default'
                } transition-transform duration-150 focus:outline-none ${
                  isWinningCell
                    ? 'animate-win-hex'
                    : isSelected
                    ? 'animate-selected-hex'
                    : ''
                }`}
              >
                {/* Main Hexagon Fill & Border */}
                <path
                  d={hexPath}
                  fill={fillColor}
                  stroke={isWinningCell ? '#FEF08A' : hexBorderColor}
                  strokeWidth={isWinningCell ? 8 : 6.5}
                  strokeLinejoin="round"
                  filter={isWinningCell ? 'url(#win-glow)' : undefined}
                />

                {/* Brief flash ring when newly claimed */}
                {isRecentlyClaimed && (
                  <path
                    d={getRoundedHexPath(cx, cy, HEX_RADIUS - 8, 6)}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="6"
                    opacity="0.85"
                  />
                )}

                {/* Winning cell inner highlight ring */}
                {isWinningCell && (
                  <path
                    d={getRoundedHexPath(cx, cy, HEX_RADIUS - 12, 6)}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="4"
                    strokeDasharray="10 6"
                  />
                )}

                {/* Correction Mode indicator badge */}
                {correctionMode && !isDisplayOnly && (
                  <circle
                    cx={cx}
                    cy={cy - HEX_RADIUS * 0.62}
                    r={10}
                    fill="#1e1035"
                    stroke="#facc15"
                    strokeWidth="2"
                  />
                )}

                {/* Arabic Letter with Broadcast Styling */}
                {showLetter && (
                  <g aria-hidden="true" className="pointer-events-none">
                    {/* Subtle 3D letter shadow */}
                    <text
                      x={cx}
                      y={cy + 4}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="rgba(0,0,0,0.12)"
                      style={{
                        fontFamily: `'${fontFamily}', 'Alexandria', 'Cairo', sans-serif`,
                        fontSize: cell.letter.length > 1 ? '48px' : '56px',
                        fontWeight: 900,
                      }}
                    >
                      {cell.letter}
                    </text>

                    {/* Primary Letter */}
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={letterFill}
                      style={{
                        fontFamily: `'${fontFamily}', 'Alexandria', 'Cairo', sans-serif`,
                        fontSize: cell.letter.length > 1 ? '48px' : '56px',
                        fontWeight: 900,
                      }}
                    >
                      {cell.letter}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* Illuminated Winning Path Connector Line */}
        {winningCenters.length >= 2 && (
          <g aria-hidden="true" className="pointer-events-none">
            <polyline
              points={winningCenters.map((p) => `${p.cx},${p.cy}`).join(' ')}
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#win-glow)"
            />
            <polyline
              points={winningCenters.map((p) => `${p.cx},${p.cy}`).join(' ')}
              fill="none"
              stroke="#FACC15"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}
      </svg>

      {/* Correction mode floating banner */}
      {correctionMode && !isDisplayOnly && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-extrabold px-5 py-2 rounded-xl shadow-lg border-2 border-slate-900 text-sm flex items-center gap-3">
          <span>وضع تصحيح الملكية نشط: اضغط على أي خلية لتبديل ملكيتها (أبيض ← أخضر ← برتقالي)</span>
        </div>
      )}
    </div>
  );
};
