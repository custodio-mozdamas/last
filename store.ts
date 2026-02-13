
import { create } from 'zustand';
import { Player, Room, GameSettings, PieceColor, Piece, Move, ChatMessage, RoomStatus, GameState } from './types';
import { createInitialBoard, getLegalMoves } from './gameLogic';
import { supabase } from './lib/supabase';

interface AppState {
  currentUser: Player | null;
  currentRoom: Room | null;
  rooms: Room[];
  rankings: Player[];
  setCurrentUser: (user: Player | null) => void;
  createRoom: (name: string, type: 'PUBLIC' | 'PRIVATE', settings: GameSettings) => void;
  joinRoom: (roomId: string, asSpectator?: boolean) => void;
  leaveRoom: () => void;
  selectSeat: (seatIndex: number) => void;
  updateRoomSettings: (settings: Partial<GameSettings>) => void;
  proposeDraw: () => void;
  respondToDraw: (accept: boolean) => void;
  startGame: () => void;
  makeMove: (move: Move) => void;
  sendMessage: (text: string) => void;
  updateUser: (data: Partial<Player>) => void;
  tickTimers: () => void;
  syncRooms: () => void;
  syncRankings: () => void;
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
  currentUser: null,
  currentRoom: null,
  rooms: initialRooms,
  rankings: [],

