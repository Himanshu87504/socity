// @ts-nocheck
// DocumentSubmissionDashboard.jsx

import React, { useState, useEffect, useRef } from "react";
import {
  FolderOpen, Plus, Search,
  Edit2, Trash2, Eye, X,
  ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
  CheckCircle2, Clock, FileText,
  Paperclip, Building2, Tag, Upload,
} from "lucide-react";

import {
  createNewDocumentSubmissionApi,
  updateDocumentSubmissionApi,
  getAllApplicationApi,
  deleteApplicationApi,
} from "../api/application-api";
import { useAppContext } from "../AppContext";

// ─── CONSTANTS ───────────────────────────────

const PER_PAGE = 9;

const EMPTY_FORM = {
  documentType: "",
  descriptionComment: "",
  documentFile: null,
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

export function mapDocumentSubmission(item, i) {
  return {
    id: item.otherDocumentSubmitId || item.id || item._id || i + 1,
    applicationIdentifier: safeStr(
      item.applicationIdentifier || `OD-${String(i + 1).padStart(5, "0")}`
    ),
    otherDocumentSubmitId: safeStr(item.otherDocumentSubmitId || ""),
    propertyIdentifier: safeStr(item.propertyIdentifier || item.property?.propertyIdentifier || ""),
    propertyName: safeStr(item.property?.propertyName || ""),
    societyIdentifier: safeStr(item.societyIdentifier || item.society?.societyIdentifier || ""),
    societyName: safeStr(item.society?.societyName || ""),
    documentType: safeStr(item.documentType || ""),
    documentFile: item.documentFile || null,
    descriptionComment: safeStr(item.descriptionComment || ""),
    approvedStatus: safeStr(item.approvedStatus || "N/A"),
    parentApprovedStatus: safeStr(item.parentApprovedStatus || "N/A"),
    approvedAt: safeStr(item.approvedAt || ""),
    parentApprovedAt: safeStr(item.parentApprovedAt || ""),
    approvarRemark: safeStr(item.approvarRemark || ""),
    parentApprovarRemark: safeStr(item.parentApprovarRemark || ""),
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
            background: p === page ? "#10b981" : "none",
            border: `1px solid ${p === page ? "#10b981" : "var(--border)"}`,
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

export default function DocumentSubmissionDashboard() {

  const { documentSubmissions: ctxDocs, setDocumentSubmissions } = useAppContext();

  const fileInputRef = useRef(null);

  const [localData, setLocalData]         = useState(null);
  const [search, setSearch]               = useState("");
  const [page, setPage]                   = useState(1);
  const [modal, setModal]                 = useState(null); // "add" | "edit" | "view"
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [viewItem, setViewItem]           = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState(null);
  const [statusFilter, setStatusFilter]   = useState("All");
  const [fetchLoading, setFetchLoading]   = useState(false);
  const [fetchError, setFetchError]       = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  // Fetch on mount
  useEffect(() => {
    const fetchData = async () => {
      setFetchLoading(true);
      setFetchError(null);
      try {
        const res = await getAllApplicationApi();
        const raw = res?.data?.data || res?.data || [];
        const mapped = (Array.isArray(raw) ? raw : [])
          .filter((item) => safeStr(item.applicationIdentifier).startsWith("OD") || item.otherDocumentSubmitId)
          .map((item, i) => mapDocumentSubmission(item, i));
        setLocalData(mapped);
        if (setDocumentSubmissions) setDocumentSubmissions(() => mapped);
      } catch (err) {
        console.error("[DocSubmission Fetch] Failed:", err?.message);
        setFetchError("Failed to load document submissions. Showing cached data.");
      } finally {
        setFetchLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeData = localData || ctxDocs || [];

  // Stats
  const approvedCount   = activeData.filter((r) => r.approvedStatus === "Approved").length;
  const pendingCount    = activeData.filter((r) => r.approvedStatus === "Pending").length;
  const withFileCount   = activeData.filter((r) => r.documentFile).length;

  const stats = [
    { label: "Total Submissions", value: activeData.length,  color: "#10b981", icon: FolderOpen   },
    { label: "Approved",          value: approvedCount,       color: "#00d4aa", icon: CheckCircle2 },
    { label: "Pending",           value: pendingCount,        color: "#ffb347", icon: Clock        },
    { label: "With Documents",    value: withFileCount,       color: "#6c63ff", icon: Paperclip    },
  ];

  const syncData = (updater) => {
    setLocalData(updater(activeData));
    if (setDocumentSubmissions) setDocumentSubmissions(updater);
  };

  const STATUS_TABS = ["All", "Pending", "Approved", "Rejected", "N/A"];

  const filtered = activeData.filter((r) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = (
      safeStr(r.applicationIdentifier).toLowerCase().includes(q) ||
      safeStr(r.documentType).toLowerCase().includes(q)         ||
      safeStr(r.propertyName).toLowerCase().includes(q)         ||
      safeStr(r.descriptionComment).toLowerCase().includes(q)   ||
      safeStr(r.societyName).toLowerCase().includes(q)
    );
    const matchesStatus = statusFilter === "All" || r.approvedStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ─── SAVE ────────────────────────────────────

  const handleSave = async () => {
    if (!form.descriptionComment?.trim() && !form.documentType?.trim()) return;
    setActionLoading(true);
    setActionError(null);

    const payload = {
      documentType:       form.documentType,
      descriptionComment: form.descriptionComment,
      ...(form.documentFile instanceof File && { documentFile: form.documentFile }),
    };

    try {
      if (form.applicationIdentifier) {
        await updateDocumentSubmissionApi(payload, form.applicationIdentifier);
        syncData((d) => d.map((r) =>
          r.applicationIdentifier === form.applicationIdentifier ? { ...r, ...form } : r
        ));
      } else {
        const res = await createNewDocumentSubmissionApi(payload);
        const raw = res?.data?.data || {};
        const newEntry = mapDocumentSubmission({
          ...payload, ...raw,
          applicationIdentifier: raw.applicationIdentifier || `OD-${String(activeData.length + 1).padStart(5, "0")}`,
          approvedStatus: "N/A",
          createdAt: new Date().toISOString(),
        }, activeData.length);
        syncData((d) => [...d, newEntry]);
      }
    } catch (err) {
      console.warn("[DocSubmission Save] Backend failed:", err?.message);
      setActionError("Backend save failed. UI updated locally.");
      if (form.applicationIdentifier) {
        syncData((d) => d.map((r) =>
          r.applicationIdentifier === form.applicationIdentifier ? { ...r, ...form } : r
        ));
      } else {
        const localEntry = mapDocumentSubmission({
          ...payload,
          id: `local_${Date.now()}`,
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
    if (!window.confirm(`Delete submission "${row.applicationIdentifier}"?`)) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteApplicationApi(row.applicationIdentifier);
    } catch (err) {
      console.warn("[DocSubmission Delete] Backend failed:", err?.message);
      setActionError("Backend delete failed. Removed from UI only.");
    } finally {
      syncData((d) => d.filter((r) => r.applicationIdentifier !== row.applicationIdentifier));
      setActionLoading(false);
    }
  };

  const openEditModal = (row) => {
    setForm({ ...row });
    setSelectedFileName(row.documentFile ? "Existing file attached" : "");
    setModal("edit");
  };

  const openViewModal = (row) => { setViewItem(row); setModal("view"); };
  const closeModal = () => { setModal(null); setSelectedFileName(""); };

  // ─── RENDER ──────────────────────────────────

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

      {/* Loading */}
      {fetchLoading && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "16px 20px", marginBottom: 16,
          color: "#8899aa", fontSize: 13, textAlign: "center",
        }}>
          Loading document submissions…
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
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Document Submission</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Manage property document submissions and approvals</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setSelectedFileName(""); setModal("add"); }}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "linear-gradient(135deg,#0a2a1a,#051a0e)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: 10, padding: "10px 18px",
            color: "#e8edf5", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}
        >
          <Plus size={15} /> Add Submission
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
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#10b981", fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 3, height: 16, background: "#10b981", borderRadius: 2 }} />
            LIST OF SUBMISSIONS
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setStatusFilter(tab); setPage(1); }}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  border: statusFilter === tab ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.08)",
                  background: statusFilter === tab ? "rgba(16,185,129,0.15)" : "transparent",
                  color: statusFilter === tab ? "#10b981" : "#8899aa",
                  transition: "all 0.15s",
                }}
              >
                {tab}
              </button>
            ))}

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
                {["S.No", "Document ID", "Property", "Document Type", "Description", "File", "Status", "Action"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 14px", textAlign: "center", color: "#556677", fontSize: 13 }}>
                    No submissions found
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

                    <td style={{ padding: "12px 14px", color: "#10b981", fontWeight: 600, fontSize: 12 }}>{row.applicationIdentifier}</td>

                    <td style={{ padding: "12px 14px", fontSize: 12 }}>
                      <div style={{ color: "var(--text-primary)" }}>{row.propertyName || row.propertyIdentifier || "—"}</div>
                      {row.societyName && (
                        <div style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>{row.societyName}</div>
                      )}
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      {row.documentType ? (
                        <span style={{
                          background: "rgba(16,185,129,0.12)", color: "#10b981",
                          padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          display: "inline-flex", alignItems: "center", gap: 4,
                        }}>
                          <Tag size={9} /> {row.documentType}
                        </span>
                      ) : (
                        <span style={{ color: "#556677", fontSize: 12 }}>—</span>
                      )}
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
                      {row.documentFile ? (
                        <a
                          href={row.documentFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            background: "rgba(108,99,255,0.12)", color: "#6c63ff",
                            padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          <FileText size={10} /> View
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
              background: "linear-gradient(180deg, rgba(16,185,129,0.07) 0%, transparent 100%)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FolderOpen size={18} color="#10b981" />
                </div>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>
                    {modal === "edit" ? "Edit Submission" : "New Document Submission"}
                  </h3>
                  <p style={{ color: "#6b7a90", fontSize: 12, margin: "2px 0 0" }}>
                    {modal === "edit" ? "Update submission details" : "Submit a new document for review"}
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

              <SectionLabel>Document Details</SectionLabel>

              <FormInput label="Document Type" field="documentType" form={form} setForm={setForm} />

              <div style={fieldWrapper}>
                <label style={labelStyle}>Description / Comment</label>
                <textarea
                  value={form.descriptionComment || ""}
                  onChange={(e) => setForm((f) => ({ ...f, descriptionComment: e.target.value }))}
                  rows={4}
                  placeholder="Describe the document submission…"
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <SectionLabel>Document File (Optional)</SectionLabel>

              {/* File upload zone */}
              <div style={fieldWrapper}>
                <label style={labelStyle}>Upload Document</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "1.5px dashed rgba(16,185,129,0.3)",
                    borderRadius: 10, padding: "20px 14px",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    cursor: "pointer", background: "rgba(16,185,129,0.03)",
                    transition: "border-color 0.15s, background 0.15s",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(16,185,129,0.55)";
                    e.currentTarget.style.background = "rgba(16,185,129,0.07)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)";
                    e.currentTarget.style.background = "rgba(16,185,129,0.03)";
                  }}
                >
                  {selectedFileName ? (
                    <>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: "rgba(16,185,129,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <FileText size={18} color="#10b981" />
                      </div>
                      <p style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>{selectedFileName}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFileName("");
                          setForm((f) => ({ ...f, documentFile: null }));
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        style={{
                          background: "rgba(255,107,107,0.12)",
                          border: "none", borderRadius: 6, padding: "4px 10px",
                          color: "#ff6b6b", cursor: "pointer", fontSize: 11,
                          display: "flex", alignItems: "center", gap: 4,
                        }}
                      >
                        <X size={10} /> Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: "rgba(16,185,129,0.10)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Upload size={18} color="#10b981" />
                      </div>
                      <p style={{ color: "#8899aa", fontSize: 13 }}>Click to upload a document</p>
                      <p style={{ color: "#556677", fontSize: 11 }}>PDF, JPG, PNG, DOCX supported</p>
                    </>
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
                      setForm((f) => ({ ...f, documentFile: file }));
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
                disabled={actionLoading || (!form.documentType?.trim() && !form.descriptionComment?.trim())}
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  border: "none", borderRadius: 9, padding: "9px 22px",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: (actionLoading || (!form.documentType?.trim() && !form.descriptionComment?.trim())) ? "not-allowed" : "pointer",
                  opacity: (actionLoading || (!form.documentType?.trim() && !form.descriptionComment?.trim())) ? 0.6 : 1,
                  display: "flex", alignItems: "center", gap: 7,
                }}
              >
                <CheckCircle2 size={14} />
                {actionLoading ? "Saving…" : "Save Submission"}
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
              background: "linear-gradient(180deg, rgba(16,185,129,0.07) 0%, transparent 100%)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FolderOpen size={18} color="#10b981" />
                </div>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>Submission Details</h3>
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
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.15)",
                borderRadius: 12, padding: 16, marginBottom: 16,
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              }}>
                <div>
                  <p style={{ color: "#10b981", fontWeight: 700, fontSize: 13 }}>{viewItem.applicationIdentifier}</p>
                  <p style={{ color: "var(--text-primary)", fontSize: 17, fontWeight: 700, marginTop: 4 }}>
                    {viewItem.documentType || "No Type Specified"}
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

              {/* Document file */}
              {viewItem.documentFile && (
                <div style={{
                  background: "rgba(108,99,255,0.06)",
                  border: "1px solid rgba(108,99,255,0.15)",
                  borderRadius: 10, padding: "10px 14px", marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <FileText size={16} color="#6c63ff" />
                  <span style={{ color: "#6b7a90", fontSize: 12, flex: 1 }}>Attached Document</span>
                  <a
                    href={viewItem.documentFile}
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

              {/* Approver remarks */}
              {(viewItem.approvarRemark || viewItem.parentApprovarRemark) && (
                <div style={{
                  background: "rgba(255,179,71,0.06)",
                  border: "1px solid rgba(255,179,71,0.15)",
                  borderRadius: 10, padding: "12px 14px", marginBottom: 16,
                }}>
                  <p style={{ color: "#6b7a90", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Approver Remarks</p>
                  {viewItem.approvarRemark && (
                    <p style={{ color: "#ffb347", fontSize: 13, lineHeight: 1.5 }}>{viewItem.approvarRemark}</p>
                  )}
                  {viewItem.parentApprovarRemark && (
                    <p style={{ color: "#ffb347", fontSize: 13, lineHeight: 1.5, marginTop: 4 }}>
                      (Parent) {viewItem.parentApprovarRemark}
                    </p>
                  )}
                </div>
              )}

              {/* Detail rows */}
              {[
                ["Property",       viewItem.propertyName || viewItem.propertyIdentifier],
                ["Society",        viewItem.societyName],
                ["Parent Status",  viewItem.parentApprovedStatus !== "N/A" ? viewItem.parentApprovedStatus : null],
                ["Approved At",    viewItem.approvedAt ? formatDateTime(viewItem.approvedAt) : null],
                ["Created By",     viewItem.createdBy],
                ["Created At",     viewItem.createdAt ? formatDateTime(viewItem.createdAt) : null],
                ["Updated At",     viewItem.updatedAt ? formatDateTime(viewItem.updatedAt) : null],
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