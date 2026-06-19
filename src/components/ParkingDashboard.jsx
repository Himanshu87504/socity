// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import {
  Car, Plus, Search, Edit2, Trash2, Eye, X,
  ParkingCircle, Bike, Truck,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw,
} from "lucide-react";
import {
  getAllNewParkingApi,
  getSingleParkingApi,
  createNewParkingApi,
  updateParkingApi,
  deleteParkingApi,
} from "../api/parking-api";
import { getAllPropertyApi } from "../api/property-api";
import { getAllMembersApi, getSocietyMembersApi } from "../api/member-api";
import { getAllSocietyApi } from "../api/society-api";
import { useAppContext } from "../AppContext";

// ── Constants ────────────────────────────────────────────────────────────────
const PARKING_NATURE_OPTS   = ["Member Parking", "Visitor Parking", "Stilt", "Covered", "Open", "Basement"];
const PARKING_TYPE_OPTS     = ["Stilt", "Covered", "Open", "Basement", "Visitor", "Other"];
const VEHICLE_TYPE_OPTS     = ["4 Wheeler", "2 Wheeler", "Car", "Bike", "Scooter", "SUV", "Truck", "Other"];
const VEHICLE_CATEGORY_OPTS = ["Sedan", "SUV", "Hatchback", "Coupe", "Truck", "Bike", "Scooter", "Other"];
const STATUS_OPTS           = ["Allocated", "Available", "Reserved"];

const vehicleIcons  = {
  "4 Wheeler": Car, "2 Wheeler": Bike, Car: Car, Bike: Bike,
  Scooter: Bike, SUV: Car, Truck: Truck, Other: Car,
};
const vehicleColors = {
  "4 Wheeler": "#00b4d8", "2 Wheeler": "#6c63ff", Car: "#00b4d8",
  Bike: "#6c63ff", Scooter: "#ffb347", SUV: "#00d4aa", Truck: "#ff6b6b", Other: "#8899aa",
};

const emptyForm = {
  parkingNumber:      "",
  parkingType:        PARKING_TYPE_OPTS[0],
  parkingArea:        "",
  parkingNature:      PARKING_NATURE_OPTS[0],
  parkingVehicleType: VEHICLE_TYPE_OPTS[0],
  vehicleModel:       "",
  vehicleCategory:    VEHICLE_CATEGORY_OPTS[0],
  ownerName:          "",
  registrationNumber: "",
  status:             STATUS_OPTS[0],
  societyIdentifier:  "",
  memberIdentifier:   "",
  propertyIdentifier: "",
  loanAmount:         "",
  loanBankName:       "",
  loanTenure:         "",
  loanStartDate:      "",
  loanEndDate:        "",
};

// ── Society ID resolver ───────────────────────────────────────────────────────
const getSid = () => {
  const direct =
    localStorage.getItem("society_identifier") ||
    localStorage.getItem("societyId") ||
    localStorage.getItem("selectedSociety");
  if (direct) return direct;
  try {
    const cu = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const fromUser = cu?.societyIdentifier || cu?.society_identifier || cu?.societyId || cu?.identifier || "";
    if (fromUser) return fromUser;
  } catch (_) {}
  try {
    const lr = JSON.parse(localStorage.getItem("loginResponse") || "{}");
    const permArr = lr?.permissoin || lr?.permission || lr?.permissions || [];
    if (Array.isArray(permArr) && permArr.length > 0) {
      const fromPerm = permArr[0]?.societyIdentifier || permArr[0]?.society_identifier || permArr[0]?.societyId || permArr[0]?.identifier || "";
      if (fromPerm) return fromPerm;
    }
    return lr?.societyIdentifier || lr?.society_identifier || lr?.societyId || "";
  } catch (_) { return ""; }
};



// ── Safely extract array from any API response shape ─────────────────────────
const extractArr = (res) => {
  const raw = res?.data;
  if (Array.isArray(raw))              return raw;
  if (Array.isArray(raw?.data))        return raw.data;
  if (Array.isArray(raw?.parking))     return raw.parking;
  if (Array.isArray(raw?.parkings))    return raw.parkings;
  if (Array.isArray(raw?.results))     return raw.results;
  if (Array.isArray(raw?.properties))  return raw.properties;
  if (Array.isArray(raw?.members))     return raw.members;
  if (Array.isArray(raw?.societies))   return raw.societies;
  if (raw && typeof raw === "object") {
    const first = Object.values(raw).find(v => Array.isArray(v));
    if (first) return first;
  }
  return [];
};

