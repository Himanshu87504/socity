import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useAppContext } from "../AppContext";
// import {
//     unprocessReceiptApi,
//     createCashPaymentApi,
//     createChequePaymentApi,
//     getAllPaymentReceiptsApi,
// } from "../api/account-api";

import { getAllPaymentReceiptsApi } from "api/recipt-api";
import {
    Download, RefreshCw, Search, Plus,
    Receipt, CheckCircle, AlertCircle, Wallet,
    Eye, Send, Printer, Copy, Trash2, X,
    ArrowUpRight, ArrowDownRight,
    ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight,
    AlertTriangle,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────
const fmt = n =>
    n >= 1e7 ? `₹${(n / 1e7).toFixed(2)}Cr`
        : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)}L`
            : n >= 1e3 ? `₹${(n / 1e3).toFixed(1)}K`
                : `₹${n}`;
const fmtFull = n => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtNum = n => Number(n).toLocaleString("en-IN");

// ── Map API receipt response to table row ─────────────────────────────
// Based on actual API response structure provided
const mapReceipt = (r) => ({
    _rawId: r.receiptNumber,
    id: r.receiptNumber || "",
    property: r.property?.propertyName || r.property?.propertyIdentifier || r.propertyIdentifier || "",
    propertyIdentifier: r.propertyIdentifier || r.property?.propertyIdentifier || "",
    society: r.invoice?.societyIdentifier || "",
    societyIdentifier: r.invoice?.societyIdentifier || "",
    invoiceRef: r.invoiceNumber || "",
    invoiceStatus: r.invoice?.status || "",
    amount: Number(r.paidAmount || 0),
    totalAmount: Number(r.invoice?.totalAmount || 0),
    paidAmount: Number(r.paidAmount || 0),
    remainingAmount: Number(r.currentRemainingAmount || 0),
    mode: mapPaymentMode(r.paymentMode, r.onlineSelf?.paymentMode),
    txnId: r.onlineSelf?.transactionId || r.onlineSelf?.p_txnId || r.cheque?.chequeNumber || "",
    bankName: r.onlineSelf?.bankName || r.cheque?.bankName || r.cash?.bankName || "",
    date: r.receiptDate || "",
    loggedAt: r.loggedAt || "",
    receiptPdfPath: r.receiptPdfPath || "",
    status: mapReceiptStatus(r.receiptStatus, r.invoice?.status),
    resident: r.property?.propertyName || "",
    chequeNo: r.cheque?.chequeNumber || "",
    receivedBy: "",
    mobile: "",
    // raw refs for detail modal
    onlineSelf: r.onlineSelf || null,
    cheque: r.cheque || null,
    cash: r.cash || null,
    invoice: r.invoice || null,
    receiptInvoices: r.receiptInvoices || [],
});

const mapPaymentMode = (paymentMode, onlineSubMode) => {
    if (!paymentMode) return "Other";
    const pm = paymentMode.toLowerCase();
    if (pm === "cash") return "Cash";
    if (pm === "cheque") return "Cheque";
    if (pm === "discount") return "Discount";
    if (pm === "upi") return "UPI";
    if (pm === "net bank" || pm === "netbank" || pm === "net banking") return "Net Bank";
    if (pm === "credit card") return "Credit Card";
    if (pm === "online self") {
        // Map sub-mode from online payment
        if (!onlineSubMode) return "UPI";
        const sub = onlineSubMode.toLowerCase();
        if (sub === "upi") return "UPI";
        if (sub === "net bank" || sub === "netbank" || sub === "net banking") return "Net Bank";
        if (sub === "credit card") return "Credit Card";
        return onlineSubMode;
    }
    return paymentMode;
};

const mapReceiptStatus = (receiptStatus, invoiceStatus) => {
    if (receiptStatus === "success") return "Confirmed";
    if (receiptStatus === "failed") return "Failed";
    if (invoiceStatus === "Paid") return "Paid";
    if (invoiceStatus === "Partially Paid") return "Pending";
    return receiptStatus || "Pending";
};

// ── Reusable UI ───────────────────────────────────────────────────────
const Pill = ({ status }) => {
    const map = {
        Paid: { bg: "rgba(0,212,170,0.12)", color: "#00d4aa" },
        Pending: { bg: "rgba(255,179,71,0.12)", color: "#ffb347" },
        Overdue: { bg: "rgba(255,107,107,0.12)", color: "#ff6b6b" },
        Confirmed: { bg: "rgba(0,212,170,0.12)", color: "#00d4aa" },
        Cleared: { bg: "rgba(0,180,216,0.12)", color: "#00b4d8" },
        Deposited: { bg: "rgba(108,99,255,0.12)", color: "#6c63ff" },
        Failed: { bg: "rgba(255,107,107,0.12)", color: "#ff6b6b" },
        Bounced: { bg: "rgba(255,107,107,0.12)", color: "#ff6b6b" },
        Delivered: { bg: "rgba(0,212,170,0.12)", color: "#00d4aa" },
        Discount: { bg: "rgba(108,99,255,0.12)", color: "#6c63ff" },
    };
    const s = map[status] || { bg: "rgba(136,153,170,0.12)", color: "#8899aa" };
    return (
        <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
            {status}
        </span>
    );
};

const StatKPI = ({ label, value, sub, color = "#00d4aa", icon: Icon, trend, up }) => (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -12, right: -12, width: 64, height: 64, borderRadius: "50%", background: `${color}10` }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase" }}>{label}</div>
            {Icon && (
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={14} color={color} />
                </div>
            )}
        </div>
        <div style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 6 }}>{value}</div>
        {sub && <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 4 }}>{sub}</div>}
        {trend !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: up ? "#00d4aa" : "#ff6b6b", fontSize: 11, fontWeight: 600 }}>
                {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(trend)}% vs last month
            </div>
        )}
    </div>
);

const TableBtn = ({ icon: Icon, color, onClick, title }) => (
    <button title={title} onClick={onClick}
        style={{ background: `${color}15`, border: "none", borderRadius: 6, padding: "4px 8px", color, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        onMouseEnter={e => e.currentTarget.style.background = `${color}30`}
        onMouseLeave={e => e.currentTarget.style.background = `${color}15`}>
        <Icon size={12} />
    </button>
);

const Card = ({ children, style = {} }) => (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, ...style }}>
        {children}
    </div>
);

const SearchInput = ({ value, onChange, placeholder = "Search..." }) => (
    <div style={{ position: "relative" }}>
        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px 8px 30px", color: "var(--text-primary)", fontSize: 12, width: 220, outline: "none", fontFamily: "inherit" }} />
    </div>
);

const TH = ({ children, align = "left" }) => (
    <th style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: 10, fontWeight: 700, textAlign: align, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", borderBottom: "1px solid var(--border)" }}>
        {children}
    </th>
);
const TD = ({ children, style = {} }) => (
    <td style={{ padding: "11px 12px", borderBottom: "1px solid var(--border)", ...style }}>{children}</td>
);

const Pagination = ({ page, total, perPage, onChange }) => {
    const pages = Math.max(1, Math.ceil(total / perPage));
    const visiblePages = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) visiblePages.push(i);
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid var(--border)", marginTop: 8 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {fmtNum(total)}
            </span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button onClick={() => onChange(1)} disabled={page === 1} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: page === 1 ? "var(--text-muted)" : "var(--text-secondary)", cursor: page === 1 ? "not-allowed" : "pointer" }}><ChevronsLeft size={12} /></button>
                <button onClick={() => onChange(page - 1)} disabled={page === 1} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: page === 1 ? "var(--text-muted)" : "var(--text-secondary)", cursor: page === 1 ? "not-allowed" : "pointer" }}><ChevronLeft size={12} /></button>
                {visiblePages.map(p => (
                    <button key={p} onClick={() => onChange(p)}
                        style={{ background: p === page ? "var(--accent-teal)" : "none", border: `1px solid ${p === page ? "var(--accent-teal)" : "var(--border)"}`, borderRadius: 6, padding: "4px 10px", color: p === page ? "#000" : "var(--text-secondary)", fontWeight: p === page ? 700 : 400, cursor: "pointer", fontSize: 12, minWidth: 30 }}>
                        {p}
                    </button>
                ))}
                <button onClick={() => onChange(page + 1)} disabled={page === pages} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: page === pages ? "var(--text-muted)" : "var(--text-secondary)", cursor: page === pages ? "not-allowed" : "pointer" }}><ChevronRight size={12} /></button>
                <button onClick={() => onChange(pages)} disabled={page === pages} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: page === pages ? "var(--text-muted)" : "var(--text-secondary)", cursor: page === pages ? "not-allowed" : "pointer" }}><ChevronsRight size={12} /></button>
            </div>
        </div>
    );
};

const Modal = ({ open, onClose, title, width = 520, children }) => {
    if (!open) return null;
    return (
        <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, backdropFilter: "blur(4px)" }}
            onClick={onClose}>
            <div
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 18, width, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}
                onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                    <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 4 }}><X size={18} /></button>
                </div>
                <div style={{ padding: "20px 24px" }}>{children}</div>
            </div>
        </div>
    );
};

const FI = ({ label, field, type = "text", form, setForm, disabled }) => (
    <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</label>
        <input
            type={type}
            value={form[field] || ""}
            disabled={disabled}
            onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            style={{ width: "100%", background: disabled ? "var(--bg-card)" : "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 9, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box", opacity: disabled ? 0.6 : 1 }}
        />
    </div>
);

const BtnPrimary = ({ children, onClick, color = "teal", style: extraStyle = {} }) => {
    const bg = color === "red"
        ? "linear-gradient(135deg,#ff6b6b,#ff8c00)"
        : "linear-gradient(135deg,var(--accent-teal),var(--accent-blue))";
    return (
        <button onClick={onClick}
            style={{ background: bg, border: "none", borderRadius: 9, padding: "9px 20px", color: "#000", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", ...extraStyle }}>
            {children}
        </button>
    );
};

const BtnGhost = ({ children, onClick, style: extraStyle = {} }) => (
    <button onClick={onClick}
        style={{ padding: "9px 20px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 9, color: "var(--text-secondary)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, ...extraStyle }}>
        {children}
    </button>
);

// ── FilterBar ─────────────────────────────────────────────────────────
const FilterBar = ({ filters, onChange, onSearch, onClear }) => (
    <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 130 }}>
                    <label style={{ display: "block", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" }}>Receipt Date</label>
                    <input type="date" value={filters.receiptDate} onChange={e => onChange("receiptDate", e.target.value)}
                        style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text-primary)", fontSize: 12, outline: "none" }} />
                </div>
            <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" }}>Status</label>
                <select value={filters.status} onChange={e => onChange("status", e.target.value)}
                    style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text-primary)", fontSize: 12, outline: "none", cursor: "pointer" }}>
                    {["All", "Confirmed", "Pending", "Failed", "Paid", "Discount"].map(s => <option key={s}>{s}</option>)}
                </select>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" }}>Mode</label>
                <select value={filters.mode} onChange={e => onChange("mode", e.target.value)}
                    style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text-primary)", fontSize: 12, outline: "none", cursor: "pointer" }}>
                    {["All", "Cash", "Cheque", "UPI", "Net Bank", "Credit Card", "Discount", "Other"].map(s => <option key={s}>{s}</option>)}
                </select>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" }}>Receipt / Invoice No.</label>
                <input placeholder="RCPT0003528 or INV..." value={filters.refNo} onChange={e => onChange("refNo", e.target.value)}
                    style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text-primary)", fontSize: 12, outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
                <button onClick={onSearch}
                    style={{ background: "linear-gradient(135deg,var(--accent-teal),var(--accent-blue))", border: "none", borderRadius: 9, padding: "9px 18px", color: "#000", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Search size={13} /> Search
                </button>
                <button onClick={onClear}
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "9px 14px", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>
                    Clear
                </button>
            </div>
        </div>
    </Card>
);

// ── Main ReceiptTab Component ─────────────────────────────────────────
export default function ReceiptTab() {
    const {
        selectedSociety,
        setSelectedSociety,
        properties = [],
        invoices: ctxInvoices = [],
    } = useAppContext();

    // ── State ─────────────────────────────────────────────────────────
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const EF = { receiptDate: "", status: "All", mode: "All", refNo: "" };
    const [filters, setFilters] = useState(EF);
    const [applied, setApplied] = useState(EF);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [viewItem, setViewItem] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [localData, setLocalData] = useState([]);

    // ── Fetch receipts (InvoiceTab pattern) ───────────────────────────
    const fetchReceipts = useCallback(async (societyIdentifier) => {
        setLoading(true);
        setError(null);
        setPage(1);
        try {
            console.log("🚀 ReceiptTab: Fetching receipts for society:", societyIdentifier);
            const response = await getAllPaymentReceiptsApi(societyIdentifier);
            console.log("✅ ReceiptTab: API response:", response?.data);

            const rawData = response?.data?.data || response?.data?.results || response?.data || [];
            const arr = Array.isArray(rawData) ? rawData : [];

            const mapped = arr.map(mapReceipt);
            console.log("✅ ReceiptTab: Mapped receipts:", mapped.length);
            setReceipts(mapped);
        } catch (err) {
            console.error("❌ ReceiptTab: Fetch failed:", err);
            setError(err?.response?.data?.message || err?.message || "Failed to fetch receipts");
            setReceipts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Re-fetch when selectedSociety changes (same as InvoiceTab) ────
    useEffect(() => {
        if (!selectedSociety?.societyIdentifier) {
            setReceipts([]);
            return;
        }
        fetchReceipts(selectedSociety.societyIdentifier);
    }, [selectedSociety, fetchReceipts]);

    // ── Derived data ──────────────────────────────────────────────────
    const allData = useMemo(() => {
        const base = receipts.map((r, i) => ({ ...r, _key: `api-${r.id}-${i}` }));
        const local = localData.map((r, i) => ({ ...r, _key: `local-${r.id}-${i}` }));
        return [...base, ...local];
    }, [receipts, localData]);

    const PER = 8;

    // ── Date helper ───────────────────────────────────────────────────
    const toYMD = (val) => {
        if (!val) return null;
        // Already YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
        // Handle "DD-MM-YYYY" or "DD/MM/YYYY"
        const dmy = val.match(/^(\d{2})[\-\/](\d{2})[\-\/](\d{4})$/);
        if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
        // Handle "YYYY-MM-DD HH:mm:ss" or ISO with space/T
        const clean = val.split(" ")[0].split("T")[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
        const d = new Date(val);
        if (isNaN(d.getTime())) return null;
        const y = d.getUTCFullYear();
        const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
        const dy = String(d.getUTCDate()).padStart(2, "0");
        return `${y}-${mo}-${dy}`;
    };

    const filtered = allData.filter(r => {
        // Status filter
        if (applied.status !== "All" && r.status !== applied.status) return false;
        // Payment mode filter
        if (applied.mode && applied.mode !== "All" && r.mode !== applied.mode) return false;
        // Payment mode filter
        if (applied.mode && applied.mode !== "All" && r.mode !== applied.mode) return false;
        // Receipt No / Invoice Ref filter
        if (applied.refNo) {
            const q = applied.refNo.toLowerCase();
            if (!r.id.toLowerCase().includes(q) && !(r.invoiceRef || "").toLowerCase().includes(q)) return false;
        }
        // Receipt date exact match filter
        if (applied.receiptDate) {
            const refYMD = toYMD(r.date) || toYMD(r.loggedAt);
            if (!refYMD || refYMD !== applied.receiptDate) return false;
        }
        // Search bar
        if (search) {
            const q = search.toLowerCase();
            if (!r.id.toLowerCase().includes(q) &&
                !(r.property || "").toLowerCase().includes(q) &&
                !(r.invoiceRef || "").toLowerCase().includes(q) &&
                !(r.mode || "").toLowerCase().includes(q)) return false;
        }
        return true;
    });
    const paged = filtered.slice((page - 1) * PER, page * PER);

    // ── KPI stats ─────────────────────────────────────────────────────
    const totalAmount = allData.reduce((s, r) => s + r.paidAmount, 0);
    const confirmedCount = allData.filter(r => r.status === "Confirmed" || r.status === "Paid").length;
    const pendingCount = allData.filter(r => r.status !== "Confirmed" && r.status !== "Paid").length;

    // ── Delete ────────────────────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const handleDeleteReceipt = useCallback(async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true); setDeleteError("");
        try {
            await unprocessReceiptApi({
                society_identifier: selectedSociety?.societyIdentifier || "",
                receipt_number: deleteTarget._rawId || deleteTarget.id,
                receiptNumber: deleteTarget._rawId || deleteTarget.id,
            });
            setReceipts(prev => prev.filter(r => r.id !== deleteTarget.id));
            setLocalData(d => d.filter(x => x._key !== deleteTarget._key));
            setDeleteTarget(null);
            if (selectedSociety?.societyIdentifier) fetchReceipts(selectedSociety.societyIdentifier);
        } catch (err) {
            const msg = err?.response?.data?.message;
            setDeleteError(Array.isArray(msg) ? msg.join(", ") : msg || err?.message || "Failed to delete receipt.");
        } finally { setDeleteLoading(false); }
    }, [deleteTarget, selectedSociety, fetchReceipts]);

    // ── Add Receipt form ──────────────────────────────────────────────
    const EMPTY_FORM = {
        mode: "UPI",
        invoiceNumber: "",
        propertyIdentifier: "",
        amountInFigures: "",
        mobile: "",
        receiptDate: "",
        notesDetails: "",
        discount: "",
        bankName: "",
        chequeDate: "",
        chequeReceivedDate: "",
        branchName: "",
        amountInWords: "",
        chequeNumber: "",
    };
    const [form, setForm] = useState(EMPTY_FORM);
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState("");
    const isCheque = form.mode === "Cheque";

    const [invSearch, setInvSearch] = useState("");
    const [propSearch, setPropSearch] = useState("");
    const [invOpen, setInvOpen] = useState(false);
    const [propOpen, setPropOpen] = useState(false);

    const invOptions = useMemo(() =>
        ctxInvoices
            .filter(inv => inv.status !== "Paid")
            .filter(inv => {
                const q = invSearch.toLowerCase();
                return !q
                    || (inv.invId || "").toLowerCase().includes(q)
                    || (inv.flatNo || "").toLowerCase().includes(q)
                    || (inv.ownerName || "").toLowerCase().includes(q);
            })
            .slice(0, 50),
        [ctxInvoices, invSearch]
    );

    const propOptions = useMemo(() =>
        properties
            .filter(p => {
                const q = propSearch.toLowerCase();
                return !q
                    || (p.identifier || "").toLowerCase().includes(q)
                    || (p.unit || "").toLowerCase().includes(q)
                    || (p.owner || "").toLowerCase().includes(q);
            })
            .slice(0, 50),
        [properties, propSearch]
    );

    const handleAddReceipt = useCallback(async () => {
        if (!form.invoiceNumber || !form.propertyIdentifier || !form.amountInFigures) {
            setAddError("Invoice Number, Property, and Amount are required."); return;
        }
        if (!form.mobile) { setAddError("Mobile number is required."); return; }
        if (!form.receiptDate) { setAddError("Receipt Date is required."); return; }
        setAddLoading(true); setAddError("");
        try {
            const toDate = d => d ? new Date(d).toISOString().split("T")[0] : null;
            if (isCheque) {
                await createChequePaymentApi({
                    invoiceNumber: String(form.invoiceNumber).trim(),
                    propertyIdentifier: String(form.propertyIdentifier).trim(),
                    amountInFigures: Number(form.amountInFigures),
                    ...(form.amountInWords ? { amountInWords: form.amountInWords } : {}),
                    ...(form.bankName ? { bankName: form.bankName } : {}),
                    ...(form.branchName ? { branchName: form.branchName } : {}),
                    ...(form.chequeNumber ? { chequeNumber: form.chequeNumber } : {}),
                    ...(toDate(form.chequeDate) ? { chequeDate: toDate(form.chequeDate) } : {}),
                    ...(toDate(form.chequeReceivedDate) ? { chequeReceivedDate: toDate(form.chequeReceivedDate) } : {}),
                    ...(toDate(form.receiptDate) ? { receiptDate: toDate(form.receiptDate) } : {}),
                    ...(form.mobile ? { mobile: String(form.mobile).trim() } : {}),
                    ...(form.discount ? { discount: Number(form.discount) } : {}),
                });
            } else {
                await createCashPaymentApi({
                    invoiceNumber: String(form.invoiceNumber).trim(),
                    propertyIdentifier: String(form.propertyIdentifier).trim(),
                    amountInFigures: Number(form.amountInFigures) || 0,
                    ...(form.mobile ? { mobile: String(form.mobile).trim() } : {}),
                    ...(form.receiptDate ? { receiptDate: new Date(form.receiptDate).toISOString().split("T")[0] } : {}),
                    ...(form.notesDetails ? { notesDetails: form.notesDetails } : {}),
                    ...(form.discount ? { discount: Number(form.discount) } : {}),
                });
            }
            // Optimistic local row
            setLocalData(d => [...d, {
                id: `RCPT-NEW-${Date.now()}`,
                property: form.propertyIdentifier,
                propertyIdentifier: form.propertyIdentifier,
                invoiceRef: form.invoiceNumber,
                paidAmount: Number(form.amountInFigures),
                amount: Number(form.amountInFigures),
                mode: form.mode,
                txnId: form.chequeNumber || `MANUAL-${Date.now()}`,
                date: form.receiptDate,
                status: "Pending",
                bankName: form.bankName,
                chequeNo: form.chequeNumber,
                societyIdentifier: selectedSociety?.societyIdentifier || "",
            }]);
            setShowAdd(false);
            setForm(EMPTY_FORM);
            setInvSearch(""); setPropSearch("");
            if (selectedSociety?.societyIdentifier) fetchReceipts(selectedSociety.societyIdentifier);
        } catch (err) {
            const msg = err?.response?.data?.message;
            setAddError(Array.isArray(msg) ? msg.join(", ") : msg || err?.message || "Failed to add receipt.");
        } finally { setAddLoading(false); }
    }, [form, isCheque, selectedSociety, fetchReceipts]);

    const MC = {
        UPI: "var(--accent-teal)",
        Cash: "#ff6b6b",
        Cheque: "#ffb347",
        "Net Bank": "var(--accent-purple)",
        "NEFT/IMPS": "var(--accent-purple)",
        "Credit Card": "var(--accent-blue)",
        "Online Self": "var(--accent-teal)",
        Discount: "#6c63ff",
    };

    const resetAdd = () => {
        setShowAdd(false); setAddError("");
        setInvSearch(""); setPropSearch("");
        setInvOpen(false); setPropOpen(false);
    };

    return (
        <div>
            {/* ── KPI Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
                <StatKPI label="Total Receipts" value={fmtNum(allData.length)} sub="All time" color="#00d4aa" icon={Receipt} />
                <StatKPI label="Amount Collected" value={fmt(totalAmount)} sub="Paid receipts" color="#6c63ff" icon={Wallet} />
                <StatKPI label="Confirmed" value={fmtNum(confirmedCount)} sub="Successful" color="#00b4d8" icon={CheckCircle} />
                <StatKPI label="Pending / Failed" value={fmtNum(pendingCount)} sub="Need action" color="#ff6b6b" icon={AlertCircle} />
            </div>

            {/* ── Filter Bar ── */}
            <FilterBar
                filters={filters}
                onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
                onSearch={() => { setApplied(filters); setPage(1); }}
                onClear={() => { setFilters(EF); setApplied(EF); setPage(1); }}
            />

            {/* ── Loading / Error ── */}
            {loading && (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                    <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", marginBottom: 8, display: "block", margin: "0 auto 10px" }} />
                    Receipts load ho rahe hain...
                </div>
            )}
            {error && !loading && (
                <div style={{ padding: 20, background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 12, marginBottom: 16 }}>
                    <div style={{ color: "#ff6b6b", fontWeight: 600, marginBottom: 6 }}>❌ Error: {error}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Console mein details check karein.</div>
                </div>
            )}

            {/* ── Table ── */}
            {!loading && (
                <Card>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search receipt, property, invoice..." />
                        <div style={{ display: "flex", gap: 8 }}>
                            <BtnGhost style={{ color: "var(--accent-teal)" }}><Download size={12} /> Export</BtnGhost>
                            <BtnPrimary onClick={() => { setShowAdd(true); setAddError(""); setForm(EMPTY_FORM); setInvSearch(""); setPropSearch(""); setInvOpen(false); setPropOpen(false); }}>
                                <Plus size={12} /> Add Receipt
                            </BtnPrimary>
                        </div>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <TH>Receipt No.</TH>
                                    <TH>Property</TH>
                                    <TH>Invoice Ref</TH>
                                    <TH>Invoice Status</TH>
                                    <TH align="right">Paid Amount</TH>
                                    <TH>Mode</TH>
                                    <TH>Txn / Cheque ID</TH>
                                    <TH>Receipt Date</TH>
                                    <TH>Status</TH>
                                    <TH>Actions</TH>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map(r => (
                                    <tr key={r._key || r.id}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <TD>
                                            <span style={{ color: "var(--accent-teal)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>{r.id}</span>
                                        </TD>
                                        <TD>
                                            <span style={{ background: "rgba(0,212,170,0.1)", color: "var(--accent-teal)", borderRadius: 6, padding: "2px 8px", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                                                {r.property}
                                            </span>
                                        </TD>
                                        <TD>
                                            <span style={{ color: "var(--accent-purple)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{r.invoiceRef}</span>
                                        </TD>
                                        <TD>
                                            <Pill status={r.invoiceStatus || "—"} />
                                        </TD>
                                        <TD style={{ textAlign: "right" }}>
                                            <span style={{ color: "var(--text-primary)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{fmtFull(r.paidAmount)}</span>
                                        </TD>
                                        <TD>
                                            <span style={{ background: `${MC[r.mode] || "#8899aa"}18`, color: MC[r.mode] || "#8899aa", borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>
                                                {r.mode}
                                            </span>
                                        </TD>
                                        <TD>
                                            <span style={{ color: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}>{r.txnId || r.chequeNo || "—"}</span>
                                        </TD>
                                        <TD>
                                            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{r.date}</span>
                                        </TD>
                                        <TD><Pill status={r.status} /></TD>
                                        <TD>
                                            <div style={{ display: "flex", gap: 4 }}>
                                                <TableBtn icon={Eye} color="var(--accent-teal)" onClick={() => setViewItem(r)} title="View" />
                                                <TableBtn icon={Printer} color="var(--accent-purple)" onClick={() => {
                                                    if (r.receiptPdfPath) window.open(r.receiptPdfPath, "_blank");
                                                }} title="Print / Download PDF" />
                                                <TableBtn icon={Copy} color="var(--accent-blue)" onClick={() => navigator.clipboard?.writeText(r.txnId || r.chequeNo || "")} title="Copy TXN ID" />
                                                <TableBtn icon={Trash2} color="#ff6b6b" onClick={() => { setDeleteTarget(r); setDeleteError(""); }} title="Delete" />
                                            </div>
                                        </TD>
                                    </tr>
                                ))}
                                {paged.length === 0 && (
                                    <tr>
                                        <td colSpan={10} style={{ padding: "40px 12px", textAlign: "center", color: "var(--text-muted)" }}>
                                            {!selectedSociety
                                                ? "Pehle upar se society select karein"
                                                : "Koi receipt nahi mili"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
                </Card>
            )}

            {/* ── View Modal ── */}
            <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Receipt Details" width={500}>
                {viewItem && (
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, padding: "14px 16px", background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)" }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(0,212,170,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Receipt size={20} color="var(--accent-teal)" />
                            </div>
                            <div>
                                <div style={{ color: "var(--accent-teal)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15 }}>{viewItem.id}</div>
                                <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>Payment Receipt</div>
                            </div>
                            <Pill status={viewItem.status} />
                        </div>

                        {/* Main fields */}
                        {[
                            ["Property", viewItem.property],
                            ["Invoice Ref", viewItem.invoiceRef],
                            ["Invoice Status", viewItem.invoiceStatus],
                            ["Paid Amount", fmtFull(viewItem.paidAmount)],
                            ["Total Invoice Amount", fmtFull(viewItem.totalAmount)],
                            ["Remaining Amount", fmtFull(viewItem.remainingAmount)],
                            ["Payment Mode", viewItem.mode],
                            ["Transaction ID", viewItem.txnId],
                            ["Bank Name", viewItem.bankName],
                            ["Receipt Date", viewItem.date],
                            ["Logged At", viewItem.loggedAt],
                        ].filter(([, v]) => v).map(([k, v]) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                                <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{k}</span>
                                <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{v}</span>
                            </div>
                        ))}

                        {/* Online Self details */}
                        {viewItem.onlineSelf && (
                            <div style={{ marginTop: 14, padding: "12px 14px", background: "var(--bg-card)", borderRadius: 10, border: "1px solid var(--border)" }}>
                                <div style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Online Payment Details</div>
                                {[
                                    ["Sub Mode", viewItem.onlineSelf.paymentMode],
                                    ["Date of Payment", viewItem.onlineSelf.dateOfPayment],
                                    ["Clearance Date", viewItem.onlineSelf.clearanceDate],
                                    ["Internal TXN ID", viewItem.onlineSelf.p_txnId],
                                    ["Remarks", viewItem.onlineSelf.remarks],
                                ].filter(([, v]) => v).map(([k, v]) => (
                                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                                        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{k}</span>
                                        <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                            <BtnGhost style={{ flex: 1, justifyContent: "center", color: "var(--accent-teal)" }}
                                onClick={() => { if (viewItem.receiptPdfPath) window.open(viewItem.receiptPdfPath, "_blank"); }}>
                                <Download size={14} /> Download PDF
                            </BtnGhost>
                            <BtnGhost style={{ flex: 1, justifyContent: "center", color: "var(--accent-purple)" }}>
                                <Send size={14} /> Email
                            </BtnGhost>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── Add Receipt Modal ── */}
            <Modal open={showAdd} onClose={() => { if (!addLoading) resetAdd(); }} title="Add Receipt" width={580}>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.3px" }}>Payment Mode *</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {["UPI", "Cash", "Cheque", "Net Bank", "Credit Card"].map(m => (
                            <button key={m} onClick={() => setForm(f => ({ ...f, mode: m }))}
                                style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${form.mode === m ? "var(--accent-teal)" : "var(--border)"}`, background: form.mode === m ? "rgba(0,212,170,0.12)" : "var(--bg-card)", color: form.mode === m ? "var(--accent-teal)" : "var(--text-secondary)", fontWeight: form.mode === m ? 700 : 400, fontSize: 12, cursor: "pointer" }}>
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {/* Invoice search dropdown */}
                    <div style={{ position: "relative" }}>
                        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.3px" }}>Invoice Number *</label>
                        <input
                            value={invSearch || form.invoiceNumber}
                            onChange={e => { setInvSearch(e.target.value); setInvOpen(true); setForm(f => ({ ...f, invoiceNumber: "" })); }}
                            onFocus={() => setInvOpen(true)}
                            onBlur={() => setTimeout(() => setInvOpen(false), 180)}
                            placeholder={ctxInvoices.length ? "Search invoice…" : "Loading…"}
                            style={{ width: "100%", background: "var(--input-bg)", border: `1px solid ${form.invoiceNumber ? "var(--accent-teal)" : "var(--input-border)"}`, borderRadius: 9, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                        />
                        {form.invoiceNumber && <div style={{ marginTop: 4, fontSize: 11, color: "var(--accent-teal)", fontFamily: "var(--font-mono)" }}>✓ {form.invoiceNumber}</div>}
                        {invOpen && invOptions.length > 0 && (
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", maxHeight: 220, overflowY: "auto", marginTop: 4 }}>
                                {invOptions.map(inv => (
                                    <div key={inv.id}
                                        onMouseDown={() => {
                                            setForm(f => ({
                                                ...f,
                                                invoiceNumber: inv.invId || String(inv.id),
                                                propertyIdentifier: inv.propertyIdentifier || inv.flatNo || f.propertyIdentifier,
                                                amountInFigures: String(inv.outstanding || inv.amount || f.amountInFigures),
                                                mobile: inv.mobile || f.mobile,
                                            }));
                                            setInvSearch(""); setPropSearch(""); setInvOpen(false);
                                        }}
                                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                                        onMouseLeave={e => e.currentTarget.style.background = ""}>
                                        <div>
                                            <div style={{ color: "var(--accent-teal)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{inv.invId}</div>
                                            <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>{inv.flatNo} · {inv.ownerName}</div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>₹{(inv.outstanding || inv.amount || 0).toLocaleString("en-IN")}</div>
                                            <div style={{ fontSize: 10, color: inv.status === "Overdue" ? "#ff6b6b" : "var(--text-muted)" }}>{inv.status}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Property search dropdown */}
                    <div style={{ position: "relative" }}>
                        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.3px" }}>Property Identifier *</label>
                        <input
                            value={propSearch || form.propertyIdentifier}
                            onChange={e => { setPropSearch(e.target.value); setPropOpen(true); setForm(f => ({ ...f, propertyIdentifier: "" })); }}
                            onFocus={() => setPropOpen(true)}
                            onBlur={() => setTimeout(() => setPropOpen(false), 180)}
                            placeholder={properties.length ? "Search property…" : "Loading…"}
                            style={{ width: "100%", background: "var(--input-bg)", border: `1px solid ${form.propertyIdentifier ? "var(--accent-teal)" : "var(--input-border)"}`, borderRadius: 9, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                        />
                        {form.propertyIdentifier && <div style={{ marginTop: 4, fontSize: 11, color: "var(--accent-teal)", fontFamily: "var(--font-mono)" }}>✓ {form.propertyIdentifier}</div>}
                        {propOpen && propOptions.length > 0 && (
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", maxHeight: 220, overflowY: "auto", marginTop: 4 }}>
                                {propOptions.map(p => (
                                    <div key={p.id}
                                        onMouseDown={() => { setForm(f => ({ ...f, propertyIdentifier: p.identifier || p.unit })); setPropSearch(""); setPropOpen(false); }}
                                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                                        onMouseLeave={e => e.currentTarget.style.background = ""}>
                                        <div>
                                            <div style={{ color: "var(--accent-teal)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{p.identifier}</div>
                                            <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>{p.unit} · {p.owner}</div>
                                        </div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.type}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <FI label="Amount (₹) *" field="amountInFigures" type="number" form={form} setForm={setForm} />
                    <FI label="Mobile *" field="mobile" form={form} setForm={setForm} />
                    <FI label="Receipt Date *" field="receiptDate" type="date" form={form} setForm={setForm} />
                    <FI label="Discount (₹)" field="discount" type="number" form={form} setForm={setForm} />

                    {!isCheque && (
                        <div style={{ gridColumn: "1/-1" }}>
                            <FI label="Notes / Details" field="notesDetails" form={form} setForm={setForm} />
                        </div>
                    )}
                    {isCheque && <>
                        <FI label="Bank Name" field="bankName" form={form} setForm={setForm} />
                        <FI label="Branch Name" field="branchName" form={form} setForm={setForm} />
                        <FI label="Cheque Number" field="chequeNumber" form={form} setForm={setForm} />
                        <FI label="Cheque Date" field="chequeDate" type="date" form={form} setForm={setForm} />
                        <FI label="Cheque Received Date" field="chequeReceivedDate" type="date" form={form} setForm={setForm} />
                        <div style={{ gridColumn: "1/-1" }}>
                            <FI label="Amount In Words" field="amountInWords" form={form} setForm={setForm} />
                        </div>
                    </>}
                </div>

                {addError && (
                    <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, color: "#ff6b6b", fontSize: 12 }}>
                        <AlertCircle size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />{addError}
                    </div>
                )}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                    <BtnGhost onClick={() => { if (!addLoading) resetAdd(); }}>Cancel</BtnGhost>
                    <BtnPrimary onClick={handleAddReceipt} style={{ opacity: addLoading ? 0.7 : 1 }}>
                        {addLoading
                            ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
                            : <><Plus size={12} /> Save Receipt</>}
                    </BtnPrimary>
                </div>
            </Modal>

            {/* ── Delete Confirm Modal ── */}
            <Modal open={!!deleteTarget} onClose={() => { if (!deleteLoading) { setDeleteTarget(null); setDeleteError(""); } }} title="Delete Receipt" width={420}>
                {deleteTarget && (
                    <div>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20, padding: "14px 16px", background: "rgba(255,107,107,0.07)", borderRadius: 12, border: "1px solid rgba(255,107,107,0.2)" }}>
                            <AlertTriangle size={22} color="#ff6b6b" style={{ flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                                    Delete receipt <span style={{ color: "var(--accent-teal)", fontFamily: "var(--font-mono)" }}>{deleteTarget.id}</span>?
                                </div>
                                <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                                    Amount: <strong>{fmtFull(deleteTarget.paidAmount)}</strong> · {deleteTarget.mode} · {deleteTarget.date}
                                </div>
                            </div>
                        </div>
                        {deleteError && (
                            <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, color: "#ff6b6b", fontSize: 12 }}>
                                <AlertCircle size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />{deleteError}
                            </div>
                        )}
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <BtnGhost onClick={() => { if (!deleteLoading) { setDeleteTarget(null); setDeleteError(""); } }}>Cancel</BtnGhost>
                            <BtnPrimary color="red" onClick={handleDeleteReceipt} style={{ opacity: deleteLoading ? 0.7 : 1 }}>
                                {deleteLoading
                                    ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Deleting…</>
                                    : <><Trash2 size={12} /> Confirm Delete</>}
                            </BtnPrimary>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}