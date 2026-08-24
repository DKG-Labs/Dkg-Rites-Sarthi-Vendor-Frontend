export const formatDateDDMMYY = (dateStr) => {
    if (!dateStr) return 'N/A';

    if (typeof dateStr === 'string') {
        const trimmed = dateStr.trim();
        if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'n/a') return 'N/A';

        // DD-MM-YYYY or DD/MM/YYYY
        const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
        if (ddmmyyyyMatch) {
            const d = ddmmyyyyMatch[1].padStart(2, '0');
            const m = ddmmyyyyMatch[2].padStart(2, '0');
            const y = String(ddmmyyyyMatch[3]).slice(-2);
            return `${d}/${m}/${y}`;
        }

        // YYYY-MM-DD
        const yyyymmddMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        if (yyyymmddMatch) {
            const y = String(yyyymmddMatch[1]).slice(-2);
            const m = yyyymmddMatch[2].padStart(2, '0');
            const d = yyyymmddMatch[3].padStart(2, '0');
            return `${d}/${m}/${y}`;
        }
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        return typeof dateStr === 'string' ? dateStr : 'N/A';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
};
