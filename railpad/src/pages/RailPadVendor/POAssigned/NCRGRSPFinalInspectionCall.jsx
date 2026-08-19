import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Package, Calendar, ClipboardList, CheckCircle2, AlertCircle,
  Trash2, ChevronDown, ChevronUp, Plus, Info, Layers, FileText,
  ShieldCheck, AlertTriangle, ArrowRight, Check
} from 'lucide-react';
import inspectionCallService from '../../../services/inspectionCallService';

// ─── Master Catalog of NCRGRSP Types & Official Drawings ──────────────────────
// Source: PL-60217240 | PL-60217223 | PL-60217250 | PL-60217241 | Northern Railway Annexures A–F | Annexure-B (Photo)
const NCRGRSP_CATALOG = {
  // TYPE 1 – Source: PL-60217240 | Date: 22.12.23
  'NRC Rail Pads – 1 in 12 CMS x-ing B.G. for 52 Kg (RDSO/T-4734 Alt.6)': [
    { drawingNo: 'RDSO/T-8888', qtyPerSet: 16, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8886', qtyPerSet: 38, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7014/2', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7014/1', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8892', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8891', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8890', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7021', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7020', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7019', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7018', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7017', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7016', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7015', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7014', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' }
  ],
  // TYPE 2 – Source: PL-60217223 | Date: 22.12.23
  'NRC Rail Pads – 1 in 12 T/out TWB Switch for 60 Kg (RDSO/T-6154 Alt.5)': [
    { drawingNo: 'RDSO/T-8888', qtyPerSet: 16, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8886', qtyPerSet: 182, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7014/2', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7014/1', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8892', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8891', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8890', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7021', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7020', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7019', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7018', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7017', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7016', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7015', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7014', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8889', qtyPerSet: 30, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8910', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8909', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8908', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8907', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8955', qtyPerSet: 42, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8954', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8896', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8895', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8894', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8893', qtyPerSet: 36, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8906', qtyPerSet: 4, description: 'Nylon Cord Reinforced GRSP' }
  ],
  // TYPE 3 – Source: PL-60217250 | Date: 03.09.2025
  'NRC Rail Pads – 1 in 12 O.R. T/out for 52 Kg on PSC Sleepers (RDSO/T-4733 Alt.8)': [
    { drawingNo: 'RDSO/T-8888', qtyPerSet: 16, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8886', qtyPerSet: 182, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7014/2', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7014/1', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8892', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8891', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8890', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7021', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7020', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7019', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7018', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7017', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7016', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7015', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-7014', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8906', qtyPerSet: 4, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8907', qtyPerSet: 26, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8889', qtyPerSet: 30, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8896', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8895', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8894', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8893', qtyPerSet: 36, description: 'Nylon Cord Reinforced GRSP' }
  ],
  // TYPE 4 – Source: PL-60217241 | Date: 22.12.23
  'NRC Rail Pads – 1 in 8.5 T/out for 52 Kg (RDSO/T-4867 Alt.9)': [
    { drawingNo: 'RDSO/T-8888', qtyPerSet: 16, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8887', qtyPerSet: 20, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8916', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8917', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8918', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8919', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8920', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8921', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8914', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8914/1', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8915', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8915/1', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8887', qtyPerSet: 96, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8889', qtyPerSet: 30, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8907', qtyPerSet: 12, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8912', qtyPerSet: 22, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8913', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-8906', qtyPerSet: 4, description: 'Nylon Cord Reinforced GRSP' }
  ],
  // TYPE 5 – Source: Northern Railway – Annexure-A | Date: 2026
  '6 mm Thick NCR GRSP – 1 in 16 Turnout (ORS) (T-5691)': [
    { drawingNo: 'T-8893', qtyPerSet: 38, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-8906', qtyPerSet: 4, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-8927', qtyPerSet: 6, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-8955', qtyPerSet: 12, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10160', qtyPerSet: 14, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10162', qtyPerSet: 28, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10250', qtyPerSet: 232, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10253', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10254', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10255', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10256', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10257', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10258', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10259', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10260', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10261', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10262', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10263', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10264', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10265', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10266', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10267', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10268', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10269', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10270', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10271', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10272', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10273', qtyPerSet: 2, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10274', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10275', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' },
    { drawingNo: 'T-10276', qtyPerSet: 1, description: 'Nylon Cord Reinforced GRSP / Pocket Type' }
  ],
  // TYPE 6 – Source: Northern Railway – Annexure-B | Date: 2026
  '6 mm Thick NCR GRSP – CMS Crossing Portion 1 in 16 Turnout (T-5693)': [
    { drawingNo: 'T-10160', qtyPerSet: 14, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10250', qtyPerSet: 58, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10264', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10265', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10266', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10267', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10268', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10269', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10270', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10271', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10272', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10273', qtyPerSet: 2, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10274', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10275', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10276', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' }
  ],
  // TYPE 7 – Source: Northern Railway – Annexure-C | Date: 2026
  '6 mm Thick NCR GRSP – Derailing Switch 1 in 8.5, 60 kg (T-6068)': [
    { drawingNo: 'T-8906', qtyPerSet: 4, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-8911', qtyPerSet: 22, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-8913', qtyPerSet: 6, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-8955', qtyPerSet: 6, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10160', qtyPerSet: 17, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10162', qtyPerSet: 22, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10335', qtyPerSet: 3, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' }
  ],
  // TYPE 8 – Source: Northern Railway – Annexure-D | Date: 2026
  '6 mm Thick NCR GRSP – TWS 1 in 16 Turnout, 60 kg (T-10241)': [
    { drawingNo: 'T-8893', qtyPerSet: 38, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-8906', qtyPerSet: 4, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10161', qtyPerSet: 14, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10162', qtyPerSet: 28, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10163', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10164', qtyPerSet: 36, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10200', qtyPerSet: 4, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10202', qtyPerSet: 4, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10250', qtyPerSet: 232, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10251', qtyPerSet: 6, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10252', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10253', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10254', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10255', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10256', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10257', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10258', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10259', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10260', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10261', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10262', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10263', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10264', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10265', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10266', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10267', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10268', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10269', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10270', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10271', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10272', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10273', qtyPerSet: 2, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10274', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10275', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10276', qtyPerSet: 1, description: 'Nylon Cord / Pocket Type Nylon Cord Reinforced GRSP' }
  ],
  // TYPE 9 – Source: Northern Railway – Annexure-E | Date: 2026
  '6 mm Thick NCR GRSP – CMS Crossing Portion 1 in 16 Turnout, 60 kg (T-10243)': [
    { drawingNo: 'T-10161', qtyPerSet: 14, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10250', qtyPerSet: 68, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10261', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10262', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10263', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10264', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10265', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10266', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10267', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10268', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10269', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10270', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10271', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10272', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10273', qtyPerSet: 2, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10274', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10275', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' },
    { drawingNo: 'T-10276', qtyPerSet: 1, description: 'Pocket Type Nylon Cord Reinforced GRSP' }
  ],
  // TYPE 10 – Source: Northern Railway – Annexure-F | Date: 2026
  '10 mm Thick NCR GRSP – TWSEJ (T-8822)': [
    { drawingNo: 'RDSO/T-10153', qtyPerSet: 22, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10154', qtyPerSet: 4, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10155', qtyPerSet: 16, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10156', qtyPerSet: 2, description: '10 mm Thick Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10157', qtyPerSet: 16, description: '10 mm Thick Nylon Cord Reinforced GRSP' }
  ],
  // TYPE 11 – Source: Annexure-B (Photo) | Date: 2026
  'Pocket Type NCR GRSP – 1 in 12 Turnout for 25T Axle Load (T-9790)': [
    { drawingNo: 'RDSO/T-10096', qtyPerSet: 30, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10093', qtyPerSet: 182, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10114/1', qtyPerSet: 2, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10114/2', qtyPerSet: 2, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10114', qtyPerSet: 2, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10115', qtyPerSet: 2, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10116', qtyPerSet: 4, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10117', qtyPerSet: 2, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10118', qtyPerSet: 6, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10098', qtyPerSet: 34, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10097', qtyPerSet: 2, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-9827', qtyPerSet: 6, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-9826', qtyPerSet: 6, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-9825', qtyPerSet: 2, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-9824', qtyPerSet: 36, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-9837', qtyPerSet: 4, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10095', qtyPerSet: 16, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10119', qtyPerSet: 1, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10120', qtyPerSet: 1, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10121', qtyPerSet: 1, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10122', qtyPerSet: 1, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10123', qtyPerSet: 1, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10124', qtyPerSet: 1, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10125', qtyPerSet: 1, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10126', qtyPerSet: 1, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10127', qtyPerSet: 1, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10128', qtyPerSet: 1, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10129', qtyPerSet: 1, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10130', qtyPerSet: 1, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    { drawingNo: 'RDSO/T-10131', qtyPerSet: 1, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' },
    // { drawingNo: 'RDSO/T-10031', qtyPerSet: 1, description: 'POCKET TYPE Nylon Cord Reinforced GRSP' } // Hidden – not applicable for this PO
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

const normalizeDwg = (dwg) => (dwg || '').replace(/^(RDSO\/|RDSO-)/i, '').trim().toUpperCase();

// ─── Main NCRGRSP Component ───────────────────────────────────────────────────
const NCRGRSPFinalInspectionCall = ({
  srItem,
  poNo,
  plantId,
  vendorCode,
  onClose,
  onSubmitInspectionCall,
  initialRailPadType = Object.keys(NCRGRSP_CATALOG)[0],
  onRailPadTypeChange
}) => {
  // ── Form State ──
  const [selectedRailPadType, setSelectedRailPadType] = useState(initialRailPadType || '');
  const [ncrgrspType, setNcrgrspType] = useState(
    NCRGRSP_CATALOG[initialRailPadType] ? initialRailPadType : Object.keys(NCRGRSP_CATALOG)[0]
  );
  const [selectedProcessCertNos, setSelectedProcessCertNos] = useState([]);
  const [isCertDropdownOpen, setIsCertDropdownOpen] = useState(false);
  const certDropdownRef = useRef(null);

  const [noOfSets, setNoOfSets] = useState(0);
  const [noOfLots, setNoOfLots] = useState(0);
  const [desiredDate, setDesiredDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
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
        const poSrNo = srItem?.itemSrNo || srItem?.srNo || '';
        const calls = await inspectionCallService.getProcessCalls(ncrgrspType, '', plantId, poNo, poSrNo);
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
  }, [ncrgrspType, plantId, poNo, srItem?.itemSrNo, srItem?.srNo]);

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
              const res = await inspectionCallService.getAvailableFinalBatches(certNo);
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
              const acceptedFromApi = (b.qtyAccepted !== undefined && b.qtyAccepted !== null)
                ? Number(b.qtyAccepted)
                : ((b.qty_accepted !== undefined && b.qty_accepted !== null) ? Number(b.qty_accepted) : null);
              const manufactured = Number(b.qtyManufactured || b.quantityProduced || b.quantity || b.totalQty || 0);
              const rejected = Number(b.verificationRejectedQty || b.rejectedQty || b.qtyRejected || 0);
              const accepted = acceptedFromApi !== null ? acceptedFromApi : Math.max(0, manufactured - rejected);

              if (b.drawings) {
                Object.entries(b.drawings).forEach(([dNo, qty]) => {
                  transformed[bNo].drawings[dNo] = (transformed[bNo].drawings[dNo] || 0) + (qty || 0);
                });
              } else if (dwg) {
                transformed[bNo].drawings[dwg] = (transformed[bNo].drawings[dwg] || 0) + (accepted > 0 ? accepted : manufactured);
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
  }, [selectedProcessCertNos]);

  // ── Drawings list for selected NCRGRSP Type ──
  const requiredDrawingsList = useMemo(() => {
    const catalogEntry = NCRGRSP_CATALOG[ncrgrspType] || NCRGRSP_CATALOG[Object.keys(NCRGRSP_CATALOG)[0]] || [];
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
  const [lots, setLots] = useState([]);
  const [expandedLots, setExpandedLots] = useState({ 0: true, 1: true, 2: true });

  // Initialize or adjust lots structure when noOfLots changes
  useEffect(() => {
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
  }, [noOfLots]);

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

  // Handle Qty to Use change in a lot row (strictly capped to Available Quantity)
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
          const avail = getBatchDrawingAvailableQty(r.batchNo, r.drawingNo);
          const parsed = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
          const cappedVal = Math.min(avail, parsed);
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

    // Sum total available inventory per drawing across all batches
    const inventoryMap = {};
    batchInventory.forEach(b => {
      if (b.drawings) {
        Object.entries(b.drawings).forEach(([dwg, qty]) => {
          inventoryMap[dwg] = (inventoryMap[dwg] || 0) + (qty || 0);
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

  // Helper: get available inventory for a specific batch and drawing
  const getBatchDrawingAvailableQty = (batchNo, drawingNo) => {
    if (!batchNo || !drawingNo) return 0;
    const batchObj = batchInventory.find(b => String(b.batchNo) === String(batchNo));
    if (!batchObj || !batchObj.drawings) return 0;
    if (batchObj.drawings[drawingNo] !== undefined) return batchObj.drawings[drawingNo];
    const normTarget = normalizeDwg(drawingNo);
    for (const [k, q] of Object.entries(batchObj.drawings)) {
      const normK = normalizeDwg(k);
      if (normK === normTarget) {
        return q;
      }
    }
    return 0;
  };

  // Auto-calculate required lots whenever totalRequiredQty changes based on 5000 max capacity per lot
  useEffect(() => {
    if (totalRequiredQty > 0) {
      const minLots = Math.max(1, Math.ceil(totalRequiredQty / 5000));
      setNoOfLots(minLots);
    } else {
      setNoOfLots(0);
    }
  }, [totalRequiredQty]);

  // ── Validation Rules ──
  const validationResult = useMemo(() => {
    const errors = [];
    if (!selectedProcessCertNos || selectedProcessCertNos.length === 0) errors.push('Process Inspection Certificate is required.');
    if (!noOfSets || noOfSets <= 0) errors.push('Number of sets must be greater than 0.');
    if (!noOfLots || noOfLots <= 0) errors.push('Number of lots must be greater than 0.');

    // Check minimum lots required for total quantity (Max 5,000 Nos. per Lot)
    const minLotsRequired = Math.max(1, Math.ceil(totalRequiredQty / 5000));
    if (noOfLots < minLotsRequired) {
      errors.push(`For total required quantity of ${totalRequiredQty.toLocaleString()} Nos., minimum ${minLotsRequired} lot(s) are required (max 5,000 Nos. per lot).`);
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
        const comboKey = `${r.batchNo}___${r.drawingNo}`;
        if (seenCombos.has(comboKey)) {
          errors.push(`${lot.lotName || lot.lotId}: Duplicate entry for Batch ${r.batchNo} and Drawing ${r.drawingNo} is not allowed.`);
        }
        seenCombos.add(comboKey);
      });
    });

    // Check if any drawing is not fully allocated or exceeded
    drawingSummaryData.forEach(dwg => {
      if (dwg.offeredQty < dwg.requiredQty) {
        errors.push(`Drawing ${dwg.drawingNo}: Allocated ${dwg.offeredQty} of ${dwg.requiredQty} required.`);
      } else if (dwg.offeredQty > dwg.requiredQty) {
        errors.push(`Drawing ${dwg.drawingNo}: Allocated ${dwg.offeredQty} exceeds ${dwg.requiredQty} required.`);
      }
    });

    // Check if any row qtyToUse exceeds availableQty for that batch & drawing
    lots.forEach(lot => {
      (lot.rows || []).forEach((r, rIdx) => {
        const avail = getBatchDrawingAvailableQty(r.batchNo, r.drawingNo);
        if (r.qtyToUse > avail) {
          errors.push(`${lot.lotId} Row ${rIdx + 1}: Qty to Use (${r.qtyToUse}) exceeds Available Qty (${avail}).`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [selectedProcessCertNos, noOfSets, noOfLots, totalRequiredQty, drawingSummaryData, lots]);

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
      const userId = storedUser.id || storedUser.userId || localStorage.getItem('railpad_userId') || 195;

      const payload = {
        inspectionCallType: 'FINAL',
        productType: 'NCRGRSP',
        ncrgrspType,
        railPadType: selectedRailPadType || ncrgrspType || 'NCRGRSP',
        createdBy: userId,
        updatedBy: userId,
        processInspectionCertNo: selectedProcessCertNos.join(','),
        processIcNo: selectedProcessCertNos.join(','),
        poNo: poNo || '60250003104659',
        poSrNo: srItem?.itemSrNo || srItem?.srNo || '1',
        plantId: (plantId || '').replace(/^:/, ''),
        vendorCode: (vendorCode || '').replace(/^:/, ''),
        noOfSets,
        noOfLots,
        desiredInspectionDate: desiredDate,
        totalRequiredQty,
        totalOfferedQty,
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

      {/* Main Form Scroll Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

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
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{poNo || '60250003104659'}</div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>PO Sr No</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#1e293b' }}>{srItem?.itemSrNo || srItem?.srNo || '1'}</div>
                </div>
              </div>

              <HeaderCard label="Call Date" value={desiredDate} highlightColor="#1677ff" />
              <HeaderCard label="Ordered Qty" value={(srItem?.orderedQty || srItem?.ordered || 10000).toLocaleString()} />
              <HeaderCard label="Offered Qty" value={totalOfferedQty.toLocaleString()} highlightColor="#722ed1" />
              <HeaderCard label="Accepted Qty" value={(srItem?.acceptedTillNow || 0).toLocaleString()} highlightColor="#52c41a" />
              <HeaderCard label="Rejected Qty" value={(srItem?.rejectedTillNow || 0).toLocaleString()} highlightColor="#ff4d4f" />
              <HeaderCard
                label="Balance Qty"
                value={Math.max(0, (srItem?.orderedQty || srItem?.ordered || 10000) - (srItem?.acceptedTillNow || 0)).toLocaleString()}
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
              </div>

              {/* NCRGRSP Type Select */}
              <div>
                <label style={labelStyle}>
                  NCRGRSP Type <span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                <select
                  value={ncrgrspType}
                  onChange={e => setNcrgrspType(e.target.value)}
                  style={selectStyle}
                >
                  {Object.keys(NCRGRSP_CATALOG).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Process Inspection Certificate Multi-Select Dropdown */}
              <div style={{ position: 'relative' }} ref={certDropdownRef}>
                <label style={labelStyle}>
                  Process Inspection Certificate <span style={{ color: '#ff4d4f' }}>*</span>
                </label>
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
              </div>

              {/* No of Sets to be Offered */}
              <div>
                <label style={labelStyle}>No. of Sets to be Offered <span style={{ color: '#ff4d4f' }}>*</span></label>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter No. of Sets"
                  value={noOfSets === 0 ? '' : noOfSets}
                  onChange={e => {
                    const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0);
                    setNoOfSets(val);
                  }}
                  style={inputStyle}
                />
              </div>

              {/* No of Lots */}
              <div>
                <label style={labelStyle}>No. of Lots <span style={{ color: '#ff4d4f' }}>*</span></label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="Enter No. of Lots"
                  value={noOfLots === 0 ? '' : noOfLots}
                  onChange={e => {
                    const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0);
                    setNoOfLots(val);
                  }}
                  style={inputStyle}
                />
              </div>

              {/* Desired Inspection Date */}
              <div>
                <label style={labelStyle}>Desired Inspection Date <span style={{ color: '#ff4d4f' }}>*</span></label>
                <input
                  type="date"
                  value={desiredDate}
                  onChange={e => setDesiredDate(e.target.value)}
                  style={inputStyle}
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
              <div style={{ display: 'flex', gap: 12, fontSize: 12, fontWeight: 700 }}>
                <span style={{ background: '#e6f4ff', color: '#0958d9', padding: '4px 12px', borderRadius: 20, border: '1px solid #91caff' }}>
                  Total Required Qty: <strong>{totalRequiredQty.toLocaleString()}</strong>
                </span>
                <span style={{ background: totalOfferedQty === totalRequiredQty ? '#f6ffed' : '#fff7e6', color: totalOfferedQty === totalRequiredQty ? '#389e0d' : '#d46b08', padding: '4px 12px', borderRadius: 20, border: totalOfferedQty === totalRequiredQty ? '1px solid #b7eb8f' : '1px solid #ffd591' }}>
                  Total Qty to be Offered: <strong>{totalOfferedQty.toLocaleString()}</strong>
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
                    <th style={thStyle}>Qty/Set</th>
                    <th style={thStyle}>Required Qty</th>
                    <th style={thStyle}>Qty to be Offered</th>
                    <th style={thStyle}>Available Inventory</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Allocation Status</th>
                  </tr>
                </thead>
                <tbody>
                  {drawingSummaryData.map((row, idx) => (
                    <tr key={`${row.drawingNo}_${idx}`} style={{ borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
                      <td style={tdStyle}>{row.sl}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#1677ff' }}>{row.drawingNo}</td>
                      <td style={tdStyle}>{row.qtyPerSet}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{row.requiredQty.toLocaleString()}</td>
                      <td style={{ ...tdStyle, fontWeight: 800, color: row.isComplete ? '#389e0d' : row.isExceeded ? '#cf1322' : '#0958d9' }}>
                        {row.offeredQty.toLocaleString()}
                      </td>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{row.availableInventory.toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {row.isComplete ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: '#f6ffed', color: '#389e0d', border: '1px solid #b7eb8f',
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800
                          }}>
                            <CheckCircle2 size={13} /> 100% Allocated
                          </span>
                        ) : row.isExceeded ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: '#fff2f0', color: '#ff4d4f', border: '1px solid #ffccc7',
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800
                          }}>
                            <AlertCircle size={13} /> Exceeded by {row.offeredQty - row.requiredQty}
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
                  ))}
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
                Select Batch → Choose Drawing → Enter Qty to Use
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
                                <th style={thStyle}>Available Qty</th>
                                <th style={thStyle}>Qty to Use</th>
                                <th style={thStyle}>Balance Qty</th>
                                <th style={{ ...thStyle, textAlign: 'center', width: 60 }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(lot.rows || []).map((row, rIdx) => {
                                const availDrawings = getDrawingsForBatch(row.batchNo);
                                const availableQty = getBatchDrawingAvailableQty(row.batchNo, row.drawingNo);
                                const balanceQty = Math.max(0, availableQty - (parseInt(row.qtyToUse) || 0));

                                return (
                                  <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={tdStyle}>{rIdx + 1}</td>

                                    {/* Batch Select */}
                                    <td style={tdStyle}>
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
                                    </td>

                                    {/* Drawing Select (Dependent on Batch) */}
                                    <td style={tdStyle}>
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
                                    </td>

                                    {/* Available Qty */}
                                    <td style={{ ...tdStyle, fontWeight: 700, color: '#475569' }}>
                                      {availableQty.toLocaleString()}
                                    </td>

                                    {/* Qty to Use Input */}
                                    <td style={tdStyle}>
                                      {(() => {
                                        const isDuplicateRow = (lot.rows || []).some(
                                          r => r.id !== row.id && String(r.batchNo) === String(row.batchNo) && r.drawingNo === row.drawingNo
                                        );
                                        return (
                                          <input
                                            type="number"
                                            min="0"
                                            max={availableQty}
                                            disabled={isDuplicateRow}
                                            value={isDuplicateRow ? 0 : (row.qtyToUse || '')}
                                            onChange={e => !isDuplicateRow && handleRowQtyChange(lotIdx, row.id, e.target.value)}
                                            placeholder="0"
                                            style={{
                                              ...inputStyle, padding: '4px 8px', height: 32,
                                              fontWeight: 800,
                                              color: isDuplicateRow ? '#94a3b8' : '#0958d9',
                                              background: isDuplicateRow ? '#f1f5f9' : '#ffffff',
                                              cursor: isDuplicateRow ? 'not-allowed' : 'text',
                                              borderColor: isDuplicateRow ? '#fca5a5' : (row.qtyToUse > availableQty ? '#ff4d4f' : '#cbd5e1')
                                            }}
                                          />
                                        );
                                      })()}
                                    </td>

                                    {/* Balance Qty */}
                                    <td style={{ ...tdStyle, fontWeight: 700, color: '#52c41a' }}>
                                      {balanceQty.toLocaleString()}
                                    </td>

                                    {/* Delete Row Action */}
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
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Add Row Button */}
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
              onChange={e => setRemarks(e.target.value)}
              placeholder="Enter optional remarks or special instructions for final inspection..."
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid #cbd5e1', fontSize: 13, fontFamily: 'inherit',
                outline: 'none', resize: 'vertical'
              }}
            />
          </div>

          {/* Validation Warnings Alert Banner */}
          {!validationResult.isValid && (
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
        padding: '14px 24px', display: 'flex', justifyContent: 'flex-end',
        alignItems: 'center', gap: 12, flexShrink: 0
      }}>
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
            'Submitting Call...'
          ) : (
            <>
              <ShieldCheck size={18} /> Submit Final Inspection Call
            </>
          )}
        </button>
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
