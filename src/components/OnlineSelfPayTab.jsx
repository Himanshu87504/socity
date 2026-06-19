

import React, { useState, useEffect } from "react";
import {
    Wallet, Plus, Search,
    Edit2, Eye, X,
    ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight,
    CheckCircle2, IndianRupee,
    CreditCard, Receipt, Clock, Paperclip,
    FileText, Trash2,
} from "lucide-react";

import {
    getAllOnlineSelfPaymentApi,
    createNewOnlineSelfPaymentApi,
    updateOnlineSelfPaymentApi,
    updateOnlineSelfPaymentStatusApi,
    deleteOnlineSelfPaymentApi,
} from "../api/payment-api";
import { getAllInvoicesApi } from "../api/account-api";

import { useAppContext } from "../AppContext";

// ─── CONSTANTS ───────────────────────────────

const PAYMENT_MODES = ["UPI", "Net Banking", "Debit Card", "Credit Card", "Wallet", "NEFT/IMPS"];

const PAYMENT_STATUSES = ["Pending", "Success"];

const EMPTY_FORM = {
    invoiceNumber: "",
    propertyIdentifier: "",
    propertyName: "",
    societyIdentifier: "",
    societyName: "",
    dateOfPayment: "",
    paymentMode: PAYMENT_MODES[0],
    transactionId: "",
    amount: "",
    bankName: "",
    remarks: "",
    paymentFile: null,
    paymentStatus: PAYMENT_STATUSES[0],
};

const PER_PAGE = 9;

// ─── HELPERS ─────────────────────────────────

const safeStr = (v) => (v == null ? "" : String(v));

const formatNumber = (n) => Number(n).toLocaleString("en-IN");

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const todayStr = () => new Date().toISOString().split("T")[0];

export function mapOnlinePayment(item, i) {
    return {
        id: item.id || item._id || i + 1,
        applicationIdentifier: safeStr(
            item.applicationIdentifier || item.paymentId || item.payment_id ||
            `OSP-${String(i + 1).padStart(7, "0")}`
        ),
        p_txnId: safeStr(item.p_txnId || item.p_txn_id || ""),
        invoiceNumber: safeStr(item.invoiceNumber || item.invoice_number || ""),
        propertyIdentifier: safeStr(item.propertyIdentifier || item.property_identifier || item.flat_no || ""),
        societyIdentifier: safeStr(item.societyIdentifier || item.society_identifier || ""),
        paymentMode: safeStr(item.paymentMode || item.payment_mode || ""),
        amount: item.amount ?? item.payment_amount ?? 0,
        transactionId: safeStr(item.transactionId || item.transaction_id || ""),
        dateOfPayment: safeStr(item.dateOfPayment || item.date_of_payment || item.paymentDate || item.payment_date || ""),
        clearanceDate: safeStr(item.clearanceDate || item.clearance_date || ""),
        bankName: safeStr(item.bankName || item.bank_name || ""),
        remarks: safeStr(item.remarks || item.remark || ""),
        paymentStatus: safeStr(item.paymentStatus || item.payment_status || item.status || "Pending"),
        paymentFileUrl: safeStr(item.paymentFile || item.payment_file || item.receiptUrl || item.receipt_url || ""),
        createdBy: safeStr(item.createdBy || item.created_by || ""),
        createdAt: safeStr(item.createdAt || item.created_at || ""),
        updatedAt: safeStr(item.updatedAt || item.updated_at || ""),
        isDeleted: item.isDeleted || item.is_deleted || false,
    };
}

function mapInvoice(item, i) {
    return {
        id: item.id || item._id || i + 1,
        invoiceNumber: safeStr(item.invoiceNumber || item.invoice_number || ""),
        propertyIdentifier: safeStr(item.propertyIdentifier || item.property?.propertyIdentifier || item.property_identifier || item.flat_no || ""),
        propertyName: safeStr(item.property?.propertyName || item.propertyName || ""),
        societyIdentifier: safeStr(item.societyIdentifier || item.society?.societyIdentifier || item.society_identifier || ""),
        societyName: safeStr(item.society?.societyName || item.societyName || ""),
        amount: item.amount ?? item.invoiceAmount ?? item.invoice_amount ?? 0,
    };
}

// ─── SHARED STYLES ────────────────────────────

const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 9,
    padding: "9px 12px",
    color: "var(--text-primary)",
    fontSize: 13,
    outline: "none",
    transition: "border-color 0.15s, background 0.15s",
    boxSizing: "border-box",
};

const labelStyle = {
    display: "block",
    color: "#6b7a90",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.2px",
    marginBottom: 6,
};

const fieldWrapper = { marginBottom: 13 };
const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

// ─── STATUS BADGE ─────────────────────────────

const STATUS_COLORS = {
    "sucess": { bg: "rgba(0,212,170,0.12)", color: "#00d4aa" },
    "success": { bg: "rgba(0,212,170,0.12)", color: "#00d4aa" },
    "pending": { bg: "rgba(255,179,71,0.12)", color: "#ffb347" },
    "failed": { bg: "rgba(255,107,107,0.12)", color: "#ff6b6b" },
    "refunded": { bg: "rgba(108,99,255,0.12)", color: "#6c63ff" },
    "N/A": { bg: "rgba(136,153,170,0.12)", color: "#8899aa" },
};

const StatusBadge = ({ status }) => {
    const key = safeStr(status).toLowerCase();
    const s = STATUS_COLORS[key] || STATUS_COLORS["N/A"];
    return (
        <span style={{
            background: s.bg, color: s.color,
            padding: "3px 9px", borderRadius: 20,
            fontSize: 11, fontWeight: 600, textTransform: "capitalize",
        }}>
            {status || "N/A"}
        </span>
    );
};

