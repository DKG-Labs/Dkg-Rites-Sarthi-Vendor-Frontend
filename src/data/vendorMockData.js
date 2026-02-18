// src/data/vendorMockData.js

// Mock data for Vendor module - purely frontend only.
// Later you can replace these with API calls to Spring Boot + MySQL.

export const VENDOR_PO_LIST = [
  {
    id: 1,
    po_no: 'PO-2025-1001',
    po_date: '2025-11-01',
    description: 'ERC MK-III Clips',
    quantity: 10000,
    unit: 'Nos',
    location: 'New delhi plant',
    status: 'Fresh PO',
    items: [
      { id: 101, item_name: 'ERC MK-III Clips - Type A', item_qty: 5000, item_unit: 'Nos', item_status: 'Pending', po_serial_no: 'PO-2025-1001/01', consignee: 'RITES, Northern Region', delivery_period: '2025-12-31' },
      { id: 102, item_name: 'ERC MK-III Clips - Type B', item_qty: 3000, item_unit: 'Nos', item_status: 'Pending', po_serial_no: 'PO-2025-1001/02', consignee: 'RITES, Western Region', delivery_period: '2025-12-31' },
      { id: 103, item_name: 'Rubber Pads', item_qty: 2000, item_unit: 'Nos', item_status: 'Pending', po_serial_no: 'PO-2025-1001/03', consignee: 'RITES, Southern Region', delivery_period: '2025-12-31' }
    ]
  },
  {
    id: 2,
    po_no: 'PO-2025-1002',
    po_date: '2025-11-03',
    description: 'ERC MK-V',
    quantity: 8000,
    unit: 'Nos',
    location: 'Mumbai plant',
    status: 'Inspection under Process',
    items: [
      { id: 201, item_name: 'ERC MK-V Standard', item_qty: 5000, item_unit: 'Nos', item_status: 'Under Inspection', po_serial_no: 'PO-2025-1002/01', consignee: 'RITES, Central Region', delivery_period: '2026-01-15' },
      { id: 202, item_name: 'ERC MK-V Heavy Duty', item_qty: 3000, item_unit: 'Nos', item_status: 'Pending', po_serial_no: 'PO-2025-1002/02', consignee: 'RITES, Eastern Region', delivery_period: '2026-01-15' }
    ]
  },
  {
    id: 3,
    po_no: 'PO-2025-1003',
    po_date: '2025-11-05',
    location: 'Hyderabad plant',
    description: 'ERC MK-III Clips',
    quantity: 5000,
    unit: 'Nos',
    status: 'Order Executed',
    items: [
      { id: 301, item_name: 'ERC MK-III Clips - Standard', item_qty: 5000, item_unit: 'Nos', item_status: 'Completed', po_serial_no: 'PO-2025-1003/01', consignee: 'RITES, Northern Region', delivery_period: '2025-12-20' }
    ]
  }
];

export const VENDOR_REQUESTED_CALLS = [
  {
    id: 1,
    call_no: 'CALL-2025-001',
    po_no: 'PO-2025-1001',
    item_name: 'ERC MK-III Clips - Type A',
    stage: 'Raw Material',
    call_date: '2025-11-10',
    quantity_offered: 4000,
    location: 'Vendor Plant A',
    status: 'Pending',
    inspection_details: {
      inspector_name: 'Rajesh Kumar',
      inspection_date: '2025-11-15',
      remarks: 'Material verification pending',
      documents: ['Material Test Certificate', 'Quality Report']
    },
    rectification_details: null
  },
  {
    id: 2,
    call_no: 'CALL-2025-002',
    po_no: 'PO-2025-1002',
    item_name: 'ERC MK-V Standard',
    stage: 'Process',
    call_date: '2025-11-12',
    quantity_offered: 2000,
    location: 'Vendor Plant B',
    status: 'Scheduled',
    inspection_details: {
      inspector_name: 'Suresh Sharma',
      inspection_date: '2025-11-18',
      remarks: 'Process inspection scheduled',
      documents: ['Process Flow Chart', 'Quality Plan']
    },
    rectification_details: null
  },
  {
    id: 3,
    call_no: 'CALL-2025-003',
    po_no: 'PO-2025-1001',
    item_name: 'ERC MK-III Clips - Type B',
    stage: 'Final',
    call_date: '2025-11-08',
    quantity_offered: 3000,
    location: 'Vendor Plant A',
    status: 'Under Inspection',
    inspection_details: {
      inspector_name: 'Amit Verma',
      inspection_date: '2025-11-14',
      remarks: 'Final dimensional check in progress',
      documents: ['Dimension Report', 'Surface Finish Report']
    },
    rectification_details: null
  },
  {
    id: 4,
    call_no: 'CALL-2025-004',
    po_no: 'PO-2025-1002',
    item_name: 'ERC MK-V Heavy Duty',
    stage: 'Raw Material',
    call_date: '2025-11-05',
    quantity_offered: 1500,
    location: 'Vendor Plant B',
    status: 'Rectification Requested',
    inspection_details: {
      inspector_name: 'Vikram Singh',
      inspection_date: '2025-11-10',
      remarks: 'Material hardness not as per specification',
      documents: ['Hardness Test Report', 'Rejection Note']
    },
    rectification_details: {
      issue_description: 'Material hardness found 45 HRC instead of required 50-55 HRC',
      rectification_action: 'Re-heat treatment required',
      target_date: '2025-11-20',
      status: 'In Progress'
    }
  },
  {
    id: 5,
    call_no: 'CALL-2025-005',
    po_no: 'PO-2025-1003',
    item_name: 'ERC MK-III Clips - Standard',
    stage: 'Process',
    call_date: '2025-11-07',
    quantity_offered: 2500,
    location: 'Vendor Plant A',
    status: 'Pending',
    //  status: 'IC Pending',
    inspection_details: {
      inspector_name: 'Pradeep Gupta',
      inspection_date: '2025-11-12',
      remarks: 'Inspection completed, IC generation pending',
      documents: ['Inspection Report', 'Test Certificates']
    },
    rectification_details: null
  }
];

