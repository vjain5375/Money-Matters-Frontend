import { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Tag, Tabs, message, Spin, Empty } from 'antd';
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie,
} from 'recharts';
import {
    ArrowUpOutlined, ArrowDownOutlined,
    RiseOutlined, FallOutlined, CreditCardOutlined,
    AlertOutlined, BulbOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { supabase } from '../supabaseClient';

/* ─── Category colour map ─── */
const CAT_META = {
    food: { label: 'Food & Dining', icon: '🍜', color: '#6c63ff' },
    shopping: { label: 'Shopping', icon: '🛍️', color: '#f7c94b' },
    transport: { label: 'Transport', icon: '🚕', color: '#3ecf8e' },
    utilities: { label: 'Utilities', icon: '⚡', color: '#f87171' },
    entertainment: { label: 'Entertainment', icon: '🎬', color: '#60a5fa' },
    subscriptions: { label: 'Subscriptions', icon: '🔁', color: '#a78bfa' },
    health: { label: 'Health & Medical', icon: '💊', color: '#fb923c' },
    salary: { label: 'Salary / Income', icon: '💰', color: '#34d399' },
    other: { label: 'Other', icon: '📌', color: '#94a3b8' },
};

const catIcon = (c) => CAT_META[c]?.icon ?? '📌';
const catColor = (c) => CAT_META[c]?.color ?? '#94a3b8';
const catBg = (c) => ({ food: '#fff4e6', shopping: '#eff6ff', transport: '#fef3c7', utilities: '#fdf4ff', entertainment: '#ecfdf3', subscriptions: '#f0f9ff', health: '#fff1f3', salary: '#f0fdf4', other: '#f9fafb' }[c] ?? '#f9fafb');
const catLabel = (c) => CAT_META[c]?.label ?? c;

const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.abs(n));

const fmtK = (n) => n >= 1000 ? `₹${(n / 1000).toFixed(0)}k` : `₹${n}`;

/* ─── Compute last-6-month trend from txns ─── */
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

/* ─── Sub-components ─── */

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="mm-chart-tooltip">
            <div className="mm-chart-tooltip-label">{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: '#667085', fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#101828', marginLeft: 'auto' }}>
                        ₹{p.value.toLocaleString('en-IN')}
                    </span>
                </div>
            ))}
        </div>
    );
};

const MetricCard = ({ label, value, sub, iconBg, iconColor, icon, changeType, changeText }) => (
    <div className="mm-metric-card">
        <div className="mm-metric-header">
            <span className="mm-metric-label">{label}</span>
            <span className="mm-metric-icon-wrap" style={{ background: iconBg, color: iconColor }}>{icon}</span>
        </div>
        <div className="mm-metric-value">{value}</div>
        <span className={`mm-metric-change ${changeType}`}>
            {changeType === 'up' && <ArrowUpOutlined />}
            {changeType === 'down' && <ArrowDownOutlined />}
            {changeText}
        </span>
        {sub && <div className="mm-metric-sub">{sub}</div>}
    </div>
);