// ─── SECTION LABEL ────────────────────────────

const SectionLabel = ({ children }) => (
    <div style={{
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 10, fontWeight: 700, letterSpacing: "1px",
        color: "#6b7a90", textTransform: "uppercase",
        margin: "16px 0 12px",
    }}>
        {children}
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
    </div>
);

// ─── FORM INPUT ───────────────────────────────

const FormInput = ({ label, field, type = "text", form, setForm, optional = false, ...rest }) => (
    <div style={fieldWrapper}>
        <label style={labelStyle}>
            {label} {optional && <span style={{ color: "#556677", fontWeight: 400 }}>(optional)</span>}
        </label>
        <input
            type={type}
            value={form[field] || ""}
            onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
            style={inputStyle}
            {...rest}
        />
    </div>
);

// ─── FORM SELECT ──────────────────────────────

const FormSelect = ({ label, field, options, form, setForm, optional = false, labels }) => (
    <div style={fieldWrapper}>
        <label style={labelStyle}>
            {label} {optional && <span style={{ color: "#556677", fontWeight: 400 }}>(optional)</span>}
        </label>
        <select
            value={form[field] || ""}
            onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
            style={{ ...inputStyle, cursor: "pointer" }}
        >
            {options.map((o) => <option key={o} value={o}>{labels?.[o] || o}</option>)}
        </select>
    </div>
);

// ─── FORM FILE ────────────────────────────────

const FormFile = ({ label, field, form, setForm, required = false }) => (
    <div style={fieldWrapper}>
        <label style={labelStyle}>
            {label} {required && <span style={{ color: "#ff6b6b" }}>*</span>}
        </label>
        <div style={{
            display: "flex", alignItems: "center", gap: 10,
            border: "1px dashed rgba(255,255,255,0.15)",
            borderRadius: 9, padding: "9px 12px",
            background: "rgba(255,255,255,0.03)",
        }}>
            <Paperclip size={14} color="#6b7a90" />
            <input
                type="file"
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.files?.[0] || null }))}
                style={{ fontSize: 12, color: "#8899aa", width: "100%" }}
            />
        </div>
        {form[field] && typeof form[field] === "object" && (
            <p style={{ color: "#00d4aa", fontSize: 11, marginTop: 5 }}>
                Selected: {form[field].name || "file attached"}
            </p>
        )}
        {form[field] && typeof form[field] === "string" && (
            <p style={{ color: "#8899aa", fontSize: 11, marginTop: 5 }}>
                Existing file: {form[field]}
            </p>
        )}
    </div>
);

// ─── PAGINATION ───────────────────────────────

const Pagination = ({ page, total, perPage, onChange }) => {
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const visiblePages = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        visiblePages.push(i);
    }
    const btnBase = {
        background: "none", border: "1px solid var(--border)",
        borderRadius: 6, padding: "4px 8px", cursor: "pointer",
    };
    const isFirst = page === 1;
    const isLast = page === totalPages;

    return (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 20px", borderTop: "1px solid var(--border)",
        }}>
            <span style={{ color: "#8899aa", fontSize: 12 }}>
                Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}
                –{Math.min(page * perPage, total)} of {formatNumber(total)}
            </span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button onClick={() => onChange(1)} disabled={isFirst} style={{ ...btnBase, color: isFirst ? "#556677" : "#8899aa" }}><ChevronsLeft size={12} /></button>
                <button onClick={() => onChange(page - 1)} disabled={isFirst} style={{ ...btnBase, color: isFirst ? "#556677" : "#8899aa" }}><ChevronLeft size={12} /></button>
                {visiblePages.map((p) => (
                    <button key={p} onClick={() => onChange(p)} style={{
                        ...btnBase,
                        background: p === page ? "#00d4aa" : "none",
                        border: `1px solid ${p === page ? "#00d4aa" : "var(--border)"}`,
                        color: p === page ? "#000" : "#8899aa",
                        fontWeight: p === page ? 700 : 400,
                        fontSize: 12, minWidth: 30,
                    }}>{p}</button>
                ))}
                <button onClick={() => onChange(page + 1)} disabled={isLast} style={{ ...btnBase, color: isLast ? "#556677" : "#8899aa" }}><ChevronRight size={12} /></button>
                <button onClick={() => onChange(totalPages)} disabled={isLast} style={{ ...btnBase, color: isLast ? "#556677" : "#8899aa" }}><ChevronsRight size={12} /></button>
            </div>
        </div>
    );
};

// ─── MAIN COMPONENT ───────────────────────────