export const VENDOR_COMPLETED_CALLS = [
  {
    id: 1,
    call_no: 'CALL-2025-0005',
    po_no: 'PO-2025-1001',
    item_name: 'ERC MK-III Clips - Type A',
    stage: 'Raw Material',
    completion_date: '2025-11-08',
    quantity_offered: 3000,
    quantity_accepted: 2950,
    quantity_rejected: 50,
    status: 'Accepted',
    ic_number: 'IC-2025-0001',
    inspection_summary: {
      inspector_name: 'Rajesh Kumar',
      inspection_date: '2025-11-08',
      ie_remarks: 'Material quality meets specification. Minor surface defects on 50 pieces.',
      acceptance_criteria: 'As per RDSO specification Rev.3',
      test_results: 'Hardness: 52 HRC, Tensile: 850 MPa - All within limits',
      final_decision: 'Accepted with minor rejection'
    },
    documents: ['Inspection Report', 'Material Test Certificate', 'Dimensional Report']
  },
  {
    id: 2,
    call_no: 'CALL-2025-0006',
    po_no: 'PO-2025-1003',
    item_name: 'ERC MK-III Clips - Standard',
    stage: 'Final',
    completion_date: '2025-11-09',
    quantity_offered: 2000,
    quantity_accepted: 1980,
    quantity_rejected: 20,
    status: 'Accepted',
    ic_number: 'IC-2025-0002',
    inspection_summary: {
      inspector_name: 'Suresh Sharma',
      inspection_date: '2025-11-09',
      ie_remarks: 'Final inspection completed successfully. Product ready for dispatch.',
      acceptance_criteria: 'As per PO specification and drawing no. DRG-2025-001',
      test_results: 'All functional tests passed. Load test: 15kN - OK',
      final_decision: 'Accepted'
    },
    documents: ['Final Inspection Report', 'Load Test Certificate', 'Packing List']
  },
  {
    id: 3,
    call_no: 'CALL-2025-0007',
    po_no: 'PO-2025-1002',
    item_name: 'ERC MK-V Standard',
    stage: 'Process',
    completion_date: '2025-11-11',
    quantity_offered: 1500,
    quantity_accepted: 1400,
    quantity_rejected: 100,
    status: 'Rejected',
    ic_number: 'IC-2025-0003',
    inspection_summary: {
      inspector_name: 'Amit Verma',
      inspection_date: '2025-11-11',
      ie_remarks: 'Significant dimensional deviations found. Re-machining required.',
      acceptance_criteria: 'As per RDSO specification Rev.2',
      test_results: 'Diameter: 25.5mm (Spec: 25.0±0.1mm) - OUT OF SPEC',
      final_decision: 'Rejected - Rectification required'
    },
    documents: ['Rejection Note', 'Dimensional Deviation Report', 'NCR Form']
  },
  {
    id: 4,
    call_no: 'CALL-2025-0008',
    po_no: 'PO-2025-1001',
    item_name: 'Rubber Pads',
    stage: 'Final',
    completion_date: '2025-11-12',
    quantity_offered: 2000,
    quantity_accepted: 1850,
    quantity_rejected: 150,
    status: 'Partially Accepted',
    ic_number: 'IC-2025-0004',
    inspection_summary: {
      inspector_name: 'Vikram Singh',
      inspection_date: '2025-11-12',
      ie_remarks: 'Partial lot accepted. 150 pieces failed hardness test.',
      acceptance_criteria: 'Shore A Hardness: 65±5',
      test_results: 'Hardness range: 58-72 Shore A. 150 pieces below 60 Shore A',
      final_decision: 'Partially Accepted'
    },
    documents: ['Inspection Report', 'Hardness Test Report', 'Partial Acceptance Note']
  }
];

// ============ MASTER UPDATING DROPDOWN OPTIONS ============
export const MASTER_ROLE_OPTIONS = [
  { value: '', label: 'Select Master Role' },
  { value: 'Manufacturer', label: 'Manufacturer' },
  { value: 'Place of Inspection', label: 'Place of Inspection' },
  { value: 'Consignee', label: 'Consignee' },
  { value: 'Purchaser', label: 'Purchaser' }
];

export const PRODUCT_OPTIONS = [
  { value: '', label: 'Select Product' },
  { value: 'ERC', label: 'ERC' },
  { value: 'Sleeper', label: 'Sleeper' },
  { value: 'GRSP', label: 'GRSP' }
];

export const SUB_PRODUCT_OPTIONS = {
  'ERC': [
    { value: '', label: 'Select Sub Product' },
    { value: 'Spring Steel Rounds', label: 'Spring Steel Rounds' }
  ],
  'Sleeper': [
    { value: '', label: 'Select Sub Product' },
    { value: 'HTS Wire', label: 'HTS Wire' },
    { value: 'Dowel', label: 'Dowel' },
    { value: 'SGCI Insert', label: 'SGCI Insert' }
  ],
  'GRSP': [
    { value: '', label: 'Select Sub Product' },
    { value: 'Rubber Pad', label: 'Rubber Pad' },
    { value: 'Fastener', label: 'Fastener' }
  ]
};

// ============ MASTER DATA (Admin-configured dropdowns for future API) ============
// These will be fetched from backend in future
export const CALIBRATION_MASTER_DATA = {
  instruments: [
    { value: '', label: 'Select Instrument/Machine' },
    { value: 'Vernier Caliper', label: 'Vernier Caliper' },
    { value: 'Micrometer', label: 'Micrometer' },
    { value: 'Height Gauge', label: 'Height Gauge' },
    { value: 'Dial Gauge', label: 'Dial Gauge' },
    { value: 'Hardness Tester', label: 'Hardness Tester' },
    { value: 'Temperature Sensor', label: 'Temperature Sensor' },
    { value: 'Pressure Gauge', label: 'Pressure Gauge' }
  ],
  approval_documents: [
    { value: '', label: 'Select Approval Document' },
    { value: 'ISO 9001 Certificate', label: 'ISO 9001 Certificate' },
    { value: 'RDSO Vendor Approval', label: 'RDSO Vendor Approval' },
    { value: 'BIS Certificate', label: 'BIS Certificate' },
    { value: 'Quality Certificate', label: 'Quality Certificate' },
    { value: 'Environmental Clearance', label: 'Environmental Clearance' }
  ],
  gauges: [
    { value: '', label: 'Select Gauge Description' },
    { value: 'Go / No-Go Gauge – ERC', label: 'Go / No-Go Gauge – ERC' },
    { value: 'Profile Gauge', label: 'Profile Gauge' },
    { value: 'Ring Gauge', label: 'Ring Gauge' },
    { value: 'Snap Gauge', label: 'Snap Gauge' },
    { value: 'Thread Gauge', label: 'Thread Gauge' }
  ],
  products: [
    { value: '', label: 'Select Product' },
    { value: 'ERC', label: 'ERC' },
    { value: 'ERC MK-III', label: 'ERC MK-III' },
    { value: 'ERC MK-V', label: 'ERC MK-V' },
    { value: 'Rail', label: 'Rail' },
    { value: 'Sleeper', label: 'Sleeper' },
    { value: 'Fastener', label: 'Fastener' }
  ],
  accreditation_agencies: [
    { value: '', label: 'Select Accreditation Agency' },
    { value: 'NABL', label: 'NABL' },
    { value: 'NPL', label: 'NPL' },
    { value: 'Other', label: 'Other' }
  ]
};

// ============ ADMIN-CONFIGURED CATEGORY REQUIREMENTS ============
// Defines minimum required instruments/documents per product type (configured by admin)
export const CALIBRATION_REQUIREMENTS = {
  // Product type: ERC MK-III requirements
  'ERC MK-III': {
    instruments: [
      { category: 'Vernier Caliper', minRequired: 2, mandatory: true },
      { category: 'Micrometer', minRequired: 1, mandatory: true },
      { category: 'Hardness Tester', minRequired: 1, mandatory: true },
      { category: 'Height Gauge', minRequired: 1, mandatory: false }
    ],
    approvals: [
      { category: 'RDSO Vendor Approval', minRequired: 1, mandatory: true },
      { category: 'ISO 9001 Certificate', minRequired: 1, mandatory: true },
      { category: 'BIS Certificate', minRequired: 1, mandatory: false }
    ],
    gauges: [
      { category: 'Go / No-Go Gauge – ERC', minRequired: 1, mandatory: true },
      { category: 'Profile Gauge', minRequired: 1, mandatory: true }
    ]
  },
  // Product type: ERC MK-V requirements
  'ERC MK-V': {
    instruments: [
      { category: 'Vernier Caliper', minRequired: 2, mandatory: true },
      { category: 'Micrometer', minRequired: 2, mandatory: true },
      { category: 'Hardness Tester', minRequired: 1, mandatory: true },
      { category: 'Dial Gauge', minRequired: 1, mandatory: true }
    ],
    approvals: [
      { category: 'RDSO Vendor Approval', minRequired: 1, mandatory: true },
      { category: 'ISO 9001 Certificate', minRequired: 1, mandatory: true }
    ],
    gauges: [
      { category: 'Go / No-Go Gauge – ERC', minRequired: 1, mandatory: true },
      { category: 'Profile Gauge', minRequired: 1, mandatory: true },
      { category: 'Ring Gauge', minRequired: 1, mandatory: false }
    ]
  },
  // Default requirements for other products
  'default': {
    instruments: [
      { category: 'Vernier Caliper', minRequired: 1, mandatory: true },
      { category: 'Micrometer', minRequired: 1, mandatory: true }
    ],
    approvals: [
      { category: 'RDSO Vendor Approval', minRequired: 1, mandatory: true }
    ],
    gauges: []
  }
};

