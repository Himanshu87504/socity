// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { useAppContext } from "../AppContext";
import {
  Building2, Plus, Search, Edit2, Trash2, Eye, X,
  Home, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  RefreshCw, Loader2, Users, ChevronDown, CheckCircle,
} from "lucide-react";

import {
  addPropertyApi,
  updatePropertyApi,
  deletePropertyApi,
  getAllPropertyApi,
} from "../api/property-api";
import { getAllSocietyApi } from "../api/society-api";
import { getAllWingApi } from "../api/wing-api";

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────
const STATUS_OPTIONS  = ["SOLD", "UNSOLD", "RENTED", "VACANT"];
const DEAL_TYPES      = ["Self Occupied", "Rented", "Vacant", "Other"];
const NARRATION_TYPES = ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "Studio", "Shop", "Office", "Other"];

const statusColors = {
  SOLD:   "#00b4d8",
  UNSOLD: "#6c63ff",
  RENTED: "#ffb347",
  VACANT: "#00d4aa",
};

const emptyForm = {
  propertyName:             "",
  flatNumber:               "",
  floorNumber:              "",
  narration:                "",
  area:                     "",
  status:                   STATUS_OPTIONS[0],
  dealType:                 DEAL_TYPES[0],
  societyIdentifier:        "",
  societyName:              "",
  wingIdentifier:           "",
  flatRegistrationNumber:   "",
  intercomNumber:           "",
  electricityNumber:        "",
  gasConnectionNumber:      "",
  openingPrincipalAmount:   "",
  openingInterestAmount:    "",
  dateOfOpeningBalance:     "",
  dateOfRegistration:       "",
  dateOfAgreement:          "",
  monthlyMaintenance:       "",
  monthlyMaintenanceUpto:   "",
  monthlyPaidArrears:       "",
  monthlyPaidArrearsUpto:   "",
};

// ─────────────────────────────────────────
// Re-mapper
// ─────────────────────────────────────────
function remapProperty(item, i) {
  const primaryMember = item.propertyMembers?.find(m => m.isPrimary)?.member
                     || item.propertyMembers?.[0]?.member;
  return {
    id:                     item.propertyIdentifier || item.id || item._id || i + 1,
    propertyIdentifier:     item.propertyIdentifier || "",
    propertyName:           item.propertyName       || "",
    flatNumber:             item.flatNumber         || "",
    floorNumber:            item.floorNumber        || "",
    narration:              item.narration          || "",
    area:                   item.area               || "",
    status:                 item.status             || "VACANT",
    dealType:               item.dealType           || "",
    societyIdentifier:      item.societyIdentifier  || item.society?.societyIdentifier || "",
    societyName:            item.society?.societyName || item.societyName || "",
    wingIdentifier:         item.wing?.wingIdentifier || item.wingIdentifier || "",
    wingName:               item.wing?.wingName       || item.wingName       || "",
    flatRegistrationNumber: item.flatRegistrationNumber || "",
    intercomNumber:         item.intercomNumber        || "",
    electricityNumber:      item.electricityNumber     || "",
    gasConnectionNumber:    item.gasConnectionNumber   || "",
    openingPrincipalAmount: item.openingPrincipalAmount|| "",
    openingInterestAmount:  item.openingInterestAmount || "",
    dateOfOpeningBalance:   item.dateOfOpeningBalance  || "",
    dateOfRegistration:     item.dateOfRegistration    || "",
    dateOfAgreement:        item.dateOfAgreement       || "",
    monthlyMaintenance:     item.monthlyMaintenance    || "",
    monthlyMaintenanceUpto: item.monthlyMaintenanceUpto|| "",
    monthlyPaidArrears:     item.monthlyPaidArrears    || "",
    monthlyPaidArrearsUpto: item.monthlyPaidArrearsUpto|| "",
    ownerName: primaryMember
      ? [primaryMember.firstName, primaryMember.lastName].filter(Boolean).join(" ")
      : "",
    ownerMobile:     primaryMember?.mobileNumber || "",
    ownerIdentifier: primaryMember?.identifier   || "",
    propertyMembers: item.propertyMembers         || [],
  };
}

function extractArray(response) {
  if (!response) return [];
  const d = response?.data;
  if (Array.isArray(d))          return d;
  if (Array.isArray(d?.data))    return d.data;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.items))   return d.items;
  if (Array.isArray(d?.list))    return d.list;
  if (Array.isArray(d?.records)) return d.records;
  if (d && typeof d === "object") {
    const first = Object.values(d).find(v => Array.isArray(v));
    if (first) return first;
  }
  return [];
}

