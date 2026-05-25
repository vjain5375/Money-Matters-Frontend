import os

filepath = r"c:\Users\vjain\Desktop\Money Matters AI\frontend-ui\src\pages\StockAnalysis.jsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the technical data spelling
content = content.replace("data.technical?", "data.technicals?")
content = content.replace("data.technical.", "data.technicals.")

# Add simple caching to fetchStock
fetch_code = """    const fetchStock = useCallback(async (ticker, name) => {
        setLoading(true);
        setError(null);
        setData(null);
        setShowSugg(false);
        setStock({ ticker, name });
        setQuery(name || ticker);

        // Simple local cache for blazing fast loads (5 min TTL)
        const cacheKey = `mm_stock_${ticker}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < 300000) {
                    setData(parsed.data);
                    setLoading(false);
                    return;
                }
            } catch (e) {}
        }

        try {
            const res = await fetch(`${API_BASE}/stock/full/${encodeURIComponent(ticker)}`);
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const json = await res.json();
            setData(json);
            
            // Save to cache
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: json
            }));
        } catch (err) {
            setError(err.message || 'Failed to fetch stock data');
        } finally {
            setLoading(false);
        }
    }, []);"""

# We need to replace the old fetchStock definition with the new one.
# But it's safer to just do a string replace on the exact block.
old_fetch = """    const fetchStock = useCallback(async (ticker, name) => {
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
    }, []);"""

content = content.replace(old_fetch, fetch_code)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed data.technicals and added caching!")
