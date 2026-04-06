import { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Tag, Tabs, message, Empty } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie,
} from 'recharts';
import {
    TrendingUp, TrendingDown, CreditCard,
    RefreshCw, TriangleAlert, Lightbulb,
    Sparkles,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { User, Check } from 'lucide-react';

/* ─── Category metadata ─── */
const CAT_META = {
    food: { label: 'Food & Dining', icon: '🍜', color: '#0D9488' },
    shopping: { label: 'Shopping', icon: '🛍️', color: '#D97706' },
    transport: { label: 'Transport', icon: '🚕', color: '#475569' },
    utilities: { label: 'Utilities', icon: '⚡', color: '#E11D48' },
    entertainment: { label: 'Entertainment', icon: '🎬', color: '#7C3AED' },
    subscriptions: { label: 'Subscriptions', icon: '🔁', color: '#0369A1' },
    health: { label: 'Health & Medical', icon: '💊', color: '#D97706' },
    salary: { label: 'Salary / Income', icon: '💰', color: '#059669' },
    other: { label: 'Other', icon: '📌', color: '#6B7280' },
};

const catIcon = (c) => CAT_META[c]?.icon ?? '📌';
const catColor = (c) => CAT_META[c]?.color ?? '#6B7280';
const catBg = (c) => ({
    food: '#F0FDFA', shopping: '#FFFBEB', transport: '#F8FAFC',
    utilities: '#FFF1F2', entertainment: '#F5F3FF', subscriptions: '#F0F9FF',
    health: '#FFFBEB', salary: '#F0FDF4', other: '#F9FAFB'
}[c] ?? '#F9FAFB');
const catLabel = (c) => CAT_META[c]?.label ?? c;

const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.abs(n));

const fmtK = (n) => n >= 1000 ? `₹${(n / 1000).toFixed(0)}k` : `₹${n}`;

/* ─── Compute last-6-month trend ─── */
function computeTrends(txns) {
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('en-IN', { month: 'short' }) });
    }
    return months.map(({ year, month, label }) => {
        const slice = txns.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });
        const spend = slice.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);
        const income = slice.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);
        return { month: label, spend, income };
    });
}

/* ─── Compute 7-day sparkline for one metric ─── */
function compute7DaySparkline(txns, type) {
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const total = txns
            .filter(t => t.date === dayStr && (type === 'both' ? true : t.type === type))
            .reduce((s, t) => s + Number(t.amount), 0);
        result.push({ v: total });
    }
    return result;
}

