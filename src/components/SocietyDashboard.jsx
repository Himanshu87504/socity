// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Building2, Plus, Search, Edit2, Trash2, Eye, X,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  RefreshCw, Loader2, MapPin, Phone, Mail, Hash,
  Landmark, Percent, Calendar, FileText, Shield
} from "lucide-react";

import {
  addSocietyApi,
  updateSocietyApi,
  deleteSocietyApi,
  getAllSocietyApi,
} from "../api/society-api";

import { getAllParentEntityApi } from "../api/parentEntity-api";

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────
const BILLING_FREQ   = ["Monthly", "Quarterly", "Half-Yearly", "Yearly"];
const INTEREST_CALC  = ["Bill Date", "Due Date", "Fixed Date"];
const INDIAN_STATES  = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh",
];

// Fields that are mandatory per the API spec
const REQUIRED_FIELDS = ["societyName", "address", "visitorFormQrPath", "country", "state", "city", "registrationNumber", "gstin"];

const emptyForm = {
  societyName:                  "",
  societyShortName:             "",
  email:                        "",
  contactNumber:                "",
  address:                      "",
  addressLine2:                 "",
  addressLine3:                 "",
  country:                      "India",
  state:                        "",
  city:                         "",
  pincode:                      "",
  registrationNumber:           "",
  billingFrequency:             BILLING_FREQ[0],
  interestCalculationType:      INTEREST_CALC[0],
  annualRateOfInterest:         "",
  interestCalculationStartDate: "",
  tanNumber:                    "",
  panNumber:                    "",
  gstin:                        "",
  hsnCode:                      "",
  signatory:                    "",
  societyManager:               "",
  visitorFormQrPath:            "",
  visitorFormQrFile:            null,
  accountDetails:               [],
  parentSocietyIdentifier:      "",   // only this is sent in payload
};

// ─────────────────────────────────────────
// Validation
// ─────────────────────────────────────────
function validateForm(form) {
  const errors = {};
  if (!form.societyName?.trim())       errors.societyName       = "Society name is required";
  if (!form.address?.trim())           errors.address           = "Address is required";
  if (!form.country?.trim())           errors.country           = "Country is required";
  if (!form.state?.trim())             errors.state             = "State is required";
  if (!form.city?.trim())              errors.city              = "City is required";
  if (!form.registrationNumber?.trim()) errors.registrationNumber = "Registration number is required";
  if (!form.gstin?.trim())             errors.gstin             = "GSTIN is required";
  // QR is required: either an already-saved path or a newly picked file
  if (!form.visitorFormQrPath?.trim() && !form.visitorFormQrFile)
    errors.visitorFormQrPath = "Visitor Form QR image is required";
  return errors;
}

// ─────────────────────────────────────────
// Re-mapper  (mirrors AppContext mapSociety)
// ─────────────────────────────────────────
function remapSociety(item, i) {
  return {
    id:                           item.societyId || item.id || item._id || i + 1,
    societyIdentifier:            item.societyIdentifier            || "",
    societyName:                  item.societyName                  || "",
    societyShortName:             item.societyShortName             || "",
    email:                        item.email                        || "",
    contactNumber:                item.contactNumber                || "",
    address:                      item.address                      || "",
    addressLine2:                 item.addressLine2                 || "",
    addressLine3:                 item.addressLine3                 || "",
    country:                      item.country                      || "India",
    state:                        item.state                        || "",
    city:                         item.city                         || "",
    pincode:                      item.pincode                      || "",
    registrationNumber:           item.registrationNumber           || "",
    billingFrequency:             item.billingFrequency             || "",
    interestCalculationType:      item.interestCalculationType      || "",
    annualRateOfInterest:         item.annualRateOfInterest         || "",
    interestCalculationStartDate: item.interestCalculationStartDate || "",
    tanNumber:                    item.tanNumber                    || "",
    panNumber:                    item.panNumber                    || "",
    gstin:                        item.gstin                        || "",
    hsnCode:                      item.hsnCode                      || "",
    signatory:                    item.signatory                    || "",
    societyManager:               item.societyManager               || "",
    visitorFormQrPath:            item.visitorFormQrPath            || "",
    properties:                   Array.isArray(item.properties)       ? item.properties       : [],
    accountDetails:               Array.isArray(item.accountDetails)   ? item.accountDetails   : [],
    committeeMembers:             Array.isArray(item.committeeMembers)  ? item.committeeMembers : [],
    // parentSociety shape from API: { parentSocietyIdentifier: null|"str", parentSociety: { parentSocietyName, managerName } }
    parentSocietyIdentifier:      item.parentSociety?.parentSocietyIdentifier || "",
    parentSocietyName:            item.parentSociety?.parentSociety?.parentSocietyName || "",
    parentSocietyManagerName:     item.parentSociety?.parentSociety?.managerName       || "",
  };
}

