import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  FormControlLabel, 
  Switch,
  Grid,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalibrationHeatRow from './CalibrationHeatRow';

/**
 * Calibration & Document Verification Sub Module
 * Inside ERC Raw Material Inspection Main Module
 * 
 * This page covers the calibration information of all the instruments used during 
 * the inspection of Raw Material & document verification of that particular vendor
 */
const CalibrationSubModule = ({ preInspectionHeats = [], onSave }) => {
  const [formData, setFormData] = useState({
    rdsoApprovalValidity: {
      approvalId: '',
      validFrom: '',
      validTo: ''
    },
    heats: [],
    gaugesAvailable: false,
    vendorVerification: {
      verified: false,
      verifiedBy: '',
      verifiedAt: ''
    }
  });

  const [errors, setErrors] = useState({});

  // Initialize heats from pre-inspection data
  useEffect(() => {
    if (preInspectionHeats && preInspectionHeats.length > 0 && formData.heats.length === 0) {
      const initialHeats = preInspectionHeats.map(heat => ({
        heatNo: heat.heatNo || heat,
        percentC: '',
        percentSi: '',
        percentMn: '',
        percentP: '',
        percentS: ''
      }));
      setFormData(prev => ({ ...prev, heats: initialHeats }));
    }
  }, [preInspectionHeats, formData.heats.length]);

  const handleRDSOChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      rdsoApprovalValidity: {
        ...prev.rdsoApprovalValidity,
        [field]: value
      }
    }));
  };

  const handleHeatUpdate = (index, field, value) => {
    const updatedHeats = [...formData.heats];
    updatedHeats[index] = {
      ...updatedHeats[index],
      [field]: value
    };
    setFormData(prev => ({ ...prev, heats: updatedHeats }));
  };

  const handleAddHeat = () => {
    const newHeat = {
      heatNo: `HEAT-${formData.heats.length + 1}`,
      percentC: '',
      percentSi: '',
      percentMn: '',
      percentP: '',
      percentS: ''
    };
    setFormData(prev => ({ ...prev, heats: [...prev.heats, newHeat] }));
  };

  const handleRemoveHeat = (index) => {
    const updatedHeats = formData.heats.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, heats: updatedHeats }));
  };

  const handleGaugesChange = (event) => {
    setFormData(prev => ({ ...prev, gaugesAvailable: event.target.checked }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate each heat
    formData.heats.forEach((heat, index) => {
      if (!heat.percentC || heat.percentC === '') {
        newErrors[`heat_${index}_percentC`] = 'Required';
      }
      if (!heat.percentSi || heat.percentSi === '') {
        newErrors[`heat_${index}_percentSi`] = 'Required';
      }
      if (!heat.percentMn || heat.percentMn === '') {
        newErrors[`heat_${index}_percentMn`] = 'Required';
      }
      if (!heat.percentP || heat.percentP === '') {
        newErrors[`heat_${index}_percentP`] = 'Required';
      }
      if (!heat.percentS || heat.percentS === '') {
        newErrors[`heat_${index}_percentS`] = 'Required';
      }

      // Range validations
      const c = parseFloat(heat.percentC);
      if (!isNaN(c) && (c < 0.5 || c > 0.6)) {
        newErrors[`heat_${index}_percentC`] = 'Value must be between 0.500 and 0.600 (inclusive).';
      }

      const si = parseFloat(heat.percentSi);
      if (!isNaN(si) && (si < 1.5 || si > 2.0)) {
        newErrors[`heat_${index}_percentSi`] = 'Value must be between 1.500 and 2.000 (inclusive).';
      }

      const mn = parseFloat(heat.percentMn);
      if (!isNaN(mn) && (mn < 0.8 || mn > 1.0)) {
        newErrors[`heat_${index}_percentMn`] = 'Value must be between 0.800 and 1.000 (inclusive).';
      }

      const p = parseFloat(heat.percentP);
      if (!isNaN(p) && p > 0.030) {
        newErrors[`heat_${index}_percentP`] = 'Value cannot exceed 0.030.';
      }

      const s = parseFloat(heat.percentS);
      if (!isNaN(s) && s > 0.030) {
        newErrors[`heat_${index}_percentS`] = 'Value cannot exceed 0.030.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      console.log('Calibration & Document Verification Data:', formData);

      // TODO: Future integration with Spring Boot API
      // Example API call:
      // fetch('/api/calibration/save', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })

      if (onSave) {
        onSave(formData);
      }

      alert('Data saved successfully! Check console for details.');
    } else {
      alert('Please fix validation errors before saving.');
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      {/* Section Header */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
        Calibration & Document Verification Sub Module inside ERC Raw Material Inspection Main Module
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        This page covers the calibration information of all the instruments used during the inspection
        of Raw Material & document verification of that particular vendor
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* RDSO Approval & Validity */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          RDSO approval & its Validity
        </Typography>
        <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 2 }}>
          ✓ Verified (filled by Vendor before Call Request)
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Approval ID"
              value={formData.rdsoApprovalValidity.approvalId}
              onChange={(e) => handleRDSOChange('approvalId', e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Valid From"
              type="date"
              value={formData.rdsoApprovalValidity.validFrom}
              onChange={(e) => handleRDSOChange('validFrom', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Valid To"
              type="date"
              value={formData.rdsoApprovalValidity.validTo}
              onChange={(e) => handleRDSOChange('validTo', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Heat Rows */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Ladle Analysis of Each Heat as per TC
        </Typography>

        {formData.heats.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No heats available. Add heat rows or ensure pre-inspection data is entered.
          </Alert>
        )}

        {formData.heats.map((heat, index) => (
          <CalibrationHeatRow
            key={index}
            heat={heat}
            index={index}
            onUpdate={handleHeatUpdate}
            onRemove={handleRemoveHeat}
            canRemove={formData.heats.length > 1}
            isVendor={true} // TODO: Replace with actual role check
          />
        ))}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddHeat}
          sx={{ mt: 2 }}
        >
          Add Heat Row
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Availability of RDSO approved Gauges */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Availability of RDSO approved Gauges
        </Typography>
        <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 2 }}>
          ✓ Verified (filled by Vendor before Call Request)
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={formData.gaugesAvailable}
              onChange={handleGaugesChange}
              color="primary"
            />
          }
          label={formData.gaugesAvailable ? 'Yes - RDSO approved Gauges Available' : 'No - RDSO approved Gauges Not Available'}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          size="large"
        >
          Save Calibration Data
        </Button>
      </Box>

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mt: 3 }}>
          Please fix {Object.keys(errors).length} validation error(s) before saving.
        </Alert>
      )}
    </Paper>
  );
};

export default CalibrationSubModule;

