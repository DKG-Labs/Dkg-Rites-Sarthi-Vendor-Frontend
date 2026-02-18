import React from 'react';

const ProcessInspection = ({ call, onBack }) => {
    return (
        <div>
            <div className="breadcrumb">
                <div className="breadcrumb-item" onClick={onBack} style={{ cursor: 'pointer' }}>Landing Page</div>
                <span className="breadcrumb-separator">/</span>
                <div className="breadcrumb-item" onClick={onBack} style={{ cursor: 'pointer' }}>Inspection Initiation</div>
                <span className="breadcrumb-separator">/</span>
                <div className="breadcrumb-item breadcrumb-active">Process Inspection</div>
            </div>
            <h1>Process Inspection for {call.call_no}</h1>
            <p>Process Inspection form goes here.</p>
        </div>
    );
};

export default ProcessInspection;
