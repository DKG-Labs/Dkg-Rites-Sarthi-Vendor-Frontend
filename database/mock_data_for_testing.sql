-- ============================================================
-- MOCK DATA FOR TESTING COMPLETE WORKFLOW
-- ============================================================
-- Purpose: Add sample approved inspection calls to test the workflow
-- Usage: Run this in MySQL Workbench after importing the main dump file
-- ============================================================

USE rites_erc_inspection;

-- ============================================================
-- 1. APPROVED RAW MATERIAL INSPECTION CALLS
-- ============================================================

-- RM IC 1: For PO-2025-1001/01
INSERT INTO inspection_calls 
(ic_number, po_no, po_serial_no, type_of_call, desired_inspection_date, 
 company_id, unit_id, unit_address, status, created_at, updated_at)
VALUES 
('RM-IC-2025-0001', 'PO-2025-1001/01', '001', 'Raw Material', '2025-12-20', 
 1, 1, 'Plant 1, Industrial Area, Mumbai, Maharashtra - 400001', 'Approved', NOW(), NOW());

SET @rm_ic_1_id = LAST_INSERT_ID();

INSERT INTO rm_inspection_details 
(inspection_call_id, ic_number, raw_material_name, rm_offered_qty_mt, 
 rm_tc_number, rm_tc_date, rm_batch_number, rm_remarks)
VALUES 
(@rm_ic_1_id, 'RM-IC-2025-0001', 'Spring Steel Round Bars', 25.5, 
 'TC-2025-001', '2025-12-15', 'BATCH-001', 'First batch of spring steel');

-- Heat quantities for RM IC 1
INSERT INTO rm_heat_quantities 
(inspection_call_id, ic_number, manufacturer_name, heat_number, quantity_mt)
VALUES 
(@rm_ic_1_id, 'RM-IC-2025-0001', 'JSPL', 'HT-2025-001', 12.5),
(@rm_ic_1_id, 'RM-IC-2025-0001', 'JSPL', 'HT-2025-002', 13.0);

-- RM IC 2: For PO-2025-1001/01 (Second batch)
INSERT INTO inspection_calls 
(ic_number, po_no, po_serial_no, type_of_call, desired_inspection_date, 
 company_id, unit_id, unit_address, status, created_at, updated_at)
VALUES 
('RM-IC-2025-0002', 'PO-2025-1001/01', '001', 'Raw Material', '2025-12-22', 
 1, 1, 'Plant 1, Industrial Area, Mumbai, Maharashtra - 400001', 'Approved', NOW(), NOW());

SET @rm_ic_2_id = LAST_INSERT_ID();

INSERT INTO rm_inspection_details 
(inspection_call_id, ic_number, raw_material_name, rm_offered_qty_mt, 
 rm_tc_number, rm_tc_date, rm_batch_number, rm_remarks)
VALUES 
(@rm_ic_2_id, 'RM-IC-2025-0002', 'Spring Steel Round Bars', 30.0, 
 'TC-2025-002', '2025-12-18', 'BATCH-002', 'Second batch of spring steel');

-- Heat quantities for RM IC 2
INSERT INTO rm_heat_quantities 
(inspection_call_id, ic_number, manufacturer_name, heat_number, quantity_mt)
VALUES 
(@rm_ic_2_id, 'RM-IC-2025-0002', 'Tata Steel', 'HT-2025-003', 15.0),
(@rm_ic_2_id, 'RM-IC-2025-0002', 'Tata Steel', 'HT-2025-004', 15.0);

-- ============================================================
-- 2. APPROVED PROCESS INSPECTION CALLS
-- ============================================================

-- Process IC 1: Based on RM-IC-2025-0001
INSERT INTO inspection_calls 
(ic_number, po_no, po_serial_no, type_of_call, desired_inspection_date, 
 company_id, unit_id, unit_address, status, created_at, updated_at)
VALUES 
('PROC-IC-2025-0001', 'PO-2025-1001/01', '001', 'Process', '2025-12-25', 
 1, 1, 'Plant 1, Industrial Area, Mumbai, Maharashtra - 400001', 'Approved', NOW(), NOW());

SET @proc_ic_1_id = LAST_INSERT_ID();

INSERT INTO process_inspection_details 
(inspection_call_id, ic_number, process_offered_qty, process_lot_number, process_remarks)
VALUES 
(@proc_ic_1_id, 'PROC-IC-2025-0001', 5000, 'LOT-2025-001', 'First process batch');

-- Map to RM IC
INSERT INTO process_rm_ic_mapping 
(process_ic_number, rm_ic_number)
VALUES 
('PROC-IC-2025-0001', 'RM-IC-2025-0001');

-- Process IC 2: Based on RM-IC-2025-0002
INSERT INTO inspection_calls 
(ic_number, po_no, po_serial_no, type_of_call, desired_inspection_date, 
 company_id, unit_id, unit_address, status, created_at, updated_at)
