
import React, { useState, useMemo } from 'react';
import { Piece, PieceColor, Move } from '../types';
import { BOARD_SIZE, getLegalMoves, PotentialMove } from '../gameLogic';

interface BoardProps {
  board: (Piece | null)[][];
  turn: PieceColor;
  playerColor?: PieceColor;
  theme: 'WOOD' | 'DARK' | 'GREEN' | 'MINIMAL';
  onMove: (move: Move) => void;
  isSpectator: boolean;
}

export const Board: React.FC<BoardProps> = ({ board, turn, playerColor, theme, onMove, isSpectator }) => {
  // Fix: Changed state property names to match Move interface expected by onMove callback
  const [selectedPiece, setSelectedPiece] = useState<{ row: number, col: number } | null>(null);
  
  const legalMovesForColor = useMemo(() => getLegalMoves(board, turn), [board, turn]);

  const possibleMovesForSelected = useMemo(() => {
    if (!selectedPiece) return [];
    // Fix: Updated property access from .r/.c to .row/.col
    const found = legalMovesForColor.find(item => item.piece.row === selectedPiece.row && item.piece.col === selectedPiece.col);
    return found ? found.moves : [];
  }, [selectedPiece, legalMovesForColor]);

  const handleTileClick = (r: number, c: number) => {
    if (isSpectator) return;
    if (playerColor && turn !== playerColor) return;

    const piece = board[r][c];
    
    // Select piece
    if (piece && piece.color === turn) {
      // Fix: Updated property access from .r/.c to .row/.col
      if (selectedPiece?.row === r && selectedPiece?.col === c) {
        setSelectedPiece(null);
      } else {
        setSelectedPiece({ row: r, col: c });
      }
      return;
    }

    // Execute move
    if (selectedPiece) {
      const move = possibleMovesForSelected.find(m => m.to.row === r && m.to.col === c);
      if (move) {
        // Fix: Use new selectedPiece naming which matches the 'from' property requirements of Move
        onMove({
          pieceId: board[selectedPiece.row][selectedPiece.col]!.id,
          from: { ...selectedPiece },
          to: { row: r, col: c },
          captured: move.captured,
          isKingPromotion: move.isPromotion
        });
        setSelectedPiece(null);
      }
    }
  };

  const getTileColor = (r: number, c: number) => {
    const isDark = (r + c) % 2 === 0;
    if (!isDark) return 'bg-slate-800/20'; // Non-playable light squares

    switch (theme) {
      case 'DARK': return 'bg-slate-900';
      case 'WOOD': return 'bg-[#4a2c1d]';
      case 'GREEN': return 'bg-[#004d40]';
      case 'MINIMAL': return 'bg-slate-950';
      default: return 'bg-slate-900';
    }
  };

  // Flip board for RED player so they see their side at the bottom
  const renderRows = Array.from({ length: BOARD_SIZE }, (_, i) => i);
  const renderCols = Array.from({ length: BOARD_SIZE }, (_, i) => i);

  if (playerColor === 'RED') {
    renderRows.reverse();
    renderCols.reverse();
  }

  return (
    <div className="relative aspect-square w-full max-w-[500px] border-4 border-slate-800 shadow-2xl rounded-lg overflow-hidden neon-border">
      <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
        {renderRows.map(r => renderCols.map(c => {
          const piece = board[r][c];
          // Fix: Updated property access from .r/.c to .row/.col
          const isSelected = selectedPiece?.row === r && selectedPiece?.col === c;
          const isPossibleTarget = possibleMovesForSelected.some(m => m.to.row === r && m.to.col === c);
          
          return (
            <div 
              key={`${r}-${c}`}
              onClick={() => handleTileClick(r, c)}
              className={`relative flex items-center justify-center cursor-pointer transition-all duration-200 ${getTileColor(r, c)}`}
            >
              {/* Tile indicators */}
              {isPossibleTarget && (
                <div className="absolute w-4 h-4 bg-blue-400/50 rounded-full animate-pulse z-10" />
              )}
              
              {/* Piece */}
              {piece && (
                <div 
                  className={`
                    w-4/5 h-4/5 rounded-full flex items-center justify-center relative
                    transition-all duration-300
                    ${piece.color === 'WHITE' ? 'bg-slate-100 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]'}
                    ${isSelected ? 'scale-110 border-2 border-blue-400 brightness-125 z-20' : 'z-0'}
                  `}
                >
                  <div className="w-4/5 h-4/5 rounded-full border border-black/10 flex items-center justify-center">
                    {piece.type === 'KING' && (
                        <div className="text-black/50 font-bold text-xs">K</div>
                    )}
                  </div>
                  {/* Visual stacking effect */}
                  <div className="absolute -bottom-1 w-full h-full rounded-full bg-black/20 -z-10" />
                </div>
              )}
            </div>
          );
        }))}
      </div>
    </div>
  );
};
