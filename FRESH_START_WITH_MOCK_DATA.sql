-- ============================================================
-- FRESH START - DELETE ALL & ADD MOCK DATA
-- ============================================================
-- This script will:
-- 1. Delete all existing data
-- 2. Add fresh mock data for testing Process IC
-- ============================================================

USE rites_erc_inspection;

-- Disable safe mode temporarily
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- STEP 1: DELETE ALL DATA
-- ============================================================
TRUNCATE TABLE rm_heat_quantities;
TRUNCATE TABLE rm_inspection_details;
TRUNCATE TABLE inspection_calls;
TRUNCATE TABLE purchase_orders;

-- Re-enable safe mode
SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

-- ============================================================
-- STEP 2: ADD PURCHASE ORDER
-- ============================================================
INSERT INTO purchase_orders 
(po_no, po_serial_no, company_id, company_name, unit_id, unit_name, 
 material_description, quantity, unit_of_measurement, created_at, updated_at)
VALUES 
('PO-2025-1001', '01', 1, 'ABC Steel Industries', 1, 'Mumbai Plant',
 'High Grade Steel Bars', 500.00, 'MT', NOW(), NOW());

-- ============================================================
-- STEP 3: ADD APPROVED RM IC #1
-- ============================================================
INSERT INTO inspection_calls 
(ic_number, po_no, po_serial_no, type_of_call, desired_inspection_date, 
 company_id, company_name, unit_id, unit_name, unit_address, status, created_at, updated_at)
VALUES 
('RM-IC-2025-0001', 'PO-2025-1001', '01', 'Raw Material', '2025-12-20',
 1, 'ABC Steel Industries', 1, 'Mumbai Plant', 
 'Plant 1, Industrial Area, Mumbai, Maharashtra - 400001', 
 'Approved', NOW(), NOW());

SET @rm_ic_1 = LAST_INSERT_ID();

INSERT INTO rm_inspection_details
(ic_id, heat_numbers, total_offered_qty_mt, offered_qty_erc, manufacturer, created_at, updated_at)
VALUES
(@rm_ic_1, 'HT-2025-001, HT-2025-002', 150.00, 135000, 'ABC Steel Industries', NOW(), NOW());

SET @rm_detail_1 = LAST_INSERT_ID();

INSERT INTO rm_heat_quantities
(rm_detail_id, heat_number, manufacturer, qty_offered_mt, qty_accepted_mt, qty_accepted, created_at, updated_at)
VALUES
(@rm_detail_1, 'HT-2025-001', 'ABC Steel Industries', 80.00, 75.00, 67500, NOW(), NOW()),
(@rm_detail_1, 'HT-2025-002', 'ABC Steel Industries', 70.00, 75.00, 67500, NOW(), NOW());

-- ============================================================
-- STEP 4: ADD APPROVED RM IC #2
-- ============================================================
INSERT INTO inspection_calls 
(ic_number, po_no, po_serial_no, type_of_call, desired_inspection_date, 
 company_id, company_name, unit_id, unit_name, unit_address, status, created_at, updated_at)
VALUES 
('RM-IC-2025-0002', 'PO-2025-1001', '01', 'Raw Material', '2025-12-21',
 1, 'XYZ Steel Corp', 1, 'Mumbai Plant', 
 'Plant 1, Industrial Area, Mumbai, Maharashtra - 400001', 
 'Approved', NOW(), NOW());

SET @rm_ic_2 = LAST_INSERT_ID();

INSERT INTO rm_inspection_details
(ic_id, heat_numbers, total_offered_qty_mt, offered_qty_erc, manufacturer, created_at, updated_at)
VALUES
(@rm_ic_2, 'HT-2025-003, HT-2025-004', 200.00, 180000, 'XYZ Steel Corp', NOW(), NOW());

SET @rm_detail_2 = LAST_INSERT_ID();

INSERT INTO rm_heat_quantities
(rm_detail_id, heat_number, manufacturer, qty_offered_mt, qty_accepted_mt, qty_accepted, created_at, updated_at)
VALUES
(@rm_detail_2, 'HT-2025-003', 'XYZ Steel Corp', 100.00, 100.00, 90000, NOW(), NOW()),
(@rm_detail_2, 'HT-2025-004', 'XYZ Steel Corp', 100.00, 100.00, 90000, NOW(), NOW());

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT '✅ PURCHASE ORDERS' as '';
SELECT po_no, po_serial_no, company_name, material_description 
FROM purchase_orders;

SELECT '✅ APPROVED RM ICs' as '';
SELECT 
    ic.ic_number,
    ic.po_no,
    ic.po_serial_no,
    ic.status,
    rm.heat_numbers,
    rm.offered_qty_erc,
    rm.manufacturer
FROM inspection_calls ic
LEFT JOIN rm_inspection_details rm ON ic.id = rm.ic_id
WHERE ic.type_of_call = 'Raw Material' AND ic.status = 'Approved';

SELECT '✅ HEAT NUMBERS' as '';
SELECT 
    ic.ic_number,
    hq.heat_number,
    hq.manufacturer,
    hq.qty_accepted_mt,
    hq.qty_accepted
FROM inspection_calls ic
JOIN rm_inspection_details rm ON ic.id = rm.ic_id
JOIN rm_heat_quantities hq ON rm.id = hq.rm_detail_id
WHERE ic.type_of_call = 'Raw Material' AND ic.status = 'Approved'
ORDER BY ic.ic_number, hq.heat_number;

SELECT '✅ SUCCESS!' as 'Status', 
       'Fresh mock data added' as 'Message',
       COUNT(*) as 'Total RM ICs' 
FROM inspection_calls 
WHERE type_of_call = 'Raw Material' AND status = 'Approved';

