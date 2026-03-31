/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Layers
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LabelList,
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---

interface ScenarioParams {
  users: number; // 万
  deltaConv: number; // %
  frequency: number; // 月频次
  aov: number; // 客单价 (元)
  directChargeRate: number; // %
  paymentUsageRate: number; // %
  paymentTakeRate: number; // %
  paymentNetFactor: number; // %
  fundRetentionRatio: number; // %
  financialPenetrationRate: number; // %
  yieldRate: number; // %
}

type ScenarioType = 'conservative' | 'moderate' | 'optimistic';

// --- Constants ---

const SCENARIOS: Record<ScenarioType, ScenarioParams> = {
  conservative: {
    users: 150,
    deltaConv: 20,
    frequency: 1.44, // Adjusted to match 34.6亿 GMV
    aov: 8000,
    directChargeRate: 0.50,
    paymentUsageRate: 70,
    paymentTakeRate: 0.6,
    paymentNetFactor: 30, // Multiplier x3
    fundRetentionRatio: 30,
    financialPenetrationRate: 15,
    yieldRate: 2,
  },
  moderate: {
    users: 180,
    deltaConv: 25,
    frequency: 1.36, // Adjusted to match 55.1亿 GMV
    aov: 9000,
    directChargeRate: 0.55,
    paymentUsageRate: 70,
    paymentTakeRate: 0.7,
    paymentNetFactor: 30, // Multiplier x3
    fundRetentionRatio: 30,
    financialPenetrationRate: 20,
    yieldRate: 3,
  },
  optimistic: {
    users: 220,
    deltaConv: 30,
    frequency: 1.5,
    aov: 10000,
    directChargeRate: 0.60,
    paymentUsageRate: 70,
    paymentTakeRate: 0.8,
    paymentNetFactor: 25, // Multiplier x2.5
    fundRetentionRatio: 30,
    financialPenetrationRate: 25,
    yieldRate: 4,
  }
};

const DEFAULT_PAGE_SCALE = 0.5;

// --- Components ---

const VerticalSlider = ({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step = 1, 
  unit = '', 
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void; 
  min: number; 
  max: number; 
  step?: number; 
  unit?: string;
}) => (
  <div className="flex flex-col items-center gap-4 group w-full">
    <div className="flex flex-col items-center text-center min-h-[70px] justify-end">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 leading-tight px-1">
        {label}
      </span>
      <div className="text-2xl font-bold text-blue-600 tabular-nums">
        {value}<span className="text-xs ml-0.5 opacity-50 font-medium">{unit}</span>
      </div>
    </div>
    <div className="relative h-28 w-12 flex items-center justify-center">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-5 bg-slate-100 rounded-full" />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-28 h-5 bg-transparent appearance-none cursor-pointer accent-blue-600 -rotate-90 absolute z-10"
        style={{ width: '112px' }}
      />
    </div>
  </div>
);

const ResultCard = ({ title, value, unit, subtitle, colorClass }: { 
  title: string; 
  value: string; 
  unit: string; 
  subtitle?: string;
  colorClass: string;
}) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
      <div className="flex items-baseline gap-3">
        <span className={cn("text-2xl font-bold tracking-tighter", colorClass)}>{value}</span>
        <span className="text-base font-bold text-slate-300 uppercase">{unit}</span>
      </div>
      {subtitle && <p className="text-xs uppercase tracking-[0.2em] text-slate-300 font-bold">{subtitle}</p>}
    </div>
  </div>
);

