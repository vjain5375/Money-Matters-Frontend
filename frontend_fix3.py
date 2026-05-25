import os

filepath = r"c:\Users\vjain\Desktop\Money Matters AI\frontend-ui\src\pages\StockAnalysis.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add ArrowLeft to lucide-react imports
if "ArrowLeft" not in content:
    content = content.replace("Search, TrendingUp", "ArrowLeft, Search, TrendingUp")

# 2. Add state for Watchlist Modal
state_inj = """    const [showGlobalWatchlist, setShowGlobalWatchlist] = useState(false);
    const [globalWatchlist, setGlobalWatchlist] = useState([]);"""
if "const [showGlobalWatchlist" not in content:
    content = content.replace(
        "const [compareList, setCompareList] = useState([]);",
        "const [compareList, setCompareList] = useState([]);\n" + state_inj
    )

# 3. Add Back Button above Hero
back_btn_inj = """                        {/* ── Back Button ── */}
                        <div style={{ marginBottom: 16 }}>
                            <button onClick={() => { setData(null); setStock({ ticker: '', name: '' }); setQuery(''); }} 
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    background: 'transparent', border: 'none', color: '#64748B',
                                    fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0
                                }}>
                                <ArrowLeft size={16} /> Back to Market Overview
                            </button>
                        </div>
                        <div className="stock-hero-left">"""
if "<ArrowLeft size={16} /> Back" not in content:
    content = content.replace('<div className="stock-hero-left">', back_btn_inj, 1)

# 4. Add Quick Actions Bar and Commodities block in Market Overview
market_overview_anchor = """                    {/* Indices Row */}
                    <div style={{ marginBottom: 24 }}>"""
                    
quick_actions_and_comm = """                    {/* Quick Actions Bar */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                        <button onClick={() => {
                                const list = JSON.parse(localStorage.getItem('mm_watchlist')) || [];
                                setGlobalWatchlist(list);
                                setShowGlobalWatchlist(true);
                            }}
                            style={{
                                flex: 1, background: '#ffffff', border: '1px solid #E2E8F0',
                                padding: '12px 16px', borderRadius: 16, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                color: '#0F172A', fontWeight: 700, fontSize: 14,
                                transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(15,23,42,0.04)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(15,23,42,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(15,23,42,0.04)'; }}
                        >
                            ⭐ My Watchlist
                        </button>
                        <button onClick={() => setCompareMode(true)}
                            style={{
                                flex: 1, background: '#ffffff', border: '1px solid #E2E8F0',
                                padding: '12px 16px', borderRadius: 16, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                color: '#0F172A', fontWeight: 700, fontSize: 14,
                                transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(15,23,42,0.04)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(15,23,42,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(15,23,42,0.04)'; }}
                        >
                            📊 Compare Stocks
                        </button>
                    </div>

                    {/* Indices Row */}
                    <div style={{ marginBottom: 24 }}>"""

if "Quick Actions Bar" not in content:
    content = content.replace(market_overview_anchor, quick_actions_and_comm)

# Inject Commodities right after Indices Row
indices_end_anchor = """                        </div>
                    </div>

                    {/* Gainers & Losers */}"""
                    
commodities_inj = """                        </div>
                    </div>

                    {/* Commodities Row */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Currencies & Commodities</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
                            {marketLoading
                                ? [1, 2, 3].map(i => <div key={i} className="stock-skeleton-card" style={{ height: 70, borderRadius: 12 }} />)
                                : market?.commodities && Object.entries(market.commodities).map(([name, idx]) => {
                                    const sparkline = idx.sparkline_7d || idx.sparkline || [];
                                    const up = idx.change_pct >= 0;
                                    return (
                                        <div key={name} style={{
                                            background: '#ffffff', borderRadius: 16, padding: '14px 16px',
                                            border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(15,23,42,0.04)',
                                        }}>
                                            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{name}</div>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                                                {name === 'USD / INR' ? '₹' : '$'}{idx.price?.toLocaleString('en-US', { maximumFractionDigits: 2 })}
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

                    {/* Gainers & Losers */}"""
if "Commodities Row" not in content:
    content = content.replace(indices_end_anchor, commodities_inj)

# 5. Add Global Watchlist Modal at the bottom
watchlist_modal = """            {showGlobalWatchlist && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)',
                    zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={(e) => { if(e.target === e.currentTarget) setShowGlobalWatchlist(false); }}>
                    <div style={{
                        background: '#ffffff', borderRadius: 24, width: '90%', maxWidth: 400,
                        padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ margin: 0, fontSize: 18, color: '#0F172A' }}>My Watchlist</h3>
                            <button onClick={() => setShowGlobalWatchlist(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                                <XCircle size={24} />
                            </button>
                        </div>
                        
                        {globalWatchlist.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#94A3B8', padding: '40px 0', fontSize: 14 }}>
                                ⭐ Your watchlist is empty.<br/><br/>
                                <span style={{fontSize: 12}}>Add stocks using the bookmark icon!</span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
                                {globalWatchlist.map(w => (
                                    <div key={w.symbol} onClick={() => { fetchStock(w.symbol, w.name); setShowGlobalWatchlist(false); }}
                                        style={{
                                            padding: '12px 16px', background: '#F8FAFC', borderRadius: 12,
                                            border: '1px solid #E2E8F0', cursor: 'pointer',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{w.name}</div>
                                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{w.symbol}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}"""

if "My Watchlist" not in content.split("Compare panel on market overview")[1]:
    content = content.replace(
        "        </div>\n    );\n}",
        watchlist_modal
    )

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Frontend updated with navigation and global features.")
