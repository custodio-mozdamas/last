
import React from 'react';
import { Trophy, Medal, Star, ArrowLeft } from 'lucide-react';

interface RankingProps {
  onBack?: () => void;
}

export const Ranking: React.FC<RankingProps> = ({ onBack }) => {
  const rankingData = [
    { rank: 1, name: 'DamaMaster_01', rating: 2850, wins: 450 },
    { rank: 2, name: 'GambitoKing', rating: 2720, wins: 380 },
    { rank: 3, name: 'EstrategistaBR', rating: 2680, wins: 340 },
    { rank: 4, name: 'ChessDamas', rating: 2450, wins: 290 },
    { rank: 5, name: 'NinjaBoard', rating: 2310, wins: 210 },
    { rank: 6, name: 'ProPlayer88', rating: 2200, wins: 180 },
    { rank: 7, name: 'CheckMate', rating: 2150, wins: 155 },
  ];

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
        {rankingData.map((user, idx) => (
          <div 
            key={user.rank}
            className={`flex items-center justify-between p-4 border-b border-slate-800 last:border-0 ${idx < 3 ? 'bg-blue-500/5' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-8 flex justify-center">
                {user.rank === 1 ? <Trophy size={24} className="text-amber-400" /> :
                 user.rank === 2 ? <Medal size={22} className="text-slate-300" /> :
                 user.rank === 3 ? <Medal size={20} className="text-amber-700" /> :
                 <span className="text-slate-500 font-bold">{user.rank}</span>}
              </div>
              <div>
                <p className={`font-bold ${idx < 3 ? 'text-white' : 'text-slate-300'}`}>{user.name}</p>
                <p className="text-[10px] text-slate-500 uppercase">{user.wins} VITÓRIAS</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-orbitron text-blue-400 text-lg">{user.rating}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">PTS</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 flex items-center gap-4">
         <Star className="text-blue-400" />
         <div>
             <p className="text-sm font-bold text-blue-100">Alcance o Top 10 para ganhar insignias!</p>
             <p className="text-[10px] text-slate-400 uppercase">Temporada atual termina em 12 dias</p>
         </div>
      </div>
    </div>
  );
};
