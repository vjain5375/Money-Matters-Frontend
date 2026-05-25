import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    GitCompare, Search, X, Plus, TrendingUp, TrendingDown,
    RefreshCw, ArrowLeft, AlertCircle, Trash2
} from 'lucide-react';
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend
} from 'recharts';

const API_BASE = import.meta.env.VITE_STOCK_API_URL || 'http://localhost:8000';
const COMP_KEY = 'mm_compare_stocks';
import { safeSetJson, safeGetJson, safeRemoveItem } from '../utils/storage';

/* ─────────────── Comparison Metrics ─────────────────── */
const COMPARE_METRICS = [
    { key: 'current_price', label: 'Current Price', fmt: v => v != null && !isNaN(v) ? `₹${Number(v).toFixed(2)}` : 'N/A', higherBetter: false },
    { key: 'change_percent', label: 'Change %', fmt: v => v != null && !isNaN(v) ? `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(2)}%` : 'N/A', higherBetter: true },
    { key: 'pe_ratio', label: 'P/E Ratio', fmt: v => v != null && !isNaN(v) ? Number(v).toFixed(2) : 'N/A', higherBetter: false },
    { key: 'pb_ratio', label: 'P/B Ratio', fmt: v => v != null && !isNaN(v) ? Number(v).toFixed(2) : 'N/A', higherBetter: false },
    { key: 'market_cap', label: 'Market Cap', fmt: v => {
        if (v == null || isNaN(v)) return 'N/A';
        const cr = Number(v) / 1e7;
        if (cr >= 1e5) return `₹${(cr / 1e5).toFixed(2)}L Cr`;
        if (cr >= 1e3) return `₹${(cr / 1e3).toFixed(2)}K Cr`;
        return `₹${cr.toFixed(2)} Cr`;
    }, higherBetter: true },
    { key: 'roe', label: 'ROE', fmt: v => v != null && !isNaN(v) ? `${(Number(v) * 100).toFixed(2)}%` : 'N/A', higherBetter: true },
    { key: 'profit_margin', label: 'Profit Margin', fmt: v => v != null && !isNaN(v) ? `${(Number(v) * 100).toFixed(2)}%` : 'N/A', higherBetter: true },
    { key: 'debt_to_equity', label: 'Debt/Equity', fmt: v => v != null && !isNaN(v) ? Number(v).toFixed(2) : 'N/A', higherBetter: false },
    { key: 'dividend_yield', label: 'Dividend Yield', fmt: v => v != null && !isNaN(v) ? `${(Number(v) * 100).toFixed(2)}%` : 'N/A', higherBetter: true },
    { key: 'piotroski_score', label: 'Piotroski Score', fmt: v => v != null ? `${v}/9` : 'N/A', higherBetter: true },
];

const STOCK_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

