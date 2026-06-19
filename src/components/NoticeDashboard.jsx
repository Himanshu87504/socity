import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  Pin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useAppContext } from "../AppContext";
import { getAllSocietyApi } from "api/society-api";
import { getAllPropertyApi } from "api/property-api";
import { deleteNoticeApi, updateNoticeApi, createNoticeApi } from "../api/notice-api";

const NOTICE_TYPES = ["General", "Legal", "Financial", "Safety", "Maintenance", "Meeting"];
const PRIORITIES = ["Normal", "Important", "Urgent"];

const typeConfig = {
  General: { color: "#00b4d8", bg: "rgba(0,180,216,0.12)" },
  Legal: { color: "#ff6b6b", bg: "rgba(255,107,107,0.12)" },
  Financial: { color: "#00d4aa", bg: "rgba(0,212,170,0.12)" },
  Safety: { color: "#ffb347", bg: "rgba(255,179,71,0.12)" },
  Maintenance: { color: "#6c63ff", bg: "rgba(108,99,255,0.12)" },
  Meeting: { color: "#ff9f43", bg: "rgba(255,159,67,0.12)" },
};

const priorityConfig = {
  Normal: { color: "#8899aa", bg: "rgba(136,153,170,0.12)" },
  Important: { color: "#ffb347", bg: "rgba(255,179,71,0.12)" },
  Urgent: { color: "#ff6b6b", bg: "rgba(255,107,107,0.12)" },
};

const emptyForm = {
  societyIdentifier: "",
  societyName: "",
  propertyIdentifier: "",
  propertyName: "",
  towerIdentifier: "",
  wingIdentifier: "",
  title: "",
  type: "General",
  priority: "Normal",
  date: "",
  expiry: "",
  pinned: false,
  content: "",
  noticeFile: null,
};

const NtcFI = ({ label, field, type = "text", area, form, setForm }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>{label}</label>
    {area ? (
      <textarea
        value={form[field] || ""}
        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
        rows={3}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          padding: "9px 12px",
          color: "var(--text-primary)",
          fontSize: 13,
          outline: "none",
          resize: "vertical",
        }}
      />
    ) : (
      <input
        type={type}
        value={form[field] || ""}
        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          padding: "9px 12px",
          color: "var(--text-primary)",
          fontSize: 13,
          outline: "none",
        }}
      />
    )}
  </div>
);

const NtcFS = ({ label, field, options, form, setForm }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>{label}</label>
    <select
      value={form[field] || ""}
      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
      style={{
        width: "100%",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        padding: "9px 12px",
        color: "var(--text-primary)",
        fontSize: 13,
        outline: "none",
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);

const fmtNum = (n) => Number(n || 0).toLocaleString("en-IN");

const Pagination = ({ page, total, perPage, onChange }) => {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const visiblePages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) visiblePages.push(i);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 20px",
        borderTop: "1px solid var(--border)",
      }}
    >
      <span style={{ color: "#8899aa", fontSize: 12 }}>
        Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}–
        {Math.min(page * perPage, total)} of {fmtNum(total)}
      </span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button
          onClick={() => onChange(1)}
          disabled={page === 1}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "4px 8px",
            color: page === 1 ? "#556677" : "#8899aa",
            cursor: page === 1 ? "not-allowed" : "pointer",
          }}
        >
          <ChevronsLeft size={12} />
        </button>
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "4px 8px",
            color: page === 1 ? "#556677" : "#8899aa",
            cursor: page === 1 ? "not-allowed" : "pointer",
          }}
        >
          <ChevronLeft size={12} />
        </button>

        {visiblePages.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            style={{
              background: p === page ? "#00d4aa" : "none",
              border: `1px solid ${p === page ? "#00d4aa" : "var(--border)"}`,
              borderRadius: 6,
              padding: "4px 10px",
              color: p === page ? "#000" : "#8899aa",
              fontWeight: p === page ? 700 : 400,
              cursor: "pointer",
              fontSize: 12,
              minWidth: 30,
            }}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page === pages}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "4px 8px",
            color: page === pages ? "#556677" : "#8899aa",
            cursor: page === pages ? "not-allowed" : "pointer",
          }}
        >
          <ChevronRight size={12} />
        </button>
        <button
          onClick={() => onChange(pages)}
          disabled={page === pages}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "4px 8px",
            color: page === pages ? "#556677" : "#8899aa",
            cursor: page === pages ? "not-allowed" : "pointer",
          }}
        >
          <ChevronsRight size={12} />
        </button>
      </div>
    </div>
  );
};

