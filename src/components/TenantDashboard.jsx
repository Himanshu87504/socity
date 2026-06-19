// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import {
  Users, Plus, Search, Edit2, Trash2, Eye, X,
  Download, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, ChevronDown,
  CheckCircle2, Building2, CheckCircle, RefreshCw,
} from "lucide-react";
import { useAppContext } from "../AppContext";
import { getAllPropertyApi } from "../api/property-api";
import { getAllSocietyApi } from "../api/society-api";
import {
  addTenantApi, updateTenantApi, deleteTenantApi,
  getTenantApi, updateVehicleApi, deleteVehicleApi, getAllTenantApi,
} from "../api/tenant-api";

// ─── DEFAULT FORM ──────────────────────────────────────────────────────────
const defaultForm = {
  id: null, tenantIdentifier: "",
  firstName: "", middleName: "", lastName: "",
  mobileNumber: "", alternateMobileNumber: "",
  email: "", gender: "", age: "",
  dateOfBirth: "", anniversary: "", address: "",
  rentAgreementStartDate: "", rentAgreementEndDate: "",
  rentAgreementFile: null, policeVerificationFile: null,
  propertyIdentifier: "",
  aadharNumber: "", country: "", state: "", city: "", pincode: "",
  havePet: false, familyMembers: "", profilePic: null,
  rentRegistrationId: "", monthlyRent: "", depositAmount: "", dueAmount: "",
  vehicleType: "", vehicleNumber: "", vehicleRcFile: null, selectedVehicleId: "",
  societyIdentifier: "", societyName: "",
};

// ─── MAPPERS ───────────────────────────────────────────────────────────────
const mapApiToUi = (t) => {
  const vehicleData = t.tenantVehicles?.[0] || {};
  return {
    id: t.id, tenantIdentifier: t.tenantIdentifier,
    firstName: t.firstName || "", middleName: t.middleName || "", lastName: t.lastName || "",
    mobileNumber: t.mobileNumber || "", alternateMobileNumber: t.alternateMobileNumber || "",
    email: t.email || "", gender: t.gender || "", age: t.age || "",
    dateOfBirth: t.dateOfBirth || "", anniversary: t.anniversary || "", address: t.address || "",
    aadharNumber: t.aadharNumber || "", country: t.country || "", state: t.state || "",
    city: t.city || "", pincode: t.pincode || "",
    havePet: t.havePet || false, familyMembers: t.familyMembers || "",
    profilePic: t.profilePic || t.profilePicPath || "",
    propertyIdentifier: t.propertyIdentifier || "",
    propertyName: t.propertyName || "",
    rentAgreementStartDate: t.rentAgreementStartDate || "",
    rentAgreementEndDate: t.rentAgreementEndDate || "",
    rentRegistrationId: t.rentRegistrationId || "",
    monthlyRent: t.monthlyRent || "", depositAmount: t.depositAmount || "", dueAmount: t.dueAmount || "",
    vehicleType: vehicleData.vehicleType || "", vehicleNumber: vehicleData.vehicleNumber || "",
    tenantVehicles: t.tenantVehicles || [], tenantProperties: t.tenantProperties || [],
    status: t.status || "Active",
    societyIdentifier: t.society?.societyIdentifier || t.societyIdentifier || "",
    societyName: t.society?.societyName || t.societyName || "",
  };
};

const mapSingleTenantToUi = (t) => {
  const propertyData = t.property || {};
  const vehicleData = t.tenantVehicles?.[0] || {};
  return {
    id: t.id, tenantIdentifier: t.tenantIdentifier,
    firstName: t.firstName || "", middleName: t.middleName || "", lastName: t.lastName || "",
    mobileNumber: t.mobileNumber || "", alternateMobileNumber: t.alternateMobileNumber || "",
    email: t.email || "", gender: t.gender || "", age: t.age || "",
    dateOfBirth: t.dateOfBirth || "", anniversary: t.anniversary || "", address: t.address || "",
    aadharNumber: t.aadharNumber || "", country: t.country || "", state: t.state || "",
    city: t.city || "", pincode: t.pincode || "",
    havePet: t.havePet || false, familyMembers: t.familyMembers || "",
    profilePic: t.profilePicPath || t.profilePic || "",
    propertyIdentifier: propertyData.propertyIdentifier || "",
    propertyName: propertyData.propertyName || "",
    rentAgreementStartDate: propertyData.rentAgreementStartDate || "",
    rentAgreementEndDate: propertyData.rentAgreementEndDate || "",
    rentRegistrationId: propertyData.rentRegistrationId || "",
    monthlyRent: propertyData.monthlyRent || "", depositAmount: propertyData.depositAmount || "",
    dueAmount: propertyData.dueAmount || "",
    rentAgreementFile: propertyData.rentAgreementFile || "",
    policeVerificationFile: propertyData.policeVerificationFile || "",
    vehicleType: vehicleData.vehicleType || "", vehicleNumber: vehicleData.vehicleNumber || "",
    vehicleRcFile: vehicleData.vehicleRcFilePath || "", selectedVehicleId: vehicleData.vehicleId || "",
    tenantVehicles: t.tenantVehicles || [],
    status: t.status || "Active",
    societyIdentifier: t.society?.societyIdentifier || t.societyIdentifier || "",
    societyName: t.society?.societyName || t.societyName || "",
  };
};

