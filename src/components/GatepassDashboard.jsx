// @ts-nocheck
// GatePassDashboard.jsx

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck, Plus, Search,
  Edit2, Trash2, Eye, X,
  ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
  CheckCircle2, ChevronDown,
  Car, User, Clock, QrCode,
  DoorOpen, ArrowRightLeft,
} from "lucide-react";

import { createNewGatePassApi, updateGatePassApi, getAllGatePassApi ,deleteGatePassApi } from "../api/application-api";
import { useAppContext } from "../AppContext";

// ─── CONSTANTS ───────────────────────────────

const GATE_TYPES = ["Main Gate", "Back Gate", "Side Gate", "Emergency Gate"];

const CATEGORIES = ["Visitor", "Vendor", "Delivery", "Staff", "Contractor", "Resident"];

const SUB_CATEGORIES = ["Personal", "Official", "Maintenance", "Delivery", "Service"];

const VEHICLE_TYPES = ["Car", "Bike", "Truck", "Auto", "Cycle", "On Foot"];

const VEHICLE_NATURE = ["Two Wheeler", "Four Wheeler", "Heavy Vehicle", "Non-Motorized"];

const EMPTY_FORM = {
  gateType: GATE_TYPES[0],
  category: CATEGORIES[0],
  subCategory: SUB_CATEGORIES[0],
  entryDateTime: "",
  exitDateTime: "",
  purpose: "",
  description: "",
  driverName: "",
  driverMobileNumber: "",
  vehicleNumber: "",
  vehicleModel: "",
  vehicleNature: VEHICLE_NATURE[0],
  vehicleType: VEHICLE_TYPES[0],
  contactPersonName: "",
  contactPersonNumber: "",
  remarks: "",
  vendorName: "",
  vendorIdentifier: "",
};

const PER_PAGE = 9;

// ─── HELPERS ─────────────────────────────────

const safeStr = (v) => (v == null ? "" : String(v));

const formatNumber = (n) => Number(n).toLocaleString("en-IN");

