
import React, { useState, useEffect } from 'react';
import { MonthData, Deal, DealStatus } from '../types';
import { DollarSign, TrendingUp, Target, Briefcase, Edit2, Coins, PieChart, History, Wallet } from 'lucide-react';

interface ExecutiveSummaryProps {
  variant: 'acquisition' | 'monetization';
  month: MonthData;
  deals: Deal[];
  isAdmin: boolean;
  onUpdateMonth: (field: keyof MonthData, value: number) => void;
}

// Dynamic Vertical Bar Component with Inline Editing
const VerticalGoal: React.FC<{ 
  current: number; 
  target: number; 
  color: string; 
  label: string;
  isAdmin: boolean;
  onSave: (val: number) => void;
}> = ({ current, target, color, label, isAdmin, onSave }) => {
  // State for inline editing
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(target.toString());

  // Update local value if target changes externally
  useEffect(() => {
    setLocalValue(target.toString());
  }, [target]);

  // Determine the scale max to accommodate both target and current (with some headroom)
  const safeTarget = target || 1;
  const maxValue = Math.max(safeTarget, current) * 1.15; // 15% headroom
  
  const targetPercent = (safeTarget / maxValue) * 100;
  const currentPercent = (current / maxValue) * 100;

  const percentAchieved = (current / safeTarget) * 100;
  const isAchieved = current >= safeTarget;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseFloat(localValue);
    if (!isNaN(parsed) && parsed !== target) {
      onSave(parsed);
    } else {
      setLocalValue(target.toString()); // Revert if invalid or no change
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div className="flex flex-col items-center h-full w-full max-w-[120px]">
      {/* Header / Edit - Added relative and z-20 to ensure it sits above the chart */}
      <div className="text-center mb-2 relative z-20 w-full flex flex-col items-center min-h-[40px] justify-end">
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">{label}</span>
        
        {isEditing ? (
           <input
             autoFocus
             type="number"
             className="w-24 text-center font-bold text-xs bg-white border border-gray-300 rounded shadow-sm outline-none px-1 py-1 focus:ring-2 focus:ring-v4-red"
             value={localValue}
             onChange={(e) => setLocalValue(e.target.value)}
             onBlur={handleBlur}
             onKeyDown={handleKeyDown}
           />
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isAdmin) {
                setLocalValue(target.toString());
                setIsEditing(true);
              }
            }}
            disabled={!isAdmin}
            className={`group text-xs font-bold transition-all flex items-center justify-center gap-2 mx-auto px-3 py-1 rounded-md border border-transparent ${isAdmin ? 'hover:bg-gray-50 hover:border-gray-200 cursor-pointer text-gray-700' : 'text-gray-600'}`}
            title={isAdmin ? "Clique para editar a meta" : ""}
            type="button"
          >
             {formatCurrency(target)}
             {isAdmin && <Edit2 className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />}
          </button>
        )}
      </div>

      {/* Chart Container */}
      <div className="relative w-full flex-1 min-h-[140px] bg-gray-50 rounded-md border border-gray-100 mx-auto overflow-hidden group z-10">
         
         {/* Grid Lines (Optional decoration) */}
         <div className="absolute inset-0 flex flex-col justify-between p-2 opacity-10 pointer-events-none">
            <div className="border-t border-gray-400 w-full"></div>
            <div className="border-t border-gray-400 w-full"></div>
            <div className="border-t border-gray-400 w-full"></div>
         </div>

         {/* Target Line Indicator */}
         <div 
            className="absolute left-0 right-0 border-t-2 border-dashed border-gray-400 z-10 flex items-center justify-end pr-1 transition-all duration-700"
            style={{ bottom: `${targetPercent}%` }}
         >
            <span className="bg-white/80 backdrop-blur-sm text-[9px] text-gray-500 px-1.5 py-0.5 -mt-5 rounded border border-gray-200 shadow-sm font-medium">Meta</span>
         </div>

         {/* The Bar */}
         <div 
           className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 rounded-t-md transition-all duration-1000 ease-out shadow-sm"
           style={{ 
             height: `${currentPercent}%`, 
             backgroundColor: color,
             opacity: isAchieved ? 1 : 0.85
           }}
         >
            {/* Tooltip-ish Value on top of bar */}
            <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs font-bold whitespace-nowrap drop-shadow-sm bg-white/90 px-1.5 py-0.5 rounded shadow-sm border border-gray-100 text-gray-800 z-30">
               {percentAchieved.toFixed(0)}%
            </div>
         </div>
      </div>
    </div>
  );
};

