// @ts-nocheck
import React, { useState } from "react";
import {
  GitBranch, Plus, Search, Edit2, Trash2, Eye, X,
  MapPin, Phone, Building2, Users, CheckCircle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Mail, CreditCard, Banknote, Percent, Calendar, Hash,
  UserCheck, Briefcase,
} from "lucide-react";
import { useAppContext } from "../AppContext";
import {
  createNewParentEntityApi,
  updateParentEntityApi,
  deleteParentEntityApi,
} from "../api/parentEntity-api";

// ─── Sub-components ──────────────────────────────────────────

const StatusBadge = ({ status }) => (
  <span style={{
    background: status === "Active" ? "rgba(0,212,170,0.15)" : "rgba(255,107,107,0.15)",
    color:      status === "Active" ? "#00d4aa" : "#ff6b6b",
    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
  }}>{status}</span>
);

// Form field — defined outside component to prevent re-mount
const PEF = ({ label, field, type = "text", form, setForm }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>{label}</label>
    <input
      type={type}
      value={form[field] || ""}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      style={{
        width: "100%", background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
        padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none",
      }}
    />
  </div>
);

// Detail row used inside View modal
const DetailRow = ({ label, value, Icon, accent = "#6c63ff" }) => (
  <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
    <Icon size={14} style={{ color: accent, marginTop: 2, flexShrink: 0 }} />
    <div>
      <p style={{ color: "#8899aa", fontSize: 11 }}>{label}</p>
      <p style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{value || "—"}</p>
    </div>
  </div>
);

const fmtNum = n => Number(n).toLocaleString("en-IN");

const Pagination = ({ page, total, perPage, onChange }) => {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const visiblePages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) visiblePages.push(i);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
      <span style={{ color: "#8899aa", fontSize: 12 }}>
        Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {fmtNum(total)}
      </span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button onClick={() => onChange(1)} disabled={page === 1} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: page === 1 ? "#556677" : "#8899aa", cursor: page === 1 ? "not-allowed" : "pointer" }}><ChevronsLeft size={12} /></button>
        <button onClick={() => onChange(page - 1)} disabled={page === 1} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: page === 1 ? "#556677" : "#8899aa", cursor: page === 1 ? "not-allowed" : "pointer" }}><ChevronLeft size={12} /></button>
        {visiblePages.map(p => (
          <button key={p} onClick={() => onChange(p)} style={{ background: p === page ? "#00d4aa" : "none", border: `1px solid ${p === page ? "#00d4aa" : "var(--border)"}`, borderRadius: 6, padding: "4px 10px", color: p === page ? "#000" : "#8899aa", fontWeight: p === page ? 700 : 400, cursor: "pointer", fontSize: 12, minWidth: 30 }}>{p}</button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page === pages} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: page === pages ? "#556677" : "#8899aa", cursor: page === pages ? "not-allowed" : "pointer" }}><ChevronRight size={12} /></button>
        <button onClick={() => onChange(pages)} disabled={page === pages} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: page === pages ? "#556677" : "#8899aa", cursor: page === pages ? "not-allowed" : "pointer" }}><ChevronsRight size={12} /></button>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────

const emptyForm = {
  name: "", address: "", contact: "", email: "",
  country: "India", state: "", city: "", pincode: "",
  managerName: "", registrationNumber: "", tanNumber: "",
  panNumber: "", signatory: "", hsnCode: "", gstin: "",
  societyBankName: "", accountNumber: "", branchName: "",
  ifscCode: "", chequeFavourable: "",
  billingFrequency: "Monthly", annualRateOfInterest: "",
  interestCalculationType: "Simple", interestCalculationStartDate: "",
  societies: 0, totalUnits: 0, status: "Active",
  societyPaymentQrCode: null,
};

