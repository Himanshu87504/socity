// import React, { useState, useMemo, useCallback } from "react";
// import { useAppContext } from "../AppContext";
// import {
//     getPropertyOutstandingApi,
//     downloadBulkLedgerApi,
//     downloadBulkLedgerPdfApi,
// } from "../api/account-api";
// import {
//     AreaChart, Area, PieChart, Pie, Cell, XAxis, Tooltip, ResponsiveContainer,
// } from "recharts";
// import {
//     Download, RefreshCw, Plus, Eye, X, FileText,
//     ArrowUpRight, ArrowDownRight, Wallet, Landmark, AlertCircle,
// } from "lucide-react";

// // ── Helpers ───────────────────────────────────────────────────────────
// const fmtFull = n => `₹${Number(n).toLocaleString("en-IN")}`;
// const getSocietyId = () =>
//     localStorage.getItem("society_identifier") || localStorage.getItem("societyId") || "";

// const PAY_COLORS = ["#00d4aa", "#6c63ff", "#ffb347", "#ff6b6b", "#00b4d8", "#8899aa"];
// const STATIC_PAY_MODES = [
//     { name: "UPI", value: 42, color: "#00d4aa" },
//     { name: "Net Bank", value: 28, color: "#6c63ff" },
//     { name: "Cheque", value: 18, color: "#ffb347" },
//     { name: "Cash", value: 9, color: "#ff6b6b" },
//     { name: "Card", value: 3, color: "#00b4d8" },
// ];

// // ── Tiny shared UI ────────────────────────────────────────────────────
// const Card = ({ children, style = {} }) => (
//     <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, ...style }}>
//         {children}
//     </div>
// );

// const KPI = ({ label, value, sub, color, icon: Icon, trend, up }) => (
//     <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
//         <div style={{ position: "absolute", top: -12, right: -12, width: 64, height: 64, borderRadius: "50%", background: `${color}10` }} />
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
//             <span style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</span>
//             {Icon && <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={14} color={color} /></div>}
//         </div>
//         <div style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 6 }}>{value}</div>
//         {sub && <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 4 }}>{sub}</div>}
//         {trend !== undefined && (
//             <div style={{ display: "flex", alignItems: "center", gap: 4, color: up ? "#00d4aa" : "#ff6b6b", fontSize: 11, fontWeight: 600 }}>
//                 {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
//                 {Math.abs(trend)}% vs last month
//             </div>
//         )}
//     </div>
// );

// const Btn = ({ children, onClick, variant = "primary", style: s = {} }) => {
//     const base = { border: "none", borderRadius: 9, padding: "9px 18px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" };
//     const styles = {
//         primary: { background: "linear-gradient(135deg,var(--accent-teal),var(--accent-blue))", color: "#000", fontWeight: 700 },
//         ghost: { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" },
//         danger: { background: "linear-gradient(135deg,#ff6b6b,#ff8c00)", color: "#000", fontWeight: 700 },
//     };
//     return <button onClick={onClick} style={{ ...base, ...styles[variant], ...s }}>{children}</button>;
// };

// const Modal = ({ open, onClose, title, width = 520, children }) => {
//     if (!open) return null;
//     return (
//         <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, backdropFilter: "blur(4px)" }} onClick={onClose}>
//             <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 18, width, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
//                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
//                     <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16 }}>{title}</h3>
//                     <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><X size={18} /></button>
//                 </div>
//                 <div style={{ padding: "20px 24px" }}>{children}</div>
//             </div>
//         </div>
//     );
// };

// const Field = ({ label, field, type = "text", form, setForm }) => (
//     <div style={{ marginBottom: 14 }}>
//         <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>{label}</label>
//         <input type={type} value={form[field] || ""} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
//             style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 9, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
//     </div>
// );

// const Select = ({ label, field, options, form, setForm }) => (
//     <div style={{ marginBottom: 14 }}>
//         <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>{label}</label>
//         <select value={form[field] || ""} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
//             style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 9, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", cursor: "pointer" }}>
//             {options.map(o => <option key={o}>{o}</option>)}
//         </select>
//     </div>
// );

// // ── Tooltip ───────────────────────────────────────────────────────────
// const ChartTip = ({ active, payload, label }) => {
//     if (!active || !payload?.length) return null;
//     return (
//         <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
//             <p style={{ color: "var(--text-secondary)", marginBottom: 6, fontWeight: 600 }}>{label}</p>
//             {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {fmtFull(p.value)}</p>)}
//         </div>
//     );
// };

// // ── Main Component ────────────────────────────────────────────────────
// export default function LedgerTab() {
//     const { ledger: ctxLedger = [], setLedger, receipts: ctxReceipts = [], properties = [] } = useAppContext();
//     const sid = getSocietyId();

//     const [catFilter, setCatFilter] = useState("all");
//     const [search, setSearch] = useState("");
//     const [showAdd, setShowAdd] = useState(false);
//     const [localData, setLocalData] = useState([]);
//     const [selProp, setSelProp] = useState("");
//     const [propSearch, setPropSearch] = useState("");
//     const [propOpen, setPropOpen] = useState(false);
//     const [fetching, setFetching] = useState(false);
//     const [fetchError, setFetchError] = useState("");

