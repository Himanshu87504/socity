// @ts-nocheck
// ContactUpdateDashboard.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  UserCog, Plus, Search,
  Edit2, Trash2, Eye, X,
  ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
  CheckCircle2, Phone, Mail,
  Users, Clock, UserCheck, Building2,
  RefreshCw,
} from "lucide-react";

import {
  getAllContactUpdateApi,
  createContactUpdateApi,
  updateContactUpdateApi,
  deleteContactUpdateApi,
} from "../api/application-api";
import { useAppContext } from "../AppContext";

// ─── CONSTANTS ───────────────────────────────

const RELATIONS = ["Owner", "Tenant", "Spouse", "Parent", "Child", "Sibling", "Other"];

const ALT_RELATIONS = ["Spouse", "Parent", "Child", "Sibling", "Friend", "Colleague", "Other"];

const EMPTY_FORM = {
  personName: "",
  personContact: "",
  personEmail: "",
  relation: RELATIONS[0],
  alternatePersonName: "",
  alternatePersonContact: "",
  alternatePersonRelation: ALT_RELATIONS[0],
  remark: "",
};

const PER_PAGE = 9;

// ─── HELPERS ─────────────────────────────────

const safeStr = (v) => (v == null ? "" : String(v));

const formatNumber = (n) => Number(n).toLocaleString("en-IN");