VALUES 
('PROC-IC-2025-0002', 'PO-2025-1001/01', '001', 'Process', '2025-12-26', 
 1, 1, 'Plant 1, Industrial Area, Mumbai, Maharashtra - 400001', 'Approved', NOW(), NOW());

SET @proc_ic_2_id = LAST_INSERT_ID();

INSERT INTO process_inspection_details 
(inspection_call_id, ic_number, process_offered_qty, process_lot_number, process_remarks)
VALUES 
(@proc_ic_2_id, 'PROC-IC-2025-0002', 6000, 'LOT-2025-002', 'Second process batch');

-- Map to RM IC
INSERT INTO process_rm_ic_mapping 
(process_ic_number, rm_ic_number)
VALUES 
('PROC-IC-2025-0002', 'RM-IC-2025-0002');

-- ============================================================
-- 3. COMPLETED FINAL INSPECTION CALL (For display in dashboard)
-- ============================================================

-- Final IC 1: Based on Process ICs
INSERT INTO inspection_calls 
(ic_number, po_no, po_serial_no, type_of_call, desired_inspection_date, 
 company_id, unit_id, unit_address, status, created_at, updated_at)
VALUES 
('FINAL-IC-2025-0001', 'PO-2025-1001/01', '001', 'Final', '2025-12-28', 
 1, 1, 'Plant 1, Industrial Area, Mumbai, Maharashtra - 400001', 'Approved', NOW(), NOW());

SET @final_ic_1_id = LAST_INSERT_ID();

INSERT INTO final_inspection_details 
(inspection_call_id, ic_number, final_total_erc_qty, final_hdpe_bags, final_remarks)
VALUES 
(@final_ic_1_id, 'FINAL-IC-2025-0001', 10000, 50, 'Final inspection completed successfully');

-- Lot details for Final IC
INSERT INTO final_inspection_lot_details 
(inspection_call_id, ic_number, lot_number, manufacturer_heat, offered_qty_erc)
VALUES 
(@final_ic_1_id, 'FINAL-IC-2025-0001', 'LOT-2025-001', 'JSPL - HT-2025-001', 5000),
(@final_ic_1_id, 'FINAL-IC-2025-0001', 'LOT-2025-002', 'Tata Steel - HT-2025-003', 5000);

-- Map to Process ICs
INSERT INTO final_process_ic_mapping 
(final_ic_number, process_ic_number)
VALUES 
('FINAL-IC-2025-0001', 'PROC-IC-2025-0001'),
('FINAL-IC-2025-0001', 'PROC-IC-2025-0002');

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check all inspection calls
SELECT 
    ic_number, 
    type_of_call, 
    po_no, 
    status, 
    desired_inspection_date,
    created_at
FROM inspection_calls
ORDER BY created_at;

-- Check RM inspection details with heat quantities
SELECT 
    ic.ic_number,
    ic.status,
    rm.raw_material_name,
    rm.rm_offered_qty_mt,
    GROUP_CONCAT(CONCAT(hq.manufacturer_name, ' - ', hq.heat_number, ' (', hq.quantity_mt, ' MT)') SEPARATOR ', ') as heat_numbers
FROM inspection_calls ic
LEFT JOIN rm_inspection_details rm ON ic.ic_number = rm.ic_number
LEFT JOIN rm_heat_quantities hq ON ic.ic_number = hq.ic_number
WHERE ic.type_of_call = 'Raw Material'
GROUP BY ic.ic_number;

-- Check Process inspection details
SELECT 
    ic.ic_number,
    ic.status,
    proc.process_lot_number,
    proc.process_offered_qty,
    GROUP_CONCAT(prm.rm_ic_number SEPARATOR ', ') as linked_rm_ics
FROM inspection_calls ic
LEFT JOIN process_inspection_details proc ON ic.ic_number = proc.ic_number
LEFT JOIN process_rm_ic_mapping prm ON ic.ic_number = prm.process_ic_number
WHERE ic.type_of_call = 'Process'
GROUP BY ic.ic_number;

-- Check Final inspection details
SELECT 
    ic.ic_number,
    ic.status,
    final.final_total_erc_qty,
    final.final_hdpe_bags,
    GROUP_CONCAT(DISTINCT fpm.process_ic_number SEPARATOR ', ') as linked_process_ics,
    GROUP_CONCAT(DISTINCT CONCAT(lot.lot_number, ' (', lot.offered_qty_erc, ' ERC)') SEPARATOR ', ') as lot_details
FROM inspection_calls ic
LEFT JOIN final_inspection_details final ON ic.ic_number = final.ic_number
LEFT JOIN final_process_ic_mapping fpm ON ic.ic_number = fpm.final_ic_number
LEFT JOIN final_inspection_lot_details lot ON ic.ic_number = lot.ic_number
WHERE ic.type_of_call = 'Final'
GROUP BY ic.ic_number;

