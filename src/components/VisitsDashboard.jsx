// @ts-nocheck
import React, { useState } from "react";
import { useAppContext } from "../AppContext";
import { CalendarCheck, Plus, Search, Edit2, Trash2, Eye, X, UserCheck, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
const SOCIETIES = ["Green Valley CHS", "Blue Ridge Society", "Sunrise Heights", "Emerald Towers"];
const VISIT_TYPES = ["Select type", "Guest", "Delivery", "Service", "Vendor", "Emergency"];
const STATUSES = ["Expected", "Checked In", "Checked Out", "Cancelled"];
const statusColors = {
    Expected: { color: "#ffb347", bg: "rgba(255,179,71,0.12)" },
    "Checked In": { color: "#00d4aa", bg: "rgba(0,212,170,0.12)" },
    "Checked Out": { color: "#8899aa", bg: "rgba(136,153,170,0.12)" },
    Cancelled: { color: "#ff6b6b", bg: "rgba(255,107,107,0.12)" },
};
const initialVisits = [
    { id: 1, visitId: "VIS-001", visitorName: "Amit Verma", hostFlat: "A-101", hostName: "Ravi Sharma", type: "Guest", checkIn: "2024-05-10 10:00 AM", checkOut: "2024-05-10 12:00 PM", purpose: "Family visit", status: "Checked Out", society: "Green Valley CHS" },
    { id: 2, visitId: "VIS-002", visitorName: "Flipkart Delivery", hostFlat: "B-202", hostName: "Priya Singh", type: "Delivery", checkIn: "2024-05-11 02:00 PM", checkOut: "", purpose: "Package delivery", status: "Checked In", society: "Blue Ridge Society" },
    { id: 3, visitId: "VIS-003", visitorName: "AC Repair Tech", hostFlat: "C-301", hostName: "Mohan Patel", type: "Service", checkIn: "", checkOut: "", purpose: "AC servicing", status: "Expected", society: "Sunrise Heights" },
    { id: 4, visitId: "VIS-004", visitorName: "Rahul Gupta", hostFlat: "D-405", hostName: "Anita Das", type: "Guest", checkIn: "2024-05-13 04:00 PM", checkOut: "2024-05-13 07:00 PM", purpose: "Birthday party", status: "Checked Out", society: "Emerald Towers" },
    { id: 5, visitId: "VIS-005", visitorName: "Plumber Services", hostFlat: "A-102", hostName: "John Kumar", type: "Service", checkIn: "2024-05-14 09:00 AM", checkOut: "", purpose: "Pipe repair", status: "Cancelled", society: "Green Valley CHS" },
];
const emptyForm = { visitorName: "", hostFlat: "", hostName: "", type: "Select type", purpose: "", status: "Expected", society: SOCIETIES[0] };
const Badge = ({ value }) => {
    const s = statusColors[value] || { color: "#8899aa", bg: "rgba(136,153,170,0.12)" };
    return <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{value}</span>;
};
const FI = ({ label, field, form, setForm }) => (<div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 12, marginBottom: 6 }}>{label}</label>
    <input value={form[field] || ""} onChange={e => setForm(f => (Object.assign(Object.assign({}, f), { [field]: e.target.value })))} style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}/>
  </div>);
const FS = ({ label, field, options, form, setForm }) => (<div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 12, marginBottom: 6 }}>{label}</label>
    <select value={form[field] || ""} onChange={e => setForm(f => (Object.assign(Object.assign({}, f), { [field]: e.target.value })))} style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>);

