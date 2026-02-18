-- ============================================================
-- QUICK ADD MOCK DATA - Copy & Paste into MySQL Workbench
-- ============================================================
-- Instructions:
-- 1. Open MySQL Workbench
-- 2. Connect to your local MySQL
-- 3. Copy this ENTIRE file
-- 4. Paste into a new SQL tab
-- 5. Click Execute (⚡) or press Ctrl+Shift+Enter
-- ============================================================

USE rites_erc_inspection;

-- Clean up existing mock data (if any)
DELETE FROM rm_chemical_analysis WHERE rm_detail_id IN (
    SELECT id FROM rm_inspection_details WHERE ic_id IN (
        SELECT id FROM inspection_calls WHERE ic_number IN ('RM-IC-2025-0001', 'RM-IC-2025-0002')
    )
);

DELETE FROM rm_heat_quantities WHERE rm_detail_id IN (
    SELECT id FROM rm_inspection_details WHERE ic_id IN (
        SELECT id FROM inspection_calls WHERE ic_number IN ('RM-IC-2025-0001', 'RM-IC-2025-0002')
    )
);

DELETE FROM rm_inspection_details WHERE ic_id IN (
    SELECT id FROM inspection_calls WHERE ic_number IN ('RM-IC-2025-0001', 'RM-IC-2025-0002')
    )
);

DELETE FROM inspection_calls WHERE ic_number IN ('RM-IC-2025-0001', 'RM-IC-2025-0002');

-- ============================================================
-- Add Approved RM IC #1
-- ============================================================

INSERT INTO inspection_calls 
(ic_number, po_no, po_serial_no, type_of_call, desired_inspection_date, 
 company_id, company_name, unit_id, unit_name, unit_address, 
 status, created_at, updated_at)
VALUES 
('RM-IC-2025-0001', 'PO-2025-1001', 'PO-2025-1001/01', 'Raw Material', '2025-12-20',
 1, 'ABC Industries Pvt Ltd', 102, 'Unit 2 - Pune', 'Plot 5, Chakan MIDC, Pune - 410501',
 'Approved', '2025-12-20 10:00:00', '2025-12-22 15:30:00');

SET @rm_ic_1_id = LAST_INSERT_ID();

INSERT INTO rm_inspection_details 
(ic_id, item_description, item_quantity, consignee_zonal_railway,
 heat_numbers, tc_number, tc_date, tc_quantity, manufacturer,
 supplier_name, supplier_address, invoice_number, invoice_date,
 sub_po_number, sub_po_date, sub_po_qty,
 total_offered_qty_mt, offered_qty_erc, unit_of_measurement,
 rate_of_material, rate_of_gst, base_value_po, total_po)
VALUES 
(@rm_ic_1_id, 'ERC MK-III Clips', 5000, 'Central Railway',
 'BN-2025-045, BN-2025-046', 'TC-45680', '2025-11-18', 200, 'ABC Suppliers Pvt Ltd',
 'XYZ Steel Suppliers', '123 Industrial Area, Mumbai - 400001', 'INV-2025-1003', '2025-11-17',
 'SPO-2025-103', '2025-11-15', 10000,
 200, 173913, 'MT',
 1500.00, 18.00, 300000.00, 354000.00);

SET @rm_detail_1_id = LAST_INSERT_ID();

INSERT INTO rm_heat_quantities 
(rm_detail_id, heat_number, manufacturer, offered_qty, tc_number, tc_date, tc_quantity,
 qty_accepted, qty_rejected)
VALUES 
(@rm_detail_1_id, 'BN-2025-045', 'ABC Suppliers Pvt Ltd', 100.000, 'TC-45680', '2025-11-18', 100.000,
 95.000, 5.000),
(@rm_detail_1_id, 'BN-2025-046', 'ABC Suppliers Pvt Ltd', 100.000, 'TC-45681', '2025-11-18', 100.000,
 98.000, 2.000);

