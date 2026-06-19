// @ts-nocheck
// FlatResaleDashboard.jsx

import React, { useState, useEffect } from "react";
import {
  Home, Plus, Search,
  Edit2, Trash2, Eye, X,
  ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
  CheckCircle2, FileText,
  Upload, AlertCircle,
} from "lucide-react";

import {
  createNewFlatResaleApi,
  updateFlatResaleApi,
  deleteFlatResaleApi,
  getAllFlatResaleApi,
} from "../api/application-api";
import axiosInstance from "../api/axiosInstance"; // for property/all fetch

// ─── CONSTANTS ───────────────────────────────

const YES_NO_NA = ["Yes", "No", "N/A"];
const YES_NO    = ["Yes", "No"];

const EMPTY_FORM = {
  transferDocumentsSubmitted:        "Yes",
  originalShareCertificateProcessed: "Yes",
  existingHomeLoan:                  "Yes",
  homeLoanFullySettled:              "No",
  shareTransferPremiumPaid:          "No",
  shareTransferFeesPaid:             "No",
  membershipFeePaid:                 "N/A",
  entranceFeePaid:                   "N/A",
  otherChargesPaid:                  "N/A",
  otherCharges:                      "",
  flatRegistrationNumber:            "",
  propertyIdentifier:                "",
  saleAgreement:                     null,
  flatRegistrationCertificate:       null,
  flatRegistrationFilePath:          null,
  homeLoanSanctionLetter:            null,
  oldOwnerHomeLoanClosureLetter:     null,
  receipt:                           null,
  loanClosureLetter:                 null,
};

const PER_PAGE = 9;

// Only these fields are sent to backend — extra fields cause 400 errors
const ALLOWED_FIELDS = [
  "transferDocumentsSubmitted",
  "originalShareCertificateProcessed",
  "existingHomeLoan",
  "homeLoanFullySettled",
  "shareTransferPremiumPaid",
  "shareTransferFeesPaid",
  "membershipFeePaid",
  "entranceFeePaid",
  "otherChargesPaid",
  "otherCharges",
  "flatRegistrationNumber",
  "propertyIdentifier",
  "saleAgreement",
  "flatRegistrationCertificate",
  "flatRegistrationFilePath",
  "homeLoanSanctionLetter",
  "oldOwnerHomeLoanClosureLetter",
  "receipt",
  "loanClosureLetter",
];

const buildFormData = (data) => {
  const formData = new FormData();
  ALLOWED_FIELDS.forEach((key) => {
    const value = data[key];
    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
    } else if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value);
    }
  });
  return formData;
};

// ─── HELPERS ─────────────────────────────────

const safeStr = (v) => (v == null ? "" : String(v));
const formatNumber = (n) => Number(n).toLocaleString("en-IN");

