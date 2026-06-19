// @ts-nocheck
import React, { useState } from "react";
import { useAppContext } from "../AppContext";
import { HandHelping, Plus, Search, Edit2, Trash2, Eye, X, Star, Wrench, Zap, Droplets, Shield, Paintbrush, Package, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
const CATEGORIES = ["Plumber", "Electrician", "Carpenter", "Painter", "Housekeeping", "Security", "Driver", "Cook", "Gardener", "IT Support"];
const SOCIETIES = ["Green Valley CHS", "Blue Ridge Society", "Sunrise Heights", "Palm Grove Residency", "Emerald Towers"];
const AVAILABILITY = ["Available", "On Duty", "Off Duty", "Leave"];
const categoryConfig = {
    Plumber: { color: "#00b4d8", bg: "rgba(0,180,216,0.12)", icon: Droplets },
    Electrician: { color: "#ffb347", bg: "rgba(255,179,71,0.12)", icon: Zap },
    Carpenter: { color: "#ff9f43", bg: "rgba(255,159,67,0.12)", icon: Wrench },
    Painter: { color: "#6c63ff", bg: "rgba(108,99,255,0.12)", icon: Paintbrush },
    Housekeeping: { color: "#00d4aa", bg: "rgba(0,212,170,0.12)", icon: Package },
    Security: { color: "#ff6b6b", bg: "rgba(255,107,107,0.12)", icon: Shield },
    Driver: { color: "#00b4d8", bg: "rgba(0,180,216,0.12)", icon: User },
    Cook: { color: "#ffb347", bg: "rgba(255,179,71,0.12)", icon: Package },
    Gardener: { color: "#00d4aa", bg: "rgba(0,212,170,0.12)", icon: Package },
    "IT Support": { color: "#6c63ff", bg: "rgba(108,99,255,0.12)", icon: Wrench },
};
const availConfig = {
    Available: { color: "#00d4aa", bg: "rgba(0,212,170,0.12)" },
    "On Duty": { color: "#00b4d8", bg: "rgba(0,180,216,0.12)" },
    "Off Duty": { color: "#8899aa", bg: "rgba(136,153,170,0.12)" },
    Leave: { color: "#ffb347", bg: "rgba(255,179,71,0.12)" },
};
const initialHelpers = [
    { id: 1, helperId: "HLP-001", name: "Manoj Kumar", category: "Plumber", phone: "9876511001", email: "manoj@helpers.com", society: "Green Valley CHS", experience: "8 years", rating: 4.8, jobs: 124, availability: "Available", address: "Near Gate 2, Green Valley" },
    { id: 2, helperId: "HLP-002", name: "Suresh Yadav", category: "Electrician", phone: "9876511002", email: "suresh@helpers.com", society: "Blue Ridge Society", experience: "12 years", rating: 4.6, jobs: 210, availability: "On Duty", address: "Staff Quarters, Block A" },
    { id: 3, helperId: "HLP-003", name: "Ramkumar Das", category: "Carpenter", phone: "9876511003", email: "ramkumar@help.com", society: "Sunrise Heights", experience: "5 years", rating: 4.2, jobs: 87, availability: "Available", address: "Sector 5, Pune" },
    { id: 4, helperId: "HLP-004", name: "Geeta Bai", category: "Housekeeping", phone: "9876511004", email: "geeta@helpers.com", society: "Green Valley CHS", experience: "3 years", rating: 4.9, jobs: 320, availability: "On Duty", address: "Tower B, Staff Room" },
    { id: 5, helperId: "HLP-005", name: "Vikram Singh", category: "Security", phone: "9876511005", email: "vikram@secure.com", society: "Emerald Towers", experience: "7 years", rating: 4.5, jobs: 0, availability: "Available", address: "Gate 1, Emerald Towers" },
    { id: 6, helperId: "HLP-006", name: "Ritu Pandey", category: "Cook", phone: "9876511006", email: "ritu@helpers.com", society: "Blue Ridge Society", experience: "4 years", rating: 4.7, jobs: 156, availability: "Leave", address: "Wing C, Staff Quarters" },
    { id: 7, helperId: "HLP-007", name: "Anil Painter", category: "Painter", phone: "9876511007", email: "anil@helpers.com", society: "Palm Grove Residency", experience: "9 years", rating: 4.3, jobs: 98, availability: "Available", address: "Koregaon Park, Pune" },
];
const emptyForm = { name: "", category: CATEGORIES[0], phone: "", email: "", society: SOCIETIES[0], experience: "", rating: 4.0, jobs: 0, availability: "Available", address: "" };
const StarRating = ({ rating }) => (<div style={{ display: "flex", alignItems: "center", gap: 3 }}>
    {[1, 2, 3, 4, 5].map(i => (<Star key={i} size={11} style={{ color: i <= Math.round(rating) ? "#ffb347" : "#4a5568", fill: i <= Math.round(rating) ? "#ffb347" : "none" }}/>))}
    <span style={{ color: "#ffb347", fontSize: 11, fontWeight: 700, marginLeft: 2 }}>{rating}</span>
  </div>);
// Defined outside component to prevent re-mount on each render
const HlpFI = ({ label, field, type = "text", form, setForm }) => (<div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>{label}</label>
    <input type={type} value={form[field] || ""} onChange={e => setForm(f => (Object.assign(Object.assign({}, f), { [field]: e.target.value })))} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}/>
  </div>);