//     // ── Map ledger entries ────────────────────────────────────────────
//     const apiLedger = useMemo(() => ctxLedger.map((r, i) => ({
//         _key: `api-${r.id || i}`,
//         date: r.date || "", description: r.description || "",
//         debit: Number(r.debit || 0), credit: Number(r.credit || 0),
//         balance: Number(r.balance || 0), category: r.category || "income",
//         ref: r.ref || "",
//     })), [ctxLedger]);

//     const data = [
//         ...(apiLedger.length > 0 ? apiLedger : [{ _key: "mock-0", date: "2024-01-01", description: "Opening Balance", debit: 0, credit: 0, balance: 250000, category: "balance", ref: "" }]),
//         ...localData.map((r, i) => ({ ...r, _key: `local-${i}` })),
//     ];

//     const filtered = data.filter(r => {
//         if (catFilter !== "all" && r.category !== catFilter) return false;
//         if (search && !r.description.toLowerCase().includes(search.toLowerCase()) && !(r.ref || "").toLowerCase().includes(search.toLowerCase())) return false;
//         return true;
//     });

//     const totalCredit = data.reduce((s, r) => s + r.credit, 0);
//     const totalDebit = data.reduce((s, r) => s + r.debit, 0);
//     const closing = data[data.length - 1]?.balance || 0;
//     const opening = data[0]?.balance || 0;

//     // ── Payment mode pie from receipts ────────────────────────────────
//     const payModes = useMemo(() => {
//         if (!ctxReceipts.length) return STATIC_PAY_MODES;
//         const agg = {};
//         ctxReceipts.forEach(r => { const m = r.mode || "Other"; agg[m] = (agg[m] || 0) + 1; });
//         const total = Object.values(agg).reduce((s, v) => s + v, 0);
//         return Object.entries(agg).sort((a, b) => b[1] - a[1])
//             .map(([name, count], i) => ({ name, value: Math.round((count / total) * 100), color: PAY_COLORS[i % PAY_COLORS.length] }));
//     }, [ctxReceipts]);

//     // ── Fetch ledger for property ─────────────────────────────────────
//     const fetchPropertyLedger = useCallback(async (propertyId) => {
//         if (!propertyId) return;
//         setFetching(true); setFetchError("");
//         try {
//             const res = await getPropertyOutstandingApi(propertyId);
//             const raw = res?.data?.data || res?.data || [];
//             const arr = Array.isArray(raw) ? raw : (raw?.entries || raw?.ledger || raw?.transactions || []);
//             const mapped = arr.map((item, i) => ({
//                 _key: `fetched-${propertyId}-${i}`,
//                 date: item.date || item.entry_date || item.createdAt || "",
//                 description: item.description || item.narration || item.type || "",
//                 debit: Number(item.debit || item.dr || 0),
//                 credit: Number(item.credit || item.cr || 0),
//                 balance: Number(item.balance || item.closing_balance || 0),
//                 category: Number(item.debit || item.dr || 0) > 0 ? "expense" : "income",
//                 ref: item.ref || item.invoiceNumber || item.receiptNumber || "",
//                 property: propertyId,
//             }));
//             if (setLedger) setLedger(mapped);
//         } catch (err) {
//             const msg = err?.response?.data?.message;
//             setFetchError(Array.isArray(msg) ? msg.join(", ") : msg || err?.message || "Failed to load ledger.");
//         } finally { setFetching(false); }
//     }, [setLedger]);

//     // ── Property options ──────────────────────────────────────────────
//     const propOptions = useMemo(() =>
//         properties.filter(p => {
//             const q = propSearch.toLowerCase();
//             return !q || (p.identifier || "").toLowerCase().includes(q) || (p.unit || "").toLowerCase().includes(q) || (p.owner || "").toLowerCase().includes(q);
//         }).slice(0, 50),
//         [properties, propSearch]
//     );

//     // ── Add entry form ────────────────────────────────────────────────
//     const EMPTY = { date: "", description: "", debit: "", credit: "", category: "income", ref: "" };
//     const [form, setForm] = useState(EMPTY);
//     const [addLoading, setAddLoading] = useState(false);
//     const [addError, setAddError] = useState("");

//     const handleAdd = useCallback(async () => {
//         if (!form.date || !form.description) { setAddError("Date and Description are required."); return; }
//         if (!form.debit && !form.credit) { setAddError("Enter a Debit or Credit amount."); return; }
//         setAddLoading(true); setAddError("");
//         try {
//             const last = data[data.length - 1]?.balance || 0;
//             setLocalData(d => [...d, {
//                 date: form.date, description: form.description,
//                 debit: Number(form.debit || 0), credit: Number(form.credit || 0),
//                 balance: last + Number(form.credit || 0) - Number(form.debit || 0),
//                 category: form.category || "income", ref: form.ref || "",
//             }]);
//             setShowAdd(false); setForm(EMPTY);
//         } finally { setAddLoading(false); }
//     }, [form, data]);

//     const TH = ({ children, align = "left" }) => (
//         <th style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: 10, fontWeight: 700, textAlign: align, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{children}</th>
//     );
//     const TD = ({ children, style: s = {} }) => (
//         <td style={{ padding: "11px 12px", borderBottom: "1px solid var(--border)", ...s }}>{children}</td>
//     );

