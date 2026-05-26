import React, { useState } from 'react';
import { Calculator, DollarSign, Percent, Bike, Ticket, Info, Settings, HelpCircle, X, Package, ShieldAlert } from 'lucide-react';
import { formatMoney } from '../constants';

const SmartCalculator: React.FC = () => {
  const [activePlatform, setActivePlatform] = useState<'ifood' | '99food' | 'keeta'>('ifood');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Shared Inputs
  const [basePriceStr, setBasePriceStr] = useState('');

  // ==========================================
  // iFood State & Logic
  // ==========================================
  const [ifoodPlan, setIfoodPlan] = useState<'basico' | 'entrega'>('basico');
  const [ifoodCommissionStr, setIfoodCommissionStr] = useState('13.8'); 
  const [ifoodOnlinePaymentStr, setIfoodOnlinePaymentStr] = useState('3.2');
  const [ifoodSmartCampaignStr, setIfoodSmartCampaignStr] = useState('');
  const [ifoodCouponSubsidyStr, setIfoodCouponSubsidyStr] = useState('');
  const [ifoodDeliverySubsidyStr, setIfoodDeliverySubsidyStr] = useState('');

  const handleIfoodPlanChange = (plan: 'basico' | 'entrega') => {
    setIfoodPlan(plan);
    if (plan === 'basico') {
      setIfoodCommissionStr('13.8'); 
    } else {
      setIfoodCommissionStr('23'); 
    }
  };

  const basePrice = parseFloat(basePriceStr) || 0;
  
  const iCommission = parseFloat(ifoodCommissionStr) || 0;
  const iOnlinePayment = parseFloat(ifoodOnlinePaymentStr) || 0;
  const iSmartCampaign = parseFloat(ifoodSmartCampaignStr) || 0;
  const iCouponSubsidy = parseFloat(ifoodCouponSubsidyStr) || 0;
  const iDeliverySubsidy = parseFloat(ifoodDeliverySubsidyStr) || 0;

  const iTotalPercentage = (iCommission + iOnlinePayment) / 100;
  const iTotalFixed = iCouponSubsidy + iDeliverySubsidy + iSmartCampaign;
  
  let ifoodPrice = 0;
  if (iTotalPercentage < 1 && basePrice > 0) {
    ifoodPrice = (basePrice + iTotalFixed) / (1 - iTotalPercentage);
  }

  const iTotalFeesValue = ifoodPrice * iTotalPercentage;
  const iNetReceived = ifoodPrice - iTotalFeesValue - iTotalFixed;

  // ==========================================
  // 99Food State & Logic
  // ==========================================
  const [food99Plan, setFood99Plan] = useState<'propria' | 'parceira'>('propria');
  const [food99CommissionStr, setFood99CommissionStr] = useState('8.9'); 
  const [food99OnlinePaymentStr, setFood99OnlinePaymentStr] = useState('3.2');
  const [food99MarketingStr, setFood99MarketingStr] = useState('');
  const [food99SafetyMarginStr, setFood99SafetyMarginStr] = useState('');
  const [food99PackagingStr, setFood99PackagingStr] = useState('');

  const handleFood99PlanChange = (plan: 'propria' | 'parceira') => {
    setFood99Plan(plan);
    if (plan === 'propria') {
      setFood99CommissionStr('8.9'); 
    } else {
      setFood99CommissionStr('10.9'); 
    }
  };

  const fCommission = parseFloat(food99CommissionStr) || 0;
  const fOnlinePayment = parseFloat(food99OnlinePaymentStr) || 0;
  const fMarketing = parseFloat(food99MarketingStr) || 0;
  const fSafetyMargin = parseFloat(food99SafetyMarginStr) || 0;
  const fPackaging = parseFloat(food99PackagingStr) || 0;

  const fTotalPercentage = (fCommission + fOnlinePayment + fMarketing + fSafetyMargin) / 100;
  const fTotalFixed = fPackaging;
  
  let food99Price = 0;
  if (fTotalPercentage < 1 && basePrice > 0) {
    food99Price = (basePrice + fTotalFixed) / (1 - fTotalPercentage);
  }

  const fTotalFeesValue = food99Price * ((fCommission + fOnlinePayment) / 100);
  const fTotalMarketingValue = food99Price * ((fMarketing + fSafetyMargin) / 100);
  const fNetReceived = food99Price - fTotalFeesValue - fTotalMarketingValue - fTotalFixed;

  // ==========================================
  // Keeta State & Logic
  // ==========================================
  const [keetaPlan, setKeetaPlan] = useState<'promocional' | 'padrao'>('promocional');
  const [keetaCommissionStr, setKeetaCommissionStr] = useState('9.9'); 
  const [keetaOnlinePaymentStr, setKeetaOnlinePaymentStr] = useState('3.2');
  const [keetaMarketingStr, setKeetaMarketingStr] = useState('');
  const [keetaDeliverySubsidyStr, setKeetaDeliverySubsidyStr] = useState('');
  const [keetaPromoFixedStr, setKeetaPromoFixedStr] = useState('');
  const [keetaPackagingStr, setKeetaPackagingStr] = useState('');

  const handleKeetaPlanChange = (plan: 'promocional' | 'padrao') => {
    setKeetaPlan(plan);
    if (plan === 'promocional') {
      setKeetaCommissionStr('9.9'); 
    } else {
      setKeetaCommissionStr('12'); 
    }
  };

  const kCommission = parseFloat(keetaCommissionStr) || 0;
  const kOnlinePayment = parseFloat(keetaOnlinePaymentStr) || 0;
  const kMarketing = parseFloat(keetaMarketingStr) || 0;
  const kDeliverySubsidy = parseFloat(keetaDeliverySubsidyStr) || 0;
  const kPromoFixed = parseFloat(keetaPromoFixedStr) || 0;
  const kPackaging = parseFloat(keetaPackagingStr) || 0;

  const kTotalPercentage = (kCommission + kOnlinePayment + kMarketing) / 100;
  const kTotalFixed = kDeliverySubsidy + kPromoFixed + kPackaging;
  
  let keetaPrice = 0;
  if (kTotalPercentage < 1 && basePrice > 0) {
    keetaPrice = (basePrice + kTotalFixed) / (1 - kTotalPercentage);
  }

  const kTotalFeesValue = keetaPrice * ((kCommission + kOnlinePayment) / 100);
  const kTotalMarketingValue = keetaPrice * (kMarketing / 100);
  const kNetReceived = keetaPrice - kTotalFeesValue - kTotalMarketingValue - kTotalFixed;


  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Calculator className={activePlatform === 'ifood' ? 'text-[#ea1d2c]' : activePlatform === '99food' ? 'text-[#FFCC00]' : 'text-[#00E16A]'} size={32} />
            Calculadora Inteligente
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Descubra o preço exato para vender nos aplicativos sem perder dinheiro.
          </p>
        </div>
      </div>

      {/* PLATFORM TABS */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => setActivePlatform('ifood')} 
            className={`px-8 py-3 rounded-l-xl font-black uppercase tracking-wider text-sm transition-all ${activePlatform === 'ifood' ? 'bg-[#ea1d2c] text-white shadow-lg shadow-red-900/20 scale-105 z-10' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            iFood
          </button>
          <button onClick={() => { setActivePlatform('ifood'); setIsHelpOpen(true); }} className={`px-3 py-3 rounded-r-xl transition-all flex items-center justify-center ${activePlatform === 'ifood' ? 'bg-[#c81624] text-white shadow-lg shadow-red-900/20 scale-105 z-10' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600'}`} title="Ajuda iFood">
            <HelpCircle size={18} />
          </button>
        </div>

        <div className="flex items-center ml-2">
          <button 
            onClick={() => setActivePlatform('99food')} 
            className={`px-8 py-3 rounded-l-xl font-black uppercase tracking-wider text-sm transition-all ${activePlatform === '99food' ? 'bg-[#FFCC00] text-black shadow-lg shadow-yellow-900/20 scale-105 z-10' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            99Food
          </button>
          <button onClick={() => { setActivePlatform('99food'); setIsHelpOpen(true); }} className={`px-3 py-3 rounded-r-xl transition-all flex items-center justify-center ${activePlatform === '99food' ? 'bg-[#e6b800] text-black shadow-lg shadow-yellow-900/20 scale-105 z-10' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600'}`} title="Ajuda 99Food">
            <HelpCircle size={18} />
          </button>
        </div>

        <div className="flex items-center ml-2">
          <button 
            onClick={() => setActivePlatform('keeta')} 
            className={`px-8 py-3 rounded-l-xl font-black uppercase tracking-wider text-sm transition-all ${activePlatform === 'keeta' ? 'bg-[#00E16A] text-black shadow-lg shadow-green-900/20 scale-105 z-10' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            Keeta
          </button>
          <button onClick={() => { setActivePlatform('keeta'); setIsHelpOpen(true); }} className={`px-3 py-3 rounded-r-xl transition-all flex items-center justify-center ${activePlatform === 'keeta' ? 'bg-[#00c95e] text-black shadow-lg shadow-green-900/20 scale-105 z-10' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600'}`} title="Ajuda Keeta">
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* IFOOD CALCULATOR */}
      {/* ========================================== */}
      {activePlatform === 'ifood' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* LEFT COLUMN - INPUTS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* iFood Plan Toggle */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <label className="text-sm font-bold text-gray-900 dark:text-white mb-3 block">Escolha o tipo de entrega:</label>
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-950 rounded-xl">
                <button
                  onClick={() => handleIfoodPlanChange('basico')}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${ifoodPlan === 'basico' ? 'bg-[#ea1d2c] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Entrega Própria
                </button>
                <button
                  onClick={() => handleIfoodPlanChange('entrega')}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${ifoodPlan === 'entrega' ? 'bg-[#ea1d2c] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Entrega Parceira
                </button>
              </div>
            </div>

            {/* Base Price Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex flex-col">
                <label className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                  Preço de venda da sua loja:
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={basePriceStr}
                    onChange={(e) => setBasePriceStr(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl py-3 pl-12 pr-4 text-lg font-bold outline-none focus:border-[#ea1d2c] focus:ring-2 focus:ring-[#ea1d2c]/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Subsidies & Campaign Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block">
                  Média da Taxa de Entrega:
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={ifoodDeliverySubsidyStr}
                    onChange={(e) => setIfoodDeliverySubsidyStr(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl py-3 pl-12 pr-4 text-lg font-bold outline-none focus:border-[#ea1d2c] focus:ring-2 focus:ring-[#ea1d2c]/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block">
                  Campanha Inteligente:
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={ifoodSmartCampaignStr}
                    onChange={(e) => setIfoodSmartCampaignStr(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl py-3 pl-12 pr-4 text-lg font-bold outline-none focus:border-[#ea1d2c] focus:ring-2 focus:ring-[#ea1d2c]/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block">
                  Cupom (caso haja):
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={ifoodCouponSubsidyStr}
                    onChange={(e) => setIfoodCouponSubsidyStr(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl py-3 pl-12 pr-4 text-lg font-bold outline-none focus:border-[#ea1d2c] focus:ring-2 focus:ring-[#ea1d2c]/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Fees */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Settings size={16} className="text-gray-400" />
                Taxas do Plano (Avançado)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Comissão (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={ifoodCommissionStr}
                      onChange={(e) => setIfoodCommissionStr(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 pr-8 outline-none focus:border-[#ea1d2c] focus:ring-1 focus:ring-[#ea1d2c]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Pag. Online (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={ifoodOnlinePaymentStr}
                      onChange={(e) => setIfoodOnlinePaymentStr(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 pr-8 outline-none focus:border-[#ea1d2c] focus:ring-1 focus:ring-[#ea1d2c]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN - RESULTS */}
          <div className="lg:col-span-5">
            <div className="bg-[#ea1d2c] rounded-3xl p-8 shadow-2xl shadow-red-900/20 sticky top-6 text-center text-white">
              
              <h2 className="text-xl font-bold mb-4">Preço de venda iFood</h2>
              
              <div className="text-5xl font-black tracking-tighter mb-6">
                {formatMoney(ifoodPrice)}
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="opacity-90">
                  Percentual aplicado: <span className="font-bold">{(iTotalPercentage * 100).toFixed(1)}%</span>
                </p>
                <p className="opacity-90">
                  {ifoodPlan === 'basico' ? 'Entrega Própria' : 'Entrega Parceira'}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/20 text-left space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-80">
                  Prova Real
                </h3>
                <div className="flex justify-between items-center text-sm">
                  <span className="opacity-90">Preço iFood</span>
                  <span className="font-bold">{formatMoney(ifoodPrice)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="opacity-90">Taxas ({(iTotalPercentage * 100).toFixed(1)}%)</span>
                  <span className="font-bold text-red-200">- {formatMoney(iTotalFeesValue)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="opacity-90">Custos Fixos (Campanha/Entrega/Cupom)</span>
                  <span className="font-bold text-red-200">- {formatMoney(iTotalFixed)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-black pt-2 border-t border-white/20">
                  <span>Você Recebe</span>
                  <span className="text-green-300">{formatMoney(iNetReceived)}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* 99FOOD CALCULATOR */}
      {/* ========================================== */}
      {activePlatform === '99food' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* LEFT COLUMN - INPUTS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 99Food Plan Toggle */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <label className="text-sm font-bold text-gray-900 dark:text-white mb-3 block">Escolha o tipo de entrega (Plano Flex):</label>
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-950 rounded-xl">
                <button
                  onClick={() => handleFood99PlanChange('propria')}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${food99Plan === 'propria' ? 'bg-[#FFCC00] text-black shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Entrega Própria (8,9%)
                </button>
                <button
                  onClick={() => handleFood99PlanChange('parceira')}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${food99Plan === 'parceira' ? 'bg-[#FFCC00] text-black shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Entrega 99 (10,9%)
                </button>
              </div>
            </div>

            {/* Base Price Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex flex-col">
                <label className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                  Preço de venda da sua loja:
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={basePriceStr}
                    onChange={(e) => setBasePriceStr(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl py-3 pl-12 pr-4 text-lg font-bold outline-none focus:border-[#FFCC00] focus:ring-2 focus:ring-[#FFCC00]/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Variable Costs Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Percent size={16} className="text-[#FFCC00]" />
                Custos Variáveis (%)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Marketing / Cupons (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Ex: 10"
                      value={food99MarketingStr}
                      onChange={(e) => setFood99MarketingStr(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 pr-8 outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                  <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-1.5 flex items-start gap-1 font-medium">
                    <ShieldAlert size={14} className="shrink-0 mt-px" />
                    Recomendado: 10% para campanhas de visibilidade
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Margem de Segurança (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Ex: 2"
                      value={food99SafetyMarginStr}
                      onChange={(e) => setFood99SafetyMarginStr(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 pr-8 outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Para cobrir "entregas grátis" extras</p>
                </div>
              </div>
            </div>

            {/* Fixed Costs Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Package size={16} className="text-[#FFCC00]" />
                Custos Fixos (R$)
              </h3>
              
              <div>
                <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block">
                  Embalagem Delivery (Diferença):
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={food99PackagingStr}
                    onChange={(e) => setFood99PackagingStr(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl py-3 pl-12 pr-4 text-lg font-bold outline-none focus:border-[#FFCC00] focus:ring-2 focus:ring-[#FFCC00]/20 transition-all"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">Se a embalagem de delivery for mais cara que a de balcão, adicione a diferença aqui.</p>
              </div>
            </div>

            {/* Advanced Fees */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Settings size={16} className="text-gray-400" />
                Taxas do Plano (Avançado)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Comissão (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={food99CommissionStr}
                      onChange={(e) => setFood99CommissionStr(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 pr-8 outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Pag. Online (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={food99OnlinePaymentStr}
                      onChange={(e) => setFood99OnlinePaymentStr(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 pr-8 outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN - RESULTS */}
          <div className="lg:col-span-5">
            <div className="bg-[#FFCC00] rounded-3xl p-8 shadow-2xl shadow-yellow-900/10 sticky top-6 text-center text-yellow-950">
              
              <h2 className="text-xl font-bold mb-4">Preço de venda 99Food</h2>
              
              <div className="text-5xl font-black tracking-tighter mb-6">
                {formatMoney(food99Price)}
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="opacity-90">
                  Percentual total aplicado: <span className="font-bold">{(fTotalPercentage * 100).toFixed(1)}%</span>
                </p>
                <p className="opacity-90">
                  {food99Plan === 'propria' ? 'Entrega Própria' : 'Entrega 99'}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-yellow-900/20 text-left space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-80">
                  Prova Real
                </h3>
                <div className="flex justify-between items-center text-sm">
                  <span className="opacity-90">Preço 99Food</span>
                  <span className="font-bold">{formatMoney(food99Price)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="opacity-90">Taxas App ({((fCommission + fOnlinePayment)).toFixed(1)}%)</span>
                  <span className="font-bold text-red-700">- {formatMoney(fTotalFeesValue)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="opacity-90">Marketing & Segurança ({((fMarketing + fSafetyMargin)).toFixed(1)}%)</span>
                  <span className="font-bold text-red-700">- {formatMoney(fTotalMarketingValue)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="opacity-90">Custos Fixos (Embalagem)</span>
                  <span className="font-bold text-red-700">- {formatMoney(fTotalFixed)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-black pt-2 border-t border-yellow-900/20">
                  <span>Você Recebe</span>
                  <span className="text-green-800">{formatMoney(fNetReceived)}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* KEETA CALCULATOR */}
      {/* ========================================== */}
      {activePlatform === 'keeta' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* LEFT COLUMN - INPUTS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Keeta Plan Toggle */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <label className="text-sm font-bold text-gray-900 dark:text-white mb-3 block">Escolha o plano Keeta:</label>
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-950 rounded-xl mb-3">
                <button
                  onClick={() => handleKeetaPlanChange('promocional')}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${keetaPlan === 'promocional' ? 'bg-[#00E16A] text-black shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Promocional (1º ano)
                </button>
                <button
                  onClick={() => handleKeetaPlanChange('padrao')}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${keetaPlan === 'padrao' ? 'bg-[#00E16A] text-black shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Padrão (Após 1 ano)
                </button>
              </div>
              {keetaPlan === 'padrao' && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-900/30 flex gap-2 items-start animate-fade-in">
                  <Info className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" size={16} />
                  <p className="text-xs text-green-800 dark:text-green-200">
                    <strong>Consultoria Inteligente:</strong> Após o 1º ano, a comissão sobe automaticamente para 12% (totalizando 15,2% com a taxa de transação). Como a Keeta é focada em ofertas relâmpago, fique atento para não espremer sua margem!
                  </p>
                </div>
              )}
            </div>

            {/* Base Price Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex flex-col">
                <label className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                  Preço de venda da sua loja:
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={basePriceStr}
                    onChange={(e) => setBasePriceStr(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl py-3 pl-12 pr-4 text-lg font-bold outline-none focus:border-[#00E16A] focus:ring-2 focus:ring-[#00E16A]/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Variable Costs Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Percent size={16} className="text-[#00E16A]" />
                Custos Variáveis (%)
              </h3>
              
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Verba de Marketing / Cupons (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Ex: 10"
                    value={keetaMarketingStr}
                    onChange={(e) => setKeetaMarketingStr(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 pr-8 outline-none focus:border-[#00E16A] focus:ring-1 focus:ring-[#00E16A]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Recomendado: 10% a 15% (descontos agressivos para conversão inicial)</p>
              </div>
            </div>

            {/* Fixed Costs Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Package size={16} className="text-[#00E16A]" />
                Custos Fixos (R$)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Subsídio de Entrega (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Ex: 6,50"
                      value={keetaDeliverySubsidyStr}
                      onChange={(e) => setKeetaDeliverySubsidyStr(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 pl-9 outline-none focus:border-[#00E16A] focus:ring-1 focus:ring-[#00E16A]"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Taxa fixa de logística (se aplicável)</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Promoções Obrigatórias (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Ex: 5,00"
                      value={keetaPromoFixedStr}
                      onChange={(e) => setKeetaPromoFixedStr(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 pl-9 outline-none focus:border-[#00E16A] focus:ring-1 focus:ring-[#00E16A]"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Faixas de desconto financiadas por você</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Embalagem Delivery (Diferença R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={keetaPackagingStr}
                    onChange={(e) => setKeetaPackagingStr(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 pl-9 outline-none focus:border-[#00E16A] focus:ring-1 focus:ring-[#00E16A]"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Fees */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Settings size={16} className="text-gray-400" />
                Taxas do Plano (Avançado)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Comissão (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={keetaCommissionStr}
                      onChange={(e) => setKeetaCommissionStr(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 pr-8 outline-none focus:border-[#00E16A] focus:ring-1 focus:ring-[#00E16A]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Pag. Online (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={keetaOnlinePaymentStr}
                      onChange={(e) => setKeetaOnlinePaymentStr(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 pr-8 outline-none focus:border-[#00E16A] focus:ring-1 focus:ring-[#00E16A]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN - RESULTS */}
          <div className="lg:col-span-5">
            <div className="bg-[#00E16A] rounded-3xl p-8 shadow-2xl shadow-green-900/10 sticky top-6 text-center text-green-950">
              
              <h2 className="text-xl font-bold mb-4">Preço de venda Keeta</h2>
              
              <div className="text-5xl font-black tracking-tighter mb-6">
                {formatMoney(keetaPrice)}
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="opacity-90">
                  Percentual total aplicado: <span className="font-bold">{(kTotalPercentage * 100).toFixed(1)}%</span>
                </p>
                <p className="opacity-90">
                  {keetaPlan === 'promocional' ? 'Plano Promocional (1º ano)' : 'Plano Padrão'}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-green-900/20 text-left space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-80">
                  Prova Real
                </h3>
                <div className="flex justify-between items-center text-sm">
                  <span className="opacity-90">Preço Keeta</span>
                  <span className="font-bold">{formatMoney(keetaPrice)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="opacity-90">Taxas App ({((kCommission + kOnlinePayment)).toFixed(1)}%)</span>
                  <span className="font-bold text-red-700">- {formatMoney(kTotalFeesValue)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="opacity-90">Marketing ({kMarketing.toFixed(1)}%)</span>
                  <span className="font-bold text-red-700">- {formatMoney(kTotalMarketingValue)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="opacity-90">Custos Fixos (Logística/Promo/Emb.)</span>
                  <span className="font-bold text-red-700">- {formatMoney(kTotalFixed)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-black pt-2 border-t border-green-900/20">
                  <span>Você Recebe</span>
                  <span className="text-green-900">{formatMoney(kNetReceived)}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* HELP MODAL */}
      {/* ========================================== */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-6 flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <HelpCircle className={activePlatform === 'ifood' ? 'text-[#ea1d2c]' : activePlatform === '99food' ? 'text-[#FFCC00]' : 'text-[#00E16A]'} />
                Como usar a Calculadora {activePlatform === 'ifood' ? 'iFood' : activePlatform === '99food' ? '99Food' : 'Keeta'}
              </h2>
              <button onClick={() => setIsHelpOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              
              {activePlatform === 'ifood' && (
                <>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Preço de venda da sua loja</h3>
                    <p className="mb-2">Para utilizar nossa calculadora, você vai levar em consideração o preço de venda que você já costuma aplicar em seu cardápio. Esse preço de venda já deve levar em consideração aspectos como seus custos fixos e variáveis e sua margem de lucro.</p>
                    <p>O objetivo dessa calculadora é te mostrar qual o preço de venda que você pode praticar no iFood, considerando outros custos do uso da plataforma, tais como a comissão, entregas, campanhas e cupons. Ou seja, com base no preço que você já pratica em seu salão, vamos ajudá-lo a precificar corretamente para a plataforma.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Taxa de Entrega média</h3>
                    <p className="mb-2">A taxa de entrega é outro fator de suma importância a ser levada em consideração. Independentemente da sua entrega ser própria ou parceira iFood, você deve ter em mente qual a média desse gasto por pedido.</p>
                    <p>Desta forma, é importante você ter esse valor calculado em seu empreendimento, para que possa adicioná-lo à precificação dos seus produtos vendidos dentro da plataforma do iFood.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Campanha Inteligente</h3>
                    <p className="mb-2">Você costuma utilizar a Campanha Inteligente no iFood? Trata-se de uma ferramenta de promoções inteligente que permite você investir em mecanismos de promoção com alto retorno. Para utilizá-la, basta especificar o valor que você está disposto a colocar na campanha e a própria inteligência do iFood vai auxiliá-lo definir a segmentação para quem a campanha será exibida.</p>
                    <p>Caso você utilize este mecanismo, é importante que você também tenha em mente o gasto médio que costuma ter com ele por pedido. Assim, você também embute esse gasto no cálculo da precificação.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Cupom de desconto</h3>
                    <p className="mb-2">O Cupom de Desconto é outra estratégia que pode ajudar a turbinar as vendas. Existem variadas formas de cupons promocionais do iFood que as lojas parceiras podem empregar de acordo com suas metas estratégicas, seja para impulsionar o volume de vendas, atrair novos consumidores ou manter a lealdade dos clientes já existentes.</p>
                    <p>O ponto é que, caso você ofereça os cupons em sua loja, também é necessário que eles passem a integrar a precificação dos seus produtos no iFood.</p>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                    <p className="text-brand-red dark:text-red-400 font-medium">Dessa forma, chegamos no valor indicado de preço para você colocar em seus produtos dentro da plataforma do iFood. Com essa calculadora e com essa explicação, você vai poder garantir uma precificação adequada e saudável para o seu negócio.</p>
                  </div>
                </>
              )}

              {activePlatform === '99food' && (
                <>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1. Identifique seu Plano e Taxas</h3>
                    <p className="mb-2">A 99Food trabalha com modelos que variam conforme a autonomia de preço e logística:</p>
                    <ul className="list-disc pl-5 space-y-2 mb-4">
                      <li><strong>Plano Flex (Com Autonomia):</strong> Permite que você defina preços diferentes da loja física. A comissão é geralmente 8,9% (entrega própria) ou 10,9% (entrega pela 99) sobre o valor total. O pagamento online tem taxa de intermediação de aproximadamente 3,2%.</li>
                      <li><strong>Plano de Paridade (Preço de Loja):</strong> Exige que os preços no app sejam iguais aos da sua loja física. Neste plano, a comissão costuma ser zero ou reduzida, mas você não pode embutir as taxas no preço do prato.</li>
                    </ul>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900/30 flex gap-2 items-start">
                      <ShieldAlert className="text-yellow-600 shrink-0 mt-0.5" size={16} />
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">Nossa calculadora é focada no <strong>Plano Flex</strong>, onde você tem liberdade para aplicar o Markup.</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">2. O que adicionar ao Preço de Loja (Markup)</h3>
                    <p className="mb-2">Para chegar ao preço final no app, você deve considerar o custo de venda total, que não é apenas a comissão:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Comissão do App:</strong> 8,9% a 10,9%.</li>
                      <li><strong>Taxa de Transação:</strong> 3,2% (pagamento via app).</li>
                      <li><strong>Investimento em Marketing:</strong> Reserve cerca de 5% a 10% para cupons e promoções, essenciais para visibilidade.</li>
                      <li><strong>Custo de Embalagem Delivery:</strong> Se for mais cara que a de balcão, adicione a diferença em Reais (R$).</li>
                      <li><strong>Margem de Segurança:</strong> Recomendado adicionar uma folga percentual para cobrir as "2 primeiras entregas grátis" que podem sair do seu bolso em algumas campanhas.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">3. Fórmula de Cálculo (Markup Divisor)</h3>
                    <p>Não basta apenas somar a porcentagem ao preço da loja. Use a fórmula do Markup Divisor para não perder margem. Nossa calculadora já faz essa matemática complexa para você, garantindo que o valor líquido recebido seja exatamente o que você planejou.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">4. Pontos de Atenção no Contrato</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Repasse:</strong> O pagamento é feito semanalmente às quartas-feiras, sem custo de saque.</li>
                      <li><strong>Logística:</strong> Se usar a entrega da 99, fique atento à taxa baseada em quilometragem que pode ser debitada do seu repasse final.</li>
                      <li><strong>Monitoramento:</strong> Se o seu contrato exigir paridade de preços e você aumentar os valores, a 99 pode reduzir sua visibilidade ou aplicar penalidades.</li>
                    </ul>
                  </div>
                </>
              )}

              {activePlatform === 'keeta' && (
                <>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1. Estrutura de Taxas e Contrato</h3>
                    <p className="mb-2">A Keeta foca em comissões menores no primeiro ano para atrair lojistas:</p>
                    <ul className="list-disc pl-5 space-y-1 mb-4">
                      <li><strong>Comissão de Venda:</strong> 9,9% no primeiro ano (promocional) e 12% após o período promocional.</li>
                      <li><strong>Taxa de Pagamento:</strong> Aproximadamente 3,2% para transações via app.</li>
                      <li><strong>Mensalidade:</strong> Isenta no primeiro ano. Após o primeiro ano: R$ 4.000,00/mês.</li>
                      <li><strong>Prazo de Repasse:</strong> Liberação de recebíveis em 7 dias, sem taxa adicional de antecipação.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">2. Custos Operacionais e Logística</h3>
                    <p className="mb-2">A Keeta costuma embutir custos logísticos de forma mais direta no fluxo do pedido:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Subsídio de Entrega:</strong> Em alguns modelos, o restaurante arca com uma taxa fixa de logística (ex: R$ 6,50 dependendo da distância).</li>
                      <li><strong>Promoções Obrigatórias:</strong> A Keeta trabalha com faixas de desconto financiadas pelo restaurante (ex: R$ 5,00 em pedidos de R$ 25,00) para ganhar tração no algoritmo.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">3. O que Adicionar ao seu Preço de Loja (Markup)</h3>
                    <p className="mb-2">Para manter seu lucro, some as seguintes porcentagens antes de aplicar a fórmula:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Comissão + Transação:</strong> 13,1% (considerando o plano promocional de 9,9% + 3,2%).</li>
                      <li><strong>Verba de Marketing (Cupons):</strong> Reserve 10% a 15%, já que a plataforma exige descontos agressivos para conversão inicial.</li>
                      <li><strong>Diferença de Embalagem:</strong> Se houver.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">4. Fórmula de Precificação (Markup Divisor)</h3>
                    <p className="mb-4">Use a fórmula do Markup Divisor para garantir que as taxas incidam sobre o valor final e não sobre o preço de custo. A nossa calculadora já faz isso automaticamente para você!</p>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-3">Resumo Comparativo para sua Gestão</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-gray-500 uppercase bg-gray-100 dark:bg-gray-900">
                            <tr>
                              <th className="px-4 py-2 rounded-tl-lg">Item</th>
                              <th className="px-4 py-2">99Food</th>
                              <th className="px-4 py-2 rounded-tr-lg">Keeta (Promocional)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b dark:border-gray-700">
                              <td className="px-4 py-2 font-medium">Comissão</td>
                              <td className="px-4 py-2">~8,9% a 10,9%</td>
                              <td className="px-4 py-2">9,9% (12% após 1 ano)</td>
                            </tr>
                            <tr className="border-b dark:border-gray-700">
                              <td className="px-4 py-2 font-medium">Repasse</td>
                              <td className="px-4 py-2">Semanal (Quarta)</td>
                              <td className="px-4 py-2">7 dias (Corrido)</td>
                            </tr>
                            <tr className="border-b dark:border-gray-700">
                              <td className="px-4 py-2 font-medium">Mensalidade</td>
                              <td className="px-4 py-2">Isenta (acima de R$ 800)</td>
                              <td className="px-4 py-2">Isenta (1º ano)</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 font-medium rounded-bl-lg">Ponto Forte</td>
                              <td className="px-4 py-2">Integração com App de Corridas</td>
                              <td className="px-4 py-2 rounded-br-lg">Taxa de repasse rápida e app leve</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SmartCalculator;
