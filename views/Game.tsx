
import React, { useState, useEffect, useRef } from 'react';
import { 
  MoreVertical, Send, X, Flag, HelpCircle, MessageCircle, ArrowLeft, 
  AlertTriangle, Users, Settings, UserCircle, Check, Handshake, Clock, Zap
} from 'lucide-react';
import { useStore } from '../store';
import { Board } from '../components/Board';
import { PieceColor } from '../types';

export const Game: React.FC = () => {
  const { 
    currentRoom, currentUser, leaveRoom, startGame, makeMove, sendMessage, 
    tickTimers, selectSeat, updateRoomSettings, proposeDraw, respondToDraw 
  } = useStore();
  
  const [showMenu, setShowMenu] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSpectators, setShowSpectators] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  if (!currentRoom || !currentUser) return null;

  const playerSeat = currentRoom.players.findIndex(p => p?.id === currentUser.id);
  const isSpectator = playerSeat === -1;
  const isTestRoom = currentRoom.id === 'room-test';
  const isHost = currentRoom.hostId === currentUser.id;
  const isPlaying = currentRoom.status === 'PLAYING';
  
  const playerColor: PieceColor | undefined = isTestRoom ? undefined : (playerSeat === 0 ? 'WHITE' : playerSeat === 1 ? 'RED' : undefined);
  const player1 = currentRoom.players[0];
  const player2 = currentRoom.players[1];

  useEffect(() => {
    let interval: number | undefined;
    if (isPlaying && !currentRoom.gameState?.winner) {
      interval = window.setInterval(() => tickTimers(), 1000);
    }
    return () => { if (interval) window.clearInterval(interval); };
  }, [isPlaying, currentRoom.gameState?.winner, tickTimers]);

  useEffect(() => {
    if (showChat) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentRoom.chat, showChat]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const isGameInMotion = (currentRoom.gameState?.history.length || 0) > 0;
  const hasDrawOffer = !!currentRoom.drawOfferFrom;
  const isReceivedDrawOffer = hasDrawOffer && currentRoom.drawOfferFrom !== currentUser.id;

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center p-4 overflow-hidden">
      {/* Header */}
      <header className="w-full max-w-[600px] flex justify-between items-center mb-4">
        <button 
          onClick={() => setShowExitConfirm(true)} 
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-all group bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-blue-500/50"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Voltar</span>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-blue-400 font-orbitron neon-blue text-lg">{currentRoom.name}</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">{currentRoom.type}</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="text-slate-400 p-1.5 hover:text-white transition-colors">
            <MoreVertical size={24} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-blue-900/30 rounded-xl shadow-2xl p-2 z-[110]">
              {!isPlaying && (
                <>
                  <button onClick={() => { setShowSeatSelection(true); setShowMenu(false); }} className="w-full text-left p-3 hover:bg-slate-800 rounded-lg flex items-center gap-2 text-sm">
                    <UserCircle size={16} className="text-blue-400" /> Escolher Lugar
                  </button>
                  {isHost && (
                    <button onClick={() => { setShowSettings(true); setShowMenu(false); }} className="w-full text-left p-3 hover:bg-slate-800 rounded-lg flex items-center gap-2 text-sm">
                      <Settings size={16} className="text-amber-400" /> Configurações
                    </button>
                  )}
                </>
              )}
              <button onClick={() => { setShowSpectators(true); setShowMenu(false); }} className="w-full text-left p-3 hover:bg-slate-800 rounded-lg flex items-center gap-2 text-sm">
                <Users size={16} className="text-indigo-400" /> Espectadores ({currentRoom.spectators.length})
              </button>
              <div className="border-t border-slate-800 my-1" />
              {isPlaying && !isSpectator && (
                <>
                  <button onClick={() => { setShowExitConfirm(true); setShowMenu(false); }} className="w-full text-left p-3 hover:bg-slate-800 rounded-lg flex items-center gap-2 text-sm text-red-400">
                    <Flag size={16} /> Desistir
                  </button>
                  <button 
                    disabled={hasDrawOffer}
                    onClick={() => { proposeDraw(); setShowMenu(false); }} 
                    className="w-full text-left p-3 hover:bg-slate-800 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    <Handshake size={16} className="text-blue-400" /> Oferecer Empate
                  </button>
                </>
              )}
              <button onClick={() => { setShowChat(!showChat); setShowMenu(false); }} className="w-full text-left p-3 hover:bg-slate-800 rounded-lg flex items-center gap-2 text-sm">
                <MessageCircle size={16} /> Chat da Sala
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Opponent Info */}
      <div className="w-full max-w-[500px] flex justify-between items-end mb-4 p-2 bg-slate-900/50 rounded-lg border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(220,38,38,0.3)]">
            {player2 ? player2.name[0] : '?'}
          </div>
          <div>
            <p className="font-bold text-sm">{player2?.name || (isTestRoom ? 'Modo Solo' : 'Vago')}</p>
            <p className="text-[10px] text-slate-400">{player2?.rating || '---'} pts</p>
          </div>
        </div>
        <div className="text-right">
            <div className={`font-orbitron text-xl ${currentRoom.gameState?.turn === 'RED' ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`}>
                {Math.floor((currentRoom.gameState?.timers.RED || 0) / 60)}:{(currentRoom.gameState?.timers.RED || 0) % 60 < 10 ? '0' : ''}{(currentRoom.gameState?.timers.RED || 0) % 60}
            </div>
        </div>
      </div>

      {/* Board Area */}
      <div className="flex-1 flex items-center justify-center w-full max-w-[500px] relative">
        {currentRoom.status === 'WAITING' ? (
          <div className="flex flex-col items-center gap-6 p-8 bg-slate-900/80 rounded-2xl border border-blue-500/30 text-center backdrop-blur">
            <h3 className="text-xl font-bold">Pronto para começar?</h3>
            <p className="text-slate-400 text-sm">
              {isHost ? 'Você é o dono da sala. Pode iniciar a partida agora.' : (isTestRoom ? 'Modo de teste: Você pode iniciar a partida sozinho.' : 'A partida iniciará assim que o oponente entrar.')}
            </p>
            <div className="flex gap-4">
               {isHost || isTestRoom ? (
                   <button onClick={startGame} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold neon-border transition-all">
                     INICIAR PARTIDA
                   </button>
               ) : (
                   <div className="flex flex-col items-center gap-2">
                       <span className="text-xs text-slate-500 animate-pulse">Aguardando host iniciar...</span>
                   </div>
               )}
            </div>
          </div>
        ) : (
          <Board 
            board={currentRoom.gameState!.board}
            turn={currentRoom.gameState!.turn}
            playerColor={playerColor}
            theme={currentRoom.settings.theme}
            onMove={makeMove}
            isSpectator={isSpectator}
          />
        )}

        {/* Empate Overlay */}
        {isReceivedDrawOffer && (
          <div className="absolute inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
            <div className="bg-slate-900 border border-blue-500/50 p-6 rounded-2xl shadow-2xl text-center max-w-[280px]">
              <Handshake size={32} className="mx-auto text-blue-400 mb-4" />
              <h4 className="text-lg font-bold mb-2">Proposta de Empate</h4>
              <p className="text-xs text-slate-400 mb-6">O adversário ofereceu empate. Deseja aceitar?</p>
              <div className="flex gap-3">
                <button onClick={() => respondToDraw(false)} className="flex-1 bg-slate-800 py-2 rounded-lg text-xs font-bold">Recusar</button>
                <button onClick={() => respondToDraw(true)} className="flex-1 bg-blue-600 py-2 rounded-lg text-xs font-bold shadow-lg">Aceitar</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Self Info */}
      <div className="w-full max-w-[500px] flex justify-between items-start mt-4 p-2 bg-slate-900/50 rounded-lg border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 font-bold text-sm shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            {player1?.name[0] || '?'}
          </div>
          <div>
            <p className="font-bold text-sm">{player1?.name || 'Seu lugar'}</p>
            <p className="text-[10px] text-slate-400">{player1?.rating || '---'} pts</p>
          </div>
        </div>
        <div className="text-right">
            <div className={`font-orbitron text-xl ${currentRoom.gameState?.turn === 'WHITE' ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`}>
                {Math.floor((currentRoom.gameState?.timers.WHITE || 0) / 60)}:{(currentRoom.gameState?.timers.WHITE || 0) % 60 < 10 ? '0' : ''}{(currentRoom.gameState?.timers.WHITE || 0) % 60}
            </div>
        </div>
      </div>

      {/* Modais de Gerenciamento */}
      {showSeatSelection && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><UserCircle size={20} /> Escolher Lugar</h3>
            <div className="space-y-3">
              {[0, 1].map(idx => (
                <button 
                  key={idx}
                  disabled={!!currentRoom.players[idx] && currentRoom.players[idx]?.id !== currentUser.id}
                  onClick={() => { selectSeat(idx); setShowSeatSelection(false); }}
                  className={`w-full p-4 rounded-xl border flex items-center justify-between ${currentRoom.players[idx]?.id === currentUser.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-950'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-slate-100 text-slate-950' : 'bg-red-600 text-white'}`}>
                      {idx === 0 ? 'W' : 'R'}
                    </div>
                    <span className="text-sm font-bold">{currentRoom.players[idx]?.name || 'Disponível'}</span>
                  </div>
                  {currentRoom.players[idx]?.id === currentUser.id && <Check size={18} className="text-blue-400" />}
                </button>
              ))}
            </div>
            <button onClick={() => setShowSeatSelection(false)} className="w-full mt-6 py-3 text-slate-500 text-sm font-bold">FECHAR</button>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Settings size={20} /> Configurar Sala</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-2">Tempo (min)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 10, 15].map(t => (
                    <button key={t} onClick={() => updateRoomSettings({ timeLimit: t })} className={`py-2 rounded-lg border text-sm font-bold ${currentRoom.settings.timeLimit === t ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-800 bg-slate-950 text-slate-500'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-2">Incremento (seg)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 2, 5, 10].map(i => (
                    <button key={i} onClick={() => updateRoomSettings({ increment: i })} className={`py-2 rounded-lg border text-sm font-bold ${currentRoom.settings.increment === i ? 'border-amber-500 bg-amber-600 text-white' : 'border-slate-800 bg-slate-950 text-slate-500'}`}>{i}</button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full bg-blue-600 mt-8 py-3 rounded-xl font-bold">SALVAR</button>
          </div>
        </div>
      )}

      {showSpectators && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm h-[60vh] flex flex-col">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Users size={20} /> Espectadores</h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {currentRoom.spectators.map(s => (
                <div key={s.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-sm font-bold">{s.name}</span>
                  <span className="text-blue-400 font-orbitron text-xs">{s.rating} pts</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowSpectators(false)} className="w-full mt-4 py-3 text-slate-500 text-sm font-bold">FECHAR</button>
          </div>
        </div>
      )}

      {/* Exit/GameOver Modals (Mantidos conforme original mas garantindo funcionalidade) */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 w-full max-sm shadow-2xl">
                <h3 className="text-lg font-bold text-red-400 mb-2">Confirmar Saída</h3>
                <p className="text-slate-300 mb-6">Deseja realmente sair?</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowExitConfirm(false)} className="flex-1 bg-slate-800 py-3 rounded-xl font-bold">Cancelar</button>
                    <button onClick={() => { leaveRoom(); setShowExitConfirm(false); }} className="flex-1 bg-red-600 py-3 rounded-xl font-bold">Sair</button>
                </div>
            </div>
        </div>
      )}

      {showChat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-end justify-center">
            <div className="bg-slate-900 w-full max-w-lg rounded-t-3xl flex flex-col h-[70vh] border-t border-blue-900/50">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h4 className="font-orbitron text-blue-400">CHAT DA SALA</h4>
                    <button onClick={() => setShowChat(false)}><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {currentRoom.chat.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                            <span className="text-[10px] text-slate-500 mb-1">{msg.senderName}</span>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.senderId === currentUser.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <div className="p-4 bg-slate-950 flex gap-2">
                    <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendChat()} className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 outline-none" placeholder="Sua mensagem..."/>
                    <button onClick={handleSendChat} className="bg-blue-600 p-2 rounded-lg"><Send size={20} /></button>
                </div>
            </div>
        </div>
      )}

      {currentRoom.gameState?.winner && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[300] p-4 text-center">
            <div className="bg-slate-900 border-2 border-blue-500/50 rounded-3xl p-8 w-full max-w-sm shadow-[0_0_50px_rgba(59,130,246,0.3)]">
                <div className="text-5xl mb-4">🏆</div>
                <h2 className="text-3xl font-orbitron text-blue-400 mb-2">FIM DE JOGO</h2>
                <p className="text-slate-300 text-lg mb-6">{currentRoom.gameState.winner === 'DRAW' ? 'EMPATE!' : (currentRoom.gameState.winner === playerColor ? 'VOCÊ VENCEU!' : 'VITÓRIA DO ADVERSÁRIO!')}</p>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={leaveRoom} className="bg-slate-800 py-3 rounded-xl font-bold">SAIR</button>
                    <button onClick={startGame} className="bg-blue-600 py-3 rounded-xl font-bold neon-border">REFORMA</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
