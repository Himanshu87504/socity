// @ts-nocheck
// NameChangeDashboard.jsx

import React, { useState, useEffect } from "react";
import {
  UserCheck, Plus, Search,
  Edit2, Trash2, Eye, X,
  ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
  CheckCircle2,
  User, Clock, FileText,
} from "lucide-react";

import {
  getAllChangeInNameApi,
  createChangeInNameApi,
  updateChangeInNameApi,
  deleteChangeInNameApi,
} from "../api/application-api";
import { useAppContext } from "../AppContext";

// ─── CONSTANTS ───────────────────────────────

const EMPTY_FORM = {
  firstName: "",
  middleName: "",
  lastName: "",
  propertyIdentifier: "",
  remarks: "",
};

const PER_PAGE = 9;

// ─── HELPERS ─────────────────────────────────

const safeStr = (v) => (v == null ? "" : String(v));
const formatNumber = (n) => Number(n).toLocaleString("en-IN");

const tryParseJSON = (raw) => {
  try { return JSON.parse(raw); } catch { return null; }
};

// ── Society identifier — check common keys + nested user objects ──
const getSocietyIdentifierFallback = () => {
  const direct =
    localStorage.getItem("society_identifier") ||
    localStorage.getItem("societyId") ||
    localStorage.getItem("societyIdentifier") ||
    sessionStorage.getItem("society_identifier") ||
    sessionStorage.getItem("societyIdentifier");
  if (direct) return direct;

  for (const key of ["user", "userData", "authUser", "loginData", "profile"]) {
    const obj =
      tryParseJSON(localStorage.getItem(key)) ||
      tryParseJSON(sessionStorage.getItem(key));
    if (obj) {
      const val =
        obj.societyIdentifier ||
        obj.society_identifier ||
        obj.society?.societyIdentifier;
      if (val) return val;
    }
  }
  return "";
};

// ── Committee member id — check common keys + nested user objects ──
const getCommitteeMemberIdFallback = () => {
  const direct =
    localStorage.getItem("committeeMemberId") ||
    localStorage.getItem("memberId") ||
    localStorage.getItem("userId") ||
    sessionStorage.getItem("committeeMemberId") ||
    sessionStorage.getItem("memberId") ||
    sessionStorage.getItem("userId");
  if (direct) return direct;

  for (const key of ["user", "userData", "authUser", "loginData", "profile"]) {
    const obj =
      tryParseJSON(localStorage.getItem(key)) ||
      tryParseJSON(sessionStorage.getItem(key));
    if (obj) {
      const val = obj.committeeMemberId || obj.memberId || obj.id || obj._id;
      if (val) return val;
    }
  }

  console.warn(
    "[getCommitteeMemberIdFallback] Using TEMPORARY hardcoded committeeMemberId. Replace with real lookup."
  );
  return "7909d4db-50ba-4a0d-8e39-dee0cad46363";
};

