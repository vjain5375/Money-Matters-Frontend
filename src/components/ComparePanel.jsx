import { X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ComparePanel({ items, onRemove, onClear }) {
    if (!items || items.length === 0) return null;

    const handleCompare = () => {
        const symbols = items.map(i => i.symbol).join(',');
        window.open(`/stocks/compare?symbols=${symbols}`, '_blank');
    };

    return (
        <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }}
            style={{
                position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                background: '#0F172A', color: '#fff', padding: '16px 24px',
                borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '24px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                zIndex: 100, minWidth: '400px'
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>COMPARE STOCKS</span>
                <span style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{items.length} of 4 selected</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                {items.map(item => (
                    <div key={item.symbol} style={{
                        background: 'rgba(255,255,255,0.1)', padding: '6px 10px',
                        borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                        fontSize: 13, fontWeight: 600
                    }}>
                        {item.symbol.replace('.NS', '')}
                        <button 
                            onClick={() => onRemove(item.symbol)}
                            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0, display: 'flex' }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                    onClick={onClear}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
                >
                    Clear
                </button>
                <button 
                    onClick={handleCompare}
                    style={{ 
                        background: '#3B82F6', border: 'none', color: '#fff', padding: '8px 16px',
                        borderRadius: '8px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                >
                    Compare <ArrowRight size={16} />
                </button>
            </div>
        </motion.div>
    );
}
