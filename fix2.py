import os

filepath = r"c:\Users\vjain\Desktop\Money Matters AI\frontend-ui\src\pages\StockAnalysis.jsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_market = """    /* Fetch market overview on mount */
    useEffect(() => {
        const fetchMarket = async () => {
            try {
                const res = await fetch(`${API_BASE}/stock/market-overview`);
                if (res.ok) setMarket(await res.json());
            } catch { /* silently fail */ }
            finally { setMarketLoading(false); }
        };
        fetchMarket();
    }, []);"""

new_market = """    /* Fetch market overview on mount */
    useEffect(() => {
        const fetchMarket = async () => {
            const cacheKey = 'mm_market_overview';
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Date.now() - parsed.timestamp < 300000) { // 5 min
                        setMarket(parsed.data);
                        setMarketLoading(false);
                        return;
                    }
                } catch (e) {}
            }
            try {
                const res = await fetch(`${API_BASE}/stock/market-overview`);
                if (res.ok) {
                    const json = await res.json();
                    setMarket(json);
                    localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: json }));
                }
            } catch { /* silently fail */ }
            finally { setMarketLoading(false); }
        };
        fetchMarket();
    }, []);"""

content = content.replace(old_market, new_market)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added market overview caching!")
