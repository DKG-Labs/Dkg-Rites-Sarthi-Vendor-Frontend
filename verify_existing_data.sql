-- ============================================================
-- VERIFY EXISTING APPROVED RM ICs IN DATABASE
-- ============================================================
-- Run this in MySQL Workbench to check what data you already have
-- ============================================================

USE rites_erc_inspection;

-- Check approved RM ICs
SELECT 
    ic.ic_number as 'IC Number',
    ic.po_no as 'PO Number',
    ic.po_serial_no as 'PO Serial',
    ic.status as 'Status',
    ic.created_at as 'Created Date'
FROM inspection_calls ic
WHERE ic.type_of_call = 'Raw Material' AND ic.status = 'Approved'
ORDER BY ic.created_at DESC;

-- Check heat numbers for approved RM ICs
SELECT 
    ic.ic_number as 'IC Number',
    hq.heat_number as 'Heat Number',
    hq.manufacturer as 'Manufacturer',
    hq.qty_accepted as 'Accepted Qty (MT)'
FROM inspection_calls ic
JOIN rm_inspection_details rm ON ic.id = rm.ic_id
JOIN rm_heat_quantities hq ON rm.id = hq.rm_detail_id
WHERE ic.type_of_call = 'Raw Material' AND ic.status = 'Approved'
ORDER BY ic.ic_number, hq.heat_number;

-- Summary
SELECT 
    COUNT(*) as 'Total Approved RM ICs'
FROM inspection_calls
WHERE type_of_call = 'Raw Material' AND status = 'Approved';

