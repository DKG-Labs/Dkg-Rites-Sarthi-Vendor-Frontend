import React, { useState, useEffect, useMemo } from 'react';

export const PAGE_SIZE_OPTIONS = [5, 10, 15, 25];

/**
 * Slices an already-filtered list into pages. The page resets to the first one whenever the list
 * changes length (new filter, new data), and is clamped if the list shrinks.
 */
export const usePagination = (items, initialSize = PAGE_SIZE_OPTIONS[0]) => {
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(initialSize);

    const total = items ? items.length : 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    useEffect(() => {
        setPage(0);
    }, [total, pageSize]);

    const safePage = Math.min(page, totalPages - 1);
    const pageItems = useMemo(
        () => (items || []).slice(safePage * pageSize, safePage * pageSize + pageSize),
        [items, safePage, pageSize]
    );

    return { pageItems, page: safePage, pageSize, total, totalPages, setPage, setPageSize };
};

const btnStyle = (disabled) => ({
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    background: disabled ? '#f1f5f9' : '#fff',
    color: disabled ? '#94a3b8' : '#334155',
    cursor: disabled ? 'not-allowed' : 'pointer'
});

/**
 * Page-size selector (5 / 10 / 15 / 25) with Previous / Next. Renders nothing when the list is
 * empty. Pass the object returned by usePagination.
 */
const PaginationBar = ({ pagination }) => {
    const { page, pageSize, total, totalPages, setPage, setPageSize } = pagination;
    if (!total) return null;

    const from = page * pageSize + 1;
    const to = Math.min(total, (page + 1) * pageSize);

    return (
        <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
            gap: '8px', padding: '10px 4px 2px', fontSize: '12px', color: '#475569'
        }}>
            <span>Showing {from}-{to} of {total}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label htmlFor="page-size-select" style={{ fontWeight: 600 }}>Rows</label>
                <select
                    id="page-size-select"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    style={{ padding: '3px 6px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                </select>
                <button type="button" style={btnStyle(page === 0)} disabled={page === 0} onClick={() => setPage(page - 1)}>
                    Previous
                </button>
                <span>Page {page + 1} of {totalPages}</span>
                <button type="button" style={btnStyle(page >= totalPages - 1)} disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                    Next
                </button>
            </div>
        </div>
    );
};

export default PaginationBar;
