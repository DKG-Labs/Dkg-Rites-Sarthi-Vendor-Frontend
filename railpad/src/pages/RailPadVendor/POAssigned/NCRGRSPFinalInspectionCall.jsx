import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Package, Calendar, ClipboardList, CheckCircle2, AlertCircle,
  Trash2, ChevronDown, ChevronUp, Plus, Info, Layers, FileText,
  ShieldCheck, AlertTriangle, ArrowRight, Check, Search, X
} from 'lucide-react';
import inspectionCallService from '../../../services/inspectionCallService';

// ─── Master Catalog of NCRGRSP Types & Official Drawings ──────────────────────
// Source: PL-60217240 | PL-60217223 | PL-60217250 | PL-60217241 | Northern Railway Annexures A–F | Annexure-B (Photo)
const NCRGRSP_CATALOG = {
  // TYPE 1 – Source: PL-60217240 | Date: 22.12.23
  'RT-4734': [
    { drawingNo: 'RT-8888', qtyPerSet: 16, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8886', qtyPerSet: 38, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7014/2', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7014/1', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8892', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8891', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8890', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7021', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7020', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7019', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7018', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7017', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7016', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7015', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7014', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' }
  ],
  // RT-6154 – 60 kg 1 in 12 Turnout with T-8907 (Total 345 Pads / 26 Items)
  'RT-6154': [
    // Approach, Exit & Lead Portion
    { drawingNo: 'RT-8890', qtyPerSet: 1, description: 'Approach, Exit & Lead Portion' },
    { drawingNo: 'RT-8889', qtyPerSet: 26, description: 'Approach, Exit & Lead Portion' },
    { drawingNo: 'RT-8886', qtyPerSet: 146, description: 'Approach, Exit & Lead Portion' },
    // Switch Portion
    { drawingNo: 'RT-8907', qtyPerSet: 6, description: 'Switch Portion' },
    { drawingNo: 'RT-8955', qtyPerSet: 42, description: 'Switch Portion' },
    { drawingNo: 'RT-8954', qtyPerSet: 2, description: 'Switch Portion' },
    { drawingNo: 'RT-8889', qtyPerSet: 4, description: 'Switch Portion' },
    { drawingNo: 'RT-8896', qtyPerSet: 6, description: 'Switch Portion' },
    { drawingNo: 'RT-8895', qtyPerSet: 6, description: 'Switch Portion' },
    { drawingNo: 'RT-8894', qtyPerSet: 2, description: 'Switch Portion' },
    { drawingNo: 'RT-8893', qtyPerSet: 36, description: 'Switch Portion' },
    { drawingNo: 'RT-8906', qtyPerSet: 4, description: 'Switch Portion' },
    // Crossing Portion
    { drawingNo: 'RT-8888', qtyPerSet: 16, description: 'Crossing Portion' },
    { drawingNo: 'RT-8886', qtyPerSet: 36, description: 'Crossing Portion' },
    { drawingNo: 'RT-7014/2', qtyPerSet: 1, description: 'Crossing Portion' },
    { drawingNo: 'RT-7014/1', qtyPerSet: 1, description: 'Crossing Portion' },
    { drawingNo: 'RT-8892', qtyPerSet: 1, description: 'Crossing Portion' },
    { drawingNo: 'RT-8891', qtyPerSet: 1, description: 'Crossing Portion' },
    { drawingNo: 'RT-7021', qtyPerSet: 1, description: 'Crossing Portion' },
    { drawingNo: 'RT-7020', qtyPerSet: 1, description: 'Crossing Portion' },
    { drawingNo: 'RT-7019', qtyPerSet: 1, description: 'Crossing Portion' },
    { drawingNo: 'RT-7018', qtyPerSet: 1, description: 'Crossing Portion' },
    { drawingNo: 'RT-7017', qtyPerSet: 1, description: 'Crossing Portion' },
    { drawingNo: 'RT-7016', qtyPerSet: 1, description: 'Crossing Portion' },
    { drawingNo: 'RT-7015', qtyPerSet: 1, description: 'Crossing Portion' },
    { drawingNo: 'RT-7014', qtyPerSet: 1, description: 'Crossing Portion' }
  ],
  // RT-6155 – 1 in 12 60kg TWS drg. No. T-6155 (Total 120 Pads / 10 Items)
  'RT-6155': [
    { drawingNo: 'RT-9630', qtyPerSet: 12, description: '1 in 12 60kg TWS' },
    { drawingNo: 'RT-8907', qtyPerSet: 6, description: '1 in 12 60kg TWS' },
    { drawingNo: 'RT-8955', qtyPerSet: 42, description: '1 in 12 60kg TWS' },
    { drawingNo: 'RT-8954', qtyPerSet: 2, description: '1 in 12 60kg TWS' },
    { drawingNo: 'RT-8889', qtyPerSet: 4, description: '1 in 12 60kg TWS' },
    { drawingNo: 'RT-8896', qtyPerSet: 6, description: '1 in 12 60kg TWS' },
    { drawingNo: 'RT-8895', qtyPerSet: 6, description: '1 in 12 60kg TWS' },
    { drawingNo: 'RT-8894', qtyPerSet: 2, description: '1 in 12 60kg TWS' },
    { drawingNo: 'RT-8893', qtyPerSet: 36, description: '1 in 12 60kg TWS' },
    { drawingNo: 'RT-8906', qtyPerSet: 4, description: '1 in 12 60kg TWS' }
  ],
  // TYPE 3 – Source: PL-60217250 | Date: 03.09.2025
  'RT-4733': [
    { drawingNo: 'RT-8888', qtyPerSet: 16, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8886', qtyPerSet: 182, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7014/2', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7014/1', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8892', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8891', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8890', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7021', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7020', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7019', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7018', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7017', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7016', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7015', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7014', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8906', qtyPerSet: 4, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8907', qtyPerSet: 26, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8889', qtyPerSet: 30, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8896', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8895', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8894', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8893', qtyPerSet: 36, description: 'Nylon Cord Reinforced GRSP' }
  ],
  // TYPE 4 – Source: PL-60217241 | Date: 22.12.23
  'RT-4867': [
    { drawingNo: 'RT-8888', qtyPerSet: 16, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8887', qtyPerSet: 20, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8916', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8917', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8918', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8919', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8920', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8921', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8914', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8914/1', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8915', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8915/1', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8887', qtyPerSet: 96, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8889', qtyPerSet: 30, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8907', qtyPerSet: 12, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8912', qtyPerSet: 22, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8913', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8906', qtyPerSet: 4, description: 'Nylon Cord Reinforced GRSP' }
  ],
  // TYPE 5 – Source: Northern Railway – Annexure-A | Date: 2026
  'RT-5691': [
    { drawingNo: 'RT-8893', qtyPerSet: 38, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-8906', qtyPerSet: 4, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-8927', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-8955', qtyPerSet: 12, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10160', qtyPerSet: 14, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10162', qtyPerSet: 28, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10250', qtyPerSet: 232, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10253', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10254', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10255', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10256', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10257', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10258', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10259', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10260', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10261', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10262', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10263', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10264', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10265', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10266', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10267', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10268', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10269', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10270', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10271', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10272', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10273', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10274', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10275', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'RT-10276', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' }
  ],
  // TYPE 6 – Source: Northern Railway – Annexure-B | Date: 2026
  'RT-5693': [
    { drawingNo: 'RT-10160', qtyPerSet: 14, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10250', qtyPerSet: 58, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10264', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10265', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10266', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10267', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10268', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10269', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10270', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10271', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10272', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10273', qtyPerSet: 2, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10274', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10275', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10276', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' }
  ],
  // TYPE 7 – Source: Northern Railway – Annexure-C | Date: 2026
  'RT-6068': [
    { drawingNo: 'RT-8906', qtyPerSet: 4, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8911', qtyPerSet: 22, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8913', qtyPerSet: 6, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8955', qtyPerSet: 6, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10160', qtyPerSet: 17, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10162', qtyPerSet: 22, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10335', qtyPerSet: 3, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' }
  ],
  // RT-5836 – 6 mm Thick NCR GRSP (Total 80 Pads)
  'RT-5836': [
    { drawingNo: 'RT-8887', qtyPerSet: 17, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8906', qtyPerSet: 4, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8907', qtyPerSet: 9, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8912', qtyPerSet: 22, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8913', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8889', qtyPerSet: 22, description: 'Nylon Cord Reinforced GRSP' }
  ],
  // RT-4732 – NCR GRSP (Total 22 Items)
  'RT-4732': [
    { drawingNo: 'RT-8889', qtyPerSet: 30, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8886', qtyPerSet: 182, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8890', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7014', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7015', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7016', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7017', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7018', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7019', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7020', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7021', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7014/1', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7014/2', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8891', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8892', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8888', qtyPerSet: 16, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8894', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8895', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8893', qtyPerSet: 36, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8896', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8907', qtyPerSet: 26, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8906', qtyPerSet: 4, description: 'Nylon Cord Reinforced GRSP' }
  ],
  // RT-10070 – 10 mm Thick NCR GRSP (Total 403 Pads / 35 Items)
  'RT-10070': [
    { drawingNo: 'RT-10096', qtyPerSet: 28, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10278', qtyPerSet: 232, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10223', qtyPerSet: 2, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10222', qtyPerSet: 2, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10221', qtyPerSet: 2, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10220', qtyPerSet: 2, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10219', qtyPerSet: 2, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10218', qtyPerSet: 2, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10217', qtyPerSet: 2, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10216', qtyPerSet: 2, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10152', qtyPerSet: 2, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10116', qtyPerSet: 4, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10118', qtyPerSet: 4, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10189', qtyPerSet: 6, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10097', qtyPerSet: 2, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10098', qtyPerSet: 36, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-9824', qtyPerSet: 38, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-9837', qtyPerSet: 4, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10151', qtyPerSet: 1, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10150', qtyPerSet: 1, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10149', qtyPerSet: 1, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10148', qtyPerSet: 2, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10147', qtyPerSet: 1, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10146', qtyPerSet: 1, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10145', qtyPerSet: 1, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10144', qtyPerSet: 1, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10143', qtyPerSet: 1, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10142', qtyPerSet: 1, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10141', qtyPerSet: 1, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10140', qtyPerSet: 1, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10139', qtyPerSet: 1, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10138', qtyPerSet: 1, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10137', qtyPerSet: 1, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10136', qtyPerSet: 1, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10095', qtyPerSet: 14, description: '10 mm Thick Nylon Cord Reinforced GRSP' }
  ],
  // RT-4218 – Nylon Cord Reinforced GRSP – 60kg 1 in 12 Turnout (Total 321 Pads)
  'RT-4218': [
    { drawingNo: 'RT-7014', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7014/1', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7014/2', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7015', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7016', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7017', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7018', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7019', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7020', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-7021', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8886', qtyPerSet: 182, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8888', qtyPerSet: 16, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8889', qtyPerSet: 30, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8890', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8891', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8892', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8893', qtyPerSet: 36, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8894', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8895', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8896', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8906', qtyPerSet: 4, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8955', qtyPerSet: 26, description: 'Nylon Cord Reinforced GRSP' }
  ],
  // RT-8779 – 60 kg 1 in 12 Turnout per Set (Total 351 Pads / 30 Items)
  'RT-8779': [
    { drawingNo: 'RT-8896', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8895', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8894', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8893', qtyPerSet: 36, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8906', qtyPerSet: 4, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10202', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10201', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10200', qtyPerSet: 4, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10199', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10198/2', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10198/1', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10198', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10164', qtyPerSet: 34, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10163', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10162', qtyPerSet: 30, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10161', qtyPerSet: 16, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10159', qtyPerSet: 182, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10215', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10214', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10213', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10212', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10211', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10210', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10209', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10208', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10207', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10206', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10205', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10204', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10203', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' }
  ],
  // TYPE 8 – Source: Northern Railway – Annexure-D | Date: 2026
  'RT-10241': [
    { drawingNo: 'RT-8893', qtyPerSet: 38, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8906', qtyPerSet: 4, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10161', qtyPerSet: 14, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10162', qtyPerSet: 28, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10163', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10164', qtyPerSet: 36, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10200', qtyPerSet: 4, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10202', qtyPerSet: 4, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10250', qtyPerSet: 232, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10251', qtyPerSet: 6, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10252', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10253', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10254', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10255', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10256', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10257', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10258', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10259', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10260', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10261', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10262', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10263', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10264', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10265', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10266', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10267', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10268', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10269', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10270', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10271', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10272', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10273', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10274', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10275', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10276', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' }
  ],
  // TYPE 9 – Source: Northern Railway – Annexure-E | Date: 2026
  'RT-10243': [
    { drawingNo: 'RT-10161', qtyPerSet: 14, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10250', qtyPerSet: 68, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10261', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10262', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10263', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10264', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10265', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10266', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10267', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10268', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10269', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10270', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10271', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10272', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10273', qtyPerSet: 2, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10274', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10275', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10276', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' }
  ],
  // RT-8822 – 10 mm Thick NCR GRSP for TWSEJ (Total 60 Pads)
  'RT-8822': [
    { drawingNo: 'RT-10156', qtyPerSet: 2, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10157', qtyPerSet: 16, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10155', qtyPerSet: 16, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10154', qtyPerSet: 4, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10153', qtyPerSet: 22, description: '10 mm Thick Nylon Cord Reinforced GRSP' }
  ],
  // RT-9790 – NCR GRSP – 1 in 12 60E1 Turnout (Total 351 Pads / 30 Items)
  'RT-9790': [
    { drawingNo: 'RT-9827', qtyPerSet: 6, description: 'NCR GRSP' },
    { drawingNo: 'RT-9826', qtyPerSet: 6, description: 'NCR GRSP' },
    { drawingNo: 'RT-9825', qtyPerSet: 2, description: 'NCR GRSP' },
    { drawingNo: 'RT-9824', qtyPerSet: 36, description: 'NCR GRSP' },
    { drawingNo: 'RT-9837', qtyPerSet: 4, description: 'NCR GRSP' },
    { drawingNo: 'RT-10118', qtyPerSet: 6, description: 'NCR GRSP' },
    { drawingNo: 'RT-10117', qtyPerSet: 2, description: 'NCR GRSP' },
    { drawingNo: 'RT-10116', qtyPerSet: 4, description: 'NCR GRSP' },
    { drawingNo: 'RT-10115', qtyPerSet: 2, description: 'NCR GRSP' },
    { drawingNo: 'RT-10114/2', qtyPerSet: 2, description: 'NCR GRSP' },
    { drawingNo: 'RT-10114/1', qtyPerSet: 2, description: 'NCR GRSP' },
    { drawingNo: 'RT-10114', qtyPerSet: 2, description: 'NCR GRSP' },
    { drawingNo: 'RT-10098', qtyPerSet: 34, description: 'NCR GRSP' },
    { drawingNo: 'RT-10097', qtyPerSet: 2, description: 'NCR GRSP' },
    { drawingNo: 'RT-10096', qtyPerSet: 30, description: 'NCR GRSP' },
    { drawingNo: 'RT-10093', qtyPerSet: 182, description: 'NCR GRSP' },
    { drawingNo: 'RT-10095', qtyPerSet: 16, description: 'NCR GRSP' },
    { drawingNo: 'RT-10031', qtyPerSet: 1, description: 'NCR GRSP' },
    { drawingNo: 'RT-10130', qtyPerSet: 1, description: 'NCR GRSP' },
    { drawingNo: 'RT-10129', qtyPerSet: 1, description: 'NCR GRSP' },
    { drawingNo: 'RT-10128', qtyPerSet: 1, description: 'NCR GRSP' },
    { drawingNo: 'RT-10127', qtyPerSet: 1, description: 'NCR GRSP' },
    { drawingNo: 'RT-10126', qtyPerSet: 1, description: 'NCR GRSP' },
    { drawingNo: 'RT-10125', qtyPerSet: 1, description: 'NCR GRSP' },
    { drawingNo: 'RT-10124', qtyPerSet: 1, description: 'NCR GRSP' },
    { drawingNo: 'RT-10123', qtyPerSet: 1, description: 'NCR GRSP' },
    { drawingNo: 'RT-10122', qtyPerSet: 1, description: 'NCR GRSP' },
    { drawingNo: 'RT-10121', qtyPerSet: 1, description: 'NCR GRSP' },
    { drawingNo: 'RT-10120', qtyPerSet: 1, description: 'NCR GRSP' },
    { drawingNo: 'RT-10119', qtyPerSet: 1, description: 'NCR GRSP' }
  ],
  // RT-9841 – 10 mm NCR GRSP – 1 in 8.5 60E1 Turnout (Total 234 Pads / 22 Items)
  'RT-9841': [
    { drawingNo: 'RT-10101', qtyPerSet: 2, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10102', qtyPerSet: 2, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10099', qtyPerSet: 2, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10098', qtyPerSet: 20, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10097', qtyPerSet: 2, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10096', qtyPerSet: 30, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10094', qtyPerSet: 116, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-9853', qtyPerSet: 6, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-9852', qtyPerSet: 22, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-9837', qtyPerSet: 4, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10100', qtyPerSet: 2, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10103', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10104', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10105', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10106', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10107', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10108', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10109', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10110', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10111', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10112', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10095', qtyPerSet: 16, description: '10 mm NCR GRSP' }
  ],
  // RT-9774 – Nylon Cord Reinforced GRSP for TWS 60 Kg 1 in 8.5 (Total 234 Pads / 22 Items)
  'RT-9774': [
    { drawingNo: 'RT-10168', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10167', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10165', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10164', qtyPerSet: 20, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10163', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10162', qtyPerSet: 30, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10160', qtyPerSet: 116, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8913', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8911', qtyPerSet: 22, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8906', qtyPerSet: 4, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10166', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10178', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10177', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10176', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10175', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10174', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10173', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10172', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10171', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10170', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10169', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10161', qtyPerSet: 16, description: 'Nylon Cord Reinforced GRSP' }
  ],
  // RT-4865 – 6 mm Thick Pocket Type NCR GRSP – 1 in 8.5 Turnout (Total 216 Pads / 17 Items)
  'RT-4865': [
    { drawingNo: 'RT-10162', qtyPerSet: 30, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10160', qtyPerSet: 116, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8911', qtyPerSet: 22, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8906', qtyPerSet: 4, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8913', qtyPerSet: 6, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-8955', qtyPerSet: 12, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10169', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10170', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10171', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10172', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10173', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10174', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10175', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10176', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10177', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10178', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RT-10161', qtyPerSet: 16, description: 'Pocket Type Nylon Cord Reinforced GRSP' }
  ],
  // RT-9842 to RT-9843 – 10 mm NCR GRSP – NFR RDSO/RT-9842+9843 1 in 8.5 (Total 132 Pads / 22 Items)
  'RT-9842 to RT-9843': [
    { drawingNo: 'RT-9837', qtyPerSet: 4, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-9852', qtyPerSet: 22, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-9853', qtyPerSet: 6, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10094', qtyPerSet: 48, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10095', qtyPerSet: 16, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10096', qtyPerSet: 4, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10097', qtyPerSet: 2, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10098', qtyPerSet: 20, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10099', qtyPerSet: 2, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10100', qtyPerSet: 2, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10101', qtyPerSet: 2, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10102', qtyPerSet: 2, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10103', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10104', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10105', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10106', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10107', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10108', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10109', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10110', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10111', qtyPerSet: 1, description: '10 mm NCR GRSP' },
    { drawingNo: 'RT-10112', qtyPerSet: 1, description: '10 mm NCR GRSP' }
  ]
};


const RAIL_PAD_TYPES = [
  '6.00mm GRSP',
  '10.00mm GRSP',
  '6.20mm CGRSP',
  '10.00mm CGRSP',
  '6.00mm NCRGRSP',
  '10.00mm NCRGRSP'
];

// Mock process inspection certificates and associated inventory batches if API returns empty
const DEFAULT_PROCESS_CERTIFICATES = [];
const DEFAULT_BATCH_INVENTORY = {};

const normalizeDwg = (dwg) => (dwg || '').replace(/^RDSO[\/-]/i, '').replace(/^(RT|T)[\/-]?/i, '').trim().toUpperCase();

const resolveNcrgrspCatalogKey = (dwgOrType, lotsData = []) => {
  if (!dwgOrType && (!lotsData || lotsData.length === 0)) {
    return 'RT-9790';
  }
  
  // 1. Direct key match
  if (NCRGRSP_CATALOG[dwgOrType]) return dwgOrType;

  // 2. Exact / normalized match on key names
  const norm = normalizeDwg(dwgOrType);
  for (const key of Object.keys(NCRGRSP_CATALOG)) {
    if (normalizeDwg(key) === norm || key.toLowerCase().includes(String(dwgOrType).toLowerCase()) || String(dwgOrType).toLowerCase().includes(key.toLowerCase())) {
      return key;
    }
  }

  // 3. Search drawing numbers inside catalog items
  const candidateDrawings = [dwgOrType];
  if (Array.isArray(lotsData)) {
    lotsData.forEach(l => (l.batches || l.rows || []).forEach(b => {
      if (b.drawingNo) candidateDrawings.push(b.drawingNo);
    }));
  }

  for (const d of candidateDrawings) {
    if (!d) continue;
    const normD = normalizeDwg(d);
    for (const [key, items] of Object.entries(NCRGRSP_CATALOG)) {
      if (items.some(item => normalizeDwg(item.drawingNo) === normD || normalizeDwg(item.drawingNo).includes(normD) || normD.includes(normalizeDwg(item.drawingNo)))) {
        return key;
      }
    }
  }

  if (String(dwgOrType).includes('10.00mm') || String(dwgOrType).includes('10mm') || String(dwgOrType).includes('9790') || String(dwgOrType).includes('10093') || String(dwgOrType).includes('10114')) {
    return 'RT-9790';
  }

  return Object.keys(NCRGRSP_CATALOG)[0];
};

// ─── Main NCRGRSP Component ───────────────────────────────────────────────────
const NCRGRSPFinalInspectionCall = ({
  srItem,
  poNo,
  plantId,
  vendorCode,
  onClose,
  onSubmitInspectionCall,
  initialRailPadType = Object.keys(NCRGRSP_CATALOG)[0],
  onRailPadTypeChange,
  isReadOnly = false,
  isModifyMode = false,
  callData = null
}) => {
  const effectivePoNo = poNo || callData?.poNo || callData?.po_no || '';
  const effectiveSrItem = srItem || {
    itemSrNo: callData?.poSr || callData?.po_sr || '1',
    orderedQty: callData?.orderedQty || callData?.totalQty || 0,
    acceptedTillNow: callData?.qtyAcceptedTillNow || 0,
    rejectedTillNow: callData?.qtyRejectedTillNow || 0,
    ...callData
  };
  const effectiveCallNo = callData?.callNo || callData?.call_no || '';

  const storageKey = useMemo(() => {
    const po = effectivePoNo ? String(effectivePoNo).replace(/[^a-zA-Z0-9_-]/g, '_') : 'PO';
    const sr = effectiveSrItem?.itemSrNo || effectiveSrItem?.srNo || '1';
    return `railpad_draft_ncrgrsp_${po}_${sr}`;
  }, [effectivePoNo, effectiveSrItem?.itemSrNo, effectiveSrItem?.srNo]);

  // Read saved draft on initialization if raising a new call (not view/modify mode)
  const savedDraft = useMemo(() => {
    if (callData || isReadOnly || isModifyMode) return null;
    try {
      const item = localStorage.getItem(storageKey);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.warn('Error reading saved draft:', e);
      return null;
    }
  }, [storageKey, callData, isReadOnly, isModifyMode]);

  const initialResolvedCatalog = callData
    ? resolveNcrgrspCatalogKey(callData?.drawingNo || callData?.railPadType || initialRailPadType, callData?.lots)
    : '';

  // ── Form State ──
  const [selectedRailPadType, setSelectedRailPadType] = useState(
    callData?.railPadType || savedDraft?.selectedRailPadType || initialRailPadType || '6.00mm NCRGRSP'
  );
  const [ncrgrspType, setNcrgrspType] = useState(initialResolvedCatalog || savedDraft?.ncrgrspType || '');
  const [selectedProcessCertNos, setSelectedProcessCertNos] = useState(
    callData?.processIcNo
      ? callData.processIcNo.split(',').map(s => s.trim()).filter(Boolean)
      : (savedDraft?.selectedProcessCertNos || [])
  );
  const [isCertDropdownOpen, setIsCertDropdownOpen] = useState(false);
  const certDropdownRef = useRef(null);

  const [isNcrgrspDropdownOpen, setIsNcrgrspDropdownOpen] = useState(false);
  const [ncrgrspSearchTerm, setNcrgrspSearchTerm] = useState('');
  const ncrgrspDropdownRef = useRef(null);

  const initialLotsCount = callData?.noOfLots || (callData?.lots && callData.lots.length > 0 ? callData.lots.length : (savedDraft?.noOfLots !== undefined ? savedDraft.noOfLots : (isReadOnly ? 1 : 0)));
  const [noOfLots, setNoOfLots] = useState(initialLotsCount);

  // Initial Sets Calculation
  const initialReqList = ((initialResolvedCatalog || savedDraft?.ncrgrspType) && NCRGRSP_CATALOG[initialResolvedCatalog || savedDraft?.ncrgrspType]) || [];
  const initialPerSet = initialReqList.reduce((acc, d) => acc + d.qtyPerSet, 0);
  const initialTotalOffered = callData?.totalQty || (callData?.lots || []).reduce((sum, l) => sum + (l.batches || []).reduce((bSum, b) => bSum + (b.qtyToUse || b.quantity || 0), 0), 0);
  const initialSets = callData?.noOfSets || callData?.no_of_sets || (savedDraft?.noOfSets !== undefined ? savedDraft.noOfSets : (initialPerSet > 0 && initialTotalOffered > 0 ? Math.max(1, Math.round(initialTotalOffered / initialPerSet)) : (isReadOnly ? 1 : 0)));
  const [noOfSets, setNoOfSets] = useState(initialSets);

  const [desiredDate, setDesiredDate] = useState(
    callData?.inspectionDate ? new Date(callData.inspectionDate).toISOString().split('T')[0] : (savedDraft?.desiredDate || new Date().toISOString().split('T')[0])
  );
  const [remarks, setRemarks] = useState(callData?.remarks || savedDraft?.remarks || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // ── Certificates list state ──
  const [processCertOptions, setProcessCertOptions] = useState([]);
  const [batchInventory, setBatchInventory] = useState([]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (certDropdownRef.current && !certDropdownRef.current.contains(e.target)) {
        setIsCertDropdownOpen(false);
      }
      if (ncrgrspDropdownRef.current && !ncrgrspDropdownRef.current.contains(e.target)) {
        setIsNcrgrspDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleProcessCert = (cert) => {
    setSelectedProcessCertNos(prev => {
      if (prev.includes(cert)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter(c => c !== cert);
      } else {
        return [...prev, cert];
      }
    });
  };

  const toggleSelectAllCerts = () => {
    if (selectedProcessCertNos.length === processCertOptions.length) {
      setSelectedProcessCertNos(processCertOptions[0] ? [processCertOptions[0]] : []);
    } else {
      setSelectedProcessCertNos([...processCertOptions]);
    }
  };

  // Fetch process inspection certificates from API
  useEffect(() => {
    const fetchCerts = async () => {
      if (!plantId) return;
      try {
        const cleanPo = effectivePoNo ? String(effectivePoNo).split('/')[0].trim() : '';
        // For NCRGRSP, process calls can be selected across any PO serial number under the same PO
        const calls = await inspectionCallService.getProcessCalls(
          selectedRailPadType || initialRailPadType || '6.00mm NCRGRSP',
          ncrgrspType || '',
          plantId,
          cleanPo,
          '' // Empty poSr so it fetches all process calls under this PO
        );
        if (Array.isArray(calls) && calls.length > 0) {
          const sortedCalls = [...calls].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.created_at || a.createdOn || 0);
            const dateB = new Date(b.createdAt || b.created_at || b.createdOn || 0);
            if (dateA.getTime() !== dateB.getTime()) {
              return dateB.getTime() - dateA.getTime();
            }
            const callNoA = String(a.inspectionCallNo || a.callNo || a.id || '');
            const callNoB = String(b.inspectionCallNo || b.callNo || b.id || '');
            return callNoB.localeCompare(callNoA, undefined, { numeric: true, sensitivity: 'base' });
          });
          const fetchedCertNos = sortedCalls.map(c => c.inspectionCallNo || c.callNo || c.id).filter(Boolean);
          if (fetchedCertNos.length > 0) {
            setProcessCertOptions(fetchedCertNos);
            setSelectedProcessCertNos(prev => {
              const validSelected = prev.filter(c => fetchedCertNos.includes(c));
              return validSelected.length > 0 ? validSelected : [fetchedCertNos[0]];
            });
          } else {
            setProcessCertOptions([]);
            setSelectedProcessCertNos([]);
          }
        } else {
          setProcessCertOptions([]);
          setSelectedProcessCertNos([]);
        }
      } catch (err) {
        console.warn('Error fetching process certs:', err);
        setProcessCertOptions([]);
        setSelectedProcessCertNos([]);
      }
    };
    fetchCerts();
  }, [selectedRailPadType, initialRailPadType, ncrgrspType, plantId, effectivePoNo]);

  // Fetch batches for all selected Process Certificates in PARALLEL
  useEffect(() => {
    const fetchBatches = async () => {
      if (!selectedProcessCertNos || selectedProcessCertNos.length === 0) {
        setBatchInventory([]);
        return;
      }
      try {
        const transformed = {};
        const results = await Promise.all(
          selectedProcessCertNos.map(async certNo => {
            try {
              const res = await inspectionCallService.getAvailableFinalBatches(certNo, effectiveCallNo);
              return (res && Array.isArray(res.batches)) ? res.batches : [];
            } catch (e) {
              console.warn(`Error fetching batches for cert ${certNo}:`, e);
              return [];
            }
          })
        );

        results.forEach(certBatches => {
          if (Array.isArray(certBatches)) {
            certBatches.forEach(b => {
              const bNo = String(b.batchNo || b.batch_no || b.declarationBatchId || 'B001');
              if (!transformed[bNo]) {
                transformed[bNo] = {
                  batchNo: bNo,
                  productionDate: b.productionDate || new Date().toISOString().split('T')[0],
                  drawings: {}
                };
              }
              const dwg = b.drawingNo || b.drawing_no || '';
              const manufactured = Number(b.qtyManufactured || b.quantityProduced || b.quantity || b.totalQty || 0);
              const rejected = Number(b.verificationRejectedQty || b.rejectedQty || b.qtyRejected || 0);
              const netAccepted = Math.max(0, manufactured - rejected);
              const previouslyOffered = Number(b.previouslyOfferedQty || b.alreadyOfferedQty || 0);
              const remainingQty = Math.max(0, netAccepted - previouslyOffered);

              const dwgInfo = {
                availableQty: netAccepted,
                previouslyOfferedQty: previouslyOffered,
                remainingQty: remainingQty
              };

              if (b.drawings) {
                Object.entries(b.drawings).forEach(([dNo, val]) => {
                  if (typeof val === 'object' && val !== null) {
                    transformed[bNo].drawings[dNo] = val;
                  } else {
                    transformed[bNo].drawings[dNo] = {
                      availableQty: Number(val) || 0,
                      previouslyOfferedQty: 0,
                      remainingQty: Number(val) || 0
                    };
                  }
                });
              } else if (dwg) {
                transformed[bNo].drawings[dwg] = dwgInfo;
              }
            });
          }
        });

        setBatchInventory(Object.values(transformed));
      } catch (err) {
        console.warn('Error fetching batch inventory:', err);
        setBatchInventory([]);
      }
    };
    fetchBatches();
  }, [selectedProcessCertNos, effectiveCallNo]);

  // ── Drawings list for selected NCRGRSP Type ──
  const requiredDrawingsList = useMemo(() => {
    if (!ncrgrspType || !NCRGRSP_CATALOG[ncrgrspType]) return [];
    const catalogEntry = NCRGRSP_CATALOG[ncrgrspType] || [];
    const safeList = Array.isArray(catalogEntry) ? catalogEntry : [];

    const setsCount = parseInt(noOfSets) || 0;
    return safeList.map((item, idx) => ({
      sl: idx + 1,
      drawingNo: item.drawingNo,
      description: item.description || 'Nylon Cord Reinforced GRSP',
      qtyPerSet: item.qtyPerSet || 1,
      requiredQty: (item.qtyPerSet || 1) * setsCount
    }));
  }, [ncrgrspType, noOfSets]);

  // Total required quantity across all drawings for selected sets
  const totalRequiredQty = useMemo(() => {
    return requiredDrawingsList.reduce((acc, item) => acc + item.requiredQty, 0);
  }, [requiredDrawingsList]);

  // ── Dynamic Lots State ──
  const [lots, setLots] = useState(() => {
    if (savedDraft?.lots && Array.isArray(savedDraft.lots) && savedDraft.lots.length > 0) {
      return savedDraft.lots;
    }
    return [];
  });
  const [expandedLots, setExpandedLots] = useState({ 0: true, 1: true, 2: true });

  // Persist form draft to localStorage whenever form state changes (only for new calls)
  useEffect(() => {
    if (callData || isReadOnly || isModifyMode) return;
    try {
      const draftData = {
        selectedRailPadType,
        ncrgrspType,
        selectedProcessCertNos,
        noOfLots,
        noOfSets,
        desiredDate,
        remarks,
        lots
      };
      localStorage.setItem(storageKey, JSON.stringify(draftData));
    } catch (e) {
      console.warn('Error saving draft:', e);
    }
  }, [
    storageKey,
    callData,
    isReadOnly,
    isModifyMode,
    selectedRailPadType,
    ncrgrspType,
    selectedProcessCertNos,
    noOfLots,
    noOfSets,
    desiredDate,
    remarks,
    lots
  ]);

  // Initialize or adjust lots structure when noOfLots changes
  useEffect(() => {
    if (isReadOnly) return; // In read-only mode, lots are populated directly from callData
    const count = parseInt(noOfLots) || 0;
    setLots(prevLots => {
      const newLots = [...prevLots];
      if (count === 0) return [];
      if (count > newLots.length) {
        for (let i = newLots.length; i < count; i++) {
          newLots.push({
            stableId: `lot_stable_${i + 1}`,
            lotId: `Lot ${i + 1}`,
            lotName: `Lot ${i + 1}`,
            lotIndex: i,
            rows: [
              {
                id: `row-${i + 1}-1`,
                batchNo: '',
                drawingNo: '',
                qtyToUse: 0
              }
            ]
          });
        }
      } else if (newLots.length > count) {
        return newLots.slice(0, count);
      }
      return newLots;
    });

    setExpandedLots(prev => {
      const exp = { ...prev };
      for (let i = 0; i < count; i++) {
        if (exp[i] === undefined) exp[i] = true;
      }
      return exp;
    });
  }, [noOfLots, isReadOnly]);

  // Populate from existing callData (for Read-Only or View mode)
  useEffect(() => {
    if (callData) {
      if (callData.railPadType) setSelectedRailPadType(callData.railPadType);

      const resolvedCatalogKey = resolveNcrgrspCatalogKey(callData.drawingNo || callData.railPadType, callData.lots);
      setNcrgrspType(resolvedCatalogKey);

      if (callData.processIcNo) {
        setSelectedProcessCertNos(callData.processIcNo.split(',').map(s => s.trim()).filter(Boolean));
      }
      if (callData.inspectionDate) {
        try {
          setDesiredDate(new Date(callData.inspectionDate).toISOString().split('T')[0]);
        } catch (e) {
          setDesiredDate(callData.inspectionDate);
        }
      }
      if (callData.remarks) setRemarks(callData.remarks);

      const lotsCount = callData.noOfLots || (callData.lots && callData.lots.length > 0 ? callData.lots.length : 1);
      setNoOfLots(lotsCount);

      if (Array.isArray(callData.lots) && callData.lots.length > 0) {
        const mappedLots = callData.lots.map((l, lIdx) => ({
          stableId: `lot_stable_${lIdx + 1}`,
          lotId: l.lotNo || `Lot ${lIdx + 1}`,
          lotName: l.lotNo || `Lot ${lIdx + 1}`,
          lotIndex: lIdx,
          lotSize: l.lotSize || (l.batches || []).reduce((sum, b) => sum + (b.qtyToUse || b.quantity || 0), 0),
          rows: (l.batches && l.batches.length > 0) ? l.batches.map((b, bIdx) => ({
            id: `row-${lIdx + 1}-${bIdx + 1}`,
            batchNo: b.batchNo || '',
            drawingNo: b.drawingNo || '',
            qtyToUse: b.qtyToUse || b.quantity || 0,
            availableQty: b.availableQty || (b.qtyToUse || b.quantity || 0),
            previouslyOfferedQty: b.previouslyOfferedQty || 0,
            balanceQty: b.balanceQty !== undefined ? b.balanceQty : 0
          })) : [{
            id: `row-${lIdx + 1}-1`,
            batchNo: '',
            drawingNo: '',
            qtyToUse: 0
          }]
        }));
        setLots(mappedLots);

        const totalOffered = callData.totalQty || mappedLots.reduce((sum, lot) => sum + (lot.rows || []).reduce((rSum, r) => rSum + (parseInt(r.qtyToUse) || 0), 0), 0);
        const reqList = NCRGRSP_CATALOG[resolvedCatalogKey] || [];
        const totalPerSet = reqList.reduce((acc, d) => acc + d.qtyPerSet, 0);

        let calculatedSets = 1;
        if (callData.noOfSets) {
          calculatedSets = callData.noOfSets;
        } else if (callData.no_of_sets) {
          calculatedSets = callData.no_of_sets;
        } else if (totalPerSet > 0 && totalOffered > 0) {
          calculatedSets = Math.max(1, Math.round(totalOffered / totalPerSet));
        }
        setNoOfSets(calculatedSets);
      } else {
        const calculatedSets = callData.noOfSets || callData.no_of_sets || 1;
        setNoOfSets(calculatedSets);
      }
    }
  }, [callData]);

  // Handle Lot Name change
  const handleLotNameChange = (lotIdx, newName) => {
    setLots(prev => {
      const updated = [...prev];
      updated[lotIdx] = {
        ...updated[lotIdx],
        lotName: newName,
        lotId: newName
      };
      return updated;
    });
  };

  // Handle lot panel expand/collapse toggle
  const toggleLotExpansion = (index) => {
    setExpandedLots(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Add a new row to a specific lot
  const handleAddRow = (lotIdx) => {
    setLots(prev => {
      const updated = [...prev];
      const targetLot = { ...updated[lotIdx] };
      const newRow = {
        id: `row-${lotIdx + 1}-${Date.now()}`,
        batchNo: '',
        drawingNo: '',
        qtyToUse: 0
      };
      targetLot.rows = [...(targetLot.rows || []), newRow];
      updated[lotIdx] = targetLot;
      return updated;
    });
  };

  // Delete a row from a specific lot
  const handleDeleteRow = (lotIdx, rowId) => {
    setLots(prev => {
      const updated = [...prev];
      const targetLot = { ...updated[lotIdx] };
      if (targetLot.rows.length <= 1) return prev;
      targetLot.rows = targetLot.rows.filter(r => r.id !== rowId);
      updated[lotIdx] = targetLot;
      return updated;
    });
  };

  // Handle Batch change in a lot row: resets drawing and qty for that row
  const handleRowBatchChange = (lotIdx, rowId, newBatchNo) => {
    setLots(prev => {
      const updated = [...prev];
      const targetLot = { ...updated[lotIdx] };
      targetLot.rows = (targetLot.rows || []).map(r => {
        if (r.id === rowId) {
          return {
            ...r,
            batchNo: newBatchNo,
            drawingNo: '',
            qtyToUse: 0
          };
        }
        return r;
      });
      updated[lotIdx] = targetLot;
      return updated;
    });
  };

  // Handle Drawing change in a lot row: blocks duplicate (batchNo + drawingNo) in same lot
  const handleRowDrawingChange = (lotIdx, rowId, newDrawingNo) => {
    setLots(prev => {
      const updated = [...prev];
      const targetLot = { ...updated[lotIdx] };

      const targetRow = targetLot.rows.find(r => r.id === rowId);
      if (targetRow) {
        const isDuplicate = targetLot.rows.some(
          r => r.id !== rowId && String(r.batchNo) === String(targetRow.batchNo) && r.drawingNo === newDrawingNo
        );
        if (isDuplicate) {
          return prev;
        }
      }

      targetLot.rows = targetLot.rows.map(r => {
        if (r.id === rowId) {
          return { ...r, drawingNo: newDrawingNo, qtyToUse: 0 };
        }
        return r;
      });
      updated[lotIdx] = targetLot;
      return updated;
    });
  };

  // Handle Qty to Use change in a lot row (strictly capped to Available - Previously Offered)
  const handleRowQtyChange = (lotIdx, rowId, value) => {
    setLots(prev => {
      const updated = [...prev];
      const targetLot = { ...updated[lotIdx] };
      targetLot.rows = targetLot.rows.map(r => {
        if (r.id === rowId) {
          const isDuplicate = targetLot.rows.some(
            other => other.id !== r.id && String(other.batchNo) === String(r.batchNo) && other.drawingNo === r.drawingNo
          );
          if (isDuplicate) {
            return { ...r, qtyToUse: 0 };
          }
          const info = getBatchDrawingInfo(r.batchNo, r.drawingNo);
          const maxAllowed = Math.max(0, info.availableQty - info.previouslyOfferedQty);
          const parsed = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
          const cappedVal = Math.min(maxAllowed, parsed);
          return { ...r, qtyToUse: cappedVal };
        }
        return r;
      });
      updated[lotIdx] = targetLot;
      return updated;
    });
  };

  // ── Calculation: Synchronized Real-time Drawing Requirement Summary ──
  const drawingSummaryData = useMemo(() => {
    // Sum qtyToUse for each drawing across all lots
    const allocatedMap = {};
    lots.forEach(lot => {
      (lot.rows || []).forEach(row => {
        if (row.drawingNo) {
          allocatedMap[row.drawingNo] = (allocatedMap[row.drawingNo] || 0) + (parseInt(row.qtyToUse) || 0);
        }
      });
    });

    // Sum total remaining inventory per drawing across all batches
    const inventoryMap = {};
    batchInventory.forEach(b => {
      if (b.drawings) {
        Object.entries(b.drawings).forEach(([dwg, val]) => {
          const avail = typeof val === 'object' && val !== null ? val.availableQty : (Number(val) || 0);
          inventoryMap[dwg] = (inventoryMap[dwg] || 0) + avail;
        });
      }
    });

    const getInventoryForDrawing = (dwgNo) => {
      if (inventoryMap[dwgNo] !== undefined) return inventoryMap[dwgNo];
      const normTarget = normalizeDwg(dwgNo);
      let matchSum = 0;
      let found = false;
      Object.entries(inventoryMap).forEach(([k, q]) => {
        const normK = normalizeDwg(k);
        if (normK === normTarget) {
          matchSum += q;
          found = true;
        }
      });
      return found ? matchSum : 0;
    };

    return requiredDrawingsList.map(item => {
      const offered = allocatedMap[item.drawingNo] || 0;
      const totalInv = getInventoryForDrawing(item.drawingNo);
      const progressPercent = item.requiredQty > 0 ? Math.min(100, Math.round((offered / item.requiredQty) * 100)) : 0;
      const isComplete = offered === item.requiredQty;
      const isExceeded = offered > item.requiredQty;

      return {
        ...item,
        offeredQty: offered,
        availableInventory: totalInv,
        progressPercent,
        isComplete,
        isExceeded
      };
    });
  }, [requiredDrawingsList, lots, batchInventory]);

  // Totals for Summary Table Footer
  const totalOfferedQty = useMemo(() => {
    return drawingSummaryData.reduce((acc, row) => acc + row.offeredQty, 0);
  }, [drawingSummaryData]);

  // Helper: get drawings available in a specific batch
  const getDrawingsForBatch = (batchNo) => {
    if (!batchNo) return [];
    const batchObj = batchInventory.find(b => String(b.batchNo) === String(batchNo));
    if (batchObj && batchObj.drawings) {
      const batchDrawingNos = Object.keys(batchObj.drawings);
      const filtered = requiredDrawingsList.filter(d => {
        const normReq = normalizeDwg(d.drawingNo);
        return batchDrawingNos.some(bNo => {
          const normB = normalizeDwg(bNo);
          return normB === normReq;
        });
      });
      if (filtered.length > 0) return filtered;
    }
    return [];
  };

  // Helper: get drawing information (available, previously offered, remaining) for a specific batch and drawing
  const getBatchDrawingInfo = (batchNo, drawingNo) => {
    if (!batchNo || !drawingNo) return { availableQty: 0, previouslyOfferedQty: 0, remainingQty: 0 };
    const batchObj = batchInventory.find(b => String(b.batchNo) === String(batchNo));
    if (!batchObj || !batchObj.drawings) return { availableQty: 0, previouslyOfferedQty: 0, remainingQty: 0 };
    if (batchObj.drawings[drawingNo] !== undefined) {
      const val = batchObj.drawings[drawingNo];
      if (typeof val === 'object' && val !== null) return val;
      return { availableQty: Number(val) || 0, previouslyOfferedQty: 0, remainingQty: Number(val) || 0 };
    }
    const normTarget = normalizeDwg(drawingNo);
    for (const [k, v] of Object.entries(batchObj.drawings)) {
      const normK = normalizeDwg(k);
      if (normK === normTarget) {
        if (typeof v === 'object' && v !== null) return v;
        return { availableQty: Number(v) || 0, previouslyOfferedQty: 0, remainingQty: Number(v) || 0 };
      }
    }
    return { availableQty: 0, previouslyOfferedQty: 0, remainingQty: 0 };
  };

  const getBatchDrawingAvailableQty = (batchNo, drawingNo) => {
    return getBatchDrawingInfo(batchNo, drawingNo).availableQty;
  };

  const getBatchDrawingPreviouslyOfferedQty = (batchNo, drawingNo) => {
    return getBatchDrawingInfo(batchNo, drawingNo).previouslyOfferedQty;
  };

  const getBatchDrawingRemainingQty = (batchNo, drawingNo) => {
    return getBatchDrawingInfo(batchNo, drawingNo).remainingQty;
  };

  // Auto-calculate required lots whenever totalRequiredQty or totalOfferedQty changes based on 5000 max capacity per lot
  useEffect(() => {
    const qtyToCount = Math.max(totalRequiredQty || 0, totalOfferedQty || 0);
    if (qtyToCount > 0) {
      const minLots = Math.max(1, Math.ceil(qtyToCount / 5000));
      setNoOfLots(prev => Math.max(prev || 0, minLots));
    } else {
      setNoOfLots(0);
    }
  }, [totalRequiredQty, totalOfferedQty]);

  // ── Validation Rules ──
  const validationResult = useMemo(() => {
    const errors = [];
    if (!ncrgrspType) errors.push('Please select an NCRGRSP Type.');
    if (!selectedProcessCertNos || selectedProcessCertNos.length === 0) errors.push('Process Inspection Certificate is required.');
    if (!noOfSets || noOfSets <= 0) errors.push('Number of sets must be greater than 0.');
    if (!noOfLots || noOfLots <= 0) errors.push('Number of lots must be greater than 0.');

    // Check minimum lots required for total quantity (Max 5,000 Nos. per Lot)
    const effectiveTotalQty = Math.max(totalRequiredQty || 0, totalOfferedQty || 0);
    const minLotsRequired = Math.max(1, Math.ceil(effectiveTotalQty / 5000));
    if (noOfLots < minLotsRequired) {
      errors.push(`For total quantity of ${effectiveTotalQty.toLocaleString()} Nos., minimum ${minLotsRequired} lot(s) are required (max 5,000 Nos. per lot).`);
    }

    // Check if any single lot exceeds 5,000 Nos.
    lots.forEach((lot, lIdx) => {
      const lotTotal = (lot.rows || []).reduce((sum, r) => sum + (parseInt(r.qtyToUse) || 0), 0);
      if (lotTotal > 5000) {
        errors.push(`Lot ${lIdx + 1}: Total lot quantity (${lotTotal.toLocaleString()} Nos.) exceeds maximum limit of 5,000 Nos. per lot.`);
      }

      // Prevent duplicate (batchNo + drawingNo) combinations in the same lot
      const seenCombos = new Set();
      (lot.rows || []).forEach(r => {
        if (r.batchNo && r.drawingNo) {
          const comboKey = `${r.batchNo}___${r.drawingNo}`;
          if (seenCombos.has(comboKey)) {
            errors.push(`${lot.lotName || lot.lotId}: Duplicate entry for Batch ${r.batchNo} and Drawing ${r.drawingNo} is not allowed.`);
          }
          seenCombos.add(comboKey);
        }
      });
    });

    // Check if any drawing is under-allocated (less than required quantity)
    // Vendor can submit when offered qty is equal to or exceeds required qty
    drawingSummaryData.forEach(dwg => {
      if (dwg.offeredQty < dwg.requiredQty) {
        errors.push(`Drawing ${dwg.drawingNo}: Allocated ${dwg.offeredQty} of ${dwg.requiredQty} required.`);
      }
    });

    // Check if any row qtyToUse exceeds allowable balance qty for that batch & drawing
    lots.forEach(lot => {
      (lot.rows || []).forEach((r, rIdx) => {
        if (r.batchNo && r.drawingNo) {
          const info = getBatchDrawingInfo(r.batchNo, r.drawingNo);
          const maxAllowed = Math.max(0, info.availableQty - info.previouslyOfferedQty);
          if (r.qtyToUse > maxAllowed) {
            errors.push(`${lot.lotName || lot.lotId} Row ${rIdx + 1}: Qty to Use (${r.qtyToUse}) exceeds allowable balance quantity (${maxAllowed}).`);
          }
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [selectedProcessCertNos, noOfSets, noOfLots, totalRequiredQty, totalOfferedQty, drawingSummaryData, lots]);

  // ── Submit Handler ──
  const handleSubmitCall = async () => {
    if (!validationResult.isValid) {
      setNotification({
        type: 'error',
        message: 'Please complete required allocations:\n' + validationResult.errors.slice(0, 3).join('\n')
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    try {
      setIsSubmitting(true);
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = storedUser.id || storedUser.userId || localStorage.getItem('railpad_userId') || user?.id || 195;

      const payload = {
        inspectionCallType: 'FINAL',
        callType: 'FINAL',
        productType: 'NCRGRSP',
        ncrgrspType,
        drawingNo: ncrgrspType,
        railPadType: selectedRailPadType || '10.00mm NCRGRSP',
        createdBy: userId,
        updatedBy: userId,
        processInspectionCertNo: selectedProcessCertNos.join(','),
        processIcNo: selectedProcessCertNos.join(','),
        poNo: poNo || '60250003104659',
        poSrNo: srItem?.itemSrNo || srItem?.srNo || '1',
        poSr: srItem?.itemSrNo || srItem?.srNo || '1',
        plantId: (plantId || '').replace(/^:/, ''),
        vendorCode: (vendorCode || '').replace(/^:/, ''),
        noOfSets,
        noOfLots,
        desiredInspectionDate: desiredDate,
        inspectionDate: desiredDate,
        totalRequiredQty,
        totalOfferedQty,
        totalQty: totalOfferedQty,
        drawingRequirementSummary: drawingSummaryData,
        lots: lots.map(l => ({
          lotNo: l.lotName || l.lotId,
          lotSize: (l.rows || []).reduce((sum, r) => sum + (parseInt(r.qtyToUse) || 0), 0),
          batches: (l.rows || []).map(r => ({
            batchNo: r.batchNo,
            drawingNo: r.drawingNo,
            availableQty: getBatchDrawingAvailableQty(r.batchNo, r.drawingNo),
            quantity: parseInt(r.qtyToUse) || 0,
            qtyToUse: parseInt(r.qtyToUse) || 0,
            balanceQty: Math.max(0, getBatchDrawingAvailableQty(r.batchNo, r.drawingNo) - (parseInt(r.qtyToUse) || 0))
          }))
        })),
        lotFormations: lots.map(l => ({
          lotId: l.lotName || l.lotId,
          rows: l.rows.map(r => ({
            batchNo: r.batchNo,
            drawingNo: r.drawingNo,
            availableQty: getBatchDrawingAvailableQty(r.batchNo, r.drawingNo),
            qtyToUse: r.qtyToUse,
            balanceQty: Math.max(0, getBatchDrawingAvailableQty(r.batchNo, r.drawingNo) - r.qtyToUse)
          }))
        })),
        remarks
      };

      console.log('Submitting NCRGRSP Final Inspection Call payload:', payload);

      let res;
      if (onSubmitInspectionCall) {
        res = await onSubmitInspectionCall(payload);
      } else {
        res = await inspectionCallService.create(payload);
      }

      // Clear draft on successful submission only!
      try {
        localStorage.removeItem(storageKey);
        const wrapperKey = `railpad_draft_call_type_${String(effectivePoNo).replace(/[^a-zA-Z0-9_-]/g, '_')}_${effectiveSrItem?.itemSrNo || effectiveSrItem?.srNo || '1'}`;
        localStorage.removeItem(wrapperKey);
      } catch (e) {
        console.warn('Error clearing draft:', e);
      }

      setNotification({
        type: 'success',
        message: 'NCRGRSP Final Inspection Call Raised Successfully!\nCall Reference: ' + (res?.callNo || res?.data?.callNo || ('FIC-NCR-' + Date.now().toString().slice(-6)))
      });

      setTimeout(() => {
        setNotification(null);
        if (onClose) onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting call:', err);
      setNotification({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Failed to submit Final Inspection Call. Please try again.'
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ──
  return (
    <div style={{
      background: '#f8fafc',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#0f172a',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: notification.type === 'success' ? '#065f46' : '#991b1b',
          color: '#fff', padding: '14px 24px', borderRadius: 10,
          boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: 12,
          zIndex: 10000, minWidth: 340, fontWeight: 600, fontSize: 14
        }}>
          {notification.type === 'success' ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
          <div style={{ whiteSpace: 'pre-line' }}>{notification.message}</div>
        </div>
      )}

      {/* Top Banner (Read-Only or Modify Mode) */}
      {(isReadOnly || isModifyMode || (callData && effectiveCallNo)) && (
        <div style={{
          background: 'linear-gradient(135deg, #0d3b3f 0%, #21808d 100%)',
          padding: '16px 24px', color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85, marginBottom: '4px' }}>
              {isReadOnly ? 'VIEW FINAL INSPECTION CALL (READ-ONLY)' : 'MODIFY FINAL INSPECTION CALL'}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
              <Package size={22} />
              <span>CALL NO: <span style={{ color: '#fef08a' }}>{effectiveCallNo}</span></span>
              <span style={{ fontSize: '14px', fontWeight: 700, opacity: 0.9, marginLeft: '8px' }}>
                — {effectivePoNo ? `PO: ${effectivePoNo}` : ''} {effectiveSrItem?.itemSrNo ? `(SR: ${effectiveSrItem.itemSrNo})` : ''}
              </span>
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255, 255, 255, 0.2)', border: 'none', borderRadius: '50%',
            width: '36px', height: '36px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: '#ffffff', transition: 'all 0.2s'
          }}>
            <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>
      )}

      {/* Main Form Scroll Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Top Field: Type of Call */}
          <div style={{
            background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)', padding: '14px 20px'
          }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              TYPE OF CALL <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              readOnly
              disabled
              value="Final"
              style={{
                width: '260px', padding: '8px 14px', borderRadius: '8px',
                border: '1px solid #cbd5e1', background: '#f8fafc',
                color: '#1e293b', fontWeight: 800, fontSize: '14px'
              }}
            />
          </div>

          {/* ========================================================================= */}
          {/* SECTION A – CALL HEADER & PO INFORMATION */}
          {/* ========================================================================= */}
          <div style={{
            background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)', padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Package size={18} style={{ color: '#1677ff' }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                Section A – Call Header & PO Information
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 12
            }}>
              {/* PO No + PO Sr No — single unified card spanning 2 columns */}
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
                padding: '8px 12px', display: 'flex', gap: 24, alignItems: 'flex-start',
                gridColumn: 'span 2'
              }}>
                <div style={{ minWidth: 0, flex: 2 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>PO No</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{effectivePoNo || '60250003104659'}</div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>PO Sr No</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#1e293b' }}>{effectiveSrItem?.itemSrNo || effectiveSrItem?.srNo || '1'}</div>
                </div>
              </div>

              <HeaderCard label="Call Date" value={desiredDate} highlightColor="#1677ff" />
              <HeaderCard label="Ordered Qty" value={(effectiveSrItem?.orderedQty || effectiveSrItem?.ordered || 10000).toLocaleString()} />
              <HeaderCard label="Offered Qty" value={totalOfferedQty.toLocaleString()} highlightColor="#722ed1" />
              <HeaderCard label="Accepted Qty" value={(effectiveSrItem?.acceptedTillNow || 0).toLocaleString()} highlightColor="#52c41a" />
              <HeaderCard label="Rejected Qty" value={(effectiveSrItem?.rejectedTillNow || 0).toLocaleString()} highlightColor="#ff4d4f" />
              <HeaderCard
                label="Balance Qty"
                value={Math.max(0, (effectiveSrItem?.orderedQty || effectiveSrItem?.ordered || 10000) - (effectiveSrItem?.acceptedTillNow || 0)).toLocaleString()}
                highlightColor="#fa8c16"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION B – NCRGRSP CONFIGURATION */}
          {/* ========================================================================= */}
          <div style={{
            background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)', padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Layers size={18} style={{ color: '#1677ff' }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                Section B – NCRGRSP Configuration
              </span>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16
            }}>
              {/* Rail Pad Type Dropdown */}
              <div>
                <label style={labelStyle}>Rail Pad Type <span style={{ color: '#ff4d4f' }}>*</span></label>
                {isReadOnly ? (
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={selectedRailPadType}
                    style={{ ...inputStyle, background: '#f8fafc', fontWeight: 700, color: '#1e293b' }}
                  />
                ) : (
                  <select
                    value={selectedRailPadType}
                    onChange={e => {
                      const val = e.target.value;
                      setSelectedRailPadType(val);
                      if (onRailPadTypeChange) {
                        onRailPadTypeChange(val);
                      }
                      if (NCRGRSP_CATALOG[val]) {
                        setNcrgrspType(val);
                      }
                      setLots([{ id: 1, rows: [] }]);
                    }}
                    style={selectStyle}
                  >
                    <option value="" disabled>Select Rail Pad Type</option>
                    {RAIL_PAD_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* NCRGRSP Type Select (Searchable & Compact) */}
              <div style={{ position: 'relative' }} ref={ncrgrspDropdownRef}>
                <label style={labelStyle}>
                  NCRGRSP Type <span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                {isReadOnly ? (
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={ncrgrspType || 'N/A'}
                    style={{ ...inputStyle, background: '#f8fafc', fontWeight: 700, color: '#1e293b' }}
                  />
                ) : (
                  <>
                    <div
                      onClick={() => {
                        setIsNcrgrspDropdownOpen(prev => !prev);
                        setNcrgrspSearchTerm('');
                      }}
                      style={{
                        ...selectStyle,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: '#fff',
                        minHeight: 38,
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8, fontSize: 13, fontWeight: ncrgrspType ? 700 : 500, color: ncrgrspType ? '#1e293b' : '#94a3b8' }}>
                        {ncrgrspType || 'Select NCRGRSP Type'}
                      </div>
                      <ChevronDown size={16} style={{ color: '#64748b', flexShrink: 0, transform: isNcrgrspDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>

                    {isNcrgrspDropdownOpen && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                        background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        zIndex: 1100, padding: 6, width: '100%'
                      }}>
                        {/* Compact Search Input */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
                          background: '#f1f5f9', borderRadius: 6, marginBottom: 6, border: '1px solid #e2e8f0'
                        }}>
                          <Search size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                          <input
                            type="text"
                            placeholder="Search type... (e.g. 6154)"
                            value={ncrgrspSearchTerm}
                            onChange={e => setNcrgrspSearchTerm(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            autoFocus
                            style={{
                              border: 'none', background: 'transparent', outline: 'none',
                              fontSize: 12, fontWeight: 600, width: '100%', color: '#0f172a'
                            }}
                          />
                          {ncrgrspSearchTerm && (
                            <X
                              size={13}
                              style={{ color: '#94a3b8', cursor: 'pointer' }}
                              onClick={(e) => { e.stopPropagation(); setNcrgrspSearchTerm(''); }}
                            />
                          )}
                        </div>

                        {/* Compact Scrollable Options List */}
                        <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {Object.keys(NCRGRSP_CATALOG)
                            .filter(type => type.toLowerCase().includes(ncrgrspSearchTerm.trim().toLowerCase()))
                            .map(type => {
                              const isSelected = ncrgrspType === type;
                              return (
                                <div
                                  key={type}
                                  onClick={() => {
                                    setNcrgrspType(type);
                                    setIsNcrgrspDropdownOpen(false);
                                  }}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: 5,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: isSelected ? 800 : 600,
                                    color: isSelected ? '#1677ff' : '#334155',
                                    background: isSelected ? '#eff6ff' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'background 0.15s'
                                  }}
                                  onMouseEnter={e => {
                                    if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                                  }}
                                  onMouseLeave={e => {
                                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                                  }}
                                >
                                  <span>{type}</span>
                                  {isSelected && <Check size={14} style={{ color: '#1677ff' }} />}
                                </div>
                              );
                            })}
                          {Object.keys(NCRGRSP_CATALOG).filter(type => type.toLowerCase().includes(ncrgrspSearchTerm.trim().toLowerCase())).length === 0 && (
                            <div style={{ padding: '10px 8px', fontSize: 12, color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>
                              No matching type found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Process Inspection Certificate Multi-Select Dropdown */}
              <div style={{ position: 'relative' }} ref={certDropdownRef}>
                <label style={labelStyle}>
                  Process Inspection Certificate <span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                {isReadOnly ? (
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={selectedProcessCertNos.join(', ') || 'N/A'}
                    style={{ ...inputStyle, background: '#f8fafc', fontWeight: 700, color: '#0958d9' }}
                  />
                ) : (
                  <>
                    <div
                      onClick={() => setIsCertDropdownOpen(!isCertDropdownOpen)}
                      style={{
                        ...selectStyle,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: '#fff',
                        minHeight: 38
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                        {selectedProcessCertNos.length === 0
                          ? <span style={{ color: '#94a3b8', fontWeight: 500 }}>Select Process Certificate(s)</span>
                          : selectedProcessCertNos.join(', ')}
                      </div>
                      <ChevronDown size={16} style={{ color: '#64748b', flexShrink: 0 }} />
                    </div>

                    {isCertDropdownOpen && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                        background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000, padding: 8, maxHeight: 220, overflowY: 'auto'
                      }}>
                        <div
                          onClick={toggleSelectAllCerts}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                            borderRadius: 6, cursor: 'pointer', background: '#f8fafc', marginBottom: 4,
                            fontWeight: 700, fontSize: 12, color: '#0f172a'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedProcessCertNos.length === processCertOptions.length}
                            onChange={() => { }}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>Select All ({processCertOptions.length})</span>
                        </div>

                        {processCertOptions.map(cert => {
                          const isSelected = selectedProcessCertNos.includes(cert);
                          return (
                            <div
                              key={cert}
                              onClick={() => toggleProcessCert(cert)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                                borderRadius: 6, cursor: 'pointer',
                                background: isSelected ? '#eff6ff' : 'transparent',
                                color: isSelected ? '#1d4ed8' : '#334155',
                                fontWeight: isSelected ? 700 : 500,
                                fontSize: 12, marginBottom: 2
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => { }}
                                style={{ cursor: 'pointer' }}
                              />
                              <span>{cert}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* No of Sets to be Offered */}
              <div>
                <label style={labelStyle}>No. of Sets to be Offered <span style={{ color: '#ff4d4f' }}>*</span></label>
                <input
                  type="number"
                  min="0"
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  placeholder="Enter No. of Sets"
                  value={isReadOnly ? (noOfSets || 1) : (noOfSets === 0 ? '' : noOfSets)}
                  onChange={e => {
                    const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0);
                    setNoOfSets(val);
                  }}
                  style={{
                    ...inputStyle,
                    background: isReadOnly ? '#f8fafc' : '#fff',
                    fontWeight: isReadOnly ? 700 : 500
                  }}
                />
              </div>

              {/* No of Lots */}
              <div>
                <label style={labelStyle}>No. of Lots <span style={{ color: '#ff4d4f' }}>*</span></label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  placeholder="Enter No. of Lots"
                  value={isReadOnly ? (noOfLots || (lots.length > 0 ? lots.length : 1)) : (noOfLots === 0 ? '' : noOfLots)}
                  onChange={e => {
                    const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0);
                    setNoOfLots(val);
                  }}
                  style={{
                    ...inputStyle,
                    background: isReadOnly ? '#f8fafc' : '#fff',
                    fontWeight: isReadOnly ? 700 : 500
                  }}
                />
              </div>

              {/* Desired Inspection Date */}
              <div>
                <label style={labelStyle}>Desired Inspection Date <span style={{ color: '#ff4d4f' }}>*</span></label>
                <input
                  type={isReadOnly ? "text" : "date"}
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  value={desiredDate}
                  onChange={e => setDesiredDate(e.target.value)}
                  style={{
                    ...inputStyle,
                    background: isReadOnly ? '#f8fafc' : '#fff',
                    fontWeight: isReadOnly ? 700 : 500
                  }}
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION C – DRAWING REQUIREMENT SUMMARY */}
          {/* ========================================================================= */}
          <div style={{
            background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)', padding: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={18} style={{ color: '#1677ff' }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                  Section C – Drawing Requirement Summary
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{
                  background: '#e6f4ff', color: '#0958d9', fontWeight: 800,
                  fontSize: 12, padding: '4px 12px', borderRadius: 20, border: '1px solid #91caff'
                }}>
                  Total Required Qty: {totalRequiredQty.toLocaleString()}
                </span>
                <span style={{
                  background: '#fff7e6', color: '#d46b08', fontWeight: 800,
                  fontSize: 12, padding: '4px 12px', borderRadius: 20, border: '1px solid #ffd591'
                }}>
                  Total Qty to be Offered: {totalOfferedQty.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                    <th style={thStyle}>Sl.</th>
                    <th style={thStyle}>Drawing No.</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Qty/Set</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Required Qty</th>
                    <th style={{ ...thStyle, textAlign: 'center', color: '#0958d9' }}>Qty to be Offered</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Available Inventory</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Allocation Status</th>
                  </tr>
                </thead>
                <tbody>
                  {drawingSummaryData.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: 13 }}>
                        Please select an NCRGRSP Type above to view required drawings and batch allocation.
                      </td>
                    </tr>
                  ) : (
                    drawingSummaryData.map((row, idx) => (
                    <tr key={row.drawingNo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}>{idx + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#1677ff' }}>{row.drawingNo}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{row.qtyPerSet}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800 }}>{row.requiredQty.toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, color: '#0958d9' }}>
                        {row.offeredQty.toLocaleString()}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#64748b' }}>
                        {row.availableInventory.toLocaleString()}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {row.isComplete ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: '#f6ffed', border: '1px solid #b7eb8f', color: '#52c41a',
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800
                          }}>
                            <CheckCircle2 size={13} /> Complete
                          </span>
                        ) : row.isExceeded ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: '#f6ffed', border: '1px solid #52c41a', color: '#389e0d',
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800
                          }}>
                            <CheckCircle2 size={13} /> Exceeded by {(row.offeredQty - row.requiredQty).toLocaleString()}
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                            <div style={{ flex: 1, background: '#f1f5f9', height: 6, borderRadius: 3, maxWidth: 80, overflow: 'hidden' }}>
                              <div style={{ background: '#1677ff', height: '100%', width: `${row.progressPercent}%` }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#0958d9' }}>{row.progressPercent}%</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION D – DYNAMIC LOT FORMATION */}
          {/* ========================================================================= */}
          <div style={{
            background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)', padding: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} style={{ color: '#1677ff' }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                  Section D – Dynamic Lot Formation ({noOfLots} {noOfLots === 1 ? 'Lot' : 'Lots'})
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                {isReadOnly ? 'Formed Lots & Batches Breakdown' : 'Select Batch → Choose Drawing → Enter Qty to Use'}
              </span>
            </div>

            {/* Expandable Lot Panels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {lots.map((lot, lotIdx) => {
                const isExpanded = expandedLots[lotIdx] !== false;
                return (
                  <div key={lot.stableId || `lot_panel_${lotIdx}`} style={{
                    borderRadius: 10, border: '1px solid #cbd5e1', overflow: 'hidden',
                    background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}>
                    {/* Lot Header Bar */}
                    <div
                      onClick={() => handleToggleExpand(lotIdx)}
                      style={{
                        background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                        padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', cursor: 'pointer', userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={e => e.stopPropagation()}>
                        <label style={{ fontSize: 11, fontWeight: 800, color: '#002c8c', textTransform: 'uppercase' }}>Lot Name:</label>
                        <input
                          type="text"
                          readOnly={isReadOnly}
                          disabled={isReadOnly}
                          value={lot.lotName !== undefined ? lot.lotName : (lot.lotId || `Lot ${lotIdx + 1}`)}
                          onChange={e => handleLotNameChange(lotIdx, e.target.value)}
                          placeholder={`Lot ${lotIdx + 1} Name`}
                          style={{
                            background: '#ffffff',
                            color: '#0f172a',
                            fontWeight: 700,
                            fontSize: 13,
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: '1px solid #91caff',
                            width: 140,
                            outline: 'none',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                          }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#002c8c', marginLeft: 8 }}>
                          Total Lot Quantity: {(lot.rows || []).reduce((acc, r) => acc + (parseInt(r.qtyToUse) || 0), 0).toLocaleString()} Nos.
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0958d9' }}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>

                    {/* Lot Content Body */}
                    {isExpanded && (
                      <div style={{ padding: 16 }}>
                        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 12 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                                <th style={thStyle}>Sl.</th>
                                <th style={thStyle}>Batch No</th>
                                <th style={thStyle}>Drawing No</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Available Qty</th>
                                <th style={{ ...thStyle, textAlign: 'center', color: '#7c3aed' }}>Previously Offered Qty</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Qty to Use</th>
                                <th style={{ ...thStyle, textAlign: 'center', color: '#16a34a' }}>Balance Qty</th>
                                {!isReadOnly && <th style={{ ...thStyle, textAlign: 'center', width: 60 }}>Action</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {(lot.rows || []).map((row, rIdx) => {
                                const availDrawings = getDrawingsForBatch(row.batchNo);
                                const info = getBatchDrawingInfo(row.batchNo, row.drawingNo);
                                const rowQtyToUse = parseInt(row.qtyToUse) || 0;
                                const previouslyOfferedQty = info.previouslyOfferedQty || 0;
                                const availableQty = info.availableQty || row.availableQty || (previouslyOfferedQty + rowQtyToUse);
                                const maxAllowedToUse = Math.max(0, availableQty - previouslyOfferedQty);
                                const balanceQty = Math.max(0, availableQty - previouslyOfferedQty - rowQtyToUse);

                                return (
                                  <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={tdStyle}>{rIdx + 1}</td>

                                    {/* Batch Select / Display */}
                                    <td style={tdStyle}>
                                      {isReadOnly ? (
                                        <span style={{ fontWeight: 800, color: '#1e293b' }}>{row.batchNo}</span>
                                      ) : (
                                        <select
                                          value={row.batchNo}
                                          onChange={e => handleRowBatchChange(lotIdx, row.id, e.target.value)}
                                          style={{ ...selectStyle, padding: '4px 8px', height: 32 }}
                                        >
                                          <option value="" disabled>Select Batch No</option>
                                          {batchInventory.map(b => (
                                            <option key={b.batchNo} value={b.batchNo}>{b.batchNo}</option>
                                          ))}
                                        </select>
                                      )}
                                    </td>

                                    {/* Drawing Select / Display */}
                                    <td style={tdStyle}>
                                      {isReadOnly ? (
                                        <span style={{ fontWeight: 800, color: '#1677ff' }}>{row.drawingNo}</span>
                                      ) : (
                                        <select
                                          value={row.drawingNo}
                                          onChange={e => handleRowDrawingChange(lotIdx, row.id, e.target.value)}
                                          style={{ ...selectStyle, padding: '4px 8px', height: 32, fontWeight: 700, color: '#1677ff' }}
                                          disabled={!row.batchNo}
                                        >
                                          <option value="" disabled>{row.batchNo ? 'Select Drawing No' : 'Select Batch First'}</option>
                                          {availDrawings.map((d, dIdx) => {
                                            const isAlreadyUsedInLot = (lot.rows || []).some(
                                              r => r.id !== row.id && String(r.batchNo) === String(row.batchNo) && r.drawingNo === d.drawingNo
                                            );
                                            return (
                                              <option key={`${d.drawingNo}_${dIdx}`} value={d.drawingNo} disabled={isAlreadyUsedInLot}>
                                                {d.drawingNo} {isAlreadyUsedInLot ? '(Already Added)' : ''}
                                              </option>
                                            );
                                          })}
                                        </select>
                                      )}
                                    </td>

                                    {/* Available Qty */}
                                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#475569' }}>
                                      {availableQty.toLocaleString()}
                                    </td>

                                    {/* Previously Offered Qty */}
                                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#7c3aed' }}>
                                      {previouslyOfferedQty.toLocaleString()}
                                    </td>

                                    {/* Qty to Use Input / Display */}
                                    <td style={tdStyle}>
                                      {isReadOnly ? (
                                        <div style={{ textAlign: 'center', fontWeight: 900, color: '#0958d9', fontSize: 14 }}>
                                          {(row.qtyToUse || 0).toLocaleString()}
                                        </div>
                                      ) : (
                                        (() => {
                                          const isDuplicateRow = (lot.rows || []).some(
                                            r => r.id !== row.id && String(r.batchNo) === String(row.batchNo) && r.drawingNo === row.drawingNo
                                          );
                                          return (
                                            <input
                                              type="number"
                                              min="0"
                                              max={maxAllowedToUse}
                                              disabled={isDuplicateRow || maxAllowedToUse <= 0}
                                              value={isDuplicateRow ? 0 : (row.qtyToUse || '')}
                                              onChange={e => !isDuplicateRow && handleRowQtyChange(lotIdx, row.id, e.target.value)}
                                              placeholder="0"
                                              style={{
                                                ...inputStyle, padding: '4px 8px', height: 32,
                                                fontWeight: 800,
                                                color: isDuplicateRow ? '#94a3b8' : '#0958d9',
                                                background: isDuplicateRow ? '#f1f5f9' : '#ffffff',
                                                cursor: isDuplicateRow ? 'not-allowed' : 'text',
                                                borderColor: isDuplicateRow ? '#fca5a5' : (row.qtyToUse > maxAllowedToUse ? '#ff4d4f' : '#cbd5e1')
                                              }}
                                            />
                                          );
                                        })()
                                      )}
                                    </td>

                                    {/* Balance Qty */}
                                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: balanceQty > 0 ? '#16a34a' : '#94a3b8' }}>
                                      {balanceQty.toLocaleString()}
                                    </td>

                                    {/* Delete Row Action */}
                                    {!isReadOnly && (
                                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteRow(lotIdx, row.id)}
                                          disabled={lot.rows.length <= 1}
                                          style={{
                                            background: lot.rows.length <= 1 ? '#f1f5f9' : '#fff1f0',
                                            border: '1px solid #ffccc7', color: lot.rows.length <= 1 ? '#cbd5e1' : '#ff4d4f',
                                            borderRadius: 6, width: 28, height: 28, display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            cursor: lot.rows.length <= 1 ? 'not-allowed' : 'pointer'
                                          }}
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Add Row Button */}
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleAddRow(lotIdx)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              background: '#e6f4ff', border: '1px dashed #91caff',
                              color: '#1677ff', padding: '6px 14px', borderRadius: 6,
                              fontSize: 12, fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            <Plus size={14} /> Add Row to {lot.lotId}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION E – REMARKS */}
          {/* ========================================================================= */}
          <div style={{
            background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)', padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <FileText size={18} style={{ color: '#1677ff' }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                Section E – Remarks
              </span>
            </div>
            <textarea
              rows={3}
              value={remarks}
              readOnly={isReadOnly}
              disabled={isReadOnly}
              onChange={e => setRemarks(e.target.value)}
              placeholder={isReadOnly ? "No remarks entered." : "Enter optional remarks or special instructions for final inspection..."}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid #cbd5e1', fontSize: 13, fontFamily: 'inherit',
                outline: 'none', resize: isReadOnly ? 'none' : 'vertical',
                background: isReadOnly ? '#f8fafc' : '#fff'
              }}
            />
          </div>

          {/* Validation Warnings Alert Banner */}
          {!isReadOnly && !validationResult.isValid && (
            <div style={{
              background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 10,
              padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start'
            }}>
              <AlertTriangle size={20} style={{ color: '#faad14', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#d46b08', marginBottom: 4 }}>
                  Complete Allocation Requirements to Enable Submission:
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#8c4b00' }}>
                  {validationResult.errors.slice(0, 4).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {validationResult.errors.length > 4 && (
                    <li>...and {validationResult.errors.length - 4} other allocation requirements.</li>
                  )}
                </ul>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer Action Bar */}
      <div style={{
        background: '#fff', borderTop: '1px solid #e2e8f0',
        padding: '14px 24px', display: 'flex', justifyContent: isReadOnly ? 'space-between' : 'flex-end',
        alignItems: 'center', gap: 12, flexShrink: 0
      }}>
        {isReadOnly ? (
          <>
            <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
              Read-Only View: Submitted NCRGRSP inspection request parameters.
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 28px', borderRadius: 8, border: '1px solid #cbd5e1',
                background: '#f8fafc', color: '#334155', fontWeight: 800, fontSize: 14,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
            >
              Close
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 20px', borderRadius: 8, border: '1px solid #cbd5e1',
                background: '#fff', color: '#475569', fontWeight: 700, fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitCall}
              style={{
                padding: '8px 24px', borderRadius: 8, border: 'none',
                background: isSubmitting
                  ? '#f5f5f5'
                  : (!validationResult.isValid
                    ? '#91caff'
                    : 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)'),
                color: isSubmitting ? '#bfbfbf' : '#fff',
                fontWeight: 800, fontSize: 14, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: !validationResult.isValid || isSubmitting ? 'none' : '0 4px 12px rgba(22,119,255,0.3)',
                display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              {isSubmitting ? (
                'Saving...'
              ) : (
                <>
                  <ShieldCheck size={18} /> {isModifyMode || (callData && effectiveCallNo) ? 'Save Modifications' : 'Submit Final Inspection Call'}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ── Reusable Component Styles & Sub-components ──
const HeaderCard = ({ label, value, highlightColor }) => (
  <div style={{
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
    padding: '8px 12px'
  }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>
      {label}
    </div>
    <div style={{ fontSize: 15, fontWeight: 900, color: highlightColor || '#1e293b' }}>
      {value}
    </div>
  </div>
);

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6
};

const inputStyle = {
  width: '100%', height: 38, padding: '0 12px', borderRadius: 6,
  border: '1px solid #cbd5e1', fontSize: 13, color: '#0f172a',
  outline: 'none', background: '#fff'
};

const selectStyle = {
  width: '100%', height: 38, padding: '0 12px', borderRadius: 6,
  border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600,
  color: '#0f172a', outline: 'none', background: '#fff'
};

const thStyle = {
  padding: '10px 12px', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.03em'
};

const tdStyle = {
  padding: '10px 12px', color: '#1e293b', verticalAlign: 'middle'
};

export default NCRGRSPFinalInspectionCall;
