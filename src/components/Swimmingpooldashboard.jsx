// SwimmingPoolDashboard.jsx

import React, { useState, useEffect } from "react";
import {
  Waves, Plus, Search,
  Edit2, Trash2, Eye, X,
  ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
  CheckCircle2,
  Users, Clock,
  ShirtIcon, Ticket, Hash,
} from "lucide-react";

import {
  createSwimmingPoolApi,
  updateSwimmingPoolApi,
  getAllSwimmingPoolApi,
  deleteSwimmingPoolApi,
} from "../api/application-api";
import { useAppContext } from "../AppContext";

// ─── CONSTANTS ───────────────────────────────

const GENDER_OPTIONS = ["Male", "Female", "Other"];

const EMPTY_PARTICIPANT = {
  participantName: "",
  gender: "male",
  age: "",
  isMedicalDisease: false,
  nameOfDisease: "",
};

// ✅ EMPTY_FORM.
// NOTE: `societyIdentifier` isn't part of the actual swimming-pool API response
// or create payload (confirmed against the real backend sample) — it's
// included here and sent to the backend per explicit request, but the backend
// may simply ignore or reject it if it doesn't have a matching column.
const EMPTY_FORM = {
  committeeMemberId: "",        // mandatory (dropdown)
  propertyIdentifier: "",       // mandatory (dropdown)
  societyIdentifier: "",        // mandatory (dropdown) — not in the real API response, sent anyway per request
  numberOfParticipants: 0,      // derived from participants.length
  startDateTime: "",            // mandatory
  endDateTime: "",              // optional
  duration: "",                 // optional, plain number of hours
  isHavePasses: false,
  isHaveConstumes: false,
  remark: "",
  participants: [],             // optional, can be empty array
};

const PER_PAGE = 9;

// ─── VALIDATION ──────────────────────────────

const validateForm = (form) => {
  const errors = {};
  if (!form.committeeMemberId?.trim()) errors.committeeMemberId = "Committee Member is required";
  if (!form.propertyIdentifier?.trim()) errors.propertyIdentifier = "Property is required";
  if (!form.societyIdentifier?.trim()) errors.societyIdentifier = "Society is required";
  if (!form.startDateTime)              errors.startDateTime      = "Start Date & Time is required";
  return errors;
};

// ─── HELPERS ─────────────────────────────────

const safeStr = (v) => (v == null ? "" : String(v));
const formatNumber = (n) => Number(n).toLocaleString("en-IN");

// The API returns dates as "DD-MM-YYYY hh:mm AM/PM" (e.g. "16-06-2026 09:50 AM"),
// which `new Date(...)` cannot parse reliably. This converts that exact format
// into a real Date object. Falls back to a native Date parse for any value
// that's already ISO (e.g. optimistic local entries we create ourselves).
const parseApiDateTime = (str) => {
  if (!str) return null;
  const match = String(str).match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    const fallback = new Date(str);
    return isNaN(fallback) ? null : fallback;
  }
  const [, dd, mm, yyyy, hhRaw, min, ampm] = match;
  let hh = parseInt(hhRaw, 10);
  if (/PM/i.test(ampm) && hh !== 12) hh += 12;
  if (/AM/i.test(ampm) && hh === 12) hh = 0;
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd), hh, Number(min));
};

// Converts the API's date string into a proper ISO string for internal storage
// (so formatDateTime / calcDuration / sorting all work normally downstream).
const toIsoString = (str) => {
  const d = parseApiDateTime(str);
  return d ? d.toISOString() : "";
};

