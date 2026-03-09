import React from 'react';

const DataTable = ({ columns, data, emptyMessage }) => {
    if (!data || data.length === 0) {
        return <div className="empty-state" style={{ padding: '40px', textAlign: 'center', color: '#667085' }}>{emptyMessage}</div>;
    }

    return (
        <div className="table-responsive">
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} className={col.sortable ? 'sortable' : ''}>
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {columns.map((col) => (
                                <td key={`${rowIndex}-${col.key}`}>
                                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
