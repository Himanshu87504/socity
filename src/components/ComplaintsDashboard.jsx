

// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useAppContext } from "../AppContext";
import { getAllPropertyApi } from "../api/property-api";
import { addNewComplaintApi, deleteComplaintApi, updateComplaintApi, getComplaintCategoriesApi } from "../api/complaint-api";
import { getAllSocietyApi } from "../api/society-api";

// ── Priority & Status values matching actual API responses ───
// API sends: priority = "low" | "medium" | "high" | "critical" | "Medium" etc (case-insensitive)
// API sends: status   = "pending" | "in progress" | "completed" | "closed"
const PRIORITIES = ["Select priority", "low", "medium", "high", "critical"];
const STATUSES = ["Select status", "pending", "in progress", "completed", "closed"];
const ASSIGNEES = ["John Kumar", "Priya Singh", "Ravi Sharma", "Anita Das", "Mohan Patel"];

const priorityColors = {
  low: { color: "#00d4aa", bg: "rgba(0,212,170,0.12)" },
  medium: { color: "#ffb347", bg: "rgba(255,179,71,0.12)" },
  high: { color: "#ff6b6b", bg: "rgba(255,107,107,0.12)" },
  critical: { color: "#ff3838", bg: "rgba(255,56,56,0.12)" },
  // keep legacy capitalised keys so old mock data still colours correctly
  Low: { color: "#00d4aa", bg: "rgba(0,212,170,0.12)" },
  Medium: { color: "#ffb347", bg: "rgba(255,179,71,0.12)" },
  High: { color: "#ff6b6b", bg: "rgba(255,107,107,0.12)" },
  Critical: { color: "#ff3838", bg: "rgba(255,56,56,0.12)" },
};

const statusColors = {
  pending: { color: "#ffb347", bg: "rgba(255,179,71,0.12)" },
  "in progress": { color: "#00b4d8", bg: "rgba(0,180,216,0.12)" },
  completed: { color: "#00d4aa", bg: "rgba(0,212,170,0.12)" },
  closed: { color: "#8899aa", bg: "rgba(136,153,170,0.12)" },
  // keep legacy keys
  Open: { color: "#ffb347", bg: "rgba(255,179,71,0.12)" },
  Resolved: { color: "#00d4aa", bg: "rgba(0,212,170,0.12)" },
  Closed: { color: "#8899aa", bg: "rgba(136,153,170,0.12)" },
};

const makeEmptyForm = () => ({
  propertyIdentifier: "",
  propertyName: "",
  societyIdentifier: "",
  societyName: "",
  categoryId: "",
  categoryName: "",
  assignTo: ASSIGNEES[0],
  status: "pending",
  priority: "medium",
  description: "",
  complaintFile: null,
});

// ── Raw-field helpers (work on raw API shape) ────────────────
const getPropertyName = (row) => row?.property?.propertyName || row?.propertyName || row?.property || "—";
const getPropertyIdentifier = (row) => row?.property?.propertyIdentifier || row?.propertyIdentifier || "";
const getCategoryName = (row) => row?.category?.name || row?.categoryName || row?.category || "—";
const getCategoryId = (row) => String(row?.category?.id || row?.categoryId || "");
const getSocietyName = (row) => row?.society?.societyName || row?.societyName || row?.society || "—";
const getSocietyId = (row) => row?.society?.societyIdentifier || row?.societyIdentifier || "";
const getCreatedAt = (row) => row?.createdAt || row?.dateTime || "—";
const getPriority = (row) => (row?.priority || "—");
const getStatus = (row) => (row?.status || "—");

// ── Shared UI ────────────────────────────────────────────────
const Badge = ({ value, map }) => {
  const key = (value || "").toLowerCase();
  const s = map[key] || map[value] || { color: "#8899aa", bg: "rgba(136,153,170,0.12)" };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
      {value || "—"}
    </span>
  );
};

