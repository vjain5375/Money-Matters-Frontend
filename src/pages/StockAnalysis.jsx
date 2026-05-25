import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Search, TrendingUp, Bookmark, TrendingDown, Minus, RefreshCw,
    BarChart2, Newspaper, Target, Info, ExternalLink,
    ChevronDown, CheckCircle, AlertTriangle, XCircle,
} from 'lucide-react';
import {
    ComposedChart, LineChart, Line, Bar, BarChart,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, Legend,
} from 'recharts';

import WatchlistBtn from '../components/WatchlistBtn';
import ComparePanel from '../components/ComparePanel';
import MiniSparkline from '../components/MiniSparkline';
import { safeSetJson, safeGetJson } from '../utils/storage';

const API_BASE = import.meta.env.VITE_STOCK_API_URL || 'http://localhost:8000'; // Fallback to local

const formatChartDate = (dateStr, timeRange) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const isMidnight = dateStr.includes('00:00:00') || dateStr.length <= 10;
    
    if (timeRange === '1D') {
        return isMidnight ? d.toLocaleDateString([], { month: 'short', day: 'numeric' }) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (timeRange === '1W' || timeRange === '1M') {
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' }); // e.g. "May 20"
    }
    if (timeRange === '6M' || timeRange === '1Y') {
        return d.toLocaleDateString([], { month: 'short', year: '2-digit' }); // e.g. "May 26"
    }
    if (timeRange === '5Y') {
        return d.toLocaleDateString([], { month: 'short', year: '2-digit' }); // e.g. "May 26"
    }
    
    return d.toLocaleDateString();
};