// ── Map raw API object → UI shape ─────────────────────────────────────────────
const mapParking = (item) => ({
  id:                 item.id                 || item._id              || "",
  parkingNumber:      item.parkingNumber                               || "—",
  parkingType:        item.parkingType                                 || "—",
  parkingArea:        item.parkingArea                                 || "—",
  parkingNature:      item.parkingNature                               || "—",
  parkingVehicleType: item.parkingVehicleType                          || "—",
  vehicleModel:       item.vehicleModel                                || "—",
  vehicleCategory:    item.vehicleCategory                             || "—",
  ownerName:          item.ownerName                                   || "—",
  registrationNumber: item.registrationNumber                          || "—",
  status:             item.status                                      || "—",
  isOccupied:         item.status === "Allocated",
  societyIdentifier:  item.societyIdentifier                           || "—",
  societyName:        item.societyName        || item.societyIdentifier || "—",
  memberIdentifier:   item.memberIdentifier                            || "—",
  memberName:         item.memberName         || item.memberIdentifier  || "—",
  propertyIdentifier: item.propertyIdentifier                          || "—",
  propertyName:       item.propertyName       || item.propertyIdentifier || "—",
  loanAmount:         item.loanAmount                                  || "—",
  loanBankName:       item.loanBankName                                || "—",
  loanTenure:         item.loanTenure != null  ? String(item.loanTenure) : "—",
  loanStartDate:      item.loanStartDate || item.startDate || item.start_date || item.allotmentStartDate || item.parkingStartDate || item.fromDate || item.from_date || item.loan_start_date || "",
  loanEndDate:        item.loanEndDate   || item.endDate   || item.end_date   || item.allotmentEndDate   || item.parkingEndDate   || item.toDate   || item.to_date   || item.loan_end_date   || "",
  createdAt:          item.createdAt                                   || "",
});

// ── Format any date string → YYYY-MM-DD for <input type="date"> ──────────────
// const toDateInput = (val) => {
//   if (val === null || val === undefined || val === "" || val === "—" || val === "null" || val === "undefined") return "";
//   const s = String(val).trim();
//   if (!s || s === "—" || s === "null") return "";
//   // Already YYYY-MM-DD (possibly with time suffix)
//   if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
//   // Numeric milliseconds (epoch)
//   if (/^\d{10,13}$/.test(s)) {
//     try {
//       const ms = s.length === 10 ? Number(s) * 1000 : Number(s);
//       const d = new Date(ms);
//       if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
//     } catch (_) {}
//   }
//   // ISO / any other parseable date string
//   try {
//     const d = new Date(s);
//     if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
//   } catch (_) {}
//   return "";
// };

const toDateInput = (val) => {
  if (
    val == null ||
    val === "" ||
    val === "—" ||
    val === "null" ||
    val === "undefined"
  ) {
    return "";
  }

  const s = String(val).trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.slice(0, 10);
  }

  // DD-MM-YYYY
  const ddmmyyyy = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return `${yyyy}-${mm}-${dd}`;
  }

  // Epoch
  if (/^\d{10,13}$/.test(s)) {
    const ms = s.length === 10 ? Number(s) * 1000 : Number(s);
    const d = new Date(ms);
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  }

  // ISO / other valid formats
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  return "";
};

// ── Pagination ────────────────────────────────────────────────────────────────
const fmtNum = n => Number(n).toLocaleString("en-IN");
const Pagination = ({ page, total, perPage, onChange }) => {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const vis = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) vis.push(i);
  const btn = (onClick, disabled, icon) => (
    <button onClick={onClick} disabled={disabled}
      style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: disabled ? "#556677" : "#8899aa", cursor: disabled ? "not-allowed" : "pointer" }}>
      {icon}
    </button>
  );
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
      <span style={{ color: "#8899aa", fontSize: 12 }}>
        Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {fmtNum(total)}
      </span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {btn(() => onChange(1), page === 1, <ChevronsLeft size={12} />)}
        {btn(() => onChange(page - 1), page === 1, <ChevronLeft size={12} />)}
        {vis.map(p => (
          <button key={p} onClick={() => onChange(p)}
            style={{ background: p === page ? "#00d4aa" : "none", border: `1px solid ${p === page ? "#00d4aa" : "var(--border)"}`, borderRadius: 6, padding: "4px 10px", color: p === page ? "#000" : "#8899aa", fontWeight: p === page ? 700 : 400, cursor: "pointer", fontSize: 12, minWidth: 30 }}>
            {p}
          </button>
        ))}
        {btn(() => onChange(page + 1), page === pages, <ChevronRight size={12} />)}
        {btn(() => onChange(pages), page === pages, <ChevronsRight size={12} />)}
      </div>
    </div>
  );
};

// ── Generic input & select helpers ────────────────────────────────────────────
const fieldStyle = {
  width: "100%", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
  padding: "9px 12px", color: "var(--text-primary)", fontSize: 13,
  outline: "none", boxSizing: "border-box", colorScheme: "dark",
};
const selectStyle = {
  ...fieldStyle, background: "#1a2233", cursor: "pointer",
};

const FI = ({ label, field, type = "text", form, setForm, required }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>
      {label}{required && <span style={{ color: "#ff6b6b" }}> *</span>}
    </label>
    <input type={type} value={form[field] ?? ""} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} style={fieldStyle} />
  </div>
);

