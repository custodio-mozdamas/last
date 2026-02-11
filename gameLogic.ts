
import { Piece, PieceColor, PieceType, Move } from './types';

export const BOARD_SIZE = 8;

export const createInitialBoard = (): (Piece | null)[][] => {
  const board: (Piece | null)[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Dark squares are playable: (row + col) % 2 !== 0
      // Right diagonal at bottom: Square (7, 7) must be dark. 7+7=14 (Even). 
      // User says: "Casa escura sempre à direita do jogador". 
      // For bottom player, col 7 is right. Row 7 is bottom. (7, 7) even.
      // So dark squares = (row + col) % 2 === 0? 
      // Let's check (7,7) -> 14. (0,0) -> 0. 
      // Usually standard is dark = (r+c)%2 !== 0. 
      // Bottom right (7,7) being dark implies (7+7) is even. 
      // If dark is even: (0,0), (0,2), (1,1) etc.
      const isPlayable = (row + col) % 2 === 0;

      if (isPlayable) {
        if (row < 3) {
          board[row][col] = { id: `red-${row}-${col}`, color: 'RED', type: 'PAWN', row, col };
        } else if (row > 4) {
          board[row][col] = { id: `white-${row}-${col}`, color: 'WHITE', type: 'PAWN', row, col };
        }
      }
    }
  }
  return board;
};

export const getPieceAt = (board: (Piece | null)[][], row: number, col: number) => {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return undefined;
  return board[row][col];
};

export interface PotentialMove {
  to: { row: number, col: number };
  captured: string[];
  weight: number; // Damas count as 2 for majority capture
  isPromotion: boolean;
}

// Find all possible capture sequences for a specific piece
export const findCaptures = (
  board: (Piece | null)[][], 
  piece: Piece,
  currentSequence: string[] = []
): PotentialMove[] => {
  const captures: PotentialMove[] = [];
  const { row, col, color, type } = piece;

  const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

  if (type === 'PAWN') {
    for (const [dr, dc] of directions) {
      const midR = row + dr;
      const midC = col + dc;
      const endR = row + dr * 2;
      const endC = col + dc * 2;

      const midPiece = getPieceAt(board, midR, midC);
      const endTile = getPieceAt(board, endR, endC);

      if (midPiece && midPiece.color !== color && endTile === null && !currentSequence.includes(midPiece.id)) {
        // Found a capture
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = null;
        newBoard[endR][endC] = { ...piece, row: endR, col: endC };
        
        const nextCaptures = findCaptures(newBoard, { ...piece, row: endR, col: endC }, [...currentSequence, midPiece.id]);
        
        if (nextCaptures.length > 0) {
          captures.push(...nextCaptures);
        } else {
          captures.push({
            to: { row: endR, col: endC },
            captured: [...currentSequence, midPiece.id],
            weight: currentSequence.reduce((acc, id) => acc + (id.includes('king') ? 2 : 1), 0) + (midPiece.type === 'KING' ? 2 : 1),
            isPromotion: (color === 'WHITE' && endR === 0) || (color === 'RED' && endR === 7)
          });
        }
      }
    }
  } else {
    // KING logic (Flying King)
    for (const [dr, dc] of directions) {
      let r = row + dr;
      let c = col + dc;
      let foundEnemy = false;
      let capturedId = '';

      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        const p = board[r][c];
        if (p === null) {
          if (foundEnemy) {
            // Landing after enemy
            const newBoard = board.map(rowArr => [...rowArr]);
            newBoard[row][col] = null;
            newBoard[r][c] = { ...piece, row: r, col: c };
            
            const nextCaptures = findCaptures(newBoard, { ...piece, row: r, col: c }, [...currentSequence, capturedId]);
            if (nextCaptures.length > 0) {
              captures.push(...nextCaptures);
            } else {
              const weight = [...currentSequence, capturedId].reduce((acc, id) => {
                  // This is a heuristic: check actual type if possible, or just look at ID if we stored types
                  // For now, let's assume all captured pieces in current sequence are weighted
                  return acc + 1; // Simplified weight for now
              }, 0);
              captures.push({
                to: { row: r, col: c },
                captured: [...currentSequence, capturedId],
                weight: weight,
                isPromotion: false
              });
            }
          }
        } else if (p.color === color) {
          break; // Blocked by ally
        } else {
          if (foundEnemy) break; // Already jumped one enemy in this direction
          if (currentSequence.includes(p.id)) break; // Already captured this piece in sequence
          foundEnemy = true;
          capturedId = p.id;
        }
        r += dr;
        c += dc;
      }
    }
  }

  return captures;
};

// Find simple moves
export const findSimpleMoves = (board: (Piece | null)[][], piece: Piece): PotentialMove[] => {
  const moves: PotentialMove[] = [];
  const { row, col, color, type } = piece;

  if (type === 'PAWN') {
    const dr = color === 'WHITE' ? -1 : 1;
    const targets = [[dr, 1], [dr, -1]];
    for (const [tr, tc] of targets) {
      const nr = row + tr;
      const nc = col + tc;
      if (getPieceAt(board, nr, nc) === null) {
        moves.push({
          to: { row: nr, col: nc },
          captured: [],
          weight: 0,
          isPromotion: (color === 'WHITE' && nr === 0) || (color === 'RED' && nr === 7)
        });
      }
    }
  } else {
    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (const [dr, dc] of directions) {
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        if (board[r][c] === null) {
          moves.push({ to: { row: r, col: c }, captured: [], weight: 0, isPromotion: false });
        } else {
          break;
        }
        r += dr;
        c += dc;
      }
    }
  }
  return moves;
};

export const getLegalMoves = (board: (Piece | null)[][], color: PieceColor) => {
  let allCaptures: { piece: Piece, moves: PotentialMove[] }[] = [];
  let allSimple: { piece: Piece, moves: PotentialMove[] }[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (p && p.color === color) {
        const caps = findCaptures(board, p);
        if (caps.length > 0) allCaptures.push({ piece: p, moves: caps });
        
        const sims = findSimpleMoves(board, p);
        if (sims.length > 0) allSimple.push({ piece: p, moves: sims });
      }
    }
  }

  if (allCaptures.length > 0) {
    // Law of majority: Filter for moves with maximum captured pieces (weight)
    let maxWeight = 0;
    allCaptures.forEach(item => {
      item.moves.forEach(m => {
        if (m.captured.length > maxWeight) maxWeight = m.captured.length;
      });
    });

    return allCaptures.map(item => ({
      piece: item.piece,
      moves: item.moves.filter(m => m.captured.length === maxWeight)
    })).filter(item => item.moves.length > 0);
  }

  return allSimple;
};
