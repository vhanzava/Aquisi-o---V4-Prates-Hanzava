
import React, { useState } from 'react';
import { FunnelStats, FunnelType, Deal, DealStatus } from '../types';
import { Users, Phone, CalendarCheck, CheckCircle, ArrowDown, Clock, MousePointerClick, Edit2, DollarSign, Calculator } from 'lucide-react';

interface FunnelDashboardProps {
  stats: FunnelStats[];
  deals: Deal[];
  isAdmin: boolean;
  onUpdateFunnel: (id: string, field: keyof FunnelStats, value: number) => void;
}

const EditableStat: React.FC<{
  value: number;
  label: string;
  field?: keyof FunnelStats;
  isAdmin: boolean;
  onUpdate?: (val: number) => void;
  isDuration?: boolean;
}> = ({ value, label, isAdmin, onUpdate, isDuration }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const formatValue = (val: number) => {
    if (isDuration) {
      const hours = Math.floor(val / 60);
      const mins = val % 60;
      return `${hours}h ${mins}m`;
    }
    return val;
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value && onUpdate) {
      onUpdate(Number(localValue));
    }
  };

  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">
        {label}
        {isAdmin && onUpdate && <Edit2 className="w-2.5 h-2.5 text-gray-300" />}
      </span>
      {isEditing && isAdmin ? (
        <input
          autoFocus
          type="number"
          className="font-bold text-gray-800 bg-transparent border-b border-gray-300 outline-none w-20"
          value={localValue}
          onChange={(e) => setLocalValue(Number(e.target.value))}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
        />
      ) : (
        <span 
          className={`font-bold text-gray-800 ${isAdmin && onUpdate ? 'cursor-pointer hover:text-blue-600' : ''}`}
          onClick={() => isAdmin && onUpdate && setIsEditing(true)}
        >
          {formatValue(value)}
        </span>
      )}
    </div>
  );
};

const ConversionRate: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const rate = from > 0 ? (to / from) * 100 : 0;
  let color = 'text-gray-400';
  if (rate >= 20) color = 'text-green-600';
  else if (rate >= 10) color = 'text-yellow-600';
  else if (rate > 0) color = 'text-red-500';

  return (
    <div className="flex justify-center my-2">
      <div className={`text-xs font-bold bg-gray-50 px-2 py-0.5 rounded-full flex items-center gap-1 ${color}`}>
        <ArrowDown className="w-3 h-3" />
        {rate.toFixed(1)}%
      </div>
    </div>
  );
};