/* ─────────────── Stock Search Modal ─────────────────── */
function AddStockModal({ onAdd, onClose, existingTickers }) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = useCallback(async (q) => {
        if (q.length < 1) {
            setSuggestions([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/stock/search?q=${encodeURIComponent(q)}`);
            const json = await res.json();
            setSuggestions((json.results || []).filter(s => !existingTickers.includes(s.ticker)));
        } catch {
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, [existingTickers]);

    useEffect(() => {
        const timer = setTimeout(() => handleSearch(query), 300);
        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="modal-content"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: 500 }}
            >
                <div className="modal-header">
                    <h3>Add Stock to Compare</h3>
                    <button onClick={onClose} className="modal-close-btn">
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="search-input-wrap">
                        <Search size={16} style={{ color: '#94A3B8' }} />
                        <input
                            type="text"
                            placeholder="Search stocks..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                            style={{
                                flex: 1, border: 'none', outline: 'none',
                                fontSize: 14, padding: '8px 4px'
                            }}
                        />
                        {loading && <RefreshCw size={14} className="spin" style={{ color: '#6366F1' }} />}
                    </div>

                    <div className="search-results">
                        {suggestions.length === 0 && query.length > 0 && !loading && (
                            <div style={{ textAlign: 'center', padding: 24, color: '#94A3B8', fontSize: 13 }}>
                                No stocks found
                            </div>
                        )}
                        {suggestions.map((s) => (
                            <div
                                key={s.ticker}
                                className="search-result-item"
                                onClick={() => {
                                    onAdd(s.ticker, s.name);
                                    onClose();
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0F172A' }}>
                                        {s.symbol}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#64748B' }}>
                                        {s.name}
                                    </div>
                                </div>
                                <Plus size={16} style={{ color: '#6366F1' }} />
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ─────────────── Main Component ─────────────────── */
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: 'red', background: '#fee' }}>
          <h2>Something went wrong in StockComparison.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

function StockComparisonInner() {
    const location = useLocation();
    const navigate = useNavigate();
    const [stocks, setStocks] = useState(() => safeGetJson(COMP_KEY, []));
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        if (stocks.length > 0) {
            safeSetJson(COMP_KEY, stocks);
        } else {
            safeRemoveItem(COMP_KEY);
        }
    }, [stocks]);

    const handleClearAll = useCallback(() => {
        if (window.confirm('Are you sure you want to clear all stocks from the comparison page?')) {
            setStocks([]);
        }
    }, []);



    const fetchStockData = useCallback(async (ticker, name) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/stock/full/${encodeURIComponent(ticker)}?period=1y`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            const parsed = {
                ticker,
                name: name || data.company_name || ticker,
                fundamentals: data.fundamentals || {},
                candles: data.candles,
                prediction: data.prediction,
            };
            
            // Backfill current_price and change_percent from candles if missing
            if (parsed.candles && parsed.candles.length >= 2) {
                const current = parsed.candles[parsed.candles.length - 1].close;
                const prev = parsed.candles[parsed.candles.length - 2].close;
                if (parsed.fundamentals.current_price == null) {
                    parsed.fundamentals.current_price = current;
                }
                if (parsed.fundamentals.change_percent == null) {
                    parsed.fundamentals.change_percent = ((current - prev) / prev) * 100;
                }
            }
            return parsed;
        } catch (err) {
            console.error('Failed to fetch stock:', ticker, err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const handleAddStock = useCallback(async (ticker, name) => {
        if (stocks.length >= 5) {
            alert('Maximum 5 stocks can be compared at once');
            return;
        }
        if (stocks.find(s => s.ticker === ticker)) {
            alert('Stock already added');
            return;
        }
        const stockData = await fetchStockData(ticker, name);
        if (stockData) {
            setStocks(prev => [...prev, stockData]);
        }
    }, [stocks, fetchStockData]);

    const handleRemoveStock = useCallback((ticker) => {
        setStocks(prev => prev.filter(s => s.ticker !== ticker));
    }, []);

    const handleStockClick = useCallback((ticker, name) => {
        navigate('/stocks', { state: { ticker, name, from: '/stocks/compare' } });
    }, [navigate]);

    const initializedRef = useRef(false);

    // Initialize from URL query params or navigation state
    useEffect(() => {
        if (initializedRef.current) return;
        
        const queryParams = new URLSearchParams(location.search);
        const symbolsParam = queryParams.get('symbols');
        
        const loadInitialStocks = async () => {
            if (symbolsParam) {
                const symbols = symbolsParam.split(',').filter(Boolean);
                navigate(location.pathname, { replace: true, state: {} });
                
                for (const symbol of symbols) {
                    await handleAddStock(symbol, symbol.replace('.NS', ''));
                }
            } else {
                const initialStocks = location.state?.stocks || [];
                if (initialStocks.length > 0) {
                    setStocks(prev => {
                        const next = [...prev];
                        let skippedSome = false;
                        for (const s of initialStocks) {
                            if (!next.find(item => item.ticker === s.ticker)) {
                                if (next.length < 5) {
                                    next.push(s);
                                } else {
                                    skippedSome = true;
                                }
                            }
                        }
                        if (skippedSome) {
                            alert('Maximum 5 stocks can be compared. Some stocks could not be added.');
                        }
                        return next;
                    });
                    navigate(location.pathname, { replace: true, state: { ...location.state, stocks: [] } });
                }
            }
        };
        
        initializedRef.current = true;
        loadInitialStocks();
    }, [location.search, location.state, location.pathname, navigate, handleAddStock]);

    // Prepare chart data (last 90 days)
    const chartData = stocks.length > 0 && stocks[0].candles
        ? stocks[0].candles.slice(-90).map((candle, i) => {
            const point = { date: candle.date };
            stocks.forEach((stock, idx) => {
                if (stock.candles && stock.candles[stock.candles.length - 90 + i]) {
                    point[stock.ticker] = stock.candles[stock.candles.length - 90 + i].close;
                }
            });
            return point;
        })
        : [];

    return (
        <div className="comparison-page-enhanced">
            {/* Animated Background */}
            <div className="comparison-bg-gradient"></div>
            
            <motion.div 
                className="comparison-header-enhanced"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <motion.button 
                    onClick={() => navigate(-1)} 
                    className="back-btn-enhanced"
                    whileHover={{ scale: 1.05, x: -3 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft size={20} />
                </motion.button>
                
                <div className="comparison-header-content">
                    <div className="comparison-title-wrap">
                        <div className="comparison-icon-wrap">
                            <GitCompare size={32} />
                        </div>
                        <div>
                            <h1 className="comparison-title-enhanced">
                                Stock Comparison
                            </h1>
                            <p className="comparison-subtitle-enhanced">
                                Compare up to 5 stocks side-by-side • {stocks.length}/5 selected
                            </p>
                        </div>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {stocks.length > 0 && (
                        <motion.button
                            onClick={handleClearAll}
                            className="comparison-clear-btn-enhanced"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '14px 24px',
                                background: '#FFF1F2',
                                color: '#E11D48',
                                border: '1px solid #FFE4E6',
                                borderRadius: 14,
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#FFE4E6'; e.currentTarget.style.borderColor = '#FDA4AF'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFF1F2'; e.currentTarget.style.borderColor = '#FFE4E6'; }}
                        >
                            <Trash2 size={18} />
                            <span>Clear All</span>
                        </motion.button>
                    )}
                    
                    <motion.button
                        onClick={() => setShowAddModal(true)}
                        className="comparison-add-btn-enhanced"
                        disabled={stocks.length >= 5}
                        whileHover={{ scale: stocks.length < 5 ? 1.05 : 1 }}
                        whileTap={{ scale: stocks.length < 5 ? 0.98 : 1 }}
                    >
                        <div className="add-btn-icon">
                            <Plus size={18} />
                        </div>
                        <span>Add Stock</span>
                    </motion.button>
                </div>
            </motion.div>

            {stocks.length === 0 ? (
                <motion.div
                    className="comparison-empty-enhanced"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="empty-icon-wrap">
                        <GitCompare size={72} />
                    </div>
                    <h2 className="empty-title">
                        No stocks selected
                    </h2>
                    <p className="empty-subtitle">
                        Add stocks to start comparing their performance and metrics
                    </p>
                    <motion.button 
                        onClick={() => setShowAddModal(true)} 
                        className="comparison-cta-btn-enhanced"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Plus size={18} />
                        Add Your First Stock
                    </motion.button>
                </motion.div>
            ) : (
                <>
                    {/* Stock Pills */}
                    <div className="comparison-pills-enhanced">
                        <AnimatePresence>
                            {stocks.map((stock, idx) => (
                                <motion.div
                                    key={stock.ticker}
                                    className="comparison-pill-enhanced"
                                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ scale: 1.03, y: -2 }}
                                >
                                    <div className="pill-color-indicator" style={{ background: STOCK_COLORS[idx] }} />
                                    <div 
                                        className="pill-content" 
                                        onClick={() => handleStockClick(stock.ticker, stock.name)} 
                                        style={{ cursor: 'pointer' }}
                                        title="View Stock Details"
                                    >
                                        <span className="pill-name">{stock.name || stock.ticker}</span>
                                        <span className="pill-ticker">{stock.ticker}</span>
                                    </div>
                                    <motion.button 
                                        onClick={() => handleRemoveStock(stock.ticker)} 
                                        className="pill-remove-btn-enhanced"
                                        whileHover={{ scale: 1.2, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <X size={14} />
                                    </motion.button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Price Chart */}
                    {chartData.length > 0 && (
                        <motion.div
                            className="comparison-chart-card-enhanced"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="chart-header-enhanced">
                                <div>
                                    <h3 className="chart-title-enhanced">Price Comparison</h3>
                                    <p className="chart-subtitle-enhanced">90-day performance trend</p>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart data={chartData} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(v) => new Date(v).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        interval={14}
                                    />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        formatter={(v) => [`₹${v?.toFixed(2)}`, '']}
                                        labelFormatter={(l) => l}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    {stocks.map((stock, idx) => (
                                        <Line
                                            key={stock.ticker}
                                            type="monotone"
                                            dataKey={stock.ticker}
                                            stroke={STOCK_COLORS[idx]}
                                            strokeWidth={2}
                                            dot={false}
                                            name={stock.name || stock.ticker}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}

                    {/* Comparison Table */}
                    <motion.div
                        className="comparison-table-card-enhanced"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="chart-header-enhanced">
                            <div>
                                <h3 className="chart-title-enhanced">Fundamental Comparison</h3>
                                <p className="chart-subtitle-enhanced">Key financial metrics side-by-side</p>
                            </div>
                        </div>
                        <div className="comparison-table-wrap">
                            <table className="comparison-table">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left' }}>Metric</th>
                                        {stocks.map((stock, idx) => (
                                            <th 
                                                key={stock.ticker} 
                                                style={{ color: STOCK_COLORS[idx], cursor: 'pointer', transition: 'opacity 0.2s' }}
                                                onClick={() => handleStockClick(stock.ticker, stock.name)}
                                                onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
                                                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                                                title="View Stock Details"
                                            >
                                                {stock.name || stock.ticker}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {COMPARE_METRICS.map((metric) => {
                                        const values = stocks.map(s => s.fundamentals?.[metric.key]);
                                        const numericValues = values.filter(v => v != null && !isNaN(v));
                                        const best = numericValues.length > 0
                                            ? (metric.higherBetter ? Math.max(...numericValues) : Math.min(...numericValues))
                                            : null;

                                        return (
                                            <tr key={metric.key}>
                                                <td style={{ fontWeight: 600, color: '#475569' }}>
                                                    {metric.label}
                                                </td>
                                                {stocks.map((stock, idx) => {
                                                    const value = stock.fundamentals?.[metric.key];
                                                    const isBest = value != null && value === best && numericValues.length > 1;
                                                    return (
                                                        <td
                                                            key={stock.ticker}
                                                            style={{
                                                                fontWeight: isBest ? 700 : 500,
                                                                color: isBest ? '#10B981' : '#334155',
                                                                background: isBest ? '#F0FDF4' : 'transparent',
                                                            }}
                                                        >
                                                            {metric.fmt(value)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* Signals */}
                    <motion.div
                        className="comparison-signals-card-enhanced"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="chart-header-enhanced">
                            <div>
                                <h3 className="chart-title-enhanced">AI Predictions</h3>
                                <p className="chart-subtitle-enhanced">Machine learning powered signals</p>
                            </div>
                        </div>
                        <div className="signals-grid">
                            {stocks.map((stock, idx) => {
                                const signal = stock.prediction?.signal;
                                const confidence = stock.prediction?.confidence;
                                const signalColor = signal === 'BUY' ? '#10B981' : signal === 'SELL' ? '#EF4444' : '#F59E0B';
                                const Icon = signal === 'BUY' ? TrendingUp : signal === 'SELL' ? TrendingDown : AlertCircle;

                                return (
                                    <div 
                                        key={stock.ticker} 
                                        className="signal-card" 
                                        style={{ borderLeftColor: STOCK_COLORS[idx], cursor: 'pointer' }}
                                        onClick={() => handleStockClick(stock.ticker, stock.name)}
                                        title="View Stock Details"
                                    >
                                        <div style={{ fontWeight: 600, fontSize: 14, color: '#0F172A', marginBottom: 8 }}>
                                            {stock.name || stock.ticker}
                                        </div>
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            background: signal === 'BUY' ? '#ECFDF5' : signal === 'SELL' ? '#FEF2F2' : '#FFFBEB',
                                            color: signalColor,
                                            padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                                        }}>
                                            <Icon size={14} />
                                            {signal || 'HOLD'}
                                        </div>
                                        {confidence != null && (
                                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>
                                                Confidence: {confidence > 1 ? confidence.toFixed(1) : (confidence * 100).toFixed(1)}%
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}

            <AnimatePresence>
                {showAddModal && (
                    <AddStockModal
                        onAdd={handleAddStock}
                        onClose={() => setShowAddModal(false)}
                        existingTickers={stocks.map(s => s.ticker)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default function StockComparison(props) {
  return (
    <ErrorBoundary>
      <StockComparisonInner {...props} />
    </ErrorBoundary>
  );
}