/* ─── Overview Tab ─── */
const OverviewTab = ({ txns, loading, onRefresh }) => {
    const now = new Date();
    const [advice, setAdvice] = useState('');
    const [adviceLoading, setAdviceLoading] = useState(false);
    const [adviceError, setAdviceError] = useState('');
    const cacheRef = useRef({});

    // Pre-warm the Modal container on page load (fires in background) - max once every 5 minutes
    useEffect(() => {
        const lastPing = localStorage.getItem('mm_last_prewarm');
        const nowMs = Date.now();

        // Only ping if we haven't pinged in the last 5 minutes (300,000 ms)
        if (!lastPing || (nowMs - parseInt(lastPing, 10)) > 300000) {
            const API = import.meta.env.VITE_API_URL || 'https://vjain5375--finance-llama-api-financeadvisor-get-advice.modal.run';
            fetch(API, {
                method: 'POST',
                body: '{}',
            }).catch(() => { });
            localStorage.setItem('mm_last_prewarm', nowMs.toString());
        }
    }, []);

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

    // Build expenses dict for AI advisor (category key → amount)
    const catMap = {};
    txns.filter(t => t.type === 'debit').forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
    });

    const getAdvice = async (forceRefresh = false) => {
        if (!catMap || Object.keys(catMap).length === 0) {
            message.warning('Add some expense transactions first.');
            return;
        }
        const cacheKey = JSON.stringify(catMap);
        if (!forceRefresh && cacheRef.current[cacheKey]) {
            setAdvice(cacheRef.current[cacheKey]);
            return;
        }
        setAdviceLoading(true);
        setAdviceError('');
        try {
            const API = import.meta.env.VITE_API_URL || 'https://vjain5375--finance-llama-api-financeadvisor-get-advice.modal.run';
            const res = await fetch(`${API}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expenses: catMap }),
            });
            if (!res.ok) throw new Error(`${res.status}`);
            const data = await res.json();
            cacheRef.current[cacheKey] = data.advice;
            setAdvice(data.advice);
        } catch {
            setAdviceError('Backend not reachable — start the backend server first.');
        } finally {
            setAdviceLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <Spin size="large" tip="Loading your data…" />
            </div>
        );
    }

    return (
        <>
            {/* Metric Cards */}
            <Row gutter={[18, 18]} style={{ marginBottom: 20 }}>
                <Col xs={24} sm={8}>
                    <MetricCard
                        label="Net Balance"
                        value={fmt(Math.abs(netBalance))}
                        sub={`${txns.length} total transactions`}
                        iconBg={netBalance >= 0 ? '#ecfdf3' : '#fff1f3'}
                        iconColor={netBalance >= 0 ? '#027a48' : '#c01048'}
                        icon={<RiseOutlined />}
                        changeType={netBalance >= 0 ? 'up' : 'down'}
                        changeText={netBalance >= 0 ? 'Income surplus' : 'Expense deficit'}
                    />
                </Col>
                <Col xs={24} sm={8}>
                    <MetricCard
                        label="Spends This Month"
                        value={fmt(thisSpend)}
                        sub={thisIncome > 0 ? `₹${thisIncome.toLocaleString('en-IN')} income` : 'No income logged'}
                        iconBg="#fff1f3"
                        iconColor="#c01048"
                        icon={<FallOutlined />}
                        changeType={spendChange === null ? 'neutral' : Number(spendChange) > 0 ? 'down' : 'up'}
                        changeText={
                            spendChange === null
                                ? 'First month'
                                : `${spendChange > 0 ? '+' : ''}${spendChange}% vs last month`
                        }
                    />
                </Col>
                <Col xs={24} sm={8}>
                    <MetricCard
                        label="Monthly Income"
                        value={fmt(thisIncome)}
                        sub={thisSpend > 0 ? `Saved ₹${Math.max(0, thisIncome - thisSpend).toLocaleString('en-IN')}` : 'Log income transactions'}
                        iconBg="#f5f3ff"
                        iconColor="#6c63ff"
                        icon={<CreditCardOutlined />}
                        changeType="neutral"
                        changeText={thisIncome > 0 ? `${thisMonth.filter(t => t.type === 'credit').length} credit entries` : 'No income this month'}
                    />
                </Col>
            </Row>

            {/* Main Grid */}
            <Row gutter={[18, 18]}>
                {/* Spending Trends */}
                <Col xs={24} lg={16}>
                    <div className="mm-card" style={{ paddingBottom: 16 }}>
                        <div className="mm-card-header">
                            <div>
                                <div className="mm-card-title">Spending Trends</div>
                                <div className="mm-card-subtitle">Monthly spend vs income — last 6 months</div>
                            </div>
                            <Tag style={{ background: '#f5f3ff', color: '#6c63ff', borderColor: '#ede9fe' }}>
                                {now.toLocaleString('en-IN', { month: 'short', year: 'numeric' })}
                            </Tag>
                        </div>
                        {trends.every(t => t.spend === 0 && t.income === 0) ? (
                            <Empty description="Add transactions to see trends" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '40px 0' }} />
                        ) : (
                            <div className="mm-chart-wrap">
                                <ResponsiveContainer width="100%" height={240}>
                                    <AreaChart data={trends} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                                        <defs>
                                            <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3ecf8e" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.18} />
                                                <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#98a2b3', fontFamily: 'Inter, sans-serif' }} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: '#98a2b3', fontFamily: 'Inter, sans-serif' }} axisLine={false} tickLine={false} width={52} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="income" name="Income" stroke="#3ecf8e" strokeWidth={2.5} fill="url(#incGrad)" dot={false} activeDot={{ r: 5, fill: '#3ecf8e', stroke: '#fff', strokeWidth: 2 }} />
                                        <Area type="monotone" dataKey="spend" name="Spends" stroke="#6c63ff" strokeWidth={2.5} fill="url(#spendGrad)" dot={false} activeDot={{ r: 5, fill: '#6c63ff', stroke: '#fff', strokeWidth: 2 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                                <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 4 }}>
                                    {[['#3ecf8e', 'Income'], ['#6c63ff', 'Spends']].map(([color, label]) => (
                                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#667085', fontWeight: 500 }}>
                                            <span style={{ width: 24, height: 3, borderRadius: 2, background: color, display: 'inline-block' }} />
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Col>

                {/* AI Financial Advisor */}
                <Col xs={24} lg={8}>
                    <div className="mm-card" style={{ height: '100%', padding: '18px 0 16px', display: 'flex', flexDirection: 'column' }}>
                        {/* Header */}
                        <div className="mm-card-header" style={{ padding: '0 22px 14px', borderBottom: '1px solid #f2f4f7' }}>
                            <div>
                                <div className="mm-card-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <span style={{ fontSize: 15 }}>✦</span> AI Advisor
                                </div>
                                <div className="mm-card-subtitle">Finance LLaMA · LLaMA-3-8B + LoRA</div>
                            </div>
                            <button
                                onClick={() => getAdvice(true)}
                                disabled={adviceLoading || Object.keys(catMap).length === 0}
                                style={{
                                    background: adviceLoading ? '#f5f3ff' : '#6c63ff',
                                    color: adviceLoading ? '#6c63ff' : '#fff',
                                    border: 'none', borderRadius: 8, padding: '5px 13px',
                                    fontSize: 12, fontWeight: 600, cursor: adviceLoading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                                }}
                            >
                                {adviceLoading ? '...' : advice ? '↺ Refresh' : 'Get Advice'}
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '14px 22px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {adviceLoading && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#f5f3ff', borderRadius: 10 }}>
                                    <Spin size="small" />
                                    <span style={{ fontSize: 12, color: '#6c63ff' }}>Analyzing your spending… (first run: 30-60s)</span>
                                </div>
                            )}

                            {!adviceLoading && adviceError && (
                                <div style={{ padding: '10px 14px', background: '#fff1f3', borderRadius: 10, borderLeft: '3px solid #f87171' }}>
                                    <div style={{ fontSize: 12, color: '#c01048', fontWeight: 600, marginBottom: 2 }}>Backend not running</div>
                                    <div style={{ fontSize: 11, color: '#e11d48' }}>Run: <code style={{ background: '#fce7f3', padding: '1px 5px', borderRadius: 4 }}>uvicorn src.api:app</code></div>
                                </div>
                            )}

                            {!adviceLoading && !adviceError && advice && (
                                <div style={{ padding: '12px 14px', background: '#f5f3ff', borderRadius: 10, borderLeft: '3px solid #6c63ff' }}>
                                    <div style={{ fontSize: 12, color: '#4c1d95', fontWeight: 600, marginBottom: 5 }}>💡 AI Insight</div>
                                    <p style={{ fontSize: 12.5, color: '#3730a3', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>{advice}</p>
                                </div>
                            )}

                            {!adviceLoading && !adviceError && !advice && (
                                txns.length === 0
                                    ? <Empty description="Add transactions first" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '20px 0' }} />
                                    : (
                                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                            <div style={{ fontSize: 28, marginBottom: 6 }}>✦</div>
                                            <div style={{ fontSize: 12, color: '#98a2b3' }}>Click "Get Advice" for AI-powered insights on your spending patterns.</div>
                                        </div>
                                    )
                            )}

                            {/* Spending pills */}
                            {Object.keys(catMap).length > 0 && !adviceLoading && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 'auto', paddingTop: 8 }}>
                                    {Object.entries(catMap).slice(0, 4).map(([cat, amt]) => (
                                        <span key={cat} style={{ background: '#f5f3ff', borderRadius: 20, padding: '2px 10px', fontSize: 11, color: '#6c63ff', fontWeight: 500 }}>
                                            {catLabel(cat)}: ₹{Math.round(amt).toLocaleString('en-IN')}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Bottom Grid */}
            <Row gutter={[18, 18]} className="mm-row-gap">
                {/* Category Breakdown */}
                <Col xs={24} lg={8}>
                    <div className="mm-card" style={{ paddingBottom: 16 }}>
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
                                        <Pie data={catBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                            {catBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, '']} contentStyle={{ borderRadius: 10, border: '1px solid #eaecf0', fontSize: 12, fontFamily: 'Inter' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ padding: '0 16px' }}>
                                    {catBreakdown.map((c) => (
                                        <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, display: 'inline-block', flexShrink: 0 }} />
                                                <span style={{ fontSize: 12, color: '#344054', fontWeight: 500 }}>{c.name}</span>
                                            </div>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: '#101828' }}>₹{c.value.toLocaleString('en-IN')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Col>

                {/* Recent Transactions */}
                <Col xs={24} lg={16}>
                    <div className="mm-card">
                        <div className="mm-card-header" style={{ padding: '18px 22px 12px' }}>
                            <div>
                                <div className="mm-card-title">Recent Transactions</div>
                                <div className="mm-card-subtitle">Last {recentTxns.length} transactions</div>
                            </div>
                            <button
                                onClick={onRefresh}
                                style={{ background: 'none', border: '1px solid #eaecf0', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: '#667085', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}
                            >
                                <ReloadOutlined style={{ fontSize: 11 }} /> Refresh
                            </button>
                        </div>
                        {recentTxns.length === 0 ? (
                            <Empty description="No transactions yet — add one!" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '40px 0' }} />
                        ) : (
                            recentTxns.map((txn) => (
                                <div className="mm-txn-row" key={txn.id}>
                                    <div className="mm-txn-icon" style={{ background: catBg(txn.category) }}>{catIcon(txn.category)}</div>
                                    <div>
                                        <div className="mm-txn-name">{txn.description || catLabel(txn.category)}</div>
                                        <div className="mm-txn-cat">{catLabel(txn.category)}</div>
                                    </div>
                                    <div className="mm-txn-date">{txn.date}</div>
                                    <div className={`mm-txn-amount ${txn.type}`}>
                                        {txn.type === 'debit' ? '−' : '+'}{fmt(Number(txn.amount))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Col>
            </Row>
        </>
    );
};

/* ─── Budget Tab (placeholder — real budgets coming in Step 3) ─── */
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
                <div className="mm-card" style={{ padding: '18px 22px 20px' }}>
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
                            <div style={{ height: 6, background: '#f2f4f7', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${b.pct}%`, background: b.pct > 90 ? '#f87171' : b.color, borderRadius: 99, transition: 'width 0.4s ease' }} />
                            </div>
                            <div style={{ fontSize: 11, color: b.pct > 90 ? '#ef4444' : '#98a2b3', marginTop: 4, fontWeight: 500 }}>
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
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#98a2b3', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#98a2b3', fontFamily: 'Inter' }} axisLine={false} tickLine={false} width={40} />
                                <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, '']} contentStyle={{ borderRadius: 10, border: '1px solid #eaecf0', fontSize: 12, fontFamily: 'Inter' }} />
                                <Bar dataKey="spent" name="Spent" radius={[6, 6, 0, 0]}>
                                    {budgets.filter(b => b.spent > 0).map((b, i) => <Cell key={i} fill={b.pct > 90 ? '#f87171' : b.color} />)}
                                </Bar>
                                <Bar dataKey="limit" name="Limit" radius={[6, 6, 0, 0]} fill="#f2f4f7" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Col>
        </Row>
    );
};