const FS = ({ label, field, options, form, setForm }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>{label}</label>
    <select value={form[field] ?? ""} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} style={selectStyle}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const SectionLabel = ({ children }) => (
  <p style={{ color: "#8899aa", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, marginTop: 6, borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
    {children}
  </p>
);

const VRow = ({ label, value, mono }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
    <span style={{ color: "#8899aa", fontSize: 12, flexShrink: 0, width: 140 }}>{label}</span>
    <span style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 500, textAlign: "right", fontFamily: mono ? "var(--font-mono)" : "inherit" }}>{value || "—"}</span>
  </div>
);

const StatusBadge = ({ status }) => {
  const cfg = {
    Allocated: { bg: "rgba(0,180,216,0.12)",  color: "#00b4d8" },
    Available: { bg: "rgba(0,212,170,0.12)",  color: "#00d4aa" },
    Reserved:  { bg: "rgba(255,179,71,0.12)", color: "#ffb347" },
  };
  const s = cfg[status] || { bg: "rgba(136,153,170,0.12)", color: "#8899aa" };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
      {status || "—"}
    </span>
  );
};

// ── Searchable dropdown component ─────────────────────────────────────────────
const SearchableDropdown = ({ label, value, onChange, options, placeholder, loading, disabled, required }) => {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState("");
  const ref                 = React.useRef(null);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );
  const selected = options.find(o => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{ marginBottom: 14, position: "relative" }} ref={ref}>
      <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#ff6b6b" }}> *</span>}
      </label>
      <div
        onClick={() => { if (!disabled && !loading) setOpen(o => !o); }}
        style={{
          ...selectStyle,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          opacity: (disabled || loading) ? 0.5 : 1,
          cursor: (disabled || loading) ? "not-allowed" : "pointer",
          userSelect: "none",
        }}
      >
        <span style={{ color: selected ? "var(--text-primary)" : "#8899aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {loading ? "Loading…" : selected ? selected.label : (placeholder || "— Select —")}
        </span>
        <ChevronRight size={12} style={{ color: "#8899aa", flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 2000,
          background: "#1a2233", border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 8, marginTop: 4, maxHeight: 200, overflow: "hidden",
          display: "flex", flexDirection: "column", boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}>
          <div style={{ padding: "8px 8px 4px" }}>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search…"
              style={{ ...fieldStyle, padding: "6px 10px", fontSize: 12, marginBottom: 0 }}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div style={{ overflowY: "auto", maxHeight: 150 }}>
            {value && (
              <div
                onClick={() => { onChange(""); setOpen(false); setQuery(""); }}
                style={{ padding: "8px 12px", color: "#8899aa", fontSize: 12, cursor: "pointer", fontStyle: "italic" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                — Clear selection —
              </div>
            )}
            {filtered.length === 0 ? (
              <div style={{ padding: "10px 12px", color: "#8899aa", fontSize: 12 }}>No results</div>
            ) : filtered.map(o => (
              <div
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); setQuery(""); }}
                style={{
                  padding: "8px 12px", fontSize: 12, cursor: "pointer",
                  color: o.value === value ? "#00d4aa" : "var(--text-primary)",
                  background: o.value === value ? "rgba(0,212,170,0.08)" : "none",
                }}
                onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = "none"; }}
              >
                {o.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function ParkingDashboard({ societyIdentifier: propSid }) {
  // Use AppContext as the primary societyId source; fall back to localStorage via getSid()
  const { societyId: ctxSocietyId } = useAppContext();
  const getActiveSid = () => {
    // Priority: prop passed from App.jsx (most reliable) > context > localStorage
    if (propSid) return propSid;
    const fromCtx = typeof ctxSocietyId === "function" ? ctxSocietyId() : ctxSocietyId;
    return fromCtx || getSid();
  };

  const [data,      setData]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const PER = 8;

  const [modal,     setModal]     = useState(null);
  const [form,      setForm]      = useState(emptyForm);
  const [viewItem,  setViewItem]  = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [deleteId,  setDeleteId]  = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  // ── Dropdown data ────────────────────────────────────────────────────────
  const [societies,    setSocieties]    = useState([]);
  const [properties,   setProperties]   = useState([]);
  const [members,      setMembers]      = useState([]);
  const [loadingSoc,   setLoadingSoc]   = useState(false);
  const [loadingProp,  setLoadingProp]  = useState(false);
  const [loadingMem,   setLoadingMem]   = useState(false);

  // ── Fetch societies ──────────────────────────────────────────────────────
  const fetchSocieties = useCallback(async () => {
    setLoadingSoc(true);
    try {
      const res = await getAllSocietyApi();
      const arr = extractArr(res);
      setSocieties(arr.map(s => ({
        value: s.identifier || s.societyIdentifier || s.id || s._id || "",
        label: s.name || s.societyName || s.identifier || "",
      })).filter(s => s.value && s.label));
    } catch (e) {
      console.error("Societies fetch failed:", e);
      setSocieties([]);
    } finally {
      setLoadingSoc(false);
    }
  }, []);

  // ── Fetch properties using getAllPropertyApi (same as other dashboards) ───
  const fetchProperties = useCallback(async (societyId) => {
    setLoadingProp(true);
    setProperties([]);
    try {
      // Use getAllPropertyApi with societyIdentifier param — same pattern as LoansDashboard/TenantDashboard
      const res = await getAllPropertyApi(null, societyId || undefined);
      const arr = res?.data?.data || res?.data || [];
      const list = Array.isArray(arr) ? arr : extractArr(res);
      setProperties(list.map(p => ({
        value: p.propertyIdentifier || p.identifier || p.id || p._id || "",
        label: p.propertyName || p.name || p.propertyNumber || p.propertyIdentifier || "",
      })).filter(p => p.value && p.label));
    } catch (e) {
      console.error("Properties fetch failed:", e);
      setProperties([]);
    } finally {
      setLoadingProp(false);
    }
  }, []);

  // ── Fetch members — try society-specific first, fall back to all ─────────
  const fetchMembers = useCallback(async (societyId) => {
    setLoadingMem(true);
    setMembers([]);
    try {
      let arr = [];
      if (societyId) {
        try {
          const res = await getSocietyMembersApi(societyId);
          arr = res?.data?.data || res?.data || [];
          if (!Array.isArray(arr)) arr = extractArr(res);
        } catch (_) {
          // If society-specific endpoint fails, fall back to all members
        }
      }
      // Fallback to all members if no results or no societyId
      if (!arr.length) {
        const res = await getAllMembersApi();
        arr = res?.data?.data || res?.data || [];
        if (!Array.isArray(arr)) arr = extractArr(res);
      }
      setMembers(arr.map(m => ({
        value: m.memberIdentifier || m.identifier || m.id || m._id || "",
        label: [m.firstName, m.middleName, m.lastName].filter(Boolean).join(" ") ||
               m.name || m.memberName || m.memberIdentifier || "",
      })).filter(m => m.value && m.label));
    } catch (e) {
      console.error("Members fetch failed:", e);
      setMembers([]);
    } finally {
      setLoadingMem(false);
    }
  }, []);

  // Re-fetch properties & members when society changes in the form
  useEffect(() => {
    if (modal === "add" || modal === "edit") {
      fetchProperties(form.societyIdentifier || null);
      fetchMembers(form.societyIdentifier || null);
    }
  }, [form.societyIdentifier, modal]);

  // ── Fetch all parking slots ──────────────────────────────────────────────
  const fetchParking = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Persist propSid to localStorage so all other API calls can find it
      if (propSid) {
        localStorage.setItem("society_identifier", propSid);
        localStorage.setItem("societyId", propSid);
      }

      // Collect society IDs from all available sources
      const idSet = new Set();

      // Source 1: active sid from prop/context/localStorage (fastest, always try first)
      const activeSid = getActiveSid();
      if (activeSid) idSet.add(activeSid);

      // Source 2: full society list from API
      try {
        const socRes = await getAllSocietyApi();
        const socArr = extractArr(socRes);
        socArr
          .map(s => s.identifier || s.societyIdentifier || s.id || s._id || "")
          .filter(Boolean)
          .forEach(id => idSet.add(id));
      } catch (_) {}

      const allSocietyIds = [...idSet];

      if (allSocietyIds.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      // Fetch parking for ALL societies in parallel and merge
      const results = await Promise.allSettled(
        allSocietyIds.map(sid => getAllNewParkingApi(sid))
      );

      const combined = [];
      results.forEach(result => {
        if (result.status === "fulfilled") {
          const arr = extractArr(result.value);
          combined.push(...arr.map(mapParking));
        }
      });

      setData(combined);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load parking data");
    } finally {
      setLoading(false);
    }
  }, [propSid, ctxSocietyId]);

  useEffect(() => { fetchParking(); }, [fetchParking]);

  // ── Filter & paginate ────────────────────────────────────────────────────
  const filtered = data.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (d.parkingNumber      || "").toLowerCase().includes(q) ||
      (d.memberName         || "").toLowerCase().includes(q) ||
      (d.memberIdentifier   || "").toLowerCase().includes(q) ||
      (d.registrationNumber || "").toLowerCase().includes(q) ||
      (d.societyName        || "").toLowerCase().includes(q) ||
      (d.propertyName       || "").toLowerCase().includes(q) ||
      (d.ownerName          || "").toLowerCase().includes(q)
    );
  });
  const paged = filtered.slice((page - 1) * PER, page * PER);

  // ── Stats ────────────────────────────────────────────────────────────────
  const allocated = data.filter(d => d.status === "Allocated").length;
  const available = data.filter(d => d.status === "Available").length;
  const byNature  = ["Member Parking", "Visitor Parking", "Stilt", "Covered"].reduce((acc, n) => {
    acc[n] = data.filter(d => d.parkingNature === n).length;
    return acc;
  }, {});

  // ── Open Add ─────────────────────────────────────────────────────────────
  const openAdd = () => {
    // Persist propSid to localStorage so society-dependent API calls always find it
    if (propSid) {
      localStorage.setItem("society_identifier", propSid);
      localStorage.setItem("societyId", propSid);
    }
    const sid = getActiveSid();
    setForm({ ...emptyForm, societyIdentifier: sid });
    setSaveError(null);
    setModal("add");
    fetchSocieties();
    fetchProperties(sid || null);
    fetchMembers(sid || null);
  };

  // ── Build form from a parking record ─────────────────────────────────────
  const buildForm = (p) => ({
    id:                 p.id,
    parkingNumber:      p.parkingNumber      === "—" ? "" : p.parkingNumber,
    parkingType:        p.parkingType        === "—" ? PARKING_TYPE_OPTS[0]     : p.parkingType,
    parkingArea:        p.parkingArea        === "—" ? "" : p.parkingArea,
    parkingNature:      p.parkingNature      === "—" ? PARKING_NATURE_OPTS[0]   : p.parkingNature,
    parkingVehicleType: p.parkingVehicleType === "—" ? VEHICLE_TYPE_OPTS[0]     : p.parkingVehicleType,
    vehicleModel:       p.vehicleModel       === "—" ? "" : p.vehicleModel,
    vehicleCategory:    p.vehicleCategory    === "—" ? VEHICLE_CATEGORY_OPTS[0] : p.vehicleCategory,
    ownerName:          p.ownerName          === "—" ? "" : p.ownerName,
    registrationNumber: p.registrationNumber === "—" ? "" : p.registrationNumber,
    status:             p.status             === "—" ? STATUS_OPTS[0] : p.status,
    societyIdentifier:  p.societyIdentifier  === "—" ? getActiveSid() : p.societyIdentifier,
    memberIdentifier:   p.memberIdentifier   === "—" ? "" : p.memberIdentifier,
    propertyIdentifier: p.propertyIdentifier === "—" ? "" : p.propertyIdentifier,
    loanAmount:         p.loanAmount         === "—" ? "" : p.loanAmount,
    loanBankName:       p.loanBankName       === "—" ? "" : p.loanBankName,
    loanTenure:         p.loanTenure         === "—" ? "" : p.loanTenure,
    loanStartDate:      toDateInput(p.loanStartDate || ""),
    loanEndDate:        toDateInput(p.loanEndDate   || ""),
  });

  // ── Open Edit ────────────────────────────────────────────────────────────
  const openEdit = async (row) => {
    setSaveError(null);
    const f = buildForm(row);
    setForm(f);
    setModal("edit");
    fetchSocieties();
    fetchProperties(f.societyIdentifier || null);
    fetchMembers(f.societyIdentifier || null);
    try {
      const res   = await getSingleParkingApi(row.id);
      const fresh = res?.data?.data || res?.data;
      // Accept fresh data whether backend uses .id or ._id
      if (fresh && (fresh.id || fresh._id)) {
        setForm(buildForm(mapParking(fresh)));
        fetchProperties(fresh.societyIdentifier || f.societyIdentifier || null);
        fetchMembers(fresh.societyIdentifier || f.societyIdentifier || null);
      }
    } catch { /* keep existing */ }
  };

  // ── Open View ─────────────────────────────────────────────────────────────
  const openView = async (row) => {
    setViewItem(row);
    setModal("view");
    try {
      const res   = await getSingleParkingApi(row.id);
      const fresh = res?.data?.data || res?.data;
      if (fresh && (fresh.id || fresh._id)) setViewItem(mapParking(fresh));
    } catch { /* keep row */ }
  };

  // ── Helper: return undefined if blank (avoids sending "" to API) ──────────
  const trimOrUndef = (v) => {
    const t = (v ?? "").toString().trim();
    return t === "" ? undefined : t;
  };

  // ── Save (Add / Edit) ─────────────────────────────────────────────────────
  const save = async () => {
    if (!form.parkingNumber?.trim()) { setSaveError("Parking number is required"); return; }
    if (!form.societyIdentifier) {
      // Try to auto-fill from localStorage one more time before rejecting
      const autoSid = getActiveSid();
      if (autoSid) {
        setForm(f => ({ ...f, societyIdentifier: autoSid }));
      } else {
        setSaveError("Please select a society");
        return;
      }
    }

    setSaving(true);
    setSaveError(null);

    try {
      // Build payload — only send fields that have values; never send empty strings
      const payload = {
        parkingNumber:      form.parkingNumber.trim(),
        parkingType:        form.parkingType,
        parkingNature:      form.parkingNature,
        parkingVehicleType: form.parkingVehicleType,
        vehicleCategory:    form.vehicleCategory,
        status:             form.status,
        societyIdentifier:  form.societyIdentifier,
      };

      // Optional fields — only attach when filled
      if (trimOrUndef(form.parkingArea))        payload.parkingArea        = trimOrUndef(form.parkingArea);
      if (trimOrUndef(form.vehicleModel))       payload.vehicleModel       = trimOrUndef(form.vehicleModel);
      if (trimOrUndef(form.ownerName))          payload.ownerName          = trimOrUndef(form.ownerName);
      if (trimOrUndef(form.registrationNumber)) payload.registrationNumber = trimOrUndef(form.registrationNumber);
      // memberIdentifier — send as memberIdentifier (matches backend field from mapParking)
      if (trimOrUndef(form.memberIdentifier))   payload.memberIdentifier   = trimOrUndef(form.memberIdentifier);
      if (trimOrUndef(form.propertyIdentifier)) payload.propertyIdentifier = trimOrUndef(form.propertyIdentifier);
      if (trimOrUndef(form.loanAmount))         payload.loanAmount         = trimOrUndef(form.loanAmount);
      if (trimOrUndef(form.loanBankName))       payload.loanBankName       = trimOrUndef(form.loanBankName);
      if (trimOrUndef(form.loanTenure))         payload.loanTenure         = Number(form.loanTenure);
      if (trimOrUndef(form.loanStartDate))      payload.loanStartDate      = trimOrUndef(form.loanStartDate);
      if (trimOrUndef(form.loanEndDate))        payload.loanEndDate        = trimOrUndef(form.loanEndDate);

      if (modal === "edit" && form.id) {
        const res = await updateParkingApi(form.id, payload);
        // Check backend acknowledged the update
        const resData = res?.data;
        if (resData && resData.success === false) {
          throw new Error(resData.message || "Update failed on server.");
        }
      } else {
        const res = await createNewParkingApi(payload);
        // Validate the backend actually saved the record
        const resData = res?.data;
        if (!resData) {
          throw new Error("No response from server. Please try again.");
        }
        if (resData.success === false) {
          throw new Error(resData.message || "Server rejected the request.");
        }
        // Some backends return the created object directly or nested under .data
        const created = resData.data || resData;
        if (!created || (!created.id && !created._id && !created.parkingNumber)) {
          // 200 OK but no recognisable record returned — treat as failure
          throw new Error(resData.message || "Parking was not saved. Please check required fields and try again.");
        }
      }

      setModal(null);
      // Always refresh list so UI reflects backend state
      await fetchParking();
    } catch (err) {
      setSaveError(err?.response?.data?.message || err?.message || "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteParkingApi(deleteId);
      setDeleteId(null);
      setModal(null);
      await fetchParking();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 28 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Parking</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Manage parking slots, vehicles, and allocations</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={fetchParking} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 14px", color: "#8899aa", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#1a2a4a,#162040)", border: "1px solid rgba(0,180,216,0.3)", borderRadius: 10, padding: "10px 18px", color: "#e8edf5", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            <Plus size={15} /> Add Parking
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 24 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
          <p style={{ color: "#00d4aa", fontSize: 22, fontWeight: 700 }}>{data.length}</p>
          <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, marginTop: 2 }}>Total Slots</p>
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid rgba(0,180,216,0.2)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
          <p style={{ color: "#00b4d8", fontSize: 22, fontWeight: 700 }}>{allocated}</p>
          <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, marginTop: 2 }}>Allocated</p>
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
          <p style={{ color: "#6c63ff", fontSize: 22, fontWeight: 700 }}>{available}</p>
          <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, marginTop: 2 }}>Available</p>
        </div>
        {Object.entries(byNature).map(([n, count]) => (
          <div key={n} style={{ background: "var(--bg-card)", border: "1px solid rgba(255,179,71,0.1)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
            <p style={{ color: "#ffb347", fontSize: 22, fontWeight: 700 }}>{count}</p>
            <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, marginTop: 2 }}>{n}</p>
          </div>
        ))}
      </div>

      {/* Visual Slot Grid */}
      {!loading && !error && data.length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 14 }}>PARKING SLOT OVERVIEW</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {data.map(slot => {
              const VIcon = vehicleIcons[slot.parkingVehicleType] || Car;
              const isOcc = slot.isOccupied;
              const vc    = vehicleColors[slot.parkingVehicleType] || "#8899aa";
              return (
                <div key={slot.id}
                  style={{ width: 80, height: 80, borderRadius: 10, background: isOcc ? `${vc}14` : "rgba(0,212,170,0.06)", border: `1px solid ${isOcc ? vc : "#00d4aa"}30`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                  onClick={() => openView(slot)}
                >
                  {isOcc ? <VIcon size={20} style={{ color: vc }} /> : <ParkingCircle size={20} style={{ color: "#00d4aa" }} />}
                  <span style={{ color: isOcc ? vc : "#00d4aa", fontSize: 10, fontWeight: 700 }}>{slot.parkingNumber}</span>
                  <span style={{ color: "#8899aa", fontSize: 9 }}>{isOcc ? (slot.parkingVehicleType || "Allocated") : "Free"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#00b4d8", fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 3, height: 16, background: "#00b4d8", borderRadius: 2 }} />
            LIST OF PARKING
          </div>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Filter Table"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px 8px 32px", color: "var(--text-primary)", fontSize: 13, outline: "none", width: 220 }}
            />
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 50, color: "#8899aa" }}>
            <RefreshCw size={24} style={{ marginBottom: 8, opacity: 0.6 }} />
            <p>Loading parking data…</p>
          </div>
        )}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: 40, color: "#ff6b6b" }}>
            <p>{error}</p>
            <button onClick={fetchParking} style={{ marginTop: 12, padding: "8px 18px", background: "rgba(255,107,107,0.1)", border: "1px solid #ff6b6b", borderRadius: 8, color: "#ff6b6b", cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["S.No", "Parking No.", "Society", "Member", "Property", "Nature", "Vehicle Type", "Reg. Number", "Owner", "Status", "Action"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ padding: 40, textAlign: "center", color: "#8899aa" }}>
                      {search ? "No parking slots match your search." : "No parking slots found."}
                    </td>
                  </tr>
                ) : paged.map((row, i) => {
                  const vc = vehicleColors[row.parkingVehicleType] || "#8899aa";
                  return (
                    <tr key={row.id || i}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{(page - 1) * PER + i + 1}</td>
                      <td style={{ padding: "12px 14px", color: "#00b4d8", fontWeight: 600, fontSize: 12 }}>{row.parkingNumber}</td>
                      <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.societyName}</td>
                      <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}>{row.memberName}</td>
                      <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontSize: 12 }}>{row.propertyName}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: "rgba(108,99,255,0.12)", color: "#6c63ff", padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{row.parkingNature}</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {row.parkingVehicleType && row.parkingVehicleType !== "—"
                          ? <span style={{ background: `${vc}14`, color: vc, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{row.parkingVehicleType}</span>
                          : <span style={{ color: "#8899aa" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12, fontFamily: "var(--font-mono)" }}>{row.registrationNumber}</td>
                      <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontSize: 12 }}>{row.ownerName}</td>
                      <td style={{ padding: "12px 14px" }}><StatusBadge status={row.status} /></td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button onClick={() => openView(row)} title="View"   style={{ background: "rgba(0,180,216,0.12)",  border: "none", borderRadius: 6, padding: "5px 8px", color: "#00b4d8", cursor: "pointer" }}><Eye     size={12} /></button>
                          <button onClick={() => openEdit(row)} title="Edit"   style={{ background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#6c63ff", cursor: "pointer" }}><Edit2   size={12} /></button>
                          <button onClick={() => { setDeleteId(row.id); setModal("delete"); }} title="Delete" style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#ff6b6b", cursor: "pointer" }}><Trash2  size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {(modal === "add" || modal === "edit") && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 580, maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>{modal === "edit" ? "Edit Parking" : "Add Parking"}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ padding: 22 }}>

              {/* ── Parking Info ── */}
              <SectionLabel>Parking Info</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FI label="Parking Number" field="parkingNumber" form={form} setForm={setForm} required />
                <FI label="Parking Area (sq ft)" field="parkingArea" form={form} setForm={setForm} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FS label="Parking Type"   field="parkingType"   options={PARKING_TYPE_OPTS}   form={form} setForm={setForm} />
                <FS label="Parking Nature" field="parkingNature" options={PARKING_NATURE_OPTS} form={form} setForm={setForm} />
              </div>
              <FS label="Status" field="status" options={STATUS_OPTS} form={form} setForm={setForm} />

              {/* ── Vehicle Info ── */}
              <SectionLabel>Vehicle Info</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FS label="Vehicle Type"     field="parkingVehicleType" options={VEHICLE_TYPE_OPTS}     form={form} setForm={setForm} />
                <FS label="Vehicle Category" field="vehicleCategory"    options={VEHICLE_CATEGORY_OPTS} form={form} setForm={setForm} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FI label="Vehicle Model"       field="vehicleModel"       form={form} setForm={setForm} />
                <FI label="Registration Number" field="registrationNumber" form={form} setForm={setForm} />
              </div>
              <FI label="Owner Name" field="ownerName" form={form} setForm={setForm} />

              {/* ── Assignment ── */}
              <SectionLabel>Assignment</SectionLabel>

              {/* Society dropdown */}
              <SearchableDropdown
                label="Society"
                required
                value={form.societyIdentifier}
                onChange={val => setForm(f => ({ ...f, societyIdentifier: val, propertyIdentifier: "", memberIdentifier: "" }))}
                options={societies}
                placeholder={loadingSoc ? "Loading societies…" : "— Select Society —"}
                loading={loadingSoc}
              />

              {/* Property dropdown — uses getAllPropertyApi filtered by society */}
              <SearchableDropdown
                label="Property"
                value={form.propertyIdentifier}
                onChange={val => setForm(f => ({ ...f, propertyIdentifier: val }))}
                options={properties}
                placeholder={
                  !form.societyIdentifier ? "Select a society first" :
                  loadingProp ? "Loading properties…" :
                  properties.length === 0 ? "No properties found" : "— Select Property —"
                }
                loading={loadingProp}
                disabled={!form.societyIdentifier}
              />

              {/* Member dropdown — uses getSocietyMembersApi / getAllMembersApi */}
              <SearchableDropdown
                label="Member"
                value={form.memberIdentifier}
                onChange={val => setForm(f => ({ ...f, memberIdentifier: val }))}
                options={members}
                placeholder={
                  !form.societyIdentifier ? "Select a society first" :
                  loadingMem ? "Loading members…" :
                  members.length === 0 ? "No members found" : "— Select Member —"
                }
                loading={loadingMem}
                disabled={!form.societyIdentifier}
              />

              {/* ── Loan Details ── */}
              <SectionLabel>Loan Details (Optional)</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FI label="Loan Amount" field="loanAmount"   form={form} setForm={setForm} />
                <FI label="Bank Name"   field="loanBankName" form={form} setForm={setForm} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <FI label="Tenure (months)" field="loanTenure"    type="number" form={form} setForm={setForm} />
                <FI label="Start Date"      field="loanStartDate" type="date"   form={form} setForm={setForm} />
                <FI label="End Date"        field="loanEndDate"   type="date"   form={form} setForm={setForm} />
              </div>

              {saveError && (
                <p style={{ color: "#ff6b6b", fontSize: 12, marginBottom: 12, background: "rgba(255,107,107,0.08)", padding: "8px 12px", borderRadius: 8 }}>
                  {saveError}
                </p>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
                <button onClick={() => setModal(null)} disabled={saving} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer" }}>Cancel</button>
                <button onClick={save} disabled={saving}
                  style={{ background: "linear-gradient(135deg,#00b4d8,#6c63ff)", border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View Modal ───────────────────────────────────────────────────── */}
      {modal === "view" && viewItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 500, maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>Parking Details</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ background: "rgba(0,180,216,0.08)", borderRadius: 12, padding: 16, marginBottom: 18, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(0,180,216,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Car size={20} style={{ color: "#00b4d8" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: "#00b4d8", fontWeight: 700, fontSize: 15 }}>{viewItem.parkingNumber}</p>
                  <p style={{ color: "#8899aa", fontSize: 12 }}>{viewItem.parkingType} · {viewItem.parkingNature}</p>
                </div>
                <StatusBadge status={viewItem.status} />
              </div>

              <SectionLabel>Parking Info</SectionLabel>
              <VRow label="Parking Number" value={viewItem.parkingNumber} />
              <VRow label="Parking Type"   value={viewItem.parkingType} />
              <VRow label="Parking Nature" value={viewItem.parkingNature} />
              <VRow label="Parking Area"   value={viewItem.parkingArea !== "—" ? `${viewItem.parkingArea} sq ft` : "—"} />

              <SectionLabel>Vehicle Info</SectionLabel>
              <VRow label="Vehicle Type"     value={viewItem.parkingVehicleType} />
              <VRow label="Vehicle Category" value={viewItem.vehicleCategory} />
              <VRow label="Vehicle Model"    value={viewItem.vehicleModel} />
              <VRow label="Reg. Number"      value={viewItem.registrationNumber} mono />
              <VRow label="Owner Name"       value={viewItem.ownerName} />

              <SectionLabel>Assignment</SectionLabel>
              <VRow label="Society"  value={viewItem.societyName} />
              <VRow label="Member"   value={viewItem.memberName} />
              <VRow label="Property" value={viewItem.propertyName} />

              <SectionLabel>Loan Details</SectionLabel>
              <VRow label="Loan Amount" value={viewItem.loanAmount !== "—" ? `₹${viewItem.loanAmount}` : "—"} />
              <VRow label="Bank Name"   value={viewItem.loanBankName} />
              <VRow label="Tenure"      value={viewItem.loanTenure !== "—" ? `${viewItem.loanTenure} months` : "—"} />
              <VRow label="Start Date"  value={viewItem.loanStartDate} />
              <VRow label="End Date"    value={viewItem.loanEndDate} />

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
                <button onClick={() => { setModal(null); setTimeout(() => openEdit(viewItem), 50); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 8, padding: "9px 16px", color: "#6c63ff", fontWeight: 600, cursor: "pointer" }}>
                  <Edit2 size={13} /> Edit
                </button>
                <button onClick={() => setModal(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer" }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ─────────────────────────────────────────────────── */}
      {modal === "delete" && deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 380, padding: 28, textAlign: "center" }}>
            <div style={{ width: 52, height: 52, background: "rgba(255,107,107,0.12)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Trash2 size={22} style={{ color: "#ff6b6b" }} />
            </div>
            <h3 style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: 8 }}>Delete Parking Slot?</h3>
            <p style={{ color: "#8899aa", fontSize: 13, marginBottom: 24 }}>This action cannot be undone. The record will be permanently deleted.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => { setDeleteId(null); setModal(null); }} disabled={deleting}
                style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 22px", color: "#8899aa", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                style={{ background: "linear-gradient(135deg,#ff6b6b,#cc3333)", border: "none", borderRadius: 8, padding: "10px 22px", color: "#fff", fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}>
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
