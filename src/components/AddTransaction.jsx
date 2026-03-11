import { useState, useEffect, useRef } from 'react';
import {
    Form, Input, Select, DatePicker, Button, message,
    InputNumber, Spin, Empty, Segmented,
} from 'antd';
import {
    PlusOutlined, WalletOutlined, TagOutlined,
    CalendarOutlined, FileTextOutlined, CheckCircleOutlined,
    DeleteOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { supabase } from '../supabaseClient';

const { Option } = Select;

/* ─── Category config ─── */
const CATEGORIES = [
    { value: 'food', label: 'Food & Dining', icon: '🍜', color: '#fff4e6', type: 'debit' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️', color: '#eff6ff', type: 'debit' },
    { value: 'transport', label: 'Transport', icon: '🚕', color: '#fef3c7', type: 'debit' },
    { value: 'utilities', label: 'Utilities', icon: '⚡', color: '#fdf4ff', type: 'debit' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎬', color: '#ecfdf3', type: 'debit' },
    { value: 'subscriptions', label: 'Subscriptions', icon: '🔁', color: '#f0f9ff', type: 'debit' },
    { value: 'health', label: 'Health & Medical', icon: '💊', color: '#fff1f3', type: 'debit' },
    { value: 'salary', label: 'Salary / Income', icon: '💰', color: '#f0fdf4', type: 'credit' },
    { value: 'other_income', label: 'Other Income', icon: '💸', color: '#ecfdf3', type: 'credit' },
    { value: 'other', label: 'Other', icon: '📌', color: '#f9fafb', type: 'both' },
];

const catMap = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

/* ─── ML category label mapping (new Indian-trained model) ─── */
const ML_TO_KEY = {
    'food': 'food',
    'health': 'health',
    'transport': 'transport',
    'shopping': 'shopping',
    'utilities': 'utilities',
    'entertainment': 'entertainment',
    'subscriptions': 'subscriptions',
};

function normaliseCat(mlLabel) {
    if (!mlLabel) return null;
    return ML_TO_KEY[mlLabel.toLowerCase()] ?? null;
}

/* ─── Keyword map: Indian terms → instant match (no API call needed) ─── */
const KEYWORD_MAP = [
    { kw: ['swiggy', 'zomato', 'blinkit', 'zepto', 'instamart', 'biryani', 'dhaba', 'chai', 'maggi', 'dominos', 'kfc', 'mcdonalds', 'pizza', 'burger', 'restaurant', 'cafe', 'lunch', 'dinner', 'breakfast'], cat: 'food' },
    { kw: ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa', 'mall', 'clothes', 'shirt', 'shoes', 'jeans', 'dress', 'watch', 'jewellery'], cat: 'shopping' },
    { kw: ['ola', 'uber', 'rapido', 'metro', 'bus', 'rick', 'rickshaw', 'cab', 'petrol', 'diesel', 'toll', 'irctc', 'indigo', 'spicejet', 'flight'], cat: 'transport' },
    { kw: ['jio', 'airtel', 'bsnl', 'vi', 'recharge', 'broadband', 'bijli', 'electricity', 'water bill', 'gas bill'], cat: 'utilities' },
    { kw: ['netflix', 'hotstar', 'disney', 'spotify', 'youtube premium', 'prime video', 'zee5', 'crunchyroll', 'notion', 'discord', 'chatgpt', 'openai', 'github', 'adobe'], cat: 'subscriptions' },
    { kw: ['pvr', 'inox', 'bookmyshow', 'movie', 'concert', 'gaming', 'pub', 'bar', 'club', 'comedy'], cat: 'entertainment' },
    { kw: ['hospital', 'doctor', 'clinic', 'pharmacy', 'medplus', 'apollo', 'medicine', 'tablet', 'chemist', 'dentist', 'diagnostic', 'lab test', 'birth', 'delivery', 'surgery', 'nursing home', 'maternity', 'checkup', 'health bill', 'blood test', 'x-ray', 'xray', 'scan', 'vaccine', 'vaccination', 'injection', 'icu'], cat: 'health' },
];

function keywordMatch(desc) {
    const lower = desc.toLowerCase();
    for (const { kw, cat } of KEYWORD_MAP) {
        if (kw.some(k => lower.includes(k))) return cat;
    }
    return null;
}


/* ─── Field label helper ─── */
function FieldLabel({ icon, text }) {
    return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#344054' }}>
            {icon}{text}
        </span>
    );
}

/* ─── Main component ─── */
const ML_API = 'http://127.0.0.1:8001';

export default function AddTransaction() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [txnType, setTxnType] = useState('debit');
    const [recentTxns, setRecentTxns] = useState([]);
    const [deletingId, setDeletingId] = useState(null);
    const [autoCat, setAutoCat] = useState(null);   // { key, label, confidence }
    const [mlLoading, setMlLoading] = useState(false);
    const debounceRef = useRef(null);

    /* ── Fetch real transactions from Supabase ── */
    const fetchTxns = async () => {
        setFetching(true);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false })
                .limit(10);
            if (error) throw error;
            setRecentTxns(data ?? []);
        } catch (err) {
            console.error('[fetchTxns]', err);
            message.error('Could not load transactions.');
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchTxns(); }, []);

    /* ── Add transaction ── */
    const onFinish = async (values) => {
        setLoading(true);

        // Get current user id
        const { data: { user } } = await supabase.auth.getUser();

        const payload = {
            user_id: user?.id,
            amount: values.amount,
            category: txnType === 'credit' ? 'salary' : values.category,
            date: values.date.format('YYYY-MM-DD'),
            description: values.description?.trim() || '',
            type: txnType,
        };

        try {
            const { error } = await supabase.from('transactions').insert([payload]);
            if (error) throw error;

            // Refresh the feed
            await fetchTxns();
            setSubmitted(true);

            message.success({
                content: `₹${values.amount.toLocaleString('en-IN')} ${txnType === 'debit' ? 'expense' : 'income'} logged!`,
                duration: 3,
                icon: <CheckCircleOutlined style={{ color: '#027a48' }} />,
            });

            setTimeout(() => {
                form.resetFields();
                setSubmitted(false);
            }, 1800);

        } catch (err) {
            console.error('[AddTransaction]', err);
            message.error({ content: `Failed to save: ${err.message}`, duration: 5 });
        } finally {
            setLoading(false);
        }
    };

    /* ── Delete transaction ── */
    const deleteTxn = async (id) => {
        setDeletingId(id);
        try {
            const { error } = await supabase.from('transactions').delete().eq('id', id);
            if (error) throw error;
            setRecentTxns((prev) => prev.filter((t) => t.id !== id));
            message.success({ content: 'Transaction deleted.', duration: 2 });
        } catch (err) {
            message.error({ content: `Delete failed: ${err.message}`, duration: 4 });
        } finally {
            setDeletingId(null);
        }
    };

    /* ── Helpers ── */
    const totalDebit = recentTxns.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);
    const totalCredit = recentTxns.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);

    return (
        <div style={{ maxWidth: 1080, margin: '0 auto', width: '100%' }}>

            {/* ── Page header ── */}
            <div className="mm-page-header">
                <div className="mm-page-title">Transactions</div>
                <div className="mm-page-subtitle">
                    Add expenses & income — synced live to your dashboard.
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 18, alignItems: 'start' }}>

                {/* ── Form card ── */}
                <div className="mm-card" style={{ padding: '28px 30px 32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#101828' }}>New Entry</div>
                            <div style={{ fontSize: 12.5, color: '#667085', marginTop: 2 }}>All marked fields are required.</div>
                        </div>
                        {/* Debit / Credit toggle */}
                        <Segmented
                            value={txnType}
                            onChange={(val) => {
                                setTxnType(val);
                                form.setFieldsValue({ category: undefined }); // Clear category when type changes
                            }}
                            options={[
                                { label: '💸 Expense', value: 'debit' },
                                { label: '💰 Income', value: 'credit' },
                            ]}
                            style={{ fontWeight: 600, fontSize: 13 }}
                        />
                    </div>

                    <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>

                        {/* Row 1: Amount + Description */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <Form.Item
                                name="amount"
                                label={<FieldLabel icon={<WalletOutlined style={{ color: '#6c63ff' }} />} text="Amount" />}
                                rules={[
                                    { required: true, message: 'Enter the amount.' },
                                    { type: 'number', min: 1, message: 'Min ₹1.' },
                                ]}
                            >
                                <InputNumber
                                    id="txn-amount"
                                    prefix={<span style={{ color: '#667085', fontWeight: 700 }}>₹</span>}
                                    placeholder="0.00"
                                    min={1} max={9_99_999}
                                    style={{ width: '100%', height: 44, borderRadius: 9, border: '1.5px solid #eaecf0', fontSize: 15, fontWeight: 600 }}
                                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(v) => v.replace(/,/g, '')}
                                />
                            </Form.Item>

                            <Form.Item
                                name="description"
                                label={
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <FieldLabel icon={<FileTextOutlined style={{ color: '#6c63ff' }} />} text="Description" />
                                        {mlLoading && (
                                            <span style={{ fontSize: 10.5, background: '#f5f3ff', color: '#6c63ff', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
                                                🔄 Detecting…
                                            </span>
                                        )}
                                    </span>
                                }
                                rules={[{ max: 80, message: 'Max 80 chars.' }]}
                            >
                                <Input
                                    id="txn-description"
                                    placeholder="e.g. Swiggy Order → auto-categorizes!"
                                    style={{ height: 44, borderRadius: 9, border: '1.5px solid #eaecf0', fontSize: 13 }}
                                    maxLength={80}
                                    showCount
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        clearTimeout(debounceRef.current);
                                        if (txnType !== 'debit' || !val.trim()) {
                                            setAutoCat(null); setMlLoading(false); return;
                                        }
                                        const kwMatch = keywordMatch(val);
                                        if (kwMatch) {
                                            setMlLoading(false);
                                            setAutoCat({ key: kwMatch, label: catMap[kwMatch]?.label ?? kwMatch, confidence: 1, source: 'keyword' });
                                            form.setFieldsValue({ category: kwMatch });
                                            return;
                                        }
                                        setMlLoading(true);
                                        debounceRef.current = setTimeout(async () => {
                                            try {
                                                const res = await fetch(`${ML_API}/classify`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ transaction: val }),
                                                    signal: AbortSignal.timeout(4000),
                                                });
                                                if (!res.ok) throw new Error('api error');
                                                const data = await res.json();
                                                const key = normaliseCat(data.category);
                                                if (key && data.confidence >= 0.3) {
                                                    setAutoCat({ key, label: catMap[key]?.label ?? key, confidence: data.confidence, source: 'ml' });
                                                    form.setFieldsValue({ category: key });
                                                } else { setAutoCat(null); }
                                            } catch { setAutoCat(null); }
                                            finally { setMlLoading(false); }
                                        }, 500);
                                    }}
                                />
                            </Form.Item>
                        </div>

                        {/* Row 2: Date + Category (expense) / Date only (income) */}
                        <div style={{ display: 'grid', gridTemplateColumns: txnType === 'debit' ? '1fr 1fr' : '1fr', gap: 16 }}>
                            <Form.Item
                                name="date"
                                label={<FieldLabel icon={<CalendarOutlined style={{ color: '#6c63ff' }} />} text="Date" />}
                                rules={[{ required: true, message: 'Pick a date.' }]}
                            >
                                <DatePicker
                                    id="txn-date"
                                    placeholder="DD / MM / YYYY"
                                    format="DD MMM YYYY"
                                    style={{ width: '100%', height: 44, borderRadius: 9, border: '1.5px solid #eaecf0' }}
                                    disabledDate={(d) => d && d.valueOf() > Date.now()}
                                />
                            </Form.Item>

                            {txnType === 'debit' && (
                                <Form.Item
                                    name="category"
                                    label={
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FieldLabel icon={<TagOutlined style={{ color: '#6c63ff' }} />} text="Category" />
                                            {autoCat && !mlLoading && (
                                                <span style={{ fontSize: 10.5, background: '#f5f3ff', color: '#6c63ff', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
                                                    {autoCat.source === 'keyword' ? '⚡ Auto' : `🤖 ${Math.round(autoCat.confidence * 100)}%`}
                                                </span>
                                            )}
                                        </span>
                                    }
                                    rules={[{ required: true, message: 'Select a category.' }]}
                                >
                                    <Select
                                        id="txn-category"
                                        placeholder="Auto-fills from description ↑"
                                        style={{ height: 44 }}
                                        optionLabelProp="label"
                                    >
                                        {CATEGORIES.filter(c => c.type === 'debit' || c.type === 'both').map((cat) => (
                                            <Option key={cat.value} value={cat.value} label={`${cat.icon}  ${cat.label}`}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                                    <span style={{ width: 28, height: 28, borderRadius: 7, background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                                                        {cat.icon}
                                                    </span>
                                                    <span style={{ fontSize: 13, fontWeight: 500, color: '#344054' }}>{cat.label}</span>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            )}
                        </div>

                        {/* Buttons */}
                        <Form.Item style={{ marginBottom: 0, marginTop: 10 }}>
                            <Button
                                id="txn-submit"
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                icon={submitted ? <CheckCircleOutlined /> : <PlusOutlined />}
                                style={{
                                    height: 44, paddingInline: 28, borderRadius: 10, border: 'none',
                                    fontSize: 14, fontWeight: 600,
                                    background: submitted
                                        ? 'linear-gradient(135deg, #3ecf8e, #10b981)'
                                        : txnType === 'credit'
                                            ? 'linear-gradient(135deg, #10b981, #059669)'
                                            : 'linear-gradient(135deg, #6c63ff, #8b7cf8)',
                                    boxShadow: submitted ? '0 4px 14px rgba(62,207,142,0.35)' : '0 4px 14px rgba(108,99,255,0.35)',
                                    transition: 'all 0.25s',
                                }}
                            >
                                {submitted ? 'Saved!' : loading ? 'Saving…' : txnType === 'debit' ? 'Add Expense' : 'Add Income'}
                            </Button>
                            <Button
                                id="txn-reset"
                                onClick={() => form.resetFields()}
                                style={{ marginLeft: 12, height: 44, borderRadius: 10, border: '1.5px solid #eaecf0', color: '#667085', fontWeight: 500 }}
                            >
                                Clear
                            </Button>
                        </Form.Item>
                    </Form>
                </div>

                {/* ── Recent transactions feed ── */}
                <div className="mm-card">
                    <div style={{ padding: '16px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f2f4f7' }}>
                        <div>
                            <div className="mm-card-title">Recent Transactions</div>
                            <div className="mm-card-subtitle">Last {recentTxns.length} entries</div>
                        </div>
                        <Button
                            size="small"
                            icon={<ReloadOutlined spin={fetching} />}
                            onClick={fetchTxns}
                            style={{ border: '1.5px solid #eaecf0', borderRadius: 8, color: '#667085' }}
                        />
                    </div>

                    <div style={{ minHeight: 120 }}>
                        {fetching ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                                <Spin />
                            </div>
                        ) : recentTxns.length === 0 ? (
                            <Empty
                                description="No transactions yet"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                style={{ padding: '32px 0' }}
                            />
                        ) : (
                            recentTxns.map((txn) => {
                                const cat = catMap[txn.category] ?? catMap['other'];
                                const isDeleting = deletingId === txn.id;
                                const isCredit = txn.type === 'credit';
                                return (
                                    <div
                                        key={txn.id}
                                        className="mm-txn-row"
                                        style={{ opacity: isDeleting ? 0.5 : 1, transition: 'opacity 0.2s' }}
                                    >
                                        <div className="mm-txn-icon" style={{ background: cat.color }}>{cat.icon}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="mm-txn-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {txn.description || cat.label}
                                            </div>
                                            <div className="mm-txn-cat">{cat.label} · {txn.date}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div className={`mm-txn-amount ${isCredit ? 'credit' : 'debit'}`}>
                                                    {isCredit ? '+' : '−'}₹{Number(txn.amount).toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                            <Button
                                                size="small"
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                loading={isDeleting}
                                                onClick={() => deleteTxn(txn.id)}
                                                style={{ borderRadius: 6, opacity: 0.5 }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Summary footer */}
                    {recentTxns.length > 0 && (
                        <div style={{ padding: '12px 20px', background: '#fafafa', borderTop: '1px solid #f2f4f7', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ color: '#16a34a', fontWeight: 600 }}>
                                +₹{totalCredit.toLocaleString('en-IN')} income
                            </span>
                            <span style={{ color: '#f04438', fontWeight: 600 }}>
                                −₹{totalDebit.toLocaleString('en-IN')} expenses
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tips strip */}
            <div style={{
                marginTop: 18, borderRadius: 12, padding: '14px 20px',
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'linear-gradient(135deg, rgba(108,99,255,0.06), rgba(62,207,142,0.04))',
                border: '1px solid rgba(108,99,255,0.12)',
            }}>
                <span style={{ fontSize: 20 }}>💡</span>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>Pro Tip</div>
                    <div style={{ fontSize: 12.5, color: '#667085', marginTop: 2 }}>
                        All transactions are saved securely to Supabase with RLS — only you can see your data.
                        Use Income type to track salary credited to your account.
                    </div>
                </div>
            </div>
        </div>
    );
}
