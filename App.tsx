
import React, { useState, useEffect } from 'react';
import { AuthGuard } from './components/AuthGuard';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { DealTable } from './components/DealTable';
import { FunnelDashboard } from './components/FunnelDashboard';
import { AnnualEvolution } from './components/AnnualEvolution';
import { LeadBrokerSection } from './components/LeadBrokerSection';
import { DealBrokerSection } from './components/DealBrokerSection';
import { UserProfile, Deal, FunnelStats, MonthData, DealStatus, DealType, FunnelType } from './types';
import { useSupabaseData } from './hooks/useSupabaseData';
import { LayoutGrid, Users, LogOut, ChevronDown, ChevronRight, BarChart3, Coins, CalendarDays, Loader2, AlertCircle, WifiOff, Sparkles, Check, Copy } from 'lucide-react';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentTab, setCurrentTab] = useState<'acquisition' | 'monetization' | 'funnel' | 'annual'>('acquisition');
  const [selectedMonthId, setSelectedMonthId] = useState<string>(''); // Set after load
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);
  const [expandedYear, setExpandedYear] = useState<number | null>(2025);
  
  // Export State
  const [isCopied, setIsCopied] = useState(false);

  // Supabase Data Hook
  const { 
    months, deals: allDeals, funnelStats: allFunnelStats, loading, error,
    updateMonth, updateDeal, addDeal, deleteDeal, updateFunnel, createFunnelStats, refresh
  } = useSupabaseData(user?.email);

  // Set default month once data loads
  useEffect(() => {
    if (months.length > 0) {
      if (!selectedMonthId) {
        // Try to find current month, else first
        const today = new Date();
        const currentId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const found = months.find(m => m.id === currentId);
        setSelectedMonthId(found ? found.id : months[0].id);
      }
    }
  }, [months, selectedMonthId]);

  const selectedMonth = months.find(m => m.id === selectedMonthId);

  // FILTER DEALS BY TAB:
  // - Acquisition: show deals with pipeline_type='acquisition' OR null/undefined (legacy)
  // - Monetization: show deals with pipeline_type='monetization'
  const currentDeals = allDeals.filter(d => {
      const isMonetizationTab = currentTab === 'monetization';
      
      // Match ID
      if (d.month_id !== selectedMonthId) return false;

      // Match Pipeline Type
      if (isMonetizationTab) {
          return d.pipeline_type === 'monetization';
      } else {
          // Acquisition Tab (Default)
          return d.pipeline_type === 'acquisition' || !d.pipeline_type;
      }
  });
  
  // Group months by year for selector
  const years = Array.from(new Set(months.map(m => m.year))).sort();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // --- Handlers ---
  const handleUpdateDeal = (id: string, field: keyof Deal, value: any) => {
    updateDeal(id, field, value);
  };

  const handleDeleteDeal = (id: string) => {
    deleteDeal(id);
  }

  const handleAddDeal = () => {
    // Determine Pipeline Type
    const pipelineType = currentTab === 'monetization' ? 'monetization' : 'acquisition';
    
    // Determine Default Deal Type
    const defaultDealType = DealType.RECURRING;

    const newDeal: Partial<Deal> = {
      month_id: selectedMonthId,
      pipeline_type: pipelineType,
      client_name: currentTab === 'monetization' ? 'Novo Contrato Monetização' : 'Novo Cliente',
      status: DealStatus.PENDING,
      type: defaultDealType,
      value_mrr: 0,
      value_fixed: 0,
      acquisition_channel: FunnelType.OUTBOUND,
      sign_date: undefined,
      start_date: undefined,
      segment: ''
    };
    addDeal(newDeal);
  };

  const handleUpdateMonth = (field: keyof MonthData, value: number) => {
    if (selectedMonthId) {
        updateMonth(selectedMonthId, field, value);
    }
  };

  const handleUpdateFunnel = async (id: string, field: keyof FunnelStats, value: number) => {
    if (id.startsWith('temp_')) {
        const type = id.replace('temp_', '') as FunnelType;
        await createFunnelStats({
            month_id: selectedMonthId,
            funnel_type: type,
            [field]: value
        });
    } else {
        updateFunnel(id, field, value);
    }
  };

  // --- EXPORT FUNCTIONALITY ---
  const handleExportForAI = async () => {
    // 1. Prepare Data Structure
    const exportData = {
      context: "V4 Prates Hanzava - Dashboard Comercial",
      generated_at: new Date().toISOString(),
      data: {
        months_config: months,
        deals: allDeals,
        funnel_performance: allFunnelStats
      }
    };

    // 2. Create the Prompt Wrapper
    const promptText = `
[CONTEXTO PARA IA]
Abaixo estão os dados brutos (JSON) exportados do Dashboard Comercial da unidade V4 Prates Hanzava.
Este conjunto de dados contém:
1. "months_config": Metas financeiras, investimento e configurações de cada mês.
2. "deals": Lista de contratos/negócios (status, valores de MRR e Escopo, datas, canal de aquisição).
3. "funnel_performance": Métricas do funil de vendas (leads, reuniões, vendas, etc) por canal.

[SUA TAREFA]
Use esses dados para responder perguntas sobre performance, faturamento, gargalos de funil e projeções. Mantenha as respostas focadas em insights de negócios.

[DADOS JSON]
${JSON.stringify(exportData, null, 2)}
    `.trim();

    // 3. Copy to Clipboard
    try {
      await navigator.clipboard.writeText(promptText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
      alert('Erro ao copiar. Seu navegador pode não suportar essa função.');
    }
  };

  const getFunnelStatsForRender = () => {
      const types = [FunnelType.OUTBOUND, FunnelType.LEAD_BROKER, FunnelType.INDICATION];
      return types.map(type => {
          const existing = allFunnelStats.find(f => f.month_id === selectedMonthId && f.funnel_type === type);
          if (existing) return existing;
          return {
            id: `temp_${type}`,
            month_id: selectedMonthId,
            funnel_type: type,
            leads: 0, leads_worked: 0, calls: 0, call_duration_minutes: 0,
            connections: 0, meetings_scheduled: 0, meetings_realized: 0, sales: 0, invested_amount: 0
          } as FunnelStats;
      });
  };

  if (!user) {
      return <AuthGuard onLogin={setUser}>{null}</AuthGuard>;
  }

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 text-v4-red animate-spin" />
                  <p className="text-gray-500 font-medium">Sincronizando dados...</p>
              </div>
          </div>
      );
  }

  if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white max-w-lg w-full rounded-xl shadow-2xl p-8 text-center border-t-4 border-red-600">
             <div className="flex justify-center mb-6">
               <div className="bg-red-100 p-4 rounded-full">
                 <WifiOff className="w-10 h-10 text-red-600" />
               </div>
             </div>
             <h2 className="text-2xl font-bold text-gray-800 mb-2">Falha na Sincronização</h2>
             <p className="text-gray-600 mb-6">
               Não foi possível conectar ao banco de dados global. 
               <br/><br/>
               <span className="text-sm bg-gray-100 p-2 rounded text-gray-700 font-mono">{error}</span>
             </p>
             <button 
               onClick={() => refresh()}
               className="bg-v4-red text-white px-8 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors w-full"
             >
               Tentar Novamente
             </button>
          </div>
        </div>
      );
  }

  if (!selectedMonth) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
             <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhum dado encontrado</h2>
                <button onClick={() => refresh()} className="bg-v4-red text-white px-6 py-2 rounded-lg font-bold">Recarregar</button>
             </div>
          </div>
      );
  }

  return (
      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              
              {/* Logo & Brand */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-v4-red rounded flex items-center justify-center text-white font-bold text-xl">V4</div>
                  <span className="font-bold text-lg tracking-tight text-gray-900 hidden md:block">Prates Hanzava</span>
                </div>
                
                {/* Month Selector */}
                {currentTab !== 'annual' && (
                  <div className="ml-8 relative">
                    <button 
                      onClick={() => setIsMonthSelectorOpen(!isMonthSelectorOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-200 bg-white"
                    >
                      <CalendarDays className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900 font-bold">{selectedMonth.name} {selectedMonth.year}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>

                    {isMonthSelectorOpen && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 animate-fade-in-down">
                        {years.map(year => (
                          <div key={year} className="border-b border-gray-100 last:border-0">
                            <button 
                              onClick={() => setExpandedYear(expandedYear === year ? null : year)}
                              className={`w-full flex items-center justify-between px-4 py-2 text-sm font-bold text-left hover:bg-gray-50 transition-colors ${expandedYear === year ? 'text-v4-red' : 'text-gray-700'}`}
                            >
                              {year}
                              {expandedYear === year ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                            </button>
                            {expandedYear === year && (
                              <div className="bg-gray-50 py-1">
                                {months.filter(m => m.year === year).map(m => (
                                  <button
                                    key={m.id}
                                    onClick={() => {
                                      setSelectedMonthId(m.id);
                                      setIsMonthSelectorOpen(false);
                                    }}
                                    className={`w-full text-left px-8 py-2 text-sm transition-colors ${m.id === selectedMonthId ? 'text-v4-red font-bold bg-white border-l-2 border-v4-red' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                                  >
                                    {m.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                     {isMonthSelectorOpen && (
                      <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsMonthSelectorOpen(false)}></div>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Tabs */}
              <div className="hidden md:flex bg-gray-100 p-1 rounded-lg self-center overflow-x-auto">
                <button 
                  onClick={() => setCurrentTab('acquisition')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${currentTab === 'acquisition' ? 'bg-white shadow-sm text-v4-red font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Aquisição
                </button>
                <button 
                  onClick={() => setCurrentTab('monetization')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${currentTab === 'monetization' ? 'bg-white shadow-sm text-amber-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Coins className="w-4 h-4" />
                  Monetização
                </button>
                <button 
                  onClick={() => setCurrentTab('funnel')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${currentTab === 'funnel' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Users className="w-4 h-4" />
                  Funil
                </button>
                <button 
                  onClick={() => setCurrentTab('annual')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${currentTab === 'annual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Evolução
                </button>
              </div>

              {/* User Info & Actions */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                 
                 {/* EXPORT BUTTON */}
                 <button
                    onClick={handleExportForAI}
                    className={`
                      hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all mr-2
                      ${isCopied 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-v4-red hover:border-red-100'}
                    `}
                    title="Copiar dados para IA"
                 >
                    {isCopied ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    {isCopied ? 'Copiado!' : 'Exportar IA'}
                 </button>

                 <div className="text-right hidden sm:block">
                   <p className="text-xs font-medium text-gray-500">{user?.role === 'admin' ? 'Administrator' : 'Viewer'}</p>
                   <p className="text-sm font-bold text-gray-900">{user?.email.split('@')[0]}</p>
                 </div>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${user?.role === 'admin' ? 'bg-v4-red' : 'bg-gray-400'}`}>
                   {user?.email[0].toUpperCase()}
                 </div>
                 <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-v4-red transition-colors" title="Logout">
                   <LogOut className="w-5 h-5" />
                 </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {currentTab === 'acquisition' && (
            <div className="animate-fade-in-up">
              <section>
                <ExecutiveSummary 
                  variant="acquisition"
                  month={selectedMonth} 
                  deals={currentDeals} 
                  isAdmin={user?.role === 'admin'}
                  onUpdateMonth={handleUpdateMonth}
                />
              </section>
              <section className="mt-8">
                 <DealTable 
                    variant="acquisition"
                    deals={currentDeals} 
                    isAdmin={user?.role === 'admin'}
                    onUpdateDeal={handleUpdateDeal}
                    onAddDeal={handleAddDeal}
                    onDeleteDeal={handleDeleteDeal}
                 />
              </section>
              <section className="mt-8">
                 <LeadBrokerSection 
                   month={selectedMonth}
                   isAdmin={user?.role === 'admin'}
                   onUpdateMonth={handleUpdateMonth}
                 />
              </section>
              <section className="mt-8">
                 <DealBrokerSection 
                   month={selectedMonth}
                   deals={currentDeals} 
                   isAdmin={user?.role === 'admin'}
                   onUpdateMonth={handleUpdateMonth}
                 />
              </section>
            </div>
          )}

          {currentTab === 'monetization' && (
            <div className="animate-fade-in-up">
              <section>
                <ExecutiveSummary 
                  variant="monetization"
                  month={selectedMonth} 
                  deals={currentDeals} 
                  isAdmin={user?.role === 'admin'}
                  onUpdateMonth={handleUpdateMonth}
                />
              </section>
              <section className="mt-8">
                 <DealTable 
                    variant="monetization"
                    deals={currentDeals} 
                    isAdmin={user?.role === 'admin'}
                    onUpdateDeal={handleUpdateDeal}
                    onAddDeal={handleAddDeal}
                    onDeleteDeal={handleDeleteDeal}
                 />
              </section>
            </div>
          )}

          {currentTab === 'funnel' && (
            <section className="animate-fade-in-up">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                     <Users className="w-5 h-5 text-gray-500" />
                     Performance do Funil
                  </h2>
               </div>
               <FunnelDashboard 
                 stats={getFunnelStatsForRender()} 
                 deals={currentDeals}
                 isAdmin={user?.role === 'admin'} 
                 onUpdateFunnel={handleUpdateFunnel}
               />
            </section>
          )}

          {currentTab === 'annual' && (
             <section className="animate-fade-in-up">
               <div className="mb-6">
                 <h2 className="text-2xl font-bold text-gray-900">Visão Anual</h2>
                 <p className="text-gray-500">Acompanhamento de performance mês a mês. (Meses sem dados são ocultados)</p>
               </div>
               <AnnualEvolution months={months} allDeals={allDeals} funnelStats={allFunnelStats} />
             </section>
          )}

        </main>
      </div>
  );
};

export default App;