const buildFormData = (form) => {
  const fd = new FormData();
  ["firstName","middleName","lastName","propertyIdentifier","mobileNumber","alternateMobileNumber",
   "email","gender","age","dateOfBirth","anniversary","address","country","state","city","pincode",
   "familyMembers","aadharNumber","rentRegistrationId","rentAgreementStartDate","rentAgreementEndDate",
   "monthlyRent","depositAmount","dueAmount"].forEach(k => fd.append(k, form[k] || ""));
  fd.append("havePet", form.havePet ? "yes" : "no");
  fd.append("vehicleData", JSON.stringify([{ vehicleType: form.vehicleType || "", vehicleNumber: form.vehicleNumber || "" }]));
  if (form.profilePic instanceof File) fd.append("profilePicFile", form.profilePic);
  if (form.vehicleRcFile instanceof File) fd.append("vehicleRCFiles", form.vehicleRcFile);
  if (form.rentAgreementFile instanceof File) fd.append("rentAgreementFile", form.rentAgreementFile);
  if (form.policeVerificationFile instanceof File) fd.append("policeVerificationFile", form.policeVerificationFile);
  return fd;
};

// ─── SHARED STYLES ─────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
  padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box",
};
const labelStyle = { display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 };

const fmtNum = (n) => Number(n).toLocaleString("en-IN");
const toInputDate = (date) => {
  if (!date) return "";
  if (date.includes("-")) { const [dd, mm, yyyy] = date.split("-"); if (dd.length === 2) return `${yyyy}-${mm}-${dd}`; }
  return date;
};

// ─── SMALL COMPONENTS ──────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = { Active: { bg: "rgba(0,212,170,0.15)", color: "#00d4aa" }, Inactive: { bg: "rgba(255,107,107,0.15)", color: "#ff6b6b" }, Expired: { bg: "rgba(255,179,71,0.15)", color: "#ffb347" } };
  const s = map[status] || { bg: "rgba(136,153,170,0.15)", color: "#8899aa" };
  return <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{status}</span>;
};

const FI = ({ label, field, type = "text", form, setForm }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={labelStyle}>{label}</label>
    <input type={type} value={form[field] || ""} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} style={inputStyle} />
  </div>
);

const FS = ({ label, field, options, form, setForm }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={labelStyle}>{label}</label>
    <select value={form[field] || ""} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} style={{ ...inputStyle, background: "#1a2233" }}>
      <option value="">-- Select --</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const SectionTitle = ({ children }) => (
  <p style={{ color: "#00d4aa", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 12, marginTop: 4 }}>{children}</p>
);

