import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    BookmarkCheck, TrendingUp, TrendingDown, RefreshCw, Trash2,
    AlertCircle, Eye, GitCompare, Plus, ArrowLeft
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_STOCK_API_URL || 'https://money-matters-backend-pc4i.onrender.com';
const WL_KEY = 'mm_watchlist';
import { safeSetJson, safeGetJson } from '../utils/storage';

const getWatchlist = () => {
    return safeGetJson(WL_KEY, []);
};

/* ─────────────── Mini Sparkline ─────────────────── */
function MiniSparkline({ data, color, width = 100, height = 30 }) {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return (
        <svg width={width} height={height} style={{ display: 'block' }}>
            <polyline fill="none" stroke={color} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" points={pts} />
        </svg>
    );
}

/* ─────────────── Stock Card ─────────────────── */
function WatchlistStockCard({ ticker, onRemove, onView, onCompare }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${API_BASE}/stock/full/${encodeURIComponent(ticker)}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error('Failed to fetch', ticker, err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [ticker]);

    if (loading) {
        return (
            <div className="watchlist-card loading">
                <div className="skeleton-line" style={{ width: '60%', height: 18, marginBottom: 8 }} />
                <div className="skeleton-line" style={{ width: '40%', height: 14 }} />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="watchlist-card error">
                <AlertCircle size={16} style={{ color: '#EF4444' }} />
                <span style={{ fontSize: 13, color: '#64748B' }}>Failed to load {ticker}</span>
                <button onClick={() => onRemove(ticker)} className="watchlist-remove-btn">
                    <Trash2 size={14} />
                </button>
            </div>
        );
    }

    let price = data.fundamentals?.current_price;
    let change = data.fundamentals?.change_percent;
    const candles = data.technicals?.candles || [];
    
    if (candles.length >= 2) {
        const current = candles[candles.length - 1].close;
        const prev = candles[candles.length - 2].close;
        if (price == null) price = current;
        if (change == null) change = ((current - prev) / prev) * 100;
    }

    const signal = data.prediction?.signal;
    const sparkData = candles.slice(-30).map(c => c.close);
    const isPositive = change >= 0;

    const signalColor = (sig) => {
        if (sig === 'BUY') return '#10B981';
        if (sig === 'SELL') return '#EF4444';
        return '#F59E0B';
    };

    return (
        <motion.div
            className="watchlist-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(15,23,42,0.12)' }}
        >
            <div className="watchlist-card-header">
                <div>
                    <div className="watchlist-card-name">{data.company_name || ticker}</div>
                    <div className="watchlist-card-ticker">{ticker}</div>
                </div>
                <button onClick={() => onRemove(ticker)} className="watchlist-remove-btn" title="Remove from watchlist">
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="watchlist-card-price">
                ₹{price?.toFixed(2) ?? 'N/A'}
            </div>

            <div className="watchlist-card-change" style={{ color: isPositive ? '#10B981' : '#EF4444' }}>
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {change != null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : 'N/A'}
            </div>

            {sparkData.length > 0 && (
                <div className="watchlist-card-chart">
                    <MiniSparkline data={sparkData} color={isPositive ? '#10B981' : '#EF4444'} width={120} height={40} />
                </div>
            )}

            {signal && (
                <div className="watchlist-card-signal" style={{
                    background: signal === 'BUY' ? '#ECFDF5' : signal === 'SELL' ? '#FEF2F2' : '#FFFBEB',
                    color: signalColor(signal),
                }}>
                    {signal}
                </div>
            )}

            <div className="watchlist-card-actions">
                <button onClick={() => onView(ticker, data.company_name)} className="watchlist-action-btn primary">
                    <Eye size={14} />
                    View Details
                </button>
                <button onClick={() => onCompare(ticker, data.company_name, data.fundamentals)} className="watchlist-action-btn">
                    <GitCompare size={14} />
                    Compare
                </button>
            </div>
        </motion.div>
    );
}

/* ─────────────── Main Component ─────────────────── */
export default function Watchlist() {
    const [watchlist, setWatchlistState] = useState(() => getWatchlist());
    const [refreshKey, setRefreshKey] = useState(0);
    const navigate = useNavigate();

    const handleRemove = useCallback((tickerSymbol) => {
        const updated = watchlist.filter(t => (typeof t === 'string' ? t : t.symbol) !== tickerSymbol);
        safeSetJson(WL_KEY, updated);
        setWatchlistState(updated);
        window.dispatchEvent(new Event('watchlist_updated'));
    }, [watchlist]);

    const handleView = useCallback((ticker, name) => {
        navigate('/stocks', { state: { ticker, name, from: '/stocks/watchlist' } });
    }, [navigate]);

    const handleCompare = useCallback((ticker, name, fundamentals) => {
        navigate('/stocks/compare', { state: { from: '/stocks/watchlist', stocks: [{ ticker, name, fundamentals }] } });
    }, [navigate]);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleClearAll = () => {
        if (window.confirm('Remove all stocks from watchlist?')) {
            safeSetJson(WL_KEY, []);
            setWatchlistState([]);
        }
    };

    return (
        <div className="watchlist-page">
            <div className="watchlist-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => navigate('/stocks')} 
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            background: 'white', border: '1px solid #E2E8F0', color: '#0F172A',
                            cursor: 'pointer', height: 48, width: 48,
                            borderRadius: 14, transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#6366F1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#0F172A'; }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="watchlist-title">
                            <BookmarkCheck size={28} style={{ color: '#6366F1' }} />
                            My Watchlist
                        </h1>
                        <p className="watchlist-subtitle" style={{ margin: 0 }}>
                            Track your favorite stocks in one place
                        </p>
                    </div>
                </div>
                <div className="watchlist-header-actions">
                    <button onClick={handleRefresh} className="watchlist-header-btn">
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                    {watchlist.length > 0 && (
                        <button onClick={handleClearAll} className="watchlist-header-btn danger">
                            <Trash2 size={16} />
                            Clear All
                        </button>
                    )}
                    <button onClick={() => navigate('/stocks')} className="watchlist-header-btn primary">
                        <Plus size={16} />
                        Add Stocks
                    </button>
                </div>
            </div>

            {watchlist.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="watchlist-empty"
                >
                    <BookmarkCheck size={48} style={{ color: '#CBD5E1', marginBottom: 16 }} />
                    <h2>Your watchlist is empty</h2>
                    <p>Search and add stocks from the analysis page to track them here.</p>
                    <button onClick={() => navigate('/stocks')} className="watchlist-cta-btn">
                        Explore Stocks
                    </button>
                </motion.div>
            ) : (
                <div className="watchlist-grid" key={refreshKey}>
                    <AnimatePresence>
                        {watchlist.map(item => {
                            const ticker = typeof item === 'string' ? item : item.symbol;
                            return (
                                <WatchlistStockCard 
                                    key={ticker} 
                                    ticker={ticker} 
                                    onRemove={handleRemove} 
                                    onView={handleView}
                                    onCompare={handleCompare}
                                />
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