const fmtNum = n => Number(n).toLocaleString("en-IN");
const Pagination = ({ page, total, perPage, onChange }) => {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const visiblePages = [];
  for (let i = Math.max(1, page-2); i <= Math.min(pages, page+2); i++) visiblePages.push(i);
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 20px", borderTop:"1px solid var(--border)" }}>
      <span style={{ color:"#8899aa", fontSize:12 }}>
        Showing {total===0?0:Math.min((page-1)*perPage+1, total)}–{Math.min(page*perPage, total)} of {fmtNum(total)}
      </span>
      <div style={{ display:"flex", gap:4, alignItems:"center" }}>
        <button onClick={() => onChange(1)} disabled={page===1} style={{ background:"none", border:"1px solid var(--border)", borderRadius:6, padding:"4px 8px", color:page===1?"#556677":"#8899aa", cursor:page===1?"not-allowed":"pointer" }}><ChevronsLeft size={12}/></button>
        <button onClick={() => onChange(page-1)} disabled={page===1} style={{ background:"none", border:"1px solid var(--border)", borderRadius:6, padding:"4px 8px", color:page===1?"#556677":"#8899aa", cursor:page===1?"not-allowed":"pointer" }}><ChevronLeft size={12}/></button>
        {visiblePages.map(p => (
          <button key={p} onClick={() => onChange(p)} style={{ background:p===page?"#00d4aa":"none", border:`1px solid ${p===page?"#00d4aa":"var(--border)"}`, borderRadius:6, padding:"4px 10px", color:p===page?"#000":"#8899aa", fontWeight:p===page?700:400, cursor:"pointer", fontSize:12, minWidth:30 }}>{p}</button>
        ))}
        <button onClick={() => onChange(page+1)} disabled={page===pages} style={{ background:"none", border:"1px solid var(--border)", borderRadius:6, padding:"4px 8px", color:page===pages?"#556677":"#8899aa", cursor:page===pages?"not-allowed":"pointer" }}><ChevronRight size={12}/></button>
        <button onClick={() => onChange(pages)} disabled={page===pages} style={{ background:"none", border:"1px solid var(--border)", borderRadius:6, padding:"4px 8px", color:page===pages?"#556677":"#8899aa", cursor:page===pages?"not-allowed":"pointer" }}><ChevronsRight size={12}/></button>
      </div>
    </div>
  );
};
export default function VisitsDashboard() {
    const { visitors: ctxVisitors } = useAppContext();
    const [data, setData] = useState(null);
    const activeData = data || ctxVisitors;
    const [search, setSearch] = useState("");
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [viewItem, setViewItem] = useState(null);
    const [page, setPage] = useState(1);
    const PER = 8;
    const filtered = activeData.filter(d => !search || d.visitorName.toLowerCase().includes(search.toLowerCase()) ||
        d.hostFlat.toLowerCase().includes(search.toLowerCase()) ||
        d.visitId.toLowerCase().includes(search.toLowerCase()));
    const paged = filtered.slice((page-1)*PER, page*PER);
    const openAdd = () => { setForm(emptyForm); setModal("add"); };
    const openEdit = (row) => { setForm(Object.assign({}, row)); setModal("edit"); };
    const del = (id) => setData(activeData.filter(r => r.id !== id));
    const save = () => {
        if (!form.visitorName || !form.hostFlat)
            return;
        if (form.id)
            setData(activeData.map(r => r.id === form.id ? form : r));
        else
            setData([...activeData, Object.assign(Object.assign({}, form), { id: Date.now(), visitId: `VIS-${String(activeData.length + 1).padStart(3, "0")}`, checkIn: "", checkOut: "" })]);
        setModal(null);
    };
    const statCount = { "Expected": 0, "Checked In": 0, "Checked Out": 0, "Cancelled": 0 };
    activeData.forEach(d => { if (statCount[d.status] !== undefined)
        statCount[d.status]++; });
    const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px" };
    return (<div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CalendarCheck size={20} color="#fff"/>
          </div>
          <div>
            <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Visitor Management</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>Track and manage society visitor entries</p>
          </div>
        </div>
        <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))", border: "none", borderRadius: 10, padding: "9px 18px", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          <Plus size={15}/> Add Visit
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {Object.entries(statCount).map(([k, v]) => {
            var _a, _b;
            return (<div key={k} style={Object.assign(Object.assign({}, cardStyle), { display: "flex", alignItems: "center", gap: 12 })}>
            <div style={{ width: 40, height: 40, background: (_a = statusColors[k]) === null || _a === void 0 ? void 0 : _a.bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserCheck size={18} color={(_b = statusColors[k]) === null || _b === void 0 ? void 0 : _b.color}/>
            </div>
            <div>
              <p style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 700 }}>{v}</p>
              <p style={{ color: "var(--text-secondary)", fontSize: 11 }}>{k}</p>
            </div>
          </div>);
        })}
      </div>

      <div style={cardStyle}>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}/>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search visitors, flats..." style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, padding: "8px 12px 8px 30px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}/>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Visit ID", "Visitor", "Type", "Host Flat", "Host Name", "Purpose", "Status", "Actions"].map(h => (<th key={h} style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 10, fontWeight: 700, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {paged.map(row => (<tr key={row.id} style={{ borderBottom: "1px solid var(--border)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 14px", color: "var(--accent-purple)", fontWeight: 600, fontSize: 12, fontFamily: "var(--font-mono)" }}>{row.visitId}</td>
                  <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontWeight: 600 }}>{row.visitorName}</td>
                  <td style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: 13 }}>{row.type}</td>
                  <td style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: 13 }}>{row.hostFlat}</td>
                  <td style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: 13 }}>{row.hostName}</td>
                  <td style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: 12, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.purpose}</td>
                  <td style={{ padding: "12px 14px" }}><Badge value={row.status}/></td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setViewItem(row)} style={{ background: "rgba(0,180,216,0.1)", border: "none", borderRadius: 6, padding: "5px 8px", color: "var(--accent-blue)", cursor: "pointer" }}><Eye size={13}/></button>
                      <button onClick={() => openEdit(row)} style={{ background: "rgba(108,99,255,0.1)", border: "none", borderRadius: 6, padding: "5px 8px", color: "var(--accent-purple)", cursor: "pointer" }}><Edit2 size={13}/></button>
                      <button onClick={() => del(row.id)} style={{ background: "rgba(255,107,107,0.1)", border: "none", borderRadius: 6, padding: "5px 8px", color: "var(--accent-red)", cursor: "pointer" }}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>))}
            </tbody>
          </table>
          {paged.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No visits found</div>}
          <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
        </div>
      </div>

      {modal && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 16, width: 480, padding: 28, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>{modal === "edit" ? "Edit Visit" : "Add Visit"}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><X size={18}/></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FI label="Visitor Name *" field="visitorName" form={form} setForm={setForm}/>
              <FI label="Host Flat *" field="hostFlat" form={form} setForm={setForm}/>
              <FI label="Host Name" field="hostName" form={form} setForm={setForm}/>
              <FI label="Purpose" field="purpose" form={form} setForm={setForm}/>
              <FS label="Visit Type" field="type" options={VISIT_TYPES} form={form} setForm={setForm}/>
              <FS label="Status" field="status" options={STATUSES} form={form} setForm={setForm}/>
              <div style={{ gridColumn: "1 / -1" }}>
                <FS label="Society" field="society" options={SOCIETIES} form={form} setForm={setForm}/>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} style={{ padding: "9px 20px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 9, color: "var(--text-secondary)", cursor: "pointer", fontSize: 13 }}>Cancel</button>
              <button onClick={save} style={{ padding: "9px 20px", background: "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))", border: "none", borderRadius: 9, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Save Visit</button>
            </div>
          </div>
        </div>)}

      {viewItem && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 16, width: 420, padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>Visit Details</h3>
              <button onClick={() => setViewItem(null)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><X size={18}/></button>
            </div>
            {Object.entries({ "Visit ID": viewItem.visitId, "Visitor": viewItem.visitorName, "Type": viewItem.type, "Host Flat": viewItem.hostFlat, "Host Name": viewItem.hostName, "Purpose": viewItem.purpose, "Check In": viewItem.checkIn || "—", "Check Out": viewItem.checkOut || "—", "Status": viewItem.status, "Society": viewItem.society }).map(([k, v]) => (<div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{k}</span>
                <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{v}</span>
              </div>))}
          </div>
        </div>)}
    </div>);
}
