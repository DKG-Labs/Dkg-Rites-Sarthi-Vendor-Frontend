# MySQL Workbench Import Guide

## 📋 Complete Step-by-Step Instructions

Follow these steps to import the RITES ERC Inspection database into MySQL Workbench.

---

## 🔧 Prerequisites

1. ✅ **MySQL Server 8.0+** installed on your system
2. ✅ **MySQL Workbench** installed (Download from: https://dev.mysql.com/downloads/workbench/)
3. ✅ **Database dump file**: `rites_erc_inspection_dump.sql` (located in `database/` folder)

---

## 📂 Method 1: Import Using SQL Script (Recommended)

### Step 1: Open MySQL Workbench

1. Launch **MySQL Workbench** from your applications
2. Click on your **Local MySQL Connection** (usually named "Local instance MySQL80" or similar)
3. Enter your **root password** when prompted
4. You should now see the MySQL Workbench main interface

---

### Step 2: Open the SQL Script

1. Click on **File** menu → **Open SQL Script** (or press `Ctrl+Shift+O`)
2. Navigate to your project folder:
   ```
   C:\Users\hp\OneDrive\Desktop\DKG\ERC RITES\RITES-ERC-main (2)\RITES-ERC-main\database\
   ```
3. Select the file: **`rites_erc_inspection_dump.sql`**
4. Click **Open**

---

### Step 3: Execute the SQL Script

1. You should now see the SQL script content in the editor
2. Click the **⚡ Execute** button (lightning bolt icon) in the toolbar
   - Or press `Ctrl+Shift+Enter`
   - Or click **Query** menu → **Execute (All or Selection)**

3. **Wait for execution to complete** (should take 5-10 seconds)

---

### Step 4: Verify Database Creation

1. In the **Navigator** panel (left side), click the **🔄 Refresh** icon next to "SCHEMAS"
2. You should now see **`rites_erc_inspection`** database in the list
3. Click the **▶** arrow next to `rites_erc_inspection` to expand it
4. Click the **▶** arrow next to **Tables** to expand it
5. **Verify all 10 tables are created:**
   - ✅ `inspection_calls`
   - ✅ `ic_number_sequences`
   - ✅ `rm_inspection_details`
   - ✅ `rm_heat_quantities`
   - ✅ `rm_chemical_analysis`
   - ✅ `process_inspection_details`
   - ✅ `process_rm_ic_mapping`
   - ✅ `final_inspection_details`
   - ✅ `final_inspection_lot_details`
   - ✅ `final_process_ic_mapping`

---

### Step 5: Verify IC Number Sequences

1. In the SQL editor, run this query:
   ```sql
   USE rites_erc_inspection;
   SELECT * FROM ic_number_sequences;
   ```

2. Click the **⚡ Execute** button

3. **Expected Result** - You should see 3 rows:
   ```
   | id | type_of_call  | prefix    | current_year | current_sequence | last_generated_ic |
   |----|---------------|-----------|--------------|------------------|-------------------|
   | 1  | Raw Material  | RM-IC     | 2025         | 0                | NULL              |
   | 2  | Process       | PROC-IC   | 2025         | 0                | NULL              |
   | 3  | Final         | FINAL-IC  | 2025         | 0                | NULL              |
   ```

---

### Step 6: Check Table Structure (Optional)

To view the structure of any table:

1. In the SQL editor, run:
   ```sql
   DESCRIBE inspection_calls;
   ```

2. Or right-click on any table in the Navigator → **Table Inspector**

3. Or right-click on any table → **Alter Table** to see the visual designer

---

## 📂 Method 2: Import Using Data Import Wizard

### Step 1: Open Data Import

1. In MySQL Workbench, click **Server** menu → **Data Import**
2. Select **Import from Self-Contained File**
3. Click the **📁** button and browse to:
   ```
   C:\Users\hp\OneDrive\Desktop\DKG\ERC RITES\RITES-ERC-main (2)\RITES-ERC-main\database\rites_erc_inspection_dump.sql
   ```

---

### Step 2: Configure Import Settings

1. Under **Default Target Schema**, select **New...**
2. Enter schema name: `rites_erc_inspection`
3. Click **OK**

---

### Step 3: Start Import

1. Click **Start Import** button at the bottom right
2. Wait for the import to complete
3. You should see "Import Completed" message

---

### Step 4: Verify Import

1. Click the **🔄 Refresh** icon in the Navigator panel
2. Expand `rites_erc_inspection` database
3. Verify all 10 tables are present

---

## 🧪 Testing the Database

### Test 1: Check All Tables

```sql
USE rites_erc_inspection;
SHOW TABLES;
```

**Expected Output**: 10 tables

---

### Test 2: Check IC Number Sequences

```sql
SELECT * FROM ic_number_sequences;
```

**Expected Output**: 3 rows (RM-IC, PROC-IC, FINAL-IC)

---

### Test 3: Check Table Relationships

```sql
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE 
    TABLE_SCHEMA = 'rites_erc_inspection'
    AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY 
    TABLE_NAME;
```

**Expected Output**: List of all foreign key relationships

---

### Test 4: Check Indexes

```sql
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME
FROM 
    INFORMATION_SCHEMA.STATISTICS
WHERE 
    TABLE_SCHEMA = 'rites_erc_inspection'
ORDER BY 
    TABLE_NAME, INDEX_NAME;
```

**Expected Output**: List of all indexes on all tables

---

## ✅ Success Checklist

After import, verify:

- [x] Database `rites_erc_inspection` is created
- [x] All 10 tables are present
- [x] `ic_number_sequences` table has 3 rows
- [x] All foreign key constraints are created
- [x] All indexes are created
- [x] No errors in the output panel

---

## 🔧 Troubleshooting

### Issue 1: "Access Denied" Error

**Solution**: Make sure you're logged in as `root` user or a user with CREATE DATABASE privileges.

```sql
-- Grant privileges if needed
GRANT ALL PRIVILEGES ON *.* TO 'your_username'@'localhost';
FLUSH PRIVILEGES;
```

---

### Issue 2: "Database Already Exists" Error

**Solution**: The script automatically drops the existing database. If you want to keep existing data:

1. Comment out the DROP DATABASE line in the dump file:
   ```sql
   -- DROP DATABASE IF EXISTS rites_erc_inspection;
   ```

2. Or manually drop the database first:
   ```sql
   DROP DATABASE IF EXISTS rites_erc_inspection;
   ```

---

### Issue 3: "Table Already Exists" Error

**Solution**: Drop all tables and re-run the script:

```sql
USE rites_erc_inspection;
DROP TABLE IF EXISTS final_process_ic_mapping;
DROP TABLE IF EXISTS final_inspection_lot_details;
DROP TABLE IF EXISTS final_inspection_details;
DROP TABLE IF EXISTS process_rm_ic_mapping;
DROP TABLE IF EXISTS process_inspection_details;
DROP TABLE IF EXISTS rm_chemical_analysis;
DROP TABLE IF EXISTS rm_heat_quantities;
DROP TABLE IF EXISTS rm_inspection_details;
DROP TABLE IF EXISTS ic_number_sequences;
DROP TABLE IF EXISTS inspection_calls;
```

Then re-run the dump file.

---

## 🌐 For Azure MySQL Database

### Step 1: Connect to Azure MySQL

1. In MySQL Workbench, click **Database** → **Manage Connections**
2. Click **New** to create a new connection
3. Enter connection details:
   - **Connection Name**: Azure RITES ERC Production
   - **Hostname**: `your-server.mysql.database.azure.com`
   - **Port**: `3306`
   - **Username**: `your-username@your-server`
   - **Password**: Click "Store in Vault" and enter your password

4. Click **Test Connection** to verify
5. Click **OK** to save

---

### Step 2: Import to Azure

1. Connect to your Azure MySQL connection
2. Follow the same steps as Method 1 (Open SQL Script → Execute)
3. Or use command line:
   ```bash
   mysql -h your-server.mysql.database.azure.com -u your-username@your-server -p < rites_erc_inspection_dump.sql
   ```

---

## 📝 Next Steps After Import

1. ✅ **Verify database structure** - Check all tables and relationships
2. ✅ **Test IC number generation** - Backend API will handle this
3. ✅ **Configure backend connection** - Update `application.properties` or connection string
4. ✅ **Run backend API** - Start Spring Boot application
5. ✅ **Test frontend integration** - Test form submissions and data flow

---

## 📞 Support

If you encounter any issues:

1. Check the **Output** panel in MySQL Workbench for error messages
2. Verify MySQL Server is running
3. Check user permissions
4. Ensure MySQL version is 8.0 or higher

---

## 🎉 Success!

Once you see all 10 tables in the Navigator panel and the IC number sequences are initialized, your database is ready to use!

**Next**: Configure your backend API to connect to this database and start testing the inspection call workflow.

