
export type PieceColor = 'WHITE' | 'RED';
export type PieceType = 'PAWN' | 'KING';

export interface Piece {
  id: string;
  color: PieceColor;
  type: PieceType;
  row: number;
  col: number;
}

export interface Player {
  id: string;
  name: string;
  rating: number;
  avatar?: string;
  isOnline: boolean;
  seat?: 1 | 2;
  wins?: number;
  losses?: number;
  draws?: number;
}

export type RoomStatus = 'WAITING' | 'PLAYING' | 'FINISHED';
export type RoomType = 'PUBLIC' | 'PRIVATE';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  status: RoomStatus;
  hostId: string;
  players: (Player | null)[]; // Index 0: Seat 1, Index 1: Seat 2
  spectators: Player[];
  settings: GameSettings;
  gameState?: GameState;
  chat: ChatMessage[];
  created_at?: string;
}

export interface GameSettings {
  timeLimit: number; // in minutes
  increment: number; // in seconds
  theme: 'WOOD' | 'DARK' | 'GREEN' | 'MINIMAL';
}

export interface GameState {
  board: (Piece | null)[][];
  turn: PieceColor;
  timers: { [key in PieceColor]: number };
  history: Move[];
  winner?: PieceColor | 'DRAW';
  lastMoveTime: number;
}

export interface Move {
  pieceId: string;
  from: { row: number; col: number };
  to: { row: number; col: number };
  captured?: string[]; // piece IDs
  isKingPromotion?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}