const HlpFS = ({ label, field, options, form, setForm }) => (<div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>{label}</label>
    <select value={form[field] || ""} onChange={e => setForm(f => (Object.assign(Object.assign({}, f), { [field]: e.target.value })))} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}>
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
export default function HelpersDashboard() {
    const { helpers: ctxHelpers } = useAppContext();
    const [data, setData] = useState(null);
    const activeData = data || ctxHelpers || [];
    const [search, setSearch] = useState("");
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [viewItem, setViewItem] = useState(null);
    const [viewMode, setViewMode] = useState("table"); // "table" | "grid"
    const [page, setPage] = useState(1);
    const PER = 8;
    const [filterCat, setFilterCat] = useState("All");
    const filtered = activeData.filter(d => {
        const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.helperId.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search);
        const matchCat = filterCat === "All" || d.category === filterCat;
        return matchSearch && matchCat;
    });
    const paged = filtered.slice((page-1)*PER, page*PER);
    const catCounts = CATEGORIES.reduce((acc, c) => { acc[c] = activeData.filter(d => d.category === c).length; return acc; }, {});
    const availCount = AVAILABILITY.reduce((acc, a) => { acc[a] = activeData.filter(d => d.availability === a).length; return acc; }, {});
    const save = () => {
        if (!form.name || !form.phone)
            return;
        if (form.id)
            setData(activeData.map(r => r.id === form.id ? Object.assign(Object.assign({}, form), { rating: +form.rating }) : r));
        else
            setData([...activeData, Object.assign(Object.assign({}, form), { id: Date.now(), helperId: `HLP-${String(activeData.length + 1).padStart(3, "0")}`, rating: +form.rating })]);
        setModal(null);
    };
    return (<div style={{ padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Helpers</h2>
          <p style={{ color: "#8899aa", fontSize: 13, marginTop: 3 }}>Manage society staff, service workers, and helpers</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setModal("add"); }} style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#1a2a4a,#162040)", border: "1px solid rgba(0,212,170,0.3)", borderRadius: 10, padding: "10px 18px", color: "#e8edf5", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          <Plus size={15}/> Add Helper
        </button>
      </div>

      {/* Availability summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {AVAILABILITY.map(a => {
            const ac = availConfig[a];
            return (<div key={a} style={{ background: "var(--bg-card)", border: `1px solid ${ac.color}22`, borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: ac.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <HandHelping size={16} style={{ color: ac.color }}/>
              </div>
              <div>
                <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600 }}>{a}</p>
                <p style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>{availCount[a] || 0}</p>
              </div>
            </div>);
        })}
      </div>

      {/* Category filter + view toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["All", ...CATEGORIES].map(c => {
            const isActive = filterCat === c;
            const cfg = categoryConfig[c];
            return (<button key={c} onClick={() => setFilterCat(c)} style={{ background: isActive ? (cfg ? cfg.bg : "rgba(255,255,255,0.08)") : "none", border: `1px solid ${isActive ? (cfg ? cfg.color : "rgba(255,255,255,0.2)") : "rgba(255,255,255,0.08)"}`, borderRadius: 20, padding: "5px 12px", color: isActive ? (cfg ? cfg.color : "var(--text-primary)") : "#8899aa", fontSize: 11, fontWeight: isActive ? 700 : 400, cursor: "pointer" }}>
                {c}{c !== "All" && catCounts[c] ? ` (${catCounts[c]})` : ""}
              </button>);
        })}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["table", "grid"].map(m => (<button key={m} onClick={() => setViewMode(m)} style={{ background: viewMode === m ? "rgba(0,212,170,0.15)" : "none", border: `1px solid ${viewMode === m ? "#00d4aa" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "6px 12px", color: viewMode === m ? "#00d4aa" : "#8899aa", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
              {m}
            </button>))}
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16, marginBottom: 20 }}>
          {filtered.map(h => {
                const cfg = categoryConfig[h.category] || categoryConfig.Plumber;
                const ac = availConfig[h.availability] || availConfig.Available;
                const Icon = cfg.icon;
                return (<div key={h.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 18, cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }} onClick={() => { setViewItem(h); setModal("view"); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={18} style={{ color: cfg.color }}/>
                  </div>
                  <span style={{ background: ac.bg, color: ac.color, padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{h.availability}</span>
                </div>
                <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{h.name}</p>
                <p style={{ color: cfg.color, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{h.category}</p>
                <StarRating rating={h.rating}/>
                <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8899aa" }}>
                  <span>📞 {h.phone}</span>
                  <span>{h.jobs} jobs</span>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "#8899aa" }}>{h.society}</div>
              </div>);
            })}
        </div>)}

      {/* Table View */}
      {viewMode === "table" && (<div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#00d4aa", fontWeight: 700, fontSize: 13 }}>
              <span style={{ width: 3, height: 16, background: "#00d4aa", borderRadius: 2 }}/>
              LIST OF HELPERS
            </div>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }}/>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search helpers" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px 8px 32px", color: "var(--text-primary)", fontSize: 13, outline: "none", width: 200 }}/>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["S.No", "Helper ID", "Name", "Category", "Phone", "Society", "Experience", "Rating", "Jobs Done", "Availability", "Action"].map(h => (<th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#8899aa", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>))}
                </tr>
              </thead>
              <tbody>
                {paged.map((row, i) => {
                const cfg = categoryConfig[row.category] || categoryConfig.Plumber;
                const ac = availConfig[row.availability] || availConfig.Available;
                const Icon = cfg.icon;
                return (<tr key={row.id} style={{ borderBottom: "1px solid var(--border)" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: "12px 14px", color: "#00d4aa", fontWeight: 600, fontSize: 12 }}>{row.helperId}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon size={14} style={{ color: cfg.color }}/>
                          </div>
                          <div>
                            <p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}>{row.name}</p>
                            <p style={{ color: "#8899aa", fontSize: 11 }}>{row.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: cfg.bg, color: cfg.color, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{row.category}</span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{row.phone}</td>
                      <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{row.society}</td>
                      <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{row.experience}</td>
                      <td style={{ padding: "12px 14px" }}><StarRating rating={row.rating}/></td>
                      <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontWeight: 600 }}>{row.jobs}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: ac.bg, color: ac.color, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{row.availability}</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button onClick={() => { setViewItem(row); setModal("view"); }} style={{ background: "rgba(0,180,216,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#00b4d8", cursor: "pointer" }}><Eye size={12}/></button>
                          <button onClick={() => { setForm(Object.assign({}, row)); setModal("edit"); }} style={{ background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#6c63ff", cursor: "pointer" }}><Edit2 size={12}/></button>
                          <button onClick={() => setData(activeData.filter(r => r.id !== row.id))} style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#ff6b6b", cursor: "pointer" }}><Trash2 size={12}/></button>
                        </div>
                      </td>
                    </tr>);
            })}
                {paged.length === 0 && (<tr><td colSpan={11} style={{ padding: 40, textAlign: "center", color: "#8899aa" }}>No helpers found</td></tr>)}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
        </div>)}

      {(modal === "add" || modal === "edit") && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 500, maxHeight: "85vh", overflow: "auto" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>{modal === "edit" ? "Edit Helper" : "Add Helper"}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}><X size={18}/></button>
            </div>
            <div style={{ padding: 22 }}>
              <HlpFI label="Full Name *" field="name" form={form} setForm={setForm}/>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <HlpFI label="Phone *" field="phone" form={form} setForm={setForm}/>
                <HlpFI label="Email" field="email" type="email" form={form} setForm={setForm}/>
              </div>
              <HlpFS label="Category" field="category" options={CATEGORIES} form={form} setForm={setForm}/>
              <HlpFS label="Society" field="society" options={SOCIETIES} form={form} setForm={setForm}/>
              <HlpFI label="Address" field="address" form={form} setForm={setForm}/>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <HlpFI label="Experience" field="experience" form={form} setForm={setForm}/>
                <HlpFI label="Rating (0–5)" field="rating" type="number" form={form} setForm={setForm}/>
                <HlpFI label="Jobs Done" field="jobs" type="number" form={form} setForm={setForm}/>
              </div>
              <HlpFS label="Availability" field="availability" options={AVAILABILITY} form={form} setForm={setForm}/>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button onClick={() => setModal(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer" }}>Cancel</button>
                <button onClick={save} style={{ background: "linear-gradient(135deg,#00d4aa,#6c63ff)", border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Save</button>
              </div>
            </div>
          </div>
        </div>)}

      {modal === "view" && viewItem && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 440 }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>Helper Profile</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}><X size={18}/></button>
            </div>
            <div style={{ padding: 22 }}>
              {(() => {
                const cfg = categoryConfig[viewItem.category] || categoryConfig.Plumber;
                const ac = availConfig[viewItem.availability] || availConfig.Available;
                const Icon = cfg.icon;
                return (<>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: 16, background: cfg.bg, borderRadius: 12 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 13, background: `${cfg.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={22} style={{ color: cfg.color }}/>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15 }}>{viewItem.name}</p>
                        <p style={{ color: cfg.color, fontSize: 12, fontWeight: 600 }}>{viewItem.category}</p>
                        <StarRating rating={viewItem.rating}/>
                      </div>
                      <span style={{ background: ac.bg, color: ac.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{viewItem.availability}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                      <div style={{ background: "rgba(0,212,170,0.06)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                        <p style={{ color: "#8899aa", fontSize: 11 }}>Jobs Done</p>
                        <p style={{ color: "#00d4aa", fontWeight: 700, fontSize: 18 }}>{viewItem.jobs}</p>
                      </div>
                      <div style={{ background: "rgba(255,179,71,0.06)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                        <p style={{ color: "#8899aa", fontSize: 11 }}>Experience</p>
                        <p style={{ color: "#ffb347", fontWeight: 700, fontSize: 15 }}>{viewItem.experience}</p>
                      </div>
                    </div>
                    {[["Helper ID", viewItem.helperId], ["Phone", viewItem.phone], ["Email", viewItem.email], ["Society", viewItem.society], ["Address", viewItem.address]].map(([k, v]) => (<div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                        <span style={{ color: "#8899aa", fontSize: 12 }}>{k}</span>
                        <span style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{v}</span>
                      </div>))}
                  </>);
            })()}
            </div>
          </div>
        </div>)}
    </div>);
}
