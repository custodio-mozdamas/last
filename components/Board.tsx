
import React, { useState, useMemo } from 'react';
import { Piece, PieceColor, Move } from '../types';
import { BOARD_SIZE, getLegalMoves } from '../gameLogic';

interface BoardProps {
  board: (Piece | null)[][];
  turn: PieceColor;
  playerColor?: PieceColor;
  theme: 'WOOD' | 'DARK' | 'GREEN' | 'MINIMAL';
  onMove: (move: Move) => void;
  isSpectator: boolean;
}

export const Board: React.FC<BoardProps> = ({ board, turn, playerColor, theme, onMove, isSpectator }) => {
  const [selectedPiece, setSelectedPiece] = useState<{ row: number, col: number } | null>(null);
  
  const legalMovesForColor = useMemo(() => getLegalMoves(board, turn), [board, turn]);

  const possibleMovesForSelected = useMemo(() => {
    if (!selectedPiece) return [];
    const found = legalMovesForColor.find(item => item.piece.row === selectedPiece.row && item.piece.col === selectedPiece.col);
    return found ? found.moves : [];
  }, [selectedPiece, legalMovesForColor]);

  const handleTileClick = (r: number, c: number) => {
    if (isSpectator) return;
    if (playerColor && turn !== playerColor) return;

    const piece = board[r][c];
    
    if (piece && piece.color === turn) {
      if (selectedPiece?.row === r && selectedPiece?.col === c) {
        setSelectedPiece(null);
      } else {
        setSelectedPiece({ row: r, col: c });
      }
      return;
    }

    if (selectedPiece) {
      const move = possibleMovesForSelected.find(m => m.to.row === r && m.to.col === c);
      if (move) {
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
    // Casa jogável é (r+c) par para que a ponta direita inferior (7,7) seja escura/jogável
    const isPlayable = (r + c) % 2 === 0;

    switch (theme) {
      case 'WOOD': 
        return isPlayable ? 'bg-[#3e2723]' : 'bg-[#d7ccc8]'; // Marrom Escuro vs Bege
      case 'GREEN': 
        return isPlayable ? 'bg-[#1b5e20]' : 'bg-[#a5d6a7]'; // Verde Escuro vs Verde Claro
      case 'DARK': 
        return isPlayable ? 'bg-[#020617]' : 'bg-[#1e293b]'; // Slate 950 vs Slate 800
      case 'MINIMAL': 
        return isPlayable ? 'bg-black' : 'bg-slate-700';    // Preto vs Cinza
      default: 
        return isPlayable ? 'bg-slate-950' : 'bg-slate-800';
    }
  };

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
          const isSelected = selectedPiece?.row === r && selectedPiece?.col === c;
          const isPossibleTarget = possibleMovesForSelected.some(m => m.to.row === r && m.to.col === c);
          
          return (
            <div 
              key={`${r}-${c}`}
              onClick={() => handleTileClick(r, c)}
              className={`relative flex items-center justify-center cursor-pointer transition-all duration-200 ${getTileColor(r, c)}`}
            >
              {isPossibleTarget && (
                <div className="absolute w-4 h-4 bg-blue-400/50 rounded-full animate-pulse z-10" />
              )}
              
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
