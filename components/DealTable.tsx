import React, { useState } from 'react';
import { Deal, DealStatus, FunnelType, PaymentMethod } from '../types';
import { Calendar, Plus, ChevronDown, LayoutList, Kanban as KanbanIcon, X as XIcon, CreditCard, Banknote, Crown, Flame } from 'lucide-react';
import { DealKanbanBoard } from './DealKanbanBoard';

interface DealTableProps {
  deals: Deal[];
  isAdmin: boolean;
  variant: 'acquisition' | 'monetization';
  onUpdateDeal: (id: string, field: keyof Deal, value: any) => void;
  onAddDeal?: () => void;
  onDeleteDeal?: (id: string) => void;
}

// Status Options
const STATUS_OPTIONS = [
  { value: DealStatus.SIGNED, label: 'Assinado', color: 'bg-green-100 text-green-700' },
  { value: DealStatus.SENT, label: 'Na Rua', color: 'bg-blue-100 text-blue-700' },
  { value: DealStatus.PENDING, label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  { value: DealStatus.LOST, label: 'Perdido', color: 'bg-gray-100 text-gray-600' }
];

const PAYMENT_OPTIONS = [
  { value: 'cash' as PaymentMethod, label: 'À Vista', color: 'bg-green-50 text-green-700' },
  { value: 'credit_card' as PaymentMethod, label: 'Cartão', color: 'bg-purple-50 text-purple-700' },
];

const CHANNEL_OPTIONS = Object.values(FunnelType);
const DURATION_OPTIONS = [6, 12, 18];

// Temperatura: 5 níveis frio→quente
const TEMPERATURE_CONFIG = [
  { value: 1, label: 'Frio',        emoji: '🧊', gradient: 'from-blue-500 to-blue-400',   bg: 'bg-blue-100',   text: 'text-blue-600',   dot: 'bg-blue-500' },
  { value: 2, label: 'Morno-Frio',  emoji: '🌊', gradient: 'from-cyan-400 to-teal-400',   bg: 'bg-cyan-50',    text: 'text-cyan-600',   dot: 'bg-cyan-400' },
  { value: 3, label: 'Morno',       emoji: '☀️',  gradient: 'from-yellow-400 to-amber-400', bg: 'bg-yellow-50',  text: 'text-yellow-600', dot: 'bg-yellow-400' },
  { value: 4, label: 'Quente',      emoji: '🔥', gradient: 'from-orange-500 to-orange-400', bg: 'bg-orange-50',  text: 'text-orange-600', dot: 'bg-orange-500' },
  { value: 5, label: 'Muito Quente',emoji: '💥', gradient: 'from-red-600 to-red-500',      bg: 'bg-red-50',     text: 'text-red-600',    dot: 'bg-red-500' },
];

const TemperatureSelector: React.FC<{
  value: number;
  isAdmin: boolean;
  onSave: (val: number) => void;
}> = ({ value, isAdmin, onSave }) => {
  const current = TEMPERATURE_CONFIG.find(t => t.value === value) || TEMPERATURE_CONFIG[0];

  if (!isAdmin) {
    return (
      <span title={current.label} className="text-base leading-none select-none">
        {current.emoji}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {TEMPERATURE_CONFIG.map((t) => (
        <button
          key={t.value}
          onClick={() => onSave(t.value)}
          title={t.label}
          className={`
            w-5 h-5 rounded-full border-2 transition-all duration-150
            ${value === t.value
              ? `${t.dot} border-white shadow-md scale-125`
              : `bg-gray-100 border-gray-200 hover:${t.dot} hover:scale-110 opacity-50`
            }
          `}
        />
      ))}
      <span className="ml-1 text-xs hidden xl:inline" title={current.label}>
        {current.emoji}
      </span>
    </div>
  );
};

const PaymentBadge: React.FC<{ method: PaymentMethod | undefined; value_mrr: number; value_fixed: number }> = ({
  method, value_mrr, value_fixed
}) => {
  const isCard = method === 'credit_card';
  const total = value_mrr + value_fixed;
  const netValue = isCard ? total * (1 - 0.17) : null;
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  if (!method) return <span className="text-gray-300 text-xs italic">—</span>;

  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${isCard ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'}`}>
        {isCard ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
        {isCard ? 'Cartão' : 'À Vista'}
      </span>
      {isCard && total > 0 && (
        <span className="text-[10px] text-purple-500 font-medium" title="Valor líquido após taxa de antecipação de 17%">
          Líq: {formatCurrency(netValue!)}
        </span>
      )}
    </div>
  );
};

const EditableCell = ({
  value,
  type = 'text',
  isAdmin,
  onSave,
  options,
  textClass = ''
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
    if (localValue !== value) {
      onSave(type === 'number' ? Number(localValue) : localValue);
    }
  };

  if (!isAdmin) {
    let display = value;
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
      displayValue = <span className="text-gray-300 text-xs italic flex items-center gap-1"><Calendar className="w-3 h-3"/> dd/mm/aaaa</span>;
    } else if (type === 'select' && options) {
        const selectedOpt = options.find(o => o.value === value || o === value);
        if (selectedOpt && typeof selectedOpt === 'object' && selectedOpt.color) {
            displayValue = (
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedOpt.color}`}>
                    {selectedOpt.label}
                </span>
            );
        } else {
            displayValue = (
                <span className="flex items-center gap-1">
                    {value} <ChevronDown className="w-3 h-3 text-gray-400" />
                </span>
            );
        }
    }

    return (
      <div
        onClick={() => setIsEditing(true)}
        className={`w-full h-full min-h-[30px] flex items-center cursor-pointer hover:bg-gray-50 rounded px-1 -ml-1 ${textClass}`}
      >
        {displayValue}
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <select
        autoFocus
        value={localValue}
        onChange={(e) => {
            setLocalValue(e.target.value);
            onSave(e.target.value);
            setIsEditing(false);
        }}
        onBlur={() => setIsEditing(false)}
        className="w-full border-none outline-none bg-transparent text-sm p-0 m-0 font-medium"
      >
        {options.map((opt: any) => (
            <option key={opt.value || opt} value={opt.value || opt}>
                {opt.label || opt}
            </option>
        ))}
      </select>
    );
  }

  return (
    <input
      autoFocus
      type={type}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
      className="w-full bg-transparent border-none outline-none p-0 text-sm focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none"
      style={{ MozAppearance: 'textfield' }}
    />
  );
};

export const DealTable: React.FC<DealTableProps> = ({ deals, isAdmin, onUpdateDeal, variant, onAddDeal, onDeleteDeal }) => {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const isAcquisition = variant === 'acquisition';
  const themeColor = isAcquisition ? 'v4-red' : 'amber-500';
  const headerBg = isAcquisition ? 'bg-v4-red' : 'bg-amber-500';

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const calculateStats = (status: DealStatus) => {
    const filtered = deals.filter(d => d.status === status);
    const mrr = filtered.reduce((acc, d) => acc + d.value_mrr, 0);
    const fixed = filtered.reduce((acc, d) => acc + d.value_fixed, 0);
    const total = mrr + fixed;
    return { total, mrr, fixed };
  };

  const signedStats = calculateStats(DealStatus.SIGNED);
  const sentStats = calculateStats(DealStatus.SENT);
  const pendingStats = calculateStats(DealStatus.PENDING);
  const lostStats = calculateStats(DealStatus.LOST);

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
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Table View"
                >
                   <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Kanban View"
                >
                   <KanbanIcon className="w-4 h-4" />
                </button>
             </div>
          </div>

          {isAdmin && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onAddDeal) onAddDeal();
              }}
              className={`${headerBg} text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity`}
            >
              <Plus className="w-4 h-4" /> {isAcquisition ? 'Novo Cliente' : 'Novo Contrato'}
            </button>
          )}
        </div>

        {viewMode === 'kanban' ? (
          <div className="p-6 bg-gray-50/50">
             <DealKanbanBoard
               deals={deals}
               isAdmin={isAdmin}
               onUpdateDeal={onUpdateDeal}
               variant={variant}
             />
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
                    <th className="p-4 font-medium">{isAcquisition ? 'Escopo Fechado (R$)' : 'Escopo/Projeto (R$)'}</th>
                    <th className="p-4 font-medium">{isAcquisition ? 'Recorrente/MRR (R$)' : 'Assessoria/MRR (R$)'}</th>
                    <th className="p-4 font-medium w-32">Duração (Meses)</th>
                    <th className="p-4 font-medium w-36">Pagamento</th>
                    <th className="p-4 font-medium w-24 text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Crown className="w-3 h-3" /> Royalties
                      </span>
                    </th>
                    <th className="p-4 font-medium w-36">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Temperatura
                      </span>
                    </th>
                    <th className="p-4 font-medium">Data da Assinatura</th>
                    <th className="p-4 font-medium">Data de Início</th>
                    <th className="p-4 font-medium">Segmento</th>
                    {isAdmin && <th className="p-4 font-medium text-center w-12"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                  {deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4">
                        <EditableCell
                          value={deal.status}
                          type="select"
                          options={STATUS_OPTIONS}
                          isAdmin={isAdmin}
                          onSave={(val) => onUpdateDeal(deal.id, 'status', val)}
                        />
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        <EditableCell
                          value={deal.client_name}
                          isAdmin={isAdmin}
                          onSave={(val) => onUpdateDeal(deal.id, 'client_name', val)}
                        />
                      </td>
                      <td className="p-4 text-gray-500">
                        <EditableCell
                          value={deal.acquisition_channel}
                          type="select"
                          options={CHANNEL_OPTIONS}
                          isAdmin={isAdmin}
                          onSave={(val) => onUpdateDeal(deal.id, 'acquisition_channel', val)}
                        />
                      </td>
                      <td className="p-4 font-mono">
                        <EditableCell
                          value={deal.value_fixed}
                          type="number"
                          isAdmin={isAdmin}
                          onSave={(val) => onUpdateDeal(deal.id, 'value_fixed', val)}
                        />
                      </td>
                      <td className="p-4 font-mono font-semibold">
                        <EditableCell
                          value={deal.value_mrr}
                          type="number"
                          isAdmin={isAdmin}
                          onSave={(val) => onUpdateDeal(deal.id, 'value_mrr', val)}
                        />
                      </td>

                      {/* Duration */}
                      <td className="p-4">
                        <EditableCell
                          value={deal.contract_duration || 12}
                          type="select"
                          options={DURATION_OPTIONS}
                          isAdmin={isAdmin}
                          onSave={(val) => onUpdateDeal(deal.id, 'contract_duration', Number(val))}
                          textClass="text-gray-600 font-medium"
                        />
                      </td>

                      {/* Forma de Pagamento */}
                      <td className="p-4">
                        {isAdmin ? (
                          <div className="flex flex-col gap-1">
                            <EditableCell
                              value={deal.payment_method || ''}
                              type="select"
                              options={[{ value: '', label: '—', color: 'text-gray-300' }, ...PAYMENT_OPTIONS]}
                              isAdmin={isAdmin}
                              onSave={(val) => onUpdateDeal(deal.id, 'payment_method', val || null)}
                            />
                            {deal.payment_method === 'credit_card' && (deal.value_mrr + deal.value_fixed) > 0 && (
                              <span className="text-[10px] text-purple-500 font-medium" title="Valor líquido após 17% de antecipação">
                                Líq: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format((deal.value_mrr + deal.value_fixed) * 0.83)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <PaymentBadge method={deal.payment_method} value_mrr={deal.value_mrr} value_fixed={deal.value_fixed} />
                        )}
                      </td>

                      {/* Royalties */}
                      <td className="p-4 text-center">
                        {isAdmin ? (
                          <button
                            onClick={() => onUpdateDeal(deal.id, 'has_royalties', !deal.has_royalties)}
                            title={deal.has_royalties ? 'Royalties inclusos (20%) — clique para remover' : 'Sem royalties — clique para adicionar'}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border transition-all ${
                              deal.has_royalties
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-gray-50 text-gray-300 border-gray-200 hover:border-amber-200 hover:text-amber-400'
                            }`}
                          >
                            <Crown className="w-3 h-3" />
                            {deal.has_royalties ? '20%' : '—'}
                          </button>
                        ) : (
                          deal.has_royalties
                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700"><Crown className="w-3 h-3" />20%</span>
                            : <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Temperatura */}
                      <td className="p-4">
                        <TemperatureSelector
                          value={deal.temperature || 1}
                          isAdmin={isAdmin}
                          onSave={(val) => onUpdateDeal(deal.id, 'temperature', val)}
                        />
                      </td>

                      <td className="p-4">
                        <EditableCell
                          value={deal.sign_date || ''}
                          type="date"
                          isAdmin={isAdmin}
                          onSave={(val) => onUpdateDeal(deal.id, 'sign_date', val)}
                        />
                      </td>
                      <td className="p-4">
                        <EditableCell
                          value={deal.start_date || ''}
                          type="date"
                          isAdmin={isAdmin}
                          onSave={(val) => onUpdateDeal(deal.id, 'start_date', val)}
                        />
                      </td>
                      <td className="p-4">
                        <EditableCell
                          value={deal.segment || ''}
                          isAdmin={isAdmin}
                          onSave={(val) => onUpdateDeal(deal.id, 'segment', val)}
                        />
                      </td>
                      {isAdmin && (
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDelete(deal.id, deal.client_name)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                            title="Excluir Contrato"
                          >
                             <XIcon className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {deals.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 13 : 12} className="p-8 text-center text-gray-400 italic">
                        Nenhum contrato encontrado nesta categoria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 border-t border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-gray-100 font-bold text-gray-700 text-sm uppercase tracking-wide">
                  Resumo do Mês
              </div>
              <div className="grid grid-cols-4 gap-4 px-6 py-2 text-xs font-semibold text-gray-500 uppercase">
                  <div>Categoria</div>
                  <div>Valor Total</div>
                  <div>{isAcquisition ? 'Recorrente (MRR)' : 'Assessoria (MRR)'}</div>
                  <div>{isAcquisition ? 'Escopo Fechado' : 'Escopo/Projeto'}</div>
              </div>
              <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-gray-100 hover:bg-white transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="font-bold text-green-700">Assinado / Fechado</span>
                  </div>
                  <div className="font-mono font-bold text-gray-800">{formatCurrency(signedStats.total)}</div>
                  <div className="font-mono text-gray-600">{formatCurrency(signedStats.mrr)}</div>
                  <div className="font-mono text-gray-600">{formatCurrency(signedStats.fixed)}</div>
              </div>
              <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-gray-100 hover:bg-white transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="font-bold text-blue-700">Na Rua (Proposta)</span>
                  </div>
                  <div className="font-mono font-bold text-gray-800">{formatCurrency(sentStats.total)}</div>
                  <div className="font-mono text-gray-600">{formatCurrency(sentStats.mrr)}</div>
                  <div className="font-mono text-gray-600">{formatCurrency(sentStats.fixed)}</div>
              </div>
              <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-gray-100 hover:bg-white transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <span className="font-bold text-yellow-700">Pendente (Negociação)</span>
                  </div>
                  <div className="font-mono font-bold text-gray-800">{formatCurrency(pendingStats.total)}</div>
                  <div className="font-mono text-gray-600">{formatCurrency(pendingStats.mrr)}</div>
                  <div className="font-mono text-gray-600">{formatCurrency(pendingStats.fixed)}</div>
              </div>
              <div className="grid grid-cols-4 gap-4 px-6 py-3 hover:bg-white transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span className="font-bold text-gray-500">Perdido</span>
                  </div>
                  <div className="font-mono font-bold text-gray-400">{formatCurrency(lostStats.total)}</div>
                  <div className="font-mono text-gray-400">{formatCurrency(lostStats.mrr)}</div>
                  <div className="font-mono text-gray-400">{formatCurrency(lostStats.fixed)}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
