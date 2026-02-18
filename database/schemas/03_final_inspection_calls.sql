-- ============================================================
-- FINAL INSPECTION CALLS SCHEMA
-- ============================================================
-- Description: Database schema for Final Inspection Calls
-- Final inspection is the third and last stage after Process inspection
-- Compatible with: MySQL 8.0+, Azure MySQL
-- Created: 2025-12-23
-- ============================================================

-- Final Inspection Details Table
CREATE TABLE IF NOT EXISTS final_inspection_details (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ic_id BIGINT NOT NULL UNIQUE COMMENT 'Foreign key to inspection_calls.id',
  
  -- Reference to parent RM and Process Inspection Calls
  rm_ic_id BIGINT NOT NULL COMMENT 'Foreign key to parent RM inspection_calls.id',
  rm_ic_number VARCHAR(50) NOT NULL COMMENT 'Parent RM IC Number for reference',
  process_ic_id BIGINT NOT NULL COMMENT 'Foreign key to parent Process inspection_calls.id',
  process_ic_number VARCHAR(50) NOT NULL COMMENT 'Parent Process IC Number for reference',
  
  -- Place of Inspection (auto-fetched from RM IC and Process IC)
  company_id INT NOT NULL COMMENT 'Company ID (same as RM IC & Process IC)',
  company_name VARCHAR(255) NOT NULL COMMENT 'Company name (same as RM IC & Process IC)',
  unit_id INT NOT NULL COMMENT 'Unit ID (same as RM IC & Process IC)',
  unit_name VARCHAR(255) NOT NULL COMMENT 'Unit name (same as RM IC & Process IC)',
  unit_address TEXT NULL COMMENT 'Unit address (same as RM IC & Process IC)',
  
  -- Summary Information
  total_lots INT NOT NULL DEFAULT 0 COMMENT 'Total number of lots in this final IC',
  total_offered_qty INT NOT NULL DEFAULT 0 COMMENT 'Total quantity offered across all lots',
  total_accepted_qty INT NULL COMMENT 'Total quantity accepted after final inspection',
  total_rejected_qty INT NULL COMMENT 'Total quantity rejected after final inspection',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (ic_id) REFERENCES inspection_calls(id) ON DELETE CASCADE,
  FOREIGN KEY (rm_ic_id) REFERENCES inspection_calls(id) ON DELETE RESTRICT,
  FOREIGN KEY (process_ic_id) REFERENCES inspection_calls(id) ON DELETE RESTRICT,
  
  -- Indexes
  INDEX idx_ic_id (ic_id),
  INDEX idx_rm_ic_id (rm_ic_id),
  INDEX idx_rm_ic_number (rm_ic_number),
  INDEX idx_process_ic_id (process_ic_id),
  INDEX idx_process_ic_number (process_ic_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Final inspection specific details';

-- Final Inspection Lot Details Table (One-to-Many relationship)
CREATE TABLE IF NOT EXISTS final_inspection_lot_details (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  final_detail_id BIGINT NOT NULL COMMENT 'Foreign key to final_inspection_details.id',
  
  -- Lot Information
  lot_number VARCHAR(100) NOT NULL COMMENT 'Lot number selected from Process IC',
  
  -- Heat Information (auto-fetched from RM IC and Process IC)
  heat_number VARCHAR(50) NOT NULL COMMENT 'Heat number from RM IC',
  manufacturer VARCHAR(255) NULL COMMENT 'Manufacturer name',
  manufacturer_heat VARCHAR(255) NOT NULL COMMENT 'Combined Manufacturer - Heat Number format',
  
  -- Quantity Information
  offered_qty INT NOT NULL COMMENT 'Quantity offered for this lot (No. of ERCs)',
  qty_accepted INT NULL COMMENT 'Quantity accepted for this lot',
  qty_rejected INT NULL COMMENT 'Quantity rejected for this lot',
  rejection_reason TEXT NULL COMMENT 'Reason for rejection if any',
  
  -- Additional tracking
  process_ic_id BIGINT NULL COMMENT 'Reference to process IC for this lot',
  process_ic_number VARCHAR(50) NULL COMMENT 'Process IC number for reference',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (final_detail_id) REFERENCES final_inspection_details(id) ON DELETE CASCADE,
  FOREIGN KEY (process_ic_id) REFERENCES inspection_calls(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_final_detail_id (final_detail_id),
  INDEX idx_lot_number (lot_number),
  INDEX idx_heat_number (heat_number),
  INDEX idx_manufacturer (manufacturer),
  INDEX idx_process_ic_id (process_ic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Multiple lot details for final inspection';

-- Final to Process IC Mapping Table (for tracking multiple Process ICs if needed)
CREATE TABLE IF NOT EXISTS final_process_ic_mapping (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  final_ic_id BIGINT NOT NULL COMMENT 'Foreign key to final inspection_calls.id',
  process_ic_id BIGINT NOT NULL COMMENT 'Foreign key to process inspection_calls.id',
  process_ic_number VARCHAR(50) NOT NULL COMMENT 'Process IC Number',
  lot_number VARCHAR(100) NOT NULL COMMENT 'Lot number from Process IC',
  heat_number VARCHAR(50) NOT NULL COMMENT 'Heat number',
  manufacturer VARCHAR(255) NULL COMMENT 'Manufacturer name',
  process_qty_accepted INT NOT NULL COMMENT 'Quantity accepted in Process inspection',
  process_ic_date DATE NULL COMMENT 'Process IC date for reference',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (final_ic_id) REFERENCES inspection_calls(id) ON DELETE CASCADE,
  FOREIGN KEY (process_ic_id) REFERENCES inspection_calls(id) ON DELETE RESTRICT,
  
  INDEX idx_final_ic_id (final_ic_id),
  INDEX idx_process_ic_id (process_ic_id),
  INDEX idx_process_ic_number (process_ic_number),
  INDEX idx_lot_number (lot_number),
  INDEX idx_heat_number (heat_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mapping between Final IC and Process ICs';

