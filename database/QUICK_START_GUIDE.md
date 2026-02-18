# Quick Start Guide - Database Setup

## ⚡ 5-Minute Setup

### 1️⃣ Open MySQL Workbench
- Launch MySQL Workbench
- Connect to your local MySQL instance
- Enter root password

### 2️⃣ Import Database
- Click **File** → **Open SQL Script**
- Select: `database/rites_erc_inspection_dump.sql`
- Click **⚡ Execute** button (or press `Ctrl+Shift+Enter`)

### 3️⃣ Verify
```sql
USE rites_erc_inspection;
SHOW TABLES;
SELECT * FROM ic_number_sequences;
```

**Expected**: 10 tables + 3 sequence rows

---

## 📁 Files You Need

| File | Purpose |
|------|---------|
| `rites_erc_inspection_dump.sql` | **Main database dump file** - Import this in MySQL Workbench |
| `MYSQL_WORKBENCH_IMPORT_GUIDE.md` | Detailed step-by-step instructions with screenshots guide |
| `QUICK_START_GUIDE.md` | This file - Quick reference |

---

## 🗄️ Database Structure

```
rites_erc_inspection (Database)
├── inspection_calls (Main table - all IC types)
├── ic_number_sequences (Auto-generation tracking)
├── Raw Material Tables:
│   ├── rm_inspection_details
│   ├── rm_heat_quantities
│   └── rm_chemical_analysis
├── Process Tables:
│   ├── process_inspection_details
│   └── process_rm_ic_mapping
└── Final Tables:
    ├── final_inspection_details
    ├── final_inspection_lot_details
    └── final_process_ic_mapping
```

**Total: 10 Tables**

---

## 🔢 IC Number Format

| Type | Format | Example |
|------|--------|---------|
| Raw Material | `RM-IC-YYYY-NNNN` | `RM-IC-2025-0001` |
| Process | `PROC-IC-YYYY-NNNN` | `PROC-IC-2025-0001` |
| Final | `FINAL-IC-YYYY-NNNN` | `FINAL-IC-2025-0001` |

---

## 🔄 Workflow

```
Raw Material IC (RM-IC-2025-0001)
    ↓ (Status: Approved)
Process IC (PROC-IC-2025-0001)
    ↓ (Status: Approved)
Final IC (FINAL-IC-2025-0001)
    ↓ (Status: Approved)
Completed ✅
```

---

## 🧪 Quick Test Queries

### Check Database
```sql
USE rites_erc_inspection;
SHOW TABLES;
```

### Check Sequences
```sql
SELECT * FROM ic_number_sequences;
```

### Check Table Structure
```sql
DESCRIBE inspection_calls;
```

### Check Foreign Keys
```sql
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE 
    TABLE_SCHEMA = 'rites_erc_inspection'
    AND REFERENCED_TABLE_NAME IS NOT NULL;
```

---

## 🌐 Azure MySQL Setup

### Command Line Import
```bash
mysql -h your-server.mysql.database.azure.com -u your-username@your-server -p < database/rites_erc_inspection_dump.sql
```

### Connection String (Spring Boot)
```properties
spring.datasource.url=jdbc:mysql://your-server.mysql.database.azure.com:3306/rites_erc_inspection?useSSL=true&requireSSL=true
spring.datasource.username=your-username@your-server
spring.datasource.password=your-password
spring.jpa.hibernate.ddl-auto=none
```

---

## ✅ Success Checklist

After import, you should have:

- [x] Database `rites_erc_inspection` created
- [x] 10 tables visible in Navigator
- [x] 3 rows in `ic_number_sequences` table
- [x] All foreign keys and indexes created
- [x] No errors in output panel

---

## 🚀 Next Steps

1. ✅ **Database Setup** - Import dump file (you are here)
2. 🔄 **Backend API** - Implement REST endpoints (see `API_IMPLEMENTATION_GUIDE.md`)
3. 🔄 **Frontend Integration** - Connect forms to API
4. 🔄 **Testing** - End-to-end workflow testing
5. 🔄 **Deployment** - Deploy to Azure production

---

## 📞 Need Help?

- **Detailed Instructions**: See `MYSQL_WORKBENCH_IMPORT_GUIDE.md`
- **API Implementation**: See `API_IMPLEMENTATION_GUIDE.md`
- **Database Schema**: See `README.md`
- **Implementation Summary**: See `IMPLEMENTATION_SUMMARY.md`

---

## 🎯 File Locations

```
database/
├── rites_erc_inspection_dump.sql          ← Import this file
├── MYSQL_WORKBENCH_IMPORT_GUIDE.md        ← Detailed steps
├── QUICK_START_GUIDE.md                   ← This file
├── API_IMPLEMENTATION_GUIDE.md            ← Backend API guide
├── README.md                              ← Database documentation
└── IMPLEMENTATION_SUMMARY.md              ← Complete summary
```

---

## 💡 Pro Tips

1. **Backup First**: If you have existing data, backup before importing
2. **Use Transactions**: The dump file uses transactions for safety
3. **Check Logs**: Always check the output panel for errors
4. **Test Locally**: Test on local MySQL before deploying to Azure
5. **Version Control**: Keep the dump file in version control

---

## 🔧 Common Commands

### Drop Database (if needed)
```sql
DROP DATABASE IF EXISTS rites_erc_inspection;
```

### Recreate Database
```sql
CREATE DATABASE rites_erc_inspection DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Show All Databases
```sql
SHOW DATABASES;
```

### Use Database
```sql
USE rites_erc_inspection;
```

### Show All Tables
```sql
SHOW TABLES;
```

### Count Records in All Tables
```sql
SELECT 'inspection_calls' AS table_name, COUNT(*) AS count FROM inspection_calls
UNION ALL
SELECT 'ic_number_sequences', COUNT(*) FROM ic_number_sequences
UNION ALL
SELECT 'rm_inspection_details', COUNT(*) FROM rm_inspection_details
UNION ALL
SELECT 'rm_heat_quantities', COUNT(*) FROM rm_heat_quantities
UNION ALL
SELECT 'rm_chemical_analysis', COUNT(*) FROM rm_chemical_analysis
UNION ALL
SELECT 'process_inspection_details', COUNT(*) FROM process_inspection_details
UNION ALL
SELECT 'process_rm_ic_mapping', COUNT(*) FROM process_rm_ic_mapping
UNION ALL
SELECT 'final_inspection_details', COUNT(*) FROM final_inspection_details
UNION ALL
SELECT 'final_inspection_lot_details', COUNT(*) FROM final_inspection_lot_details
UNION ALL
SELECT 'final_process_ic_mapping', COUNT(*) FROM final_process_ic_mapping;
```

---

**Ready to start? Open MySQL Workbench and import `rites_erc_inspection_dump.sql`!** 🚀

