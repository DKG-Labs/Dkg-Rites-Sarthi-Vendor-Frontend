import React from 'react';
import { Typography, Paper } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';

const AnnexureEmptyState = ({ title, message }) => {
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 8, 
        textAlign: 'center', 
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: 4,
        border: '1px dashed rgba(0, 0, 0, 0.1)',
        my: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px'
      }}
    >
      <SearchOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
        {title || "No Data Available"}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '500px', mb: 3 }}>
        {message || "No records found for this inspection call. Please verify if the data has been submitted correctly."}
      </Typography>
    </Paper>
  );
};

export default AnnexureEmptyState;
