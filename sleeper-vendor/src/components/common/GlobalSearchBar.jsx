import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Search input that reports the trimmed term after the user stops typing for `debounceMs`.
 * Clearing (× button or Escape) reports '' immediately. To reset it from outside, change
 * its `key`.
 */
const GlobalSearchBar = ({ onSearch, debounceMs, placeholder = 'Search…', initialValue = '' }) => {
    const [text, setText] = useState(initialValue);
    const onSearchRef = useRef(onSearch);
    useEffect(() => { onSearchRef.current = onSearch; });

    useEffect(() => {
        const t = setTimeout(() => onSearchRef.current(text.trim()), debounceMs);
        return () => clearTimeout(t);
    }, [text, debounceMs]);

    const clear = () => {
        setText('');
        onSearchRef.current('');
    };

    return (
        <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
            <Search size={16} aria-hidden="true"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
                type="search"
                aria-label="Search declarations"
                value={text}
                placeholder={placeholder}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') clear(); }}
                style={{
                    width: '100%', boxSizing: 'border-box', padding: '10px 34px 10px 36px',
                    borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white',
                    fontSize: '13px', color: '#334155', outline: 'none',
                }}
            />
            {text && (
                <button type="button" aria-label="Clear search" onClick={clear}
                    style={{
                        position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                        border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b',
                        display: 'flex', padding: '2px',
                    }}>
                    <X size={14} aria-hidden="true" />
                </button>
            )}
        </div>
    );
};

export default GlobalSearchBar;
