
import { create } from 'zustand';
import { Player, Room, GameSettings, PieceColor, Piece, Move, ChatMessage } from './types';
import { createInitialBoard, getLegalMoves } from './gameLogic';
import { supabase } from './lib/supabase';

interface AppState {
  currentUser: Player | null;
  currentRoom: Room | null;
  rooms: Room[];
  setCurrentUser: (user: Player | null) => void;
  createRoom: (name: string, type: 'PUBLIC' | 'PRIVATE', settings: GameSettings) => void;
  joinRoom: (roomId: string, asSpectator?: boolean) => void;
  leaveRoom: () => void;
  startGame: () => void;
  makeMove: (move: Move) => void;
  sendMessage: (text: string) => void;
  updateUser: (data: Partial<Player>) => void;
  tickTimers: () => void;
  syncRooms: () => void;
  subscribeToRoom: (roomId: string) => void;
}

const initialRooms: Room[] = [
  {
    id: 'room-1',
    name: 'Arena dos Mestres',
    type: 'PUBLIC',
    status: 'WAITING',
    hostId: 'system',
    players: [null, null],
    spectators: [],
    settings: { timeLimit: 5, increment: 2, theme: 'DARK' },
    chat: []
  },
  {
    id: 'room-test',
    name: 'Sala de Teste',
    type: 'PUBLIC',
    status: 'WAITING',
    hostId: 'system',
    players: [null, null],
    spectators: [],
    settings: { timeLimit: 10, increment: 5, theme: 'MINIMAL' },
    chat: []
  }
];

