/**
 * Safe LocalStorage Utilities
 * Wraps browser storage writes and reads in try-catch blocks to prevent QuotaExceededError crashes
 * and handles automatic cache eviction for non-critical cached stock data.
 */

const CACHE_PREFIX = 'mm_stock_';

/**
 * Safely writes a value to localStorage.
 * If storage quota is exceeded, it automatically evicts stock details cache keys (prefixed with 'mm_stock_')
 * to free up space while preserving user settings, watchlists, budgets, and comparison lists.
 * 
 * @param {string} key 
 * @param {string} value 
 */
export const safeSetItem = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch (err) {
        console.warn(`Storage quota exceeded while setting key "${key}". Clearing cached stock details...`);
        try {
            // Evict stock data cache keys to clear space
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && k.startsWith(CACHE_PREFIX)) {
                    localStorage.removeItem(k);
                }
            }
            // Attempt write again
            localStorage.setItem(key, value);
        } catch (e) {
            console.error(`Failed to write to localStorage for key "${key}" even after cache eviction:`, e);
        }
    }
};

/**
 * Safely reads a value from localStorage.
 * 
 * @param {string} key 
 * @param {any} defaultValue 
 * @returns {string|any}
 */
export const safeGetItem = (key, defaultValue = null) => {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
    } catch (e) {
        console.error(`Failed to read key "${key}" from localStorage:`, e);
        return defaultValue;
    }
};

/**
 * Safely removes an item from localStorage.
 * 
 * @param {string} key 
 */
export const safeRemoveItem = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error(`Failed to remove key "${key}" from localStorage:`, e);
    }
};

/**
 * Safely stringifies and writes an object to localStorage.
 * 
 * @param {string} key 
 * @param {any} value 
 */
export const safeSetJson = (key, value) => {
    try {
        safeSetItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Failed to stringify and cache JSON for key "${key}":`, e);
    }
};

/**
 * Safely reads and parses a JSON value from localStorage.
 * 
 * @param {string} key 
 * @param {any} defaultValue 
 * @returns {any}
 */
export const safeGetJson = (key, defaultValue = null) => {
    const value = safeGetItem(key);
    if (!value) return defaultValue;
    try {
        return JSON.parse(value);
    } catch (e) {
        console.error(`Failed to parse cached JSON for key "${key}":`, e);
        return defaultValue;
    }
};