export default function OnlineSelfPaymentDashboard() {

    const { onlineSelfPayments: ctxPayments, setOnlineSelfPayments, selectedSociety } = useAppContext();

    const [localData, setLocalData] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState(null); // "add" | "edit" | "view" | "status"
    const [form, setForm] = useState(EMPTY_FORM);
    const [viewItem, setViewItem] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // row to delete
    const [statusFilter, setStatusFilter] = useState("All");
    const [fetchLoading, setFetchLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    // Update Status modal
    const [statusModalRow, setStatusModalRow] = useState(null); // row being marked success
    const [clearanceDate, setClearanceDate] = useState("");
    const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

    // Invoice list (for Add Payment dropdown)
    const [invoices, setInvoices] = useState([]);
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState("");

    // Fetch all online self payments on mount
    useEffect(() => {
        const fetchPayments = async () => {
            setFetchLoading(true);
            setFetchError(null);
            try {
                const res = await getAllOnlineSelfPaymentApi();
                const raw = res?.data?.data || res?.data || [];
                const mapped = raw.map((item, i) => mapOnlinePayment(item, i));
                setLocalData(mapped);
                if (setOnlineSelfPayments) setOnlineSelfPayments(() => mapped);
            } catch (err) {
                console.error("[OnlineSelfPayment Fetch] Failed:", err?.message);
                setFetchError("Failed to load payments. Showing cached data.");
            } finally {
                setFetchLoading(false);
            }
        };
        fetchPayments();
    }, []);

    // Fetch invoices for the Add Payment dropdown
    const fetchInvoices = async () => {
        setInvoiceLoading(true);

        try {
            const id =
                selectedSociety?.societyIdentifier ||
                selectedSociety?.identifier ||
                selectedSociety?.society_identifier;

            console.log("Selected Society:", selectedSociety);
            console.log("Society ID:", id);

            if (!id) {
                console.warn("Society Identifier not found");
                setInvoices([]);
                return;
            }

            const res = await getAllInvoicesApi({}, id);

            console.log("Invoice Response:", res);

            const raw = res?.data?.data || res?.data || [];

            setInvoices(
                Array.isArray(raw)
                    ? raw.map((item, i) => mapInvoice(item, i))
                    : []
            );
        } catch (err) {
            console.warn("[Invoice Fetch] Failed:", err?.message);
            setInvoices([]);
        } finally {
            setInvoiceLoading(false);
        }
    };

    const activeData = localData || ctxPayments || [];

    // Stats
    const totalAmount = activeData.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const successCount = activeData.filter((p) => ["sucess", "success"].includes(safeStr(p.paymentStatus).toLowerCase())).length;
    const pendingCount = activeData.filter((p) => safeStr(p.paymentStatus).toLowerCase() === "pending").length;
    const failedCount = activeData.filter((p) => safeStr(p.paymentStatus).toLowerCase() === "failed").length;

    const stats = [
        { label: "Total Payments", value: activeData.length, color: "#6c63ff", icon: Wallet, isCurrency: false },
        { label: "Total Amount", value: formatCurrency(totalAmount), color: "#00d4aa", icon: IndianRupee, isCurrency: true },
        { label: "Successful", value: successCount, color: "#00b4d8", icon: CheckCircle2, isCurrency: false },
        { label: "Pending / Failed", value: pendingCount + failedCount, color: "#ffb347", icon: Clock, isCurrency: false },
    ];

    const syncData = (updater) => {
        setLocalData(updater(activeData));
        if (setOnlineSelfPayments) setOnlineSelfPayments(updater);
    };

    // Filtering
    const STATUS_TABS = ["All", ...PAYMENT_STATUSES];

    const filtered = activeData.filter((p) => {
        const q = search.toLowerCase().trim();
        const matchesSearch = (
            safeStr(p.applicationIdentifier).toLowerCase().includes(q) ||
            safeStr(p.invoiceNumber).toLowerCase().includes(q) ||
            safeStr(p.paymentMode).toLowerCase().includes(q) ||
            safeStr(p.transactionId).toLowerCase().includes(q) ||
            safeStr(p.propertyIdentifier).toLowerCase().includes(q) ||
            safeStr(p.bankName).toLowerCase().includes(q) ||
            safeStr(p.remarks).toLowerCase().includes(q)
        );
        const matchesStatus = statusFilter === "All" || safeStr(p.paymentStatus).toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    // ─── INVOICE SELECT (auto-fill) ──────────────

    const handleInvoiceSelect = (invoiceNumber) => {
        setSelectedInvoiceNumber(invoiceNumber);
        const inv = invoices.find((i) => i.invoiceNumber === invoiceNumber);
        if (inv) {
            setForm((f) => ({
                ...f,
                invoiceNumber: inv.invoiceNumber,
                propertyIdentifier: inv.propertyIdentifier,
                propertyName: inv.propertyName,
                societyIdentifier: inv.societyIdentifier,
                societyName: inv.societyName,
            }));
        } else {
            setForm((f) => ({ ...f, invoiceNumber: "", propertyIdentifier: "", propertyName: "", societyIdentifier: "", societyName: "" }));
        }
    };

    // ─── UPDATE STATUS (dedicated modal — mark as Success) ───────

    const openStatusModal = (row) => {
        setStatusModalRow(row);
        setClearanceDate(todayStr());
        setModal("status");
    };

    const handleStatusUpdateConfirm = async () => {
        if (!statusModalRow || !clearanceDate) return;
        setStatusUpdateLoading(true);
        setActionError(null);
        try {
            // NOTE: payment-api.js me updateOnlineSelfPaymentStatusApi ko clearanceDate
            // bhi accept + payload me bhejna padega, jaisa backend expect karta hai:
            // { transactionId: p_txnId, onlineSelfStatus: "Success", clearanceDate }
            await updateOnlineSelfPaymentStatusApi(statusModalRow.p_txnId, "success", clearanceDate);
            syncData((d) =>
                d.map((r) =>
                    r.p_txnId === statusModalRow.p_txnId
                        ? { ...r, paymentStatus: "success", clearanceDate }
                        : r
                )
            );
            setModal(null);
            setStatusModalRow(null);
        } catch (err) {
            console.warn("[StatusUpdate] Failed:", err?.message);
            setActionError("Status update failed. Please try again.");
        } finally {
            setStatusUpdateLoading(false);
        }
    };

    // ─── DELETE ──────────────────────────────────

    const handleDelete = async (row) => {
        try {
            await deleteOnlineSelfPaymentApi(row.p_txnId);
            syncData((d) => d.filter((r) => r.p_txnId !== row.p_txnId));
        } catch (err) {
            console.warn("[Delete] Failed:", err?.message);
            setActionError("Delete failed. Please try again.");
        } finally {
            setDeleteConfirm(null);
        }
    };

    // ─── SAVE ────────────────────────────────────

    const handleSave = async () => {
        // ADD mode: paymentFile required | EDIT mode: optional (keep existing)
        if (!form.amount || !form.paymentMode) return;
        if (modal === "add" && !form.paymentFile) return;

        setActionLoading(true);
        setActionError(null);

        try {
            if (modal === "edit") {
                // ── UPDATE flow ──────────────────────────────────────────────────
                const p_txnId = form.p_txnId;

                const updatePayload = {
                    propertyIdentifier: form.propertyIdentifier,
                    invoiceNumber: form.invoiceNumber,
                    dateOfPayment: form.dateOfPayment,
                    paymentMode: form.paymentMode,
                    transactionId: form.transactionId,
                    amount: form.amount,
                    bankName: form.bankName,
                    remarks: form.remarks,
                    // paymentStatus & societyIdentifier intentionally excluded — alag APIs se handle hote hain
                };

                // Only attach new file if user selected one; otherwise keep existing
                if (form.paymentFile && typeof form.paymentFile === "object") {
                    updatePayload.paymentFile = form.paymentFile;
                }

                // 1️⃣ Pehle payment details update karo
                await updateOnlineSelfPaymentApi(updatePayload, p_txnId);

                // Sync UI with latest values (status ab is dedicated modal se hi update hoti hai)
                syncData((d) =>
                    d.map((r) =>
                        r.p_txnId === p_txnId
                            ? {
                                ...r,
                                ...updatePayload,
                                amount: form.amount,
                                paymentFileUrl: form.paymentFile && typeof form.paymentFile === "object"
                                    ? r.paymentFileUrl
                                    : r.paymentFileUrl,
                            }
                            : r
                    )
                );

            } else {
                // ── CREATE flow ──────────────────────────────────────────────────
                const createPayload = {
                    propertyIdentifier: form.propertyIdentifier,
                    invoiceNumber: form.invoiceNumber,
                    dateOfPayment: form.dateOfPayment,
                    paymentMode: form.paymentMode,
                    transactionId: form.transactionId,
                    amount: form.amount,
                    bankName: form.bankName,
                    remarks: form.remarks,
                    paymentStatus: form.paymentStatus,
                    paymentFile: form.paymentFile,
                };
                if (form.societyIdentifier) {
                    createPayload.societyIdentifier = form.societyIdentifier;
                }

                const res = await createNewOnlineSelfPaymentApi(createPayload);
                const realId = res?.data?.data?.id || res?.data?.id || Date.now();
                const newEntry = mapOnlinePayment({
                    ...createPayload,
                    id: realId,
                    applicationIdentifier:
                        res?.data?.data?.applicationIdentifier ||
                        `OSP-${String(activeData.length + 1).padStart(7, "0")}`,
                    p_txnId: res?.data?.data?.p_txnId || res?.data?.p_txnId || "",
                    paymentStatus: form.paymentStatus || "pending",
                    createdAt: new Date().toLocaleString("en-IN"),
                }, activeData.length);
                syncData((d) => [...d, newEntry]);
            }

        } catch (err) {
            console.warn("[OnlineSelfPayment Save] Backend failed:", err?.message);
            setActionError("Backend save failed. UI updated locally.");

            // Local fallback for edit
            if (modal === "edit") {
                syncData((d) =>
                    d.map((r) =>
                        r.p_txnId === form.p_txnId ? { ...r, ...form, amount: form.amount } : r
                    )
                );
            } else {
                // Local fallback for create
                const localEntry = mapOnlinePayment({
                    propertyIdentifier: form.propertyIdentifier,
                    invoiceNumber: form.invoiceNumber,
                    dateOfPayment: form.dateOfPayment,
                    paymentMode: form.paymentMode,
                    transactionId: form.transactionId,
                    amount: form.amount,
                    bankName: form.bankName,
                    remarks: form.remarks,
                    paymentStatus: form.paymentStatus || "pending",
                    id: `local_${Date.now()}`,
                    createdAt: new Date().toLocaleString("en-IN"),
                }, activeData.length);
                syncData((d) => [...d, localEntry]);
            }
        } finally {
            setActionLoading(false);
            setModal(null);
        }
    };

    // ─── ADD / EDIT / VIEW ────────────────────────

    const openAddModal = () => {
        setForm(EMPTY_FORM);
        setSelectedInvoiceNumber("");
        fetchInvoices();
        setModal("add");
    };

    const openEditModal = (row) => {
        // Spread full row into form; p_txnId is preserved here for update API
        setForm({
            ...row,
            paymentFile: row.paymentFileUrl || null,
        });
        setSelectedInvoiceNumber(row.invoiceNumber || "");
        setModal("edit");
    };

    const openViewModal = (row) => { setViewItem(row); setModal("view"); };

    const closeModal = () => {
        setModal(null);
        setStatusModalRow(null);
    };

    // ─── RENDER ───────────────────────────────────

    return (
        <div style={{ padding: 28 }}>

            {/* Fetch error banner */}
            {fetchError && (
                <div style={{
                    background: "rgba(255,179,71,0.12)", border: "1px solid #ffb347",
                    borderRadius: 10, padding: "10px 16px", marginBottom: 16,
                    color: "#ffb347", fontSize: 13,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                    <span>⚠️ {fetchError}</span>
                    <button onClick={() => setFetchError(null)} style={{ background: "none", border: "none", color: "#ffb347", cursor: "pointer", fontSize: 16 }}>×</button>
                </div>
            )}

            {/* Loading state */}
            {fetchLoading && (
                <div style={{
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: 10, padding: "16px 20px", marginBottom: 16,
                    color: "#8899aa", fontSize: 13, textAlign: "center",
                }}>
                    Loading payments…
                </div>
            )}

            {/* Error banner */}
            {actionError && (
                <div style={{
                    background: "rgba(255,107,107,0.15)", border: "1px solid #ff6b6b",
                    borderRadius: 10, padding: "10px 16px", marginBottom: 16,
                    color: "#ff6b6b", fontSize: 13,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                    <span>⚠️ {actionError}</span>
                    <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: 16 }}>×</button>
                </div>
            )}

            {/* Page header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Online Self Payment</h2>
                    <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Manage self-paid transactions, receipts, and statuses</p>
                </div>
                <button
                    onClick={openAddModal}
                    style={{
                        display: "flex", alignItems: "center", gap: 7,
                        background: "linear-gradient(135deg,#1a2a4a,#162040)",
                        border: "1px solid rgba(108,99,255,0.3)",
                        borderRadius: 10, padding: "10px 18px",
                        color: "#e8edf5", fontWeight: 600, fontSize: 13, cursor: "pointer",
                    }}
                >
                    <Plus size={15} /> Add Payment
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                {stats.map((s, i) => (
                    <div key={i} style={{
                        background: "var(--bg-card)", border: `1px solid ${s.color}22`,
                        borderRadius: 14, padding: "16px 18px",
                        display: "flex", alignItems: "center", gap: 12,
                    }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: 9,
                            background: `${s.color}18`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <s.icon size={16} style={{ color: s.color }} />
                        </div>
                        <div>
                            <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600 }}>{s.label}</p>
                            <p style={{ color: "var(--text-primary)", fontSize: s.isCurrency ? 18 : 20, fontWeight: 700 }}>{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table card */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>

                {/* Table toolbar */}
                <div style={{
                    padding: "16px 20px", borderBottom: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6c63ff", fontWeight: 700, fontSize: 13 }}>
                        <span style={{ width: 3, height: 16, background: "#6c63ff", borderRadius: 2 }} />
                        LIST OF PAYMENTS
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        {/* Status tabs */}
                        <div style={{ display: "flex", gap: 4 }}>
                            {STATUS_TABS.map((st) => (
                                <button
                                    key={st}
                                    onClick={() => { setStatusFilter(st); setPage(1); }}
                                    style={{
                                        padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                                        border: statusFilter === st ? "1px solid #6c63ff" : "1px solid rgba(255,255,255,0.08)",
                                        background: statusFilter === st ? "rgba(108,99,255,0.15)" : "transparent",
                                        color: statusFilter === st ? "#6c63ff" : "#8899aa",
                                        transition: "all 0.15s", textTransform: "capitalize",
                                    }}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div style={{ position: "relative" }}>
                            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }} />
                            <input
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Filter Table"
                                style={{
                                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 8, padding: "8px 12px 8px 32px",
                                    color: "var(--text-primary)", fontSize: 13, outline: "none", width: 200,
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                {["S.No", "Payment ID", "Invoice No.", "Property", "Mode", "Amount", "Transaction ID", "Date of Payment", "Status", "Action"].map((h) => (
                                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 ? (
                                <tr>
                                    <td colSpan={10} style={{ padding: "40px 14px", textAlign: "center", color: "#556677", fontSize: 13 }}>
                                        No payments found
                                    </td>
                                </tr>
                            ) : (
                                paged.map((row, i) => (
                                    <tr
                                        key={row.id}
                                        style={{ borderBottom: "1px solid var(--border)" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                        <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{(page - 1) * PER_PAGE + i + 1}</td>
                                        <td style={{ padding: "12px 14px", color: "#6c63ff", fontWeight: 600, fontSize: 12 }}>{row.applicationIdentifier}</td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <span style={{
                                                background: "rgba(0,180,216,0.12)", color: "#00b4d8",
                                                padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                                            }}>
                                                {row.invoiceNumber || "—"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontSize: 13 }}>
                                            <div>{row.propertyIdentifier || "—"}</div>
                                            {row.societyIdentifier && (
                                                <div style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>{row.societyIdentifier}</div>
                                            )}
                                        </td>
                                        <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontSize: 12 }}>{row.paymentMode || "—"}</td>
                                        <td style={{ padding: "12px 14px", color: "#00d4aa", fontWeight: 700, fontSize: 12 }}>
                                            {formatCurrency(row.amount)}
                                        </td>
                                        <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12, whiteSpace: "nowrap" }}>{row.transactionId || "—"}</td>
                                        <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12, whiteSpace: "nowrap" }}>{row.dateOfPayment || "—"}</td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <StatusBadge status={row.paymentStatus} />
                                        </td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                                                <button onClick={() => openViewModal(row)} style={{ background: "rgba(0,180,216,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#00b4d8", cursor: "pointer" }} title="View"><Eye size={12} /></button>
                                                <button onClick={() => openEditModal(row)} style={{ background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#6c63ff", cursor: "pointer" }} title="Edit"><Edit2 size={12} /></button>
                                                <button onClick={() => setDeleteConfirm(row)} style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#ff6b6b", cursor: "pointer" }} title="Delete"><Trash2 size={12} /></button>
                                                <button onClick={() => openStatusModal(row)} style={{ background: "rgba(0,212,170,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#00d4aa", cursor: "pointer" }} title="Update Status"><CheckCircle2 size={12} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
            </div>


            {/* ══════════════════════════════════════
          DELETE CONFIRM MODAL
      ══════════════════════════════════════ */}
            {deleteConfirm && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 1100,
                    background: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
                }}>
                    <div style={{
                        background: "#161c27",
                        border: "1px solid rgba(255,107,107,0.2)",
                        borderRadius: 16, width: "100%", maxWidth: 400,
                        padding: 28,
                        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 12,
                                background: "rgba(255,107,107,0.12)",
                                border: "1px solid rgba(255,107,107,0.25)",
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                                <Trash2 size={20} color="#ff6b6b" />
                            </div>
                            <div>
                                <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>Delete Payment?</h3>
                                <p style={{ color: "#6b7a90", fontSize: 12, margin: "4px 0 0" }}>Yeh action undo nahi ho sakti</p>
                            </div>
                        </div>

                        <div style={{
                            background: "rgba(255,107,107,0.06)",
                            border: "1px solid rgba(255,107,107,0.12)",
                            borderRadius: 9, padding: "10px 14px", marginBottom: 20,
                        }}>
                            <p style={{ color: "#8899aa", fontSize: 12, margin: 0 }}>
                                Payment ID: <span style={{ color: "#ff6b6b", fontWeight: 600 }}>{deleteConfirm.applicationIdentifier}</span>
                            </p>
                            <p style={{ color: "#8899aa", fontSize: 12, margin: "4px 0 0" }}>
                                Amount: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{formatCurrency(deleteConfirm.amount)}</span>
                            </p>
                        </div>

                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 9, padding: "9px 18px",
                                    color: "#8899aa", fontSize: 13, fontWeight: 500, cursor: "pointer",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                style={{
                                    background: "linear-gradient(135deg, #ff6b6b, #ff4444)",
                                    border: "none", borderRadius: 9, padding: "9px 22px",
                                    color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                                    display: "flex", alignItems: "center", gap: 7,
                                }}
                            >
                                <Trash2 size={13} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
          ADD / EDIT MODAL
      ══════════════════════════════════════ */}
            {(modal === "add" || modal === "edit") && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 1000,
                    background: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
                }}>
                    <div style={{
                        background: "#161c27",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 20, width: "100%", maxWidth: 560,
                        maxHeight: "90vh", overflow: "hidden",
                        display: "flex", flexDirection: "column",
                        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
                    }}>

                        {/* Header */}
                        <div style={{
                            padding: "20px 24px 18px",
                            borderBottom: "1px solid rgba(255,255,255,0.07)",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            background: "linear-gradient(180deg, rgba(108,99,255,0.07) 0%, transparent 100%)",
                            flexShrink: 0,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 11,
                                    background: "rgba(108,99,255,0.15)",
                                    border: "1px solid rgba(108,99,255,0.25)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <Wallet size={18} color="#6c63ff" />
                                </div>
                                <div>
                                    <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>
                                        {modal === "edit" ? "Edit Payment" : "Add New Payment"}
                                    </h3>
                                    <p style={{ color: "#6b7a90", fontSize: 12, margin: "2px 0 0" }}>
                                        {modal === "edit" ? "Update payment details" : "Record a new self payment entry"}
                                    </p>
                                </div>
                            </div>
                            <button onClick={closeModal} style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.09)",
                                color: "#6b7a90", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <X size={15} />
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div style={{ padding: "4px 24px 8px", overflowY: "auto", flex: 1 }}>

                            <SectionLabel>Invoice</SectionLabel>

                            {modal === "add" ? (
                                /* ADD: invoice dropdown with auto-fill */
                                <div style={fieldWrapper}>
                                    <label style={labelStyle}>Select Invoice</label>
                                    <select
                                        value={selectedInvoiceNumber}
                                        onChange={(e) => handleInvoiceSelect(e.target.value)}
                                        style={{ ...inputStyle, cursor: "pointer" }}
                                    >
                                        <option value="">{invoiceLoading ? "Loading invoices…" : "-- Select Invoice --"}</option>
                                        {invoices.map((inv) => (
                                            <option key={inv.id} value={inv.invoiceNumber}>
                                                {inv.invoiceNumber} — {inv.propertyName} {inv.amount ? `(₹${inv.amount})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                /* EDIT: show invoice number as read-only badge */
                                <div style={{
                                    background: "rgba(108,99,255,0.06)",
                                    border: "1px solid rgba(108,99,255,0.12)",
                                    borderRadius: 9, padding: "10px 14px", marginBottom: 13,
                                    display: "flex", alignItems: "center", gap: 10,
                                }}>
                                    <FileText size={14} color="#6c63ff" />
                                    <span style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 600 }}>
                                        {form.invoiceNumber || "—"}
                                    </span>
                                </div>
                            )}

                            {/* Property & Society — display naam dikhao, payload me identifier jata hai */}
                            <div style={modal === "add" ? grid2 : {}}>
                                <div style={fieldWrapper}>
                                    <label style={labelStyle}>Property</label>
                                    <input
                                        type="text"
                                        value={form.propertyName || form.propertyIdentifier || ""}
                                        readOnly
                                        style={{ ...inputStyle, cursor: "not-allowed", opacity: 0.7 }}
                                        title={form.propertyIdentifier}
                                    />
                                    {form.propertyIdentifier && (
                                        <p style={{ color: "#556677", fontSize: 11, marginTop: 4 }}>
                                            ID: {form.propertyIdentifier}
                                        </p>
                                    )}
                                </div>
                                {modal === "add" && (
                                    <div style={fieldWrapper}>
                                        <label style={labelStyle}>Society <span style={{ color: "#556677", fontWeight: 400 }}>(optional)</span></label>
                                        <input
                                            type="text"
                                            value={form.societyName || form.societyIdentifier || ""}
                                            readOnly
                                            style={{ ...inputStyle, cursor: "not-allowed", opacity: 0.7 }}
                                            title={form.societyIdentifier}
                                        />
                                        {form.societyIdentifier && (
                                            <p style={{ color: "#556677", fontSize: 11, marginTop: 4 }}>
                                                ID: {form.societyIdentifier}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <SectionLabel>Payment Info</SectionLabel>
                            <div style={grid2}>
                                <FormSelect label="Payment Mode" field="paymentMode" options={PAYMENT_MODES} form={form} setForm={setForm} />
                                <FormInput label="Amount (₹)" field="amount" type="number" form={form} setForm={setForm} />
                            </div>
                            <div style={grid2}>
                                <FormInput label="Date of Payment" field="dateOfPayment" type="date" form={form} setForm={setForm} />
                                <FormInput label="Transaction ID" field="transactionId" form={form} setForm={setForm} optional />
                            </div>
                            <div style={{ width: "50%" }}>
                                <FormInput label="Bank Name" field="bankName" form={form} setForm={setForm} optional />
                            </div>

                            <SectionLabel>Status & Proof</SectionLabel>
                            <div style={grid2}>
                                <FormSelect label="Payment Status" field="paymentStatus" options={PAYMENT_STATUSES} form={form} setForm={setForm} />
                                <div />
                            </div>

                            {/* File: required on ADD, optional on EDIT */}
                            <FormFile
                                label={modal === "edit" ? "Payment File (optional — replaces existing)" : "Payment File (QR / Screenshot)"}
                                field="paymentFile"
                                form={form}
                                setForm={setForm}
                                required={modal === "add"}
                            />

                            <div style={fieldWrapper}>
                                <label style={labelStyle}>Remarks <span style={{ color: "#556677", fontWeight: 400 }}>(optional)</span></label>
                                <textarea
                                    value={form.remarks || ""}
                                    onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                                    rows={2}
                                    style={{ ...inputStyle, resize: "vertical" }}
                                />
                            </div>

                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: "14px 24px 18px",
                            borderTop: "1px solid rgba(255,255,255,0.07)",
                            display: "flex", justifyContent: "flex-end", gap: 10,
                            flexShrink: 0,
                            background: "rgba(0,0,0,0.15)",
                        }}>
                            <button onClick={closeModal} style={{
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 9, padding: "9px 18px",
                                color: "#8899aa", fontSize: 13, fontWeight: 500, cursor: "pointer",
                            }}>
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={actionLoading} style={{
                                background: "linear-gradient(135deg, #6c63ff 0%, #00b4d8 100%)",
                                border: "none", borderRadius: 9, padding: "9px 22px",
                                color: "#fff", fontSize: 13, fontWeight: 700,
                                cursor: actionLoading ? "not-allowed" : "pointer",
                                opacity: actionLoading ? 0.7 : 1,
                                display: "flex", alignItems: "center", gap: 7,
                            }}>
                                <CheckCircle2 size={14} />
                                {actionLoading ? "Saving…" : modal === "edit" ? "Update Payment" : "Save Payment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* ══════════════════════════════════════
          UPDATE STATUS MODAL (mark as Success)
      ══════════════════════════════════════ */}
            {modal === "status" && statusModalRow && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 1000,
                    background: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
                }}>
                    <div style={{
                        background: "#161c27",
                        border: "1px solid rgba(0,212,170,0.2)",
                        borderRadius: 20, width: "100%", maxWidth: 420,
                        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
                    }}>

                        {/* Header */}
                        <div style={{
                            padding: "20px 24px 18px",
                            borderBottom: "1px solid rgba(255,255,255,0.07)",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            background: "linear-gradient(180deg, rgba(0,212,170,0.08) 0%, transparent 100%)",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 11,
                                    background: "rgba(0,212,170,0.15)",
                                    border: "1px solid rgba(0,212,170,0.25)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <CheckCircle2 size={18} color="#00d4aa" />
                                </div>
                                <div>
                                    <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>Update Status</h3>
                                    <p style={{ color: "#6b7a90", fontSize: 12, margin: "2px 0 0" }}>{statusModalRow.applicationIdentifier}</p>
                                </div>
                            </div>
                            <button onClick={closeModal} style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.09)",
                                color: "#6b7a90", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <X size={15} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: "20px 24px 8px" }}>

                            <div style={fieldWrapper}>
                                <label style={labelStyle}>Transaction ID</label>
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: 9, padding: "9px 12px",
                                }}>
                                    <CreditCard size={14} color="#6b7a90" />
                                    <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>
                                        {statusModalRow.p_txnId || "—"}
                                    </span>
                                </div>
                            </div>

                            <div style={fieldWrapper}>
                                <label style={labelStyle}>Clearance Date</label>
                                <input
                                    type="date"
                                    value={clearanceDate}
                                    onChange={(e) => setClearanceDate(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <div style={fieldWrapper}>
                                <label style={labelStyle}>Payment Status</label>
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    background: "rgba(0,212,170,0.08)",
                                    border: "1px solid rgba(0,212,170,0.2)",
                                    borderRadius: 9, padding: "9px 12px",
                                }}>
                                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00d4aa" }} />
                                    <span style={{ color: "#00d4aa", fontSize: 13, fontWeight: 700 }}>Success</span>
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: "14px 24px 18px",
                            borderTop: "1px solid rgba(255,255,255,0.07)",
                            display: "flex", justifyContent: "flex-end", gap: 10,
                            background: "rgba(0,0,0,0.15)",
                        }}>
                            <button onClick={closeModal} style={{
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 9, padding: "9px 18px",
                                color: "#8899aa", fontSize: 13, fontWeight: 500, cursor: "pointer",
                            }}>
                                Cancel
                            </button>
                            <button
                                onClick={handleStatusUpdateConfirm}
                                disabled={statusUpdateLoading || !clearanceDate}
                                style={{
                                    background: "linear-gradient(135deg, #00d4aa 0%, #00b4d8 100%)",
                                    border: "none", borderRadius: 9, padding: "9px 22px",
                                    color: "#062b24", fontSize: 13, fontWeight: 700,
                                    cursor: statusUpdateLoading || !clearanceDate ? "not-allowed" : "pointer",
                                    opacity: statusUpdateLoading || !clearanceDate ? 0.6 : 1,
                                    display: "flex", alignItems: "center", gap: 7,
                                }}
                            >
                                <CheckCircle2 size={14} />
                                {statusUpdateLoading ? "Updating…" : "Confirm Success"}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* ══════════════════════════════════════
          VIEW MODAL
      ══════════════════════════════════════ */}
            {modal === "view" && viewItem && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 1000,
                    background: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
                }}>
                    <div style={{
                        background: "#161c27",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 20, width: "100%", maxWidth: 480,
                        maxHeight: "88vh", overflow: "hidden",
                        display: "flex", flexDirection: "column",
                        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
                    }}>

                        {/* Header */}
                        <div style={{
                            padding: "20px 24px 18px",
                            borderBottom: "1px solid rgba(255,255,255,0.07)",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            background: "linear-gradient(180deg, rgba(108,99,255,0.07) 0%, transparent 100%)",
                            flexShrink: 0,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 11,
                                    background: "rgba(108,99,255,0.15)",
                                    border: "1px solid rgba(108,99,255,0.25)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <Receipt size={18} color="#6c63ff" />
                                </div>
                                <div>
                                    <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>Payment Details</h3>
                                    <p style={{ color: "#6b7a90", fontSize: 12, margin: "2px 0 0" }}>Read-only overview</p>
                                </div>
                            </div>
                            <button onClick={closeModal} style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.09)",
                                color: "#6b7a90", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <X size={15} />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>

                            {/* Payment ID + Status hero */}
                            <div style={{
                                background: "rgba(108,99,255,0.08)",
                                border: "1px solid rgba(108,99,255,0.15)",
                                borderRadius: 12, padding: 16, marginBottom: 16,
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                            }}>
                                <div>
                                    <p style={{ color: "#6c63ff", fontWeight: 700, fontSize: 13 }}>{viewItem.applicationIdentifier}</p>
                                    <p style={{ color: "var(--text-primary)", fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                                        {viewItem.invoiceNumber || "—"}
                                    </p>
                                </div>
                                <StatusBadge status={viewItem.paymentStatus} />
                            </div>

                            {/* Amount / Mode */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                                <div style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.12)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                                    <p style={{ color: "#8899aa", fontSize: 11 }}>Amount</p>
                                    <p style={{ color: "#00d4aa", fontWeight: 700, fontSize: 13, marginTop: 4 }}>{formatCurrency(viewItem.amount)}</p>
                                </div>
                                <div style={{ background: "rgba(0,180,216,0.06)", border: "1px solid rgba(0,180,216,0.12)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                                    <p style={{ color: "#8899aa", fontSize: 11 }}>Mode</p>
                                    <p style={{ color: "#00b4d8", fontWeight: 700, fontSize: 13, marginTop: 4 }}>{viewItem.paymentMode || "—"}</p>
                                </div>
                            </div>

                            {/* Transaction badge */}
                            {viewItem.transactionId && (
                                <div style={{
                                    background: "rgba(108,99,255,0.06)",
                                    border: "1px solid rgba(108,99,255,0.12)",
                                    borderRadius: 10, padding: "10px 14px", marginBottom: 16,
                                    display: "flex", alignItems: "center", gap: 10,
                                }}>
                                    <CreditCard size={16} color="#6c63ff" />
                                    <div>
                                        <span style={{ color: "#6b7a90", fontSize: 11 }}>Transaction ID: </span>
                                        <span style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 600 }}>{viewItem.transactionId}</span>
                                    </div>
                                </div>
                            )}

                            {/* Detail rows */}
                            {[
                                ["Property Identifier", viewItem.propertyIdentifier],
                                ["Society Identifier", viewItem.societyIdentifier],
                                ["Bank Name", viewItem.bankName],
                                ["Date of Payment", viewItem.dateOfPayment],
                                ["Clearance Date", viewItem.clearanceDate],
                                ["Remarks", viewItem.remarks],
                                ["Payment File", viewItem.paymentFileUrl],
                                ["p_txnId", viewItem.p_txnId],
                                ["Created By", viewItem.createdBy],
                                ["Created At", viewItem.createdAt],
                            ].filter(([, v]) => v).map(([label, value]) => (
                                <div key={label} style={{
                                    display: "flex", justifyContent: "space-between",
                                    padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
                                }}>
                                    <span style={{ color: "#6b7a90", fontSize: 13 }}>{label}</span>
                                    <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}