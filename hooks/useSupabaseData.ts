
import { useState, useEffect } from 'react';
import { supabase, IS_DEMO_MODE } from '../supabaseClient';
import { MonthData, Deal, FunnelStats, DealStatus } from '../types';
import { MOCK_MONTHS, MOCK_DEALS, MOCK_FUNNEL } from '../mockData';

export const useSupabaseData = (userEmail?: string) => {
  const [months, setMonths] = useState<MonthData[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [funnelStats, setFunnelStats] = useState<FunnelStats[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMockData = () => {
    console.log("Using Offline/Mock Data fallback");
    setMonths(MOCK_MONTHS);
    setDeals(MOCK_DEALS);
    setFunnelStats(MOCK_FUNNEL);
    setLoading(false);
  };

  const fetchData = async () => {
    setLoading(true);
    
    // --- DEMO MODE CHECK ---
    if (IS_DEMO_MODE) {
      setTimeout(loadMockData, 600);
      return;
    }

    // --- REAL MODE: SUPABASE FETCH ---
    try {
      // 1. Fetch Months
      let { data: monthsData, error: monthsError } = await supabase
        .from('months')
        .select('*')
        .order('id', { ascending: true });

      // Handle table not found or connection error by falling back
      if (monthsError) {
        console.warn("Supabase Fetch Error (using fallback):", monthsError.message);
        loadMockData();
        return;
      }

      // If DB is connected but empty, try to seed
      if (!monthsData || monthsData.length === 0) {
         console.log("Database empty. Attempting to seed...");
         const { data, error } = await supabase.from('months').insert(MOCK_MONTHS).select();
         
         // If seeding fails (likely due to RLS/Permission denied for Anon users), load mocks locally
         if (error) {
             console.warn("Seeding failed (RLS blocking Anon write). Loading local data only.", error);
             loadMockData();
             return;
         } else {
             monthsData = data;
         }
      }
      
      if (monthsData && monthsData.length > 0) {
        setMonths(monthsData);

        // 2. Fetch Deals
        const { data: dealsData } = await supabase.from('deals').select('*');
        if (dealsData) setDeals(dealsData);

        // 3. Fetch Funnel
        const { data: funnelData } = await supabase.from('funnel_stats').select('*');
        if (funnelData) setFunnelStats(funnelData);
        
        setLoading(false);
      } else {
        // Fallback if data is still somehow empty
        loadMockData();
      }

    } catch (error) {
      console.error('Critical Error fetching data:', error);
      loadMockData();
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchData();
    }
  }, [userEmail]);

  // --- CRUD OPERATIONS ---

  const updateMonth = async (id: string, field: keyof MonthData, value: any) => {
    setMonths(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    if (!IS_DEMO_MODE) await supabase.from('months').update({ [field]: value }).eq('id', id);
  };

  const updateDeal = async (id: string, field: keyof Deal, value: any) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    if (!IS_DEMO_MODE) await supabase.from('deals').update({ [field]: value }).eq('id', id);
  };

  const addDeal = async (deal: Partial<Deal>) => {
     // Local Optimistic Update first
     const tempId = `temp_${Date.now()}`;
     const newDealOptimistic = { ...deal, id: tempId } as Deal;
     setDeals(prev => [...prev, newDealOptimistic]);

     if (!IS_DEMO_MODE) {
       const { id, ...dealData } = deal as any;
       const { data, error } = await supabase.from('deals').insert(dealData).select();
       
       if (error) {
           console.error('Error persisting deal:', error);
       } else if (data) {
           // Replace temp ID with real ID
           setDeals(prev => prev.map(d => d.id === tempId ? data[0] : d));
       }
     }
  };

  const updateFunnel = async (id: string, field: keyof FunnelStats, value: any) => {
    setFunnelStats(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
    if (!IS_DEMO_MODE && !id.startsWith('temp_')) {
        await supabase.from('funnel_stats').update({ [field]: value }).eq('id', id);
    }
  };

  const createFunnelStats = async (stats: Partial<FunnelStats>) => {
      const tempId = `temp_${stats.funnel_type}`;
      const newStat = { ...stats, id: tempId } as FunnelStats;
      setFunnelStats(prev => [...prev, newStat]); // Optimistic

      if (!IS_DEMO_MODE) {
        const { id, ...cleanStats } = stats as any;
        const { data, error } = await supabase.from('funnel_stats').insert(cleanStats).select();
        if (data) {
           setFunnelStats(prev => prev.map(f => f.id === tempId ? data[0] : f));
           return data[0];
        }
        if (error) console.error("Error creating funnel stat", error);
      }
      return newStat;
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