const normalize = (v) => (v ?? "").toString().trim().toLowerCase();

const formatToDDMMYYYY = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
};

export default function NoticeDashboard() {
  const { notices: data, setNotices: setData } = useAppContext();

  const [societies, setSocieties] = useState([]);
  const [societiesLoading, setSocietiesLoading] = useState(false);
  const [societiesError, setSocietiesError] = useState("");

  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesError, setPropertiesError] = useState("");

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [viewItem, setViewItem] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const PER = 8;
  const activeData = data || [];

  useEffect(() => {
    let mounted = true;

    const loadSocieties = async () => {
      setSocietiesLoading(true);
      setSocietiesError("");
      try {
        const res = await getAllSocietyApi();
        const list = res?.data?.data || [];
        if (mounted) setSocieties(Array.isArray(list) ? list : []);
      } catch (err) {
        if (mounted) setSocietiesError(err?.message || "Failed to load societies");
      } finally {
        if (mounted) setSocietiesLoading(false);
      }
    };

    loadSocieties();
    return () => {
      mounted = false;
    };
  }, []);

  const loadProperties = async (societyIdentifier, wingIdentifier = "") => {
    if (!societyIdentifier) {
      setProperties([]);
      return;
    }
    setPropertiesLoading(true);
    setPropertiesError("");
    try {
      const res = await getAllPropertyApi(wingIdentifier || "", societyIdentifier || "");
      const list = res?.data?.data || [];
      setProperties(Array.isArray(list) ? list : []);
    } catch (err) {
      setPropertiesError(err?.message || "Failed to load properties");
      setProperties([]);
    } finally {
      setPropertiesLoading(false);
    }
  };

  useEffect(() => {
    const sid = form.societyIdentifier;
    if (!sid) {
      setProperties([]);
      return;
    }
    loadProperties(sid, "");
  }, [form.societyIdentifier]);

  const selectedSociety = useMemo(() => {
    return societies.find(
      (s) =>
        normalize(s.societyIdentifier) === normalize(form.societyIdentifier) ||
        normalize(s.societyName) === normalize(form.societyName) ||
        normalize(s.societyShortName) === normalize(form.societyName)
    );
  }, [societies, form.societyIdentifier, form.societyName]);

  const selectedProperty = useMemo(() => {
    return properties.find(
      (p) =>
        normalize(p.propertyIdentifier) === normalize(form.propertyIdentifier) ||
        normalize(p.propertyName) === normalize(form.propertyName)
    );
  }, [properties, form.propertyIdentifier, form.propertyName]);

  const societyOptions = societies.map((s) => ({
    label: `${s.societyName} (${s.societyIdentifier})`,
    value: s.societyIdentifier,
  }));

  const propertyOptions = properties.map((p) => ({
    label: `${p.propertyName || "Property"} (${p.propertyIdentifier || "-"})`,
    value: p.propertyIdentifier,
  }));

  const towerOptions = useMemo(() => {
    const map = new Map();
    properties.forEach((p) => {
      const towerIdentifier = p?.wing?.towerIdentifier || p?.towerIdentifier || "";
      if (towerIdentifier && !map.has(towerIdentifier)) {
        map.set(towerIdentifier, {
          towerIdentifier,
          label: towerIdentifier,
        });
      }
    });
    return Array.from(map.values());
  }, [properties]);

  const wingOptions = useMemo(() => {
    const map = new Map();
    properties.forEach((p) => {
      const wingIdentifier = p?.wing?.wingIdentifier || p?.wingIdentifier || "";
      if (wingIdentifier && !map.has(wingIdentifier)) {
        map.set(wingIdentifier, {
          wingIdentifier,
          label: `${p?.wing?.wingName || wingIdentifier}`,
          towerIdentifier: p?.wing?.towerIdentifier || p?.towerIdentifier || "",
        });
      }
    });
    return Array.from(map.values());
  }, [properties]);

  const filtered = useMemo(() => {
    return activeData.filter((d) => {
      const title = (d.title || d.noticeSubject || "").toLowerCase();
      const noticeId = (d.noticeId || "").toLowerCase();
      const matchSearch = title.includes(search.toLowerCase()) || noticeId.includes(search.toLowerCase());
      const matchType = filterType === "All" || d.type === filterType;
      return matchSearch && matchType;
    });
  }, [activeData, search, filterType]);

  const pinned = filtered.filter((d) => d.pinned);
  const sorted = [...pinned, ...filtered.filter((d) => !d.pinned)];
  const paged = sorted.slice((page - 1) * PER, page * PER);

  const syncIdentifiersFromSociety = async (societyIdentifier) => {
    const soc = societies.find((s) => normalize(s.societyIdentifier) === normalize(societyIdentifier));
    setForm((f) => ({
      ...f,
      societyIdentifier: soc?.societyIdentifier || societyIdentifier || "",
      societyName: soc?.societyName || soc?.societyShortName || "",
      propertyIdentifier: "",
      propertyName: "",
      towerIdentifier: "",
      wingIdentifier: "",
    }));
    if (societyIdentifier) {
      await loadProperties(societyIdentifier, "");
    }
  };

  const syncIdentifiersFromProperty = (propertyIdentifier) => {
    const prop = properties.find((p) => normalize(p.propertyIdentifier) === normalize(propertyIdentifier));
    const wing = prop?.wing || {};
    setForm((f) => ({
      ...f,
      propertyIdentifier: prop?.propertyIdentifier || "",
      propertyName: prop?.propertyName || "",
      towerIdentifier: wing?.towerIdentifier || prop?.towerIdentifier || "",
      wingIdentifier: wing?.wingIdentifier || prop?.wingIdentifier || "",
      societyIdentifier: prop?.societyIdentifier || f.societyIdentifier || "",
      societyName: prop?.societyName || prop?.society?.societyName || f.societyName || "",
    }));
  };

  const syncIdentifiersFromWing = (wingIdentifier) => {
    const wing = wingOptions.find((w) => normalize(w.wingIdentifier) === normalize(wingIdentifier));
    const prop = properties.find((p) => normalize(p?.wing?.wingIdentifier || p?.wingIdentifier) === normalize(wingIdentifier));
    setForm((f) => ({
      ...f,
      wingIdentifier: wing?.wingIdentifier || "",
      towerIdentifier: wing?.towerIdentifier || prop?.wing?.towerIdentifier || prop?.towerIdentifier || "",
      propertyIdentifier: prop?.propertyIdentifier || f.propertyIdentifier || "",
      propertyName: prop?.propertyName || f.propertyName || "",
      societyIdentifier: prop?.societyIdentifier || f.societyIdentifier || "",
      societyName: prop?.societyName || prop?.society?.societyName || f.societyName || "",
    }));
  };

  const save = async () => {
    if (!form.title || !form.date) return;

    setActionLoading(true);
    setActionError(null);

    const societyIdentifier =
      selectedSociety?.societyIdentifier ||
      form.societyIdentifier ||
      localStorage.getItem("society_identifier") ||
      localStorage.getItem("societyId") ||
      "";

    try {
      if (form.id) {
  await updateNoticeApi(
    {
      title: form.title,
      subject: form.title,
      category: form.type,
      urgency: form.priority,
      notice_date: form.date,
      expiry_date: form.expiry,
      is_pinned: form.pinned || false,
      message: form.content,
      society_identifier: societyIdentifier,
      property_identifier: form.propertyIdentifier || "",
      towerIdentifier: form.towerIdentifier || "",   // ✅ camelCase
      wingIdentifier: form.wingIdentifier || "",     // ✅ camelCase
    },
    form.id
  );

        setData((d) => d.map((r) => (r.id === form.id ? { ...r, ...form, societyIdentifier } : r)));
      } else {
        const fd = new FormData();
        fd.append("societyIdentifier", societyIdentifier);
        fd.append("noticeSubject", form.title);
        fd.append("message", form.content || "");
        fd.append("startDate", form.date);
        fd.append("validDate", form.expiry);
        fd.append("noticeType", (form.type || "General").toLowerCase());
        fd.append("propertyIdentifier", form.propertyIdentifier || "");
        fd.append("towerIdentifier", form.towerIdentifier || "");
        fd.append("wingIdentifier", form.wingIdentifier || "");
        if (form.noticeFile) fd.append("noticeFile", form.noticeFile);

        const res = await createNoticeApi(fd);
        const realId =
          res?.data?.data?.noticeIdentifier ||
          res?.data?.noticeIdentifier ||
          res?.data?.data?.id ||
          Date.now();

        setData((d) => [
          ...d,
          {
            ...form,
            id: realId,
            noticeId: `NOT-00${d.length + 7}`,
            societyIdentifier,
            societyName: selectedSociety?.societyName || form.societyName || "",
          },
        ]);
      }
    } catch (err) {
      alert(err?.response?.data?.message?.[0] || err?.message || "Save failed");
      setActionError("Backend save failed. UI updated locally.");
      if (form.id) setData((d) => d.map((r) => (r.id === form.id ? { ...r, ...form, societyIdentifier } : r)));
      else {
        setData((d) => [
          ...d,
          {
            ...form,
            id: `local_${Date.now()}`,
            noticeId: `NOT-00${d.length + 7}`,
            societyIdentifier,
            societyName: selectedSociety?.societyName || form.societyName || "",
          },
        ]);
      }
    } finally {
      setActionLoading(false);
      setModal(null);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Notice "${row.title}" delete karna chahte hain?`)) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteNoticeApi(row.id);
    } catch (err) {
      setActionError("Backend delete failed. Removed from UI only.");
    } finally {
      setData((d) => d.filter((r) => r.id !== row.id));
      setActionLoading(false);
    }
  };

  const togglePin = (id) => setData((d) => d.map((r) => (r.id === id ? { ...r, pinned: !r.pinned } : r)));

  return (
    <div style={{ padding: 28 }}>
      {actionError && (
        <div style={{ background: "rgba(255,107,107,0.15)", border: "1px solid #ff6b6b", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#ff6b6b", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ {actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Notice</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Official notices and circulars for residents</p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setModal("add");
          }}
          style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#1a2a4a,#162040)", border: "1px solid rgba(255,179,71,0.3)", borderRadius: 10, padding: "10px 18px", color: "#e8edf5", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
        >
          <Plus size={15} /> Add Notice
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {["All", ...NOTICE_TYPES].map((t) => {
          const isActive = filterType === t;
          const c = typeConfig[t];
          return (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              style={{
                background: isActive ? (c ? c.bg : "rgba(255,255,255,0.08)") : "none",
                border: `1px solid ${isActive ? (c ? c.color : "rgba(255,255,255,0.2)") : "rgba(255,255,255,0.08)"}`,
                borderRadius: 20,
                padding: "6px 14px",
                color: isActive ? (c ? c.color : "var(--text-primary)") : "#8899aa",
                fontSize: 12,
                fontWeight: isActive ? 700 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {t}{" "}
              {t !== "All" && <span style={{ opacity: 0.7 }}>({activeData.filter((d) => d.type === t).length})</span>}
            </button>
          );
        })}
      </div>

      {societiesError && <div style={{ color: "#ffb347", marginBottom: 12, fontSize: 13 }}>{societiesError}</div>}
      {propertiesError && <div style={{ color: "#ffb347", marginBottom: 12, fontSize: 13 }}>{propertiesError}</div>}
      {societiesLoading && <div style={{ color: "#8899aa", marginBottom: 12, fontSize: 13 }}>Loading societies...</div>}
      {propertiesLoading && <div style={{ color: "#8899aa", marginBottom: 12, fontSize: 13 }}>Loading properties...</div>}

      {pinned.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 12 }}>
            📌 PINNED NOTICES
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
            {pinned.map((n) => {
              const tc = typeConfig[n.type] || typeConfig.General;
              const pc = priorityConfig[n.priority] || priorityConfig.Normal;
              return (
                <div
                  key={n.id}
                  style={{ background: "var(--bg-card)", border: `1px solid ${tc.color}30`, borderRadius: 14, padding: 18, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = tc.color)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${tc.color}30`)}
                  onClick={() => {
                    setViewItem(n);
                    setModal("view");
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <span style={{ background: tc.bg, color: tc.color, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                      {n.type}
                    </span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ background: pc.bg, color: pc.color, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>
                        {n.priority}
                      </span>
                      <Pin size={12} style={{ color: "#ffb347" }} />
                    </div>
                  </div>
                  <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{n.title}</p>
                  <p style={{ color: "#8899aa", fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>{(n.content || "").slice(0, 80)}...</p>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8899aa" }}>
                    <span>{n.societyName || n.society || n.societyIdentifier}</span>
                    <span>{formatToDDMMYYYY(n.date)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ffb347", fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 3, height: 16, background: "#ffb347", borderRadius: 2 }} />
            ALL NOTICES
          </div>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search notices"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px 8px 32px", color: "var(--text-primary)", fontSize: 13, outline: "none", width: 200 }}
            />
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["S.No", "Notice ID", "Title", "Society", "Type", "Priority", "Date", "Expiry", "Pinned", "Action"].map((h) => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => {
              const tc = typeConfig[row.type] || typeConfig.General;
              const pc = priorityConfig[row.priority] || priorityConfig.Normal;
              return (
                <tr key={row.id} style={{ borderBottom: "1px solid var(--border)", background: row.pinned ? "rgba(255,179,71,0.02)" : "transparent" }}>
                  <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{i + 1}</td>
                  <td style={{ padding: "12px 14px", color: "#ffb347", fontWeight: 600, fontSize: 12 }}>{row.noticeId}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {row.pinned && <Pin size={11} style={{ color: "#ffb347", flexShrink: 0 }} />}
                      <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}>{row.title || row.noticeSubject}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{row.societyName || row.society || row.societyIdentifier}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ background: tc.bg, color: tc.color, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{row.type}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ background: pc.bg, color: pc.color, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{row.priority}</span>
                  </td>
                  <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{formatToDDMMYYYY(row.date)}</td>
                  <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{formatToDDMMYYYY(row.expiry)}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <button
                      onClick={() => togglePin(row.id)}
                      style={{
                        background: row.pinned ? "rgba(255,179,71,0.15)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${row.pinned ? "rgba(255,179,71,0.3)" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: 6,
                        padding: "4px 8px",
                        color: row.pinned ? "#ffb347" : "#8899aa",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {row.pinned ? "📌 Yes" : "No"}
                    </button>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => { setViewItem(row); setModal("view"); }} style={{ background: "rgba(0,180,216,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#00b4d8", cursor: "pointer" }}>
                        <Eye size={12} />
                      </button>
<button onClick={() => {
  setForm({
    ...emptyForm,
    ...row,
    id: row.id,
    title: row.title || row.noticeSubject || "",
    content: row.content || row.message || "",
    date: row.date || row.startDate || "",
    expiry: row.expiry || row.validDate || "",
    type: row.type || row.noticeType || "General",
    noticeFile: null,
  });
  setModal("edit");
}}>                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => handleDelete(row)} disabled={actionLoading} style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#ff6b6b", cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.6 : 1 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {paged.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: 40, textAlign: "center", color: "#8899aa" }}>
                  No notices found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination page={page} total={sorted.length} perPage={PER} onChange={setPage} />
      </div>

      {(modal === "add" || modal === "edit") && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "85vh", overflow: "auto" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>{modal === "edit" ? "Edit Notice" : "Add Notice"}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 22 }}>
              {societiesLoading ? (
                <div style={{ color: "#8899aa", marginBottom: 12 }}>Loading societies...</div>
              ) : (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>Society</label>
                    <select
                      value={form.societyIdentifier || ""}
                      onChange={async (e) => {
                        await syncIdentifiersFromSociety(e.target.value);
                      }}
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        padding: "9px 12px",
                        color: "var(--text-primary)",
                        fontSize: 13,
                        outline: "none",
                      }}
                    >
                      <option value="">Select society</option>
                      {societies.map((s) => (
                        <option key={s.societyIdentifier} value={s.societyIdentifier}>
                          {s.societyName} ({s.societyIdentifier})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>Property</label>
                    <select
                      value={form.propertyIdentifier || ""}
                      onChange={(e) => syncIdentifiersFromProperty(e.target.value)}
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        padding: "9px 12px",
                        color: "var(--text-primary)",
                        fontSize: 13,
                        outline: "none",
                      }}
                    >
                      <option value="">Select property</option>
                      {propertyOptions.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>Tower</label>
                      <select
                        value={form.towerIdentifier || ""}
                        onChange={(e) => setForm((f) => ({ ...f, towerIdentifier: e.target.value }))}
                        style={{
                          width: "100%",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8,
                          padding: "9px 12px",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          outline: "none",
                        }}
                      >
                        <option value="">Select tower</option>
                        {towerOptions.map((t) => (
                          <option key={t.towerIdentifier} value={t.towerIdentifier}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>Wing</label>
                      <select
                        value={form.wingIdentifier || ""}
                        onChange={(e) => syncIdentifiersFromWing(e.target.value)}
                        style={{
                          width: "100%",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8,
                          padding: "9px 12px",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          outline: "none",
                        }}
                      >
                        <option value="">Select wing</option>
                        {wingOptions
                          .filter((w) => !form.towerIdentifier || normalize(w.towerIdentifier) === normalize(form.towerIdentifier))
                          .map((w) => (
                            <option key={w.wingIdentifier} value={w.wingIdentifier}>
                              {w.label} ({w.wingIdentifier})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <NtcFI label="Notice Title *" field="title" form={form} setForm={setForm} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <NtcFS label="Type" field="type" options={NOTICE_TYPES} form={form} setForm={setForm} />
                    <NtcFS label="Priority" field="priority" options={PRIORITIES} form={form} setForm={setForm} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <NtcFI label="Notice Date *" field="date" type="date" form={form} setForm={setForm} />
                    <NtcFI label="Expiry Date" field="expiry" type="date" form={form} setForm={setForm} />
                  </div>
                  <NtcFI label="Content" field="content" area form={form} setForm={setForm} />

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>Attach File (optional)</label>
                    <input
                      type="file"
                      onChange={(e) => setForm((f) => ({ ...f, noticeFile: e.target.files?.[0] || null }))}
                    />
                    {form.noticeFile && (
                      <div style={{ marginTop: 8, color: "#8899aa", fontSize: 12 }}>
                        {form.noticeFile.name}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <input
                  type="checkbox"
                  id="pinned"
                  checked={form.pinned || false}
                  onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
                  style={{ accentColor: "#ffb347", width: 15, height: 15 }}
                />
                <label htmlFor="pinned" style={{ color: "#ffb347", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  📌 Pin this notice
                </label>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setModal(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer" }}>
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={actionLoading || societiesLoading}
                  style={{
                    background: "linear-gradient(135deg,#ffb347,#ff6b6b)",
                    border: "none",
                    borderRadius: 8,
                    padding: "9px 20px",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: actionLoading || societiesLoading ? "not-allowed" : "pointer",
                    opacity: actionLoading || societiesLoading ? 0.7 : 1,
                  }}
                >
                  {actionLoading ? "Saving…" : "Publish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal === "view" && viewItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 480 }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>Notice Details</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ background: `${(typeConfig[viewItem.type] || typeConfig.General).bg}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <span style={{ background: (typeConfig[viewItem.type] || typeConfig.General).bg, color: (typeConfig[viewItem.type] || typeConfig.General).color, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                    {viewItem.type}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span style={{ background: (priorityConfig[viewItem.priority] || priorityConfig.Normal).bg, color: (priorityConfig[viewItem.priority] || priorityConfig.Normal).color, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>
                      {viewItem.priority}
                    </span>
                    {viewItem.pinned && <span style={{ color: "#ffb347", fontSize: 13 }}>📌</span>}
                  </div>
                </div>
                <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{viewItem.title || viewItem.noticeSubject}</p>
                <p style={{ color: "#8899aa", fontSize: 13, lineHeight: 1.6 }}>{viewItem.content}</p>
              </div>

              {[
                ["Notice ID", viewItem.noticeId],
                ["Society", viewItem.societyName || viewItem.society || viewItem.societyIdentifier],
                ["Property", viewItem.propertyName || viewItem.propertyIdentifier],
                ["Tower", viewItem.towerIdentifier],
                ["Wing", viewItem.wingIdentifier],
                ["Date", formatToDDMMYYYY(viewItem.date)],
                ["Expiry", formatToDDMMYYYY(viewItem.expiry)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "#8899aa", fontSize: 13 }}>{k}</span>
                  <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}