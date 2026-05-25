import os

filepath = r"c:\Users\vjain\Desktop\Money Matters AI\frontend-ui\src\pages\StockAnalysis.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add state variables
state_injection = """    const [timeRange, setTimeRange] = useState('1Y');
    const [intradayData, setIntradayData] = useState(null);
    const [chartLoading, setChartLoading] = useState(false);"""
if "const [timeRange, setTimeRange]" not in content:
    content = content.replace(
        "const [compareList, setCompareList] = useState([]);",
        "const [compareList, setCompareList] = useState([]);\n" + state_injection
    )

# 2. Add intraday fetcher effect
effect_injection = """    /* Intraday Fetcher */
    useEffect(() => {
        if (!stock || !stock.ticker) return;
        if (timeRange !== '1D' && timeRange !== '1W') return;
        
        const fetchIntraday = async () => {
            setChartLoading(true);
            try {
                const period = timeRange === '1D' ? '1d' : '5d'; // 5d for 1W
                const res = await fetch(`${API_BASE}/stock/chart/${encodeURIComponent(stock.ticker)}?period=${period}`);
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
    }, [timeRange, stock, API_BASE]);"""

if "/* Intraday Fetcher */" not in content:
    content = content.replace(
        "/* Compare logic */",
        effect_injection + "\n\n    /* Compare logic */"
    )

# 3. Update Chart components
# MACD Chart
old_macd = """function MACDChart({ candles, indicators }) {
    if (!candles?.length) return null;
    const last90 = candles.slice(-90);
    const data = last90.map((c, i) => {
        const idx = candles.length - 90 + i;
        return {
            date: c.date,
            macd: indicators?.MACD?.[idx] ?? null,
            signal: indicators?.MACD_signal?.[idx] ?? null,
            hist: indicators?.MACD_hist?.[idx] ?? null,
        };
    });"""

new_macd = """function MACDChart({ candles, indicators, timeRange, intradayData }) {
    const dataToUse = (timeRange === '1D' || timeRange === '1W') && intradayData ? intradayData : { candles, indicators };
    if (!dataToUse.candles?.length) return null;
    
    let sliceLen = dataToUse.candles.length;
    if (timeRange === '1M') sliceLen = 21;
    else if (timeRange === '6M') sliceLen = 126;
    else if (timeRange === '1Y') sliceLen = 252;
    
    const sliceStart = Math.max(0, dataToUse.candles.length - sliceLen);
    const data = dataToUse.candles.slice(sliceStart).map((c, i) => {
        const idx = sliceStart + i;
        return {
            date: c.date,
            macd: dataToUse.indicators?.MACD?.[idx] ?? null,
            signal: dataToUse.indicators?.MACD_signal?.[idx] ?? null,
            hist: dataToUse.indicators?.MACD_hist?.[idx] ?? null,
        };
    });"""

content = content.replace(old_macd, new_macd)
content = content.replace('<XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} interval={29} />', '<XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => (timeRange==="1D"||timeRange==="1W") ? new Date(v).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : v.slice(5)} interval="preserveStartEnd" />')

# Price Chart
old_price = """function PriceChart({ candles, indicators }) {
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
    });"""

new_price = """function PriceChart({ candles, indicators, timeRange, intradayData }) {
    const dataToUse = (timeRange === '1D' || timeRange === '1W') && intradayData ? intradayData : { candles, indicators };
    if (!dataToUse.candles?.length) return null;
    
    let sliceLen = dataToUse.candles.length;
    if (timeRange === '1M') sliceLen = 21;
    else if (timeRange === '6M') sliceLen = 126;
    else if (timeRange === '1Y') sliceLen = 252;
    
    const sliceStart = Math.max(0, dataToUse.candles.length - sliceLen);
    const data = dataToUse.candles.slice(sliceStart).map((c, i) => {
        const idx = sliceStart + i;
        return {
            date: c.date,
            close: c.close,
            ema20: dataToUse.indicators?.EMA_20?.[idx] ?? null,
            ema50: dataToUse.indicators?.EMA_50?.[idx] ?? null,
        };
    });"""

content = content.replace(old_price, new_price)
content = content.replace('<XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} interval={14} />', '<XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => (timeRange==="1D"||timeRange==="1W") ? new Date(v).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : v.slice(5)} minTickGap={30} />')

# RSI Chart
old_rsi = """function RSIChart({ candles, indicators }) {
    if (!candles?.length) return null;
    const last90 = candles.slice(-90);
    const data = last90.map((c, i) => {
        const idx = candles.length - 90 + i;
        return {
            date: c.date,
            rsi: indicators?.RSI_14?.[idx] ?? null,
        };
    });"""

new_rsi = """function RSIChart({ candles, indicators, timeRange, intradayData }) {
    const dataToUse = (timeRange === '1D' || timeRange === '1W') && intradayData ? intradayData : { candles, indicators };
    if (!dataToUse.candles?.length) return null;
    
    let sliceLen = dataToUse.candles.length;
    if (timeRange === '1M') sliceLen = 21;
    else if (timeRange === '6M') sliceLen = 126;
    else if (timeRange === '1Y') sliceLen = 252;
    
    const sliceStart = Math.max(0, dataToUse.candles.length - sliceLen);
    const data = dataToUse.candles.slice(sliceStart).map((c, i) => {
        const idx = sliceStart + i;
        return {
            date: c.date,
            rsi: dataToUse.indicators?.RSI_14?.[idx] ?? null,
        };
    });"""

content = content.replace(old_rsi, new_rsi)
content = content.replace('<XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} interval={29} />', '<XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => (timeRange==="1D"||timeRange==="1W") ? new Date(v).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : v.slice(5)} minTickGap={30} />')

# UI Toggle Injection
ui_injection = """                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div className="stock-section-title" style={{ marginBottom: 0 }}>Price Chart</div>
                                    <div style={{ display: 'flex', gap: '4px', background: '#F8FAFC', padding: '4px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        {['1D', '1W', '1M', '6M', '1Y', '5Y'].map(t => (
                                            <button key={t} onClick={() => setTimeRange(t)}
                                                style={{
                                                    background: timeRange === t ? '#fff' : 'transparent',
                                                    color: timeRange === t ? '#0F172A' : '#64748B',
                                                    border: 'none', borderRadius: '6px', padding: '4px 10px',
                                                    fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                                    boxShadow: timeRange === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                                    transition: 'all 0.2s'
                                                }}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {chartLoading ? (
                                    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div className="stock-loading-pulse" style={{ width: 40, height: 40 }} />
                                    </div>
                                ) : (
                                    <PriceChart candles={data.technicals?.candles} indicators={data.technicals?.indicators} timeRange={timeRange} intradayData={intradayData} />
                                )}"""

old_ui = """                                <div className="stock-section-title">Price Chart (90 days)</div>
                                <div style={{ marginBottom: 32 }}>
                                    <PriceChart candles={data.technicals?.candles} indicators={data.technicals?.indicators} />"""

if old_ui in content:
    content = content.replace(old_ui, ui_injection)

# Fix RSI/MACD props
content = content.replace(
    "<RSIChart candles={data.technicals?.candles} indicators={data.technicals?.indicators} />",
    "<RSIChart candles={data.technicals?.candles} indicators={data.technicals?.indicators} timeRange={timeRange} intradayData={intradayData} />"
)
content = content.replace(
    "<MACDChart candles={data.technicals?.candles} indicators={data.technicals?.indicators} />",
    "<MACDChart candles={data.technicals?.candles} indicators={data.technicals?.indicators} timeRange={timeRange} intradayData={intradayData} />"
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Frontend React components successfully updated with timeRange logic!")
