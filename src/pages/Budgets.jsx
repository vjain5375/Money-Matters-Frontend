import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Form, InputNumber, Button, message, Spin, Empty, Popconfirm, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, AlertOutlined } from '@ant-design/icons';
import { supabase } from '../supabaseClient';

/* ─── Categories (expense only) ─── */
const EXPENSE_CATS = [
    { value: 'food', label: 'Food & Dining', icon: '🍜', color: '#6c63ff', bg: '#f5f3ff' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️', color: '#f7c94b', bg: '#fffbeb' },
    { value: 'transport', label: 'Transport', icon: '🚕', color: '#3ecf8e', bg: '#ecfdf5' },
    { value: 'utilities', label: 'Utilities', icon: '⚡', color: '#f87171', bg: '#fff1f3' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎬', color: '#60a5fa', bg: '#eff6ff' },
    { value: 'subscriptions', label: 'Subscriptions', icon: '🔁', color: '#a78bfa', bg: '#f5f3ff' },
    { value: 'health', label: 'Health & Medical', icon: '💊', color: '#fb923c', bg: '#fff7ed' },
    { value: 'other', label: 'Other', icon: '📌', color: '#94a3b8', bg: '#f8fafc' },
];

const catMeta = (key) => EXPENSE_CATS.find(c => c.value === key) ?? { label: key, icon: '📌', color: '#94a3b8', bg: '#f8fafc' };
const INR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

/* ─── BudgetCard ─── */
function BudgetCard({ budget, spent, onEdit, onDelete }) {
    const pct = Math.min(100, budget.limit > 0 ? (spent / budget.limit) * 100 : 0);
    const remaining = Math.max(0, budget.limit - spent);
    const overBy = Math.max(0, spent - budget.limit);
    const exceeded = spent > budget.limit;
    const meta = catMeta(budget.category);
    const barColor = pct > 90 ? '#f87171' : pct > 70 ? '#f59e0b' : meta.color;

    return (
        <div className="mm-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        {meta.icon}
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>{meta.label}</div>
                        <div style={{ fontSize: 11.5, color: '#98a2b3', marginTop: 1 }}>
                            {budget.month ? new Date(budget.year, budget.month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' }) : 'Monthly'}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        onClick={onEdit}
                        style={{ background: '#f5f3ff', border: 'none', borderRadius: 7, width: 28, height: 28, cursor: 'pointer', color: '#6c63ff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <EditOutlined />
                    </button>
                    <Popconfirm title="Delete this budget?" onConfirm={onDelete} okButtonProps={{ danger: true }}>
                        <button style={{ background: '#fff1f3', border: 'none', borderRadius: 7, width: 28, height: 28, cursor: 'pointer', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <DeleteOutlined />
                        </button>
                    </Popconfirm>
                </div>
            </div>

            {/* Amount row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#667085' }}>
                    Spent: <strong style={{ color: exceeded ? '#ef4444' : '#101828' }}>{INR(spent)}</strong>
                </span>
                <span style={{ fontSize: 13, color: '#667085' }}>
                    Limit: <strong style={{ color: '#101828' }}>{INR(budget.limit)}</strong>
                </span>
            </div>

            {/* Bar */}
            <div style={{ height: 8, background: '#f2f4f7', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${pct}%`,
                    background: barColor, borderRadius: 99,
                    transition: 'width 0.5s ease',
                }} />
            </div>

            {/* Status */}
            <div style={{ marginTop: 7, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: barColor }}>
                    {pct.toFixed(0)}% used
                    {exceeded && <span style={{ marginLeft: 6, color: '#ef4444' }}>· ⚠️ Over by {INR(overBy)}</span>}
                </span>
                {!exceeded && (
                    <span style={{ fontSize: 11.5, color: '#3ecf8e', fontWeight: 600 }}>
                        {INR(remaining)} left
                    </span>
                )}
            </div>
        </div>
    );
}

/* ─── MAIN ─── */
export default function Budgets() {
    const [budgets, setBudgets] = useState([]);
    const [txns, setTxns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null); // null = new budget
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    const now = new Date();
    const thisMonth = now.getMonth() + 1; // 1-indexed
    const thisYear = now.getFullYear();

    /* ── Fetch ── */
    const fetchAll = useCallback(async () => {
        setLoading(true);
        const [budgetRes, txnRes] = await Promise.all([
            supabase.from('budgets').select('*').order('category'),
            supabase.from('transactions').select('amount, category, date, type'),
        ]);
        if (budgetRes.error) message.error('Failed to load budgets');
        else setBudgets(budgetRes.data ?? []);
        if (!txnRes.error) setTxns(txnRes.data ?? []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    /* ── Compute spent per category (this month) ── */
    const spentMap = {};
    txns.filter(t => {
        const d = new Date(t.date);
        return t.type === 'debit' && d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear;
    }).forEach(t => {
        spentMap[t.category] = (spentMap[t.category] || 0) + Number(t.amount);
    });

    /* ── Open create/edit modal ── */
    const openCreate = () => {
        setEditing(null);
        form.resetFields();
        setModalOpen(true);
    };

    const openEdit = (b) => {
        setEditing(b);
        form.setFieldsValue({ category: b.category, limit: b.limit });
        setModalOpen(true);
    };

    /* ── Save ── */
    const onSave = async (values) => {
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (editing) {
            // Update
            const { error } = await supabase.from('budgets').update({ limit: values.limit }).eq('id', editing.id);
            if (error) { message.error('Failed to save: ' + error.message); setSaving(false); return; }
        } else {
            // Check duplicate
            const exists = budgets.find(b => b.category === values.category && b.month === thisMonth && b.year === thisYear);
            if (exists) { message.warning('Budget for this category already exists! Use edit instead.'); setSaving(false); return; }
            // Insert
            const { error } = await supabase.from('budgets').insert({
                user_id: user.id,
                category: values.category,
                limit: values.limit,
                month: thisMonth,
                year: thisYear,
            });
            if (error) { message.error('Failed to save: ' + error.message); setSaving(false); return; }
        }

        setSaving(false);
        setModalOpen(false);
        message.success(editing ? 'Budget updated!' : 'Budget created!');
        fetchAll();
    };

    /* ── Delete ── */
    const onDelete = async (id) => {
        const { error } = await supabase.from('budgets').delete().eq('id', id);
        if (error) { message.error('Delete failed'); return; }
        message.success('Budget removed');
        fetchAll();
    };

    /* ── Summary ── */
    const totalLimit = budgets.reduce((s, b) => s + Number(b.limit), 0);
    const totalSpent = budgets.reduce((s, b) => s + (spentMap[b.category] || 0), 0);
    const alerts = budgets.filter(b => (spentMap[b.category] || 0) > b.limit).length;

    /* ── Categories not yet budgeted ── */
    const budgetedCats = budgets.filter(b => b.month === thisMonth && b.year === thisYear).map(b => b.category);
    const availableCats = EXPENSE_CATS.filter(c => !budgetedCats.includes(c.value));

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <Spin size="large" tip="Loading budgets…" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1080, margin: '0 auto', width: '100%' }}>
            {/* Header */}
            <div className="mm-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div className="mm-page-title">Budgets</div>
                    <div className="mm-page-subtitle">
                        {now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })} — Set limits, track spending
                    </div>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    disabled={availableCats.length === 0}
                    onClick={openCreate}
                    style={{ height: 40, borderRadius: 10, fontWeight: 600, background: 'linear-gradient(135deg,#6c63ff,#7c6ffa)' }}
                >
                    Add Budget
                </Button>
            </div>

            {/* Summary pills */}
            {budgets.length > 0 && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                    {[
                        { label: 'Total Budget', value: INR(totalLimit), color: '#f5f3ff', accent: '#6c63ff' },
                        { label: 'Total Spent', value: INR(totalSpent), color: '#fff1f3', accent: '#c01048' },
                        { label: 'Remaining', value: INR(Math.max(0, totalLimit - totalSpent)), color: '#ecfdf5', accent: '#027a48' },
                        { label: 'Budgets Exceeded', value: alerts, color: alerts > 0 ? '#fff1f3' : '#f9fafb', accent: alerts > 0 ? '#ef4444' : '#98a2b3' },
                    ].map(({ label, value, color, accent }) => (
                        <div key={label} style={{ background: color, borderRadius: 12, padding: '12px 18px', flex: '1 1 160px' }}>
                            <div style={{ fontSize: 11, color: accent, fontWeight: 600, marginBottom: 3 }}>{label}</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#101828' }}>{value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Alert banner */}
            {alerts > 0 && (
                <div style={{ background: '#fff1f3', border: '1px solid #fecdd3', borderRadius: 12, padding: '12px 18px', marginBottom: 18, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <AlertOutlined style={{ color: '#ef4444', fontSize: 16 }} />
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#c01048' }}>
                        {alerts} budget{alerts > 1 ? 's' : ''} exceeded this month! Review your spending.
                    </span>
                </div>
            )}

            {/* Budget cards grid */}
            {budgets.length === 0 ? (
                <div className="mm-card" style={{ padding: '50px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#101828', marginBottom: 6 }}>No budgets set yet</div>
                    <div style={{ fontSize: 13, color: '#98a2b3', marginBottom: 20 }}>Create category budgets to track your monthly spending limits</div>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
                        style={{ borderRadius: 10, fontWeight: 600, height: 40, background: 'linear-gradient(135deg,#6c63ff,#7c6ffa)' }}>
                        Create First Budget
                    </Button>
                </div>
            ) : (
                <Row gutter={[18, 18]}>
                    {budgets.map(b => (
                        <Col xs={24} sm={12} lg={8} key={b.id}>
                            <BudgetCard
                                budget={b}
                                spent={spentMap[b.category] || 0}
                                onEdit={() => openEdit(b)}
                                onDelete={() => onDelete(b.id)}
                            />
                        </Col>
                    ))}
                </Row>
            )}

            {/* Add/Edit Modal */}
            <Modal
                open={modalOpen}
                title={
                    <span style={{ fontSize: 15, fontWeight: 700 }}>
                        {editing ? 'Edit Budget' : 'Add New Budget'}
                    </span>
                }
                onCancel={() => { setModalOpen(false); form.resetFields(); }}
                footer={null}
                borderRadius={16}
                styles={{ content: { borderRadius: 16 }, header: { borderRadius: '16px 16px 0 0' } }}
            >
                <Form form={form} layout="vertical" onFinish={onSave} requiredMark={false} style={{ marginTop: 16 }}>
                    {/* Category */}
                    {!editing && (
                        <Form.Item
                            name="category"
                            label={<span style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>Category</span>}
                            rules={[{ required: true, message: 'Select a category.' }]}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                                {availableCats.map(cat => (
                                    <Form.Item noStyle key={cat.value} shouldUpdate>
                                        {({ getFieldValue, setFieldsValue }) => {
                                            const selected = getFieldValue('category') === cat.value;
                                            return (
                                                <div
                                                    onClick={() => setFieldsValue({ category: cat.value })}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 9,
                                                        padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                                                        border: `1.5px solid ${selected ? cat.color : '#eaecf0'}`,
                                                        background: selected ? cat.bg : '#fafafa',
                                                        transition: 'all 0.15s',
                                                    }}
                                                >
                                                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                                                    <span style={{ fontSize: 12.5, fontWeight: selected ? 600 : 500, color: selected ? cat.color : '#344054' }}>
                                                        {cat.label}
                                                    </span>
                                                </div>
                                            );
                                        }}
                                    </Form.Item>
                                ))}
                            </div>
                        </Form.Item>
                    )}

                    {editing && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, background: catMeta(editing.category).bg, padding: '10px 14px', borderRadius: 10 }}>
                            <span style={{ fontSize: 20 }}>{catMeta(editing.category).icon}</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>{catMeta(editing.category).label}</span>
                        </div>
                    )}

                    <Form.Item
                        name="limit"
                        label={<span style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>Monthly Limit (₹)</span>}
                        rules={[
                            { required: true, message: 'Enter a limit.' },
                            { type: 'number', min: 1, message: 'Min ₹1.' },
                        ]}
                    >
                        <InputNumber
                            prefix={<span style={{ color: '#667085', fontWeight: 700 }}>₹</span>}
                            placeholder="e.g. 5000"
                            style={{ width: '100%', height: 48, borderRadius: 10, fontSize: 16, fontWeight: 600 }}
                            min={1}
                            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={v => v.replace(/,/g, '')}
                        />
                    </Form.Item>

                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        loading={saving}
                        style={{ height: 44, borderRadius: 10, fontWeight: 700, fontSize: 14, background: 'linear-gradient(135deg,#6c63ff,#7c6ffa)', marginTop: 4 }}
                    >
                        {editing ? 'Update Budget' : 'Create Budget'}
                    </Button>
                </Form>
            </Modal>
        </div>
    );
}
