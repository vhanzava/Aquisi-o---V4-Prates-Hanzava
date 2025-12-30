
import React, { useState } from 'react';
import { MonthData, Deal, DealStatus, FunnelType } from '../types';
import { Edit2, DollarSign, ShoppingCart, Briefcase, BarChart } from 'lucide-react';

interface DealBrokerSectionProps {
  month: MonthData;
  deals: Deal[];
  isAdmin: boolean;
  onUpdateMonth: (field: keyof MonthData, value: number) => void;
}

const EditableCard: React.FC<{
  title: string;
  value: number;
  isEditable?: boolean;
  isAdmin: boolean;
  icon: React.ReactNode;
  variantColor: string;
  onSave?: (val: number) => void;
  size?: 'normal' | 'small';
  isCurrency?: boolean;
}> = ({ title, value, isEditable, isAdmin, icon, variantColor, onSave, size = 'normal', isCurrency = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value.toString());

  const formatValue = (val: number) => {
    if (isCurrency) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
    }
    return val;
  };

  const startEditing = () => {
    if (isEditable && isAdmin) {
      setLocalValue(value.toString());
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseFloat(localValue);
    if (!isNaN(parsed) && parsed !== value && onSave) {
      onSave(parsed);
    } else {
      setLocalValue(value.toString());
    }
  };

  const themeClass = variantColor.replace('text-', '');

  return (
    <div className={`bg-white ${size === 'small' ? 'p-4' : 'p-6'} rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full relative group hover:border-${themeClass} transition-colors`}>
      <div className="flex justify-between items-start mb-2">
        <div className="w-full">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
            {title}
            {isEditable && isAdmin && <Edit2 className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100" />}
          </p>
          
          {isEditing ? (
            <input
              autoFocus
              className={`text-${size === 'small' ? 'lg' : '2xl'} font-bold text-gray-900 mt-1 w-full bg-transparent border-none outline-none p-0 focus:ring-0 appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
              style={{ MozAppearance: 'textfield' }} 
            />
          ) : (
            <h3 
              className={`text-${size === 'small' ? 'lg' : '2xl'} font-bold text-gray-900 mt-1 ${isEditable && isAdmin ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
              onClick={startEditing}
            >
              {formatValue(value)}
            </h3>
          )}
        </div>
        <div className={`p-2 rounded-lg bg-gray-50 flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export const DealBrokerSection: React.FC<DealBrokerSectionProps> = ({ month, deals, isAdmin, onUpdateMonth }) => {
  const brokerColor = 'text-indigo-600';
  
  // 1. Manual Inputs
  const investment = month.deal_broker_investment || 0;
  const dealsBought = month.deal_broker_deals_bought || 0;

  // 2. Calculated Financials (Filter by Channel: DealBroker)
  // We consider Signed Deals for Actual Revenue
  const dealBrokerDeals = deals.filter(d => 
    d.status === DealStatus.SIGNED && d.acquisition_channel === FunnelType.DEAL_BROKER
  );

  const mrr = dealBrokerDeals.reduce((acc, d) => acc + d.value_mrr, 0);
  const fixed = dealBrokerDeals.reduce((acc, d) => acc + d.value_fixed, 0);
  const totalRevenue = mrr + fixed;

  return (
    <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
       <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2 text-lg">
         <Briefcase className="w-6 h-6" /> Performance Deal Broker
       </h3>
       
       <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
          {/* Card 1: Investment (Manual) */}
          <EditableCard 
            title="Investimento"
            value={investment}
            isAdmin={isAdmin}
            isEditable={true}
            variantColor={brokerColor}
            onSave={(val) => onUpdateMonth('deal_broker_investment', val)}
            icon={<DollarSign className="w-4 h-4 text-indigo-400" />}
            size="small"
          />

          {/* Card 2: Total Revenue (Calculated) */}
          <EditableCard 
            title="Faturamento (Total)"
            value={totalRevenue}
            isAdmin={isAdmin}
            isEditable={false}
            variantColor={brokerColor}
            icon={<BarChart className="w-4 h-4 text-indigo-400" />}
            size="small"
          />

          {/* Card 3: Deals Bought (Manual Count) */}
          <EditableCard 
            title="Deals Comprados"
            value={dealsBought}
            isAdmin={isAdmin}
            isEditable={true}
            isCurrency={false}
            variantColor={brokerColor}
            onSave={(val) => onUpdateMonth('deal_broker_deals_bought', val)}
            icon={<ShoppingCart className="w-4 h-4 text-indigo-400" />}
            size="small"
          />

          {/* Card 4: MRR (Calculated) */}
          <EditableCard 
            title="MRR"
            value={mrr}
            isAdmin={isAdmin}
            isEditable={false}
            variantColor={brokerColor}
            icon={<DollarSign className="w-4 h-4 text-indigo-400" />}
            size="small"
          />

           {/* Card 5: Fixed Scope (Calculated) */}
           <EditableCard 
            title="Escopo Fechado"
            value={fixed}
            isAdmin={isAdmin}
            isEditable={false}
            variantColor={brokerColor}
            icon={<Briefcase className="w-4 h-4 text-indigo-400" />}
            size="small"
          />

       </div>
       <p className="text-xs text-indigo-400 mt-2 italic">
        * As métricas de Faturamento, MRR e Escopo são calculadas automaticamente com base nos contratos assinados marcados como "DealBroker".
       </p>
    </div>
  );
};
