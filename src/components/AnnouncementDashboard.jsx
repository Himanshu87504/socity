// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../AppContext";
import {
  Megaphone, Plus, Search, Edit2, Trash2, Eye, X,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Building2, ChevronDown, RefreshCw, CheckCircle,
} from "lucide-react";
import { deleteAnnouncementApi, updateAnnouncementApi, createAnnouncementApi } from "../api/announcement-api";
import { getAllPropertyApi } from "../api/property-api";
import { getAllSocietyApi, getAnnouncementsOfSocietyApi } from "../api/society-api";

// ── Type config ────────────────────────────────────────────────────────────
const typeConfig = {
  General:     { color: "#00b4d8", bg: "rgba(0,180,216,0.12)" },
  Urgent:      { color: "#ff6b6b", bg: "rgba(255,107,107,0.12)" },
  Event:       { color: "#6c63ff", bg: "rgba(108,99,255,0.12)" },
  Maintenance: { color: "#ffb347", bg: "rgba(255,179,71,0.12)" },
  Finance:     { color: "#00d4aa", bg: "rgba(0,212,170,0.12)" },
  Holiday:     { color: "#ff9f43", bg: "rgba(255,159,67,0.12)" },
};

const emptyForm = {
  societyIdentifier: "",
  societyName: "",
  announcementName: "",
  message: "",
  startDate: "",
  validDate: "",
  announcementFile: null,
  announcementFilePath: "",
  towerIdentifier: "",
  wingIdentifier: "",
  propertyIdentifier: "",
};

// ── Shared styles ──────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
  padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none",
};
const labelStyle = { display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 };

const toInputDate = (val) => {
  if (!val) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  const parts = val.split(/[\/\-]/);
  if (parts.length === 3) {
    if (parts[0].length === 2 && parts[2].length === 4)
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    if (parts[0].length === 4 && parts[2].length === 2)
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
  }
  return val;
};

// ── Field components ───────────────────────────────────────────────────────
const F = ({ label, field, type = "text", area, form, setForm, required }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={labelStyle}>{label}{required && <span style={{ color: "#ff6b6b", marginLeft: 3 }}>*</span>}</label>
    {area
      ? <textarea value={form[field] || ""} rows={3}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          style={{ ...inputStyle, resize: "vertical" }} />
      : <input type={type} value={form[field] || ""}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          style={inputStyle} />}
  </div>
);

const DD = ({ label, options, value, onChange, placeholder = "-- Select --", disabled = false, hint, required }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={labelStyle}>
      {label}{required && <span style={{ color: "#ff6b6b", marginLeft: 3 }}>*</span>}
      {hint && <span style={{ color: "#445566", marginLeft: 6, fontWeight: 400 }}>{hint}</span>}
    </label>
    <select
      value={value} disabled={disabled} onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle, appearance: "none", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1 }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

