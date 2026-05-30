export enum DealStatus {
  SIGNED = 'Signed',
  SENT = 'Na_Rua',
  PENDING = 'Pending',
  LOST = 'Lost'
}

export enum DealType {
  RECURRING = 'Recurring',
  FIXED = 'Fixed',
  MIXED = 'Mixed'
}

export enum FunnelType {
  OUTBOUND = 'Outbound',
  LEAD_BROKER = 'LeadBroker',
  DEAL_BROKER = 'DealBroker',
  INDICATION = 'Indication'
}

export type PipelineType = 'acquisition' | 'monetization';

export type PaymentMethod = 'pix' | 'credit_card';

export const ROYALTIES_RATE = 0.20;
export const ANTICIPATION_RATE = 0.17;

export interface CashBreakdown {
  gross: number;         // valor total bruto do contrato (MRR × duração + escopo)
  royalties: number;     // 20% sempre
  anticipationFee: number; // 17% se cartão + antecipar
  net: number;           // o que entra no caixa de fato
}

export function calculateDealCash(deal: Deal): CashBreakdown {
  const duration = deal.contract_duration || 12;
  const gross = (deal.value_mrr * duration) + deal.value_fixed;
  const royalties = gross * ROYALTIES_RATE;
  const anticipationFee = (deal.payment_method === 'credit_card' && deal.anticipate) ? gross * ANTICIPATION_RATE : 0;
  const net = gross - royalties - anticipationFee;
  return { gross, royalties, anticipationFee, net };
}

export interface MonthData {
  id: string;
  name: string;
  year: number;
  slug: string;
  working_days: number;

  unit_goal_mrr: number;
  matrix_goal_mrr: number;

  unit_goal_monetization?: number;
  matrix_goal_monetization?: number;

  manual_base_revenue?: number;

  broker_planned_investment?: number;
  broker_realized_investment?: number;
  broker_amount_spent?: number;
  broker_leads_bought?: number;

  deal_broker_investment?: number;
  deal_broker_deals_bought?: number;
}

export interface Deal {
  id: string;
  month_id: string;
  pipeline_type: PipelineType;
  client_name: string;
  status: DealStatus;
  type: DealType;

  value_mrr: number;
  value_fixed: number;

  contract_duration?: number;

  value_monetization?: number; // deprecated
  has_royalties?: boolean;     // deprecated — royalties always 20%
  acquisition_channel: FunnelType;
  sign_date?: string;
  start_date?: string;
  segment?: string;

  // Temperatura da negociação: 1 (frio) → 5 (quente)
  temperature?: 1 | 2 | 3 | 4 | 5;

  // Forma de Pagamento
  payment_method?: PaymentMethod;

  // Antecipar recebimento? (apenas cartão de crédito)
  anticipate?: boolean;
}

export interface FunnelStats {
  id: string;
  month_id: string;
  funnel_type: FunnelType;

  leads: number;
  leads_worked: number;
  calls: number;
  call_duration_minutes: number;

  connections: number;
  meetings_scheduled: number;
  meetings_realized: number;
  sales: number;
  invested_amount: number;
}

export interface UserProfile {
  email: string;
  role: 'admin' | 'viewer';
}

export const ADMIN_EMAILS = [
  'vinicius.hanzava@v4company.com',
  'gabriel.prates@v4company.com'
];
