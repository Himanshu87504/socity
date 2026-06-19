// @ts-nocheck
// ============================================================
// ChargeMasterDashboard.jsx
// Charge Master module — backend connected with cascading dropdowns
// Society → Tower → Wing → Property → Narration (all auto-fetched)
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Edit2, Trash2, X, Save, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  AlertCircle, CheckCircle, Loader, FileText, DollarSign,
  Calendar, Layers, TrendingUp, Eye, ToggleLeft, ToggleRight,
  ChevronDown, Info,
} from "lucide-react";
import {
  addChargeMasterApi,
  getAllChargeMasterApi,
  getChargesOfSocietyApi,
  updateChargeMasterApi,
  deleteChargeMasterApi,
} from "../api/chargemaster-api";
import { getAllSocietyApi, getTowersOfSocietyApi, getWingsOfSocietyApi, getPropertiesOfSocietyApi } from "../api/society-api";
import { getWingsOfTowerApi } from "../api/tower-api";
import { getPropertiesOfWing } from "../api/wing-api";
import { getNarrationAndAreaOfProperty } from "../api/property-api";

// ── Helpers ─────────────────────────────────────────────────────────
const getSocietyId = () => {
  const direct = localStorage.getItem("society_identifier") ||
                 localStorage.getItem("societyId");
  if (direct) return direct;
  // Fallback: read from currentUser object stored after login
  try {
    const cu = JSON.parse(localStorage.getItem("currentUser") || "{}");
    return cu.societyIdentifier || cu.societyId || cu.society_identifier || "";
  } catch { return ""; }
};

const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
};
const fmtCurrency = (n) =>
  n == null || n === "" ? "—" : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// Extract array from various API response shapes
const extractArr = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.charges)) return d.charges;
  if (Array.isArray(d?.chargeMasters)) return d.chargeMasters;
  if (Array.isArray(d?.result)) return d.result;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.list)) return d.list;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.rows)) return d.rows;
  if (Array.isArray(d?.towers)) return d.towers;
  if (Array.isArray(d?.wings)) return d.wings;
  if (Array.isArray(d?.properties)) return d.properties;
  if (Array.isArray(d?.societies)) return d.societies;
  if (Array.isArray(d?.narrations)) return d.narrations;
  if (d !== undefined && d !== null) {
    console.warn("[ChargeMaster] extractArr: unrecognised shape — keys:", Object.keys(d));
  }
  return [];
};

// ── Constants ────────────────────────────────────────────────────────
const ALL_SOCIETIES = "__all__"; // sentinel value for the society selector
const CHARGE_MASTER_TYPES = ["Property", "Tower", "Wing", "Society"];
const CHARGE_TYPES = ["Additional Bill", "Maintenance"];
const BILLING_TYPES = ["PSF", "Lumpsum"];
const BILLING_FREQUENCIES = ["One-time", "Monthly", "Quarterly", "Half-Yearly", "Annually"];
const PER_PAGE = 10;

const BILLING_COLORS = { PSF: "#00d4aa", Lumpsum: "#6c63ff" };
const TYPE_COLORS = {
  "Additional Bill": "#00b4d8", Maintenance: "#00d4aa",
};

// ── Shared UI ────────────────────────────────────────────────────────
const Badge = ({ label, color = "#00d4aa" }) => (
  <span style={{ background: `${color}18`, color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{label}</span>
);

const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: "#00d4aa", error: "#ff6b6b", info: "#6c63ff" };
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: "var(--bg-card)", border: `1px solid ${colors[type]}`, borderRadius: 12, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", minWidth: 260, animation: "slideIn 0.25s ease" }}>
      {type === "success" ? <CheckCircle size={16} color="#00d4aa"/> : <AlertCircle size={16} color="#ff6b6b"/>}
      <span style={{ color: "var(--text-primary)", fontSize: 13, flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}><X size={14}/></button>
    </div>
  );
};

const Pagination = ({ page, total, perPage, onChange }) => {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const vis = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) vis.push(i);
  const btn = (onClick, disabled, child) => (
    <button onClick={onClick} disabled={disabled} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: disabled ? "#556677" : "#8899aa", cursor: disabled ? "not-allowed" : "pointer" }}>{child}</button>
  );
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
      <span style={{ color: "#8899aa", fontSize: 12 }}>{total === 0 ? "No records" : `${Math.min((page-1)*perPage+1,total)}–${Math.min(page*perPage,total)} of ${total}`}</span>
      <div style={{ display: "flex", gap: 4 }}>
        {btn(() => onChange(1), page===1, <ChevronsLeft size={12}/>)}
        {btn(() => onChange(page-1), page===1, <ChevronLeft size={12}/>)}
        {vis.map(p => <button key={p} onClick={() => onChange(p)} style={{ background: p===page?"#00d4aa":"none", border: `1px solid ${p===page?"#00d4aa":"var(--border)"}`, borderRadius: 6, padding: "4px 10px", color: p===page?"#000":"#8899aa", fontWeight: p===page?700:400, cursor: "pointer", fontSize: 12, minWidth: 30 }}>{p}</button>)}
        {btn(() => onChange(page+1), page===pages, <ChevronRight size={12}/>)}
        {btn(() => onChange(pages), page===pages, <ChevronsRight size={12}/>)}
      </div>
    </div>
  );
};

