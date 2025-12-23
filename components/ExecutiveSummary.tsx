import React, { useState } from 'react';
import { MonthData, Deal, DealStatus } from '../types';
import { DollarSign, TrendingUp, Target, Briefcase, Edit2, Coins } from 'lucide-react';

interface ExecutiveSummaryProps {
  variant: 'acquisition' | 'monetization';
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
  subtitle?: React.ReactNode;
  progress?: number;
  variantColor: string;
  onSave?: (val: number) => void;
  size?: 'normal' | 'small';
}> = ({ title, value, isEditable, isAdmin, icon, subtitle, progress, variantColor, onSave, size = 'normal' }) => {
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
      
      {(subtitle || progress !== undefined) && (
        <div>
          {subtitle}
          {progress !== undefined && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progresso</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${progress < 50 ? 'bg-red-500' : progress < 80 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ variant, month, deals, isAdmin, onUpdateMonth }) => {
  const isAcquisition = variant === 'acquisition';
  const themeColor = isAcquisition ? 'text-v4-red' : 'text-amber-600';

  // 1. Calculate Signed Totals
  const signedMRR = deals
    .filter(d => d.status === DealStatus.SIGNED)
    .reduce((sum, d) => sum + d.value_mrr, 0);

  const signedFixed = deals
    .filter(d => d.status === DealStatus.SIGNED)
    .reduce((sum, d) => sum + d.value_fixed, 0);

  const signedMonetization = deals
    .filter(d => d.status === DealStatus.SIGNED)
    .reduce((sum, d) => sum + (d.value_monetization || 0), 0);

  const signedPendingMonetization = deals
    .filter(d => d.status === DealStatus.SIGNED || d.status === DealStatus.PENDING)
    .reduce((sum, d) => sum + (d.value_monetization || 0), 0);

  // 2. Main KPI (Card 1) - Support Manual Override for MRR/Monetization Only
  let mainKpiValue = 0;
  if (isAcquisition) {
    mainKpiValue = month.manual_current_mrr !== undefined ? month.manual_current_mrr : signedMRR;
  } else {
    mainKpiValue = month.manual_monetization_current !== undefined ? month.manual_monetization_current : signedMonetization;
  }
  
  const mainKpiLabel = isAcquisition ? "MRR Atual" : "Monetização Atual";
  const mainKpiField = isAcquisition ? 'manual_current_mrr' : 'manual_monetization_current';

  // 3. Secondary KPI (Card 2)
  let secondaryKpiValue = 0;
  let isSecondaryEditable = false;

  if (isAcquisition) {
    // Faturamento Atual = Calculated strictly
    secondaryKpiValue = signedMRR + signedFixed;
    isSecondaryEditable = false; 
  } else {
    // Monetization Projected = Can be override
    secondaryKpiValue = month.manual_monetization_projected !== undefined ? month.manual_monetization_projected : signedPendingMonetization;
    isSecondaryEditable = true;
  }
  
  const secondaryKpiLabel = isAcquisition ? "Faturamento Atual" : "Monetização Projetada";
  const secondaryKpiSub = isAcquisition ? "(MRR + Escopo Assinado)" : "(Assinado + Pendente)";
  const secondaryKpiField = 'manual_monetization_projected';

  // 4. Goals & Progress
  // LOGIC CHANGE: The User wants the Goal Progress to be based on TOTAL SIGNED CONTRACTS (MRR + Fixed), 
  // NOT the MRR Atual (which might be manual).
  const unitGoal = isAcquisition ? month.unit_goal_mrr : month.unit_goal_monetization;
  const matrixGoal = isAcquisition ? month.matrix_goal_mrr : month.matrix_goal_monetization;

  const totalRevenueForGoal = isAcquisition ? (signedMRR + signedFixed) : mainKpiValue; // For Mon, keeping mainKpi as basis for now

  const unitProgress = unitGoal > 0 ? (totalRevenueForGoal / unitGoal) * 100 : 0;
  const matrixProgress = matrixGoal > 0 ? (totalRevenueForGoal / matrixGoal) * 100 : 0;

  return (
    <div className="space-y-6 mb-8">
      {/* Title */}
      <h2 className={`text-xl font-bold flex items-center gap-2 ${themeColor}`}>
        {isAcquisition ? <Briefcase className="w-6 h-6" /> : <Coins className="w-6 h-6" />}
        {isAcquisition ? "Resumo de Aquisição" : "Resumo de Monetização"}
      </h2>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI 1: MRR/Monetization Current */}
        <EditableCard 
          title={mainKpiLabel} 
          value={mainKpiValue} 
          isAdmin={isAdmin}
          isEditable={true} 
          variantColor={themeColor}
          onSave={(val) => onUpdateMonth(mainKpiField as keyof MonthData, val)}
          icon={isAcquisition ? <DollarSign className={`w-6 h-6 ${themeColor}`} /> : <Coins className={`w-6 h-6 ${themeColor}`} />}
          subtitle={<span className="text-xs text-gray-500">Contratos assinados (ou Manual)</span>}
        />

        {/* KPI 2: Revenue/Projection */}
        <EditableCard 
          title={secondaryKpiLabel} 
          value={secondaryKpiValue} 
          isAdmin={isAdmin} 
          isEditable={isSecondaryEditable}
          variantColor={themeColor}
          onSave={isSecondaryEditable ? (val) => onUpdateMonth(secondaryKpiField as keyof MonthData, val) : undefined}
          icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
          subtitle={<span className="text-xs text-gray-500">{secondaryKpiSub}</span>}
        />

        {/* Unit Goal */}
        <EditableCard 
          title={`Meta Unidade (${isAcquisition ? 'Total' : 'Monet.'})`} 
          value={unitGoal || 0} 
          isEditable 
          isAdmin={isAdmin} 
          variantColor={themeColor}
          onSave={(val) => onUpdateMonth(isAcquisition ? 'unit_goal_mrr' : 'unit_goal_monetization', val)}
          icon={<Target className="w-5 h-5 text-gray-400" />}
          progress={unitProgress}
        />

        {/* Matrix Goal */}
        <EditableCard 
          title={`Meta Matriz (${isAcquisition ? 'Total' : 'Monet.'})`} 
          value={matrixGoal || 0} 
          isEditable 
          isAdmin={isAdmin} 
          variantColor={themeColor}
          onSave={(val) => onUpdateMonth(isAcquisition ? 'matrix_goal_mrr' : 'matrix_goal_monetization', val)}
          icon={<Briefcase className="w-5 h-5 text-gray-400" />}
          progress={matrixProgress}
        />
      </div>
    </div>
  );
};