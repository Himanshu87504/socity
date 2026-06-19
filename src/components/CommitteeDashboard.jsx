// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useAppContext } from "../AppContext";
import {
    Users, Search, Plus, Edit2, Trash2, X, RefreshCw,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Phone, BadgeCheck, Tag, AlertCircle, Shield,
} from "lucide-react";
import {
    addNewCommiteeMemberApi,
    updateCommiteeMemberApi,
    deleteCommiteeMemberApi,
} from "../api/commitee-api";
import { getAllSocietyApi } from "../api/society-api";
import { getAllTowerApi }   from "../api/tower-api";
import { getAllPropertyApi } from "../api/property-api";
import axiosInstance from "../api/axiosInstance";

// Wing fetch — GET /society/:sid/wings
const getTowerWingsApi = (towerId) => axiosInstance.get(`/tower/${towerId}/wings`);
// Property fetch — GET /wing/:wingId/properties
const getWingPropertiesApi = (wingId) => axiosInstance.get(`/wing/${wingId}/properties`);

// ─── Constants ────────────────────────────────────────────────────────────────
const DESIGNATION_OPTIONS = [
    "Chairman", "Secretary", "Joint Secretary",
];

const APPLICATION_TYPE_OPTIONS = [
     "Gate Pass",
                "Flat Resale",
                "Celebration",
                "Club House",
                "Play Area",
                "Food Court",
                "Banquet Hall",
                "Document Submission",
                "Cash",
                "Cheque",
                "Interior Work",
                "Swimming Pool",
                "Turf Area",
                "Badminton Court",
                "Rent Agreement",
                "Share Certificate",
                "Nomination",
                "Theater",
                "Name Change",
                "Contact Update"
];

const DESIGNATION_COLORS = {
    "Chairman":                  { color: "#ffb347", bg: "rgba(255,179,71,0.12)" },
    "Secretary":                 { color: "#00d4aa", bg: "rgba(0,212,170,0.12)" },
    "Treasurer":                 { color: "#6c63ff", bg: "rgba(108,99,255,0.12)" },
    "Joint Secretary":           { color: "#00b4d8", bg: "rgba(0,180,216,0.12)" },
    "Managing Committee Member": { color: "#ff6b6b", bg: "rgba(255,107,107,0.12)" },
    "President":                 { color: "#ffb347", bg: "rgba(255,179,71,0.12)" },
    "Vice President":            { color: "#8899aa", bg: "rgba(136,153,170,0.12)" },
};
const defaultDesigColor = { color: "#8899aa", bg: "rgba(136,153,170,0.12)" };
const PER_PAGE = 10;

// ─── Styles ───────────────────────────────────────────────────────────────────
const inputStyle = {
    width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-strong)",
    borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13,
    outline: "none", boxSizing: "border-box", appearance: "none",
};
const labelStyle = { display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6, fontWeight: 500 };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const extractList = (res) => {
    const d = res?.data;
    if (Array.isArray(d))        return d;
    if (Array.isArray(d?.data))  return d.data;
    return [];
};

const DesigBadge = ({ designation }) => {
    const cfg = DESIGNATION_COLORS[designation] || defaultDesigColor;
    return (
        <span style={{ background: cfg.bg, color: cfg.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
            {designation || "—"}
        </span>
    );
};

const AppTypeTag = ({ label }) => (
    <span style={{ display: "inline-block", background: "rgba(108,99,255,0.1)", color: "#6c63ff", border: "1px solid rgba(108,99,255,0.2)", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, margin: "2px 3px 2px 0" }}>
        {label}
    </span>
);

const Pagination = ({ page, total, perPage, onChange }) => {
    const pages = Math.max(1, Math.ceil(total / perPage));
    const vis = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) vis.push(i);
    const nb = (onClick, disabled, children) => (
        <button onClick={onClick} disabled={disabled}
            style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: disabled ? "#556677" : "#8899aa", cursor: disabled ? "not-allowed" : "pointer" }}>
            {children}
        </button>
    );
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
            <span style={{ color: "#8899aa", fontSize: 12 }}>
                Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
                {nb(() => onChange(1), page === 1, <ChevronsLeft size={12} />)}
                {nb(() => onChange(page - 1), page === 1, <ChevronLeft size={12} />)}
                {vis.map(p => (
                    <button key={p} onClick={() => onChange(p)}
                        style={{ background: p === page ? "#00d4aa" : "none", border: `1px solid ${p === page ? "#00d4aa" : "var(--border)"}`, borderRadius: 6, padding: "4px 10px", color: p === page ? "#000" : "#8899aa", fontWeight: p === page ? 700 : 400, cursor: "pointer", fontSize: 12, minWidth: 30 }}>
                        {p}
                    </button>
                ))}
                {nb(() => onChange(page + 1), page === pages, <ChevronRight size={12} />)}
                {nb(() => onChange(pages), page === pages, <ChevronsRight size={12} />)}
            </div>
        </div>
    );
};