// ── Styled inputs ────────────────────────────────────────────────────
const iStyle = { width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" };

// Searchable Dropdown Component
function SearchDropdown({ label, required, value, onChange, options, loading, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = React.useRef(null);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(q.toLowerCase()) ||
    o.value.toLowerCase().includes(q.toLowerCase())
  );
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{ marginBottom: 14 }} ref={ref}>
      <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 5, fontWeight: 500 }}>
        {label}{required && <span style={{ color: "#ff6b6b" }}> *</span>}
      </label>
      <div style={{ position: "relative" }}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => { if (!disabled) { setOpen(o => !o); setQ(""); } }}
          style={{
            ...iStyle, textAlign: "left", cursor: disabled ? "not-allowed" : "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            opacity: disabled ? 0.5 : 1,
            background: selected ? "rgba(0,212,170,0.06)" : "var(--bg-surface)",
            border: selected ? "1px solid rgba(0,212,170,0.3)" : "1px solid var(--border-strong)",
          }}
        >
          <span style={{ color: selected ? "var(--text-primary)" : "#556677", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {loading ? "Fetching..." : selected ? selected.label : placeholder || "Select..."}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {loading && <Loader size={12} color="#8899aa" style={{ animation: "spin 1s linear infinite" }}/>}
            {!loading && value && (
              <span onClick={(e) => { e.stopPropagation(); onChange(""); }} style={{ color: "#8899aa", cursor: "pointer", fontSize: 12, padding: "0 2px" }}>✕</span>
            )}
            <ChevronDown size={12} color="#8899aa" style={{ transform: open ? "rotate(180deg)" : "none", transition: "0.2s" }}/>
          </div>
        </button>

        {open && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 10, zIndex: 500, boxShadow: "0 12px 40px rgba(0,0,0,0.5)", overflow: "hidden" }}>
            <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>
              <input
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search..."
                style={{ ...iStyle, padding: "6px 10px", fontSize: 12 }}
              />
            </div>
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "12px 14px", color: "#556677", fontSize: 12, textAlign: "center" }}>No options found</div>
              ) : filtered.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); setQ(""); }}
                  style={{
                    width: "100%", textAlign: "left", background: o.value === value ? "rgba(0,212,170,0.1)" : "none",
                    border: "none", padding: "10px 14px", cursor: "pointer",
                    color: o.value === value ? "#00d4aa" : "var(--text-primary)", fontSize: 13,
                    display: "flex", flexDirection: "column", gap: 2,
                    borderBottom: "1px solid var(--border)",
                  }}
                  onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = "none"; }}
                >
                  <span style={{ fontWeight: 500 }}>{o.label}</span>
                  {o.sub && <span style={{ fontSize: 11, color: "#8899aa" }}>{o.sub}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Field wrapper ────────────────────────────────────────────────────
const Field = ({ label, required, error, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 5, fontWeight: 500 }}>
      {label}{required && <span style={{ color: "#ff6b6b" }}> *</span>}
    </label>
    {children}
    {error && <span style={{ color: "#ff6b6b", fontSize: 11, marginTop: 3, display: "block" }}>{error}</span>}
  </div>
);

const Row2 = ({ children }) => <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;

// ── Charge Modal (with cascading dropdowns) ──────────────────────────
const EMPTY_FORM = {
  chargeName: "", chargeMasterType: "Property", chargeType: "Additional Bill",
  billingType: "Lumpsum", societyIdentifier: getSocietyId(), towerIdentifier: "",
  wingIdentifier: "", propertyIdentifier: "", amount: 0, totalAmount: 0,
  interestApplicable: false, interestStartDate: "", dueDate: "",
  psfRate: 0, rateOfInterest: "", billingFrequency: "Monthly",
  startDate: "", endDate: "", narration: "", gst: 0,
};