INSERT INTO rm_chemical_analysis 
(rm_detail_id, heat_number, carbon, manganese, silicon, sulphur, phosphorus, chromium)
VALUES 
(@rm_detail_1_id, 'BN-2025-045', 0.20, 0.20, 0.20, 0.30, 0.65, 0.65),
(@rm_detail_1_id, 'BN-2025-046', 0.22, 0.21, 0.19, 0.28, 0.63, 0.67);

-- ============================================================
-- Add Approved RM IC #2
-- ============================================================

INSERT INTO inspection_calls 
(ic_number, po_no, po_serial_no, type_of_call, desired_inspection_date, 
 company_id, company_name, unit_id, unit_name, unit_address, 
 status, created_at, updated_at)
VALUES 
('RM-IC-2025-0002', 'PO-2025-1001', 'PO-2025-1001/01', 'Raw Material', '2025-12-21',
 1, 'ABC Industries Pvt Ltd', 102, 'Unit 2 - Pune', 'Plot 5, Chakan MIDC, Pune - 410501',
 'Approved', '2025-12-21 11:00:00', '2025-12-22 16:45:00');

SET @rm_ic_2_id = LAST_INSERT_ID();

INSERT INTO rm_inspection_details 
(ic_id, item_description, item_quantity, consignee_zonal_railway,
 heat_numbers, tc_number, tc_date, tc_quantity, manufacturer,
 supplier_name, supplier_address, invoice_number, invoice_date,
 sub_po_number, sub_po_date, sub_po_qty,
 total_offered_qty_mt, offered_qty_erc, unit_of_measurement,
 rate_of_material, rate_of_gst, base_value_po, total_po)
VALUES 
(@rm_ic_2_id, 'ERC MK-III Clips', 5000, 'Central Railway',
 'BN-2025-047', 'TC-45682', '2025-11-19', 150, 'DEF Steel Works',
 'XYZ Steel Suppliers', '123 Industrial Area, Mumbai - 400001', 'INV-2025-1004', '2025-11-18',
 'SPO-2025-104', '2025-11-16', 8000,
 150, 130435, 'MT',
 1500.00, 18.00, 225000.00, 265500.00);

SET @rm_detail_2_id = LAST_INSERT_ID();

INSERT INTO rm_heat_quantities 
(rm_detail_id, heat_number, manufacturer, offered_qty, tc_number, tc_date, tc_quantity,
 qty_accepted, qty_rejected)
VALUES 
(@rm_detail_2_id, 'BN-2025-047', 'DEF Steel Works', 150.000, 'TC-45682', '2025-11-19', 150.000,
 145.000, 5.000);

INSERT INTO rm_chemical_analysis 
(rm_detail_id, heat_number, carbon, manganese, silicon, sulphur, phosphorus, chromium)
VALUES 
(@rm_detail_2_id, 'BN-2025-047', 0.21, 0.22, 0.18, 0.29, 0.64, 0.66);

-- ============================================================
-- Verify Data
-- ============================================================

SELECT '✅ Mock Data Added Successfully!' as Status;

SELECT 
    ic.ic_number as 'IC Number',
    ic.po_no as 'PO Number',
    ic.status as 'Status',
    rm.heat_numbers as 'Heat Numbers',
    rm.offered_qty_erc as 'Offered (ERCs)',
    GROUP_CONCAT(DISTINCT hq.heat_number) as 'Heat List',
    SUM(hq.qty_accepted) as 'Total Accepted (MT)'
FROM inspection_calls ic
LEFT JOIN rm_inspection_details rm ON ic.id = rm.ic_id
LEFT JOIN rm_heat_quantities hq ON rm.id = hq.rm_detail_id
WHERE ic.type_of_call = 'Raw Material' AND ic.status = 'Approved'
GROUP BY ic.id
ORDER BY ic.created_at DESC;

-- ============================================================
-- DONE! You can now test the Process IC flow
-- ============================================================