const SelectField = ({ label, value, onChange, options, displayMap }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>{label}</label>
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
          padding: "9px 28px 9px 12px",
          color: value === options[0]?.value ? "#8899aa" : "var(--text-primary)",
          fontSize: 13, outline: "none", appearance: "none", cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {displayMap?.[o.value] || o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={13} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#8899aa", pointerEvents: "none" }} />
    </div>
  </div>
);

// Simple dropdown used in the filter bar
const FilterSelect = ({ label, value, onChange, options }) => (
  <div style={{ flex: 1, minWidth: 160 }}>
    <label style={{ display: "block", color: "#8899aa", fontSize: 11, marginBottom: 4 }}>{label}</label>
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
          padding: "9px 28px 9px 12px",
          color: "var(--text-primary)", fontSize: 12,
          outline: "none", appearance: "none", cursor: "pointer",
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={13} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#8899aa", pointerEvents: "none" }} />
    </div>
  </div>
);

const TextField = ({ label, field, type = "text", area, form, setForm }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>{label}</label>
    {area ? (
      <textarea
        value={form[field] || ""}
        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
        rows={3}
        style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", resize: "vertical" }}
      />
    ) : (
      <input
        type={type}
        value={form[field] || ""}
        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
        style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
      />
    )}
  </div>
);

const navBtnStyle = (disabled) => ({
  background: "none", border: "1px solid var(--border)", borderRadius: 6,
  padding: "4px 8px", color: disabled ? "#556677" : "#8899aa",
  cursor: disabled ? "not-allowed" : "pointer",
});

const Pagination = ({ page, total, perPage, onChange }) => {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const visiblePages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) visiblePages.push(i);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
      <span style={{ color: "#8899aa", fontSize: 12 }}>
        Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {Number(total).toLocaleString("en-IN")}
      </span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button onClick={() => onChange(1)} disabled={page === 1} style={navBtnStyle(page === 1)}    ><ChevronsLeft size={12} /></button>
        <button onClick={() => onChange(page - 1)} disabled={page === 1} style={navBtnStyle(page === 1)}    ><ChevronLeft size={12} /></button>
        {visiblePages.map((p) => (
          <button key={p} onClick={() => onChange(p)} style={{ background: p === page ? "#00d4aa" : "none", border: `1px solid ${p === page ? "#00d4aa" : "var(--border)"}`, borderRadius: 6, padding: "4px 10px", color: p === page ? "#000" : "#8899aa", fontWeight: p === page ? 700 : 400, cursor: "pointer", fontSize: 12, minWidth: 30 }}>{p}</button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page === pages} style={navBtnStyle(page === pages)}><ChevronRight size={12} /></button>
        <button onClick={() => onChange(pages)} disabled={page === pages} style={navBtnStyle(page === pages)}><ChevronsRight size={12} /></button>
      </div>
    </div>
  );
};

// ── View Modal ───────────────────────────────────────────────
const ViewModal = ({ item, onClose }) => {
  if (!item) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "85vh", overflow: "auto" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ color: "var(--text-primary)", fontWeight: 700, margin: 0 }}>Complaint Details</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 22 }}>
          <div style={{ background: "rgba(255,107,107,0.08)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ color: "#ff6b6b", fontWeight: 700, fontSize: 15 }}>{item?.id ? `CMP-${item.id}` : item?.compId || "—"}</span>
              <Badge value={getPriority(item)} map={priorityColors} />
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 12 }}>
              <div style={{ color: "#8899aa", fontSize: 12, marginBottom: 6, fontWeight: 600 }}>DESCRIPTION</div>
              <div style={{ color: "#ffffff", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{item?.description ?? "—"}</div>
            </div>
          </div>
          {[
            ["Status", getStatus(item)],
            ["Priority", getPriority(item)],
            ["Category", getCategoryName(item)],
            ["Property", getPropertyName(item)],
            ["Property Identifier", getPropertyIdentifier(item)],
            ["Society", getSocietyName(item)],
            ["Society Identifier", getSocietyId(item)],
            ["Date & Time", getCreatedAt(item)],
            ["Assigned To", item?.assignTo || "—"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "#8899aa", fontSize: 13 }}>{label}</span>
              <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500, textAlign: "right" }}>{value || "—"}</span>
            </div>
          ))}
          {/* Status history */}
          {item?.complaintStatusHistory?.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 10 }}>STATUS HISTORY</p>
              {item.complaintStatusHistory.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00d4aa", marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <p style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 600 }}>{h.fullName} <span style={{ color: "#8899aa", fontWeight: 400 }}>({h.role})</span></p>
                    <p style={{ color: "#8899aa", fontSize: 11 }}>{h.updatedAt} — <span style={{ color: "#ffb347" }}>{h.status}</span></p>
                    {h.remarks && <p style={{ color: "#8899aa", fontSize: 12, marginTop: 2 }}>{h.remarks}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================
export default function ComplaintsDashboard() {
  const { complaints: ctxComplaints } = useAppContext();
  const [data, setData] = useState(null);
  const activeData = data || ctxComplaints || [];

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(makeEmptyForm());
  const [viewItem, setViewItem] = useState(null);
  const [errors, setErrors] = useState({});
  const [page, setPage] = useState(1);
  const PER = 8;

  // ── API-fetched dropdown data ────────────────────────────
  const [properties, setProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [societies, setSocieties] = useState([]);   // ← from getAllSocietyApi

  // ── Filter state — sentinel values match option[0].value ─
  const [filters, setFilters] = useState({
    societyIdentifier: "",   // "" = All
    propertyIdentifier: "",   // "" = All
    categoryId: "",   // "" = All
    priority: "",   // "" = All
    status: "",   // "" = All
  });
  const setF = (key, value) => { setFilters(prev => ({ ...prev, [key]: value })); setPage(1); };

  // ── Fetch properties ─────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await getAllPropertyApi();
        const list = res?.data?.data || res?.data || [];
        setProperties(Array.isArray(list) ? list : []);
      } catch { setProperties([]); }
    })();
  }, []);

  // ── Fetch categories ─────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await getComplaintCategoriesApi();
        const list = res?.data?.data || res?.data || [];
        setCategories(Array.isArray(list) ? list : []);
      } catch { setCategories([]); }
    })();
  }, []);

  // ── Fetch societies from getAllSocietyApi ─────────────────
  // Society API shape from Postman: { status:1, message:"...", data: [ {societyId, societyIdentifier, societyName, ...} ] }
  // axios wraps this as res.data = { status:1, data:[...] }
  // So the array is at: res?.data?.data  (axios)  OR  res?.data  (fetch)  OR  res (raw)
  useEffect(() => {
    (async () => {
      try {
        const res = await getAllSocietyApi();
        const raw = res?.data?.data    // axios: res.data = API body, body.data = array
          || res?.data          // fetch: res.data = array directly
          || res               // raw array
          || [];
        const list = Array.isArray(raw) ? raw : [];
        setSocieties(list);
      } catch (e) {
        console.warn("[Society] fetch failed", e);
        setSocieties([]);
      }
    })();
  }, []);

  // ── Build property lookup map ─────────────────────────────
  const propertyById = useMemo(() => {
    const m = {};
    properties.forEach(p => { m[p.propertyIdentifier] = p; });
    return m;
  }, [properties]);

  // ── Filter bar option lists (all built from real API data) ─

  // Society: from getAllSocietyApi — { societyIdentifier, societyName }
  const societyFilterOptions = useMemo(() => [
    { value: "", label: "All Societies" },
    ...societies.map(s => ({ value: s.societyIdentifier, label: s.societyName })),
  ], [societies]);

  // Property: from getAllPropertyApi — { propertyIdentifier, propertyName }
  const propertyFilterOptions = useMemo(() => [
    { value: "", label: "All Properties" },
    ...properties.map(p => ({ value: p.propertyIdentifier, label: `${p.propertyName} (${p.propertyIdentifier})` })),
  ], [properties]);

  // Category: from getComplaintCategoriesApi — { id, name }
  const categoryFilterOptions = useMemo(() => [
    { value: "", label: "All Categories" },
    ...categories.map(c => ({ value: String(c.id), label: c.name })),
  ], [categories]);

  // Priority: matches actual API values (lowercase)
  const priorityFilterOptions = [
    { value: "", label: "All Priorities" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
  ];

  // Status: matches actual API values (lowercase)
  const statusFilterOptions = [
    { value: "", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "in progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "closed", label: "Closed" },
  ];

  // ── Dropdown options for the Add/Edit form ────────────────
  const propertyFormOptions = useMemo(() => [
    { value: "", label: "Select property" },
    ...properties.map(p => ({ value: p.propertyIdentifier, label: `${p.propertyName} (${p.propertyIdentifier})` })),
  ], [properties]);

  const categoryFormOptions = useMemo(() => [
    { value: "", label: "Select category" },
    ...categories.map(c => ({ value: String(c.id), label: c.name })),
  ], [categories]);

  // ── Filter logic — compare against raw API field values ──
  const filtered = useMemo(() => activeData.filter(d => {
    // Society: compare societyIdentifier from nested object
    if (filters.societyIdentifier) {
      const sid = d?.society?.societyIdentifier || d?.societyIdentifier || "";
      if (sid !== filters.societyIdentifier) return false;
    }
    // Property: compare propertyIdentifier from nested object
    if (filters.propertyIdentifier) {
      const pid = d?.property?.propertyIdentifier || d?.propertyIdentifier || "";
      if (pid !== filters.propertyIdentifier) return false;
    }
    // Category: compare category.id (as string)
    if (filters.categoryId) {
      const cid = String(d?.category?.id || d?.categoryId || "");
      if (cid !== filters.categoryId) return false;
    }
    // Priority: compare lowercase
    if (filters.priority) {
      const p = (d?.priority || "").toLowerCase();
      if (p !== filters.priority) return false;
    }
    // Status: compare lowercase
    if (filters.status) {
      const s = (d?.status || "").toLowerCase();
      if (s !== filters.status) return false;
    }
    // Search
    if (search) {
      const q = search.toLowerCase();
      const haystack = [
        d?.id, d?.compId, d?.description,
        d?.property?.propertyIdentifier, d?.property?.propertyName,
        d?.category?.name,
        d?.society?.societyName, d?.society?.societyIdentifier,
        d?.status, d?.priority,
      ].map(v => (v || "").toLowerCase());
      if (!haystack.some(s => s.includes(q))) return false;
    }
    return true;
  }), [activeData, filters, search]);

  const paged = filtered.slice((page - 1) * PER, page * PER);

  // ── Stat cards (count by lowercase status) ───────────────
  const statSummary = { pending: 0, "in progress": 0, completed: 0, closed: 0 };
  activeData.forEach(d => {
    const s = (d?.status || "").toLowerCase();
    if (s in statSummary) statSummary[s]++;
  });
  const statIcons = { pending: AlertTriangle, "in progress": Clock, completed: CheckCircle, closed: XCircle };
  const statLabels = { pending: "Pending", "in progress": "In Progress", completed: "Completed", closed: "Closed" };

  // ── Add / Edit modal helpers ──────────────────────────────
  const openAdd = () => { setForm(makeEmptyForm()); setErrors({}); setModal("add"); };
  const openEdit = (row) => {
    setForm({
      ...makeEmptyForm(), ...row,
      propertyIdentifier: getPropertyIdentifier(row),
      propertyName: getPropertyName(row),
      societyIdentifier: getSocietyId(row),
      societyName: getSocietyName(row),
      categoryId: getCategoryId(row),
      categoryName: getCategoryName(row),
      complaintFile: null,
    });
    setErrors({});
    setModal("edit");
  };
  const closeModal = () => { setModal(null); setErrors({}); setForm(makeEmptyForm()); };

  const save = async () => {
    const newErrors = {};
    if (!form.propertyIdentifier) newErrors.propertyIdentifier = true;
    if (!form.categoryId) newErrors.categoryId = true;
    if (!form.description?.trim()) newErrors.description = true;
    if (!form.priority) newErrors.priority = true;
    if (!form.status) newErrors.status = true;
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    const selectedProperty = propertyById[form.propertyIdentifier];
    const isEdit = modal === "edit";

    if (isEdit) {
      // Edit: PATCH via updateComplaintApi
      const editData = {
        description: form.description,
        propertyIdentifier: form.propertyIdentifier,
        priority: String(form.priority).toLowerCase(),
        categoryId: String(form.categoryId),
        status: String(form.status).toLowerCase(),
        assignTo: form.assignTo,
      };
      if (selectedProperty?.society?.societyIdentifier)
        editData.societyIdentifier = selectedProperty.society.societyIdentifier;
      if (form.complaintFile) editData.complaintFile = form.complaintFile;

      const res = await updateComplaintApi(editData, form.id);
      if (res?.status === 1 || res?.data?.status === 1) {
        setData(prev => (prev || activeData).map(r =>
          r.id === form.id
            ? {
                ...r, ...editData,
                category: { id: form.categoryId, name: categories.find(c => String(c.id) === String(form.categoryId))?.name || "—" },
                property: { propertyIdentifier: selectedProperty?.propertyIdentifier || form.propertyIdentifier, propertyName: selectedProperty?.propertyName || form.propertyName },
                society: selectedProperty?.society
                  ? { societyIdentifier: selectedProperty.society.societyIdentifier, societyName: selectedProperty.society.societyName }
                  : r.society,
              }
            : r
        ));
        closeModal();
      }
    } else {
      // Add: POST via addNewComplaintApi (FormData)
      const fd = new FormData();
      fd.append("description", form.description);
      fd.append("propertyIdentifier", form.propertyIdentifier);
      fd.append("priority", String(form.priority).toLowerCase());
      fd.append("categoryId", String(form.categoryId));
      fd.append("status", String(form.status).toLowerCase());
      fd.append("assignTo", form.assignTo);
      if (selectedProperty?.society?.societyIdentifier)
        fd.append("societyIdentifier", selectedProperty.society.societyIdentifier);
      if (form.complaintFile) fd.append("complaintFile", form.complaintFile);

      const res = await addNewComplaintApi(fd);
      if (res?.status === 1 || res?.data?.status === 1) {
        const now = new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
        const created = {
          id: String(Date.now()),
          description: form.description,
          priority: String(form.priority).toLowerCase(),
          status: String(form.status).toLowerCase(),
          createdAt: now,
          issueFilePath: form.complaintFile ? form.complaintFile.name : null,
          category: { id: form.categoryId, name: categories.find(c => String(c.id) === String(form.categoryId))?.name || "—" },
          society: selectedProperty?.society
            ? { societyIdentifier: selectedProperty.society.societyIdentifier, societyName: selectedProperty.society.societyName }
            : null,
          property: { propertyIdentifier: selectedProperty?.propertyIdentifier || form.propertyIdentifier, propertyName: selectedProperty?.propertyName || form.propertyName },
        };
        setData(prev => [created, ...(prev || activeData)]);
        closeModal();
      }
    }
  };

  const deleteRow = async (row) => {
    const id = row?.id;
    if (!id) return;
    const res = await deleteComplaintApi(id);
    if (res?.status === 1 || res?.data?.status === 1)
      setData(prev => (prev || activeData).filter(r => r.id !== id));
  };

  const clearFilters = () => setFilters({ societyIdentifier: "", propertyIdentifier: "", categoryId: "", priority: "", status: "" });

  // ── Render ───────────────────────────────────────────────

  return (
    <div style={{ padding: 28 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Complaints</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Track and resolve resident complaints efficiently</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#1a2a4a,#162040)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 10, padding: "10px 16px", color: "#e8edf5", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            <Plus size={15} /> Add Complaint
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 10, padding: "10px 16px", color: "#00d4aa", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            <Download size={15} /> Download
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {Object.entries(statSummary).map(([s, count]) => {
          const Icon = statIcons[s];
          const sc = statusColors[s];
          return (
            <div key={s} style={{ background: "var(--bg-card)", border: `1px solid ${sc.color}22`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: sc.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={16} style={{ color: sc.color }} />
              </div>
              <div>
                <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600 }}>{statLabels[s]}</p>
                <p style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Panel */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
        <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 14 }}>FILTER</p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>

          {/* Society — from getAllSocietyApi */}
          <FilterSelect
            label="Society"
            value={filters.societyIdentifier}
            onChange={v => setF("societyIdentifier", v)}
            options={societyFilterOptions}
          />

          {/* Property — from getAllPropertyApi */}
          <FilterSelect
            label="Property"
            value={filters.propertyIdentifier}
            onChange={v => setF("propertyIdentifier", v)}
            options={propertyFilterOptions}
          />

          {/* Category — from getComplaintCategoriesApi */}
          <FilterSelect
            label="Category"
            value={filters.categoryId}
            onChange={v => setF("categoryId", v)}
            options={categoryFilterOptions}
          />

          {/* Priority — matches API lowercase values */}
          <FilterSelect
            label="Priority"
            value={filters.priority}
            onChange={v => setF("priority", v)}
            options={priorityFilterOptions}
          />

          {/* Status — matches API lowercase values */}
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={v => setF("status", v)}
            options={statusFilterOptions}
          />

          <div>
            <button
              onClick={clearFilters}
              style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 8, padding: "9px 14px", color: "#ff6b6b", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ff6b6b", fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 3, height: 16, background: "#ff6b6b", borderRadius: 2 }} />
            LIST OF COMPLAINTS
          </div>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px 8px 32px", color: "var(--text-primary)", fontSize: 13, outline: "none", width: 200 }}
            />
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["S.No", "Complaint Id", "Property", "Category", "Society", "Date & Time", "Status", "Priority", "Action"].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={row.id} style={{ borderBottom: "1px solid var(--border)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{(page - 1) * PER + i + 1}</td>
                <td style={{ padding: "12px 14px", color: "#ff6b6b", fontWeight: 600, fontSize: 12 }}>{row?.id ? `CMP-${row.id}` : row?.compId || "—"}</td>
                <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontWeight: 600, fontSize: 12 }}>{getPropertyName(row)}</td>
                <td style={{ padding: "12px 14px" }}>
                  {getCategoryName(row) !== "—"
                    ? <span style={{ background: "rgba(108,99,255,0.12)", color: "#6c63ff", padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{getCategoryName(row)}</span>
                    : <span style={{ color: "#556677", fontSize: 12 }}>—</span>}
                </td>
                <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{getSocietyName(row)}</td>
                <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12, whiteSpace: "nowrap" }}>{getCreatedAt(row)}</td>
                <td style={{ padding: "12px 14px" }}><Badge value={getStatus(row)} map={statusColors} /></td>
                <td style={{ padding: "12px 14px" }}><Badge value={getPriority(row)} map={priorityColors} /></td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => { setViewItem(row); setModal("view"); }} style={{ background: "rgba(0,180,216,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#00b4d8", cursor: "pointer" }}><Eye size={12} /></button>
                    <button onClick={() => openEdit(row)} style={{ background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#6c63ff", cursor: "pointer" }}><Edit2 size={12} /></button>
                    <button onClick={() => deleteRow(row)} style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#ff6b6b", cursor: "pointer" }}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#8899aa" }}>No complaints found</td></tr>
            )}
          </tbody>
        </table>

        <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
      </div>

      {/* Add / Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "85vh", overflow: "auto" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>{modal === "edit" ? "Edit Complaint" : "Add Complaint"}</h3>
              <button onClick={closeModal} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ padding: 22 }}>
              {Object.keys(errors).length > 0 && (
                <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#ff6b6b", fontSize: 12 }}>
                  Please fill required fields: {Object.keys(errors).join(", ")}
                </div>
              )}

              <SelectField
                label="Property *"
                value={form.propertyIdentifier}
                onChange={propertyIdentifier => {
                  const p = propertyById[propertyIdentifier];
                  setForm(f => ({ ...f, propertyIdentifier, propertyName: p?.propertyName || "", societyIdentifier: p?.society?.societyIdentifier || "", societyName: p?.society?.societyName || "" }));
                }}
                options={propertyFormOptions}
                displayMap={Object.fromEntries(propertyFormOptions.map(o => [o.value, o.label]))}
              />

              <TextField label="Property Name" field="propertyName" form={form} setForm={setForm} />
              <TextField label="Society Name" field="societyName" form={form} setForm={setForm} />
              <TextField label="Society Identifier" field="societyIdentifier" form={form} setForm={setForm} />

              <SelectField
                label="Category *"
                value={form.categoryId}
                onChange={categoryId => {
                  const cat = categories.find(c => String(c.id) === String(categoryId));
                  setForm(f => ({ ...f, categoryId, categoryName: cat?.name || "" }));
                }}
                options={categoryFormOptions}
                displayMap={Object.fromEntries(categoryFormOptions.map(o => [o.value, o.label]))}
              />

              <SelectField
                label="Assign To"
                value={form.assignTo}
                onChange={assignTo => setForm(f => ({ ...f, assignTo }))}
                options={ASSIGNEES.map(a => ({ value: a, label: a }))}
                displayMap={Object.fromEntries(ASSIGNEES.map(a => [a, a]))}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <SelectField
                  label="Status *"
                  value={form.status}
                  onChange={status => setForm(f => ({ ...f, status }))}
                  options={STATUSES.map(s => ({ value: s, label: s }))}
                  displayMap={Object.fromEntries(STATUSES.map(s => [s, s]))}
                />
                <SelectField
                  label="Priority *"
                  value={form.priority}
                  onChange={priority => setForm(f => ({ ...f, priority }))}
                  options={PRIORITIES.map(p => ({ value: p, label: p }))}
                  displayMap={Object.fromEntries(PRIORITIES.map(p => [p, p]))}
                />
              </div>

              <TextField label="Description *" field="description" area form={form} setForm={setForm} />

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>Complaint File</label>
                <input type="file" onChange={e => setForm(f => ({ ...f, complaintFile: e.target.files?.[0] || null }))} style={{ width: "100%", color: "var(--text-primary)" }} />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button onClick={closeModal} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer" }}>Cancel</button>
                <button onClick={save} style={{ background: "linear-gradient(135deg,#ff6b6b,#ff3838)", border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal === "view" && <ViewModal item={viewItem} onClose={() => setModal(null)} />}
    </div>
  );
}