function ChargeModal({ mode, initial, onClose, onSaved, toast, defaultSocietyId }) {
  const [form, setForm] = useState(() => {
    if (initial) return { ...EMPTY_FORM, ...initial };
    return { ...EMPTY_FORM, societyIdentifier: defaultSocietyId || getSocietyId() };
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Dropdown option lists
  const [societies, setSocieties]   = useState([]);
  const [towers, setTowers]         = useState([]);
  const [wings, setWings]           = useState([]);
  const [properties, setProperties] = useState([]);
  const [narrations, setNarrations] = useState([]);

  // Loading states per field
  const [loadSoc, setLoadSoc] = useState(false);
  const [loadTow, setLoadTow] = useState(false);
  const [loadWing, setLoadWing] = useState(false);
  const [loadProp, setLoadProp] = useState(false);
  const [loadNar, setLoadNar] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };

  // ── 1. Fetch societies on mount ──────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadSoc(true);
      try {
        const res = await getAllSocietyApi();
        const arr = extractArr(res);
        setSocieties(arr.map(s => ({
          value: s.societyIdentifier || s.identifier || s.id || "",
          label: s.societyName || s.name || s.societyIdentifier || "",
          sub: s.address || s.city || "",
        })).filter(o => o.value));
      } catch { /* silent — user can type manually */ }
      finally { setLoadSoc(false); }
    })();
  }, []);

  // ── 2. Fetch towers when society changes ─────────────────────────
  useEffect(() => {
    setTowers([]); setWings([]); setProperties([]); setNarrations([]);
    if (!form.societyIdentifier) return;
    (async () => {
      setLoadTow(true);
      try {
        const res = await getTowersOfSocietyApi(form.societyIdentifier);
        const arr = extractArr(res);
        setTowers(arr.map(t => ({
          value: t.towerIdentifier || t.identifier || t.id || "",
          label: t.towerName || t.name || t.towerIdentifier || "",
          sub: t.floors ? `${t.floors} floors` : "",
        })).filter(o => o.value));
      } catch { }
      finally { setLoadTow(false); }
    })();
  }, [form.societyIdentifier]);

  // ── 3. Fetch wings when tower changes ───────────────────────────
  useEffect(() => {
    setWings([]); setProperties([]); setNarrations([]);
    if (!form.towerIdentifier) return;
    (async () => {
      setLoadWing(true);
      try {
        const res = await getWingsOfTowerApi(form.towerIdentifier);
        const arr = extractArr(res);
        setWings(arr.map(w => ({
          value: w.wingIdentifier || w.identifier || w.id || "",
          label: w.wingName || w.name || w.wingIdentifier || "",
          sub: w.floors ? `${w.floors} floors` : "",
        })).filter(o => o.value));
      } catch { }
      finally { setLoadWing(false); }
    })();
  }, [form.towerIdentifier]);

  // ── 4. Fetch properties when wing changes ───────────────────────
  useEffect(() => {
    setProperties([]); setNarrations([]);
    if (!form.wingIdentifier) return;
    (async () => {
      setLoadProp(true);
      try {
        const res = await getPropertiesOfWing(form.wingIdentifier);
        const arr = extractArr(res);
        setProperties(arr.map(p => ({
          value: p.propertyIdentifier || p.identifier || p.id || "",
          label: p.propertyNumber || p.unitNumber || p.flatNo || p.propertyIdentifier || "",
          sub: p.type || p.propertyType || p.bhkType || "",
        })).filter(o => o.value));
      } catch { }
      finally { setLoadProp(false); }
    })();
  }, [form.wingIdentifier]);

  // ── 5. Fetch narrations when property changes ────────────────────
  useEffect(() => {
    setNarrations([]);
    const sid = form.societyIdentifier || getSocietyId();
    if (!sid) return;
    (async () => {
      setLoadNar(true);
      try {
        const res = await getNarrationAndAreaOfProperty(sid, { type: "narration", narration: "" });
        const arr = extractArr(res);
        // Response may be string[] or object[]
        if (arr.length > 0) {
          const opts = typeof arr[0] === "string"
            ? arr.map(n => ({ value: n, label: n }))
            : arr.map(n => ({ value: n.narration || n.value || n, label: n.narration || n.label || n }));
          setNarrations(opts.filter(o => o.value));
        }
      } catch { }
      finally { setLoadNar(false); }
    })();
  }, [form.propertyIdentifier, form.societyIdentifier]);

  // ── Validate & Submit ────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.chargeName.trim()) e.chargeName = "Charge name is required";
    if (!form.societyIdentifier) e.societyIdentifier = "Society select karo (ya login dobara karo)";
    if (form.billingType === "PSF" && (!form.psfRate || Number(form.psfRate) <= 0)) e.psfRate = "PSF rate must be > 0";
    if (form.billingType === "Lumpsum" && (!form.totalAmount || Number(form.totalAmount) <= 0)) e.totalAmount = "Total amount must be > 0";
    if (form.interestApplicable && !form.interestStartDate) e.interestStartDate = "Interest start date is required";
    if (!form.dueDate) e.dueDate = "Due date is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);
    try {
      // Build payload matching exact backend contract (from Postman)
      const resolvedSocietyId = form.societyIdentifier || getSocietyId();
      console.log("[ChargeMaster] Submit — societyIdentifier:", resolvedSocietyId);
      if (!resolvedSocietyId) {
        toast("Society identifier nahi mila. Pehle society select karo ya dobara login karo.", "error");
        setSaving(false);
        return;
      }
      // ── Payload — exact match to Postman contract ───────────
      const payload = {
        chargeName:         form.chargeName.trim(),
        chargeMasterType:   form.chargeMasterType,
        chargeType:         form.chargeType,
        billingType:        form.billingType,
        societyIdentifier:  resolvedSocietyId,
        towerIdentifier:    form.towerIdentifier    || "",
        wingIdentifier:     form.wingIdentifier     || "",
        propertyIdentifier: form.propertyIdentifier || "",
        billingFrequency:   form.billingFrequency,
        dueDate:            form.dueDate            ? form.dueDate.substring(0, 10)            : "",
        startDate:          form.startDate          ? form.startDate.substring(0, 10)          : "",
        endDate:            form.endDate            ? form.endDate.substring(0, 10)            : "",
        interestApplicable: form.interestApplicable,
        interestStartDate:  (form.interestApplicable && form.interestStartDate)
                              ? form.interestStartDate.substring(0, 10) : "",
        amount:             Number(form.amount)          || 0,
        totalAmount:        Number(form.totalAmount)     || 0,
        psfRate:            Number(form.psfRate)         || 0,
        totalPsfRate:       Number(form.psfRate)         || 0,
        rateOfInterest:     Number(form.rateOfInterest)  || 0,
        gst:                Number(form.gst)             || 0,
        narration:          form.narration               || "",
      };
      if (mode === "add") {
        await addChargeMasterApi(payload);
        toast("Charge created successfully", "success");
      } else {
        await updateChargeMasterApi(payload, initial.id);
        toast("Charge updated successfully", "success");
      }
      onSaved();
    } catch (err) {
      const serverMsg = err?.response?.data?.message;
      const msg = Array.isArray(serverMsg)
        ? serverMsg.map(m => m.message || m).join(", ")
        : serverMsg || err?.message || "Operation failed";
      toast(msg, "error");
    } finally { setSaving(false); }
  };

  const secHead = (label, color) => (
    <p style={{ color, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 12, marginTop: 4, textTransform: "uppercase" }}>{label}</p>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "92vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,212,170,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {mode === "add" ? <Plus size={16} color="#00d4aa"/> : <Edit2 size={16} color="#00d4aa"/>}
            </div>
            <h3 style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 700 }}>
              {mode === "add" ? "Create New Charge" : "Edit Charge"}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}><X size={18}/></button>
        </div>

        <div style={{ padding: 24 }}>

          {/* ── Section 1: Basic Info ── */}
          {secHead("Basic Information", "#00d4aa")}
          <Field label="Charge Name" required error={errors.chargeName}>
            <input style={iStyle} value={form.chargeName} onChange={e => set("chargeName", e.target.value)} placeholder="e.g. Monthly Maintenance"/>
          </Field>
          <Row2>
            <Field label="Charge Master Type">
              <select style={{ ...iStyle, cursor: "pointer" }} value={form.chargeMasterType} onChange={e => set("chargeMasterType", e.target.value)}>
                {CHARGE_MASTER_TYPES.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Charge Type">
              <select style={{ ...iStyle, cursor: "pointer" }} value={form.chargeType} onChange={e => set("chargeType", e.target.value)}>
                {CHARGE_TYPES.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
          </Row2>

          {/* ── Section 2: Property Identifiers (cascading dropdowns) ── */}
          {secHead("Property Identifiers", "#00b4d8")}
          <div style={{ background: "rgba(0,180,216,0.04)", border: "1px solid rgba(0,180,216,0.15)", borderRadius: 10, padding: "14px 16px", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Info size={13} color="#00b4d8"/>
              <span style={{ color: "#8899aa", fontSize: 11 }}>Select Society first — Tower, Wing, Property will auto-load in sequence</span>
            </div>

            {/* Society */}
            <Field label="Society" required error={errors.societyIdentifier}>
              <SearchDropdown
                label=""
                value={form.societyIdentifier}
                onChange={v => { set("societyIdentifier", v); set("towerIdentifier", ""); set("wingIdentifier", ""); set("propertyIdentifier", ""); set("narration", ""); }}
                options={societies}
                loading={loadSoc}
                placeholder="Select society..."
              />
            </Field>

            {/* Tower */}
            <SearchDropdown
              label="Tower"
              value={form.towerIdentifier}
              onChange={v => { set("towerIdentifier", v); set("wingIdentifier", ""); set("propertyIdentifier", ""); set("narration", ""); }}
              options={towers}
              loading={loadTow}
              placeholder={form.societyIdentifier ? "Select tower..." : "Select society first"}
              disabled={!form.societyIdentifier}
            />

            {/* Wing */}
            <SearchDropdown
              label="Wing"
              value={form.wingIdentifier}
              onChange={v => { set("wingIdentifier", v); set("propertyIdentifier", ""); set("narration", ""); }}
              options={wings}
              loading={loadWing}
              placeholder={form.towerIdentifier ? "Select wing..." : "Select tower first"}
              disabled={!form.towerIdentifier}
            />

            {/* Property */}
            <SearchDropdown
              label="Property / Flat"
              value={form.propertyIdentifier}
              onChange={v => { set("propertyIdentifier", v); set("narration", ""); }}
              options={properties}
              loading={loadProp}
              placeholder={form.wingIdentifier ? "Select property..." : "Select wing first"}
              disabled={!form.wingIdentifier}
            />
          </div>

          {/* ── Narration (from API) ── */}
          <div style={{ marginTop: 12 }}>
            <SearchDropdown
              label="Narration"
              value={form.narration}
              onChange={v => set("narration", v)}
              options={narrations}
              loading={loadNar}
              placeholder="Select or type narration..."
              disabled={false}
            />
            {/* allow manual entry fallback */}
            <div style={{ marginTop: -8, marginBottom: 14 }}>
              <input
                style={{ ...iStyle, fontSize: 12 }}
                value={form.narration}
                onChange={e => set("narration", e.target.value)}
                placeholder="Or type custom narration (e.g. 1 BHK, 2 BHK...)"
              />
            </div>
          </div>

          {/* ── Section 3: Billing ── */}
          {secHead("Billing Details", "#6c63ff")}
          <Row2>
            <Field label="Billing Type">
              <select style={{ ...iStyle, cursor: "pointer" }} value={form.billingType} onChange={e => set("billingType", e.target.value)}>
                {BILLING_TYPES.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Billing Frequency">
              <select style={{ ...iStyle, cursor: "pointer" }} value={form.billingFrequency} onChange={e => set("billingFrequency", e.target.value)}>
                {BILLING_FREQUENCIES.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
          </Row2>
          <Row2>
            {form.billingType === "PSF" ? (
              <Field label="PSF Rate (₹/sqft)" required error={errors.psfRate}>
                <input style={iStyle} type="number" min="0" step="0.01" value={form.psfRate} onChange={e => set("psfRate", e.target.value)} placeholder="e.g. 2.5"/>
              </Field>
            ) : (
              <Field label="Total Amount (₹)" required error={errors.totalAmount}>
                <input style={iStyle} type="number" min="0" value={form.totalAmount} onChange={e => set("totalAmount", e.target.value)} placeholder="e.g. 42000"/>
              </Field>
            )}
            <Field label="Amount (₹)">
              <input style={iStyle} type="number" min="0" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="e.g. 1700"/>
            </Field>
          </Row2>
          <Field label="Rate of Interest (%)">
            <input style={iStyle} type="number" min="0" step="0.1" value={form.rateOfInterest} onChange={e => set("rateOfInterest", e.target.value)} placeholder="e.g. 2 (optional)"/>
          </Field>

          {/* ── Section 4: Dates ── */}
          {secHead("Dates & Schedule", "#ffb347")}
          <Row2>
            <Field label="Start Date">
              <input style={iStyle} type="date" value={form.startDate ? form.startDate.substring(0,10) : ""} onChange={e => set("startDate", e.target.value)}/>
            </Field>
            <Field label="End Date">
              <input style={iStyle} type="date" value={form.endDate ? form.endDate.substring(0,10) : ""} onChange={e => set("endDate", e.target.value)}/>
            </Field>
          </Row2>
          <Row2>
            <Field label="Due Date" required error={errors.dueDate}>
              <input style={iStyle} type="date" value={form.dueDate ? form.dueDate.substring(0,10) : ""} onChange={e => set("dueDate", e.target.value)}/>
            </Field>
            <Field label="Interest Applicable">
              <button type="button" onClick={() => set("interestApplicable", !form.interestApplicable)} style={{ display: "flex", alignItems: "center", gap: 8, background: form.interestApplicable ? "rgba(0,212,170,0.1)" : "var(--bg-surface)", border: `1px solid ${form.interestApplicable ? "#00d4aa" : "var(--border-strong)"}`, borderRadius: 8, padding: "9px 14px", color: form.interestApplicable ? "#00d4aa" : "#8899aa", cursor: "pointer", fontSize: 13, fontWeight: 600, width: "100%" }}>
                {form.interestApplicable ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                {form.interestApplicable ? "Applicable" : "Not Applicable"}
              </button>
            </Field>
          </Row2>
          {form.interestApplicable && (
            <Field label="Interest Start Date">
              <input style={iStyle} type="date" value={form.interestStartDate ? form.interestStartDate.substring(0,10) : ""} onChange={e => set("interestStartDate", e.target.value)}/>
            </Field>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 10, position: "sticky", bottom: 0, background: "var(--bg-card)" }}>
          <button onClick={onClose} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "9px 20px", color: "var(--text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ background: saving ? "#334" : "linear-gradient(135deg, #00d4aa, #00b4d8)", border: "none", borderRadius: 8, padding: "9px 24px", color: saving ? "#8899aa" : "#0d1117", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            {saving ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }}/> : <Save size={14}/>}
            {saving ? "Saving..." : mode === "add" ? "Create Charge" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── View Modal ───────────────────────────────────────────────────────
function ViewModal({ charge, onClose }) {
  const R = ({ label, value, accent }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "#8899aa", fontSize: 12, minWidth: 160 }}>{label}</span>
      <span style={{ color: accent || "var(--text-primary)", fontSize: 13, fontWeight: accent ? 600 : 400, textAlign: "right" }}>{value || "—"}</span>
    </div>
  );
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "85vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
          <div><h3 style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 700 }}>{charge.chargeName}</h3><p style={{ color: "#8899aa", fontSize: 12 }}>{charge.chargeNumber}</p></div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}><X size={18}/></button>
        </div>
        <div style={{ padding: 24 }}>
          <R label="Charge Number" value={charge.chargeNumber}/>
          <R label="Charge Master Type" value={charge.chargeMasterType}/>
          <R label="Charge Type" value={charge.chargeType} accent={TYPE_COLORS[charge.chargeType]}/>
          <R label="Billing Type" value={charge.billingType} accent={BILLING_COLORS[charge.billingType]}/>
          <R label="Billing Frequency" value={charge.billingFrequency}/>
          {charge.billingType === "PSF" && <R label="PSF Rate" value={charge.psfRate ? `₹${charge.psfRate}/sqft` : null}/>}
          {charge.billingType === "Lumpsum" && <R label="Total Amount" value={fmtCurrency(charge.totalAmount)}/>}
          <R label="Amount" value={fmtCurrency(charge.amount)}/>
          {charge.rateOfInterest != null && charge.rateOfInterest !== "" && <R label="Rate of Interest" value={`${charge.rateOfInterest}%`}/>}
          <R label="Due Date" value={fmtDate(charge.dueDate)}/>
          <R label="Start Date" value={fmtDate(charge.startDate)}/>
          <R label="End Date" value={fmtDate(charge.endDate)}/>
          <R label="Interest Applicable" value={charge.interestApplicable ? "Yes" : "No"} accent={charge.interestApplicable ? "#ffb347" : null}/>
          {charge.interestApplicable && <R label="Interest Start Date" value={fmtDate(charge.interestStartDate)}/>}
          <R label="Narration" value={charge.narration}/>
          <R label="Society ID" value={charge.societyIdentifier}/>
          <R label="Tower ID" value={charge.towerIdentifier}/>
          <R label="Wing ID" value={charge.wingIdentifier}/>
          <R label="Property ID" value={charge.propertyIdentifier}/>
          <R label="Created At" value={fmtDate(charge.createdAt)}/>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ───────────────────────────────────────────────────
function DeleteConfirm({ charge, onClose, onConfirm, deleting }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid rgba(255,107,107,0.4)", borderRadius: 16, width: "100%", maxWidth: 400, padding: 28 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,107,107,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Trash2 size={22} color="#ff6b6b"/>
        </div>
        <h3 style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Delete Charge</h3>
        <p style={{ color: "#8899aa", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
          Are you sure you want to delete <strong style={{ color: "var(--text-primary)" }}>{charge.chargeName}</strong>? This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "9px 0", color: "var(--text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} disabled={deleting} style={{ flex: 1, background: deleting ? "#334" : "#ff6b6b", border: "none", borderRadius: 8, padding: "9px 0", color: "#fff", fontSize: 13, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {deleting ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }}/> : <Trash2 size={14}/>}
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────
const MOCK_CHARGES = [
  { id:"1016", chargeNumber:"CH-0007602", chargeName:"New charge with PSF+ 1 BHK narration2", chargeMasterType:"Property", chargeType:"Additional Bill", billingType:"PSF", interestApplicable:false, societyIdentifier:"syba0328", towerIdentifier:"trbdab98", wingIdentifier:"e7kvlhut", propertyIdentifier:"py8fa1b4", amount:0, dueDate:"2025-05-20", billingFrequency:"Monthly", startDate:"2025-05-01T00:00:00.000Z", endDate:"2026-07-01T00:00:00.000Z", psfRate:2.5, narration:"1 BHK", gst:18, createdAt:"2026-06-08T12:12:50.000Z", isDeleted:false },
  { id:"1015", chargeNumber:"CH-0007601", chargeName:"Monthly Maintenance Society", chargeMasterType:"Society", chargeType:"Maintenance", billingType:"Lumpsum", interestApplicable:true, societyIdentifier:"syba0328", towerIdentifier:"", wingIdentifier:"", propertyIdentifier:"", amount:4500, interestStartDate:"2025-06-15", dueDate:"2025-06-05", billingFrequency:"Monthly", startDate:"2025-01-01T00:00:00.000Z", endDate:"2026-12-31T00:00:00.000Z", psfRate:0, narration:"General maintenance", gst:18, createdAt:"2026-05-20T08:00:00.000Z", isDeleted:false },
  { id:"1014", chargeNumber:"CH-0007600", chargeName:"Parking Slot A-12", chargeMasterType:"Property", chargeType:"Parking", billingType:"Lumpsum", interestApplicable:false, societyIdentifier:"syba0328", towerIdentifier:"trbdab98", wingIdentifier:"e7kvlhut", propertyIdentifier:"py8fa1b5", amount:1500, dueDate:"2025-06-10", billingFrequency:"Monthly", startDate:"2025-01-01T00:00:00.000Z", endDate:"2026-12-31T00:00:00.000Z", psfRate:0, narration:"Covered parking", gst:0, createdAt:"2026-05-15T09:00:00.000Z", isDeleted:false },
  { id:"1013", chargeNumber:"CH-0007599", chargeName:"Water Charges Q2", chargeMasterType:"Wing", chargeType:"Water", billingType:"PSF", interestApplicable:false, societyIdentifier:"syba0328", towerIdentifier:"trbdab98", wingIdentifier:"e7kvlhut", propertyIdentifier:"", amount:0, dueDate:"2025-06-20", billingFrequency:"Quarterly", startDate:"2025-04-01T00:00:00.000Z", endDate:"2025-06-30T00:00:00.000Z", psfRate:1.2, narration:"Q2 water charges", gst:18, createdAt:"2026-04-01T10:00:00.000Z", isDeleted:false },
];

export default function ChargeMasterDashboard() {
  const [charges, setCharges]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [apiError, setApiError]   = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  // ── Society scope (All Societies vs a specific society) ───────────
  // Starts with NOTHING selected — no charges are fetched or shown until
  // the user explicitly picks "All Societies" or a specific society from
  // the dropdown below.
  const [selectedSociety, setSelectedSociety] = useState("");
  const [societyOptions, setSocietyOptions]   = useState([]);
  const [loadingSocieties, setLoadingSocieties] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingSocieties(true);
      try {
        const res = await getAllSocietyApi();
        const arr = extractArr(res);
        setSocietyOptions(arr.map(s => ({
          value: s.societyIdentifier || s.identifier || s.id || "",
          label: s.societyName || s.name || s.societyIdentifier || "",
        })).filter(o => o.value));
      } catch { /* selector still works for "All Societies" without the list */ }
      finally { setLoadingSocieties(false); }
    })();
  }, []);

  // Lookup so the table can show a society name instead of a raw id
  const societyNameMap = React.useMemo(() => {
    const m = {};
    societyOptions.forEach(o => { m[o.value] = o.label; });
    return m;
  }, [societyOptions]);
  const societySelectOptions = React.useMemo(
    () => [{ value: ALL_SOCIETIES, label: "All Societies" }, ...societyOptions],
    [societyOptions]
  );

  const [search, setSearch]               = useState("");
  const [filterType, setFilterType]       = useState("All");
  const [filterBilling, setFilterBilling] = useState("All");
  const [page, setPage]                   = useState(1);

  const [modal, setModal]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast]       = useState(null);
  const showToast = (msg, type = "success") => setToast({ msg, type });

  const fetchCharges = useCallback(async () => {
    if (!selectedSociety) {
      // Nothing picked yet — show nothing rather than guessing a society
      setCharges([]);
      setApiError(null);
      setUsingMock(false);
      setLoading(false);
      return;
    }
    setLoading(true); setApiError(null);
    console.log("[ChargeMaster] fetchCharges — scope:", selectedSociety);
    try {
      const res = selectedSociety === ALL_SOCIETIES
        ? await getAllChargeMasterApi()          // no society_identifier → every society
        : await getChargesOfSocietyApi(selectedSociety);
      console.log("[ChargeMaster] API raw response:", res);
      const arr = extractArr(res).filter(c => !c.isDeleted);
      console.log("[ChargeMaster] Parsed charges count:", arr.length);
      setCharges(arr);
      setUsingMock(false);
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      const detail = serverMsg
        ? (Array.isArray(serverMsg) ? serverMsg.map(m => m.message || m).join(", ") : String(serverMsg))
        : err?.message || "Unknown error";
      const errorText = status ? `${status} — ${detail}` : detail;
      console.error("[ChargeMaster] API error:", err);
      setApiError(errorText);
      setCharges(MOCK_CHARGES);
      setUsingMock(true);
    } finally { setLoading(false); }
  }, [selectedSociety]);

  useEffect(() => { setPage(1); fetchCharges(); }, [fetchCharges]);

  const handleDelete = async () => {
    if (usingMock) {
      showToast("Demo data delete nahi ho sakta — real backend se connect karo", "error");
      setModal(null);
      return;
    }
    setDeleting(true);
    try {
      const sid = selected.societyIdentifier || getSocietyId();
      await deleteChargeMasterApi(selected.id, sid);
      showToast("Charge deleted", "success");
      setModal(null); fetchCharges();
    } catch (err) {
      const serverMsg = err?.response?.data?.message;
      const msg = Array.isArray(serverMsg)
        ? serverMsg.map(m => m.message || m).join(", ")
        : serverMsg || "Delete failed";
      showToast(msg, "error");
    }
    finally { setDeleting(false); }
  };

  const filtered = charges.filter(c => {
    const q = search.toLowerCase();
    const societyLabel = (societyNameMap[c.societyIdentifier] || c.societyIdentifier || "").toLowerCase();
    return (!q || c.chargeName?.toLowerCase().includes(q) || c.chargeNumber?.toLowerCase().includes(q) || c.narration?.toLowerCase().includes(q) || c.propertyIdentifier?.toLowerCase().includes(q) || societyLabel.includes(q))
      && (filterType === "All" || c.chargeType === filterType)
      && (filterBilling === "All" || c.billingType === filterBilling);
  });
  const paged = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const stats = { total: charges.length, psf: charges.filter(c=>c.billingType==="PSF").length, lumpsum: charges.filter(c=>c.billingType==="Lumpsum").length, interest: charges.filter(c=>c.interestApplicable).length };

  return (
    <div style={{ padding: 24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}

      {modal === "add" && <ChargeModal mode="add" defaultSocietyId={selectedSociety !== ALL_SOCIETIES ? selectedSociety : ""} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchCharges(); }} toast={showToast}/>}
      {modal === "edit" && selected && <ChargeModal mode="edit" initial={selected} onClose={() => { setModal(null); setSelected(null); }} onSaved={() => { setModal(null); setSelected(null); fetchCharges(); }} toast={showToast}/>}
      {modal === "view" && selected && <ViewModal charge={selected} onClose={() => { setModal(null); setSelected(null); }}/>}
      {modal === "delete" && selected && <DeleteConfirm charge={selected} deleting={deleting} onClose={() => { setModal(null); setSelected(null); }} onConfirm={handleDelete}/>}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 800, margin: 0 }}>Charge Master</h1>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 4 }}>
            {selectedSociety === ALL_SOCIETIES
              ? "Showing charges across all societies"
              : selectedSociety
                ? `Showing charges for ${societyNameMap[selectedSociety] || selectedSociety}`
                : "Select a society above to view its charges"}
            {usingMock && <span style={{ color: "#ffb347", marginLeft: 10, fontSize: 11, fontWeight: 600, background: "rgba(255,179,71,0.12)", padding: "2px 8px", borderRadius: 12 }}>● Demo Data</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <div style={{ minWidth: 220 }}>
            <SearchDropdown
              label="Society"
              value={selectedSociety}
              onChange={setSelectedSociety}
              options={societySelectOptions}
              loading={loadingSocieties}
              placeholder="Select society..."
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 27 }}>
            <button onClick={fetchCharges} disabled={loading || !selectedSociety} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "9px 14px", color: "#8899aa", cursor: (loading || !selectedSociety) ? "not-allowed" : "pointer", opacity: !selectedSociety ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : {}}/>Refresh
            </button>
            <button onClick={() => setModal("add")} disabled={!selectedSociety} title={!selectedSociety ? "Select a society first" : undefined} style={{ background: !selectedSociety ? "var(--bg-surface)" : "linear-gradient(135deg,#00d4aa,#00b4d8)", border: !selectedSociety ? "1px solid var(--border-strong)" : "none", borderRadius: 8, padding: "9px 18px", color: !selectedSociety ? "#556677" : "#0d1117", fontWeight: 700, fontSize: 13, cursor: !selectedSociety ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={14}/> Add Charge
            </button>
          </div>
        </div>
      </div>

      {apiError && (
        <div style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <AlertCircle size={16} color="#ff6b6b" style={{ flexShrink: 0, marginTop: 1 }}/>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#ff6b6b", fontSize: 13, margin: 0, fontWeight: 600 }}>
                Backend se data fetch nahi ho saka — Demo data dikh raha hai
              </p>
              <p style={{ color: "#cc5555", fontSize: 12, margin: "4px 0 0", fontFamily: "monospace" }}>
                Error: {apiError}
              </p>
              <p style={{ color: "#8899aa", fontSize: 11, margin: "6px 0 0" }}>
                Check karo: (1) Backend server chal raha hai? (2) Society login hua hai? (3) Token valid hai? — Console mein aur detail dekho.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Charges", value: stats.total, icon: <FileText size={18}/>, color: "#00d4aa" },
          { label: "PSF Based", value: stats.psf, icon: <Layers size={18}/>, color: "#6c63ff" },
          { label: "Lumpsum", value: stats.lumpsum, icon: <DollarSign size={18}/>, color: "#ffb347" },
          { label: "Interest Active", value: stats.interest, icon: <TrendingUp size={18}/>, color: "#ff6b6b" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 800 }}>{s.value}</div>
              <div style={{ color: "#8899aa", fontSize: 11, fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }}/>
            <input placeholder="Search charges..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ ...iStyle, paddingLeft: 34 }}/>
          </div>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} style={{ ...iStyle, width: "auto", minWidth: 140, cursor: "pointer" }}>
            <option value="All">All Types</option>
            {CHARGE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filterBilling} onChange={e => { setFilterBilling(e.target.value); setPage(1); }} style={{ ...iStyle, width: "auto", minWidth: 120, cursor: "pointer" }}>
            <option value="All">All Billing</option>
            {BILLING_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, gap: 14 }}>
            <Loader size={30} color="#00d4aa" style={{ animation: "spin 1s linear infinite" }}/>
            <span style={{ color: "#8899aa", fontSize: 13 }}>Loading charges...</span>
          </div>
        ) : !selectedSociety ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 60, gap: 12 }}>
            <FileText size={36} color="#334"/>
            <p style={{ color: "#8899aa", fontSize: 14 }}>Pehle upar se society select karo (ya "All Societies") charges dekhne ke liye</p>
          </div>
        ) : paged.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 60, gap: 12 }}>
            <FileText size={36} color="#334"/>
            <p style={{ color: "#8899aa", fontSize: 14 }}>{usingMock ? "Backend data nahi mila — demo data dikh raha hai" : search || filterType !== "All" || filterBilling !== "All" ? "Koi charge nahi mila search mein" : "Abhi tak koi charge nahi hai"}</p>
            {!usingMock && <button onClick={() => setModal("add")} style={{ background: "rgba(0,212,170,0.1)", border: "1px solid #00d4aa", borderRadius: 8, padding: "8px 18px", color: "#00d4aa", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Add First Charge</button>}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Charge #","Name","Society","Type","Billing","Rate / Amount","Frequency","Due Date","Narration","Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", color: "#8899aa", fontSize: 11, fontWeight: 600, textAlign: "left", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--border)", background: i%2===0?"transparent":"rgba(255,255,255,0.01)" }}
                    onMouseEnter={e => e.currentTarget.style.background="rgba(0,212,170,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background=i%2===0?"transparent":"rgba(255,255,255,0.01)"}
                  >
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{c.chargeNumber || `#${c.id}`}</td>
                    <td style={{ padding: "12px 14px" }}><span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>{c.chargeName}</span></td>
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{societyNameMap[c.societyIdentifier] || c.societyIdentifier || "—"}</td>
                    <td style={{ padding: "12px 14px" }}><Badge label={c.chargeType} color={TYPE_COLORS[c.chargeType]||"#8899aa"}/></td>
                    <td style={{ padding: "12px 14px" }}><Badge label={c.billingType} color={BILLING_COLORS[c.billingType]||"#8899aa"}/></td>
                    <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>
                      {c.billingType==="PSF" ? <span style={{ color:"#00d4aa" }}>₹{c.psfRate}/sqft</span> : fmtCurrency(c.totalAmount ?? c.amount)}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{c.billingFrequency||"—"}</td>
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Calendar size={12}/>{fmtDate(c.dueDate)}</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.narration||"—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => { setSelected(c); setModal("view"); }} style={{ background: "rgba(0,180,216,0.1)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#00b4d8", cursor: "pointer" }}><Eye size={13}/></button>
                        <button onClick={() => { setSelected(c); setModal("edit"); }} style={{ background: "rgba(0,212,170,0.1)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#00d4aa", cursor: "pointer" }}><Edit2 size={13}/></button>
                        <button onClick={() => { setSelected(c); setModal("delete"); }} style={{ background: "rgba(255,107,107,0.1)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#ff6b6b", cursor: "pointer" }}><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && paged.length > 0 && <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage}/>}
      </div>
    </div>
  );
}