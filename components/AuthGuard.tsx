
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
    // Check if configuration exists
    if (!isSupabaseConfigured) {
      setConfigError(true);
      return;
    }

    // Attempt to recover session if it exists (optional, mostly for consistency)
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
          if (session.user.email) {
            checkUser(session.user.email);
          }
        }
      } catch (err) {
        console.error("Auth init error", err);
      }
    };
    initAuth();
  }, []);

  const checkUser = (email: string) => {
    const lowerEmail = email.toLowerCase();
    
    // Check Domain
    if (!lowerEmail.endsWith('@v4company.com')) {
      setMessage('Acesso restrito a emails @v4company.com');
      return;
    }
    
    // Determine Role
    const role = ADMIN_EMAILS.includes(lowerEmail) ? 'admin' : 'viewer';
    
    // Grant Access Immediately
    onLogin({ email: lowerEmail, role });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const lowerEmail = email.toLowerCase();

    // 1. Simple Domain Validation
    if (!lowerEmail.endsWith('@v4company.com')) {
      setMessage('É necessário um e-mail @v4company.com para acessar.');
      setLoading(false);
      return;
    }

    // 2. Direct Access (Bypass OTP/Magic Link)
    // We simulate a network delay for UX, then log the user in directly.
    setTimeout(() => {
      setLoading(false);
      checkUser(lowerEmail);
    }, 600);
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
             Não foi possível conectar ao banco de dados. Verifique as chaves de API.
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

  // If we have a session from a previous real login, just pass through
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
            Commercial Intelligence Platform
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
                  placeholder="seu.nome@v4company.com"
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
              <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-red-50 text-red-600">
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
              {loading ? 'Acessando...' : 'Acessar Plataforma'}
            </button>
          </form>
          
          {/* Removed restriction text as requested */}
        </div>
      </div>
    </div>
  );
};