export const useStore = create<AppState>((set, get) => ({
  // Alterado para null para permitir o fluxo de login
  currentUser: null,
  currentRoom: null,
  rooms: initialRooms,

  setCurrentUser: (user) => set({ currentUser: user }),
  
  updateUser: (data) => {
    const user = get().currentUser;
    if (user) set({ currentUser: { ...user, ...data } });
  },

  syncRooms: async () => {
    const { data } = await supabase.from('rooms').select('*').eq('status', 'WAITING');
    if (data) set({ rooms: [...initialRooms, ...data] });
  },

  subscribeToRoom: (roomId: string) => {
    if (roomId === 'room-test' || roomId === 'room-1') return;

    supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
        set({ currentRoom: payload.new as Room });
      })
      .on('postgres_changes', { event: 'INSERT', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        set(state => {
          if (!state.currentRoom) return state;
          return {
            currentRoom: {
              ...state.currentRoom,
              chat: [...state.currentRoom.chat, newMessage]
            }
          };
        });
      })
      .subscribe();
  },

  createRoom: async (name, type, settings) => {
    const user = get().currentUser;
    if (!user) return;

    const roomId = Math.random().toString(36).substr(2, 9);
    const newRoom: Room = {
      id: roomId,
      name,
      type,
      status: 'WAITING',
      hostId: user.id,
      players: [user, null],
      spectators: [],
      settings,
      chat: []
    };

    await supabase.from('rooms').insert([newRoom]);
    set({ currentRoom: newRoom });
    get().subscribeToRoom(roomId);
  },

  joinRoom: async (roomId, asSpectator = false) => {
    const user = get().currentUser;
    if (!user) return;

    if (roomId === 'room-test' || roomId === 'room-1') {
       set(state => {
          const roomIndex = state.rooms.findIndex(r => r.id === roomId);
          const room = { ...state.rooms[roomIndex] };
          if (asSpectator) room.spectators = [...room.spectators, user];
          else {
            const newPlayers = [...room.players];
            if (!newPlayers[0]) newPlayers[0] = user;
            else if (!newPlayers[1]) newPlayers[1] = user;
            room.players = newPlayers;
          }
          return { currentRoom: room };
       });
       return;
    }

    const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (!room) return;

    const updatedRoom = { ...room };
    if (asSpectator) {
      updatedRoom.spectators = [...updatedRoom.spectators, user];
    } else {
      const newPlayers = [...updatedRoom.players];
      if (!newPlayers[0]) newPlayers[0] = user;
      else if (!newPlayers[1]) newPlayers[1] = user;
      updatedRoom.players = newPlayers;
    }

    await supabase.from('rooms').update(updatedRoom).eq('id', roomId);
    set({ currentRoom: updatedRoom });
    get().subscribeToRoom(roomId);
  },

  leaveRoom: async () => {
    const { currentUser, currentRoom } = get();
    if (!currentRoom || !currentUser) return;

    if (currentRoom.id !== 'room-test' && currentRoom.id !== 'room-1') {
      const updatedRoom = { ...currentRoom };
      updatedRoom.players = updatedRoom.players.map(p => p?.id === currentUser.id ? null : p);
      updatedRoom.spectators = updatedRoom.spectators.filter(s => s.id !== currentUser.id);
      
      if (updatedRoom.status === 'PLAYING' && updatedRoom.gameState) {
        const playerIndex = currentRoom.players.findIndex(p => p?.id === currentUser.id);
        updatedRoom.gameState.winner = playerIndex === 0 ? 'RED' : 'WHITE';
        updatedRoom.status = 'FINISHED';
      }

      await supabase.from('rooms').update(updatedRoom).eq('id', currentRoom.id);
      supabase.removeAllChannels();
    }
    
    set({ currentRoom: null });
  },

  startGame: async () => {
    const { currentRoom } = get();
    if (!currentRoom) return;
    
    const isTest = currentRoom.id === 'room-test';
    if (!isTest && (!currentRoom.players[0] || !currentRoom.players[1])) return;

    const initialBoard = createInitialBoard();
    const gameState = {
      board: initialBoard,
      turn: 'WHITE' as PieceColor,
      timers: { WHITE: currentRoom.settings.timeLimit * 60, RED: currentRoom.settings.timeLimit * 60 },
      history: [],
      lastMoveTime: Date.now()
    };

    const updatedRoom = { ...currentRoom, status: 'PLAYING', gameState };

    if (currentRoom.id !== 'room-test' && currentRoom.id !== 'room-1') {
      await supabase.from('rooms').update(updatedRoom).eq('id', currentRoom.id);
    }

    set({ currentRoom: updatedRoom });
  },

  makeMove: async (move) => {
    const { currentRoom } = get();
    if (!currentRoom || !currentRoom.gameState) return;

    const gs = { ...currentRoom.gameState };
    const board = gs.board.map(r => [...r]);
    const piece = board[move.from.row][move.from.col]!;

    if (move.captured) {
      move.captured.forEach(id => {
        for(let r=0; r<8; r++) {
          for(let c=0; c<8; c++) {
            if(board[r][c]?.id === id) board[r][c] = null;
          }
        }
      });
    }

    board[move.from.row][move.from.col] = null;
    let finalType = piece.type;
    if (move.isKingPromotion) finalType = 'KING';
    board[move.to.row][move.to.col] = { ...piece, row: move.to.row, col: move.to.col, type: finalType };

    const prevTurn = gs.turn;
    gs.timers[prevTurn] += currentRoom.settings.increment;
    gs.board = board;
    gs.turn = gs.turn === 'WHITE' ? 'RED' : 'WHITE';
    gs.history = [...gs.history, move];
    gs.lastMoveTime = Date.now();

    const nextMoves = getLegalMoves(board, gs.turn);
    if (nextMoves.length === 0) {
      gs.winner = gs.turn === 'WHITE' ? 'RED' : 'WHITE';
    }

    const updatedRoom = { ...currentRoom, gameState: gs };
    if (currentRoom.id !== 'room-test' && currentRoom.id !== 'room-1') {
      await supabase.from('rooms').update(updatedRoom).eq('id', currentRoom.id);
    }
    set({ currentRoom: updatedRoom });
  },

  tickTimers: () => {
    const { currentRoom } = get();
    if (!currentRoom || currentRoom.status !== 'PLAYING' || !currentRoom.gameState) return;

    const gs = { ...currentRoom.gameState };
    const turn = gs.turn;
    
    if (gs.timers[turn] > 0) {
      gs.timers[turn] -= 1;
      
      if (gs.timers[turn] <= 0) {
        gs.timers[turn] = 0;
        gs.winner = turn === 'WHITE' ? 'RED' : 'WHITE';
        const updated = { ...currentRoom, status: 'FINISHED', gameState: gs };
        set({ currentRoom: updated });
        return;
      }

      set({ currentRoom: { ...currentRoom, gameState: gs } });
    }
  },

  sendMessage: async (text) => {
    const { currentRoom, currentUser } = get();
    if (!currentRoom || !currentUser) return;

    const msg: ChatMessage = {
      id: Math.random().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text,
      timestamp: Date.now()
    };

    if (currentRoom.id !== 'room-test' && currentRoom.id !== 'room-1') {
      await supabase.from('chat_messages').insert([{ ...msg, room_id: currentRoom.id }]);
    } else {
      set({ currentRoom: { ...currentRoom, chat: [...currentRoom.chat, msg] } });
    }
  }
}));