// ── Map a raw API item to a normalised UI row ──────────────────────
// Handles the nested shape returned by the real API:
// { member, committeeMember, property, society, ... }
export function mapNameChange(item, i) {
  // member holds the current name of the flat owner
  const member = item.member || {};
  // society holds societyIdentifier
  const society = item.society || {};
  // property holds propertyIdentifier + propertyName
  const property = item.property || {};

  return {
    // ── identity ─────────────────────────────────────────────────
    id:                    item.id || item._id || i + 1,
    // nameChangeId must be the UUID — check every plausible key the API might use
    nameChangeId: safeStr(
      item.nameChangeId ||
      item.name_change_id ||
      // some list endpoints return the UUID under 'id' when it looks like a UUID
      (typeof item.id === 'string' && item.id.includes('-') ? item.id : '') ||
      ""
    ),
    applicationIdentifier: safeStr(
      item.applicationIdentifier ||
      item.nameChangeId ||
      `NC-${String(i + 1).padStart(5, "0")}`
    ),

    // ── property ──────────────────────────────────────────────────
    // prefer the flat property identifier; fall back to root-level field
    propertyIdentifier: safeStr(
      property.propertyIdentifier ||
      item.propertyIdentifier ||
      item.property_identifier ||
      ""
    ),
    propertyName: safeStr(property.propertyName || ""),

    // ── committee / society ───────────────────────────────────────
    committeeMemberId:       safeStr(item.committeeMemberId || ""),
    parentCommitteeMemberId: safeStr(item.parentCommitteeMemberId || ""),
    societyIdentifier:       safeStr(
      society.societyIdentifier ||
      item.societyIdentifier ||
      ""
    ),

    // ── requested new name ────────────────────────────────────────
    firstName:  safeStr(item.firstName  || ""),
    middleName: safeStr(item.middleName || ""),
    lastName:   safeStr(item.lastName   || ""),

    // ── current member name (shown in "Current Name" column) ──────
    memberFirstName:  safeStr(member.firstName  || item.memberFirstName  || ""),
    memberMiddleName: safeStr(member.middleName || item.memberMiddleName || ""),
    memberLastName:   safeStr(member.lastName   || item.memberLastName   || ""),

    // ── approval ──────────────────────────────────────────────────
    approvedStatus:       safeStr(item.approvedStatus       || item.approved_status        || "N/A"),
    parentApprovedStatus: safeStr(item.parentApprovedStatus || item.parent_approved_status || "N/A"),
    approvedAt:           safeStr(item.approvedAt  || ""),
    approvarRemark:       safeStr(item.approvarRemark       || item.approver_remark        || ""),
    parentApprovarRemark: safeStr(item.parentApprovarRemark || ""),

    // ── timestamps ────────────────────────────────────────────────
    createdAt: safeStr(item.createdAt || item.created_at || ""),
    updatedAt: safeStr(item.updatedAt || item.updated_at || ""),
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
const grid3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 };

// ─── STATUS BADGE ─────────────────────────────

const STATUS_COLORS = {
  Approved: { bg: "rgba(0,212,170,0.12)",   color: "#00d4aa" },
  Pending:  { bg: "rgba(255,179,71,0.12)",  color: "#ffb347" },
  Rejected: { bg: "rgba(255,107,107,0.12)", color: "#ff6b6b" },
  "N/A":    { bg: "rgba(136,153,170,0.12)", color: "#8899aa" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_COLORS[status] || STATUS_COLORS["N/A"];
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "3px 9px", borderRadius: 20,
      fontSize: 11, fontWeight: 600,
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

const FormInput = ({ label, field, type = "text", form, setForm }) => (
  <div style={fieldWrapper}>
    <label style={labelStyle}>{label}</label>
    <input
      type={type}
      value={form[field] || ""}
      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
      style={inputStyle}
    />
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
            background: p === page ? "#00d4aa" : "none",
            border:     `1px solid ${p === page ? "#00d4aa" : "var(--border)"}`,
            color:      p === page ? "#000" : "#8899aa",
            fontWeight: p === page ? 700 : 400,
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

export default function NameChangeDashboard() {

  const { nameChanges: ctxNameChanges, setNameChanges, societyId } = useAppContext();

  const contextSocietyId  = typeof societyId === "function" ? societyId() : (societyId || "");
  const societyIdentifier = contextSocietyId || getSocietyIdentifierFallback();
  const committeeMemberId = getCommitteeMemberIdFallback();

  // ── local state ──────────────────────────────────────────────────
  const [localData,     setLocalData]     = useState(null);       // null = "not yet fetched"
  const [search,        setSearch]        = useState("");
  const [page,          setPage]          = useState(1);
  const [modal,         setModal]         = useState(null);        // "add" | "edit" | "view"
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [viewItem,      setViewItem]      = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError,   setActionError]   = useState(null);
  const [fetchLoading,  setFetchLoading]  = useState(false);
  const [fetchError,    setFetchError]    = useState(null);
  const [statusFilter,  setStatusFilter]  = useState("All");

  // ── FIX 1: fetch all records on mount ───────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setFetchLoading(true);
      setFetchError(null);
      try {
        const res = await getAllChangeInNameApi();

        // API may return: res.data (array) OR res.data.data (array)
        // getAllApplicationApi returns all application types; keep name-change entries only
        const allRaw = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];

        // Filter to name-change records only
        const raw = allRaw.filter(
          (item) =>
            item.nameChangeId != null ||
            item.applicationType === 'Name Change' ||
            safeStr(item.applicationIdentifier).startsWith('NC-')
        );

        const mapped = raw.map((item, i) => mapNameChange(item, i));
        setLocalData(mapped);

        // Keep context in sync if a setter is available
        if (setNameChanges) setNameChanges(mapped);
      } catch (err) {
        console.error("[NameChangeDashboard] Failed to fetch name changes:", {
          message: err?.message,
          status:  err?.response?.status,
          data:    err?.response?.data,
        });
        setFetchError(
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load applications. Showing cached data if available."
        );
        // Fall through to context data
      } finally {
        setFetchLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Use local (freshly fetched) data when available, else fall back to context
  const activeData = localData ?? ctxNameChanges ?? [];

  // ── Stats ────────────────────────────────────────────────────────
  const approvedCount = activeData.filter((r) => r.approvedStatus === "Approved").length;
  const pendingCount  = activeData.filter((r) => r.approvedStatus === "Pending" || r.approvedStatus === "N/A").length;
  const rejectedCount = activeData.filter((r) => r.approvedStatus === "Rejected").length;

  const stats = [
    { label: "Total Applications", value: activeData.length, color: "#6c63ff", icon: FileText },
    { label: "Approved",           value: approvedCount,     color: "#00d4aa", icon: CheckCircle2 },
    { label: "Pending",            value: pendingCount,      color: "#ffb347", icon: Clock },
    { label: "Rejected",           value: rejectedCount,     color: "#ff6b6b", icon: X },
  ];

  // ── Shared updater that writes both local + context ──────────────
  const syncData = (updaterFn) => {
    setLocalData((prev) => {
      const next = updaterFn(prev ?? ctxNameChanges ?? []);
      if (setNameChanges) setNameChanges(next);
      return next;
    });
  };

  // ── Filter ───────────────────────────────────────────────────────
  const STATUS_TABS = ["All", "Approved", "Pending", "Rejected", "N/A"];

  const filtered = activeData.filter((r) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      safeStr(r.applicationIdentifier).toLowerCase().includes(q) ||
      safeStr(r.memberFirstName).toLowerCase().includes(q)       ||
      safeStr(r.memberLastName).toLowerCase().includes(q)        ||
      safeStr(r.firstName).toLowerCase().includes(q)             ||
      safeStr(r.lastName).toLowerCase().includes(q)              ||
      safeStr(r.propertyIdentifier).toLowerCase().includes(q);
    const matchesStatus = statusFilter === "All" || r.approvedStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ─── SAVE (Create / Update) ────────────────────────────────────

  const handleSave = async () => {
    if (!form.firstName && !form.lastName) {
      setActionError("First Name or Last Name is required.");
      return;
    }

    if (!committeeMemberId || !societyIdentifier) {
      setActionError(
        `Missing required identifiers — committeeMemberId: "${committeeMemberId}", societyIdentifier: "${societyIdentifier}". Check localStorage / AppContext.`
      );
      return;
    }

    setActionLoading(true);
    setActionError(null);

    // ── FIX 2: build payload exactly as the backend expects ────────
    const backendPayload = {
      committeeMemberId,
      societyIdentifier,
      firstName:          form.firstName,
      middleName:         form.middleName  || "",
      lastName:           form.lastName,
      propertyIdentifier: form.propertyIdentifier || "",
    };

    try {
      if (form.nameChangeId) {
        // ── UPDATE ─────────────────────────────────────────────────
        const res = await updateChangeInNameApi(backendPayload, form.nameChangeId);

        // Prefer the server's returned data so nested objects stay fresh
        const serverData = res?.data?.data || res?.data || {};
        syncData((d) =>
          d.map((r) =>
            r.nameChangeId === form.nameChangeId
              ? mapNameChange({ ...r, ...serverData }, 0)
              : r
          )
        );
      } else {
        // ── CREATE ─────────────────────────────────────────────────
        const res = await createChangeInNameApi(backendPayload);

        // FIX 3: API returns the full object (with member, society,
        // property nested); mapNameChange handles all of those now.
        const serverData = res?.data?.data || res?.data || {};
        const newEntry   = mapNameChange(
          { ...backendPayload, ...serverData },
          activeData.length
        );
        syncData((d) => [...d, newEntry]);
      }

      setModal(null);
    } catch (err) {
      console.error("[NameChange Save] Error:", {
        message: err?.message,
        status:  err?.response?.status,
        data:    err?.response?.data,
        payload: backendPayload,
      });

      // ── Interceptor recovery: some axios wrappers throw even when
      //    the backend returned a success response. Detect that here.
      const possibleData =
        err?.response?.data?.data ||
        err?.data?.data           ||
        (err?.response?.data?.status === 1 ? err.response.data : null);

      if (possibleData?.applicationIdentifier || possibleData?.nameChangeId) {
        console.warn("[NameChange] Recovering from mangled interceptor response:", possibleData);

        if (form.nameChangeId) {
          syncData((d) =>
            d.map((r) =>
              r.nameChangeId === form.nameChangeId
                ? mapNameChange({ ...r, ...possibleData }, 0)
                : r
            )
          );
        } else {
          syncData((d) => [
            ...d,
            mapNameChange({ ...backendPayload, ...possibleData }, d.length),
          ]);
        }
        setModal(null);
      } else {
        // Genuine failure — show error but also apply locally so UI
        // isn't left stale
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Save failed. Changes applied locally only.";
        setActionError(msg);

        if (form.nameChangeId) {
          syncData((d) =>
            d.map((r) =>
              r.nameChangeId === form.nameChangeId
                ? { ...r, ...form, ...backendPayload }
                : r
            )
          );
        } else {
          syncData((d) => [
            ...d,
            mapNameChange(
              {
                ...backendPayload,
                id:             `local_${Date.now()}`,
                nameChangeId:   `local_${Date.now()}`,
                approvedStatus: "Pending",
                createdAt:      new Date().toLocaleString("en-IN"),
              },
              d.length
            ),
          ]);
        }
        // Keep modal open so the user sees the error banner
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ─── DELETE ────────────────────────────────────────────────────

  const handleDelete = async (row) => {
    // Backend delete route accepts applicationIdentifier (e.g. "NC-00713")
    const deleteId = row.applicationIdentifier;

    if (!deleteId || String(deleteId).startsWith("local_")) {
      setActionError("Cannot delete: missing application identifier. Try refreshing the page.");
      return;
    }

    if (!window.confirm(`Delete application "${row.applicationIdentifier}"?`)) return;
    setActionLoading(true);
    setActionError(null);

    console.log("[Delete] Using id:", deleteId, "| row:", row);

    try {
      await deleteChangeInNameApi(deleteId);
      // Only remove from UI on confirmed success
      syncData((d) => d.filter((r) => r.applicationIdentifier !== deleteId));
    } catch (err) {
      console.error("[NameChange Delete] Error:", {
        message: err?.message,
        status:  err?.response?.status,
        data:    err?.response?.data,
      });

      // If the interceptor mangled a real 200-OK delete response, still remove
      const possibleStatus =
        err?.response?.data?.status ?? err?.data?.status;

      if (possibleStatus === 1) {
        console.warn("[NameChange] Interceptor mangled a successful delete — removing from UI.");
        syncData((d) => d.filter((r) => r.applicationIdentifier !== deleteId));
      } else {
        setActionError(
          err?.response?.data?.message ||
          err?.message ||
          "Delete failed. Record was not removed."
        );
        // FIX 4 cont.: do NOT remove from UI on genuine failure
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ── Modal helpers ────────────────────────────────────────────────
  const openEditModal = (row) => { setForm({ ...row }); setModal("edit"); setActionError(null); };
  const openViewModal = (row) => { setViewItem(row);    setModal("view"); };
  const closeModal    = ()    => { setModal(null); setActionError(null); };

  // ─── RENDER ────────────────────────────────────────────────────

  return (
    <div style={{ padding: 28 }}>

      {/* Fetch error */}
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

      {/* Fetch loading */}
      {fetchLoading && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "16px 20px", marginBottom: 16,
          color: "#8899aa", fontSize: 13, textAlign: "center",
        }}>
          Loading applications…
        </div>
      )}

      {/* Action error */}
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
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Name Change</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Manage member name change applications and approvals</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setActionError(null); setModal("add"); }}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "linear-gradient(135deg,#1a2a4a,#162040)",
            border: "1px solid rgba(108,99,255,0.3)",
            borderRadius: 10, padding: "10px 18px",
            color: "#e8edf5", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}
        >
          <Plus size={15} /> Add Application
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

        {/* Toolbar */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6c63ff", fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 3, height: 16, background: "#6c63ff", borderRadius: 2 }} />
            LIST OF NAME CHANGE APPLICATIONS
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Status tabs */}
            <div style={{ display: "flex", gap: 4 }}>
              {STATUS_TABS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    border:     statusFilter === s ? "1px solid #6c63ff" : "1px solid rgba(255,255,255,0.08)",
                    background: statusFilter === s ? "rgba(108,99,255,0.15)" : "transparent",
                    color:      statusFilter === s ? "#6c63ff" : "#8899aa",
                    transition: "all 0.15s",
                  }}
                >
                  {s}
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

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["S.No", "Application ID", "Current Name", "New First Name", "New Middle Name", "New Last Name", "Property", "Status", "Action"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "40px 14px", textAlign: "center", color: "#556677", fontSize: 13 }}>
                    {fetchLoading ? "Loading…" : "No applications found"}
                  </td>
                </tr>
              ) : (
                paged.map((row, i) => {
                  const currentName =
                    [row.memberFirstName, row.memberMiddleName, row.memberLastName]
                      .filter(Boolean)
                      .join(" ") || "—";
                  return (
                    <tr
                      key={row.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{(page - 1) * PER_PAGE + i + 1}</td>
                      <td style={{ padding: "12px 14px", color: "#6c63ff", fontWeight: 600, fontSize: 12 }}>{row.applicationIdentifier}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: "rgba(108,99,255,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <User size={13} color="#6c63ff" />
                          </div>
                          <span style={{ color: "var(--text-primary)", fontSize: 13 }}>{currentName}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#00d4aa", fontWeight: 600, fontSize: 13 }}>{row.firstName  || "—"}</td>
                      <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{row.middleName || "—"}</td>
                      <td style={{ padding: "12px 14px", color: "#00d4aa", fontWeight: 600, fontSize: 13 }}>{row.lastName   || "—"}</td>
                      <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{row.propertyIdentifier || "—"}</td>
                      <td style={{ padding: "12px 14px" }}><StatusBadge status={row.approvedStatus} /></td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button onClick={() => openViewModal(row)} style={{ background: "rgba(0,180,216,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#00b4d8", cursor: "pointer" }} title="View"><Eye    size={12} /></button>
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
                  );
                })
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
            borderRadius: 20, width: "100%", maxWidth: 520,
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
                  <UserCheck size={18} color="#6c63ff" />
                </div>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>
                    {modal === "edit" ? "Edit Application" : "New Name Change Application"}
                  </h3>
                  <p style={{ color: "#6b7a90", fontSize: 12, margin: "2px 0 0" }}>
                    {modal === "edit" ? "Update the name change request" : "Submit a name change request"}
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

            {/* Modal-level action error */}
            {actionError && (
              <div style={{
                margin: "12px 24px 0",
                background: "rgba(255,107,107,0.15)", border: "1px solid #ff6b6b",
                borderRadius: 8, padding: "8px 14px",
                color: "#ff6b6b", fontSize: 12,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span>⚠️ {actionError}</span>
                <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer" }}>×</button>
              </div>
            )}

            {/* Body */}
            <div style={{ padding: "4px 24px 8px", overflowY: "auto", flex: 1 }}>

              <SectionLabel>New Name Details</SectionLabel>
              <div style={grid3}>
                <FormInput label="First Name *"  field="firstName"  form={form} setForm={setForm} />
                <FormInput label="Middle Name"   field="middleName" form={form} setForm={setForm} />
                <FormInput label="Last Name *"   field="lastName"   form={form} setForm={setForm} />
              </div>

              <SectionLabel>Property</SectionLabel>
              <div style={{ width: "50%" }}>
                <FormInput label="Property Identifier" field="propertyIdentifier" form={form} setForm={setForm} />
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
                {actionLoading ? "Saving…" : "Save Application"}
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
            borderRadius: 20, width: "100%", maxWidth: 460,
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
                  <UserCheck size={18} color="#6c63ff" />
                </div>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>Application Details</h3>
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

              {/* Hero */}
              <div style={{
                background: "rgba(108,99,255,0.08)",
                border: "1px solid rgba(108,99,255,0.15)",
                borderRadius: 12, padding: 16, marginBottom: 16,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <p style={{ color: "#6c63ff", fontWeight: 700, fontSize: 13 }}>{viewItem.applicationIdentifier}</p>
                  <p style={{ color: "var(--text-primary)", fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                    {[viewItem.memberFirstName, viewItem.memberMiddleName, viewItem.memberLastName].filter(Boolean).join(" ") || "—"}
                  </p>
                  <p style={{ color: "#6b7a90", fontSize: 11, marginTop: 2 }}>Current Name</p>
                </div>
                <StatusBadge status={viewItem.approvedStatus} />
              </div>

              {/* Name change card */}
              <div style={{
                background: "rgba(0,212,170,0.06)",
                border: "1px solid rgba(0,212,170,0.12)",
                borderRadius: 12, padding: 16, marginBottom: 16,
              }}>
                <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, marginBottom: 10 }}>REQUESTED NAME CHANGE</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    ["First Name",  viewItem.firstName],
                    ["Middle Name", viewItem.middleName],
                    ["Last Name",   viewItem.lastName],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p style={{ color: "#6b7a90", fontSize: 10, fontWeight: 600 }}>{label}</p>
                      <p style={{ color: "#00d4aa", fontWeight: 700, fontSize: 14, marginTop: 3 }}>{val || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail rows */}
              {[
                ["Property ID",      viewItem.propertyIdentifier],
                ["Property Name",    viewItem.propertyName],
                ["Approval Status",  viewItem.approvedStatus],
                ["Parent Status",    viewItem.parentApprovedStatus],
                ["Approved At",      viewItem.approvedAt],
                ["Approver Remark",  viewItem.approvarRemark],
                ["Created At",       viewItem.createdAt],
                ["Updated At",       viewItem.updatedAt],
              ].filter(([, v]) => v && v !== "N/A").map(([label, value]) => (
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