

import React, { useState, useEffect, useCallback } from "react";

import {
    FileText, CheckCircle, AlertCircle, TrendingUp,
    Download, Search, Plus, Send, Mail,
    Eye, Printer, Edit2,
    ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight,
    X, ArrowUpRight, ArrowDownRight, RefreshCw,
} from "lucide-react";

import { getAllInvoicesApi, getInvoicesDetailApi, generateInvoiceApi } from "../api/account-api";
import { getAllSocietyApi } from "../api/society-api";
import { getAllPropertyApi } from "../api/property-api";
import { getAllTowerApi } from "api/tower-api";
import { getAllWingApi } from "api/wing-api";
import { useAppContext } from "../AppContext";


// ── CONSTANTS ────────────────────────────────────────────────────────

const INVOICE_TYPES = [
    "Maintenance", "Water", "Parking", "Amenity",
    "Visitor Fee", "Special Levy", "Other",
];

const INVOICE_PROCESS_TYPES = ["Society", "Tower", "Wing", "Property"];

const PROPERTY_STATUSES = ["All", "Owner", "Tenant", "Vacant"];

const fmt = (n) =>
    n >= 1e7 ? `₹${(n / 1e7).toFixed(2)}Cr`
        : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)}L`
            : n >= 1e3 ? `₹${(n / 1e3).toFixed(1)}K`
                : `₹${n}`;

const fmtFull = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtNum = (n) => Number(n).toLocaleString("en-IN");


// ── REUSABLE UI ──────────────────────────────────────────────────────

const Pill = ({ status }) => {
    const statusMap = {
        Paid: { bg: "rgba(0,212,170,0.12)", color: "#00d4aa" },
        Pending: { bg: "rgba(255,179,71,0.12)", color: "#ffb347" },
        Overdue: { bg: "rgba(255,107,107,0.12)", color: "#ff6b6b" },
        Unpaid: { bg: "rgba(255,179,71,0.12)", color: "#ffb347" },
    };
    const s = statusMap[status] || { bg: "rgba(136,153,170,0.12)", color: "#8899aa" };
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

const Card = ({ children, style = {} }) => (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, ...style }}>
        {children}
    </div>
);

const SearchInput = ({ value, onChange, placeholder = "Search..." }) => (
    <div style={{ position: "relative" }}>
        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px 8px 30px", color: "var(--text-primary)", fontSize: 12, width: 220, outline: "none", fontFamily: "inherit" }}
        />
    </div>
);

const TH = ({ children, align = "left" }) => (
    <th style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: 10, fontWeight: 700, textAlign: align, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", borderBottom: "1px solid var(--border)" }}>
        {children}
    </th>
);

const TD = ({ children, style = {} }) => (
    <td style={{ padding: "11px 12px", borderBottom: "1px solid var(--border)", ...style }}>
        {children}
    </td>
);

const TableBtn = ({ icon: Icon, color, onClick, title }) => (
    <button
        title={title}
        onClick={onClick}
        style={{ background: `${color}15`, border: "none", borderRadius: 6, padding: "4px 8px", color, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = `${color}30`)}
        onMouseLeave={(e) => (e.currentTarget.style.background = `${color}15`)}
    >
        <Icon size={12} />
    </button>
);

const BtnPrimary = ({ children, onClick, style = {}, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        style={{ background: disabled ? "var(--bg-card)" : "linear-gradient(135deg,var(--accent-teal),var(--accent-blue))", border: "none", borderRadius: 9, padding: "9px 20px", color: disabled ? "var(--text-muted)" : "#000", fontWeight: 700, fontSize: 12, cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", opacity: disabled ? 0.6 : 1, ...style }}
    >
        {children}
    </button>
);

const BtnGhost = ({ children, onClick, style = {} }) => (
    <button
        onClick={onClick}
        style={{ padding: "9px 20px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 9, color: "var(--text-secondary)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, ...style }}
    >
        {children}
    </button>
);


// ── PAGINATION ───────────────────────────────────────────────────────

const Pagination = ({ page, total, perPage, onChange }) => {
    const pages = Math.max(1, Math.ceil(total / perPage));
    const visiblePages = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) visiblePages.push(i);

    const btnStyle = (disabled) => ({
        background: "none", border: "1px solid var(--border)", borderRadius: 6,
        padding: "4px 8px", color: disabled ? "var(--text-muted)" : "var(--text-secondary)",
        cursor: disabled ? "not-allowed" : "pointer",
    });

    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid var(--border)", marginTop: 8 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {fmtNum(total)}
            </span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button onClick={() => onChange(1)} disabled={page === 1} style={btnStyle(page === 1)}><ChevronsLeft size={12} /></button>
                <button onClick={() => onChange(page - 1)} disabled={page === 1} style={btnStyle(page === 1)}><ChevronLeft size={12} /></button>
                {visiblePages.map((p) => (
                    <button key={p} onClick={() => onChange(p)} style={{ background: p === page ? "var(--accent-teal)" : "none", border: `1px solid ${p === page ? "var(--accent-teal)" : "var(--border)"}`, borderRadius: 6, padding: "4px 10px", color: p === page ? "#000" : "var(--text-secondary)", fontWeight: p === page ? 700 : 400, cursor: "pointer", fontSize: 12, minWidth: 30 }}>
                        {p}
                    </button>
                ))}
                <button onClick={() => onChange(page + 1)} disabled={page === pages} style={btnStyle(page === pages)}><ChevronRight size={12} /></button>
                <button onClick={() => onChange(pages)} disabled={page === pages} style={btnStyle(page === pages)}><ChevronsRight size={12} /></button>
            </div>
        </div>
    );
};


// ── MODAL ────────────────────────────────────────────────────────────

const Modal = ({ open, onClose, title, width = 520, children }) => {
    if (!open) return null;
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, backdropFilter: "blur(4px)" }} onClick={onClose}>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 18, width, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                    <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 4 }}><X size={18} /></button>
                </div>
                <div style={{ padding: "20px 24px" }}>{children}</div>
            </div>
        </div>
    );
};


// ── FILTER BAR ───────────────────────────────────────────────────────

const EMPTY_FILTERS = { fromDate: "", toDate: "", societyIdentifier: "all", status: "All", refNo: "" };

const FilterBar = ({ filters, onChange, onSearch, onClear, societies = [] }) => (
    <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            {[
                { label: "From Date", key: "fromDate", type: "date" },
                { label: "To Date", key: "toDate", type: "date" },
            ].map((f) => (
                <div key={f.key} style={{ flex: 1, minWidth: 130 }}>
                    <label style={{ display: "block", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" }}>{f.label}</label>
                    <input
                        type={f.type}
                        value={filters[f.key]}
                        onChange={(e) => onChange(f.key, e.target.value)}
                        style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text-primary)", fontSize: 12, outline: "none" }}
                    />
                </div>
            ))}

            <div style={{ flex: 2, minWidth: 160 }}>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" }}>Society</label>
                <select
                    value={filters.societyIdentifier}
                    onChange={(e) => onChange("societyIdentifier", e.target.value)}
                    style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text-primary)", fontSize: 12, outline: "none", cursor: "pointer" }}
                >
                    <option value="all">All Societies</option>
                    {societies.map((s) => (
                        <option key={s.societyIdentifier} value={s.societyIdentifier}>
                            {s.societyName}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" }}>Status</label>
                <select
                    value={filters.status}
                    onChange={(e) => onChange("status", e.target.value)}
                    style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text-primary)", fontSize: 12, outline: "none", cursor: "pointer" }}
                >
                    {["All", "Paid", "Pending", "Overdue", "Unpaid"].map((s) => <option key={s}>{s}</option>)}
                </select>
            </div>

            <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" }}>Ref / No.</label>
                <input
                    placeholder="INV0063669"
                    value={filters.refNo}
                    onChange={(e) => onChange("refNo", e.target.value)}
                    style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text-primary)", fontSize: 12, outline: "none" }}
                />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
                <button
                    onClick={onSearch}
                    style={{ background: "linear-gradient(135deg,var(--accent-teal),var(--accent-blue))", border: "none", borderRadius: 9, padding: "9px 18px", color: "#000", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                >
                    <Search size={13} /> Search
                </button>
                <button
                    onClick={onClear}
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "9px 14px", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}
                >
                    Clear
                </button>
            </div>
        </div>
    </Card>
);


// ── SECTION LABEL ─────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
    <div style={{
        color: "var(--text-muted)", fontSize: 10, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.6px",
        padding: "10px 0 6px", borderBottom: "1px solid var(--border)",
        marginBottom: 14, gridColumn: "1/-1",
    }}>
        {children}
    </div>
);


// ── HELPER: wingIdentifier property ke andar kahi bhi dhundo ─────────
// API response structure vary kar sakta hai, isliye sab possible paths check karte hain

const getWingIdentifierFromProperty = (p) =>
    p.wingIdentifier ||                        // flat top-level field
    p.wing?.wingIdentifier ||                  // nested wing object
    p.wingId ||                                // alternate key name
    p.wing?.id ||                              // wing.id
    null;

const getTowerIdentifierFromProperty = (p) =>
    p.towerIdentifier ||
    p.wing?.towerIdentifier ||
    p.tower?.towerIdentifier ||
    p.towerId ||
    null;


// ── GENERATE INVOICE MODAL ────────────────────────────────────────────

const EMPTY_GEN_FORM = {
    invoiceType: "Maintenance",
    propertyStatus: "All",
    invoiceProcessType: "Society",
    societyIdentifier: "",
    towerIdentifier: "",
    wingIdentifier: "",
    propertyIdentifier: "",
    fromDate: "",
    toDate: "",
    dueDate: "",
    billDate: "",
};

const GenerateInvoiceModal = ({ open, onClose, societiesList, activeSociety, onSuccess }) => {
    const [form, setForm] = useState(EMPTY_GEN_FORM);

    const [towers, setTowers] = useState([]);
    const [wings, setWings] = useState([]);
    const [properties, setProperties] = useState([]);

    const [towersLoading, setTowersLoading] = useState(false);
    const [wingsLoading, setWingsLoading] = useState(false);
    const [propertiesLoading, setPropertiesLoading] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(null);

    // ── Reset when modal opens ─────────────────────────────────────────
    useEffect(() => {
        if (open) {
            const defaultSociety =
                activeSociety?.societyIdentifier ||
                societiesList?.[0]?.societyIdentifier ||
                "";

            setForm({ ...EMPTY_GEN_FORM, societyIdentifier: defaultSociety });
            setSubmitError(null);
            setSubmitSuccess(null);
            setTowers([]);
            setWings([]);
            setProperties([]);
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Fetch towers when society changes ─────────────────────────────
    useEffect(() => {
        if (!form.societyIdentifier) {
            setTowers([]);
            setWings([]);
            setProperties([]);
            return;
        }

        const loadTowers = async () => {
            setTowersLoading(true);
            setTowers([]);
            setWings([]);
            setProperties([]);
            try {
                const res = await getAllTowerApi(form.societyIdentifier);
                const raw = res?.data?.data || res?.data || [];
                const arr = Array.isArray(raw) ? raw : [];

                const filtered = arr.filter(
                    (t) => t.societyIdentifier?.trim() === form.societyIdentifier?.trim()
                );

                setTowers(filtered.map((t) => ({
                    value: t.towerIdentifier,
                    label: t.towerName || t.towerIdentifier,
                })));
            } catch (err) {
                console.error("❌ Failed to fetch towers:", err);
                setTowers([]);
            } finally {
                setTowersLoading(false);
            }
        };

        loadTowers();
    }, [form.societyIdentifier]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Fetch wings when tower changes ────────────────────────────────
    useEffect(() => {
        if (!form.towerIdentifier) {
            setWings([]);
            setProperties([]);
            return;
        }

        const loadWings = async () => {
            setWingsLoading(true);
            setWings([]);
            setProperties([]);
            try {
                const res = await getAllWingApi(form.societyIdentifier, form.towerIdentifier);
                const raw = res?.data?.data || res?.data || [];
                const arr = Array.isArray(raw) ? raw : [];

                const filtered = arr.filter(
                    (w) =>
                        w.societyIdentifier?.trim() === form.societyIdentifier?.trim() &&
                        w.towerIdentifier === form.towerIdentifier
                );

                setWings(filtered.map((w) => ({
                    value: w.wingIdentifier,
                    label: w.wingName || w.wingIdentifier,
                })));
            } catch (err) {
                console.error("❌ Failed to fetch wings:", err);
                setWings([]);
            } finally {
                setWingsLoading(false);
            }
        };

        loadWings();
    }, [form.towerIdentifier]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Fetch properties when wing changes ────────────────────────────
    // FIX: wingIdentifier ke sab possible locations check karo
    useEffect(() => {
        if (!form.wingIdentifier) {
            setProperties([]);
            return;
        }

        const loadProperties = async () => {
            setPropertiesLoading(true);
            setProperties([]);
            try {
                const res = await getAllPropertyApi(form.wingIdentifier);
                const raw = res?.data?.data || res?.data || [];

                const arr = Array.isArray(raw) ? raw : [];



                const filtered = arr.filter((p) => {
                    // Society match
                    const societyMatch =
                        (p.societyIdentifier?.trim() || p.society?.societyIdentifier?.trim()) ===
                        form.societyIdentifier?.trim();

                    // Tower match — kisi bhi field mein ho
                    const towerMatch =
                        !form.towerIdentifier ||
                        getTowerIdentifierFromProperty(p) === form.towerIdentifier;

                    // Wing match — kisi bhi field mein ho (MAIN FIX)
                    const wingMatch =
                        getWingIdentifierFromProperty(p) === form.wingIdentifier;

                    return societyMatch && towerMatch && wingMatch;
                });

                console.log(`✅ Properties filtered: ${filtered.length} of ${arr.length}`);

                setProperties(filtered.map((p) => ({
                    value: p.propertyIdentifier,
                    label:
                        p.propertyName ||
                        (p.flatNumber ? `${p.flatNumber}` : null) ||
                        p.propertyIdentifier,
                })));
            } catch (err) {
                console.error("❌ Failed to fetch properties:", err);
                setProperties([]);
            } finally {
                setPropertiesLoading(false);
            }
        };

        loadProperties();
    }, [form.wingIdentifier]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Handlers ──────────────────────────────────────────────────────

    const handleSocietyChange = (e) => {
        setForm((f) => ({
            ...f,
            societyIdentifier: e.target.value,
            towerIdentifier: "",
            wingIdentifier: "",
            propertyIdentifier: "",
        }));
        setTowers([]);
        setWings([]);
        setProperties([]);
    };

    const handleTowerChange = (e) => {
        setForm((f) => ({
            ...f,
            towerIdentifier: e.target.value,
            wingIdentifier: "",
            propertyIdentifier: "",
        }));
        setWings([]);
        setProperties([]);
    };

    const handleWingChange = (e) => {
        setForm((f) => ({
            ...f,
            wingIdentifier: e.target.value,
            propertyIdentifier: "",
        }));
        setProperties([]);
    };

    const handleProcessTypeChange = (val) => {
        setForm((f) => ({
            ...f,
            invoiceProcessType: val,
            towerIdentifier: "",
            wingIdentifier: "",
            propertyIdentifier: "",
        }));
        setWings([]);
        setProperties([]);
    };

    const set = (field) => (e) =>
        setForm((f) => ({ ...f, [field]: e.target.value }));

    const needsTower = ["Tower", "Wing", "Property"].includes(form.invoiceProcessType);
    const needsWing = ["Wing", "Property"].includes(form.invoiceProcessType);
    const needsProperty = form.invoiceProcessType === "Property";

    // ── Validation ────────────────────────────────────────────────────
    const isValid = () => {
        if (!form.societyIdentifier) return false;
        if (!form.fromDate || !form.toDate || !form.dueDate || !form.billDate) return false;
        if (needsTower && !form.towerIdentifier) return false;
        if (needsWing && !form.wingIdentifier) return false;
        if (needsProperty && !form.propertyIdentifier) return false;
        return true;
    };

    // ── Submit ────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!isValid()) return;
        setSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(null);

        const payload = {
            invoiceType: form.invoiceType,
            propertyStatus: form.propertyStatus,
            invoiceProcessType: form.invoiceProcessType,
            societyIdentifier: form.societyIdentifier,
            fromDate: form.fromDate,
            toDate: form.toDate,
            dueDate: form.dueDate,
            billDate: form.billDate,
        };

        if (needsTower && form.towerIdentifier) payload.towerIdentifier = form.towerIdentifier;
        if (needsWing && form.wingIdentifier) payload.wingIdentifier = form.wingIdentifier;
        if (needsProperty && form.propertyIdentifier) payload.propertyIdentifier = form.propertyIdentifier;

        try {
            console.log("🚀 GenerateInvoice payload:", payload);
            const res = await generateInvoiceApi(payload);
            const msg = res?.data?.message || "Invoices generated successfully!";
            const count = res?.data?.count ?? "";
            setSubmitSuccess(`✅ ${msg}${count !== "" ? ` (${count} generated)` : ""}`);
            if (onSuccess) onSuccess();
        } catch (err) {
            const errMsg = err?.response?.data?.message || err.message || "Invoice generation failed";
            setSubmitError(`❌ ${errMsg}`);
            console.error("❌ GenerateInvoice error:", err);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Styles ────────────────────────────────────────────────────────
    const inputStyle = (disabled = false) => ({
        width: "100%",
        background: disabled ? "var(--bg-card)" : "var(--input-bg)",
        border: "1px solid var(--input-border)",
        borderRadius: 9,
        padding: "9px 12px",
        color: "var(--text-primary)",
        fontSize: 13,
        outline: "none",
        boxSizing: "border-box",
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : undefined,
        fontFamily: "inherit",
    });

    const labelStyle = {
        display: "block",
        color: "var(--text-secondary)",
        fontSize: 11,
        fontWeight: 600,
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: "0.3px",
    };

    const fieldWrap = (span = 1) => ({
        marginBottom: 14,
        gridColumn: span === 2 ? "1/-1" : undefined,
    });

    // ── Render ────────────────────────────────────────────────────────
    return (
        <Modal open={open} onClose={onClose} title="Generate Invoice" width={580}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>

                {/* ── Invoice Configuration ── */}
                <SectionLabel>Invoice Configuration</SectionLabel>

                <div style={fieldWrap()}>
                    <label style={labelStyle}>Invoice Type *</label>
                    <select value={form.invoiceType} onChange={set("invoiceType")} style={inputStyle()}>
                        {INVOICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div style={fieldWrap()}>
                    <label style={labelStyle}>Property Status *</label>

                    <select value={form.propertyStatus} onChange={set("propertyStatus")} style={inputStyle()}>
                        {PROPERTY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>

                </div>

                <div style={fieldWrap(2)}>
                    <label style={labelStyle}>Invoice Process Type *</label>
                    <div style={{ display: "flex", gap: 8 }}>
                        {INVOICE_PROCESS_TYPES.map((t) => (
                            <button
                                key={t}
                                onClick={() => handleProcessTypeChange(t)}
                                style={{
                                    flex: 1,
                                    padding: "8px 10px",
                                    borderRadius: 8,
                                    border: form.invoiceProcessType === t
                                        ? "1px solid var(--accent-teal)"
                                        : "1px solid var(--border)",
                                    background: form.invoiceProcessType === t
                                        ? "rgba(0,212,170,0.12)"
                                        : "var(--bg-card)",
                                    color: form.invoiceProcessType === t
                                        ? "var(--accent-teal)"
                                        : "var(--text-secondary)",
                                    fontSize: 12,
                                    fontWeight: form.invoiceProcessType === t ? 700 : 400,
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                    fontFamily: "inherit",
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Target ── */}
                <SectionLabel>Target</SectionLabel>

                {/* Society */}
                <div style={fieldWrap(2)}>
                    <label style={labelStyle}>Society *</label>
                    <select
                        value={form.societyIdentifier}
                        onChange={handleSocietyChange}
                        style={inputStyle()}
                    >
                        <option value="">— Select Society —</option>
                        {societiesList.map((s) => (
                            <option key={s.societyIdentifier} value={s.societyIdentifier}>
                                {s.societyName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Tower */}
                {needsTower && (
                    <div style={fieldWrap()}>
                        <label style={labelStyle}>Tower *</label>
                        <select
                            value={form.towerIdentifier}
                            onChange={handleTowerChange}
                            disabled={!form.societyIdentifier || towersLoading || towers.length === 0}
                            style={inputStyle(!form.societyIdentifier || towersLoading || towers.length === 0)}
                        >
                            <option value="">
                                {towersLoading ? "Loading towers…" : towers.length === 0 ? "No towers found" : "— Select Tower —"}
                            </option>
                            {towers.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        {towersLoading && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 11, marginTop: 4 }}>
                                <RefreshCw size={10} style={{ animation: "spin 1s linear infinite" }} /> Loading towers…
                            </div>
                        )}
                    </div>
                )}

                {/* Wing */}
                {needsWing && (
                    <div style={fieldWrap()}>
                        <label style={labelStyle}>Wing *</label>
                        <select
                            value={form.wingIdentifier}
                            onChange={handleWingChange}
                            disabled={!form.towerIdentifier || wingsLoading || wings.length === 0}
                            style={inputStyle(!form.towerIdentifier || wingsLoading || wings.length === 0)}
                        >
                            <option value="">
                                {!form.towerIdentifier ? "Select tower first" : wingsLoading ? "Loading wings…" : wings.length === 0 ? "No wings found" : "— Select Wing —"}
                            </option>
                            {wings.map((w) => (
                                <option key={w.value} value={w.value}>{w.label}</option>
                            ))}
                        </select>
                        {wingsLoading && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 11, marginTop: 4 }}>
                                <RefreshCw size={10} style={{ animation: "spin 1s linear infinite" }} /> Loading wings…
                            </div>
                        )}
                    </div>
                )}

                {/* Property — full width */}
                {needsProperty && (
                    <div style={fieldWrap(2)}>
                        <label style={labelStyle}>Property *</label>
                        <select
                            value={form.propertyIdentifier}
                            onChange={set("propertyIdentifier")}
                            disabled={!form.wingIdentifier || propertiesLoading || properties.length === 0}
                            style={inputStyle(!form.wingIdentifier || propertiesLoading || properties.length === 0)}
                        >
                            <option value="">
                                {!form.wingIdentifier
                                    ? "Select wing first"
                                    : propertiesLoading
                                        ? "Loading properties…"
                                        : properties.length === 0
                                            ? "No properties found"
                                            : "— Select Property —"}
                            </option>
                            {properties.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                        {propertiesLoading && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 11, marginTop: 4 }}>
                                <RefreshCw size={10} style={{ animation: "spin 1s linear infinite" }} /> Loading properties…
                            </div>
                        )}
                    </div>
                )}

                {/* Grid balancer */}
                {needsTower && !needsWing && <div style={fieldWrap()} />}

                {/* ── Billing Period & Dates ── */}
                <SectionLabel>Billing Period &amp; Dates</SectionLabel>

                <div style={fieldWrap()}>
                    <label style={labelStyle}>From Date *</label>
                    <input type="date" value={form.fromDate} onChange={set("fromDate")} style={inputStyle()} />
                </div>

                <div style={fieldWrap()}>
                    <label style={labelStyle}>To Date *</label>
                    <input type="date" value={form.toDate} onChange={set("toDate")} min={form.fromDate} style={inputStyle()} />
                </div>

                <div style={fieldWrap()}>
                    <label style={labelStyle}>Bill Date *</label>
                    <input type="date" value={form.billDate} onChange={set("billDate")} style={inputStyle()} />
                </div>

                <div style={fieldWrap()}>
                    <label style={labelStyle}>Due Date *</label>
                    <input type="date" value={form.dueDate} onChange={set("dueDate")} min={form.billDate} style={inputStyle()} />
                </div>

            </div>

            {/* Status messages */}
            {submitError && (
                <div style={{ padding: "10px 14px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 10, marginBottom: 14, color: "#ff6b6b", fontSize: 13 }}>
                    {submitError}
                </div>
            )}
            {submitSuccess && (
                <div style={{ padding: "10px 14px", background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 10, marginBottom: 14, color: "var(--accent-teal)", fontSize: 13 }}>
                    {submitSuccess}
                </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
                <BtnGhost onClick={onClose}>Cancel</BtnGhost>
                <BtnPrimary onClick={handleSubmit} disabled={!isValid() || submitting}>
                    {submitting
                        ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Generating…</>
                        : <><Plus size={12} /> Generate Invoice</>
                    }
                </BtnPrimary>
            </div>
        </Modal>
    );
};


// ── INVOICE TAB ──────────────────────────────────────────────────────

const PER_PAGE = 8;

export default function InvoiceTab() {
    const { societies: ctxSocieties = [], selectedSociety } = useAppContext();

    const [societiesList, setSocietiesList] = useState([]);
    const [societiesLoading, setSocietiesLoading] = useState(false);
    const [activeSociety, setActiveSociety] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [viewDetailLoading, setViewDetailLoading] = useState(false);
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [applied, setApplied] = useState(EMPTY_FILTERS);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState([]);
    const [page, setPage] = useState(1);
    const [viewDetail, setViewDetail] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [localData, setLocalData] = useState([]);

    // ── Societies ──────────────────────────────────────────────────────
    useEffect(() => {
        if (ctxSocieties && ctxSocieties.length > 0) {
            setSocietiesList(ctxSocieties.map((s) => ({
                societyId: s.societyId,
                societyIdentifier: s.societyIdentifier,
                societyName: s.societyName,
                email: s.email,
                address: s.address,
                billingFrequency: s.billingFrequency,
                annualRateOfInterest: s.annualRateOfInterest,
                gstin: s.gstin,
                city: s.city,
                state: s.state,
            })));
            return;
        }

        const fetchSocieties = async () => {
            setSocietiesLoading(true);
            try {
                const response = await getAllSocietyApi();
                const raw = response?.data?.data || response?.data || [];
                const arr = Array.isArray(raw) ? raw : [];
                setSocietiesList(arr.map((s) => ({
                    societyId: s.societyId,
                    societyIdentifier: s.societyIdentifier,
                    societyName: s.societyName,
                    email: s.email,
                    address: s.address,
                    billingFrequency: s.billingFrequency,
                    annualRateOfInterest: s.annualRateOfInterest,
                    gstin: s.gstin,
                    city: s.city,
                    state: s.state,
                })));
            } catch (err) {
                console.error("❌ InvoiceTab: Failed to fetch societies:", err);
            } finally {
                setSocietiesLoading(false);
            }
        };

        fetchSocieties();
    }, [ctxSocieties]);

    // ── Sync activeSociety ────────────────────────────────────────────
    useEffect(() => {
        if (selectedSociety?.societyIdentifier) {
            const found = societiesList.find(
                (s) => s.societyIdentifier === selectedSociety.societyIdentifier
            );
            setActiveSociety(found || {
                societyIdentifier: selectedSociety.societyIdentifier,
                societyName: selectedSociety.societyName || selectedSociety.societyIdentifier,
            });
        } else {
            setActiveSociety(null);
        }
    }, [selectedSociety, societiesList]);

    // ── Fetch invoices ────────────────────────────────────────────────
    const fetchInvoices = useCallback(async (societyIdentifier) => {
        setLoading(true);
        setError(null);
        setPage(1);
        try {
            const response = await getAllInvoicesApi({}, societyIdentifier);
            const rawData = response?.data?.data || response?.data?.results || response?.data || [];
            const arr = Array.isArray(rawData) ? rawData : [];
            setInvoices(arr.map((inv) => ({
                id: inv.invoiceNumber || String(inv.invoiceId),
                invoiceId: inv.invoiceId,
                property: inv.property?.propertyName || inv.property?.propertyIdentifier || inv.propertyName || "",
                propertyIdentifier: inv.propertyIdentifier || "",
                society: inv.society?.societyName || inv.society?.societyIdentifier || inv.societyName || "",
                societyIdentifier: inv.societyIdentifier || societyIdentifier || "",
                type: inv.type || "Maintenance",
                name: inv.name || "",
                amount: Number(inv.totalAmount || 0),
                grandTotal: Number(inv.grandTotal || 0),
                totalOutstanding: Number(inv.totalOutstanding || 0),
                totalPaidAmount: Number(inv.totalPaidAmount || 0),
                due: inv.dueDate || "",
                issued: inv.invoiceCreatedDate || inv.billDate || "",
                billStartDate: inv.billStartDate || "",
                billEndDate: inv.billEndDate || "",
                status: inv.status || "Unpaid",
                resident: inv.property?.propertyMembers?.[0]?.member?.firstName || inv.ownerName || "",
                email: inv.property?.propertyMembers?.[0]?.member?.email || "",
                phone: inv.property?.propertyMembers?.[0]?.member?.mobileNumber || "",
                chargesApplied: inv.chargesApplied || [],
                isLatest: inv.isLatest || false,
            })));
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to fetch invoices");
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!activeSociety?.societyIdentifier) { setInvoices([]); return; }
        fetchInvoices(activeSociety.societyIdentifier);
    }, [activeSociety, fetchInvoices]);

    // ── Derived ───────────────────────────────────────────────────────
    const baseData = [...invoices, ...localData];

    const filtered = baseData.filter((r) => {
        if (applied.societyIdentifier !== "all" && r.societyIdentifier !== applied.societyIdentifier) return false;
        if (applied.status !== "All" && r.status !== applied.status) return false;
        if (applied.refNo && !(r.id || "").toLowerCase().includes(applied.refNo.toLowerCase())) return false;
        // Date range filter — tries issued (invoiceCreatedDate/billDate), then billStartDate, then due
        if (applied.fromDate || applied.toDate) {
            const toYMD = (val) => {
                if (!val) return null;
                const clean = (val + "").split(" ")[0].split("T")[0];
                if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
                const dmy = (val + "").match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
                if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
                const d = new Date(val);
                if (isNaN(d.getTime())) return null;
                const y = d.getUTCFullYear();
                const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
                const dy = String(d.getUTCDate()).padStart(2, "0");
                return `${y}-${mo}-${dy}`;
            };
            const refYMD = toYMD(r.issued) || toYMD(r.billStartDate) || toYMD(r.due);
            if (refYMD) {
                if (applied.fromDate && refYMD < applied.fromDate) return false;
                if (applied.toDate && refYMD > applied.toDate) return false;
            }
            if (!refYMD && applied.fromDate && applied.toDate) return false;
        }
        if (search &&
            !(r.id || "").toLowerCase().includes(search.toLowerCase()) &&
            !(r.property || "").toLowerCase().includes(search.toLowerCase()) &&
            !(r.resident || "").toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const totalInvoiced = baseData.reduce((s, r) => s + r.amount, 0);
    const totalPaid = baseData.reduce((s, r) => s + r.totalPaidAmount, 0);
    const totalOutstanding = baseData.reduce((s, r) => s + r.totalOutstanding, 0);
    const collectionPct = totalInvoiced > 0 ? ((totalPaid / totalInvoiced) * 100).toFixed(1) : "0.0";

    const toggleAll = (e) => setSelected(e.target.checked ? filtered.map((r) => r.id) : []);
    const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

    // ── View Detail ───────────────────────────────────────────────────
    const handleViewDetails = async (invoice) => {
        setViewDetailLoading(true);
        setViewDetail(invoice);
        try {
            const response = await getInvoicesDetailApi(invoice.id);
            if (response.data?.data) {
                const d = response.data.data;
                setViewDetail({
                    invoiceNumber: d.invoiceNumber,
                    invoiceId: d.invoiceId,
                    name: d.name,
                    status: d.status,
                    type: d.type,
                    amount: Number(d.totalAmount || 0),
                    grandTotal: Number(d.grandTotal || 0),
                    totalPaidAmount: Number(d.totalPaidAmount || 0),
                    totalOutstanding: Number(d.grandRemainingBalance || 0),
                    due: d.dueDate || "",
                    issued: d.invoiceCreatedDate || "",
                    billStartDate: d.billStartDate || "",
                    billEndDate: d.billEndDate || "",
                    billDate: d.billDate || "",
                    property: d.propertyName || d.property?.propertyName || "",
                    propertyIdentifier: d.propertyIdentifier || "",
                    society: d.societyName || d.society?.societyName || "",
                    societyIdentifier: d.societyIdentifier || "",
                    resident: d.property?.propertyMembers?.[0]?.member?.firstName || "",
                    email: d.property?.propertyMembers?.[0]?.member?.email || "",
                    phone: d.property?.propertyMembers?.[0]?.member?.mobileNumber || "",
                    chargesApplied: d.chargesApplied || [],
                    advanceAdjust: Number(d.advanceAdjust || 0),
                    discount: Number(d.discount || 0),
                    interestOutstanding: Number(d.interestOutstanding || 0),
                });
            }
        } catch (err) {
            console.error("❌ InvoiceTab: Failed to fetch invoice details:", err);
        } finally {
            setViewDetailLoading(false);
        }
    };

    // ── After generate success → refresh ─────────────────────────────
    const handleGenerateSuccess = () => {
        if (activeSociety?.societyIdentifier) {
            setTimeout(() => {
                fetchInvoices(activeSociety.societyIdentifier);
                setShowAdd(false);
            }, 1500);
        }
    };

    // ── Render ────────────────────────────────────────────────────────
    return (
        <div>
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
                <StatKPI label="Total Invoiced" value={fmt(totalInvoiced)} sub={`${baseData.length} invoices`} color="#6c63ff" icon={FileText} trend={8.7} up={true} />
                <StatKPI label="Collected" value={fmt(totalPaid)} sub="Paid invoices" color="#00d4aa" icon={CheckCircle} trend={6.8} up={true} />
                <StatKPI label="Outstanding" value={fmt(totalOutstanding)} sub="Pending + Overdue" color="#ff6b6b" icon={AlertCircle} trend={-3.1} up={false} />
                <StatKPI label="Collection Rate" value={`${collectionPct}%`} sub="Of total invoiced" color="#ffb347" icon={TrendingUp} trend={2.3} up={true} />
            </div>

            {/* Filter Bar */}
            <FilterBar
                filters={filters}
                onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
                onSearch={() => { setApplied(filters); setPage(1); }}
                onClear={() => { setFilters(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setPage(1); }}
                societies={societiesList}
            />

            {/* Loading / Error */}
            {loading && (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                    <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", marginBottom: 8, display: "block", margin: "0 auto 10px" }} />
                    {activeSociety?.societyName} ke invoices load ho rahe hain...
                </div>
            )}
            {error && !loading && (
                <div style={{ padding: 20, background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 12, marginBottom: 16 }}>
                    <div style={{ color: "#ff6b6b", fontWeight: 600, marginBottom: 6 }}>❌ Error: {error}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Console mein details check karein.</div>
                </div>
            )}

            {/* Table Card */}
            {!loading && (
                <Card>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search invoice, property..." />
                            {selected.length > 0 && <span style={{ color: "var(--accent-teal)", fontSize: 12, fontWeight: 600 }}>{selected.length} selected</span>}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            {selected.length > 0 && (
                                <>
                                    <BtnGhost onClick={() => { }} style={{ color: "#6c63ff" }}><Send size={12} /> Bulk SMS</BtnGhost>
                                    <BtnGhost onClick={() => { }} style={{ color: "#ffb347" }}><Mail size={12} /> Bulk Email</BtnGhost>
                                </>
                            )}
                            <BtnGhost onClick={() => { }} style={{ color: "var(--accent-teal)" }}><Download size={12} /> Export</BtnGhost>
                            <BtnGhost onClick={() => { }} style={{ color: "var(--accent-blue)" }}><Printer size={12} /> Print</BtnGhost>
                            <BtnPrimary onClick={() => setShowAdd(true)}><Plus size={12} /> Generate Invoice</BtnPrimary>
                        </div>
                    </div>

                    {selected.length > 0 && (
                        <div style={{ background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.15)", borderRadius: 10, padding: "10px 16px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                                {selected.length} selected — Total:{" "}
                                <strong style={{ color: "var(--accent-teal)" }}>
                                    {fmtFull(filtered.filter((r) => selected.includes(r.id)).reduce((s, r) => s + r.amount, 0))}
                                </strong>
                            </span>
                            <button onClick={() => setSelected([])} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12 }}>Clear</button>
                        </div>
                    )}

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <TH><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} style={{ cursor: "pointer" }} /></TH>
                                    <TH>Invoice No.</TH>
                                    <TH>Resident</TH>
                                    <TH>Property</TH>
                                    <TH>Society</TH>
                                    <TH>Type</TH>
                                    <TH align="right">Amount</TH>
                                    <TH>Issued</TH>
                                    <TH>Due Date</TH>
                                    <TH>Status</TH>
                                    <TH>Actions</TH>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((r) => (
                                    <tr
                                        key={r.id}
                                        style={{ background: selected.includes(r.id) ? "rgba(108,99,255,0.05)" : "transparent", transition: "background 0.15s" }}
                                        onMouseEnter={(e) => { if (!selected.includes(r.id)) e.currentTarget.style.background = "var(--bg-card-hover)"; }}
                                        onMouseLeave={(e) => { if (!selected.includes(r.id)) e.currentTarget.style.background = "transparent"; }}
                                    >
                                        <TD><input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} style={{ cursor: "pointer" }} /></TD>
                                        <TD><span style={{ color: "var(--accent-purple)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>{r.id}</span></TD>
                                        <TD>
                                            <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{r.resident || "-"}</div>
                                            <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{r.phone || "-"}</div>
                                        </TD>
                                        <TD><span style={{ background: "rgba(0,212,170,0.1)", color: "var(--accent-teal)", borderRadius: 6, padding: "2px 8px", fontFamily: "var(--font-mono)", fontSize: 11 }}>{r.property || r.propertyIdentifier}</span></TD>
                                        <TD>
                                            <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>{r.society}</div>
                                            <div style={{ color: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}>{r.societyIdentifier}</div>
                                        </TD>
                                        <TD><span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{r.type}</span></TD>
                                        <TD style={{ textAlign: "right" }}><span style={{ color: "var(--text-primary)", fontWeight: 600, fontFamily: "var(--font-mono)", fontSize: 13 }}>{fmtFull(r.amount)}</span></TD>
                                        <TD><span style={{ color: "var(--text-muted)", fontSize: 12 }}>{r.issued}</span></TD>
                                        <TD><span style={{ color: r.status === "Overdue" ? "#ff6b6b" : "var(--text-muted)", fontSize: 12, fontWeight: r.status === "Overdue" ? 600 : 400 }}>{r.due}</span></TD>
                                        <TD><Pill status={r.status} /></TD>
                                        <TD>
                                            <div style={{ display: "flex", gap: 4 }}>
                                                <TableBtn icon={Eye} color="var(--accent-teal)" onClick={() => handleViewDetails(r)} title="View Details" />
                                                <TableBtn icon={Printer} color="var(--accent-purple)" onClick={() => { }} title="Print" />
                                                <TableBtn icon={Send} color="var(--accent-amber)" onClick={() => { }} title="Send" />
                                                <TableBtn icon={Edit2} color="var(--accent-blue)" onClick={() => { }} title="Edit" />
                                            </div>
                                        </TD>
                                    </tr>
                                ))}
                                {paged.length === 0 && (
                                    <tr>
                                        <td colSpan={11} style={{ padding: "40px 12px", textAlign: "center", color: "var(--text-muted)" }}>
                                            {!activeSociety
                                                ? "Pehle upar se society select karein"
                                                : "Koi invoice nahi mila"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
                </Card>
            )}

            {/* ── Invoice Detail Modal ── */}
            <Modal open={!!viewDetail} onClose={() => setViewDetail(null)} title="Invoice Details" width={520}>
                {viewDetailLoading ? (
                    <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Loading invoice details...</div>
                ) : viewDetail && (
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: "14px 16px", background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)" }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(108,99,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <FileText size={20} color="#6c63ff" />
                            </div>
                            <div>
                                <div style={{ color: "var(--accent-purple)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15 }}>{viewDetail.invoiceNumber || viewDetail.id}</div>
                                <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>{viewDetail.name}</div>
                            </div>
                            <Pill status={viewDetail.status} />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            {[
                                ["Invoice Type", viewDetail.type],
                                ["Resident", viewDetail.resident],
                                ["Property", viewDetail.property],
                                ["Society", viewDetail.society],
                                ["Society ID", viewDetail.societyIdentifier],
                                ["Bill Date", viewDetail.billDate],
                                ["Bill Period", `${viewDetail.billStartDate || ""} - ${viewDetail.billEndDate || ""}`],
                                ["Issued Date", viewDetail.issued],
                                ["Due Date", viewDetail.due],
                            ].map(([k, v]) => (
                                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                                    <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{k}</span>
                                    <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{v || "-"}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginBottom: 16, padding: "14px 16px", background: "var(--bg-card)", borderRadius: 10, border: "1px solid var(--border)" }}>
                            <div style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 10 }}>Amount Summary</div>
                            {[
                                ["Total Amount", fmtFull(viewDetail.amount)],
                                ["Discount", fmtFull(viewDetail.discount || 0)],
                                ["Advance Adjust", fmtFull(viewDetail.advanceAdjust || 0)],
                                ["Total Paid", fmtFull(viewDetail.totalPaidAmount)],
                                ["Outstanding", fmtFull(viewDetail.totalOutstanding)],
                                ["Grand Total", fmtFull(viewDetail.grandTotal)],
                            ].map(([k, v]) => (
                                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                                    <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{k}</span>
                                    <span style={{ color: k === "Outstanding" ? "#ff6b6b" : "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{v}</span>
                                </div>
                            ))}
                        </div>

                        {viewDetail.chargesApplied?.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 10 }}>Charges Applied</div>
                                {viewDetail.chargesApplied.map((charge, idx) => (
                                    <div key={idx} style={{ padding: "12px 16px", background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--border)", marginBottom: 8 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                            <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}>{charge.chargeName}</span>
                                            <span style={{ color: "var(--accent-teal)", fontWeight: 600, fontSize: 13 }}>{fmtFull(charge.totalAmount)}</span>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
                                            <div><span style={{ color: "var(--text-muted)" }}>Type: </span><span style={{ color: "var(--text-secondary)" }}>{charge.chargeType}</span></div>
                                            <div><span style={{ color: "var(--text-muted)" }}>Billing: </span><span style={{ color: "var(--text-secondary)" }}>{charge.billingType}</span></div>
                                            <div><span style={{ color: "var(--text-muted)" }}>Base: </span><span style={{ color: "var(--text-secondary)" }}>{fmtFull(charge.baseAmount)}</span></div>
                                            <div><span style={{ color: "var(--text-muted)" }}>GST: </span><span style={{ color: "var(--text-secondary)" }}>{charge.gst}%</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                            <BtnGhost onClick={() => { }} style={{ flex: 1, justifyContent: "center", color: "#6c63ff" }}><Printer size={14} /> Print</BtnGhost>
                            <BtnGhost onClick={() => { }} style={{ flex: 1, justifyContent: "center", color: "var(--accent-teal)" }}><Send size={14} /> Send</BtnGhost>
                            <BtnPrimary onClick={() => { }} style={{ flex: 1, justifyContent: "center" }}><Download size={14} /> Download</BtnPrimary>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── Generate Invoice Modal ── */}
            <GenerateInvoiceModal
                open={showAdd}
                onClose={() => setShowAdd(false)}
                societiesList={societiesList}
                activeSociety={activeSociety}
                onSuccess={handleGenerateSuccess}
            />
        </div>
    );
}