import React, { useState, useEffect } from 'react';

const visualDefects = [
    'Distortion',
    'Twist',
    'Kink',
    'Pitting',
    'Seams',
    'Laps',
    'Cracks',
    'Scratches',
    'Scale',
    'Fins',
    'Other',
];

const DefectSelection = ({ onRejection }) => {
    const [defects, setDefects] = useState(
        visualDefects.reduce((acc, defect) => {
            acc[defect] = { selected: false, count: 0 };
            return acc;
        }, {})
    );

    useEffect(() => {
        const selectedDefects = Object.values(defects).filter(
            (defect) => defect.selected
        );
        onRejection(selectedDefects.length > 1);
    }, [defects, onRejection]);

    const handleDefectChange = (defectName) => {
        setDefects((prevDefects) => ({
            ...prevDefects,
            [defectName]: {
                ...prevDefects[defectName],
                selected: !prevDefects[defectName].selected,
            },
        }));
    };

    const handleCountChange = (defectName, count) => {
        setDefects((prevDefects) => ({
            ...prevDefects,
            [defectName]: {
                ...prevDefects[defectName],
                count: parseInt(count, 10) || 0,
            },
        }));
    };

    return (
        <div className="form-container">
            <h4 className="form-title">Visual Defects</h4>
            <div className="form-grid">
                {visualDefects.map((defectName) => (
                    <div key={defectName} className="form-group">
                        <div className="checkbox-item">
                            <input
                                type="checkbox"
                                id={`defect-${defectName}`}
                                checked={defects[defectName].selected}
                                onChange={() => handleDefectChange(defectName)}
                            />
                            <label htmlFor={`defect-${defectName}`}>{defectName}</label>
                        </div>
                        {defects[defectName].selected && (
                            <input
                                type="number"
                                min="0"
                                className="form-input"
                                value={defects[defectName].count}
                                onChange={(e) =>
                                    handleCountChange(defectName, e.target.value)
                                }
                                placeholder={`${defectName} Count`}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DefectSelection;