// Converts a stored ISO string into the "YYYY-MM-DDTHH:mm" format required by
// <input type="datetime-local"> so editing a booking shows the correct value.
const toDatetimeLocalValue = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Converts a <input type="datetime-local"> value back into the ISO string the
// API expects for create/update (e.g. "2026-06-16T09:50:00.000Z").
const toApiIso = (localDt) => {
  if (!localDt) return "";
  const d = new Date(localDt);
  return isNaN(d) ? "" : d.toISOString();
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const calcDuration = (start, end) => {
  if (!start || !end) return null;
  const ms = new Date(end) - new Date(start);
  if (isNaN(ms) || ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export function mapSwimmingPool(item, i) {
  const participants = Array.isArray(item.participants) ? item.participants : [];
  return {
    id: item.swimingId || item.id || item._id || i + 1,
    applicationIdentifier: safeStr(
      item.applicationIdentifier || `SW-${String(i + 1).padStart(5, "0")}`
    ),
    committeeMemberId: safeStr(item.committeeMemberId || ""),
    parentCommitteeMemberId: safeStr(item.parentCommitteeMemberId || ""),
    societyIdentifier: safeStr(item.societyIdentifier || item.society?.societyIdentifier || ""),
    societyName: safeStr(item.society?.societyName || ""),
    propertyIdentifier: safeStr(item.propertyIdentifier || item.property?.propertyIdentifier || ""),
    propertyName: safeStr(item.property?.propertyName || ""),
    // API returns this as a string (e.g. "0") — Number() handles that fine.
    numberOfParticipants: Number(item.numberOfParticipants) || 0,
    // API returns "DD-MM-YYYY hh:mm AM/PM" — normalise to ISO internally.
    startDateTime: toIsoString(item.startDateTime) || safeStr(item.startDateTime || ""),
    endDateTime: toIsoString(item.endDateTime) || safeStr(item.endDateTime || ""),
    isHavePasses: Boolean(item.isHavePasses),
    isHaveConstumes: Boolean(item.isHaveConstumes),
    remark: safeStr(item.remark || ""),
    isActive: item.isActive !== false,
    // Real API default is "N/A", not "Pending" — only Approved/Rejected are explicit decisions.
    approvedStatus: safeStr(item.approvedStatus || "N/A"),
    parentApprovedStatus: safeStr(item.parentApprovedStatus || "N/A"),
    parentApprovedAt: safeStr(item.parentApprovedAt || ""),
    approvedAt: safeStr(item.approvedAt || ""),
    approvarRemark: safeStr(item.approvarRemark || ""),
    parentApprovarRemark: safeStr(item.parentApprovarRemark || ""),
    createdBy: safeStr(item.createdBy || ""),
    createdAt: safeStr(item.createdAt || ""),
    updatedAt: safeStr(item.updatedAt || ""),
    duration: item.duration || null,
    participants: participants.map((p) => ({
      swimParticipantId: p.swimParticipantId || p.id || "",
      participantName: safeStr(p.participantName || ""),
      gender: safeStr(p.gender || ""),
      age: Number(p.age) || 0,
      isMedicalDisease: Boolean(p.isMedicalDisease),
      nameOfDisease: safeStr(p.nameOfDisease || ""),
    })),
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

const inputErrorStyle = {
  ...inputStyle,
  border: "1px solid rgba(255,107,107,0.6)",
};

const labelStyle = {
  display: "block",
  color: "#6b7a90",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.2px",
  marginBottom: 6,
};

const errorTextStyle = {
  color: "#ff6b6b",
  fontSize: 10,
  marginTop: 4,
  fontWeight: 500,
};

const fieldWrapper = { marginBottom: 13 };
const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

// ─── STATUS BADGE ─────────────────────────────

const STATUS_COLORS = {
  Approved: { bg: "rgba(0,212,170,0.12)", color: "#00d4aa" },
  Pending:  { bg: "rgba(255,179,71,0.12)",  color: "#ffb347" },
  Rejected: { bg: "rgba(255,107,107,0.12)", color: "#ff6b6b" },
  "N/A":    { bg: "rgba(255,179,71,0.12)",  color: "#ffb347" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_COLORS[status] || STATUS_COLORS["N/A"];
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "3px 9px", borderRadius: 20,
      fontSize: 11, fontWeight: 600,
    }}>
      {status === "N/A" ? "Pending" : (status || "Pending")}
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

const FormInput = ({ label, field, type = "text", form, setForm, errors = {}, placeholder = "" }) => (
  <div style={fieldWrapper}>
    <label style={labelStyle}>{label}</label>
    <input
      type={type}
      value={form[field] ?? ""}
      placeholder={placeholder}
      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
      style={errors[field] ? inputErrorStyle : inputStyle}
    />
    {errors[field] && <p style={errorTextStyle}>{errors[field]}</p>}
  </div>
);

// ─── FORM SELECT (dropdown) ───────────────────
// `options` is an array of { value, label }. If the form's current value isn't
// present in `options` (e.g. editing a record whose identifier no longer
// matches an option from context), it's injected as a fallback option so the
// dropdown never silently shows blank/wrong data.
const FormSelect = ({ label, field, form, setForm, errors = {}, options = [], placeholder = "Select…" }) => {
  const currentValue = form[field] ?? "";
  const hasCurrentInOptions = options.some((o) => o.value === currentValue);
  return (
    <div style={fieldWrapper}>
      <label style={labelStyle}>{label}</label>
      <select
        value={currentValue}
        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
        style={{ ...(errors[field] ? inputErrorStyle : inputStyle), cursor: "pointer" }}
      >
        <option value="" disabled>{placeholder}</option>
        {!hasCurrentInOptions && currentValue && (
          <option value={currentValue}>{currentValue}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {errors[field] && <p style={errorTextStyle}>{errors[field]}</p>}
    </div>
  );
};

// ─── TOGGLE SWITCH ────────────────────────────

const ToggleSwitch = ({ label, field, form, setForm }) => (
  <div style={{
    ...fieldWrapper,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 12px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 9,
  }}>
    <label style={{ ...labelStyle, marginBottom: 0, color: "var(--text-primary)", fontSize: 13 }}>{label}</label>
    <div
      onClick={() => setForm((f) => ({ ...f, [field]: !f[field] }))}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: form[field] ? "#00b4d8" : "rgba(255,255,255,0.12)",
        position: "relative", cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff",
        position: "absolute", top: 3,
        left: form[field] ? 21 : 3,
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }} />
    </div>
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
  const isLast  = page === totalPages;

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
        <button onClick={() => onChange(1)}          disabled={isFirst} style={{ ...btnBase, color: isFirst ? "#556677" : "#8899aa" }}><ChevronsLeft  size={12} /></button>
        <button onClick={() => onChange(page - 1)}   disabled={isFirst} style={{ ...btnBase, color: isFirst ? "#556677" : "#8899aa" }}><ChevronLeft   size={12} /></button>
        {visiblePages.map((p) => (
          <button key={p} onClick={() => onChange(p)} style={{
            ...btnBase,
            background:  p === page ? "#00b4d8" : "none",
            border:      `1px solid ${p === page ? "#00b4d8" : "var(--border)"}`,
            color:       p === page ? "#000" : "#8899aa",
            fontWeight:  p === page ? 700 : 400,
            fontSize: 12, minWidth: 30,
          }}>{p}</button>
        ))}
        <button onClick={() => onChange(page + 1)}   disabled={isLast}  style={{ ...btnBase, color: isLast ? "#556677" : "#8899aa" }}><ChevronRight  size={12} /></button>
        <button onClick={() => onChange(totalPages)} disabled={isLast}  style={{ ...btnBase, color: isLast ? "#556677" : "#8899aa" }}><ChevronsRight size={12} /></button>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────

export default function SwimmingPoolDashboard() {

  const {
    swimmingPools: ctxPools, setSwimmingPools,
    // NOTE: these context keys are assumed (properties/societies/committeeMembers
    // lists fetched elsewhere in the app, the same way swimmingPools is).
    // Rename these to match whatever your AppContext actually exposes.
    properties: ctxProperties,
    societies: ctxSocieties,
    committeeMembers: ctxCommitteeMembers,
  } = useAppContext();

  // Normalised dropdown options. Defensive fallback chains so this doesn't
  // break if the context objects use slightly different field names.
  const propertyOptions = (ctxProperties || []).map((p) => ({
    value: safeStr(p.propertyIdentifier || p.id || p._id || ""),
    label: safeStr(p.propertyName || p.name || p.propertyIdentifier || "Unnamed Property"),
  })).filter((o) => o.value);

  const societyOptions = (ctxSocieties || []).map((s) => ({
    value: safeStr(s.societyIdentifier || s.id || s._id || ""),
    label: safeStr(s.societyName || s.name || s.societyIdentifier || "Unnamed Society"),
  })).filter((o) => o.value);

  const committeeMemberOptions = (ctxCommitteeMembers || []).map((c) => ({
    value: safeStr(c.committeeMemberId || c.id || c._id || ""),
    label: safeStr(c.memberName || c.fullName || c.name || c.committeeMemberId || "Unnamed Member"),
  })).filter((o) => o.value);

  const [localData,     setLocalData]     = useState(null);
  const [search,        setSearch]        = useState("");
  const [page,          setPage]          = useState(1);
  const [modal,         setModal]         = useState(null); // "add" | "edit" | "view"
  const [form,          setForm]          = useState({ ...EMPTY_FORM });
  const [formErrors,    setFormErrors]    = useState({});
  const [viewItem,      setViewItem]      = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError,   setActionError]   = useState(null);
  const [statusFilter,  setStatusFilter]  = useState("All");
  const [fetchLoading,  setFetchLoading]  = useState(false);
  const [fetchError,    setFetchError]    = useState(null);

  // ─── FETCH ────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      setFetchLoading(true);
      setFetchError(null);
      try {
        const res = await getAllSwimmingPoolApi();
        // Normalise: API may return single object or array
        const raw  = res?.data?.data;
        const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
        const mapped = list.map((item, i) => mapSwimmingPool(item, i));
        setLocalData(mapped);
        if (setSwimmingPools) setSwimmingPools(() => mapped);
      } catch (err) {
        console.error("[SwimmingPool Fetch] Failed:", err?.message);
        setFetchError("Failed to load swimming pool bookings. Showing cached data.");
      } finally {
        setFetchLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeData = localData || ctxPools || [];

  // ─── STATS ────────────────────────────────────
  // "N/A" is the API's default no-decision-yet status, so it counts as pending too.

  const totalParticipants = activeData.reduce((sum, r) => sum + (r.numberOfParticipants || 0), 0);
  const pendingCount       = activeData.filter((r) => r.approvedStatus === "Pending" || r.approvedStatus === "N/A").length;
  const approvedCount      = activeData.filter((r) => r.approvedStatus === "Approved").length;

  const stats = [
    { label: "Total Bookings",    value: activeData.length, color: "#00b4d8", icon: Waves        },
    { label: "Total Participants",value: totalParticipants,  color: "#6c63ff", icon: Users        },
    { label: "Approved",          value: approvedCount,      color: "#00d4aa", icon: CheckCircle2 },
    { label: "Pending Approval",  value: pendingCount,       color: "#ffb347", icon: Clock        },
  ];

  const syncData = (updater) => {
    setLocalData(updater(activeData));
    if (setSwimmingPools) setSwimmingPools(updater);
  };

  // ─── FILTER / PAGINATION ──────────────────────

  const STATUS_TABS = ["All", "Pending", "Approved", "Rejected"];

  const filtered = activeData.filter((r) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = (
      safeStr(r.applicationIdentifier).toLowerCase().includes(q) ||
      safeStr(r.propertyName).toLowerCase().includes(q)         ||
      safeStr(r.propertyIdentifier).toLowerCase().includes(q)   ||
      safeStr(r.societyName).toLowerCase().includes(q)          ||
      safeStr(r.societyIdentifier).toLowerCase().includes(q)    ||
      safeStr(r.remark).toLowerCase().includes(q)               ||
      r.participants.some((p) => safeStr(p.participantName).toLowerCase().includes(q))
    );
    // "Pending" tab also matches the API's raw "N/A" default status.
    const matchesStatus =
      statusFilter === "All" ||
      r.approvedStatus === statusFilter ||
      (statusFilter === "Pending" && r.approvedStatus === "N/A");
    return matchesSearch && matchesStatus;
  });

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ─── PARTICIPANT HELPERS ──────────────────────

  const addParticipant = () => {
    setForm((f) => {
      const updated = [...(f.participants || []), { ...EMPTY_PARTICIPANT }];
      return { ...f, participants: updated, numberOfParticipants: updated.length };
    });
  };

  const removeParticipant = (idx) => {
    setForm((f) => {
      const updated = f.participants.filter((_, i) => i !== idx);
      return { ...f, participants: updated, numberOfParticipants: updated.length };
    });
  };

  const updateParticipant = (idx, field, value) => {
    setForm((f) => {
      const updated = f.participants.map((p, i) =>
        i === idx ? { ...p, [field]: value } : p
      );
      return { ...f, participants: updated };
    });
  };

  // ─── SAVE ────────────────────────────────────

  const handleSave = async () => {
    // Client-side validation
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setActionLoading(true);
    setActionError(null);

    // ✅ Payload: committeeMemberId, propertyIdentifier, societyIdentifier are
    // all required dropdown selections now, so they're sent unconditionally.
    // NOTE: societyIdentifier still isn't part of the real backend response —
    // it's included here per explicit request, but the backend may ignore it.
    const backendPayload = {
      propertyIdentifier:   form.propertyIdentifier.trim(),
      committeeMemberId:    form.committeeMemberId.trim(),
      societyIdentifier:    form.societyIdentifier.trim(),
      numberOfParticipants: Number(form.numberOfParticipants) || form.participants?.length || 0,
      startDateTime:        toApiIso(form.startDateTime),
      isHavePasses:         Boolean(form.isHavePasses),
      isHaveConstumes:      Boolean(form.isHaveConstumes),
      remark:               form.remark || "",
      participants:         (form.participants || []).map((p) => ({
        participantName:  p.participantName,
        gender:           p.gender,
        age:              Number(p.age) || 0,
        isMedicalDisease: Boolean(p.isMedicalDisease),
        nameOfDisease:    p.nameOfDisease || "",
      })),
      // Include optional fields only when they actually have a value
      ...(form.endDateTime && { endDateTime: toApiIso(form.endDateTime) }),
      ...(form.duration    && { duration: Number(form.duration) }),
    };

    try {
      if (form.applicationIdentifier) {
        // UPDATE
        await updateSwimmingPoolApi(backendPayload, form.applicationIdentifier);
        syncData((d) => d.map((r) =>
          r.applicationIdentifier === form.applicationIdentifier ? { ...r, ...form, ...backendPayload } : r
        ));
      } else {
        // CREATE
        const res = await createSwimmingPoolApi(backendPayload);
        const raw = res?.data?.data || {};
        const newEntry = mapSwimmingPool({
          ...backendPayload,
          ...raw,
          applicationIdentifier: raw.applicationIdentifier || `SW-${String(activeData.length + 1).padStart(5, "0")}`,
          approvedStatus: raw.approvedStatus || "N/A",
          createdAt: raw.createdAt || new Date().toISOString(),
        }, activeData.length);
        syncData((d) => [...d, newEntry]);
      }
    } catch (err) {
      console.warn("[SwimmingPool Save] Backend failed:", err?.message);
      setActionError("Backend save failed. UI updated locally.");
      // Optimistic local update on error
      if (form.applicationIdentifier) {
        syncData((d) => d.map((r) =>
          r.applicationIdentifier === form.applicationIdentifier ? { ...r, ...form, ...backendPayload } : r
        ));
      } else {
        const localEntry = mapSwimmingPool({
          ...backendPayload,
          id: `local_${Date.now()}`,
          approvedStatus: "N/A",
          createdAt: new Date().toISOString(),
        }, activeData.length);
        syncData((d) => [...d, localEntry]);
      }
    } finally {
      setActionLoading(false);
      setModal(null);
    }
  };

  // ─── DELETE ──────────────────────────────────

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete booking "${row.applicationIdentifier}"?`)) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteSwimmingPoolApi(row.applicationIdentifier);
    } catch (err) {
      console.warn("[SwimmingPool Delete] Backend failed:", err?.message);
      setActionError("Backend delete failed. Removed from UI only.");
    } finally {
      syncData((d) => d.filter((r) => r.applicationIdentifier !== row.applicationIdentifier));
      setActionLoading(false);
    }
  };

  // ─── MODAL HELPERS ───────────────────────────

  const openAddModal = () => {
    setForm({ ...EMPTY_FORM, participants: [] });
    setFormErrors({});
    setModal("add");
  };

  const openEditModal = (row) => {
    setForm({
      ...EMPTY_FORM,
      ...row,
      // Internal storage is ISO — convert to the format <input type="datetime-local"> needs.
      startDateTime: toDatetimeLocalValue(row.startDateTime),
      endDateTime: toDatetimeLocalValue(row.endDateTime),
      duration: row.duration ?? "",
      participants: row.participants?.length ? row.participants : [],
    });
    setFormErrors({});
    setModal("edit");
  };

  const openViewModal = (row) => { setViewItem(row); setModal("view"); };
  const closeModal    = ()      => { setModal(null); setFormErrors({}); };

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
          Loading swimming pool bookings…
        </div>
      )}

      {/* Action error banner */}
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
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Swimming Pool</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Manage pool bookings, participants, and approvals</p>
        </div>
        <button
          onClick={openAddModal}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "linear-gradient(135deg,#0a2a3a,#062030)",
            border: "1px solid rgba(0,180,216,0.3)",
            borderRadius: 10, padding: "10px 18px",
            color: "#e8edf5", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}
        >
          <Plus size={15} /> Add Booking
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
              <p style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 700 }}>{s.value}</p>
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
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#00b4d8", fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 3, height: 16, background: "#00b4d8", borderRadius: 2 }} />
            LIST OF BOOKINGS
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Status filter tabs */}
            <div style={{ display: "flex", gap: 4 }}>
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setStatusFilter(tab); setPage(1); }}
                  style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    border:     statusFilter === tab ? "1px solid #00b4d8" : "1px solid rgba(255,255,255,0.08)",
                    background: statusFilter === tab ? "rgba(0,180,216,0.15)" : "transparent",
                    color:      statusFilter === tab ? "#00b4d8" : "#8899aa",
                    transition: "all 0.15s",
                  }}
                >
                  {tab}
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
                {["S.No", "Booking ID", "Property", "Society", "Participants", "Start Time", "End Time", "Duration", "Passes", "Costumes", "Status", "Action"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: "40px 14px", textAlign: "center", color: "#556677", fontSize: 13 }}>
                    {fetchLoading ? "Loading…" : "No bookings found"}
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
                    <td style={{ padding: "12px 14px", color: "#00b4d8", fontWeight: 600, fontSize: 12 }}>{row.applicationIdentifier}</td>
                    <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontSize: 12 }}>
                      <div>{row.propertyName || "—"}</div>
                      <div style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>{row.propertyIdentifier}</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontSize: 12 }}>
                      <div>{row.societyName || "—"}</div>
                      <div style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>{row.societyIdentifier || "—"}</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        background: "rgba(108,99,255,0.12)", color: "#6c63ff",
                        padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        display: "inline-flex", alignItems: "center", gap: 4,
                      }}>
                        <Users size={10} /> {row.numberOfParticipants}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12, whiteSpace: "nowrap" }}>{formatDateTime(row.startDateTime)}</td>
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12, whiteSpace: "nowrap" }}>{formatDateTime(row.endDateTime)}</td>
                    <td style={{ padding: "12px 14px", color: "#ffb347", fontWeight: 600, fontSize: 12 }}>
                      {row.duration ? `${row.duration}h` : calcDuration(row.startDateTime, row.endDateTime) || "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        background: row.isHavePasses ? "rgba(0,212,170,0.12)" : "rgba(136,153,170,0.08)",
                        color:      row.isHavePasses ? "#00d4aa" : "#8899aa",
                        padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>
                        {row.isHavePasses ? "Yes" : "No"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        background: row.isHaveConstumes ? "rgba(0,212,170,0.12)" : "rgba(136,153,170,0.08)",
                        color:      row.isHaveConstumes ? "#00d4aa" : "#8899aa",
                        padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>
                        {row.isHaveConstumes ? "Yes" : "No"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <StatusBadge status={row.approvedStatus} />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button onClick={() => openViewModal(row)} style={{ background: "rgba(0,180,216,0.12)",  border: "none", borderRadius: 6, padding: "5px 8px", color: "#00b4d8", cursor: "pointer" }} title="View"><Eye    size={12} /></button>
                        <button onClick={() => openEditModal(row)} style={{ background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#6c63ff", cursor: "pointer" }} title="Edit"><Edit2  size={12} /></button>
                        <button
                          onClick={() => handleDelete(row)}
                          disabled={actionLoading}
                          style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#ff6b6b", cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.6 : 1 }}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
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
            borderRadius: 20, width: "100%", maxWidth: 600,
            maxHeight: "90vh", overflow: "hidden",
            display: "flex", flexDirection: "column",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          }}>

            {/* Header */}
            <div style={{
              padding: "20px 24px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "linear-gradient(180deg, rgba(0,180,216,0.07) 0%, transparent 100%)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: "rgba(0,180,216,0.15)",
                  border: "1px solid rgba(0,180,216,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Waves size={18} color="#00b4d8" />
                </div>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>
                    {modal === "edit" ? "Edit Booking" : "New Pool Booking"}
                  </h3>
                  <p style={{ color: "#6b7a90", fontSize: 12, margin: "2px 0 0" }}>
                    {modal === "edit" ? "Update booking details" : "Register a new swimming pool session"}
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

              {/* ── Identifiers ── */}
              <SectionLabel><Hash size={11} /> Identifiers</SectionLabel>
              <div style={grid2}>
                <FormSelect
                  label="Property Identifier *"
                  field="propertyIdentifier"
                  form={form} setForm={setForm}
                  errors={formErrors}
                  options={propertyOptions}
                  placeholder="Select property…"
                />
                <FormSelect
                  label="Committee Member ID *"
                  field="committeeMemberId"
                  form={form} setForm={setForm}
                  errors={formErrors}
                  options={committeeMemberOptions}
                  placeholder="Select committee member…"
                />
              </div>
              <FormSelect
                label="Society Identifier *"
                field="societyIdentifier"
                form={form} setForm={setForm}
                errors={formErrors}
                options={societyOptions}
                placeholder="Select society…"
              />

              {/* ── Session Schedule ── */}
              <SectionLabel><Clock size={11} /> Session Schedule</SectionLabel>
              <div style={grid2}>
                <FormInput
                  label="Start Date & Time *"
                  field="startDateTime"
                  type="datetime-local"
                  form={form} setForm={setForm}
                  errors={formErrors}
                />
                <FormInput
                  label="End Date & Time"
                  field="endDateTime"
                  type="datetime-local"
                  form={form} setForm={setForm}
                  errors={formErrors}
                />
              </div>
              <div style={{ ...fieldWrapper, maxWidth: "50%", paddingRight: 6 }}>
                <label style={labelStyle}>Duration (hours)</label>
                <input
                  type="number"
                  min={0}
                  value={form.duration ?? ""}
                  placeholder="e.g. 2"
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              {/* ── Amenities ── */}
              <SectionLabel><Waves size={11} /> Amenities</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 13 }}>
                <ToggleSwitch label="Has Passes"   field="isHavePasses"    form={form} setForm={setForm} />
                <ToggleSwitch label="Has Costumes" field="isHaveConstumes" form={form} setForm={setForm} />
              </div>

              {/* ── Remarks ── */}
              <SectionLabel>Remarks</SectionLabel>
              <div style={fieldWrapper}>
                <label style={labelStyle}>Remark</label>
                <textarea
                  value={form.remark || ""}
                  onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* ── Participants ── */}
              <SectionLabel><Users size={11} /> Participants</SectionLabel>

              {(form.participants || []).length === 0 && (
                <div style={{
                  textAlign: "center", padding: "14px", marginBottom: 12,
                  color: "#556677", fontSize: 12,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px dashed rgba(255,255,255,0.07)",
                  borderRadius: 10,
                }}>
                  No participants added yet. Click below to add one.
                </div>
              )}

              {(form.participants || []).map((p, idx) => (
                <div key={idx} style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, padding: "14px 14px 6px",
                  marginBottom: 12,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ color: "#00b4d8", fontSize: 11, fontWeight: 700 }}>PARTICIPANT {idx + 1}</span>
                    {form.participants.length > 0 && (
                      <button
                        onClick={() => removeParticipant(idx)}
                        style={{
                          background: "rgba(255,107,107,0.12)", border: "none",
                          borderRadius: 6, padding: "3px 7px",
                          color: "#ff6b6b", cursor: "pointer", fontSize: 11,
                          display: "flex", alignItems: "center", gap: 4,
                        }}
                      >
                        <X size={10} /> Remove
                      </button>
                    )}
                  </div>

                  <div style={grid2}>
                    <div style={fieldWrapper}>
                      <label style={labelStyle}>Name</label>
                      <input
                        value={p.participantName}
                        onChange={(e) => updateParticipant(idx, "participantName", e.target.value)}
                        style={inputStyle}
                        placeholder="Participant name"
                      />
                    </div>
                    <div style={grid2}>
                      <div style={fieldWrapper}>
                        <label style={labelStyle}>Gender</label>
                        <select
                          value={p.gender}
                          onChange={(e) => updateParticipant(idx, "gender", e.target.value)}
                          style={{ ...inputStyle, cursor: "pointer" }}
                        >
                          {GENDER_OPTIONS.map((g) => (
                            <option key={g} value={g.toLowerCase()}>{g}</option>
                          ))}
                        </select>
                      </div>
                      <div style={fieldWrapper}>
                        <label style={labelStyle}>Age</label>
                        <input
                          type="number" min={0} max={120}
                          value={p.age}
                          onChange={(e) => updateParticipant(idx, "age", Number(e.target.value))}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <ToggleSwitch
                      label="Has Medical Condition"
                      field="isMedicalDisease"
                      form={p}
                      setForm={(updater) => {
                        const updated = typeof updater === "function" ? updater(p) : updater;
                        updateParticipant(idx, "isMedicalDisease", updated.isMedicalDisease);
                      }}
                    />
                  </div>

                  {p.isMedicalDisease && (
                    <div style={fieldWrapper}>
                      <label style={labelStyle}>Disease / Condition Name</label>
                      <input
                        value={p.nameOfDisease}
                        onChange={(e) => updateParticipant(idx, "nameOfDisease", e.target.value)}
                        style={inputStyle}
                        placeholder="Describe the condition"
                      />
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={addParticipant}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(0,180,216,0.08)",
                  border: "1px dashed rgba(0,180,216,0.3)",
                  borderRadius: 9, padding: "9px 14px",
                  color: "#00b4d8", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", width: "100%", justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <Plus size={13} /> Add Participant
              </button>

            </div>

            {/* Footer */}
            <div style={{
              padding: "14px 24px 18px",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexShrink: 0,
              background: "rgba(0,0,0,0.15)",
            }}>
              <p style={{ color: "#556677", fontSize: 11 }}>* Required fields</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={closeModal} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 9, padding: "9px 18px",
                  color: "#8899aa", fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={actionLoading} style={{
                  background: "linear-gradient(135deg, #00b4d8 0%, #0077a8 100%)",
                  border: "none", borderRadius: 9, padding: "9px 22px",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.7 : 1,
                  display: "flex", alignItems: "center", gap: 7,
                }}>
                  <CheckCircle2 size={14} />
                  {actionLoading ? "Saving…" : "Save Booking"}
                </button>
              </div>
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
            borderRadius: 20, width: "100%", maxWidth: 520,
            maxHeight: "88vh", overflow: "hidden",
            display: "flex", flexDirection: "column",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          }}>

            {/* Header */}
            <div style={{
              padding: "20px 24px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "linear-gradient(180deg, rgba(0,180,216,0.07) 0%, transparent 100%)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: "rgba(0,180,216,0.15)",
                  border: "1px solid rgba(0,180,216,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Waves size={18} color="#00b4d8" />
                </div>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>Booking Details</h3>
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

              {/* Booking ID + Status hero */}
              <div style={{
                background: "rgba(0,180,216,0.08)",
                border: "1px solid rgba(0,180,216,0.15)",
                borderRadius: 12, padding: 16, marginBottom: 16,
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              }}>
                <div>
                  <p style={{ color: "#00b4d8", fontWeight: 700, fontSize: 13 }}>{viewItem.applicationIdentifier}</p>
                  <p style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                    {viewItem.propertyName || viewItem.propertyIdentifier || "—"}
                  </p>
                  {viewItem.societyName && (
                    <p style={{ color: "#8899aa", fontSize: 12, marginTop: 2 }}>{viewItem.societyName}</p>
                  )}
                  {viewItem.committeeMemberId && (
                    <p style={{ color: "#556677", fontSize: 11, marginTop: 4 }}>
                      Committee: {viewItem.committeeMemberId}
                    </p>
                  )}
                </div>
                <StatusBadge status={viewItem.approvedStatus} />
              </div>

              {/* Identifiers row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "rgba(108,99,255,0.06)", border: "1px solid rgba(108,99,255,0.12)", borderRadius: 10, padding: 12 }}>
                  <p style={{ color: "#8899aa", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Property ID</p>
                  <p style={{ color: "#6c63ff", fontWeight: 700, fontSize: 13, marginTop: 4 }}>{viewItem.propertyIdentifier || "—"}</p>
                </div>
                <div style={{ background: "rgba(108,99,255,0.06)", border: "1px solid rgba(108,99,255,0.12)", borderRadius: 10, padding: 12 }}>
                  <p style={{ color: "#8899aa", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Committee Member ID</p>
                  <p style={{ color: "#6c63ff", fontWeight: 700, fontSize: 13, marginTop: 4 }}>{viewItem.committeeMemberId || "—"}</p>
                </div>
              </div>

              {/* Entry / Exit */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.12)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                  <p style={{ color: "#8899aa", fontSize: 11 }}>Start</p>
                  <p style={{ color: "#00d4aa", fontWeight: 700, fontSize: 12, marginTop: 4 }}>{formatDateTime(viewItem.startDateTime)}</p>
                </div>
                <div style={{ background: "rgba(255,179,71,0.06)", border: "1px solid rgba(255,179,71,0.12)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                  <p style={{ color: "#8899aa", fontSize: 11 }}>End</p>
                  <p style={{ color: "#ffb347", fontWeight: 700, fontSize: 12, marginTop: 4 }}>{formatDateTime(viewItem.endDateTime)}</p>
                </div>
              </div>

              {/* Quick badges */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.2)",
                  borderRadius: 8, padding: "6px 12px", color: "#6c63ff", fontSize: 12, fontWeight: 600,
                }}>
                  <Users size={12} /> {viewItem.numberOfParticipants} Participant{viewItem.numberOfParticipants !== 1 ? "s" : ""}
                </span>
                {(viewItem.duration || calcDuration(viewItem.startDateTime, viewItem.endDateTime)) && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: "rgba(255,179,71,0.1)", border: "1px solid rgba(255,179,71,0.2)",
                    borderRadius: 8, padding: "6px 12px", color: "#ffb347", fontSize: 12, fontWeight: 600,
                  }}>
                    <Clock size={12} /> {viewItem.duration ? `${viewItem.duration}h` : calcDuration(viewItem.startDateTime, viewItem.endDateTime)}
                  </span>
                )}
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: viewItem.isHavePasses ? "rgba(0,212,170,0.1)" : "rgba(136,153,170,0.08)",
                  border: `1px solid ${viewItem.isHavePasses ? "rgba(0,212,170,0.2)" : "rgba(136,153,170,0.12)"}`,
                  borderRadius: 8, padding: "6px 12px",
                  color: viewItem.isHavePasses ? "#00d4aa" : "#8899aa",
                  fontSize: 12, fontWeight: 600,
                }}>
                  <Ticket size={12} /> Passes: {viewItem.isHavePasses ? "Yes" : "No"}
                </span>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: viewItem.isHaveConstumes ? "rgba(0,212,170,0.1)" : "rgba(136,153,170,0.08)",
                  border: `1px solid ${viewItem.isHaveConstumes ? "rgba(0,212,170,0.2)" : "rgba(136,153,170,0.12)"}`,
                  borderRadius: 8, padding: "6px 12px",
                  color: viewItem.isHaveConstumes ? "#00d4aa" : "#8899aa",
                  fontSize: 12, fontWeight: 600,
                }}>
                  <ShirtIcon size={12} /> Costumes: {viewItem.isHaveConstumes ? "Yes" : "No"}
                </span>
              </div>

              {/* Detail rows */}
              {[
                ["Remark",                viewItem.remark],
                ["Parent Status",         viewItem.parentApprovedStatus],
                ["Approver Remark",       viewItem.approvarRemark],
                ["Parent Committee ID",   viewItem.parentCommitteeMemberId],
                ["Parent Approver Remark",viewItem.parentApprovarRemark],
                ["Created By",            viewItem.createdBy],
                ["Created At",            formatDateTime(viewItem.createdAt)],
                ["Updated At",            formatDateTime(viewItem.updatedAt)],
              ].filter(([, v]) => v && v !== "N/A" && v !== "—").map(([label, value]) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{ color: "#6b7a90", fontSize: 13 }}>{label}</span>
                  <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{value}</span>
                </div>
              ))}

              {/* Participants list */}
              {viewItem.participants?.length > 0 && (
                <>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    fontSize: 10, fontWeight: 700, letterSpacing: "1px",
                    color: "#6b7a90", textTransform: "uppercase",
                    margin: "16px 0 12px",
                  }}>
                    PARTICIPANTS
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                  </div>

                  {viewItem.participants.map((p, idx) => (
                    <div key={idx} style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 10, padding: "12px 14px", marginBottom: 8,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%",
                          background: "rgba(0,180,216,0.15)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#00b4d8", fontSize: 11, fontWeight: 700, flexShrink: 0,
                        }}>
                          {(p.participantName || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>
                            {p.participantName || "—"}
                          </p>
                          <p style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>
                            {p.gender && p.gender.charAt(0).toUpperCase() + p.gender.slice(1)}
                            {p.age ? ` · Age ${p.age}` : ""}
                          </p>
                        </div>
                      </div>
                      {p.isMedicalDisease && (
                        <span style={{
                          background: "rgba(255,107,107,0.12)", color: "#ff6b6b",
                          padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        }}>
                          {p.nameOfDisease || "Medical"}
                        </span>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}