/* ─── Compute category breakdown ─── */
function computeCatBreakdown(txns) {
    const map = {};
    txns.filter(t => t.type === 'debit').forEach(t => {
        map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([cat, value]) => ({ name: catLabel(cat), value, color: catColor(cat) }));
}

/* ─────────────────── Skeleton Components ─────────────────── */
const SkeletonCard = () => (
    <div className="mm-metric-card" style={{ minHeight: 130 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <span className="skeleton" style={{ height: 11, width: '42%' }} />
            <span className="skeleton" style={{ height: 30, width: 30, borderRadius: 8 }} />
        </div>
        <span className="skeleton" style={{ height: 28, width: '62%', display: 'block', marginBottom: 12 }} />
        <span className="skeleton" style={{ height: 10, width: '36%', display: 'block', marginBottom: 14 }} />
        <span className="skeleton" style={{ height: 36, width: '100%', display: 'block', borderRadius: 6 }} />
    </div>
);

const SkeletonRow = () => (
    <div className="mm-txn-row">
        <span className="skeleton" style={{ width: 38, height: 38, borderRadius: 10, display: 'block', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
            <span className="skeleton" style={{ height: 12, width: '55%', display: 'block', marginBottom: 6 }} />
            <span className="skeleton" style={{ height: 10, width: '35%', display: 'block' }} />
        </div>
        <span className="skeleton" style={{ height: 12, width: 55, display: 'block', marginLeft: 'auto' }} />
        <span className="skeleton" style={{ height: 14, width: 65, display: 'block', borderRadius: 5 }} />
    </div>
);

/* ─── Tiny Sparkline ─── */
const Sparkline = ({ data, color }) => (
    <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
                <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.20} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={1.8}
                fill={`url(#spark-${color.replace('#', '')})`}
                dot={false}
                isAnimationActive
                animationDuration={900}
            />
        </AreaChart>
    </ResponsiveContainer>
);

/* ─── Custom chart tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="mm-chart-tooltip">
            <div className="mm-chart-tooltip-label">{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginLeft: 'auto' }}>
                        ₹{p.value.toLocaleString('en-IN')}
                    </span>
                </div>
            ))}
        </div>
    );
};

/* ─── Metric Card ─── */
const cardVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

const MetricCard = ({ label, value, sub, iconBg, iconColor, icon: Icon, changeType, changeText, sparkData, sparkColor, accentClass, index }) => (
    <motion.div
        className={`mm-metric-card ${accentClass ?? ''}`}
        variants={cardVariants}
        custom={index}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -3, boxShadow: '0 8px 28px rgba(15,23,42,0.11)', transition: { duration: 0.2 } }}
    >
        <div className="mm-metric-header">
            <span className="mm-metric-label">{label}</span>
            <span className="mm-metric-icon-wrap" style={{ background: iconBg }}>
                <Icon size={16} style={{ color: iconColor }} strokeWidth={2} />
            </span>
        </div>
        <div className="mm-metric-value">{value}</div>
        <span className={`mm-metric-change ${changeType}`}>
            {changeType === 'up' && <TrendingUp size={11} />}
            {changeType === 'down' && <TrendingDown size={11} />}
            {changeText}
        </span>
        {sub && <div className="mm-metric-sub">{sub}</div>}

        {/* 7-day Sparkline */}
        {sparkData && sparkData.some(d => d.v > 0) && (
            <div className="mm-sparkline-wrap">
                <Sparkline data={sparkData} color={sparkColor} />
            </div>
        )}
    </motion.div>
);

/* ─── Overview Tab ─── */
const OverviewTab = ({ txns, loading, onRefresh, onOpenProfile }) => {
    const now = new Date();
    const [advice, setAdvice] = useState([]);
    const [adviceLoading, setAdviceLoading] = useState(false);
    const [adviceError, setAdviceError] = useState('');
    const cacheRef = useRef({});



    const thisMonth = txns.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = txns.filter(t => {
        const d = new Date(t.date);
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    });

    const thisSpend = thisMonth.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);
    const lastSpend = lastMonth.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);
    const thisIncome = thisMonth.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);
    const allIncome = txns.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);
    const allExpense = txns.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);
    const netBalance = allIncome - allExpense;

    const spendChange = lastSpend > 0
        ? ((thisSpend - lastSpend) / lastSpend * 100).toFixed(1)
        : null;

    const trends = computeTrends(txns);
    const catBreakdown = computeCatBreakdown(thisMonth.length ? thisMonth : txns);
    const recentTxns = txns.slice(0, 8);

    // Sparkline data
    const balanceSparkline = compute7DaySparkline(txns, 'both');
    const spendSparkline = compute7DaySparkline(txns, 'debit');
    const incomeSparkline = compute7DaySparkline(txns, 'credit');

    const catMap = {};
    const recentItemsMap = {};
    txns.filter(t => t.type === 'debit').forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
        if (!recentItemsMap[t.category]) recentItemsMap[t.category] = [];
        if (recentItemsMap[t.category].length < 3) recentItemsMap[t.category].push(t.description);
    });
    const txnCount = thisMonth.filter(t => t.type === 'debit').length;

    const getAdvice = async (forceRefresh = false) => {
        if (!catMap || Object.keys(catMap).length === 0) {
            message.warning('Add some expense transactions first.');
            return;
        }
        const cacheKey = JSON.stringify({ catMap, recentItemsMap });
        if (!forceRefresh && cacheRef.current[cacheKey]) {
            setAdvice(cacheRef.current[cacheKey]);
            return;
        }
        setAdviceLoading(true);
        setAdviceError('');
        try {
            const API = import.meta.env.VITE_API_URL || 'https://vjain5375--finance-llama-api-financeadvisor-get-advice.modal.run';
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expenses: catMap,
                    recent_items: recentItemsMap,
                    income: thisIncome,
                    last_month_spend: lastSpend,
                    txn_count: txnCount,
                }),
            });
            if (!res.ok) throw new Error(`${res.status}`);
            const data = await res.json();
            const parsed = data.insights || (data.advice ? data.advice.split('\n\n') : []);
            cacheRef.current[cacheKey] = parsed;
            setAdvice(parsed);
        } catch {
            setAdviceError('Backend not reachable — start the backend server first.');
        } finally {
            setAdviceLoading(false);
        }
    };

    /* ─── Loading skeleton state ─── */
    if (loading) {
        return (
            <>
                <Row gutter={[18, 18]} style={{ marginBottom: 20 }}>
                    {[0, 1, 2].map(i => (
                        <Col key={i} xs={24} sm={8}>
                            <SkeletonCard />
                        </Col>
                    ))}
                </Row>
                <Row gutter={[18, 18]}>
                    <Col xs={24} lg={16}>
                        <div className="mm-card" style={{ padding: '22px', minHeight: 300 }}>
                            <span className="skeleton" style={{ height: 14, width: '30%', display: 'block', marginBottom: 8 }} />
                            <span className="skeleton" style={{ height: 10, width: '50%', display: 'block', marginBottom: 20 }} />
                            <span className="skeleton" style={{ height: 220, width: '100%', display: 'block', borderRadius: 10 }} />
                        </div>
                    </Col>
                    <Col xs={24} lg={8}>
                        <div className="mm-ai-card" style={{ minHeight: 300, padding: '22px' }}>
                            <span className="skeleton" style={{ height: 14, width: '55%', display: 'block', marginBottom: 18 }} />
                            {[80, 90, 60, 75, 50].map((w, i) => (
                                <span key={i} className="skeleton" style={{ height: 10, width: `${w}%`, display: 'block', marginBottom: 8 }} />
                            ))}
                        </div>
                    </Col>
                </Row>
            </>
        );
    }

    return (
        <>
            {/* Metric Cards */}

            {/* Metric Cards */}
            <Row gutter={[18, 18]} style={{ marginBottom: 20 }}>
                <Col xs={24} sm={8}>
                    <MetricCard
                        index={0}
                        label="Net Balance"
                        value={fmt(Math.abs(netBalance))}
                        sub={`${txns.length} total transactions`}
                        iconBg={netBalance >= 0 ? '#ECFDF5' : '#FEF2F2'}
                        iconColor={netBalance >= 0 ? '#059669' : '#DC2626'}
                        icon={TrendingUp}
                        changeType={netBalance >= 0 ? 'up' : 'down'}
                        changeText={netBalance >= 0 ? 'Income surplus' : 'Expense deficit'}
                        sparkData={balanceSparkline}
                        sparkColor={netBalance >= 0 ? '#059669' : '#DC2626'}
                        accentClass={netBalance >= 0 ? 'green' : 'red'}
                    />
                </Col>
                <Col xs={24} sm={8}>
                    <MetricCard
                        index={1}
                        label="Spends This Month"
                        value={fmt(thisSpend)}
                        sub={thisIncome > 0 ? `₹${thisIncome.toLocaleString('en-IN')} income` : 'No income logged'}
                        iconBg="#FEF2F2"
                        iconColor="#DC2626"
                        icon={TrendingDown}
                        changeType={spendChange === null ? 'neutral' : Number(spendChange) > 0 ? 'down' : 'up'}
                        changeText={
                            spendChange === null
                                ? 'First month'
                                : `${spendChange > 0 ? '+' : ''}${spendChange}% vs last month`
                        }
                        sparkData={spendSparkline}
                        sparkColor="#E11D48"
                        accentClass="red"
                    />
                </Col>
                <Col xs={24} sm={8}>
                    <MetricCard
                        index={2}
                        label="Monthly Income"
                        value={fmt(thisIncome)}
                        sub={thisSpend > 0 ? `Saved ₹${Math.max(0, thisIncome - thisSpend).toLocaleString('en-IN')}` : 'Log income transactions'}
                        iconBg="#EEF2FF"
                        iconColor="#4F46E5"
                        icon={CreditCard}
                        changeType="neutral"
                        changeText={thisIncome > 0 ? `${thisMonth.filter(t => t.type === 'credit').length} credit entries` : 'No income this month'}
                        sparkData={incomeSparkline}
                        sparkColor="#4F46E5"
                        accentClass="indigo"
                    />
                </Col>
            </Row>

            {/* Main Grid */}
            <Row gutter={[18, 18]}>
                {/* Spending Trends */}
                <Col xs={24} lg={16}>
                    <motion.div
                        className="mm-card"
                        style={{ paddingBottom: 16 }}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18, duration: 0.3 }}
                    >
                        <div className="mm-card-header">
                            <div>
                                <div className="mm-card-title">Spending Trends</div>
                                <div className="mm-card-subtitle">Monthly spend vs income — last 6 months</div>
                            </div>
                        </div>
                        {trends.every(t => t.spend === 0 && t.income === 0) ? (
                            <Empty description="Add transactions to see trends" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '40px 0' }} />
                        ) : (
                            <div className="mm-chart-wrap">
                                <ResponsiveContainer width="100%" height={240}>
                                    <AreaChart data={trends} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                                        <defs>
                                            <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.22} />
                                                <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.22} />
                                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="month" tick={{ fontSize: 11.5, fill: '#9CA3AF', fontFamily: 'Inter, sans-serif' }} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Inter, sans-serif' }} axisLine={false} tickLine={false} width={50} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="income" name="Income" stroke="#0D9488" strokeWidth={2.5} fill="url(#incGrad)" dot={false} activeDot={{ r: 5, fill: '#0D9488', stroke: '#fff', strokeWidth: 2 }} isAnimationActive animationDuration={1100} animationEasing="ease-out" />
                                        <Area type="monotone" dataKey="spend" name="Spends" stroke="#4F46E5" strokeWidth={2.5} fill="url(#spendGrad)" dot={false} activeDot={{ r: 5, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2 }} isAnimationActive animationDuration={1100} animationEasing="ease-out" />
                                    </AreaChart>
                                </ResponsiveContainer>
                                <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 6 }}>
                                    {[['#0D9488', 'Income'], ['#4F46E5', 'Spends']].map(([color, label]) => (
                                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
                                            <span style={{ width: 22, height: 2.5, borderRadius: 2, background: color, display: 'inline-block' }} />
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </Col>

                {/* AI Financial Advisor */}
                <Col xs={24} lg={8}>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.24, duration: 0.3 }}
                        style={{ height: '100%' }}
                    >
                        <div className="mm-ai-card">
                            {/* Header */}
                            <div className="mm-ai-header">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div className="mm-ai-title">
                                            <Sparkles size={13} strokeWidth={2} />
                                            AI Advisor
                                        </div>
                                        <div className="mm-ai-subtitle">Finance LLaMA · LLaMA-3-8B + LoRA</div>
                                    </div>
                                    <button
                                        className="mm-ai-btn"
                                        onClick={() => getAdvice(true)}
                                        disabled={adviceLoading || Object.keys(catMap).length === 0}
                                    >
                                        {adviceLoading ? 'Thinking…' : advice.length ? '↺ Refresh' : 'Get Advice'}
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="mm-ai-body">
                                {/* Loading */}
                                {adviceLoading && (
                                    <div className="mm-ai-loading">
                                        <div className="mm-ai-loading-dots">
                                            <span /><span /><span />
                                        </div>
                                        <span className="mm-ai-loading-text">Analyzing your spending… (first run: 30–60s)</span>
                                    </div>
                                )}

                                {/* Error */}
                                {!adviceLoading && adviceError && (
                                    <div className="mm-ai-error">
                                        <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, marginBottom: 2 }}>Backend not running</div>
                                        <div style={{ fontSize: 11, color: '#B91C1C' }}>
                                            Run: <code style={{ background: '#FEE2E2', padding: '1px 5px', borderRadius: 4 }}>uvicorn src.api:app</code>
                                        </div>
                                    </div>
                                )}

                                {/* Advice */}
                                <AnimatePresence>
                                    {!adviceLoading && !adviceError && advice.length > 0 && (
                                        <motion.div
                                            className="mm-ai-advice"
                                            key="advice"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="mm-ai-advice-label">💡 AI Insight</div>
                                            <div className="mm-ai-advice-text">
                                                {advice.map((tip, i) => (
                                                    <div key={i} className="mm-ai-insight-block">
                                                        <span className="mm-ai-insight-label">Insight {i + 1}:</span>
                                                        {' '}{tip.trim()}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Empty state */}
                                {!adviceLoading && !adviceError && advice.length === 0 && (
                                    txns.length === 0
                                        ? <Empty description="Add transactions first" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '20px 0' }} />
                                        : (
                                            <div className="mm-ai-empty">
                                                <div className="mm-ai-star">✦</div>
                                                <div className="mm-ai-empty-text">
                                                    Click "Get Advice" for AI-powered insights on your spending patterns.
                                                </div>
                                            </div>
                                        )
                                )}

                                {/* Spending pills */}
                                {Object.keys(catMap).length > 0 && !adviceLoading && (
                                    <div className="mm-ai-pills">
                                        {Object.entries(catMap).slice(0, 4).map(([cat, amt], i) => (
                                            <motion.span
                                                key={cat}
                                                className="mm-ai-pill"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.06 }}
                                            >
                                                {catLabel(cat)}: ₹{Math.round(amt).toLocaleString('en-IN')}
                                            </motion.span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </Col>
            </Row>

            {/* Bottom Grid */}
            <Row gutter={[18, 18]} className="mm-row-gap">
                {/* Category Breakdown */}
                <Col xs={24} lg={8}>
                    <motion.div
                        className="mm-card"
                        style={{ paddingBottom: 16 }}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.30, duration: 0.3 }}
                    >
                        <div className="mm-card-header">
                            <div>
                                <div className="mm-card-title">Category Breakdown</div>
                                <div className="mm-card-subtitle">
                                    {now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })} · {fmt(thisSpend)} total
                                </div>
                            </div>
                        </div>
                        {catBreakdown.length === 0 ? (
                            <Empty description="No expense data" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '32px 0' }} />
                        ) : (
                            <div style={{ padding: '8px 0' }}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={catBreakdown}
                                            cx="50%" cy="50%"
                                            innerRadius={55} outerRadius={82}
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={0}
                                            isAnimationActive
                                            animationBegin={150}
                                            animationDuration={900}
                                            animationEasing="ease-out"
                                        >
                                            {catBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (!active || !payload?.length) return null;
                                                const d = payload[0];
                                                return (
                                                    <div className="mm-chart-tooltip">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.payload.color, display: 'inline-block' }} />
                                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{d.name}</span>
                                                        </div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                                                            ₹{d.value.toLocaleString('en-IN')}
                                                        </div>
                                                    </div>
                                                );
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ padding: '0 18px' }}>
                                    {catBreakdown.map((c) => (
                                        <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, display: 'inline-block', flexShrink: 0 }} />
                                                <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{c.name}</span>
                                            </div>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>₹{c.value.toLocaleString('en-IN')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </Col>

                {/* Recent Transactions */}
                <Col xs={24} lg={16}>
                    <motion.div
                        className="mm-card"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.36, duration: 0.3 }}
                    >
                        <div className="mm-card-header" style={{ padding: '18px 22px 12px' }}>
                            <div>
                                <div className="mm-card-title">Recent Transactions</div>
                                <div className="mm-card-subtitle">Last {recentTxns.length} transactions</div>
                            </div>
                            <button
                                onClick={onRefresh}
                                style={{
                                    background: 'none', border: '1px solid #E5E7EB', borderRadius: 8,
                                    padding: '5px 13px', cursor: 'pointer', fontSize: 12, color: '#6B7280',
                                    fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#374151'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6B7280'; }}
                            >
                                <RefreshCw size={11} /> Refresh
                            </button>
                        </div>
                        {recentTxns.length === 0 ? (
                            <Empty description="No transactions yet — add one!" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '40px 0' }} />
                        ) : (
                            loading
                                ? [1, 2, 3, 4].map(i => <SkeletonRow key={i} />)
                                : recentTxns.map((txn, i) => (
                                    <motion.div
                                        className="mm-txn-row"
                                        key={txn.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.42 + i * 0.04, duration: 0.22 }}
                                    >
                                        <div className="mm-txn-icon" style={{ background: catBg(txn.category) }}>{catIcon(txn.category)}</div>
                                        <div>
                                            <div className="mm-txn-name">{txn.description || catLabel(txn.category)}</div>
                                            <div className="mm-txn-cat">{catLabel(txn.category)}</div>
                                        </div>
                                        <div className="mm-txn-date">{txn.date}</div>
                                        <div className={`mm-txn-amount ${txn.type}`}>
                                            {txn.type === 'debit' ? '−' : '+'}{fmt(Number(txn.amount))}
                                        </div>
                                    </motion.div>
                                ))
                        )}
                    </motion.div>
                </Col>
            </Row>
        </>
    );
};

