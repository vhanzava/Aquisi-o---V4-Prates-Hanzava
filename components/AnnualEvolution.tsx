
import React from 'react';
import { MonthData, Deal, DealStatus, FunnelType, FunnelStats } from '../types';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area
} from 'recharts';

interface AnnualEvolutionProps {
  months: MonthData[];
  allDeals: Deal[];
  funnelStats: FunnelStats[];
}

export const AnnualEvolution: React.FC<AnnualEvolutionProps> = ({ months, allDeals, funnelStats }) => {
  
  // Aggregate data by month
  const rawData = months.map(month => {
    // 1. Financial Data (Global)
    const monthDeals = allDeals.filter(d => d.month_id === month.id && d.status === DealStatus.SIGNED);
    
    const mrr = monthDeals.reduce((sum, d) => sum + d.value_mrr, 0);
    const fixed = monthDeals.reduce((sum, d) => sum + d.value_fixed, 0);
    const monetization = monthDeals.reduce((sum, d) => sum + (d.value_monetization || 0), 0);
    const totalRevenue = mrr + fixed + monetization;

    // 2. Lead Broker Data
    const leadBrokerDeals = monthDeals.filter(d => d.acquisition_channel === FunnelType.LEAD_BROKER);
    const leadBrokerRevenue = leadBrokerDeals.reduce((sum, d) => sum + d.value_mrr + d.value_fixed, 0); // Revenue specific to this channel
    
    const lbPlanned = month.broker_planned_investment || 0;
    const lbRealized = month.broker_realized_investment || 0;
    const lbLeads = month.broker_leads_bought || 0;
    const lbCPL = lbLeads > 0 ? lbRealized / lbLeads : 0;

    // 3. Deal Broker Data
    const dealBrokerDeals = monthDeals.filter(d => d.acquisition_channel === FunnelType.DEAL_BROKER);
    const dealBrokerRevenue = dealBrokerDeals.reduce((sum, d) => sum + d.value_mrr + d.value_fixed, 0); // Revenue specific to this channel

    const dbInv = month.deal_broker_investment || 0;
    const dbCount = month.deal_broker_deals_bought || 0;

    // 4. Consolidated Marketing (Lead Broker + Deal Broker)
    // Using Realized for Lead Broker + Investment for Deal Broker
    const totalMarketingInv = lbRealized + dbInv;
    const totalMarketingRev = leadBrokerRevenue + dealBrokerRevenue;
    const roas = totalMarketingInv > 0 ? totalMarketingRev / totalMarketingInv : 0;

    // 5. Funnel Data (Consolidated across all channels)
    const monthFunnelStats = funnelStats.filter(f => f.month_id === month.id);
    
    const fLeads = monthFunnelStats.reduce((sum, f) => sum + f.leads, 0);
    const fCalls = monthFunnelStats.reduce((sum, f) => sum + f.calls, 0);
    const fConnections = monthFunnelStats.reduce((sum, f) => sum + f.connections, 0);
    const fMeetingsSched = monthFunnelStats.reduce((sum, f) => sum + f.meetings_scheduled, 0);
    const fMeetingsRealized = monthFunnelStats.reduce((sum, f) => sum + f.meetings_realized, 0);
    const fSales = monthFunnelStats.reduce((sum, f) => sum + f.sales, 0);

    // Conversion Rates
    const conversionLeadToMeeting = fLeads > 0 ? (fMeetingsRealized / fLeads) * 100 : 0;
    const conversionMeetingToSale = fMeetingsRealized > 0 ? (fSales / fMeetingsRealized) * 100 : 0;
    const conversionGlobal = fLeads > 0 ? (fSales / fLeads) * 100 : 0;

    
    return {
      name: `${month.name.substring(0,3)}/${month.year.toString().substring(2)}`, // e.g. "Jan/25"
      fullLabel: `${month.name} ${month.year}`,
      
      // Global Keys
      MRR: mrr,
      'Escopo Fechado': fixed,
      'Monetização': monetization,
      'Total Faturado': totalRevenue,
      'Meta Unidade': month.unit_goal_mrr,
      'Meta Monetização': month.unit_goal_monetization || 0,
      
      // Lead Broker Keys
      'LB Planejado': lbPlanned,
      'LB Realizado': lbRealized,
      'LB Leads': lbLeads,
      'LB CPL': lbCPL,

      // Deal Broker Keys
      'DB Investimento': dbInv,
      'DB Faturamento': dealBrokerRevenue,
      'DB Deals': dbCount,

      // Marketing Consolidated Keys
      'Mkt Investimento': totalMarketingInv,
      'Mkt Faturamento': totalMarketingRev,
      'ROAS': roas,

      // Funnel Keys
      'Leads': fLeads,
      'Ligações': fCalls,
      'Conexões': fConnections,
      'Reun. Agendadas': fMeetingsSched,
      'Reun. Realizadas': fMeetingsRealized,
      'Vendas': fSales,
      'Conv. Lead-Reunião (%)': conversionLeadToMeeting,
      'Conv. Reunião-Venda (%)': conversionMeetingToSale,
      'Conv. Global (%)': conversionGlobal,

      // Filter Flag: Show if there is ANY data
      hasData: totalRevenue > 0 || lbPlanned > 0 || dbInv > 0 || fLeads > 0
    };
  });

  // FILTER: Only show months that have data
  const data = rawData.filter(d => d.hasData);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(val);
  };

  if (data.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
        <div className="text-gray-400 mb-2">Sem dados para exibição</div>
        <p className="text-sm text-gray-500">Adicione contratos, dados de funil ou investimento para visualizar a evolução.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      
      {/* SECTION 1: GLOBAL FINANCIALS */}
      <div className="space-y-8">
        {/* Chart 1: Revenue Composition & Evolution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-v4-red pl-3">
            Composição de Receita & Evolução
          </h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis 
                  yAxisId="left" 
                  tickFormatter={(val) => `R$${val/1000}k`} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label, payload) => payload[0]?.payload?.fullLabel || label}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                
                <Bar yAxisId="left" dataKey="MRR" stackId="a" fill="#E30613" barSize={40} />
                <Bar yAxisId="left" dataKey="Escopo Fechado" stackId="a" fill="#1A1A1A" barSize={40} />
                <Bar yAxisId="left" dataKey="Monetização" stackId="a" fill="#F59E0B" barSize={40} />
                
                <Line yAxisId="left" type="monotone" dataKey="Total Faturado" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chart 2: MRR vs Goals */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-v4-red pl-3">
                Performance MRR vs Meta
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => `R$${val/1000}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)} 
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullLabel || label}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="MRR" fill="#fee2e2" stroke="#E30613" strokeWidth={2} />
                    <Line type="step" dataKey="Meta Unidade" stroke="#9CA3AF" strokeDasharray="4 4" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Monetization Trend */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-orange-500 pl-3">
                Evolução de Monetização
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => `R$${val/1000}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullLabel || label}
                    />
                    <Legend />
                    <Bar dataKey="Monetização" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="Meta Monetização" stroke="#78350f" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
        </div>
      </div>

      {/* SECTION 2: FUNNEL PERFORMANCE */}
      <div className="space-y-8 border-t-2 border-dashed border-gray-200 pt-8">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
           Evolução do Funil
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Chart: Volume & Productivity */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 col-span-1 md:col-span-2">
              <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-blue-500 pl-3">
                 Volume & Produtividade (Ligações vs Leads)
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullLabel || label}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="Ligações" fill="#BFDBFE" barSize={40} />
                    <Line yAxisId="right" type="monotone" dataKey="Leads" stroke="#2563EB" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart: Pipeline Quality */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-blue-500 pl-3">
                Qualidade do Funil (Reuniões vs Vendas)
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullLabel || label}
                    />
                    <Legend />
                    <Bar dataKey="Reun. Realizadas" fill="#93C5FD" stackId="a" />
                    <Bar dataKey="Reun. Agendadas" fill="#DBEAFE" stackId="a" />
                    <Line type="monotone" dataKey="Vendas" stroke="#E30613" strokeWidth={3} dot={{r: 4}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart: Conversion Rates */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-green-500 pl-3">
                Taxas de Conversão (%)
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => `${val}%`} />
                    <Tooltip 
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullLabel || label}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Conv. Lead-Reunião (%)" stroke="#10B981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Conv. Reunião-Venda (%)" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
        </div>
      </div>

      {/* SECTION 3: LEAD BROKER */}
      <div className="space-y-8 border-t-2 border-dashed border-gray-200 pt-8">
        <h2 className="text-2xl font-bold text-purple-900 flex items-center gap-2">
           Evolução Lead Broker
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Chart 4: Broker Investment */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-purple-600 pl-3">
                LB: Investimento Planejado vs Realizado
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => `R$${val/1000}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullLabel || label}
                    />
                    <Legend />
                    <Bar dataKey="LB Planejado" fill="#E9D5FF" stroke="#C084FC" strokeDasharray="4 4" barSize={30} />
                    <Bar dataKey="LB Realizado" fill="#9333EA" barSize={30} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Chart 5: Broker Efficiency */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-purple-600 pl-3">
                LB: Leads vs CPL
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `R$${val}`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'LB CPL') return formatCurrency(value);
                        return value;
                      }}
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullLabel || label}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="LB Leads" fill="#DDD6FE" radius={[4, 4, 0, 0]} barSize={40} />
                    <Line yAxisId="right" type="monotone" dataKey="LB CPL" stroke="#BE185D" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>

      {/* SECTION 4: DEAL BROKER */}
      <div className="space-y-8 border-t-2 border-dashed border-gray-200 pt-8">
        <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
           Evolução Deal Broker
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Chart 6: Deal Broker Investment vs Revenue */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-indigo-600 pl-3">
                DB: Investimento vs Faturamento
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => `R$${val/1000}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullLabel || label}
                    />
                    <Legend />
                    <Bar dataKey="DB Investimento" fill="#A5B4FC" barSize={30} />
                    <Bar dataKey="DB Faturamento" fill="#4F46E5" barSize={30} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Chart 7: Deal Broker Deals Count */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-indigo-600 pl-3">
                DB: Deals Comprados
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullLabel || label}
                    />
                    <Legend />
                    <Bar dataKey="DB Deals" fill="#C7D2FE" stroke="#4338CA" strokeWidth={1} radius={[4, 4, 0, 0]} barSize={40} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>

      {/* SECTION 5: CONSOLIDATED MARKETING (ROAS) */}
      <div className="space-y-8 border-t-2 border-dashed border-gray-200 pt-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
           Investimento em Marketing (Consolidado)
        </h2>
        <p className="text-gray-500 -mt-6 text-sm">Soma de Lead Broker + Deal Broker</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Chart 8: Consolidated Investment vs Revenue */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-gray-800 pl-3">
                Marketing: Investimento vs Retorno
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => `R$${val/1000}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullLabel || label}
                    />
                    <Legend />
                    <Bar dataKey="Mkt Investimento" fill="#9CA3AF" barSize={30} />
                    <Bar dataKey="Mkt Faturamento" fill="#10B981" barSize={30} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Chart 9: ROAS */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-green-600 pl-3">
                ROAS (Retorno sobre Investimento)
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => `${val}x`} />
                    <Tooltip 
                      formatter={(value: number) => `${formatNumber(value)}x`}
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullLabel || label}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="ROAS" stroke="#059669" fill="#D1FAE5" strokeWidth={3} dot={{r: 4, fill: '#059669'}} />
                    {/* Reference Line for ROAS 1 (Breakeven) */}
                    <Line type="monotone" dataKey={() => 1} stroke="#EF4444" strokeDasharray="5 5" strokeWidth={2} name="Breakeven (1x)" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>

    </div>
  );
};
