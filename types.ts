
export enum DealStatus {
  SIGNED = 'Signed',
  PENDING = 'Pending_Na_Rua',
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

export interface MonthData {
  id: string; // '2025-10'
  name: string;
  year: number;
  slug: string;
  working_days: number;
  
  // Goals
  unit_goal_mrr: number;
  matrix_goal_mrr: number;
  unit_goal_monetization: number;
  matrix_goal_monetization: number;

  // Manual Overrides
  manual_current_mrr?: number;
  manual_monetization_current?: number;
  manual_monetization_projected?: number;

  // Lead Broker
  broker_planned_investment?: number;
  broker_realized_investment?: number;
  broker_leads_bought?: number;

  // Deal Broker
  deal_broker_investment?: number;
  deal_broker_deals_bought?: number;
}

export interface Deal {
  id: string; // UUID
  month_id: string;
  client_name: string;
  status: DealStatus;
  type: DealType;
  value_mrr: number;
  value_fixed: number;
  value_monetization: number;
  acquisition_channel: FunnelType;
  sign_date?: string;
  start_date?: string;
  segment?: string;
}

export interface FunnelStats {
  id: string; // UUID
  month_id: string;
  funnel_type: FunnelType;
  
  // Productivity
  leads: number;
  leads_worked: number;
  calls: number;
  call_duration_minutes: number;

  // Funnel
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