// ─── Dropdown Component ───────────────────────────────────────────────────────
const DD = ({ label, value, onChange, options, placeholder, loading: ld, disabled, required }) => (
    <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>{label}{required && <span style={{ color: "#ff6b6b" }}> *</span>}</label>
        {ld ? (
            <div style={{ ...inputStyle, color: "#8899aa", display: "flex", alignItems: "center", gap: 8 }}>
                <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Loading…
            </div>
        ) : (
            <select value={value || ""} onChange={e => onChange(e.target.value)} disabled={disabled}
                style={{ ...inputStyle, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>
                <option value="">{placeholder || "— Select —"}</option>
                {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        )}
    </div>
);

// ─── Add / Edit Form Panel ────────────────────────────────────────────────────
const emptyForm = {
    fullName: "", contactNumber: "", designation: "", applicationType: [],
    societyIdentifier: "", towerIdentifier: "", wingIdentifier: "", propertyIdentifier: "",
};

const MemberFormPanel = ({ mode, initial, onClose, onSaved }) => {
    const getSid = () => localStorage.getItem("society_identifier") || localStorage.getItem("societyId") || "";

    // ✅ FIX 3 — initial state mein tower/wing/property bhi set karo
    const [form, setForm] = useState(initial
        ? {
            ...emptyForm,
            ...initial,
            applicationType:    initial.appTypes           || [],
            societyIdentifier:  initial.societyId          || getSid(),
            towerIdentifier:    initial.towerIdentifier    || "",
            wingIdentifier:     initial.wingIdentifier     || "",
            propertyIdentifier: initial.propertyIdentifier || "",
          }
        : { ...emptyForm, societyIdentifier: getSid() }
    );
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState("");

    // Dropdown data
    const [societies,  setSocieties]  = useState([]);
    const [towers,     setTowers]     = useState([]);
    const [wings,      setWings]      = useState([]);
    const [properties, setProperties] = useState([]);

    const [socLoading,  setSocLoading]  = useState(false);
    const [towLoading,  setTowLoading]  = useState(false);
    const [wingLoading, setWingLoading] = useState(false);
    const [propLoading, setPropLoading] = useState(false);

    // Load societies on mount
    useEffect(() => {
        setSocLoading(true);
        getAllSocietyApi()
            .then(res => setSocieties(extractList(res)))
            .catch(() => {})
            .finally(() => setSocLoading(false));
    }, []);

    // Society change → load towers, reset wings & properties
    useEffect(() => {
        setTowers([]); setWings([]); setProperties([]);
        setForm(f => ({ ...f, towerIdentifier: "", wingIdentifier: "", propertyIdentifier: "" }));
        if (!form.societyIdentifier) return;
        setTowLoading(true);
        getAllTowerApi(form.societyIdentifier)
            .then(res => setTowers(extractList(res)))
            .catch(() => {})
            .finally(() => setTowLoading(false));
    }, [form.societyIdentifier]);

    // Tower change → load wings (GET /tower/:towerId/wings)
    useEffect(() => {
        setWings([]); setProperties([]);
        setForm(f => ({ ...f, wingIdentifier: "", propertyIdentifier: "" }));
        if (!form.towerIdentifier) return;
        setWingLoading(true);
        getTowerWingsApi(form.towerIdentifier)
            .then(res => setWings(extractList(res)))
            .catch(() => {})
            .finally(() => setWingLoading(false));
    }, [form.towerIdentifier]);

    // Wing change → load properties (GET /wing/:wingId/properties)
    useEffect(() => {
        setProperties([]);
        setForm(f => ({ ...f, propertyIdentifier: "" }));
        if (!form.wingIdentifier) return;
        setPropLoading(true);
        getWingPropertiesApi(form.wingIdentifier)
            .then(res => setProperties(extractList(res)))
            .catch(() => {})
            .finally(() => setPropLoading(false));
    }, [form.wingIdentifier]);

    

    const toggleAppType = (type) =>
        setForm(f => ({
            ...f,
            applicationType: f.applicationType.includes(type)
                ? f.applicationType.filter(t => t !== type)
                : [...f.applicationType, type],
        }));

    const sf = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

    const handleSave = async () => {
        setError("");
        if (!form.fullName.trim())      { setError("Full name is required."); return; }
        if (!form.designation)          { setError("Designation is required."); return; }
        if (!form.contactNumber.trim()) { setError("Contact number is required."); return; }
        if (!form.societyIdentifier)    { setError("Society is required."); return; }

        setSaving(true);
        try {
            const payload = {
                societyIdentifier:  form.societyIdentifier,
                towerIdentifier:    form.towerIdentifier    || "",
                wingIdentifier:     form.wingIdentifier     || "",
                propertyIdentifier: form.propertyIdentifier || "",
                fullName:           form.fullName.trim(),
                contactNumber:      form.contactNumber.trim(),
                designation:        form.designation,
                applicationType:    form.applicationType,
            };
            const res = mode === "add"
                ? await addNewCommiteeMemberApi(payload)
                : await updateCommiteeMemberApi(payload, initial.id);

            const ok = res?.data?.status === 1 || res?.status === 200 || res?.status === 201;
            if (ok) {
                onSaved(res?.data?.data || payload, mode);
                onClose();
            } else {
                setError(Array.isArray(res?.data?.message) ? res.data.message.join(", ") : res?.data?.message || "Operation failed.");
            }
        } catch (e) {
            const msg = Array.isArray(e?.response?.data?.message)
                ? e.response.data.message.join(", ")
                : e?.response?.data?.message || e?.message || "Something went wrong.";
            setError(msg);
            console.error("[CommitteeForm]", e?.response?.status, e?.response?.data);
        } finally { setSaving(false); }
    };

    // Build dropdown options
    const socOptions  = societies.map(s  => ({ value: s.societyIdentifier || s.identifier || s.id, label: `${s.societyName || s.name} (${s.societyIdentifier || s.identifier || s.id})` }));
    const towOptions  = towers.map(t    => ({ value: t.towerIdentifier    || t.identifier || t.id, label: `${t.towerName   || t.name} (${t.towerIdentifier    || t.identifier || t.id})` }));
    const wingOptions = wings.map(w     => ({ value: w.wingIdentifier     || w.identifier || w.id, label: `${w.wingName    || w.name} (${w.wingIdentifier     || w.identifier || w.id})` }));
    const propOptions = properties.map(p => ({ value: p.propertyIdentifier|| p.identifier || p.id, label: `${p.propertyName|| p.unit || p.name} (${p.propertyIdentifier || p.identifier || p.id})` }));

    return (
        <div style={{ marginTop: 20, background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
            {/* Header */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: "rgba(0,212,170,0.12)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {mode === "add" ? <Plus size={16} style={{ color: "#00d4aa" }} /> : <Edit2 size={15} style={{ color: "#00d4aa" }} />}
                    </div>
                    <h3 style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 700, margin: 0 }}>
                        {mode === "add" ? "Add Committee Member" : "Edit Committee Member"}
                    </h3>
                </div>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ padding: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>

                    {/* Basic info */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Full Name <span style={{ color: "#ff6b6b" }}>*</span></label>
                        <input value={form.fullName} placeholder="e.g. Mr. Jaydeep Kute"
                            onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Contact Number <span style={{ color: "#ff6b6b" }}>*</span></label>
                        <input value={form.contactNumber} placeholder="10-digit mobile" type="tel"
                            onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))} style={inputStyle} />
                    </div>

                    {/* Designation */}
                    <div style={{ gridColumn: "1 / -1", marginBottom: 14 }}>
                        <label style={labelStyle}>Designation <span style={{ color: "#ff6b6b" }}>*</span></label>
                        <select value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                            style={{ ...inputStyle, cursor: "pointer" }}>
                            <option value="">— Select Designation —</option>
                            {DESIGNATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    {/* Society — dropdown from API */}
                    <div style={{ gridColumn: "1 / -1" }}>
                        <DD label="Society" required value={form.societyIdentifier} onChange={sf("societyIdentifier")}
                            options={socOptions} placeholder="— Select Society —" loading={socLoading} />
                    </div>

                    {/* Tower — loads after society */}
                    <DD label="Tower" value={form.towerIdentifier} onChange={sf("towerIdentifier")}
                        options={towOptions} placeholder="— Select Tower —"
                        loading={towLoading} disabled={!form.societyIdentifier} />

                    {/* Wing — loads after tower */}
                    <DD label="Wing" value={form.wingIdentifier} onChange={sf("wingIdentifier")}
                        options={wingOptions} placeholder="— Select Wing —"
                        loading={wingLoading} disabled={!form.towerIdentifier} />

                    {/* Property — loads after wing */}
                    <div style={{ gridColumn: "1 / -1" }}>
                        <DD label="Property / Flat" value={form.propertyIdentifier} onChange={sf("propertyIdentifier")}
                            options={propOptions} placeholder="— Select Property —"
                            loading={propLoading} disabled={!form.wingIdentifier} />
                    </div>

                    {/* Application Types */}
                    <div style={{ gridColumn: "1 / -1", marginBottom: 14 }}>
                        <label style={labelStyle}>Application Types Handled</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "10px 12px", background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 8 }}>
                            {APPLICATION_TYPE_OPTIONS.map(type => {
                                const selected = form.applicationType.includes(type);
                                return (
                                    <button key={type} type="button" onClick={() => toggleAppType(type)}
                                        style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: selected ? "1px solid #6c63ff" : "1px solid var(--border)", background: selected ? "rgba(108,99,255,0.15)" : "transparent", color: selected ? "#6c63ff" : "#8899aa", transition: "all 0.15s" }}>
                                        {type}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {error && (
                    <div style={{ marginBottom: 14, padding: "8px 12px", background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, color: "#ff6b6b", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                        <AlertCircle size={13} /> {error}
                    </div>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={onClose} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer", fontSize: 13 }}>Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                        style={{ background: saving ? "rgba(0,212,170,0.4)" : "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 22px", color: "#0d1117", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>
                        {saving ? "Saving…" : mode === "add" ? "Add Member" : "Update Member"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CommitteeDashboard() {
    const { committeeMembers, setCommitteeMembers, refetch, loading } = useAppContext();

    const [search,      setSearch]      = useState("");
    const [filterDesig, setFilterDesig] = useState("All");
    const [page,        setPage]        = useState(1);
    const [formMode,    setFormMode]    = useState(null);
    const [editTarget,  setEditTarget]  = useState(null);
    const [deleting,    setDeleting]    = useState(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);


    const filtered = committeeMembers.filter(m => {
        const q = search.toLowerCase();
        const matchSearch =
            (m.fullName    || "").toLowerCase().includes(q) ||
            (m.memberId    || "").toLowerCase().includes(q) ||
            (m.contact     || "").includes(q) ||
            (m.designation || "").toLowerCase().includes(q);
        const matchDesig = filterDesig === "All" || m.designation === filterDesig;
        return matchSearch && matchDesig;
    });
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const handleDelete = async (member) => {
        if (!window.confirm(`Delete "${member.fullName}"?`)) return;
        setDeleting(member.memberId);
        try {
            await deleteCommiteeMemberApi(member.id);
            setCommitteeMembers(prev => prev.filter(m => m.id !== member.id));
        } catch (e) {
            alert(Array.isArray(e?.response?.data?.message) ? e.response.data.message.join(", ") : e?.response?.data?.message || "Delete failed.");
        } finally { setDeleting(null); }
    };

    const handleSaved = (data, mode) => {
        if (mode === "add") {
            // ✅ FIX 1 — add mode mein tower/wing/property bhi store karo
            setCommitteeMembers(prev => [{
                id:                 data.committeeMemberId         || `cm-${Date.now()}`,
                memberId:           data.committeeMemberIdentifier || data.committeeMemberId || `CMR-${Date.now()}`,
                fullName:           data.fullName       || "",
                contact:            data.contactNumber  || "",
                designation:        data.designation    || "",
                appTypes:           Array.isArray(data.applicationType) ? data.applicationType : [],
                societyId:          data.societyIdentifier  || "",
                towerIdentifier:    data.towerIdentifier    || "",
                wingIdentifier:     data.wingIdentifier     || "",
                propertyIdentifier: data.propertyIdentifier || "",
            }, ...prev]);
        } else {
            // ✅ FIX 2 — edit mode mein tower/wing/property bhi update karo
            setCommitteeMembers(prev => prev.map(m =>
                m.id === editTarget.id
                    ? {
                        ...m,
                        fullName:           data.fullName,
                        contact:            data.contactNumber,
                        designation:        data.designation,
                        appTypes:           data.applicationType        || [],
                        towerIdentifier:    data.towerIdentifier        || "",
                        wingIdentifier:     data.wingIdentifier         || "",
                        propertyIdentifier: data.propertyIdentifier     || "",
                      }
                    : m
            ));
        }
        setFormMode(null); setEditTarget(null);
    };

    const openEdit = (member) => {
        setEditTarget(member);
        setFormMode("edit");
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
    };

    const openAdd = () => { setEditTarget(null); setFormMode(f => f === "add" ? null : "add"); };

    const initials = (name) => {
        if (!name) return "?";
        return name.replace(/^(Mr|Mrs|Ms|Dr)\.?\s*/i, "").trim().split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
    };

    const desigOptions = ["All", ...Array.from(new Set(committeeMembers.map(m => m.designation).filter(Boolean)))];

    return (
        <div style={{ padding: "0 0 40px" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 700, margin: 0 }}>Committee Members</h2>
                    <p style={{ color: "#8899aa", fontSize: 13, margin: "4px 0 0" }}>Manage society committee members and their designations</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={refetch} disabled={loading}
                        style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", color: "#8899aa", cursor: loading ? "not-allowed" : "pointer", fontSize: 13 }}>
                        <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> Refresh
                    </button>
                    <button onClick={openAdd}
                        style={{ display: "flex", alignItems: "center", gap: 6, background: formMode === "add" ? "rgba(0,212,170,0.15)" : "linear-gradient(135deg,#00d4aa,#00b4d8)", border: formMode === "add" ? "1px solid #00d4aa" : "none", borderRadius: 8, padding: "8px 16px", color: formMode === "add" ? "#00d4aa" : "#0d1117", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                        <Plus size={14} /> {formMode === "add" ? "Cancel" : "Add Member"}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
                {[
                    { label: "Total Members",    value: committeeMembers.length, color: "#6c63ff", icon: Users },
                    { label: "Designations",     value: desigOptions.length - 1, color: "#00d4aa", icon: Shield },
                    { label: "Active Roles",     value: committeeMembers.filter(m => m.appTypes?.length > 0).length, color: "#ffb347", icon: BadgeCheck },
                    { label: "App Types Covered",value: Array.from(new Set(committeeMembers.flatMap(m => m.appTypes || []))).length, color: "#00b4d8", icon: Tag },
                ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 44, height: 44, background: `${color}18`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Icon size={20} style={{ color }} />
                        </div>
                        <div>
                            <div style={{ color: "#8899aa", fontSize: 12, marginBottom: 2 }}>{label}</div>
                            <div style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>{value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Form */}
            {formMode && (
                <MemberFormPanel
                    mode={formMode}
                    initial={editTarget}
                    onClose={() => { setFormMode(null); setEditTarget(null); }}
                    onSaved={handleSaved}
                />
            )}

            {/* Table */}
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginTop: formMode ? 20 : 0 }}>
                <div style={{ padding: "16px 20px", display: "flex", gap: 12, flexWrap: "wrap", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: "1 1 220px" }}>
                        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }} />
                        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search name, ID, phone, designation…"
                            style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <select value={filterDesig} onChange={e => { setFilterDesig(e.target.value); setPage(1); }}
                        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}>
                        {desigOptions.map(d => <option key={d} value={d}>{d === "All" ? "All Designations" : d}</option>)}
                    </select>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                                {["Member", "ID", "Contact", "Designation", "Handles", "Actions"].map(h => (
                                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", color: "#8899aa", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px 20px", color: "#8899aa", fontSize: 14 }}>No committee members found.</td></tr>
                            ) : paged.map((m, idx) => (
                                <tr key={m.memberId || idx}
                                    style={{ borderBottom: "1px solid var(--border)" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                    <td style={{ padding: "12px 16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{ width: 36, height: 36, background: "rgba(108,99,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#6c63ff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                                                {initials(m.fullName)}
                                            </div>
                                            <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}>{m.fullName || "—"}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "12px 16px", color: "#8899aa", fontSize: 12, fontFamily: "monospace" }}>{m.memberId}</td>
                                    <td style={{ padding: "12px 16px" }}>
                                        {m.contact
                                            ? <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-primary)", fontSize: 13 }}><Phone size={11} style={{ color: "#8899aa" }} /> {m.contact}</div>
                                            : <span style={{ color: "#556677" }}>—</span>}
                                    </td>
                                    <td style={{ padding: "12px 16px" }}><DesigBadge designation={m.designation} /></td>
                                    <td style={{ padding: "12px 16px", maxWidth: 260 }}>
                                        {m.appTypes?.length > 0
                                            ? m.appTypes.map(t => <AppTypeTag key={t} label={t} />)
                                            : <span style={{ color: "#556677", fontSize: 12 }}>None assigned</span>}
                                    </td>
                                    <td style={{ padding: "12px 16px" }}>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button onClick={() => openEdit(m)} title="Edit"
                                                style={{ background: "rgba(0,212,170,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#00d4aa", cursor: "pointer" }}>
                                                <Edit2 size={12} />
                                            </button>
                                            <button onClick={() => handleDelete(m)} title="Delete" disabled={deleting === m.memberId}
                                                style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#ff6b6b", cursor: deleting === m.memberId ? "not-allowed" : "pointer", opacity: deleting === m.memberId ? 0.5 : 1 }}>
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={p => setPage(p)} />
            </div>
        </div>
    );
}