export function mapContactUpdate(item, i) {
  return {
    id: item.id || item._id || item.contactUpdateId || i + 1,
    contactUpdateId: safeStr(item.contactUpdateId || ""),
    applicationIdentifier: safeStr(
      item.applicationIdentifier ||
      `CP-${String(i + 1).padStart(5, "0")}`
    ),
    propertyIdentifier: safeStr(item.propertyIdentifier || item.property_identifier || ""),
    societyIdentifier: safeStr(item.societyIdentifier || item.society_identifier || ""),
    memberIdentifier: safeStr(item.memberIdentifier || ""),
    committeeMemberId: safeStr(item.committeeMemberId || ""),
    personContact: safeStr(item.personContact || item.person_contact || ""),
    personName: safeStr(item.personName || item.person_name || ""),
    relation: safeStr(item.relation || ""),
    personEmail: safeStr(item.personEmail || item.person_email || ""),
    alternatePersonContact: safeStr(item.alternatePersonContact || item.alternate_person_contact || ""),
    alternatePersonName: safeStr(item.alternatePersonName || item.alternate_person_name || ""),
    alternatePersonRelation: safeStr(item.alternatePersonRelation || item.alternate_person_relation || ""),
    remark: safeStr(item.remark || ""),
    isActive: item.isActive !== undefined ? item.isActive : true,
    approvedStatus: safeStr(item.approvedStatus || item.approved_status || "Pending"),
    parentApprovedStatus: safeStr(item.parentApprovedStatus || item.parent_approved_status || "N/A"),
    approvarRemark: safeStr(item.approvarRemark || ""),
    createdBy: safeStr(item.createdBy || item.created_by || ""),
    createdAt: safeStr(item.createdAt || item.created_at || ""),
    updatedAt: safeStr(item.updatedAt || item.updated_at || ""),
    updatedBy: safeStr(item.updatedBy || item.updated_by || ""),
    // Nested objects
    committeeMember: item.committeeMember || null,
    property: item.property || null,
    society: item.society || null,
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
  Approved: { bg: "rgba(0,212,170,0.12)", color: "#00d4aa" },
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

// ─── ACTIVE BADGE ─────────────────────────────

const ActiveBadge = ({ isActive }) => (
  <span style={{
    background: isActive ? "rgba(0,212,170,0.12)" : "rgba(255,107,107,0.12)",
    color: isActive ? "#00d4aa" : "#ff6b6b",
    padding: "3px 9px", borderRadius: 20,
    fontSize: 11, fontWeight: 600,
  }}>
    {isActive ? "Active" : "Inactive"}
  </span>
);

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

// ─── FORM SELECT ──────────────────────────────

const FormSelect = ({ label, field, options, form, setForm }) => (
  <div style={fieldWrapper}>
    <label style={labelStyle}>{label}</label>
    <select
      value={form[field] || ""}
      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
      style={{ ...inputStyle, cursor: "pointer" }}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

// ─── VIEW DETAIL ROW ──────────────────────────

const DetailRow = ({ label, value, accent }) => (
  <div style={{
    display: "flex", justifyContent: "space-between",
    padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
  }}>
    <span style={{ color: "#6b7a90", fontSize: 13 }}>{label}</span>
    <span style={{
      color: accent || "var(--text-primary)",
      fontSize: 13, fontWeight: 500,
      textAlign: "right", maxWidth: "60%",
    }}>{value || "—"}</span>
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

export default function ContactUpdateDashboard() {

  const { contactUpdates: ctxContactUpdates, setContactUpdates } = useAppContext();

  const [localData, setLocalData]           = useState(null);
  const [search, setSearch]                 = useState("");
  const [page, setPage]                     = useState(1);
  const [modal, setModal]                   = useState(null); // "add" | "edit" | "view"
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [viewItem, setViewItem]             = useState(null);
  const [actionLoading, setActionLoading]   = useState(false);
  const [actionError, setActionError]       = useState(null);
  const [statusFilter, setStatusFilter]     = useState("All");
  const [fetchLoading, setFetchLoading]     = useState(false);
  const [fetchError, setFetchError]         = useState(null);

  // ─── FETCH ALL ───────────────────────────────

 const fetchAllContactUpdates = useCallback(async () => {
  setFetchLoading(true);
  setFetchError(null);

  try {
    console.log("[ContactUpdate] Fetch started");

    const res = await getAllContactUpdateApi();

    console.log("[ContactUpdate] Full API response:", res);
    console.log("[ContactUpdate] Response data:", res?.data);

    const rawData =
      res?.data?.data ||
      res?.data?.contactUpdates ||
      res?.data?.contactUpdate ||
      res?.data?.result ||
      res?.data?.results ||
      res?.data ||
      [];

    const list = Array.isArray(rawData) ? rawData : [rawData];

    const mapped = list.map((item, index) => mapContactUpdate(item, index));

    setLocalData(mapped);

    if (setContactUpdates) {
      setContactUpdates(mapped);
    }

    console.log("[ContactUpdate] Final mapped data:", mapped);
  } catch (err) {
    console.error("[ContactUpdate Fetch] Failed:", {
      message: err?.message,
      status: err?.response?.status,
      response: err?.response?.data,
    });

    setFetchError(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to load contact updates."
    );
  } finally {
    setFetchLoading(false);
  }
}, [setContactUpdates]);
  // Fetch on mount
  useEffect(() => {
    fetchAllContactUpdates();
  }, [fetchAllContactUpdates]);

  // ─── DERIVED DATA ────────────────────────────

  // Prefer freshly fetched localData; fall back to context
  const activeData = localData ?? ctxContactUpdates ?? [];

  // ─── STATS ───────────────────────────────────

  const totalActive   = activeData.filter((c) => c.isActive).length;
  const pendingCount  = activeData.filter((c) => c.approvedStatus === "Pending").length;
  const approvedCount = activeData.filter((c) => c.approvedStatus === "Approved").length;

  const stats = [
    { label: "Total Requests",   value: activeData.length, color: "#6c63ff", icon: UserCog },
    { label: "Active Contacts",  value: totalActive,       color: "#00b4d8", icon: UserCheck },
    { label: "Approved",         value: approvedCount,     color: "#00d4aa", icon: Users },
    { label: "Pending Approval", value: pendingCount,      color: "#ffb347", icon: Clock },
  ];

  // Helper: update both local state and context simultaneously
  const syncData = (updater) => {
    setLocalData((prev) => updater(prev ?? ctxContactUpdates ?? []));
    if (setContactUpdates) setContactUpdates((prev) => updater(prev ?? []));
  };

  // ─── FILTERING ───────────────────────────────

  const STATUS_TABS = ["All", "Pending", "Approved", "Rejected"];

  const filtered = activeData.filter((cu) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = (
      safeStr(cu.applicationIdentifier).toLowerCase().includes(q) ||
      safeStr(cu.personName).toLowerCase().includes(q) ||
      safeStr(cu.personContact).toLowerCase().includes(q) ||
      safeStr(cu.personEmail).toLowerCase().includes(q) ||
      safeStr(cu.relation).toLowerCase().includes(q) ||
      safeStr(cu.alternatePersonName).toLowerCase().includes(q)
    );
    const matchesStatus = statusFilter === "All" || cu.approvedStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ─── SAVE (CREATE / UPDATE) ──────────────────

  const handleSave = async () => {
    if (!form.personName || !form.personContact) return;
    setActionLoading(true);
    setActionError(null);

    const backendPayload = {
      personName:               form.personName,
      personContact:            form.personContact,
      personEmail:              form.personEmail,
      relation:                 form.relation,
      alternatePersonName:      form.alternatePersonName,
      alternatePersonContact:   form.alternatePersonContact,
      alternatePersonRelation:  form.alternatePersonRelation,
      remark:                   form.remark || null,
    };

    try {
      if (modal === "edit" && form.contactUpdateId) {
  // ── UPDATE ──────────────────────────────
  console.log("[ContactUpdate Update] contactUpdateId:", form.contactUpdateId);
  console.log("[ContactUpdate Update] payload:", backendPayload);

  const res = await updateContactUpdateApi(
    backendPayload,
    form.contactUpdateId
  );

  const updated = mapContactUpdate(
    {
      ...form,
      ...(res?.data?.data ?? res?.data ?? {}),
      ...backendPayload,
      contactUpdateId: form.contactUpdateId,
    },
    0
  );

  syncData((d) =>
    d.map((r) =>
      r.contactUpdateId === form.contactUpdateId ? updated : r
    )
  );
} else {
        // ── CREATE ──────────────────────────────
        const res = await createContactUpdateApi(backendPayload);
        const raw = res?.data?.data ?? res?.data ?? {};
        const newEntry = mapContactUpdate(
          {
            ...backendPayload,
            ...raw,
            approvedStatus: raw.approvedStatus || "Pending",
            isActive: raw.isActive !== undefined ? raw.isActive : true,
            createdAt: raw.createdAt || new Date().toLocaleString("en-IN"),
          },
          activeData.length
        );
        syncData((d) => [...d, newEntry]);
      }
    } catch (err) {
      console.warn("[ContactUpdate Save] Backend failed:", err?.message);
      setActionError("Backend save failed. UI updated locally.");

      // Optimistic local fallback
      if (modal === "edit" && form.applicationIdentifier) {
        syncData((d) =>
          d.map((r) =>
            r.applicationIdentifier === form.applicationIdentifier ? { ...r, ...form } : r
          )
        );
      } else {
        const localEntry = mapContactUpdate(
          {
            ...backendPayload,
            id: `local_${Date.now()}`,
            approvedStatus: "Pending",
            isActive: true,
            createdAt: new Date().toLocaleString("en-IN"),
          },
          activeData.length
        );
        syncData((d) => [...d, localEntry]);
      }
    } finally {
      setActionLoading(false);
      setModal(null);
    }
  };

  // ─── DELETE ──────────────────────────────────

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete contact update "${row.applicationIdentifier}"?`)) return;
    setActionLoading(true);
    setActionError(null);

    // Optimistically remove from UI immediately for snappy feel
    syncData((d) => d.filter((r) => r.applicationIdentifier !== row.applicationIdentifier));

    try {
      await deleteContactUpdateApi(row.applicationIdentifier);
    } catch (err) {
      console.warn("[ContactUpdate Delete] Backend failed:", err?.message);
      setActionError("Backend delete failed. Removed from UI only.");
      // Note: item is already removed from UI; not re-adding to avoid confusion.
      // Re-fetch can restore it if needed.
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (row) => { setForm({ ...row }); setModal("edit"); };
  const openViewModal = (row) => { setViewItem(row); setModal("view"); };
  const closeModal    = () => setModal(null);

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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={fetchAllContactUpdates}
              style={{ background: "rgba(255,179,71,0.15)", border: "1px solid #ffb347", borderRadius: 6, padding: "3px 10px", color: "#ffb347", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
            >
              <RefreshCw size={11} /> Retry
            </button>
            <button onClick={() => setFetchError(null)} style={{ background: "none", border: "none", color: "#ffb347", cursor: "pointer", fontSize: 16 }}>×</button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {fetchLoading && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "16px 20px", marginBottom: 16,
          color: "#8899aa", fontSize: 13, textAlign: "center",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
          Loading contact updates…
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
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Contact Update</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Manage resident contact details, alternate contacts, and approval requests</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {/* Refresh button */}
          <button
            onClick={fetchAllContactUpdates}
            disabled={fetchLoading}
            title="Refresh data"
            style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, padding: "10px 14px",
              color: "#8899aa", fontWeight: 600, fontSize: 13,
              cursor: fetchLoading ? "not-allowed" : "pointer",
              opacity: fetchLoading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={14} style={fetchLoading ? { animation: "spin 1s linear infinite" } : {}} />
          </button>

          <button
            onClick={() => { setForm(EMPTY_FORM); setModal("add"); }}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "linear-gradient(135deg,#1a2a4a,#162040)",
              border: "1px solid rgba(108,99,255,0.3)",
              borderRadius: 10, padding: "10px 18px",
              color: "#e8edf5", fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}
          >
            <Plus size={15} /> Add Contact Update
          </button>
        </div>
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
            LIST OF CONTACT UPDATES
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Status tabs */}
            <div style={{ display: "flex", gap: 4 }}>
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setStatusFilter(tab); setPage(1); }}
                  style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    border: statusFilter === tab ? "1px solid #6c63ff" : "1px solid rgba(255,255,255,0.08)",
                    background: statusFilter === tab ? "rgba(108,99,255,0.15)" : "transparent",
                    color: statusFilter === tab ? "#6c63ff" : "#8899aa",
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

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["S.No", "App ID", "Person Name", "Contact", "Email", "Relation", "Alt. Contact", "Status", "Active", "Action"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fetchLoading && !activeData.length ? (
                <tr>
                  <td colSpan={10} style={{ padding: "40px 14px", textAlign: "center", color: "#556677", fontSize: 13 }}>
                    Loading…
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "40px 14px", textAlign: "center", color: "#556677", fontSize: 13 }}>
                    No contact updates found
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
                    <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontSize: 13 }}>
                      <div style={{ fontWeight: 500 }}>{row.personName || "—"}</div>
                      {row.relation && (
                        <div style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>{row.relation}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#00b4d8", fontSize: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Phone size={11} style={{ flexShrink: 0 }} />
                        {row.personContact || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>
                      {row.personEmail ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Mail size={11} style={{ flexShrink: 0 }} />
                          <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{row.personEmail}</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        background: "rgba(0,180,216,0.10)", color: "#00b4d8",
                        padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>
                        {row.relation || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontSize: 13 }}>
                      <div>{row.alternatePersonName || "—"}</div>
                      {row.alternatePersonContact && (
                        <div style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>{row.alternatePersonContact}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <StatusBadge status={row.approvedStatus} />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <ActiveBadge isActive={row.isActive} />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button onClick={() => openViewModal(row)} style={{ background: "rgba(0,180,216,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#00b4d8", cursor: "pointer" }} title="View"><Eye size={12} /></button>
                        <button onClick={() => openEditModal(row)} style={{ background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#6c63ff", cursor: "pointer" }} title="Edit"><Edit2 size={12} /></button>
                        <button onClick={() => handleDelete(row)} disabled={actionLoading} style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#ff6b6b", cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.6 : 1 }} title="Delete"><Trash2 size={12} /></button>
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
                  <UserCog size={18} color="#6c63ff" />
                </div>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>
                    {modal === "edit" ? "Edit Contact Update" : "Add Contact Update"}
                  </h3>
                  <p style={{ color: "#6b7a90", fontSize: 12, margin: "2px 0 0" }}>
                    {modal === "edit" ? "Update contact information" : "Register a new contact update request"}
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

              <SectionLabel>Primary Contact</SectionLabel>
              <div style={grid2}>
                <FormInput label="Person Name *" field="personName" form={form} setForm={setForm} />
                <FormInput label="Contact Number *" field="personContact" type="tel" form={form} setForm={setForm} />
              </div>
              <div style={grid2}>
                <FormInput label="Email Address" field="personEmail" type="email" form={form} setForm={setForm} />
                <FormSelect label="Relation" field="relation" options={RELATIONS} form={form} setForm={setForm} />
              </div>

              <SectionLabel>Alternate Contact</SectionLabel>
              <div style={grid2}>
                <FormInput label="Alternate Person Name" field="alternatePersonName" form={form} setForm={setForm} />
                <FormInput label="Alternate Contact Number" field="alternatePersonContact" type="tel" form={form} setForm={setForm} />
              </div>
              <div style={{ width: "50%" }}>
                <FormSelect label="Alternate Relation" field="alternatePersonRelation" options={ALT_RELATIONS} form={form} setForm={setForm} />
              </div>

              <SectionLabel>Remarks</SectionLabel>
              <div style={fieldWrapper}>
                <label style={labelStyle}>Remark (Optional)</label>
                <textarea
                  value={form.remark || ""}
                  onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
                  rows={3}
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
              <button onClick={handleSave} disabled={actionLoading || (!form.personName || !form.personContact)} style={{
                background: "linear-gradient(135deg, #6c63ff 0%, #00b4d8 100%)",
                border: "none", borderRadius: 9, padding: "9px 22px",
                color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: (actionLoading || (!form.personName || !form.personContact)) ? "not-allowed" : "pointer",
                opacity: (actionLoading || (!form.personName || !form.personContact)) ? 0.7 : 1,
                display: "flex", alignItems: "center", gap: 7,
              }}>
                <CheckCircle2 size={14} />
                {actionLoading ? "Saving…" : "Save Contact Update"}
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
                  <UserCog size={18} color="#6c63ff" />
                </div>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>Contact Update Details</h3>
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

              {/* Hero card */}
              <div style={{
                background: "rgba(108,99,255,0.08)",
                border: "1px solid rgba(108,99,255,0.15)",
                borderRadius: 12, padding: 16, marginBottom: 16,
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              }}>
                <div>
                  <p style={{ color: "#6c63ff", fontWeight: 700, fontSize: 13 }}>{viewItem.applicationIdentifier}</p>
                  <p style={{ color: "var(--text-primary)", fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                    {viewItem.personName || "—"}
                  </p>
                  <p style={{ color: "#8899aa", fontSize: 12, marginTop: 3 }}>{viewItem.relation}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <StatusBadge status={viewItem.approvedStatus} />
                  <ActiveBadge isActive={viewItem.isActive} />
                </div>
              </div>

              {/* Primary contact info cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "rgba(0,180,216,0.06)", border: "1px solid rgba(0,180,216,0.12)", borderRadius: 10, padding: 12 }}>
                  <p style={{ color: "#8899aa", fontSize: 11, marginBottom: 4 }}>Phone</p>
                  <p style={{ color: "#00b4d8", fontWeight: 700, fontSize: 13 }}>{viewItem.personContact || "—"}</p>
                </div>
                <div style={{ background: "rgba(108,99,255,0.06)", border: "1px solid rgba(108,99,255,0.12)", borderRadius: 10, padding: 12 }}>
                  <p style={{ color: "#8899aa", fontSize: 11, marginBottom: 4 }}>Email</p>
                  <p style={{ color: "#6c63ff", fontWeight: 600, fontSize: 12, wordBreak: "break-all" }}>{viewItem.personEmail || "—"}</p>
                </div>
              </div>

              {/* Alternate contact */}
              {(viewItem.alternatePersonName || viewItem.alternatePersonContact) && (
                <div style={{
                  background: "rgba(255,179,71,0.06)",
                  border: "1px solid rgba(255,179,71,0.12)",
                  borderRadius: 10, padding: "12px 14px", marginBottom: 16,
                }}>
                  <p style={{ color: "#ffb347", fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Alternate Contact</p>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{viewItem.alternatePersonName || "—"}</p>
                      <p style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>{viewItem.alternatePersonRelation}</p>
                    </div>
                    <p style={{ color: "#ffb347", fontWeight: 600, fontSize: 13 }}>{viewItem.alternatePersonContact || "—"}</p>
                  </div>
                </div>
              )}

              {/* Property / Society info */}
              {(viewItem.property || viewItem.society) && (
                <div style={{
                  background: "rgba(0,212,170,0.05)",
                  border: "1px solid rgba(0,212,170,0.1)",
                  borderRadius: 10, padding: "12px 14px", marginBottom: 16,
                  display: "flex", gap: 8, alignItems: "flex-start",
                }}>
                  <Building2 size={15} color="#00d4aa" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    {viewItem.property && (
                      <p style={{ color: "var(--text-primary)", fontSize: 13 }}>
                        <span style={{ color: "#8899aa" }}>Flat: </span>{viewItem.property.flatNumber} — {viewItem.property.propertyName}
                      </p>
                    )}
                    {viewItem.society && (
                      <p style={{ color: "#8899aa", fontSize: 12, marginTop: 4 }}>{viewItem.society.societyName}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Committee member info */}
              {viewItem.committeeMember && (
                <div style={{
                  background: "rgba(108,99,255,0.05)",
                  border: "1px solid rgba(108,99,255,0.1)",
                  borderRadius: 10, padding: "12px 14px", marginBottom: 16,
                }}>
                  <p style={{ color: "#6c63ff", fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Committee Member</p>
                  <p style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{viewItem.committeeMember.fullName}</p>
                  <p style={{ color: "#8899aa", fontSize: 12, marginTop: 2 }}>
                    {viewItem.committeeMember.designation} · {viewItem.committeeMember.contactNumber}
                  </p>
                  {viewItem.committeeMember.tower && (
                    <p style={{ color: "#8899aa", fontSize: 12, marginTop: 2 }}>{viewItem.committeeMember.tower.towerName}</p>
                  )}
                </div>
              )}

              {/* Detail rows */}
              <DetailRow label="Application ID"       value={viewItem.applicationIdentifier} accent="#6c63ff" />
              <DetailRow label="Approver Remark"      value={viewItem.approvarRemark} />
              <DetailRow label="Parent Status"        value={viewItem.parentApprovedStatus} />
              <DetailRow label="Created By"           value={viewItem.createdBy} />
              <DetailRow label="Created At"           value={viewItem.createdAt} />
              <DetailRow label="Updated At"           value={viewItem.updatedAt} />
              {viewItem.remark && <DetailRow label="Remark" value={viewItem.remark} />}
            </div>
          </div>
        </div>
      )}

      {/* Spin keyframe for refresh icon */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}