export function mapFlatResale(item, i) {
  return {
    id:                    item.flatResaleId || item.id || item._id || i + 1,
    flatResaleId:          safeStr(item.flatResaleId || item.id || item._id || ""),
    applicationIdentifier: safeStr(item.applicationIdentifier || `FR-${String(i + 1).padStart(5, "0")}`),
    propertyIdentifier:    safeStr(item.propertyIdentifier  || ""),
    societyIdentifier:     safeStr(item.societyIdentifier   || ""),
    flatRegistrationNumber:safeStr(item.flatRegistrationNumber || ""),
    // Checklist
    transferDocumentsSubmitted:        safeStr(item.transferDocumentsSubmitted        || "N/A"),
    originalShareCertificateProcessed: safeStr(item.originalShareCertificateProcessed || "N/A"),
    existingHomeLoan:                  safeStr(item.existingHomeLoan                  || "N/A"),
    homeLoanFullySettled:              safeStr(item.homeLoanFullySettled              || "N/A"),
    shareTransferPremiumPaid:          safeStr(item.shareTransferPremiumPaid          || "N/A"),
    shareTransferFeesPaid:             safeStr(item.shareTransferFeesPaid             || "N/A"),
    membershipFeePaid:                 safeStr(item.membershipFeePaid                 || "N/A"),
    entranceFeePaid:                   safeStr(item.entranceFeePaid                   || "N/A"),
    otherChargesPaid:                  safeStr(item.otherChargesPaid                  || "N/A"),
    otherCharges:                      safeStr(item.otherCharges                      || ""),
    // File paths
    saleAgreement:                 safeStr(item.saleAgreement                 || ""),
    flatRegistrationCertificate:   safeStr(item.flatRegistrationCertificate   || ""),
    flatRegistrationFilePath:      safeStr(item.flatRegistrationFilePath      || ""),
    homeLoanSanctionLetter:        safeStr(item.homeLoanSanctionLetter        || ""),
    oldOwnerHomeLoanClosureLetter: safeStr(item.oldOwnerHomeLoanClosureLetter || ""),
    receipt:                       safeStr(item.receipt                       || ""),
    loanClosureLetter:             safeStr(item.loanClosureLetter             || ""),
    // Status
    approvedStatus:       safeStr(item.approvedStatus       || "Pending"),
    parentApprovedStatus: safeStr(item.parentApprovedStatus || "N/A"),
    approvarRemark:       safeStr(item.approvarRemark       || ""),
    // Society / Property info
    societyName:  safeStr(item.society?.societyName   || item.societyName  || ""),
    propertyName: safeStr(item.property?.propertyName || item.propertyName || ""),
    flatNumber:   safeStr(item.property?.flatNumber   || item.flatNumber   || ""),
    // Committee
    committeeMemberName: safeStr(item.committeeMember?.fullName || item.committeeMemberName || ""),
    // Meta
    createdBy: safeStr(item.createdBy || ""),
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

// ─── YES/NO BADGE ─────────────────────────────

const YesNoBadge = ({ value }) => {
  const map = {
    Yes:   { bg: "rgba(0,212,170,0.10)",  color: "#00d4aa" },
    No:    { bg: "rgba(255,107,107,0.10)", color: "#ff6b6b" },
    "N/A": { bg: "rgba(136,153,170,0.10)", color: "#8899aa" },
  };
  const s = map[value] || map["N/A"];
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
      {value || "N/A"}
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

// ─── FILE UPLOAD FIELD ────────────────────────

const FileField = ({ label, field, form, setForm, existingPath }) => {
  const hasExisting = existingPath && existingPath !== "";
  const hasNew      = form[field] instanceof File;
  return (
    <div style={fieldWrapper}>
      <label style={labelStyle}>{label}</label>
      <label style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(255,255,255,0.03)",
        border: `1px dashed ${hasNew ? "#6c63ff" : "rgba(255,255,255,0.12)"}`,
        borderRadius: 9, padding: "9px 12px",
        cursor: "pointer", transition: "border-color 0.15s",
      }}>
        <Upload size={13} color={hasNew ? "#6c63ff" : "#6b7a90"} />
        <span style={{
          fontSize: 12,
          color: hasNew ? "#6c63ff" : hasExisting ? "#00d4aa" : "#6b7a90",
          flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {hasNew ? form[field].name : hasExisting ? "File uploaded ✓" : "Choose file…"}
        </span>
        <input
          type="file"
          accept="image/*,.pdf"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setForm((f) => ({ ...f, [field]: file }));
          }}
        />
      </label>
    </div>
  );
};

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

export default function FlatResaleDashboard() {

  // ── No AppContext — fully local state ──
  const [localData,     setLocalData]     = useState([]);
  const [properties,    setProperties]    = useState([]);  // property list for dropdown
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

  // ─── FETCH FLAT RESALES ───────────────────────

  useEffect(() => {
    const fetchResales = async () => {
      setFetchLoading(true);
      setFetchError(null);
      try {
        const res = await getAllFlatResaleApi();
        const raw = res?.data?.data || res?.data || [];
        const arr = Array.isArray(raw) ? raw : [raw];
        const mapped = arr.map((item, i) => mapFlatResale(item, i));
        setLocalData(mapped);
      } catch (err) {
        console.error("[FlatResale Fetch] Failed:", err?.message);
        setFetchError("Failed to load flat resale applications.");
      } finally {
        setFetchLoading(false);
      }
    };
    fetchResales();
  }, []);

  // ─── FETCH PROPERTIES (for dropdown) ─────────

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await axiosInstance.get("property/all");
        const raw = res?.data?.data || res?.data || [];
        const arr = Array.isArray(raw) ? raw : [raw];
        setProperties(arr);
      } catch (err) {
        console.error("[Properties Fetch] Failed:", err?.message);
      }
    };
    fetchProperties();
  }, []);

  // ─── STATS ────────────────────────────────────

  const pending  = localData.filter((r) => r.approvedStatus === "Pending").length;
  const approved = localData.filter((r) => r.approvedStatus === "Approved" || r.approvedStatus === "Auto Approved").length;
  const rejected = localData.filter((r) => r.approvedStatus === "Rejected").length;

  const stats = [
    { label: "Total Applications", value: localData.length, color: "#6c63ff", icon: Home },
    { label: "Approved",           value: approved,         color: "#00d4aa", icon: CheckCircle2 },
    { label: "Pending Approval",   value: pending,          color: "#ffb347", icon: FileText },
    { label: "Rejected",           value: rejected,         color: "#ff6b6b", icon: AlertCircle },
  ];

  // ─── FILTER ───────────────────────────────────

  const STATUS_TABS = ["All", "Pending", "Approved", "Auto Approved", "Rejected"];

  const filtered = localData.filter((r) => {
    const q = search.toLowerCase().trim();
    const matchSearch = (
      safeStr(r.applicationIdentifier).toLowerCase().includes(q) ||
      safeStr(r.propertyName).toLowerCase().includes(q) ||
      safeStr(r.flatNumber).toLowerCase().includes(q) ||
      safeStr(r.flatRegistrationNumber).toLowerCase().includes(q) ||
      safeStr(r.societyName).toLowerCase().includes(q)
    );
    const matchStatus = statusFilter === "All" || r.approvedStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ─── SAVE ─────────────────────────────────────

  const handleSave = async () => {
    // ── Mandatory field validation ──
    const requiredChecklist = [
      { field: "transferDocumentsSubmitted",        label: "Transfer Documents Submitted" },
      { field: "originalShareCertificateProcessed", label: "Original Share Certificate Processed" },
      { field: "existingHomeLoan",                  label: "Existing Home Loan" },
      { field: "homeLoanFullySettled",              label: "Home Loan Fully Settled" },
      { field: "shareTransferPremiumPaid",          label: "Share Transfer Premium Paid" },
      { field: "shareTransferFeesPaid",             label: "Share Transfer Fees Paid" },
      { field: "membershipFeePaid",                 label: "Membership Fee Paid" },
      { field: "entranceFeePaid",                   label: "Entrance Fee Paid" },
      { field: "otherChargesPaid",                  label: "Other Charges Paid" },
    ];

    const missing = requiredChecklist.filter((r) => !form[r.field] || form[r.field] === "");
    if (missing.length > 0) {
      setActionError(`Please fill required fields: ${missing.map((r) => r.label).join(", ")}`);
      return;
    }

    if (!form.propertyIdentifier) {
      setActionError("Please select a Property.");
      return;
    }
    setActionLoading(true);
    setActionError(null);

    // Send only allowed fields as plain object — api file builds FormData internally
    const payload = {};
    ALLOWED_FIELDS.forEach((key) => {
      const value = form[key];
      if (value instanceof File || value instanceof Blob) {
        payload[key] = value;
      } else if (value !== undefined && value !== null && value !== "") {
        payload[key] = value;
      }
    });

    try {
      if (modal === "edit" && form.applicationIdentifier) {
        await updateFlatResaleApi(payload, form.applicationIdentifier);
        setLocalData((d) =>
          d.map((r) =>
            r.applicationIdentifier === form.applicationIdentifier
              ? { ...r, ...mapFlatResale({ ...r, ...form }, 0) }
              : r
          )
        );
      } else {
        const res = await createNewFlatResaleApi(payload);
        const raw = res?.data?.data || {};
        const newEntry = mapFlatResale(
          {
            ...form,
            ...raw,
            approvedStatus: raw.approvedStatus || "Pending",
            createdAt: new Date().toLocaleString("en-IN"),
          },
          localData.length
        );
        setLocalData((d) => [...d, newEntry]);
      }
    } catch (err) {
      console.warn("[FlatResale Save] Backend failed:", err?.message);
      setActionError("Backend save failed. UI updated locally.");
      if (modal === "edit" && form.applicationIdentifier) {
        setLocalData((d) =>
          d.map((r) =>
            r.applicationIdentifier === form.applicationIdentifier
              ? { ...r, ...mapFlatResale({ ...r, ...form }, 0) }
              : r
          )
        );
      } else {
        const localEntry = mapFlatResale(
          {
            ...form,
            applicationIdentifier: `FR-LOCAL-${Date.now()}`,
            approvedStatus: "Pending",
            createdAt: new Date().toLocaleString("en-IN"),
          },
          localData.length
        );
        setLocalData((d) => [...d, localEntry]);
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
      await deleteFlatResaleApi(row.applicationIdentifier);
      setLocalData((d) => d.filter((r) => r.applicationIdentifier !== row.applicationIdentifier));
    } catch (err) {
      console.warn("[FlatResale Delete] Backend failed:", err?.message);
      setActionError("Backend delete failed. Removed from UI only.");
      setLocalData((d) => d.filter((r) => r.applicationIdentifier !== row.applicationIdentifier));
    } finally {
      setActionLoading(false);
    }
  };

  // ─── OPEN MODALS ──────────────────────────────

  const openEditModal = (row) => {
    setForm({
      ...EMPTY_FORM,
      ...row,
      // Clear File object fields — FileField shows "uploaded ✓" from existingPath
      saleAgreement:                 null,
      flatRegistrationCertificate:   null,
      flatRegistrationFilePath:      null,
      homeLoanSanctionLetter:        null,
      oldOwnerHomeLoanClosureLetter: null,
      receipt:                       null,
      loanClosureLetter:             null,
    });
    setModal("edit");
  };

  const openViewModal = (row) => { setViewItem(row); setModal("view"); };
  const closeModal    = ()    => { setModal(null); setActionError(null); };

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
          Loading flat resale applications…
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
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Flat Resale</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Manage flat resale applications, documents, and approval status</p>
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
            LIST OF RESALE APPLICATIONS
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
                {["S.No", "App ID", "Property / Flat", "Reg. Number", "Loan Settled", "Transfer Docs", "Status", "Action"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 14px", textAlign: "center", color: "#556677", fontSize: 13 }}>
                    {fetchLoading ? "Loading…" : "No applications found"}
                  </td>
                </tr>
              ) : (
                paged.map((row, i) => (
                  <tr
                    key={row.applicationIdentifier}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{(page - 1) * PER_PAGE + i + 1}</td>
                    <td style={{ padding: "12px 14px", color: "#6c63ff", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{row.applicationIdentifier}</td>
                    <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontSize: 12 }}>
                      <div>{row.propertyName || "—"}</div>
                      {row.flatNumber && <div style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>Flat {row.flatNumber}</div>}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#ffb347", fontWeight: 600, fontSize: 12 }}>{row.flatRegistrationNumber || "—"}</td>
                    <td style={{ padding: "12px 14px" }}><YesNoBadge value={row.homeLoanFullySettled} /></td>
                    <td style={{ padding: "12px 14px" }}><YesNoBadge value={row.transferDocumentsSubmitted} /></td>
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
            borderRadius: 20, width: "100%", maxWidth: 600,
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
                  <Home size={18} color="#6c63ff" />
                </div>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>
                    {modal === "edit" ? "Edit Resale Application" : "New Resale Application"}
                  </h3>
                  <p style={{ color: "#6b7a90", fontSize: 12, margin: "2px 0 0" }}>
                    {modal === "edit" ? `Editing ${form.applicationIdentifier}` : "Register a new flat resale application"}
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

              {/* ── Flat Details ── */}
              <SectionLabel>Flat Details</SectionLabel>

              {/* Property Dropdown */}
              <div style={fieldWrapper}>
                <label style={labelStyle}>Select Property *</label>
                <select
                  value={form.propertyIdentifier || ""}
                  onChange={(e) => setForm((f) => ({ ...f, propertyIdentifier: e.target.value }))}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">— Select a property —</option>
                  {properties.map((p) => (
                    <option key={p.propertyIdentifier} value={p.propertyIdentifier}>
                      {p.propertyName
                        ? `${p.propertyName} (${p.propertyIdentifier})`
                        : p.propertyIdentifier}
                    </option>
                  ))}
                </select>
                {form.propertyIdentifier && (
                  <p style={{ color: "#6c63ff", fontSize: 11, marginTop: 4 }}>
                    ✓ Selected: {form.propertyIdentifier}
                  </p>
                )}
              </div>

              <div style={grid2}>
                <FormInput label="Flat Registration Number *" field="flatRegistrationNumber" form={form} setForm={setForm} />
                <FormInput label="Other Charges"              field="otherCharges"            form={form} setForm={setForm} />
              </div>

              {/* ── Checklist ── */}
              <SectionLabel>Checklist <span style={{ color: "#ff6b6b", fontSize: 9 }}>* All fields required</span></SectionLabel>
              <div style={grid2}>
                <FormSelect label="Transfer Docs Submitted *"     field="transferDocumentsSubmitted"        options={YES_NO}    form={form} setForm={setForm} />
                <FormSelect label="Original Share Certificate *"  field="originalShareCertificateProcessed" options={YES_NO}    form={form} setForm={setForm} />
                <FormSelect label="Existing Home Loan *"          field="existingHomeLoan"                  options={YES_NO}    form={form} setForm={setForm} />
                <FormSelect label="Home Loan Fully Settled *"     field="homeLoanFullySettled"              options={YES_NO}    form={form} setForm={setForm} />
                <FormSelect label="Share Transfer Premium Paid *" field="shareTransferPremiumPaid"          options={YES_NO}    form={form} setForm={setForm} />
                <FormSelect label="Share Transfer Fees Paid *"    field="shareTransferFeesPaid"             options={YES_NO}    form={form} setForm={setForm} />
                <FormSelect label="Membership Fee Paid *"         field="membershipFeePaid"                 options={YES_NO_NA} form={form} setForm={setForm} />
                <FormSelect label="Entrance Fee Paid *"           field="entranceFeePaid"                   options={YES_NO_NA} form={form} setForm={setForm} />
                <FormSelect label="Other Charges Paid *"          field="otherChargesPaid"                  options={YES_NO_NA} form={form} setForm={setForm} />
              </div>

              {/* ── Documents ── */}
              <SectionLabel>Documents</SectionLabel>
              <div style={grid2}>
                <FileField label="Sale Agreement"               field="saleAgreement"               form={form} setForm={setForm} existingPath={typeof form.saleAgreement === "string" ? form.saleAgreement : ""} />
                <FileField label="Flat Registration Certificate" field="flatRegistrationCertificate" form={form} setForm={setForm} existingPath={typeof form.flatRegistrationCertificate === "string" ? form.flatRegistrationCertificate : ""} />
                <FileField label="Flat Registration File"        field="flatRegistrationFilePath"    form={form} setForm={setForm} existingPath={typeof form.flatRegistrationFilePath === "string" ? form.flatRegistrationFilePath : ""} />
                <FileField label="Home Loan Sanction Letter"     field="homeLoanSanctionLetter"      form={form} setForm={setForm} existingPath={typeof form.homeLoanSanctionLetter === "string" ? form.homeLoanSanctionLetter : ""} />
                <FileField label="Old Owner Loan Closure Letter" field="oldOwnerHomeLoanClosureLetter" form={form} setForm={setForm} existingPath={typeof form.oldOwnerHomeLoanClosureLetter === "string" ? form.oldOwnerHomeLoanClosureLetter : ""} />
                <FileField label="Receipt"                       field="receipt"                     form={form} setForm={setForm} existingPath={typeof form.receipt === "string" ? form.receipt : ""} />
                <FileField label="Loan Closure Letter"           field="loanClosureLetter"            form={form} setForm={setForm} existingPath={typeof form.loanClosureLetter === "string" ? form.loanClosureLetter : ""} />
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
                  <Home size={18} color="#6c63ff" />
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

              {/* Checklist grid */}
              <SectionLabel>Checklist</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                {[
                  ["Transfer Docs",      viewItem.transferDocumentsSubmitted],
                  ["Share Certificate",  viewItem.originalShareCertificateProcessed],
                  ["Existing Home Loan", viewItem.existingHomeLoan],
                  ["Loan Settled",       viewItem.homeLoanFullySettled],
                  ["Transfer Premium",   viewItem.shareTransferPremiumPaid],
                  ["Transfer Fees",      viewItem.shareTransferFeesPaid],
                  ["Membership Fee",     viewItem.membershipFeePaid],
                  ["Entrance Fee",       viewItem.entranceFeePaid],
                  ["Other Charges",      viewItem.otherChargesPaid],
                ].map(([label, value]) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "8px 10px",
                  }}>
                    <span style={{ color: "#6b7a90", fontSize: 12 }}>{label}</span>
                    <YesNoBadge value={value} />
                  </div>
                ))}
              </div>

              {/* Documents */}
              <SectionLabel>Documents</SectionLabel>
              {[
                ["Sale Agreement",            viewItem.saleAgreement],
                ["Flat Reg. Certificate",     viewItem.flatRegistrationCertificate],
                ["Flat Reg. File",            viewItem.flatRegistrationFilePath],
                ["Home Loan Sanction Letter", viewItem.homeLoanSanctionLetter],
                ["Old Owner Closure Letter",  viewItem.oldOwnerHomeLoanClosureLetter],
                ["Receipt",                   viewItem.receipt],
                ["Loan Closure Letter",       viewItem.loanClosureLetter],
              ].map(([label, path]) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{ color: "#6b7a90", fontSize: 13 }}>{label}</span>
                  {path ? (
                    <a href={path} target="_blank" rel="noopener noreferrer" style={{
                      color: "#6c63ff", fontSize: 12, fontWeight: 600,
                      textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <FileText size={12} /> View File
                    </a>
                  ) : (
                    <span style={{ color: "#556677", fontSize: 12 }}>Not uploaded</span>
                  )}
                </div>
              ))}

              {/* Meta */}
              <SectionLabel>Other Info</SectionLabel>
              {[
                ["Reg. Number",      viewItem.flatRegistrationNumber],
                ["Approver Remark",  viewItem.approvarRemark],
                ["Committee Member", viewItem.committeeMemberName],
                ["Created By",       viewItem.createdBy],
                ["Created At",       viewItem.createdAt],
                ["Updated At",       viewItem.updatedAt],
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