/* ─────────────────── Budget Tab ─────────────────── */
const BudgetTab = ({ txns }) => {
    const now = new Date();
    const thisMonth = txns.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'debit';
    });

    const LIMITS = { food: 6000, transport: 3000, shopping: 5000, utilities: 3500, entertainment: 2000, subscriptions: 2000, health: 3000, other: 2000 };
    const spent = {};
    thisMonth.forEach(t => { spent[t.category] = (spent[t.category] || 0) + Number(t.amount); });

    const budgets = Object.entries(LIMITS).map(([cat, limit]) => ({
        label: catLabel(cat), spent: spent[cat] || 0, limit, color: catColor(cat),
        pct: Math.min(100, ((spent[cat] || 0) / limit) * 100),
    })).filter(b => b.spent > 0 || b.label);

    return (
        <Row gutter={[18, 18]}>
            <Col xs={24} lg={12}>
                <div className="mm-card" style={{ padding: '20px 24px 22px' }}>
                    <div className="mm-card-title" style={{ marginBottom: 4 }}>Monthly Budgets</div>
                    <div className="mm-card-subtitle" style={{ marginBottom: 18 }}>
                        {now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })} — default limits
                    </div>
                    {budgets.map((b) => (
                        <div className="mm-budget-item" key={b.label}>
                            <div className="mm-budget-row">
                                <div className="mm-budget-label">
                                    <span className="mm-budget-dot" style={{ background: b.color }} />
                                    {b.label}
                                </div>
                                <div className="mm-budget-amounts">
                                    <strong>₹{b.spent.toLocaleString('en-IN')}</strong> / ₹{b.limit.toLocaleString('en-IN')}
                                </div>
                            </div>
                            <div style={{ height: 5, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                                <motion.div
                                    style={{ height: '100%', background: b.pct > 90 ? '#EF4444' : b.color, borderRadius: 99 }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${b.pct}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                />
                            </div>
                            <div style={{ fontSize: 11, color: b.pct > 90 ? '#EF4444' : '#9CA3AF', marginTop: 4, fontWeight: 500 }}>
                                {b.pct.toFixed(0)}% used {b.pct > 90 && '· ⚠️ Near limit'}
                            </div>
                        </div>
                    ))}
                </div>
            </Col>
            <Col xs={24} lg={12}>
                <div className="mm-card" style={{ paddingBottom: 16 }}>
                    <div className="mm-card-header">
                        <div>
                            <div className="mm-card-title">Spend Distribution</div>
                            <div className="mm-card-subtitle">vs budget limit</div>
                        </div>
                    </div>
                    <div className="mm-chart-wrap">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={budgets.filter(b => b.spent > 0)} margin={{ top: 10, right: 10, bottom: 0, left: -12 }} barCategoryGap="35%">
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Inter' }} axisLine={false} tickLine={false} width={40} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="spent" name="Spent" radius={[5, 5, 0, 0]} isAnimationActive animationDuration={800}>
                                    {budgets.filter(b => b.spent > 0).map((b, i) => <Cell key={i} fill={b.pct > 90 ? '#EF4444' : b.color} />)}
                                </Bar>
                                <Bar dataKey="limit" name="Limit" radius={[5, 5, 0, 0]} fill="#F3F4F6" isAnimationActive animationDuration={800} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Col>
        </Row>
    );
};

/* ─────────────────── Subscriptions Tab ─────────────────── */
const SubscriptionsTab = ({ txns }) => {
    const subs = txns.filter(t => t.category === 'subscriptions' && t.type === 'debit');
    const total = subs.reduce((s, t) => s + Number(t.amount), 0);

    return (
        <Row gutter={[18, 18]}>
            <Col xs={24} lg={14}>
                <div className="mm-card">
                    <div className="mm-card-header" style={{ padding: '18px 22px 14px' }}>
                        <div>
                            <div className="mm-card-title">Subscription Expenses</div>
                            <div className="mm-card-subtitle">Logged subscription transactions</div>
                        </div>
                        {total > 0 && (
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>₹{total.toLocaleString('en-IN')}</div>
                                <div style={{ fontSize: 11, color: '#9CA3AF' }}>Total logged</div>
                            </div>
                        )}
                    </div>
                    {subs.length === 0 ? (
                        <Empty description="No subscription transactions — add one with category 'Subscriptions'" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '40px 0' }} />
                    ) : (
                        subs.map((txn) => (
                            <div className="mm-txn-row" key={txn.id}>
                                <div className="mm-txn-icon" style={{ background: '#F0F9FF' }}>🔁</div>
                                <div>
                                    <div className="mm-txn-name">{txn.description || 'Subscription'}</div>
                                    <div className="mm-txn-cat">{txn.date}</div>
                                </div>
                                <div className="mm-txn-amount debit">−₹{Number(txn.amount).toLocaleString('en-IN')}</div>
                            </div>
                        ))
                    )}
                </div>
            </Col>
            <Col xs={24} lg={10}>
                <div className="mm-card" style={{ padding: '20px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <TriangleAlert size={15} style={{ color: '#D97706' }} />
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.2px' }}>Subscription Tips</span>
                    </div>
                    {[
                        { icon: <Lightbulb size={15} style={{ color: '#D97706' }} />, text: 'Log each subscription under the "Subscriptions" category', sub: 'Enables accurate tracking' },
                        { icon: '📅', text: 'Track renewal dates in description', sub: 'e.g. "Netflix - Mar renewal"' },
                        { icon: '✂️', text: 'Review unused subscriptions monthly', sub: 'Industry avg: 4–6 unused subs' },
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 11, padding: '10px 0', borderBottom: i < 2 ? '1px solid #F3F4F6' : 'none' }}>
                            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                            <div>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>{item.text}</div>
                                <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 3 }}>{item.sub}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </Col>
        </Row>
    );
};

