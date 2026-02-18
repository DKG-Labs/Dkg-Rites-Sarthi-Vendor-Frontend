-- ============================================================
-- INSERT MOCK RM IC DATA FOR PROCESS IC TESTING
-- ============================================================
-- Run this in MySQL Workbench to add test data
-- ============================================================

USE rites_erc_inspection;

-- First, check what PO numbers exist
SELECT DISTINCT po_no, po_serial_no FROM purchase_orders LIMIT 5;

-- ============================================================
-- DELETE OLD TEST DATA (if exists)
-- ============================================================
DELETE FROM rm_heat_quantities 
WHERE rm_detail_id IN (
    SELECT id FROM rm_inspection_details 
    WHERE ic_id IN (
        SELECT id FROM inspection_calls 
        WHERE ic_number IN ('RM-IC-2025-0001', 'RM-IC-2025-0002', 'RM-IC-TEST-001', 'RM-IC-TEST-002')
    )
);

DELETE FROM rm_inspection_details 
WHERE ic_id IN (
    SELECT id FROM inspection_calls 
    WHERE ic_number IN ('RM-IC-2025-0001', 'RM-IC-2025-0002', 'RM-IC-TEST-001', 'RM-IC-TEST-002')
);

DELETE FROM inspection_calls 
WHERE ic_number IN ('RM-IC-2025-0001', 'RM-IC-2025-0002', 'RM-IC-TEST-001', 'RM-IC-TEST-002');

-- ============================================================
-- INSERT RM IC #1 - For PO-2025-1001/01
-- ============================================================
INSERT INTO inspection_calls 
(ic_number, po_no, po_serial_no, type_of_call, desired_inspection_date, 
 company_id, company_name, unit_id, unit_name, unit_address, status, created_at, updated_at)
VALUES 
('RM-IC-2025-0001', 'PO-2025-1001', '01', 'Raw Material', '2025-12-20',
 1, 'ABC Steel Industries', 1, 'Mumbai Plant', 'Plant 1, Industrial Area, Mumbai, Maharashtra - 400001', 
 'Approved', NOW(), NOW());

SET @rm_ic_1 = LAST_INSERT_ID();

-- Add RM details
INSERT INTO rm_inspection_details
(ic_id, heat_numbers, total_offered_qty_mt, offered_qty_erc, manufacturer, created_at, updated_at)
VALUES
(@rm_ic_1, 'HT-2025-001, HT-2025-002', 150.00, 135000, 'ABC Steel Industries', NOW(), NOW());

SET @rm_detail_1 = LAST_INSERT_ID();

-- Add heat quantities
INSERT INTO rm_heat_quantities
(rm_detail_id, heat_number, manufacturer, qty_offered_mt, qty_accepted_mt, qty_accepted, created_at, updated_at)
VALUES
(@rm_detail_1, 'HT-2025-001', 'ABC Steel Industries', 80.00, 75.00, 67500, NOW(), NOW()),
(@rm_detail_1, 'HT-2025-002', 'ABC Steel Industries', 70.00, 75.00, 67500, NOW(), NOW());

-- ============================================================
-- INSERT RM IC #2 - For PO-2025-1001/01
-- ============================================================
INSERT INTO inspection_calls 
(ic_number, po_no, po_serial_no, type_of_call, desired_inspection_date, 
 company_id, company_name, unit_id, unit_name, unit_address, status, created_at, updated_at)
VALUES 
('RM-IC-2025-0002', 'PO-2025-1001', '01', 'Raw Material', '2025-12-21',
 1, 'XYZ Steel Corp', 1, 'Mumbai Plant', 'Plant 1, Industrial Area, Mumbai, Maharashtra - 400001', 
 'Approved', NOW(), NOW());

SET @rm_ic_2 = LAST_INSERT_ID();

-- Add RM details
INSERT INTO rm_inspection_details
(ic_id, heat_numbers, total_offered_qty_mt, offered_qty_erc, manufacturer, created_at, updated_at)
VALUES
(@rm_ic_2, 'HT-2025-003, HT-2025-004', 200.00, 180000, 'XYZ Steel Corp', NOW(), NOW());

SET @rm_detail_2 = LAST_INSERT_ID();

-- Add heat quantities
INSERT INTO rm_heat_quantities
(rm_detail_id, heat_number, manufacturer, qty_offered_mt, qty_accepted_mt, qty_accepted, created_at, updated_at)
VALUES
(@rm_detail_2, 'HT-2025-003', 'XYZ Steel Corp', 100.00, 100.00, 90000, NOW(), NOW()),
(@rm_detail_2, 'HT-2025-004', 'XYZ Steel Corp', 100.00, 100.00, 90000, NOW(), NOW());

-- ============================================================
-- VERIFY THE DATA
-- ============================================================
SELECT '✅ VERIFICATION - Approved RM ICs' as '';

SELECT 
    ic.ic_number as 'IC Number',
    ic.po_no as 'PO Number',
    ic.po_serial_no as 'Serial',
    ic.status as 'Status',
    rm.heat_numbers as 'Heat Numbers',
    rm.offered_qty_erc as 'Total ERCs',
    rm.manufacturer as 'Manufacturer'
FROM inspection_calls ic
LEFT JOIN rm_inspection_details rm ON ic.id = rm.ic_id
WHERE ic.type_of_call = 'Raw Material' 
  AND ic.status = 'Approved'
  AND ic.po_no = 'PO-2025-1001'
ORDER BY ic.ic_number;

SELECT '✅ VERIFICATION - Heat Numbers' as '';

SELECT 
    ic.ic_number as 'IC Number',
    hq.heat_number as 'Heat Number',
    hq.manufacturer as 'Manufacturer',
    hq.qty_accepted_mt as 'Accepted MT',
    hq.qty_accepted as 'Accepted ERCs'
FROM inspection_calls ic
JOIN rm_inspection_details rm ON ic.id = rm.ic_id
JOIN rm_heat_quantities hq ON rm.id = hq.rm_detail_id
WHERE ic.type_of_call = 'Raw Material' 
  AND ic.status = 'Approved'
  AND ic.po_no = 'PO-2025-1001'
ORDER BY ic.ic_number, hq.heat_number;

SELECT '✅ SUCCESS - Data inserted!' as 'Status', 
       COUNT(*) as 'Total RM ICs' 
FROM inspection_calls 
WHERE ic_number IN ('RM-IC-2025-0001', 'RM-IC-2025-0002');

