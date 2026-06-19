// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Building2, FileText, AlertCircle, Receipt, Wallet, TrendingUp, Bell, Search, ChevronDown, RefreshCw, Eye, ArrowRight } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import StatCard from "./StatCard";
import { dashboardStats, monthlyBillingData, societyBreakdown, receiptTrend, paymentModeData } from "../data";
import { useAppContext } from "../AppContext";

const fmt = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;
const fmtFull = (n) => `₹${n.toLocaleString("en-IN")}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tt-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value >= 1000 ? fmt(p.value) : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

// Theme-aware tooltip for PieChart
const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip" style={{ minWidth: 110 }}>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.payload.color, margin: 0, fontWeight: 600, fontSize: 13 }}>
            {p.name}: <span style={{ color: 'var(--text-primary)' }}>{p.value}%</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StatusBadge = ({ status }) => {
  const map = {
    Paid: { cls: "badge-paid", label: "Paid" },
    Pending: { cls: "badge-pending", label: "Pending" },
    Overdue: { cls: "badge-overdue", label: "Overdue" },
    Unpaid: { cls: "badge-pending", label: "Unpaid" },
  };
  const { cls, label } = map[status] || { cls: "badge-pending", label: status };
  return <span className={`status-badge ${cls}`}>{label}</span>;
};

const THEMES_LIST = [
  { id: "dark", label: "Dark", a: "#0d1117", b: "#00d4aa" },
  { id: "light", label: "Light", a: "#f0f4f8", b: "#00d4aa" },
  { id: "ocean", label: "Ocean", a: "#020c1b", b: "#64ffda" },
  { id: "forest", label: "Forest", a: "#0b1a0e", b: "#4ade80" },
  { id: "sunset", label: "Sunset", a: "#1a0a0a", b: "#fb923c" },
  { id: "rose", label: "Rose", a: "#1a0d12", b: "#fb7185" },
  { id: "midnight", label: "Midnight", a: "#07080f", b: "#818cf8" },
  { id: "nord", label: "Nord", a: "#2e3440", b: "#88c0d0" },
];

const ROLE_COLORS = {
  "Super Admin": "#00d4aa",
  "Billing Manager": "#6c63ff",
  "Tenant Manager": "#00b4d8",
  "Facility Manager": "#ffb347",
  "Loans Officer": "#ff6b6b",
};

const typeColorMap = {
  Urgent: "#ff6b6b",
  Event: "#6c63ff",
  Finance: "#00d4aa",
  Holiday: "#ff9f43",
  Maintenance: "#ffb347",
  General: "#00b4d8",
  Meeting: "#6c63ff",
  Safety: "#ff6b6b",
  Financial: "#00d4aa",
  Legal: "#ffb347",
};

const SOCIETY_COLORS = ["#00d4aa", "#00b4d8", "#6c63ff", "#ffb347", "#ff6b6b", "#4ade80", "#fb923c", "#fb7185"];

// Clickable section header
const SectionHeader = ({ title, subtitle, actionLabel = "View All", onClick }) => (
  <div className="chart-card-header">
    <div>
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
    <button
      onClick={onClick}
      style={{
        background: "none", border: "1px solid var(--border)", borderRadius: 6,
        padding: "5px 12px", color: "#8899aa", cursor: "pointer", fontSize: 12,
        display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-teal)"; e.currentTarget.style.color = "var(--accent-teal)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "#8899aa"; }}
    >
      {actionLabel} <ArrowRight size={12} />
    </button>
  </div>
);

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Normalize society name to short form
function shortSociety(name) {
  const str = name && typeof name === "object"
    ? (name.name || name.societyName || name.society_name || String(name.id || ""))
    : String(name || "");
  return str
    .replace(" CHS", "").replace(" Society", "")
    .replace(" Heights", "").replace(" Towers", " Twrs").trim();
}

// ─── Helper: safely read a number from dashboardData ──────────────────────────
function apiNum(dashboardData, ...keys) {
  if (!dashboardData) return null;
  for (const k of keys) {
    const v = dashboardData[k];
    if (v !== undefined && v !== null && !isNaN(Number(v))) return Number(v);
  }
  return null;
}

export default function Dashboard({ theme = "dark", setTheme = () => {}, user = null, setActiveNav = () => {} }) {
  const [activeChart, setActiveChart] = useState("area");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeSociety, setActiveSociety] = useState("All Societies");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const headerRef = useRef(null);

  const { announcements, invoices, notices, societies, dashboardData, refetch, usingMock, loading, apiError, selectedSociety, setSelectedSociety } = useAppContext();

  // Sync global selectedSociety → local activeSociety
  useEffect(() => {
    if (selectedSociety) {
      setActiveSociety(selectedSociety.societyName || selectedSociety.societyIdentifier || "All Societies");
    } else {
      setActiveSociety("All Societies");
    }
  }, [selectedSociety]);

  useEffect(() => {
    const handler = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setShowThemePicker(false);
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── REFRESH: spin icon + force chart re-render via refreshKey ──
  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey(k => k + 1);
    refetch();
    setTimeout(() => setRefreshing(false), 1200);
  };

  // ── Build society list for the dropdown from API (or fallback) ──
  const societyOptions = useMemo(() => {
    const apiSocieties = societies && societies.length > 0
      ? societies.map(s => s.name || s.societyName || s.society_name || "").filter(Boolean)
      : ["Green Valley", "Blue Ridge", "Sunrise Heights", "Palm Grove", "Emerald Towers"];
    return ["All Societies", ...apiSocieties];
  }, [societies]);

  // ══════════════════════════════════════════════
  // LIVE COMPUTED STATS — API dashboard data first,
  // then computed from invoices, then mock fallback
  // ══════════════════════════════════════════════
  const computedStats = useMemo(() => {
    // 1️⃣ If backend dashboard endpoint returned data, use it directly
    if (dashboardData) {
      const totalSocieties    = apiNum(dashboardData, "totalSocieties", "total_societies", "societiesCount", "societies") ?? societies.length ?? dashboardStats.totalSocieties;
      const totalInvoiceBilling = apiNum(dashboardData, "totalBilling", "total_billing", "invoiceBilling", "totalInvoiceBilling", "totalAmount", "total_amount") ?? dashboardStats.totalInvoiceBilling;
      const totalOutstanding  = apiNum(dashboardData, "outstanding", "totalOutstanding", "total_outstanding", "pendingAmount", "pending_amount") ?? dashboardStats.totalOutstanding;
      const totalReceipts     = apiNum(dashboardData, "totalReceipts", "total_receipts", "receiptsCount", "receipts") ?? dashboardStats.totalReceipts;
      const totalReceiptAmount = apiNum(dashboardData, "receiptAmount", "totalReceiptAmount", "total_receipt_amount", "collectedAmount", "collected_amount") ?? dashboardStats.totalReceiptAmount;
      const collectionRate    = apiNum(dashboardData, "collectionRate", "collection_rate", "collectionPercentage") ?? (totalInvoiceBilling > 0 ? Number(((totalReceiptAmount / totalInvoiceBilling) * 100).toFixed(1)) : 0);
      return { totalSocieties, totalInvoiceBilling, totalOutstanding, totalReceipts, totalReceiptAmount, collectionRate };
    }

    // 2️⃣ Compute from invoices array
    if (invoices && invoices.length > 0) {
      const totalBilling = invoices.reduce((s, i) => s + Number(i.amount || 0), 0);
      const outstanding = invoices
        .filter(i => i.status === "Unpaid" || i.status === "Overdue")
        .reduce((s, i) => s + Number(i.amount || 0), 0);
      const paidInvoices = invoices.filter(i => i.status === "Paid");
      const receiptAmount = paidInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
      return {
        totalSocieties: societies.length || dashboardStats.totalSocieties,
        totalInvoiceBilling: totalBilling,
        totalOutstanding: outstanding,
        totalReceipts: paidInvoices.length,
        totalReceiptAmount: receiptAmount,
        collectionRate: totalBilling > 0 ? Number(((receiptAmount / totalBilling) * 100).toFixed(1)) : 0,
      };
    }

    // 3️⃣ Mock fallback
    return dashboardStats;
  }, [dashboardData, invoices, societies, refreshKey]);

  // ══════════════════════════════════════════════
  // LIVE MONTHLY BILLING DATA — API first, then invoices
  // ══════════════════════════════════════════════
  const computedMonthlyData = useMemo(() => {
    // Try to get from dashboardData
    if (dashboardData) {
      const monthly = dashboardData.monthlyData || dashboardData.monthly_data
        || dashboardData.monthlyBilling || dashboardData.monthly_billing
        || dashboardData.billingTrend || dashboardData.billing_trend;
      if (Array.isArray(monthly) && monthly.length >= 2) {
        return monthly.map(m => ({
          month: m.month || m.monthName || m.month_name || m.label || "",
          billed: Number(m.billed || m.totalBilled || m.total_billed || m.amount || 0),
          collected: Number(m.collected || m.totalCollected || m.total_collected || m.paid || 0),
          outstanding: Number(m.outstanding || m.totalOutstanding || m.total_outstanding || m.pending || 0),
        }));
      }
    }
    // Fall back to invoice computation
    if (!invoices || invoices.length < 2) return monthlyBillingData;
    const map = {};
    invoices.forEach(inv => {
      const d = new Date(inv.issueDate || inv.dueDate || "");
      if (isNaN(d)) return;
      const m = MONTH_NAMES[d.getMonth()];
      if (!map[m]) map[m] = { month: m, billed: 0, collected: 0, outstanding: 0 };
      const amt = Number(inv.amount || 0);
      map[m].billed += amt;
      if (inv.status === "Paid") map[m].collected += amt;
      else map[m].outstanding += amt;
    });
    const result = MONTH_NAMES.map(m => map[m]).filter(Boolean);
    return result.length >= 2 ? result : monthlyBillingData;
  }, [dashboardData, invoices, refreshKey]);

  // ══════════════════════════════════════════════
  // LIVE SOCIETY BREAKDOWN — API first, then invoices
  // ══════════════════════════════════════════════
  const computedSocietyBreakdown = useMemo(() => {
    if (dashboardData) {
      const breakdown = dashboardData.societyBreakdown || dashboardData.society_breakdown
        || dashboardData.societyWise || dashboardData.society_wise;
      if (Array.isArray(breakdown) && breakdown.length >= 2) {
        return breakdown.map(b => ({
          name: shortSociety(b.name || b.societyName || b.society_name || b.society || ""),
          collected: Number(b.collected || b.totalCollected || b.paid || 0),
          outstanding: Number(b.outstanding || b.totalOutstanding || b.pending || 0),
        }));
      }
    }
    if (!invoices || invoices.length < 2) return societyBreakdown;
    const map = {};
    invoices.forEach(inv => {
      const name = shortSociety(inv.society);
      if (!map[name]) map[name] = { name, collected: 0, outstanding: 0 };
      const amt = Number(inv.amount || 0);
      if (inv.status === "Paid") map[name].collected += amt;
      else map[name].outstanding += amt;
    });
    const result = Object.values(map);
    return result.length >= 2 ? result : societyBreakdown;
  }, [dashboardData, invoices, refreshKey]);

  // ══════════════════════════════════════════════
  // LIVE RECEIPT TREND — API first, then invoices
  // ══════════════════════════════════════════════
  const computedReceiptTrend = useMemo(() => {
    if (dashboardData) {
      const trend = dashboardData.receiptTrend || dashboardData.receipt_trend
        || dashboardData.weeklyReceipts || dashboardData.weekly_receipts;
      if (Array.isArray(trend) && trend.length >= 2) {
        return trend.map(t => ({
          week: t.week || t.weekLabel || t.label || "",
          receipts: Number(t.receipts || t.count || t.receiptCount || 0),
          amount: Number(t.amount || t.totalAmount || t.total_amount || 0),
        }));
      }
    }
    const paidInvs = invoices ? invoices.filter(i => i.status === "Paid") : [];
    if (paidInvs.length < 2) return receiptTrend;
    const weekMap = {};
    paidInvs.forEach(inv => {
      const d = new Date(inv.issueDate || inv.dueDate || "");
      if (isNaN(d)) return;
      const weekNum = Math.ceil(d.getDate() / 7);
      const key = `W${weekNum}`;
      if (!weekMap[key]) weekMap[key] = { week: key, receipts: 0, amount: 0 };
      weekMap[key].receipts += 1;
      weekMap[key].amount += Number(inv.amount || 0);
    });
    const result = Object.values(weekMap).sort((a, b) => a.week.localeCompare(b.week));
    return result.length >= 2 ? result : receiptTrend;
  }, [dashboardData, invoices, refreshKey]);

  // ══════════════════════════════════════════════
  // LIVE PAYMENT MODE DATA — API first
  // ══════════════════════════════════════════════
  const computedPaymentModeData = useMemo(() => {
    if (dashboardData) {
      const modes = dashboardData.paymentModes || dashboardData.payment_modes
        || dashboardData.paymentMode || dashboardData.payment_mode
        || dashboardData.paymentBreakdown || dashboardData.payment_breakdown;
      if (Array.isArray(modes) && modes.length >= 2) {
        const COLORS = ["#00D4AA", "#6C63FF", "#FF6B6B", "#FFB347", "#00B4D8", "#4ade80"];
        return modes.map((m, i) => ({
          name: m.name || m.mode || m.paymentMode || m.payment_mode || `Mode ${i + 1}`,
          value: Number(m.value || m.percentage || m.percent || m.count || 0),
          color: m.color || COLORS[i % COLORS.length],
        }));
      }
    }
    return paymentModeData;
  }, [dashboardData, refreshKey]);

  // ══════════════════════════════════════════════
  // LIVE SOCIETY HEALTH DATA
  // ══════════════════════════════════════════════
  const computedHealthData = useMemo(() => {
    if (dashboardData) {
      const health = dashboardData.societyHealth || dashboardData.society_health
        || dashboardData.healthScores || dashboardData.health_scores;
      if (Array.isArray(health) && health.length >= 2) {
        return health.map((h, i) => ({
          name: shortSociety(h.name || h.societyName || h.society || ""),
          score: Number(h.score || h.healthScore || h.collectionRate || h.collection_rate || 0),
          units: Number(h.units || h.totalUnits || h.total_units || 80 + i * 15),
          collected: Number(h.collected || h.collectionRate || h.score || 0),
          color: SOCIETY_COLORS[i % SOCIETY_COLORS.length],
        }));
      }
    }
    if (!invoices || invoices.length < 2) {
      return [
        { name: "Green Valley", score: 92, units: 120, collected: 98, color: "#00d4aa" },
        { name: "Blue Ridge", score: 86, units: 200, collected: 84, color: "#00b4d8" },
        { name: "Sunrise Hts", score: 78, units: 85, collected: 76, color: "#6c63ff" },
        { name: "Palm Grove", score: 71, units: 60, collected: 68, color: "#ffb347" },
        { name: "Emerald Towers", score: 88, units: 150, collected: 86, color: "#00d4aa" },
      ];
    }
    const map = {};
    invoices.forEach(inv => {
      const s = inv.society;
      if (!map[s]) map[s] = { billed: 0, paid: 0 };
      const amt = Number(inv.amount || 0);
      map[s].billed += amt;
      if (inv.status === "Paid") map[s].paid += amt;
    });
    return Object.entries(map).map(([soc, data], i) => {
      const score = data.billed > 0 ? Math.round((data.paid / data.billed) * 100) : 0;
      return {
        name: shortSociety(soc),
        score,
        units: 80 + i * 15,
        collected: score,
        color: SOCIETY_COLORS[i % SOCIETY_COLORS.length],
      };
    });
  }, [dashboardData, invoices, refreshKey]);

  const collectionPct = computedStats.totalInvoiceBilling > 0
    ? ((computedStats.totalReceiptAmount / computedStats.totalInvoiceBilling) * 100).toFixed(1)
    : "0.0";

  // ══════════════════════════════════════════════
  // SEARCH + SOCIETY FILTER helpers
  // ══════════════════════════════════════════════
  const q = searchVal.toLowerCase().trim();
  const matchSociety = (soc) => activeSociety === "All Societies" || (soc || "").toLowerCase().includes(activeSociety.toLowerCase().replace(" societies", "").trim());

  const liveAnnouncements = useMemo(() => {
    return [...announcements]
      .sort((a, b) => b.id - a.id)
      .filter(a => matchSociety(a.society))
      .filter(a => !q || a.name?.toLowerCase().includes(q) || a.society?.toLowerCase().includes(q) || a.type?.toLowerCase().includes(q))
      .slice(0, 4);
  }, [announcements, searchVal, activeSociety, refreshKey]);

  const liveTransactions = useMemo(() => {
    return [...invoices]
      .sort((a, b) => b.id - a.id)
      .filter(i => matchSociety(i.society))
      .filter(i => !q || i.flatNo?.toLowerCase().includes(q) || i.society?.toLowerCase().includes(q) || i.ownerName?.toLowerCase().includes(q) || i.type?.toLowerCase().includes(q) || i.status?.toLowerCase().includes(q))
      .slice(0, 6);
  }, [invoices, searchVal, activeSociety, refreshKey]);

  const liveEvents = useMemo(() => {
    return [...notices]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .filter(n => matchSociety(n.society))
      .filter(n => !q || n.title?.toLowerCase().includes(q) || n.society?.toLowerCase().includes(q) || n.type?.toLowerCase().includes(q))
      .slice(0, 5)
      .map(n => ({
        title: n.title,
        date: new Date(n.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        society: n.society,
        color: typeColorMap[n.type] || "#00d4aa",
        rawDate: n.date,
      }));
  }, [notices, searchVal, activeSociety, refreshKey]);

  const isFiltered = q || activeSociety !== "All Societies";

  return (
    <div className="dashboard">
      {/* ═══ UNIFIED TOP BAR ═══ */}
      <header className="dash-header" ref={headerRef}>
        <div className="dash-header-left">
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="dash-header-right">
          {/* Society selector */}
          <div style={{ position: "relative" }}>
            <select value={activeSociety} onChange={e => {
              const val = e.target.value;
              setActiveSociety(val);
              if (val === "All Societies") {
                setSelectedSociety(null);
              } else {
                const matched = societies.find(s =>
                  (s.name || s.societyName || s.society_name || "") === val
                );
                setSelectedSociety(matched ? {
                  societyIdentifier: matched.societyIdentifier || matched.id || val,
                  societyName: val,
                } : { societyIdentifier: val, societyName: val });
              }
            }} style={{
              background: "var(--bg-card)", border: "1px solid var(--border-strong)",
              borderRadius: 10, padding: "8px 30px 8px 12px", color: "var(--text-primary)",
              fontSize: 12, cursor: "pointer", outline: "none", fontFamily: "var(--font-body)",
              appearance: "none", minWidth: 160,
            }}>
              {societyOptions.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={12} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          </div>

          {/* Theme Picker */}
          <div style={{ position: "relative" }}>
            <button className="refresh-btn" title="Change Theme" onClick={() => { setShowThemePicker(v => !v); setShowNotifs(false); }} style={{ width: 38, height: 38 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="8" cy="10" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="12" cy="7" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="16" cy="10" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="14" cy="14.5" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="9" cy="14.5" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </button>
            {showThemePicker && (
              <div style={{
                position: "absolute", top: "calc(100% + 10px)", right: 0,
                background: "var(--bg-surface)", border: "1px solid var(--border-strong)",
                borderRadius: 16, padding: 16, zIndex: 200, width: 240,
                boxShadow: "0 16px 48px rgba(0,0,0,0.45)", animation: "fadeSlideDown 0.15s ease",
              }}>
                <p style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>Choose Theme</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {THEMES_LIST.map(t => (
                    <button key={t.id} onClick={() => { setTheme(t.id); setShowThemePicker(false); }} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: theme === t.id ? "var(--bg-card-hover)" : "var(--bg-card)",
                      border: `1.5px solid ${theme === t.id ? "var(--accent-teal)" : "var(--border)"}`,
                      borderRadius: 10, padding: "7px 10px", cursor: "pointer", transition: "all 0.15s",
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        background: `linear-gradient(135deg, ${t.a} 50%, ${t.b} 100%)`,
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: theme === t.id ? `0 0 8px ${t.b}88` : "none",
                      }} />
                      <span style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: theme === t.id ? 600 : 400 }}>{t.label}</span>
                      {theme === t.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-teal)", marginLeft: "auto" }} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="search-box" style={isFiltered ? { borderColor: "var(--accent-teal)", boxShadow: "0 0 0 2px rgba(0,212,170,0.12)" } : {}}>
            <Search size={15} style={isFiltered ? { color: "var(--accent-teal)" } : {}} />
            <input
              placeholder="Search society, unit, name..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Escape") setSearchVal(""); }}
            />
            {searchVal && (
              <button
                onClick={() => setSearchVal("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8899aa", padding: "0 2px", display: "flex", alignItems: "center" }}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Refresh */}
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            title="Refresh dashboard"
            style={refreshing ? { color: "var(--accent-teal)" } : {}}
          >
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
          </button>

          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <div className="notif-btn" onClick={() => { setShowNotifs(v => !v); setShowThemePicker(false); }} style={{ cursor: "pointer" }}>
              <Bell size={18} />
              <span className="notif-dot" />
            </div>
            {showNotifs && (
              <div style={{
                position: "absolute", top: "calc(100% + 10px)", right: 0,
                background: "var(--bg-surface)", border: "1px solid var(--border-strong)",
                borderRadius: 16, padding: 16, zIndex: 200, width: 280,
                boxShadow: "0 16px 48px rgba(0,0,0,0.45)", animation: "fadeSlideDown 0.15s ease",
              }}>
                <p style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>Notifications</p>
                {announcements.slice(0, 4).sort((a,b) => b.id - a.id).map((n, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0",
                    borderBottom: i < 3 ? "1px solid var(--border)" : "none",
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: typeColorMap[n.type] || "#00d4aa", marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <div style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 600 }}>{n.name}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{n.society}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User avatar chip */}
          {user && (() => {
            const rc = ROLE_COLORS[user.role] || "#00d4aa";
            return (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "var(--bg-card)", border: "1px solid var(--border-strong)",
                borderRadius: 12, padding: "5px 12px 5px 5px", cursor: "default",
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 9,
                  background: `${rc}22`, color: rc,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.3px",
                }}>{user.avatar}</div>
                <div>
                  <div style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>{user.name}</div>
                  <div style={{ color: rc, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px" }}>{user.role}</div>
                </div>
              </div>
            );
          })()}
        </div>
      </header>

      {/* Search active banner */}
      {isFiltered && (
        <div style={{
          margin: "0 28px", padding: "8px 14px", background: "rgba(0,212,170,0.07)",
          border: "1px solid rgba(0,212,170,0.2)", borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 12, color: "#00d4aa",
        }}>
          <span>
            {q ? `Showing results for "${searchVal}"` : ""}
            {q && activeSociety !== "All Societies" ? " · " : ""}
            {activeSociety !== "All Societies" ? `Society: ${activeSociety}` : ""}
          </span>
          <button
            onClick={() => { setSearchVal(""); setActiveSociety("All Societies"); }}
            style={{ background: "none", border: "none", color: "#00d4aa", cursor: "pointer", fontSize: 11, textDecoration: "underline" }}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* API Connection Status Banner */}
      {usingMock && (
        <div style={{
          margin: "6px 28px 0", padding: "7px 14px",
          background: "rgba(255,183,71,0.08)", border: "1px solid rgba(255,183,71,0.3)",
          borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 12, color: "#ffb347",
        }}>
          <span>⚠️ Mock data — Backend ({apiError ? `error: ${apiError}` : "no response"}). Check <code style={{fontSize:11}}>base-url.js</code> or login again.</span>
          <button onClick={refetch} style={{ background: "none", border: "1px solid #ffb347", color: "#ffb347", borderRadius: 5, padding: "2px 10px", cursor: "pointer", fontSize: 11 }}>
            Retry
          </button>
        </div>
      )}
      {!usingMock && dashboardData && (
        <div style={{
          margin: "6px 28px 0", padding: "7px 14px",
          background: "rgba(0,212,170,0.07)", border: "1px solid rgba(0,212,170,0.2)",
          borderRadius: 8, fontSize: 12, color: "#00d4aa",
        }}>
          ✅ Live data from backend API
        </div>
      )}

      <div className="dashboard-body">
        {/* Stat Cards — driven by live invoice data */}
        <section className="stats-grid">
          <StatCard icon={Building2} label="Total Societies" value={computedStats.totalSocieties} sub="Across all regions" color="#00D4AA" trend={4.2} />
          <StatCard icon={FileText} label="Invoice Billing" value={fmt(computedStats.totalInvoiceBilling)} sub={fmtFull(computedStats.totalInvoiceBilling)} color="#6C63FF" trend={8.7} />
          <StatCard icon={AlertCircle} label="Outstanding" value={fmt(computedStats.totalOutstanding)} sub={fmtFull(computedStats.totalOutstanding)} color="#FF6B6B" trend={-3.1} />
          <StatCard icon={Receipt} label="Total Receipts" value={computedStats.totalReceipts.toLocaleString()} sub="Transactions processed" color="#FFB347" trend={12.4} />
          <StatCard icon={Wallet} label="Receipt Amount" value={fmt(computedStats.totalReceiptAmount)} sub={fmtFull(computedStats.totalReceiptAmount)} color="#00B4D8" trend={6.8} />
          <StatCard icon={TrendingUp} label="Collection Rate" value={`${collectionPct}%`} sub="Of total invoiced" color="#48CAE4" trend={2.3} />
        </section>

        {/* Collection Progress — driven by live data */}
        <section className="collection-bar-section">
          <div className="collection-bar-label">
            <span>Overall Collection Progress</span>
            <span className="coll-pct">{collectionPct}%</span>
          </div>
          <div className="collection-bar-track">
            <div className="collection-bar-fill" style={{ width: `${Math.min(100, collectionPct)}%` }} />
          </div>
          <div className="collection-bar-legend">
            <span><span className="dot dot-green" /> Collected: {fmt(computedStats.totalReceiptAmount)}</span>
            <span><span className="dot dot-red" /> Outstanding: {fmt(computedStats.totalOutstanding)}</span>
          </div>
        </section>

        {/* Charts Row — keyed to refreshKey so refresh re-mounts charts */}
        <section className="charts-row" key={`charts-main-${refreshKey}`}>
          <div className="chart-card wide">
            <div className="chart-card-header">
              <div>
                <h3>Billing vs Collection Trend</h3>
                <p>Monthly overview · synced with Invoice tab</p>
              </div>
              <div className="chart-tabs">
                {["area", "bar"].map((t) => (
                  <button key={t} className={`chart-tab ${activeChart === t ? "active" : ""}`} onClick={() => setActiveChart(t)}>
                    {t === "area" ? "Area" : "Bar"}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              {activeChart === "area" ? (
                <AreaChart data={computedMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradBilled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: "#8899aa", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => fmt(v)} tick={{ fill: "#8899aa", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="billed" name="Billed" stroke="#6C63FF" fill="url(#gradBilled)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="collected" name="Collected" stroke="#00D4AA" fill="url(#gradCollected)" strokeWidth={2} dot={false} />
                </AreaChart>
              ) : (
                <BarChart data={computedMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: "#8899aa", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => fmt(v)} tick={{ fill: "#8899aa", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="billed" name="Billed" fill="#6C63FF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name="Collected" fill="#00D4AA" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="chart-card narrow">
            <div className="chart-card-header">
              <div>
                <h3>Payment Modes</h3>
                <p>Distribution by type</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={computedPaymentModeData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {computedPaymentModeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {computedPaymentModeData.map(item => (
                <div key={item.name} className="pie-legend-item">
                  <span className="pie-dot" style={{ background: item.color }} />
                  <span className="pie-name">{item.name}</span>
                  <span className="pie-val">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Society Health + Upcoming Events */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20, padding: "20px 28px 0" }}>
          {/* Society Health — driven by live invoice data */}
          <div className="chart-card" style={{ gridColumn: "unset" }}>
            <div className="chart-card-header">
              <div><h3>Society Health Scores</h3><p>Collection rate · live from Invoice tab</p></div>
              <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 10px", color: "#8899aa", cursor: "pointer", fontSize: 12 }}>View All</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
              {computedHealthData.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Building2 size={14} style={{ color: s.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                      <span style={{ color: s.color, fontSize: 12, fontWeight: 700 }}>{s.score}%</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${Math.min(100, s.score)}%`, background: s.color, borderRadius: 3, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ color: "#8899aa", fontSize: 11 }}>{s.units} units</div>
                    <div style={{ color: "#8899aa", fontSize: 11 }}>{s.collected}% paid</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LIVE Upcoming Events from Notice tab */}
          <div className="chart-card" style={{ gridColumn: "unset" }}>
            <SectionHeader
              title="Upcoming Events"
              subtitle={`${liveEvents.length} scheduled · live from Notice tab`}
              actionLabel="Manage Notices"
              onClick={() => setActiveNav("notice")}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {liveEvents.length === 0 ? (
                <div style={{ color: "#8899aa", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                  {q ? `No events matching "${searchVal}".` : "No upcoming events. Add notices in the Notice tab."}
                </div>
              ) : liveEvents.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: `${item.color}15`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: item.color, fontSize: 10, fontWeight: 700 }}>{item.date.split(" ")[1]?.toUpperCase()}</span>
                    <span style={{ color: item.color, fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{item.date.split(" ")[0]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{item.title}</div>
                    <div style={{ color: "#8899aa", fontSize: 11 }}>{item.society}</div>
                  </div>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Second Charts Row — keyed to refreshKey */}
        <section className="charts-row" key={`charts-secondary-${refreshKey}`}>
          <div className="chart-card medium">
            <div className="chart-card-header">
              <div><h3>Weekly Receipt Trend</h3><p>Count &amp; amount · live from Invoice tab</p></div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={computedReceiptTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: "#8899aa", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: "#8899aa", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={v => fmt(v)} tick={{ fill: "#8899aa", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line yAxisId="left" type="monotone" dataKey="receipts" name="Receipts" stroke="#FFB347" strokeWidth={2.5} dot={{ fill: "#FFB347", r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="amount" name="Amount" stroke="#00B4D8" strokeWidth={2.5} dot={{ fill: "#00B4D8", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card medium">
            <div className="chart-card-header">
              <div><h3>Society-wise Collection</h3><p>Collected vs Outstanding · live from Invoice tab</p></div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={computedSocietyBreakdown} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tickFormatter={v => fmt(v)} tick={{ fill: "#8899aa", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#ccd6f6", fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="collected" name="Collected" fill="#00D4AA" radius={[0, 4, 4, 0]} stackId="a" />
                <Bar dataKey="outstanding" name="Outstanding" fill="#FF6B6B" radius={[0, 4, 4, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* LIVE Announcements + LIVE Recent Transactions */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 20, padding: "20px 28px 0" }}>

          {/* LIVE Announcements from Announcement tab */}
          <div className="chart-card" style={{ gridColumn: "unset" }}>
            <SectionHeader
              title="Announcements"
              subtitle={`${announcements.length} total · live from Announcement tab`}
              actionLabel="Manage"
              onClick={() => setActiveNav("announcement")}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {liveAnnouncements.length === 0 ? (
                <div style={{ color: "#8899aa", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                  {q ? `No announcements matching "${searchVal}".` : "No announcements yet. Add one in the Announcement tab."}
                </div>
              ) : liveAnnouncements.map(a => (
                <div key={a.id} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                    {a.type === "Urgent" && (
                      <span style={{ background: "rgba(255,107,107,0.12)", color: "#ff6b6b", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>URGENT</span>
                    )}
                    <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{a.name}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#8899aa", fontSize: 11 }}>{a.society} · {a.startDate}</span>
                    <span style={{ color: "#8899aa", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                      <Eye size={10} /> {a.views || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LIVE Recent Transactions from Invoice tab */}
          <div className="chart-card" style={{ gridColumn: "unset" }}>
            <SectionHeader
              title="Recent Transactions"
              subtitle={`${invoices.length} total · live from Invoice tab`}
              actionLabel="View All"
              onClick={() => setActiveNav("invoice")}
            />
            <div style={{ overflowX: "auto" }}>
              {liveTransactions.length === 0 ? (
                <div style={{ color: "#8899aa", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                  {q ? `No transactions matching "${searchVal}".` : "No transactions yet."}
                </div>
              ) : (
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>Unit</th>
                      <th>Society</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveTransactions.map(row => (
                      <tr key={row.id}>
                        <td><span className="unit-badge">{row.flatNo}</span></td>
                        <td>{row.society}</td>
                        <td>
                          <span className={`type-tag ${row.status === "Paid" ? "tag-receipt" : "tag-invoice"}`}>{row.type}</span>
                        </td>
                        <td className="amount-cell">{fmtFull(row.amount)}</td>
                        <td><StatusBadge status={row.status} /></td>
                        <td className="time-cell">{row.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
