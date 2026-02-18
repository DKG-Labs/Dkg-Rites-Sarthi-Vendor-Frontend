-- ============================================================
-- ALTER PROCESS_INSPECTION_DETAILS TABLE
-- Make rm_ic_id nullable and update rm_ic_number column size
-- ============================================================

USE rites_erc_inspection;

-- Make rm_ic_id nullable (allow NULL values)
ALTER TABLE process_inspection_details 
MODIFY COLUMN rm_ic_id BIGINT NULL COMMENT 'Foreign key to parent RM inspection_calls.id (nullable for flexibility)';

-- Increase rm_ic_number column size to accommodate certificate numbers
-- Certificate numbers are longer than call numbers (e.g., "N/ER-01080001/RAJK" vs "ER-01080001")
ALTER TABLE process_inspection_details 
MODIFY COLUMN rm_ic_number VARCHAR(100) NOT NULL COMMENT 'Parent RM IC Certificate Number for reference (e.g., N/ER-01080001/RAJK)';

-- Verify the changes
DESCRIBE process_inspection_details;

