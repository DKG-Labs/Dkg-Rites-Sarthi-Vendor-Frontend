import React from 'react';

const MobileResponsiveSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  required = false,
  className = '',
  id,
  name,
  style = {}
}) => {
  // Inline styles for the select wrapper
  const wrapperStyle = {
    position: 'relative',
    width: '100%',
  };

  // Base select styles - mobile-first approach
  const selectStyle = {
    width: '100%',
    minHeight: '48px',
    padding: '12px 44px 12px 14px',
    fontSize: '16px', // 16px prevents iOS auto-zoom
    fontFamily: 'inherit',
    color: value ? 'var(--color-text-primary, #1f2937)' : 'var(--color-text-secondary, #6b7280)',
    backgroundColor: disabled ? 'var(--color-bg-disabled, #f3f4f6)' : 'var(--color-bg-white, #ffffff)',
    border: '1px solid var(--color-border, #d1d5db)',
    borderRadius: 'var(--radius-base, 8px)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    backgroundSize: '16px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    outline: 'none',
    ...style
  };

  // Handle focus styling via inline handler
  const handleFocus = (e) => {
    e.target.style.borderColor = 'var(--color-primary, #16a34a)';
    e.target.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.15)';
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = 'var(--color-border, #d1d5db)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={wrapperStyle}>
      <style>{`
        @media (max-width: 480px) {
          .mobile-responsive-select {
            min-height: 52px !important;
            padding: 14px 48px 14px 16px !important;
            font-size: 16px !important;
          }
        }
        .mobile-responsive-select:focus {
          border-color: var(--color-primary, #16a34a) !important;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15) !important;
        }
        .mobile-responsive-select:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .mobile-responsive-select option {
          padding: 12px;
          font-size: 16px;
          color: #1f2937;
          background-color: white;
        }
        .mobile-responsive-select option:checked {
          background-color: #f0fdf4;
        }
        .mobile-responsive-select option:hover {
          background-color: #f3f4f6;
        }
        /* Ensure option text is readable */
        .mobile-responsive-select option[value=""] {
          color: #6b7280;
        }
      `}</style>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`mobile-responsive-select form-input ${className}`}
        style={selectStyle}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {options.map((option, index) => (
          <option 
            key={option.value || `option-${index}`} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MobileResponsiveSelect;

