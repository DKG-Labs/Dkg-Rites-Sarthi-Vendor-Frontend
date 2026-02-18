# API Implementation Guide - Inspection Calls

## 📋 Overview

This guide provides detailed API endpoint specifications for implementing the Inspection Call workflow (Raw Material → Process → Final).

---

## 🔧 Technology Stack

- **Backend**: Spring Boot 2.7+ / 3.x (Java 11+/17+)
- **Database**: MySQL 8.0+ / Azure MySQL
- **ORM**: JPA/Hibernate
- **API**: RESTful JSON APIs

---

## 📡 API Endpoints

### 1. Raw Material Inspection Calls

#### 1.1 Create RM Inspection Call

**Endpoint**: `POST /api/inspection-calls/raw-material`

**Request Body**:
```json
{
  "po_no": "PO-2025-1001",
  "po_serial_no": "01",
  "desired_inspection_date": "2025-01-15",
  "company_id": 1,
  "company_name": "Tata Steel",
  "unit_id": 101,
  "unit_name": "Jamshedpur Plant",
  "unit_address": "Jamshedpur, Jharkhand - 831001",
  "remarks": "Urgent inspection required",
  "rm_details": {
    "item_description": "ERC MK-III Clips - Type A",
    "item_quantity": 5000,
    "consignee_zonal_railway": "South Eastern Railway",
    "heat_numbers": "HT-2025-001,HT-2025-002,HT-2025-003",
    "tc_number": "TC-2025-001",
    "tc_date": "2025-01-10",
    "tc_quantity": 5.500,
    "manufacturer": "Tata Steel",
    "supplier_name": "Steel Suppliers Ltd",
    "supplier_address": "Mumbai, Maharashtra",
    "invoice_number": "INV-2025-001",
    "invoice_date": "2025-01-12",
    "sub_po_number": "SUB-PO-2025-001",
    "sub_po_date": "2025-01-05",
    "sub_po_qty": 5000,
    "total_offered_qty_mt": 5.500,
    "offered_qty_erc": 4786,
    "unit_of_measurement": "MT",
    "rate_of_material": 150.00,
    "rate_of_gst": 18.00,
    "base_value_po": 750000.00,
    "total_po": 885000.00
  },
  "heat_quantities": [
    {
      "heat_number": "HT-2025-001",
      "manufacturer": "Tata Steel",
      "offered_qty": 1.500,
      "tc_number": "TC-2025-001",
      "tc_date": "2025-01-10",
      "tc_quantity": 1.500,
      "qty_left": 0.000
    },
    {
      "heat_number": "HT-2025-002",
      "manufacturer": "Tata Steel",
      "offered_qty": 2.250,
      "tc_number": "TC-2025-001",
      "tc_date": "2025-01-10",
      "tc_quantity": 2.250,
      "qty_left": 0.000
    },
    {
      "heat_number": "HT-2025-003",
      "manufacturer": "Tata Steel",
      "offered_qty": 1.750,
      "tc_number": "TC-2025-001",
      "tc_date": "2025-01-10",
      "tc_quantity": 1.750,
      "qty_left": 0.000
    }
  ],
  "chemical_analysis": [
    {
      "heat_number": "HT-2025-001",
      "carbon": 0.550,
      "manganese": 0.750,
      "silicon": 1.750,
      "sulphur": 0.025,
      "phosphorus": 0.030,
      "chromium": 0.200
    },
    {
      "heat_number": "HT-2025-002",
      "carbon": 0.560,
      "manganese": 0.760,
      "silicon": 1.800,
      "sulphur": 0.020,
      "phosphorus": 0.028,
      "chromium": 0.210
    },
    {
      "heat_number": "HT-2025-003",
      "carbon": 0.555,
      "manganese": 0.755,
      "silicon": 1.780,
      "sulphur": 0.022,
      "phosphorus": 0.029,
      "chromium": 0.205
    }
  ],
  "created_by": "vendor_user_123"
}
```

**Response** (Success - 201 Created):
```json
{
  "success": true,
  "message": "Raw Material Inspection Call created successfully",
  "data": {
    "ic_id": 1,
    "ic_number": "RM-IC-2025-0001",
    "po_no": "PO-2025-1001",
    "po_serial_no": "01",
    "type_of_call": "Raw Material",
    "status": "Pending",
    "desired_inspection_date": "2025-01-15",
    "created_at": "2025-12-23T10:30:00Z"
  }
}
```

