// @ts-nocheck
// InteriorWorkDashboard.jsx

import React, { useState, useEffect } from "react";
import {
  Hammer, Plus, Search,
  Edit2, Trash2, Eye, X,
  ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
  CheckCircle2, Clock, Wrench,
} from "lucide-react";

import {
  createInteriorWorkApi,
  updateInteriorWorkApi,
  deleteInteriorWorkApi,
  getAllInteriorWorkApi,
} from "../api/application-api";
import { useAppContext } from "../AppContext";

// ─── CONSTANTS ───────────────────────────────

const WORK_TYPES = [
  "Extension", "Renovation", "Flooring", "Painting",
  "Electrical", "Plumbing", "Carpentry", "False Ceiling",
  "Tiling", "Waterproofing", "Other",
];

const CATEGORIES = [
  "Living Room", "Bedroom", "Kitchen", "Bathroom",
  "Balcony", "Hall", "Full Flat", "Other",
];

const EMPTY_FORM = {
  workType:                "Extension",
  category:                "Living Room",
  workDescription:         "",
  remark:                  "",
  vendorName:              "",
  vendorContactNumber:     "",
  vehicleOwnerName:        "",
  gatePassNumber:          "",
  isRequestFile:           false,
  isTenantUndertakeWork:   false,
  isStructuralWork:        false,
};

const PER_PAGE = 9;

// ─── HELPERS ─────────────────────────────────

const safeStr  = (v) => (v == null ? "" : String(v));
const safeBool = (v) => (v === true || v === "true");
const formatNumber = (n) => Number(n).toLocaleString("en-IN");

export function mapInteriorWork(item, i) {
  return {
    id: item.interiorId || item.id || item._id || i + 1,
    applicationIdentifier: safeStr(
      item.applicationIdentifier || `IN-${String(i + 1).padStart(5, "0")}`
    ),
    propertyIdentifier: safeStr(item.propertyIdentifier || ""),
    // Work fields
    workType:            safeStr(item.workType            || ""),
    category:            safeStr(item.category            || ""),
    workDescription:     safeStr(item.workDescription     || ""),
    remark:              safeStr(item.remark              || ""),
    gatePassNumber:      safeStr(item.gatePassNumber      || ""),
    vendorName:          safeStr(item.vendorName          || ""),
    vendorContactNumber: safeStr(item.vendorContactNumber || ""),
    vehicleOwnerName:    safeStr(item.vehicleOwnerName    || ""),
    // Boolean flags
    isRequestFile:         safeBool(item.isRequestFile),
    isTenantUndertakeWork: safeBool(item.isTenantUndertakeWork),
    isStructuralWork:      safeBool(item.isStructuralWork),
    // Status
    approvedStatus:       safeStr(item.approvedStatus       || "Pending"),
    parentApprovedStatus: safeStr(item.parentApprovedStatus || "N/A"),
    approvarRemark:       safeStr(item.approvarRemark       || ""),
    parentApprovarRemark: safeStr(item.parentApprovarRemark || ""),
    approvedAt:           safeStr(item.approvedAt           || ""),
    // Property
    propertyName: safeStr(item.property?.propertyName || ""),
    flatNumber:   safeStr(item.property?.flatNumber   || ""),
    // Society
    societyName:       safeStr(item.society?.societyName       || ""),
    societyIdentifier: safeStr(item.society?.societyIdentifier || ""),
    // Committee
    committeeMemberName:        safeStr(item.committeeMember?.fullName        || ""),
    committeeMemberDesignation: safeStr(item.committeeMember?.designation     || ""),
    committeeMemberContact:     safeStr(item.committeeMember?.contactNumber   || ""),
    // Meta
    createdBy: safeStr(item.createdBy || ""),
    updatedBy: safeStr(item.updatedBy || ""),
    createdAt: safeStr(item.createdAt || ""),
    updatedAt: safeStr(item.updatedAt || ""),
    isActive:  item.isActive !== undefined ? item.isActive : true,
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
  "Approved":      { bg: "rgba(0,212,170,0.12)",  color: "#00d4aa" },
  "Auto Approved": { bg: "rgba(0,212,170,0.12)",  color: "#00d4aa" },
  "Pending":       { bg: "rgba(255,179,71,0.12)", color: "#ffb347" },
  "Rejected":      { bg: "rgba(255,107,107,0.12)",color: "#ff6b6b" },
  "N/A":           { bg: "rgba(136,153,170,0.12)",color: "#8899aa" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_COLORS[status] || STATUS_COLORS["N/A"];
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "3px 9px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {status || "N/A"}
    </span>
  );
};

// ─── BOOL BADGE ───────────────────────────────

const BoolBadge = ({ value, trueLabel = "Yes", falseLabel = "No" }) => (
  <span style={{
    background: value ? "rgba(0,212,170,0.10)" : "rgba(255,107,107,0.10)",
    color: value ? "#00d4aa" : "#ff6b6b",
    padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
  }}>
    {value ? trueLabel : falseLabel}
  </span>
);

// ─── TOGGLE FIELD ─────────────────────────────

const ToggleField = ({ label, field, form, setForm }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 9, padding: "10px 14px",
    marginBottom: 10, cursor: "pointer",
  }} onClick={() => setForm((f) => ({ ...f, [field]: !f[field] }))}>
    <span style={{ color: "var(--text-primary)", fontSize: 13 }}>{label}</span>
    <div style={{
      width: 36, height: 20, borderRadius: 10,
      background: form[field] ? "#6c63ff" : "rgba(255,255,255,0.1)",
      position: "relative", transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: 3,
        left: form[field] ? 18 : 3,
        width: 14, height: 14, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
      }} />
    </div>
  </div>
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

