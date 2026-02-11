
import React, { useState, useEffect } from 'react';
import { Plus, Users, Eye, Lock, Globe, Clock, Zap, Palette } from 'lucide-react';
import { useStore } from '../store';
import { Room } from '../types';

export const Home: React.FC = () => {
  const { rooms, createRoom, joinRoom, syncRooms } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Modal State
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [timeLimit, setTimeLimit] = useState<number>(5);
  const [increment, setIncrement] = useState<number>(2);
  const [theme, setTheme] = useState<'WOOD' | 'DARK' | 'GREEN' | 'MINIMAL'>('DARK');

  useEffect(() => {
    syncRooms();
    const interval = setInterval(syncRooms, 10000);
    return () => clearInterval(interval);
  }, [syncRooms]);

  const handleCreate = () => {
    if (!roomName.trim()) return;
    createRoom(roomName, roomType, { timeLimit, increment, theme });
    setShowCreateModal(false);
    setRoomName('');
    setTimeLimit(5);
    setIncrement(2);
    setTheme('DARK');
  };

  const getRoomStatusLabel = (room: Room) => {
    const playerCount = room.players.filter(Boolean).length;
    if (playerCount === 0) return "Vazia";
    if (playerCount === 1) return "1 jogador";
    return "2 jogadores (cheia)";
  };

  const getStatusColor = (room: Room) => {
    const playerCount = room.players.filter(Boolean).length;
    if (playerCount === 0) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (playerCount === 1) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const timeOptions = [1, 3, 5, 10, 15];
  const incrementOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const themeOptions: { id: 'WOOD' | 'DARK' | 'GREEN' | 'MINIMAL', label: string }[] = [
    { id: 'WOOD', label: 'Madeira clássica' },
    { id: 'DARK', label: 'Moderno escuro' },
    { id: 'GREEN', label: 'Verde tradicional' },
    { id: 'MINIMAL', label: 'Minimalista premium' }
  ];

  return (
    <div className="p-4 pb-24 overflow-y-auto h-full bg-slate-950">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-orbitron text-blue-400 neon-blue">MASTER DAMAS</h1>
          <p className="text-slate-400 text-sm">Arena Competitiva Online</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg neon-border transition-all"
          >
            <Plus size={24} />
          </button>
          <span className="text-[10px] text-blue-400 font-bold uppercase">Criar Sala</span>
        </div>
      </header>

      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Globe size={20} className="text-blue-500" />
          Salas Disponíveis
        </h2>
        
        {rooms.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            Nenhuma sala pública ativa no momento.
          </div>
        ) : (
          rooms.map(room => {
            const playerCount = room.players.filter(Boolean).length;
            const isFull = playerCount >= 2;

            return (
              <div 
                key={room.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center hover:border-blue-500/50 transition-colors group"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{room.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-400 flex items-center gap-1">
                      {room.type === 'PRIVATE' ? <Lock size={10} /> : <Globe size={10} />}
                      {room.type === 'PRIVATE' ? 'Privada' : 'Pública'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getStatusColor(room)}`}>
                      {getRoomStatusLabel(room)}
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <Users size={12} className="text-blue-500" />
                      {playerCount}/2 Jogadores
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <Eye size={12} className="text-slate-500" />
                      {room.spectators.length} Esp.
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => joinRoom(room.id, isFull)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-md ${isFull ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-blue-600 text-white hover:bg-blue-500 neon-border'}`}
                >
                  {isFull ? 'Espectador' : 'Jogar'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-blue-900/50 rounded-2xl p-6 w-full max-w-md shadow-2xl my-8">
            <h2 className="text-2xl font-orbitron text-blue-400 mb-6 flex items-center gap-2">
              <Plus size={24} /> Configurar Sala
            </h2>
            
            <div className="space-y-6">
              {/* Nome da Sala */}
              <div>
                <label className="text-xs uppercase text-slate-400 font-bold mb-2 block">Nome da Sala</label>
                <input 
                  type="text" 
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ex: Arena Pro Master"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Tipo de Sala */}
              <div>
                <label className="text-xs uppercase text-slate-400 font-bold mb-2 block">Tipo de Sala</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setRoomType('PUBLIC')}
                    className={`p-3 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm font-bold ${roomType === 'PUBLIC' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                  >
                    <Globe size={16} /> Pública
                  </button>
                  <button 
                    onClick={() => setRoomType('PRIVATE')}
                    className={`p-3 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm font-bold ${roomType === 'PRIVATE' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                  >
                    <Lock size={16} /> Privada
                  </button>
                </div>
              </div>

              {/* Tempo da Partida */}
              <div>
                <label className="text-xs uppercase text-slate-400 font-bold mb-2 block flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-500" /> Tempo da Partida (min)
                </label>
                <div className="flex flex-wrap gap-2">
                  {timeOptions.map(t => (
                    <button
                      key={t}
                      onClick={() => setTimeLimit(t)}
                      className={`min-w-[45px] py-2 rounded-lg border text-sm font-bold transition-all ${timeLimit === t ? 'bg-blue-500 border-blue-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Incremento por Jogada */}
              <div>
                <label className="text-xs uppercase text-slate-400 font-bold mb-2 block flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-500" /> Incremento (seg)
                </label>
                <div className="flex flex-wrap gap-2">
                  {incrementOptions.map(i => (
                    <button
                      key={i}
                      onClick={() => setIncrement(i)}
                      className={`min-w-[35px] py-2 rounded-lg border text-sm font-bold transition-all ${increment === i ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tema do Tabuleiro */}
              <div>
                <label className="text-xs uppercase text-slate-400 font-bold mb-2 block flex items-center gap-1.5">
                  <Palette size={14} className="text-emerald-500" /> Tema Profissional
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {themeOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      className={`p-3 rounded-lg border text-[11px] font-bold transition-all text-left truncate ${theme === opt.id ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-slate-800 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors text-slate-300"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreate}
                  className="flex-1 bg-blue-600 py-3 rounded-xl font-bold shadow-lg neon-border hover:bg-blue-500 transition-all text-white"
                >
                  Criar Sala
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
