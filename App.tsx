
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
import { LayoutGrid, Users, LogOut, ChevronDown, ChevronRight, BarChart3, Coins, CalendarDays, Loader2 } from 'lucide-react';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentTab, setCurrentTab] = useState<'acquisition' | 'monetization' | 'funnel' | 'annual'>('acquisition');
  const [selectedMonthId, setSelectedMonthId] = useState<string>(''); // Set after load
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);
  const [expandedYear, setExpandedYear] = useState<number | null>(2025);

  // Supabase Data Hook
  const { 
    months, deals: allDeals, funnelStats: allFunnelStats, loading, 
    updateMonth, updateDeal, addDeal, updateFunnel, createFunnelStats 
  } = useSupabaseData(user?.email);

  // Set default month once data loads
  useEffect(() => {
    if (months.length > 0 && !selectedMonthId) {
      // Try to find current month, else first
      const today = new Date();
      const currentId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const found = months.find(m => m.id === currentId);
      setSelectedMonthId(found ? found.id : months[0].id);
    }
  }, [months, selectedMonthId]);

  const selectedMonth = months.find(m => m.id === selectedMonthId);
  const currentDeals = allDeals.filter(d => d.month_id === selectedMonthId);
  
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

  const handleAddDeal = () => {
    const defaultType = currentTab === 'monetization' ? DealType.FIXED : DealType.RECURRING;
    const newDeal: Partial<Deal> = {
      month_id: selectedMonthId,
      client_name: 'Novo Cliente',
      status: DealStatus.PENDING,
      type: defaultType,
      value_mrr: 0,
      value_fixed: 0,
      value_monetization: 0,
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
    // If it's a temp ID, it means the record doesn't exist in DB yet.
    if (id.startsWith('temp_')) {
        const type = id.replace('temp_', '') as FunnelType;
        const newStat = await createFunnelStats({
            month_id: selectedMonthId,
            funnel_type: type,
            [field]: value
        });
        // The UI will update automatically via the hook's refresh or state update
    } else {
        updateFunnel(id, field, value);
    }
  };

  // Helper to ensure funnel stats exist for UI even if DB is empty
  const getFunnelStatsForRender = () => {
      // Define all required types
      const types = [FunnelType.OUTBOUND, FunnelType.LEAD_BROKER, FunnelType.INDICATION];
      
      return types.map(type => {
          const existing = allFunnelStats.find(f => f.month_id === selectedMonthId && f.funnel_type === type);
          if (existing) return existing;
          
          // Return placeholder structure that triggers CREATE on first edit
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

  if (loading || !selectedMonth) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 text-v4-red animate-spin" />
                  <p className="text-gray-500 font-medium">Carregando dados...</p>
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
                
                {/* Month Selector (Only show if not in Annual view) */}
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

                    {/* Nested Dropdown */}
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
                            
                            {/* Months List */}
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
                    
                    {/* Backdrop to close */}
                    {isMonthSelectorOpen && (
                      <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => setIsMonthSelectorOpen(false)}
                      ></div>
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

              {/* User Info */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
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