/* ─────────────────── Main Export ─────────────────── */
export default function Dashboard() {
    const { user, updateProfile } = useAuth();
    const [txns, setTxns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [submittingName, setSubmittingName] = useState(false);

    useEffect(() => {
        if (user && !user.user_metadata?.full_name) {
            setShowProfileModal(true);
        }
    }, [user]);

    const handleProfileUpdate = async () => {
        if (!newName.trim()) {
            message.warning('Please enter your name');
            return;
        }
        setSubmittingName(true);
        const { error } = await updateProfile({ full_name: newName.trim() });
        if (error) {
            message.error('Failed to update name');
        } else {
            message.success(`Profile updated! Welcome, ${newName}.`);
            setShowProfileModal(false);
        }
        setSubmittingName(false);
    };

    const handleOpenProfile = () => {
        setNewName(user?.user_metadata?.full_name || '');
        setShowProfileModal(true);
    };

    const fetchTxns = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });
        if (error) {
            message.error('Failed to load transactions.');
        } else {
            setTxns(data ?? []);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchTxns(); }, [fetchTxns]);

    const now = new Date();
    const tabItems = [
        { key: 'overview', label: 'Overview' },
        { key: 'budget', label: 'Budgets' },
        { key: 'subscriptions', label: 'Subscriptions' },
    ];

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', paddingTop: 10 }}>

            {/* Profile Modal */}
            <AnimatePresence>
                {showProfileModal && (
                    <motion.div
                        className="mm-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="mm-modal-content"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                        >
                            <div className="mm-modal-blob" />
                            <div className="mm-modal-icon">
                                <User size={28} />
                            </div>
                            <h2 className="mm-modal-title">
                                {user?.user_metadata?.full_name ? 'Edit Profile' : 'Welcome to Money Matters!'}
                            </h2>
                            <p className="mm-modal-sub">
                                {user?.user_metadata?.full_name
                                    ? 'Change your display name below.'
                                    : "We're excited to have you here. Let's start by setting up your profile."}
                            </p>

                            <div className="mm-input-group">
                                <label className="mm-input-label">Your Name</label>
                                <input
                                    className="mm-modal-input"
                                    placeholder="Enter your name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleProfileUpdate()}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                {user?.user_metadata?.full_name && (
                                    <button
                                        className="mm-modal-btn"
                                        style={{ background: '#F1F5F9', color: '#64748B' }}
                                        onClick={() => setShowProfileModal(false)}
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    className="mm-modal-btn"
                                    onClick={handleProfileUpdate}
                                    disabled={submittingName || !newName.trim()}
                                >
                                    {submittingName ? 'Saving...' : (
                                        <>
                                            Save Changes <Check size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mm-card mm-tabs" style={{ marginBottom: 20, paddingBottom: 0 }}>
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="mm-tabs" />
            </div>

            {activeTab === 'overview' && <OverviewTab txns={txns} loading={loading} onRefresh={fetchTxns} />}
            {activeTab === 'budget' && <BudgetTab txns={txns} />}
            {activeTab === 'subscriptions' && <SubscriptionsTab txns={txns} />}
        </div>
    );
}