// Improved EditableCard using string state for input
const EditableCard: React.FC<{
  title: string;
  value: number;
  isEditable?: boolean;
  isAdmin: boolean;
  icon: React.ReactNode;
  subtitle?: React.ReactNode;
  variantColor: string;
  onSave?: (val: number) => void;
  highlight?: boolean;
}> = ({ title, value, isEditable, isAdmin, icon, subtitle, variantColor, onSave, highlight }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value.toString());

  // Keep local value in sync if props change (unless editing)
  useEffect(() => {
     if (!isEditing) setLocalValue(value.toString());
  }, [value, isEditing]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
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
      setLocalValue(value.toString()); // Revert if invalid or no change
    }
  };

  const themeClass = variantColor.replace('text-', '');
  
  return (
    <div className={`bg-white rounded-xl shadow-sm border ${highlight ? `border-${themeClass} bg-${themeClass}/5` : 'border-gray-100'} flex flex-col justify-between h-full relative group hover:border-${themeClass} transition-colors p-5`}>
      <div className="flex justify-between items-start mb-1">
        <div className="w-full">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
            {title}
            {isEditable && isAdmin && <Edit2 className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100" />}
          </p>
          
          {isEditing ? (
            <input
              autoFocus
              className="font-bold text-gray-900 mt-1 w-full bg-transparent border-none outline-none p-0 focus:ring-0 appearance-none text-2xl"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
              style={{ MozAppearance: 'textfield' }} 
            />
          ) : (
            <h3 
              className={`font-bold text-gray-900 mt-1 text-2xl ${isEditable && isAdmin ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
              onClick={startEditing}
            >
              {formatCurrency(value)}
            </h3>
          )}
        </div>
        <div className={`p-2 rounded-lg ${highlight ? 'bg-white shadow-sm' : 'bg-gray-50'} flex-shrink-0`}>
          {icon}
        </div>
      </div>
      
      {subtitle && <div className="mt-1">{subtitle}</div>}
    </div>
  );
};

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ variant, month, deals, isAdmin, onUpdateMonth }) => {
  const isAcquisition = variant === 'acquisition';
  const themeColor = isAcquisition ? 'text-v4-red' : 'text-amber-600';
  const hexColor = isAcquisition ? '#E30613' : '#d97706';
  const borderColor = isAcquisition ? 'border-v4-red' : 'border-amber-600';

  // 1. CALCULATIONS (Actuals)
  const signedDeals = deals.filter(d => d.status === DealStatus.SIGNED);
  
  const signedMRR = signedDeals.reduce((sum, d) => sum + d.value_mrr, 0);
  const signedFixed = signedDeals.reduce((sum, d) => sum + d.value_fixed, 0);

  const closedThisMonth = signedMRR + signedFixed;

  // 2. MATRIX GOAL LOGIC (CONDITIONAL)
  // Acquisition: Escopo + (MRR * Duration)
  // Monetization: Escopo + MRR (Standard)
  const matrixAchievedValue = isAcquisition 
      ? signedDeals.reduce((sum, d) => {
          const duration = d.contract_duration || 12; // Default to 12 if missing
          return sum + d.value_fixed + (d.value_mrr * duration);
        }, 0)
      : closedThisMonth;

  // 3. REVENUE CONTEXT
  // "Provisionado" is the base revenue you start the month with (or expect to).
  const provisionedMRR = month.manual_base_revenue || 0;
  
  // For Visualization: Total = Provisioned + New
  const currentTotalRevenue = provisionedMRR + closedThisMonth;

  // 4. GOAL LOGIC (SEPARATE STRUCTURES)
  // We determine which fields to read/write based on the variant
  let targetUnitGoal = 1;
  let targetMatrixGoal = 1;
  let fieldUnit: keyof MonthData = 'unit_goal_mrr';
  let fieldMatrix: keyof MonthData = 'matrix_goal_mrr';

  if (isAcquisition) {
      targetUnitGoal = month.unit_goal_mrr || 0;
      targetMatrixGoal = month.matrix_goal_mrr || 0;
      fieldUnit = 'unit_goal_mrr';
      fieldMatrix = 'matrix_goal_mrr';
  } else {
      // Monetization
      targetUnitGoal = month.unit_goal_monetization || 0;
      targetMatrixGoal = month.matrix_goal_monetization || 0;
      fieldUnit = 'unit_goal_monetization';
      fieldMatrix = 'matrix_goal_monetization';
  }

  return (
    <div className="space-y-4 mb-8">
      {/* Title */}
      <h2 className={`text-xl font-bold flex items-center gap-2 ${themeColor}`}>
        {isAcquisition ? <Briefcase className="w-6 h-6" /> : <Coins className="w-6 h-6" />}
        {isAcquisition ? "Resumo de Aquisição" : "Resumo de Monetização"}
      </h2>

      {/* ROW 1: STRATEGIC INDICATORS */}
      <div className={`${isAcquisition ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "flex justify-center"}`}>
        
        {/* BLOCK 1: FATURAMENTO ATUAL (Custom Centered Layout - ACQUISITION ONLY) */}
        {isAcquisition && (
          <div className="h-full">
            <div className={`bg-white rounded-xl shadow-sm border ${borderColor} h-full p-6 relative overflow-hidden flex flex-col justify-center items-center text-center`}>
              
              {/* Top Label */}
              <div className="flex items-center gap-2 mb-2">
                 <TrendingUp className={`w-5 h-5 ${themeColor}`} />
                 <span className={`text-sm font-bold uppercase tracking-widest ${themeColor}`}>Faturamento Atual</span>
              </div>

              {/* Big Main Number */}
              <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(currentTotalRevenue)}
              </h1>

              {/* Breakdown Grid */}
              <div className="flex items-center justify-center gap-8 w-full border-t border-gray-100 pt-4">
                 <div className="flex flex-col items-center">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Provisionado</span>
                    <span className="text-lg font-bold text-gray-600 flex items-center gap-1">
                       <Wallet className="w-3 h-3 text-gray-400" />
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(provisionedMRR)}
                    </span>
                 </div>
                 <div className="h-8 w-px bg-gray-200"></div>
                 <div className="flex flex-col items-center">
                    <span className="text-[10px] text-green-600/70 uppercase font-semibold">Novos (Neste Mês)</span>
                    <span className="text-lg font-bold text-green-600 flex items-center gap-1">
                       <DollarSign className="w-3 h-3" />
                       +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(closedThisMonth)}
                    </span>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* BLOCK 2: GOALS (Dynamic Vertical Bars - SHARED LAYOUT, DIFFERENT DATA) */}
        <div className={isAcquisition ? "h-full" : "w-full md:w-1/2"}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full min-h-[240px]">
             
             {/* Header */}
             <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-400" />
                  Atingimento de Metas ({isAcquisition ? 'Aquisição' : 'Monetização'})
                </p>
             </div>
             
             <div className="flex items-end justify-center h-full gap-8 md:gap-16 pb-2">
                {/* Unit Goal */}
                <VerticalGoal 
                   label="Meta Unidade"
                   current={closedThisMonth} 
                   target={targetUnitGoal}
                   color={hexColor}
                   isAdmin={isAdmin}
                   onSave={(val) => onUpdateMonth(fieldUnit, val)}
                />

                {/* Matrix Goal - Uses matrixAchievedValue (Duration logic applied here) */}
                <VerticalGoal 
                   label="Meta Matriz"
                   current={matrixAchievedValue} 
                   target={targetMatrixGoal}
                   color="#1A1A1A"
                   isAdmin={isAdmin}
                   onSave={(val) => onUpdateMonth(fieldMatrix, val)}
                />
             </div>
             {isAcquisition && (
               <div className="text-center mt-2">
                 <p className="text-[10px] text-gray-400">* Meta Matriz considera: Escopo + (MRR x Duração)</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* ROW 2: BREAKDOWN (4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Card 1: Fechado no Mês */}
        <EditableCard 
          title="Fechado no Mês" 
          value={closedThisMonth} 
          isAdmin={isAdmin} 
          isEditable={false} 
          variantColor={themeColor}
          icon={<DollarSign className="w-4 h-4 text-green-600" />}
          subtitle={<span className="text-[10px] text-green-600 font-bold uppercase">Assessoria + Escopo</span>}
        />

        {/* Card 2: MRR (Assessoria) Only */}
        <EditableCard 
          title={isAcquisition ? "MRR (Novo)" : "Assessoria (Novo)"} 
          value={signedMRR} 
          isAdmin={isAdmin}
          isEditable={false} 
          variantColor="text-blue-600"
          icon={<Briefcase className="w-4 h-4 text-blue-400" />}
        />

        {/* Card 3: Fixed (Escopo) Only */}
        <EditableCard 
          title={isAcquisition ? "Escopo (Novo)" : "Escopo (Novo)"} 
          value={signedFixed} 
          isAdmin={isAdmin} 
          isEditable={false} 
          variantColor="text-purple-600"
          icon={<PieChart className="w-4 h-4 text-purple-400" />}
        />

        {/* Card 4: MRR Provisionado (Manual Input) */}
        {/* We keep this visible in both, but it's the same shared field */}
        <EditableCard 
          title="MRR Provisionado no mês" 
          value={provisionedMRR} 
          isAdmin={isAdmin} 
          isEditable={true} 
          onSave={(val) => onUpdateMonth('manual_base_revenue', val)}
          variantColor="text-gray-600"
          icon={<Wallet className="w-4 h-4 text-gray-500" />}
          subtitle={<span className="text-[10px] text-gray-400">Base de Cálculo</span>}
        />
      </div>
    </div>
  );
};
