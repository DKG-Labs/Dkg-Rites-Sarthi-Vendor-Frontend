import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const LADLE_FIELDS = [
  { key: 'percentC', label: '% C', title: 'Ladle Analysis of Each Heat as per TC - % C' },
  { key: 'percentSi', label: '% Si', title: 'Ladle Analysis of Each Heat as per TC - % Si' },
  { key: 'percentMn', label: '% Mn', title: 'Ladle Analysis of Each Heat as per TC - % Mn' },
  { key: 'percentP', label: '% P', title: 'Ladle Analysis of Each Heat as per TC - % P' },
  { key: 'percentS', label: '% S', title: 'Ladle Analysis of Each Heat as per TC - % S' },
];

const ladleStyles = `
  .ladle-card {
    background: #fdfdfd;
    border: 1px solid #e3e6ec;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 12px 40px rgba(15, 23, 42, 0.05);
    margin-bottom: 1.5rem;
  }

  .ladle-card__header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }

  .ladle-card__eyebrow {
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 0.2rem;
  }

  .ladle-card__heat {
    font-size: 1.15rem;
    font-weight: 700;
    color: #0f172a;
  }

  .ladle-card__hint {
    font-size: 0.85rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .ladle-card__remove {
    background: rgba(220, 53, 69, 0.1);
    color: #b91c1c;
    border: none;
    border-radius: 999px;
    padding: 0.45rem 0.9rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease;
  }

  .ladle-card__remove:hover {
    background: rgba(220, 53, 69, 0.18);
    transform: translateY(-1px);
  }

  .ladle-section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 0.25rem;
  }

  .ladle-section-subtitle {
    font-size: 0.9rem;
    color: #6b7280;
    margin-bottom: 1.25rem;
  }

  .ladle-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .ladle-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .ladle-field__label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #0f172a;
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    white-space: nowrap;
  }

  .ladle-field__label .required {
    color: #dc2626;
  }

  .ladle-field__input {
    border: 1px solid #d7dbe0;
    border-radius: 14px;
    padding: 0.7rem 0.85rem;
    font-size: 0.95rem;
    color: #0f172a;
    background: #fff;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    outline: none;
  }

  .ladle-field__input::placeholder {
    color: #a0a5b0;
  }

  .ladle-field__input:focus {
    border-color: #5a8dee;
    box-shadow: 0 0 0 3px rgba(90, 141, 222, 0.2);
  }

  .ladle-field__input:hover {
    border-color: #5a8dee;
  }

  .ladle-field__helper {
    font-size: 0.75rem;
    color: #6b7280;
  }

  @media (max-width: 640px) {
    .ladle-card {
      padding: 1.1rem;
    }

    .ladle-field__label {
      white-space: normal;
    }
  }
`;

/**
 * CalibrationHeatRow Component
 * Represents a single heat row with chemical analysis fields
 * All field labels match Excel screenshot exactly
 */
const CalibrationHeatRow = ({ 
  heat, 
  index, 
  onUpdate, 
  onRemove, 
  canRemove,
  isVendor = true // Future: role-based logic
}) => {
  
  const handleChange = (field, value) => {
    // Enforce 3 decimal places precision
    if (value && !isNaN(value)) {
      const parts = value.toString().split('.');
      if (parts[1] && parts[1].length > 3) {
        return; // Prevent more than 3 decimal places
      }
    }
    onUpdate(index, field, value);
  };

  return (
    <Box className="ladle-card">
      <style>{ladleStyles}</style>

      <div className="ladle-card__header">
        <div>
          <p className="ladle-card__eyebrow">Heat No. of Raw Material</p>
          <p className="ladle-card__heat">{heat.heatNo || '-'}</p>
          <p className="ladle-card__hint">Fetched from pre inspection data entered on main module</p>
        </div>

        {canRemove && (
          <button
            type="button"
            className="ladle-card__remove"
            onClick={() => onRemove(index)}
          >
            <DeleteIcon fontSize="small" />
            Remove heat
          </button>
        )}
      </div>

      <Typography className="ladle-section-title">
        Ladle Analysis of Each Heat as per TC
      </Typography>
      <Typography className="ladle-section-subtitle">
        Values of each element will be used as validation for Chemical Analysis test mentioned in sub module
      </Typography>

      <div className="ladle-grid">
        {LADLE_FIELDS.map(({ key, label, title }) => (
          <label key={key} className="ladle-field" title={title}>
            <span className="ladle-field__label">
              {label} <span className="required" aria-hidden="true">*</span>
            </span>
            <input
              className="ladle-field__input"
              type="number"
              step="0.001"
              inputMode="decimal"
              placeholder="0.000"
              value={heat[key] ?? ''}
              onChange={(e) => handleChange(key, e.target.value)}
              disabled={!isVendor}
            />
            <span className="ladle-field__helper">Required · Float</span>
          </label>
        ))}
      </div>

      {!isVendor && (
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <Tooltip title="Editable by IE only">
            <span>⚠️ Manual by IE - Fields disabled for vendor</span>
          </Tooltip>
        </Typography>
      )}
    </Box>
  );
};

export default CalibrationHeatRow;

