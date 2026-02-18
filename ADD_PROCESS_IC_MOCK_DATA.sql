-- ============================================================
-- ADD MOCK DATA FOR PROCESS IC TESTING
-- ============================================================
-- This script adds approved RM ICs with heat numbers
-- so you can test the Process IC flow
-- ============================================================

USE rites_erc_inspection;

-- First, let's check what PO numbers exist
SELECT DISTINCT po_no FROM purchase_orders LIMIT 5;

-- ============================================================
-- STEP 1: Clean up any existing test data (optional)
-- ============================================================
-- Uncomment these lines if you want to start fresh
-- DELETE FROM rm_heat_quantities WHERE rm_detail_id IN (SELECT id FROM rm_inspection_details WHERE ic_id IN (SELECT id FROM inspection_calls WHERE ic_number LIKE 'RM-IC-TEST-%'));
-- DELETE FROM rm_inspection_details WHERE ic_id IN (SELECT id FROM inspection_calls WHERE ic_number LIKE 'RM-IC-TEST-%');
-- DELETE FROM inspection_calls WHERE ic_number LIKE 'RM-IC-TEST-%';

-- ============================================================
-- STEP 2: Add Approved RM Inspection Call #1
-- ============================================================
INSERT INTO inspection_calls 
(ic_number, po_no, po_serial_no, type_of_call, desired_inspection_date, 
 company_id, unit_id, unit_address, status, created_at, updated_at)
VALUES 
('RM-IC-TEST-001', 'PO-2025-1001', '01', 'Raw Material', '2025-12-20',
 1, 1, 'Plant 1, Industrial Area, Mumbai, Maharashtra - 400001', 'Approved', NOW(), NOW());

SET @rm_ic_1_id = LAST_INSERT_ID();

-- Add RM Inspection Details
INSERT INTO rm_inspection_details
(ic_id, heat_numbers, total_offered_qty_mt, offered_qty_erc, manufacturer, created_at, updated_at)
VALUES
(@rm_ic_1_id, 'HT-2025-001, HT-2025-002', 150.00, 135000, 'Steel Works Ltd', NOW(), NOW());

SET @rm_detail_1_id = LAST_INSERT_ID();

-- Add Heat Numbers for RM IC #1
INSERT INTO rm_heat_quantities
(rm_detail_id, heat_number, manufacturer, qty_offered_mt, qty_accepted_mt, qty_accepted, created_at, updated_at)
VALUES
(@rm_detail_1_id, 'HT-2025-001', 'Steel Works Ltd', 80.00, 75.00, 67500, NOW(), NOW()),
(@rm_detail_1_id, 'HT-2025-002', 'Steel Works Ltd', 70.00, 75.00, 67500, NOW(), NOW());

-- ============================================================
-- STEP 3: Add Approved RM Inspection Call #2
-- ============================================================
INSERT INTO inspection_calls 
(ic_number, po_no, po_serial_no, type_of_call, desired_inspection_date, 
 company_id, unit_id, unit_address, status, created_at, updated_at)
VALUES 
('RM-IC-TEST-002', 'PO-2025-1001', '01', 'Raw Material', '2025-12-21',
 1, 1, 'Plant 1, Industrial Area, Mumbai, Maharashtra - 400001', 'Approved', NOW(), NOW());

SET @rm_ic_2_id = LAST_INSERT_ID();

-- Add RM Inspection Details
INSERT INTO rm_inspection_details
(ic_id, heat_numbers, total_offered_qty_mt, offered_qty_erc, manufacturer, created_at, updated_at)
VALUES
(@rm_ic_2_id, 'HT-2025-003', 100.00, 90000, 'Premium Steel Co', NOW(), NOW());

SET @rm_detail_2_id = LAST_INSERT_ID();

-- Add Heat Numbers for RM IC #2
INSERT INTO rm_heat_quantities
(rm_detail_id, heat_number, manufacturer, qty_offered_mt, qty_accepted_mt, qty_accepted, created_at, updated_at)
VALUES
(@rm_detail_2_id, 'HT-2025-003', 'Premium Steel Co', 100.00, 100.00, 90000, NOW(), NOW());

-- ============================================================
-- VERIFICATION: Check the data
-- ============================================================
SELECT 
    ic.ic_number as 'RM IC Number',
    ic.po_no as 'PO Number',
    ic.status as 'Status',
    rm.heat_numbers as 'Heat Numbers',
    rm.offered_qty_erc as 'Total ERCs'
FROM inspection_calls ic
JOIN rm_inspection_details rm ON ic.id = rm.ic_id
WHERE ic.ic_number LIKE 'RM-IC-TEST-%'
ORDER BY ic.ic_number;

-- Check heat number details
SELECT 
    ic.ic_number as 'RM IC',
    hq.heat_number as 'Heat Number',
    hq.manufacturer as 'Manufacturer',
    hq.qty_accepted_mt as 'Accepted (MT)',
    hq.qty_accepted as 'Accepted (ERCs)'
FROM inspection_calls ic
JOIN rm_inspection_details rm ON ic.id = rm.ic_id
JOIN rm_heat_quantities hq ON rm.id = hq.rm_detail_id
WHERE ic.ic_number LIKE 'RM-IC-TEST-%'
ORDER BY ic.ic_number, hq.heat_number;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
SELECT 
    '✅ Mock data added successfully!' as 'Status',
    COUNT(*) as 'Total RM ICs Added'
FROM inspection_calls
WHERE ic_number LIKE 'RM-IC-TEST-%';