//     return (
//         <div>
//             {/* KPI Row */}
//             <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
//                 <KPI label="Opening Balance" value={fmtFull(opening)} sub="Start of period" color="#8899aa" icon={Wallet} />
//                 <KPI label="Total Credits" value={fmtFull(totalCredit)} sub="Income received" color="#00d4aa" icon={ArrowUpRight} trend={14.2} up={true} />
//                 <KPI label="Total Debits" value={fmtFull(totalDebit)} sub="Expenses paid" color="#ff6b6b" icon={ArrowDownRight} trend={6.8} up={false} />
//                 <KPI label="Closing Balance" value={fmtFull(closing)} sub="Current balance" color="#6c63ff" icon={Landmark} trend={10.1} up={true} />
//             </div>

//             {/* Property Fetch Bar */}
//             <Card style={{ marginBottom: 14, padding: "12px 16px" }}>
//                 <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
//                     <span style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>Property Ledger:</span>
//                     <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
//                         <input
//                             value={propSearch || selProp}
//                             onChange={e => { setPropSearch(e.target.value); setPropOpen(true); setSelProp(""); }}
//                             onFocus={() => setPropOpen(true)}
//                             onBlur={() => setTimeout(() => setPropOpen(false), 180)}
//                             placeholder="Search property…"
//                             style={{ width: "100%", background: "var(--input-bg)", border: `1px solid ${selProp ? "var(--accent-teal)" : "var(--input-border)"}`, borderRadius: 9, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
//                         />
//                         {propOpen && propOptions.length > 0 && (
//                             <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", maxHeight: 200, overflowY: "auto", marginTop: 4 }}>
//                                 {propOptions.map(p => (
//                                     <div key={p.id}
//                                         onMouseDown={() => { setSelProp(p.identifier || p.unit || String(p.id)); setPropSearch(""); setPropOpen(false); }}
//                                         style={{ padding: "9px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}
//                                         onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
//                                         onMouseLeave={e => e.currentTarget.style.background = ""}>
//                                         <div>
//                                             <div style={{ color: "var(--accent-teal)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{p.identifier}</div>
//                                             <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>{p.unit} · {p.owner}</div>
//                                         </div>
//                                         <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{p.type}</span>
//                                     </div>
//                                 ))}
//                             </div>
//                         )}
//                     </div>

//                     <Btn onClick={() => fetchPropertyLedger(selProp)} style={{ opacity: (!selProp || fetching) ? 0.6 : 1, whiteSpace: "nowrap" }}>
//                         {fetching ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Loading…</> : <><Eye size={12} /> Load Ledger</>}
//                     </Btn>
//                     {selProp && (
//                         <Btn variant="ghost" onClick={() => { setSelProp(""); setPropSearch(""); if (setLedger) setLedger([]); setLocalData([]); }} style={{ color: "#ff6b6b", whiteSpace: "nowrap" }}>
//                             <X size={12} /> Clear
//                         </Btn>
//                     )}
//                     <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
//                         <Btn variant="ghost" style={{ color: "var(--accent-teal)" }}
//                             onClick={async () => { if (selProp) try { await downloadBulkLedgerApi({ society_identifier: sid, property_identifier: selProp }); } catch { } }}>
//                             <Download size={12} /> Excel
//                         </Btn>
//                         <Btn variant="ghost" style={{ color: "var(--accent-purple)" }}
//                             onClick={async () => { if (selProp) try { await downloadBulkLedgerPdfApi({ society_identifier: sid, property_identifier: selProp }); } catch { } }}>
//                             <FileText size={12} /> PDF
//                         </Btn>
//                     </div>
//                 </div>
//                 {fetchError && (
//                     <div style={{ marginTop: 10, background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "8px 12px", color: "#ff6b6b", fontSize: 12 }}>
//                         <AlertCircle size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />{fetchError}
//                     </div>
//                 )}
//             </Card>

//             {/* Main Grid */}
//             <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
//                 {/* Ledger Table */}
//                 <Card>
//                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
//                         <div style={{ display: "flex", gap: 6 }}>
//                             {[["all", "All"], ["income", "Credits"], ["expense", "Debits"], ["balance", "Balance"]].map(([v, l]) => (
//                                 <button key={v} onClick={() => setCatFilter(v)}
//                                     style={{ background: catFilter === v ? "rgba(0,212,170,0.15)" : "none", border: `1px solid ${catFilter === v ? "var(--accent-teal)" : "var(--border)"}`, borderRadius: 8, padding: "5px 12px", color: catFilter === v ? "var(--accent-teal)" : "var(--text-muted)", fontSize: 12, fontWeight: catFilter === v ? 600 : 400, cursor: "pointer" }}>
//                                     {l}
//                                 </button>
//                             ))}
//                         </div>
//                         <div style={{ display: "flex", gap: 8 }}>
//                             <div style={{ position: "relative" }}>
//                                 <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
//                                     style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px", color: "var(--text-primary)", fontSize: 12, outline: "none", fontFamily: "inherit" }} />
//                             </div>
//                             <Btn onClick={() => { setShowAdd(true); setAddError(""); setForm(EMPTY); }}><Plus size={12} /> Add Entry</Btn>
//                         </div>
//                     </div>

