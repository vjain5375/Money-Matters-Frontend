import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, TrendingUp, TrendingDown, Minus, RefreshCw,
    BarChart2, Newspaper, Target, Info, ExternalLink,
    ChevronDown, CheckCircle, AlertTriangle, XCircle,
} from 'lucide-react';
import {
    ComposedChart, LineChart, Line, Bar, BarChart,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, Legend,
} from 'recharts';

const API_BASE = import.meta.env.VITE_STOCK_API_URL || 'http://localhost:8000'; // Fallback to local

/* ────────────────────────── helpers ────────────────────────── */
const fmt = (v, decimals = 2, prefix = '') =>
    v == null ? 'N/A' : `${prefix}${Number(v).toFixed(decimals)}`;

const fmtCr = (v) => {
    if (v == null) return 'N/A';
    const cr = v / 1e7;
    if (cr >= 1e5) return `₹${(cr / 1e5).toFixed(2)}L Cr`;
    if (cr >= 1e3) return `₹${(cr / 1e3).toFixed(2)}K Cr`;
    return `₹${cr.toFixed(2)} Cr`;
};

const signalColor = (s) =>
    s === 'BUY' || s === 'bullish' || s === 'positive'
        ? '#10B981'
        : s === 'SELL' || s === 'bearish' || s === 'negative'
            ? '#EF4444'
            : '#F59E0B';

const signalBg = (s) =>
    s === 'BUY' || s === 'bullish' || s === 'positive'
        ? '#ECFDF5'
        : s === 'SELL' || s === 'bearish' || s === 'negative'
            ? '#FEF2F2'
            : '#FFFBEB';

const piotroskiColor = (score) =>
    score >= 7 ? '#10B981' : score >= 4 ? '#F59E0B' : '#EF4444';

const altmanColor = (zone) =>
    zone === 'safe' ? '#10B981' : zone === 'grey' ? '#F59E0B' : '#EF4444';

/* ────────────────────────── subcomponents ────────────────────────── */
function MetricCard({ label, value, sub, color }) {
    return (
        <div className="stock-metric-card">
            <div className="stock-metric-label">{label}</div>
            <div className="stock-metric-value" style={{ color: color || '#0F172A' }}>
                {value}
            </div>
            {sub && <div className="stock-metric-sub">{sub}</div>}
        </div>
    );
}

function SignalBadge({ signal, size = 'sm' }) {
    const color = signalColor(signal);
    const bg = signalBg(signal);
    const Icon = signal === 'BUY' || signal === 'bullish' || signal === 'positive'
        ? TrendingUp : signal === 'SELL' || signal === 'bearish' || signal === 'negative'
            ? TrendingDown : Minus;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: bg, color, border: `1px solid ${color}30`,
            borderRadius: 8, padding: size === 'lg' ? '6px 14px' : '3px 10px',
            fontSize: size === 'lg' ? 15 : 12, fontWeight: 700,
        }}>
            <Icon size={size === 'lg' ? 16 : 12} />
            {signal?.toUpperCase()}
        </span>
    );
}

/* RSI line chart */
function RSIChart({ indicators, candles }) {
    if (!indicators?.RSI_14 || !candles) return null;
    const data = candles.slice(-90).map((c, i) => ({
        date: c.date,
        rsi: indicators.RSI_14[candles.length - 90 + i] ?? null,
    }));
    return (
        <ResponsiveContainer width="100%" height={120}>
            <ComposedChart data={data} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} interval={29} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [v?.toFixed(1), 'RSI']} labelFormatter={(l) => l} />
                <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'OB', fontSize: 10, fill: '#EF4444' }} />
                <ReferenceLine y={30} stroke="#10B981" strokeDasharray="4 4" label={{ value: 'OS', fontSize: 10, fill: '#10B981' }} />
                <Line type="monotone" dataKey="rsi" stroke="#6366F1" strokeWidth={1.5} dot={false} />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