**Response** (Error - 400 Bad Request):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "desired_inspection_date",
      "message": "Inspection date must be within 7 days from today"
    }
  ]
}
```

---

#### 1.2 Get Approved RM Inspection Calls

**Endpoint**: `GET /api/inspection-calls/raw-material/approved?po_no={poNo}&po_serial_no={poSerialNo}`

**Query Parameters**:
- `po_no` (required): Purchase Order Number
- `po_serial_no` (required): PO Serial Number

**Response** (Success - 200 OK):
```json
{
  "success": true,
  "data": [
    {
      "ic_id": 1,
      "ic_number": "RM-IC-2025-0001",
      "po_no": "PO-2025-1001",
      "po_serial_no": "01",
      "status": "Approved",
      "desired_inspection_date": "2025-01-15",
      "actual_inspection_date": "2025-01-16",
      "company_name": "Tata Steel",
      "unit_name": "Jamshedpur Plant",
      "heat_numbers": ["HT-2025-001", "HT-2025-002", "HT-2025-003"],
      "total_offered_qty_mt": 5.500,
      "offered_qty_erc": 4786
    }
  ]
}
```

---

#### 1.3 Get Heat Numbers from RM IC

**Endpoint**: `GET /api/inspection-calls/raw-material/{icNumber}/heat-numbers`

**Path Parameters**:
- `icNumber`: RM IC Number (e.g., RM-IC-2025-0001)

**Response** (Success - 200 OK):
```json
{
  "success": true,
  "data": {
    "ic_number": "RM-IC-2025-0001",
    "heat_numbers": [
      {
        "heat_number": "HT-2025-001",
        "manufacturer": "Tata Steel",
        "manufacturer_heat": "Tata Steel - HT-2025-001",
        "offered_qty": 1.500,
        "qty_accepted": 1.500,
        "qty_rejected": 0.000,
        "status": "Approved"
      },
      {
        "heat_number": "HT-2025-002",
        "manufacturer": "Tata Steel",
        "manufacturer_heat": "Tata Steel - HT-2025-002",
        "offered_qty": 2.250,
        "qty_accepted": 2.250,
        "qty_rejected": 0.000,
        "status": "Approved"
      }
    ]
  }
}
```

---

### 2. Process Inspection Calls

#### 2.1 Create Process Inspection Call

**Endpoint**: `POST /api/inspection-calls/process`

**Request Body**:
```json
{
  "po_no": "PO-2025-1001",
  "po_serial_no": "01",
  "rm_ic_number": "RM-IC-2025-0001",
  "desired_inspection_date": "2025-01-20",
  "lot_number": "LOT-2025-001",
  "heat_number": "HT-2025-001",
  "manufacturer": "Tata Steel",
  "offered_qty": 1304,
  "remarks": "First lot for process inspection",
  "created_by": "vendor_user_123"
}
```

**Backend Processing**:
1. Validate that `rm_ic_number` exists and status is "Approved"
2. Auto-fetch company, unit details from RM IC
3. Generate new Process IC Number (PROC-IC-2025-0001)
4. Create entry in `inspection_calls` table
5. Create entry in `process_inspection_details` table
6. Create entry in `process_rm_ic_mapping` table

**Response** (Success - 201 Created):
```json
{
  "success": true,
  "message": "Process Inspection Call created successfully",
  "data": {
    "ic_id": 2,
    "ic_number": "PROC-IC-2025-0001",
    "rm_ic_number": "RM-IC-2025-0001",
    "lot_number": "LOT-2025-001",
    "heat_number": "HT-2025-001",
    "manufacturer_heat": "Tata Steel - HT-2025-001",
    "status": "Pending",
    "company_name": "Tata Steel",
    "unit_name": "Jamshedpur Plant"
  }
}
```

---

### 3. Final Inspection Calls

#### 3.1 Create Final Inspection Call

**Endpoint**: `POST /api/inspection-calls/final`

**Request Body**:
```json
{
  "po_no": "PO-2025-1001",
  "po_serial_no": "01",
  "rm_ic_number": "RM-IC-2025-0001",
  "process_ic_number": "PROC-IC-2025-0001",
  "desired_inspection_date": "2025-01-25",
  "lot_details": [
    {
      "lot_number": "LOT-2025-001",
      "heat_number": "HT-2025-001",
      "manufacturer": "Tata Steel",
      "offered_qty": 1000
    },
    {
      "lot_number": "LOT-2025-002",
      "heat_number": "HT-2025-002",
      "manufacturer": "Tata Steel",
      "offered_qty": 1500
    }
  ],
  "remarks": "Final inspection for first batch",
  "created_by": "vendor_user_123"
}
```

**Response** (Success - 201 Created):
```json
{
  "success": true,
  "message": "Final Inspection Call created successfully",
  "data": {
    "ic_id": 3,
    "ic_number": "FINAL-IC-2025-0001",
    "rm_ic_number": "RM-IC-2025-0001",
    "process_ic_number": "PROC-IC-2025-0001",
    "total_lots": 2,
    "total_offered_qty": 2500,
    "status": "Pending"
  }
}
```

---

## 🔐 Validation Rules

### Raw Material IC
- `desired_inspection_date`: Must be within 7 days from today
- `heat_numbers`: At least 1 heat number required
- `total_offered_qty_mt`: Must match sum of heat quantities
- `offered_qty_erc`: Must be calculated correctly based on ERC conversion factor

### Process IC
- `rm_ic_number`: Must exist and status must be "Approved"
- `heat_number`: Must exist in the selected RM IC
- `offered_qty`: Cannot exceed accepted quantity from RM IC

### Final IC
- `rm_ic_number`: Must exist and status must be "Approved"
- `process_ic_number`: Must exist and status must be "Approved"
- `lot_numbers`: Must exist in the selected Process IC
- Total `offered_qty`: Cannot exceed accepted quantity from Process IC

---

## 🔄 IC Number Generation Logic

### Backend Implementation (Pseudo-code)

```java
public String generateICNumber(String typeOfCall) {
    // 1. Get current year
    int currentYear = LocalDate.now().getYear();
    
    // 2. Get sequence from database
    ICNumberSequence sequence = sequenceRepository.findByTypeOfCall(typeOfCall);
    
    // 3. Check if year changed, reset sequence
    if (sequence.getCurrentYear() != currentYear) {
        sequence.setCurrentYear(currentYear);
        sequence.setCurrentSequence(0);
    }
    
    // 4. Increment sequence
    int nextSequence = sequence.getCurrentSequence() + 1;
    sequence.setCurrentSequence(nextSequence);
    
    // 5. Generate IC number
    String prefix = sequence.getPrefix(); // RM-IC, PROC-IC, FINAL-IC
    String icNumber = String.format("%s-%d-%04d", prefix, currentYear, nextSequence);
    
    // 6. Update sequence in database
    sequence.setLastGeneratedIc(icNumber);
    sequenceRepository.save(sequence);
    
    return icNumber;
}
```

---

## 📊 Database Transaction Flow

### Creating RM Inspection Call

```sql
START TRANSACTION;

