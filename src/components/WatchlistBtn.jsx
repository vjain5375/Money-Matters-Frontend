import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';

export default function WatchlistBtn({ symbol, name, showText = false }) {
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        try {
            const list = JSON.parse(localStorage.getItem('mm_watchlist')) || [];
            setSaved(list.some(s => s.symbol === symbol));
        } catch { }
    }, [symbol]);

    const toggle = (e) => {
        e.stopPropagation();
        try {
            let list = JSON.parse(localStorage.getItem('mm_watchlist')) || [];
            if (saved) {
                list = list.filter(s => s.symbol !== symbol);
                setSaved(false);
            } else {
                list.push({ symbol, name: name || symbol, added_at: Date.now() });
                setSaved(true);
            }
            localStorage.setItem('mm_watchlist', JSON.stringify(list));
            window.dispatchEvent(new Event('watchlist_updated'));
        } catch { }
    };

    return (
        <button
            onClick={toggle}
            title={saved ? "Remove from Watchlist" : "Add to Watchlist"}
            style={showText ? {
                background: saved ? '#EEF2FF' : '#F8FAFC',
                border: `1px solid ${saved ? '#C7D2FE' : '#E2E8F0'}`,
                color: saved ? '#4F46E5' : '#64748B',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
            } : {
                background: saved ? '#E0E7FF' : 'transparent',
                border: 'none', cursor: 'pointer', padding: '6px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: saved ? '#4F46E5' : '#94A3B8',
                transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
                if (!saved) {
                    e.currentTarget.style.background = '#F1F5F9';
                    e.currentTarget.style.color = '#0F172A';
                }
            }}
            onMouseLeave={(e) => {
                if (!saved) {
                    e.currentTarget.style.background = showText ? '#F8FAFC' : 'transparent';
                    e.currentTarget.style.color = showText ? '#64748B' : '#94A3B8';
                }
            }}
        >
            <Bookmark size={14} fill={saved ? "currentColor" : "none"} />
            {showText && (saved ? "Watchlisted" : "Watchlist")}
        </button>
    );
}
