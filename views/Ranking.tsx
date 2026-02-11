
import React, { useEffect } from 'react';
import { Trophy, Medal, Star, ArrowLeft } from 'lucide-react';
import { useStore } from '../store';

interface RankingProps {
  onBack?: () => void;
}

export const Ranking: React.FC<RankingProps> = ({ onBack }) => {
  const { rankings, syncRankings } = useStore();

  useEffect(() => {
    syncRankings();
  }, [syncRankings]);

  return (
    <div className="p-4 pb-24 overflow-y-auto h-full bg-slate-950">
      <header className="mb-8 flex items-center gap-4">
        {onBack && (
            <button 
                onClick={onBack}
                className="p-2 bg-slate-900 rounded-full border border-slate-800 hover:border-blue-500 transition-all text-slate-400 hover:text-blue-400"
            >
                <ArrowLeft size={20} />
            </button>
        )}
        <div>
          <h1 className="text-3xl font-orbitron text-blue-400 neon-blue">RANKING</h1>
          <p className="text-slate-400 text-sm">Os melhores mestres do tabuleiro</p>
        </div>
      </header>

      <div className="bg-slate-900 rounded-2xl border border-blue-900/30 overflow-hidden">
        {rankings.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            Carregando ranking...
          </div>
        ) : (
          rankings.map((user, idx) => {
            const rank = idx + 1;
            return (
              <div 
                key={user.id}
                className={`flex items-center justify-between p-4 border-b border-slate-800 last:border-0 ${idx < 3 ? 'bg-blue-500/5' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 flex justify-center">
                    {rank === 1 ? <Trophy size={24} className="text-amber-400" /> :
                     rank === 2 ? <Medal size={22} className="text-slate-300" /> :
                     rank === 3 ? <Medal size={20} className="text-amber-700" /> :
                     <span className="text-slate-500 font-bold">{rank}</span>}
                  </div>
                  <div>
                    <p className={`font-bold ${idx < 3 ? 'text-white' : 'text-slate-300'}`}>{user.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{user.wins || 0} VITÓRIAS</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-orbitron text-blue-400 text-lg">{user.rating}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">PTS</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 flex items-center gap-4">
         <Star className="text-blue-400" />
         <div>
             <p className="text-sm font-bold text-blue-100">Alcance o Top 10 para ganhar insignias!</p>
             <p className="text-[10px] text-slate-400 uppercase">Temporada atual em curso</p>
         </div>
      </div>
    </div>
  );
};
