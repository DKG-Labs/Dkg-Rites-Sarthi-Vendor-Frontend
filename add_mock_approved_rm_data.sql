-- ============================================================
-- ADD MOCK APPROVED RAW MATERIAL INSPECTION CALLS
-- ============================================================
-- This script adds sample approved RM inspection calls
-- that can be used for raising Process Inspection Calls
-- ============================================================

USE rites_erc_inspection;

-- ============================================================
-- STEP 1: Add Mock Approved RM Inspection Call #1
-- ============================================================

-- Insert into inspection_calls table
INSERT INTO inspection_calls 
(ic_number, po_no, po_serial_no, type_of_call, desired_inspection_date, 
 company_id, company_name, unit_id, unit_name, unit_address, 
 status, created_at, updated_at)
VALUES 
('RM-IC-2025-0001', 'PO-2025-1001', 'PO-2025-1001/01', 'Raw Material', '2025-12-20',
 1, 'ABC Industries Pvt Ltd', 102, 'Unit 2 - Pune', 'Plot 5, Chakan MIDC, Pune - 410501',
 'Approved', '2025-12-20 10:00:00', '2025-12-22 15:30:00');

SET @rm_ic_1_id = LAST_INSERT_ID();

-- Insert into rm_inspection_details table
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

-- Insert heat quantities
INSERT INTO rm_heat_quantities 
(rm_detail_id, heat_number, manufacturer, offered_qty, tc_number, tc_date, tc_quantity,
 qty_accepted, qty_rejected)
VALUES 
(@rm_detail_1_id, 'BN-2025-045', 'ABC Suppliers Pvt Ltd', 100.000, 'TC-45680', '2025-11-18', 100.000,
 95.000, 5.000),
(@rm_detail_1_id, 'BN-2025-046', 'ABC Suppliers Pvt Ltd', 100.000, 'TC-45681', '2025-11-18', 100.000,
 98.000, 2.000);

-- Insert chemical analysis
INSERT INTO rm_chemical_analysis 
(rm_detail_id, heat_number, carbon, manganese, silicon, sulphur, phosphorus, chromium)
VALUES 
(@rm_detail_1_id, 'BN-2025-045', 0.20, 0.20, 0.20, 0.30, 0.65, 0.65),
(@rm_detail_1_id, 'BN-2025-046', 0.22, 0.21, 0.19, 0.28, 0.63, 0.67);

-- ============================================================
-- STEP 2: Add Mock Approved RM Inspection Call #2
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
-- STEP 3: Verify Data
-- ============================================================

SELECT 
    ic.ic_number,
    ic.po_no,
    ic.status,
    rm.heat_numbers,
    rm.total_offered_qty_mt,
    rm.offered_qty_erc,
    GROUP_CONCAT(DISTINCT hq.heat_number) as heat_list,
    SUM(hq.qty_accepted) as total_accepted_qty
FROM inspection_calls ic
LEFT JOIN rm_inspection_details rm ON ic.id = rm.ic_id
LEFT JOIN rm_heat_quantities hq ON rm.id = hq.rm_detail_id
WHERE ic.type_of_call = 'Raw Material' AND ic.status = 'Approved'
GROUP BY ic.id
ORDER BY ic.created_at DESC;

-- ============================================================
-- MOCK DATA ADDED SUCCESSFULLY
-- ============================================================
-- Total Approved RM ICs: 2
-- RM-IC-2025-0001: 2 heats (BN-2025-045, BN-2025-046)
-- RM-IC-2025-0002: 1 heat (BN-2025-047)
-- ============================================================

