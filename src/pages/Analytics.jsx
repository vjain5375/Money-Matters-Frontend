import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Select, Empty, Spin, message, Button } from 'antd';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';
import { supabase } from '../supabaseClient';

const { Option } = Select;

/* ─── helpers ─── */
const INR = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.abs(n));

const CAT_META = {
    food: { label: 'Food & Dining', color: '#6c63ff' },
    shopping: { label: 'Shopping', color: '#f7c94b' },
    transport: { label: 'Transport', color: '#3ecf8e' },
    utilities: { label: 'Utilities', color: '#f87171' },
    entertainment: { label: 'Entertainment', color: '#60a5fa' },
    subscriptions: { label: 'Subscriptions', color: '#a78bfa' },
    health: { label: 'Health & Medical', color: '#fb923c' },
    salary: { label: 'Salary / Income', color: '#34d399' },
    other_income: { label: 'Other Income', color: '#2dd4bf' },
    other: { label: 'Other', color: '#94a3b8' },
};

const catLabel = (c) => CAT_META[c]?.label ?? c;
const catColor = (c) => CAT_META[c]?.color ?? '#94a3b8';

/* Build last-N-months array */
function lastNMonths(n) {
    const res = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        res.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }) });
    }
    return res;
}

/* Custom tooltip */
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', minWidth: 140 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#667085', marginBottom: 6 }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill, display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: '#344054', fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#101828', marginLeft: 'auto' }}>
                        {INR(p.value)}
                    </span>
                </div>
            ))}
        </div>
    );
};

function SectionCard({ title, subtitle, children, style = {} }) {
    return (
        <div className="mm-card" style={{ padding: '20px 22px 18px', ...style }}>
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#101828' }}>{title}</div>
                {subtitle && <div style={{ fontSize: 12, color: '#98a2b3', marginTop: 2 }}>{subtitle}</div>}
            </div>
            {children}
        </div>
    );
}

/* ─── HEATMAP: daily spend mapped onto a calendar grid ─── */
function SpendHeatmap({ txns, year, month }) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun

    // sum debits per day
    const dayTotals = {};
    txns.filter(t => {
        const d = new Date(t.date);
        return t.type === 'debit' && d.getFullYear() === year && d.getMonth() === month;
    }).forEach(t => {
        const day = new Date(t.date).getDate();
        dayTotals[day] = (dayTotals[day] || 0) + Number(t.amount);
    });

    const maxVal = Math.max(...Object.values(dayTotals), 1);
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const cells = [];
    // blank cells before first day
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const intensity = (day) => {
        const v = dayTotals[day] || 0;
        const pct = v / maxVal;
        if (pct === 0) return { bg: '#f2f4f7', text: '#98a2b3' };
        if (pct < 0.25) return { bg: '#e0d9ff', text: '#5b52f0' };
        if (pct < 0.5) return { bg: '#b5abff', text: '#3730a3' };
        if (pct < 0.75) return { bg: '#7c6ffa', text: '#fff' };
        return { bg: '#5b52f0', text: '#fff' };
    };

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 4 }}>
                {weekdays.map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#98a2b3', padding: '2px 0' }}>{d}</div>
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
                {cells.map((day, i) => {
                    if (!day) return <div key={`blank-${i}`} />;
                    const { bg, text } = intensity(day);
                    const amount = dayTotals[day];
                    return (
                        <div
                            key={day}
                            title={amount ? `${day}: ${INR(amount)}` : `${day}: No spend`}
                            style={{
                                aspectRatio: '1',
                                background: bg,
                                borderRadius: 5,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: amount ? 'pointer' : 'default',
                                transition: 'transform 0.1s',
                            }}
                        >
                            <span style={{ fontSize: 10, fontWeight: 600, color: text }}>{day}</span>
                            {amount > 0 && <span style={{ fontSize: 8, color: text, opacity: 0.85 }}>₹{Math.round(amount / 1000) > 0 ? Math.round(amount / 1000) + 'k' : amount}</span>}
                        </div>
                    );
                })}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 11, color: '#98a2b3' }}>Less</span>
                {['#f2f4f7', '#e0d9ff', '#b5abff', '#7c6ffa', '#5b52f0'].map(c => (
                    <span key={c} style={{ width: 14, height: 14, background: c, borderRadius: 3, display: 'inline-block' }} />
                ))}
                <span style={{ fontSize: 11, color: '#98a2b3' }}>More</span>
            </div>
        </div>
    );
}

