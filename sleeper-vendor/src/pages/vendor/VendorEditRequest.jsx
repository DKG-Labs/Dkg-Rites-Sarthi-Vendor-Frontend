import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import InventoryForm from '../sleeperGeneral/inventoryManagement/InventoryForm';
import ShiftProductionForm from '../sleeperGeneral/sections/ShiftProductionForm';

const VendorEditRequest = () => {
    const { moduleId, requestId, workflowTransitionId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [moduleName, setModuleName] = useState('');

    useEffect(() => {
        const loadRecord = async () => {
            try {
                let res;
                switch (moduleId) {
                    case '1': res = await apiService.getPlantProfiles(); res = res.find(p => p.id == requestId); setModuleName('Plant Profile'); break;
                    case '2': res = await apiService.getStressBenches(); res = res.find(p => p.id == requestId); setModuleName('Bench Mould Master'); break;
                    case '3': res = await apiService.getRawMaterialSources(); res = res.find(p => p.id == requestId); setModuleName('Raw Material Source'); break;
                    case '4': res = await apiService.getMixDesigns(); res = res.find(p => p.id == requestId); setModuleName('Mix Design'); break;
                    case '5': res = await apiService.getHtsWireById(requestId); setModuleName('HTS Wire'); break;
                    case '6': res = await apiService.getCementById(requestId); setModuleName('Cement Inventory'); break;
                    case '7': res = await apiService.getAdmixtureById(requestId); setModuleName('Admixture Receipt'); break;
                    case '8': res = await apiService.getAggregateById(requestId); setModuleName('Aggregate Receipt'); break;
                    case '9': res = await apiService.getSgciInsertById(requestId); setModuleName('SGCI Insert'); break;
                    case '10': res = await apiService.getDowelById(requestId); setModuleName('Dowel Receipt'); break;
                    case '11': res = await apiService.getProductionDeclarationById(requestId); setModuleName('Production Declaration'); break;
                    default: throw new Error("Unknown module ID");
                }
                setFormData(res.responseData || res);
            } catch (error) {
                console.error("Error loading record:", error);
                alert("Failed to load record details");
            } finally {
                setLoading(false);
            }
        };
        loadRecord();
    }, [moduleId, requestId]);

    const handleFormSubmit = async () => {
        setSubmitting(true);
        try {
            // This is called AFTER the module-specific form has saved the record (PUT)
            // Now we perform the workflow transition
            await apiService.performTransitionAction({
                workflowTransitionId: parseInt(workflowTransitionId),
                moduleId: parseInt(moduleId),
                requestId: parseInt(requestId),
                action: "RESUBMIT",
                actionBy: 118,
                remarks: "Updated and resubmitted for verification"
            });

            alert("Form updated and resubmitted successfully! It has been sent back to IE for verification.");
            navigate('/', { state: { selectedModule: 'requested-changes' } });
        } catch (error) {
            console.error("Error in transition flow:", error);
            alert("Record was updated, but workflow transition failed: " + (error.message || "Unknown error"));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading form data...</div>;
    if (!formData) return <div style={{ padding: '40px', textAlign: 'center' }}>Record not found.</div>;

    // Use InventoryForm for modules 5-10
    if (['5', '6', '7', '8', '9', '10'].includes(moduleId)) {
        const materials = {
            '5': { id: 'hts-wire', name: 'HTS Wire' },
            '6': { id: 'cement', name: 'Cement' },
            '7': { id: 'admixture', name: 'Admixture' },
            '8': { id: 'aggregates', name: 'Aggregates' },
            '9': { id: 'sgci-insert', name: 'SGCI Insert' },
            '10': { id: 'dowel', name: 'Dowel' }
        };
        return (
            <div style={{ padding: '20px' }}>
                <h2 style={{ marginBottom: '20px', color: '#1e293b' }}>Edit {moduleName} Request</h2>
                <div style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <InventoryForm 
                        material={materials[moduleId]} 
                        initialData={formData} 
                        onSubmit={handleFormSubmit}
                        onClose={() => navigate(-1)}
                    />
                </div>
            </div>
        );
    }

    // Use ShiftProductionForm for module 11
    if (moduleId === '11') {
        return (
            <div style={{ padding: '20px' }}>
                <ShiftProductionForm 
                    initialData={formData} 
                    onSave={async (data) => {
                        // For ShiftProductionForm, we need to manually call the save API first as it doesn't do it internally like InventoryForm
                        await apiService.saveProductionDeclaration({ ...data, id: requestId });
                        await handleFormSubmit();
                    }}
                    onBack={() => navigate(-1)}
                />
            </div>
        );
    }

    // Generic fallback for modules 1-4 (Plant Profile, etc.)
    return (
        <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '28px', fontWeight: '800' }}>Edit {moduleName}</h1>
                    <p style={{ margin: 0, color: '#64748b' }}>Update the details below and resubmit for verification</p>
                </div>
                <button 
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '12px', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}
                >
                    Cancel
                </button>
            </div>

            <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    setSubmitting(true);
                    try {
                        const submissionData = { ...formData, updatedBy: 118 };
                        switch (moduleId) {
                            case '1': await apiService.savePlantProfile(submissionData); break;
                            case '2': await apiService.saveStressBench(submissionData); break;
                            case '3': await apiService.saveRawMaterialSource(submissionData); break;
                            case '4': await apiService.saveMixDesign(submissionData); break;
                            default: throw new Error("Unknown module ID");
                        }
                        await handleFormSubmit();
                    } catch (err) {
                        alert("Error: " + err.message);
                    } finally {
                        setSubmitting(false);
                    }
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                        {Object.entries(formData).map(([key, value]) => {
                            if (['id', 'vendorId', 'createdBy', 'updatedBy', 'workflowTransitionId', 'moduleId', 'requestId', 'updatedDate', 'createdAt', 'updatedAt', 'version', 'status'].includes(key)) return null;
                            if (typeof value === 'object') return null;
                            
                            return (
                                <div key={key}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'capitalize' }}>
                                        {key.replace(/([A-Z])/g, ' $1')}
                                    </label>
                                    <input
                                        type="text"
                                        value={value || ''}
                                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '32px' }}>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{ background: '#42818c', color: 'white', border: 'none', padding: '12px 40px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
                        >
                            {submitting ? 'Resubmitting...' : 'Update & Resubmit for Verification'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VendorEditRequest;