// ── Pagination ─────────────────────────────────────────────────────────────
const fmtNum = n => Number(n).toLocaleString("en-IN");
const Pagination = ({ page, total, perPage, onChange }) => {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const vis = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) vis.push(i);
  const btn = { background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
      <span style={{ color: "#8899aa", fontSize: 12 }}>
        Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {fmtNum(total)}
      </span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button onClick={() => onChange(1)} disabled={page === 1} style={{ ...btn, color: page === 1 ? "#556677" : "#8899aa" }}><ChevronsLeft size={12} /></button>
        <button onClick={() => onChange(page - 1)} disabled={page === 1} style={{ ...btn, color: page === 1 ? "#556677" : "#8899aa" }}><ChevronLeft size={12} /></button>
        {vis.map(p => (
          <button key={p} onClick={() => onChange(p)}
            style={{ background: p === page ? "#00d4aa" : "none", border: `1px solid ${p === page ? "#00d4aa" : "var(--border)"}`, borderRadius: 6, padding: "4px 10px", color: p === page ? "#000" : "#8899aa", fontWeight: p === page ? 700 : 400, cursor: "pointer", fontSize: 12, minWidth: 30 }}>
            {p}
          </button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page === pages} style={{ ...btn, color: page === pages ? "#556677" : "#8899aa" }}><ChevronRight size={12} /></button>
        <button onClick={() => onChange(pages)} disabled={page === pages} style={{ ...btn, color: page === pages ? "#556677" : "#8899aa" }}><ChevronsRight size={12} /></button>
      </div>
    </div>
  );
};

// ── Society Search Engine Component ───────────────────────────────────────
function SocietySearchEngine({ societies, selectedSociety, onSelect, loading }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = societies.filter(s => {
    const q = query.toLowerCase();
    return (s.societyName || "").toLowerCase().includes(q) ||
           (s.societyIdentifier || "").toLowerCase().includes(q);
  });

  const displayName = selectedSociety
    ? (selectedSociety.societyName || selectedSociety.societyIdentifier || "Society")
    : "All Societies";

  return (
    <div ref={ref} style={{ position: "relative", minWidth: 280 }}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: selectedSociety ? "rgba(0,212,170,0.08)" : "var(--bg-card)",
          border: `1.5px solid ${selectedSociety ? "rgba(0,212,170,0.4)" : "var(--border-strong)"}`,
          borderRadius: 10, padding: "8px 14px", color: "var(--text-primary)",
          fontSize: 13, cursor: "pointer", fontWeight: 600, width: "100%",
          justifyContent: "space-between", transition: "all 0.15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Building2 size={14} style={{ color: selectedSociety ? "#00d4aa" : "#8899aa", flexShrink: 0 }} />
          <span style={{ color: selectedSociety ? "#00d4aa" : "var(--text-primary)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {loading && <RefreshCw size={11} style={{ color: "#8899aa", animation: "spin 1s linear infinite" }} />}
          {selectedSociety && (
            <button
              onClick={e => { e.stopPropagation(); onSelect(null); }}
              style={{ background: "none", border: "none", padding: "0 2px", cursor: "pointer", color: "#8899aa", display: "flex", alignItems: "center" }}
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown size={12} style={{ color: "#8899aa", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s" }} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: "var(--bg-surface, #0f1923)", border: "1px solid var(--border-strong)",
          borderRadius: 12, zIndex: 500, boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
          overflow: "hidden", animation: "fadeSlideDown 0.15s ease",
        }}>
          {/* Search input inside dropdown */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search society name or ID..."
                style={{
                  ...inputStyle, padding: "7px 10px 7px 28px",
                  fontSize: 12, background: "rgba(255,255,255,0.06)",
                }}
              />
            </div>
          </div>

          {/* Options list */}
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {/* All Societies option */}
            <button
              onClick={() => { onSelect(null); setOpen(false); setQuery(""); }}
              style={{
                width: "100%", textAlign: "left", padding: "10px 14px",
                background: !selectedSociety ? "rgba(0,212,170,0.08)" : "none",
                border: "none", cursor: "pointer", color: !selectedSociety ? "#00d4aa" : "var(--text-primary)",
                fontSize: 12, fontWeight: !selectedSociety ? 700 : 400, display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {!selectedSociety && <CheckCircle size={12} style={{ color: "#00d4aa" }} />}
              {!selectedSociety && <span>✓</span>}
              <span>All Societies</span>
            </button>

            {/* Society options */}
            {filtered.length === 0 && (
              <div style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12, textAlign: "center" }}>
                No societies found
              </div>
            )}
            {filtered.map(s => {
              const isActive = selectedSociety?.societyIdentifier === s.societyIdentifier;
              return (
                <button
                  key={s.societyIdentifier}
                  onClick={() => { onSelect(s); setOpen(false); setQuery(""); }}
                  style={{
                    width: "100%", textAlign: "left", padding: "10px 14px",
                    background: isActive ? "rgba(0,212,170,0.08)" : "none",
                    border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "none"; }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: isActive ? "rgba(0,212,170,0.15)" : "rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: isActive ? "#00d4aa" : "#8899aa",
                  }}>
                    {(s.societyName || s.societyIdentifier || "S").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: isActive ? "#00d4aa" : "var(--text-primary)", fontSize: 12, fontWeight: isActive ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.societyName || s.societyIdentifier}
                    </div>
                    <div style={{ color: "#8899aa", fontSize: 10 }}>{s.societyIdentifier}</div>
                  </div>
                  {isActive && <CheckCircle size={13} style={{ color: "#00d4aa", flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AnnouncementDashboard() {
  const {
    announcements: globalData,
    setAnnouncements: setData,
    selectedSociety,
    setSelectedSociety,
    societies: contextSocieties,
  } = useAppContext();

  const [allSocieties, setAllSocieties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [societiesLoading, setSocietiesLoading] = useState(false);

  // Society-filtered announcements fetched from backend
  const [societyAnnouncements, setSocietyAnnouncements] = useState(null);
  const [societyFetchLoading, setSocietyFetchLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [viewItem, setViewItem] = useState(null);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [pendingEditRow, setPendingEditRow] = useState(null);
  const PER = 8;

  // ── Fetch societies list ─────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setSocietiesLoading(true);
      try {
        const res = await getAllSocietyApi();
        const list = res?.data?.data || res?.data || [];
        setAllSocieties(list);
      } catch (err) {
        // Fallback to context societies
        if (contextSocieties?.length > 0) {
          setAllSocieties(contextSocieties.map(s => ({
            societyIdentifier: s.societyIdentifier || s.id,
            societyName: s.societyName || s.name || s.societyIdentifier,
          })));
        }
      } finally {
        setSocietiesLoading(false);
      }
    })();
  }, []);

  // ── Fetch properties for form cascade ───────────────────────────────────
  useEffect(() => {
    (async () => {
      setPropertiesLoading(true);
      try {
        const res = await getAllPropertyApi();
        const list = res?.data?.data || res?.data || [];
        setAllProperties(list);
      } catch (err) {
        console.warn("[Properties] fetch failed:", err?.message);
      } finally {
        setPropertiesLoading(false);
      }
    })();
  }, []);

  // ── When selectedSociety changes, fetch that society's announcements ─────
  useEffect(() => {
    if (!selectedSociety) {
      setSocietyAnnouncements(null);
      return;
    }
    (async () => {
      setSocietyFetchLoading(true);
      try {
        const res = await getAnnouncementsOfSocietyApi(selectedSociety.societyIdentifier);
        const arr = res?.data?.data || res?.data || [];
        // Normalize data
        const mapped = arr.map((item, i) => ({
          id: item.announcementIdentifier || item.id || item._id || i + 1,
          announcementIdentifier: item.announcementIdentifier || `ANN-${String(i + 1).padStart(3, "0")}`,
          society: item.society ? (item.society.societyName || item.society.societyIdentifier) : (item.societyIdentifier || ""),
          societyIdentifier: item.society?.societyIdentifier || item.societyIdentifier || "",
          name: item.announcementName || item.title || item.name || "",
          announcementName: item.announcementName || item.title || item.name || "",
          type: item.type || item.category || "General",
          startDate: item.startDate || item.start_date || "",
          validDate: item.validDate || item.valid_date || item.validTill || "",
          message: item.message || item.content || item.description || "",
          content: item.message || item.content || item.description || "",
          towerIdentifier: item.tower?.towerIdentifier || item.towerIdentifier || "",
          wingIdentifier: item.wing?.wingIdentifier || item.wingIdentifier || "",
          propertyIdentifier: item.property?.propertyIdentifier || item.propertyIdentifier || "",
          wing: item.wing || null,
          announcementFilePath: item.announcementFilePath || item.filePath || "",
        }));
        setSocietyAnnouncements(mapped);
      } catch (err) {
        console.warn("[SocietyAnnouncements] fetch failed:", err?.message);
        // Fallback: filter globalData by society
        setSocietyAnnouncements(
          (globalData || []).filter(d =>
            (d.societyIdentifier || "").toLowerCase() === selectedSociety.societyIdentifier.toLowerCase() ||
            (typeof d.society === "string" ? d.society : d.society?.societyName || d.society?.societyIdentifier || "")
              .toLowerCase().includes((selectedSociety.societyName || "").toLowerCase())
          )
        );
      } finally {
        setSocietyFetchLoading(false);
      }
    })();
  }, [selectedSociety]);

  // ── If add modal is open and selectedSociety changes, auto-update form ──
  useEffect(() => {
    if (modal !== "add") return;
    const today = new Date().toISOString().split("T")[0];
    if (!selectedSociety) {
      setForm({ ...emptyForm, startDate: today });
    } else {
      setForm(prev => ({
        ...prev,
        societyIdentifier: selectedSociety.societyIdentifier || "",
        societyName: selectedSociety.societyName || "",
        towerIdentifier: "",
        wingIdentifier: "",
        propertyIdentifier: "",
      }));
    }
  }, [selectedSociety, modal]);

  // Once properties loaded, resolve pending edit
  useEffect(() => {
    if (!propertiesLoading && allProperties.length > 0 && pendingEditRow) {
      applyEditForm(pendingEditRow);
      setPendingEditRow(null);
    }
  }, [propertiesLoading, allProperties, pendingEditRow]);

  // ── Active data = society-filtered OR global ────────────────────────────
  const activeData = selectedSociety
    ? (societyAnnouncements || [])
    : (globalData || []);

  // ── Cascading form options ───────────────────────────────────────────────
  const towerOptions = (() => {
    if (!form.societyIdentifier) return [];
    const map = new Map();
    allProperties
      .filter(p => (p.societyIdentifier || p.society?.societyIdentifier || "").trim() === form.societyIdentifier)
      .forEach(p => {
        const tId = p.wing?.towerIdentifier;
        if (tId && !map.has(tId)) map.set(tId, tId);
      });
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  })();

  const wingOptions = (() => {
    if (!form.societyIdentifier || !form.towerIdentifier) return [];
    const map = new Map();
    allProperties
      .filter(p =>
        (p.societyIdentifier || p.society?.societyIdentifier || "").trim() === form.societyIdentifier &&
        p.wing?.towerIdentifier === form.towerIdentifier
      )
      .forEach(p => {
        const wId = p.wing?.wingIdentifier;
        const wName = p.wing?.wingName || wId;
        if (wId && !map.has(wId)) map.set(wId, wName);
      });
    return [...map.entries()].map(([value, label]) => ({ value, label: `${label} (${value})` }));
  })();

  const propertyOptions = (() => {
    if (!form.societyIdentifier || !form.towerIdentifier || !form.wingIdentifier) return [];
    return allProperties
      .filter(p =>
        (p.societyIdentifier || p.society?.societyIdentifier || "").trim() === form.societyIdentifier &&
        p.wing?.towerIdentifier === form.towerIdentifier &&
        p.wing?.wingIdentifier === form.wingIdentifier &&
        p.propertyIdentifier
      )
      .map(p => ({ value: p.propertyIdentifier, label: p.propertyName || p.propertyIdentifier }));
  })();

  const onTowerChange = val => setForm(f => ({ ...f, towerIdentifier: val, wingIdentifier: "", propertyIdentifier: "" }));
  const onWingChange = val => setForm(f => ({ ...f, wingIdentifier: val, propertyIdentifier: "" }));
  const onPropertyChange = val => setForm(f => ({ ...f, propertyIdentifier: val }));

  // ── Row helpers ──────────────────────────────────────────────────────────
  const getName = r => r.announcementName || r.name || "";
  const getSociety = r => (typeof r.society === "object" ? r.society?.societyName : r.society) || r.societyIdentifier || "";
  const getType = r => r.type || r.category || "General";
  const getStartDate = r => r.startDate || r.start_date || "";
  const getValidDate = r => r.validDate || r.valid_date || r.validTill || "";
  const getContent = r => r.message || r.content || r.description || "";
  const getIdentifier = r => r.announcementIdentifier || r.id || r._id || "";

  const filtered = activeData.filter(d => {
    const q = search.toLowerCase();
    return getName(d).toLowerCase().includes(q) ||
           getIdentifier(d).toLowerCase().includes(q) ||
           getSociety(d).toLowerCase().includes(q);
  });
  const paged = filtered.slice((page - 1) * PER, page * PER);

  // ── Edit form setup ──────────────────────────────────────────────────────
  const applyEditForm = (row) => {
    const societyId = (
      row.society?.societyIdentifier ||
      row.societyIdentifier ||
      (typeof row.society === "string" ? row.society : "") ||
      ""
    ).trim();

    const societyObj = allSocieties.find(s => s.societyIdentifier === societyId);

    setForm({
      id: getIdentifier(row),
      announcementIdentifier: getIdentifier(row),
      societyIdentifier: societyId,
      societyName: societyObj?.societyName || societyId,
      towerIdentifier: row.tower?.towerIdentifier || row.towerIdentifier || row.wing?.towerIdentifier || "",
      wingIdentifier: row.wing?.wingIdentifier || row.wingIdentifier || "",
      propertyIdentifier: row.property?.propertyIdentifier || row.propertyIdentifier || "",
      announcementName: getName(row),
      message: getContent(row),
      startDate: toInputDate(getStartDate(row)),
      validDate: toInputDate(getValidDate(row)),
      announcementFilePath: row.announcementFilePath || row.filePath || row.file_path || "",
      announcementFile: null,
    });
    setModal("edit");
  };

  const openEditModal = (row) => {
    if (propertiesLoading || allProperties.length === 0) {
      setPendingEditRow(row);
      setModal("edit");
      setForm({
        ...emptyForm,
        id: getIdentifier(row),
        announcementIdentifier: getIdentifier(row),
        announcementName: getName(row),
        message: getContent(row),
        startDate: toInputDate(getStartDate(row)),
        validDate: toInputDate(getValidDate(row)),
      });
    } else {
      applyEditForm(row);
    }
  };

  // ── Open Add modal — auto-fill society + today's start date ─────────────
  const openAddModal = () => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    if (selectedSociety) {
      setForm({
        ...emptyForm,
        societyIdentifier: selectedSociety.societyIdentifier || "",
        societyName: selectedSociety.societyName || "",
        startDate: today,
      });
    } else {
      setForm({ ...emptyForm, startDate: today });
    }
    setModal("add");
  };

  // ── Society change in form ───────────────────────────────────────────────
  const onFormSocietyChange = (societyObj) => {
    if (!societyObj) {
      setForm(f => ({ ...f, societyIdentifier: "", societyName: "", towerIdentifier: "", wingIdentifier: "", propertyIdentifier: "" }));
    } else {
      setForm(f => ({
        ...f,
        societyIdentifier: societyObj.societyIdentifier || "",
        societyName: societyObj.societyName || societyObj.societyIdentifier || "",
        towerIdentifier: "",
        wingIdentifier: "",
        propertyIdentifier: "",
      }));
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const save = async () => {
    if (!form.societyIdentifier) {
      setActionError("Society is required.");
      return;
    }
    if (!form.announcementName || !form.startDate || !form.validDate) {
      setActionError("Announcement Name, Start Date and Valid Date are required.");
      return;
    }
    setActionLoading(true);
    setActionError(null);

    const payload = {
      societyIdentifier: form.societyIdentifier,
      announcementName: form.announcementName,
      message: form.message || "",
      startDate: form.startDate,
      validDate: form.validDate,
      towerIdentifier: form.towerIdentifier || "",
      wingIdentifier: form.wingIdentifier || "",
      propertyIdentifier: form.propertyIdentifier || "",
      ...(form.announcementFile && { announcementFile: form.announcementFile }),
    };

    try {
      const editId = getIdentifier(form);
      if (editId) {
        await updateAnnouncementApi(payload, editId);
        const updater = d => d.map(r => getIdentifier(r) === editId
          ? { ...r, ...payload, announcementName: form.announcementName, message: form.message }
          : r
        );
        setData(updater);
        if (societyAnnouncements) setSocietyAnnouncements(updater);
      } else {
        const res = await createAnnouncementApi(payload);
        const realId =
          res?.data?.data?.id ||
          res?.data?.data?.announcementIdentifier ||
          res?.data?.id ||
          res?.data?.announcementIdentifier ||
          `local_${Date.now()}`;
        const newEntry = {
          id: realId, announcementIdentifier: realId,
          annId: `ANN-${String(activeData.length + 1).padStart(3, "0")}`,
          ...payload,
          societyName: form.societyName,
          society: form.societyName || form.societyIdentifier,
        };
        setData(d => [...d, newEntry]);
        if (societyAnnouncements) setSocietyAnnouncements(d => [...(d || []), newEntry]);
      }
      setModal(null);
    } catch (err) {
      console.warn("[Announcement Save] backend error:", err?.message);
      setActionError("Backend save failed. UI updated locally.");
      setModal(null);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (row) => {
    if (!window.confirm(`Delete announcement "${getName(row)}"?`)) return;
    setActionLoading(true);
    const deleteId = getIdentifier(row);
    try {
      await deleteAnnouncementApi(deleteId);
    } catch (err) {
      console.warn("[Announcement Delete]:", err?.message);
      setActionError("Backend delete failed. Removed from UI only.");
    } finally {
      setData(d => d.filter(r => getIdentifier(r) !== deleteId));
      if (societyAnnouncements) setSocietyAnnouncements(d => (d || []).filter(r => getIdentifier(r) !== deleteId));
      setActionLoading(false);
    }
  };

  // Selected society object matching allSocieties (for form search engine)
  const formSocietyObj = form.societyIdentifier
    ? (allSocieties.find(s => s.societyIdentifier === form.societyIdentifier) || { societyIdentifier: form.societyIdentifier, societyName: form.societyName || form.societyIdentifier })
    : null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 28 }}>
      {actionError && (
        <div style={{ background: "rgba(255,107,107,0.15)", border: "1px solid #ff6b6b", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#ff6b6b", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ {actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: 18 }}>×</button>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Announcements</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Broadcast notices and updates to residents</p>
        </div>
        <button
          onClick={openAddModal}
          style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#1a2a4a,#162040)", border: "1px solid rgba(255,179,71,0.3)", borderRadius: 10, padding: "10px 18px", color: "#e8edf5", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          <Plus size={15} /> Add Announcement
        </button>
      </div>

      {/* ── Society Search Engine ────────────────────────────────────────── */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={14} style={{ color: "#00d4aa" }} />
            <span style={{ color: "#00d4aa", fontWeight: 700, fontSize: 12, letterSpacing: "0.5px" }}>SOCIETY FILTER</span>
          </div>
          {selectedSociety && (
            <span style={{ color: "#8899aa", fontSize: 11 }}>
              {societyFetchLoading ? "⏳ Loading..." : `${activeData.length} announcement${activeData.length !== 1 ? "s" : ""} found`}
            </span>
          )}
        </div>
        <SocietySearchEngine
          societies={allSocieties}
          selectedSociety={selectedSociety}
          onSelect={(s) => {
            setSelectedSociety(s);
            setPage(1);
            setSearch("");
          }}
          loading={societiesLoading || societyFetchLoading}
        />
        {selectedSociety && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.15)", borderRadius: 8, fontSize: 12, color: "#8899aa" }}>
            Showing announcements for <strong style={{ color: "#00d4aa" }}>{selectedSociety.societyName || selectedSociety.societyIdentifier}</strong>
            {" "}({selectedSociety.societyIdentifier}) · When you add a new announcement, this society will be pre-selected.
          </div>
        )}
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid rgba(255,179,71,0.22)", borderRadius: 12, padding: 14, textAlign: "center" }}>
          <p style={{ color: "#ffb347", fontSize: 22, fontWeight: 700 }}>{activeData.length}</p>
          <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, marginTop: 2 }}>
            {selectedSociety ? "THIS SOCIETY" : "TOTAL"}
          </p>
        </div>
        {Object.entries(
          activeData.reduce((acc, d) => {
            const t = getType(d);
            acc[t] = (acc[t] || 0) + 1;
            return acc;
          }, {})
        ).slice(0, 5).map(([type, count]) => {
          const c = typeConfig[type] || { color: "#8899aa", bg: "rgba(136,153,170,0.12)" };
          return (
            <div key={type} style={{ background: "var(--bg-card)", border: `1px solid ${c.color}22`, borderRadius: 12, padding: 14, textAlign: "center" }}>
              <p style={{ color: c.color, fontSize: 22, fontWeight: 700 }}>{count}</p>
              <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, marginTop: 2 }}>{type.toUpperCase()}</p>
            </div>
          );
        })}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ffb347", fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 3, height: 16, background: "#ffb347", borderRadius: 2 }} />
            LIST OF ANNOUNCEMENTS
            {selectedSociety && (
              <span style={{ color: "#00d4aa", fontSize: 11, fontWeight: 500, marginLeft: 6 }}>
                — {selectedSociety.societyName || selectedSociety.societyIdentifier}
              </span>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search announcements..."
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px 8px 32px", color: "var(--text-primary)", fontSize: 13, outline: "none", width: 200 }}
            />
          </div>
        </div>

        {/* Loading overlay */}
        {societyFetchLoading && (
          <div style={{ padding: "20px", textAlign: "center", color: "#8899aa", fontSize: 13, background: "rgba(0,212,170,0.03)" }}>
            <RefreshCw size={14} style={{ marginRight: 6, display: "inline-block", animation: "spin 1s linear infinite" }} />
            Loading announcements for {selectedSociety?.societyName}...
          </div>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["S.No", "Announcement Id", "Society", "Announcement Name", "Type", "Start Date", "Valid Date", "Action"].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => {
              const tc = typeConfig[getType(row)] || { color: "#8899aa", bg: "rgba(136,153,170,0.12)" };
              return (
                <tr key={getIdentifier(row)} style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{(page - 1) * PER + i + 1}</td>
                  <td style={{ padding: "12px 14px", color: "#ffb347", fontWeight: 600, fontSize: 12 }}>{row.annId || getIdentifier(row)}</td>
                  <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{getSociety(row)}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Megaphone size={13} style={{ color: tc.color, flexShrink: 0 }} />
                      <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}>{getName(row)}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ background: tc.bg, color: tc.color, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{getType(row)}</span>
                  </td>
                  <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{getStartDate(row)}</td>
                  <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{getValidDate(row)}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => { setViewItem(row); setModal("view"); }}
                        style={{ background: "rgba(0,180,216,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#00b4d8", cursor: "pointer" }}><Eye size={12} /></button>
                      <button onClick={() => openEditModal(row)}
                        style={{ background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#6c63ff", cursor: "pointer" }}><Edit2 size={12} /></button>
                      <button onClick={() => handleDelete(row)} disabled={actionLoading}
                        style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#ff6b6b", cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.6 : 1 }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {paged.length === 0 && !societyFetchLoading && (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#8899aa" }}>
                {selectedSociety ? `No announcements found for ${selectedSociety.societyName || selectedSociety.societyIdentifier}` : "No announcements found"}
              </td></tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {(modal === "add" || modal === "edit") && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "92vh", overflow: "auto" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>{modal === "edit" ? "Edit Announcement" : "Add Announcement"}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ padding: 22 }}>
              {(propertiesLoading || pendingEditRow) && (
                <p style={{ color: "#8899aa", fontSize: 12, marginBottom: 12 }}>⏳ Loading dropdown data…</p>
              )}

              {/* 1. Society — Search Engine */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ ...labelStyle }}>
                  Society <span style={{ color: "#ff6b6b" }}>*</span>
                </label>
                <SocietySearchEngine
                  societies={allSocieties}
                  selectedSociety={formSocietyObj}
                  onSelect={onFormSocietyChange}
                  loading={societiesLoading}
                />
              </div>

              {/* 2. Tower */}
              <DD
                label="Tower"
                options={towerOptions}
                value={form.towerIdentifier}
                onChange={onTowerChange}
                placeholder={!form.societyIdentifier ? "Select Society first" : towerOptions.length === 0 ? "No towers available" : "-- Select Tower --"}
                disabled={!form.societyIdentifier || towerOptions.length === 0}
                hint={!form.societyIdentifier ? "(select society first)" : ""}
              />

              {/* 3. Wing */}
              <DD
                label="Wing"
                options={wingOptions}
                value={form.wingIdentifier}
                onChange={onWingChange}
                placeholder={!form.towerIdentifier ? "Select Tower first" : wingOptions.length === 0 ? "No wings available" : "-- Select Wing --"}
                disabled={!form.towerIdentifier || wingOptions.length === 0}
                hint={!form.towerIdentifier ? "(select tower first)" : ""}
              />

              {/* 4. Property */}
              <DD
                label="Property"
                options={propertyOptions}
                value={form.propertyIdentifier}
                onChange={onPropertyChange}
                placeholder={!form.wingIdentifier ? "Select Wing first" : propertyOptions.length === 0 ? "No properties available" : "-- Select Property --"}
                disabled={!form.wingIdentifier || propertyOptions.length === 0}
                hint={!form.wingIdentifier ? "(select wing first)" : ""}
              />

              {/* Announcement Name */}
              <F label="Announcement Name" field="announcementName" form={form} setForm={setForm} required />

              {/* Message */}
              <F label="Message" field="message" area form={form} setForm={setForm} />

              {/* Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <F label="Start Date" field="startDate" type="date" form={form} setForm={setForm} required />
                <F label="Valid Date" field="validDate" type="date" form={form} setForm={setForm} required />
              </div>

              {/* File */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>
                  Announcement File
                  {modal === "edit" && form.announcementFilePath && (
                    <span style={{ marginLeft: 8, fontWeight: 400 }}>
                      (current:&nbsp;
                      <a href={form.announcementFilePath} target="_blank" rel="noreferrer" style={{ color: "#00b4d8", textDecoration: "underline" }}>
                        {form.announcementFilePath.split("/").pop()}
                      </a>
                      )
                    </span>
                  )}
                </label>
                {modal === "edit" && form.announcementFilePath && (
                  <p style={{ fontSize: 11, color: "#8899aa", marginBottom: 6 }}>
                    Leave empty to keep existing file, or choose a new file to replace it.
                  </p>
                )}
                <input type="file" accept="image/*,application/pdf"
                  onChange={e => setForm(f => ({ ...f, announcementFile: e.target.files?.[0] || null }))}
                  style={{ ...inputStyle, padding: "7px 12px", cursor: "pointer" }} />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button onClick={() => setModal(null)}
                  style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer" }}>Cancel</button>
                <button onClick={save} disabled={actionLoading}
                  style={{ background: "linear-gradient(135deg,#ffb347,#ff6b6b)", border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.7 : 1 }}>
                  {actionLoading ? "Saving…" : modal === "edit" ? "Update" : "Publish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View Modal ───────────────────────────────────────────────────── */}
      {modal === "view" && viewItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 460 }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>Announcement Details</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ background: typeConfig[getType(viewItem)]?.bg || "rgba(255,179,71,0.08)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ color: typeConfig[getType(viewItem)]?.color || "#ffb347", fontWeight: 700, fontSize: 15 }}>{getName(viewItem)}</span>
                  <span style={{ background: typeConfig[getType(viewItem)]?.bg, color: typeConfig[getType(viewItem)]?.color, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{getType(viewItem)}</span>
                </div>
                <p style={{ color: "#8899aa", fontSize: 13, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: getContent(viewItem) }} />
              </div>
              {[
                ["ID", getIdentifier(viewItem)],
                ["Society", getSociety(viewItem)],
                ["Tower ID", viewItem.wing?.towerIdentifier || viewItem.towerIdentifier || ""],
                ["Wing", viewItem.wing?.wingName ? `${viewItem.wing.wingName} (${viewItem.wing.wingIdentifier})` : viewItem.wingIdentifier || ""],
                ["Property", viewItem.propertyIdentifier || ""],
                ["Start Date", getStartDate(viewItem)],
                ["Valid Until", getValidDate(viewItem)],
              ].map(([k, v]) => v ? (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "#8899aa", fontSize: 13 }}>{k}</span>
                  <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{v}</span>
                </div>
              ) : null)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
