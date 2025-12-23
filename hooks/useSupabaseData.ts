
import { useState, useEffect } from 'react';
import { supabase, IS_DEMO_MODE } from '../supabaseClient';
import { MonthData, Deal, FunnelStats, DealStatus } from '../types';
import { MOCK_MONTHS, MOCK_DEALS, MOCK_FUNNEL } from '../mockData';

export const useSupabaseData = (userEmail?: string) => {
  const [months, setMonths] = useState<MonthData[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [funnelStats, setFunnelStats] = useState<FunnelStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    
    // --- DEMO MODE: LOAD MOCK DATA ---
    if (IS_DEMO_MODE) {
      console.log("Loading Demo Data...");
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Initialize with mocks if empty
      if (months.length === 0) setMonths(MOCK_MONTHS);
      if (deals.length === 0) setDeals(MOCK_DEALS);
      if (funnelStats.length === 0) setFunnelStats(MOCK_FUNNEL);
      
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

      if (monthsError) throw monthsError;

      // Seed months if empty (First run)
      if (!monthsData || monthsData.length === 0) {
         console.log("Seeding months...");
         const { data, error } = await supabase.from('months').insert(MOCK_MONTHS).select();
         if (error) {
             console.error("Error seeding:", error);
         } else {
             monthsData = data;
         }
      }
      if (monthsData) setMonths(monthsData);

      // 2. Fetch Deals
      const { data: dealsData, error: dealsError } = await supabase.from('deals').select('*');
      if (dealsError) throw dealsError;
      if (dealsData) setDeals(dealsData);

      // 3. Fetch Funnel
      const { data: funnelData, error: funnelError } = await supabase.from('funnel_stats').select('*');
      if (funnelError) throw funnelError;
      if (funnelData) setFunnelStats(funnelData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchData();
    }
  }, [userEmail]);

  // --- CRUD OPERATIONS (Hybrid: Demo vs Real) ---

  const updateMonth = async (id: string, field: keyof MonthData, value: any) => {
    // 1. Optimistic Update (Works for both Demo and Real)
    setMonths(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    
    // 2. Persist
    if (!IS_DEMO_MODE) {
        const { error } = await supabase.from('months').update({ [field]: value }).eq('id', id);
        if (error) {
          console.error('Error updating month:', error);
          fetchData(); // Revert on error
        }
    }
  };

  const updateDeal = async (id: string, field: keyof Deal, value: any) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));

    if (!IS_DEMO_MODE) {
        const { error } = await supabase.from('deals').update({ [field]: value }).eq('id', id);
        if (error) {
          console.error('Error updating deal:', error);
          fetchData();
        }
    }
  };

  const addDeal = async (deal: Partial<Deal>) => {
     if (IS_DEMO_MODE) {
         const newDeal = { ...deal, id: `temp_${Date.now()}` } as Deal;
         setDeals(prev => [...prev, newDeal]);
         return;
     }

     const { id, ...dealData } = deal as any;
     const { data, error } = await supabase.from('deals').insert(dealData).select();
     if (error) {
         console.error('Error creating deal', error);
         return;
     }
     if (data) {
         setDeals(prev => [...prev, data[0]]);
     }
  };

  const updateFunnel = async (id: string, field: keyof FunnelStats, value: any) => {
    setFunnelStats(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));

    if (!IS_DEMO_MODE) {
        if (id.startsWith('temp_')) return; // Can't update temp rows in real DB without create first
        const { error } = await supabase.from('funnel_stats').update({ [field]: value }).eq('id', id);
        if (error) {
            console.error('Error updating funnel:', error);
            fetchData();
        }
    }
  };

  const createFunnelStats = async (stats: Partial<FunnelStats>) => {
      if (IS_DEMO_MODE) {
          const newStat = { ...stats, id: `new_${Date.now()}` } as FunnelStats;
          setFunnelStats(prev => [...prev, newStat]);
          return newStat;
      }

      const { id, ...cleanStats } = stats as any;
      const { data, error } = await supabase.from('funnel_stats').insert(cleanStats).select();
      if (error) {
          console.error("Error creating funnel stat", error);
          return null;
      }
      if (data) {
          setFunnelStats(prev => [...prev, data[0]]);
          return data[0];
      }
  };

  return {
    months,
    deals,
    funnelStats,
    loading,
    updateMonth,
    updateDeal,
    addDeal,
    updateFunnel,
    createFunnelStats,
    refresh: fetchData
  };
};