-- 1. Generate IC Number
UPDATE ic_number_sequences 
SET current_sequence = current_sequence + 1,
    last_generated_ic = CONCAT(prefix, '-', current_year, '-', LPAD(current_sequence + 1, 4, '0'))
WHERE type_of_call = 'Raw Material';

-- 2. Insert into inspection_calls
INSERT INTO inspection_calls (...) VALUES (...);

-- 3. Insert into rm_inspection_details
INSERT INTO rm_inspection_details (...) VALUES (...);

-- 4. Insert heat quantities (multiple rows)
INSERT INTO rm_heat_quantities (...) VALUES (...);

-- 5. Insert chemical analysis (multiple rows)
INSERT INTO rm_chemical_analysis (...) VALUES (...);

COMMIT;
```

---

## 🧪 Testing

### Test Scenarios

1. **Create RM IC** → Verify IC number generated correctly
2. **Create Process IC** → Verify only approved RM ICs are selectable
3. **Create Final IC** → Verify only approved Process ICs are selectable
4. **Year Rollover** → Verify sequence resets to 0001 on new year
5. **Concurrent Requests** → Verify no duplicate IC numbers

---

## 📝 Next Steps

1. Implement entity classes (JPA)
2. Implement repository interfaces
3. Implement service layer with business logic
4. Implement REST controllers
5. Add validation annotations
6. Add exception handling
7. Write unit tests
8. Write integration tests
9. Deploy to staging
10. Deploy to production