export default function ParentEntityDashboard() {
  // ── Pull data from AppContext (already fetched + mapped) ──
  const { parentEntities, setParentEntities, loading, apiError } = useAppContext();

  const [search,   setSearch]   = useState("");
  const [modal,    setModal]    = useState(null);   // "add" | "edit" | "view"
  const [form,     setForm]     = useState(emptyForm);
  const [viewItem, setViewItem] = useState(null);
  const [page,     setPage]     = useState(1);
  const [saving,   setSaving]   = useState(false);
  const [actionError, setActionError] = useState("");
  const PER = 8;

  const filtered = parentEntities.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.address.toLowerCase().includes(search.toLowerCase()) ||
    (d.parentSocietyIdentifier || "").toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice((page - 1) * PER, page * PER);

  const openAdd  = () => { setForm(emptyForm); setActionError(""); setModal("add"); };
  const openEdit = (item) => { setForm({ ...item }); setActionError(""); setModal("edit"); };
  const openView = (item) => { setViewItem(item); setModal("view"); };

  // Build FormData payload (backend expects multipart/form-data)
  // Build FormData — only append fields that have values, exactly like Postman
  const buildPayload = (f) => {
    const fd = new FormData();
    // Only append if value is non-empty — backend crashes on unexpected empty strings
    const a = (key, val) => {
      const v = val !== undefined && val !== null ? String(val).trim() : "";
      if (v !== "") fd.append(key, v);
    };
    a("parentSocietyName",            f.name);
    a("address",                      f.address);
    a("country",                      f.country || "India");
    a("state",                        f.state);
    a("city",                         f.city);
    a("pincode",                      f.pincode);
    a("parentContactNumber",          f.contact);
    a("email",                        f.email);
    a("managerName",                  f.managerName);
    a("registrationNumber",           f.registrationNumber);
    a("tanNumber",                    f.tanNumber);
    a("panNumber",                    f.panNumber);
    a("signatory",                    f.signatory);
    a("hsnCode",                      f.hsnCode);
    a("gstin",                        f.gstin);
    a("societyBankName",              f.societyBankName);
    a("accountNumber",                f.accountNumber);
    a("branchName",                   f.branchName);
    a("ifscCode",                     f.ifscCode);
    a("chequeFavourable",             f.chequeFavourable);
    a("billingFrequency",             f.billingFrequency);
    a("annualRateOfInterest",         f.annualRateOfInterest);
    a("interestCalculationType",      (f.interestCalculationType || "").toLowerCase());
    a("interestCalculationStartDate", f.interestCalculationStartDate);
    // Match Postman exactly: children = "[ ]", committeeMembers = "[]"
    const children = Array.isArray(f.children) ? f.children : [];
    const members  = Array.isArray(f.committeeMembers) ? f.committeeMembers : [];
    fd.append("children",         children.length > 0 ? JSON.stringify(children) : "[ ]");
    fd.append("committeeMembers", members.length  > 0 ? JSON.stringify(members)  : "[]");
    // societyPaymentQrCode is optional — only send if user selected a file
    if (f.societyPaymentQrCode instanceof File) {
      fd.append("societyPaymentQrCode", f.societyPaymentQrCode);
    }
    return fd;
  };

  const save = async () => {
    if (!form.name || !form.contact) return;
    setSaving(true);
    setActionError("");
    try {
      const payload = buildPayload(form);
      // Backend PATCH URL uses parentSocietyIdentifier (e.g. PS-00136)
      const apiId = form.parentSocietyIdentifier;
      if (apiId) {
        // Edit — call update API
        await updateParentEntityApi(payload, apiId);
        setParentEntities(d => d.map(r => r.parentSocietyIdentifier === apiId ? { ...r, ...form } : r));
      } else {
        // Create — call create API
        const res = await createNewParentEntityApi(payload);
        const newEntity = res?.data?.data || res?.data || {};
        setParentEntities(d => [
          ...d,
          {
            ...form,
            id:                      newEntity.parentSocietyId         || Date.now(),
            parentSocietyIdentifier: newEntity.parentSocietyIdentifier || "",
          },
        ]);
      }
      setModal(null);
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const del = async (row) => {
    if (!window.confirm("Are you sure you want to delete this parent entity?")) return;
    // Backend DELETE uses parentSocietyIdentifier (e.g. PS-00027)
    const apiId = row.parentSocietyIdentifier;
    try {
      await deleteParentEntityApi(apiId);
      setParentEntities(d => d.filter(r => r.parentSocietyIdentifier !== apiId));
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Delete failed");
    }
  };

  const stats = [
    { label: "Total Parents",    value: parentEntities.length,                                             icon: GitBranch,   color: "#6c63ff" },
    { label: "Active",           value: parentEntities.filter(d => d.status === "Active").length,          icon: CheckCircle, color: "#00d4aa" },
    { label: "Total Societies",  value: parentEntities.reduce((a, b) => a + (b.societies || 0), 0),        icon: Building2,   color: "#00b4d8" },
    { label: "Committee Members",value: parentEntities.reduce((a, b) => a + (b.totalUnits || 0), 0),       icon: Users,       color: "#ffb347" },
  ];

  // Loading/error states (driven by AppContext)
  if (loading) return (
    <div style={{ padding: 28, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
      <span style={{ color: "#8899aa", fontSize: 14 }}>Loading parent entities...</span>
    </div>
  );
  if (apiError) return (
    <div style={{ padding: 28, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
      <span style={{ color: "#ff6b6b", fontSize: 14 }}>{apiError}</span>
    </div>
  );

  return (
    <div style={{ padding: 28 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Parent Entity</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Manage parent organizations and their associated societies</p>
        </div>
        <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#1a2a4a,#162040)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 10, padding: "10px 18px", color: "#e8edf5", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          <Plus size={15} /> Add Parent
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600 }}>{s.label}</p>
              <p style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 700 }}>{s.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6c63ff", fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 3, height: 16, background: "#6c63ff", borderRadius: 2, display: "inline-block" }} />
            LIST OF PARENT ENTITY
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
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["S.No", "ID", "Parent Name", "Address", "Contact", "Societies", "Committee", "Status", "Action"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((row, i) => (
                <tr key={row.id}
                  style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "13px 16px", color: "#8899aa", fontSize: 12 }}>{(page - 1) * PER + i + 1}</td>
                  <td style={{ padding: "13px 16px", color: "#6c63ff", fontSize: 11, fontWeight: 600 }}>
                    {row.parentSocietyIdentifier || "—"}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(108,99,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <GitBranch size={14} style={{ color: "#6c63ff" }} />
                      </div>
                      <div>
                        <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}>{row.name}</span>
                        {row.managerName && (
                          <p style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>{row.managerName}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px", color: "#8899aa", fontSize: 12, maxWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
                      <MapPin size={12} style={{ color: "#6c63ff", marginTop: 1, flexShrink: 0 }} />
                      <span>{row.addressDisplay || row.address || "—"}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Phone size={12} style={{ color: "#00d4aa" }} />
                      <span style={{ color: "var(--text-primary)", fontSize: 13 }}>{row.contact || "—"}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px", color: "var(--text-primary)", fontWeight: 600 }}>{row.societies}</td>
                  <td style={{ padding: "13px 16px", color: "var(--text-primary)", fontWeight: 600 }}>{row.totalUnits}</td>
                  <td style={{ padding: "13px 16px" }}><StatusBadge status={row.status} /></td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openView(row)} style={{ background: "rgba(0,180,216,0.12)", border: "none", borderRadius: 6, padding: "6px 9px", color: "#00b4d8", cursor: "pointer" }}><Eye size={13} /></button>
                      <button onClick={() => openEdit(row)} style={{ background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 6, padding: "6px 9px", color: "#6c63ff", cursor: "pointer" }}><Edit2 size={13} /></button>
                      <button onClick={() => del(row)} style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "6px 9px", color: "#ff6b6b", cursor: "pointer" }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#8899aa" }}>No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
      </div>

      {/* ── Add / Edit Modal ── */}
      {(modal === "add" || modal === "edit") && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "85vh", overflow: "auto" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>{modal === "edit" ? "Edit Parent Entity" : "Add Parent Entity"}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ padding: 22 }}>
              <PEF label="parentSocietyName *"    field="name"    form={form} setForm={setForm} />
              <PEF label="Address"          field="address" form={form} setForm={setForm} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <PEF label="City"    field="city"    form={form} setForm={setForm} />
                <PEF label="State"   field="state"   form={form} setForm={setForm} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <PEF label="Country" field="country" form={form} setForm={setForm} />
                <PEF label="Pincode" field="pincode" form={form} setForm={setForm} />
              </div>
              <PEF label="Contact Number *" field="contact" form={form} setForm={setForm} />
              <PEF label="Email Address"    field="email"   type="email" form={form} setForm={setForm} />
              <PEF label="Manager Name"     field="managerName" form={form} setForm={setForm} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <PEF label="Registration No." field="registrationNumber" form={form} setForm={setForm} />
                <PEF label="TAN Number"        field="tanNumber"          form={form} setForm={setForm} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <PEF label="PAN Number" field="panNumber" form={form} setForm={setForm} />
                <PEF label="GSTIN"      field="gstin"     form={form} setForm={setForm} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <PEF label="HSN Code"   field="hsnCode"   form={form} setForm={setForm} />
                <PEF label="Signatory"  field="signatory" form={form} setForm={setForm} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <PEF label="Bank Name"      field="societyBankName" form={form} setForm={setForm} />
                <PEF label="Branch Name"    field="branchName"      form={form} setForm={setForm} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <PEF label="Account Number" field="accountNumber" form={form} setForm={setForm} />
                <PEF label="IFSC Code"      field="ifscCode"      form={form} setForm={setForm} />
              </div>
              <PEF label="Cheque Favourable" field="chequeFavourable" form={form} setForm={setForm} />
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>
                  Society Payment QR Code {form.societyPaymentQrCode ? <span style={{ color: "#00d4aa", marginLeft: 6 }}></span> : <span style={{ color: "#8899aa", marginLeft: 6 }}>(optional)</span>}
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => setForm(f => ({ ...f, societyPaymentQrCode: e.target.files[0] || null }))}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", cursor: "pointer" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>Billing Frequency</label>
                  <select value={form.billingFrequency || ""} onChange={e => setForm(f => ({ ...f, billingFrequency: e.target.value }))}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}>
                    <option value="">Select Frequency</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half Yearly">Half Yearly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                <PEF label="Annual Rate of Interest" field="annualRateOfInterest" form={form} setForm={setForm} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>Interest Calculation Type</label>
                  <select value={form.interestCalculationType || ""} onChange={e => setForm(f => ({ ...f, interestCalculationType: e.target.value }))}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}>
                    <option value="">Select Type</option>
                    <option value="Simple">Simple</option>
                    <option value="Compound">Compound</option>
                  </select>
                </div>
                <PEF label="Interest Start Date" field="interestCalculationStartDate" type="date" form={form} setForm={setForm} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8, flexDirection: "column" }}>
                {actionError && (
                  <p style={{ color: "#ff6b6b", fontSize: 12, textAlign: "right" }}>{actionError}</p>
                )}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => setModal(null)} disabled={saving} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: saving ? "not-allowed" : "pointer" }}>Cancel</button>
                  <button onClick={save} disabled={saving} style={{ background: "linear-gradient(135deg,#6c63ff,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View Modal (rich detail) ── */}
      {modal === "view" && viewItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 580, maxHeight: "90vh", overflow: "auto" }}>

            {/* Modal header */}
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>Parent Entity Details</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ padding: 22 }}>
              {/* Identity banner */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: 16, background: "rgba(108,99,255,0.08)", borderRadius: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(108,99,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <GitBranch size={20} style={{ color: "#6c63ff" }} />
                </div>
                <div>
                  <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15 }}>{viewItem.name}</p>
                  <p style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>{viewItem.parentSocietyIdentifier}</p>
                  <div style={{ marginTop: 4 }}><StatusBadge status={viewItem.status} /></div>
                </div>
              </div>

              {/* Two-column detail grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>

                {/* Left column */}
                <div>
                  <p style={{ color: "#6c63ff", fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Contact Info</p>
                  <DetailRow label="Address"      value={viewItem.addressDisplay || viewItem.address}     Icon={MapPin}    />
                  <DetailRow label="Phone"        value={viewItem.contact}     Icon={Phone}     accent="#00d4aa" />
                  <DetailRow label="Email"        value={viewItem.email}       Icon={Mail}      accent="#00b4d8" />
                  <DetailRow label="Manager"      value={viewItem.managerName} Icon={UserCheck} />

                  <p style={{ color: "#6c63ff", fontSize: 11, fontWeight: 700, margin: "16px 0 10px", textTransform: "uppercase", letterSpacing: 1 }}>Registration</p>
                  <DetailRow label="Reg. Number"  value={viewItem.registrationNumber} Icon={Hash}      />
                  <DetailRow label="TAN Number"   value={viewItem.tanNumber}          Icon={Hash}      />
                  <DetailRow label="PAN Number"   value={viewItem.panNumber}          Icon={CreditCard}/>
                  <DetailRow label="GSTIN"        value={viewItem.gstin}              Icon={Briefcase} />
                  <DetailRow label="HSN Code"     value={viewItem.hsnCode}            Icon={Hash}      />
                  <DetailRow label="Signatory"    value={viewItem.signatory}          Icon={UserCheck} />
                </div>

                {/* Right column */}
                <div>
                  <p style={{ color: "#6c63ff", fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Bank Details</p>
                  <DetailRow label="Bank Name"       value={viewItem.societyBankName}  Icon={Banknote}  accent="#ffb347" />
                  <DetailRow label="Account Number"  value={viewItem.accountNumber}    Icon={CreditCard}accent="#ffb347" />
                  <DetailRow label="Branch"          value={viewItem.branchName}       Icon={Building2} />
                  <DetailRow label="IFSC Code"       value={viewItem.ifscCode}         Icon={Hash}      />
                  <DetailRow label="Cheque Favourable" value={viewItem.chequeFavourable} Icon={CreditCard}/>

                  <p style={{ color: "#6c63ff", fontSize: 11, fontWeight: 700, margin: "16px 0 10px", textTransform: "uppercase", letterSpacing: 1 }}>Billing</p>
                  <DetailRow label="Billing Frequency"       value={viewItem.billingFrequency}          Icon={Calendar} accent="#00d4aa" />
                  <DetailRow label="Annual Rate of Interest" value={viewItem.annualRateOfInterest ? `${viewItem.annualRateOfInterest}%` : ""} Icon={Percent} accent="#00d4aa" />
                  <DetailRow label="Interest Calculation"    value={viewItem.interestCalculationType}   Icon={Briefcase}/>
                  <DetailRow label="Interest Start Date"     value={viewItem.interestCalculationStartDate} Icon={Calendar}/>
                </div>
              </div>

              {/* Children societies */}
              {viewItem.children && viewItem.children.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <p style={{ color: "#6c63ff", fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                    Linked Societies ({viewItem.children.length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {viewItem.children.map((c, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(0,180,216,0.06)", borderRadius: 8 }}>
                        <Building2 size={13} style={{ color: "#00b4d8", flexShrink: 0 }} />
                        <span style={{ color: "var(--text-primary)", fontSize: 12 }}>{c.society?.societyName || c.societyIdentifier}</span>
                        <span style={{ color: "#8899aa", fontSize: 11, marginLeft: "auto" }}>{c.societyIdentifier}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Committee members */}
              {viewItem.committeeMembers && viewItem.committeeMembers.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <p style={{ color: "#6c63ff", fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                    Committee Members ({viewItem.committeeMembers.length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {viewItem.committeeMembers.map((m, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "rgba(108,99,255,0.06)", borderRadius: 8 }}>
                        <Users size={13} style={{ color: "#6c63ff", flexShrink: 0, marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 600 }}>{m.fullName}</p>
                          <p style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>
                            {m.designation} &nbsp;·&nbsp; {m.contactNumber}
                          </p>
                          {(m.tower?.towerName || m.wing?.wingName || m.property?.propertyName) && (
                            <p style={{ color: "#6c63ff", fontSize: 11, marginTop: 2 }}>
                              {[m.tower?.towerName, m.wing?.wingName, m.property?.propertyName].filter(Boolean).join(" › ")}
                            </p>
                          )}
                        </div>
                        {m.applicationType?.length > 0 && (
                          <span style={{ background: "rgba(0,212,170,0.12)", color: "#00d4aa", fontSize: 10, padding: "2px 8px", borderRadius: 10, flexShrink: 0 }}>
                            {m.applicationType.join(", ")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}