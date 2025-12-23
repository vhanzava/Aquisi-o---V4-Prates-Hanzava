import React from 'react';
import { Deal, DealStatus, DealType, UserProfile } from '../types';
import { MoreHorizontal, Calendar, Briefcase, RefreshCw } from 'lucide-react';

interface DealKanbanProps {
  deals: Deal[];
  user: UserProfile;
}

const DealCard: React.FC<{ deal: Deal; isAdmin: boolean }> = ({ deal, isAdmin }) => {
  const isRecurring = deal.type === DealType.RECURRING || deal.type === DealType.MIXED;
  const isFixed = deal.type === DealType.FIXED || deal.type === DealType.MIXED;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-3 hover:shadow-md transition-shadow group relative ${isAdmin ? 'cursor-grab' : ''}`}>
      {isAdmin && (
        <button className="absolute top-3 right-3 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      )}
      
      <div className="flex flex-wrap gap-2 mb-2">
        {isRecurring && (
           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
             <RefreshCw className="w-3 h-3 mr-1" /> MRR
           </span>
        )}
        {isFixed && (
           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
             <Briefcase className="w-3 h-3 mr-1" /> Fixed
           </span>
        )}
      </div>

      <h4 className="font-bold text-gray-900 mb-2 truncate">{deal.client_name}</h4>

      <div className="space-y-1">
        {deal.value_mrr > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Recurring:</span>
            <span className="font-semibold text-gray-800">{formatCurrency(deal.value_mrr)}</span>
          </div>
        )}
        {deal.value_fixed > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Scope:</span>
            <span className="font-semibold text-gray-800">{formatCurrency(deal.value_fixed)}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between">
         <span className="text-xs text-gray-400 flex items-center">
            {deal.acquisition_channel}
         </span>
         {deal.sign_date && (
           <span className="text-xs text-gray-400 flex items-center">
             <Calendar className="w-3 h-3 mr-1" />
             {new Date(deal.sign_date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
           </span>
         )}
      </div>
    </div>
  );
};

export const DealKanban: React.FC<DealKanbanProps> = ({ deals, user }) => {
  const isAdmin = user.role === 'admin';
  const pendingDeals = deals.filter(d => d.status === DealStatus.PENDING);
  const signedDeals = deals.filter(d => d.status === DealStatus.SIGNED);

  const calculateTotal = (list: Deal[]) => list.reduce((acc, curr) => acc + curr.value_mrr + curr.value_fixed, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      {/* Column: Pending */}
      <div className="bg-gray-50 p-4 rounded-xl flex flex-col h-full max-h-[600px]">
        <div className="flex justify-between items-center mb-4 px-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <h3 className="font-bold text-gray-700">Pending (Na Rua)</h3>
            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">{pendingDeals.length}</span>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            Est. Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(calculateTotal(pendingDeals))}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto pr-2">
          {pendingDeals.map(deal => (
            <DealCard key={deal.id} deal={deal} isAdmin={isAdmin} />
          ))}
          {pendingDeals.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm italic">No pending deals.</div>
          )}
        </div>
      </div>

      {/* Column: Signed */}
      <div className="bg-gray-50 p-4 rounded-xl flex flex-col h-full max-h-[600px]">
        <div className="flex justify-between items-center mb-4 px-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <h3 className="font-bold text-gray-700">Signed (Assinados)</h3>
            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">{signedDeals.length}</span>
          </div>
          <span className="text-xs font-semibold text-gray-500">
             Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(calculateTotal(signedDeals))}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto pr-2">
          {signedDeals.map(deal => (
            <DealCard key={deal.id} deal={deal} isAdmin={isAdmin} />
          ))}
          {signedDeals.length === 0 && (
             <div className="text-center py-10 text-gray-400 text-sm italic">No signed deals yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};