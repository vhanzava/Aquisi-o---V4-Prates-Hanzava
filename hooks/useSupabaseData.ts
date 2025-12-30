
import { useState, useEffect } from 'react';
import { supabase, IS_DEMO_MODE } from '../supabaseClient';
import { MonthData, Deal, FunnelStats } from '../types';
import { MOCK_MONTHS } from '../mockData';

export const useSupabaseData = (userEmail?: string) => {
  const [months, setMonths] = useState<MonthData[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [funnelStats, setFunnelStats] = useState<FunnelStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    // --- DEMO MODE CHECK ---
    if (IS_DEMO_MODE) {
      // Only use Mocks explicitly in Demo Mode
      const { MOCK_DEALS, MOCK_FUNNEL } = await import('../mockData');
      setMonths(MOCK_MONTHS);
      setDeals(MOCK_DEALS);
      setFunnelStats(MOCK_FUNNEL);
      setLoading(false);
      return;
    }

    // --- REAL MODE: SUPABASE FETCH ---
    try {
      // 1. Fetch Months
      let { data: monthsData, error: monthsError } = await supabase
        .from('months')
        .select('*')
        .order('id', { ascending: true });

      if (monthsError) {
        throw monthsError;
      }

      // If DB is empty, Attempt to seed Initial Structure (Months)
      // This ensures all admins see the same structure
      if (!monthsData || monthsData.length === 0) {
         console.log("Database empty. Seeding initial months structure...");
         const { data, error: seedError } = await supabase.from('months').insert(MOCK_MONTHS).select();
         
         if (seedError) {
             console.error("Seeding Failed:", seedError);
             throw new Error("Banco de dados vazio e falha ao inicializar. Verifique as permissões RLS no Supabase.");
         }
         monthsData = data;
      }
      
      if (monthsData) {
        setMonths(monthsData);

        // 2. Fetch Deals
        const { data: dealsData, error: dealsError } = await supabase.from('deals').select('*');
        if (dealsError) throw dealsError;
        if (dealsData) setDeals(dealsData);

        // 3. Fetch Funnel
        const { data: funnelData, error: funnelError } = await supabase.from('funnel_stats').select('*');
        if (funnelError) throw funnelError;
        if (funnelData) setFunnelStats(funnelData);
      }

    } catch (err: any) {
      console.error('Critical Error fetching data:', err);
      setError(err.message || "Erro desconhecido ao conectar com o banco.");
      // DO NOT FALLBACK TO MOCK DATA HERE. 
      // Falling back creates "split brain" where users think they are working but aren't syncing.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchData();
    }
  }, [userEmail]);

  // --- CRUD OPERATIONS ---

  const updateMonth = async (id: string, field: keyof MonthData, value: any) => {
    // Optimistic Update
    setMonths(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    
    if (!IS_DEMO_MODE) {
      const { error } = await supabase.from('months').update({ [field]: value }).eq('id', id);
      if (error) {
        console.error("Failed to save Month update:", error);
        alert(`Erro ao salvar alteração: ${error.message || JSON.stringify(error)}`);
        fetchData(); // Revert/Refresh
      }
    }
  };

  const updateDeal = async (id: string, field: keyof Deal, value: any) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    
    if (!IS_DEMO_MODE) {
      const { error } = await supabase.from('deals').update({ [field]: value }).eq('id', id);
      if (error) {
        console.error("Failed to save Deal update:", error);
        alert("Erro ao salvar contrato. Tente novamente.");
        fetchData();
      }
    }
  };

  const addDeal = async (deal: Partial<Deal>) => {
     const tempId = `temp_${Date.now()}`;
     const newDealOptimistic = { ...deal, id: tempId } as Deal;
     setDeals(prev => [...prev, newDealOptimistic]);

     if (!IS_DEMO_MODE) {
       const { id, ...dealData } = deal as any;
       const { data, error } = await supabase.from('deals').insert(dealData).select();
       
       if (error) {
           console.error('Error persisting deal:', error);
           alert("Erro ao criar novo contrato.");
           setDeals(prev => prev.filter(d => d.id !== tempId)); // Remove optimistic
       } else if (data) {
           setDeals(prev => prev.map(d => d.id === tempId ? data[0] : d));
       }
     }
  };

  const deleteDeal = async (id: string) => {
    // Optimistic Delete
    setDeals(prev => prev.filter(d => d.id !== id));

    if (!IS_DEMO_MODE) {
      const { error } = await supabase.from('deals').delete().eq('id', id);
      
      if (error) {
        console.error('Error deleting deal:', error);
        alert("Erro ao excluir contrato.");
        fetchData(); // Revert on error
      }
    }
  };

  const updateFunnel = async (id: string, field: keyof FunnelStats, value: any) => {
    setFunnelStats(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
    
    if (!IS_DEMO_MODE && !id.startsWith('temp_')) {
        const { error } = await supabase.from('funnel_stats').update({ [field]: value }).eq('id', id);
        if (error) {
           console.error("Failed to save Funnel update:", error);
           alert("Erro ao salvar dados do funil.");
        }
    }
  };

  const createFunnelStats = async (stats: Partial<FunnelStats>) => {
      const tempId = `temp_${stats.funnel_type}`;
      const newStat = { ...stats, id: tempId } as FunnelStats;
      setFunnelStats(prev => [...prev, newStat]);

      if (!IS_DEMO_MODE) {
        const { id, ...cleanStats } = stats as any;
        const { data, error } = await supabase.from('funnel_stats').insert(cleanStats).select();
        if (data) {
           setFunnelStats(prev => prev.map(f => f.id === tempId ? data[0] : f));
           return data[0];
        }
        if (error) {
            console.error("Error creating funnel stat", error);
            alert("Erro ao inicializar dados do funil.");
        }
      }
      return newStat;
  };

  return {
    months,
    deals,
    funnelStats,
    loading,
    error,
    updateMonth,
    updateDeal,
    addDeal,
    deleteDeal,
    updateFunnel,
    createFunnelStats,
    refresh: fetchData
  };
};
