
import React from 'react';
import { Settings, LogOut, Camera, History, Target, ShieldCheck, X, ArrowLeft } from 'lucide-react';
import { useStore } from '../store';

interface ProfileProps {
  onBack?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onBack }) => {
  const { currentUser, setCurrentUser, updateUser } = useStore();

  if (!currentUser) return null;

  const totalGames = (currentUser.wins || 0) + (currentUser.losses || 0) + (currentUser.draws || 0);
  const accuracy = totalGames > 0 ? Math.round(((currentUser.wins || 0) / totalGames) * 100) : 0;

  const stats = [
    { label: 'Vitórias', value: currentUser.wins || 0, icon: <Target size={18} className="text-green-500" /> },
    { label: 'Derrotas', value: currentUser.losses || 0, icon: <X size={18} className="text-red-500" /> },
    { label: 'Empates', value: currentUser.draws || 0, icon: <History size={18} className="text-blue-500" /> },
    { label: 'Precisão', value: `${accuracy}%`, icon: <ShieldCheck size={18} className="text-amber-500" /> },
  ];

  return (
    <div className="p-4 pb-24 overflow-y-auto h-full bg-slate-950">
      <header className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
            {onBack && (
                <button 
                    onClick={onBack}
                    className="p-2 bg-slate-900 rounded-full border border-slate-800 hover:border-blue-500 transition-all text-slate-400 hover:text-blue-400"
                >
                    <ArrowLeft size={20} />
                </button>
            )}
            <h1 className="text-3xl font-orbitron text-blue-400 neon-blue">PERFIL</h1>
        </div>
        <button className="text-slate-400 hover:text-white transition-colors"><Settings size={24} /></button>
      </header>

      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-blue-500/50 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            {currentUser.avatar ? (
                <img src={currentUser.avatar} className="w-full h-full object-cover" />
            ) : (
                <span className="text-4xl font-orbitron text-slate-600">{currentUser.name[0]}</span>
            )}
          </div>
          <button className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border border-slate-900 text-white shadow-lg hover:bg-blue-500 transition-colors">
            <Camera size={16} />
          </button>
        </div>
        
        <input 
          type="text" 
          value={currentUser.name}
          onChange={(e) => updateUser({ name: e.target.value })}
          className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-slate-800 focus:border-blue-500 outline-none text-center px-4 py-1 transition-all"
        />
        <div className="flex items-center gap-2 mt-1">
          <span className="text-blue-400 font-orbitron">{currentUser.rating}</span>
          <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Rating ELO</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-500 uppercase text-[10px] font-bold tracking-widest">
              {stat.label}
              {stat.icon}
            </div>
            <span className="text-2xl font-orbitron text-white">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
           <History size={20} className="text-blue-500" />
           Histórico Recente
        </h3>
        
        <div className="space-y-2">
           {totalGames === 0 ? (
               <p className="text-center text-slate-500 py-4 text-sm uppercase tracking-widest font-bold">Nenhuma partida registrada</p>
           ) : (
               <p className="text-center text-slate-500 py-4 text-xs font-bold text-blue-500/50">Histórico detalhado em breve</p>
           )}
        </div>
      </div>

      <button 
        onClick={() => setCurrentUser(null)}
        className="w-full mt-10 bg-red-900/20 border border-red-900/50 text-red-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-900/40 transition-all"
      >
        <LogOut size={20} /> Sair da Conta
      </button>
    </div>
  );
};