// ─── SOCIETY SEARCH ENGINE ─────────────────────────────────────────────────
function SocietySearchEngine({ societies, selectedSociety, onSelect, loading, placeholder = "All Societies", accentColor = "#00d4aa" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const filtered = societies.filter(s => {
    const q = query.toLowerCase();
    return (s.societyName || "").toLowerCase().includes(q) || (s.societyIdentifier || "").toLowerCase().includes(q);
  });
  const displayName = selectedSociety ? (selectedSociety.societyName || selectedSociety.societyIdentifier) : placeholder;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display: "flex", alignItems: "center", gap: 8,
        background: selectedSociety ? `${accentColor}12` : "rgba(255,255,255,0.04)",
        border: `1.5px solid ${selectedSociety ? `${accentColor}60` : "rgba(255,255,255,0.1)"}`,
        borderRadius: 10, padding: "8px 14px", color: "var(--text-primary)",
        fontSize: 13, cursor: "pointer", fontWeight: 600, width: "100%",
        justifyContent: "space-between", transition: "all 0.15s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Building2 size={14} style={{ color: selectedSociety ? accentColor : "#8899aa", flexShrink: 0 }} />
          <span style={{ color: selectedSociety ? accentColor : "var(--text-primary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {loading && <RefreshCw size={11} style={{ color: "#8899aa", animation: "spin 1s linear infinite" }} />}
          {selectedSociety && (
            <button onClick={e => { e.stopPropagation(); onSelect(null); }}
              style={{ background: "none", border: "none", padding: "0 2px", cursor: "pointer", color: "#8899aa", display: "flex" }}>
              <X size={12} />
            </button>
          )}
          <ChevronDown size={12} style={{ color: "#8899aa", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s" }} />
        </div>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: "#1a2233", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12, zIndex: 600, boxShadow: "0 16px 48px rgba(0,0,0,0.6)", overflow: "hidden",
        }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }} />
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search society..."
                style={{ ...inputStyle, padding: "7px 10px 7px 28px", fontSize: 12 }} />
            </div>
          </div>
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            <button onClick={() => { onSelect(null); setOpen(false); setQuery(""); }}
              style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: !selectedSociety ? `${accentColor}12` : "none", border: "none", cursor: "pointer", color: !selectedSociety ? accentColor : "var(--text-primary)", fontSize: 12, fontWeight: !selectedSociety ? 700 : 400, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{placeholder}</span>
              {!selectedSociety && <CheckCircle size={12} style={{ color: accentColor }} />}
            </button>
            {filtered.length === 0 && <div style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12, textAlign: "center" }}>No societies found</div>}
            {filtered.map(s => {
              const isActive = selectedSociety?.societyIdentifier === s.societyIdentifier;
              return (
                <button key={s.societyIdentifier} onClick={() => { onSelect(s); setOpen(false); setQuery(""); }}
                  style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: isActive ? `${accentColor}12` : "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "none"; }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: isActive ? `${accentColor}20` : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: isActive ? accentColor : "#8899aa" }}>
                    {(s.societyName || s.societyIdentifier || "S").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: isActive ? accentColor : "var(--text-primary)", fontSize: 12, fontWeight: isActive ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.societyName || s.societyIdentifier}
                    </div>
                    <div style={{ color: "#8899aa", fontSize: 10 }}>{s.societyIdentifier}</div>
                  </div>
                  {isActive && <CheckCircle size={13} style={{ color: accentColor, flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SEARCHABLE PROPERTY SELECT ────────────────────────────────────────────
const SearchableSelect = ({ label, value, onChange, options, placeholder = "Search..." }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));
  const selected = options.find(o => o.value === value);
  return (
    <div style={{ marginBottom: 14, position: "relative" }} ref={ref}>
      <label style={labelStyle}>{label}</label>
      <div onClick={() => setOpen(p => !p)} style={{ ...inputStyle, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", color: selected ? "var(--text-primary)" : "#3d4a5c", borderColor: open ? "rgba(0,212,170,0.5)" : "rgba(255,255,255,0.1)" }}>
        <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} style={{ color: "#8899aa", flexShrink: 0, marginLeft: 8, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 9999, background: "#1a2233", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }} />
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)} onClick={e => e.stopPropagation()} placeholder="Search property..."
                style={{ ...inputStyle, padding: "7px 10px 7px 30px", fontSize: 12 }} />
            </div>
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {filtered.length === 0 ? <div style={{ padding: "14px", color: "#8899aa", fontSize: 13, textAlign: "center" }}>No property found</div>
              : filtered.map(o => {
                const isSel = o.value === value;
                return (
                  <div key={o.value} onClick={() => { onChange(o.value); setQuery(""); setOpen(false); }}
                    style={{ padding: "10px 14px", fontSize: 13, color: isSel ? "#00d4aa" : "var(--text-primary)", background: isSel ? "rgba(0,212,170,0.1)" : "transparent", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                    onMouseEnter={e => e.currentTarget.style.background = isSel ? "rgba(0,212,170,0.18)" : "rgba(255,255,255,0.05)"}
                    onMouseLeave={e => e.currentTarget.style.background = isSel ? "rgba(0,212,170,0.1)" : "transparent"}>
                    <span>{o.label}</span>
                    {isSel && <CheckCircle2 size={13} color="#00d4aa" />}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PAGINATION ────────────────────────────────────────────────────────────
const Pagination = ({ page, total, perPage, onChange }) => {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const vis = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) vis.push(i);
  const btn = { background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
      <span style={{ color: "#8899aa", fontSize: 12 }}>Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {fmtNum(total)}</span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button onClick={() => onChange(1)} disabled={page === 1} style={{ ...btn, color: page === 1 ? "#556677" : "#8899aa" }}><ChevronsLeft size={12} /></button>
        <button onClick={() => onChange(page - 1)} disabled={page === 1} style={{ ...btn, color: page === 1 ? "#556677" : "#8899aa" }}><ChevronLeft size={12} /></button>
        {vis.map(p => <button key={p} onClick={() => onChange(p)} style={{ ...btn, background: p === page ? "#00d4aa" : "none", border: `1px solid ${p === page ? "#00d4aa" : "var(--border)"}`, color: p === page ? "#000" : "#8899aa", fontWeight: p === page ? 700 : 400, fontSize: 12, minWidth: 30 }}>{p}</button>)}
        <button onClick={() => onChange(page + 1)} disabled={page === pages} style={{ ...btn, color: page === pages ? "#556677" : "#8899aa" }}><ChevronRight size={12} /></button>
        <button onClick={() => onChange(pages)} disabled={page === pages} style={{ ...btn, color: page === pages ? "#556677" : "#8899aa" }}><ChevronsRight size={12} /></button>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function TenantDashboard() {
  const {
    tenants: ctxTenants, setTenants: setCtxTenants,
    selectedSociety, setSelectedSociety,
    societies: contextSocieties,
  } = useAppContext();

  const [allSocieties,       setAllSocieties]       = useState([]);
  const [societiesLoading,   setSocietiesLoading]   = useState(false);
  const [properties,         setProperties]         = useState([]);
  const [societyTenants,     setSocietyTenants]     = useState(null);
  const [societyFetchLoading, setSocietyFetchLoading] = useState(false);

  const [data,         setData]         = useState(() => Array.isArray(ctxTenants) ? ctxTenants.map(mapApiToUi) : []);
  const [search,       setSearch]       = useState("");
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState({ ...defaultForm });
  const [viewItem,     setViewItem]     = useState(null);
  const [page,         setPage]         = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError,  setActionError]  = useState(null);
  const PER = 8;

  // Sync from context
  useEffect(() => { setData(ctxTenants.map(mapApiToUi)); }, [ctxTenants]);

  // ── Fetch societies ────────────────────────────────────────────────────
  useEffect(() => {
    setSocietiesLoading(true);
    getAllSocietyApi()
      .then(res => { const arr = res?.data?.data || res?.data || []; setAllSocieties(Array.isArray(arr) ? arr : []); })
      .catch(() => {
        if (contextSocieties?.length > 0)
          setAllSocieties(contextSocieties.map(s => ({ societyIdentifier: s.societyIdentifier || s.id, societyName: s.societyName || s.name || s.societyIdentifier })));
      })
      .finally(() => setSocietiesLoading(false));
  }, []);

  // ── Fetch properties ──────────────────────────────────────────────────
  useEffect(() => {
    getAllPropertyApi()
      .then(res => setProperties(res?.data?.data || res?.data || []))
      .catch(err => console.error("Property fetch failed:", err));
  }, []);

  // ── When selectedSociety changes → fetch that society's tenants ───────
  useEffect(() => {
    if (!selectedSociety) { setSocietyTenants(null); return; }
    (async () => {
      setSocietyFetchLoading(true);
      try {
        const res = await getAllTenantApi(selectedSociety.societyIdentifier);
        const arr = res?.data?.data || res?.data || [];
        setSocietyTenants((Array.isArray(arr) ? arr : []).map(mapApiToUi));
      } catch (err) {
        console.warn("[SocietyTenants] fetch failed:", err?.message);
        setSocietyTenants(data.filter(t => (t.societyIdentifier || "").toLowerCase() === (selectedSociety.societyIdentifier || "").toLowerCase()));
      } finally {
        setSocietyFetchLoading(false);
      }
    })();
  }, [selectedSociety]);

  // ── If add modal open and selectedSociety changes → auto-update form ──
  useEffect(() => {
    if (modal !== "add") return;
    if (!selectedSociety) {
      setForm(f => ({ ...f, societyIdentifier: "", societyName: "" }));
    } else {
      setForm(f => ({
        ...f,
        societyIdentifier: selectedSociety.societyIdentifier || "",
        societyName: selectedSociety.societyName || "",
      }));
    }
  }, [selectedSociety, modal]);

  // ── Active data ───────────────────────────────────────────────────────
  const activeData = selectedSociety ? (societyTenants || []) : data;

  const syncData = (updater) => {
    setData(prev => { const next = typeof updater === "function" ? updater(prev) : updater; setCtxTenants(next); return next; });
    if (societyTenants) setSocietyTenants(prev => typeof updater === "function" ? updater(prev || []) : updater);
  };

  const propertyOptions = properties.map(p => ({ value: p.propertyIdentifier, label: p.propertyName || p.propertyIdentifier }));

  const filtered = activeData.filter(d => {
    const q = search.toLowerCase();
    return d.firstName?.toLowerCase().includes(q) || d.tenantIdentifier?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) || d.mobileNumber?.includes(q);
  });
  const paged = filtered.slice((page - 1) * PER, page * PER);

  // ── Save ──────────────────────────────────────────────────────────────
  const save = async () => {
    if (!form.firstName?.trim()) { setActionError("First Name is required."); return; }
    if (!form.lastName?.trim()) { setActionError("Last Name is required."); return; }
    if (!form.mobileNumber?.trim()) { setActionError("Mobile number is required."); return; }
    setActionLoading(true); setActionError(null);
    const fd = buildFormData(form);
    const displayName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ");
    try {
      if (form.id) {
        await updateTenantApi(fd, form.tenantIdentifier);
        if (form.vehicleType || form.vehicleNumber) {
          const vfd = new FormData();
          vfd.append("vehicleType", form.vehicleType || "");
          vfd.append("vehicleNumber", form.vehicleNumber || "");
          if (form.vehicleRcFile instanceof File) vfd.append("vehicleRCFiles", form.vehicleRcFile);
          if (form.selectedVehicleId) vfd.append("vehicleId", form.selectedVehicleId);
          await updateVehicleApi(vfd, form.tenantIdentifier);
        }
        syncData(prev => prev.map(r => r.tenantIdentifier === form.tenantIdentifier ? { ...r, ...form, name: displayName } : r));
      } else {
        const res = await addTenantApi(fd);
        const newId = res?.data?.data?.id || res?.data?.id || `local_${Date.now()}`;
        const newTId = res?.data?.data?.tenantIdentifier || res?.data?.tenantIdentifier || `tt${Math.random().toString(16).slice(2, 8)}`;
        syncData(prev => [{ ...defaultForm, ...form, id: newId, tenantIdentifier: newTId, name: displayName, status: "Active" }, ...prev]);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Unknown error";
      setActionError(`Save failed: ${msg}`);
    } finally {
      setActionLoading(false); setModal(null); setForm({ ...defaultForm });
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (row) => {
    if (!window.confirm(`Delete tenant "${row.firstName} ${row.lastName}"?`)) return;
    try {
      await deleteTenantApi(row.tenantIdentifier);
      syncData(prev => prev.filter(r => r.tenantIdentifier !== row.tenantIdentifier));
    } catch (err) { console.error(err); }
  };

  const handleDeleteVehicle = async () => {
    const vehicleId = form.selectedVehicleId;
    if (!vehicleId || !window.confirm("Delete this vehicle?")) return;
    try {
      setActionLoading(true);
      await deleteVehicleApi(form.tenantIdentifier, vehicleId);
      const remaining = form.tenantVehicles.filter(v => String(v.vehicleId) !== String(vehicleId));
      const next = remaining[0] || {};
      setForm(f => ({ ...f, tenantVehicles: remaining, selectedVehicleId: next.vehicleId || "", vehicleType: next.vehicleType || "", vehicleNumber: next.vehicleNumber || "", vehicleRcFile: next.vehicleRcFilePath || "" }));
      syncData(prev => prev.map(r => r.tenantIdentifier === form.tenantIdentifier ? { ...r, tenantVehicles: remaining } : r));
    } catch (err) { setActionError(`Vehicle delete failed: ${err.response?.data?.message || err.message}`); }
    finally { setActionLoading(false); }
  };

  // ── Open modals ───────────────────────────────────────────────────────
  const openAdd = () => {
    setForm({
      ...defaultForm,
      societyIdentifier: selectedSociety?.societyIdentifier || "",
      societyName: selectedSociety?.societyName || "",
    });
    setModal("add");
  };

  const openView = async (row) => {
    try {
      const res = await getTenantApi(row.tenantIdentifier);
      setViewItem(mapSingleTenantToUi(res?.data?.data || res?.data || row));
    } catch { setViewItem(mapApiToUi(row)); }
    setModal("view");
  };

  const openEdit = async (row) => {
    try {
      const res = await getTenantApi(row.tenantIdentifier);
      const mapped = mapSingleTenantToUi(res?.data?.data || res?.data || row);
      setForm({ ...defaultForm, ...mapped, dateOfBirth: toInputDate(mapped.dateOfBirth), anniversary: toInputDate(mapped.anniversary), rentAgreementStartDate: toInputDate(mapped.rentAgreementStartDate), rentAgreementEndDate: toInputDate(mapped.rentAgreementEndDate), rentAgreementFile: null, policeVerificationFile: null, vehicleRcFile: null });
    } catch {
      const mapped = mapApiToUi(row);
      setForm({ ...defaultForm, ...mapped, dateOfBirth: toInputDate(row.dateOfBirth), anniversary: toInputDate(row.anniversary), rentAgreementStartDate: toInputDate(row.rentAgreementStartDate), rentAgreementEndDate: toInputDate(row.rentAgreementEndDate), rentAgreementFile: null, policeVerificationFile: null, vehicleRcFile: null });
    }
    setModal("edit");
  };

  // Form society obj
  const formSocietyObj = form.societyIdentifier
    ? (allSocieties.find(s => s.societyIdentifier === form.societyIdentifier) || { societyIdentifier: form.societyIdentifier, societyName: form.societyName || form.societyIdentifier })
    : null;

  // ─── RENDER ────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 28 }}>
      {actionError && (
        <div style={{ background: "rgba(255,107,107,0.15)", border: "1px solid #ff6b6b", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#ff6b6b", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ {actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: 18 }}>×</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Tenants</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Manage tenant records, agreements, and history</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#1a2a4a,#162040)", border: "1px solid rgba(0,212,170,0.3)", borderRadius: 10, padding: "10px 16px", color: "#e8edf5", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            <Plus size={15} /> Add Tenant
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 10, padding: "10px 16px", color: "#00d4aa", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            <Download size={15} /> Download
          </button>
        </div>
      </div>

      {/* ── Society Search Engine ─────────────────────────────────────── */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={14} style={{ color: "#00d4aa" }} />
            <span style={{ color: "#00d4aa", fontWeight: 700, fontSize: 12, letterSpacing: "0.5px" }}>SOCIETY FILTER</span>
          </div>
          {selectedSociety && (
            <span style={{ color: "#8899aa", fontSize: 11 }}>
              {societyFetchLoading ? "⏳ Loading..." : `${activeData.length} tenant${activeData.length !== 1 ? "s" : ""} found`}
            </span>
          )}
        </div>
        <SocietySearchEngine
          societies={allSocieties}
          selectedSociety={selectedSociety}
          onSelect={(s) => { setSelectedSociety(s); setPage(1); setSearch(""); }}
          loading={societiesLoading || societyFetchLoading}
          accentColor="#00d4aa"
        />
        {selectedSociety && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.15)", borderRadius: 8, fontSize: 12, color: "#8899aa" }}>
            Showing tenants for <strong style={{ color: "#00d4aa" }}>{selectedSociety.societyName || selectedSociety.societyIdentifier}</strong>
            {" "}· Adding a new tenant will pre-fill this society.
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: selectedSociety ? "Society Tenants" : "Total Tenants", value: activeData.length, color: "#6c63ff" },
          { label: "Active", value: activeData.filter(t => t.status === "Active").length, color: "#00d4aa" },
          { label: "Expired", value: activeData.filter(t => t.status === "Expired").length, color: "#ffb347" },
        ].map((s, i) => (
          <div key={i} style={{ background: "var(--bg-card)", border: `1px solid ${s.color}22`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={16} style={{ color: s.color }} />
            </div>
            <div>
              <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600 }}>{s.label}</p>
              <p style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#00d4aa", fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 3, height: 16, background: "#00d4aa", borderRadius: 2 }} />
            LIST OF TENANTS
            {selectedSociety && <span style={{ color: "#8899aa", fontSize: 11, fontWeight: 500, marginLeft: 6 }}>— {selectedSociety.societyName || selectedSociety.societyIdentifier}</span>}
          </div>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, phone, email…"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px 8px 32px", color: "var(--text-primary)", fontSize: 13, outline: "none", width: 240 }} />
          </div>
        </div>

        {societyFetchLoading && (
          <div style={{ padding: "14px 20px", textAlign: "center", color: "#8899aa", fontSize: 13 }}>
            <RefreshCw size={13} style={{ marginRight: 6, display: "inline-block", animation: "spin 1s linear infinite" }} />
            Loading tenants for {selectedSociety?.societyName}...
          </div>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["S.No", "Tenant Name", "Tenant ID", "Mobile", "Email", "Address", "Property", "Agreement End", "Action"].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && !societyFetchLoading ? (
              <tr><td colSpan={9} style={{ padding: "32px", textAlign: "center", color: "#8899aa", fontSize: 14 }}>
                {selectedSociety ? `No tenants found for ${selectedSociety.societyName || selectedSociety.societyIdentifier}` : "No tenants found."}
              </td></tr>
            ) : paged.map((row, i) => (
              <tr key={row.id} style={{ borderBottom: "1px solid var(--border)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{(page - 1) * PER + i + 1}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,212,170,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00d4aa", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                      {row.firstName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}>{row.firstName} {row.lastName}</p>
                      <p style={{ color: "#8899aa", fontSize: 11 }}>{row.gender}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 14px", color: "#00d4aa", fontWeight: 600, fontSize: 12 }}>{row.tenantIdentifier}</td>
                <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{row.mobileNumber}</td>
                <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{row.email}</td>
                <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.address}</td>
                <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontWeight: 600, fontSize: 12 }}>{row.propertyName || row.propertyIdentifier || "—"}</td>
                <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{row.rentAgreementEndDate}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => openView(row)} style={{ background: "rgba(0,180,216,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#00b4d8", cursor: "pointer" }}><Eye size={12} /></button>
                    <button onClick={() => openEdit(row)} style={{ background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#6c63ff", cursor: "pointer" }}><Edit2 size={12} /></button>
                    <button onClick={() => handleDelete(row)} disabled={actionLoading} style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#ff6b6b", cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.6 : 1 }}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
      </div>

      {/* ══ ADD / EDIT MODAL ══ */}
      {(modal === "add" || modal === "edit") && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 780, maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 1 }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>{modal === "edit" ? "Edit Tenant" : "Add New Tenant"}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ padding: 22 }}>
              {/* ── Society ── */}
              <SectionTitle>SOCIETY</SectionTitle>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Society <span style={{ color: "#ff6b6b" }}>*</span></label>
                <SocietySearchEngine
                  societies={allSocieties}
                  selectedSociety={formSocietyObj}
                  onSelect={s => setForm(f => ({ ...f, societyIdentifier: s?.societyIdentifier || "", societyName: s?.societyName || "" }))}
                  loading={societiesLoading}
                  placeholder="Select Society"
                  accentColor="#00d4aa"
                />
              </div>

              {/* Personal Info */}
              <SectionTitle>PERSONAL INFORMATION</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <FI label="First Name *" field="firstName" form={form} setForm={setForm} />
                <FI label="Middle Name" field="middleName" form={form} setForm={setForm} />
                <FI label="Last Name *" field="lastName" form={form} setForm={setForm} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FI label="Mobile Number *" field="mobileNumber" form={form} setForm={setForm} />
                <FI label="Alternate Mobile" field="alternateMobileNumber" form={form} setForm={setForm} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FI label="Email" field="email" type="email" form={form} setForm={setForm} />
                <FS label="Gender" field="gender" options={["Male", "Female", "Other"]} form={form} setForm={setForm} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <FI label="Age" field="age" form={form} setForm={setForm} />
                <FI label="Date of Birth" field="dateOfBirth" type="date" form={form} setForm={setForm} />
                <FI label="Anniversary" field="anniversary" type="date" form={form} setForm={setForm} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FI label="Country" field="country" form={form} setForm={setForm} />
                <FI label="State" field="state" form={form} setForm={setForm} />
                <FI label="City" field="city" form={form} setForm={setForm} />
                <FI label="Pincode" field="pincode" form={form} setForm={setForm} />
              </div>
              <FI label="Aadhar Number" field="aadharNumber" form={form} setForm={setForm} />
              <FI label="Family Members" field="familyMembers" form={form} setForm={setForm} />
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>
                  <input type="checkbox" checked={form.havePet} onChange={e => setForm(f => ({ ...f, havePet: e.target.checked }))} style={{ marginRight: 8 }} />
                  Have Pet
                </label>
              </div>

              {/* Rent Agreement */}
              <SectionTitle>RENT AGREEMENT</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FI label="Agreement Start Date" field="rentAgreementStartDate" type="date" form={form} setForm={setForm} />
                <FI label="Agreement End Date" field="rentAgreementEndDate" type="date" form={form} setForm={setForm} />
              </div>
              <SearchableSelect label="Select Property" value={form.propertyIdentifier} onChange={val => setForm(f => ({ ...f, propertyIdentifier: val }))} options={propertyOptions} placeholder="Search and select property..." />
              <FI label="Rent Registration ID" field="rentRegistrationId" form={form} setForm={setForm} />
              <FI label="Monthly Rent" field="monthlyRent" form={form} setForm={setForm} />
              <FI label="Address" field="address" form={form} setForm={setForm} />
              <FI label="Deposit Amount" field="depositAmount" form={form} setForm={setForm} />
              <FI label="Due Amount" field="dueAmount" form={form} setForm={setForm} />

              {/* Vehicle */}
              <SectionTitle>VEHICLE DETAILS</SectionTitle>
              {modal === "edit" && form.tenantVehicles?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Select Vehicle</label>
                  <select value={form.selectedVehicleId || ""} onChange={e => {
                    const vid = e.target.value;
                    const sel = form.tenantVehicles.find(v => String(v.vehicleId) === String(vid));
                    setForm(f => ({ ...f, selectedVehicleId: vid, vehicleType: sel?.vehicleType || "", vehicleNumber: sel?.vehicleNumber || "", vehicleRcFile: sel?.vehicleRcFilePath || "" }));
                  }} style={{ ...inputStyle, background: "#1a2233" }}>
                    <option value="">-- Select Vehicle --</option>
                    {form.tenantVehicles.map(v => <option key={v.vehicleId} value={v.vehicleId}>{v.vehicleType} — {v.vehicleNumber}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FS label="Vehicle Type" field="vehicleType" options={["2Wheeler", "4Wheeler"]} form={form} setForm={setForm} />
                <FI label="Vehicle Number" field="vehicleNumber" form={form} setForm={setForm} />
              </div>
              {modal === "edit" && form.selectedVehicleId && (
                <div style={{ marginBottom: 14 }}>
                  <button onClick={handleDeleteVehicle} disabled={actionLoading}
                    style={{ background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "8px 16px", color: "#ff6b6b", fontSize: 13, fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Trash2 size={13} /> Delete This Vehicle
                  </button>
                </div>
              )}

              {/* Files */}
              {[["Profile Picture", "profilePic", "image/*"], ["Vehicle RC File", "vehicleRcFile", "*"], ["Rent Agreement File", "rentAgreementFile", "*"], ["Police Verification File", "policeVerificationFile", "*"]].map(([label, field, accept]) => (
                <div key={field} style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>{label}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="file" accept={accept} onChange={e => setForm(f => ({ ...f, [field]: e.target.files?.[0] || null }))} style={{ color: "var(--text-primary)", fontSize: 12 }} />
                    {form[field] && <span style={{ fontSize: 12, color: "#00d4aa", wordBreak: "break-all" }}>📎 {typeof form[field] === "string" ? form[field] : form[field]?.name}</span>}
                  </div>
                </div>
              ))}

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                <button onClick={() => setModal(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer", fontSize: 13 }}>Cancel</button>
                <button onClick={save} disabled={actionLoading} style={{ background: "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 24px", color: "#0d1117", fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.7 : 1, fontSize: 13 }}>
                  {actionLoading ? "Saving…" : modal === "edit" ? "Update Tenant" : "Add Tenant"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ VIEW MODAL ══ */}
      {modal === "view" && viewItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 700, maxHeight: "88vh", overflow: "auto" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 1 }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>Tenant Details</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: 16, background: "rgba(0,212,170,0.06)", borderRadius: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: "rgba(0,212,170,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00d4aa", fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
                  {viewItem.firstName?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16 }}>{[viewItem.firstName, viewItem.middleName, viewItem.lastName].filter(Boolean).join(" ")}</p>
                  <p style={{ color: "#8899aa", fontSize: 12 }}>{viewItem.tenantIdentifier} · {viewItem.gender}</p>
                </div>
                <div style={{ marginLeft: "auto" }}><StatusBadge status={viewItem.status} /></div>
              </div>

              {[["PERSONAL INFORMATION", [["Mobile", viewItem.mobileNumber], ["Alt Mobile", viewItem.alternateMobileNumber], ["Email", viewItem.email], ["Age", viewItem.age], ["Date of Birth", viewItem.dateOfBirth], ["Anniversary", viewItem.anniversary], ["Aadhar", viewItem.aadharNumber], ["Family Members", viewItem.familyMembers], ["Have Pet", viewItem.havePet ? "Yes" : "No"]]],
                ["ADDRESS", [["Address", viewItem.address], ["City", viewItem.city], ["State", viewItem.state], ["Country", viewItem.country], ["Pincode", viewItem.pincode]]],
                ["RENT AGREEMENT", [["Property", viewItem.propertyName], ["Property ID", viewItem.propertyIdentifier], ["Monthly Rent", viewItem.monthlyRent], ["Deposit", viewItem.depositAmount], ["Due Amount", viewItem.dueAmount], ["Agreement Start", viewItem.rentAgreementStartDate], ["Agreement End", viewItem.rentAgreementEndDate]]]
              ].map(([title, rows]) => (
                <div key={title}>
                  <SectionTitle>{title}</SectionTitle>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {rows.map(([label, value]) => (
                      <div key={label} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                        <p style={{ color: "#8899aa", fontSize: 11, marginBottom: 3 }}>{label}</p>
                        <p style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{value || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {viewItem.tenantVehicles?.length > 0 && (
                <>
                  <SectionTitle>VEHICLES</SectionTitle>
                  {viewItem.tenantVehicles.map(v => (
                    <div key={v.vehicleId} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, marginBottom: 8 }}>
                      <div><p style={{ color: "#8899aa", fontSize: 11, marginBottom: 3 }}>Type</p><p style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{v.vehicleType || "—"}</p></div>
                      <div><p style={{ color: "#8899aa", fontSize: 11, marginBottom: 3 }}>Number</p><p style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{v.vehicleNumber || "—"}</p></div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
