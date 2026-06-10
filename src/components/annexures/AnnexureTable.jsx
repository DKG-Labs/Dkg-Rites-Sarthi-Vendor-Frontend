import React from 'react';
import './AnnexureTable.css';

/**
 * AnnexureTable - Reusable table component for all annexures
 * Supports multi-row headers with rowSpan and colSpan
 * 
 * Props:
 * - headerRows: Array of header row arrays
 *   Example: [
 *     [
 *       { label: "S. No", rowSpan: 2 },
 *       { label: "Name", colSpan: 2 },
 *     ],
 *     [
 *       { label: "First Name" },
 *       { label: "Last Name" }
 *     ]
 *   ]
 * - children: Table body rows (tr elements)
 * - className: Additional CSS classes
 */
const AnnexureTable = ({ headerRows = [], children, className = '' }) => {
  return (
    <div className="annexure-table-wrapper">
      <table className={`annexure-table ${className}`}>
        {headerRows.length > 0 && (
          <thead>
            {headerRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((header, colIndex) => (
                  <th
                    key={colIndex}
                    className="annexure-th"
                    rowSpan={header.rowSpan || 1}
                    colSpan={header.colSpan || 1}
                    style={header.style}
                  >
                    {/* Handle multi-line labels with \n */}
                    {header.label.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < header.label.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
        )}
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
};

export default AnnexureTable;

