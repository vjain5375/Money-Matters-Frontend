import os
import re

filepath = r"c:\Users\vjain\Desktop\Money Matters AI\frontend-ui\src\pages\StockAnalysis.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add useNavigate to imports
if "import { useNavigate }" not in content:
    content = "import { useNavigate } from 'react-router-dom';\n" + content

# 2. Add Bookmark to lucide-react imports if missing
if "Bookmark" not in content.split("from 'lucide-react'")[0]:
    content = content.replace("ArrowLeft, Search, TrendingUp", "ArrowLeft, Search, TrendingUp, Bookmark")

# 3. Add `const navigate = useNavigate();` to StockAnalysis
if "const navigate = useNavigate();" not in content:
    content = content.replace(
        "export default function StockAnalysis() {",
        "export default function StockAnalysis() {\n    const navigate = useNavigate();"
    )

# 4. Remove `showGlobalWatchlist` state
content = re.sub(r"\s*const \[showGlobalWatchlist.*?useState\(false\);\n", "\n", content)
content = re.sub(r"\s*const \[globalWatchlist.*?useState\(\[\]\);\n", "\n", content)

# 5. Replace Quick Actions Bar
quick_actions_regex = re.compile(r"\{\/\*\s*Quick Actions Bar\s*\*\/.*?\}\s*(?=\{\/\*\s*Indices Row\s*\*\/)", re.DOTALL)

new_quick_actions = """{/* Quick Actions Bar */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                        <button onClick={() => navigate('/stocks/watchlist')}
                            style={{
                                flex: 1, background: '#ffffff', border: '1px solid #E2E8F0',
                                padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                color: '#0F172A', fontWeight: 600, fontSize: 14,
                                transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(15,23,42,0.04)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(15,23,42,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(15,23,42,0.04)'; }}
                        >
                            <Bookmark size={18} color="#4F46E5" /> My Watchlist
                        </button>
                        <button onClick={() => navigate('/stocks/compare')}
                            style={{
                                flex: 1, background: '#ffffff', border: '1px solid #E2E8F0',
                                padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                color: '#0F172A', fontWeight: 600, fontSize: 14,
                                transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(15,23,42,0.04)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(15,23,42,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(15,23,42,0.04)'; }}
                        >
                            <BarChart2 size={18} color="#4F46E5" /> Compare Stocks
                        </button>
                    </div>

                    """

content = quick_actions_regex.sub(new_quick_actions, content)

# 6. Remove Watchlist Modal
modal_regex = re.compile(r"\{showGlobalWatchlist\s*&&\s*\(\s*<div.*?(?=\s*<\/div>\s*\);\s*\})", re.DOTALL)
content = modal_regex.sub("", content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Frontend updated with clean Quick Actions Bar.")
