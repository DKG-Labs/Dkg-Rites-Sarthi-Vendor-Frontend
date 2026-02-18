import React from 'react';

// Reusable form field: label above input, consistent spacing and classes
const FormField = ({ label, required, children, className = '', style = {} }) => {
  return (
    <div className={`form-group ${className}`} style={style}>
      {label && (
        <label className={`form-label ${required ? 'required' : ''}`}>{label}</label>
      )}
      {children}
    </div>
  );
};

export default FormField;
