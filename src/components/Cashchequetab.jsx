import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAppContext } from "../AppContext";
import { getAllPaymentLogsApi, createCashPaymentApi, createChequePaymentApi } from "api/cash&check-api";
import { getAllPropertyApi } from "../api/property-api";

import {
    Search, Plus, Eye, Edit2, Trash2, Check, RefreshCw,
    DollarSign, CreditCard, Landmark, AlertTriangle, AlertCircle,
    ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, X, Banknote,
} from "lucide-react";

import { getAllInvoicesApi } from "api/account-api";
// ✂ REMOVED: getAllSocietyApi — unused in this component



// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtFull = n => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtNum = n => Number(n).toLocaleString("en-IN");


// ─── STATUS COLOUR MAP ────────────────────────────────────────────────────────
const SC = { Deposited: "#00d4aa", Cleared: "#00b4d8", Pending: "#ffb347", Bounced: "#ff6b6b" };

// ─── MAP raw API log → table row ──────────────────────────────────────────────
const mapLog = (r, i) => ({
    _rawId: r.txnId,
    _key: `api-${r.txnId || i}`,
    id: r.txnId || `TXN-${i}`,
    type: /cheque|check/i.test(r.paymentMethod || "") ? "Cheque" : "Cash",
    invoiceRef: r.invoiceNumber || "",
    amount: Number(r.amount || 0),
    receivedBy: r.userIdentifier || "",
    date: r.createdAt ? r.createdAt.split(",")[0] : "",
    status: r.paymentStatus || "Pending",
    bank: r.cheque?.bankName || "",
    chequeNo: r.cheque?.chequeNumber || "",
    chequeStatus: r.cheque?.chequeStatus || "",
    property: r.property?.propertyIdentifier || "",
    propertyName: r.property?.propertyName || "",
    description: r.property?.propertyName || r.invoiceNumber || "",
});

// ─── Cash denomination notes ──────────────────────────────────────────────────
const DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

// ═════════════════════════════════════════════════════════════════════════════
// Reusable UI
// ═════════════════════════════════════════════════════════════════════════════
const StatKPI = ({ label, value, sub, color = "#00d4aa", icon: Icon, trend, up }) => (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -12, right: -12, width: 64, height: 64, borderRadius: "50%", background: `${color}10` }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase" }}>{label}</div>
            {Icon && <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={14} color={color} /></div>}
        </div>
        <div style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 6 }}>{value}</div>
        {sub && <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 4 }}>{sub}</div>}
        {trend !== undefined && (
            <div style={{ color: up ? "#00d4aa" : "#ff6b6b", fontSize: 11, fontWeight: 600 }}>
                {up ? "▲" : "▼"} {Math.abs(trend)}% vs last month
            </div>
        )}
    </div>
);

const Card = ({ children, style = {} }) => (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, ...style }}>{children}</div>
);

const TH = ({ children, align = "left" }) => (
    <th style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: 10, fontWeight: 700, textAlign: align, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", borderBottom: "1px solid var(--border)" }}>{children}</th>
);
const TD = ({ children, style = {} }) => (
    <td style={{ padding: "11px 12px", borderBottom: "1px solid var(--border)", ...style }}>{children}</td>
);

const TableBtn = ({ icon: Icon, color, onClick, title }) => (
    <button title={title} onClick={onClick}
        style={{ background: `${color}15`, border: "none", borderRadius: 6, padding: "4px 8px", color, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        onMouseEnter={e => e.currentTarget.style.background = `${color}30`}
        onMouseLeave={e => e.currentTarget.style.background = `${color}15`}>
        <Icon size={12} />
    </button>
);

const BtnPrimary = ({ children, onClick, color = "teal", style = {} }) => {
    const bg = color === "red"
        ? "linear-gradient(135deg,#ff6b6b,#ff8c00)"
        : "linear-gradient(135deg,var(--accent-teal),var(--accent-blue))";
    return (
        <button onClick={onClick} style={{ background: bg, border: "none", borderRadius: 9, padding: "9px 20px", color: "#000", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", ...style }}>
            {children}
        </button>
    );
};
const BtnGhost = ({ children, onClick, style = {} }) => (
    <button onClick={onClick} style={{ padding: "9px 20px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 9, color: "var(--text-secondary)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, ...style }}>
        {children}
    </button>
);

const Modal = ({ open, onClose, title, width = 520, children }) => {
    if (!open) return null;
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, backdropFilter: "blur(4px)" }} onClick={onClose}>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 18, width, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                    <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 4 }}><X size={18} /></button>
                </div>
                <div style={{ padding: "20px 24px" }}>{children}</div>
            </div>
        </div>
    );
};

