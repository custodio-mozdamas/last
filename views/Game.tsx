
import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Send, X, Flag, HelpCircle, MessageCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useStore } from '../store';
import { Board } from '../components/Board';
import { PieceColor } from '../types';

export const Game: React.FC = () => {
  const { 
    currentRoom, 
    currentUser, 
    leaveRoom, 
    startGame, 
    makeMove, 
    sendMessage, 
    tickTimers,
    proposeDraw,
    acceptDraw,
    rejectDraw
  } = useStore();
  
  const [showMenu, setShowMenu] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  if (!currentRoom || !currentUser) return null;

  const playerSeat = currentRoom.players.findIndex(p => p?.id === currentUser.id);
  const isSpectator = playerSeat === -1;
  const isTestRoom = currentRoom.id === 'room-test';
  const isHost = currentRoom.hostId === currentUser.id;
  
  const playerColor: PieceColor | undefined = isTestRoom ? undefined : (playerSeat === 0 ? 'WHITE' : playerSeat === 1 ? 'RED' : undefined);

  const player1 = currentRoom.players[0];
  const player2 = currentRoom.players[1];

  useEffect(() => {
    let interval: number | undefined;
    if (currentRoom.status === 'PLAYING' && !currentRoom.gameState?.winner) {
      interval = window.setInterval(() => {
        tickTimers();
      }, 1000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [currentRoom.status, currentRoom.gameState?.winner, tickTimers]);

  useEffect(() => {
    if (showChat) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentRoom.chat, showChat]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const handleConfirmLeave = () => {
    leaveRoom();
    setShowExitConfirm(false);
  };

  const isGameInMotion = (currentRoom.gameState?.history.length || 0) > 0;
  const hasDrawOffer = !!currentRoom.drawOfferFrom;
  const isMyOffer = currentRoom.drawOfferFrom === currentUser.id;

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
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-blue-900/30 rounded-lg shadow-2xl p-2 z-[110]">
              <button 
                onClick={() => { setShowExitConfirm(true); setShowMenu(false); }}
                className="w-full text-left p-2 hover:bg-slate-800 rounded flex items-center gap-2 text-sm"
              >
                <Flag size={14} className="text-red-500" /> Desistir
              </button>
              <button 
                onClick={() => { proposeDraw(); setShowMenu(false); }}
                disabled={hasDrawOffer}
                className={`w-full text-left p-2 hover:bg-slate-800 rounded flex items-center gap-2 text-sm ${hasDrawOffer ? 'opacity-50 grayscale' : ''}`}
              >
                <HelpCircle size={14} className="text-blue-500" /> Propor Empate
              </button>
              <div className="border-t border-slate-800 my-1" />
              <button onClick={() => { setShowChat(!showChat); setShowMenu(false); }} className="w-full text-left p-2 hover:bg-slate-800 rounded flex items-center gap-2 text-sm">
                <MessageCircle size={14} /> Chat da Sala
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Opponent Info */}
      <div className="w-full max-w-[500px] flex justify-between items-end mb-4 p-2 bg-slate-900/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
            {player2 ? player2.name[0] : '?'}
          </div>
          <div>
            <p className="font-bold text-sm">{player2?.name || (isTestRoom ? 'Modo Solo' : 'Aguardando...')}</p>
            <p className="text-[10px] text-slate-400">{player2?.rating || '---'} pts</p>
          </div>
        </div>
        <div className="text-right">
            <div className={`font-orbitron text-xl ${currentRoom.gameState?.turn === 'RED' ? (isGameInMotion ? 'text-blue-400 animate-pulse' : 'text-blue-400/70') : 'text-slate-500'}`}>
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
              {isHost ? 'Você é o dono da sala. Pode iniciar a partida agora.' : (isTestRoom ? 'Modo de teste: Você pode iniciar a partida sozinho.' : 'A partida iniciará assim que ambos os jogadores confirmarem.')}
            </p>
            <div className="flex gap-4">
               {(player1 && player2) || isHost || isTestRoom ? (
                   <button 
                    onClick={startGame}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold neon-border transition-all"
                   >
                     INICIAR PARTIDA
                   </button>
               ) : (
                   <div className="flex flex-col items-center gap-2">
                       <div className="flex gap-2">
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${player1 ? 'border-green-500 bg-green-500/20' : 'border-slate-700 bg-slate-800 animate-pulse'}`}>
                               {player1 ? '✓' : ''}
                           </div>
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${player2 ? 'border-green-500 bg-green-500/20' : 'border-slate-700 bg-slate-800 animate-pulse'}`}>
                               {player2 ? '✓' : ''}
                           </div>
                       </div>
                       <span className="text-xs text-slate-500">Esperando oponente...</span>
                   </div>
               )}
            </div>
          </div>
        ) : (
          <>
            <Board 
              board={currentRoom.gameState!.board}
              turn={currentRoom.gameState!.turn}
              playerColor={playerColor}
              theme={currentRoom.settings.theme}
              onMove={makeMove}
              isSpectator={isSpectator}
            />
            
            {/* Draw Offer Overlay */}
            {hasDrawOffer && (
              <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <div className="bg-slate-900 border border-blue-500/50 p-6 rounded-2xl shadow-2xl max-w-[280px] text-center">
                   {isMyOffer ? (
                     <>
                       <p className="text-blue-400 font-bold mb-4">Empate proposto...</p>
                       <p className="text-xs text-slate-400 mb-6">Aguardando resposta do adversário.</p>
                       <button onClick={rejectDraw} className="w-full bg-slate-800 py-2 rounded-lg text-xs font-bold hover:bg-slate-700">CANCELAR PEDIDO</button>
                     </>
                   ) : (
                     <>
                       <p className="text-blue-400 font-bold mb-4">Oponente propôs empate!</p>
                       <p className="text-xs text-slate-400 mb-6">Deseja encerrar a partida agora?</p>
                       <div className="flex gap-3">
                          <button onClick={rejectDraw} className="flex-1 bg-slate-800 py-2 rounded-lg text-xs font-bold hover:bg-slate-700">RECUSAR</button>
                          <button onClick={acceptDraw} className="flex-1 bg-blue-600 py-2 rounded-lg text-xs font-bold hover:bg-blue-500 shadow-lg shadow-blue-500/20">ACEITAR</button>
                       </div>
                     </>
                   )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Self Info */}
      <div className="w-full max-w-[500px] flex justify-between items-start mt-4 p-2 bg-slate-900/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-900 font-bold text-sm">
            {player1?.name[0] || '?'}
          </div>
          <div>
            <p className="font-bold text-sm">{player1?.name || 'Seu lugar'}</p>
            <p className="text-[10px] text-slate-400">{player1?.rating || '---'} pts</p>
          </div>
        </div>
        <div className="text-right">
            <div className={`font-orbitron text-xl ${currentRoom.gameState?.turn === 'WHITE' ? (isGameInMotion || !isGameInMotion ? 'text-blue-400' : 'text-slate-500') : 'text-slate-500'} ${currentRoom.gameState?.turn === 'WHITE' && isGameInMotion ? 'animate-pulse' : ''}`}>
                {Math.floor((currentRoom.gameState?.timers.WHITE || 0) / 60)}:{(currentRoom.gameState?.timers.WHITE || 0) % 60 < 10 ? '0' : ''}{(currentRoom.gameState?.timers.WHITE || 0) % 60}
            </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 w-full max-sm shadow-2xl">
                <div className="flex items-center gap-3 text-red-400 mb-4">
                    <AlertTriangle size={24} />
                    <h3 className="text-lg font-bold">Confirmar Saída</h3>
                </div>
                <p className="text-slate-300 mb-6">
                    {currentRoom.status === 'PLAYING' 
                        ? "Tem certeza que deseja sair da partida? Ao sair, você perderá a partida e será removido da sala." 
                        : "Tem certeza que deseja sair da sala?"}
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowExitConfirm(false)}
                        className="flex-1 bg-slate-800 py-3 rounded-xl font-bold text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirmLeave}
                        className="flex-1 bg-red-600 py-3 rounded-xl font-bold text-white shadow-lg shadow-red-900/20 hover:bg-red-500 transition-colors"
                    >
                        Sair
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Chat Overlay */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-end justify-center">
            <div className="bg-slate-900 w-full max-w-lg rounded-t-3xl flex flex-col h-[70vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-blue-900/50">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h4 className="font-orbitron text-blue-400">CHAT DA SALA</h4>
                    <button onClick={() => setShowChat(false)} className="text-slate-400"><X size={20} /></button>
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
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleSendChat()}
                      placeholder="Sua mensagem..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
                    />
                    <button onClick={handleSendChat} className="bg-blue-600 text-white p-2 rounded-lg"><Send size={20} /></button>
                </div>
            </div>
        </div>
      )}

      {/* Game Over Modal */}
      {currentRoom.gameState?.winner && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[300] p-4">
            <div className="bg-slate-900 border-2 border-blue-500/50 rounded-3xl p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                <div className="text-5xl mb-4">🏆</div>
                <h2 className="text-3xl font-orbitron text-blue-400 mb-2">FIM DE JOGO</h2>
                <p className="text-slate-300 text-lg mb-6">
                    {currentRoom.gameState.winner === 'DRAW' ? 'EMPATE!' : 
                     (currentRoom.gameState.winner === playerColor ? 'VOCÊ VENCEU!' : 'VITÓRIA DO ADVERSÁRIO!')}
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={leaveRoom}
                      className="bg-slate-800 py-3 rounded-xl font-bold"
                    >
                      SAIR
                    </button>
                    <button 
                      onClick={startGame}
                      className="bg-blue-600 py-3 rounded-xl font-bold neon-border"
                    >
                      REFORMA
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
