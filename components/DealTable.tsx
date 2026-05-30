import React, { useState } from 'react';
import { Deal, DealStatus, FunnelType, PaymentMethod, calculateDealCash, ROYALTIES_RATE, ANTICIPATION_RATE } from '../types';
import { Calendar, Plus, ChevronDown, LayoutList, Kanban as KanbanIcon, X as XIcon, CreditCard, Banknote, Flame, Zap } from 'lucide-react';
import { DealKanbanBoard } from './DealKanbanBoard';

interface DealTableProps {
  deals: Deal[];
  isAdmin: boolean;
  variant: 'acquisition' | 'monetization';
  onUpdateDeal: (id: string, field: keyof Deal, value: any) => void;
  onAddDeal?: () => void;
  onDeleteDeal?: (id: string) => void;
}

const STATUS_OPTIONS = [
  { value: DealStatus.SIGNED, label: 'Assinado', color: 'bg-green-100 text-green-700' },
  { value: DealStatus.SENT,   label: 'Na Rua',   color: 'bg-blue-100 text-blue-700' },
  { value: DealStatus.PENDING,label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  { value: DealStatus.LOST,   label: 'Perdido',  color: 'bg-gray-100 text-gray-600' }
];

const PAYMENT_OPTIONS = [
  { value: '',            label: '—',     color: 'text-gray-300' },
  { value: 'pix',         label: 'PIX',   color: 'bg-teal-50 text-teal-700' },
  { value: 'credit_card', label: 'Cartão',color: 'bg-purple-50 text-purple-700' },
];

const CHANNEL_OPTIONS = Object.values(FunnelType);
const DURATION_OPTIONS = [6, 12, 18];

const TEMPERATURE_CONFIG = [
  { value: 1, label: 'Frio',         emoji: '🧊', dot: 'bg-blue-500' },
  { value: 2, label: 'Morno-Frio',   emoji: '🌊', dot: 'bg-cyan-400' },
  { value: 3, label: 'Morno',        emoji: '☀️',  dot: 'bg-yellow-400' },
  { value: 4, label: 'Quente',       emoji: '🔥', dot: 'bg-orange-500' },
  { value: 5, label: 'Muito Quente', emoji: '💥', dot: 'bg-red-500' },
];

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const TemperatureSelector: React.FC<{ value: number; isAdmin: boolean; onSave: (v: number) => void }> = ({ value, isAdmin, onSave }) => {
  const current = TEMPERATURE_CONFIG.find(t => t.value === value) || TEMPERATURE_CONFIG[0];
  if (!isAdmin) return <span title={current.label}>{current.emoji}</span>;
  return (
    <div className="flex items-center gap-0.5">
      {TEMPERATURE_CONFIG.map(t => (
        <button
          key={t.value}
          onClick={() => onSave(t.value)}
          title={t.label}
          className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
            value === t.value
              ? `${t.dot} border-white shadow-md scale-125`
              : 'bg-gray-100 border-gray-200 opacity-40 hover:opacity-80 hover:scale-110'
          }`}
        />
      ))}
      <span className="ml-1 text-xs hidden xl:inline">{current.emoji}</span>
    </div>
  );
};

// Coluna financeira: pagamento + antecipação + caixa real
const FinanceCell: React.FC<{
  deal: Deal;
  isAdmin: boolean;
  onUpdate: (field: keyof Deal, val: any) => void;
}> = ({ deal, isAdmin, onUpdate }) => {
  const [editingMethod, setEditingMethod] = useState(false);
  const cash = calculateDealCash(deal);
  const isCard = deal.payment_method === 'credit_card';
  const isPix = deal.payment_method === 'pix';

  return (
    <div className="flex flex-col gap-1 min-w-[150px]">
      {/* Payment Method */}
      {isAdmin && editingMethod ? (
        <select
          autoFocus
          value={deal.payment_method || ''}
          onChange={e => { onUpdate('payment_method', e.target.value || null); setEditingMethod(false); }}
          onBlur={() => setEditingMethod(false)}
          className="text-xs border border-gray-200 rounded px-1 py-0.5 outline-none"
        >
          {PAYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <button
          onClick={() => isAdmin && setEditingMethod(true)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold self-start transition-all ${
            isCard ? 'bg-purple-50 text-purple-700 border border-purple-100' :
            isPix  ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                     'text-gray-300 border border-dashed border-gray-200'
          } ${isAdmin ? 'hover:opacity-80 cursor-pointer' : ''}`}
        >
          {isCard ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
          {isCard ? 'Cartão' : isPix ? 'PIX' : '—'}
        </button>
      )}

      {/* Anticipation toggle — only for credit card */}
      {isCard && (
        <button
          disabled={!isAdmin}
          onClick={() => isAdmin && onUpdate('anticipate', !deal.anticipate)}
          title={deal.anticipate ? `Antecipando — desconto de ${(ANTICIPATION_RATE * 100).toFixed(0)}%` : 'Clique para antecipar o recebimento'}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold self-start transition-all border ${
            deal.anticipate
              ? 'bg-orange-50 text-orange-700 border-orange-200'
              : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-orange-200 hover:text-orange-500'
          } ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <Zap className="w-3 h-3" />
          {deal.anticipate ? `Antecipar ${(ANTICIPATION_RATE * 100).toFixed(0)}%` : 'Antecipar?'}
        </button>
      )}

      {/* Cash breakdown — only if there's a value to show */}
      {cash.gross > 0 && (
        <div className="mt-0.5 pt-1 border-t border-gray-100 flex flex-col gap-0">
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Caixa</span>
          <span className="text-sm font-bold text-emerald-700">{fmt(cash.net)}</span>
          <span className="text-[10px] text-gray-400">
            -{fmt(cash.royalties)} royalties (20%)
            {cash.anticipationFee > 0 && <> · -{fmt(cash.anticipationFee)} ant.</>}
          </span>
        </div>
      )}
    </div>
  );
};

const EditableCell = ({
  value, type = 'text', isAdmin, onSave, options, textClass = ''
}: {
  value: string | number;
  type?: 'text' | 'number' | 'date' | 'select';
  options?: any[];
  isAdmin: boolean;
  onSave: (val: any) => void;
  textClass?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) onSave(type === 'number' ? Number(localValue) : localValue);
  };

  if (!isAdmin) {
    let display: React.ReactNode = value;
    if (type === 'number') display = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0 }).format(Number(value));
    if (type === 'select' && options) {
      const opt = options.find(o => o.value === value || o === value);
      return <span className={opt?.color || ''}>{opt?.label || opt || value}</span>;
    }
    return <span className={textClass}>{display}</span>;
  }

  if (!isEditing) {
    let displayValue: React.ReactNode = value;
    if (type === 'number') {
      displayValue = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0 }).format(Number(value));
    } else if (type === 'date' && !value) {
      displayValue = <span className="text-gray-300 text-xs italic flex items-center gap-1"><Calendar className="w-3 h-3"/>dd/mm/aaaa</span>;
    } else if (type === 'select' && options) {
      const opt = options.find(o => o.value === value || o === value);
      if (opt && typeof opt === 'object' && opt.color) {
        displayValue = <span className={`px-2 py-0.5 rounded text-xs font-bold ${opt.color}`}>{opt.label}</span>;
      } else {
        displayValue = <span className="flex items-center gap-1">{value} <ChevronDown className="w-3 h-3 text-gray-400"/></span>;
      }
    }
    return (
      <div onClick={() => setIsEditing(true)} className={`w-full h-full min-h-[30px] flex items-center cursor-pointer hover:bg-gray-50 rounded px-1 -ml-1 ${textClass}`}>
        {displayValue}
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <select autoFocus value={localValue} onChange={e => { setLocalValue(e.target.value); onSave(e.target.value); setIsEditing(false); }} onBlur={() => setIsEditing(false)} className="w-full border-none outline-none bg-transparent text-sm p-0 m-0 font-medium">
        {options.map((opt: any) => <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>)}
      </select>
    );
  }

  return (
    <input autoFocus type={type} value={localValue} onChange={e => setLocalValue(e.target.value)} onBlur={handleBlur} onKeyDown={e => e.key === 'Enter' && handleBlur()} className="w-full bg-transparent border-none outline-none p-0 text-sm focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none" style={{ MozAppearance: 'textfield' }} />
  );
};

