import React, { useState } from 'react';
import { MonthData } from '../types';
import { Edit2, Users, Activity, Wallet, Target } from 'lucide-react';

interface LeadBrokerSectionProps {
  month: MonthData;
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
}> = ({ title, value, isEditable, isAdmin, icon, variantColor, onSave, size = 'normal' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value && onSave) {
      onSave(Number(localValue));
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
              onChange={(e) => setLocalValue(Number(e.target.value))}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
              style={{ MozAppearance: 'textfield' }} 
            />
          ) : (
            <h3 
              className={`text-${size === 'small' ? 'lg' : '2xl'} font-bold text-gray-900 mt-1 ${isEditable && isAdmin ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
              onClick={() => isEditable && isAdmin && setIsEditing(true)}
            >
              {formatCurrency(value)}
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

export const LeadBrokerSection: React.FC<LeadBrokerSectionProps> = ({ month, isAdmin, onUpdateMonth }) => {
  const brokerColor = 'text-purple-600';
  
  // Logic
  const brokerPlanned = month.broker_planned_investment || 0;
  const brokerRealized = month.broker_realized_investment || 0;
  const brokerLeads = month.broker_leads_bought || 0;
  const brokerCPL = brokerLeads > 0 ? brokerRealized / brokerLeads : 0;

  return (
    <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
       <h3 className="font-bold text-purple-800 mb-4 flex items-center gap-2 text-lg">
         <Wallet className="w-6 h-6" /> Performance Lead Broker
       </h3>
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <EditableCard 
            title="Invest. Planejado"
            value={brokerPlanned}
            isAdmin={isAdmin}
            isEditable={true}
            variantColor={brokerColor}
            onSave={(val) => onUpdateMonth('broker_planned_investment', val)}
            icon={<Activity className="w-4 h-4 text-purple-400" />}
            size="small"
          />
          <EditableCard 
            title="Invest. Realizado"
            value={brokerRealized}
            isAdmin={isAdmin}
            isEditable={true}
            variantColor={brokerColor}
            onSave={(val) => onUpdateMonth('broker_realized_investment', val)}
            icon={<Wallet className="w-4 h-4 text-purple-400" />}
            size="small"
          />
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 group relative hover:border-purple-600 transition-colors">
             <div className="flex justify-between items-start">
               <div className="w-full">
                 <p className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
                    Leads Comprados
                    {isAdmin && <Edit2 className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100" />}
                 </p>
                 {isAdmin ? (
                    <input 
                       className="text-lg font-bold text-gray-900 mt-1 w-full bg-transparent border-none outline-none p-0 focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none" 
                       type="number"
                       value={brokerLeads}
                       onChange={(e) => onUpdateMonth('broker_leads_bought', Number(e.target.value))}
                       style={{ MozAppearance: 'textfield' }}
                    />
                 ) : (
                    <h3 className="text-lg font-bold text-gray-900 mt-1">{brokerLeads}</h3>
                 )}
               </div>
               <div className="p-2 rounded-lg bg-gray-50"><Users className="w-4 h-4 text-purple-400" /></div>
             </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-sm font-medium text-gray-500 uppercase">Custo por Lead (CPL)</p>
                 <h3 className="text-lg font-bold text-gray-900 mt-1">
                   {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(brokerCPL)}
                 </h3>
               </div>
               <div className="p-2 rounded-lg bg-gray-50"><Target className="w-4 h-4 text-purple-400" /></div>
             </div>
          </div>
       </div>
    </div>
  );
};