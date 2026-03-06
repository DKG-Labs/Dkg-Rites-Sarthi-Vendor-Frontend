/**
 * Approved suppliers populated from Plant Declaration module.
 * Centralised here so that component files only export React components
 * (required by Vite React Fast Refresh).
 */
export const APPROVED_SUPPLIERS = [
    "Global Rubber Exports Pvt. Ltd.",
    "Orient Carbon Solutions",
    "Silica Tech Industries",
    "Allied Polymers & Textiles",
    "ChemPro Ingredients Ltd.",
    "Bharat Chemical Works",
    "Premier Raw Materials Co.",
    "Eastern Cord Industries"
];

/**
 * Validates Invoice Number and E-way Bill Number for uniqueness across ALL entries.
 * @param {string} invoiceNumber
 * @param {string} ewayBillNumber
 * @param {Array} allEntries  concatenated array of every entry from every material category
 * @param {number|null} editId  the id being edited (excluded from uniqueness check)
 * @returns {{ invoice?: string, eway?: string }}
 */
export function validateDuplicateDocs(invoiceNumber, ewayBillNumber, allEntries, editId = null) {
    const errs = {};
    const others = allEntries.filter(e => e.id !== editId && e.status !== 'Deleted');

    const invTrimmed = invoiceNumber.trim().toLowerCase();
    const ewayTrimmed = String(ewayBillNumber).trim().toLowerCase();

    if (invTrimmed && others.some(e => e.invoiceNumber?.trim().toLowerCase() === invTrimmed)) {
        errs.invoice = 'Invoice Number already exists. Duplicate entries are not allowed.';
    }
    if (ewayTrimmed && others.some(e => String(e.ewayBillNumber)?.trim().toLowerCase() === ewayTrimmed)) {
        errs.eway = 'E-way Bill Number already exists. Duplicate entries are not allowed.';
    }
    return errs;
}

/**
 * Check if an entry is editable or deletable by the vendor.
 * Entries with status "Verified and Locked" are immutable.
 */
export function isEditable(entry) {
    return entry.status !== 'Verified and Locked';
}
