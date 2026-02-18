-- ============================================================
-- COMPLETE DATABASE SETUP SCRIPT
-- ============================================================
-- Description: Complete database setup for RITES ERC Inspection System
-- This script creates all tables in the correct order
-- Compatible with: MySQL 8.0+, Azure MySQL
-- Created: 2025-12-23
-- ============================================================

-- Set character set and collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Create database if not exists (for local development)
-- Comment out for Azure production deployment
-- CREATE DATABASE IF NOT EXISTS rites_erc_inspection DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE rites_erc_inspection;

-- ============================================================
-- STEP 1: Main Inspection Calls Table
-- ============================================================

-- Main Inspection Calls Table (Shared across all inspection types)
CREATE TABLE IF NOT EXISTS inspection_calls (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ic_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Auto-generated IC Number (e.g., RM-IC-2025-0001)',
  po_no VARCHAR(50) NOT NULL COMMENT 'Purchase Order Number',
  po_serial_no VARCHAR(50) NOT NULL COMMENT 'PO Serial Number (Item line number)',
  type_of_call ENUM('Raw Material', 'Process', 'Final') NOT NULL COMMENT 'Type of inspection call',
  desired_inspection_date DATE NOT NULL COMMENT 'Vendor requested inspection date',
  actual_inspection_date DATE NULL COMMENT 'Actual inspection date (set by IE)',
  status ENUM('Pending', 'Scheduled', 'Under Inspection', 'Approved', 'Rejected', 'Completed') DEFAULT 'Pending' COMMENT 'Current status of inspection call',
  company_id INT NOT NULL COMMENT 'Company ID from COMPANY_UNIT_MASTER',
  company_name VARCHAR(255) NOT NULL COMMENT 'Company name for place of inspection',
  unit_id INT NOT NULL COMMENT 'Unit ID from COMPANY_UNIT_MASTER',
  unit_name VARCHAR(255) NOT NULL COMMENT 'Unit name for place of inspection',
  unit_address TEXT NULL COMMENT 'Full address of inspection unit',
  remarks TEXT NULL COMMENT 'Additional remarks/notes',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  created_by VARCHAR(100) NULL COMMENT 'User ID who created the record',
  updated_by VARCHAR(100) NULL COMMENT 'User ID who last updated the record',
  
  INDEX idx_ic_number (ic_number),
  INDEX idx_po_no (po_no),
  INDEX idx_po_serial_no (po_serial_no),
  INDEX idx_status (status),
  INDEX idx_type_of_call (type_of_call),
  INDEX idx_desired_inspection_date (desired_inspection_date),
  INDEX idx_created_at (created_at),
  INDEX idx_company_unit (company_id, unit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Main table for all inspection calls (RM, Process, Final)';

-- ============================================================
-- STEP 2: IC Number Sequence Table (for auto-generation)
-- ============================================================

CREATE TABLE IF NOT EXISTS ic_number_sequences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type_of_call ENUM('Raw Material', 'Process', 'Final') NOT NULL UNIQUE COMMENT 'Type of inspection call',
  prefix VARCHAR(20) NOT NULL COMMENT 'Prefix for IC number (e.g., RM-IC, PROC-IC, FINAL-IC)',
  current_year INT NOT NULL COMMENT 'Current year for sequence',
  current_sequence INT NOT NULL DEFAULT 0 COMMENT 'Current sequence number',
  last_generated_ic VARCHAR(50) NULL COMMENT 'Last generated IC number',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_type_of_call (type_of_call),
  INDEX idx_current_year (current_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sequence tracking for IC number generation';

-- Initialize sequences for each type
INSERT INTO ic_number_sequences (type_of_call, prefix, current_year, current_sequence) VALUES
('Raw Material', 'RM-IC', YEAR(CURDATE()), 0),
('Process', 'PROC-IC', YEAR(CURDATE()), 0),
('Final', 'FINAL-IC', YEAR(CURDATE()), 0)
ON DUPLICATE KEY UPDATE current_year = YEAR(CURDATE());

-- ============================================================
-- STEP 3: Raw Material Inspection Tables
-- ============================================================

-- Raw Material Inspection Details Table
CREATE TABLE IF NOT EXISTS rm_inspection_details (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ic_id BIGINT NOT NULL UNIQUE COMMENT 'Foreign key to inspection_calls.id',
  item_description VARCHAR(500) NOT NULL COMMENT 'Item description from PO',
  item_quantity INT NOT NULL COMMENT 'Total item quantity from PO',
  consignee_zonal_railway VARCHAR(255) NULL COMMENT 'Consignee/Zonal Railway from PO',
  heat_numbers TEXT NOT NULL COMMENT 'Comma-separated heat numbers',
  tc_number VARCHAR(100) NOT NULL COMMENT 'Test Certificate Number',
  tc_date DATE NOT NULL COMMENT 'Test Certificate Date',
  tc_quantity DECIMAL(10,3) NOT NULL COMMENT 'TC Quantity in MT',
  manufacturer VARCHAR(255) NOT NULL COMMENT 'Manufacturer name',
  supplier_name VARCHAR(255) NOT NULL COMMENT 'Supplier name',
  supplier_address TEXT NULL COMMENT 'Supplier address',
  invoice_number VARCHAR(100) NOT NULL COMMENT 'Invoice Number',
  invoice_date DATE NOT NULL COMMENT 'Invoice Date',
  sub_po_number VARCHAR(100) NOT NULL COMMENT 'Sub PO Number',
  sub_po_date DATE NOT NULL COMMENT 'Sub PO Date',
  sub_po_qty INT NOT NULL COMMENT 'Sub PO Quantity',
  total_offered_qty_mt DECIMAL(10,3) NOT NULL COMMENT 'Total offered quantity in MT',
  offered_qty_erc INT NOT NULL COMMENT 'Offered quantity in ERC count',
  unit_of_measurement VARCHAR(50) DEFAULT 'MT' COMMENT 'Unit of measurement',
  rate_of_material DECIMAL(12,2) NULL COMMENT 'Rate of material per unit',
  rate_of_gst DECIMAL(5,2) NULL COMMENT 'GST rate percentage',
  base_value_po DECIMAL(15,2) NULL COMMENT 'Base value of PO',
  total_po DECIMAL(15,2) NULL COMMENT 'Total PO value including GST',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ic_id) REFERENCES inspection_calls(id) ON DELETE CASCADE,
  INDEX idx_ic_id (ic_id),
  INDEX idx_tc_number (tc_number),
  INDEX idx_manufacturer (manufacturer),
  INDEX idx_invoice_number (invoice_number),
  INDEX idx_sub_po_number (sub_po_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Raw Material specific inspection details';

-- Raw Material Heat-wise Quantities Table
CREATE TABLE IF NOT EXISTS rm_heat_quantities (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  rm_detail_id BIGINT NOT NULL COMMENT 'Foreign key to rm_inspection_details.id',
  heat_number VARCHAR(50) NOT NULL COMMENT 'Individual heat number',
  manufacturer VARCHAR(255) NULL COMMENT 'Manufacturer for this heat',
  offered_qty DECIMAL(10,3) NOT NULL COMMENT 'Offered quantity for this heat in MT',
  tc_number VARCHAR(100) NULL COMMENT 'TC number for this heat',
  tc_date DATE NULL COMMENT 'TC date for this heat',
  tc_quantity DECIMAL(10,3) NULL COMMENT 'TC quantity for this heat',
  qty_left DECIMAL(10,3) NULL COMMENT 'Quantity left in inventory for this heat',
  qty_accepted DECIMAL(10,3) NULL COMMENT 'Quantity accepted after inspection',
  qty_rejected DECIMAL(10,3) NULL COMMENT 'Quantity rejected after inspection',
  rejection_reason TEXT NULL COMMENT 'Reason for rejection if any',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (rm_detail_id) REFERENCES rm_inspection_details(id) ON DELETE CASCADE,
  INDEX idx_rm_detail_id (rm_detail_id),
  INDEX idx_heat_number (heat_number),
  INDEX idx_manufacturer (manufacturer)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Heat-wise quantity breakdown for RM inspection';

-- Raw Material Chemical Analysis Table
CREATE TABLE IF NOT EXISTS rm_chemical_analysis (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  rm_detail_id BIGINT NOT NULL COMMENT 'Foreign key to rm_inspection_details.id',
  heat_number VARCHAR(50) NOT NULL COMMENT 'Heat number for this analysis',
  carbon DECIMAL(5,3) NULL COMMENT 'Carbon percentage (C)',
  manganese DECIMAL(5,3) NULL COMMENT 'Manganese percentage (Mn)',
  silicon DECIMAL(5,3) NULL COMMENT 'Silicon percentage (Si)',
  sulphur DECIMAL(5,3) NULL COMMENT 'Sulphur percentage (S)',
  phosphorus DECIMAL(5,3) NULL COMMENT 'Phosphorus percentage (P)',
  chromium DECIMAL(5,3) NULL COMMENT 'Chromium percentage (Cr)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (rm_detail_id) REFERENCES rm_inspection_details(id) ON DELETE CASCADE,
  INDEX idx_rm_detail_id (rm_detail_id),
  INDEX idx_heat_number (heat_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chemical analysis data for each heat';

-- ============================================================
-- STEP 4: Process Inspection Tables
-- ============================================================

-- Process Inspection Details Table
CREATE TABLE IF NOT EXISTS process_inspection_details (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ic_id BIGINT NOT NULL UNIQUE COMMENT 'Foreign key to inspection_calls.id',
  rm_ic_id BIGINT NOT NULL COMMENT 'Foreign key to parent RM inspection_calls.id',
  rm_ic_number VARCHAR(50) NOT NULL COMMENT 'Parent RM IC Number for reference',
  lot_number VARCHAR(100) NOT NULL COMMENT 'Lot number entered by vendor',
  heat_number VARCHAR(50) NOT NULL COMMENT 'Heat number selected from RM IC',
  manufacturer VARCHAR(255) NULL COMMENT 'Manufacturer name for the heat',
  manufacturer_heat VARCHAR(255) NOT NULL COMMENT 'Combined Manufacturer - Heat Number format',
  offered_qty INT NOT NULL COMMENT 'Quantity offered for process inspection (in pieces/ERCs)',
  total_accepted_qty_rm INT NOT NULL DEFAULT 0 COMMENT 'Total accepted quantity from RM inspection',
  qty_accepted INT NULL COMMENT 'Quantity accepted after process inspection',
  qty_rejected INT NULL COMMENT 'Quantity rejected after process inspection',
  rejection_reason TEXT NULL COMMENT 'Reason for rejection if any',
  company_id INT NOT NULL COMMENT 'Company ID (same as RM IC)',
  company_name VARCHAR(255) NOT NULL COMMENT 'Company name (same as RM IC)',
  unit_id INT NOT NULL COMMENT 'Unit ID (same as RM IC)',
  unit_name VARCHAR(255) NOT NULL COMMENT 'Unit name (same as RM IC)',
  unit_address TEXT NULL COMMENT 'Unit address (same as RM IC)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (ic_id) REFERENCES inspection_calls(id) ON DELETE CASCADE,
  FOREIGN KEY (rm_ic_id) REFERENCES inspection_calls(id) ON DELETE RESTRICT,
  INDEX idx_ic_id (ic_id),
  INDEX idx_rm_ic_id (rm_ic_id),
  INDEX idx_rm_ic_number (rm_ic_number),
  INDEX idx_lot_number (lot_number),
  INDEX idx_heat_number (heat_number),
  INDEX idx_manufacturer (manufacturer)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Process inspection specific details';

-- Process to RM IC Mapping Table
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

-- ============================================================
-- STEP 5: Final Inspection Tables
-- ============================================================

-- Final Inspection Details Table
CREATE TABLE IF NOT EXISTS final_inspection_details (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ic_id BIGINT NOT NULL UNIQUE COMMENT 'Foreign key to inspection_calls.id',
  rm_ic_id BIGINT NOT NULL COMMENT 'Foreign key to parent RM inspection_calls.id',
  rm_ic_number VARCHAR(50) NOT NULL COMMENT 'Parent RM IC Number for reference',
  process_ic_id BIGINT NOT NULL COMMENT 'Foreign key to parent Process inspection_calls.id',
  process_ic_number VARCHAR(50) NOT NULL COMMENT 'Parent Process IC Number for reference',
  company_id INT NOT NULL COMMENT 'Company ID (same as RM IC & Process IC)',
  company_name VARCHAR(255) NOT NULL COMMENT 'Company name (same as RM IC & Process IC)',
  unit_id INT NOT NULL COMMENT 'Unit ID (same as RM IC & Process IC)',
  unit_name VARCHAR(255) NOT NULL COMMENT 'Unit name (same as RM IC & Process IC)',
  unit_address TEXT NULL COMMENT 'Unit address (same as RM IC & Process IC)',
  total_lots INT NOT NULL DEFAULT 0 COMMENT 'Total number of lots in this final IC',
  total_offered_qty INT NOT NULL DEFAULT 0 COMMENT 'Total quantity offered across all lots',
  total_accepted_qty INT NULL COMMENT 'Total quantity accepted after final inspection',
  total_rejected_qty INT NULL COMMENT 'Total quantity rejected after final inspection',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (ic_id) REFERENCES inspection_calls(id) ON DELETE CASCADE,
  FOREIGN KEY (rm_ic_id) REFERENCES inspection_calls(id) ON DELETE RESTRICT,
  FOREIGN KEY (process_ic_id) REFERENCES inspection_calls(id) ON DELETE RESTRICT,
  INDEX idx_ic_id (ic_id),
  INDEX idx_rm_ic_id (rm_ic_id),
  INDEX idx_rm_ic_number (rm_ic_number),
  INDEX idx_process_ic_id (process_ic_id),
  INDEX idx_process_ic_number (process_ic_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Final inspection specific details';

-- Final Inspection Lot Details Table
CREATE TABLE IF NOT EXISTS final_inspection_lot_details (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  final_detail_id BIGINT NOT NULL COMMENT 'Foreign key to final_inspection_details.id',
  lot_number VARCHAR(100) NOT NULL COMMENT 'Lot number selected from Process IC',
  heat_number VARCHAR(50) NOT NULL COMMENT 'Heat number from RM IC',
  manufacturer VARCHAR(255) NULL COMMENT 'Manufacturer name',
  manufacturer_heat VARCHAR(255) NOT NULL COMMENT 'Combined Manufacturer - Heat Number format',
  offered_qty INT NOT NULL COMMENT 'Quantity offered for this lot (No. of ERCs)',
  qty_accepted INT NULL COMMENT 'Quantity accepted for this lot',
  qty_rejected INT NULL COMMENT 'Quantity rejected for this lot',
  rejection_reason TEXT NULL COMMENT 'Reason for rejection if any',
  process_ic_id BIGINT NULL COMMENT 'Reference to process IC for this lot',
  process_ic_number VARCHAR(50) NULL COMMENT 'Process IC number for reference',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (final_detail_id) REFERENCES final_inspection_details(id) ON DELETE CASCADE,
  FOREIGN KEY (process_ic_id) REFERENCES inspection_calls(id) ON DELETE SET NULL,
  INDEX idx_final_detail_id (final_detail_id),
  INDEX idx_lot_number (lot_number),
  INDEX idx_heat_number (heat_number),
  INDEX idx_manufacturer (manufacturer),
  INDEX idx_process_ic_id (process_ic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Multiple lot details for final inspection';

-- ============================================================
-- SETUP COMPLETE
-- ============================================================
-- All tables created successfully
-- Next steps:
-- 1. Run this script on local MySQL database
-- 2. Test with sample data
-- 3. Deploy to Azure MySQL production database
-- ============================================================

