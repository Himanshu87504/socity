import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useAppContext } from "../AppContext";
import {
  generateInvoiceApi,
  unprocessInvoiceApi,
  getInvoicesDetailApi,
  getAllInvoicesApi,
  getAllReceiptsApi,
  unprocessReceiptApi,
  createCashPaymentApi,
  createChequePaymentApi,
  getPropertyOutstandingApi,
  downloadBulkLedgerApi,
  downloadBulkLedgerPdfApi,
  getAllPaymentLogsApi,
  updateChequeStatusApi,
  deleteCashLogApi,
  deleteChequeLogApi,
  getAllAnonymousReceiptsApi,
  addReceiptApi,
  deleteAnonymousReceiptApi,
  updateAnonymousReceiptApi,
} from "../api/account-api";

import InvoiceTab from "./InvoiceTab";
import GlobalSocietySelector from "./GlobalSocietySelector";
import AcknowledgeTab from "./AcknowledgeTab";

import OnlineSelfPayTab from "./OnlineSelfPayTab";

import CashChequeTab from "./Cashchequetab";

import ReceiptTab from "./Recipt";
import LedgerTab from "./Ledgertab";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart
} from "recharts";
import {
  Download, MessageSquare, RefreshCw, Search, Filter, Plus, ChevronDown,
  FileText, Receipt, BookOpen, CreditCard, Landmark, Globe, CheckCircle,
  Clock, AlertCircle, TrendingUp, TrendingDown, Eye, Send, Printer,
  Calendar, ArrowUpRight, ArrowDownRight, X, Check,
  ChevronRight, DollarSign, Wallet, BarChart2, Building2,
  Edit2, Trash2, Copy, Star, Zap, Activity, Shield,
  ChevronLeft, ChevronUp, Mail, Phone,
  ChevronsLeft, ChevronsRight, PieChart as PieIcon,
  AlertTriangle, ThumbsUp, Layers,
} from "lucide-react";



