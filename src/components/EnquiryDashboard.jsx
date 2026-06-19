// @ts-nocheck
// EnquiryDashboard.jsx

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare, Plus, Search,
  Edit2, Trash2, Eye, X,
  ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
  CheckCircle2, Clock, FileText,
  Paperclip, Building2, Tag,
} from "lucide-react";

import {
  createNewEnquiryApi,
  updateEnquiryApi,
  getAllEnquiryApi,
  deleteEnquiryApi,
} from "../api/application-api";
import { useAppContext } from "../AppContext";

// ─── CONSTANTS ───────────────────────────────

const PER_PAGE = 9;

const EMPTY_FORM = {
  enquiryType: "",
  descriptionComment: "",
  enquiryFile: null,
};

// ─── HELPERS ─────────────────────────────────

const safeStr = (v) => (v == null ? "" : String(v));
const formatNumber = (n) => Number(n).toLocaleString("en-IN");

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

export function mapEnquiry(item, i) {
  return {
    id: item.otherEnquiryId || item.id || item._id || i + 1,
    applicationIdentifier: safeStr(
      item.applicationIdentifier || `OE-${String(i + 1).padStart(5, "0")}`
    ),
    otherEnquiryId: safeStr(item.otherEnquiryId || ""),
    propertyIdentifier: safeStr(item.propertyIdentifier || item.property?.propertyIdentifier || ""),
    propertyName: safeStr(item.property?.propertyName || ""),
    societyIdentifier: safeStr(item.society?.societyIdentifier || ""),
    societyName: safeStr(item.society?.societyName || ""),
    enquiryType: safeStr(item.enquiryType || ""),
    enquiryFile: item.enquiryFile || null,
    descriptionComment: safeStr(item.descriptionComment || ""),
    // API returns "N/A" as the default approvedStatus
    approvedStatus: safeStr(item.approvedStatus || "N/A"),
    parentApprovedStatus: safeStr(item.parentApprovedStatus || "N/A"),
    approvedAt: safeStr(item.approvedAt || ""),
    parentApprovedAt: safeStr(item.parentApprovedAt || ""),
    committeeMemberId: safeStr(item.committeeMemberId || ""),
    parentCommitteeMemberId: safeStr(item.parentCommitteeMemberId || ""),
    createdAt: safeStr(item.createdAt || ""),
    updatedAt: safeStr(item.updatedAt || ""),
    createdBy: safeStr(item.createdBy || ""),
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

// ─── STATUS BADGE ─────────────────────────────

const STATUS_COLORS = {
  Approved: { bg: "rgba(0,212,170,0.12)", color: "#00d4aa" },
  Pending:  { bg: "rgba(255,179,71,0.12)", color: "#ffb347" },
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
      value={form[field] ?? ""}
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
        <button onClick={() => onChange(1)} disabled={isFirst} style={{ ...btnBase, color: isFirst ? "#556677" : "#8899aa" }}><ChevronsLeft size={12} /></button>
        <button onClick={() => onChange(page - 1)} disabled={isFirst} style={{ ...btnBase, color: isFirst ? "#556677" : "#8899aa" }}><ChevronLeft size={12} /></button>
        {visiblePages.map((p) => (
          <button key={p} onClick={() => onChange(p)} style={{
            ...btnBase,
            background: p === page ? "#f59e0b" : "none",
            border: `1px solid ${p === page ? "#f59e0b" : "var(--border)"}`,
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

export default function EnquiryDashboard() {

  const { enquiries: ctxEnquiries, setEnquiries } = useAppContext();

  const fileInputRef = useRef(null);

  const [localData,      setLocalData]      = useState(null);
  const [search,         setSearch]         = useState("");
  const [page,           setPage]           = useState(1);
  const [modal,          setModal]          = useState(null); // "add" | "edit" | "view"
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [viewItem,       setViewItem]       = useState(null);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [actionError,    setActionError]    = useState(null);
  const [statusFilter,   setStatusFilter]   = useState("All");
  const [fetchLoading,   setFetchLoading]   = useState(false);
  const [fetchError,     setFetchError]     = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  // ─── FETCH ALL ENQUIRIES ──────────────────────

  useEffect(() => {
    const fetchData = async () => {
      setFetchLoading(true);
      setFetchError(null);
      try {
        const res = await getAllEnquiryApi();
        // API may return a single object or an array under data.data / data
        const raw = res?.data?.data || res?.data || [];
        const arr = Array.isArray(raw) ? raw : [raw];
        const mapped = arr.map((item, i) => mapEnquiry(item, i));
        setLocalData(mapped);
        if (setEnquiries) setEnquiries(() => mapped);
      } catch (err) {
        console.error("[Enquiry Fetch] Failed:", err?.message);
        setFetchError("Failed to load enquiries. Showing cached data.");
      } finally {
        setFetchLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeData = localData || ctxEnquiries || [];

  // ─── STATS ────────────────────────────────────

  const naCount       = activeData.filter((r) => r.approvedStatus === "N/A").length;
  const pendingCount  = activeData.filter((r) => r.approvedStatus === "Pending").length;
  const approvedCount = activeData.filter((r) => r.approvedStatus === "Approved").length;
  const withFileCount = activeData.filter((r) => r.enquiryFile).length;

  const stats = [
    { label: "Total Enquiries",   value: activeData.length, color: "#f59e0b", icon: MessageSquare },
    { label: "Approved",          value: approvedCount,     color: "#00d4aa", icon: CheckCircle2 },
    { label: "Pending",           value: pendingCount,      color: "#ffb347", icon: Clock },
    { label: "With Attachments",  value: withFileCount,     color: "#6c63ff", icon: Paperclip },
  ];

  const syncData = (updater) => {
    const next = updater(activeData);
    setLocalData(next);
    if (setEnquiries) setEnquiries(() => next);
  };

  const STATUS_TABS = ["All", "Pending", "Approved", "Rejected", "N/A"];

  const filtered = activeData.filter((r) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = (
      safeStr(r.applicationIdentifier).toLowerCase().includes(q) ||
      safeStr(r.enquiryType).toLowerCase().includes(q) ||
      safeStr(r.propertyName).toLowerCase().includes(q) ||
      safeStr(r.descriptionComment).toLowerCase().includes(q) ||
      safeStr(r.societyName).toLowerCase().includes(q)
    );
    const matchesStatus = statusFilter === "All" || r.approvedStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ─── SAVE ────────────────────────────────────

  const handleSave = async () => {
    if (!form.enquiryType?.trim()) return;
    setActionLoading(true);
    setActionError(null);

    const payload = {
      enquiryType: form.enquiryType,
      descriptionComment: form.descriptionComment,
      ...(form.enquiryFile instanceof File && { enquiryFile: form.enquiryFile }),
    };

    try {
      if (form.applicationIdentifier) {
        // ── EDIT ──
        await updateEnquiryApi(payload, form.applicationIdentifier);
        syncData((d) => d.map((r) =>
          r.applicationIdentifier === form.applicationIdentifier
            ? { ...r, ...mapEnquiry({ ...r, ...payload }, 0) }
            : r
        ));
      } else {
        // ── CREATE ──
        const res = await createNewEnquiryApi(payload);
        // Response: { data: { otherEnquiryId, applicationIdentifier, approvedStatus, ... } }
        const raw = res?.data?.data || res?.data || {};
        const newEntry = mapEnquiry({
          ...payload,
          ...raw,
          approvedStatus: raw.approvedStatus || "N/A",
          createdAt: raw.createdAt || new Date().toISOString(),
        }, activeData.length);
        syncData((d) => [...d, newEntry]);
      }
    } catch (err) {
      console.warn("[Enquiry Save] Backend failed:", err?.message);
      setActionError("Backend save failed. UI updated locally.");
      if (form.applicationIdentifier) {
        syncData((d) => d.map((r) =>
          r.applicationIdentifier === form.applicationIdentifier
            ? { ...r, ...mapEnquiry({ ...r, ...payload }, 0) }
            : r
        ));
      } else {
        const localEntry = mapEnquiry({
          ...payload,
          otherEnquiryId: `local_${Date.now()}`,
          applicationIdentifier: `OE-LOCAL-${Date.now()}`,
          approvedStatus: "N/A",
          createdAt: new Date().toISOString(),
        }, activeData.length);
        syncData((d) => [...d, localEntry]);
      }
    } finally {
      setActionLoading(false);
      setModal(null);
      setSelectedFileName("");
    }
  };

  // ─── DELETE ──────────────────────────────────

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete enquiry "${row.applicationIdentifier}"?`)) return;
    setActionLoading(true);
    setActionError(null);
    try {
      // Uses correct API: other-enquiry/delete-other-enquiry/{id}
      await deleteEnquiryApi(row.applicationIdentifier);
      syncData((d) => d.filter((r) => r.applicationIdentifier !== row.applicationIdentifier));
    } catch (err) {
      console.warn("[Enquiry Delete] Backend failed:", err?.message);
      setActionError("Backend delete failed. Removed from UI only.");
      syncData((d) => d.filter((r) => r.applicationIdentifier !== row.applicationIdentifier));
    } finally {
      setActionLoading(false);
    }
  };

  // ─── OPEN MODALS ──────────────────────────────

  const openEditModal = (row) => {
    setForm({ ...EMPTY_FORM, ...row, enquiryFile: null });
    setSelectedFileName(row.enquiryFile ? "Existing file attached" : "");
    setModal("edit");
  };

  const openViewModal = (row) => { setViewItem(row); setModal("view"); };
  const closeModal    = ()    => { setModal(null); setSelectedFileName(""); setActionError(null); };

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
          Loading enquiries…
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
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Enquiries</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Manage resident and property enquiries</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setSelectedFileName(""); setModal("add"); }}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "linear-gradient(135deg,#2a1a0a,#201005)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 10, padding: "10px 18px",
            color: "#e8edf5", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}
        >
          <Plus size={15} /> Add Enquiry
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
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#f59e0b", fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 3, height: 16, background: "#f59e0b", borderRadius: 2 }} />
            LIST OF ENQUIRIES
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
                    border: statusFilter === tab ? "1px solid #f59e0b" : "1px solid rgba(255,255,255,0.08)",
                    background: statusFilter === tab ? "rgba(245,158,11,0.15)" : "transparent",
                    color: statusFilter === tab ? "#f59e0b" : "#8899aa",
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
                {["S.No", "Enquiry ID", "Property", "Enquiry Type", "Description", "Attachment", "Status", "Action"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 14px", textAlign: "center", color: "#556677", fontSize: 13 }}>
                    {fetchLoading ? "Loading…" : "No enquiries found"}
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

                    <td style={{ padding: "12px 14px", color: "#f59e0b", fontWeight: 600, fontSize: 12 }}>{row.applicationIdentifier}</td>

                    <td style={{ padding: "12px 14px", fontSize: 12 }}>
                      <div style={{ color: "var(--text-primary)" }}>{row.propertyName || row.propertyIdentifier || "—"}</div>
                      {row.societyName && (
                        <div style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>{row.societyName}</div>
                      )}
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      {row.enquiryType ? (
                        <span style={{
                          background: "rgba(245,158,11,0.12)", color: "#f59e0b",
                          padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          display: "inline-flex", alignItems: "center", gap: 4,
                        }}>
                          <Tag size={9} /> {row.enquiryType}
                        </span>
                      ) : <span style={{ color: "#556677", fontSize: 12 }}>—</span>}
                    </td>

                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12, maxWidth: 220 }}>
                      <div style={{
                        overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: "nowrap", maxWidth: 200,
                      }} title={row.descriptionComment}>
                        {row.descriptionComment || "—"}
                      </div>
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      {row.enquiryFile ? (
                        <a
                          href={row.enquiryFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            background: "rgba(108,99,255,0.12)", color: "#6c63ff",
                            padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          <Paperclip size={10} /> View
                        </a>
                      ) : (
                        <span style={{ color: "#556677", fontSize: 12 }}>None</span>
                      )}
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <StatusBadge status={row.approvedStatus} />
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
              background: "linear-gradient(180deg, rgba(245,158,11,0.07) 0%, transparent 100%)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: "rgba(245,158,11,0.15)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <MessageSquare size={18} color="#f59e0b" />
                </div>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>
                    {modal === "edit" ? "Edit Enquiry" : "New Enquiry"}
                  </h3>
                  <p style={{ color: "#6b7a90", fontSize: 12, margin: "2px 0 0" }}>
                    {modal === "edit" ? `Editing ${form.applicationIdentifier}` : "Submit a new enquiry"}
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

            {/* Body */}
            <div style={{ padding: "4px 24px 8px", overflowY: "auto", flex: 1 }}>

              <SectionLabel>Enquiry Details</SectionLabel>

              <FormInput label="Enquiry Type *" field="enquiryType" form={form} setForm={setForm} />

              <div style={fieldWrapper}>
                <label style={labelStyle}>Description / Comment</label>
                <textarea
                  value={form.descriptionComment || ""}
                  onChange={(e) => setForm((f) => ({ ...f, descriptionComment: e.target.value }))}
                  rows={4}
                  placeholder="Describe the enquiry in detail…"
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <SectionLabel>Attachment (Optional)</SectionLabel>

              {/* File upload */}
              <div style={fieldWrapper}>
                <label style={labelStyle}>Enquiry File</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "1.5px dashed rgba(245,158,11,0.3)",
                    borderRadius: 10, padding: "16px 14px",
                    display: "flex", alignItems: "center", gap: 10,
                    cursor: "pointer", background: "rgba(245,158,11,0.04)",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(245,158,11,0.55)";
                    e.currentTarget.style.background = "rgba(245,158,11,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(245,158,11,0.3)";
                    e.currentTarget.style.background = "rgba(245,158,11,0.04)";
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: "rgba(245,158,11,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Paperclip size={15} color="#f59e0b" />
                  </div>
                  <div>
                    <p style={{ color: selectedFileName ? "var(--text-primary)" : "#8899aa", fontSize: 13, fontWeight: selectedFileName ? 600 : 400 }}>
                      {selectedFileName || "Click to upload a file"}
                    </p>
                    <p style={{ color: "#556677", fontSize: 11, marginTop: 2 }}>PDF, JPG, PNG, DOCX supported</p>
                  </div>
                  {selectedFileName && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFileName("");
                        setForm((f) => ({ ...f, enquiryFile: null }));
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      style={{
                        marginLeft: "auto", background: "rgba(255,107,107,0.12)",
                        border: "none", borderRadius: 6, padding: "4px 7px",
                        color: "#ff6b6b", cursor: "pointer",
                        display: "flex", alignItems: "center",
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFileName(file.name);
                      setForm((f) => ({ ...f, enquiryFile: file }));
                    }
                  }}
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
              <button
                onClick={handleSave}
                disabled={actionLoading || !form.enquiryType?.trim()}
                style={{
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  border: "none", borderRadius: 9, padding: "9px 22px",
                  color: "#000", fontSize: 13, fontWeight: 700,
                  cursor: (actionLoading || !form.enquiryType?.trim()) ? "not-allowed" : "pointer",
                  opacity: (actionLoading || !form.enquiryType?.trim()) ? 0.6 : 1,
                  display: "flex", alignItems: "center", gap: 7,
                }}
              >
                <CheckCircle2 size={14} />
                {actionLoading ? "Saving…" : "Save Enquiry"}
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
            maxHeight: "88vh", overflow: "hidden",
            display: "flex", flexDirection: "column",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          }}>

            {/* Header */}
            <div style={{
              padding: "20px 24px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "linear-gradient(180deg, rgba(245,158,11,0.07) 0%, transparent 100%)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: "rgba(245,158,11,0.15)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <MessageSquare size={18} color="#f59e0b" />
                </div>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>Enquiry Details</h3>
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
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.15)",
                borderRadius: 12, padding: 16, marginBottom: 16,
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              }}>
                <div>
                  <p style={{ color: "#f59e0b", fontWeight: 700, fontSize: 13 }}>{viewItem.applicationIdentifier}</p>
                  <p style={{ color: "var(--text-primary)", fontSize: 17, fontWeight: 700, marginTop: 4 }}>
                    {viewItem.enquiryType || "—"}
                  </p>
                  {viewItem.propertyName && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
                      <Building2 size={12} color="#8899aa" />
                      <span style={{ color: "#8899aa", fontSize: 12 }}>{viewItem.propertyName}</span>
                    </div>
                  )}
                </div>
                <StatusBadge status={viewItem.approvedStatus} />
              </div>

              {/* Description block */}
              {viewItem.descriptionComment && (
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10, padding: "12px 14px", marginBottom: 16,
                }}>
                  <p style={{ color: "#6b7a90", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Description</p>
                  <p style={{ color: "var(--text-primary)", fontSize: 13, lineHeight: 1.6 }}>{viewItem.descriptionComment}</p>
                </div>
              )}

              {/* Attachment */}
              {viewItem.enquiryFile && (
                <div style={{
                  background: "rgba(108,99,255,0.06)",
                  border: "1px solid rgba(108,99,255,0.15)",
                  borderRadius: 10, padding: "10px 14px", marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <FileText size={16} color="#6c63ff" />
                  <span style={{ color: "#6b7a90", fontSize: 12, flex: 1 }}>Attached File</span>
                  <a
                    href={viewItem.enquiryFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "rgba(108,99,255,0.15)", color: "#6c63ff",
                      padding: "4px 10px", borderRadius: 6,
                      fontSize: 11, fontWeight: 600, textDecoration: "none",
                    }}
                  >
                    Open ↗
                  </a>
                </div>
              )}

              {/* Detail rows */}
              {[
                ["Enquiry ID",    viewItem.otherEnquiryId],
                ["Property",      viewItem.propertyName || viewItem.propertyIdentifier],
                ["Society",       viewItem.societyName],
                ["Parent Status", viewItem.parentApprovedStatus !== "N/A" ? viewItem.parentApprovedStatus : null],
                ["Approved At",   viewItem.approvedAt ? formatDateTime(viewItem.approvedAt) : null],
                ["Created By",    viewItem.createdBy],
                ["Created At",    viewItem.createdAt ? formatDateTime(viewItem.createdAt) : null],
                ["Updated At",    viewItem.updatedAt ? formatDateTime(viewItem.updatedAt) : null],
              ].filter(([, v]) => v).map(([label, value]) => (
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