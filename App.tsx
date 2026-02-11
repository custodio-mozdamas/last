
import React, { useState } from 'react';
import { Home } from './views/Home';
import { Ranking } from './views/Ranking';
import { Profile } from './views/Profile';
import { Game } from './views/Game';
import { Auth } from './views/Auth';
import { Navigation } from './components/Navigation';
import { useStore } from './store';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { currentRoom, currentUser } = useStore();

  // Se não houver usuário logado, mostra a tela de autenticação
  if (!currentUser) {
    return <Auth />;
  }

  // Se estiver em uma sala, a tela do jogo assume o controle
  if (currentRoom) {
    return <Game />;
  }

  return (
    <div className="h-screen flex flex-col max-w-lg mx-auto bg-slate-950 relative border-x border-slate-900 shadow-2xl">
      <main className="flex-1 overflow-hidden">
        {activeTab === 'home' && <Home />}
        {activeTab === 'ranking' && <Ranking onBack={() => setActiveTab('home')} />}
        {activeTab === 'profile' && <Profile onBack={() => setActiveTab('home')} />}
      </main>
      
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Glow effects */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
    </div>
  );
};

export default App;
