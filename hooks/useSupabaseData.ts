
import { useState, useEffect } from 'react';
import { supabase, IS_DEMO_MODE } from '../supabaseClient';
import { MonthData, Deal, FunnelStats, DealStatus } from '../types';
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

  // --- PROPAGATION LOGIC ---

  const getFutureMonths = (currentMonthId: string) => {
    // Ensure months are sorted by ID to guarantee correct future order
    const sortedMonths = [...months].sort((a, b) => a.id.localeCompare(b.id));
    const currentIndex = sortedMonths.findIndex(m => m.id === currentMonthId);
    
    if (currentIndex === -1) {
        console.warn(`[Propagation] Current month ${currentMonthId} not found in months list.`);
        return [];
    }
    return sortedMonths.slice(currentIndex + 1);
  };

  const isFinalStatus = (status: DealStatus) => {
    return status === DealStatus.SIGNED || status === DealStatus.LOST;
  };

  const propagateDealChange = async (updatedDeal: Deal, oldDeal: Deal) => {
    console.log(`[Propagation] Starting for ${oldDeal.client_name} (${oldDeal.month_id})`);
    console.log(`[Propagation] Change: ${oldDeal.status} -> ${updatedDeal.status}`);

    const futureMonths = getFutureMonths(updatedDeal.month_id);
    const isNewStatusFinal = isFinalStatus(updatedDeal.status);
    
    // We use client_name + pipeline_type as the "key" to find the same deal in future months
    // If client_name changed, we use the OLD name to find the future deals
    const searchName = oldDeal.client_name;
    const searchPipeline = oldDeal.pipeline_type;

    for (const month of futureMonths) {
      // Find the corresponding deal in this future month
      const futureDeal = deals.find(d => 
        d.month_id === month.id && 
        d.client_name === searchName && 
        d.pipeline_type === searchPipeline
      );

      if (isNewStatusFinal) {
        // Case 1: Deal became Final (Signed/Lost)
        // We must DELETE it from future months
        if (futureDeal) {
          console.log(`[Propagation] Deleting future deal in ${month.id}`);
          await deleteDeal(futureDeal.id, true); 
        }
        // If it became final, we stop propagating (it shouldn't exist beyond this point)
        break; 
      } else {
        // Case 2: Deal is Active (Pending/Sent)
        if (futureDeal) {
          // If future deal exists:
          // Check if it is already Final. If so, we STOP propagation (don't overwrite a Signed deal with Pending)
          if (isFinalStatus(futureDeal.status)) {
            console.log(`[Propagation] Future deal in ${month.id} is already Final (${futureDeal.status}). Stopping.`);
            break; 
          }

          // If future deal is also Active, we update it to match the current deal
          console.log(`[Propagation] Updating future deal in ${month.id}`);
          
          const updates: Partial<Deal> = {
            ...updatedDeal,
            id: futureDeal.id,
            month_id: futureDeal.month_id
          };

          // We update the future deal. 
          // IMPORTANT: We do NOT pass 'skipPropagation=false' here, because we WANT the update to propagate further.
          // However, calling updateDealFull will trigger propagateDealChange again for M+1 -> M+2.
          // This creates a recursive chain. This is correct.
          // But we must BREAK this loop here, because updateDealFull will handle the rest of the chain.
          // If we don't break, we will iterate to M+2 in THIS loop, but updateDealFull will ALSO iterate to M+2.
          
          await updateDealFull(futureDeal.id, updates);
          break; 
        } else {
          // Future deal does NOT exist.
          // We must CREATE it (Copy)
          console.log(`[Propagation] Creating copy in ${month.id}`);
          
          const newDealCopy: Partial<Deal> = {
            ...updatedDeal,
            month_id: month.id,
            id: undefined // Let addDeal generate ID
          };
          
          // addDeal will trigger propagation to M+2. So we break.
          await addDeal(newDealCopy, true); 
          break;
        }
      }
    }
  };

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

  // Helper for full update (internal use)
  const updateDealFull = async (id: string, updates: Partial<Deal>, skipPropagation = false) => {
    const oldDeal = deals.find(d => d.id === id);
    if (!oldDeal) return;

    const updatedDeal = { ...oldDeal, ...updates };

    setDeals(prev => prev.map(d => d.id === id ? updatedDeal : d));

    if (!IS_DEMO_MODE) {
      const { id: _, ...fieldsToUpdate } = updates; // Exclude ID
      const { error } = await supabase.from('deals').update(fieldsToUpdate).eq('id', id);
      if (error) {
        console.error("Failed to save Deal update:", error);
        fetchData();
      }
    }

    if (!skipPropagation) {
      await propagateDealChange(updatedDeal, oldDeal);
    }
  };

  const updateDeal = async (id: string, field: keyof Deal, value: any) => {
    const oldDeal = deals.find(d => d.id === id);
    if (!oldDeal) return;

    const updatedDeal = { ...oldDeal, [field]: value };

    setDeals(prev => prev.map(d => d.id === id ? updatedDeal : d));
    
    if (!IS_DEMO_MODE) {
      const { error } = await supabase.from('deals').update({ [field]: value }).eq('id', id);
      if (error) {
        console.error("Failed to save Deal update:", error);
        alert("Erro ao salvar contrato. Tente novamente.");
        fetchData();
      }
    }

    // Trigger Propagation
    await propagateDealChange(updatedDeal, oldDeal);
  };

  const addDeal = async (deal: Partial<Deal>, isPropagation = false) => {
     const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
     const newDealOptimistic = { ...deal, id: tempId } as Deal;
     
     // Update State
     setDeals(prev => [...prev, newDealOptimistic]);

     let finalDeal = newDealOptimistic;

     if (!IS_DEMO_MODE) {
       const { id, ...dealData } = deal as any;
       const { data, error } = await supabase.from('deals').insert(dealData).select();
       
       if (error) {
           console.error('Error persisting deal:', error);
           if (!isPropagation) alert("Erro ao criar novo contrato.");
           setDeals(prev => prev.filter(d => d.id !== tempId)); // Remove optimistic
           return;
       } else if (data) {
           finalDeal = data[0];
           setDeals(prev => prev.map(d => d.id === tempId ? data[0] : d));
       }
     }

     // Trigger Propagation (only if Active)
     if (!isFinalStatus(finalDeal.status)) {
        // For a new deal, oldDeal is effectively the same as newDeal (no changes to track)
        // But we need to ensure it copies forward.
        // propagateDealChange logic handles "if NOT found -> Create Copy".
        // So we can call it.
        await propagateDealChange(finalDeal, finalDeal);
     }
  };

  const deleteDeal = async (id: string, isPropagation = false) => {
    const dealToDelete = deals.find(d => d.id === id);
    
    // Optimistic Delete
    setDeals(prev => prev.filter(d => d.id !== id));

    if (!IS_DEMO_MODE) {
      const { error } = await supabase.from('deals').delete().eq('id', id);
      
      if (error) {
        console.error('Error deleting deal:', error);
        if (!isPropagation) alert("Erro ao excluir contrato.");
        fetchData(); // Revert on error
        return;
      }
    }

    // Propagate Deletion
    // If we delete a deal, we should delete its future copies?
    // User: "Quando um cliente for marcado como Assinado ou Perdido, o contrato para de aparecer para os meses para frente"
    // This implies deletion.
    // Also if I manually delete a deal in Jan, it should probably disappear from Feb?
    // Yes, usually.
    if (dealToDelete) {
        const futureMonths = getFutureMonths(dealToDelete.month_id);
        for (const month of futureMonths) {
            const futureDeal = deals.find(d => 
                d.month_id === month.id && 
                d.client_name === dealToDelete.client_name && 
                d.pipeline_type === dealToDelete.pipeline_type
            );
            
            if (futureDeal) {
                // If future deal is Final, do we delete it?
                // If I delete the "Origin" deal, the "Result" deal might be orphan.
                // But if I delete Jan, maybe I just want to remove Jan entry.
                // However, given the "thread" logic, deleting the root usually deletes the chain.
                // Let's assume yes.
                await deleteDeal(futureDeal.id, true);
                break; // deleteDeal(futureDeal) will recurse
            }
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
