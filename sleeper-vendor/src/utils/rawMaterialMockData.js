/**
 * Mock Data for Raw Material Testing and Verification Modules
 */

export const MOCK_INVENTORY = {
    CEMENT: [
        {
            id: 'INV-CEM-001',
            vendor: 'UltraTech Cement',
            receivedDate: '2026-01-05',
            invoiceNo: 'EWB-882910',
            invoiceDate: '2026-01-04',
            cementType: 'OPC 53',
            manufacturerName: 'UltraTech Cement Ltd',
            batches: [
                { batchNo: 'W01-M01-Y26', weekNo: '01', yearNo: '2026', mtcNo: 'MTC-UT-991', qty: '100 MT' },
                { batchNo: 'W01-M01-Y26-B', weekNo: '01', yearNo: '2026', mtcNo: 'MTC-UT-992', qty: '100 MT' }
            ],
            qty: '200 MT',
            totalQtyKg: '200000',
            status: 'Unverified'
        },
        {
            id: 'INV-CEM-002',
            vendor: 'Ambuja Cement',
            receivedDate: '2026-01-07',
            invoiceNo: 'EWB-991822',
            invoiceDate: '2026-01-06',
            cementType: 'PPC',
            manufacturerName: 'Ambuja Cements Ltd',
            batches: [
                { batchNo: 'W52-M12-Y25', weekNo: '52', yearNo: '2025', mtcNo: 'MTC-AMB-882', qty: '150 MT' }
            ],
            qty: '150 MT',
            totalQtyKg: '150000',
            status: 'Verified',
            verifiedBy: 'John Doe (IE)',
            verifiedAt: '2026-01-08 10:30 AM'
        },
    ],
    HTS: [
        {
            id: 'HTS-COIL-001',
            vendor: 'Tata Steel',
            receivedDate: '2026-01-10',
            invoiceNo: 'EWB-TS-771',
            invoiceDate: '2026-01-09',
            gradeSpec: 'IS 14268',
            manufacturerName: 'Tata Steel Ltd',
            ritesIcNo: 'RITES/HTS/101',
            ritesIcDate: '2026-01-08',
            coils: [
                { coilNo: 'C101', lotNo: 'LOT-HTS-99-A' },
                { coilNo: 'C102', lotNo: 'LOT-HTS-99-B' },
                { coilNo: 'C103', lotNo: 'LOT-HTS-99-C' }
            ],
            relaxationTestDate: '2026-01-07',
            qty: '25.5 MT',
            status: 'Unverified'
        },
        {
            id: 'HTS-COIL-002',
            vendor: 'JSW Steel',
            receivedDate: '2026-01-11',
            invoiceNo: 'EWB-JSW-882',
            invoiceDate: '2026-01-10',
            gradeSpec: 'IS 14268',
            manufacturerName: 'JSW Steel Ltd',
            ritesIcNo: 'RITES/HTS/105',
            ritesIcDate: '2026-01-09',
            coils: [
                { coilNo: 'J991', lotNo: 'LOT-HTS-105-1' },
                { coilNo: 'J992', lotNo: 'LOT-HTS-105-2' }
            ],
            relaxationTestDate: '2026-01-08',
            qty: '40.2 MT',
            status: 'Verified',
            verifiedBy: 'Jane Smith (IE)',
            verifiedAt: '2026-01-12 02:15 PM'
        },
    ],
    AGGREGATES: [
        {
            id: 'INV-AGG-001',
            vendor: 'Local Quarry Solutions',
            receivedDate: '2026-01-02',
            challanNo: 'CHL-AGG-99',
            aggregateType: 'CA1 (20mm)',
            source: 'Pathankot Quarry',
            qty: '500 MT',
            status: 'Verified',
            verifiedBy: 'John Doe (IE)',
            verifiedAt: '2026-01-03 09:00 AM'
        },
        {
            id: 'INV-AGG-002',
            vendor: 'Stone Crushers Ltd',
            receivedDate: '2026-01-06',
            challanNo: 'CHL-AGG-105',
            aggregateType: 'FA (River Sand)',
            source: 'Haridwar Source',
            qty: '800 MT',
            status: 'Unverified'
        },
    ],
    ADMIXTURE: [
        {
            id: 'INV-ADM-001',
            vendor: 'Fosroc Chemicals',
            receivedDate: '2026-01-08',
            invoiceNo: 'EWB-ADM-501',
            invoiceDate: '2026-01-07',
            manufacturerName: 'Fosroc India',
            lotNo: 'ADM-LOT-22',
            mtcNo: 'MTC-ADM-11',
            qty: '2000 Kgs',
            status: 'Unverified'
        },
    ],
    SGCI: [
        {
            id: 'SG-INV-001',
            vendor: 'India Castings',
            receivedDate: '2026-01-02',
            invoiceNo: 'EWB-SG-101',
            invoiceDate: '2026-01-01',
            gradeSpec: 'IS 1865',
            manufacturerName: 'India Castings Private Ltd',
            ritesIcNo: 'RITES/SG/882',
            ritesIcDate: '2025-12-28',
            qty: '5000 Nos',
            status: 'Verified',
            verifiedBy: 'John Doe (IE)',
            verifiedAt: '2026-01-02 11:45 AM'
        },
    ],
    DOWEL: [
        {
            id: 'DW-INV-001',
            vendor: 'Plastic Components Ltd',
            receivedDate: '2026-01-09',
            invoiceNo: 'EWB-DW-701',
            invoiceDate: '2026-01-08',
            gradeSpec: 'HDPE Grade 1',
            manufacturerName: 'Plastic Components Ltd',
            ritesIcNo: 'RITES/DW/551',
            ritesIcDate: '2026-01-05',
            qty: '10000 Nos',
            status: 'Unverified'
        },
    ]
};

