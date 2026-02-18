USE rites_erc_inspection;

-- What PO numbers exist in inspection_calls?
SELECT DISTINCT po_no, po_serial_no 
FROM inspection_calls 
ORDER BY po_no;

-- What approved RM ICs exist?
SELECT ic_number, po_no, po_serial_no, status, type_of_call
FROM inspection_calls
WHERE type_of_call = 'Raw Material'
ORDER BY created_at DESC
LIMIT 10;

-- Count of approved RM ICs
SELECT COUNT(*) as total_approved_rm_ics
FROM inspection_calls
WHERE type_of_call = 'Raw Material' AND status = 'Approved';