const FI = ({ label, field, type = "text", form, setForm, disabled, fullWidth, placeholder }) => (
    <div style={{ marginBottom: 14, gridColumn: fullWidth ? "1/-1" : undefined }}>
        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</label>
        <input type={type} value={form[field] || ""} disabled={disabled} placeholder={placeholder}
            onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            style={{ width: "100%", background: disabled ? "var(--bg-card)" : "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 9, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box", opacity: disabled ? 0.6 : 1 }} />
    </div>
);

const Pagination = ({ page, total, perPage, onChange }) => {
    const pages = Math.max(1, Math.ceil(total / perPage));
    const vis = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) vis.push(i);
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid var(--border)", marginTop: 8 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {fmtNum(total)}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => onChange(1)} disabled={page === 1} style={pgBtn(page === 1)}><ChevronsLeft size={12} /></button>
                <button onClick={() => onChange(page - 1)} disabled={page === 1} style={pgBtn(page === 1)}><ChevronLeft size={12} /></button>
                {vis.map(p => (
                    <button key={p} onClick={() => onChange(p)} style={{ ...pgBtn(false), background: p === page ? "var(--accent-teal)" : "none", borderColor: p === page ? "var(--accent-teal)" : "var(--border)", color: p === page ? "#000" : "var(--text-secondary)", fontWeight: p === page ? 700 : 400, minWidth: 30 }}>{p}</button>
                ))}
                <button onClick={() => onChange(page + 1)} disabled={page === pages} style={pgBtn(page === pages)}><ChevronRight size={12} /></button>
                <button onClick={() => onChange(pages)} disabled={page === pages} style={pgBtn(page === pages)}><ChevronsRight size={12} /></button>
            </div>
        </div>
    );
};
const pgBtn = disabled => ({ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: disabled ? "var(--text-muted)" : "var(--text-secondary)", cursor: disabled ? "not-allowed" : "pointer" });

const ErrorBox = ({ msg }) => (
    <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "10px 14px", margin: "14px 0 0", color: "#ff6b6b", fontSize: 12 }}>
        <AlertCircle size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />{msg}
    </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════
