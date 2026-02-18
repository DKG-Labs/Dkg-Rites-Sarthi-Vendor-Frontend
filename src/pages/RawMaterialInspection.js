import React from 'react';

const RawMaterialInspection = ({ call, onBack }) => {
    return (
        <div>
            <div className="breadcrumb">
                <div className="breadcrumb-item" onClick={onBack} style={{ cursor: 'pointer' }}>Landing Page</div>
                <span className="breadcrumb-separator">/</span>
                <div className="breadcrumb-item" onClick={onBack} style={{ cursor: 'pointer' }}>Inspection Initiation</div>
                <span className="breadcrumb-separator">/</span>
                <div className="breadcrumb-item breadcrumb-active">Raw Material Inspection</div>
            </div>
            <h1>Raw Material Inspection for {call.call_no}</h1>
            <p>Raw Material Inspection form goes here.</p>
        </div>
    );
};

export default RawMaterialInspection;
