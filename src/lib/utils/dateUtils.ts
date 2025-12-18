
/**
 * Shared date utilities for expiry calculations
 */

export const calculateDaysUntilExpiry = (expiryDate: string): number => {
    if (!expiryDate) return 0;
    try {
        let exp: Date;

        // Handle YYYY-MM-DD (ISO format from DB)
        if (/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
            const [year, month, day] = expiryDate.split('-').map(Number);
            exp = new Date(year, month - 1, day);
        } else {
            // Handle DD/MM/YYYY or DD-MM-YYYY
            const separator = expiryDate.includes('/') ? '/' : '-';
            const parts = expiryDate.split(separator).map(Number);
            if (parts.length === 3) {
                const [day, month, year] = parts;
                exp = new Date(year, month - 1, day);
            } else {
                return 0;
            }
        }

        const now = new Date();
        // Reset time to midnight for accurate day calculation
        now.setHours(0, 0, 0, 0);
        exp.setHours(0, 0, 0, 0);

        return Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } catch (e) {
        console.error('Error parsing expiry date:', expiryDate, e);
        return 0;
    }
};

export const getStatusFromDays = (days: number): 'fresh' | 'caution' | 'warning' | 'expired' => {
    if (days < 0) return 'expired';
    if (days <= 3) return 'warning';
    if (days <= 7) return 'caution';
    return 'fresh';
};