/* ─── Subscriptions Tab (still uses transactions data) ─── */
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
                                <div style={{ fontSize: 18, fontWeight: 700, color: '#101828' }}>₹{total.toLocaleString('en-IN')}</div>
                                <div style={{ fontSize: 11, color: '#98a2b3' }}>Total logged</div>
                            </div>
                        )}
                    </div>
                    {subs.length === 0 ? (
                        <Empty description="No subscription transactions — add one with category 'Subscriptions'" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '40px 0' }} />
                    ) : (
                        subs.map((txn) => (
                            <div className="mm-txn-row" key={txn.id}>
                                <div className="mm-txn-icon" style={{ background: '#f0f9ff' }}>🔁</div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <AlertOutlined style={{ color: '#f59e0b', fontSize: 16 }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>Subscription Tips</span>
                    </div>
                    {[
                        { icon: '💡', text: 'Log each subscription under the "Subscriptions" category', sub: 'Enables accurate tracking' },
                        { icon: '📅', text: 'Track renewal dates in description', sub: 'e.g. "Netflix - Mar renewal"' },
                        { icon: '✂️', text: 'Review unused subscriptions monthly', sub: 'Industry avg: 4-6 unused subs' },
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < 2 ? '1px solid #f2f4f7' : 'none' }}>
                            <span style={{ fontSize: 16 }}>{item.icon}</span>
                            <div>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#344054' }}>{item.text}</div>
                                <div style={{ fontSize: 11.5, color: '#98a2b3', marginTop: 2 }}>{item.sub}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </Col>
        </Row>
    );
};

/* ─── MAIN EXPORT ─── */
export default function Dashboard() {
    const [txns, setTxns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

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
        <div style={{ maxWidth: 1080, margin: '0 auto', width: '100%' }}>
            <div className="mm-page-header">
                <div className="mm-page-title">Financial Overview</div>
                <div className="mm-page-subtitle">
                    {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            </div>

            <div className="mm-card mm-tabs" style={{ marginBottom: 20, paddingBottom: 0 }}>
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="mm-tabs" />
            </div>

            {activeTab === 'overview' && <OverviewTab txns={txns} loading={loading} onRefresh={fetchTxns} />}
            {activeTab === 'budget' && <BudgetTab txns={txns} />}
            {activeTab === 'subscriptions' && <SubscriptionsTab txns={txns} />}
        </div>
    );
}