const FormInput = ({ label, field, type = "text", form, setForm, placeholder }) => (
  <div style={fieldWrapper}>
    <label style={labelStyle}>{label}</label>
    <input
      type={type}
      value={form[field] || ""}
      placeholder={placeholder || ""}
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

export default function InteriorWorkDashboard() {

  const { interiorWorks: ctxInteriorWorks, setInteriorWorks } = useAppContext();

  const [localData,     setLocalData]     = useState(null);
  const [search,        setSearch]        = useState("");
  const [page,          setPage]          = useState(1);
  const [modal,         setModal]         = useState(null); // "add" | "edit" | "view"
  const [form,          setForm]          = useState(EMPTY_FORM);
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
        const res = await getAllInteriorWorkApi();

        // Debug: log the raw response shape so you can verify in devtools console
        console.log("[InteriorWork Fetch] raw response:", res);
        console.log("[InteriorWork Fetch] res.data:", res?.data);

        const body = res?.data;

        // Try every common response shape until we find an array
        let raw =
          body?.data?.items ??
          body?.data?.interiors ??
          body?.data?.results ??
          body?.data?.records ??
          body?.data ??
          body?.items ??
          body?.interiors ??
          body?.results ??
          body ??
          [];

        if (!Array.isArray(raw)) {
          console.warn(
            "[InteriorWork Fetch] Response is not an array, got:",
            raw
          );
          raw = [];
        }

        const mapped = raw.map((item, i) => mapInteriorWork(item, i));
        setLocalData(mapped);
        if (setInteriorWorks) setInteriorWorks(() => mapped);

        if (mapped.length === 0) {
          console.warn(
            "[InteriorWork Fetch] No records mapped. Check the 'raw response' log above to verify the response shape from /interior/all."
          );
        }
      } catch (err) {
        console.error(
          "[InteriorWork Fetch] Failed. Status:",
          err?.response?.status,
          "Body:",
          err?.response?.data,
          "Message:",
          err?.message
        );

        let msg = "Failed to load interior work applications. Showing cached data.";
        if (err?.response?.status === 404) {
          msg = "Failed to load (404): check the '/interior/all' endpoint path on the backend.";
        } else if (err?.response?.status === 401 || err?.response?.status === 403) {
          msg = "Failed to load: not authorized. Please check your login/session.";
        } else if (!err?.response) {
          msg = "Failed to load: network/CORS error. Check your API base URL and connection.";
        }
        setFetchError(msg);
      } finally {
        setFetchLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeData = localData || ctxInteriorWorks || [];

  // ─── STATS ────────────────────────────────────

  const pending  = activeData.filter((r) => r.approvedStatus === "Pending").length;
  const approved = activeData.filter((r) => r.approvedStatus === "Approved" || r.approvedStatus === "Auto Approved").length;
  const structural = activeData.filter((r) => r.isStructuralWork).length;

  const stats = [
    { label: "Total Applications", value: activeData.length, color: "#6c63ff", icon: Hammer },
    { label: "Approved",           value: approved,          color: "#00d4aa", icon: CheckCircle2 },
    { label: "Pending Approval",   value: pending,           color: "#ffb347", icon: Clock },
    { label: "Structural Work",    value: structural,        color: "#ff6b6b", icon: Wrench },
  ];

  const syncData = (updater) => {
    setLocalData(updater(activeData));
    if (setInteriorWorks) setInteriorWorks(updater);
  };

  // ─── FILTER ───────────────────────────────────

  const STATUS_TABS = ["All", "Pending", "Approved", "Auto Approved", "Rejected"];

  const filtered = activeData.filter((r) => {
    const q = search.toLowerCase().trim();
    const matchSearch = (
      safeStr(r.applicationIdentifier).toLowerCase().includes(q) ||
      safeStr(r.workType).toLowerCase().includes(q) ||
      safeStr(r.category).toLowerCase().includes(q) ||
      safeStr(r.vendorName).toLowerCase().includes(q) ||
      safeStr(r.vehicleOwnerName).toLowerCase().includes(q) ||
      safeStr(r.propertyName).toLowerCase().includes(q) ||
      safeStr(r.flatNumber).toLowerCase().includes(q)
    );
    const matchStatus = statusFilter === "All" || r.approvedStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ─── SAVE ─────────────────────────────────────

  const handleSave = async () => {
    if (!form.workType) return;
    setActionLoading(true);
    setActionError(null);

    // Exact fields backend expects — JSON (not FormData)
    const payload = {
      workType:              form.workType,
      category:              form.category,
      workDescription:       form.workDescription,
      remark:                form.remark,
      vendorName:            form.vendorName,
      vendorContactNumber:   form.vendorContactNumber,
      vehicleOwnerName:      form.vehicleOwnerName,
      gatePassNumber:        form.gatePassNumber || null,
      isRequestFile:         form.isRequestFile,
      isTenantUndertakeWork: form.isTenantUndertakeWork,
      isStructuralWork:      form.isStructuralWork,
    };

    try {
      if (modal === "edit" && form.id) {
        // EDIT — updateInteriorWorkApi(data, id) — id here = interiorId (UUID)
        await updateInteriorWorkApi(payload, form.id);
        syncData((d) => d.map((r) =>
          r.id === form.id
            ? { ...r, ...mapInteriorWork({ ...r, ...payload }, 0) }
            : r
        ));
      } else {
        // CREATE
        const res = await createInteriorWorkApi(payload);
        const raw = res?.data?.data || {};
        const newEntry = mapInteriorWork({
          ...payload,
          ...raw,
          approvedStatus: raw.approvedStatus || "Pending",
          createdAt: new Date().toLocaleString("en-IN"),
        }, activeData.length);
        syncData((d) => [...d, newEntry]);
      }
    } catch (err) {
      console.error(
        "[InteriorWork Save] Backend failed.",
        "| Status:", err?.response?.status,
        "| Body:", err?.response?.data,
        "| Message:", err?.message
      );
      setActionError(
        `Backend save failed${err?.response?.status ? ` (${err.response.status})` : ""}: ${
          JSON.stringify(err?.response?.data?.message || err?.response?.data || err?.message)
        }. UI updated locally.`
      );
      if (modal === "edit" && form.id) {
        syncData((d) => d.map((r) =>
          r.id === form.id
            ? { ...r, ...mapInteriorWork({ ...r, ...payload }, 0) }
            : r
        ));
      } else {
        const localEntry = mapInteriorWork({
          ...payload,
          id: `local_${Date.now()}`,
          approvedStatus: "Pending",
          createdAt: new Date().toLocaleString("en-IN"),
        }, activeData.length);
        syncData((d) => [...d, localEntry]);
      }
    } finally {
      setActionLoading(false);
      setModal(null);
    }
  };

  // ─── DELETE ───────────────────────────────────

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete application "${row.applicationIdentifier}"?`)) return;
    setActionLoading(true);
    setActionError(null);

    try {
      // Uses: DELETE interior/delete/:id  with id = applicationIdentifier (e.g. "IN-00597")
      const res = await deleteInteriorWorkApi(row.applicationIdentifier);
      console.log("[InteriorWork Delete] Success:", res?.data);

      syncData((d) => d.filter((r) => r.applicationIdentifier !== row.applicationIdentifier));
    } catch (err) {
      console.error(
        "[InteriorWork Delete] Failed for:", row.applicationIdentifier,
        "| Status:", err?.response?.status,
        "| Body:", err?.response?.data,
        "| Message:", err?.message
      );

      let msg = "Delete failed.";
      if (err?.response?.status === 404) {
        msg = `Delete failed (404): "${row.applicationIdentifier}" not found at "interior/delete/${row.applicationIdentifier}".`;
      } else if (err?.response?.status === 401 || err?.response?.status === 403) {
        msg = "Delete failed: not authorized.";
      } else if (err?.response?.status === 400) {
        msg = `Delete failed (400): ${JSON.stringify(err?.response?.data?.message || err?.response?.data || "bad request")}`;
      } else if (!err?.response) {
        msg = "Delete failed: network/CORS error.";
      } else {
        msg = `Delete failed (${err?.response?.status}): ${JSON.stringify(err?.response?.data?.message || err?.response?.data || err?.message)}`;
      }
      setActionError(msg);
      // Do NOT remove from UI — keep it visible since backend delete failed
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (row) => {
    setForm({
      ...EMPTY_FORM,
      ...row,
    });
    setModal("edit");
  };

  const openViewModal = (row) => { setViewItem(row); setModal("view"); };
  const closeModal    = ()    => setModal(null);

  // ─── RENDER ───────────────────────────────────

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

      {/* Loading */}
      {fetchLoading && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "16px 20px", marginBottom: 16,
          color: "#8899aa", fontSize: 13, textAlign: "center",
        }}>
          Loading interior work applications…
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
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Interior Work</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Manage interior work permits, vendors, and approval status</p>
        </div>
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
          <Plus size={15} /> New Application
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
            LIST OF INTERIOR WORK APPLICATIONS
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
                {["S.No", "App ID", "Work Type", "Category", "Vendor", "Property / Flat", "Structural", "Tenant Work", "Status", "Action"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "40px 14px", textAlign: "center", color: "#556677", fontSize: 13 }}>
                    No applications found
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
                    <td style={{ padding: "12px 14px", color: "#6c63ff", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{row.applicationIdentifier}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        background: "rgba(108,99,255,0.12)", color: "#6c63ff",
                        padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>
                        {row.workType || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        background: "rgba(0,180,216,0.12)", color: "#00b4d8",
                        padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>
                        {row.category || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontSize: 13 }}>
                      <div>{row.vendorName || "—"}</div>
                      {row.vendorContactNumber && (
                        <div style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>{row.vendorContactNumber}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontSize: 12 }}>
                      <div>{row.propertyName || "—"}</div>
                      {row.flatNumber && <div style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>Flat {row.flatNumber}</div>}
                    </td>
                    <td style={{ padding: "12px 14px" }}><BoolBadge value={row.isStructuralWork} /></td>
                    <td style={{ padding: "12px 14px" }}><BoolBadge value={row.isTenantUndertakeWork} /></td>
                    <td style={{ padding: "12px 14px" }}><StatusBadge status={row.approvedStatus} /></td>
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
            borderRadius: 20, width: "100%", maxWidth: 580,
            maxHeight: "92vh", overflow: "hidden",
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
                  <Hammer size={18} color="#6c63ff" />
                </div>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>
                    {modal === "edit" ? "Edit Interior Work" : "New Interior Work Application"}
                  </h3>
                  <p style={{ color: "#6b7a90", fontSize: 12, margin: "2px 0 0" }}>
                    {modal === "edit" ? "Update work permit details" : "Register a new interior work permit"}
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

              {/* ── Work Details ── */}
              <SectionLabel>Work Details</SectionLabel>
              <div style={grid2}>
                <FormSelect label="Work Type *" field="workType"  options={WORK_TYPES} form={form} setForm={setForm} />
                <FormSelect label="Category *"  field="category" options={CATEGORIES} form={form} setForm={setForm} />
              </div>
              <div style={fieldWrapper}>
                <label style={labelStyle}>Work Description</label>
                <textarea
                  value={form.workDescription || ""}
                  onChange={(e) => setForm((f) => ({ ...f, workDescription: e.target.value }))}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
              <div style={fieldWrapper}>
                <label style={labelStyle}>Remark</label>
                <textarea
                  value={form.remark || ""}
                  onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* ── Vendor Details ── */}
              <SectionLabel>Vendor Details</SectionLabel>
              <div style={grid2}>
                <FormInput label="Vendor Name"           field="vendorName"          form={form} setForm={setForm} />
                <FormInput label="Vendor Contact Number" field="vendorContactNumber" type="tel" form={form} setForm={setForm} />
              </div>
              <div style={grid2}>
                <FormInput label="Vehicle Owner Name" field="vehicleOwnerName" form={form} setForm={setForm} />
                <FormInput label="Gate Pass Number"   field="gatePassNumber"   form={form} setForm={setForm} />
              </div>

              {/* ── Flags ── */}
              <SectionLabel>Work Flags</SectionLabel>
              <ToggleField label="Request File Required"      field="isRequestFile"         form={form} setForm={setForm} />
              <ToggleField label="Tenant Undertakes Work"     field="isTenantUndertakeWork" form={form} setForm={setForm} />
              <ToggleField label="Structural Work Involved"   field="isStructuralWork"      form={form} setForm={setForm} />

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
            borderRadius: 20, width: "100%", maxWidth: 500,
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
                  <Hammer size={18} color="#6c63ff" />
                </div>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>Work Permit Details</h3>
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
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              }}>
                <div>
                  <p style={{ color: "#6c63ff", fontWeight: 700, fontSize: 13 }}>{viewItem.applicationIdentifier}</p>
                  <p style={{ color: "var(--text-primary)", fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                    {viewItem.workType || "—"}
                  </p>
                  <p style={{ color: "#8899aa", fontSize: 12, marginTop: 4 }}>{viewItem.category || ""}</p>
                </div>
                <StatusBadge status={viewItem.approvedStatus} />
              </div>

              {/* Property / Society */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.12)", borderRadius: 10, padding: 12 }}>
                  <p style={{ color: "#8899aa", fontSize: 11 }}>Property</p>
                  <p style={{ color: "#00d4aa", fontWeight: 700, fontSize: 13, marginTop: 4 }}>{viewItem.propertyName || "—"}</p>
                  {viewItem.flatNumber && <p style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>Flat {viewItem.flatNumber}</p>}
                </div>
                <div style={{ background: "rgba(108,99,255,0.06)", border: "1px solid rgba(108,99,255,0.12)", borderRadius: 10, padding: 12 }}>
                  <p style={{ color: "#8899aa", fontSize: 11 }}>Society</p>
                  <p style={{ color: "#6c63ff", fontWeight: 700, fontSize: 12, marginTop: 4 }}>{viewItem.societyName || "—"}</p>
                </div>
              </div>

              {/* Flags */}
              <SectionLabel>Work Flags</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                {[
                  ["Request File",   viewItem.isRequestFile],
                  ["Tenant Work",    viewItem.isTenantUndertakeWork],
                  ["Structural",     viewItem.isStructuralWork],
                ].map(([label, value]) => (
                  <div key={label} style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "10px 8px",
                  }}>
                    <span style={{ color: "#6b7a90", fontSize: 11, textAlign: "center" }}>{label}</span>
                    <BoolBadge value={value} />
                  </div>
                ))}
              </div>

              {/* Detail rows */}
              {[
                ["Vendor Name",           viewItem.vendorName],
                ["Vendor Contact",        viewItem.vendorContactNumber],
                ["Vehicle Owner",         viewItem.vehicleOwnerName],
                ["Gate Pass No.",         viewItem.gatePassNumber],
                ["Work Description",      viewItem.workDescription],
                ["Remark",                viewItem.remark],
                ["Committee Member",      viewItem.committeeMemberName],
                ["Designation",           viewItem.committeeMemberDesignation],
                ["Approver Remark",       viewItem.approvarRemark],
                ["Created By",            viewItem.createdBy],
                ["Created At",            viewItem.createdAt],
                ["Updated At",            viewItem.updatedAt],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{ color: "#6b7a90", fontSize: 13, flexShrink: 0 }}>{label}</span>
                  <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500, textAlign: "right", maxWidth: "60%", marginLeft: 12 }}>{value}</span>
                </div>
              ))}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}