const formatTooltipDate = (dateStr, timeRange) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const isMidnight = dateStr.includes('00:00:00') || dateStr.length <= 10;
    
    if (timeRange === '1D') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (timeRange === '1W') {
        return isMidnight 
            ? d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
            : `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }); // e.g. "May 20, 2026"
};

const getUniqueTicks = (data, timeRange) => {
    if (timeRange === '1W') {
        const ticks = [];
        let lastDay = "";
        data.forEach(d => {
            if (!d.rawDate) return;
            const day = d.rawDate.split(' ')[0];
            if (day !== lastDay) {
                ticks.push(d.rawDate);
                lastDay = day;
            }
        });
        return ticks;
    }
    if (timeRange === '6M' || timeRange === '1Y') {
        const ticks = [];
        let lastMonth = "";
        data.forEach(d => {
            if (!d.rawDate) return;
            const month = d.rawDate.substring(0, 7); // YYYY-MM
            if (month !== lastMonth) {
                ticks.push(d.rawDate);
                lastMonth = month;
            }
        });
        return ticks;
    }
    return undefined;
};

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
function RSIChart({ candles, indicators, timeRange, intradayData }) {
    const dataToUse = (timeRange === '1D' || timeRange === '1W') && intradayData ? intradayData : { candles, indicators };
    
    console.log('📊 RSIChart render:', {
        hasRSI: !!dataToUse.indicators?.RSI_14,
        candlesLength: dataToUse.candles?.length || 0,
        rsiLength: dataToUse.indicators?.RSI_14?.length || 0
    });
    
    if (!dataToUse.indicators?.RSI_14 || !dataToUse.candles?.length) {
        console.log('⚠️ RSIChart: Missing RSI data or candles');
        return (
            <div style={{ padding: 20, textAlign: 'center', color: '#64748B', fontSize: 14 }}>
                RSI data not available
            </div>
        );
    }
    
    const sliceStart = Math.max(0, dataToUse.candles.length - 90);
    const data = dataToUse.candles.slice(sliceStart).map((c, i) => ({
        rawDate: c.date,
        rsi: dataToUse.indicators.RSI_14[sliceStart + i] ?? null,
    }));
    
    console.log('📊 RSIChart data points:', data.length, 'Sample RSI:', data[data.length - 1]?.rsi);
    
    return (
        <ResponsiveContainer width="100%" height={120}>
            <ComposedChart data={data} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="rawDate" tickFormatter={(v) => formatChartDate(v, timeRange)} ticks={getUniqueTicks(data, timeRange)} tick={{ fontSize: 10 }} minTickGap={30} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [v?.toFixed(1), 'RSI']} labelFormatter={(l) => formatTooltipDate(l, timeRange)} />
                <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'OB', fontSize: 10, fill: '#EF4444' }} />
                <ReferenceLine y={30} stroke="#10B981" strokeDasharray="4 4" label={{ value: 'OS', fontSize: 10, fill: '#10B981' }} />
                <Line type="monotone" dataKey="rsi" stroke="#6366F1" strokeWidth={1.5} dot={false} />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

/* MACD histogram */
function MACDChart({ candles, indicators, timeRange, intradayData }) {
    const dataToUse = (timeRange === '1D' || timeRange === '1W') && intradayData ? intradayData : { candles, indicators };
    
    console.log('📊 MACDChart render:', {
        hasMACD: !!dataToUse.indicators?.MACD,
        candlesLength: dataToUse.candles?.length || 0,
        macdLength: dataToUse.indicators?.MACD?.length || 0
    });
    
    if (!dataToUse.indicators?.MACD || !dataToUse.candles?.length) {
        console.log('⚠️ MACDChart: Missing MACD data or candles');
        return (
            <div style={{ padding: 20, textAlign: 'center', color: '#64748B', fontSize: 14 }}>
                MACD data not available
            </div>
        );
    }
    
    const sliceStart = Math.max(0, dataToUse.candles.length - 90);
    const data = dataToUse.candles.slice(sliceStart).map((c, i) => {
        const idx = sliceStart + i;
        return {
            rawDate: c.date,
            macd: dataToUse.indicators.MACD?.[idx] ?? null,
            signal: dataToUse.indicators.MACD_signal?.[idx] ?? null,
            hist: dataToUse.indicators.MACD_hist?.[idx] ?? null,
        };
    });
    
    console.log('📊 MACDChart data points:', data.length, 'Sample MACD:', data[data.length - 1]?.macd);
    
    return (
        <ResponsiveContainer width="100%" height={120}>
            <ComposedChart data={data} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="rawDate" tickFormatter={(v) => formatChartDate(v, timeRange)} ticks={getUniqueTicks(data, timeRange)} tick={{ fontSize: 10 }} minTickGap={30} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [v?.toFixed(3), n]} labelFormatter={(l) => formatTooltipDate(l, timeRange)} />
                <ReferenceLine y={0} stroke="#94A3B8" />
                <Bar dataKey="hist" name="Histogram" fill="#6366F1" opacity={0.7} />
                <Line type="monotone" dataKey="macd" stroke="#10B981" strokeWidth={1.5} dot={false} name="MACD" />
                <Line type="monotone" dataKey="signal" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="Signal" />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

/* Price line chart with EMA overlays */
function PriceChart({ candles, indicators, timeRange, intradayData }) {
    const dataToUse = (timeRange === '1D' || timeRange === '1W') && intradayData ? intradayData : { candles, indicators };
    
    console.log('📊 PriceChart render:', {
        timeRange,
        hasIntradayData: !!intradayData,
        candlesLength: dataToUse.candles?.length || 0,
        hasIndicators: !!dataToUse.indicators,
        indicatorKeys: dataToUse.indicators ? Object.keys(dataToUse.indicators) : []
    });
    
    if (!dataToUse.candles?.length) {
        console.log('⚠️ PriceChart: No candles data available');
        return (
            <div style={{ padding: 20, textAlign: 'center', color: '#64748B', fontSize: 14 }}>
                No price data available for this time range
            </div>
        );
    }
    
    let sliceLen = dataToUse.candles.length;
    if (timeRange === '1M') sliceLen = 21;
    else if (timeRange === '6M') sliceLen = 126;
    else if (timeRange === '1Y') sliceLen = 252;
    
    const sliceStart = Math.max(0, dataToUse.candles.length - sliceLen);
    const data = dataToUse.candles.slice(sliceStart).map((c, i) => {
        const idx = sliceStart + i;
        return {
            rawDate: c.date,
            close: c.close,
            ema20: dataToUse.indicators?.EMA_20?.[idx] ?? null,
            ema50: dataToUse.indicators?.EMA_50?.[idx] ?? null,
        };
    });
    
    console.log('📊 PriceChart data points:', data.length, 'Sample:', data[0]);
    
    return (
        <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="rawDate" tickFormatter={(v) => formatChartDate(v, timeRange)} ticks={getUniqueTicks(data, timeRange)} tick={{ fontSize: 10 }} minTickGap={30} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`₹${v?.toFixed(2)}`, n]} labelFormatter={(l) => formatTooltipDate(l, timeRange)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="close" stroke="#6366F1" strokeWidth={2} dot={false} name="Price" />
                <Line type="monotone" dataKey="ema20" stroke="#10B981" strokeWidth={1.2} dot={false} name="EMA 20" strokeDasharray="4 2" />
                <Line type="monotone" dataKey="ema50" stroke="#F59E0B" strokeWidth={1.2} dot={false} name="EMA 50" strokeDasharray="4 2" />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

/* Reason Card for Prediction */
function ReasonCard({ reasonStr, i }) {
    const [expanded, setExpanded] = useState(false);
    
    // Clean emojis
    const cleanText = reasonStr.replace(/^[➡️✅🔴⚠️💬\s]+/, '').trim();
    
    // Get colors
    const rLower = cleanText.toLowerCase();
    const isPos = rLower.includes('positive') || rLower.includes('safe') || rLower.includes('strong') || rLower.includes('undervalued') || rLower.includes('bullish') || rLower.includes('growth');
    const isNeg = rLower.includes('negative') || rLower.includes('risk') || rLower.includes('weak') || rLower.includes('overvalued') || rLower.includes('bearish') || rLower.includes('downtrend') || rLower.includes('distress');
    const iconColor = isPos ? '#10B981' : isNeg ? '#EF4444' : '#F59E0B';
    const Icon = isPos ? CheckCircle : isNeg ? XCircle : AlertTriangle;
    
    // Explanation logic
    let explanation = "This indicator contributes to the overall AI prediction score.";
    if (rLower.includes('piotroski')) explanation = "The Piotroski F-Score is a 0-9 scale reflecting a company's financial strength. Higher scores mean healthier financials (profitability, leverage, and operating efficiency).";
    else if (rLower.includes('altman')) explanation = "The Altman Z-Score predicts the probability of bankruptcy. Z > 2.99 is 'Safe', 1.81-2.99 is 'Grey', and < 1.81 is 'Distress'.";
    else if (rLower.includes('p/e')) explanation = "The Price-to-Earnings (P/E) ratio shows how much the market is willing to pay today for a stock based on its past or future earnings. Lower P/E can mean the stock is undervalued.";
    else if (rLower.includes('debt/equity')) explanation = "Debt/Equity ratio compares a company's total liabilities to shareholder equity. High D/E means the company is heavily financing growth with debt.";
    else if (rLower.includes('macd')) explanation = "Moving Average Convergence Divergence (MACD) shows the relationship between two moving averages. When MACD crosses above the signal line, it's a bullish (buy) indicator.";
    else if (rLower.includes('rsi')) explanation = "Relative Strength Index (RSI) measures momentum. RSI > 70 is overbought (bearish), RSI < 30 is oversold (bullish).";
    else if (rLower.includes('ema20') || rLower.includes('ema50') || rLower.includes('trend')) explanation = "The price's relation to Moving Averages (EMA 20, EMA 50) determines the trend. Price above EMA suggests an uptrend, below suggests a downtrend.";
    else if (rLower.includes('sentiment') || rLower.includes('news')) explanation = "This reflects the average tone of recent news articles about the company. Positive news often precedes or confirms upward price momentum.";

    return (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + (i * 0.05) }} style={{ borderBottom: '1px solid #F1F5F9', overflow: 'hidden' }}>
            <div onClick={() => setExpanded(!expanded)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px', cursor: 'pointer' }}>
                <div style={{ color: iconColor, flexShrink: 0 }}>
                    <Icon size={16} strokeWidth={2.5} />
                </div>
                <div style={{ fontSize: 13, color: '#334155', fontWeight: 500, flex: 1 }}>
                    {cleanText}
                </div>
                <div style={{ padding: 4, flexShrink: 0, color: '#94A3B8', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <ChevronDown size={16} />
                </div>
            </div>
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '0 8px 16px 36px', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                            {explanation}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}



export default function StockAnalysis() {
    const navigate = useNavigate();
    const location = useLocation();
    const [query, setQuery] = useState('');
    const [suggestions, setSugg] = useState([]);
    const [showSugg, setShowSugg] = useState(false);
    const [selectedStock, setStock] = useState(null);
    const [activeTab, setTab] = useState('fundamentals');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [market, setMarket] = useState(null);
    const [marketLoading, setMarketLoading] = useState(true);
    const [backPath, setBackPath] = useState(null);
    
    // Compare Mode State
    const [compareMode, setCompareMode] = useState(false);
    const [compareList, setCompareList] = useState([]);
    const [timeRange, setTimeRange] = useState('1Y');
    const [intradayData, setIntradayData] = useState(null);
    const [chartLoading, setChartLoading] = useState(false);
    const [sentimentLoading, setSentimentLoading] = useState(false);
    
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    /* Fetch market overview on mount */
    useEffect(() => {
        const fetchMarket = async () => {
            const cacheKey = 'mm_market_overview';
            try {
                const res = await fetch(`${API_BASE}/stock/market-overview`);
                if (res.ok) {
                    const json = await res.json();
                    setMarket(json);
                    safeSetJson(cacheKey, { timestamp: Date.now(), data: json });
                }
            } catch { /* silently fail */ }
            finally { setMarketLoading(false); }
        };
        fetchMarket();
    }, []);

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

        // Simple local cache for blazing fast loads (10 min TTL - increased from 5)
        const cacheKey = `mm_stock_${ticker}`;
        const parsed = safeGetJson(cacheKey);
        if (parsed) {
            if (Date.now() - parsed.timestamp < 600000) {  // 10 minutes
                console.log('📊 Using cached data for', ticker);
                console.log('📊 Cached data structure:', {
                    hasTechnical: !!parsed.data.technical,
                    hasCandles: !!parsed.data.candles,
                    hasIndicators: !!parsed.data.indicators,
                    technicalCandles: parsed.data.technical?.candles?.length || 0,
                    topLevelCandles: parsed.data.candles?.length || 0,
                    topLevelIndicators: parsed.data.indicators ? Object.keys(parsed.data.indicators) : []
                });
                setData(parsed.data);
                setLoading(false);
                return;
            }
        }

        try {
            // Show optimistic loading message
            console.log('📊 Fetching fresh data for', ticker, '(this may take 10-30s on first load)');
            
            // Fetch fundamentals & technicals with longer timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
            
            const res = await fetch(`${API_BASE}/stock/full/${encodeURIComponent(ticker)}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!res.ok) {
                if (res.status === 503) {
                    throw new Error('Server is waking up, please wait 30 seconds and try again');
                }
                throw new Error(`Server error: ${res.status}`);
            }
            const json = await res.json();
            
            console.log('📊 Fresh API response for', ticker);
            console.log('📊 API data structure:', {
                hasTechnical: !!json.technical,
                hasCandles: !!json.candles,
                hasIndicators: !!json.indicators,
                technicalCandles: json.technical?.candles?.length || 0,
                topLevelCandles: json.candles?.length || 0,
                topLevelIndicators: json.indicators ? Object.keys(json.indicators) : [],
                fullStructure: Object.keys(json)
            });
            
            // Log sample candle data
            if (json.technical?.candles?.length > 0) {
                console.log('📊 Sample technical candle:', json.technical.candles[0]);
            }
            if (json.candles?.length > 0) {
                console.log('📊 Sample top-level candle:', json.candles[0]);
            }
            
            setData(json);
            
            // Save to cache
            safeSetJson(cacheKey, {
                timestamp: Date.now(),
                data: json
            });

            // Lazy-load sentiment & prediction in background!
            setSentimentLoading(true);
            fetch(`${API_BASE}/stock/predict/${encodeURIComponent(ticker)}`)
                .then(r => r.json())
                .then(predJson => {
                    setData(prev => {
                        if (!prev || prev.ticker !== ticker) return prev;
                        const updated = {
                            ...prev,
                            sentiment: predJson._sentiment_data || {},
                            prediction: predJson
                        };
                        safeSetJson(cacheKey, {
                            timestamp: Date.now(),
                            data: updated
                        });
                        return updated;
                    });
                })
                .catch(e => console.error("Lazy load failed:", e))
                .finally(() => setSentimentLoading(false));

        } catch (err) {
            console.error('📊 Fetch error:', err);
            setError(err.message || 'Failed to fetch stock data');
        } finally {
            setLoading(false);
        }
    }, []);

    /* Handle redirect from other pages (e.g., Stock Comparison) */
    useEffect(() => {
        if (location.state?.ticker) {
            fetchStock(location.state.ticker, location.state.name);
            if (location.state.from) {
                setBackPath(location.state.from);
            } else {
                setBackPath(null);
            }
            // Clear state so it doesn't refetch on every render/tab change
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, fetchStock, navigate, location.pathname]);

    /* Intraday Fetcher */
    useEffect(() => {
        if (!selectedStock || !selectedStock.ticker) return;
        if (timeRange !== '1D' && timeRange !== '1W') return;
        
        const fetchIntraday = async () => {
            setChartLoading(true);
            try {
                const period = timeRange === '1D' ? '1d' : '5d'; // 5d for 1W
                const res = await fetch(`${API_BASE}/stock/chart/${encodeURIComponent(selectedStock.ticker)}?period=${period}`);
                if (res.ok) {
                    const json = await res.json();
                    setIntradayData(json.technicals);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setChartLoading(false);
            }
        };
        fetchIntraday();
    }, [timeRange, selectedStock, API_BASE]);

    /* Compare logic */
    const addToCompare = () => {
        if (!selectedStock || !data) return;
        
        const fullStockData = {
            ticker: selectedStock.ticker,
            name: selectedStock.name || data.company_name || selectedStock.ticker,
            fundamentals: data.fundamentals || {},
            candles: data.candles || [],
            prediction: data.prediction || {}
        };

        navigate('/stocks/compare', { state: { from: '/stocks', ticker: fullStockData.ticker, name: fullStockData.company_name, stocks: [fullStockData] } });
    };

    const removeFromCompare = (sym) => {
        setCompareList(prev => {
            const next = prev.filter(p => p.symbol !== sym);
            if (next.length === 0) setCompareMode(false);
            return next;
        });
    };
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
        <div className="stock-page" style={{ paddingTop: 10 }}>

                        {/* ── Header Area ── */}
            <div className="stock-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, position: 'relative', zIndex: 10, marginBottom: 16 }}>
                <div className="stock-search-container" style={{ flex: 1, maxWidth: data ? 650 : 450, display: 'flex', alignItems: 'center', gap: 16 }}>
                    {data && (
                        <button onClick={() => {
                            if (backPath) {
                                navigate(backPath);
                            } else {
                                setData(null);
                                setStock({ ticker: '', name: '' });
                                setQuery('');
                            }
                        }} 
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                background: 'rgba(255, 255, 255, 0.95)', border: '2px solid transparent', color: '#0F172A',
                                cursor: 'pointer', height: 60, width: 60,
                                borderRadius: 20, transition: 'all 0.2s', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                        >
                            <ArrowLeft size={24} />
                        </button>
                    )}
            {/* ── Search ── */}
            <div className="stock-search-wrap" ref={searchRef} style={{ flex: 1 }}>
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

                </div>

                <div className="stock-header-widgets" style={{ display: 'flex', alignItems: 'stretch', gap: 16 }}>
                    {market?.commodities && (
                        <div className="stock-header-commodities" style={{ display: 'flex', gap: 16, background: '#F8FAFC', padding: '12px 20px', borderRadius: 16, border: '1px solid #E2E8F0' }}>
                            {Object.entries(market.commodities).map(([name, idx]) => {
                                const up = idx.change_pct >= 0;
                                let displayName = name;
                                let displayPrice = idx.price;
                                let prefix = '';
                                
                                const inrRate = market.commodities['USD / INR']?.price || 83.5;

                                if (name === 'Gold (10g)') {
                                    displayName = 'Gold (24K - 10g)';
                                    displayPrice = idx.price;
                                    prefix = '₹';
                                } else if (name === 'Silver (1kg)') {
                                    displayName = 'Silver (1kg)';
                                    displayPrice = idx.price;
                                    prefix = '₹';
                                } else if (name === 'USD / INR') {
                                    prefix = '₹';
                                }

                                return (
                                    <div key={name} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{displayName}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                            <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                                                {prefix}{displayPrice?.toLocaleString('en-IN', { maximumFractionDigits: name.includes('Silver') ? 0 : 1 })}
                                            </span>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: up ? '#10B981' : '#EF4444' }}>
                                                {up ? '▲' : '▼'}{Math.abs(idx.change_pct).toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="stock-header-buttons" style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
                        <button onClick={() => navigate('/stocks/watchlist')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: '#ffffff', border: '1px solid #E2E8F0', padding: '0 20px', borderRadius: 16,
                                color: '#0F172A', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(15,23,42,0.03)'
                            }}
                        >
                            <Bookmark size={18} color="#4F46E5" /> Watchlist
                        </button>
                        <button onClick={() => navigate('/stocks/compare', { state: { from: '/stocks' } })}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: '#ffffff', border: '1px solid #E2E8F0', padding: '0 20px', borderRadius: 16,
                                color: '#0F172A', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(15,23,42,0.03)'
                            }}
                        >
                            <BarChart2 size={18} color="#4F46E5" /> Compare
                        </button>
                    </div>
                </div>
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
                        { sym: 'ETERNAL.NS', name: 'Eternal' },
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
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                        <RefreshCw size={32} className="stock-search-spin" style={{ marginBottom: 16 }} />
                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Loading stock data...</div>
                        <div style={{ fontSize: 13, color: '#94A3B8' }}>
                            First load may take 10-30 seconds as the server wakes up
                        </div>
                    </div>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="stock-skeleton-card" />
                    ))}
                </div>
            )}

            {/* ── Main content ── */}
            {data && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

                    {/* Stock hero row */}
                    <div className="stock-hero" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                        <div className="stock-hero-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                            <div className="stock-hero-left">
                                <div className="stock-hero-name">{data.company_name || data.ticker}</div>
                                <div className="stock-hero-ticker">{data.ticker}</div>
                            </div>
                            <div className="stock-hero-right">
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', justifyContent: 'flex-end' }}>
                                    <WatchlistBtn symbol={data.ticker} name={data.company_name} showText={true} />
                                    <button
                                        onClick={addToCompare}
                                        style={{
                                            background: '#F8FAFC',
                                            border: '1px solid #E2E8F0',
                                            color: '#64748B', padding: '6px 12px',
                                            borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0F172A'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#64748B'; }}
                                    >
                                        <BarChart2 size={14} /> Compare
                                    </button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end' }}>
                                    <div className="stock-hero-price">
                                        ₹{data.fundamentals?.current_price?.toFixed(2) ?? 'N/A'}
                                    </div>
                                    <SignalBadge signal={data.prediction?.signal} size="lg" />
                                </div>
                            </div>
                        </div>
                        
                        {/* ── Timeframe & Header Chart ── */}
                        <div style={{ marginTop: 24, padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                {['1D', '1W', '1M', '6M', '1Y', '5Y'].map(rng => (
                                    <button key={rng} onClick={() => setTimeRange(rng)}
                                        style={{
                                            background: timeRange === rng ? '#4F46E5' : 'transparent',
                                            color: timeRange === rng ? '#fff' : '#64748B',
                                            border: 'none', padding: '6px 12px', borderRadius: '6px',
                                            fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => { if (timeRange !== rng) e.currentTarget.style.background = '#E2E8F0'; }}
                                        onMouseLeave={(e) => { if (timeRange !== rng) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        {rng}
                                    </button>
                                ))}
                            </div>
                            <PriceChart candles={data.technicals?.candles} indicators={data.technicals?.indicators} timeRange={timeRange} intradayData={intradayData} />
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
                                    <PriceChart 
                                        candles={data.technicals?.candles || data.candles} 
                                        indicators={data.technicals?.indicators || data.indicators} 
                                        timeRange={timeRange}
                                        intradayData={intradayData}
                                    />
                                </div>

                                <div className="stock-chart-row">
                                    <div className="stock-chart-half">
                                        <div className="stock-section-title" style={{ fontSize: 13 }}>RSI (14)</div>
                                        <div className="stock-chart-card" style={{ padding: '10px 8px 4px' }}>
                                            <RSIChart 
                                                candles={data.technicals?.candles || data.candles} 
                                                indicators={data.technicals?.indicators || data.indicators} 
                                                timeRange={timeRange} 
                                                intradayData={intradayData} 
                                            />
                                        </div>
                                    </div>
                                    <div className="stock-chart-half">
                                        <div className="stock-section-title" style={{ fontSize: 13 }}>MACD (12,26,9)</div>
                                        <div className="stock-chart-card" style={{ padding: '10px 8px 4px' }}>
                                            <MACDChart 
                                                candles={data.technicals?.candles || data.candles} 
                                                indicators={data.technicals?.indicators || data.indicators} 
                                                timeRange={timeRange} 
                                                intradayData={intradayData} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Indicator table */}
                                <div className="stock-section-title" style={{ marginTop: 20 }}>Current Values</div>
                                <div className="stock-ind-table">
                                    {[
                                        ['EMA 20', data.technicals?.latest?.EMA_20, '₹'],
                                        ['EMA 50', data.technicals?.latest?.EMA_50, '₹'],
                                        ['SMA 200', data.technicals?.latest?.SMA_200, '₹'],
                                        ['RSI 14', data.technicals?.latest?.RSI_14, ''],
                                        ['MACD', data.technicals?.latest?.MACD, ''],
                                        ['ATR 14', data.technicals?.latest?.ATR_14, '₹'],
                                        ['BB Upper', data.technicals?.latest?.BB_upper, '₹'],
                                        ['BB Lower', data.technicals?.latest?.BB_lower, '₹'],
                                    ].map(([label, val, prefix]) => (
                                        <div key={label} className="stock-ind-row">
                                            <span className="stock-ind-label">{label}</span>
                                            <span className="stock-ind-val">{val != null ? `${prefix}${Number(val).toFixed(2)}` : 'N/A'}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Signals */}
                                {data.technicals?.signals?.length > 0 && (
                                    <>
                                        <div className="stock-section-title" style={{ marginTop: 20 }}>Signal Summary</div>
                                        <div className="stock-signal-list">
                                            {data.technicals.signals.map((s, i) => (
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
                                {sentimentLoading && !data.sentiment?.articles ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                                        <RefreshCw size={24} className="stock-search-spin" style={{ marginBottom: 12 }} />
                                        <div>AI is analyzing the latest news...</div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Overall meter */}
                                        <div className="stock-sent-overview">
                                            <div className="stock-sent-score-wrap">
                                                <div className="stock-sent-score-label">Overall Sentiment</div>
                                                <div className="stock-sent-score-val" style={{ color: signalColor(data.sentiment?.overall_label) }}>
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
                            </>
                        )}
                    </motion.div>
                )}

                        {/* ── Tab: Prediction ── */}
                        {activeTab === 'prediction' && (
                            <motion.div key="pred" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                                {sentimentLoading && !data.prediction?.signal ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                                        <RefreshCw size={24} className="stock-search-spin" style={{ marginBottom: 12 }} />
                                        <div>AI is crunching fundamental & sentiment data...</div>
                                    </div>
                                ) : data.prediction && (
                                    <>
                                        {/* ── Main signal hero ── */}
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>AI Prediction Signal</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <SignalBadge signal={data.prediction.signal} size="lg" />
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                                                        <Target size={14} color="#64748B" />
                                                        {data.prediction.confidence}% Confidence
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Final Score</div>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
                                                    <span style={{ fontSize: 36, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{data.prediction.final_score}</span>
                                                    <span style={{ fontSize: 16, fontWeight: 600, color: '#94A3B8' }}>/100</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Score Breakdown ── */}
                                        <div style={{ marginBottom: 32 }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <BarChart2 size={16} color="#64748B" /> Score Breakdown
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {Object.entries(data.prediction.score_breakdown || {}).map(([key, val], idx) => {
                                                    const color = val >= 65 ? '#10B981' : val <= 38 ? '#EF4444' : '#F59E0B';
                                                    return (
                                                        <div key={key}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                                                                <span style={{ textTransform: 'capitalize' }}>{key}</span>
                                                                <span style={{ color }}>{val}</span>
                                                            </div>
                                                            <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                                                                <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 0.8, delay: idx * 0.1 }} style={{ height: '100%', background: color, borderRadius: 3 }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* ── Signal Reasons ── */}
                                        <div style={{ marginBottom: 32 }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Info size={16} color="#64748B" /> Key Drivers
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                {(data.prediction.reasons || []).map((r, i) => (
                                                    <ReasonCard key={i} reasonStr={r} i={i} />
                                                ))}
                                            </div>
                                        </div>

                                        {/* ── Disclaimer ── */}
                                        <div style={{ marginTop: 32, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center', color: '#991B1B', fontSize: 13, fontWeight: 500 }}>
                                            <AlertTriangle size={18} style={{ flexShrink: 0, color: '#EF4444' }} />
                                            {data.prediction.disclaimer || "This is not financial advice. Use this purely for educational reference."}
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Market Overview — shown when no stock is searched */}
            {!data && !loading && !error && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>


                    {/* Indices Row */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Market Indices</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
                            {marketLoading
                                ? [1, 2, 3, 4].map(i => <div key={i} className="stock-skeleton-card" style={{ height: 70, borderRadius: 12 }} />)
                                : market?.indices && Object.entries(market.indices).map(([name, idx]) => {
                                    const sparkline = idx.sparkline_7d || idx.sparkline || [];
                                    const up = idx.change_pct >= 0;
                                    return (
                                        <div key={name} style={{
                                            background: '#ffffff', borderRadius: 16, padding: '14px 16px',
                                            border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(15,23,42,0.04)',
                                        }}>
                                            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{name}</div>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                                                {idx.price?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: up ? '#10B981' : '#EF4444' }}>
                                                    {up ? '▲' : '▼'} {Math.abs(idx.change_pct).toFixed(2)}%
                                                </div>
                                                {sparkline.length > 0 && (
                                                    <MiniSparkline data={sparkline} color={up ? '#10B981' : '#EF4444'} width={40} height={20} />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    </div>

                    {/* Gainers & Losers */}
                    <div className="stock-movers-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                        {/* Top Gainers */}
                        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20, boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                                <TrendingUp size={14} style={{ color: '#10B981' }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Top Gainers</span>
                            </div>
                            {marketLoading
                                ? [1, 2, 3].map(i => <div key={i} className="stock-skeleton-card" style={{ height: 36, borderRadius: 8, marginBottom: 6 }} />)
                                : (market?.top_gainers || []).map((s) => (
                                    <div key={s.symbol} onClick={() => fetchStock(s.symbol, s.name)}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #F1F5F9', gap: 8, borderRadius: 8, transition: 'background 0.2s', cursor: 'pointer' }}
                                        className="stock-mover-row"
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{s.name}</div>
                                            <div style={{ fontSize: 11, color: '#94A3B8' }}>₹{s.price?.toLocaleString('en-IN')}</div>
                                        </div>
                                        {s.sparkline_7d && s.sparkline_7d.length > 0 && (
                                            <MiniSparkline data={s.sparkline_7d} color="#10B981" />
                                        )}
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981', background: '#ECFDF5', padding: '4px 10px', borderRadius: 6, flexShrink: 0 }}>
                                            +{s.change_pct?.toFixed(2)}%
                                        </span>
                                    </div>
                                ))
                            }
                        </div>

                        {/* Top Losers */}
                        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20, boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                                <TrendingDown size={14} style={{ color: '#EF4444' }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Top Losers</span>
                            </div>
                            {marketLoading
                                ? [1, 2, 3].map(i => <div key={i} className="stock-skeleton-card" style={{ height: 36, borderRadius: 8, marginBottom: 6 }} />)
                                : (market?.top_losers || []).map((s) => (
                                    <div key={s.symbol} onClick={() => fetchStock(s.symbol, s.name)}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #F1F5F9', gap: 8, borderRadius: 8, transition: 'background 0.2s', cursor: 'pointer' }}
                                        className="stock-mover-row"
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{s.name}</div>
                                            <div style={{ fontSize: 11, color: '#94A3B8' }}>₹{s.price?.toLocaleString('en-IN')}</div>
                                        </div>
                                        {s.sparkline_7d && s.sparkline_7d.length > 0 && (
                                            <MiniSparkline data={s.sparkline_7d} color="#EF4444" />
                                        )}
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#EF4444', background: '#FEF2F2', padding: '4px 10px', borderRadius: 6, flexShrink: 0 }}>
                                            {s.change_pct?.toFixed(2)}%
                                        </span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    {/* Trending Stocks */}
                    <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20, boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
                            <TrendingUp size={14} /> Trending Stocks
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                            {marketLoading
                                ? [1, 2, 3, 4, 5].map(i => <div key={i} className="stock-skeleton-card" style={{ width: 140, height: 64, borderRadius: 12 }} />)
                                : (market?.trending || []).map((s) => (
                                    <div key={s.symbol}
                                        style={{
                                            background: '#F8FAFC', borderRadius: 12, padding: '12px 14px',
                                            border: '1px solid #E2E8F0', minWidth: 140,
                                            transition: 'all 0.2s', position: 'relative',
                                        }}
                                        className="stock-trending-chip"
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span onClick={() => fetchStock(s.symbol, s.name)}
                                                style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', cursor: 'pointer' }}>{s.name}</span>
                                            <WatchlistBtn symbol={s.symbol} name={s.name} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: 12, color: s.change_pct >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                                                {s.price && s.price > 0 ? `₹${s.price.toLocaleString('en-IN')}` : '—'}
                                                {s.change_pct != null && ` · ${s.change_pct >= 0 ? '+' : ''}${s.change_pct.toFixed(2)}%`}
                                            </span>
                                            {s.sparkline_7d && s.sparkline_7d.length > 0 && (
                                                <MiniSparkline data={s.sparkline_7d} color={s.change_pct >= 0 ? '#10B981' : '#EF4444'} width={30} height={16} />
                                            )}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                </motion.div>
            )}
            
            {/* Compare panel (Global) */}
            {compareMode && compareList.length > 0 && (
                <ComparePanel
                    items={compareList}
                    onRemove={removeFromCompare}
                    onClear={() => { setCompareList([]); setCompareMode(false); }}
                />
            )}
        </div>
    );
}
