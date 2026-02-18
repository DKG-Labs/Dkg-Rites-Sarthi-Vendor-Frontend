export const PRODUCT_TYPE_DISPLAY_NAMES = {
  'Raw Material': 'ERC-RAW MATERIAL',
  'ERC Process': 'ERC-PROCESS MATERIAL',
  'Final Product': 'ERC-FINAL'
};

export const MOCK_INSPECTION_CALLS = [
  { id: "IC001", call_no: "CALL-2025-001", po_no: "PO-2025-1001", vendor_name: "Steel Supplies Ltd", requested_date: "2025-11-15", status: "Pending", product_type: "Raw Material", stage: "RM", po_date: "2025-10-15", po_qty: 5000, call_qty: 500, rate: 15000, place_of_inspection: "Factory", delivery_period: "30 days" },
  { id: "IC002", call_no: "CALL-2025-002", po_no: "PO-2025-1002", vendor_name: "Premium Materials Inc", requested_date: "2025-11-16", status: "Pending", product_type: "ERC Process", stage: "Process Inspection", po_date: "2025-10-20", po_qty: 3000, call_qty: 400, rate: 18000, place_of_inspection: "Vendor Site", delivery_period: "45 days" },
  { id: "IC003", call_no: "CALL-2025-003", po_no: "PO-2025-1003", vendor_name: "Quality Metals Co", requested_date: "2025-11-17", status: "Pending", product_type: "Final Product", stage: "Final", po_date: "2025-10-25", po_qty: 2000, call_qty: 300, rate: 22000, place_of_inspection: "Factory", delivery_period: "60 days" },
  { id: "IC004", call_no: "CALL-2025-004", po_no: "PO-2025-1004", vendor_name: "Superior Steel Works", requested_date: "2025-11-13", status: "Completed", product_type: "Raw Material", stage: "RM", po_date: "2025-10-10", po_qty: 4000, call_qty: 350, rate: 16000, place_of_inspection: "Factory", delivery_period: "30 days" },
  { id: "IC005", call_no: "CALL-2025-005", po_no: "PO-2025-1005", vendor_name: "Global Materials Corp", requested_date: "2025-11-12", status: "Completed", product_type: "ERC Process", stage: "Process Inspection", po_date: "2025-10-12", po_qty: 6000, call_qty: 600, rate: 17000, place_of_inspection: "Vendor Site", delivery_period: "40 days" },
  { id: "IC006", call_no: "CALL-2025-006", po_no: "PO-2025-1006", vendor_name: "Elite Steel Inc", requested_date: "2025-11-18", status: "Pending", product_type: "Raw Material", stage: "RM", po_date: "2025-10-18", po_qty: 3500, call_qty: 450, rate: 15500, place_of_inspection: "Factory", delivery_period: "35 days" },
  { id: "IC007", call_no: "CALL-2025-007", po_no: "PO-2025-1007", vendor_name: "Precision Materials", requested_date: "2025-11-19", status: "Pending", product_type: "Final Product", stage: "Final", po_date: "2025-10-22", po_qty: 2500, call_qty: 320, rate: 21000, place_of_inspection: "Factory", delivery_period: "50 days" },
];

export const MOCK_PO_DATA = {
  "PO-2025-1001": {
    po_no: "PO-2025-1001",
    po_date: "2025-10-15",
    po_amend_no: "1, 2",
    po_amend_dates: "2025-10-20, 2025-10-25",
    product_name: "ERC Connecting Rods",
    pl_no: "PL-2025-001",
    vendor_name: "Quality Metals Ltd",
    contractor: "Steel Contractors Pvt Ltd",
    manufacturer: "Steel Works Manufacturing Ltd",
    purchasing_authority: "Manager, Procurement",
    bpo: "BPO-001",
    po_qty: 5000,
    delivery_period: "30 days",
    place_of_inspection: "Factory - Vendor Site",
    inspection_fees_payment: "Advance payment received on 2025-10-18",
    sub_po_no: "SUB-PO-2025-001",
    sub_po_date: "2025-10-16"
  },
  "PO-2025-1002": {
    po_no: "PO-2025-1002",
    po_date: "2025-10-20",
    po_amend_no: "1",
    po_amend_dates: "2025-10-28",
    product_name: "ERC Process Material",
    pl_no: "PL-2025-002",
    vendor_name: "Premium Materials Inc",
    contractor: "Premium Contractors Ltd",
    manufacturer: "Premium Manufacturing Co",
    purchasing_authority: "Director, Operations",
    bpo: "BPO-002",
    po_qty: 3000,
    delivery_period: "45 days",
    place_of_inspection: "Vendor Site",
    inspection_fees_payment: "Advance payment received on 2025-10-22",
    sub_po_no: "SUB-PO-2025-002",
    sub_po_date: "2025-10-21"
  }
};

export const CALIBRATION_DATA = [
  { instrument: "Hardness Tester (HRC)", due_date: "2025-11-25", status: "Valid" },
  { instrument: "Grain Size Reader", due_date: "2025-11-20", status: "Valid" },
  { instrument: "Dimensional Gauge", due_date: "2025-11-10", status: "Expired" },
  { instrument: "Temperature Sensor", due_date: "2025-12-05", status: "Valid" },
];

export const PERFORMANCE_METRICS = {
  total_inspections: 45,
  completed_percentage: 88,
  average_time: 2.5,
  pending_calls: 5,
  acceptance_percentage: 92,
  rejection_percentage: 8,
  response_time_hours: 1.8,
  scheduling_delay_days: 2,
  call_cancellations: 3,
  ic_delay_days: 1.2
};
