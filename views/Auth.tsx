
import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';

export const Auth: React.FC = () => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setCurrentUser } = useStore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'REGISTER') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name }
          }
        });

        if (signUpError) throw signUpError;
        
        if (data.user) {
          await setCurrentUser({
            id: data.user.id,
            name: name || 'Novo Jogador',
            rating: 1200,
            isOnline: true
          });
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          await setCurrentUser({
            id: data.user.id,
            name: data.user.user_metadata.display_name || 'Jogador',
            rating: 1200,
            isOnline: true
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setCurrentUser({
      id: 'guest-' + Math.random().toString(36).substr(2, 9),
      name: 'Visitante ' + Math.floor(Math.random() * 1000),
      rating: 1200,
      isOnline: true
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 overflow-y-auto">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-[120px] -z-10" />

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-slate-900 border-2 border-blue-500/30 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl neon-border rotate-3">
             <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
               <span className="text-2xl font-bold text-white">M</span>
             </div>
          </div>
          <h1 className="text-4xl font-orbitron text-blue-400 neon-blue mb-2">MASTER DAMAS</h1>
          <p className="text-slate-500 uppercase tracking-[0.2em] text-[10px] font-bold">Arena de Elite Online</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-blue-900/30 rounded-3xl overflow-hidden shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button 
              onClick={() => setMode('LOGIN')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${mode === 'LOGIN' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => setMode('REGISTER')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${mode === 'REGISTER' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleAuth} className="p-8 space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-xl text-red-400 text-xs text-center font-bold">
                {error}
              </div>
            )}

            {mode === 'REGISTER' && (
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Nome de Usuário</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como quer ser chamado?"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold neon-border shadow-lg transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {mode === 'LOGIN' ? 'ENTRAR NA ARENA' : 'CRIAR MINHA CONTA'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="px-8 pb-8">
            <div className="relative flex items-center py-2 mb-4">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-600 font-bold uppercase">ou</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>
            
            <button 
              onClick={handleGuestLogin}
              className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-300 py-3 rounded-xl text-sm font-bold transition-all"
            >
              ENTRAR COMO VISITANTE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