// Vendor's current product type (from their assigned POs)
export const VENDOR_PRODUCT_TYPE = 'ERC MK-III';

// From "Calibration & Approval – Fields for Instruments"
// Updated with all fields as per Excel specification
export const VENDOR_CALIBRATION_ITEMS = [
  {
    id: 1,
    instrument_name: 'Vernier Caliper',
    capacity_range: '0-150mm',
    serial_number: 'VC-SN-001',
    calibration_certificate_no: 'CAL-VC-2025-001',
    calibration_date: '2025-09-01',
    calibration_due_date: '2026-09-01',
    certifying_lab_name: 'National Calibration Lab',
    accreditation_agency: 'NABL',
    notification_days: 30,
    calibration_status: 'Valid'
  },
  {
    id: 2,
    instrument_name: 'Vernier Caliper',
    capacity_range: '0-300mm',
    serial_number: 'VC-SN-002',
    calibration_certificate_no: 'CAL-VC-2025-002',
    calibration_date: '2025-08-15',
    calibration_due_date: '2026-08-15',
    certifying_lab_name: 'National Calibration Lab',
    accreditation_agency: 'NABL',
    notification_days: 30,
    calibration_status: 'Valid'
  },
  {
    id: 3,
    instrument_name: 'Micrometer',
    capacity_range: '0-25mm',
    serial_number: 'MIC-SN-001',
    calibration_certificate_no: 'CAL-MIC-2025-010',
    calibration_date: '2025-02-15',
    calibration_due_date: '2025-12-20',
    certifying_lab_name: 'Precision Instruments Lab',
    accreditation_agency: 'NABL',
    notification_days: 30,
    calibration_status: 'Expiring Soon'
  },
  {
    id: 4,
    instrument_name: 'Hardness Tester',
    capacity_range: 'HRC 20-70',
    serial_number: 'HT-SN-001',
    calibration_certificate_no: 'CAL-HT-2024-005',
    calibration_date: '2024-06-01',
    calibration_due_date: '2025-06-01',
    certifying_lab_name: 'Quality Testing Center',
    accreditation_agency: 'NPL',
    notification_days: 45,
    calibration_status: 'Expired'
  },
  {
    id: 5,
    instrument_name: 'Height Gauge',
    capacity_range: '0-600mm',
    serial_number: 'HG-SN-001',
    calibration_certificate_no: 'CAL-HG-2025-001',
    calibration_date: '2025-10-01',
    calibration_due_date: '2026-10-01',
    certifying_lab_name: 'Precision Instruments Lab',
    accreditation_agency: 'NABL',
    notification_days: 30,
    calibration_status: 'Valid'
  }
];

// From "Calibration & Approval – Fields for Approvals"
// Updated with all fields as per Excel specification
export const VENDOR_APPROVAL_ITEMS = [
  {
    id: 1,
    approval_document_name: 'ISO 9001 Certificate', // System (Admin-configured)
    document_number: 'ISO-9001-2024-A001',          // Manual, required, String
    approving_authority: 'Bureau Veritas',          // Manual, required, String
    date_of_issue: '2024-01-01',                    // Manual, required, Date
    valid_till: '2027-12-31',                       // Manual, required, Date
    notification_days: 60,                          // Manual, required, Integer
    status: 'Valid'                                 // Computed
  },
  {
    id: 2,
    approval_document_name: 'RDSO Vendor Approval',
    document_number: 'RDSO-VA-2023-0456',
    approving_authority: 'RDSO, Lucknow',
    date_of_issue: '2023-04-01',
    valid_till: '2026-03-31',
    notification_days: 90,
    status: 'Valid'
  },
  {
    id: 3,
    approval_document_name: 'BIS Certificate',
    document_number: 'BIS-IS-2020-7890',
    approving_authority: 'Bureau of Indian Standards',
    date_of_issue: '2022-01-15',
    valid_till: '2025-01-14',
    notification_days: 30,
    status: 'Expired'
  }
];

// From "Calibration & Approval – Fields for Gauges"
// Updated with all fields as per Excel specification
export const VENDOR_GAUGE_ITEMS = [
  {
    id: 1,
    gauge_description: 'Go / No-Go Gauge – ERC',
    product_name: 'ERC MK-III',
    gauge_sr_no: 'GG-ERC-001',
    calibration_certificate_no: 'CAL-GG-2025-001',
    calibration_date: '2025-01-15',
    calibration_due_date: '2026-01-15',
    certifying_lab_name: 'Gauge Calibration Services',
    accreditation_agency: 'NABL',
    notification_days: 30,
    calibration_status: 'Valid'
  },
  {
    id: 2,
    gauge_description: 'Profile Gauge',
    product_name: 'ERC MK-III',
    gauge_sr_no: 'PG-ERC-001',
    calibration_certificate_no: 'CAL-PG-2025-001',
    calibration_date: '2025-06-10',
    calibration_due_date: '2025-12-18',
    certifying_lab_name: 'Precision Gauge Lab',
    accreditation_agency: 'NPL',
    notification_days: 15,
    calibration_status: 'Expiring Soon'
  }
];

