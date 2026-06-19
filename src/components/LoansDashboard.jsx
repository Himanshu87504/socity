// @ts-nocheck
// LoansDashboard.jsx

import React, { useState, useEffect, useRef } from "react";
import {
  Landmark, Plus, Search,
  Edit2, Trash2, Eye, X,
  ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
  CheckCircle2, ChevronDown,
  Building2, CheckCircle, RefreshCw,
} from "lucide-react";

import { getAllPropertyApi } from "../api/property-api";
import { useAppContext } from "../AppContext";
import { addNewLoanApi, updateLoanApi, deleteLoanApi, getAllLoansApi } from "../api/loan-api";
import { getAllMembersApi, getSocietyMembersApi } from "../api/member-api";
import { getAllSocietyApi } from "../api/society-api";

// ─── CONSTANTS ───────────────────────────────

const LOAN_TYPES = [
  "Home Improvement", "Emergency", "Maintenance Deposit",
  "Society Corpus", "Personal", "Festival Advance",
];

const EMPTY_FORM = {
  property: "", member: "", name: "", type: LOAN_TYPES[0],
  period: "", number: "", amount: "", emi: "",
  startDate: "", endDate: "", bankName: "", bankAddress: "",
  loanFile: null,
  societyIdentifier: "", societyName: "",
};

const PER_PAGE = 9;

// ─── HELPERS ─────────────────────────────────

const formatNumber = (n) => Number(n).toLocaleString("en-IN");

const toInputDate = (dateStr) => {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [day, month, year] = dateStr.split("-");
  if (year && month && day) return `${year}-${month}-${day}`;
  return dateStr;
};

const mapLoanStatusLocal = (raw) => {
  const s = (raw || "").toLowerCase();
  if (["active", "running", "current", "ongoing"].includes(s)) return "Active";
  if (["closed", "repaid", "completed", "settled"].includes(s)) return "Closed";
  return "Pending";
};

// Normalize a raw loan record from the API into the shape the table/forms expect
// (mirrors mapLoan in AppContext.jsx, used for the society-filtered fetch below)
const normalizeLoan = (item, i) => ({
  id:          item.loanIdentifier || item._id || item.id || i + 1,
  loanIdentifier: item.loanIdentifier || item._id || item.id || "",
  loanNumber:  item.loanNumber || item.loan_number || item.loanId || item.loan_id || item.loanIdentifier || item.identifier || `LN-${String(i + 1).padStart(7, "0")}`,
  property:    item.property || item.propertyIdentifier || item.property_identifier || item.flat_no || item.propertyNumber || item.property_number || "",
  member:      item.memberType || item.fullNamekkj || item.full_name || item.member_name || item.memberName || item.owner_name || item.ownerName || "",
  name:        item.fullName || item.loan_name || item.loanName || item.name || item.purpose || item.description || "",
  type:        item.type || item.loan_type || item.loanType || "",
  period:      item.period || item.tenure || item.duration || item.loan_period || "",
  amount:      Number(item.amount || item.loan_amount || item.loanAmount || item.principal || 0),
  emi:         Number(item.emi || item.monthlyEmi || item.monthly_emi || item.emiAmount || item.emi_amount || item.monthly_payment || 0),
  status:      mapLoanStatusLocal(item.status || item.loan_status || ""),
  disbursed:   item.disbursed || item.disbursed_date || item.disbursementDate || item.disbursal_date || item.startDate || item.start_date || "",
  bankName:    item.bankName || "",
  bankAddress: item.bankAddress || "",
  startDate:   item.startDate || "",
  endDate:     item.endDate || "",
  societyIdentifier: item.societyIdentifier || item.society?.societyIdentifier || "",
});

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

const FormInput = ({ label, field, type = "text", prefix, form, setForm }) => (
  <div style={fieldWrapper}>
    <label style={labelStyle}>{label}</label>
    {prefix ? (
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 11, top: "50%",
          transform: "translateY(-50%)",
          color: "#6b7a90", fontSize: 13, pointerEvents: "none",
        }}>{prefix}</span>
        <input
          type={type}
          value={form[field] || ""}
          onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
          style={{ ...inputStyle, paddingLeft: 24 }}
        />
      </div>
    ) : (
      <input
        type={type}
        value={form[field] || ""}
        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
        style={inputStyle}
      />
    )}
  </div>
);

// ─── FORM SELECT ──────────────────────────────

