
import React from 'react';
import { Home, Trophy, User } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-blue-900/50 flex items-center justify-around px-4 z-50">
      <button 
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-blue-400' : 'text-slate-400'}`}
      >
        <Home size={24} />
        <span className="text-xs font-medium">Início</span>
      </button>
      <button 
        onClick={() => onTabChange('ranking')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'ranking' ? 'text-blue-400' : 'text-slate-400'}`}
      >
        <Trophy size={24} />
        <span className="text-xs font-medium">Ranking</span>
      </button>
      <button 
        onClick={() => onTabChange('profile')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-blue-400' : 'text-slate-400'}`}
      >
        <User size={24} />
        <span className="text-xs font-medium">Perfil</span>
      </button>
    </nav>
  );
};