const FunnelColumn: React.FC<{ 
  stat: FunnelStats; 
  revenue: number; 
  isAdmin: boolean;
  onUpdate: (id: string, field: keyof FunnelStats, value: number) => void;
}> = ({ stat, revenue, isAdmin, onUpdate }) => {
  
  const titleColor = 
    stat.funnel_type === FunnelType.LEAD_BROKER ? 'text-purple-700 bg-purple-50 border-purple-100' :
    stat.funnel_type === FunnelType.OUTBOUND ? 'text-blue-700 bg-blue-50 border-blue-100' :
    'text-orange-700 bg-orange-50 border-orange-100';

  const ticketMedio = stat.sales > 0 ? revenue / stat.sales : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className={`p-4 border-b ${titleColor} text-center`}>
        <h3 className="font-bold text-lg">{stat.funnel_type}</h3>
      </div>

      <div className="p-4 space-y-6 flex-1">
        
        {/* 1. PRODUCTIVITY SECTION */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
           <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1">
             <Clock className="w-3 h-3" /> Produtividade
           </h4>
           <div className="grid grid-cols-2 gap-4">
              <EditableStat 
                label="Leads" 
                value={stat.leads} 
                isAdmin={isAdmin} 
                onUpdate={(val) => onUpdate(stat.id, 'leads', val)} 
              />
              <EditableStat 
                label="Leads Trab." 
                value={stat.leads_worked} 
                isAdmin={isAdmin} 
                onUpdate={(val) => onUpdate(stat.id, 'leads_worked', val)} 
              />
              <EditableStat 
                label="Ligações" 
                value={stat.calls} 
                isAdmin={isAdmin} 
                onUpdate={(val) => onUpdate(stat.id, 'calls', val)} 
              />
              <EditableStat 
                label="Tempo (Min)" 
                value={stat.call_duration_minutes} 
                isAdmin={isAdmin} 
                onUpdate={(val) => onUpdate(stat.id, 'call_duration_minutes', val)}
                isDuration 
              />
           </div>
        </div>

        {/* 2. FUNNEL SECTION */}
        <div>
           <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1">
             <Calculator className="w-3 h-3" /> Funil de Conversão
           </h4>
           
           <div className="space-y-1 relative">
              {/* Vertical Line */}
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100 -z-10"></div>

              {/* Step: Leads Reference (Ghost) */}
              <div className="flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <Users className="w-4 h-4" />
                     </div>
                     <span className="text-sm font-medium text-gray-500">Leads</span>
                  </div>
                  <span className="font-bold text-gray-400">{stat.leads}</span>
              </div>

              <ConversionRate from={stat.leads} to={stat.connections} />

              {/* Step: Connections */}
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600">
                        <Phone className="w-4 h-4" />
                     </div>
                     <span className="text-sm font-bold text-gray-700">Conexões</span>
                  </div>
                  <EditableStat value={stat.connections} label="" isAdmin={isAdmin} onUpdate={(val) => onUpdate(stat.id, 'connections', val)} />
              </div>

              <ConversionRate from={stat.connections} to={stat.meetings_scheduled} />

              {/* Step: Meetings Scheduled */}
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600">
                        <CalendarCheck className="w-4 h-4" />
                     </div>
                     <span className="text-sm font-bold text-gray-700">Reun. Marcadas</span>
                  </div>
                  <EditableStat value={stat.meetings_scheduled} label="" isAdmin={isAdmin} onUpdate={(val) => onUpdate(stat.id, 'meetings_scheduled', val)} />
              </div>

              <ConversionRate from={stat.meetings_scheduled} to={stat.meetings_realized} />

              {/* Step: Meetings Realized */}
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-blue-600">
                        <CheckCircle className="w-4 h-4" />
                     </div>
                     <span className="text-sm font-bold text-gray-700">Reun. Realizadas</span>
                  </div>
                  <EditableStat value={stat.meetings_realized} label="" isAdmin={isAdmin} onUpdate={(val) => onUpdate(stat.id, 'meetings_realized', val)} />
              </div>

              <ConversionRate from={stat.meetings_realized} to={stat.sales} />

              {/* Step: Sales */}
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-v4-red text-white flex items-center justify-center shadow-md">
                        <DollarSign className="w-4 h-4" />
                     </div>
                     <span className="text-sm font-bold text-gray-900">Vendas</span>
                  </div>
                  <EditableStat value={stat.sales} label="" isAdmin={isAdmin} onUpdate={(val) => onUpdate(stat.id, 'sales', val)} />
              </div>
           </div>
        </div>

      </div>
      
      {/* 3. FINANCE FOOTER */}
      <div className="bg-gray-50 border-t border-gray-100 p-4">
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Faturamento</p>
                  <p className="text-sm font-bold text-green-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(revenue)}
                  </p>
                  <p className="text-[10px] text-gray-400 leading-tight mt-1">*Assinado (MRR + Escopo)</p>
              </div>
              <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Ticket Médio</p>
                  <p className="text-sm font-bold text-gray-800">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(ticketMedio)}
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
};

export const FunnelDashboard: React.FC<FunnelDashboardProps> = ({ stats, deals, isAdmin, onUpdateFunnel }) => {
  // We only show columns for: Outbound, LeadBroker, Indication. (DealBroker is usually separate/direct)
  const displayChannels = [FunnelType.OUTBOUND, FunnelType.LEAD_BROKER, FunnelType.INDICATION];

  const getStats = (type: FunnelType) => stats.find(s => s.funnel_type === type) || {
      id: `temp_${type}`,
      month_id: '',
      funnel_type: type,
      leads: 0, leads_worked: 0, calls: 0, call_duration_minutes: 0,
      connections: 0, meetings_scheduled: 0, meetings_realized: 0, sales: 0, invested_amount: 0
  };

  const calculateRevenue = (type: FunnelType) => {
    return deals
        .filter(d => d.acquisition_channel === type && d.status === DealStatus.SIGNED)
        .reduce((sum, d) => sum + d.value_mrr + d.value_fixed, 0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {displayChannels.map(channel => (
        <FunnelColumn 
            key={channel} 
            stat={getStats(channel)} 
            revenue={calculateRevenue(channel)}
            isAdmin={isAdmin}
            onUpdate={onUpdateFunnel}
        />
      ))}
    </div>
  );
};
