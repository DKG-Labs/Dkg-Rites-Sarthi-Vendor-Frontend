import { useEffect, useMemo, useState } from "react";

export default function ScadaTable({
    columns = [],
    fetchData,
    pageSize = 20,
    batchId = null,
    height = "70vh"
}) {
    const [rows, setRows] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);



    const countLeaves = col =>
        col.children
            ? col.children.reduce((s, c) => s + countLeaves(c), 0)
            : 1;

    const flatColumns = useMemo(() => {
        const walk = (cols, parentLabel = "") =>
            cols.flatMap(c => {
                const fullLabel = parentLabel ? `${parentLabel} - ${c.label}` : c.label;
                return c.children
                    ? walk(c.children, fullLabel)
                    : { ...c, label: fullLabel };
            });
        return walk(columns);
    }, [columns]);


    const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        loadData();
    }, [page, batchId]);

    const loadData = async () => {
        setLoading(true);
        const res = await fetchData({ page, size: pageSize, batch: batchId });
        setRows(res?.rows || []);
        setTotal(res?.total || 0);
        setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));


    const headerRows = [[], [], [], []];

    const buildHeaders = (cols, level = 0) => {
        cols.forEach(col => {
            headerRows[level].push({
                label: col.label,
                colSpan: countLeaves(col),
                rowSpan: col.children ? 1 : 4 - level
            });

            if (col.children) {
                buildHeaders(col.children, level + 1);
            }
        });
    };

    buildHeaders(columns);


    return (
        <div className="bg-white border rounded-xl shadow" style={{ height: height, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    <span style={{ color: 'var(--primary-color)', marginRight: '0.5rem' }}>●</span>
                    Last Sync: {lastUpdated}
                </div>
                <button
                    onClick={loadData}
                    className="toggle-btn"
                    style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', minWidth: '80px' }}
                    disabled={loading}
                >
                    {loading ? '...' : 'Refresh'}
                </button>
            </div>

            {/* Table Scroll Area */}
            <div className="table-scroll-container" style={{ flex: '1 1 auto', overflow: 'auto', position: 'relative' }}>
                <table className="ui-table min-w-full border-collapse text-sm">
                    <thead className="sticky top-0 bg-gray-100 z-10" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        {headerRows.map(
                            (row, i) =>
                                row.length > 0 && (
                                    <tr key={i}>
                                        {row.map((cell, j) => (
                                            <th
                                                key={j}
                                                colSpan={cell.colSpan}
                                                rowSpan={cell.rowSpan}
                                                className="border font-semibold"
                                                style={{ background: '#f1f5f9', color: '#475569', padding: '4px 2px', whiteSpace: 'nowrap', fontSize: '0.75rem' }}
                                            >
                                                {cell.label}
                                            </th>
                                        ))}
                                    </tr>
                                )
                        )}
                    </thead>

                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors">
                                {flatColumns.map(col => (
                                    <td
                                        key={col.key}
                                        data-label={col.label}
                                        className="border"
                                        style={{ fontSize: '0.8rem', color: '#334155', padding: '4px 2px' }}
                                    >
                                        <div className="table-cell-content">
                                            {row[col.key] ?? "-"}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div style={{ flex: '0 0 auto', width: '100%', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', gap: '1rem', zIndex: 20 }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    Page {page} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="toggle-btn secondary"
                        style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                    >
                        Previous
                    </button>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="toggle-btn secondary"
                        style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