export const DealTable: React.FC<DealTableProps> = ({ deals, isAdmin, onUpdateDeal, variant, onAddDeal, onDeleteDeal }) => {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const isAcquisition = variant === 'acquisition';
  const themeColor = isAcquisition ? 'v4-red' : 'amber-500';
  const headerBg = isAcquisition ? 'bg-v4-red' : 'bg-amber-500';

  const calculateStats = (status: DealStatus) => {
    const filtered = deals.filter(d => d.status === status);
    const mrr = filtered.reduce((acc, d) => acc + d.value_mrr, 0);
    const fixed = filtered.reduce((acc, d) => acc + d.value_fixed, 0);
    const gross = mrr + fixed;
    const cashNet = filtered.reduce((acc, d) => acc + calculateDealCash(d).net, 0);
    return { gross, mrr, fixed, cashNet };
  };

  const signedStats   = calculateStats(DealStatus.SIGNED);
  const sentStats     = calculateStats(DealStatus.SENT);
  const pendingStats  = calculateStats(DealStatus.PENDING);
  const lostStats     = calculateStats(DealStatus.LOST);

  // Total pipeline (signed + sent + pending) cash
  const pipelineCash = [DealStatus.SIGNED, DealStatus.SENT, DealStatus.PENDING]
    .flatMap(s => deals.filter(d => d.status === s))
    .reduce((acc, d) => acc + calculateDealCash(d).net, 0);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o contrato "${name}"?`)) {
      if (onDeleteDeal) onDeleteDeal(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white relative">
          <div className={`absolute top-0 left-0 w-full h-1 ${headerBg}`}></div>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className={`text-${themeColor}`}>👥</span> Gestão de Contratos ({isAcquisition ? 'Aquisição' : 'Monetização'})
            </h2>
            <div className="bg-gray-100 p-1 rounded-lg flex items-center">
              <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-600'}`} title="Table View">
                <LayoutList className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-600'}`} title="Kanban View">
                <KanbanIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          {isAdmin && (
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); if (onAddDeal) onAddDeal(); }} className={`${headerBg} text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity`}>
              <Plus className="w-4 h-4" /> {isAcquisition ? 'Novo Cliente' : 'Novo Contrato'}
            </button>
          )}
        </div>

        {viewMode === 'kanban' ? (
          <div className="p-6 bg-gray-50/50">
            <DealKanbanBoard deals={deals} isAdmin={isAdmin} onUpdateDeal={onUpdateDeal} variant={variant} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto min-h-[200px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4 font-medium w-32">Status</th>
                    <th className="p-4 font-medium">Nome do Cliente</th>
                    <th className="p-4 font-medium w-40">Canal</th>
                    <th className="p-4 font-medium">{isAcquisition ? 'Escopo (R$)' : 'Escopo/Projeto (R$)'}</th>
                    <th className="p-4 font-medium">{isAcquisition ? 'MRR (R$)' : 'Assessoria (R$)'}</th>
                    <th className="p-4 font-medium w-32">Duração</th>
                    <th className="p-4 font-medium w-52">
                      <span className="flex items-center gap-1">
                        💰 Financeiro
                      </span>
                    </th>
                    <th className="p-4 font-medium w-36">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3"/> Temperatura
                      </span>
                    </th>
                    <th className="p-4 font-medium">Assinatura</th>
                    <th className="p-4 font-medium">Início</th>
                    <th className="p-4 font-medium">Segmento</th>
                    {isAdmin && <th className="p-4 font-medium text-center w-12"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                  {deals.map(deal => (
                    <tr key={deal.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4">
                        <EditableCell value={deal.status} type="select" options={STATUS_OPTIONS} isAdmin={isAdmin} onSave={val => onUpdateDeal(deal.id, 'status', val)} />
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        <EditableCell value={deal.client_name} isAdmin={isAdmin} onSave={val => onUpdateDeal(deal.id, 'client_name', val)} />
                      </td>
                      <td className="p-4 text-gray-500">
                        <EditableCell value={deal.acquisition_channel} type="select" options={CHANNEL_OPTIONS} isAdmin={isAdmin} onSave={val => onUpdateDeal(deal.id, 'acquisition_channel', val)} />
                      </td>
                      <td className="p-4 font-mono">
                        <EditableCell value={deal.value_fixed} type="number" isAdmin={isAdmin} onSave={val => onUpdateDeal(deal.id, 'value_fixed', val)} />
                      </td>
                      <td className="p-4 font-mono font-semibold">
                        <EditableCell value={deal.value_mrr} type="number" isAdmin={isAdmin} onSave={val => onUpdateDeal(deal.id, 'value_mrr', val)} />
                      </td>
                      <td className="p-4">
                        <EditableCell value={deal.contract_duration || 12} type="select" options={DURATION_OPTIONS} isAdmin={isAdmin} onSave={val => onUpdateDeal(deal.id, 'contract_duration', Number(val))} textClass="text-gray-600 font-medium" />
                      </td>
                      <td className="p-4">
                        <FinanceCell
                          deal={deal}
                          isAdmin={isAdmin}
                          onUpdate={(field, val) => onUpdateDeal(deal.id, field, val)}
                        />
                      </td>
                      <td className="p-4">
                        <TemperatureSelector value={deal.temperature || 1} isAdmin={isAdmin} onSave={val => onUpdateDeal(deal.id, 'temperature', val)} />
                      </td>
                      <td className="p-4">
                        <EditableCell value={deal.sign_date || ''} type="date" isAdmin={isAdmin} onSave={val => onUpdateDeal(deal.id, 'sign_date', val)} />
                      </td>
                      <td className="p-4">
                        <EditableCell value={deal.start_date || ''} type="date" isAdmin={isAdmin} onSave={val => onUpdateDeal(deal.id, 'start_date', val)} />
                      </td>
                      <td className="p-4">
                        <EditableCell value={deal.segment || ''} isAdmin={isAdmin} onSave={val => onUpdateDeal(deal.id, 'segment', val)} />
                      </td>
                      {isAdmin && (
                        <td className="p-4 text-center">
                          <button onClick={() => handleDelete(deal.id, deal.client_name)} className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50" title="Excluir Contrato">
                            <XIcon className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {deals.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 12 : 11} className="p-8 text-center text-gray-400 italic">
                        Nenhum contrato encontrado nesta categoria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 border-t border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-gray-100 font-bold text-gray-700 text-sm uppercase tracking-wide flex items-center justify-between">
                <span>Resumo do Mês</span>
                <span className="text-xs font-medium text-gray-500 normal-case">Royalties: 20% · Antecipação cartão: 17%</span>
              </div>
              {/* header row */}
              <div className="grid grid-cols-5 gap-4 px-6 py-2 text-xs font-semibold text-gray-500 uppercase">
                <div>Categoria</div>
                <div>Contratado (Bruto)</div>
                <div>{isAcquisition ? 'MRR' : 'Assessoria'}</div>
                <div>Escopo</div>
                <div className="text-emerald-700">💰 Caixa Real</div>
              </div>
              {[
                { stats: signedStats,  dot: 'bg-green-500',  label: 'Assinado / Fechado',   labelColor: 'text-green-700'  },
                { stats: sentStats,    dot: 'bg-blue-500',   label: 'Na Rua (Proposta)',     labelColor: 'text-blue-700'   },
                { stats: pendingStats, dot: 'bg-yellow-400', label: 'Pendente (Negociação)', labelColor: 'text-yellow-700' },
                { stats: lostStats,    dot: 'bg-gray-400',   label: 'Perdido',               labelColor: 'text-gray-500'   },
              ].map(({ stats, dot, label, labelColor }) => (
                <div key={label} className="grid grid-cols-5 gap-4 px-6 py-3 border-b border-gray-100 hover:bg-white transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${dot}`}></div>
                    <span className={`font-bold ${labelColor}`}>{label}</span>
                  </div>
                  <div className="font-mono font-bold text-gray-800">{fmt(stats.gross)}</div>
                  <div className="font-mono text-gray-600">{fmt(stats.mrr)}</div>
                  <div className="font-mono text-gray-600">{fmt(stats.fixed)}</div>
                  <div className="font-mono font-bold text-emerald-700">{fmt(stats.cashNet)}</div>
                </div>
              ))}
              {/* Pipeline cash total */}
              <div className="px-6 py-3 bg-emerald-50 flex items-center justify-between border-t border-emerald-100">
                <span className="text-sm font-bold text-emerald-800">Pipeline total (excl. Perdido) — Caixa</span>
                <span className="font-mono font-extrabold text-emerald-700 text-lg">{fmt(pipelineCash)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