// ============ PAYMENT MASTER DATA ============
// For dropdown options - will be fetched from backend in future
export const PAYMENT_MASTER_DATA = {
  payment_modes: [
    { value: '', label: 'Select Payment Mode' },
    { value: 'NEFT', label: 'NEFT' },
    { value: 'RTGS', label: 'RTGS' },
    { value: 'IMPS', label: 'IMPS' },
    { value: 'UPI', label: 'UPI' },
    { value: 'Bank Deposit', label: 'Bank Deposit' }
  ],
  charge_types: [
    { value: '', label: 'Select Charge Type' },
    { value: 'Inspection', label: 'Inspection' },
    { value: 'Cancellation', label: 'Cancellation' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Advance', label: 'Advance' }
  ],
  // Inspection calls list - populated from completed/cancelled calls
  inspection_calls: [
    { value: '', label: 'Select Inspection Call' },
    { value: 'CALL-2025-0005', label: 'CALL-2025-0005 - PO-2025-1001' },
    { value: 'CALL-2025-0006', label: 'CALL-2025-0006 - PO-2025-1003' },
    { value: 'CALL-2025-0007', label: 'CALL-2025-0007 - PO-2025-1002 (Cancelled)' }
  ]
};

// From "Payment Details Updating Module"
// Payment Details Updating Module - Mock Data
// Statuses: Payment Pending, Payment Pending for Approval, Approved by RITES Finance, Not Approved by RITES Finance
export const VENDOR_PAYMENT_ITEMS = [
  {
    id: 1,
    call_no: 'CALL-2025-0005',
    call_date: '2025-12-01',
    po_no: 'PO-12045',
    po_item_no: '001',
    payment_reason: 'Advance Payment',
    offered_qty: 450,
    charge_type: 'Advance',
    bank_account_details: 'SBI A/c: XXXX1234, IFSC: SBIN0001234',
    base_payable_amount: 127118,
    gst: 22882,
    total_payable_amount: 150000,
    payment_mode: '',
    transaction_reference_number: '',
    payment_date: null,
    payment_proof_filename: '',
    remarks: '',
    payment_status: 'Payment Pending'
  },
  {
    id: 2,
    call_no: 'CALL-2025-0006',
    call_date: '2025-12-02',
    po_no: 'PO-12045',
    po_item_no: '002',
    payment_reason: 'Cancellation',
    offered_qty: 200,
    charge_type: 'Cancellation',
    bank_account_details: 'HDFC A/c: XXXX5678, IFSC: HDFC0005678',
    base_payable_amount: 35000,
    gst: 6300,
    total_payable_amount: 41300,
    payment_mode: 'NEFT',
    transaction_reference_number: 'NEFT-REF-20251202-001',
    payment_date: '2025-12-02',
    payment_proof_filename: 'payment_proof_006.pdf',
    remarks: 'Cancellation charges submitted',
    payment_status: 'Payment Pending for Approval'
  },
  {
    id: 3,
    call_no: 'CALL-2025-0007',
    call_date: '2025-11-28',
    po_no: 'PO-33421',
    po_item_no: '001',
    payment_reason: 'Rejected',
    offered_qty: 120,
    charge_type: 'Rejected',
    bank_account_details: 'ICICI A/c: XXXX9012, IFSC: ICIC0009012',
    base_payable_amount: 25000,
    gst: 4500,
    total_payable_amount: 29500,
    payment_mode: 'UPI',
    transaction_reference_number: 'UPI-REF-20251125-003',
    payment_date: '2025-11-25',
    payment_proof_filename: 'rejected_payment.jpg',
    remarks: 'Payment verified and approved',
    payment_status: 'Approved by RITES Finance',
    approved_date: '2025-11-30'
  },
  {
    id: 4,
    call_no: 'CALL-2025-0008',
    call_date: '2025-12-03',
    po_no: 'PO-44521',
    po_item_no: '001',
    payment_reason: 'Advance Payment',
    offered_qty: 300,
    charge_type: 'Advance',
    bank_account_details: 'Axis A/c: XXXX3456, IFSC: UTIB0003456',
    base_payable_amount: 95000,
    gst: 17100,
    total_payable_amount: 112100,
    payment_mode: 'RTGS',
    transaction_reference_number: 'RTGS-REF-20251203-001',
    payment_date: '2025-12-03',
    payment_proof_filename: 'advance_payment.pdf',
    remarks: 'Transaction reference mismatch',
    rejection_reason: 'Transaction reference number not found in bank records',
    payment_status: 'Not Approved by RITES Finance'
  },
  {
    id: 5,
    call_no: 'CALL-2025-0009',
    call_date: '2025-12-04',
    po_no: 'PO-12045',
    po_item_no: '003',
    payment_reason: 'Cancellation',
    offered_qty: 150,
    charge_type: 'Cancellation',
    bank_account_details: 'SBI A/c: XXXX1234, IFSC: SBIN0001234',
    base_payable_amount: 18000,
    gst: 3240,
    total_payable_amount: 21240,
    payment_mode: '',
    transaction_reference_number: '',
    payment_date: null,
    payment_proof_filename: '',
    remarks: '',
    payment_status: 'Payment Pending'
  },
  {
    id: 6,
    call_no: 'CALL-2025-0003',
    call_date: '2025-10-15',
    po_no: 'PO-11000',
    po_item_no: '001',
    payment_reason: 'Advance Payment',
    offered_qty: 500,
    charge_type: 'Advance',
    bank_account_details: 'PNB A/c: XXXX7890, IFSC: PUNB0007890',
    base_payable_amount: 150000,
    gst: 27000,
    total_payable_amount: 177000,
    payment_mode: 'NEFT',
    transaction_reference_number: 'NEFT-REF-20251016-001',
    payment_date: '2025-10-16',
    payment_proof_filename: 'old_payment.pdf',
    remarks: 'Payment completed',
    payment_status: 'Approved by RITES Finance',
    approved_date: '2025-10-18'
  }
];

// export const VENDOR_PAYMENT_ITEMS = [
//   {
//     id: 1,
//     inspection_call_number: 'CALL-2025-0005',    // Auto Fetch - from list item selected
//     charge_type: 'Inspection',                    // Auto Fetch
//     bank_account_details: 'SBI A/c: XXXX1234, IFSC: SBIN0001234', // Auto Filled - Based on RIO
//     base_payable_amount: 127118,                  // Auto Calculate - from tariff rules
//     gst: 22882,                                   // Auto Calculate (18%)
//     total_payable_amount: 150000,                 // Auto Calculate
//     payment_mode: 'NEFT',                         // Dropdown
//     transaction_reference_number: 'NEFT-REF-20251120-001', // Manual, Required
//     payment_date: '2025-11-20',                   // Date, <= Current Date
//     payment_proof_filename: 'payment_proof_001.pdf', // File upload
//     remarks: 'Payment processed successfully',    // String
//     payment_status: 'Processed'                   // Computed status
//   },
//   {
//     id: 2,
//     inspection_call_number: 'CALL-2025-0006',
//     charge_type: 'Inspection',
//     bank_account_details: 'HDFC A/c: XXXX5678, IFSC: HDFC0005678',
//     base_payable_amount: 83050,
//     gst: 14949,
//     total_payable_amount: 98000,
//     payment_mode: '',
//     transaction_reference_number: '',
//     payment_date: null,
//     payment_proof_filename: '',
//     remarks: '',
//     payment_status: 'Pending'
//   },
//   {
//     id: 3,
//     inspection_call_number: 'CALL-2025-0007',
//     charge_type: 'Cancellation',
//     bank_account_details: 'ICICI A/c: XXXX9012, IFSC: ICIC0009012',
//     base_payable_amount: 25000,
//     gst: 4500,
//     total_payable_amount: 29500,
//     payment_mode: 'UPI',
//     transaction_reference_number: 'UPI-REF-20251125-003',
//     payment_date: '2025-11-25',
//     payment_proof_filename: 'cancellation_payment.jpg',
//     remarks: 'Cancellation charges paid',
//     payment_status: 'Processed'
//   }
// ];

//mock data for payment 

// export const paymentCallsMock = [
//   {
//     call_no: "CALL-2025-0005",
//     call_date: "2025-11-20",
//     po_no: "PO-12045",
//     po_item_no: "001",
//     payment_reason: "Inspection", // Cancellation / Rejected / Advance
//     offered_qty: 450,

//     base_payable_amount: 127118,
//     gst: 22882,
//     total_amount: 150000,

//     payment_mode: "NEFT",
//     transaction_ref: "NEFT-REF-20251120-001",
//     payment_date: "2025-11-20",
//     payment_status: "Processed"
//   },
//   {
//     call_no: "CALL-2025-0006",
//     call_date: "2025-11-22",
//     po_no: "PO-12045",
//     po_item_no: "001",
//     payment_reason: "Inspection",
//     offered_qty: 200,

//     base_payable_amount: 83050,
//     gst: 14949,
//     total_amount: 98000,

//     payment_mode: "",
//     transaction_ref: "",
//     payment_date: "",
//     payment_status: "Payment Pending"
//   },
//   {
//     call_no: "CALL-2025-0007",
//     call_date: "2025-11-25",
//     po_no: "PO-33421",
//     po_item_no: "002",
//     payment_reason: "Cancellation",
//     offered_qty: 120,

//     base_payable_amount: 25000,
//     gst: 4500,
//     total_amount: 29500,

//     payment_mode: "UPI",
//     transaction_ref: "UPI-REF-20251125-003",
//     payment_date: "2025-11-25",
//     payment_status: "Processed"
//   }
// ];
// this is last part of payment 

// From "Master Updating"
export const VENDOR_MASTER_ITEMS = [
  {
    id: 1,
    company_name: 'JSPL',
    cin: 'L27106OR1979PLC001349',
    unit_name: 'Steel Manufacturing Unit',
    pincode: 492002,
    city: 'Raigarh',
    district: 'Raigarh',
    state: 'Chhattisgarh',
    address: 'Patrapali, Raigarh, C.G.',
    contact_person: 'Rajesh Kumar',
    contact_phone: '9876543210',
    contact_email: 'rajesh@jspl.com',
    role: 'Manufacturer - ERC - Round',
    is_active: true
  },
  {
    id: 2,
    company_name: 'JSPL',
    cin: 'L27106OR1979PLC001349',
    unit_name: 'Steel Manufacturing Unit',
    pincode: 492002,
    city: 'Raigarh',
    district: 'Raigarh',
    state: 'Chhattisgarh',
    address: 'Patrapali, Raigarh, C.G.',
    contact_person: 'Priya Sharma',
    contact_phone: '9876543211',
    contact_email: 'priya@jspl.com',
    role: 'Manufacturer - Sleeper - HTS Wire',
    is_active: true
  },
  {
    id: 3,
    company_name: 'JSPL',
    cin: 'L27106OR1979PLC001349',
    unit_name: 'Cement Manufacturing Unit',
    pincode: 492002,
    city: 'Raigarh',
    district: 'Raigarh',
    state: 'Chhattisgarh',
    address: 'Patrapali, Raigarh, C.G.',
    contact_person: 'Amit Verma',
    contact_phone: '9876543212',
    contact_email: 'amit@jspl.com',
    role: 'Manufacturer - Sleeper - Cement',
    is_active: true
  }
];

// From "Raising an Inspection Call" – PO Data auto-fetched
export const VENDOR_RAISE_CALL_PO = {
  po_no: 'AA195118100302',
  po_date: '2019-11-25',
  description: 'PNEUMATIC DRILL MACHINE',
  quantity: 5,
  unit: 'Nos'
};

// ============ INSPECTION CALL MASTER DATA ============
// Company/Unit Master for Place of Inspection
export const COMPANY_UNIT_MASTER = [
  {
    id: 1,
    companyName: 'ABC Industries Pvt Ltd',
    cin: 'U27100MH2020PTC123456',
    units: [
      {
        id: 101,
        unitName: 'Unit 1 - Mumbai',
        gstin: '27AABCU9603R1ZM',
        address: 'Plot 1, MIDC Industrial Area, Andheri East, Mumbai - 400093',
        contactPerson: 'Rajesh Kumar',
        roleOfUnit: 'ERC Manufacturer'
      },
      {
        id: 102,
        unitName: 'Unit 2 - Pune',
        gstin: '27AABCU9603R2ZL',
        address: 'Plot 5, Chakan MIDC, Pune - 410501',
        contactPerson: 'Priya Sharma',
        roleOfUnit: 'Steel Round Supplier (ERC)'
      }
    ]
  },
  {
    id: 2,
    companyName: 'XYZ Steel Mills Ltd',
    cin: 'L27100DL2015PLC987654',
    units: [
      {
        id: 201,
        unitName: 'Main Plant - Delhi',
        gstin: '07AABCX1234R1ZN',
        address: 'Industrial Area, Okhla Phase II, New Delhi - 110020',
        contactPerson: 'Amit Verma',
        roleOfUnit: 'Sleeper Manufacturer'
      }
    ]
  },
  {
    id: 3,
    companyName: 'JSPL',
    cin: 'L27106OR1979PLC001349',
    units: [
      {
        id: 301,
        unitName: 'Angul',
        gstin: '21AABCJ1234R1ZP',
        address: 'Jindal Steel Complex, Angul, Odisha - 759122',
        contactPerson: 'Suresh Patel',
        roleOfUnit: 'Steel Manufacturing Plant'
      },
      {
        id: 302,
        unitName: 'Raigarh',
        gstin: '22AABCJ1234R2ZQ',
        address: 'JSPL Steel Plant, Raigarh, Chhattisgarh - 496001',
        contactPerson: 'Anita Deshmukh',
        roleOfUnit: 'Integrated Steel Plant'
      }
    ]
  }
];

// Manufacturer Master (for Raw Material)
export const MANUFACTURER_MASTER = [
  { id: 1, name: 'Steel Authority of India Ltd (SAIL)', code: 'SAIL' },
  { id: 2, name: 'Tata Steel Ltd', code: 'TATA' },
  { id: 3, name: 'JSW Steel Ltd', code: 'JSW' },
  { id: 4, name: 'Jindal Steel & Power Ltd', code: 'JSPL' }
];

// Raw Material to Grade/Specification Mapping
export const RAW_MATERIAL_GRADE_MAPPING = {
  'Spring Steel Rounds': [
    '55Si7 20.64MM',
    '55Si7 23MM'
  ],
  'Cement': [
    'OPC 53 Grade (IS 12269)',
    'OPC 43 Grade (IS 8112)',
    'PPC (IS 1489)',
    'PSC (IS 455)',
    'Sulphate Resistant Cement'
  ],
  'HTS Wire': [
    'HTS Wire 7mm (IS 6003)',
    'HTS Wire 5mm (IS 6003)',
    'Grade 1570 MPa',
    'Grade 1670 MPa',
    'Grade 1770 MPa'
  ],
  'Dowel': [
    'MS Dowel Bar 20mm (IS 2062)',
    'MS Dowel Bar 25mm (IS 2062)',
    'TMT Dowel Bar 20mm',
    'TMT Dowel Bar 25mm'
  ],
  'Aggregate': [
    '20mm Nominal Size (IS 383)',
    '10mm Nominal Size (IS 383)',
    'Coarse Aggregate Grade I',
    'Coarse Aggregate Grade II',
    'Fine Aggregate (Zone II)',
    'Fine Aggregate (Zone III)'
  ],
  'SGCI Insert': [
    'SGCI Grade 420/12 (IS 2108)',
    'SGCI Grade 350/22 (IS 2108)',
    'SG Iron Insert Type A',
    'SG Iron Insert Type B'
  ],
  'Steel Round': [
    'IS 2062 Grade E250',
    'IS 2062 Grade E350',
    'IS 1786 Grade Fe 415',
    'IS 1786 Grade Fe 500',
    'IS 1786 Grade Fe 550'
  ],
  'Rubber Pad': [
    'EVA Rubber Pad (IS 14892)',
    'EPDM Rubber Pad',
    'Natural Rubber Grade A',
    'Synthetic Rubber Grade B'
  ]
};

// Heat Number to TC Mapping (from Inventory Management)
export const HEAT_TC_MAPPING = [
  {
    heatNumber: 'HT-2025-001',
    tcNumber: 'TC-45678',
    tcDate: '2025-11-10',
    manufacturer: 'SAIL',
    invoiceNo: 'INV-2025-1001',
    invoiceDate: '2025-11-14',
    subPoNumber: 'SUB-PO-001',
    subPoDate: '2025-11-05',
    subPoQty: '50 MT',
    subPoTotalValue: '₹25,00,000',
    tcQty: '50 MT',
    tcQtyRemaining: '48 MT',
    qtyAvailable: 2000,
    unit: 'Kg'
  },
  {
    heatNumber: 'HT-2025-002',
    tcNumber: 'TC-45681',
    tcDate: '2025-11-15',
    manufacturer: 'TATA',
    invoiceNo: 'INV-2025-1004',
    invoiceDate: '2025-11-19',
    subPoNumber: 'SUB-PO-002',
    subPoDate: '2025-11-10',
    subPoQty: '100 MT',
    subPoTotalValue: '₹52,00,000',
    tcQty: '100 MT',
    tcQtyRemaining: '96 MT',
    qtyAvailable: 4000,
    unit: 'Kg'
  },
  {
    heatNumber: 'HT-2025-003',
    tcNumber: 'TC-45690',
    tcDate: '2025-11-18',
    manufacturer: 'JSW',
    invoiceNo: 'INV-2025-1010',
    invoiceDate: '2025-11-20',
    subPoNumber: 'SUB-PO-003',
    subPoDate: '2025-11-12',
    subPoQty: '75 MT',
    subPoTotalValue: '₹38,50,000',
    tcQty: '75 MT',
    tcQtyRemaining: '71.5 MT',
    qtyAvailable: 3500,
    unit: 'Kg'
  },
  {
    heatNumber: 'HT-2025-004',
    tcNumber: 'TC-45695',
    tcDate: '2025-11-20',
    manufacturer: 'SAIL',
    invoiceNo: 'INV-2025-1015',
    invoiceDate: '2025-11-22',
    subPoNumber: 'SUB-PO-004',
    subPoDate: '2025-11-15',
    subPoQty: '120 MT',
    subPoTotalValue: '₹60,00,000',
    tcQty: '120 MT',
    tcQtyRemaining: '115 MT',
    qtyAvailable: 5000,
    unit: 'Kg'
  }
];

// Chemical Analysis History (for auto-fetch in Raw Material)
// Manufacturer names should match supplier names from inventory
export const CHEMICAL_ANALYSIS_HISTORY = [
  { heatNumber: 'HT-2025-001', manufacturer: 'Steel India Ltd', carbon: 0.42, manganese: 0.75, silicon: 0.25, sulphur: 0.025, phosphorus: 0.030, chromium: 0.15 },
  { heatNumber: 'HT-2025-002', manufacturer: 'XYZ Materials Co.', carbon: 0.45, manganese: 0.80, silicon: 0.28, sulphur: 0.020, phosphorus: 0.025, chromium: 0.18 },
  { heatNumber: 'HT-2025-003', manufacturer: 'JSW Steel Ltd', carbon: 0.40, manganese: 0.72, silicon: 0.22, sulphur: 0.028, phosphorus: 0.032, chromium: 0.12 }
];

// Raw Material Inspection Calls (Completed) - for Process stage selection
export const RM_INSPECTION_CALLS = [
  // { icNumber: 'RM-IC-1767597604003', poSerialNo: 'PO-2025-1001/01', heatNumber: 'T844929', bookSetNo: 'BS-001', qtyAccepted: 1800, qtyRejected: 200, icDate: '2025-11-18', status: 'Completed' },
  // { icNumber: 'RM-IC-1767192239075', poSerialNo: 'PO-2025-1001/01', heatNumber: 'HT-2025-002', bookSetNo: 'BS-002', qtyAccepted: 3800, qtyRejected: 200, icDate: '2025-11-20', status: 'Completed' },
  // { icNumber: 'RM-IC-2025-003', poSerialNo: 'PO-2025-1002/01', heatNumber: 'HT-2025-003', bookSetNo: 'BS-003', qtyAccepted: 3200, qtyRejected: 300, icDate: '2025-11-22', status: 'Completed' },
  // { icNumber: 'RM-IC-2025-004', poSerialNo: 'PO-2025-1001/01', heatNumber: 'HT-2025-004', bookSetNo: 'BS-004', qtyAccepted: 4500, qtyRejected: 500, icDate: '2025-11-24', status: 'Completed' }  
  { icNumber: 'RM-IC-1767597604003', poSerialNo: 'PO-2025-1001/01', heatNumber: 'T844929', bookSetNo: 'BS-001', qtyAccepted: 1800, qtyRejected: 200, icDate: '2025-11-18', status: 'Completed' },
  { icNumber: 'RM-IC-1767604183531', poSerialNo: 'PO-2025-1001/01', heatNumber: '442974', bookSetNo: 'BS-002', qtyAccepted: 3800, qtyRejected: 200, icDate: '2025-11-20', status: 'Completed' },
  // { icNumber: 'RM-IC-2025-003', poSerialNo: 'PO-2025-1002/01', heatNumber: 'HT-2025-003', bookSetNo: 'BS-003', qtyAccepted: 3200, qtyRejected: 300, icDate: '2025-11-22', status: 'Completed' },
  // { icNumber: 'RM-IC-2025-004', poSerialNo: 'PO-2025-1001/01', heatNumber: 'HT-2025-004', bookSetNo: 'BS-004', qtyAccepted: 4500, qtyRejected: 500, icDate: '2025-11-24', status: 'Completed' }
];

// Process Inspection Calls (Completed) - for Final stage selection
export const PROCESS_INSPECTION_CALLS = [
  {
    icNumber: 'PROC-IC-2026-0004',
    poSerialNo: 'PO-2025-1001/01',
    lotNumber: 'lot 1',
    bookSetNo: 'BS-001',
    qtyAccepted: 1500,
    qtyRejected: 100,
    icDate: '2025-11-25',
    status: 'Completed',
    manufacturerHeat: 'ABC Steel - T844929',
    unitId: 1,
    unitName: 'Manufacturing Unit 1',
    unitAddress: '123 Industrial Area, Mumbai, Maharashtra - 400001',
    companyId: 1,
    companyName: 'ABC Manufacturing Pvt Ltd'
  },
  {
    icNumber: 'PROC-IC-2026-0005',
    poSerialNo: 'PO-2025-1001/01',
    lotNumber: 'lot2',
    bookSetNo: 'BS-002',
    qtyAccepted: 2000,
    qtyRejected: 50,
    icDate: '2025-11-26',
    status: 'Completed',
    manufacturerHeat: 'ABC Steel - T844929',
    unitId: 1,
    unitName: 'Manufacturing Unit 1',
    unitAddress: '123 Industrial Area, Mumbai, Maharashtra - 400001',
    companyId: 1,
    companyName: 'ABC Manufacturing Pvt Ltd'
  },
  {
    icNumber: 'PROC-IC-2026-0006',
    poSerialNo: 'PO-2025-1001/01',
    lotNumber: 'lot3',
    bookSetNo: 'BS-002',
    qtyAccepted: 2000,
    qtyRejected: 50,
    icDate: '2025-11-26',
    status: 'Completed',
    manufacturerHeat: 'ABC Steel - 442974',
    unitId: 1,
    unitName: 'Manufacturing Unit 1',
    unitAddress: '123 Industrial Area, Mumbai, Maharashtra - 400001',
    companyId: 1,
    companyName: 'ABC Manufacturing Pvt Ltd'
  }
  // {
  //   icNumber: 'PROC-IC-2026-0004',
  //   poSerialNo: 'PO-2025-1001/01',
  //   lotNumber: 'lot 1',
  //   bookSetNo: 'BS-001',
  //   qtyAccepted: 1500,
  //   qtyRejected: 100,
  //   icDate: '2025-11-25',
  //   status: 'Completed',
  //   manufacturerHeat: 'ABC Steel - T844929',
  //   unitId: 1,
  //   unitName: 'Manufacturing Unit 1',
  //   unitAddress: '123 Industrial Area, Mumbai, Maharashtra - 400001',
  //   companyId: 1,
  //   companyName: 'ABC Manufacturing Pvt Ltd'
  // },
  // {
  //   icNumber: 'PROC-IC-2026-0010',
  //   poSerialNo: 'PO-2025-1001/01',
  //   lotNumber: 'lot6',
  //   bookSetNo: 'BS-002',
  //   qtyAccepted: 2000,
  //   qtyRejected: 50,
  //   icDate: '2025-11-26',
  //   status: 'Completed',
  //   manufacturerHeat: 'ABC Steel - 442974',
  //   unitId: 1,
  //   unitName: 'Manufacturing Unit 1',
  //   unitAddress: '123 Industrial Area, Mumbai, Maharashtra - 400001',
  //   companyId: 1,
  //   companyName: 'ABC Manufacturing Pvt Ltd'
  // }
];

// Lot Numbers (for Process and Final stages)
export const LOT_NUMBERS = [
  { lotNumber: 'lot 2', rmIcNumber: 'RM-IC-1767191285774', qtyAvailable: 1500, status: 'Available' },
  { lotNumber: 'LOT-2025-002', rmIcNumber: 'RM-IC-2025-002', qtyAvailable: 2000, status: 'Available' },
  { lotNumber: 'LOT-2025-003', rmIcNumber: 'RM-IC-2025-003', qtyAvailable: 1800, status: 'Partially Used' }
];

// ERC Conversion Factors (Division factors for calculating max ERCs)
// Formula: (offered_qty_mt * 1000) / division_factor = max_erc_count
export const ERC_CONVERSION_FACTORS = {
  'ERC MK-III': 0.928426,
  'ERC MK-V': 1.15321,
  'default': 1.100
};

// PO Serial Numbers with remaining quantities
export const PO_SERIAL_DETAILS = [
  {
    poNo: 'AA195118100302',
    serialNo: '001',
    itemName: 'PNEUMATIC DRILL MACHINE',
    poQty: 5,
    qtyAlreadyInspected: { rm: 0, process: 0, final: 0 },
    unit: 'Nos',
    amendmentNo: null,
    amendmentDate: null
  },
  {
    poNo: 'PO-2025-1001',
    serialNo: '001',
    itemName: 'ERC MK-III Clips - Type A',
    poQty: 5000,
    qtyAlreadyInspected: { rm: 2000, process: 1500, final: 0 },
    unit: 'Nos',
    amendmentNo: 'AMD-001',
    amendmentDate: '2025-11-05'
  },
  {
    poNo: 'PO-2025-1001',
    serialNo: '002',
    itemName: 'ERC MK-III Clips - Type B',
    poQty: 3000,
    qtyAlreadyInspected: { rm: 1000, process: 500, final: 0 },
    unit: 'Nos',
    amendmentNo: null,
    amendmentDate: null
  },
  {
    poNo: 'PO-2025-1002',
    serialNo: '001',
    itemName: 'ERC MK-V Standard',
    poQty: 5000,
    qtyAlreadyInspected: { rm: 3200, process: 2000, final: 1000 },
    unit: 'Nos',
    amendmentNo: 'AMD-002',
    amendmentDate: '2025-11-10'
  }
];

// Inventory Management System - List of Entries
// Status: Fresh, Inspection Requested, Under Inspection, Partially Inspected, Exhausted
export const VENDOR_INVENTORY_ENTRIES = [
  // {
  //   id: 1,
  //   rawMaterial: 'Spring Steel Rounds',
  //   supplierName: 'Jayaswal Neco',
  //   supplierAddress: 'Sector 18, Gurugram, Haryana - 122015',
  //   gradeSpecification: 'IS 2062',
  //   heatNumber: 'HT-2025-001', // Heat Number for Steel
  //   tcNumber: 'TC-45678',
  //   tcDate: '2025-11-15',
  //   invoiceNumber: 'INV-2025-1001',
  //   invoiceDate: '2025-11-14',
  //   subPoNumber: 'SPO-2025-101',
  //   subPoDate: '2025-11-10',
  //   subPoQty: 5000,
  //   rateOfMaterial: 85.50,
  //   rateOfGst: 18,
  //   declaredQuantity: 5000,
  //   qtyOfferedForInspection: 3000,
  //   qtyLeftForInspection: 2000,
  //   unitOfMeasurement: 'Kg',
  //   status: 'Under Inspection',
  //   entryDate: '2025-11-16'
  // },
  // {
  //   id: 2,
  //   rawMaterial: 'Cement',
  //   supplierName: 'National Cement Corp',
  //   supplierAddress: 'NH-8, Bhiwadi, Rajasthan - 301019',
  //   gradeSpecification: 'OPC 53',
  //   heatNumber: 'BN-2025-089', // Batch Number for Cement
  //   tcNumber: 'TC-45679',
  //   tcDate: '2025-11-12',
  //   invoiceNumber: 'INV-2025-1002',
  //   invoiceDate: '2025-11-11',
  //   subPoNumber: 'SPO-2025-102',
  //   subPoDate: '2025-11-08',
  //   subPoQty: 200,
  //   rateOfMaterial: 420.00,
  //   rateOfGst: 18,
  //   declaredQuantity: 200,
  //   qtyOfferedForInspection: 200,
  //   qtyLeftForInspection: 0,
  //   unitOfMeasurement: 'Bags',
  //   status: 'Exhausted',
  //   entryDate: '2025-11-13'
  // },
  // {
  //   id: 3,
  //   rawMaterial: 'Rubber Pad',
  //   supplierName: 'ABC Suppliers Pvt Ltd',
  //   supplierAddress: 'Plot No. 45, Industrial Area, Phase II, New Delhi - 110020',
  //   gradeSpecification: 'Grade A',
  //   heatNumber: 'BN-2025-045', // Batch Number for Rubber
  //   tcNumber: 'TC-45680',
  //   tcDate: '2025-11-18',
  //   invoiceNumber: 'INV-2025-1003',
  //   invoiceDate: '2025-11-17',
  //   subPoNumber: 'SPO-2025-103',
  //   subPoDate: '2025-11-15',
  //   subPoQty: 10000,
  //   rateOfMaterial: 12.75,
  //   rateOfGst: 18,
  //   declaredQuantity: 10000,
  //   qtyOfferedForInspection: 0,
  //   qtyLeftForInspection: 10000,
  //   unitOfMeasurement: 'Nos',
  //   status: 'Fresh',
  //   entryDate: '2025-11-19'
  // },
  // {
  //   id: 4,
  //   rawMaterial: 'Steel Round',
  //   supplierName: 'XYZ Materials Co.',
  //   supplierAddress: '123, MIDC Industrial Estate, Pune - 411018',
  //   gradeSpecification: 'IS 1786',
  //   heatNumber: 'HT-2025-002',
  //   tcNumber: 'TC-45681',
  //   tcDate: '2025-11-20',
  //   invoiceNumber: 'INV-2025-1004',
  //   invoiceDate: '2025-11-19',
  //   subPoNumber: 'SPO-2025-104',
  //   subPoDate: '2025-11-18',
  //   subPoQty: 8000,
  //   rateOfMaterial: 92.00,
  //   rateOfGst: 18,
  //   declaredQuantity: 8000,
  //   qtyOfferedForInspection: 4000,
  //   qtyLeftForInspection: 4000,
  //   unitOfMeasurement: 'Kg',
  //   status: 'Partially Inspected',
  //   entryDate: '2025-11-21'
  // },
  // {
  //   id: 5,
  //   rawMaterial: 'Steel Round',
  //   supplierName: 'JSW Steel Ltd',
  //   supplierAddress: 'JSW Complex, Vijayanagar, Karnataka - 583275',
  //   gradeSpecification: 'IS 2062',
  //   heatNumber: 'HT-2025-003', // Heat Number for Steel
  //   tcNumber: 'TC-45690',
  //   tcDate: '2025-11-18',
  //   invoiceNumber: 'INV-2025-1010',
  //   invoiceDate: '2025-11-20',
  //   subPoNumber: 'SPO-2025-106',
  //   subPoDate: '2025-11-12',
  //   subPoQty: 7500,
  //   rateOfMaterial: 88.00,
  //   rateOfGst: 18,
  //   declaredQuantity: 7500,
  //   qtyOfferedForInspection: 0,
  //   qtyLeftForInspection: 7500,
  //   unitOfMeasurement: 'Kg',
  //   status: 'Fresh',
  //   entryDate: '2025-11-24'
  // },
  // {
  //   id: 6,
  //   rawMaterial: 'Aggregate',
  //   supplierName: 'ABC Suppliers Pvt Ltd',
  //   supplierAddress: 'Plot No. 45, Industrial Area, Phase II, New Delhi - 110020',
  //   gradeSpecification: 'Grade B',
  //   heatNumber: 'LN-2025-012', // Lot Number for Aggregate
  //   tcNumber: 'TC-45682',
  //   tcDate: '2025-11-22',
  //   invoiceNumber: 'INV-2025-1005',
  //   invoiceDate: '2025-11-21',
  //   subPoNumber: 'SPO-2025-105',
  //   subPoDate: '2025-11-20',
  //   subPoQty: 50,
  //   rateOfMaterial: 1250.00,
  //   rateOfGst: 18,
  //   declaredQuantity: 50,
  //   qtyOfferedForInspection: 50,
  //   qtyLeftForInspection: 0,
  //   unitOfMeasurement: 'Cubic Meter',
  //   status: 'Inspection Requested',
  //   entryDate: '2025-11-23'
  // },
  {
  id: 7,
  rawMaterial: 'Spring Steel Rounds',
  supplierName: 'Jayaswal Neco',
  supplierAddress: '',
  gradeSpecification: '55Si7 - 20.64mm',
  heatNumber: 'H844927',
  tcNumber: 'TCWRM0000056136',
  tcDate: '2025-05-25',
  invoiceNumber: '2624161677',
  invoiceDate: '2025-05-25',
  subPoNumber: 'RFNE/25-26/032',
  subPoDate: '',
  subPoQty: 114,
  rateOfMaterial: null,
  rateOfGst: 18,
  declaredQuantity: 114,
  qtyOfferedForInspection: 114,
  qtyLeftForInspection: 0,
  unitOfMeasurement: 'MT',
  status: 'Fresh PO',
  entryDate: '2025-05-25'
},
{
  id: 8,
  rawMaterial: 'Spring Steel Rounds',
  supplierName: 'Tata Steel',
  supplierAddress: '',
  gradeSpecification: '55Si7 - 20.64mm',
  heatNumber: 'T844929',
  tcNumber: 'TC-55iS-25-88',
  tcDate: '2025-07-26',
  invoiceNumber: '203005485',
  invoiceDate: '2025-07-26',
  subPoNumber: 'RFNE/25-26/033',
  subPoDate: '',
  subPoQty: 110,
  rateOfMaterial: null,
  rateOfGst: 18,
  declaredQuantity: 110,
  qtyOfferedForInspection: 18,
  qtyLeftForInspection: 92,
  unitOfMeasurement: 'MT',
  status: 'Inspection Requested',
  entryDate: '2025-07-26'
},
{
  id: 9,
  rawMaterial: 'Spring Steel Rounds',
  supplierName: 'JSPL',
  supplierAddress: '',
  gradeSpecification: '55Si7 - 23mm',
  heatNumber: '442974',
  tcNumber: 'TC-55iS-25-98',
  tcDate: '2025-09-26',
  invoiceNumber: '81693537',
  invoiceDate: '2025-09-26',
  subPoNumber: 'RFNE/25-26/035',
  subPoDate: '',
  subPoQty: 50,
  rateOfMaterial: null,
  rateOfGst: 18,
  declaredQuantity: 50,
  qtyOfferedForInspection: 25,
  qtyLeftForInspection: 25,
  unitOfMeasurement: 'MT',
  status: 'Partially Inspected',
  entryDate: '2025-09-26'
},
{
  id: 10,
  rawMaterial: 'Spring Steel Rounds',
  supplierName: 'RINL',
  supplierAddress: '',
  gradeSpecification: '55Si7 - 23mm',
  heatNumber: '25-8899',
  tcNumber: 'RINL/TC/5646',
  tcDate: '2025-11-27',
  invoiceNumber: '80903065',
  invoiceDate: '2025-11-27',
  subPoNumber: 'RFNE/25-26/055',
  subPoDate: '',
  subPoQty: 55,
  rateOfMaterial: null,
  rateOfGst: 18,
  declaredQuantity: 55,
  qtyOfferedForInspection: 30,
  qtyLeftForInspection: 25,
  unitOfMeasurement: 'MT',
  status: 'Partially Inspected',
  entryDate: '2025-11-27'
},
{
  id: 11,
  rawMaterial: 'Spring Steel Rounds',
  supplierName: 'JSPL',
  supplierAddress: '',
  gradeSpecification: '55Si7 - 23mm',
  heatNumber: 'J844927',
  tcNumber: 'TC/SS/5899',
  tcDate: '2025-12-09',
  invoiceNumber: '249991418',
  invoiceDate: '2025-12-09',
  subPoNumber: 'RFNE/25-26/065',
  subPoDate: '',
  subPoQty: 50,
  rateOfMaterial: null,
  rateOfGst: 18,
  declaredQuantity: 50,
  qtyOfferedForInspection: 50,
  qtyLeftForInspection: 0,
  unitOfMeasurement: 'MT',
  status: 'Exhausted',
  entryDate: '2025-12-09'
}

];

// Sub PO Data Structure
export const VENDOR_SUB_PO_LIST = [
  {
    id: 1,
    po_id: 1, // Links to VENDOR_PO_LIST
    po_no: 'PO-2025-1001',
    po_item_id: 101, // Links to specific item in PO
    sub_po_number: 'SUB-PO-2025-001',
    sub_po_date: '2025-11-10',
    raw_material_name: 'High Carbon Steel',
    contractor: 'ABC Contractors Pvt Ltd',
    manufacturer: 'XYZ Steel Mills',
    purchasing_authority: 'RITES Purchase Division',
    bill_paying_officer: 'Mr. Rajesh Kumar',
    consignee: 'RITES, Northern Region',
    sub_po_quantity: 2500,
    call_quantity: 0,
    offered_quantity: 0,
    rate: 150.50,
    vendor_remarks: 'First batch of raw material',
    approval_status: 'Approved', // Pending Approval, Approved, Rejected
    submitted_date: '2025-11-10',
    approved_date: '2025-11-12',
    approved_by: 'Admin User',
    rejection_reason: null
  },
  {
    id: 2,
    po_id: 1,
    po_no: 'PO-2025-1001',
    po_item_id: 101,
    sub_po_number: 'SUB-PO-2025-002',
    sub_po_date: '2025-11-15',
    raw_material_name: 'Alloy Steel Grade A',
    contractor: 'DEF Engineering Ltd',
    manufacturer: 'PQR Metallurgy Corp',
    purchasing_authority: 'RITES Purchase Division',
    bill_paying_officer: 'Ms. Priya Sharma',
    consignee: 'RITES, Northern Region',
    sub_po_quantity: 2500,
    call_quantity: 0,
    offered_quantity: 0,
    rate: 175.75,
    vendor_remarks: 'Second batch - premium grade',
    approval_status: 'Approved',
    submitted_date: '2025-11-15',
    approved_date: '2025-11-17',
    approved_by: 'Admin User',
    rejection_reason: null
  },
  {
    id: 3,
    po_id: 1,
    po_no: 'PO-2025-1001',
    po_item_id: 102,
    sub_po_number: 'SUB-PO-2025-003',
    sub_po_date: '2025-11-20',
    raw_material_name: 'Carbon Steel Type B',
    contractor: 'GHI Contractors',
    manufacturer: 'LMN Steel Works',
    purchasing_authority: 'RITES Purchase Division',
    bill_paying_officer: 'Mr. Amit Patel',
    consignee: 'RITES, Western Region',
    sub_po_quantity: 1500,
    call_quantity: 0,
    offered_quantity: 0,
    rate: 160.00,
    vendor_remarks: 'Standard grade material',
    approval_status: 'Pending Approval',
    submitted_date: '2025-11-20',
    approved_date: null,
    approved_by: null,
    rejection_reason: null
  },
  {
    id: 4,
    po_id: 2,
    po_no: 'PO-2025-1002',
    po_item_id: 201,
    sub_po_number: 'SUB-PO-2025-004',
    sub_po_date: '2025-11-18',
    raw_material_name: 'Stainless Steel 304',
    contractor: 'JKL Industries',
    manufacturer: 'STU Alloys Ltd',
    purchasing_authority: 'RITES Purchase Division',
    bill_paying_officer: 'Dr. Sunita Verma',
    consignee: 'RITES, Central Region',
    sub_po_quantity: 3000,
    call_quantity: 0,
    offered_quantity: 0,
    rate: 200.25,
    vendor_remarks: 'High quality stainless steel',
    approval_status: 'Approved',
    submitted_date: '2025-11-18',
    approved_date: '2025-11-19',
    approved_by: 'Admin User',
    rejection_reason: null
  }
];