  setCurrentUser: async (user) => {
    if (user && !user.id.startsWith('guest-')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        set({ currentUser: { ...user, ...profile } });
      } else {
        const newProfile = { id: user.id, name: user.name, rating: 1200, wins: 0, losses: 0, draws: 0 };
        await supabase.from('profiles').insert([newProfile]);
        set({ currentUser: { ...user, ...newProfile } });
      }
    } else {
      set({ currentUser: user });
    }
  },
  
  updateUser: async (data) => {
    const user = get().currentUser;
    if (user) {
      const updatedUser = { ...user, ...data };
      set({ currentUser: updatedUser });
      if (!user.id.startsWith('guest-')) {
        await supabase.from('profiles').update(data).eq('id', user.id);
      }
    }
  },

  syncRooms: async () => {
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'WAITING')
      .order('created_at', { ascending: false });

    if (data) {
      const activeRooms = (data as Room[]).filter(r => r.players.some(p => p !== null));
      set({ rooms: [...activeRooms, ...initialRooms] });
    }
  },

  syncRankings: async () => {
    const { data } = await supabase.from('profiles').select('*').order('rating', { ascending: false }).limit(50);
    if (data) set({ rankings: data as Player[] });
  },

  subscribeToRoom: (roomId: string) => {
    if (roomId === 'room-test' || roomId === 'room-1') return;
    supabase.channel(`room:${roomId}`).unsubscribe();
    supabase.channel(`room:${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
        set({ currentRoom: payload.new as Room });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        set(state => {
          if (!state.currentRoom || state.currentRoom.chat.some(m => m.id === newMessage.id)) return state;
          return { currentRoom: { ...state.currentRoom, chat: [...state.currentRoom.chat, newMessage] } };
        });
      })
      .subscribe();
  },

  createRoom: async (name, type, settings) => {
    const user = get().currentUser;
    if (!user) return;
    const roomId = Math.random().toString(36).substr(2, 9);
    const newRoom: Room = { id: roomId, name, type, status: 'WAITING', hostId: user.id, players: [user, null], spectators: [], settings, chat: [] };
    await supabase.from('rooms').insert([newRoom]);
    set({ currentRoom: newRoom });
    get().subscribeToRoom(roomId);
  },

  joinRoom: async (roomId, asSpectator = false) => {
    const user = get().currentUser;
    if (!user) return;
    if (roomId === 'room-test' || roomId === 'room-1') {
       set(state => {
          const room = { ...state.rooms.find(r => r.id === roomId)! };
          if (asSpectator) room.spectators = [...room.spectators, user];
          else {
            const idx = room.players.findIndex(p => p === null);
            if (idx !== -1) room.players[idx] = user;
          }
          return { currentRoom: room };
       });
       return;
    }
    const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (!room) return;
    const updated = { ...room };
    if (asSpectator) {
      if (!updated.spectators.some(s => s.id === user.id)) updated.spectators = [...updated.spectators, user];
    } else {
      const idx = updated.players.findIndex(p => p === null);
      if (idx !== -1 && !updated.players.some(p => p?.id === user.id)) updated.players[idx] = user;
    }
    await supabase.from('rooms').update(updated).eq('id', roomId);
    set({ currentRoom: updated });
    get().subscribeToRoom(roomId);
  },

  selectSeat: async (seatIndex) => {
    const { currentRoom, currentUser } = get();
    if (!currentRoom || !currentUser || currentRoom.status !== 'WAITING') return;
    const updated = { ...currentRoom };
    updated.players = updated.players.map(p => p?.id === currentUser.id ? null : p);
    if (updated.players[seatIndex] === null) {
      updated.players[seatIndex] = currentUser;
      updated.spectators = updated.spectators.filter(s => s.id !== currentUser.id);
      if (currentRoom.id !== 'room-test' && currentRoom.id !== 'room-1') {
        await supabase.from('rooms').update({ players: updated.players, spectators: updated.spectators }).eq('id', currentRoom.id);
      }
      set({ currentRoom: updated });
    }
  },

  updateRoomSettings: async (newSettings) => {
    const { currentRoom, currentUser } = get();
    if (!currentRoom || !currentUser || currentRoom.hostId !== currentUser.id || currentRoom.status !== 'WAITING') return;
    const settings = { ...currentRoom.settings, ...newSettings };
    if (currentRoom.id !== 'room-test' && currentRoom.id !== 'room-1') {
      await supabase.from('rooms').update({ settings }).eq('id', currentRoom.id);
    }
    set({ currentRoom: { ...currentRoom, settings } });
  },

  proposeDraw: async () => {
    const { currentRoom, currentUser } = get();
    if (!currentRoom || !currentUser || currentRoom.status !== 'PLAYING' || currentRoom.drawOfferFrom) return;
    if (currentRoom.id !== 'room-test' && currentRoom.id !== 'room-1') {
      await supabase.from('rooms').update({ drawOfferFrom: currentUser.id }).eq('id', currentRoom.id);
    }
    set({ currentRoom: { ...currentRoom, drawOfferFrom: currentUser.id } });
  },

  respondToDraw: async (accept) => {
    const { currentRoom, currentUser } = get();
    if (!currentRoom || !currentUser || !currentRoom.drawOfferFrom) return;
    let updated = { ...currentRoom, drawOfferFrom: null };
    if (accept) {
      updated.status = 'FINISHED';
      if (updated.gameState) updated.gameState.winner = 'DRAW';
    }
    if (currentRoom.id !== 'room-test' && currentRoom.id !== 'room-1') {
      await supabase.from('rooms').update({ status: updated.status, gameState: updated.gameState, drawOfferFrom: null }).eq('id', currentRoom.id);
    }
    set({ currentRoom: updated });
  },

  leaveRoom: async () => {
    const { currentUser, currentRoom } = get();
    if (!currentRoom || !currentUser) return;
    if (currentRoom.id !== 'room-test' && currentRoom.id !== 'room-1') {
      const updated = { ...currentRoom };
      updated.players = updated.players.map(p => p?.id === currentUser.id ? null : p);
      updated.spectators = updated.spectators.filter(s => s.id !== currentUser.id);
      if (updated.status === 'PLAYING' && updated.gameState && !updated.gameState.winner) {
        const pIdx = currentRoom.players.findIndex(p => p?.id === currentUser.id);
        if (pIdx !== -1) {
          updated.gameState.winner = pIdx === 0 ? 'RED' : 'WHITE';
          updated.status = 'FINISHED';
        }
      }
      if (updated.players.every(p => p === null) && updated.spectators.length === 0) {
        await supabase.from('rooms').delete().eq('id', currentRoom.id);
      } else {
        await supabase.from('rooms').update(updated).eq('id', currentRoom.id);
      }
      supabase.removeAllChannels();
    }
    set({ currentRoom: null });
  },

  startGame: async () => {
    const { currentRoom, currentUser } = get();
    if (!currentRoom || !currentUser) return;
    if (currentRoom.id !== 'room-test' && currentRoom.hostId !== currentUser.id && currentRoom.status === 'WAITING') return;
    let players = [...currentRoom.players];
    if (currentRoom.status === 'FINISHED') players = [players[1], players[0]];
    const gs: GameState = {
      board: createInitialBoard(),
      turn: 'WHITE',
      timers: { WHITE: currentRoom.settings.timeLimit * 60, RED: currentRoom.settings.timeLimit * 60 },
      history: [],
      lastMoveTime: Date.now()
    };
    const payload = { status: 'PLAYING' as RoomStatus, gameState: gs, players, drawOfferFrom: null };
    if (currentRoom.id !== 'room-test' && currentRoom.id !== 'room-1') {
      await supabase.from('rooms').update(payload).eq('id', currentRoom.id);
    }
    set({ currentRoom: { ...currentRoom, ...payload } });
  },

  makeMove: async (move) => {
    const { currentRoom } = get();
    if (!currentRoom || !currentRoom.gameState) return;
    const gs = { ...currentRoom.gameState };
    const board = gs.board.map(r => [...r]);
    const piece = board[move.from.row][move.from.col]!;
    if (move.captured) {
      move.captured.forEach(id => {
        for(let r=0; r<8; r++) for(let c=0; c<8; c++) if(board[r][c]?.id === id) board[r][c] = null;
      });
    }
    board[move.from.row][move.from.col] = null;
    board[move.to.row][move.to.col] = { ...piece, row: move.to.row, col: move.to.col, type: move.isKingPromotion ? 'KING' : piece.type };
    gs.timers[gs.turn] += currentRoom.settings.increment;
    gs.board = board;
    gs.turn = gs.turn === 'WHITE' ? 'RED' : 'WHITE';
    gs.history = [...gs.history, move];
    gs.lastMoveTime = Date.now();
    if (getLegalMoves(board, gs.turn).length === 0) gs.winner = gs.turn === 'WHITE' ? 'RED' : 'WHITE';
    if (currentRoom.id !== 'room-test' && currentRoom.id !== 'room-1') {
      await supabase.from('rooms').update({ gameState: gs }).eq('id', currentRoom.id);
    }
    set({ currentRoom: { ...currentRoom, gameState: gs } });
  },

  tickTimers: () => {
    const { currentRoom } = get();
    if (!currentRoom || currentRoom.status !== 'PLAYING' || !currentRoom.gameState || currentRoom.gameState.history.length === 0) return;
    const gs = { ...currentRoom.gameState };
    if (gs.timers[gs.turn] > 0) {
      gs.timers[gs.turn] -= 1;
      if (gs.timers[gs.turn] <= 0) {
        gs.timers[gs.turn] = 0;
        gs.winner = gs.turn === 'WHITE' ? 'RED' : 'WHITE';
        set({ currentRoom: { ...currentRoom, status: 'FINISHED', gameState: gs } });
        return;
      }
      set({ currentRoom: { ...currentRoom, gameState: gs } });
    }
  },

  sendMessage: async (text) => {
    const { currentRoom, currentUser } = get();
    if (!currentRoom || !currentUser) return;
    const msg: ChatMessage = { id: Math.random().toString(), senderId: currentUser.id, senderName: currentUser.name, text, timestamp: Date.now() };
    if (currentRoom.id !== 'room-test' && currentRoom.id !== 'room-1') {
      await supabase.from('chat_messages').insert([{ room_id: currentRoom.id, senderId: msg.senderId, senderName: msg.senderName, text: msg.text, timestamp: msg.timestamp }]);
    } else {
      set({ currentRoom: { ...currentRoom, chat: [...currentRoom.chat, msg] } });
    }
  }
}));