/* ─── MAIN ─── */
export default function Analytics() {
    const [txns, setTxns] = useState([]);
    const [loading, setLoading] = useState(true);
    const now = new Date();
    const [heatmapYear, setHeatmapYear] = useState(now.getFullYear());
    const [heatmapMonth, setHeatmapMonth] = useState(now.getMonth());
    const [advice, setAdvice] = useState('');
    const [adviceLoading, setAdviceLoading] = useState(false);
    const [adviceError, setAdviceError] = useState('');

    const fetchTxns = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });
        if (error) message.error('Failed to load data');
        else setTxns(data ?? []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchTxns(); }, [fetchTxns]);

    const getAdvice = useCallback(async (expenses) => {
        if (!expenses || Object.keys(expenses).length === 0) {
            message.warning('No expense data found to generate advice.');
            return;
        }
        setAdviceLoading(true);
        setAdviceError('');
        try {
            const API = import.meta.env.VITE_API_URL || 'https://vjain5375--finance-llama-api-financeadvisor-get-advice.modal.run';
            const res = await fetch(`${API}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expenses }),
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const data = await res.json();
            setAdvice(data.advice);
        } catch (err) {
            setAdviceError('Could not connect to AI Advisor. Make sure the backend is running.');
            message.error('AI Advisor unavailable');
        } finally {
            setAdviceLoading(false);
        }
    }, []);

    /* ── Monthly comparison (last 6 months) ── */
    const months6 = lastNMonths(6);
    const monthlyData = months6.map(({ year, month, label }) => {
        const slice = txns.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });
        const spend = slice.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);
        const income = slice.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);
        const saved = Math.max(0, income - spend);
        return { label, spend, income, saved };
    });

    /* ── Category breakdown (all time debits) ── */
    const catMap = {};
    txns.filter(t => t.type === 'debit').forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
    });
    const catData = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, value]) => ({ name: catLabel(cat), value, color: catColor(cat) }));

    /* ── Summary stats ── */
    const totalSpend = txns.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);
    const totalIncome = txns.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);
    const avgMonthlySpend = monthlyData.reduce((s, m) => s + m.spend, 0) / 6;

    /* ── Top 5 transactions ── */
    const top5 = [...txns].filter(t => t.type === 'debit').sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5);

    /* ── Day-of-week spend pattern ── */
    const dowLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dowTotals = Array(7).fill(0);
    txns.filter(t => t.type === 'debit').forEach(t => {
        const d = new Date(t.date).getDay();
        dowTotals[d] += Number(t.amount);
    });
    const dowData = dowLabels.map((label, i) => ({ label, amount: dowTotals[i] }));

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <Spin size="large" tip="Loading analytics…" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1080, margin: '0 auto', width: '100%' }}>
            {/* Header */}
            <div className="mm-page-header">
                <div className="mm-page-title">Analytics</div>
                <div className="mm-page-subtitle">Deep dive into your spending patterns</div>
            </div>

            {/* Summary stat pills */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                {[
                    { label: 'Total Spent (all time)', value: INR(totalSpend), color: '#fff1f3', accent: '#c01048' },
                    { label: 'Total Income (all time)', value: INR(totalIncome), color: '#ecfdf3', accent: '#027a48' },
                    { label: 'Net Savings', value: INR(totalIncome - totalSpend), color: '#f5f3ff', accent: '#6c63ff' },
                    { label: 'Avg Monthly Spend', value: INR(avgMonthlySpend), color: '#fffbeb', accent: '#b45309' },
                ].map(({ label, value, color, accent }) => (
                    <div key={label} style={{ background: color, borderRadius: 12, padding: '12px 18px', flex: '1 1 200px' }}>
                        <div style={{ fontSize: 11, color: accent, fontWeight: 600, marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#101828' }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Row 1: Monthly + Category */}
            <Row gutter={[18, 18]}>
                <Col xs={24} lg={15}>
                    <SectionCard
                        title="Monthly Income vs Spend"
                        subtitle="Last 6 months comparison"
                    >
                        {monthlyData.every(m => m.spend === 0 && m.income === 0) ? (
                            <Empty description="No data yet" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '30px 0' }} />
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={monthlyData} margin={{ top: 6, right: 8, bottom: 0, left: -12 }} barCategoryGap="28%">
                                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#98a2b3', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                                    <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#98a2b3', fontFamily: 'Inter' }} axisLine={false} tickLine={false} width={44} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontFamily: 'Inter' }} />
                                    <Bar dataKey="income" name="Income" fill="#3ecf8e" radius={[5, 5, 0, 0]} />
                                    <Bar dataKey="spend" name="Spend" fill="#6c63ff" radius={[5, 5, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </SectionCard>
                </Col>
                <Col xs={24} lg={9}>
                    <SectionCard title="Category Breakdown" subtitle="All-time expenses by category" style={{ height: '100%' }}>
                        {catData.length === 0 ? (
                            <Empty description="No expense data" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '30px 0' }} />
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={catData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                            {catData.map((c, i) => <Cell key={i} fill={c.color} />)}
                                        </Pie>
                                        <Tooltip formatter={(v) => [INR(v), '']} contentStyle={{ borderRadius: 10, border: '1px solid #eaecf0', fontSize: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {catData.slice(0, 5).map(c => (
                                    <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
                                            <span style={{ fontSize: 12, color: '#344054', fontWeight: 500 }}>{c.name}</span>
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#101828' }}>{INR(c.value)}</span>
                                    </div>
                                ))}
                            </>
                        )}
                    </SectionCard>
                </Col>
            </Row>

            {/* Row 2: Heatmap + Day-of-week */}
            <Row gutter={[18, 18]} style={{ marginTop: 18 }}>
                <Col xs={24} lg={15}>
                    <SectionCard
                        title="Spending Heatmap"
                        subtitle="Daily expense intensity — hover for amount"
                    >
                        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
                            <Select value={heatmapMonth} onChange={setHeatmapMonth} style={{ width: 100 }} size="small">
                                {MONTHS.map((m, i) => <Option key={i} value={i}>{m}</Option>)}
                            </Select>
                            <Select value={heatmapYear} onChange={setHeatmapYear} style={{ width: 90 }} size="small">
                                {[now.getFullYear() - 1, now.getFullYear()].map(y => <Option key={y} value={y}>{y}</Option>)}
                            </Select>
                        </div>
                        <SpendHeatmap txns={txns} year={heatmapYear} month={heatmapMonth} />
                    </SectionCard>
                </Col>
                <Col xs={24} lg={9}>
                    <SectionCard title="Spending by Day of Week" subtitle="Which days you spend the most" style={{ height: '100%' }}>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={dowData} margin={{ top: 6, right: 0, bottom: 0, left: -18 }} barCategoryGap="30%">
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#98a2b3', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#98a2b3', fontFamily: 'Inter' }} axisLine={false} tickLine={false} width={36} />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="amount" name="Spent" radius={[5, 5, 0, 0]}>
                                    {dowData.map((_, i) => (
                                        <Cell key={i} fill={i === 0 || i === 6 ? '#f87171' : '#6c63ff'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 4 }}>
                            {[['#6c63ff', 'Weekday'], ['#f87171', 'Weekend']].map(([c, l]) => (
                                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#667085' }}>
                                    <span style={{ width: 10, height: 10, borderRadius: 3, background: c, display: 'inline-block' }} />
                                    {l}
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </Col>
            </Row>

            {/* Row 3: Top transactions */}
            <Row gutter={[18, 18]} style={{ marginTop: 18 }}>
                <Col xs={24}>
                    <SectionCard title="Top 5 Biggest Expenses" subtitle="Highest single-transaction spends">
                        {top5.length === 0 ? (
                            <Empty description="No expense data" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '30px 0' }} />
                        ) : (
                            <div>
                                {top5.map((t, i) => {
                                    const pct = (Number(t.amount) / Number(top5[0].amount)) * 100;
                                    return (
                                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < top5.length - 1 ? '1px solid #f2f4f7' : 'none' }}>
                                            <span style={{ width: 22, height: 22, borderRadius: 6, background: '#f5f3ff', color: '#6c63ff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {i + 1}
                                            </span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#101828' }}>{t.description || catLabel(t.category)}</div>
                                                <div style={{ fontSize: 11, color: '#98a2b3', marginTop: 1 }}>{catLabel(t.category)} · {t.date}</div>
                                                <div style={{ marginTop: 5, height: 4, background: '#f2f4f7', borderRadius: 99 }}>
                                                    <div style={{ width: `${pct}%`, height: '100%', background: catColor(t.category), borderRadius: 99, transition: 'width 0.4s ease' }} />
                                                </div>
                                            </div>
                                            <span style={{ fontSize: 15, fontWeight: 800, color: '#c01048' }}>−{INR(Number(t.amount))}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </SectionCard>
                </Col>
            </Row>

            {/* Row 4: AI Advisor */}
            <Row gutter={[18, 18]} style={{ marginTop: 18, marginBottom: 32 }}>
                <Col xs={24}>
                    <div className="mm-card" style={{ padding: '20px 24px 22px' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                            <div>
                                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#101828', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: '#6c63ff' }}>✦</span> AI Advisor
                                </div>
                                <div style={{ fontSize: 12, color: '#98a2b3', marginTop: 2 }}>Finance LLaMA · LLaMA-3-8B + LoRA · personalized from your transactions</div>
                            </div>
                            <Button
                                onClick={() => getAdvice(catMap)}
                                loading={adviceLoading}
                                disabled={Object.keys(catMap).length === 0}
                                style={{ background: '#6c63ff', border: 'none', color: '#fff', fontWeight: 600, borderRadius: 8, height: 34, paddingInline: 16, fontSize: 13 }}
                            >
                                {advice ? '↺ New Advice' : 'Get Advice'}
                            </Button>
                        </div>

                        {/* States */}
                        {adviceLoading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f5f3ff', borderRadius: 10 }}>
                                <Spin size="small" />
                                <span style={{ fontSize: 13, color: '#6c63ff' }}>Analyzing your spending… first run may take 30–60s</span>
                            </div>
                        )}
                        {!adviceLoading && adviceError && (
                            <div style={{ padding: '12px 16px', background: '#fff1f3', borderRadius: 10, borderLeft: '3px solid #f87171' }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#c01048' }}>Backend not running</div>
                                <div style={{ fontSize: 11.5, color: '#e11d48', marginTop: 2 }}>Run: <code style={{ background: '#fce7f3', padding: '1px 6px', borderRadius: 4 }}>uvicorn src.api:app --port 8000</code></div>
                            </div>
                        )}
                        {!adviceLoading && !adviceError && advice && (
                            <div style={{ padding: '14px 18px', background: '#f5f3ff', borderRadius: 10, borderLeft: '3px solid #6c63ff' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#4c1d95', marginBottom: 6 }}>💡 AI Insight</div>
                                <p style={{ fontSize: 13, color: '#3730a3', lineHeight: 1.7, margin: 0 }}>{advice}</p>
                            </div>
                        )}
                        {!adviceLoading && !adviceError && !advice && (
                            <div style={{ padding: '16px', background: '#fafafa', borderRadius: 10, border: '1px dashed #e4e7ec', textAlign: 'center' }}>
                                <div style={{ fontSize: 12, color: '#98a2b3' }}>Click "Get Advice" to generate personalized financial insights based on your spending.</div>
                            </div>
                        )}

                        {/* Category pills */}
                        {Object.keys(catMap).length > 0 && (
                            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 14 }}>
                                {Object.entries(catMap).slice(0, 6).map(([cat, amt]) => (
                                    <span key={cat} style={{ background: '#f5f3ff', borderRadius: 20, padding: '3px 11px', fontSize: 11, color: '#6c63ff', fontWeight: 500 }}>
                                        {catLabel(cat)}: {INR(amt)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </Col>
            </Row>
        </div>
    );
}