// ─────────────────────────────────────────
// Form widgets
// ─────────────────────────────────────────
const getInputStyle = (hasError) => ({
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${hasError ? "#ff6b6b" : "rgba(255,255,255,0.1)"}`,
  borderRadius: 8,
  padding: "9px 12px",
  color: "var(--text-primary)",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
});

const labelStyle = { display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 };
const fieldWrap  = { marginBottom: 14 };

const RequiredMark = () => (
  <span style={{ color: "#ff6b6b", marginLeft: 3, fontSize: 12 }}>*</span>
);

const ErrorMsg = ({ msg }) =>
  msg ? <p style={{ color: "#ff6b6b", fontSize: 11, marginTop: 4 }}>{msg}</p> : null;

// Field Input
const FI = ({ label, field, type = "text", form, setForm, placeholder, errors = {}, required = false }) => (
  <div style={fieldWrap}>
    <label style={labelStyle}>
      {label}{required && <RequiredMark />}
    </label>
    <input
      type={type}
      value={form[field] || ""}
      placeholder={placeholder || ""}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      style={getInputStyle(!!errors[field])}
    />
    <ErrorMsg msg={errors[field]} />
  </div>
);

// Field Select
const FS = ({ label, field, options, form, setForm, errors = {}, required = false }) => (
  <div style={fieldWrap}>
    <label style={labelStyle}>
      {label}{required && <RequiredMark />}
    </label>
    <select
      value={form[field] || ""}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      style={getInputStyle(!!errors[field])}
    >
      <option value="">— Select —</option>
      {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <ErrorMsg msg={errors[field]} />
  </div>
);

// ─────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────
const fmtNum = n => Number(n).toLocaleString("en-IN");

const Pagination = ({ page, total, perPage, onChange }) => {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const vis = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) vis.push(i);
  const btnBase = {
    background: "none", border: "1px solid var(--border)",
    borderRadius: 6, padding: "4px 8px", cursor: "pointer",
  };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
      <span style={{ color: "#8899aa", fontSize: 12 }}>
        Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {fmtNum(total)}
      </span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {[{ Icon: ChevronsLeft, to: 1, disabled: page === 1 }, { Icon: ChevronLeft, to: page - 1, disabled: page === 1 }]
          .map(({ Icon, to, disabled }) => (
            <button key={to + "l"} onClick={() => onChange(to)} disabled={disabled}
              style={{ ...btnBase, color: disabled ? "#556677" : "#8899aa", cursor: disabled ? "not-allowed" : "pointer" }}>
              <Icon size={12} />
            </button>
          ))}
        {vis.map(p => (
          <button key={p} onClick={() => onChange(p)}
            style={{ ...btnBase, background: p === page ? "#00d4aa" : "none", border: `1px solid ${p === page ? "#00d4aa" : "var(--border)"}`, color: p === page ? "#000" : "#8899aa", fontWeight: p === page ? 700 : 400, fontSize: 12, minWidth: 30 }}>
            {p}
          </button>
        ))}
        {[{ Icon: ChevronRight, to: page + 1, disabled: page === pages }, { Icon: ChevronsRight, to: pages, disabled: page === pages }]
          .map(({ Icon, to, disabled }) => (
            <button key={to + "r"} onClick={() => onChange(to)} disabled={disabled}
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
export default function SocietyDashboard() {
  const [societies,    setSocieties]    = useState([]);
  const [parentEntities, setParentEntities] = useState([]); // [{identifier, name, address, contact, email, city, state}]
  const [search,       setSearch]       = useState("");
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState(emptyForm);
  const [formErrors,   setFormErrors]   = useState({});
  const [viewItem,     setViewItem]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [toast,        setToast]        = useState({ msg: "", type: "success" });
  const PER = 10;

  // Clear errors for a field as soon as the user edits it
  useEffect(() => {
    if (Object.keys(formErrors).length === 0) return;
    // Re-run validation silently so errors disappear as fields are filled
    const errs = validateForm(form);
    setFormErrors(prev => {
      const next = { ...prev };
      Object.keys(prev).forEach(k => { if (!errs[k]) delete next[k]; });
      return next;
    });
  }, [form]);

  // ── Initial load ──────────────────────────────────────────
  useEffect(() => {
    fetchSocieties();
    fetchParentEntities();
  }, []);

  const fetchSocieties = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await getAllSocietyApi();
      const arr = extractArray(res);
      setSocieties(arr.map((item, i) => remapSociety(item, i)));
    } catch (err) {
      showToast("Failed to load societies", "error");
    } finally {
      setLoading(false);
    }
  };

  // map a raw parent-entity item to a flat object
  // parent-entity API may return parentSocietyIdentifier OR societyIdentifier
  const mapParentEntity = (item, i) => ({
    id:         item.societyId || item.id || item._id || i + 1,
    identifier: item.parentSocietyIdentifier || item.societyIdentifier || item.identifier || "",
    name:       item.parentSocietyName       || item.societyName       || item.name       || "",
    address:    item.address           || "",
    contact:    item.contactNumber     || item.contact    || "",
    email:      item.email             || "",
    city:       item.city              || "",
    state:      item.state             || "",
  });

  const fetchParentEntities = async () => {
    try {
      const res = await getAllParentEntityApi();
      // Log raw response so we can verify the shape in the console
      console.log("[ParentEntities] raw response:", res);
      const arr = extractArray(res);
      console.log("[ParentEntities] extracted array:", arr);
      const mapped = arr.map(mapParentEntity);
      console.log("[ParentEntities] mapped:", mapped);
      setParentEntities(mapped);
    } catch (err) {
      console.error("[ParentEntities] fetch error:", err);
      // non-critical — dropdown will just be empty
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  // ── Stats ─────────────────────────────────────────────────
  const total      = societies.length;
  const monthly    = societies.filter(s => s.billingFrequency === "Monthly").length;
  const quarterly  = societies.filter(s => s.billingFrequency === "Quarterly").length;
  const halfYearly = societies.filter(s => s.billingFrequency === "Half-Yearly").length;
  const yearly     = societies.filter(s => s.billingFrequency === "Yearly").length;

  // ── Filtered + paginated ──────────────────────────────────
  const filtered = societies.filter(d =>
    (d.societyName        || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.city               || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.state              || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.contactNumber      || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.registrationNumber || "").toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice((page - 1) * PER, page * PER);

  // ── Refresh ───────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await getAllSocietyApi();
      const arr = extractArray(res);
      setSocieties(arr.map((item, i) => remapSociety(item, i)));
      showToast(`Refreshed — ${arr.length} records`);
    } catch (err) {
      showToast(err?.response?.data?.message || "Refresh failed", "error");
    } finally {
      setRefreshing(false);
    }
  };

  // ── Build payload ─────────────────────────────────────────
  const buildPayload = (f) => ({
    societyName:                  f.societyName                  || null,
    societyShortName:             f.societyShortName             || null,
    email:                        f.email                        || null,
    contactNumber:                f.contactNumber                || null,
    address:                      f.address                      || null,
    addressLine2:                 f.addressLine2                 || null,
    addressLine3:                 f.addressLine3                 || null,
    visitorFormQrPath:            null,
    country:                      f.country                      || "India",
    state:                        f.state                        || null,
    city:                         f.city                         || null,
    pincode:                      f.pincode                      || null,
    societyManager:               f.societyManager               || null,
    interestCalculationType:      f.interestCalculationType      || null,
    annualRateOfInterest:         f.annualRateOfInterest         || null,
    interestCalculationStartDate: f.interestCalculationStartDate || null,
    registrationNumber:           f.registrationNumber           || null,
    billingFrequency:             f.billingFrequency             || null,
    tanNumber:                    f.tanNumber                    || null,
    panNumber:                    f.panNumber                    || null,
    signatory:                    f.signatory                    || null,
    hsnCode:                      f.hsnCode                      || null,
    gstin:                        f.gstin                        || null,
    // backend expects nested object — matches response shape
    parentSociety: {
      parentSocietyIdentifier: f.parentSocietyIdentifier?.trim() || null,
    },
  });

  // ── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast("Please fill in all required fields", "warn");
      // Scroll to the first error
      const firstErrKey = Object.keys(errors)[0];
      const el = document.getElementById(`field-${firstErrKey}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setFormErrors({});
    setSaving(true);
    try {
      const payload = buildPayload(form);
      if (form.id) {
        const res = await updateSocietyApi(payload, form.societyIdentifier || form.id);
        const updated = remapSociety(res?.data?.data || res?.data || { ...form, ...payload }, 0);
        setSocieties(prev => prev.map(r => r.id === form.id ? { ...r, ...updated } : r));
        showToast("Society updated successfully");
      } else {
        const res = await addSocietyApi(payload);
        const newItem = remapSociety(res?.data?.data || res?.data || payload, societies.length);
        setSocieties(prev => [...prev, newItem]);
        showToast("Society added successfully");
      }
      setModal(null);
      setForm(emptyForm);
      setFormErrors({});
    } catch (err) {
      showToast(err?.response?.data?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSocietyApi(deleteTarget.societyIdentifier || deleteTarget.id);
      setSocieties(prev => prev.filter(r => r.id !== deleteTarget.id));
      showToast("Society deleted");
      setModal(null);
      setDeleteTarget(null);
    } catch (err) {
      showToast(err?.response?.data?.message || "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ── Open modals ───────────────────────────────────────────
  const openAdd = () => {
    setForm(emptyForm);
    setFormErrors({});
    setModal("add");
  };

  const openEdit = (row) => {
    setForm({
      id:                           row.id,
      societyIdentifier:            row.societyIdentifier            || "",
      societyName:                  row.societyName                  || "",
      societyShortName:             row.societyShortName             || "",
      email:                        row.email                        || "",
      contactNumber:                row.contactNumber                || "",
      address:                      row.address                      || "",
      addressLine2:                 row.addressLine2                 || "",
      addressLine3:                 row.addressLine3                 || "",
      country:                      row.country                      || "India",
      state:                        row.state                        || "",
      city:                         row.city                         || "",
      pincode:                      row.pincode                      || "",
      registrationNumber:           row.registrationNumber           || "",
      billingFrequency:             row.billingFrequency             || "",
      interestCalculationType:      row.interestCalculationType      || "",
      annualRateOfInterest:         row.annualRateOfInterest         || "",
      interestCalculationStartDate: row.interestCalculationStartDate || "",
      tanNumber:                    row.tanNumber                    || "",
      panNumber:                    row.panNumber                    || "",
      gstin:                        row.gstin                        || "",
      hsnCode:                      row.hsnCode                      || "",
      signatory:                    row.signatory                    || "",
      societyManager:               row.societyManager               || "",
      visitorFormQrPath:            row.visitorFormQrPath            || "",
      visitorFormQrFile:            null,
      accountDetails:               Array.isArray(row.accountDetails) ? JSON.parse(JSON.stringify(row.accountDetails)) : [],
      parentSocietyIdentifier:      row.parentSocietyIdentifier      || "",
    });
    setFormErrors({});
    setModal("edit");
  };

  const openView   = (row) => { setViewItem(row); setModal("view"); };
  const openDelete = (row) => { setDeleteTarget(row); setModal("deleteConfirm"); };

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────
  return (
    <div style={{ padding: 28 }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Societies</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Manage society details, billing and interest settings</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleRefresh} disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", color: "#8899aa", fontWeight: 600, fontSize: 13, cursor: refreshing ? "not-allowed" : "pointer" }}>
            {refreshing
              ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              : <RefreshCw size={14} />}
          </button>
          <button onClick={openAdd}
            style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#1a2a4a,#162040)", border: "1px solid rgba(0,180,216,0.3)", borderRadius: 10, padding: "10px 18px", color: "#e8edf5", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            <Plus size={15} /> Add Society
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard color="#00d4aa" value={total}      label="Total" />
        <StatCard color="#00b4d8" value={monthly}    label="Monthly" />
        <StatCard color="#6c63ff" value={quarterly}  label="Quarterly" />
        <StatCard color="#ffb347" value={halfYearly} label="Half-Yearly" />
        <StatCard color="#ff6b6b" value={yearly}     label="Yearly" />
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#00b4d8", fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 3, height: 16, background: "#00b4d8", borderRadius: 2 }} />
            LIST OF SOCIETIES
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

        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#8899aa" }}>
              <Loader2 size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 8 }} />
              <p style={{ fontSize: 13 }}>Loading societies…</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["S.No", "Society Name", "Short Name", "City / State", "Contact", "Reg. Number", "Billing", "Interest %", "Action"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: 32, textAlign: "center", color: "#8899aa", fontSize: 13 }}>No societies found</td></tr>
                ) : paged.map((row, i) => (
                  <tr key={row.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{(page - 1) * PER + i + 1}</td>
                    <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}>{row.societyName || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{row.societyShortName || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>
                      {[row.city, row.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{row.contactNumber || "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: "rgba(0,180,216,0.1)", color: "#00b4d8", padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {row.registrationNumber || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: "rgba(108,99,255,0.12)", color: "#6c63ff", padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {row.billingFrequency || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#ffb347", fontWeight: 600, fontSize: 13 }}>
                      {row.annualRateOfInterest ? `${row.annualRateOfInterest}%` : "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <ActionBtn color="#00b4d8" icon={<Eye size={12} />}    onClick={() => openView(row)} />
                        <ActionBtn color="#6c63ff" icon={<Edit2 size={12} />}  onClick={() => openEdit(row)} />
                        <ActionBtn color="#ff6b6b" icon={<Trash2 size={12} />} onClick={() => openDelete(row)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
      </div>

      {/* ══════ ADD / EDIT MODAL ══════ */}
      {(modal === "add" || modal === "edit") && (
        <Overlay onClose={() => setModal(null)}>
          <ModalBox title={modal === "edit" ? "Edit Society" : "Add Society"} onClose={() => setModal(null)} maxWidth={580}>
            <div style={{ padding: 22 }}>

              {/* Required fields legend */}
              <p style={{ color: "#8899aa", fontSize: 11, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "#ff6b6b", fontWeight: 700 }}>*</span> Required fields
              </p>

              {/* Basic Info */}
              <SectionLabel label="BASIC INFORMATION" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div id="field-societyName">
                  <FI label="Society Name" field="societyName" form={form} setForm={setForm} errors={formErrors} required />
                </div>
                <FI label="Short Name" field="societyShortName" form={form} setForm={setForm} errors={formErrors} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FI label="Contact Number" field="contactNumber" form={form} setForm={setForm} errors={formErrors} />
                <FI label="Email"          field="email"         type="email" form={form} setForm={setForm} errors={formErrors} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FI label="Society Manager" field="societyManager" form={form} setForm={setForm} errors={formErrors} />
                <FI label="Signatory"       field="signatory"      form={form} setForm={setForm} errors={formErrors} />
              </div>

              {/* Address */}
              <SectionLabel label="ADDRESS" />
              <div id="field-address">
                <FI label="Address Line 1" field="address" form={form} setForm={setForm} errors={formErrors} required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FI label="Address Line 2" field="addressLine2" form={form} setForm={setForm} errors={formErrors} />
                <FI label="Address Line 3" field="addressLine3" form={form} setForm={setForm} errors={formErrors} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div id="field-country">
                  <FS label="Country" field="country" options={["India", "Nepal", "Bhutan", "Sri Lanka", "Bangladesh"]} form={form} setForm={setForm} errors={formErrors} required />
                </div>
                <div id="field-state">
                  <FS label="State" field="state" options={INDIAN_STATES} form={form} setForm={setForm} errors={formErrors} required />
                </div>
                <div id="field-city">
                  <FI label="City" field="city" form={form} setForm={setForm} errors={formErrors} required />
                </div>
                <FI label="Pincode" field="pincode" form={form} setForm={setForm} errors={formErrors} />
              </div>

              {/* Registration */}
              <SectionLabel label="REGISTRATION" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div id="field-registrationNumber">
                  <FI label="Registration Number" field="registrationNumber" form={form} setForm={setForm} errors={formErrors} required />
                </div>
                <FI label="PAN Number" field="panNumber" form={form} setForm={setForm} errors={formErrors} />
                <FI label="TAN Number" field="tanNumber" form={form} setForm={setForm} errors={formErrors} />
                <div id="field-gstin">
                  <FI label="GSTIN" field="gstin" form={form} setForm={setForm} errors={formErrors} required />
                </div>
                <FI label="HSN Code" field="hsnCode" form={form} setForm={setForm} errors={formErrors} />
              </div>

              {/* Billing & Interest */}
              <SectionLabel label="BILLING & INTEREST" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FS label="Billing Frequency"         field="billingFrequency"        options={BILLING_FREQ}  form={form} setForm={setForm} errors={formErrors} />
                <FS label="Interest Calculation Type" field="interestCalculationType" options={INTEREST_CALC} form={form} setForm={setForm} errors={formErrors} />
                <FI label="Annual Rate of Interest (%)"    field="annualRateOfInterest"         form={form} setForm={setForm} errors={formErrors} placeholder="e.g. 18" />
                <FI label="Interest Calculation Start Date" field="interestCalculationStartDate" type="date" form={form} setForm={setForm} errors={formErrors} />
              </div>

              {/* Account Details */}
              <SectionLabel label="BANK ACCOUNT DETAILS" />
              {form.accountDetails.map((acc, idx) => (
                <div key={idx} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px", marginBottom: 12, position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}>ACCOUNT {idx + 1}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "#00d4aa", fontSize: 12, fontWeight: 600 }}>
                        <input type="checkbox" checked={!!acc.isPreferred}
                          onChange={e => setForm(f => { const a = [...f.accountDetails]; a[idx] = { ...a[idx], isPreferred: e.target.checked }; return { ...f, accountDetails: a }; })}
                          style={{ accentColor: "#00d4aa" }} />
                        Preferred
                      </label>
                      <button onClick={() => setForm(f => ({ ...f, accountDetails: f.accountDetails.filter((_, i) => i !== idx) }))}
                        style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "4px 7px", color: "#ff6b6b", cursor: "pointer" }}>
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      ["Bank Name",         "bankName"],
                      ["Account Number",    "accountNumber"],
                      ["Branch Name",       "branchName"],
                      ["IFSC Code",         "ifscCode"],
                      ["Cheque Favourable", "chequeFavourable"],
                    ].map(([lbl, key]) => (
                      <div key={key} style={{ marginBottom: 0 }}>
                        <label style={labelStyle}>{lbl}</label>
                        <input value={acc[key] || ""} onChange={e => setForm(f => { const a = [...f.accountDetails]; a[idx] = { ...a[idx], [key]: e.target.value }; return { ...f, accountDetails: a }; })} style={getInputStyle(false)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={() => setForm(f => ({ ...f, accountDetails: [...f.accountDetails, { accountNumber: "", bankName: "", branchName: "", ifscCode: "", chequeFavourable: "", isPreferred: false, paymentQrPath: null }] }))}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,212,170,0.08)", border: "1px dashed rgba(0,212,170,0.4)", borderRadius: 8, padding: "8px 14px", color: "#00d4aa", fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 14, width: "100%", justifyContent: "center" }}>
                <Plus size={13} /> Add Bank Account
              </button>

              {/* Parent Society — single dropdown */}
              <SectionLabel label="PARENT SOCIETY" />
              <div style={fieldWrap}>
                <label style={labelStyle}>Select Parent Society</label>
                <select
                  value={form.parentSocietyIdentifier || ""}
                  onChange={e => setForm(f => ({ ...f, parentSocietyIdentifier: e.target.value }))}
                  style={getInputStyle(false)}
                >
                  <option value="">— None —</option>
                  {parentEntities.map(p => (
                    <option key={p.identifier} value={p.identifier}>
                      {p.name}{p.city ? ` · ${p.city}` : ""}
                    </option>
                  ))}
                </select>
                {/* Show selected parent's details as a read-only info strip */}
                {form.parentSocietyIdentifier && (() => {
                  const sel = parentEntities.find(p => p.identifier === form.parentSocietyIdentifier);
                  if (!sel) return null;
                  return (
                    <div style={{ marginTop: 8, background: "rgba(0,180,216,0.06)", border: "1px solid rgba(0,180,216,0.18)", borderRadius: 8, padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                      {[
                        ["Identifier", sel.identifier],
                        ["City / State", [sel.city, sel.state].filter(Boolean).join(", ") || "—"],
                        ["Contact", sel.contact || "—"],
                        ["Email",   sel.email   || "—"],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <span style={{ color: "#8899aa", fontSize: 11 }}>{k}: </span>
                          <span style={{ color: "var(--text-primary)", fontSize: 11, fontWeight: 600 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Visitor Form QR — REQUIRED */}
              <SectionLabel label="VISITOR FORM QR" />
              <div style={fieldWrap} id="field-visitorFormQrPath">
                <label style={labelStyle}>
                  QR Image (PNG / JPG)<RequiredMark />
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <label style={{
                    flex: 1, display: "flex", alignItems: "center", gap: 10,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px dashed ${formErrors.visitorFormQrPath ? "#ff6b6b" : "rgba(255,255,255,0.15)"}`,
                    borderRadius: 8, padding: "9px 12px", cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setForm(f => ({ ...f, visitorFormQrFile: file, visitorFormQrPath: file.name }));
                      }}
                    />
                    <span style={{ color: "#8899aa", fontSize: 13 }}>
                      {form.visitorFormQrFile
                        ? form.visitorFormQrFile.name
                        : form.visitorFormQrPath
                          ? form.visitorFormQrPath.split("/").pop()
                          : "Choose file…"}
                    </span>
                  </label>
                  {/* Preview — existing path from server */}
                  {form.visitorFormQrPath && !form.visitorFormQrFile && (
                    <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img
                        src={form.visitorFormQrPath.startsWith("http") ? form.visitorFormQrPath : `/${form.visitorFormQrPath.replace(/^\//, "")}`}
                        alt="QR"
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        onError={e => { e.currentTarget.style.display = "none"; }}
                      />
                    </div>
                  )}
                  {/* Preview — newly picked file */}
                  {form.visitorFormQrFile && (
                    <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(0,212,170,0.4)", flexShrink: 0 }}>
                      <img
                        src={URL.createObjectURL(form.visitorFormQrFile)}
                        alt="QR Preview"
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    </div>
                  )}
                  {/* Clear button */}
                  {(form.visitorFormQrFile || form.visitorFormQrPath) && (
                    <button
                      onClick={() => setForm(f => ({ ...f, visitorFormQrFile: null, visitorFormQrPath: "" }))}
                      style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "6px 8px", color: "#ff6b6b", cursor: "pointer", flexShrink: 0 }}>
                      <X size={13} />
                    </button>
                  )}
                </div>
                <ErrorMsg msg={formErrors.visitorFormQrPath} />
              </div>

              {/* Footer */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
                <button onClick={() => { setModal(null); setFormErrors({}); }}
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
          <ModalBox title="Society Details" onClose={() => setModal(null)} maxWidth={480}>
            <div style={{ padding: 22 }}>
              {/* Hero */}
              <div style={{ background: "rgba(0,180,216,0.08)", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(0,180,216,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Building2 size={20} style={{ color: "#00b4d8" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: "#00b4d8", fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {viewItem.societyName || "—"}
                  </p>
                  <p style={{ color: "#8899aa", fontSize: 12, marginTop: 2 }}>
                    {viewItem.societyShortName && `${viewItem.societyShortName} · `}
                    {viewItem.societyIdentifier}
                  </p>
                </div>
                {viewItem.billingFrequency && (
                  <span style={{ background: "rgba(108,99,255,0.15)", color: "#6c63ff", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                    {viewItem.billingFrequency}
                  </span>
                )}
              </div>

              {/* Contact */}
              <SectionLabel label="CONTACT" small />
              {[
                ["Contact",   viewItem.contactNumber  || "—"],
                ["Email",     viewItem.email          || "—"],
                ["Manager",   viewItem.societyManager || "—"],
                ["Signatory", viewItem.signatory      || "—"],
              ].map(([k, v]) => <ViewRow key={k} label={k} value={v} />)}

              {/* Visitor QR */}
              {viewItem.visitorFormQrPath && (
                <>
                  <SectionLabel label="VISITOR FORM QR" small />
                  <div style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "#8899aa", fontSize: 13 }}>QR Code</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ color: "var(--text-primary)", fontSize: 12, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {viewItem.visitorFormQrPath.split("/").pop()}
                      </span>
                      <div style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img
                          src={viewItem.visitorFormQrPath.startsWith("http") ? viewItem.visitorFormQrPath : `/${viewItem.visitorFormQrPath.replace(/^\//, "")}`}
                          alt="Visitor QR"
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          onError={e => { e.currentTarget.style.display = "none"; }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Address */}
              <SectionLabel label="ADDRESS" small />
              {[
                ["Address", [viewItem.address, viewItem.addressLine2, viewItem.addressLine3].filter(Boolean).join(", ") || "—"],
                ["City",    viewItem.city    || "—"],
                ["State",   viewItem.state   || "—"],
                ["Pincode", viewItem.pincode || "—"],
                ["Country", viewItem.country || "—"],
              ].map(([k, v]) => <ViewRow key={k} label={k} value={v} />)}

              {/* Registration */}
              <SectionLabel label="REGISTRATION" small />
              {[
                ["Reg. Number", viewItem.registrationNumber || "—"],
                ["PAN",         viewItem.panNumber          || "—"],
                ["TAN",         viewItem.tanNumber          || "—"],
                ["GSTIN",       viewItem.gstin              || "—"],
                ["HSN Code",    viewItem.hsnCode            || "—"],
              ].map(([k, v]) => <ViewRow key={k} label={k} value={v} />)}

              {/* Billing & Interest */}
              <SectionLabel label="BILLING & INTEREST" small />
              {[
                ["Billing Frequency",    viewItem.billingFrequency        || "—"],
                ["Interest Calc. Type",  viewItem.interestCalculationType || "—"],
                ["Annual Interest Rate", viewItem.annualRateOfInterest ? `${viewItem.annualRateOfInterest}%` : "—"],
                ["Interest Start Date",  viewItem.interestCalculationStartDate || "—"],
              ].map(([k, v]) => <ViewRow key={k} label={k} value={v} />)}

              {/* Account Details */}
              {viewItem.accountDetails?.length > 0 && (
                <>
                  <SectionLabel label="BANK ACCOUNTS" small />
                  {viewItem.accountDetails.map((acc, idx) => (
                    <div key={idx} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px", marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ color: "#8899aa", fontSize: 11, fontWeight: 600 }}>{acc.bankName || "Bank Account"}</span>
                        {acc.isPreferred && (
                          <span style={{ background: "rgba(0,212,170,0.15)", color: "#00d4aa", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>Preferred</span>
                        )}
                      </div>
                      {[
                        ["Account No",  acc.accountNumber    || "—"],
                        ["Branch",      acc.branchName       || "—"],
                        ["IFSC",        acc.ifscCode         || "—"],
                        ["Cheque Fav.", acc.chequeFavourable || "—"],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <span style={{ color: "#8899aa", fontSize: 12 }}>{k}</span>
                          <span style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 500 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}

              {/* Committee Members */}
              {viewItem.committeeMembers?.length > 0 && (
                <>
                  <SectionLabel label="COMMITTEE MEMBERS" small />
                  {viewItem.committeeMembers.map((m, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(108,99,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ color: "#6c63ff", fontSize: 11, fontWeight: 700 }}>{(m.name || m.memberName || "?")[0]?.toUpperCase()}</span>
                        </div>
                        <span style={{ color: "var(--text-primary)", fontSize: 13 }}>{m.name || m.memberName || "—"}</span>
                      </div>
                      <span style={{ color: "#8899aa", fontSize: 12 }}>{m.role || m.designation || ""}</span>
                    </div>
                  ))}
                </>
              )}

              {/* Parent Society */}
              {viewItem.parentSocietyIdentifier && (() => {
                const sel = parentEntities.find(p => p.identifier === viewItem.parentSocietyIdentifier);
                return (
                  <>
                    <SectionLabel label="PARENT SOCIETY" small />
                    {[
                      ["Name",       sel?.name       || viewItem.parentSocietyName        || "—"],
                      ["Identifier", viewItem.parentSocietyIdentifier                     || "—"],
                      ["City / State", sel ? [sel.city, sel.state].filter(Boolean).join(", ") || "—" : "—"],
                      ["Manager",    viewItem.parentSocietyManagerName                    || "—"],
                    ].map(([k, v]) => <ViewRow key={k} label={k} value={v} />)}
                  </>
                );
              })()}
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
                  {deleteTarget.societyName}
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
    <span style={{ color: "#8899aa", fontSize: 13, flexShrink: 0, marginRight: 12 }}>{label}</span>
    <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500, textAlign: "right" }}>{value}</span>
  </div>
);

const SectionLabel = ({ label, small }) => (
  <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", margin: small ? "14px 0 8px" : "4px 0 10px", borderTop: small ? "none" : "1px solid var(--border)", paddingTop: small ? 0 : 14 }}>
    {label}
  </p>
);

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