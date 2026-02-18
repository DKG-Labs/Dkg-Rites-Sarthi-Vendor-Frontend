-- ============================================================
-- RAW MATERIAL INSPECTION CALLS SCHEMA
-- ============================================================
-- Description: Complete database schema for Raw Material Inspection Calls
-- This includes the main inspection_calls table and RM-specific detail tables
-- Compatible with: MySQL 8.0+, Azure MySQL
-- Created: 2025-12-23
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
  
  -- Indexes for performance
  INDEX idx_ic_number (ic_number),
  INDEX idx_po_no (po_no),
  INDEX idx_po_serial_no (po_serial_no),
  INDEX idx_status (status),
  INDEX idx_type_of_call (type_of_call),
  INDEX idx_desired_inspection_date (desired_inspection_date),
  INDEX idx_created_at (created_at),
  INDEX idx_company_unit (company_id, unit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Main table for all inspection calls (RM, Process, Final)';

-- Raw Material Inspection Details Table
CREATE TABLE IF NOT EXISTS rm_inspection_details (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ic_id BIGINT NOT NULL UNIQUE COMMENT 'Foreign key to inspection_calls.id',
  
  -- Item Details (from PO)
  item_description VARCHAR(500) NOT NULL COMMENT 'Item description from PO',
  item_quantity INT NOT NULL COMMENT 'Total item quantity from PO',
  consignee_zonal_railway VARCHAR(255) NULL COMMENT 'Consignee/Zonal Railway from PO',
  
  -- Heat & TC Information
  heat_numbers TEXT NOT NULL COMMENT 'Comma-separated heat numbers (e.g., HT-2025-001,HT-2025-002)',
  tc_number VARCHAR(100) NOT NULL COMMENT 'Test Certificate Number',
  tc_date DATE NOT NULL COMMENT 'Test Certificate Date',
  tc_quantity DECIMAL(10,3) NOT NULL COMMENT 'TC Quantity in MT',
  manufacturer VARCHAR(255) NOT NULL COMMENT 'Manufacturer name',
  supplier_name VARCHAR(255) NOT NULL COMMENT 'Supplier name',
  supplier_address TEXT NULL COMMENT 'Supplier address',
  
  -- Invoice Details
  invoice_number VARCHAR(100) NOT NULL COMMENT 'Invoice Number',
  invoice_date DATE NOT NULL COMMENT 'Invoice Date',
  
  -- Sub PO Details
  sub_po_number VARCHAR(100) NOT NULL COMMENT 'Sub PO Number',
  sub_po_date DATE NOT NULL COMMENT 'Sub PO Date',
  sub_po_qty INT NOT NULL COMMENT 'Sub PO Quantity',
  
  -- Quantity Details
  total_offered_qty_mt DECIMAL(10,3) NOT NULL COMMENT 'Total offered quantity in MT',
  offered_qty_erc INT NOT NULL COMMENT 'Offered quantity in ERC count',
  unit_of_measurement VARCHAR(50) DEFAULT 'MT' COMMENT 'Unit of measurement',
  
  -- Pricing Details
  rate_of_material DECIMAL(12,2) NULL COMMENT 'Rate of material per unit',
  rate_of_gst DECIMAL(5,2) NULL COMMENT 'GST rate percentage',
  base_value_po DECIMAL(15,2) NULL COMMENT 'Base value of PO',
  total_po DECIMAL(15,2) NULL COMMENT 'Total PO value including GST',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Key
  FOREIGN KEY (ic_id) REFERENCES inspection_calls(id) ON DELETE CASCADE,
  
  -- Indexes
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
  
  -- Approval/Rejection tracking
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
  
  -- Chemical composition percentages
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

