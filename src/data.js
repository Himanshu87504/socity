// ============================================================
// MOCK DATA - Replace with your actual backend API calls
// ============================================================
export const dashboardStats = {
    totalSocieties: 24,
    totalInvoiceBilling: 1842500,
    totalOutstanding: 384200,
    totalReceipts: 1563,
    totalReceiptAmount: 1458300,
    collectionRate: 79.2,
};
export const monthlyBillingData = [
    { month: 'Jan', billed: 142000, collected: 118000, outstanding: 24000 },
    { month: 'Feb', billed: 158000, collected: 134000, outstanding: 24000 },
    { month: 'Mar', billed: 165000, collected: 140000, outstanding: 25000 },
    { month: 'Apr', billed: 152000, collected: 125000, outstanding: 27000 },
    { month: 'May', billed: 178000, collected: 148000, outstanding: 30000 },
    { month: 'Jun', billed: 190000, collected: 162000, outstanding: 28000 },
    { month: 'Jul', billed: 185000, collected: 155000, outstanding: 30000 },
    { month: 'Aug', billed: 172000, collected: 145000, outstanding: 27000 },
    { month: 'Sep', billed: 195000, collected: 168000, outstanding: 27000 },
    { month: 'Oct', billed: 210000, collected: 178000, outstanding: 32000 },
    { month: 'Nov', billed: 198000, collected: 166000, outstanding: 32000 },
    { month: 'Dec', billed: 222000, collected: 179300, outstanding: 42700 },
];
export const societyBreakdown = [
    { name: 'Green Valley', units: 120, collected: 98000, outstanding: 12000 },
    { name: 'Sunrise Heights', units: 85, collected: 72000, outstanding: 8500 },
    { name: 'Blue Ridge', units: 200, collected: 168000, outstanding: 22000 },
    { name: 'Palm Grove', units: 60, collected: 51000, outstanding: 5400 },
    { name: 'Emerald Towers', units: 150, collected: 130000, outstanding: 18000 },
];
export const receiptTrend = [
    { week: 'W1', receipts: 112, amount: 94000 },
    { week: 'W2', receipts: 138, amount: 115000 },
    { week: 'W3', receipts: 125, amount: 104000 },
    { week: 'W4', receipts: 145, amount: 122000 },
    { week: 'W5', receipts: 108, amount: 91000 },
    { week: 'W6', receipts: 160, amount: 134000 },
    { week: 'W7', receipts: 142, amount: 118000 },
    { week: 'W8', receipts: 175, amount: 148000 },
];
export const paymentModeData = [
    { name: 'Online', value: 58, color: '#00D4AA' },
    { name: 'Cheque', value: 22, color: '#6C63FF' },
    { name: 'Cash', value: 12, color: '#FF6B6B' },
    { name: 'NEFT/RTGS', value: 8, color: '#FFB347' },
];
export const recentActivity = [
    { id: 1, society: 'Green Valley', type: 'Receipt', amount: 12500, status: 'Paid', time: '2 min ago', unit: 'A-204' },
    { id: 2, society: 'Blue Ridge', type: 'Invoice', amount: 8200, status: 'Pending', time: '15 min ago', unit: 'B-108' },
    { id: 3, society: 'Sunrise Heights', type: 'Receipt', amount: 9800, status: 'Paid', time: '1 hr ago', unit: 'C-312' },
    { id: 4, society: 'Palm Grove', type: 'Invoice', amount: 6500, status: 'Overdue', time: '2 hr ago', unit: 'D-101' },
    { id: 5, society: 'Emerald Towers', type: 'Receipt', amount: 15200, status: 'Paid', time: '3 hr ago', unit: 'E-505' },
    { id: 6, society: 'Green Valley', type: 'Invoice', amount: 11000, status: 'Pending', time: '5 hr ago', unit: 'A-110' },
];
export const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'Accounts', label: 'Accounts', icon: 'FileText' },
    { id: 'masters', label: 'Masters', icon: 'Database' },
    { id: 'parent-entity', label: 'Parent Entity', icon: 'GitBranch' },
    { id: 'applications', label: 'Applications', icon: 'AppWindow' },
    { id: 'announcement', label: 'Announcement', icon: 'Megaphone' },
    { id: 'complaints', label: 'Complaints', icon: 'MessageSquare' },
    { id: 'tenant', label: 'Tenant', icon: 'Users' },
    { id: 'loans', label: 'Loans', icon: 'Landmark' },
    { id: 'parking', label: 'Parking', icon: 'Car' },
    { id: 'notice', label: 'Notice', icon: 'Bell' },
    { id: 'helpers', label: 'Helpers', icon: 'HandHelping' },
    { id: 'pet', label: 'Pet', icon: 'PawPrint' },
    { id: 'visits', label: 'Visits', icon: 'CalendarCheck' },
    { id: 'invoice', label: 'Invoice', icon: 'Receipt' },
    {id: 'ocasions', label: 'Occasions', icon: 'Gift'},
    {id: 'property', label: 'Property', icon: 'Home'},
    {id: 'chargemaster', label: 'Charge Master', icon: 'LucideCreditCard'},
];
