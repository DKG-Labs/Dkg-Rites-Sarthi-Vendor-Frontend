# RITES ERC Inspection Database Schema

## 📋 Overview

This directory contains the complete database schema for the RITES ERC (Elastic Rail Clip) Inspection Management System. The schema supports the complete inspection workflow from Raw Material to Process to Final inspection stages.

---

## 📁 Files Structure

```
database/
├── schemas/
│   ├── 00_setup_complete.sql          # Complete setup script (run this first)
│   ├── 01_raw_material_inspection_calls.sql
│   ├── 02_process_inspection_calls.sql
│   └── 03_final_inspection_calls.sql
└── README.md                          # This file
```

---

## 🗄️ Database Tables

### Core Tables

#### 1. **inspection_calls** (Main Table)
- Shared across all inspection types (Raw Material, Process, Final)
- Contains common fields: IC Number, PO details, status, place of inspection
- Auto-generated IC Number format: `RM-IC-2025-0001`, `PROC-IC-2025-0001`, `FINAL-IC-2025-0001`

#### 2. **ic_number_sequences**
- Tracks sequence numbers for auto-generating IC numbers
- Maintains separate sequences for each inspection type
- Automatically resets sequence on year change

### Raw Material Inspection Tables

#### 3. **rm_inspection_details**
- RM-specific details: item description, TC info, invoice details, quantities
- One-to-one relationship with `inspection_calls`

#### 4. **rm_heat_quantities**
- Heat-wise quantity breakdown for each RM inspection
- One-to-many relationship with `rm_inspection_details`
- Tracks accepted/rejected quantities per heat

#### 5. **rm_chemical_analysis**
- Chemical composition data for each heat
- Stores C, Mn, Si, S, P, Cr percentages

### Process Inspection Tables

#### 6. **process_inspection_details**
- Process-specific details: lot number, heat number, quantities
- Links to parent RM inspection call
- One-to-one relationship with `inspection_calls`

#### 7. **process_rm_ic_mapping**
- Maps Process ICs to their parent RM ICs
- Supports multiple RM ICs per Process IC (if needed)

### Final Inspection Tables

#### 8. **final_inspection_details**
- Final inspection summary details
- Links to both RM and Process inspection calls
- Tracks total lots and quantities

#### 9. **final_inspection_lot_details**
- Multiple lot details for each Final inspection
- One-to-many relationship with `final_inspection_details`
- Each lot has its own quantity and heat information

#### 10. **final_process_ic_mapping**
- Maps Final ICs to their parent Process ICs
- Supports multiple Process ICs per Final IC

---

## 🚀 Installation

### Local Development (MySQL)

1. **Install MySQL 8.0+**
   ```bash
   # Windows: Download from https://dev.mysql.com/downloads/mysql/
   # Mac: brew install mysql
   # Linux: sudo apt-get install mysql-server
   ```

2. **Create Database**
   ```sql
   CREATE DATABASE rites_erc_inspection DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE rites_erc_inspection;
   ```

3. **Run Setup Script**
   ```bash
   mysql -u root -p rites_erc_inspection < database/schemas/00_setup_complete.sql
   ```

4. **Verify Installation**
   ```sql
   SHOW TABLES;
   -- Should show 10 tables
   
   SELECT * FROM ic_number_sequences;
   -- Should show 3 rows (RM, Process, Final)
   ```

### Azure MySQL Production

1. **Connect to Azure MySQL**
   ```bash
   mysql -h your-server.mysql.database.azure.com -u your-username@your-server -p
   ```

2. **Select Database**
   ```sql
   USE your_database_name;
   ```

3. **Run Setup Script**
   ```bash
   mysql -h your-server.mysql.database.azure.com -u your-username@your-server -p your_database_name < database/schemas/00_setup_complete.sql
   ```

4. **Verify Installation**
   ```sql
   SHOW TABLES;
   SELECT * FROM ic_number_sequences;
   ```

---

## 📊 IC Number Generation

### Format
- **Raw Material**: `RM-IC-{YEAR}-{SEQUENCE}`
  - Example: `RM-IC-2025-0001`
  
- **Process**: `PROC-IC-{YEAR}-{SEQUENCE}`
  - Example: `PROC-IC-2025-0001`
  
- **Final**: `FINAL-IC-{YEAR}-{SEQUENCE}`
  - Example: `FINAL-IC-2025-0001`

### Sequence Management
- Sequences are maintained in the `ic_number_sequences` table
- Each inspection type has its own sequence
- Sequences reset to 0001 at the start of each year
- Backend API handles sequence increment and IC number generation

---

## 🔗 Relationships

```
inspection_calls (Main)
├── rm_inspection_details (1:1)
│   ├── rm_heat_quantities (1:N)
│   └── rm_chemical_analysis (1:N)
├── process_inspection_details (1:1)
│   └── process_rm_ic_mapping (1:N)
└── final_inspection_details (1:1)
    ├── final_inspection_lot_details (1:N)
    └── final_process_ic_mapping (1:N)
```

---

## 📝 Status Flow

### Raw Material Inspection
1. **Pending** → Vendor submits inspection request
2. **Scheduled** → IE schedules inspection
3. **Under Inspection** → IE conducting inspection
4. **Approved** → Inspection passed (can proceed to Process)
5. **Rejected** → Inspection failed
6. **Completed** → Final status after approval

### Process Inspection
- Can only be created if parent RM IC is **Approved**
- Follows same status flow as RM

### Final Inspection
- Can only be created if parent Process IC is **Approved**
- Follows same status flow as RM and Process

---

## 🔍 Key Indexes

All tables include optimized indexes for:
- Primary keys (auto-increment)
- Foreign keys
- IC numbers
- PO numbers
- Status fields
- Date fields
- Heat numbers, lot numbers, manufacturers

---

## 🛡️ Data Integrity

- **Foreign Key Constraints**: Ensure referential integrity
- **ON DELETE CASCADE**: Child records deleted when parent is deleted
- **ON DELETE RESTRICT**: Prevents deletion if child records exist
- **UNIQUE Constraints**: Prevent duplicate IC numbers
- **NOT NULL Constraints**: Ensure required fields are populated

---

## 📚 Next Steps

1. ✅ Run database setup script
2. ✅ Verify all tables created
3. ✅ Test IC number generation
4. 🔄 Integrate with backend API
5. 🔄 Test complete workflow (RM → Process → Final)
6. 🔄 Deploy to Azure production

---

## 🆘 Support

For issues or questions:
1. Check table structure: `DESCRIBE table_name;`
2. Check indexes: `SHOW INDEX FROM table_name;`
3. Check foreign keys: `SHOW CREATE TABLE table_name;`