const FormSelect = ({ label, field, options, form, setForm }) => (
  <div style={fieldWrapper}>
    <label style={labelStyle}>{label}</label>
    <select
      value={form[field] || ""}
      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
      style={inputStyle}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

// ─── SOCIETY SEARCH ENGINE ────────────────────

function SocietySearchEngine({ societies, selectedSociety, onSelect, loading, placeholder = "All Societies", accentColor = "#6c63ff" }) {
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
    : placeholder;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(v => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen(v => !v); }}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: selectedSociety ? `${accentColor}12` : "rgba(255,255,255,0.05)",
          border: `1.5px solid ${selectedSociety ? `${accentColor}60` : "rgba(255,255,255,0.09)"}`,
          borderRadius: 10, padding: "8px 14px", color: "var(--text-primary)",
          fontSize: 13, cursor: "pointer", fontWeight: 600, width: "100%",
          justifyContent: "space-between", transition: "all 0.15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Building2 size={14} style={{ color: selectedSociety ? accentColor : "#6b7a90", flexShrink: 0 }} />
          <span style={{ color: selectedSociety ? accentColor : "var(--text-primary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {loading && <RefreshCw size={11} style={{ color: "#6b7a90", animation: "spin 1s linear infinite" }} />}
          {selectedSociety && (
            <button
              onClick={e => { e.stopPropagation(); onSelect(null); }}
              style={{ background: "none", border: "none", padding: "0 2px", cursor: "pointer", color: "#6b7a90", display: "flex", alignItems: "center" }}
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown size={12} style={{ color: "#6b7a90", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s" }} />
        </div>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: "#1a2233",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12, zIndex: 600, boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#6b7a90" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search society name or ID..."
                style={{ ...inputStyle, padding: "7px 10px 7px 28px", fontSize: 12 }}
              />
            </div>
          </div>

          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            <button
              onClick={() => { onSelect(null); setOpen(false); setQuery(""); }}
              style={{
                width: "100%", textAlign: "left", padding: "10px 14px",
                background: !selectedSociety ? `${accentColor}12` : "none",
                border: "none", cursor: "pointer",
                color: !selectedSociety ? accentColor : "var(--text-primary)",
                fontSize: 12, fontWeight: !selectedSociety ? 700 : 400,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              <span>{placeholder}</span>
              {!selectedSociety && <CheckCircle size={12} style={{ color: accentColor }} />}
            </button>

            {filtered.length === 0 && (
              <div style={{ padding: "12px 14px", color: "#6b7a90", fontSize: 12, textAlign: "center" }}>No societies found</div>
            )}

            {filtered.map(s => {
              const isActive = selectedSociety?.societyIdentifier === s.societyIdentifier;
              return (
                <button
                  key={s.societyIdentifier}
                  onClick={() => { onSelect(s); setOpen(false); setQuery(""); }}
                  style={{
                    width: "100%", textAlign: "left", padding: "10px 14px",
                    background: isActive ? `${accentColor}12` : "none",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "none"; }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: isActive ? `${accentColor}20` : "rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: isActive ? accentColor : "#6b7a90",
                  }}>
                    {(s.societyName || s.societyIdentifier || "S").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: isActive ? accentColor : "var(--text-primary)", fontSize: 12, fontWeight: isActive ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.societyName || s.societyIdentifier}
                    </div>
                    <div style={{ color: "#6b7a90", fontSize: 10 }}>{s.societyIdentifier}</div>
                  </div>
                  {isActive && <CheckCircle size={13} style={{ color: accentColor, flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SEARCHABLE PROPERTY SELECT ───────────────

const SearchableSelect = ({ label, value, onChange, options, placeholder = "Search..." }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );
  const selected = options.find((o) => o.value === value);

  return (
    <div style={{ ...fieldWrapper, position: "relative" }} ref={ref}>
      <label style={labelStyle}>{label}</label>
      <div
        onClick={() => setOpen((p) => !p)}
        style={{
          ...inputStyle,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer",
          color: selected ? "var(--text-primary)" : "#3d4a5c",
          borderColor: open ? "rgba(108,99,255,0.5)" : "rgba(255,255,255,0.09)",
          background: open ? "rgba(108,99,255,0.05)" : "rgba(255,255,255,0.05)",
        }}
      >
        <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} style={{ color: "#6b7a90", flexShrink: 0, marginLeft: 8, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 9999,
          background: "#1a2233", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#6b7a90" }} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Search property..."
                style={{ ...inputStyle, paddingLeft: 30, fontSize: 12, borderRadius: 7, padding: "7px 10px 7px 30px" }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "14px", color: "#6b7a90", fontSize: 13, textAlign: "center" }}>No property found</div>
            ) : (
              filtered.map((o) => {
                const isSelected = o.value === value;
                return (
                  <div
                    key={o.value}
                    onClick={() => { onChange(o.value); setQuery(""); setOpen(false); }}
                    style={{
                      padding: "10px 14px", fontSize: 13,
                      color: isSelected ? "#6c63ff" : "var(--text-primary)",
                      background: isSelected ? "rgba(108,99,255,0.1)" : "transparent",
                      cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isSelected ? "rgba(108,99,255,0.18)" : "rgba(255,255,255,0.05)"}
                    onMouseLeave={e => e.currentTarget.style.background = isSelected ? "rgba(108,99,255,0.1)" : "transparent"}
                  >
                    <span>{o.label}</span>
                    {isSelected && <CheckCircle2 size={13} color="#6c63ff" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PAGINATION ───────────────────────────────

const Pagination = ({ page, total, perPage, onChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const visiblePages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) visiblePages.push(i);
  const btnBase = { background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" };
  const isFirst = page === 1;
  const isLast = page === totalPages;

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
      <span style={{ color: "#8899aa", fontSize: 12 }}>
        Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {formatNumber(total)}
      </span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button onClick={() => onChange(1)} disabled={isFirst} style={{ ...btnBase, color: isFirst ? "#556677" : "#8899aa" }}><ChevronsLeft size={12} /></button>
        <button onClick={() => onChange(page - 1)} disabled={isFirst} style={{ ...btnBase, color: isFirst ? "#556677" : "#8899aa" }}><ChevronLeft size={12} /></button>
        {visiblePages.map((p) => (
          <button key={p} onClick={() => onChange(p)} style={{ ...btnBase, background: p === page ? "#00d4aa" : "none", border: `1px solid ${p === page ? "#00d4aa" : "var(--border)"}`, color: p === page ? "#000" : "#8899aa", fontWeight: p === page ? 700 : 400, fontSize: 12, minWidth: 30 }}>{p}</button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={isLast} style={{ ...btnBase, color: isLast ? "#556677" : "#8899aa" }}><ChevronRight size={12} /></button>
        <button onClick={() => onChange(totalPages)} disabled={isLast} style={{ ...btnBase, color: isLast ? "#556677" : "#8899aa" }}><ChevronsRight size={12} /></button>
      </div>
    </div>
  );
};

// ─── MEMBER SEARCH SELECT ─────────────────────────────────────────────────
function MemberSearchSelect({ members, loading, value, onChange, societyName }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const ref      = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  // Build display name from member object
  const fullName = (m) => [m.firstName, m.lastName].filter(Boolean).join(" ");

  const filtered = members.filter(m => {
    const q = query.toLowerCase();
    return fullName(m).toLowerCase().includes(q) ||
           (m.mobileNumber || "").includes(q) ||
           (m.identifier  || "").toLowerCase().includes(q);
  });

  const selected = members.find(m => m.identifier === value || fullName(m) === value);
  const displayLabel = selected ? fullName(selected) : "";

  return (
    <div style={{ ...fieldWrapper, position: "relative" }} ref={ref}>
      <label style={labelStyle}>
        Member
        {societyName && (
          <span style={{ color: "#6c63ff", fontWeight: 500, marginLeft: 6, fontSize: 10 }}>
            ({societyName})
          </span>
        )}
      </label>

      {/* Trigger */}
      <div
        onClick={() => setOpen(p => !p)}
        style={{
          ...inputStyle,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer",
          borderColor: open ? "rgba(108,99,255,0.5)" : "rgba(255,255,255,0.09)",
          background: open ? "rgba(108,99,255,0.05)" : "rgba(255,255,255,0.05)",
          color: displayLabel ? "var(--text-primary)" : "#3d4a5c",
        }}
      >
        {loading ? (
          <span style={{ fontSize: 12, color: "#6b7a90", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 10, height: 10, border: "2px solid #6c63ff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            Loading members…
          </span>
        ) : (
          <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayLabel || "Search & select member…"}
          </span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          {displayLabel && (
            <button
              onClick={e => { e.stopPropagation(); onChange(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7a90", display: "flex", padding: "0 2px" }}
            >
              <X size={11} />
            </button>
          )}
          <ChevronDown size={13} style={{ color: "#6b7a90", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 9999,
          background: "#1a2233", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
        }}>
          {/* Search box */}
          <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#6b7a90" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
                placeholder="Search by name or mobile…"
                style={{ ...inputStyle, padding: "7px 10px 7px 30px", fontSize: 12 }}
              />
            </div>
          </div>

          {/* Options */}
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {loading && (
              <div style={{ padding: "12px 14px", color: "#6b7a90", fontSize: 12, textAlign: "center" }}>
                Loading members…
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div style={{ padding: "14px", color: "#6b7a90", fontSize: 13, textAlign: "center" }}>
                {members.length === 0 ? "No members found for this society" : "No match found"}
              </div>
            )}
            {!loading && filtered.map(m => {
              const name    = fullName(m);
              const isActive = m.identifier === value || name === value;
              return (
                <div
                  key={m.identifier}
                  onClick={() => { onChange(m.identifier || name); setQuery(""); setOpen(false); }}
                  style={{
                    padding: "10px 14px", cursor: "pointer",
                    background: isActive ? "rgba(108,99,255,0.12)" : "transparent",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    display: "flex", alignItems: "center", gap: 10,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: isActive ? "rgba(108,99,255,0.2)" : "rgba(255,255,255,0.07)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700,
                    color: isActive ? "#6c63ff" : "#8899aa",
                  }}>
                    {(m.firstName || "?").charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: isActive ? "#6c63ff" : "var(--text-primary)", fontSize: 13, fontWeight: isActive ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {name}
                    </div>
                    {m.mobileNumber && (
                      <div style={{ color: "#6b7a90", fontSize: 11 }}>{m.mobileNumber}</div>
                    )}
                  </div>

                  {isActive && <CheckCircle2 size={13} color="#6c63ff" />}
                </div>
              );
            })}
          </div>

          {/* Footer hint */}
          {!loading && members.length > 0 && (
            <div style={{ padding: "6px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", color: "#6b7a90", fontSize: 10 }}>
              {filtered.length} of {members.length} member{members.length !== 1 ? "s" : ""}
              {societyName ? ` in ${societyName}` : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────

export default function LoansDashboard() {

  const {
    loans: ctxLoans,
    setLoans,
    selectedSociety,
    setSelectedSociety,
    societies: contextSocieties,
  } = useAppContext();

  const [allSocieties,     setAllSocieties]     = useState([]);
  const [societiesLoading, setSocietiesLoading] = useState(false);
  const [properties,       setProperties]       = useState([]);
  const [members,          setMembers]          = useState([]);

  // Society-filtered loans from backend
  const [societyLoans,       setSocietyLoans]       = useState(null);
  const [societyFetchLoading, setSocietyFetchLoading] = useState(false);

  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [viewItem,     setViewItem]     = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError,  setActionError]  = useState(null);

  // ── Fetch societies ──────────────────────────────────────────────────────
  useEffect(() => {
    setSocietiesLoading(true);
    getAllSocietyApi()
      .then(res => {
        const arr = res?.data?.data || res?.data || [];
        setAllSocieties(Array.isArray(arr) ? arr : []);
      })
      .catch(() => {
        if (contextSocieties?.length > 0)
          setAllSocieties(contextSocieties.map(s => ({
            societyIdentifier: s.societyIdentifier || s.id,
            societyName: s.societyName || s.name || s.societyIdentifier,
          })));
      })
      .finally(() => setSocietiesLoading(false));
  }, []);

  // ── When selectedSociety changes, fetch that society's loans ────────────
  useEffect(() => {
    if (!selectedSociety) {
      setSocietyLoans(null);
      return;
    }
    (async () => {
      setSocietyFetchLoading(true);
      try {
        const res = await getAllLoansApi(selectedSociety.societyIdentifier);
        const arr = res?.data?.data || res?.data || [];
        const list = Array.isArray(arr) ? arr : [];
        setSocietyLoans(list.map(normalizeLoan));
      } catch (err) {
        console.warn("[SocietyLoans] fetch failed:", err?.message);
        // Fallback: filter from context
        setSocietyLoans(
          (ctxLoans || []).filter(l =>
            (l.societyIdentifier || "").toLowerCase() === (selectedSociety.societyIdentifier || "").toLowerCase()
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
      setForm({ ...EMPTY_FORM, startDate: today });
    } else {
      setForm(prev => ({
        ...prev,
        societyIdentifier: selectedSociety.societyIdentifier || "",
        societyName: selectedSociety.societyName || "",
      }));
    }
  }, [selectedSociety, modal]);

  // ── End date auto-calculate ──────────────────────────────────────────────
  useEffect(() => {
    if (!form.startDate || !form.period) return;
    const start = new Date(form.startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + Number(form.period));
    setForm((prev) => ({ ...prev, endDate: end.toISOString().split("T")[0] }));
  }, [form.startDate, form.period]);

  // ── Fetch properties ─────────────────────────────────────────────────────
  useEffect(() => {
    getAllPropertyApi()
      .then(res => setProperties(res?.data?.data || res?.data || []))
      .catch(err => console.error("Property fetch failed:", err));
  }, []);

  // ── Fetch members — society ke according ─────────────────────────────────
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      setMembersLoading(true);
      try {
        let res;
        if (selectedSociety?.societyIdentifier) {
          res = await getSocietyMembersApi(selectedSociety.societyIdentifier);
        } else {
          res = await getAllMembersApi();
        }
        const arr = res?.data?.data || res?.data || [];
        setMembers(Array.isArray(arr) ? arr : []);
      } catch (err) {
        console.error("Member fetch failed:", err);
        setMembers([]);
      } finally {
        setMembersLoading(false);
      }
    };
    fetchMembers();
  }, [selectedSociety]);

  // ── Active data ──────────────────────────────────────────────────────────
  const activeData = selectedSociety ? (societyLoans || []) : (ctxLoans || []);

  // Property options
  const propertyOptions = properties.map((p) => ({
    value: p.propertyIdentifier,
    label: p.propertyName || p.propertyIdentifier,
  }));

  // ── Filtered + paginated ─────────────────────────────────────────────────
  const filtered = activeData.filter((loan) => {
    const q = search.toLowerCase().trim();
    return (
      String(loan.loanNumber || "").toLowerCase().includes(q) ||
      String(loan.member || "").toLowerCase().includes(q) ||
      String(loan.name || "").toLowerCase().includes(q) ||
      String(loan.type || "").toLowerCase().includes(q) ||
      String(loan.property || "").toLowerCase().includes(q) ||
      String(loan.amount || "").includes(q) ||
      String(loan.bankName || "").toLowerCase().includes(q)
    );
  });
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalDisbursed = activeData.reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const totalEMI = activeData.reduce((sum, l) => sum + Number(l.emi || 0), 0);

  const stats = [
    { label: selectedSociety ? "Society Loans" : "Total Loans", value: activeData.length, color: "#6c63ff" },
    { label: "Total Disbursed", value: `₹${totalDisbursed.toLocaleString("en-IN")}`, color: "#00b4d8" },
    { label: "Monthly EMI", value: `₹${totalEMI.toLocaleString("en-IN")}`, color: "#ffb347" },
  ];

  const syncData = (updater) => {
    setSocietyLoans(prev => prev ? updater(prev) : null);
    setLoans(updater);
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name || !form.amount) return;
    setActionLoading(true);
    setActionError(null);

    const payload = { ...form, amount: +form.amount, emi: +form.emi };

    const backendPayload = {
      fullName: payload.name,
      loanNumber: payload.number,
      type: payload.type,
      amount: payload.amount,
      monthlyEmi: payload.emi,
      period: Number(form.period),
      startDate: payload.startDate,
      endDate: payload.endDate,
      bankName: payload.bankName,
      bankAddress: payload.bankAddress,
      propertyIdentifier: form.property,
      memberType: form.member,
      loanFile: form.loanFile,
      societyIdentifier: form.societyIdentifier || selectedSociety?.societyIdentifier || "",
    };

    try {
      if (form.id) {
        await updateLoanApi(backendPayload, form.id);
        syncData((d) => d.map((r) => (r.id === form.id ? payload : r)));
      } else {
        const res = await addNewLoanApi(backendPayload);
        const realId = res?.data?.data?.id || res?.data?.id || res?.data?._id || Date.now();
        syncData((d) => [...d, {
          ...payload, id: realId,
          loanNumber: `LN-2024-${String(activeData.length + 1).padStart(3, "0")}`,
        }]);
      }
    } catch (err) {
      console.warn("[Loan Save] Backend failed:", err?.message);
      setActionError("Backend save failed. UI updated locally.");
      if (form.id) {
        syncData((d) => d.map((r) => (r.id === form.id ? payload : r)));
      } else {
        syncData((d) => [...d, {
          ...payload, id: `local_${Date.now()}`,
          loanNumber: `LN-2024-${String(activeData.length + 1).padStart(3, "0")}`,
        }]);
      }
    } finally {
      setActionLoading(false);
      setModal(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (row) => {
    if (!window.confirm(`Delete loan "${row.loanNumber}"?`)) return;
    if (!row.id) {
      // Local-only entry (no server id); remove from UI directly
      syncData((d) => d.filter((r) => r !== row));
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteLoanApi(row.id);
    } catch (err) {
      console.warn("[Loan Delete] Backend failed:", err?.message);
      setActionError("Backend delete failed. Removed from UI only.");
    } finally {
      syncData((d) => d.filter((r) => r.id !== row.id));
      setActionLoading(false);
    }
  };

  // ── Open Add ──────────────────────────────────────────────────────────────
  const openAddModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setForm({
      ...EMPTY_FORM,
      startDate: today,
      societyIdentifier: selectedSociety?.societyIdentifier || "",
      societyName: selectedSociety?.societyName || "",
    });
    setModal("add");
  };

  const openEditModal = (row) => {
    setForm({
      ...row,
      number: row.loanNumber || "",
      startDate: toInputDate(row.startDate),
      endDate: toInputDate(row.endDate),
    });
    setModal("edit");
  };

  const openViewModal = (row) => { setViewItem(row); setModal("view"); };
  const closeModal = () => setModal(null);

  // Form society obj for engine
  const formSocietyObj = form.societyIdentifier
    ? (allSocieties.find(s => s.societyIdentifier === form.societyIdentifier)
       || { societyIdentifier: form.societyIdentifier, societyName: form.societyName || form.societyIdentifier })
    : null;

  // ─── RENDER ───────────────────────────────────

  return (
    <div style={{ padding: 28 }}>

      {/* Error banner */}
      {actionError && (
        <div style={{ background: "rgba(255,107,107,0.15)", border: "1px solid #ff6b6b", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#ff6b6b", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ {actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Loan</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Track member loans, EMIs, and repayment schedules</p>
        </div>
        <button
          onClick={openAddModal}
          style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#1a2a4a,#162040)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 10, padding: "10px 18px", color: "#e8edf5", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
        >
          <Plus size={15} /> Add Loan
        </button>
      </div>

      {/* ── Society Search Engine ─────────────────────────────────────── */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={14} style={{ color: "#6c63ff" }} />
            <span style={{ color: "#6c63ff", fontWeight: 700, fontSize: 12, letterSpacing: "0.5px" }}>SOCIETY FILTER</span>
          </div>
          {selectedSociety && (
            <span style={{ color: "#8899aa", fontSize: 11 }}>
              {societyFetchLoading ? "⏳ Loading..." : `${activeData.length} loan${activeData.length !== 1 ? "s" : ""} found`}
            </span>
          )}
        </div>
        <SocietySearchEngine
          societies={allSocieties}
          selectedSociety={selectedSociety}
          onSelect={(s) => { setSelectedSociety(s); setPage(1); setSearch(""); }}
          loading={societiesLoading || societyFetchLoading}
          accentColor="#6c63ff"
        />
        {selectedSociety && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(108,99,255,0.06)", border: "1px solid rgba(108,99,255,0.15)", borderRadius: 8, fontSize: 12, color: "#8899aa" }}>
            Showing loans for <strong style={{ color: "#6c63ff" }}>{selectedSociety.societyName || selectedSociety.societyIdentifier}</strong>
            {" "}· Adding a new loan will pre-fill this society.
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: "var(--bg-card)", border: `1px solid ${s.color}22`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Landmark size={16} style={{ color: s.color }} />
            </div>
            <div>
              <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600 }}>{s.label}</p>
              <p style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 700 }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6c63ff", fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 3, height: 16, background: "#6c63ff", borderRadius: 2 }} />
            LIST OF LOANS
            {selectedSociety && (
              <span style={{ color: "#8899aa", fontSize: 11, fontWeight: 500, marginLeft: 6 }}>
                — {selectedSociety.societyName || selectedSociety.societyIdentifier}
              </span>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Filter Table"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px 8px 32px", color: "var(--text-primary)", fontSize: 13, outline: "none", width: 220 }}
            />
          </div>
        </div>

        {societyFetchLoading && (
          <div style={{ padding: "14px 20px", textAlign: "center", color: "#8899aa", fontSize: 13, background: "rgba(108,99,255,0.03)" }}>
            <RefreshCw size={13} style={{ marginRight: 6, display: "inline-block", animation: "spin 1s linear infinite" }} />
            Loading loans for {selectedSociety?.societyName}...
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["S.No", "Loan Number", "Property", "Member", "Name", "Loan Type", "Loan Period", "Loan Amount", "Monthly EMI", "Action"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && !societyFetchLoading ? (
                <tr><td colSpan={10} style={{ padding: 32, textAlign: "center", color: "#8899aa", fontSize: 13 }}>
                  {selectedSociety ? `No loans found for ${selectedSociety.societyName || selectedSociety.societyIdentifier}` : "No loans found"}
                </td></tr>
              ) : paged.map((row, i) => (
                <tr key={row.id ?? `row-${(page - 1) * PER_PAGE + i}`} style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{(page - 1) * PER_PAGE + i + 1}</td>
                  <td style={{ padding: "12px 14px", color: "#6c63ff", fontWeight: 600, fontSize: 12 }}>{row.loanNumber}</td>
                  <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontWeight: 600 }}>{row.property || "—"}</td>
                  <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{row.member || "—"}</td>
                  <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontSize: 13 }}>{row.name}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ background: "rgba(0,180,216,0.12)", color: "#00b4d8", padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{row.type}</span>
                  </td>
                  <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{row.period}</td>
                  <td style={{ padding: "12px 14px", color: "#00d4aa", fontWeight: 700 }}>₹{Number(row.amount || 0).toLocaleString()}</td>
                  <td style={{ padding: "12px 14px", color: "#ffb347", fontWeight: 600 }}>₹{Number(row.emi || 0).toLocaleString()}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => openViewModal(row)} style={{ background: "rgba(0,180,216,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#00b4d8", cursor: "pointer" }}><Eye size={12} /></button>
                      <button onClick={() => openEditModal(row)} style={{ background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#6c63ff", cursor: "pointer" }}><Edit2 size={12} /></button>
                      <button onClick={() => handleDelete(row)} disabled={actionLoading} style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#ff6b6b", cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.6 : 1 }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
      </div>

      {/* ══ ADD / EDIT MODAL ══ */}
      {(modal === "add" || modal === "edit") && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#161c27", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>

            {/* Header */}
            <div style={{ padding: "20px 24px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(180deg, rgba(108,99,255,0.07) 0%, transparent 100%)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Landmark size={18} color="#6c63ff" />
                </div>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>
                    {modal === "edit" ? "Edit Loan" : "Add New Loan"}
                  </h3>
                  <p style={{ color: "#6b7a90", fontSize: 12, margin: "2px 0 0" }}>
                    {modal === "edit" ? "Update the loan details below" : "Fill in the details to register a loan"}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#6b7a90", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={15} />
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ padding: "4px 24px 8px", overflowY: "auto", flex: 1 }}>

              {/* ── Society — Search Engine ── */}
              <SectionLabel>Society</SectionLabel>
              <div style={fieldWrapper}>
                <label style={labelStyle}>Society <span style={{ color: "#ff6b6b" }}>*</span></label>
                <SocietySearchEngine
                  societies={allSocieties}
                  selectedSociety={formSocietyObj}
                  onSelect={(s) => setForm(f => ({
                    ...f,
                    societyIdentifier: s?.societyIdentifier || "",
                    societyName: s?.societyName || "",
                  }))}
                  loading={societiesLoading}
                  placeholder="Select Society"
                  accentColor="#6c63ff"
                />
              </div>

              <SectionLabel>Basic Info</SectionLabel>
              <div style={grid2}>
                <FormInput label="Loan Name *" field="name" form={form} setForm={setForm} />
                <FormInput label="Loan Number" field="number" form={form} setForm={setForm} />
              </div>
              <div style={grid2}>
                {/* ── Searchable Member Field ── */}
                <MemberSearchSelect
                  members={members}
                  loading={membersLoading}
                  value={form.member}
                  onChange={(val) => setForm(f => ({ ...f, member: val }))}
                  societyName={selectedSociety?.societyName || ""}
                />
                <FormSelect label="Loan Type" field="type" options={LOAN_TYPES} form={form} setForm={setForm} />
              </div>

              <SectionLabel>Financial Details</SectionLabel>
              <div style={grid2}>
                <FormInput label="Loan Amount (₹) *" field="amount" type="number" prefix="₹" form={form} setForm={setForm} />
                <FormInput label="Monthly EMI (₹)" field="emi" type="number" prefix="₹" form={form} setForm={setForm} />
              </div>
              <div style={{ width: "50%" }}>
                <FormInput label="Loan Period (Months)" field="period" type="number" form={form} setForm={setForm} />
              </div>

              <SectionLabel>Tenure</SectionLabel>
              <div style={grid2}>
                <FormInput label="Start Date" field="startDate" type="date" form={form} setForm={setForm} />
                <FormInput label="End Date (auto)" field="endDate" type="date" form={form} setForm={setForm} />
              </div>

              <SectionLabel>Bank Details</SectionLabel>
              <div style={grid2}>
                <FormInput label="Bank Name" field="bankName" form={form} setForm={setForm} />
                <FormInput label="Bank Address" field="bankAddress" form={form} setForm={setForm} />
              </div>

              <SectionLabel>Property</SectionLabel>
              <SearchableSelect
                label="Select Property"
                value={form.property || ""}
                onChange={(val) => setForm((f) => ({ ...f, property: val }))}
                placeholder="Search and select property..."
                options={propertyOptions}
              />

              <SectionLabel>Loan Document</SectionLabel>
              <div style={fieldWrapper}>
                <label style={labelStyle}>Upload Loan File</label>
                <input type="file" accept="image/*,.pdf"
                  onChange={(e) => setForm((f) => ({ ...f, loanFile: e.target.files?.[0] || null }))}
                  style={inputStyle}
                />
                {form.loanFile && (
                  <p style={{ marginTop: 6, color: "#00d4aa", fontSize: 12 }}>{form.loanFile.name}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 24px 18px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0, background: "rgba(0,0,0,0.15)" }}>
              <button onClick={closeModal} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "9px 18px", color: "#8899aa", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={actionLoading} style={{ background: "linear-gradient(135deg, #6c63ff 0%, #00b4d8 100%)", border: "none", borderRadius: 9, padding: "9px 22px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 7 }}>
                <CheckCircle2 size={14} />
                {actionLoading ? "Saving…" : "Save Loan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ VIEW MODAL ══ */}
      {modal === "view" && viewItem && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#161c27", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: "100%", maxWidth: 440, boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
            <div style={{ padding: "20px 24px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(180deg, rgba(108,99,255,0.07) 0%, transparent 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Landmark size={18} color="#6c63ff" />
                </div>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16, margin: 0 }}>Loan Details</h3>
                  <p style={{ color: "#6b7a90", fontSize: 12, margin: "2px 0 0" }}>Read-only overview</p>
                </div>
              </div>
              <button onClick={closeModal} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#6b7a90", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.15)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <p style={{ color: "#6c63ff", fontWeight: 700, fontSize: 13 }}>{viewItem.loanNumber}</p>
                <p style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700, marginTop: 4 }}>₹{Number(viewItem.amount || 0).toLocaleString()}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.12)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                  <p style={{ color: "#8899aa", fontSize: 11 }}>Monthly EMI</p>
                  <p style={{ color: "#00d4aa", fontWeight: 700, fontSize: 18, marginTop: 4 }}>₹{Number(viewItem.emi || 0).toLocaleString()}</p>
                </div>
                <div style={{ background: "rgba(255,179,71,0.06)", border: "1px solid rgba(255,179,71,0.12)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                  <p style={{ color: "#8899aa", fontSize: 11 }}>Period</p>
                  <p style={{ color: "#ffb347", fontWeight: 700, fontSize: 18, marginTop: 4 }}>{viewItem.period} mo</p>
                </div>
              </div>

              {[
                ["Member",     viewItem.member    || "—"],
                ["Property",   viewItem.property  || "—"],
                ["Loan Type",  viewItem.type      || "—"],
                ["Start Date", viewItem.startDate || "—"],
                ["End Date",   viewItem.endDate   || "—"],
                ["Bank",       viewItem.bankName  || "—"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ color: "#6b7a90", fontSize: 13 }}>{label}</span>
                  <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}