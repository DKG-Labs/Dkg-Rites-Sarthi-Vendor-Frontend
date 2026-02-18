-- ============================================================
-- IC NUMBER FORMAT MIGRATION
-- ============================================================
-- Description: Update IC number generation to new format E[TYPE][MMDD][NNNN]
-- Date: 2026-01-06
-- ============================================================

-- Step 1: Update ic_number_sequences table schema
-- Change from year-based to date-based sequence tracking
ALTER TABLE ic_number_sequences
  DROP COLUMN prefix,
  DROP COLUMN current_year,
  ADD COLUMN current_date DATE NOT NULL DEFAULT (CURDATE()) COMMENT 'Current date for sequence (resets daily)' AFTER type_of_call,
  ADD COLUMN type_code CHAR(1) NOT NULL COMMENT 'Single letter type code (R, P, F)' AFTER type_of_call,
  MODIFY COLUMN current_sequence INT NOT NULL DEFAULT 0 COMMENT 'Current sequence number (resets daily)',
  MODIFY COLUMN last_generated_ic VARCHAR(50) NULL COMMENT 'Last generated IC number (format: E[TYPE][MMDD][NNNN])';

-- Step 2: Update indexes
DROP INDEX idx_current_year ON ic_number_sequences;
CREATE INDEX idx_current_date ON ic_number_sequences (current_date);
CREATE INDEX idx_type_code ON ic_number_sequences (type_code);

-- Step 3: Update existing data with new type codes
UPDATE ic_number_sequences SET type_code = 'R' WHERE type_of_call = 'Raw Material';
UPDATE ic_number_sequences SET type_code = 'P' WHERE type_of_call = 'Process';
UPDATE ic_number_sequences SET type_code = 'F' WHERE type_of_call = 'Final';

-- Step 4: Reset sequences to 0 for fresh start
UPDATE ic_number_sequences SET 
  current_sequence = 0,
  current_date = CURDATE(),
  last_generated_ic = NULL;

-- Step 5: Create a stored procedure for generating IC numbers with daily reset
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS generate_ic_number(
  IN p_type_of_call VARCHAR(50),
  OUT p_ic_number VARCHAR(50)
)
BEGIN
  DECLARE v_type_code CHAR(1);
  DECLARE v_current_date DATE;
  DECLARE v_sequence INT;
  DECLARE v_month CHAR(2);
  DECLARE v_day CHAR(2);
  
  -- Get current date
  SET v_current_date = CURDATE();
  
  -- Get type code
  SELECT type_code INTO v_type_code 
  FROM ic_number_sequences 
  WHERE type_of_call = p_type_of_call;
  
  -- Check if date changed, reset sequence
  UPDATE ic_number_sequences
  SET current_sequence = IF(current_date = v_current_date, current_sequence, 0),
      current_date = v_current_date
  WHERE type_of_call = p_type_of_call;
  
  -- Increment sequence
  UPDATE ic_number_sequences
  SET current_sequence = current_sequence + 1
  WHERE type_of_call = p_type_of_call;
  
  -- Get new sequence
  SELECT current_sequence INTO v_sequence
  FROM ic_number_sequences
  WHERE type_of_call = p_type_of_call;
  
  -- Format date components
  SET v_month = LPAD(MONTH(v_current_date), 2, '0');
  SET v_day = LPAD(DAY(v_current_date), 2, '0');
  
  -- Generate IC number: E + TYPE + - + MMDD + NNNN
  SET p_ic_number = CONCAT('E', v_type_code, '-', v_month, v_day, LPAD(v_sequence, 4, '0'));
  
  -- Update last generated IC
  UPDATE ic_number_sequences
  SET last_generated_ic = p_ic_number
  WHERE type_of_call = p_type_of_call;
  
END$$

DELIMITER ;

-- Step 6: Verify the changes
SELECT 
  id,
  type_of_call,
  type_code,
  current_date,
  current_sequence,
  last_generated_ic,
  updated_at
FROM ic_number_sequences
ORDER BY id;

-- ============================================================
-- NOTES:
-- ============================================================
-- 1. Sequences now reset daily instead of yearly
-- 2. New IC format: E[TYPE]-[MMDD][NNNN]
--    - E = ERC prefix
--    - TYPE = R (Raw Material), P (Process), F (Final)
--    - MMDD = Month and Day (zero-padded)
--    - NNNN = 4-digit sequence (zero-padded)
-- 3. Examples: ER-01060001, EP-01060001, EF-01060001
-- 4. The stored procedure handles automatic daily reset
-- ============================================================