export const MOCK_CEMENT_HISTORY = [
    { id: 1, testDate: '2025-12-25', testType: 'Periodic', consignmentNo: 'CON-0950', lotNo: 'LOT-X1', surface: '320', initialSetting: '145', finalSetting: '280', consistency: '28%', soundness: '0.5' },
    { id: 2, testDate: '2026-01-02', testType: 'New Inventory', consignmentNo: 'CON-1001', lotNo: 'LOT-Z5', surface: '315', initialSetting: '155', finalSetting: '295', consistency: '27.5%', soundness: '0.8' },
];

export const MOCK_AGGREGATES_HISTORY = [
    { id: 1, testDate: '2025-12-20', testType: 'New Inventory', consignmentNo: 'CON-AG-88', lotNo: '20MM-X', crushing: '22%', impact: '18%' },
    { id: 2, testDate: '2026-01-04', testType: 'Periodic', consignmentNo: 'CON-AG-92', lotNo: '10MM-Y', crushing: '21.5%', impact: '17.5%' },
];

export const MOCK_HTS_HISTORY = [
    { id: 1, testDate: '2026-01-07', consignmentNo: 'HTS-990', lotNo: 'COIL-1', weight: '2.5kg/m', layLength: '95mm', diameter: '9.5mm' },
    { id: 2, testDate: '2026-01-08', consignmentNo: 'HTS-991', lotNo: 'COIL-2', weight: '2.51kg/m', layLength: '96mm', diameter: '9.51mm' },
];

export const MOCK_SGCI_HISTORY = [
    { id: 1, testDate: '2026-01-02', lotNo: 'SG-202', supplier: 'India Castings', type: 'MCI-18', ritesIc: 'IC/2026/01/01', checked: 500, accepted: 498, rejected: 2 },
];

export const MOCK_WATER_HISTORY = [
    { id: 1, testDate: '2025-12-15', ph: '7.2', tds: '450 ppm' },
    { id: 2, testDate: '2026-01-05', ph: '7.1', tds: '420 ppm' },
];

export const MOCK_VERIFIED_CONSIGNMENTS = [
    'CON-1029 (UltraTech)',
    'CON-1045 (Ambuja)',
    'CON-AG-105 (Stone Crushers)',
    'HTS-991 (Tata Steel)',
    'CON-1001 (New Inventory)'
];