//                     <div style={{ overflowX: "auto" }}>
//                         <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                             <thead>
//                                 <tr><TH>Date</TH><TH>Description</TH><TH>Ref</TH><TH align="right">Debit</TH><TH align="right">Credit</TH><TH align="right">Balance</TH></tr>
//                             </thead>
//                             <tbody>
//                                 {filtered.length === 0 && (
//                                     <tr><td colSpan={6} style={{ padding: "40px 12px", textAlign: "center", color: "var(--text-muted)" }}>
//                                         {selProp ? "No ledger entries for this property" : "Select a property above to load its ledger"}
//                                     </td></tr>
//                                 )}
//                                 {filtered.map((r, i) => (
//                                     <tr key={r._key || i}
//                                         onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
//                                         onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
//                                         <TD><span style={{ color: "var(--text-muted)", fontSize: 12 }}>{r.date}</span></TD>
//                                         <TD><span style={{ color: "var(--text-primary)", fontSize: 13 }}>{r.description}</span></TD>
//                                         <TD><span style={{ color: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}>{r.ref || "—"}</span></TD>
//                                         <TD style={{ textAlign: "right" }}><span style={{ color: r.debit > 0 ? "#ff6b6b" : "var(--text-muted)", fontWeight: r.debit > 0 ? 600 : 400, fontFamily: "var(--font-mono)" }}>{r.debit > 0 ? fmtFull(r.debit) : "—"}</span></TD>
//                                         <TD style={{ textAlign: "right" }}><span style={{ color: r.credit > 0 ? "#00d4aa" : "var(--text-muted)", fontWeight: r.credit > 0 ? 600 : 400, fontFamily: "var(--font-mono)" }}>{r.credit > 0 ? fmtFull(r.credit) : "—"}</span></TD>
//                                         <TD style={{ textAlign: "right" }}><span style={{ color: "var(--accent-purple)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{fmtFull(r.balance)}</span></TD>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                             <tfoot>
//                                 <tr style={{ borderTop: "2px solid var(--border-strong)", background: "var(--bg-card)" }}>
//                                     <td colSpan={3} style={{ padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 700, fontSize: 13 }}>TOTALS</td>
//                                     <td style={{ padding: "10px 12px", textAlign: "right", color: "#ff6b6b", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{fmtFull(totalDebit)}</td>
//                                     <td style={{ padding: "10px 12px", textAlign: "right", color: "#00d4aa", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{fmtFull(totalCredit)}</td>
//                                     <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--accent-purple)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{fmtFull(closing)}</td>
//                                 </tr>
//                             </tfoot>
//                         </table>
//                     </div>
//                 </Card>

//                 {/* Side Panel */}
//                 <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
//                     {/* Account Summary */}
//                     <Card>
//                         <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Account Summary</h3>
//                         {[
//                             { l: "Opening Balance", v: fmtFull(opening), c: "var(--text-muted)" },
//                             { l: "Total Credits", v: `+${fmtFull(totalCredit)}`, c: "#00d4aa" },
//                             { l: "Total Debits", v: `-${fmtFull(totalDebit)}`, c: "#ff6b6b" },
//                             { l: "Net", v: fmtFull(totalCredit - totalDebit), c: "var(--accent-purple)" },
//                             { l: "Closing Balance", v: fmtFull(closing), c: "var(--accent-teal)" },
//                         ].map((s, i, a) => (
//                             <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < a.length - 1 ? "1px solid var(--border)" : "none" }}>
//                                 <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{s.l}</span>
//                                 <span style={{ color: s.c, fontWeight: 700, fontSize: 14, fontFamily: "var(--font-mono)" }}>{s.v}</span>
//                             </div>
//                         ))}
//                     </Card>

//                     {/* Payment Distribution */}
//                     <Card>
//                         <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Payment Distribution</h3>
//                         <ResponsiveContainer width="100%" height={130}>
//                             <PieChart>
//                                 <Pie data={payModes} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
//                                     {payModes.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
//                                 </Pie>
//                                 <Tooltip formatter={v => `${v}%`} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }} />
//                             </PieChart>
//                         </ResponsiveContainer>
//                         <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
//                             {payModes.map((d, i) => (
//                                 <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
//                                     <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
//                                     <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{d.name} {d.value}%</span>
//                                 </div>
//                             ))}
//                         </div>
//                     </Card>

//                     {/* Balance Trend */}
//                     <Card>
//                         <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Balance Trend</h3>
//                         <ResponsiveContainer width="100%" height={100}>
//                             <AreaChart data={data.filter(r => r.balance > 0)}>
//                                 <defs>
//                                     <linearGradient id="lbal" x1="0" y1="0" x2="0" y2="1">
//                                         <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
//                                         <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
//                                     </linearGradient>
//                                 </defs>
//                                 <Area type="monotone" dataKey="balance" stroke="#6c63ff" fill="url(#lbal)" strokeWidth={2} dot={false} />
//                                 <XAxis dataKey="date" hide />
//                                 <Tooltip content={<ChartTip />} />
//                             </AreaChart>
//                         </ResponsiveContainer>
//                     </Card>
//                 </div>
//             </div>