const fmt = n =>
  n >= 1e7 ? `₹${(n / 1e7).toFixed(2)}Cr`
    : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)}L`
      : n >= 1e3 ? `₹${(n / 1e3).toFixed(1)}K`
        : `₹${n}`;
const fmtFull = n => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtNum = n => Number(n).toLocaleString("en-IN");

const SOCIETIES = ["All Societies", "Green Valley", "Blue Ridge", "Sunrise Heights", "Palm Grove", "Emerald Towers", "Mohan Nano Estates", "TSI Enclave"];

const receiptData = []


const ledgerData = [
  { date: "2024-01-01", description: "Opening Balance", debit: 0, credit: 0, balance: 250000, category: "balance", ref: "" },

];

const cashChequeLog = [
  { id: "CC-001", type: "Cash", description: "Maintenance - A-101", amount: 12500, receivedBy: "Admin", date: "2024-01-03", status: "Deposited", bank: "SBI Main Branch", chequeNo: "" },
];

const onlineTxnsStatic = [
  { id: "TXN-8821", property: "A-204", resident: "Ravi Sharma", amount: 12500, mode: "UPI", gateway: "Razorpay", txnId: "pay_Nx001", date: "2024-01-09", status: "Confirmed" },
];

const expenseData = [
  { id: "EXP-001", category: "Security", description: "Security Agency Monthly", amount: 45000, vendor: "Safe Guard Pvt Ltd", date: "2024-01-05", approvedBy: "Admin", status: "Paid" },
]

const bankAccounts = [
  { id: "ACC-001", bank: "State Bank of India", accountNo: "XXXX XXXX 4421", branch: "Main Branch, Andheri", balance: 438500, ifsc: "SBIN0001234", type: "Current", lastTxn: "2024-01-25" },
];

const acknowledgeData = [
  { id: "ACK-001", type: "Payment Ack", resident: "Ravi Sharma", flat: "A-204", amount: 12500, date: "2024-01-03", sent: "Email + SMS", status: "Delivered" },
];

const monthlyData = [
  { month: "Jul", invoiced: 1420000, collected: 1180000, outstanding: 240000, expenses: 285000 },
];

const paymentModes = [
  { name: "UPI", value: 42, color: "#00d4aa" },
  { name: "Net Bank", value: 28, color: "#6c63ff" },
  { name: "Cheque", value: 18, color: "#ffb347" },
  { name: "Cash", value: 9, color: "#ff6b6b" },
  { name: "Card", value: 3, color: "#00b4d8" },
];

const expenseCategories = [
  { name: "Security", value: 45000, color: "#6c63ff" },
  { name: "Utility", value: 30000, color: "#00d4aa" },
  { name: "Housekeeping", value: 38000, color: "#ffb347" },
  { name: "Maintenance", value: 21500, color: "#ff6b6b" },
  { name: "Admin", value: 3200, color: "#00b4d8" },
];

// ── REUSABLE UI COMPONENTS ──────────────────────────────────────────
const Pill = ({ status }) => {
  const map = {
    Paid: { bg: "rgba(0,212,170,0.12)", color: "#00d4aa" },
    Pending: { bg: "rgba(255,179,71,0.12)", color: "#ffb347" },
    Overdue: { bg: "rgba(255,107,107,0.12)", color: "#ff6b6b" },
    Confirmed: { bg: "rgba(0,212,170,0.12)", color: "#00d4aa" },
    Cleared: { bg: "rgba(0,180,216,0.12)", color: "#00b4d8" },
    Deposited: { bg: "rgba(108,99,255,0.12)", color: "#6c63ff" },
    Failed: { bg: "rgba(255,107,107,0.12)", color: "#ff6b6b" },
    Bounced: { bg: "rgba(255,107,107,0.12)", color: "#ff6b6b" },
    Delivered: { bg: "rgba(0,212,170,0.12)", color: "#00d4aa" },
  };
  const s = map[status] || { bg: "rgba(136,153,170,0.12)", color: "#8899aa" };
  return <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{status}</span>;
};

const AccTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "10px 14px", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
      <p style={{ color: "var(--text-secondary)", marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, marginBottom: 2 }}>{p.name}: {fmt(p.value)}</p>)}
    </div>
  );
};

const StatKPI = ({ label, value, sub, color = "#00d4aa", icon: Icon, trend, up }) => (
  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: -12, right: -12, width: 64, height: 64, borderRadius: "50%", background: `${color}10` }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
      <div style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase" }}>{label}</div>
      {Icon && <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={14} color={color} /></div>}
    </div>
    <div style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 6 }}>{value}</div>
    {sub && <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 4 }}>{sub}</div>}
    {trend !== undefined && (
      <div style={{ display: "flex", alignItems: "center", gap: 4, color: up ? "#00d4aa" : "#ff6b6b", fontSize: 11, fontWeight: 600 }}>
        {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {Math.abs(trend)}% vs last month
      </div>
    )}
  </div>
);

const TableBtn = ({ icon: Icon, color, onClick, title }) => (
  <button title={title} onClick={onClick}
    style={{ background: `${color}15`, border: "none", borderRadius: 6, padding: "4px 8px", color, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
    onMouseEnter={e => e.currentTarget.style.background = `${color}30`}
    onMouseLeave={e => e.currentTarget.style.background = `${color}15`}>
    <Icon size={12} />
  </button>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, ...style }}>{children}</div>
);

const SectionHead = ({ title, sub, actions }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
    <div>
      <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{title}</h3>
      {sub && <p style={{ color: "var(--text-muted)", fontSize: 12 }}>{sub}</p>}
    </div>
    {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
  </div>
);

const SearchInput = ({ value, onChange, placeholder = "Search..." }) => (
  <div style={{ position: "relative" }}>
    <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px 8px 30px", color: "var(--text-primary)", fontSize: 12, width: 220, outline: "none", fontFamily: "inherit" }} />
  </div>
);

const TH = ({ children, align = "left" }) => (
  <th style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: 10, fontWeight: 700, textAlign: align, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", borderBottom: "1px solid var(--border)" }}>{children}</th>
);
const TD = ({ children, style = {} }) => (
  <td style={{ padding: "11px 12px", borderBottom: "1px solid var(--border)", ...style }}>{children}</td>
);

const FilterBar = ({ filters, onChange, onSearch, onClear }) => (
  <Card style={{ marginBottom: 16 }}>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
      {[{ label: "From Date", key: "fromDate", type: "date" }, { label: "To Date", key: "toDate", type: "date" }].map(f => (
        <div key={f.key} style={{ flex: 1, minWidth: 130 }}>
          <label style={{ display: "block", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" }}>{f.label}</label>
          <input type={f.type} value={filters[f.key]} onChange={e => onChange(f.key, e.target.value)}
            style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text-primary)", fontSize: 12, outline: "none" }} />
        </div>
      ))}
      <div style={{ flex: 2, minWidth: 160 }}>
        <label style={{ display: "block", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" }}>Society</label>
        <select value={filters.society} onChange={e => onChange("society", e.target.value)}
          style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text-primary)", fontSize: 12, outline: "none", cursor: "pointer" }}>
          {SOCIETIES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <label style={{ display: "block", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" }}>Status</label>
        <select value={filters.status} onChange={e => onChange("status", e.target.value)}
          style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text-primary)", fontSize: 12, outline: "none", cursor: "pointer" }}>
          {["All", "Paid", "Pending", "Overdue", "Confirmed", "Failed"].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <label style={{ display: "block", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" }}>Ref / No.</label>
        <input placeholder="INV-001" value={filters.refNo} onChange={e => onChange("refNo", e.target.value)}
          style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text-primary)", fontSize: 12, outline: "none" }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onSearch} style={{ background: "linear-gradient(135deg,var(--accent-teal),var(--accent-blue))", border: "none", borderRadius: 9, padding: "9px 18px", color: "#000", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Search size={13} /> Search
        </button>
        <button onClick={onClear} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "9px 14px", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>Clear</button>
      </div>
    </div>
  </Card>
);

const Pagination = ({ page, total, perPage, onChange }) => {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const visiblePages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) visiblePages.push(i);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid var(--border)", marginTop: 8 }}>
      <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
        Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {fmtNum(total)}
      </span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button onClick={() => onChange(1)} disabled={page === 1} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: page === 1 ? "var(--text-muted)" : "var(--text-secondary)", cursor: page === 1 ? "not-allowed" : "pointer" }}><ChevronsLeft size={12} /></button>
        <button onClick={() => onChange(page - 1)} disabled={page === 1} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: page === 1 ? "var(--text-muted)" : "var(--text-secondary)", cursor: page === 1 ? "not-allowed" : "pointer" }}><ChevronLeft size={12} /></button>
        {visiblePages.map(p => (
          <button key={p} onClick={() => onChange(p)} style={{ background: p === page ? "var(--accent-teal)" : "none", border: `1px solid ${p === page ? "var(--accent-teal)" : "var(--border)"}`, borderRadius: 6, padding: "4px 10px", color: p === page ? "#000" : "var(--text-secondary)", fontWeight: p === page ? 700 : 400, cursor: "pointer", fontSize: 12, minWidth: 30 }}>{p}</button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page === pages} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: page === pages ? "var(--text-muted)" : "var(--text-secondary)", cursor: page === pages ? "not-allowed" : "pointer" }}><ChevronRight size={12} /></button>
        <button onClick={() => onChange(pages)} disabled={page === pages} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: page === pages ? "var(--text-muted)" : "var(--text-secondary)", cursor: page === pages ? "not-allowed" : "pointer" }}><ChevronsRight size={12} /></button>
      </div>
    </div>
  );
};

const Modal = ({ open, onClose, title, width = 520, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 18, width, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ padding: "20px 24px" }}>{children}</div>
      </div>
    </div>
  );
};

const FI = ({ label, field, type = "text", form, setForm, disabled, fullWidth }) => (
  <div style={{ marginBottom: 14, gridColumn: fullWidth ? "1/-1" : undefined }}>
    <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</label>
    <input type={type} value={form[field] || ""} disabled={disabled} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      style={{ width: "100%", background: disabled ? "var(--bg-card)" : "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 9, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box", opacity: disabled ? 0.6 : 1 }} />
  </div>
);

const FS = ({ label, field, options, form, setForm }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</label>
    <select value={form[field] || ""} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 9, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", cursor: "pointer" }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const BtnPrimary = ({ children, onClick, color = "teal", style = {} }) => {
  const bg = color === "red" ? "linear-gradient(135deg,#ff6b6b,#ff8c00)" : color === "purple" ? "linear-gradient(135deg,#6c63ff,#00b4d8)" : "linear-gradient(135deg,var(--accent-teal),var(--accent-blue))";
  const fg = color === "purple" ? "#fff" : "#000";
  return <button onClick={onClick} style={{ background: bg, border: "none", borderRadius: 9, padding: "9px 20px", color: fg, fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", ...style }}>{children}</button>;
};
const BtnGhost = ({ children, onClick, style = {} }) => (
  <button onClick={onClick} style={{ padding: "9px 20px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 9, color: "var(--text-secondary)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, ...style }}>{children}</button>
);

// ── TAB: INVOICE ─────────────────────────────────────────────────────
// ── helper: get society_identifier from localStorage (mirrors AppContext) ──
const getSocietyId = () =>
  localStorage.getItem("society_identifier") ||
  localStorage.getItem("societyId") ||
  "";

// ── Smart Property Search Dropdown ───────────────────────────────────
// Shows "Flat No — Owner Name" list, filters as user types,
// fills property_identifier (the backend key) on selection.
function PropertySearchDropdown({ properties = [], value, onSelect }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = properties.filter(p => {
    const q = query.toLowerCase();
    return (
      (p.unit || "").toLowerCase().includes(q) ||
      (p.owner || "").toLowerCase().includes(q) ||
      (p.identifier || "").toLowerCase().includes(q)
    );
  }).slice(0, 30); // max 30 results

  // Display label for selected value
  const selectedProp = properties.find(p => p.identifier === value || String(p.id) === String(value));
  const displayLabel = selectedProp
    ? `${selectedProp.unit || selectedProp.identifier} — ${selectedProp.owner || ""}`.trim()
    : value || "";

  return (
    <div ref={ref} style={{ marginBottom: 14, gridColumn: "1/-1", position: "relative" }}>
      <h1>Hello</h1>
      <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.3px" }}>
        Select Property * <span style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 400, textTransform: "none" }}>(search by flat no or owner name)</span>
      </label>
      <div style={{ position: "relative" }}>
        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input
          value={open ? query : displayLabel}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          placeholder="Search flat number or owner..."
          style={{ width: "100%", background: "var(--input-bg)", border: `1px solid ${value ? "var(--accent-teal)" : "var(--input-border)"}`, borderRadius: 9, padding: "9px 12px 9px 30px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
        />
        {value && !open && (
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,212,170,0.15)", color: "var(--accent-teal)", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12 }}>✓ Selected</span>
        )}
      </div>

      {/* Dropdown list */}
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", maxHeight: 220, overflowY: "auto", marginTop: 4 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "16px 14px", color: "var(--text-muted)", fontSize: 12, textAlign: "center" }}>
              {properties.length === 0 ? "No properties loaded — check API connection" : "No match found"}
            </div>
          ) : filtered.map((p, i) => (
            <div key={p.identifier || p.id || i}
              onClick={() => { onSelect(p); setOpen(false); setQuery(""); }}
              style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div>
                <span style={{ color: "var(--accent-teal)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>{p.unit || "—"}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: 12, marginLeft: 10 }}>{p.owner || "No owner"}</span>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)", background: "var(--bg-card)", padding: "2px 8px", borderRadius: 6 }}>{p.identifier || p.id}</span>
            </div>
          ))}
        </div>
      )}

      {/* Show identifier below for confirmation */}
      {value && (
        <div style={{ marginTop: 5, fontSize: 11, color: "var(--text-muted)" }}>
          Property Identifier: <span style={{ color: "var(--accent-teal)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{value}</span>
        </div>
      )}
    </div>
  );
}



// ── TAB: EXPENSES ─────────────────────────────────────────────────────
function ExpenseTab() {
  const { anonymousReceipts: ctxAnon = [], setAnonymousReceipts, refetch } = useAppContext();
  const sid = getSocietyId();

  const [catFilter, setCatFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [localData, setLocalData] = useState([]);

  // ── Map ctxAnon → expense shape ──────────────────────────────────
  const apiExpenses = useMemo(() => ctxAnon.map((r, i) => ({
    _rawId: r.id,
    _key: `api-${r.id || i}`,
    id: r.receiptId || `ANR-${String(i + 1).padStart(3, "0")}`,
    category: r.category || r.type || r.expense_type || "Admin",
    description: r.description || r.narration || r.title || "Miscellaneous",
    amount: Number(r.amount || 0),
    vendor: r.vendor || r.vendor_name || r.receivedFrom || "—",
    date: r.date || r.receipt_date || r.createdAt || "",
    approvedBy: r.approvedBy || r.created_by || "Admin",
    status: ["confirmed", "paid", "success", "completed"].includes((r.status || "").toLowerCase()) ? "Paid" : "Pending",
  })).filter(r => r.amount > 0), [ctxAnon]);

  const baseData = (apiExpenses.length > 0 ? apiExpenses : expenseData.map((r, i) => ({ ...r, _key: `mock-${i}` })));
  const localKeyed = localData.map((r, i) => ({ ...r, _key: `local-${i}` }));
  const data = [...baseData, ...localKeyed];

  const PER = 10;
  const cats = ["All", "Security", "Utility", "Housekeeping", "Maintenance", "Admin", "Other"];
  const filtered = data.filter(r => {
    if (catFilter !== "All" && r.category !== catFilter) return false;
    if (search && !r.description.toLowerCase().includes(search.toLowerCase()) &&
      !(r.vendor || "").toLowerCase().includes(search.toLowerCase()) &&
      !(r.id || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const paged = filtered.slice((page - 1) * PER, page * PER);
  const totalExp = data.reduce((s, r) => s + r.amount, 0);
  const paidExp = data.filter(r => r.status === "Paid").reduce((s, r) => s + r.amount, 0);

  // ── Dynamic category chart ────────────────────────────────────────
  const CAT_COLORS = { Security: "#6c63ff", Utility: "#00d4aa", Housekeeping: "#ffb347", Maintenance: "#ff6b6b", Admin: "#00b4d8", Other: "#8899aa" };
  const dynExpCats = useMemo(() => {
    const agg = {};
    data.forEach(r => { const c = r.category || "Admin"; agg[c] = (agg[c] || 0) + r.amount; });
    const entries = Object.entries(agg).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return expenseCategories;
    return entries.map(([name, value], i) => ({ name, value, color: CAT_COLORS[name] || ["#6c63ff", "#00d4aa", "#ffb347", "#ff6b6b", "#00b4d8"][i % 5] }));
  }, [data]);

  const topCat = dynExpCats[0];

  const dynMonthlyForExp = useMemo(() => {
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (data.length === 0) return monthlyData;
    const agg = {};
    data.forEach(r => {
      if (!r.date) return;
      const dt = new Date(r.date); if (isNaN(dt)) return;
      const key = MONTHS[dt.getMonth()];
      if (!agg[key]) agg[key] = { month: key, collected: 0, expenses: 0 };
      agg[key].expenses += r.amount;
    });
    const sorted = Object.values(agg).sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month));
    return sorted.length >= 2 ? sorted : monthlyData;
  }, [data]);

  // ── Delete ────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true); setDeleteError("");
    try {
      await deleteAnonymousReceiptApi(deleteTarget._rawId || deleteTarget.id);
      setLocalData(d => d.filter(x => x._key !== deleteTarget._key));
      if (setAnonymousReceipts) setAnonymousReceipts(prev => prev.filter(r => String(r.id) !== String(deleteTarget._rawId)));
      setDeleteTarget(null);
      if (refetch) refetch();
    } catch (err) {
      const msg = err?.response?.data?.message;
      setDeleteError(Array.isArray(msg) ? msg.join(", ") : msg || err?.message || "Failed to delete.");
    } finally { setDeleteLoading(false); }
  }, [deleteTarget, setAnonymousReceipts, refetch]);

  // ── Mark Paid ─────────────────────────────────────────────────────
  const handleMarkPaid = useCallback(async (r) => {
    try {
      await updateAnonymousReceiptApi({ status: "Confirmed" }, r._rawId || r.id);
      if (setAnonymousReceipts) setAnonymousReceipts(prev =>
        prev.map(x => String(x.id) === String(r._rawId) ? { ...x, status: "Confirmed" } : x)
      );
      setLocalData(d => d.map(x => x._key === r._key ? { ...x, status: "Paid" } : x));
    } catch (err) { console.error("[ExpenseTab] markPaid error:", err?.message); }
  }, [setAnonymousReceipts]);

  // ── Add Expense form ──────────────────────────────────────────────
  const EMPTY_FORM = { category: "Security", description: "", amount: "", vendor: "", date: "", approvedBy: "Admin", status: "Pending", societyIdentifier: sid };
  const [form, setForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const handleAddExpense = useCallback(async () => {
    if (!form.amount || !form.description) { setAddError("Description and Amount are required."); return; }
    if (!form.date) { setAddError("Date is required."); return; }
    setAddLoading(true); setAddError("");
    try {
      // POST /anonymous-receipt/new-anonymous-receipt
      const payload = {
        societyIdentifier: sid,
        description: form.description,
        amount: Number(form.amount),
        category: form.category,
        ...(form.vendor ? { vendor: form.vendor } : {}),
        ...(form.date ? { receiptDate: form.date } : {}),
        ...(form.approvedBy ? { approvedBy: form.approvedBy } : {}),
      };
      console.log("[AddExpense] payload →", JSON.stringify(payload, null, 2));
      await addReceiptApi(payload);
      setLocalData(d => [...d, {
        id: `EXP-NEW-${Date.now()}`,
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
        vendor: form.vendor || "—",
        date: form.date,
        approvedBy: form.approvedBy,
        status: "Pending",
        _local: true,
      }]);
      setShowAdd(false); setForm(EMPTY_FORM);
      if (refetch) refetch();
    } catch (err) {
      const msg = err?.response?.data?.message;
      setAddError(Array.isArray(msg) ? msg.join(", ") : msg || err?.message || "Failed to add expense.");
    } finally { setAddLoading(false); }
  }, [form, sid, refetch]);

  return (
    <div>
      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        <StatKPI label="Total Expenses" value={fmtFull(totalExp)} sub={`${data.length} vouchers`} color="#ff6b6b" icon={ArrowDownRight} trend={8.2} up={false} />
        <StatKPI label="Paid" value={fmtFull(paidExp)} sub={`${data.filter(r => r.status === "Paid").length} cleared`} color="#00d4aa" icon={CheckCircle} trend={5.1} up={true} />
        <StatKPI label="Pending Approval" value={fmtFull(data.filter(r => r.status === "Pending").reduce((s, r) => s + r.amount, 0))} sub="Awaiting" color="#ffb347" icon={Clock} trend={12.4} up={false} />
        <StatKPI label="Top Category" value={topCat?.name || "—"} sub={topCat ? fmtFull(topCat.value) + " spent" : "No data"} color="#6c63ff" icon={Layers} />
      </div>

      {/* ── Charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <SectionHead title="Monthly Expense vs Income" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dynMonthlyForExp} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => fmt(v)} tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<AccTip />} />
              <Bar dataKey="collected" name="Income" fill="var(--accent-teal)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ff6b6b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionHead title="By Category" />
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={dynExpCats} cx="50%" cy="50%" innerRadius={32} outerRadius={55} paddingAngle={4} dataKey="value">
                {dynExpCats.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
              </Pie>
              <Tooltip formatter={v => fmtFull(v)} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          {dynExpCats.slice(0, 5).map((d, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < Math.min(dynExpCats.length, 5) - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} /><span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{d.name}</span></div>
              <span style={{ color: d.color, fontWeight: 600, fontSize: 12, fontFamily: "var(--font-mono)" }}>{fmtFull(d.value)}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* ── Table ── */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {cats.map(c => (
              <button key={c} onClick={() => { setCatFilter(c); setPage(1); }} style={{ background: catFilter === c ? "rgba(255,107,107,0.12)" : "none", border: `1px solid ${catFilter === c ? "#ff6b6b" : "var(--border)"}`, borderRadius: 8, padding: "5px 12px", color: catFilter === c ? "#ff6b6b" : "var(--text-muted)", fontSize: 12, fontWeight: catFilter === c ? 600 : 400, cursor: "pointer" }}>{c}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search expense, vendor…" />
            <BtnPrimary onClick={() => { setShowAdd(true); setAddError(""); setForm(EMPTY_FORM); }} style={{ background: "rgba(255,107,107,0.15)", color: "#ff6b6b", border: "1px solid rgba(255,107,107,0.3)" }}><Plus size={12} /> Add Expense</BtnPrimary>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <TH>Exp ID</TH><TH>Category</TH><TH>Description</TH><TH>Vendor</TH>
              <TH align="right">Amount</TH><TH>Date</TH><TH>Approved By</TH><TH>Status</TH><TH>Actions</TH>
            </tr></thead>
            <tbody>
              {paged.map(r => (
                <tr key={r._key || r.id} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <TD><span style={{ color: "#ff6b6b", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>{r.id}</span></TD>
                  <TD><span style={{ background: "rgba(255,107,107,0.1)", color: CAT_COLORS[r.category] || "#ff6b6b", borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>{r.category}</span></TD>
                  <TD><span style={{ color: "var(--text-primary)", fontSize: 13 }}>{r.description}</span></TD>
                  <TD><span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{r.vendor}</span></TD>
                  <TD style={{ textAlign: "right" }}><span style={{ color: "#ff6b6b", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{fmtFull(r.amount)}</span></TD>
                  <TD><span style={{ color: "var(--text-muted)", fontSize: 12 }}>{r.date}</span></TD>
                  <TD><span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{r.approvedBy}</span></TD>
                  <TD><Pill status={r.status} /></TD>
                  <TD><div style={{ display: "flex", gap: 4 }}>
                    <TableBtn icon={Eye} color="var(--accent-teal)" onClick={() => { }} title="View" />
                    {r.status !== "Paid" && (
                      <TableBtn icon={Check} color="#00d4aa" onClick={() => handleMarkPaid(r)} title="Mark Paid" />
                    )}
                    <TableBtn icon={Trash2} color="#ff6b6b" onClick={() => { setDeleteTarget(r); setDeleteError(""); }} title="Delete" />
                  </div></TD>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={9} style={{ padding: "40px 12px", textAlign: "center", color: "var(--text-muted)" }}>No expenses found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
      </Card>

      {/* ── Delete Confirm Modal ── */}
      <Modal open={!!deleteTarget} onClose={() => { if (!deleteLoading) { setDeleteTarget(null); setDeleteError(""); } }} title="Delete Expense" width={420}>
        {deleteTarget && <div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20, padding: "14px 16px", background: "rgba(255,107,107,0.07)", borderRadius: 12, border: "1px solid rgba(255,107,107,0.2)" }}>
            <AlertTriangle size={22} color="#ff6b6b" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Delete <span style={{ color: "#ff6b6b", fontFamily: "var(--font-mono)" }}>{deleteTarget.id}</span>?</div>
              <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{deleteTarget.description} · <strong>{fmtFull(deleteTarget.amount)}</strong></div>
            </div>
          </div>
          {deleteError && (
            <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, color: "#ff6b6b", fontSize: 12 }}>
              <AlertCircle size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />{deleteError}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <BtnGhost onClick={() => { if (!deleteLoading) { setDeleteTarget(null); setDeleteError(""); } }}>Cancel</BtnGhost>
            <BtnPrimary color="red" onClick={handleDelete} style={{ opacity: deleteLoading ? 0.7 : 1 }}>
              {deleteLoading ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Deleting…</> : <><Trash2 size={12} /> Confirm Delete</>}
            </BtnPrimary>
          </div>
        </div>}
      </Modal>

      {/* ── Add Expense Modal ── */}
      <Modal open={showAdd} onClose={() => { if (!addLoading) { setShowAdd(false); setAddError(""); } }} title="Add Expense Entry">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FS label="Category *" field="category" options={["Security", "Utility", "Housekeeping", "Maintenance", "Admin", "Other"]} form={form} setForm={setForm} />
          <FI label="Amount (₹) *" field="amount" type="number" form={form} setForm={setForm} />
          <div style={{ gridColumn: "1/-1" }}><FI label="Description *" field="description" form={form} setForm={setForm} /></div>
          <FI label="Vendor Name" field="vendor" form={form} setForm={setForm} />
          <FI label="Date *" field="date" type="date" form={form} setForm={setForm} />
          <FI label="Approved By" field="approvedBy" form={form} setForm={setForm} />
        </div>
        {addError && (
          <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "10px 14px", margin: "12px 0 0", color: "#ff6b6b", fontSize: 12 }}>
            <AlertCircle size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />{addError}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <BtnGhost onClick={() => { if (!addLoading) { setShowAdd(false); setAddError(""); } }}>Cancel</BtnGhost>
          <BtnPrimary onClick={handleAddExpense} style={{ background: "rgba(255,107,107,0.15)", color: "#ff6b6b", border: "1px solid rgba(255,107,107,0.3)", opacity: addLoading ? 0.7 : 1 }}>
            {addLoading ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : <><Plus size={12} /> Add Expense</>}
          </BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}

// ── TAB: BANK ACCOUNTS ───────────────────────────────────────────────

// ── TAB: ACKNOWLEDGEMENTS ────────────────────────────────────────────


// ── TAB: ONLINE SELF PAY ─────────────────────────────────────────────


// ── TAB: ANALYTICS ───────────────────────────────────────────────────

// ── MAIN EXPORT ──────────────────────────────────────────────────────
const TABS = [
  { id: "invoice", label: "Invoice", icon: FileText },
  { id: "receipt", label: "Receipt", icon: Receipt },
  { id: "ledger", label: "Ledger", icon: BookOpen },
  { id: "cashcheque", label: "Cash & Cheque", icon: DollarSign },
  // { id: "expense", label: "Expenses", icon: ArrowDownRight },

  { id: "acknowledge", label: "Acknowledgements", icon: Send },
  { id: "onlineself", label: "Online / Self Pay", icon: Globe },

];

export default function AccountsDashboard() {
  const { refetch, loading: ctxLoading, usingMock, selectedSociety } = useAppContext();
  const [activeTab, setActiveTab] = useState("invoice");
  const [refreshing, setRefreshing] = useState(false);

  // ── society string derived from global context (no local state needed) ───
  const society = selectedSociety
    ? (selectedSociety.societyName || selectedSociety.societyIdentifier || "All Societies")
    : "All Societies";

  const renderTab = () => {
    switch (activeTab) {
      case "invoice": return <InvoiceTab society={society} />;
      case "receipt": return <ReceiptTab society={society} />;
      case "ledger": return <LedgerTab society={society} />;
      case "cashcheque": return <CashChequeTab society={society} />;
      // case "expense": return <ExpenseTab society={society} />;
      case "acknowledge": return <AcknowledgeTab society={society} />;
      case "onlineself": return <OnlineSelfPayTab society={society} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-base)", overflow: "hidden" }}>
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "var(--bg-surface)", borderBottom: "1px solid var(--border)", flexShrink: 0, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ color: "var(--text-primary)", fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px" }}>Accounts</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 11, marginTop: 2 }}>
            Billing, receipts & financial management · FY 2025–26
            {usingMock && <span style={{ marginLeft: 8, background: "rgba(255,179,71,0.15)", color: "#ffb347", borderRadius: 10, padding: "1px 8px", fontSize: 10, fontWeight: 600 }}>DEMO DATA</span>}
            {ctxLoading && <span style={{ marginLeft: 8, background: "rgba(0,212,170,0.15)", color: "var(--accent-teal)", borderRadius: 10, padding: "1px 8px", fontSize: 10, fontWeight: 600 }}>LOADING...</span>}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <GlobalSocietySelector />
          <BtnGhost onClick={() => { }} style={{ fontSize: 12 }}><Download size={13} /> Export <ChevronDown size={11} /></BtnGhost>
          <BtnGhost onClick={() => { }} style={{ fontSize: 12 }}><MessageSquare size={13} /> Bulk SMS <ChevronDown size={11} /></BtnGhost>
          <button onClick={() => { setRefreshing(true); refetch().finally(() => setRefreshing(false)); }}
            style={{ width: 36, height: 36, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", cursor: "pointer" }}>
            <RefreshCw size={14} className={refreshing ? "spin" : ""} />
          </button>
          <BtnPrimary onClick={() => { }}><Zap size={13} /> Invoice Processing</BtnPrimary>
        </div>
      </header>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)", overflowX: "auto", flexShrink: 0, paddingLeft: 8 }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: "none", border: "none", padding: "11px 16px", borderBottom: `2px solid ${isActive ? "var(--accent-teal)" : "transparent"}`, color: isActive ? "var(--accent-teal)" : "var(--text-muted)", cursor: "pointer", fontWeight: isActive ? 600 : 400, fontSize: 12, display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s", whiteSpace: "nowrap", fontFamily: "inherit" }}>
              <Icon size={13} />{t.label}
            </button>
          );
        })}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {renderTab()}
      </div>
    </div>
  );
}