
import React from 'react';
import { Deal, DealStatus, DealType } from '../types';
import { RefreshCw, Briefcase, Calendar, DollarSign, GripVertical } from 'lucide-react';

interface DealKanbanBoardProps {
  deals: Deal[];
  isAdmin: boolean;
  onUpdateDeal: (id: string, field: keyof Deal, value: any) => void;
  variant: 'acquisition' | 'monetization';
}

const KanbanCard: React.FC<{ deal: Deal; isAdmin: boolean; variant: 'acquisition' | 'monetization' }> = ({ deal, isAdmin, variant }) => {
  const isAcquisition = variant === 'acquisition';
  
  const handleDragStart = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.dataTransfer.setData('dealId', deal.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div 
      draggable={isAdmin}
      onDragStart={handleDragStart}
      className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-3 hover:shadow-md transition-shadow group relative ${isAdmin ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-gray-900 truncate pr-6">{deal.client_name}</h4>
        {isAdmin && <GripVertical className="w-4 h-4 text-gray-300" />}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
         {deal.value_mrr > 0 && (
           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
             MRR: {formatCurrency(deal.value_mrr)}
           </span>
         )}
         {isAcquisition && deal.value_fixed > 0 && (
           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
             Fixed: {formatCurrency(deal.value_fixed)}
           </span>
         )}
         {!isAcquisition && (deal.value_monetization || 0) > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
             Monet: {formatCurrency(deal.value_monetization || 0)}
           </span>
         )}
      </div>

      <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
         <span>{deal.acquisition_channel}</span>
         {deal.sign_date && (
           <span className="flex items-center">
             <Calendar className="w-3 h-3 mr-1" />
             {new Date(deal.sign_date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
           </span>
         )}
      </div>
    </div>
  );
};

export const DealKanbanBoard: React.FC<DealKanbanBoardProps> = ({ deals, isAdmin, onUpdateDeal, variant }) => {
  const columns = [
    { id: DealStatus.PENDING, title: 'Pendente', color: 'bg-yellow-50', border: 'border-yellow-200', iconColor: 'bg-yellow-400' },
    { id: DealStatus.SENT, title: 'Na Rua', color: 'bg-blue-50', border: 'border-blue-200', iconColor: 'bg-blue-500' },
    { id: DealStatus.SIGNED, title: 'Assinado', color: 'bg-green-50', border: 'border-green-200', iconColor: 'bg-green-500' },
    { id: DealStatus.LOST, title: 'Perdido', color: 'bg-gray-50', border: 'border-gray-200', iconColor: 'bg-gray-400' }
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: DealStatus) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    if (dealId) {
      onUpdateDeal(dealId, 'status', status);
    }
  };

  const calculateTotal = (status: DealStatus) => {
    return deals
      .filter(d => d.status === status)
      .reduce((acc, d) => {
        if (variant === 'acquisition') return acc + d.value_mrr + d.value_fixed;
        return acc + (d.value_monetization || 0);
      }, 0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full min-h-[500px]">
      {columns.map(col => {
        const colDeals = deals.filter(d => d.status === col.id);
        const total = calculateTotal(col.id);

        return (
          <div 
            key={col.id} 
            className={`rounded-xl flex flex-col h-full ${col.color} border ${col.border}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="p-4 border-b border-gray-200/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${col.iconColor}`}></div>
                <h3 className="font-bold text-gray-700 text-sm truncate">{col.title}</h3>
                <span className="bg-white/50 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">{colDeals.length}</span>
              </div>
            </div>
            
            <div className="px-4 py-2 bg-white/30 border-b border-gray-200/30 text-right">
                <span className="text-xs font-semibold text-gray-600">
                    Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(total)}
                </span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto">
              {colDeals.map(deal => (
                <KanbanCard key={deal.id} deal={deal} isAdmin={isAdmin} variant={variant} />
              ))}
              {colDeals.length === 0 && (
                <div className="h-24 border-2 border-dashed border-gray-300/50 rounded-lg flex items-center justify-center text-gray-400 text-xs uppercase tracking-wider">
                  Arraste aqui
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