//             {/* Add Entry Modal */}
//             <Modal open={showAdd} onClose={() => { if (!addLoading) { setShowAdd(false); setAddError(""); } }} title="Add Ledger Entry">
//                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
//                     <Field label="Date *" field="date" type="date" form={form} setForm={setForm} />
//                     <Select label="Category" field="category" options={["income", "expense", "balance"]} form={form} setForm={setForm} />
//                     <div style={{ gridColumn: "1/-1" }}><Field label="Description *" field="description" form={form} setForm={setForm} /></div>
//                     <Field label="Debit (₹)" field="debit" type="number" form={form} setForm={setForm} />
//                     <Field label="Credit (₹)" field="credit" type="number" form={form} setForm={setForm} />
//                     <Field label="Reference" field="ref" form={form} setForm={setForm} />
//                 </div>
//                 {addError && (
//                     <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, color: "#ff6b6b", fontSize: 12 }}>
//                         <AlertCircle size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />{addError}
//                     </div>
//                 )}
//                 <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
//                     <Btn variant="ghost" onClick={() => { if (!addLoading) { setShowAdd(false); setAddError(""); } }}>Cancel</Btn>
//                     <Btn onClick={handleAdd} style={{ opacity: addLoading ? 0.7 : 1 }}>
//                         {addLoading ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : <><Plus size={12} /> Add Entry</>}
//                     </Btn>
//                 </div>
//             </Modal>
//         </div>
//     );
// }


import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useAppContext } from "../AppContext";

import {
    AreaChart, Area, PieChart, Pie, Cell, XAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
    Download, RefreshCw, Plus, Eye, X, FileText,
    ArrowUpRight, ArrowDownRight, Wallet, Landmark, AlertCircle,
} from "lucide-react";

import { getAllOnlineSelfPaymentApi } from "../api/account-api";
import { getAllPaymentLogsApi } from "../api/cash&check-api";

// ── Helpers ───────────────────────────────────────────────────────────
const fmtFull = n => `₹${Number(n).toLocaleString("en-IN")}`;
const getSocietyId = () =>
    localStorage.getItem("society_identifier") || localStorage.getItem("societyId") || "";

// Convert DD-MM-YYYY to YYYY-MM-DD for React date inputs
const convertDateAPI = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
};

// Parse DD-MM-YYYY or DD-MM-YYYY, HH:MM:SS AM/PM to Date object
const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    // Remove time part if present
    const cleanDate = dateStr.split(",")[0];
    const parts = cleanDate.split("-");
    if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    return new Date();
};

const PAY_COLORS = ["#00d4aa", "#6c63ff", "#ffb347", "#ff6b6b", "#00b4d8", "#8899aa"];
const STATIC_PAY_MODES = [
    { name: "UPI", value: 42, color: "#00d4aa" },
    { name: "Net Bank", value: 28, color: "#6c63ff" },
    { name: "Cheque", value: 18, color: "#ffb347" },
    { name: "Cash", value: 9, color: "#ff6b6b" },
    { name: "Card", value: 3, color: "#00b4d8" },
];

// ── Tiny shared UI ────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, ...style }}>
        {children}
    </div>
);

const KPI = ({ label, value, sub, color, icon: Icon, trend, up }) => (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -12, right: -12, width: 64, height: 64, borderRadius: "50%", background: `${color}10` }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <span style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</span>
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

const Btn = ({ children, onClick, variant = "primary", style: s = {} }) => {
    const base = { border: "none", borderRadius: 9, padding: "9px 18px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" };
    const styles = {
        primary: { background: "linear-gradient(135deg,var(--accent-teal),var(--accent-blue))", color: "#000", fontWeight: 700 },
        ghost: { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" },
        danger: { background: "linear-gradient(135deg,#ff6b6b,#ff8c00)", color: "#000", fontWeight: 700 },
    };
    return <button onClick={onClick} style={{ ...base, ...styles[variant], ...s }}>{children}</button>;
};

const Modal = ({ open, onClose, title, width = 520, children }) => {
    if (!open) return null;
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, backdropFilter: "blur(4px)" }} onClick={onClose}>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 18, width, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                    <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><X size={18} /></button>
                </div>
                <div style={{ padding: "20px 24px" }}>{children}</div>
            </div>
        </div>
    );
};

const Field = ({ label, field, type = "text", form, setForm }) => (
    <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>{label}</label>
        <input type={type} value={form[field] || ""} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 9, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
    </div>
);

const Select = ({ label, field, options, form, setForm }) => (
    <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>{label}</label>
        <select value={form[field] || ""} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 9, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", cursor: "pointer" }}>
            {options.map(o => <option key={o}>{o}</option>)}
        </select>
    </div>
);