/* MACD histogram */
function MACDChart({ indicators, candles }) {
    if (!indicators?.MACD || !candles) return null;
    const data = candles.slice(-90).map((c, i) => {
        const idx = candles.length - 90 + i;
        return {
            date: c.date,
            macd: indicators.MACD?.[idx] ?? null,
            signal: indicators.MACD_signal?.[idx] ?? null,
            hist: indicators.MACD_hist?.[idx] ?? null,
        };
    });
    return (
        <ResponsiveContainer width="100%" height={120}>
            <ComposedChart data={data} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} interval={29} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [v?.toFixed(3), n]} />
                <ReferenceLine y={0} stroke="#94A3B8" />
                <Bar dataKey="hist" name="Histogram" fill="#6366F1" opacity={0.7} />
                <Line type="monotone" dataKey="macd" stroke="#10B981" strokeWidth={1.5} dot={false} name="MACD" />
                <Line type="monotone" dataKey="signal" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="Signal" />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

/* Price line chart with EMA overlays */
function PriceChart({ candles, indicators }) {
    if (!candles?.length) return null;
    const last90 = candles.slice(-90);
    const data = last90.map((c, i) => {
        const idx = candles.length - 90 + i;
        return {
            date: c.date,
            close: c.close,
            ema20: indicators?.EMA_20?.[idx] ?? null,
            ema50: indicators?.EMA_50?.[idx] ?? null,
        };
    });
    return (
        <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} interval={14} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`₹${v?.toFixed(2)}`, n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="close" stroke="#6366F1" strokeWidth={2} dot={false} name="Price" />
                <Line type="monotone" dataKey="ema20" stroke="#10B981" strokeWidth={1.2} dot={false} name="EMA 20" strokeDasharray="4 2" />
                <Line type="monotone" dataKey="ema50" stroke="#F59E0B" strokeWidth={1.2} dot={false} name="EMA 50" strokeDasharray="4 2" />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

/* ──────────────────────── main page ──────────────────────── */
export default function StockAnalysis() {
    const [query, setQuery] = useState('');
    const [suggestions, setSugg] = useState([]);
    const [showSugg, setShowSugg] = useState(false);
    const [selectedStock, setStock] = useState(null);
    const [activeTab, setTab] = useState('fundamentals');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    /* Search autocomplete */
    const handleQueryChange = useCallback((e) => {
        const val = e.target.value;
        setQuery(val);
        clearTimeout(debounceRef.current);
        if (val.length < 1) { setSugg([]); setShowSugg(false); return; }
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`${API_BASE}/stock/search?q=${encodeURIComponent(val)}`);
                const json = await res.json();
                setSugg(json.results || []);
                setShowSugg(true);
            } catch { setSugg([]); }
        }, 280);
    }, []);

    /* Fetch full analysis when stock selected */
    const fetchStock = useCallback(async (ticker, name) => {
        setLoading(true);
        setError(null);
        setData(null);
        setShowSugg(false);
        setStock({ ticker, name });
        setQuery(name || ticker);

        try {
            const res = await fetch(`${API_BASE}/stock/full/${encodeURIComponent(ticker)}`);
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err.message || 'Failed to fetch stock data');
        } finally {
            setLoading(false);
        }
    }, []);

    /* Close suggestions on outside click */
    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setShowSugg(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const tabs = [
        { id: 'fundamentals', label: 'Fundamentals', icon: BarChart2 },
        { id: 'technical', label: 'Technical', icon: TrendingUp },
        { id: 'sentiment', label: 'Sentiment', icon: Newspaper },
        { id: 'prediction', label: 'Prediction', icon: Target },
    ];

    return (
        <div className="stock-page">
            {/* ── Header ── */}
            <div className="stock-page-header">
                <div>
                    <h1 className="stock-page-title">📈 Stock Analyser</h1>
                    <p className="stock-page-sub">Indian markets (NSE/BSE) — Live fundamental, technical & sentiment analysis</p>
                </div>
            </div>

            {/* ── Search ── */}
            <div className="stock-search-wrap" ref={searchRef}>
                <div className="stock-search-box">
                    <Search size={16} className="stock-search-icon" />
                    <input
                        id="stock-search-input"
                        type="text"
                        className="stock-search-input"
                        placeholder="Search stock: Reliance, TCS, HDFC..."
                        value={query}
                        onChange={handleQueryChange}
                        onFocus={() => suggestions.length > 0 && setShowSugg(true)}
                        autoComplete="off"
                    />
                    {loading && <RefreshCw size={14} className="stock-search-spin" />}
                </div>

                <AnimatePresence>
                    {showSugg && suggestions.length > 0 && (
                        <motion.div
                            className="stock-suggest-list"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.12 }}
                        >
                            {suggestions.map((s) => (
                                <div
                                    key={s.ticker}
                                    className="stock-suggest-item"
                                    id={`suggest-${s.symbol}`}
                                    onClick={() => fetchStock(s.ticker, s.name)}
                                >
                                    <span className="stock-suggest-sym">{s.symbol}</span>
                                    <span className="stock-suggest-name">{s.name}</span>
                                    <span className="stock-suggest-exch">{s.exchange}</span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Popular chips ── */}
            {!data && !loading && (
                <div className="stock-popular-wrap">
                    <span className="stock-popular-label">Popular:</span>
                    {[
                        { sym: 'RELIANCE.NS', name: 'Reliance' },
                        { sym: 'TCS.NS', name: 'TCS' },
                        { sym: 'INFY.NS', name: 'Infosys' },
                        { sym: 'HDFCBANK.NS', name: 'HDFC Bank' },
                        { sym: 'ZOMATO.NS', name: 'Zomato' },
                        { sym: 'SBIN.NS', name: 'SBI' },
                    ].map((p) => (
                        <button
                            key={p.sym}
                            className="stock-popular-chip"
                            onClick={() => fetchStock(p.sym, p.name)}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Error ── */}
            {error && (
                <div className="stock-error-box">
                    <XCircle size={16} /> {error}
                </div>
            )}

            {/* ── Loading skeleton ── */}
            {loading && (
                <div className="stock-skeleton-wrap">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="stock-skeleton-card" />
                    ))}
                </div>
            )}

            {/* ── Main content ── */}
            {data && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

                    {/* Stock hero row */}
                    <div className="stock-hero">
                        <div className="stock-hero-left">
                            <div className="stock-hero-name">{data.company_name || data.ticker}</div>
                            <div className="stock-hero-ticker">{data.ticker}</div>
                        </div>
                        <div className="stock-hero-right">
                            <div className="stock-hero-price">
                                ₹{data.fundamentals?.current_price?.toFixed(2) ?? 'N/A'}
                            </div>
                            <SignalBadge signal={data.prediction?.signal} size="lg" />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="stock-tabs">
                        {tabs.map((t) => {
                            const Icon = t.icon;
                            return (
                                <button
                                    key={t.id}
                                    id={`stock-tab-${t.id}`}
                                    className={`stock-tab-btn ${activeTab === t.id ? 'active' : ''}`}
                                    onClick={() => setTab(t.id)}
                                >
                                    <Icon size={13} />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Tab: Fundamentals ── */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'fundamentals' && (
                            <motion.div key="funds" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                                <div className="stock-section-title">Key Ratios</div>
                                <div className="stock-metrics-grid">
                                    <MetricCard label="P/E Ratio" value={fmt(data.fundamentals?.pe_ratio, 2)} />
                                    <MetricCard label="P/B Ratio" value={fmt(data.fundamentals?.pb_ratio, 2)} />
                                    <MetricCard label="ROE" value={data.fundamentals?.roe != null ? `${(data.fundamentals.roe * 100).toFixed(1)}%` : 'N/A'} color={data.fundamentals?.roe > 0.15 ? '#10B981' : data.fundamentals?.roe < 0 ? '#EF4444' : undefined} />
                                    <MetricCard label="Debt / Equity" value={fmt(data.fundamentals?.debt_to_equity, 2)} color={data.fundamentals?.debt_to_equity > 2 ? '#EF4444' : undefined} />
                                    <MetricCard label="EPS" value={fmt(data.fundamentals?.eps, 2, '₹')} />
                                    <MetricCard label="Profit Margin" value={data.fundamentals?.profit_margin != null ? `${(data.fundamentals.profit_margin * 100).toFixed(1)}%` : 'N/A'} />
                                    <MetricCard label="Current Ratio" value={fmt(data.fundamentals?.current_ratio, 2)} />
                                    <MetricCard label="Dividend Yield" value={data.fundamentals?.dividend_yield != null ? `${(data.fundamentals.dividend_yield * 100).toFixed(2)}%` : 'N/A'} />
                                    <MetricCard label="Market Cap" value={fmtCr(data.fundamentals?.market_cap)} />
                                    <MetricCard label="52W High" value={fmt(data.fundamentals?.week_52_high, 2, '₹')} />
                                    <MetricCard label="52W Low" value={fmt(data.fundamentals?.week_52_low, 2, '₹')} />
                                    <MetricCard label="Revenue Growth" value={data.fundamentals?.revenue_growth != null ? `${(data.fundamentals.revenue_growth * 100).toFixed(1)}%` : 'N/A'} />
                                </div>

                                {/* Piotroski + Altman */}
                                <div className="stock-score-row">
                                    {/* Piotroski */}
                                    <div className="stock-score-card">
                                        <div className="stock-score-label">Piotroski F-Score</div>
                                        <div className="stock-score-big" style={{ color: piotroskiColor(data.fundamentals?.piotroski_score) }}>
                                            {data.fundamentals?.piotroski_score ?? 'N/A'}
                                            {data.fundamentals?.piotroski_score != null && <span style={{ fontSize: 16, color: '#94A3B8' }}>/9</span>}
                                        </div>
                                        <div className="stock-score-desc">
                                            {data.fundamentals?.piotroski_score >= 7
                                                ? '✅ Strong financials'
                                                : data.fundamentals?.piotroski_score >= 4
                                                    ? '➡️ Average health'
                                                    : data.fundamentals?.piotroski_score != null
                                                        ? '🔴 Weak financials'
                                                        : 'Data unavailable'}
                                        </div>
                                        {/* Signal dots */}
                                        <div className="stock-piotroski-dots">
                                            {Object.entries(data.fundamentals?.piotroski_details || {}).map(([k, v]) => (
                                                <div key={k} title={k.replace(/_/g, ' ')} className={`stock-piotroski-dot ${v ? 'on' : 'off'}`} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Altman */}
                                    <div className="stock-score-card">
                                        <div className="stock-score-label">Altman Z-Score</div>
                                        <div className="stock-score-big" style={{ color: altmanColor(data.fundamentals?.altman_zone) }}>
                                            {data.fundamentals?.altman_z_score?.toFixed(2) ?? 'N/A'}
                                        </div>
                                        <div className="stock-score-desc">
                                            {data.fundamentals?.altman_zone === 'safe'
                                                ? '✅ Safe zone (Z > 2.99)'
                                                : data.fundamentals?.altman_zone === 'grey'
                                                    ? '⚠️ Grey zone (1.81–2.99)'
                                                    : data.fundamentals?.altman_zone === 'distress'
                                                        ? '🔴 Distress zone (Z < 1.81)'
                                                        : 'Insufficient data'}
                                        </div>
                                        <div className="stock-altman-bar">
                                            <div className="stock-altman-seg red" />
                                            <div className="stock-altman-seg yellow" />
                                            <div className="stock-altman-seg green" />
                                            {data.fundamentals?.altman_z_score != null && (
                                                <div
                                                    className="stock-altman-marker"
                                                    style={{ left: `${Math.min(95, Math.max(2, (data.fundamentals.altman_z_score / 5) * 100))}%` }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── Tab: Technical ── */}
                        {activeTab === 'technical' && (
                            <motion.div key="tech" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                                <div className="stock-section-title">Price Chart (90 days)</div>
                                <div className="stock-chart-card">
                                    <PriceChart candles={data.technical?.candles} indicators={data.technical?.indicators} />
                                </div>

                                <div className="stock-chart-row">
                                    <div className="stock-chart-half">
                                        <div className="stock-section-title" style={{ fontSize: 13 }}>RSI (14)</div>
                                        <div className="stock-chart-card" style={{ padding: '10px 8px 4px' }}>
                                            <RSIChart candles={data.technical?.candles} indicators={data.technical?.indicators} />
                                        </div>
                                    </div>
                                    <div className="stock-chart-half">
                                        <div className="stock-section-title" style={{ fontSize: 13 }}>MACD (12,26,9)</div>
                                        <div className="stock-chart-card" style={{ padding: '10px 8px 4px' }}>
                                            <MACDChart candles={data.technical?.candles} indicators={data.technical?.indicators} />
                                        </div>
                                    </div>
                                </div>

                                {/* Indicator table */}
                                <div className="stock-section-title" style={{ marginTop: 20 }}>Current Values</div>
                                <div className="stock-ind-table">
                                    {[
                                        ['EMA 20', data.technical?.latest?.EMA_20, '₹'],
                                        ['EMA 50', data.technical?.latest?.EMA_50, '₹'],
                                        ['SMA 200', data.technical?.latest?.SMA_200, '₹'],
                                        ['RSI 14', data.technical?.latest?.RSI_14, ''],
                                        ['MACD', data.technical?.latest?.MACD, ''],
                                        ['ATR 14', data.technical?.latest?.ATR_14, '₹'],
                                        ['BB Upper', data.technical?.latest?.BB_upper, '₹'],
                                        ['BB Lower', data.technical?.latest?.BB_lower, '₹'],
                                    ].map(([label, val, prefix]) => (
                                        <div key={label} className="stock-ind-row">
                                            <span className="stock-ind-label">{label}</span>
                                            <span className="stock-ind-val">{val != null ? `${prefix}${Number(val).toFixed(2)}` : 'N/A'}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Signals */}
                                {data.technical?.signals?.length > 0 && (
                                    <>
                                        <div className="stock-section-title" style={{ marginTop: 20 }}>Signal Summary</div>
                                        <div className="stock-signal-list">
                                            {data.technical.signals.map((s, i) => (
                                                <div key={i} className="stock-signal-item" style={{ borderLeft: `3px solid ${signalColor(s.signal)}` }}>
                                                    <SignalBadge signal={s.signal} />
                                                    <span className="stock-signal-ind">{s.indicator}</span>
                                                    <span className="stock-signal-note">{s.note}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/* ── Tab: Sentiment ── */}
                        {activeTab === 'sentiment' && (
                            <motion.div key="sent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                                {/* Overall meter */}
                                <div className="stock-sent-overview">
                                    <div className="stock-sent-score-wrap">
                                        <div className="stock-sent-score-label">Overall Sentiment</div>
                                        <div className="stock-sent-score-val"
                                            style={{ color: signalColor(data.sentiment?.overall_label) }}>
                                            {data.sentiment?.overall_label?.toUpperCase() ?? 'N/A'}
                                        </div>
                                        <div className="stock-sent-score-num">
                                            {data.sentiment?.overall_score != null
                                                ? `Score: ${data.sentiment.overall_score > 0 ? '+' : ''}${data.sentiment.overall_score.toFixed(2)}`
                                                : ''}
                                        </div>
                                    </div>
                                    <div className="stock-sent-meta">
                                        <div>{data.sentiment?.articles_found ?? 0} articles analysed</div>
                                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                                            Sources: ET, Moneycontrol, LiveMint, Business Standard
                                        </div>
                                    </div>
                                </div>

                                {/* News cards */}
                                {data.sentiment?.articles?.length > 0 ? (
                                    <div className="stock-news-list">
                                        {data.sentiment.articles.map((a, i) => (
                                            <div key={i} className="stock-news-card" style={{ borderLeft: `3px solid ${signalColor(a.sentiment?.toLowerCase())}` }}>
                                                <div className="stock-news-top">
                                                    <SignalBadge signal={a.sentiment?.toLowerCase()} />
                                                    <span className="stock-news-source">{a.source}</span>
                                                    <span className="stock-news-date">{a.date?.slice(0, 16) || ''}</span>
                                                </div>
                                                <div className="stock-news-title">
                                                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="stock-news-link">
                                                        {a.title} <ExternalLink size={11} style={{ verticalAlign: 'middle' }} />
                                                    </a>
                                                </div>
                                                {a.summary && <div className="stock-news-summary">{a.summary}</div>}
                                                {a.sentiment_reason && (
                                                    <div className="stock-news-reason">💬 {a.sentiment_reason}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="stock-empty-state">
                                        <Newspaper size={32} style={{ color: '#CBD5E1' }} />
                                        <p>No recent news found for this stock.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── Tab: Prediction ── */}
                        {activeTab === 'prediction' && data.prediction && (
                            <motion.div key="pred" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                                {/* Main signal card */}
                                <div className="stock-pred-hero" style={{ borderColor: signalColor(data.prediction.signal) + '40', background: signalBg(data.prediction.signal) }}>
                                    <div className="stock-pred-signal-wrap">
                                        <SignalBadge signal={data.prediction.signal} size="lg" />
                                        <div className="stock-pred-conf">
                                            {data.prediction.confidence}% confidence
                                        </div>
                                    </div>
                                    <div className="stock-pred-score">
                                        Final Score: <strong>{data.prediction.final_score}</strong> / 100
                                    </div>
                                </div>

                                {/* Score breakdown */}
                                <div className="stock-section-title">Score Breakdown</div>
                                <div className="stock-breakdown-list">
                                    {Object.entries(data.prediction.score_breakdown || {}).map(([key, val]) => (
                                        <div key={key} className="stock-breakdown-row">
                                            <span className="stock-breakdown-key">{key}</span>
                                            <div className="stock-breakdown-bar-wrap">
                                                <div
                                                    className="stock-breakdown-bar"
                                                    style={{
                                                        width: `${val}%`,
                                                        background: val >= 65 ? '#10B981' : val <= 38 ? '#EF4444' : '#F59E0B',
                                                    }}
                                                />
                                            </div>
                                            <span className="stock-breakdown-val">{val}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Reasons */}
                                <div className="stock-section-title" style={{ marginTop: 20 }}>Signal Reasons</div>
                                <div className="stock-reasons-list">
                                    {(data.prediction.reasons || []).map((r, i) => (
                                        <div key={i} className="stock-reason-item">{r}</div>
                                    ))}
                                </div>

                                {/* Disclaimer */}
                                <div className="stock-disclaimer">
                                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                                    {data.prediction.disclaimer}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Empty state */}
            {!data && !loading && !error && (
                <div className="stock-empty-state" style={{ marginTop: 60 }}>
                    <TrendingUp size={48} style={{ color: '#CBD5E1' }} />
                    <p>Search for a stock above to get started</p>
                    <p style={{ fontSize: 12, color: '#94A3B8' }}>Supports all NSE & BSE listed companies</p>
                </div>
            )}
        </div>
    );
}
