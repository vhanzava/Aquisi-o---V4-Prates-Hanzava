
import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, IS_DEMO_MODE } from '../supabaseClient';
import { UserProfile, ADMIN_EMAILS } from '../types';
import { Lock, ShieldCheck, AlertCircle, Mail, Loader2, Database, LayoutTemplate } from 'lucide-react';

interface AuthGuardProps {
  onLogin: (user: UserProfile) => void;
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ onLogin, children }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [session, setSession] = useState<any>(null);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    // 1. Check configuration
    if (!isSupabaseConfigured) {
      setConfigError(true);
      return;
    }

    // If Demo Mode, don't check session, wait for manual login
    if (IS_DEMO_MODE) return;

    // 2. Check active session (Real Mode)
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        if (session?.user?.email) {
          checkUser(session.user.email);
        }
      } catch (err: any) {
        console.error("Auth initialization error:", err);
        if (err.message === 'Failed to fetch') {
          setConfigError(true);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.email) {
        checkUser(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = (email: string) => {
    const lowerEmail = email.toLowerCase();
    
    // Allow any email in Demo Mode for testing, but enforce domain check visually
    if (!lowerEmail.endsWith('@v4company.com')) {
      setMessage('Access Restricted: Only @v4company.com emails allowed.');
      if (!IS_DEMO_MODE) supabase.auth.signOut();
      return;
    }
    
    const role = ADMIN_EMAILS.includes(lowerEmail) ? 'admin' : 'viewer';
    onLogin({ email: lowerEmail, role });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const lowerEmail = email.toLowerCase();

    if (!lowerEmail.endsWith('@v4company.com')) {
      setMessage('Acesso restrito a emails @v4company.com');
      setLoading(false);
      return;
    }

    // --- DEMO MODE LOGIN ---
    if (IS_DEMO_MODE) {
      setTimeout(() => {
        setLoading(false);
        // Simulate successful login
        setSession({ user: { email: lowerEmail } });
        checkUser(lowerEmail);
      }, 800);
      return;
    }

    // --- REAL MODE LOGIN ---
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: lowerEmail,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      setMessage('Link de acesso enviado! Verifique seu email.');
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
         setMessage('Erro de conexão. Verifique a configuração do Supabase.');
         setConfigError(true);
      } else {
         setMessage(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (configError && !IS_DEMO_MODE) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full rounded-xl shadow-2xl p-8 text-center">
           <div className="flex justify-center mb-4">
             <div className="bg-red-100 p-3 rounded-full">
               <Database className="w-8 h-8 text-red-600" />
             </div>
           </div>
           <h2 className="text-2xl font-bold text-gray-800 mb-2">Configuração Pendente</h2>
           <p className="text-gray-600 mb-6">
             Não foi possível conectar ao banco de dados. Isso geralmente acontece quando as variáveis de ambiente não estão configuradas.
           </p>
           <button 
             onClick={() => window.location.reload()}
             className="bg-v4-red text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
           >
             Tentar Novamente
           </button>
        </div>
      </div>
    );
  }

  if (session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
        <div className="bg-v4-red h-2 w-full"></div>
        
        {IS_DEMO_MODE && (
          <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded border border-yellow-200 flex items-center gap-1">
             <LayoutTemplate className="w-3 h-3" /> DEMO MODE
          </div>
        )}

        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-red-50 p-3 rounded-full">
              <Lock className="w-8 h-8 text-v4-red" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            V4 Prates Hanzava
          </h2>
          <p className="text-center text-gray-500 mb-8 text-sm">
            {IS_DEMO_MODE 
              ? "Modo de Visualização (Dados Locais)" 
              : "Acesso Restrito V4 Company"}
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Corporativo
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-v4-red focus:border-transparent outline-none transition-all"
                  placeholder="admin@v4company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setMessage('');
                  }}
                />
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {message && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${message.includes('enviado') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                <AlertCircle className="w-4 h-4" />
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-v4-red text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {loading 
                ? 'Entrando...' 
                : IS_DEMO_MODE ? 'Entrar (Demo)' : 'Receber Link de Acesso'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
            {IS_DEMO_MODE 
              ? "Dica: Use vinicius.hanzava@v4company.com para acesso Admin" 
              : "Funciona apenas com domínios @v4company.com"}
          </div>
        </div>
      </div>
    </div>
  );
};
