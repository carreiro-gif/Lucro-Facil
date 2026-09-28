import React, { useState } from 'react';
import { 
  BarChart3, 
  Calendar, 
  DollarSign, 
  ShoppingBag, 
  Tag, 
  TrendingUp, 
  ShieldCheck, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Percent,
  Sparkles,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { BrendiConsolidatedReport } from '../utils/brendiReportParser';
import { formatMoney, formatPercent } from '../constants';
import { BrendiLogo, IFoodLogo, Food99Logo, WhatsAppLogo } from './PlatformLogos';

interface BrendiConsolidatedCardProps {
  report: BrendiConsolidatedReport;
  onDelete?: (reportId: string) => void;
  hasRealtimeOverlap?: boolean;
  realtimeRevenue?: number;
}

export const BrendiConsolidatedCard: React.FC<BrendiConsolidatedCardProps> = ({
  report,
  onDelete,
  hasRealtimeOverlap = false,
  realtimeRevenue = 0
}) => {
  const [showDailyDetails, setShowDailyDetails] = useState(false);
  const [showCouponDetails, setShowCouponDetails] = useState(false);

  const getPlatformIcon = (name: string) => {
    const norm = name.toLowerCase();
    if (norm.includes('ifood')) return <IFoodLogo className="w-4 h-4 shrink-0" />;
    if (norm.includes('99') || norm.includes('food99')) return <Food99Logo className="w-4 h-4 shrink-0" />;
    if (norm.includes('whatsapp') || norm.includes('whats')) return <WhatsAppLogo className="w-4 h-4 shrink-0" />;
    return <ShoppingBag className="w-4 h-4 text-purple-400 shrink-0" />;
  };

  return (
    <div className="bg-slate-900 border-2 border-purple-500/40 hover:border-purple-500/60 rounded-2xl p-5 text-white shadow-xl space-y-5 transition animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
            <BrendiLogo className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-white tracking-tight">
                Relatório Consolidado Brendi
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                Consolidado Oficial
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40">
                <ShieldCheck size={12} />
                Sub-seções Blindadas
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <Calendar size={13} className="text-purple-400" />
              <span>Período: <strong className="text-slate-200">{report.period.formattedPeriod}</strong></span>
              {report.fileName && (
                <span className="hidden md:inline text-slate-500">({report.fileName})</span>
              )}
            </div>
          </div>
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Deseja realmente remover o relatório consolidado do período ${report.period.formattedPeriod}?`)) {
                onDelete(report.id);
              }
            }}
            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition self-end sm:self-center"
            title="Excluir este relatório"
          >
            <Trash2 size={14} />
            <span>Remover</span>
          </button>
        )}
      </div>

      {/* Overlap Notice if Realtime exists */}
      {hasRealtimeOverlap && (
        <div className="bg-purple-950/40 border border-purple-800/40 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-300">
          <AlertCircle size={16} className="text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-purple-300 block font-bold">Aviso de Não Duplicação:</strong>
            <p className="leading-relaxed">
              Sua loja possui pedidos do Brendi em tempo real ativos no mês (totalizando <span className="font-bold text-white font-mono">{formatMoney(realtimeRevenue)}</span>). Para evitar duplicidade e manter a integridade, este relatório de {report.period.formattedPeriod} fica registrado para conferência de métricas e auditoria de canais, sem sobrepor o faturamento ao vivo.
            </p>
          </div>
        </div>
      )}

      {/* 4 Core Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Vendas Totais
          </span>
          <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-1 block">
            {formatMoney(report.metrics.totalSales)}
          </span>
          <span className="text-[10px] text-slate-400">
            Faturamento do período
          </span>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Total de Pedidos
          </span>
          <span className="text-lg sm:text-xl font-black text-white font-mono mt-1 block">
            {report.metrics.totalOrders} pedidos
          </span>
          <span className="text-[10px] text-purple-400">
            {report.metrics.ordersWithCoupon > 0 ? `${report.metrics.ordersWithCoupon} c/ cupom` : 'Concluídos'}
          </span>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Ticket Médio
          </span>
          <span className="text-lg sm:text-xl font-black text-brand-yellow font-mono mt-1 block">
            {formatMoney(report.metrics.averageTicket)}
          </span>
          <span className="text-[10px] text-slate-400">
            Média por pedido
          </span>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Cupons & Patrocinado
          </span>
          <span className="text-lg sm:text-xl font-black text-indigo-300 font-mono mt-1 block">
            {formatMoney(report.metrics.couponInvestment + report.metrics.sponsoredInvestment)}
          </span>
          <span className="text-[10px] text-slate-400">
            {formatMoney(report.metrics.couponInvestment)} cupons | {formatMoney(report.metrics.sponsoredInvestment)} patr.
          </span>
        </div>
      </div>

      {/* Platform Breakdown */}
      {report.platformDistribution.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <BarChart3 size={14} className="text-purple-400" />
              Distribuição por Plataforma ({report.platformDistribution.length} canais)
            </span>
            <span className="text-[11px] text-slate-400">
              Soma total exata: <strong className="text-emerald-400 font-mono">{formatMoney(report.metrics.totalSales)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {report.platformDistribution.map((plat, idx) => (
              <div 
                key={idx}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    {getPlatformIcon(plat.platform)}
                    <span className="text-xs font-bold text-white truncate">
                      {plat.platform}
                    </span>
                  </div>
                  <span className="text-xs font-black text-purple-300 font-mono shrink-0">
                    {formatPercent(plat.percent || (report.metrics.totalSales > 0 ? (plat.revenue / report.metrics.totalSales) * 100 : 0))}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-purple-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(2, plat.percent || (plat.revenue / report.metrics.totalSales) * 100))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{plat.orders} {plat.orders === 1 ? 'pedido' : 'pedidos'}</span>
                  <span className="font-bold text-white font-mono">{formatMoney(plat.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible Daily Sales Table */}
      {report.dailySales.length > 0 && (
        <div className="border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={() => setShowDailyDetails(!showDailyDetails)}
            className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-300 hover:text-white transition"
          >
            <span className="flex items-center gap-2">
              <Calendar size={14} className="text-purple-400" />
              Ver Vendas Diárias Detalhadas ({report.dailySales.length} dias de operação)
            </span>
            {showDailyDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showDailyDetails && (
            <div className="overflow-x-auto mt-3 bg-slate-950/60 rounded-xl border border-slate-800/80 p-2 animate-fade-in">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2 px-3">Data</th>
                    <th className="py-2 px-3 text-right">Vendas (R$)</th>
                    <th className="py-2 px-3 text-center">Pedidos</th>
                    <th className="py-2 px-3 text-center">Clientes</th>
                    <th className="py-2 px-3 text-right">Ticket Médio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {report.dailySales.map((d, i) => {
                    const avg = d.orders > 0 ? d.sales / d.orders : 0;
                    return (
                      <tr key={i} className="hover:bg-slate-900/60 text-slate-300">
                        <td className="py-2 px-3 font-mono font-medium text-white">{d.date}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">{formatMoney(d.sales)}</td>
                        <td className="py-2 px-3 text-center font-mono">{d.orders}</td>
                        <td className="py-2 px-3 text-center font-mono text-slate-400">{d.customers}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-300">{formatMoney(avg)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Collapsible Coupon Usage Table */}
      {report.couponsUsed.length > 0 && (
        <div className="border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={() => setShowCouponDetails(!showCouponDetails)}
            className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-300 hover:text-white transition"
          >
            <span className="flex items-center gap-2">
              <Tag size={14} className="text-indigo-400" />
              Ver Cupons Utilizados ({report.couponsUsed.length} cupons)
            </span>
            {showCouponDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showCouponDetails && (
            <div className="overflow-x-auto mt-3 bg-slate-950/60 rounded-xl border border-slate-800/80 p-2 animate-fade-in">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2 px-3">Código</th>
                    <th className="py-2 px-3">Origem</th>
                    <th className="py-2 px-3 text-center">Usos</th>
                    <th className="py-2 px-3 text-right">Investido</th>
                    <th className="py-2 px-3 text-right">Patrocinado</th>
                    <th className="py-2 px-3 text-right">Total Faturado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {report.couponsUsed.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-900/60 text-slate-300">
                      <td className="py-2 px-3 font-mono font-bold text-purple-300">{c.code}</td>
                      <td className="py-2 px-3 text-slate-400">{c.origin || 'Geral'}</td>
                      <td className="py-2 px-3 text-center font-mono">{c.count}</td>
                      <td className="py-2 px-3 text-right font-mono text-red-400">{formatMoney(c.investedAmount)}</td>
                      <td className="py-2 px-3 text-right font-mono text-indigo-300">{formatMoney(c.sponsoredAmount)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">{formatMoney(c.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
