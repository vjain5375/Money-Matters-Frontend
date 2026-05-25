import os
import re

filepath = r"c:\Users\vjain\Desktop\Money Matters AI\frontend-ui\src\pages\StockAnalysis.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Ensure Bookmark, BarChart2 and useNavigate are available
if "useNavigate" not in content:
    content = "import { useNavigate } from 'react-router-dom';\n" + content
if "Bookmark" not in content.split("from 'lucide-react'")[0]:
    content = content.replace("ArrowLeft, Search, TrendingUp", "ArrowLeft, Search, TrendingUp, Bookmark")
if "const navigate = useNavigate();" not in content:
    content = content.replace("export default function StockAnalysis() {", "export default function StockAnalysis() {\n    const navigate = useNavigate();")

# 2. Extract the search block to replace it
search_block_regex = re.compile(r"\{\/\*\s*── Search ──\s*\*\/.*?<\/div>\n\n\s*\{\/\*\s*── Popular chips ──\s*\*\/\}", re.DOTALL)
search_match = search_block_regex.search(content)

if search_match:
    original_search = search_match.group(0)
    # Strip the Popular chips part out of original_search text so we don't duplicate it
    original_search_only = original_search.replace("\n            {/* ── Popular chips ── */}", "")
    
    # We will wrap original_search_only
    new_header = """            {/* ── Header Area ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, position: 'relative', zIndex: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, maxWidth: 450 }}>
""" + original_search_only.replace("            {/* ── Search ── */}\n", "") + """
                </div>

                {!data && !loading && !error && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        {market?.commodities && (
                            <div style={{ display: 'flex', gap: 16, background: '#F8FAFC', padding: '12px 20px', borderRadius: 16, border: '1px solid #E2E8F0' }}>
                                {Object.entries(market.commodities).map(([name, idx]) => {
                                    const up = idx.change_pct >= 0;
                                    return (
                                        <div key={name} style={{ display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                                <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                                                    {name === 'USD / INR' ? '₹' : '$'}{idx.price?.toLocaleString('en-US', { maximumFractionDigits: 2 })}
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

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => navigate('/stocks/watchlist')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: '#ffffff', border: '1px solid #E2E8F0', padding: '12px 16px', borderRadius: 16,
                                    color: '#0F172A', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                    transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(15,23,42,0.03)'
                                }}
                            >
                                <Bookmark size={18} color="#4F46E5" /> Watchlist
                            </button>
                            <button onClick={() => navigate('/stocks/compare')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: '#ffffff', border: '1px solid #E2E8F0', padding: '12px 16px', borderRadius: 16,
                                    color: '#0F172A', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                    transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(15,23,42,0.03)'
                                }}
                            >
                                <BarChart2 size={18} color="#4F46E5" /> Compare
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Popular chips ── */}"""
    
    content = content.replace(original_search, new_header)

# 3. Remove old Quick Actions Bar
old_quick_actions = re.compile(r"\{\/\*\s*Quick Actions Bar\s*\*\/.*?\}\s*(?=\{\/\*\s*Indices Row\s*\*\/)", re.DOTALL)
content = old_quick_actions.sub("", content)

# 4. Remove old Commodities Row
old_commodities = re.compile(r"\{\/\*\s*Commodities Row\s*\*\/.*?\s*(?=\{\/\*\s*Gainers & Losers\s*\*\/)", re.DOTALL)
content = old_commodities.sub("", content)

# Remove the showGlobalWatchlist modal again just in case
modal_regex = re.compile(r"\{showGlobalWatchlist\s*&&\s*\(\s*<div.*?(?=\s*<\/div>\s*\);\s*\})", re.DOTALL)
content = modal_regex.sub("", content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Frontend layout successfully updated.")
