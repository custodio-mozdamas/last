
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
        return;
      } else {
        // Criar perfil se não existir
        const newProfile = {
          id: user.id,
          name: user.name,
          rating: 1200,
          wins: 0,
          losses: 0,
          draws: 0
        };
        await supabase.from('profiles').insert([newProfile]);
        set({ currentUser: { ...user, ...newProfile } });
        return;
      }
    }
    set({ currentUser: user });
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
      // Filtra salas que por ventura estejam vazias no banco antes de exibir no lobby
      const activeRooms = (data as Room[]).filter(r => r.players.some(p => p !== null));
      set({ rooms: [...activeRooms, ...initialRooms] });
    }
  },

  syncRankings: async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('rating', { ascending: false })
      .limit(50);
    
    if (data) {
      set({ rankings: data as Player[] });
    }
  },

  subscribeToRoom: (roomId: string) => {
    if (roomId === 'room-test' || roomId === 'room-1') return;

    supabase.channel(`room:${roomId}`).unsubscribe();

    supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'rooms', 
        filter: `id=eq.${roomId}` 
      }, (payload) => {
        set({ currentRoom: payload.new as Room });
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages', 
        filter: `room_id=eq.${roomId}` 
      }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        set(state => {
          if (!state.currentRoom) return state;
          if (state.currentRoom.chat.some(m => m.id === newMessage.id)) return state;
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
      else if (!newPlayers[1] && newPlayers[0].id !== user.id) newPlayers[1] = user;
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
      
      if (updatedRoom.status === 'PLAYING' && updatedRoom.gameState && !updatedRoom.gameState.winner) {
        const playerIndex = currentRoom.players.findIndex(p => p?.id === currentUser.id);
        updatedRoom.gameState.winner = playerIndex === 0 ? 'RED' : 'WHITE';
        updatedRoom.status = 'FINISHED';
      }

      // Verifica se a sala ficou vazia após a saída
      const isRoomEmpty = updatedRoom.players.every(p => p === null);

      if (isRoomEmpty) {
        // Remove a sala permanentemente do banco se estiver vazia
        await supabase.from('rooms').delete().eq('id', currentRoom.id);
      } else {
        // Caso contrário, apenas atualiza o estado
        await supabase.from('rooms').update(updatedRoom).eq('id', currentRoom.id);
      }
      
      supabase.removeAllChannels();
    }
    
    set({ currentRoom: null });
  },

  startGame: async () => {
    const { currentRoom, currentUser } = get();
    if (!currentRoom || !currentUser) return;
    
    const isTest = currentRoom.id === 'room-test';
    const isHost = currentRoom.hostId === currentUser.id;
    
    if (!isTest && !isHost && (!currentRoom.players[0] || !currentRoom.players[1])) return;

    // Inversão de cores sucessiva: troca a posição dos jogadores no array players ao iniciar revanche (REFORMA)
    let players = [...currentRoom.players];
    if (currentRoom.status === 'FINISHED') {
      players = [players[1], players[0]];
    }

    const initialBoard = createInitialBoard();
    const gameState: GameState = {
      board: initialBoard,
      turn: 'WHITE' as PieceColor,
      timers: { WHITE: currentRoom.settings.timeLimit * 60, RED: currentRoom.settings.timeLimit * 60 },
      history: [],
      lastMoveTime: Date.now()
    };

    const updatePayload: { status: RoomStatus; gameState: GameState; players: (Player | null)[] } = {
      status: 'PLAYING',
      gameState: gameState,
      players: players
    };

    if (currentRoom.id !== 'room-test' && currentRoom.id !== 'room-1') {
      await supabase.from('rooms').update(updatePayload).eq('id', currentRoom.id);
    }

    set({ currentRoom: { ...currentRoom, ...updatePayload } });
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
    set({ currentRoom: updatedRoom });

    if (currentRoom.id !== 'room-test' && currentRoom.id !== 'room-1') {
      await supabase.from('rooms').update({ gameState: gs }).eq('id', currentRoom.id);
    }
  },

  tickTimers: () => {
    const { currentRoom } = get();
    if (!currentRoom || currentRoom.status !== 'PLAYING' || !currentRoom.gameState) return;

    // Apenas decrementa o tempo se pelo menos uma jogada foi realizada
    if (currentRoom.gameState.history.length === 0) return;

    const gs = { ...currentRoom.gameState };
    const turn = gs.turn;
    
    if (gs.timers[turn] > 0) {
      gs.timers[turn] -= 1;
      
      if (gs.timers[turn] <= 0) {
        gs.timers[turn] = 0;
        gs.winner = turn === 'WHITE' ? 'RED' : 'WHITE';
        const updated: Room = { ...currentRoom, status: 'FINISHED', gameState: gs };
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
      await supabase.from('chat_messages').insert([{ 
        id: msg.id,
        room_id: currentRoom.id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        text: msg.text,
        timestamp: msg.timestamp
      }]);
    } else {
      set({ currentRoom: { ...currentRoom, chat: [...currentRoom.chat, msg] } });
    }
  }
}));