export function mapGatePass(item, i) {
  return {
    id: item.id || item._id || i + 1,
    applicationIdentifier: safeStr(
      item.applicationIdentifier || item.gatePassId || item.gate_pass_id ||
      `GP-${String(i + 1).padStart(7, "0")}`
    ),
    propertyIdentifier: safeStr(item.propertyIdentifier || item.property_identifier || item.flat_no || ""),
    societyIdentifier: safeStr(item.societyIdentifier || item.society_identifier || ""),
    gateType: safeStr(item.gateType || item.gate_type || ""),
    category: safeStr(item.category || ""),
    subCategory: safeStr(item.subCategory || item.sub_category || ""),
    entryDateTime: safeStr(item.entryDateTime || item.entry_datetime || item.entry_time || ""),
    exitDateTime: safeStr(item.exitDateTime || item.exit_datetime || item.exit_time || ""),
    purpose: safeStr(item.purpose || ""),
    description: safeStr(item.description || ""),
    driverName: safeStr(item.driverName || item.driver_name || item.visitorName || item.visitor_name || ""),
    driverMobileNumber: safeStr(item.driverMobileNumber || item.driver_mobile || item.mobile || ""),
    vehicleNumber: safeStr(item.vehicleNumber || item.vehicle_number || item.vehicle_no || ""),
    vehicleModel: safeStr(item.vehicleModel || item.vehicle_model || ""),
    vehicleNature: safeStr(item.vehicleNature || item.vehicle_nature || ""),
    vehicleType: safeStr(item.vehicleType || item.vehicle_type || ""),
    contactPersonName: safeStr(item.contactPersonName || item.contact_person || ""),
    contactPersonNumber: safeStr(item.contactPersonNumber || item.contact_number || ""),
    remarks: safeStr(item.remarks || item.remark || ""),
    approvedStatus: safeStr(item.approvedStatus || item.approved_status || "N/A"),
    parentApprovedStatus: safeStr(item.parentApprovedStatus || item.parent_approved_status || "N/A"),
    createdBy: safeStr(item.createdBy || item.created_by || ""),
    createdAt: safeStr(item.createdAt || item.created_at || ""),
    updatedAt: safeStr(item.updatedAt || item.updated_at || ""),
    isDeleted: item.isDeleted || item.is_deleted || false,
    qrToken: safeStr(item.qrVerification?.qrToken || item.qr_token || ""),
    otp: safeStr(item.qrVerification?.otp || item.otp || ""),
    inOutStatus: item.inOutStatus || [],
    vendorName: safeStr(item.vendor?.vendorName || item.vendorName || item.vendor_name || ""),
    vendorIdentifier: safeStr(item.vendor?.vendorIdentifier || item.vendorIdentifier || ""),
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
  "Approved": { bg: "rgba(0,212,170,0.12)", color: "#00d4aa" },
  "Pending": { bg: "rgba(255,179,71,0.12)", color: "#ffb347" },
  "Rejected": { bg: "rgba(255,107,107,0.12)", color: "#ff6b6b" },
  "N/A": { bg: "rgba(136,153,170,0.12)", color: "#8899aa" },
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
  const isLast = page === totalPages;

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

export default function GatePassDashboard() {

  const { gatePasses: ctxGatePasses, setGatePasses } = useAppContext();

  const [localData, setLocalData] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // "add" | "edit" | "view"
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewItem, setViewItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Fetch all gate passes on mount
  useEffect(() => {
    const fetchGatePasses = async () => {
      setFetchLoading(true);
      setFetchError(null);
      try {
        const res = await getAllGatePassApi();
        const raw = res?.data?.data || res?.data || [];
        const mapped = raw.map((item, i) => mapGatePass(item, i));
        setLocalData(mapped);
        if (setGatePasses) setGatePasses(() => mapped);
      } catch (err) {
        console.error("[GatePass Fetch] Failed:", err?.message);
        setFetchError("Failed to load gate passes. Showing cached data.");
      } finally {
        setFetchLoading(false);
      }
    };
    fetchGatePasses();
  }, []);

  const activeData = localData || ctxGatePasses || [];

  // Stats
  const totalVisitors = activeData.filter((g) => g.category === "Visitor").length;
  const totalVendors = activeData.filter((g) => g.category === "Vendor").length;
  const pendingCount = activeData.filter((g) => g.approvedStatus === "Pending").length;

  const stats = [
    { label: "Total Gate Passes", value: activeData.length, color: "#6c63ff", icon: ShieldCheck },
    { label: "Visitors", value: totalVisitors, color: "#00b4d8", icon: User },
    { label: "Vendors", value: totalVendors, color: "#ffb347", icon: Car },
    { label: "Pending Approval", value: pendingCount, color: "#ff6b6b", icon: Clock },
  ];

  const syncData = (updater) => {
    setLocalData(updater(activeData));
    if (setGatePasses) setGatePasses(updater);
  };

  // Filtering
  const CATEGORY_TABS = ["All", "Visitor", "Vendor", "Delivery", "Staff", "Contractor"];

  const filtered = activeData.filter((gp) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = (
      safeStr(gp.applicationIdentifier).toLowerCase().includes(q) ||
      safeStr(gp.driverName).toLowerCase().includes(q) ||
      safeStr(gp.category).toLowerCase().includes(q) ||
      safeStr(gp.gateType).toLowerCase().includes(q) ||
      safeStr(gp.vehicleNumber).toLowerCase().includes(q) ||
      safeStr(gp.vendorName).toLowerCase().includes(q) ||
      safeStr(gp.contactPersonName).toLowerCase().includes(q) ||
      safeStr(gp.remarks).toLowerCase().includes(q)
    );
    const matchesCategory = categoryFilter === "All" || gp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ─── SAVE ────────────────────────────────────

  const handleSave = async () => {
    if (!form.driverName && !form.vendorName) return;
    setActionLoading(true);
    setActionError(null);

    const backendPayload = {
      gateType: form.gateType,
      category: form.category,
      subCategory: form.subCategory,
      entryDateTime: form.entryDateTime,
      exitDateTime: form.exitDateTime,
      purpose: form.purpose,
      description: form.description,
      driverName: form.driverName,
      driverMobileNumber: form.driverMobileNumber,
      vehicleNumber: form.vehicleNumber,
      vehicleModel: form.vehicleModel,
      vehicleNature: form.vehicleNature,
      vehicleType: form.vehicleType,
      contactPersonName: form.contactPersonName,
      contactPersonNumber: form.contactPersonNumber,
      remarks: form.remarks,
    };

    try {
      if (form.applicationIdentifier) {
        await updateGatePassApi(backendPayload, form.applicationIdentifier);
        syncData((d) => d.map((r) => (r.applicationIdentifier === form.applicationIdentifier ? { ...r, ...form } : r)));
      } else {
        const res = await createNewGatePassApi(backendPayload);
        const realId = res?.data?.data?.id || res?.data?.id || Date.now();
        const newEntry = mapGatePass({
          ...backendPayload,
          id: realId,
          applicationIdentifier: res?.data?.data?.applicationIdentifier || `GP-${String(activeData.length + 1).padStart(7, "0")}`,
          approvedStatus: "Pending",
          createdAt: new Date().toLocaleString("en-IN"),
        }, activeData.length);
        syncData((d) => [...d, newEntry]);
      }
    } catch (err) {
      console.warn("[GatePass Save] Backend failed:", err?.message);
      setActionError("Backend save failed. UI updated locally.");
      if (form.applicationIdentifier) {
        syncData((d) => d.map((r) => (r.applicationIdentifier === form.applicationIdentifier ? { ...r, ...form } : r)));
      } else {
        const localEntry = mapGatePass({
          ...backendPayload,
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

  // ─── DELETE ──────────────────────────────────

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete gate pass "${row.applicationIdentifier}"?`)) return;
    setActionLoading(true);
    setActionError(null);
    try {await deleteGatePassApi(row.applicationIdentifier);
    } catch (err) {
      console.warn("[GatePass Delete] Backend failed:", err?.message);
      setActionError("Backend delete failed. Removed from UI only.");
    } finally {
      syncData((d) => d.filter((r) => r.applicationIdentifier !== row.applicationIdentifier));
      setActionLoading(false);
    }
  };

  const openEditModal = (row) => {
    setForm({ ...row });
    setModal("edit");
  };

  const openViewModal = (row) => { setViewItem(row); setModal("view"); };
  const closeModal = () => setModal(null);

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
          Loading gate passes…
        </div>
      )}

      {/* Error banner */}
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
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Gate Pass</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Manage visitor entries, vehicle access, and approvals</p>
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
          <Plus size={15} /> Add Gate Pass
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
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6c63ff", fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 3, height: 16, background: "#6c63ff", borderRadius: 2 }} />
            LIST OF GATE PASSES
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Category tabs */}
            <div style={{ display: "flex", gap: 4 }}>
              {CATEGORY_TABS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategoryFilter(cat); setPage(1); }}
                  style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    border: categoryFilter === cat ? "1px solid #6c63ff" : "1px solid rgba(255,255,255,0.08)",
                    background: categoryFilter === cat ? "rgba(108,99,255,0.15)" : "transparent",
                    color: categoryFilter === cat ? "#6c63ff" : "#8899aa",
                    transition: "all 0.15s",
                  }}
                >
                  {cat}
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
                {["S.No", "Pass ID", "Gate Type", "Category", "Visitor / Driver", "Vehicle No.", "Entry Time", "Exit Time", "Status", "Action"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "40px 14px", textAlign: "center", color: "#556677", fontSize: 13 }}>
                    No gate passes found
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
                    <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontSize: 12 }}>{row.gateType || "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        background: "rgba(0,180,216,0.12)", color: "#00b4d8",
                        padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>
                        {row.category || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontSize: 13 }}>
                      <div>{row.driverName || row.vendorName || "—"}</div>
                      {row.driverMobileNumber && (
                        <div style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>{row.driverMobileNumber}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#ffb347", fontWeight: 600, fontSize: 12 }}>
                      {row.vehicleNumber || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12, whiteSpace: "nowrap" }}>{row.entryDateTime || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12, whiteSpace: "nowrap" }}>{row.exitDateTime || "—"}</td>
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
                  <ShieldCheck size={18} color="#6c63ff" />
                </div>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>
                    {modal === "edit" ? "Edit Gate Pass" : "Add New Gate Pass"}
                  </h3>
                  <p style={{ color: "#6b7a90", fontSize: 12, margin: "2px 0 0" }}>
                    {modal === "edit" ? "Update gate pass details" : "Register a new gate pass entry"}
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

              <SectionLabel>Gate Info</SectionLabel>
              <div style={grid2}>
                <FormSelect label="Gate Type" field="gateType" options={GATE_TYPES} form={form} setForm={setForm} />
                <FormSelect label="Category" field="category" options={CATEGORIES} form={form} setForm={setForm} />
              </div>
              <div style={{ width: "50%" }}>
                <FormSelect label="Sub Category" field="subCategory" options={SUB_CATEGORIES} form={form} setForm={setForm} />
              </div>

              <SectionLabel>Visitor / Driver Details</SectionLabel>
              <div style={grid2}>
                <FormInput label="Driver / Visitor Name" field="driverName" form={form} setForm={setForm} />
                <FormInput label="Mobile Number" field="driverMobileNumber" type="tel" form={form} setForm={setForm} />
              </div>
              <div style={grid2}>
                <FormInput label="Contact Person Name" field="contactPersonName" form={form} setForm={setForm} />
                <FormInput label="Contact Person Number" field="contactPersonNumber" type="tel" form={form} setForm={setForm} />
              </div>

              <SectionLabel>Vehicle Details</SectionLabel>
              <div style={grid2}>
                <FormInput label="Vehicle Number" field="vehicleNumber" form={form} setForm={setForm} />
                <FormInput label="Vehicle Model" field="vehicleModel" form={form} setForm={setForm} />
              </div>
              <div style={grid2}>
                <FormSelect label="Vehicle Type" field="vehicleType" options={VEHICLE_TYPES} form={form} setForm={setForm} />
                <FormSelect label="Vehicle Nature" field="vehicleNature" options={VEHICLE_NATURE} form={form} setForm={setForm} />
              </div>

              <SectionLabel>Entry / Exit Schedule</SectionLabel>
              <div style={grid2}>
                <FormInput label="Entry Date & Time" field="entryDateTime" type="datetime-local" form={form} setForm={setForm} />
                <FormInput label="Exit Date & Time" field="exitDateTime" type="datetime-local" form={form} setForm={setForm} />
              </div>

              <SectionLabel>Purpose & Remarks</SectionLabel>
              <FormInput label="Purpose" field="purpose" form={form} setForm={setForm} />
              <div style={fieldWrapper}>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={form.description || ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
              <div style={fieldWrapper}>
                <label style={labelStyle}>Remarks</label>
                <textarea
                  value={form.remarks || ""}
                  onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <SectionLabel>Vendor (Optional)</SectionLabel>
              <div style={grid2}>
                <FormInput label="Vendor Name" field="vendorName" form={form} setForm={setForm} />
                <FormInput label="Vendor ID" field="vendorIdentifier" form={form} setForm={setForm} />
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
                {actionLoading ? "Saving…" : "Save Gate Pass"}
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
                  <ShieldCheck size={18} color="#6c63ff" />
                </div>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>Gate Pass Details</h3>
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

              {/* Pass ID + Status hero */}
              <div style={{
                background: "rgba(108,99,255,0.08)",
                border: "1px solid rgba(108,99,255,0.15)",
                borderRadius: 12, padding: 16, marginBottom: 16,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <p style={{ color: "#6c63ff", fontWeight: 700, fontSize: 13 }}>{viewItem.applicationIdentifier}</p>
                  <p style={{ color: "var(--text-primary)", fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                    {viewItem.driverName || viewItem.vendorName || "—"}
                  </p>
                </div>
                <StatusBadge status={viewItem.approvedStatus} />
              </div>

              {/* Entry / Exit */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.12)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                  <p style={{ color: "#8899aa", fontSize: 11 }}>Entry</p>
                  <p style={{ color: "#00d4aa", fontWeight: 700, fontSize: 13, marginTop: 4 }}>{viewItem.entryDateTime || "—"}</p>
                </div>
                <div style={{ background: "rgba(255,179,71,0.06)", border: "1px solid rgba(255,179,71,0.12)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                  <p style={{ color: "#8899aa", fontSize: 11 }}>Exit</p>
                  <p style={{ color: "#ffb347", fontWeight: 700, fontSize: 13, marginTop: 4 }}>{viewItem.exitDateTime || "—"}</p>
                </div>
              </div>

              {/* QR / OTP badge */}
              {viewItem.qrToken && (
                <div style={{
                  background: "rgba(108,99,255,0.06)",
                  border: "1px solid rgba(108,99,255,0.12)",
                  borderRadius: 10, padding: "10px 14px", marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <QrCode size={16} color="#6c63ff" />
                  <div>
                    <span style={{ color: "#6b7a90", fontSize: 11 }}>QR Token: </span>
                    <span style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 600 }}>{viewItem.qrToken}</span>
                    {viewItem.otp && (
                      <>
                        <span style={{ color: "#6b7a90", fontSize: 11, marginLeft: 12 }}>OTP: </span>
                        <span style={{ color: "#6c63ff", fontSize: 12, fontWeight: 700 }}>{viewItem.otp}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Detail rows */}
              {[
                ["Gate Type", viewItem.gateType],
                ["Category", viewItem.category],
                ["Sub Category", viewItem.subCategory],
                ["Vehicle Number", viewItem.vehicleNumber],
                ["Vehicle Type", viewItem.vehicleType],
                ["Mobile Number", viewItem.driverMobileNumber],
                ["Contact Person", viewItem.contactPersonName],
                ["Vendor", viewItem.vendorName],
                ["Purpose", viewItem.purpose],
                ["Remarks", viewItem.remarks],
                ["Created By", viewItem.createdBy],
                ["Created At", viewItem.createdAt],
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