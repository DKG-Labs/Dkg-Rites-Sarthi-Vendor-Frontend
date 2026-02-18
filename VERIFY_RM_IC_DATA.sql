-- ============================================================
-- VERIFY RM IC DATA FOR PROCESS IC TESTING
-- ============================================================

USE rites_erc_inspection;

-- Check all approved RM ICs
SELECT 
    ic.id,
    ic.ic_number,
    ic.po_no,
    ic.po_serial_no,
    ic.type_of_call,
    ic.status,
    ic.created_at
FROM inspection_calls ic
WHERE ic.type_of_call = 'Raw Material' 
  AND ic.status = 'Approved'
ORDER BY ic.created_at DESC;

-- Check RM inspection details
SELECT 
    ic.ic_number,
    rm.heat_numbers,
    rm.total_offered_qty_mt,
    rm.offered_qty_erc,
    rm.manufacturer
FROM inspection_calls ic
LEFT JOIN rm_inspection_details rm ON ic.id = rm.ic_id
WHERE ic.type_of_call = 'Raw Material' 
  AND ic.status = 'Approved'
ORDER BY ic.created_at DESC;

-- Check heat quantities
SELECT 
    ic.ic_number,
    hq.heat_number,
    hq.manufacturer,
    hq.qty_accepted_mt,
    hq.qty_accepted
FROM inspection_calls ic
JOIN rm_inspection_details rm ON ic.id = rm.ic_id
JOIN rm_heat_quantities hq ON rm.id = hq.rm_detail_id
WHERE ic.type_of_call = 'Raw Material' 
  AND ic.status = 'Approved'
ORDER BY ic.ic_number, hq.heat_number;

-- Test the exact query used by the API
SELECT
    ic.id,
    ic.ic_number,
    ic.po_no,
    ic.po_serial_no,
    ic.company_id,
    ic.company_name,
    ic.unit_id,
    ic.unit_name,
    ic.unit_address,
    ic.status,
    ic.created_at,
    rm.heat_numbers,
    rm.total_offered_qty_mt,
    rm.offered_qty_erc,
    rm.manufacturer
FROM inspection_calls ic
LEFT JOIN rm_inspection_details rm ON ic.id = rm.ic_id
WHERE ic.type_of_call = 'Raw Material'
  AND ic.status = 'Approved'
  AND ic.po_no = 'PO-2025-1001'
ORDER BY ic.created_at DESC;

