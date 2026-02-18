-- ============================================================
-- MANUAL MIGRATION SCRIPT FOR AZURE MYSQL
-- Apply these migrations to your Azure database manually
-- Database: sarthidb
-- Host: sarthibackenddb.mysql.database.azure.com
-- ============================================================

USE sarthidb;

-- ============================================================
-- MIGRATION V9: Make company_id and unit_id nullable in process_inspection_details
-- ============================================================
-- This allows Process IC to be created with NULL company_id/unit_id 
-- when the RM IC uses POI code instead

ALTER TABLE process_inspection_details 
  MODIFY COLUMN company_id INT NULL COMMENT 'Company ID (same as RM IC) - nullable when using POI code',
  MODIFY COLUMN unit_id INT NULL COMMENT 'Unit ID (same as RM IC) - nullable when using POI code';

-- Verify the changes
DESCRIBE process_inspection_details;

-- ============================================================
-- MIGRATION V10: Make company_id and unit_id nullable in final_inspection_details
-- ============================================================
-- This allows Final IC to be created with NULL company_id/unit_id 
-- when the RM IC uses POI code instead

ALTER TABLE final_inspection_details 
  MODIFY COLUMN company_id INT NULL COMMENT 'Company ID (same as RM IC & Process IC) - nullable when using POI code',
  MODIFY COLUMN unit_id INT NULL COMMENT 'Unit ID (same as RM IC & Process IC) - nullable when using POI code';

-- Verify the changes
DESCRIBE final_inspection_details;

-- ============================================================
-- VERIFICATION: Check that migrations were applied successfully
-- ============================================================

-- Check process_inspection_details columns
SELECT 
  COLUMN_NAME, 
  IS_NULLABLE, 
  COLUMN_TYPE,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'process_inspection_details' 
  AND COLUMN_NAME IN ('company_id', 'unit_id')
ORDER BY COLUMN_NAME;

-- Check final_inspection_details columns
SELECT 
  COLUMN_NAME, 
  IS_NULLABLE, 
  COLUMN_TYPE,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'final_inspection_details' 
  AND COLUMN_NAME IN ('company_id', 'unit_id')
ORDER BY COLUMN_NAME;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
-- If you see the above queries return results with IS_NULLABLE = 'YES',
-- then the migrations have been applied successfully!
-- ============================================================

