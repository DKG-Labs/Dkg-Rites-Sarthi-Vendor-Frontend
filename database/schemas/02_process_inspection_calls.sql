-- ============================================================
-- PROCESS INSPECTION CALLS SCHEMA
-- ============================================================
-- Description: Database schema for Process Inspection Calls
-- Process inspection is the second stage after Raw Material inspection
-- Compatible with: MySQL 8.0+, Azure MySQL
-- Created: 2025-12-23
-- ============================================================

-- Process Inspection Details Table
CREATE TABLE IF NOT EXISTS process_inspection_details (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ic_id BIGINT NOT NULL UNIQUE COMMENT 'Foreign key to inspection_calls.id',

  -- Reference to parent RM Inspection Call
  rm_ic_id BIGINT NULL COMMENT 'Foreign key to parent RM inspection_calls.id (nullable for flexibility)',
  rm_ic_number VARCHAR(100) NOT NULL COMMENT 'Parent RM IC Certificate Number for reference (e.g., N/ER-01080001/RAJK)',
  
  -- Lot Information
  lot_number VARCHAR(100) NOT NULL COMMENT 'Lot number entered by vendor',
  
  -- Heat Information (from selected RM IC)
  heat_number VARCHAR(50) NOT NULL COMMENT 'Heat number selected from RM IC',
  manufacturer VARCHAR(255) NULL COMMENT 'Manufacturer name for the heat',
  manufacturer_heat VARCHAR(255) NOT NULL COMMENT 'Combined Manufacturer - Heat Number format',
  
  -- Quantity Information
  offered_qty INT NOT NULL COMMENT 'Quantity offered for process inspection (in pieces/ERCs)',
  total_accepted_qty_rm INT NOT NULL DEFAULT 0 COMMENT 'Total accepted quantity from RM inspection',
  
  -- Approval/Rejection tracking
  qty_accepted INT NULL COMMENT 'Quantity accepted after process inspection',
  qty_rejected INT NULL COMMENT 'Quantity rejected after process inspection',
  rejection_reason TEXT NULL COMMENT 'Reason for rejection if any',
  
  -- Place of Inspection (auto-fetched from RM IC)
  company_id INT NOT NULL COMMENT 'Company ID (same as RM IC)',
  company_name VARCHAR(255) NOT NULL COMMENT 'Company name (same as RM IC)',
  unit_id INT NOT NULL COMMENT 'Unit ID (same as RM IC)',
  unit_name VARCHAR(255) NOT NULL COMMENT 'Unit name (same as RM IC)',
  unit_address TEXT NULL COMMENT 'Unit address (same as RM IC)',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (ic_id) REFERENCES inspection_calls(id) ON DELETE CASCADE,
  FOREIGN KEY (rm_ic_id) REFERENCES inspection_calls(id) ON DELETE RESTRICT,
  
  -- Indexes
  INDEX idx_ic_id (ic_id),
  INDEX idx_rm_ic_id (rm_ic_id),
  INDEX idx_rm_ic_number (rm_ic_number),
  INDEX idx_lot_number (lot_number),
  INDEX idx_heat_number (heat_number),
  INDEX idx_manufacturer (manufacturer)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Process inspection specific details';

-- Process to RM IC Mapping Table (for tracking multiple RM ICs if needed)
CREATE TABLE IF NOT EXISTS process_rm_ic_mapping (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  process_ic_id BIGINT NOT NULL COMMENT 'Foreign key to process inspection_calls.id',
  rm_ic_id BIGINT NOT NULL COMMENT 'Foreign key to RM inspection_calls.id',
  rm_ic_number VARCHAR(50) NOT NULL COMMENT 'RM IC Number',
  heat_number VARCHAR(50) NOT NULL COMMENT 'Heat number from RM IC',
  manufacturer VARCHAR(255) NULL COMMENT 'Manufacturer name',
  book_set_no VARCHAR(50) NULL COMMENT 'Book/Set number if applicable',
  rm_qty_accepted INT NOT NULL COMMENT 'Quantity accepted in RM inspection',
  rm_ic_date DATE NULL COMMENT 'RM IC date for reference',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (process_ic_id) REFERENCES inspection_calls(id) ON DELETE CASCADE,
  FOREIGN KEY (rm_ic_id) REFERENCES inspection_calls(id) ON DELETE RESTRICT,
  
  INDEX idx_process_ic_id (process_ic_id),
  INDEX idx_rm_ic_id (rm_ic_id),
  INDEX idx_rm_ic_number (rm_ic_number),
  INDEX idx_heat_number (heat_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mapping between Process IC and RM ICs';

-- Process Inspection Lot Details (if multiple lots per process IC)
CREATE TABLE IF NOT EXISTS process_lot_details (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  process_detail_id BIGINT NOT NULL COMMENT 'Foreign key to process_inspection_details.id',
  lot_number VARCHAR(100) NOT NULL COMMENT 'Lot number',
  heat_number VARCHAR(50) NOT NULL COMMENT 'Heat number for this lot',
  manufacturer VARCHAR(255) NULL COMMENT 'Manufacturer for this lot',
  offered_qty INT NOT NULL COMMENT 'Quantity offered for this lot',
  qty_accepted INT NULL COMMENT 'Quantity accepted for this lot',
  qty_rejected INT NULL COMMENT 'Quantity rejected for this lot',
  rejection_reason TEXT NULL COMMENT 'Rejection reason if any',
  declared_lot_size INT NOT NULL COMMENT 'Declared lot size in number of ERCs',
  tentative_start_date DATE NOT NULL COMMENT 'Tentative date of start of production',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (process_detail_id) REFERENCES process_inspection_details(id) ON DELETE CASCADE,

  INDEX idx_process_detail_id (process_detail_id),
  INDEX idx_lot_number (lot_number),
  INDEX idx_heat_number (heat_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Multiple lot details for process inspection';