export default function CashChequeTab() {
    const { selectedSociety } = useAppContext();
    // ✂ REMOVED: invoices: ctxInvoices — invoices are now fetched per-society below

    const sid = selectedSociety?.societyIdentifier || selectedSociety?.identifier || "";

    // ── data state ────────────────────────────────────────────────────────────
    const [logs, setLogs] = useState([]);
    const [selectedPropertyName, setSelectedPropertyName] = useState("");
    const [properties, setProperties] = useState([]);
    const [invoices, setInvoices] = useState([]);           // ← NEW: per-society invoices
    const [logsLoading, setLogsLoading] = useState(false);
    const [propsLoading, setPropsLoading] = useState(false);
    const [invLoading, setInvLoading] = useState(false);    // ← NEW
    const [logsError, setLogsError] = useState("");
    const [localData, setLocalData] = useState([]);

    // ── fetch logs ────────────────────────────────────────────────────────────
    const fetchLogs = useCallback(async () => {
        if (!sid) return;
        setLogsLoading(true); setLogsError("");
        try {
            const res = await getAllPaymentLogsApi(sid);
            const raw = res?.data?.data ?? res?.data ?? [];
            setLogs(Array.isArray(raw) ? raw.map(mapLog) : []);
        } catch (err) {
            setLogsError("Failed to load payment logs.");
            setLogs([]);
        } finally { setLogsLoading(false); }
    }, [sid]);

    // ── fetch properties (for modal dropdown only) ────────────────────────────
    // FIX: getAllPropertyApi signature is (wingIdentifier, societyIdentifier).
    // Previously { societyIdentifier: sid } was passed as wingIdentifier (1st arg)
    // so societyIdentifier never reached the API → "No properties" in dropdown.
    // Now: pass null for wingIdentifier, sid for societyIdentifier.
    const fetchProperties = useCallback(async () => {
        if (!sid) return;
        setPropsLoading(true);
        try {
            const res = await getAllPropertyApi(null, sid);
            const raw = res?.data?.data ?? res?.data ?? [];
            setProperties(Array.isArray(raw) ? raw : []);
        } catch { setProperties([]); }
        finally { setPropsLoading(false); }
    }, [sid]);

    // ── fetch invoices filtered by society ────────────────────────────────────
    // getAllInvoicesApi signature: (filters={}, societyIdentifier)
    // → POST /payment/invoice/all?society_identifier=<sid>
    const fetchInvoices = useCallback(async () => {
        if (!sid) return;
        setInvLoading(true);
        try {
            const res = await getAllInvoicesApi({}, sid);
            // API may return { data: { data: [...] } } or { data: [...] }
            const raw = res?.data?.data ?? res?.data ?? [];
            setInvoices(Array.isArray(raw) ? raw : []);
        } catch (err) {
            console.error("fetchInvoices failed:", err);
            setInvoices([]);
        } finally {
            setInvLoading(false);
        }
    }, [sid]);

    useEffect(() => {
        fetchLogs();
        fetchProperties();
        fetchInvoices(); // ← NEW: re-fetch whenever selected society changes
    }, [fetchLogs, fetchProperties, fetchInvoices]);

    // ── filters / pagination ──────────────────────────────────────────────────
    const [modeFilter, setModeFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [dateFilter, setDateFilter] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const PER = 10;

    const data = useMemo(() => [
        ...logs,
        ...localData.map((r, i) => ({ ...r, _key: `local-${i}` })),
    ], [logs, localData]);

    const toYMD = (val) => {
        if (!val) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
        const clean = val.split(" ")[0].split("T")[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
        const d = new Date(val);
        if (isNaN(d.getTime())) return null;
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
    };

    const filtered = useMemo(() => data.filter(r => {
        if (modeFilter !== "All" && r.type !== modeFilter) return false;
        if (statusFilter !== "All" && r.status !== statusFilter) return false;
        if (dateFilter) {
            const refYMD = toYMD(r.date);
            if (!refYMD || refYMD !== dateFilter) return false;
        }
        if (search) {
            const q = search.toLowerCase();
            if (
                !(r.description || "").toLowerCase().includes(q) &&
                !(r.id || "").toLowerCase().includes(q) &&
                !(r.invoiceRef || "").toLowerCase().includes(q) &&
                !(r.propertyName || "").toLowerCase().includes(q)
            ) return false;
        }
        return true;
    }), [data, modeFilter, statusFilter, dateFilter, search]);

    const paged = filtered.slice((page - 1) * PER, page * PER);

    // ── KPI totals ────────────────────────────────────────────────────────────
    const totalCash = data.filter(r => r.type === "Cash").reduce((s, r) => s + r.amount, 0);
    const totalCheque = data.filter(r => r.type === "Cheque").reduce((s, r) => s + r.amount, 0);
    const deposited = data.filter(r => ["Deposited", "Cleared"].includes(r.status)).reduce((s, r) => s + r.amount, 0);
    const bounced = data.filter(r => r.status === "Bounced").length;

    // ── UPDATE CHEQUE STATUS ──────────────────────────────────────────────────
    const [statusTarget, setStatusTarget] = useState(null);
    const [newStatus, setNewStatus] = useState("");
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusError, setStatusError] = useState("");

    const handleUpdateStatus = useCallback(async () => {
        if (!statusTarget || !newStatus) return;
        setStatusLoading(true); setStatusError("");
        try {
            await updateChequeStatusApi({
                societyIdentifier: sid,
                chequeId: statusTarget._rawId,
                id: statusTarget._rawId,
                chequeStatus: newStatus,
                status: newStatus,
            });
            setLogs(prev => prev.map(r =>
                r._rawId === statusTarget._rawId ? { ...r, status: newStatus } : r
            ));
            setStatusTarget(null);
            fetchLogs();
        } catch (err) {
            const msg = err?.response?.data?.message;
            setStatusError(Array.isArray(msg) ? msg.join(", ") : msg || err?.message || "Failed to update status.");
        } finally { setStatusLoading(false); }
    }, [statusTarget, newStatus, sid, fetchLogs]);

    // ── DELETE ────────────────────────────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const handleDelete = useCallback(async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true); setDeleteError("");
        try {
            if (deleteTarget.type === "Cheque") await deleteChequeLogApi(deleteTarget._rawId);
            else await deleteCashLogApi(deleteTarget._rawId);
            setLogs(prev => prev.filter(r => r._rawId !== deleteTarget._rawId));
            setLocalData(d => d.filter(x => x._key !== deleteTarget._key));
            setDeleteTarget(null);
        } catch (err) {
            const msg = err?.response?.data?.message;
            setDeleteError(Array.isArray(msg) ? msg.join(", ") : msg || err?.message || "Failed to delete.");
        } finally { setDeleteLoading(false); }
    }, [deleteTarget]);

    // ── ADD ENTRY ─────────────────────────────────────────────────────────────
    const EMPTY_FORM = {
        mode: "Cash",
        invoiceNumber: "", propertyIdentifier: "", amountInFigures: "",
        mobile: "", receiptDate: "",
        bankName: "", branchName: "", chequeNumber: "", chequeDate: "",
        chequeReceivedDate: "", amountInWords: "",
    };

    const EMPTY_DENOM = DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d]: "" }), {});

    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [denomMap, setDenomMap] = useState(EMPTY_DENOM);
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState("");

    // invoice & property search inside modal
    const [invSearch, setInvSearch] = useState("");
    const [propSearch, setPropSearch] = useState("");
    const [invOpen, setInvOpen] = useState(false);
    const [propOpen, setPropOpen] = useState(false);

    // ── Invoice dropdown options ───────────────────────────────────────────────
    // FIX: source changed from ctxInvoices → invoices (fetched per-society above).
    // This ensures only invoices belonging to the selected society appear.
    // const invOptions = useMemo(() =>
    //     invoices
    //         .filter(inv => inv.status !== "Paid")
    //         .filter(inv => {
    //             const q = invSearch.toLowerCase();
    //             return !q ||
    //                 (inv.invId || "").toLowerCase().includes(q) ||
    //                 (inv.flatNo || "").toLowerCase().includes(q) ||
    //                 (inv.ownerName || "").toLowerCase().includes(q);
    //         })
    //         .slice(0, 50),
    //     [invoices, invSearch]); // ← was [ctxInvoices, invSearch]

    const invOptions = useMemo(() =>
        invoices
            .filter(inv => inv.status !== "Paid")
            .filter(inv => {
                const q = invSearch.toLowerCase();

                return !q ||
                    (inv.invoiceNumber || "").toLowerCase().includes(q) ||
                    (inv.propertyIdentifier || "").toLowerCase().includes(q);
            })
            .slice(0, 50),
        [invoices, invSearch]);

    const propOptions = useMemo(() =>
        properties
            .filter(p => {
                const q = propSearch.toLowerCase();
                return !q ||
                    (p.propertyIdentifier || "").toLowerCase().includes(q) ||
                    (p.propertyName || "").toLowerCase().includes(q) ||
                    (p.flatNumber || "").toLowerCase().includes(q);
            })
            .slice(0, 50),
        [properties, propSearch]);

    const isCheque = form.mode === "Cheque";

    const denomTotal = useMemo(() =>
        DENOMINATIONS.reduce((sum, d) => sum + (Number(denomMap[d] || 0) * d), 0),
        [denomMap]);

    const openAddModal = () => {
        setShowAdd(true);
        setAddError("");
        setForm(EMPTY_FORM);
        setDenomMap(EMPTY_DENOM);
        setInvSearch(""); setPropSearch("");
    };

    const closeAddModal = () => {
        if (!addLoading) {
            setShowAdd(false);
            setAddError("");
            setInvSearch(""); setPropSearch("");
        }
    };

    const handleAddEntry = useCallback(async () => {
        if (!form.invoiceNumber) { setAddError("Invoice Number is required."); return; }
        if (!form.propertyIdentifier) { setAddError("Property is required."); return; }
        if (!form.amountInFigures) { setAddError("Amount is required."); return; }
        if (!form.mobile) { setAddError("Mobile number is required."); return; }
        if (!form.receiptDate) { setAddError("Receipt Date is required."); return; }

        setAddLoading(true); setAddError("");
        try {
            const iso = d => d ? new Date(d).toISOString().split("T")[0] : undefined;

            if (isCheque) {
                const payload = {
                    invoiceNumber: form.invoiceNumber.trim(),
                    propertyIdentifier: form.propertyIdentifier.trim(),
                    amountInFigures: String(Number(form.amountInFigures)),
                    mobile: form.mobile.trim(),
                    receiptDate: iso(form.receiptDate),
                    ...(form.bankName ? { bankName: form.bankName } : {}),
                    ...(form.branchName ? { branchName: form.branchName } : {}),
                    ...(form.chequeNumber ? { chequeNumber: form.chequeNumber } : {}),
                    ...(form.amountInWords ? { amountInWords: form.amountInWords } : {}),
                    ...(iso(form.chequeDate) ? { chequeDate: iso(form.chequeDate) } : {}),
                };
                await createChequePaymentApi(payload);
            } else {
                const notesDetails = DENOMINATIONS.reduce((acc, d) => {
                    const count = Number(denomMap[d] || 0);
                    if (count > 0) acc[String(d)] = count;
                    return acc;
                }, {});

                const payload = {
                    invoiceNumber: form.invoiceNumber.trim(),
                    propertyIdentifier: form.propertyIdentifier.trim(),
                    amountInFigures: String(Number(form.amountInFigures)),
                    mobile: form.mobile.trim(),
                    receiptDate: iso(form.receiptDate),
                    ...(Object.keys(notesDetails).length > 0 ? { notesDetails } : {}),
                };
                await createCashPaymentApi(payload);
            }

            setLocalData(d => [...d, {
                id: `TXN-NEW-${Date.now()}`,
                _rawId: null,
                type: form.mode,
                invoiceRef: form.invoiceNumber,
                description: form.propertyIdentifier,
                amount: Number(form.amountInFigures),
                receivedBy: "",
                date: form.receiptDate,
                bank: form.bankName,
                chequeNo: form.chequeNumber,
                status: "Pending",
                property: form.propertyIdentifier,
                propertyName: form.propertyIdentifier,
                _local: true,
            }]);

            closeAddModal();
            fetchLogs();
        } catch (err) {
            const msg = err?.response?.data?.message;
            setAddError(Array.isArray(msg) ? msg.join(", ") : msg || err?.message || "Failed to log entry.");
        } finally { setAddLoading(false); }
    }, [form, denomMap, isCheque, fetchLogs]);

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div>
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
                <StatKPI label="Cash Received" value={fmtFull(totalCash)} sub={`${data.filter(r => r.type === "Cash").length} entries`} color="#ff6b6b" icon={DollarSign} trend={3.2} up />
                <StatKPI label="Cheques Logged" value={fmtFull(totalCheque)} sub={`${data.filter(r => r.type === "Cheque").length} cheques`} color="#6c63ff" icon={CreditCard} trend={8.4} up />
                <StatKPI label="Deposited" value={fmtFull(deposited)} sub="In bank" color="#00d4aa" icon={Landmark} trend={5.6} up />
                <StatKPI label="Bounced Cheques" value={String(bounced)} sub="Needs action" color="#ffb347" icon={AlertTriangle} trend={bounced > 0 ? 100 : 0} up={false} />
            </div>

            {/* Table card */}
            <Card>
                {/* Filter bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        {["All", "Cash", "Cheque"].map(f => (
                            <button key={f} onClick={() => { setModeFilter(f); setPage(1); }}
                                style={{ background: modeFilter === f ? "rgba(0,212,170,0.12)" : "none", border: `1px solid ${modeFilter === f ? "var(--accent-teal)" : "var(--border)"}`, borderRadius: 8, padding: "6px 14px", color: modeFilter === f ? "var(--accent-teal)" : "var(--text-muted)", fontSize: 12, fontWeight: modeFilter === f ? 600 : 400, cursor: "pointer" }}>
                                {f}
                            </button>
                        ))}
                        <div style={{ width: 1, background: "var(--border)", margin: "0 4px", alignSelf: "stretch" }} />
                        {["All", "Deposited", "Cleared", "Pending", "Bounced"].map(f => (
                            <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
                                style={{ background: statusFilter === f ? "rgba(108,99,255,0.12)" : "none", border: `1px solid ${statusFilter === f ? "#6c63ff" : "var(--border)"}`, borderRadius: 8, padding: "6px 12px", color: statusFilter === f ? "#6c63ff" : "var(--text-muted)", fontSize: 12, fontWeight: statusFilter === f ? 600 : 400, cursor: "pointer" }}>
                                {f}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ position: "relative" }}>
                            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search txn, invoice, property…"
                                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px 8px 30px", color: "var(--text-primary)", fontSize: 12, width: 230, outline: "none", fontFamily: "inherit" }} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }}
                                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 10px", color: dateFilter ? "var(--text-primary)" : "var(--text-muted)", fontSize: 12, outline: "none", fontFamily: "inherit", cursor: "pointer" }} />
                            {dateFilter && (
                                <button onClick={() => { setDateFilter(""); setPage(1); }}
                                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "4px" }}>✕</button>
                            )}
                        </div>
                        <BtnGhost onClick={fetchLogs} style={{ padding: "8px 12px" }}>
                            <RefreshCw size={13} style={{ animation: logsLoading ? "spin 1s linear infinite" : "none" }} />
                        </BtnGhost>
                        <BtnPrimary onClick={openAddModal}>
                            <Plus size={12} /> Log Entry
                        </BtnPrimary>
                    </div>
                </div>

                {logsError && <ErrorBox msg={logsError} />}

                {/* Table */}
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr>
                            <TH>Txn ID</TH><TH>Type</TH><TH>Invoice</TH><TH>Property</TH>
                            <TH align="right">Amount</TH><TH>Cheque No.</TH><TH>Date</TH><TH>Status</TH><TH>Actions</TH>
                        </tr></thead>
                        <tbody>
                            {logsLoading && (
                                <tr><td colSpan={9} style={{ padding: "40px 12px", textAlign: "center", color: "var(--text-muted)" }}>Loading…</td></tr>
                            )}
                            {!logsLoading && paged.map(r => (
                                <tr key={r._key}
                                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                    <TD><span style={{ color: "#ffb347", fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.id}</span></TD>
                                    <TD>
                                        <span style={{ background: r.type === "Cash" ? "rgba(255,107,107,0.12)" : "rgba(108,99,255,0.12)", color: r.type === "Cash" ? "#ff6b6b" : "#6c63ff", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{r.type}</span>
                                    </TD>
                                    <TD><span style={{ color: "var(--accent-teal)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{r.invoiceRef || "—"}</span></TD>
                                    <TD>
                                        <div style={{ color: "var(--text-primary)", fontSize: 12 }}>{r.propertyName || "—"}</div>
                                        {r.property && <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 10 }}>{r.property}</div>}
                                    </TD>
                                    <TD style={{ textAlign: "right" }}>
                                        <span style={{ color: "var(--accent-teal)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{fmtFull(r.amount)}</span>
                                    </TD>
                                    <TD>
                                        {r.chequeNo
                                            ? <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.chequeNo}</span>
                                            : <span style={{ color: "var(--text-muted)" }}>—</span>}
                                    </TD>
                                    <TD><span style={{ color: "var(--text-muted)", fontSize: 12 }}>{r.date}</span></TD>
                                    <TD>
                                        <span style={{ background: `${SC[r.status] || "#8899aa"}18`, color: SC[r.status] || "#8899aa", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{r.status}</span>
                                    </TD>
                                    <TD>
                                        <div style={{ display: "flex", gap: 4 }}>
                                            <TableBtn icon={Eye} color="var(--accent-teal)" onClick={() => { }} title="View" />
                                            {r.type === "Cheque" && (
                                                <TableBtn icon={Edit2} color="#6c63ff" onClick={() => { setStatusTarget(r); setNewStatus(r.status); setStatusError(""); }} title="Update Status" />
                                            )}
                                            <TableBtn icon={Trash2} color="#ff6b6b" onClick={() => { setDeleteTarget(r); setDeleteError(""); }} title="Delete" />
                                        </div>
                                    </TD>
                                </tr>
                            ))}
                            {!logsLoading && paged.length === 0 && (
                                <tr><td colSpan={9} style={{ padding: "40px 12px", textAlign: "center", color: "var(--text-muted)" }}>No entries match your filters</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
            </Card>

            {/* ── UPDATE CHEQUE STATUS MODAL ── */}
            <Modal open={!!statusTarget} onClose={() => { if (!statusLoading) { setStatusTarget(null); setStatusError(""); } }} title="Update Cheque Status" width={400}>
                {statusTarget && (
                    <div>
                        <div style={{ padding: "12px 16px", background: "var(--bg-card)", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 16 }}>
                            <div style={{ color: "var(--accent-teal)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{statusTarget.id}</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 4 }}>{statusTarget.propertyName} · {statusTarget.chequeNo} · {fmtFull(statusTarget.amount)}</div>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: "uppercase" }}>New Status</label>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {["Pending", "Deposited", "Cleared", "Bounced"].map(s => (
                                    <button key={s} onClick={() => setNewStatus(s)}
                                        style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${newStatus === s ? (SC[s] || "var(--accent-teal)") : "var(--border)"}`, background: newStatus === s ? `${SC[s] || "var(--accent-teal)"}18` : "none", color: newStatus === s ? (SC[s] || "var(--accent-teal)") : "var(--text-secondary)", fontWeight: newStatus === s ? 700 : 400, fontSize: 13, cursor: "pointer" }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {statusError && <ErrorBox msg={statusError} />}
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <BtnGhost onClick={() => { if (!statusLoading) { setStatusTarget(null); setStatusError(""); } }}>Cancel</BtnGhost>
                            <BtnPrimary onClick={handleUpdateStatus} style={{ opacity: statusLoading ? 0.7 : 1 }}>
                                {statusLoading ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Updating…</> : <><Check size={12} /> Update Status</>}
                            </BtnPrimary>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── DELETE CONFIRM MODAL ── */}
            <Modal open={!!deleteTarget} onClose={() => { if (!deleteLoading) { setDeleteTarget(null); setDeleteError(""); } }} title="Delete Entry" width={420}>
                {deleteTarget && (
                    <div>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20, padding: "14px 16px", background: "rgba(255,107,107,0.07)", borderRadius: 12, border: "1px solid rgba(255,107,107,0.2)" }}>
                            <AlertTriangle size={22} color="#ff6b6b" style={{ flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                                    Delete <span style={{ color: deleteTarget.type === "Cash" ? "#ff6b6b" : "#6c63ff" }}>{deleteTarget.type}</span>{" "}
                                    entry <span style={{ color: "var(--accent-teal)", fontFamily: "var(--font-mono)" }}>{deleteTarget.id}</span>?
                                </div>
                                <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>Amount: <strong>{fmtFull(deleteTarget.amount)}</strong> · {deleteTarget.date}</div>
                            </div>
                        </div>
                        {deleteError && <ErrorBox msg={deleteError} />}
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <BtnGhost onClick={() => { if (!deleteLoading) { setDeleteTarget(null); setDeleteError(""); } }}>Cancel</BtnGhost>
                            <BtnPrimary color="red" onClick={handleDelete} style={{ opacity: deleteLoading ? 0.7 : 1 }}>
                                {deleteLoading ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Deleting…</> : <><Trash2 size={12} /> Confirm Delete</>}
                            </BtnPrimary>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── ADD ENTRY MODAL ── */}
            <Modal open={showAdd} onClose={closeAddModal} title="Log Cash / Cheque Entry" width={620}>
                {/* Mode toggle */}
                <div style={{ marginBottom: 18 }}>
                    <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.3px" }}>Payment Mode *</label>
                    <div style={{ display: "flex", gap: 8 }}>
                        {["Cash", "Cheque"].map(m => (
                            <button key={m} onClick={() => setForm(f => ({ ...f, mode: m }))}
                                style={{ padding: "8px 24px", borderRadius: 8, border: `1px solid ${form.mode === m ? "var(--accent-teal)" : "var(--border)"}`, background: form.mode === m ? "rgba(0,212,170,0.12)" : "var(--bg-card)", color: form.mode === m ? "var(--accent-teal)" : "var(--text-secondary)", fontWeight: form.mode === m ? 700 : 400, fontSize: 13, cursor: "pointer" }}>
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

                    {/* ── Invoice searchable dropdown ── */}
                    {/* FIX: placeholder now reflects invLoading state and uses society-scoped invoices */}
                    <div style={{ position: "relative" }}>
                        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.3px" }}>Invoice Number *</label>
                        <input
                            value={invSearch || form.invoiceNumber}
                            onChange={e => { setInvSearch(e.target.value); setInvOpen(true); setForm(f => ({ ...f, invoiceNumber: "" })); }}
                            onFocus={() => setInvOpen(true)}
                            onBlur={() => setTimeout(() => setInvOpen(false), 180)}
                            placeholder={invLoading ? "Loading invoices…" : invoices.length ? "Search invoice…" : "No invoices found"}
                            style={{ width: "100%", background: "var(--input-bg)", border: `1px solid ${form.invoiceNumber ? "var(--accent-teal)" : "var(--input-border)"}`, borderRadius: 9, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                        />
                        {/* Spinner shown while invoices are loading */}
                        {invLoading && (
                            <RefreshCw size={12} style={{ position: "absolute", right: 10, top: "60%", transform: "translateY(-50%)", color: "var(--text-muted)", animation: "spin 1s linear infinite" }} />
                        )}
                        {form.invoiceNumber && (
                            <div style={{ marginTop: 4, fontSize: 11, color: "var(--accent-teal)", fontFamily: "var(--font-mono)" }}>✓ {form.invoiceNumber}</div>
                        )}
                        {invOpen && !invLoading && invOptions.length > 0 && (
                            // console.log(invOptions)
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", maxHeight: 200, overflowY: "auto", marginTop: 4 }}>
                                {invOptions.map(inv => (
                                    <div key={inv.id || inv.invId}
                                        onMouseDown={() => {

                                            const property = properties.find(
                                                p => p.propertyIdentifier === inv.propertyIdentifier
                                            );

                                            setForm(f => ({
                                                ...f,
                                                invoiceNumber: inv.invoiceNumber,
                                                propertyIdentifier: inv.propertyIdentifier,
                                                amountInFigures: String(inv.totalAmount || 0),
                                            }));

                                            setSelectedPropertyName(
                                                property?.propertyName || inv.propertyIdentifier
                                            );

                                            setInvSearch("");
                                            setInvOpen(false);
                                        }}
                                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                                        onMouseLeave={e => e.currentTarget.style.background = ""}>
                                        <div>
                                            {/* <div style={{ color: "var(--accent-teal)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{inv.invId}</div>
                                            <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>{inv.flatNo} · {inv.ownerName}</div> */}
                                            <div
                                                style={{
                                                    color: "var(--accent-teal)",
                                                    fontFamily: "var(--font-mono)",
                                                    fontSize: 12,
                                                    fontWeight: 700
                                                }}
                                            >
                                                {inv.invoiceNumber}
                                            </div>

                                            <div
                                                style={{
                                                    color: "var(--text-secondary)",
                                                    fontSize: 11
                                                }}
                                            >
                                                {inv.propertyIdentifier}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>
                                                {/* ₹{(inv.outstanding || inv.amount || 0).toLocaleString("en-IN")} */}
                                                ₹{Number(inv.totalAmount || 0).toLocaleString("en-IN")}
                                            </div>
                                            <div style={{ fontSize: 10, color: inv.status === "Overdue" ? "#ff6b6b" : "var(--text-muted)" }}>{inv.status}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Empty state when open, not loading, and no results */}
                        {invOpen && !invLoading && invOptions.length === 0 && invSearch && (
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", padding: "14px", marginTop: 4, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
                                No invoices match "{invSearch}"
                            </div>
                        )}
                    </div>

                    {/* ── Property searchable dropdown ── */}
                    <div style={{ position: "relative" }}>
                        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.3px" }}>Property *</label>
                        <input
                            value={propSearch || selectedPropertyName}
                            onChange={e => { setPropSearch(e.target.value); setPropOpen(true); setForm(f => ({ ...f, propertyIdentifier: "" })); }}
                            onFocus={() => setPropOpen(true)}
                            onBlur={() => setTimeout(() => setPropOpen(false), 180)}
                            placeholder={propsLoading ? "Loading properties…" : properties.length ? "Search property…" : "No properties found"}
                            style={{ width: "100%", background: "var(--input-bg)", border: `1px solid ${form.propertyIdentifier ? "var(--accent-teal)" : "var(--input-border)"}`, borderRadius: 9, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                        />
                        {/* Spinner while loading */}
                        {propsLoading && (
                            <RefreshCw size={12} style={{ position: "absolute", right: 10, top: "60%", transform: "translateY(-50%)", color: "var(--text-muted)", animation: "spin 1s linear infinite" }} />
                        )}
                        {form.propertyIdentifier && (
                            <div style={{ marginTop: 4, fontSize: 11, color: "var(--accent-teal)", fontFamily: "var(--font-mono)" }}>✓ {form.propertyIdentifier}</div>
                        )}
                        {propOpen && !propsLoading && propOptions.length > 0 && (
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", maxHeight: 200, overflowY: "auto", marginTop: 4 }}>
                                {propOptions.map(p => (
                                    <div key={p.propertyIdentifier}
                                        // onMouseDown={() => { setForm(f => ({ ...f, propertyIdentifier: p.propertyIdentifier })); setPropSearch(""); setPropOpen(false); }}
                                        onMouseDown={() => {
                                            setForm(f => ({
                                                ...f,
                                                propertyIdentifier: p.propertyIdentifier
                                            }));

                                            setSelectedPropertyName(p.propertyName);

                                            setPropSearch("");
                                            setPropOpen(false);
                                        }}
                                        style={{ padding: "9px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                                        onMouseLeave={e => e.currentTarget.style.background = ""}>
                                        <div style={{ color: "var(--accent-teal)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{p.propertyName}</div>
                                        <div style={{ color: "var(--text-muted)", fontSize: 10, marginTop: 2 }}>{p.propertyIdentifier} · {p.wing?.wingName} {p.flatNumber}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Empty state */}
                        {propOpen && !propsLoading && propOptions.length === 0 && propSearch && (
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", padding: "14px", marginTop: 4, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
                                No properties match "{propSearch}"
                            </div>
                        )}
                    </div>

                    <FI label="Amount (₹) *" field="amountInFigures" type="number" form={form} setForm={setForm} />
                    <FI label="Mobile *" field="mobile" form={form} setForm={setForm} placeholder="e.g. 9876543210" />
                    <FI label="Receipt Date *" field="receiptDate" type="date" form={form} setForm={setForm} />

                    {/* ── CHEQUE ONLY FIELDS ── */}
                    {isCheque && <>
                        <FI label="Bank Name" field="bankName" form={form} setForm={setForm} placeholder="e.g. HDFC" />
                        <FI label="Branch Name" field="branchName" form={form} setForm={setForm} placeholder="e.g. GZB" />
                        <FI label="Cheque Number" field="chequeNumber" form={form} setForm={setForm} />
                        <FI label="Cheque Date" field="chequeDate" type="date" form={form} setForm={setForm} />
                        <div style={{ gridColumn: "1/-1" }}>
                            <FI label="Amount In Words" field="amountInWords" form={form} setForm={setForm} placeholder="e.g. Fifty rupees" />
                        </div>
                    </>}

                    {/* ── CASH ONLY — Denomination breakdown ── */}
                    {!isCheque && (
                        <div style={{ gridColumn: "1/-1", marginTop: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                <Banknote size={14} color="#ffb347" />
                                <span style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                                    Denomination Breakdown
                                </span>
                                <span style={{ color: "var(--text-muted)", fontSize: 11 }}>(optional)</span>
                                {denomTotal > 0 && (
                                    <span style={{ marginLeft: "auto", color: "var(--accent-teal)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>
                                        Total: {fmtFull(denomTotal)}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
                                {DENOMINATIONS.map(d => (
                                    <div key={d} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 10px" }}>
                                        <div style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, marginBottom: 4 }}>₹{d}</div>
                                        <input
                                            type="number" min="0"
                                            value={denomMap[d]}
                                            onChange={e => setDenomMap(p => ({ ...p, [d]: e.target.value }))}
                                            placeholder="0"
                                            style={{ width: "100%", background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 13, fontWeight: 600, outline: "none", fontFamily: "var(--font-mono)", boxSizing: "border-box" }}
                                        />
                                        {Number(denomMap[d]) > 0 && (
                                            <div style={{ color: "var(--accent-teal)", fontSize: 10, marginTop: 2, fontFamily: "var(--font-mono)" }}>
                                                = ₹{(d * Number(denomMap[d])).toLocaleString("en-IN")}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {addError && <ErrorBox msg={addError} />}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                    <BtnGhost onClick={closeAddModal}>Cancel</BtnGhost>
                    <BtnPrimary onClick={handleAddEntry} style={{ opacity: addLoading ? 0.7 : 1 }}>
                        {addLoading ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : <><Plus size={12} /> Save Entry</>}
                    </BtnPrimary>
                </div>
            </Modal>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}