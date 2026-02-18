import React, { useState } from 'react';
import DefectSelection from './DefectSelection';
import FormField from './FormField';

const VisualDimensionalCheck = ({ heatNumber, productType }) => {
    const [dimensionalReadings, setDimensionalReadings] = useState(Array.from({ length: 20 }, () => ({})));
    const [isHeatRejected, setIsHeatRejected] = useState(false);

    const handleDimensionalChange = (index, value) => {
        const newReadings = [...dimensionalReadings];
        newReadings[index] = value;
        setDimensionalReadings(newReadings);
        checkDimensionalRejection(newReadings);
    };

    const checkDimensionalRejection = (readings) => {
        // Logic to check for dimensional rejection will go here
    };

    const handleDefectRejection = (isRejected) => {
        setIsHeatRejected(isRejected);
    };

        return (
                <div>
                        <h3>Visual & Dimensional Check for Heat #{heatNumber}</h3>

                        <div className="input-grid" style={{ marginBottom: 'var(--space-16)' }}>
                            <FormField label="Heat Number">
                                <input type="text" className="form-control" value={heatNumber} disabled />
                            </FormField>
                            <FormField label="Product Type">
                                <input type="text" className="form-control" value={productType || ''} disabled />
                            </FormField>
                        </div>

                        <DefectSelection onRejection={handleDefectRejection} />
                        <hr />

                        <h3>Dimensional Check</h3>
                        <div style={{ marginTop: 'var(--space-12)' }}>
                            {dimensionalReadings.map((val, i) => (
                                <div key={i} style={{
                                    padding: 'var(--space-12)',
                                    background: 'var(--color-bg-2)',
                                    borderRadius: 'var(--radius-base)',
                                    marginBottom: 'var(--space-12)',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                                        <strong>Sample #{i + 1}</strong>
                                    </div>
                                    <div className="input-grid">
                                        <FormField label="Length (mm)">
                                            <input type="number" className="form-control" placeholder="mm" value={val.length || ''} onChange={(e) => handleDimensionalChange(i, { ...val, length: e.target.value })} />
                                        </FormField>
                                        <FormField label="Width (mm)">
                                            <input type="number" className="form-control" placeholder="mm" value={val.width || ''} onChange={(e) => handleDimensionalChange(i, { ...val, width: e.target.value })} />
                                        </FormField>
                                        <FormField label="Height (mm)">
                                            <input type="number" className="form-control" placeholder="mm" value={val.height || ''} onChange={(e) => handleDimensionalChange(i, { ...val, height: e.target.value })} />
                                        </FormField>
                                        <FormField label="Weight (kg)">
                                            <input type="number" className="form-control" placeholder="kg" value={val.weight || ''} onChange={(e) => handleDimensionalChange(i, { ...val, weight: e.target.value })} />
                                        </FormField>
                                        <FormField label="Status">
                                            <select className="form-control" value={val.status || 'Pending'} onChange={(e) => handleDimensionalChange(i, { ...val, status: e.target.value })}>
                                                <option>Pending</option>
                                                <option>Valid</option>
                                                <option>Reject</option>
                                            </select>
                                        </FormField>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: 'var(--space-16)' }}>
                            <FormField label="Final Decision">
                                <select className="form-control" value={isHeatRejected ? 'rejected' : 'accepted'} onChange={(e) => setIsHeatRejected(e.target.value === 'rejected')}>
                                    <option value="accepted">Accepted</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </FormField>
                        </div>

                        {isHeatRejected && <p style={{ color: 'red' }}>This heat is REJECTED.</p>}
                </div>
        );
};

export default VisualDimensionalCheck;