// ─────────────────────────────────────────
// Form widgets
// ─────────────────────────────────────────
const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  padding: "9px 12px",
  color: "var(--text-primary)",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};
const labelStyle = { display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 };
const fieldWrap  = { marginBottom: 14 };

const FI = ({ label, field, type = "text", form, setForm }) => (
  <div style={fieldWrap}>
    <label style={labelStyle}>{label}</label>
    <input
      type={type}
      value={form[field] || ""}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      style={inputStyle}
    />
  </div>
);

const FS = ({ label, field, options, form, setForm }) => (
  <div style={fieldWrap}>
    <label style={labelStyle}>{label}</label>
    <select
      value={form[field] || ""}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      style={inputStyle}
    >
      <option value="">— Select —</option>
      {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

// ─────────────────────────────────────────
// Society Search Engine
// ─────────────────────────────────────────
function SocietySearchEngine({ societies, selectedSociety, onSelect, loading, placeholder = "All Societies" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = societies.filter(s => {
    const q = query.toLowerCase();
    return (s.societyName || "").toLowerCase().includes(q) ||
           (s.societyIdentifier || "").toLowerCase().includes(q);
  });

  const displayName = selectedSociety
    ? (selectedSociety.societyName || selectedSociety.societyIdentifier || "Society")
    : placeholder;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: selectedSociety ? "rgba(0,180,216,0.08)" : "var(--bg-card)",
          border: `1.5px solid ${selectedSociety ? "rgba(0,180,216,0.4)" : "var(--border-strong)"}`,
          borderRadius: 10, padding: "8px 14px", color: "var(--text-primary)",
          fontSize: 13, cursor: "pointer", fontWeight: 600, width: "100%",
          justifyContent: "space-between", transition: "all 0.15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Building2 size={14} style={{ color: selectedSociety ? "#00b4d8" : "#8899aa", flexShrink: 0 }} />
          <span style={{ color: selectedSociety ? "#00b4d8" : "var(--text-primary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {loading && <RefreshCw size={11} style={{ color: "#8899aa", animation: "spin 1s linear infinite" }} />}
          {selectedSociety && (
            <button
              onClick={e => { e.stopPropagation(); onSelect(null); }}
              style={{ background: "none", border: "none", padding: "0 2px", cursor: "pointer", color: "#8899aa", display: "flex", alignItems: "center" }}
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown size={12} style={{ color: "#8899aa", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s" }} />
        </div>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: "var(--bg-surface, #0f1923)", border: "1px solid var(--border-strong)",
          borderRadius: 12, zIndex: 600, boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search society name or ID..."
                style={{ ...inputStyle, padding: "7px 10px 7px 28px", fontSize: 12, background: "rgba(255,255,255,0.06)" }}
              />
            </div>
          </div>

          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            <button
              onClick={() => { onSelect(null); setOpen(false); setQuery(""); }}
              style={{
                width: "100%", textAlign: "left", padding: "10px 14px",
                background: !selectedSociety ? "rgba(0,180,216,0.08)" : "none",
                border: "none", cursor: "pointer", color: !selectedSociety ? "#00b4d8" : "var(--text-primary)",
                fontSize: 12, fontWeight: !selectedSociety ? 700 : 400, display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span>{placeholder}</span>
              {!selectedSociety && <CheckCircle size={12} style={{ color: "#00b4d8", marginLeft: "auto" }} />}
            </button>

            {filtered.length === 0 && (
              <div style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12, textAlign: "center" }}>No societies found</div>
            )}

            {filtered.map(s => {
              const isActive = selectedSociety?.societyIdentifier === s.societyIdentifier;
              return (
                <button
                  key={s.societyIdentifier}
                  onClick={() => { onSelect(s); setOpen(false); setQuery(""); }}
                  style={{
                    width: "100%", textAlign: "left", padding: "10px 14px",
                    background: isActive ? "rgba(0,180,216,0.08)" : "none",
                    border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "none"; }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: isActive ? "rgba(0,180,216,0.15)" : "rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: isActive ? "#00b4d8" : "#8899aa",
                  }}>
                    {(s.societyName || s.societyIdentifier || "S").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: isActive ? "#00b4d8" : "var(--text-primary)", fontSize: 12, fontWeight: isActive ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.societyName || s.societyIdentifier}
                    </div>
                    <div style={{ color: "#8899aa", fontSize: 10 }}>{s.societyIdentifier}</div>
                  </div>
                  {isActive && <CheckCircle size={13} style={{ color: "#00b4d8", flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────
const fmtNum = n => Number(n).toLocaleString("en-IN");

const Pagination = ({ page, total, perPage, onChange }) => {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const vis = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) vis.push(i);
  const btnBase = { background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
      <span style={{ color: "#8899aa", fontSize: 12 }}>
        Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {fmtNum(total)}
      </span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {[{ Icon: ChevronsLeft, to: 1, disabled: page === 1 }, { Icon: ChevronLeft, to: page - 1, disabled: page === 1 }]
          .map(({ Icon, to, disabled }) => (
            <button key={to} onClick={() => onChange(to)} disabled={disabled}
              style={{ ...btnBase, color: disabled ? "#556677" : "#8899aa", cursor: disabled ? "not-allowed" : "pointer" }}>
              <Icon size={12} />
            </button>
          ))}
        {vis.map(p => (
          <button key={p} onClick={() => onChange(p)}
            style={{ ...btnBase, background: p === page ? "#00b4d8" : "none", border: `1px solid ${p === page ? "#00b4d8" : "var(--border)"}`, color: p === page ? "#000" : "#8899aa", fontWeight: p === page ? 700 : 400, fontSize: 12, minWidth: 30 }}>
            {p}
          </button>
        ))}
        {[{ Icon: ChevronRight, to: page + 1, disabled: page === pages }, { Icon: ChevronsRight, to: pages, disabled: page === pages }]
          .map(({ Icon, to, disabled }) => (
            <button key={to} onClick={() => onChange(to)} disabled={disabled}
              style={{ ...btnBase, color: disabled ? "#556677" : "#8899aa", cursor: disabled ? "not-allowed" : "pointer" }}>
              <Icon size={12} />
            </button>
          ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────
// Toast
// ─────────────────────────────────────────
const Toast = ({ msg, type }) => {
  if (!msg) return null;
  const bg = type === "error" ? "#ff6b6b" : type === "warn" ? "#ffb347" : "#00d4aa";
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000, background: bg, color: "#000", padding: "10px 18px", borderRadius: 10, fontWeight: 600, fontSize: 13, boxShadow: `0 4px 20px ${bg}44` }}>
      {msg}
    </div>
  );
};

// ─────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────
export default function PropertyDashboard() {
  const {
    properties: ctxProperties,
    setProperties: setCtxProperties,
    selectedSociety,
    setSelectedSociety,
    societies: contextSocieties,
  } = useAppContext();

  const [allSocieties,       setAllSocieties]       = useState([]);
  const [filtWings,          setFiltWings]           = useState([]);
  const [societiesLoading,   setSocietiesLoading]   = useState(false);

  // Society-filtered properties from backend
  const [societyProperties,     setSocietyProperties]     = useState(null);
  const [societyFetchLoading,   setSocietyFetchLoading]   = useState(false);

  const [search,       setSearch]       = useState("");
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState(emptyForm);
  const [viewItem,     setViewItem]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page,         setPage]         = useState(1);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [toast,        setToast]        = useState({ msg: "", type: "success" });
  const PER = 10;

  // ── Fetch societies list ───────────────────────────────────────────────
  useEffect(() => {
    setSocietiesLoading(true);
    getAllSocietyApi()
      .then(res => {
        const arr = res?.data?.data || res?.data || [];
        setAllSocieties(Array.isArray(arr) ? arr : []);
      })
      .catch(() => {
        if (contextSocieties?.length > 0) {
          setAllSocieties(contextSocieties.map(s => ({
            societyIdentifier: s.societyIdentifier || s.id,
            societyName: s.societyName || s.name || s.societyIdentifier,
          })));
        }
      })
      .finally(() => setSocietiesLoading(false));
  }, []);

  // ── When selectedSociety changes, fetch that society's properties ──────
  useEffect(() => {
    if (!selectedSociety) {
      setSocietyProperties(null);
      return;
    }
    (async () => {
      setSocietyFetchLoading(true);
      try {
        const res = await getAllPropertyApi(null, selectedSociety.societyIdentifier);
        const arr = extractArray(res);
        setSocietyProperties(arr.map((item, i) => remapProperty(item, i)));
      } catch (err) {
        console.warn("[SocietyProperties] fetch failed:", err?.message);
        setSocietyProperties(
          (ctxProperties || []).filter(p =>
            (p.societyIdentifier || "").toLowerCase() === (selectedSociety.societyIdentifier || "").toLowerCase()
          )
        );
      } finally {
        setSocietyFetchLoading(false);
      }
    })();
  }, [selectedSociety]);

  // ── If add modal is open and selectedSociety changes, auto-update form ──
  useEffect(() => {
    if (modal !== "add") return;
    if (!selectedSociety) {
      setForm(emptyForm);
      setFiltWings([]);
      return;
    }
    (async () => {
      let wings = [];
      try {
        const res = await getAllWingApi(selectedSociety.societyIdentifier);
        const arr = res?.data?.data || res?.data || [];
        wings = Array.isArray(arr) ? arr : [];
      } catch { wings = []; }
      setFiltWings(wings);
      setForm(prev => ({
        ...prev,
        societyIdentifier: selectedSociety.societyIdentifier || "",
        societyName: selectedSociety.societyName || "",
        wingIdentifier: wings.length === 1 ? (wings[0].wingIdentifier || wings[0].identifier || "") : "",
      }));
    })();
  }, [selectedSociety, modal]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  // ── Active data: society-filtered or global ────────────────────────────
  const activeData = selectedSociety ? (societyProperties || []) : (ctxProperties || []);

  // ── Stats ─────────────────────────────────────────────────────────────
  const total  = activeData.length;
  const sold   = activeData.filter(p => p.status === "SOLD").length;
  const unsold = activeData.filter(p => p.status === "UNSOLD").length;
  const rented = activeData.filter(p => p.status === "RENTED").length;
  const vacant = activeData.filter(p => p.status === "VACANT").length;

  // ── Filtered + paginated ──────────────────────────────────────────────
  const filtered = activeData.filter(d =>
    (d.propertyName  || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.flatNumber    || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.ownerName     || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.societyName   || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.wingName      || "").toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice((page - 1) * PER, page * PER);

  // ── Refresh ───────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const sid = selectedSociety?.societyIdentifier || "";
      const res = await getAllPropertyApi(null, sid || undefined);
      const arr = extractArray(res);
      if (arr.length > 0) {
        const mapped = arr.map((item, i) => remapProperty(item, i));
        if (selectedSociety) {
          setSocietyProperties(mapped);
        } else {
          setCtxProperties(mapped);
        }
        showToast(`Refreshed — ${arr.length} records`);
      } else {
        showToast("No data returned", "warn");
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Refresh failed", "error");
    } finally {
      setRefreshing(false);
    }
  };

  // ── Build payload ─────────────────────────────────────────────────────
  const buildPayload = (f) => {
    const payload = {};
    const fields = [
      "propertyName","flatNumber","floorNumber","narration","area","status","dealType",
      "societyIdentifier","wingIdentifier","flatRegistrationNumber","intercomNumber",
      "electricityNumber","gasConnectionNumber","openingPrincipalAmount","openingInterestAmount",
      "dateOfOpeningBalance","dateOfRegistration","dateOfAgreement",
      "monthlyMaintenance","monthlyMaintenanceUpto","monthlyPaidArrears","monthlyPaidArrearsUpto",
    ];
    fields.forEach(k => { if (f[k] !== "" && f[k] != null) payload[k] = f[k]; });
    return payload;
  };

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.societyIdentifier) return showToast("Society required", "warn");
    if (!form.flatNumber.trim()) return showToast("Flat number required", "warn");
    setSaving(true);
    try {
      const payload = buildPayload(form);
      if (form.id) {
        const res = await updatePropertyApi(payload, form.propertyIdentifier || form.id);
        const updated = remapProperty(res?.data?.data || res?.data || { ...form, ...payload }, 0);
        const updater = prev => prev.map(r => r.id === form.id ? { ...r, ...updated } : r);
        setCtxProperties(updater);
        if (societyProperties) setSocietyProperties(updater);
        showToast("Property updated successfully");
      } else {
        const res = await addPropertyApi(payload);
        const newItem = remapProperty(res?.data?.data || res?.data || payload, activeData.length);
        setCtxProperties(prev => [...prev, newItem]);
        if (societyProperties) setSocietyProperties(prev => [...(prev || []), newItem]);
        showToast("Property added successfully");
      }
      setModal(null);
      setForm(emptyForm);
    } catch (err) {
      showToast(err?.response?.data?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePropertyApi(deleteTarget.propertyIdentifier || deleteTarget.id);
      const remover = prev => prev.filter(r => r.id !== deleteTarget.id);
      setCtxProperties(remover);
      if (societyProperties) setSocietyProperties(remover);
      showToast("Property deleted");
      setModal(null);
      setDeleteTarget(null);
    } catch (err) {
      showToast(err?.response?.data?.message || "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ── Society change in form → load wings ───────────────────────────────
  const handleFormSocietyChange = async (societyObj) => {
    if (!societyObj) {
      setForm(f => ({ ...f, societyIdentifier: "", societyName: "", wingIdentifier: "" }));
      setFiltWings([]);
      return;
    }
    try {
      const res = await getAllWingApi(societyObj.societyIdentifier);
      const arr = res?.data?.data || res?.data || [];
      setFiltWings(Array.isArray(arr) ? arr : []);
    } catch (err) {
      setFiltWings([]);
    }
    setForm(f => ({
      ...f,
      societyIdentifier: societyObj.societyIdentifier || "",
      societyName: societyObj.societyName || societyObj.societyIdentifier || "",
      wingIdentifier: "",
    }));
  };

  // ── Open modals ───────────────────────────────────────────────────────
  const openAdd = async () => {
    // Pre-fill society from global selectedSociety and load its wings
    if (selectedSociety) {
      let wings = [];
      try {
        const res = await getAllWingApi(selectedSociety.societyIdentifier);
        const arr = res?.data?.data || res?.data || [];
        wings = Array.isArray(arr) ? arr : [];
      } catch { wings = []; }
      setFiltWings(wings);
      setForm({
        ...emptyForm,
        societyIdentifier: selectedSociety.societyIdentifier || "",
        societyName: selectedSociety.societyName || "",
        // auto-select wing if only one available
        wingIdentifier: wings.length === 1 ? (wings[0].wingIdentifier || wings[0].identifier || "") : "",
        status: STATUS_OPTIONS[0],
        dealType: DEAL_TYPES[0],
      });
    } else {
      setFiltWings([]);
      setForm(emptyForm);
    }
    setModal("add");
  };

  const openEdit = async (row) => {
    try {
      const res = await getAllWingApi(row.societyIdentifier);
      const arr = res?.data?.data || res?.data || [];
      setFiltWings(Array.isArray(arr) ? arr : []);
    } catch { setFiltWings([]); }

    setForm({
      id: row.id,
      propertyIdentifier:     row.propertyIdentifier     || "",
      propertyName:           row.propertyName           || "",
      flatNumber:             row.flatNumber             || "",
      floorNumber:            row.floorNumber            || "",
      narration:              row.narration              || "",
      area:                   row.area                   || "",
      status:                 row.status                 || STATUS_OPTIONS[0],
      dealType:               row.dealType               || "",
      societyIdentifier:      row.societyIdentifier      || "",
      societyName:            row.societyName            || "",
      wingIdentifier:         row.wingIdentifier         || "",
      flatRegistrationNumber: row.flatRegistrationNumber || "",
      intercomNumber:         row.intercomNumber         || "",
      electricityNumber:      row.electricityNumber      || "",
      gasConnectionNumber:    row.gasConnectionNumber    || "",
      openingPrincipalAmount: row.openingPrincipalAmount || "",
      openingInterestAmount:  row.openingInterestAmount  || "",
      dateOfOpeningBalance:   row.dateOfOpeningBalance   || "",
      dateOfRegistration:     row.dateOfRegistration     || "",
      dateOfAgreement:        row.dateOfAgreement        || "",
      monthlyMaintenance:     row.monthlyMaintenance     || "",
      monthlyMaintenanceUpto: row.monthlyMaintenanceUpto || "",
      monthlyPaidArrears:     row.monthlyPaidArrears     || "",
      monthlyPaidArrearsUpto: row.monthlyPaidArrearsUpto || "",
    });
    setModal("edit");
  };

  const openView   = (row) => { setViewItem(row); setModal("view"); };
  const openDelete = (row) => { setDeleteTarget(row); setModal("deleteConfirm"); };

  // Form society object for search engine
  const formSocietyObj = form.societyIdentifier
    ? (allSocieties.find(s => s.societyIdentifier === form.societyIdentifier)
       || { societyIdentifier: form.societyIdentifier, societyName: form.societyName || form.societyIdentifier })
    : null;

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────
  return (
    <div style={{ padding: 28 }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Properties</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Manage flats, units and ownership details</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleRefresh} disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", color: "#8899aa", fontWeight: 600, fontSize: 13, cursor: refreshing ? "not-allowed" : "pointer" }}>
            {refreshing ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={14} />}
          </button>
          <button onClick={openAdd}
            style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#1a2a4a,#162040)", border: "1px solid rgba(0,180,216,0.3)", borderRadius: 10, padding: "10px 18px", color: "#e8edf5", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            <Plus size={15} /> Add Property
          </button>
        </div>
      </div>

      {/* ── Society Search Engine ─────────────────────────────────────── */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={14} style={{ color: "#00b4d8" }} />
            <span style={{ color: "#00b4d8", fontWeight: 700, fontSize: 12, letterSpacing: "0.5px" }}>SOCIETY FILTER</span>
          </div>
          {selectedSociety && (
            <span style={{ color: "#8899aa", fontSize: 11 }}>
              {societyFetchLoading ? "⏳ Loading..." : `${activeData.length} propert${activeData.length !== 1 ? "ies" : "y"} found`}
            </span>
          )}
        </div>
        <SocietySearchEngine
          societies={allSocieties}
          selectedSociety={selectedSociety}
          onSelect={(s) => {
            setSelectedSociety(s);
            setPage(1);
            setSearch("");
          }}
          loading={societiesLoading || societyFetchLoading}
        />
        {selectedSociety && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(0,180,216,0.06)", border: "1px solid rgba(0,180,216,0.15)", borderRadius: 8, fontSize: 12, color: "#8899aa" }}>
            Showing properties for <strong style={{ color: "#00b4d8" }}>{selectedSociety.societyName || selectedSociety.societyIdentifier}</strong>
            {" "}({selectedSociety.societyIdentifier}) · Adding a new property will pre-fill this society.
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard color="#00d4aa" value={total}  label={selectedSociety ? "THIS SOCIETY" : "TOTAL"} />
        <StatCard color="#00b4d8" value={sold}   label="SOLD" />
        <StatCard color="#6c63ff" value={unsold} label="UNSOLD" />
        <StatCard color="#ffb347" value={rented} label="RENTED" />
        <StatCard color="#ff6b6b" value={vacant} label="VACANT" />
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#00b4d8", fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 3, height: 16, background: "#00b4d8", borderRadius: 2 }} />
            LIST OF PROPERTIES
            {selectedSociety && (
              <span style={{ color: "#8899aa", fontSize: 11, fontWeight: 500, marginLeft: 6 }}>
                — {selectedSociety.societyName || selectedSociety.societyIdentifier}
              </span>
            )}
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

        {/* Loading bar */}
        {societyFetchLoading && (
          <div style={{ padding: "14px 20px", textAlign: "center", color: "#8899aa", fontSize: 13, background: "rgba(0,180,216,0.03)" }}>
            <RefreshCw size={13} style={{ marginRight: 6, display: "inline-block", animation: "spin 1s linear infinite" }} />
            Loading properties for {selectedSociety?.societyName}...
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["S.No", "Property Name", "Flat No.", "Wing", "Society", "Type", "Area", "Owner", "Status", "Action"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && !societyFetchLoading ? (
                <tr><td colSpan={10} style={{ padding: 32, textAlign: "center", color: "#8899aa", fontSize: 13 }}>
                  {selectedSociety ? `No properties found for ${selectedSociety.societyName || selectedSociety.societyIdentifier}` : "No properties found"}
                </td></tr>
              ) : paged.map((row, i) => {
                const sc = statusColors[row.status] || "#8899aa";
                return (
                  <tr key={row.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{(page - 1) * PER + i + 1}</td>
                    <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}>{row.propertyName || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#00b4d8", fontWeight: 600, fontSize: 12 }}>{row.flatNumber || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{row.wingName || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{row.societyName || "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: "rgba(108,99,255,0.12)", color: "#6c63ff", padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {row.narration || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{row.area ? `${row.area} sq ft` : "—"}</td>
                    <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}>{row.ownerName || "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: `${sc}18`, color: sc, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {row.status || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <ActionBtn color="#00b4d8" icon={<Eye size={12} />}    onClick={() => openView(row)} />
                        <ActionBtn color="#6c63ff" icon={<Edit2 size={12} />}  onClick={() => openEdit(row)} />
                        <ActionBtn color="#ff6b6b" icon={<Trash2 size={12} />} onClick={() => openDelete(row)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
      </div>

      {/* ══════ ADD / EDIT MODAL ══════ */}
      {(modal === "add" || modal === "edit") && (
        <Overlay onClose={() => setModal(null)}>
          <ModalBox title={modal === "edit" ? "Edit Property" : "Add Property"} onClose={() => setModal(null)} maxWidth={560}>
            <div style={{ padding: 22 }}>

              {/* Society — Search Engine */}
              <div style={fieldWrap}>
                <label style={labelStyle}>Society <span style={{ color: "#ff6b6b" }}>*</span></label>
                <SocietySearchEngine
                  societies={allSocieties}
                  selectedSociety={formSocietyObj}
                  onSelect={handleFormSocietyChange}
                  loading={societiesLoading}
                  placeholder="Select Society"
                />
              </div>

              {/* Wing */}
              <div style={fieldWrap}>
                <label style={labelStyle}>Wing</label>
                <select
                  value={form.wingIdentifier || ""}
                  onChange={e => setForm(f => ({ ...f, wingIdentifier: e.target.value }))}
                  style={{ ...inputStyle, opacity: !form.societyIdentifier ? 0.5 : 1 }}
                  disabled={!form.societyIdentifier}
                >
                  <option value="">{!form.societyIdentifier ? "Select Society first" : "Select Wing"}</option>
                  {filtWings.map(w => {
                    const id = w.wingIdentifier || w.identifier || String(w.id);
                    return <option key={id} value={id}>{w.wingName || w.name || id}</option>;
                  })}
                </select>
              </div>

              {/* Row: Flat No + Floor No */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FI label="Flat Number *" field="flatNumber"  form={form} setForm={setForm} />
                <FI label="Floor Number"  field="floorNumber" form={form} setForm={setForm} />
              </div>

              {/* Property Name */}
              <FI label="Property Name" field="propertyName" form={form} setForm={setForm} />

              {/* Row: Narration + Area */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FS label="Type (Narration)" field="narration" options={NARRATION_TYPES} form={form} setForm={setForm} />
                <FI label="Area (sq ft)"     field="area"      form={form} setForm={setForm} />
              </div>

              {/* Row: Status + Deal Type */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FS label="Status"    field="status"   options={STATUS_OPTIONS} form={form} setForm={setForm} />
                <FS label="Deal Type" field="dealType" options={DEAL_TYPES}     form={form} setForm={setForm} />
              </div>

              {/* Section: Registration & Utility */}
              <SectionLabel label="REGISTRATION & UTILITY" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FI label="Flat Registration No" field="flatRegistrationNumber" form={form} setForm={setForm} />
                <FI label="Intercom Number"       field="intercomNumber"         form={form} setForm={setForm} />
                <FI label="Electricity Number"    field="electricityNumber"      form={form} setForm={setForm} />
                <FI label="Gas Connection No"     field="gasConnectionNumber"    form={form} setForm={setForm} />
              </div>

              {/* Section: Opening Balance */}
              <SectionLabel label="OPENING BALANCE" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FI label="Principal Amount"     field="openingPrincipalAmount" form={form} setForm={setForm} />
                <FI label="Interest Amount"      field="openingInterestAmount"  form={form} setForm={setForm} />
                <FI label="Date of Opening Bal"  field="dateOfOpeningBalance"   type="date" form={form} setForm={setForm} />
                <FI label="Date of Registration" field="dateOfRegistration"     type="date" form={form} setForm={setForm} />
                <FI label="Date of Agreement"    field="dateOfAgreement"        type="date" form={form} setForm={setForm} />
              </div>

              {/* Section: Maintenance */}
              <SectionLabel label="MAINTENANCE" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FI label="Monthly Maintenance"  field="monthlyMaintenance"     form={form} setForm={setForm} />
                <FI label="Maintenance Upto"     field="monthlyMaintenanceUpto" type="date" form={form} setForm={setForm} />
                <FI label="Monthly Paid Arrears" field="monthlyPaidArrears"     form={form} setForm={setForm} />
                <FI label="Paid Arrears Upto"    field="monthlyPaidArrearsUpto" type="date" form={form} setForm={setForm} />
              </div>

              {/* Footer */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
                <button onClick={() => setModal(null)}
                  style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#00b4d8,#6c63ff)", border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </ModalBox>
        </Overlay>
      )}

      {/* ══════ VIEW MODAL ══════ */}
      {modal === "view" && viewItem && (
        <Overlay onClose={() => setModal(null)}>
          <ModalBox title="Property Details" onClose={() => setModal(null)} maxWidth={480}>
            <div style={{ padding: 22 }}>
              <div style={{ background: "rgba(0,180,216,0.08)", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(0,180,216,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Home size={20} style={{ color: "#00b4d8" }} />
                </div>
                <div>
                  <p style={{ color: "#00b4d8", fontWeight: 700 }}>{viewItem.propertyName || viewItem.flatNumber}</p>
                  <p style={{ color: "#8899aa", fontSize: 12 }}>{viewItem.narration} · {viewItem.area ? `${viewItem.area} sq ft` : ""}</p>
                </div>
                <span style={{ marginLeft: "auto", background: `${statusColors[viewItem.status] || "#8899aa"}18`, color: statusColors[viewItem.status] || "#8899aa", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                  {viewItem.status}
                </span>
              </div>

              {[
                ["Flat Number",  viewItem.flatNumber   || "—"],
                ["Floor Number", viewItem.floorNumber  || "—"],
                ["Wing",         viewItem.wingName     || "—"],
                ["Society",      viewItem.societyName  || "—"],
                ["Deal Type",    viewItem.dealType     || "—"],
                ["Owner",        viewItem.ownerName    || "—"],
                ["Owner Mobile", viewItem.ownerMobile  || "—"],
              ].map(([k, v]) => <ViewRow key={k} label={k} value={v} />)}

              {(viewItem.flatRegistrationNumber || viewItem.intercomNumber || viewItem.electricityNumber || viewItem.gasConnectionNumber) && (
                <>
                  <SectionLabel label="REGISTRATION & UTILITY" small />
                  {[
                    ["Flat Reg No", viewItem.flatRegistrationNumber || "—"],
                    ["Intercom",    viewItem.intercomNumber         || "—"],
                    ["Electricity", viewItem.electricityNumber      || "—"],
                    ["Gas Conn",    viewItem.gasConnectionNumber    || "—"],
                  ].map(([k, v]) => <ViewRow key={k} label={k} value={v} />)}
                </>
              )}

              {(viewItem.openingPrincipalAmount || viewItem.openingInterestAmount) && (
                <>
                  <SectionLabel label="OPENING BALANCE" small />
                  {[
                    ["Principal",      viewItem.openingPrincipalAmount ? `₹${viewItem.openingPrincipalAmount}` : "—"],
                    ["Interest",       viewItem.openingInterestAmount  ? `₹${viewItem.openingInterestAmount}`  : "—"],
                    ["Opening Date",   viewItem.dateOfOpeningBalance   || "—"],
                    ["Reg Date",       viewItem.dateOfRegistration     || "—"],
                    ["Agreement Date", viewItem.dateOfAgreement        || "—"],
                  ].map(([k, v]) => <ViewRow key={k} label={k} value={v} />)}
                </>
              )}

              {viewItem.propertyMembers?.length > 0 && (
                <>
                  <SectionLabel label="MEMBERS" small />
                  {viewItem.propertyMembers.map((pm, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,180,216,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Users size={12} style={{ color: "#00b4d8" }} />
                        </div>
                        <span style={{ color: "var(--text-primary)", fontSize: 13 }}>
                          {[pm.member?.firstName, pm.member?.lastName].filter(Boolean).join(" ") || "—"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {pm.isPrimary && <span style={{ background: "rgba(0,212,170,0.15)", color: "#00d4aa", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>Primary</span>}
                        <span style={{ color: "#8899aa", fontSize: 12 }}>{pm.member?.mobileNumber || ""}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </ModalBox>
        </Overlay>
      )}

      {/* ══════ DELETE MODAL ══════ */}
      {modal === "deleteConfirm" && deleteTarget && (
        <Overlay onClose={() => setModal(null)}>
          <ModalBox title="Confirm Delete" onClose={() => setModal(null)} maxWidth={380}>
            <div style={{ padding: "16px 22px 22px" }}>
              <p style={{ color: "#8899aa", fontSize: 13, marginBottom: 20 }}>
                Are you sure you want to delete{" "}
                <span style={{ color: "#ff6b6b", fontWeight: 700 }}>
                  {deleteTarget.propertyName || deleteTarget.flatNumber}
                </span>
                ? This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setModal(null)}
                  style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  style={{ display: "flex", alignItems: "center", gap: 7, background: "#ff6b6b", border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer" }}>
                  {deleting && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </ModalBox>
        </Overlay>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────
const StatCard = ({ color, value, label }) => (
  <div style={{ background: "var(--bg-card)", border: `1px solid ${color}22`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
    <p style={{ color, fontSize: 22, fontWeight: 700 }}>{value}</p>
    <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, marginTop: 2 }}>{label}</p>
  </div>
);

const ActionBtn = ({ color, icon, onClick }) => (
  <button onClick={onClick} style={{ background: `${color}1a`, border: "none", borderRadius: 6, padding: "5px 8px", color, cursor: "pointer" }}>
    {icon}
  </button>
);

const Overlay = ({ children, onClose }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div onClick={e => e.stopPropagation()}>{children}</div>
  </div>
);

const ModalBox = ({ title, onClose, children, maxWidth = 500 }) => (
  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth, maxHeight: "85vh", overflow: "auto" }}>
    <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 1 }}>
      <h3 style={{ color: "var(--text-primary)", fontWeight: 700, margin: 0 }}>{title}</h3>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}><X size={18} /></button>
    </div>
    {children}
  </div>
);

const ViewRow = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
    <span style={{ color: "#8899aa", fontSize: 13 }}>{label}</span>
    <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{value}</span>
  </div>
);

const SectionLabel = ({ label, small }) => (
  <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", margin: small ? "14px 0 8px" : "4px 0 10px", borderTop: small ? "none" : "1px solid var(--border)", paddingTop: small ? 0 : 14 }}>
    {label}
  </p>
);
