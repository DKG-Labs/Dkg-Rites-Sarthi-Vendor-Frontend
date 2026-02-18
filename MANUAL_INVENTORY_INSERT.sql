-- ============================================================
-- MANUAL INVENTORY ENTRY INSERTION
-- ============================================================
-- Purpose: Manually insert a new inventory entry into the database
-- Database: rites_erc_inspection
-- Table: inventory_entries
-- Execute this in MySQL Workbench
-- ============================================================

-- Step 1: Select the correct database
USE rites_erc_inspection;

-- Step 2: Verify the table exists and check its structure
DESCRIBE inventory_entries;

-- ============================================================
-- Step 3: ADD 'EXHAUSTED' TO STATUS ENUM
-- ============================================================
-- This ALTER TABLE command adds 'EXHAUSTED' as a valid status value
-- to the existing ENUM: ('FRESH_PO', 'UNDER_INSPECTION', 'ACCEPTED', 'REJECTED')
-- ============================================================

ALTER TABLE inventory_entries
MODIFY COLUMN status ENUM('FRESH_PO', 'UNDER_INSPECTION', 'ACCEPTED', 'REJECTED', 'EXHAUSTED')
NOT NULL DEFAULT 'FRESH_PO';

-- Verify the schema change
SHOW COLUMNS FROM inventory_entries LIKE 'status';

-- ============================================================
-- Step 4: INSERT NEW INVENTORY ENTRY
-- ============================================================
-- IMPORTANT NOTES:
-- 1. Status can now be: 'FRESH_PO', 'UNDER_INSPECTION', 'ACCEPTED', 'REJECTED', 'EXHAUSTED'
-- 2. Using 'EXHAUSTED' to represent inventory that has been fully consumed
-- 3. All NOT NULL fields must have values
-- ============================================================

INSERT INTO inventory_entries (
    vendor_code,
    vendor_name,
    company_id,
    company_name,
    supplier_name,
    unit_name,
    supplier_address,
    raw_material,
    grade_specification,
    length_of_bars,
    heat_number,
    tc_number,
    tc_date,
    tc_quantity,
    sub_po_number,
    sub_po_date,
    sub_po_qty,
    invoice_number,
    invoice_date,
    unit_of_measurement,
    rate_of_material,
    rate_of_gst,
    base_value_po,
    total_po,
    status,
    created_at,
    updated_at
) VALUES (
    '13104',                    -- vendor_code (matches existing vendor)
    'Vendor Name',              -- vendor_name
    1,                          -- company_id
    'XYZ Industries',           -- company_name
    'ABC Supplier',             -- supplier_name
    'Mumbai Unit',              -- unit_name
    'Mumbai',                   -- supplier_address
    'Steel Rod',                -- raw_material
    'IS 2062',                  -- grade_specification (REQUIRED)
    6.00,                       -- length_of_bars (in meters)
    'HN12345',                  -- heat_number (unique identifier)
    'TC789',                    -- tc_number (Test Certificate Number)
    '2025-01-05',               -- tc_date (Test Certificate Date)
    100.000,                    -- tc_quantity (in KG as per unit_of_measurement)
    'PO456',                    -- sub_po_number
    '2025-01-01',               -- sub_po_date
    100.000,                    -- sub_po_qty (in KG)
    'INV001',                   -- invoice_number
    '2025-01-06',               -- invoice_date
    'KG',                       -- unit_of_measurement (KG = Kilograms)
    55.00,                      -- rate_of_material (per KG)
    18.00,                      -- rate_of_gst (18%)
    5500.00,                    -- base_value_po (100 KG × 55)
    6490.00,                    -- total_po (5500 + 18% GST = 6490)
    'EXHAUSTED',                -- status (EXHAUSTED - fully consumed inventory)
    NOW(),                      -- created_at (current timestamp)
    NOW()                       -- updated_at (current timestamp)
);

-- ============================================================
-- Step 4: VERIFY THE INSERTION
-- ============================================================

-- Check if the record was inserted successfully
SELECT 
    id,
    vendor_code,
    raw_material,
    supplier_name,
    grade_specification,
    heat_number,
    tc_number,
    tc_date,
    tc_quantity,
    invoice_number,
    invoice_date,
    unit_of_measurement,
    status,
    created_at
FROM inventory_entries 
WHERE vendor_code = '13104' 
ORDER BY created_at DESC 
LIMIT 1;

-- ============================================================
-- Step 5: ADDITIONAL VERIFICATION QUERIES
-- ============================================================

-- Count total entries for vendor 13104
SELECT COUNT(*) as total_entries
FROM inventory_entries 
WHERE vendor_code = '13104';

-- View all entries for vendor 13104 grouped by status
SELECT 
    status,
    COUNT(*) as count,
    SUM(tc_quantity) as total_quantity
FROM inventory_entries 
WHERE vendor_code = '13104'
GROUP BY status;

-- View the complete record with all fields
SELECT *
FROM inventory_entries 
WHERE vendor_code = '13104' 
AND heat_number = 'HN12345';

-- ============================================================
-- EXPECTED RESULTS:
-- ============================================================
-- After running the ALTER TABLE, you should see:
-- ✅ Query OK message (schema modified)
--
-- After running the INSERT, you should see:
-- ✅ 1 row affected
--
-- After running the verification SELECT, you should see:
-- - raw_material: Steel Rod
-- - supplier_name: ABC Supplier
-- - grade_specification: IS 2062
-- - heat_number: HN12345
-- - tc_number: TC789
-- - tc_quantity: 100.000
-- - unit_of_measurement: KG
-- - status: EXHAUSTED
-- - A valid created_at timestamp
-- ============================================================

-- ============================================================
-- NOTES ON STATUS VALUES:
-- ============================================================
-- Valid status values in the database (after ALTER TABLE):
-- 1. FRESH_PO          - New purchase order, not yet inspected
-- 2. UNDER_INSPECTION  - Currently being inspected
-- 3. ACCEPTED          - Inspection completed and accepted
-- 4. REJECTED          - Inspection completed but rejected
-- 5. EXHAUSTED         - Inventory fully consumed/used up
--
-- The EXHAUSTED status represents inventory entries where all
-- material has been consumed through inspection calls.
-- ============================================================