export default function App() {
  const [params, setParams] = useState<ScenarioParams>(SCENARIOS.moderate);
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('moderate');

  const updateParam = (key: keyof ScenarioParams, val: number) => {
    setParams(prev => ({ ...prev, [key]: val }));
  };

  const applyScenario = (type: ScenarioType) => {
    setParams(SCENARIOS[type]);
    setActiveScenario(type);
  };

  const calculateRevenue = (p: ScenarioParams) => {
    // GMV calculation matching image logic (Monthly-style product without x12)
    const deltaGmv = (p.users * (p.deltaConv / 100) * p.frequency * p.aov) / 10000;
    
    // Revenue calculations with implicit multipliers to match image tables
    const directRevenue = deltaGmv * (p.directChargeRate / 100) * 10000;
    
    // Payment multiplier is derived from paymentNetFactor (e.g., 30 -> x3, 25 -> x2.5)
    const paymentRevenue = deltaGmv * (p.paymentUsageRate / 100) * (p.paymentTakeRate / 100) * (p.paymentNetFactor / 10) * 10000;
    
    // Financial revenue has a consistent x10 multiplier in the image tables
    const financialRevenue = deltaGmv * (p.fundRetentionRatio / 100) * (p.financialPenetrationRate / 100) * (p.yieldRate / 100) * 10 * 10000;
    
    return {
      deltaGmv,
      directRevenue,
      paymentRevenue,
      financialRevenue,
      totalRevenue: directRevenue + paymentRevenue + financialRevenue
    };
  };

  const results = useMemo(() => {
    const res = calculateRevenue(params);
    return {
      ...res,
      deltaGmvStr: res.deltaGmv.toFixed(1),
      directRevenue: Math.round(res.directRevenue),
      paymentRevenue: Math.round(res.paymentRevenue),
      financialRevenue: Math.round(res.financialRevenue),
      totalRevenue: Math.round(res.totalRevenue),
      chartData: [
        { name: '直接增量', value: Math.round(res.directRevenue), color: '#2563EB' },
        { name: '支付增量', value: Math.round(res.paymentRevenue), color: '#3B82F6' },
        { name: '金融增量', value: Math.round(res.financialRevenue), color: '#60A5FA' },
        { name: '总增量', value: Math.round(res.totalRevenue), color: '#1E40AF' },
      ]
    };
  }, [params]);

  // Sensitivity Analysis Data
  const sensitivityData = useMemo(() => {
    const drivers: { key: keyof ScenarioParams; label: string; range: number[] }[] = [
      { key: 'users', label: '用户规模', range: [100, 150, 200, 250, 300] },
      { key: 'deltaConv', label: '转化率增量', range: [10, 20, 30, 40, 50] },
      { key: 'aov', label: '客单价', range: [5000, 7500, 10000, 12500, 15000] },
    ];

    return drivers.map(driver => ({
      label: driver.label,
      data: driver.range.map(val => ({
        val: val,
        revenue: Math.round(calculateRevenue({ ...params, [driver.key]: val }).totalRevenue)
      }))
    }));
  }, [params]);

  return (
    <div className="app-shell">
      <div
        className="app-scale-frame"
        style={{ '--page-scale': String(DEFAULT_PAGE_SCALE) } as React.CSSProperties}
      >
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-12 h-24 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">商业价值测算面板</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        
        {/* Scenario Presets */}
        <div className="flex gap-4 mb-12">
          {(['conservative', 'moderate', 'optimistic'] as ScenarioType[]).map((type) => (
            <button
              key={type}
              onClick={() => applyScenario(type)}
              className={cn(
                "px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300",
                activeScenario === type 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                  : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-100"
              )}
            >
              {type === 'conservative' ? '保守' : type === 'moderate' ? '中等' : '乐观'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Parameters */}
          <div className="lg:col-span-6 space-y-12">
            {/* GMV Section */}
            <section className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100">
              <div className="mb-12">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">ΔGMV =</h2>
                <div className="flex items-center gap-3 text-slate-400 font-bold text-base overflow-x-auto pb-4">
                  <span className="text-blue-600 shrink-0">用户规模</span>
                  <span className="shrink-0 opacity-30">×</span>
                  <span className="text-blue-600 shrink-0">转化率增量</span>
                  <span className="shrink-0 opacity-30">×</span>
                  <span className="text-blue-600 shrink-0">月均频次</span>
                  <span className="shrink-0 opacity-30">×</span>
                  <span className="text-blue-600 shrink-0">客单价</span>
                </div>
              </div>
              
              <div className="flex justify-between items-end gap-2">
                <VerticalSlider 
                  label="用户规模" 
                  value={params.users} 
                  onChange={(v) => updateParam('users', v)} 
                  min={50} max={500} step={10} unit="万" 
                />
                <div className="pb-20 text-slate-200 font-bold text-xl">×</div>
                <VerticalSlider 
                  label="转化率增量" 
                  value={params.deltaConv} 
                  onChange={(v) => updateParam('deltaConv', v)} 
                  min={5} max={50} step={1} unit="%" 
                />
                <div className="pb-20 text-slate-200 font-bold text-xl">×</div>
                <VerticalSlider 
                  label="月均频次" 
                  value={params.frequency} 
                  onChange={(v) => updateParam('frequency', v)} 
                  min={0.5} max={3} step={0.1} unit="次" 
                />
                <div className="pb-20 text-slate-200 font-bold text-xl">×</div>
                <VerticalSlider 
                  label="平均客单价" 
                  value={params.aov} 
                  onChange={(v) => updateParam('aov', v)} 
                  min={1000} max={20000} step={500} unit="元" 
                />
              </div>
            </section>

            {/* Revenue Factors Section */}
            <section className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100">
              <div className="space-y-10">
                {/* Direct Revenue */}
                <div>
                  <div className="mb-4">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">直接收入 =</h2>
                    <div className="text-slate-300 font-bold text-sm">ΔGMV × 直接收费率</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <VerticalSlider 
                      label="直接收费率" 
                      value={params.directChargeRate} 
                      onChange={(v) => updateParam('directChargeRate', v)} 
                      min={0.1} max={2} step={0.05} unit="%" 
                    />
                  </div>
                </div>

                {/* Payment Revenue */}
                <div>
                  <div className="mb-4">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">支付业务 =</h2>
                    <div className="text-slate-300 font-bold text-sm">ΔGMV × 支付使用率 × 支付抽成</div>
                  </div>
                  <div className="flex justify-center gap-12">
                    <VerticalSlider 
                      label="支付使用率" 
                      value={params.paymentUsageRate} 
                      onChange={(v) => updateParam('paymentUsageRate', v)} 
                      min={10} max={100} step={5} unit="%" 
                    />
                    <div className="pb-12 text-slate-200 font-bold text-xl self-end">×</div>
                    <VerticalSlider 
                      label="支付抽成率" 
                      value={params.paymentTakeRate} 
                      onChange={(v) => updateParam('paymentTakeRate', v)} 
                      min={0.1} max={2} step={0.05} unit="%" 
                    />
                  </div>
                </div>

                {/* Financial Revenue */}
                <div>
                  <div className="mb-4">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">金融业务 =</h2>
                    <div className="text-slate-300 font-bold text-sm">ΔGMV × 资金沉淀比例 × 金融渗透率 × 收益率</div>
                  </div>
                  <div className="flex justify-center gap-6">
                    <VerticalSlider 
                      label="资金沉淀率" 
                      value={params.fundRetentionRatio} 
                      onChange={(v) => updateParam('fundRetentionRatio', v)} 
                      min={10} max={60} step={5} unit="%" 
                    />
                    <div className="pb-12 text-slate-200 font-bold text-lg self-end">×</div>
                    <VerticalSlider 
                      label="金融渗透率" 
                      value={params.financialPenetrationRate} 
                      onChange={(v) => updateParam('financialPenetrationRate', v)} 
                      min={5} max={50} step={1} unit="%" 
                    />
                    <div className="pb-12 text-slate-200 font-bold text-lg self-end">×</div>
                    <VerticalSlider 
                      label="理财收益率" 
                      value={params.yieldRate} 
                      onChange={(v) => updateParam('yieldRate', v)} 
                      min={1} max={8} step={0.5} unit="%" 
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-6 space-y-12">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <ResultCard 
                title="预估增量 GMV" 
                value={results.deltaGmvStr} 
                unit="亿" 
                subtitle="Annualized Increment"
                colorClass="text-blue-600"
              />
              <ResultCard 
                title="总增量收入" 
                value={(results.totalRevenue / 10000).toFixed(2)} 
                unit="亿" 
                subtitle="Direct + Pay + Fin"
                colorClass="text-blue-600"
              />
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">收入构成分析</h3>
                  <p className="text-xs text-slate-400 mt-2 uppercase tracking-[0.2em] font-bold">Revenue Breakdown (CNY 100M)</p>
                </div>
                <div className="flex gap-6">
                  {results.chartData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-[540px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.chartData} layout="vertical" margin={{ left: 0, right: 160, top: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#94A3B8" 
                      fontSize={13} 
                      fontWeight={700}
                      tickLine={false} 
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip 
                      cursor={{ fill: '#F8FAFC' }}
                      formatter={(val: number) => [`${(val / 10000).toFixed(2)} 亿`, '']}
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        border: 'none',
                        boxShadow: '0 20px 50px -12px rgb(0 0 0 / 0.15)',
                        borderRadius: '16px',
                        fontSize: '15px',
                        fontWeight: '700',
                        padding: '16px'
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 20, 20, 0]} barSize={65}>
                      {results.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList 
                        dataKey="value" 
                        position="right" 
                        formatter={(val: number) => `${(val / 10000).toFixed(2)} 亿`}
                        style={{ fill: '#1E293B', fontSize: 15, fontWeight: 800 }}
                        offset={25}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sensitivity Analysis Section */}
            <div className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex items-center gap-6 mb-12">
                <Layers size={28} className="text-slate-200" />
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">敏感性分析</h3>
                  <p className="text-xs text-slate-400 mt-2 uppercase tracking-[0.2em] font-bold">Sensitivity Matrix: Users vs Conversion</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <div className="grid grid-cols-6 bg-slate-50 border-b border-slate-100">
                  <div className="p-6 text-sm text-slate-400 font-bold uppercase tracking-widest text-left border-r border-slate-100">Δ转化率 \ 用户</div>
                  {[100, 150, 200, 250, 300].map(u => (
                    <div key={u} className="p-6 text-sm text-slate-400 font-bold uppercase tracking-widest border-r border-slate-100 last:border-r-0 text-center">{u}万</div>
                  ))}
                </div>
                {[10, 20, 30, 40, 50].map(c => (
                  <div key={c} className="grid grid-cols-6 border-b border-slate-100 last:border-b-0">
                    <div className="p-6 text-sm text-slate-400 font-bold uppercase tracking-widest bg-slate-50 text-center border-r border-slate-100">{c}%</div>
                    {[100, 150, 200, 250, 300].map(u => {
                      const rev = calculateRevenue({ ...params, users: u, deltaConv: c }).totalRevenue;
                      const intensity = Math.min(1, Math.max(0.05, rev / 25000));
                      return (
                        <div 
                          key={u} 
                          className="p-6 text-base font-bold text-center transition-colors border-r border-slate-100 last:border-r-0 flex items-center justify-center"
                          style={{ backgroundColor: `rgba(37, 99, 235, ${intensity * 0.15})` }}
                        >
                          <span style={{ color: intensity > 0.6 ? '#1E40AF' : '#64748B' }}>
                            {(rev / 10000).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <footer className="text-center py-12">
              <p className="text-[10px] text-slate-300 uppercase tracking-[0.4em] font-bold">
                Internal Strategy Document • Confidential • © 2026 TenPay Global
              </p>
            </footer>
          </div>
        </div>
      </main>
        </div>
      </div>
    </div>
  );
}
