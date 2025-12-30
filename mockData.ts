
import { MonthData, Deal, FunnelStats, DealStatus, DealType, FunnelType } from './types';

// Helper to generate months
const generateMonths = (): MonthData[] => {
  const years = [2024, 2025, 2026];
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthSlugs = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];

  const months: MonthData[] = [];

  years.forEach(year => {
    monthNames.forEach((name, index) => {
      const id = `${year}-${String(index + 1).padStart(2, '0')}`; // e.g., 2025-01
      
      months.push({
        id,
        name,
        year,
        slug: `${monthSlugs[index]}-${year}`,
        working_days: 22,
        unit_goal_mrr: 100000,
        matrix_goal_mrr: 150000,
        manual_base_revenue: 500000, // Example base revenue
        broker_planned_investment: 0,
        broker_realized_investment: 0,
        broker_leads_bought: 0,
        deal_broker_investment: 0,
        deal_broker_deals_bought: 0
      });
    });
  });

  return months;
};

export const MOCK_MONTHS: MonthData[] = generateMonths();

// Helper to find a specific month ID for the mock deals
const getMonthId = (year: number, monthIndex: number) => `${year}-${String(monthIndex).padStart(2, '0')}`;

export const MOCK_DEALS: Deal[] = [
  // --- ACQUISITION DEALS ---
  {
    id: 'd1',
    month_id: getMonthId(2025, 10), // Oct 2025
    pipeline_type: 'acquisition',
    client_name: 'Elegance (Acq)',
    status: DealStatus.SIGNED,
    type: DealType.RECURRING,
    value_mrr: 2500,
    value_fixed: 8500,
    acquisition_channel: FunnelType.LEAD_BROKER,
    sign_date: '2025-10-14',
    start_date: '2025-10-15',
    segment: 'Moda'
  },
  {
    id: 'd2',
    month_id: getMonthId(2025, 10), // Oct 2025
    pipeline_type: 'acquisition',
    client_name: 'Mega Eletron (Acq)',
    status: DealStatus.PENDING,
    type: DealType.MIXED,
    value_mrr: 6517,
    value_fixed: 11000,
    acquisition_channel: FunnelType.LEAD_BROKER,
    sign_date: '',
    start_date: '',
    segment: 'Mobilidade'
  },
  
  // --- MONETIZATION DEALS (Different Clients) ---
  {
    id: 'm1',
    month_id: getMonthId(2025, 10),
    pipeline_type: 'monetization',
    client_name: 'Cliente Base Antiga A',
    status: DealStatus.SIGNED,
    type: DealType.FIXED,
    value_mrr: 0,
    value_fixed: 15000, // Upsell de Escopo
    acquisition_channel: FunnelType.INDICATION,
    sign_date: '2025-10-05',
    segment: 'Varejo'
  },
  {
    id: 'm2',
    month_id: getMonthId(2025, 10),
    pipeline_type: 'monetization',
    client_name: 'Cliente Base Antiga B',
    status: DealStatus.PENDING,
    type: DealType.RECURRING,
    value_mrr: 3000, // Upsell de Assessoria
    value_fixed: 0, 
    acquisition_channel: FunnelType.INDICATION,
    sign_date: '',
    segment: 'Serviços'
  }
];

export const MOCK_FUNNEL: FunnelStats[] = [
  {
    id: 'f1',
    month_id: getMonthId(2025, 10),
    funnel_type: FunnelType.OUTBOUND,
    leads: 450,
    leads_worked: 400,
    calls: 800,
    call_duration_minutes: 1200, 
    connections: 120,
    meetings_scheduled: 45,
    meetings_realized: 30,
    sales: 1,
    invested_amount: 0
  },
  {
    id: 'f2',
    month_id: getMonthId(2025, 10),
    funnel_type: FunnelType.LEAD_BROKER,
    leads: 800,
    leads_worked: 750,
    calls: 1500,
    call_duration_minutes: 2400,
    connections: 200,
    meetings_scheduled: 60,
    meetings_realized: 50,
    sales: 1,
    invested_amount: 5000 
  }
];