// ── Tooltip ───────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: 6, fontWeight: 600 }}>{label}</p>
            {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {fmtFull(p.value)}</p>)}
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────
export default function LedgerTab() {
    const { ledger: ctxLedger = [], setLedger, receipts: ctxReceipts = [], properties = [], selectedSociety } = useAppContext();
    const sid = selectedSociety || getSocietyId();

    const [catFilter, setCatFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [localData, setLocalData] = useState([]);
    const [selProp, setSelProp] = useState("");
    const [propSearch, setPropSearch] = useState("");
    const [propOpen, setPropOpen] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [fetchError, setFetchError] = useState("");
    const [onlinePayments, setOnlinePayments] = useState([]);
    const [paymentLogs, setPaymentLogs] = useState([]);

    // Fetch both payment APIs on component mount using selectedSociety
    useEffect(() => {
        if (!sid) return;

        const fetchPayments = async () => {
            try {
                const onlineRes = await getAllOnlineSelfPaymentApi(sid.societyIdentifier);
                const logsRes = await getAllPaymentLogsApi(sid.societyIdentifier);


                setOnlinePayments(onlineRes?.data?.data || []);
                setPaymentLogs(logsRes?.data?.data || []);
            } catch (err) {
                console.error("Failed to fetch payments:", err);
            }
        };

        fetchPayments();
    }, [sid]);

    // ── Map ledger entries ────────────────────────────────────────────
    const apiLedger = useMemo(() => {
        const entries = [];

        // Map online self payments
        onlinePayments.forEach((r, i) => {
            entries.push({
                _key: `online-${r.id || i}`,
                date: convertDateAPI(r.dateOfPayment),
                description: r.remarks || `Payment - ${r.invoiceNumber}`,
                debit: 0,
                credit: Number(r.amount || 0),
                balance: 0,
                category: "income",
                ref: r.transactionId || r.p_txnId || r.invoiceNumber || "",
                paymentMode: r.paymentMode,
                property: r.propertyIdentifier,
            });
        });

        // Map payment logs
        paymentLogs.forEach((r, i) => {
            const amount = Number(r.amount || 0);

            entries.push({
                _key: `log-${r.txnId || i}`,
                date: convertDateAPI(r.createdAt),
                description: `${r.paymentMethod} Payment - ${r.invoiceNumber}`,
                debit: 0,
                credit: amount,
                balance: 0,
                category: "income",
                ref: r.txnId || r.invoiceNumber || "",
                paymentMode: r.paymentMethod,
                property: r.property?.propertyIdentifier,
            });
        });

        // Sort by date and calculate balances
        entries.sort((a, b) => new Date(a.date) - new Date(b.date));

        let runningBalance = 0;
        return entries.map((entry, index) => {
            runningBalance += entry.credit - entry.debit;
            return {
                ...entry,
                balance: runningBalance,
            };
        });
    }, [onlinePayments, paymentLogs]);

    const data = [
        ...(apiLedger.length > 0 ? apiLedger : [{ _key: "mock-0", date: "2024-01-01", description: "Opening Balance", debit: 0, credit: 0, balance: 250000, category: "balance", ref: "" }]),
        ...localData.map((r, i) => ({ ...r, _key: `local-${i}` })),
    ];

    const filtered = data.filter(r => {
        if (catFilter !== "all" && r.category !== catFilter) return false;
        if (search && !r.description.toLowerCase().includes(search.toLowerCase()) && !(r.ref || "").toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const totalCredit = data.reduce((s, r) => s + r.credit, 0);
    const totalDebit = data.reduce((s, r) => s + r.debit, 0);
    const closing = data[data.length - 1]?.balance || 0;
    const opening = data[0]?.balance || 0;

    // ── Payment mode pie from receipts ────────────────────────────────
    const payModes = useMemo(() => {
        const agg = {};

        // Count from online payments
        onlinePayments.forEach(r => {
            const m = r.paymentMode || "Other";
            agg[m] = (agg[m] || 0) + 1;
        });

        // Count from payment logs
        paymentLogs.forEach(r => {
            const m = r.paymentMethod || "Other";
            agg[m] = (agg[m] || 0) + 1;
        });

        if (Object.keys(agg).length === 0) return STATIC_PAY_MODES;

        const total = Object.values(agg).reduce((s, v) => s + v, 0);
        return Object.entries(agg).sort((a, b) => b[1] - a[1])
            .map(([name, count], i) => ({
                name,
                value: Math.round((count / total) * 100),
                color: PAY_COLORS[i % PAY_COLORS.length]
            }));
    }, [onlinePayments, paymentLogs]);

    // ── Fetch ledger for property ─────────────────────────────────────
    const fetchPropertyLedger = useCallback(async (propertyId) => {
        if (!propertyId) return;
        setFetching(true); setFetchError("");
        try {
            const res = await getPropertyOutstandingApi(propertyId);
            const raw = res?.data?.data || res?.data || [];
            const arr = Array.isArray(raw) ? raw : (raw?.entries || raw?.ledger || raw?.transactions || []);
            const mapped = arr.map((item, i) => ({
                _key: `fetched-${propertyId}-${i}`,
                date: item.date || item.entry_date || item.createdAt || convertDateAPI(item.dateOfPayment),
                description: item.description || item.narration || item.type || "",
                debit: Number(item.debit || item.dr || 0),
                credit: Number(item.credit || item.cr || 0),
                balance: Number(item.balance || item.closing_balance || 0),
                category: Number(item.debit || item.dr || 0) > 0 ? "expense" : "income",
                ref: item.ref || item.invoiceNumber || item.receiptNumber || "",
                property: propertyId,
            }));
            if (setLedger) setLedger(mapped);
        } catch (err) {
            const msg = err?.response?.data?.message;
            setFetchError(Array.isArray(msg) ? msg.join(", ") : msg || err?.message || "Failed to load ledger.");
        } finally { setFetching(false); }
    }, [setLedger]);

    // ── Property options ──────────────────────────────────────────────
    const propOptions = useMemo(() =>
        properties.filter(p => {
            const q = propSearch.toLowerCase();
            return !q || (p.identifier || "").toLowerCase().includes(q) || (p.unit || "").toLowerCase().includes(q) || (p.owner || "").toLowerCase().includes(q);
        }).slice(0, 50),
        [properties, propSearch]
    );

    // ── Add entry form ────────────────────────────────────────────────
    const EMPTY = { date: "", description: "", debit: "", credit: "", category: "income", ref: "" };
    const [form, setForm] = useState(EMPTY);
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState("");

    const handleAdd = useCallback(async () => {
        if (!form.date || !form.description) { setAddError("Date and Description are required."); return; }
        if (!form.debit && !form.credit) { setAddError("Enter a Debit or Credit amount."); return; }
        setAddLoading(true); setAddError("");
        try {
            const last = data[data.length - 1]?.balance || 0;
            setLocalData(d => [...d, {
                date: form.date, description: form.description,
                debit: Number(form.debit || 0), credit: Number(form.credit || 0),
                balance: last + Number(form.credit || 0) - Number(form.debit || 0),
                category: form.category || "income", ref: form.ref || "",
            }]);
            setShowAdd(false); setForm(EMPTY);
        } finally { setAddLoading(false); }
    }, [form, data]);

    const TH = ({ children, align = "left" }) => (
        <th style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: 10, fontWeight: 700, textAlign: align, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{children}</th>
    );
    const TD = ({ children, style: s = {} }) => (
        <td style={{ padding: "11px 12px", borderBottom: "1px solid var(--border)", ...s }}>{children}</td>
    );

    return (
        <div>
            {/* KPI Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
                <KPI label="Opening Balance" value={fmtFull(opening)} sub="Start of period" color="#8899aa" icon={Wallet} />
                <KPI label="Total Credits" value={fmtFull(totalCredit)} sub="Income received" color="#00d4aa" icon={ArrowUpRight} trend={14.2} up={true} />
                <KPI label="Total Debits" value={fmtFull(totalDebit)} sub="Expenses paid" color="#ff6b6b" icon={ArrowDownRight} trend={6.8} up={false} />
                <KPI label="Closing Balance" value={fmtFull(closing)} sub="Current balance" color="#6c63ff" icon={Landmark} trend={10.1} up={true} />
            </div>

            {/* Property Fetch Bar */}
            <Card style={{ marginBottom: 14, padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>Property Ledger:</span>
                    <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                        <input
                            value={propSearch || selProp}
                            onChange={e => { setPropSearch(e.target.value); setPropOpen(true); setSelProp(""); }}
                            onFocus={() => setPropOpen(true)}
                            onBlur={() => setTimeout(() => setPropOpen(false), 180)}
                            placeholder="Search property…"
                            style={{ width: "100%", background: "var(--input-bg)", border: `1px solid ${selProp ? "var(--accent-teal)" : "var(--input-border)"}`, borderRadius: 9, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                        />
                        {propOpen && propOptions.length > 0 && (
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", maxHeight: 200, overflowY: "auto", marginTop: 4 }}>
                                {propOptions.map(p => (
                                    <div key={p.id}
                                        onMouseDown={() => { setSelProp(p.identifier || p.unit || String(p.id)); setPropSearch(""); setPropOpen(false); }}
                                        style={{ padding: "9px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                                        onMouseLeave={e => e.currentTarget.style.background = ""}>
                                        <div>
                                            <div style={{ color: "var(--accent-teal)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{p.identifier}</div>
                                            <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>{p.unit} · {p.owner}</div>
                                        </div>
                                        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{p.type}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Btn onClick={() => fetchPropertyLedger(selProp)} style={{ opacity: (!selProp || fetching) ? 0.6 : 1, whiteSpace: "nowrap" }}>
                        {fetching ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Loading…</> : <><Eye size={12} /> Load Ledger</>}
                    </Btn>
                    {selProp && (
                        <Btn variant="ghost" onClick={() => { setSelProp(""); setPropSearch(""); if (setLedger) setLedger([]); setLocalData([]); }} style={{ color: "#ff6b6b", whiteSpace: "nowrap" }}>
                            <X size={12} /> Clear
                        </Btn>
                    )}
                    <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                        <Btn variant="ghost" style={{ color: "var(--accent-teal)" }}
                            onClick={async () => { if (selProp) try { await downloadBulkLedgerApi({ society_identifier: sid, property_identifier: selProp }); } catch { } }}>
                            <Download size={12} /> Excel
                        </Btn>
                        <Btn variant="ghost" style={{ color: "var(--accent-purple)" }}
                            onClick={async () => { if (selProp) try { await downloadBulkLedgerPdfApi({ society_identifier: sid, property_identifier: selProp }); } catch { } }}>
                            <FileText size={12} /> PDF
                        </Btn>
                    </div>
                </div>
                {fetchError && (
                    <div style={{ marginTop: 10, background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "8px 12px", color: "#ff6b6b", fontSize: 12 }}>
                        <AlertCircle size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />{fetchError}
                    </div>
                )}
            </Card>

            {/* Main Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                {/* Ledger Table */}
                <Card>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                        <div style={{ display: "flex", gap: 6 }}>
                            {[["all", "All"], ["income", "Credits"], ["expense", "Debits"], ["balance", "Balance"]].map(([v, l]) => (
                                <button key={v} onClick={() => setCatFilter(v)}
                                    style={{ background: catFilter === v ? "rgba(0,212,170,0.15)" : "none", border: `1px solid ${catFilter === v ? "var(--accent-teal)" : "var(--border)"}`, borderRadius: 8, padding: "5px 12px", color: catFilter === v ? "var(--accent-teal)" : "var(--text-muted)", fontSize: 12, fontWeight: catFilter === v ? 600 : 400, cursor: "pointer" }}>
                                    {l}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <div style={{ position: "relative" }}>
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px", color: "var(--text-primary)", fontSize: 12, outline: "none", fontFamily: "inherit" }} />
                            </div>
                            <Btn onClick={() => { setShowAdd(true); setAddError(""); setForm(EMPTY); }}><Plus size={12} /> Add Entry</Btn>
                        </div>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr><TH>Date</TH><TH>Description</TH><TH>Ref</TH><TH align="right">Debit</TH><TH align="right">Credit</TH><TH align="right">Balance</TH></tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr><td colSpan={6} style={{ padding: "40px 12px", textAlign: "center", color: "var(--text-muted)" }}>
                                        {selProp ? "No ledger entries for this property" : "Select a property above to load its ledger"}
                                    </td></tr>
                                )}
                                {filtered.map((r, i) => (
                                    <tr key={r._key || i}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <TD><span style={{ color: "var(--text-muted)", fontSize: 12 }}>{r.date}</span></TD>
                                        <TD><span style={{ color: "var(--text-primary)", fontSize: 13 }}>{r.description}</span></TD>
                                        <TD><span style={{ color: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}>{r.ref || "—"}</span></TD>
                                        <TD style={{ textAlign: "right" }}><span style={{ color: r.debit > 0 ? "#ff6b6b" : "var(--text-muted)", fontWeight: r.debit > 0 ? 600 : 400, fontFamily: "var(--font-mono)" }}>{r.debit > 0 ? fmtFull(r.debit) : "—"}</span></TD>
                                        <TD style={{ textAlign: "right" }}><span style={{ color: r.credit > 0 ? "#00d4aa" : "var(--text-muted)", fontWeight: r.credit > 0 ? 600 : 400, fontFamily: "var(--font-mono)" }}>{r.credit > 0 ? fmtFull(r.credit) : "—"}</span></TD>
                                        <TD style={{ textAlign: "right" }}><span style={{ color: "var(--accent-purple)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{fmtFull(r.balance)}</span></TD>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ borderTop: "2px solid var(--border-strong)", background: "var(--bg-card)" }}>
                                    <td colSpan={3} style={{ padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 700, fontSize: 13 }}>TOTALS</td>
                                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#ff6b6b", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{fmtFull(totalDebit)}</td>
                                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#00d4aa", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{fmtFull(totalCredit)}</td>
                                    <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--accent-purple)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{fmtFull(closing)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card>

                {/* Side Panel */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Account Summary */}
                    <Card>
                        <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Account Summary</h3>
                        {[
                            { l: "Opening Balance", v: fmtFull(opening), c: "var(--text-muted)" },
                            { l: "Total Credits", v: `+${fmtFull(totalCredit)}`, c: "#00d4aa" },
                            { l: "Total Debits", v: `-${fmtFull(totalDebit)}`, c: "#ff6b6b" },
                            { l: "Net", v: fmtFull(totalCredit - totalDebit), c: "var(--accent-purple)" },
                            { l: "Closing Balance", v: fmtFull(closing), c: "var(--accent-teal)" },
                        ].map((s, i, a) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < a.length - 1 ? "1px solid var(--border)" : "none" }}>
                                <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{s.l}</span>
                                <span style={{ color: s.c, fontWeight: 700, fontSize: 14, fontFamily: "var(--font-mono)" }}>{s.v}</span>
                            </div>
                        ))}
                    </Card>

                    {/* Payment Distribution */}
                    <Card>
                        <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Payment Distribution</h3>
                        <ResponsiveContainer width="100%" height={130}>
                            <PieChart>
                                <Pie data={payModes} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                                    {payModes.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                                </Pie>
                                <Tooltip formatter={v => `${v}%`} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                            {payModes.map((d, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                                    <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{d.name} {d.value}%</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Balance Trend */}
                    <Card>
                        <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Balance Trend</h3>
                        <ResponsiveContainer width="100%" height={100}>
                            <AreaChart data={data.filter(r => r.balance > 0)}>
                                <defs>
                                    <linearGradient id="lbal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="balance" stroke="#6c63ff" fill="url(#lbal)" strokeWidth={2} dot={false} />
                                <XAxis dataKey="date" hide />
                                <Tooltip content={<ChartTip />} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            </div>

            {/* Add Entry Modal */}
            <Modal open={showAdd} onClose={() => { if (!addLoading) { setShowAdd(false); setAddError(""); } }} title="Add Ledger Entry">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Date *" field="date" type="date" form={form} setForm={setForm} />
                    <Select label="Category" field="category" options={["income", "expense", "balance"]} form={form} setForm={setForm} />
                    <div style={{ gridColumn: "1/-1" }}><Field label="Description *" field="description" form={form} setForm={setForm} /></div>
                    <Field label="Debit (₹)" field="debit" type="number" form={form} setForm={setForm} />
                    <Field label="Credit (₹)" field="credit" type="number" form={form} setForm={setForm} />
                    <Field label="Reference" field="ref" form={form} setForm={setForm} />
                </div>
                {addError && (
                    <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, color: "#ff6b6b", fontSize: 12 }}>
                        <AlertCircle size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />{addError}
                    </div>
                )}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <Btn variant="ghost" onClick={() => { if (!addLoading) { setShowAdd(false); setAddError(""); } }}>Cancel</Btn>
                    <Btn onClick={handleAdd} style={{ opacity: addLoading ? 0.7 : 1 }}>
                        {addLoading ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : <><Plus size={12} /> Add Entry</>}
                    </Btn>
                </div>
            </Modal>
        </div>
    );
}