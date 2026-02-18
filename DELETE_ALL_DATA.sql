-- ============================================================
-- DELETE ALL DATA FROM DATABASE
-- ============================================================
-- ⚠️ WARNING: This will delete ALL data from all tables!
-- ⚠️ Use with caution! This action cannot be undone!
-- ============================================================

USE rites_erc_inspection;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- DELETE ALL INSPECTION CALL RELATED DATA
-- ============================================================

-- Delete RM IC data (child tables first)
DELETE FROM rm_heat_quantities WHERE 1=1;
DELETE FROM rm_inspection_details WHERE 1=1;

-- Delete Process IC data (if tables exist)
-- DELETE FROM process_lot_heat_details WHERE 1=1;
-- DELETE FROM process_inspection_details WHERE 1=1;

-- Delete all inspection calls
DELETE FROM inspection_calls WHERE 1=1;

-- ============================================================
-- DELETE PURCHASE ORDER DATA
-- ============================================================
DELETE FROM purchase_orders WHERE 1=1;

-- ============================================================
-- DELETE COMPANY/UNIT DATA (Optional - uncomment if needed)
-- ============================================================
-- DELETE FROM units;
-- DELETE FROM companies;

-- ============================================================
-- DELETE USER DATA (Optional - uncomment if needed)
-- ============================================================
-- DELETE FROM users;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- RESET AUTO_INCREMENT (Optional)
-- ============================================================
ALTER TABLE inspection_calls AUTO_INCREMENT = 1;
ALTER TABLE rm_inspection_details AUTO_INCREMENT = 1;
ALTER TABLE rm_heat_quantities AUTO_INCREMENT = 1;
-- ALTER TABLE process_inspection_details AUTO_INCREMENT = 1;
-- ALTER TABLE process_lot_heat_details AUTO_INCREMENT = 1;
ALTER TABLE purchase_orders AUTO_INCREMENT = 1;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'Inspection Calls' as 'Table', COUNT(*) as 'Remaining Rows' FROM inspection_calls
UNION ALL
SELECT 'RM Inspection Details', COUNT(*) FROM rm_inspection_details
UNION ALL
SELECT 'RM Heat Quantities', COUNT(*) FROM rm_heat_quantities
UNION ALL
SELECT 'Purchase Orders', COUNT(*) FROM purchase_orders;

SELECT '✅ All data deleted successfully!' as 'Status';

