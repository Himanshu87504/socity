// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../AppContext";
import { getAllSocietyApi } from '../api/society-api';
import { getSocietyTowersApi } from '../api/tower-api'; // apna path
import { getAllMemberApi } from '../api/member-api'; // apna path
import { addMemberApi, updateMemberApi, deleteMemberApi, getAllMembersApi, getSocietyMembersApi, getMemberDetailApi } from "../api/member-api";
import { addWingApi , updateWingApi , deleteWingApi, getAllWingApi } from '../api/wing-api';        // apna path
import { Building2, Home, UserCheck, Store, FileText, Smartphone, User, ChevronRight, Plus, Search, Edit2, Trash2, X, ChevronDown, ChevronUp, Save, AlertCircle, Shield, ToggleLeft, ToggleRight, Phone, Mail, Layers, Building, ChevronLeft, ChevronsLeft, ChevronsRight } from "lucide-react";
// import SocietyDashboard from "./SocietyDashboard";
import { DollarSign } from "lucide-react";
import { RefreshCw } from "lucide-react";
import ChargeMasterDashboard from "./ChargeMasterDashboard";
import VendorMaster from "./VendorMaster";
import PropertyDashboard from "./PropertyDashboard";
import { Users } from "lucide-react";
import CommitteeDashboard from "./CommitteeDashboard";
// import { getAllTermsConditionApi } from "../api/termsCondition-api";
import TermsConditions from './TermsConditions';
import SocietyDashboard from './SocietyDashboard';
// ── Mock Data ──────────────────────────────────────────────────────
const initialTowers = [
    { id: 1, name: "Tower Alpha", floors: 12, units: 48, society: "Green Valley", status: "Active" },
    { id: 2, name: "Tower Beta", floors: 10, units: 40, society: "Green Valley", status: "Active" },
    { id: 3, name: "Tower Gamma", floors: 15, units: 60, society: "Blue Ridge", status: "Inactive" },
    { id: 4, name: "Tower Delta", floors: 8, units: 32, society: "Sunrise Heights", status: "Active" },
];
const initialSocieties = [
    { id: 1, name: "Green Valley CHS", address: "Sector 12, Noida", units: 120, contact: "9876543210", email: "gv@chs.in", status: "Active" },
    { id: 2, name: "Blue Ridge Society", address: "Block A, Gurugram", units: 200, contact: "9876543211", email: "br@chs.in", status: "Active" },
    { id: 3, name: "Sunrise Heights", address: "Phase 2, Pune", units: 85, contact: "9876543212", email: "sh@chs.in", status: "Active" },
    { id: 4, name: "Palm Grove Residency", address: "Main Road, Mumbai", units: 60, contact: "9876543213", email: "pg@chs.in", status: "Inactive" },
    { id: 5, name: "Emerald Towers", address: "Ring Road, Delhi", units: 150, contact: "9876543214", email: "et@chs.in", status: "Active" },
];

const initialProperties = [
    { id: 1, unit: "A-101", wing: "Wing A", type: "2BHK", area: "1050 sqft", owner: "Ramesh Gupta", status: "Occupied" },
    { id: 2, unit: "A-102", wing: "Wing A", type: "3BHK", area: "1400 sqft", owner: "Sunita Sharma", status: "Occupied" },
    { id: 3, unit: "A-201", wing: "Wing A", type: "1BHK", area: "650 sqft", owner: "—", status: "Vacant" },
    { id: 4, unit: "B-101", wing: "Wing B", type: "2BHK", area: "1050 sqft", owner: "Amit Patel", status: "Occupied" },
    { id: 5, unit: "B-202", wing: "Wing B", type: "3BHK", area: "1400 sqft", owner: "Priya Singh", status: "Occupied" },
    { id: 6, unit: "C-301", wing: "Wing C", type: "2BHK", area: "1050 sqft", owner: "Vijay Kumar", status: "Occupied" },
];
const initialMembers = [
    { id: 1, name: "Ramesh Gupta", unit: "A-101", role: "Owner", phone: "9876500001", email: "ramesh@email.com", status: "Active" },
    { id: 2, name: "Sunita Sharma", unit: "A-102", role: "Owner", phone: "9876500002", email: "sunita@email.com", status: "Active" },
    { id: 3, name: "Amit Patel", unit: "B-101", role: "Tenant", phone: "9876500003", email: "amit@email.com", status: "Active" },
    { id: 4, name: "Priya Singh", unit: "B-202", role: "Owner", phone: "9876500004", email: "priya@email.com", status: "Active" },
    { id: 5, name: "Vijay Kumar", unit: "C-301", role: "Owner", phone: "9876500005", email: "vijay@email.com", status: "Inactive" },
];
const initialVendors = [
    { id: 1, name: "CleanCity Services", category: "Housekeeping", contact: "9988776601", email: "clean@city.com", rating: 4.5, status: "Active" },
    { id: 2, name: "ElectroFix Pvt Ltd", category: "Electrical", contact: "9988776602", email: "fix@electro.com", rating: 4.2, status: "Active" },
    { id: 3, name: "AquaPlumb Solutions", category: "Plumbing", contact: "9988776603", email: "aqua@plumb.com", rating: 4.0, status: "Active" },
    { id: 4, name: "GreenGuard Security", category: "Security", contact: "9988776604", email: "gg@security.com", rating: 4.7, status: "Active" },
    { id: 5, name: "SwiftLift Elevators", category: "Lifts", contact: "9988776605", email: "swift@lift.com", rating: 3.8, status: "Inactive" },
];
const initialTerms = [
    { id: 1, title: "Maintenance Payment Due", category: "Finance", content: "Maintenance charges are due on the 5th of every month. Late fees apply after the 10th.", status: "Active" },
    { id: 2, title: "Pet Policy", category: "Conduct", content: "Pets are allowed in common areas only on a leash. Owners are responsible for cleanliness.", status: "Active" },
    { id: 3, title: "Parking Rules", category: "Parking", content: "Each unit is allotted one parking space. Visitor parking is available at Gate 2.", status: "Active" },
    { id: 4, title: "Noise Restrictions", category: "Conduct", content: "No loud noise between 10 PM and 7 AM. Musical instruments allowed till 9 PM only.", status: "Active" },
];
const initialMobilePerms = [
    { feature: "View Invoices", residents: true, committee: true },
    { feature: "Make Payments", residents: true, committee: true },
    { feature: "Raise Complaints", residents: true, committee: true },
    { feature: "Book Amenities", residents: true, committee: true },
    { feature: "View Announcements", residents: true, committee: true },
    { feature: "Approve Visitors", residents: false, committee: true },
    { feature: "Manage Maintenance", residents: false, committee: true },
    { feature: "Access Reports", residents: false, committee: true },
    { feature: "Manage Members", residents: false, committee: true },
];
const initialUsers = [
    { id: 1, name: "Admin User", email: "admin@society.com", role: "Super Admin", status: "Active", lastLogin: "Today, 10:30 AM" },
    { id: 2, name: "Mohan Das", email: "mohan@society.com", role: "Manager", status: "Active", lastLogin: "Today, 09:15 AM" },
    { id: 3, name: "Priya Nair", email: "priya@society.com", role: "Accountant", status: "Active", lastLogin: "Yesterday" },
    { id: 4, name: "Ravi Shankar", email: "ravi@society.com", role: "Security", status: "Inactive", lastLogin: "3 days ago" },
];
// ── Shared UI Components ────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        "Active": { bg: "rgba(0,212,170,0.15)", color: "#00d4aa" },
        "Inactive": { bg: "rgba(255,107,107,0.15)", color: "#ff6b6b" },
        "Occupied": { bg: "rgba(0,180,216,0.15)", color: "#00b4d8" },
        "Vacant": { bg: "rgba(255,179,71,0.15)", color: "#ffb347" },
    };
    const s = map[status] || { bg: "rgba(136,153,170,0.15)", color: "#8899aa" };
    return (<span style={{
            background: s.bg, color: s.color, padding: "3px 10px",
            borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em"
        }}>{status}</span>);
};
const Toggle = ({ checked, onChange }) => (<button onClick={() => onChange(!checked)} style={{
        background: checked ? "rgba(0,212,170,0.2)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${checked ? "#00d4aa" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 20, padding: "4px 12px", cursor: "pointer",
        color: checked ? "#00d4aa" : "#8899aa", fontSize: 12, fontWeight: 600,
        display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s"
    }}>
    {checked ? <ToggleRight size={14}/> : <ToggleLeft size={14}/>}
    {checked ? "On" : "Off"}
  </button>);
const Modal = ({ title, onClose, children }) => (<div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
    <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border-strong)",
        borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "85vh",
        overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.6)"
    }}>
      <div style={{
        padding: "20px 24px", borderBottom: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center"
    }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600 }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}>
          <X size={18}/>
        </button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>);
const FormField = ({ label, value, onChange, type = "text", options, required }) => (<div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
      {label}{required && <span style={{ color: "#ff6b6b" }}> *</span>}
    </label>
    {options ? (<select value={value} onChange={e => onChange(e.target.value)} style={{
            width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-strong)",
            borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13,
            outline: "none", cursor: "pointer"
        }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>) : (<input type={type} value={value} onChange={e => onChange(e.target.value)} style={{
            width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-strong)",
            borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13,
            outline: "none"
        }}/>)}
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
// ── Section: Tower Master ────────────────────────────────────────────
function TowerMaster() {
    const { towers: ctxTowers } = useAppContext();
    const [data, setData] = useState(null);
    const activeData = data || ctxTowers;
    const [search, setSearch] = useState("");
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({});
    const filtered = activeData.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.society.toLowerCase().includes(search.toLowerCase()));
    const [page, setPage] = useState(1);
    const PER = 8;
    const paged = filtered.slice((page-1)*PER, page*PER);
    const openAdd = () => { setForm({ name: "", floors: "", units: "", society: "Green Valley", status: "Active" }); setModal("add"); };
    const openEdit = (r) => { setForm(Object.assign({}, r)); setModal("edit"); };
    const handleDelete = (id) => setData(d => d.filter(r => r.id !== id));
    const handleSave = () => {
        if (modal === "add") {
            setData(d => [...d, Object.assign(Object.assign({}, form), { id: Date.now(), floors: +form.floors, units: +form.units })]);
        }
        else {
            setData(d => d.map(r => r.id === form.id ? Object.assign(Object.assign({}, form), { floors: +form.floors, units: +form.units }) : r));
        }
        setModal(null);
    };
    return (<div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }}/>
          <input placeholder="Search towers..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8,
            padding: "8px 12px 8px 36px", color: "var(--text-primary)", fontSize: 13, width: 240, outline: "none"
        }}/>
        </div>
        <button onClick={openAdd} style={{
            background: "linear-gradient(135deg, #00d4aa, #00b4d8)", border: "none", borderRadius: 8,
            padding: "9px 18px", color: "#0d1117", fontWeight: 700, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6
        }}>
          <Plus size={14}/> Add Tower
        </button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Tower Name", "Society", "Floors", "Units", "Status", "Actions"].map(h => (<th key={h} style={{ padding: "10px 14px", color: "#8899aa", fontSize: 12, fontWeight: 600, textAlign: "left" }}>{h}</th>))}
            </tr>
          </thead>
          <tbody>
            {paged.map(r => (<tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontWeight: 500 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Building size={14} style={{ color: "#00d4aa" }}/>{r.name}
                  </div>
                </td>
                <td style={{ padding: "12px 14px", color: "#8899aa" }}>{r.society}</td>
                <td style={{ padding: "12px 14px", color: "var(--text-primary)" }}>{r.floors}</td>
                <td style={{ padding: "12px 14px", color: "var(--text-primary)" }}>{r.units}</td>
                <td style={{ padding: "12px 14px" }}><StatusBadge status={r.status}/></td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(r)} style={{ background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 6, padding: "6px 10px", color: "#6c63ff", cursor: "pointer" }}><Edit2 size={13}/></button>
                    <button onClick={() => handleDelete(r.id)} style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "6px 10px", color: "#ff6b6b", cursor: "pointer" }}><Trash2 size={13}/></button>
                  </div>
                </td>
              </tr>))}
          </tbody>
        </table>
      <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
      </div>
      {modal && (<Modal title={modal === "add" ? "Add Tower" : "Edit Tower"} onClose={() => setModal(null)}>
          <FormField label="Tower Name" value={form.name || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { name: v })))} required/>
          <FormField label="Society" value={form.society || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { society: v })))} options={["Green Valley", "Blue Ridge", "Sunrise Heights", "Palm Grove", "Emerald Towers"]}/>
          <FormField label="Number of Floors" value={form.floors || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { floors: v })))} type="number" required/>
          <FormField label="Total Units" value={form.units || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { units: v })))} type="number" required/>
          <FormField label="Status" value={form.status || "Active"} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { status: v })))} options={["Active", "Inactive"]}/>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setModal(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} style={{ background: "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 18px", color: "#0d1117", fontWeight: 700, cursor: "pointer" }}>
              <Save size={13} style={{ marginRight: 6, verticalAlign: "middle" }}/>Save
            </button>
          </div>
        </Modal>)}
    </div>);
}
// ── Section: Society Master ──────────────────────────────────────────
// function SocietyMaster() {
//     const { societies: ctxSocieties } = useAppContext();
//     const [data, setData] = useState(null);
//     const activeData = data || ctxSocieties;
//     const [search, setSearch] = useState("");
//     const [modal, setModal] = useState(null);
//     const [form, setForm] = useState({});
//     const filtered = activeData.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
//     const [page2, setPage2] = useState(1);
//     const PER = 8;
//     const paged = filtered.slice((page2-1)*PER, page2*PER);
//     const openAdd = () => { setForm({ name: "", address: "", units: "", contact: "", email: "", status: "Active" }); setModal("add"); };
//     const openEdit = (r) => { setForm(Object.assign({}, r)); setModal("edit"); };
//     const handleDelete = (id) => setData(d => d.filter(r => r.id !== id));
//     const handleSave = () => {
//         if (modal === "add")
//             setData(d => [...d, Object.assign(Object.assign({}, form), { id: Date.now(), units: +form.units })]);
//         else
//             setData(d => d.map(r => r.id === form.id ? Object.assign(Object.assign({}, form), { units: +form.units }) : r));
//         setModal(null);
//     };
//     return (<div>
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
//         <div style={{ position: "relative" }}>
//           <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }}/>
//           <input placeholder="Search societies..." value={search} onChange={e => { setSearch(e.target.value); setPage2(1); }} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px 8px 36px", color: "var(--text-primary)", fontSize: 13, width: 240, outline: "none" }}/>
//         </div>
//         <button onClick={openAdd} style={{ background: "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 18px", color: "#0d1117", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
//           <Plus size={14}/> Add Society
//         </button>
//       </div>
//       <div style={{ overflowX: "auto" }}>
//         <table style={{ width: "100%", borderCollapse: "collapse" }}>
//           <thead>
//             <tr style={{ borderBottom: "1px solid var(--border)" }}>
//               {["Society Name", "Address", "Units", "Contact", "Status", "Actions"].map(h => (<th key={h} style={{ padding: "10px 14px", color: "#8899aa", fontSize: 12, fontWeight: 600, textAlign: "left" }}>{h}</th>))}
//             </tr>
//           </thead>
//           <tbody>
//             {paged.map(r => (<tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
//                 <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontWeight: 500 }}>
//                   <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Building2 size={14} style={{ color: "#6c63ff" }}/>{r.name}</div>
//                 </td>
//                 <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{r.address}</td>
//                 <td style={{ padding: "12px 14px", color: "var(--text-primary)" }}>{r.units}</td>
//                 <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{r.contact}</td>
//                 <td style={{ padding: "12px 14px" }}><StatusBadge status={r.status}/></td>
//                 <td style={{ padding: "12px 14px" }}>
//                   <div style={{ display: "flex", gap: 6 }}>
//                     <button onClick={() => openEdit(r)} style={{ background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 6, padding: "6px 10px", color: "#6c63ff", cursor: "pointer" }}><Edit2 size={13}/></button>
//                     <button onClick={() => handleDelete(r.id)} style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "6px 10px", color: "#ff6b6b", cursor: "pointer" }}><Trash2 size={13}/></button>
//                   </div>
//                 </td>
//               </tr>))}
//           </tbody>
//         </table>
//       <Pagination page={page2} total={filtered.length} perPage={PER} onChange={setPage2} />
//       </div>
//       {modal && (<Modal title={modal === "add" ? "Add Society" : "Edit Society"} onClose={() => setModal(null)}>
//           <FormField label="Society Name" value={form.name || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { name: v })))} required/>
//           <FormField label="Address" value={form.address || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { address: v })))} required/>
//           <FormField label="Total Units" value={form.units || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { units: v })))} type="number" required/>
//           <FormField label="Contact Number" value={form.contact || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { contact: v })))}/>
//           <FormField label="Email" value={form.email || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { email: v })))} type="email"/>
//           <FormField label="Status" value={form.status || "Active"} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { status: v })))} options={["Active", "Inactive"]}/>
//           <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
//             <button onClick={() => setModal(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer" }}>Cancel</button>
//             <button onClick={handleSave} style={{ background: "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 18px", color: "#0d1117", fontWeight: 700, cursor: "pointer" }}>
//               <Save size={13} style={{ marginRight: 6, verticalAlign: "middle" }}/>Save
//             </button>
//           </div>
//         </Modal>)}
//     </div>);
// }
// ── Section: Wing Master ─────────────────────────────────────────────
function WingMaster() {
  const { wings: ctxWings } = useAppContext();
  const [data, setData] = useState(null);
  const activeData = data || ctxWings;

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Society + Tower dropdowns
  const [societies, setSocieties] = useState([]);
  const [towers, setTowers] = useState([]);
  const [towersLoading, setTowersLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // wing to delete
const [deleting, setDeleting] = useState(false);

  // Fetch societies on mount
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAllWingApi();
        const d = res.data;
        if (Array.isArray(d)) setSocieties(d);
        else if (Array.isArray(d?.societies)) setSocieties(d.societies);
        else if (Array.isArray(d?.data)) setSocieties(d.data);
        else setSocieties([]);
      } catch (e) {
        console.error('Society fetch failed:', e);
        setSocieties([]);
      }
    };
    fetch();
  }, []);

  // Fetch towers when society changes in form
  useEffect(() => {
    if (!form.societyIdentifier) { setTowers([]); return; }
    const fetch = async () => {
      setTowersLoading(true);
      try {
        const res = await getSocietyTowersApi(form.societyIdentifier);
        const d = res.data;
        if (Array.isArray(d)) setTowers(d);
        else if (Array.isArray(d?.towers)) setTowers(d.towers);
        else if (Array.isArray(d?.data)) setTowers(d.data);
        else setTowers([]);
      } catch (e) {
        console.error('Tower fetch failed:', e);
        setTowers([]);
      } finally {
        setTowersLoading(false);
      }
    };
    fetch();
  }, [form.societyIdentifier]);

  const openAdd = () => {
      // console.log('Edit wing data:', JSON.stringify(r, null, 2)); // exact structure

    setForm({ wingName: '', societyIdentifier: '', towerIdentifier: '' });
    setFormError('');
    setModal('add');
  };

const openEdit = async (r) => {
  setForm({
    wingIdentifier:    r.identifier,           // mapped field
    wingName:          r.name,                 // mapped field
    societyIdentifier: r.societyIdentifier,    // ab available hai
    towerIdentifier:   r.towerIdentifier || '',// ab available hai
  });
  setFormError('');
  setModal('edit');

  if (r.societyIdentifier) {
    setTowersLoading(true);
    try {
      const res = await getSocietyTowersApi(r.societyIdentifier);
      const d = res.data;
      if (Array.isArray(d)) setTowers(d);
      else if (Array.isArray(d?.towers)) setTowers(d.towers);
      else if (Array.isArray(d?.data)) setTowers(d.data);
      else setTowers([]);
    } catch (e) {
      setTowers([]);
    } finally {
      setTowersLoading(false);
    }
  }
};
const handleSave = async () => {
  setFormError('');

  if (!form.wingName?.trim()) { setFormError('Wing name is required.'); return; }
  if (!form.societyIdentifier) { setFormError('Please select a society.'); return; }

  setSaving(true);
  try {
    const payload = {
      wingName: form.wingName.trim(),
      societyIdentifier: form.societyIdentifier,
      towerIdentifier: form.towerIdentifier || null,
    };

    if (modal === 'edit') {
      const identifier = form.wingIdentifier || form.wingId || form.identifier || form.id;
console.log('Full form object:', form);
console.log('Identifier being used:', identifier);

      const res = await updateWingApi(payload, identifier);
      const updatedWing = res.data?.wing || res.data?.data || res.data;

      // API se updated data aaye ya na aaye, dono handle karo
      setData(d =>
        (d || ctxWings).map(w =>
          w.wingIdentifier === identifier
            ? { ...w, ...payload, ...(updatedWing || {}) }
            : w
        )
      );
    } else {
      const res = await addWingApi(payload);
      const newWing = res.data?.wing || res.data?.data || res.data;
      setData(d => [...(d || ctxWings), newWing]);
    }

    setModal(null);
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      'Failed to save wing. Please try again.';
    setFormError(msg);
  } finally {
    setSaving(false);
  }
};

const handleDelete = async () => {
  if (!deleteTarget) return;
  setDeleting(true);
  try {
    const id = deleteTarget.identifier; // ✅ mapWing ke baad yahi field hai
    await deleteWingApi(id);
    setData(d => (d || ctxWings).filter(w => w.identifier !== id));
    setDeleteTarget(null);
  } catch (err) {
    console.error('Delete failed:', err);
  } finally {
    setDeleting(false);
  }
};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button onClick={openAdd} style={{ background: 'linear-gradient(135deg,#00d4aa,#00b4d8)', border: 'none', borderRadius: 8, padding: '9px 18px', color: '#0d1117', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add Tower
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 16 }}>
        {activeData.map(w => (
          <div key={w.id || w.wingIdentifier} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: 'rgba(108,99,255,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={16} style={{ color: '#6c63ff' }} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{w.wingName || w.name}</div>
                  {/* <div style={{ color: '#8899aa', fontSize: 12 }}>{w.towerName || w.tower || '—'}</div> */}
                </div>
              </div>
              <StatusBadge status={w.status || 'Active'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ color: '#8899aa', fontSize: 11 }}>Society</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 12 }}>{w.societyName || '—'}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ color: '#8899aa', fontSize: 11 }}>Tower</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 12 }}>{w.tower || '—'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => openEdit(w)} style={{ flex: 1, background: 'rgba(108,99,255,0.12)', border: 'none', borderRadius: 8, padding: '8px', color: '#6c63ff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12 }}>
                <Edit2 size={12} /> Edit
              </button>
              <button
  onClick={() => setDeleteTarget(w)}
  style={{ flex: 1, background: 'rgba(255,107,107,0.12)', border: 'none', borderRadius: 8, padding: '8px', color: '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12 }}
>
  <Trash2 size={12} /> Delete
</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Wing' : 'Edit Wing'} onClose={() => setModal(null)}>

          {/* Error box */}
          {formError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,107,107,0.10)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
              <span style={{ color: '#ff6b6b', fontSize: 13 }}>⚠ {formError}</span>
            </div>
          )}

          {/* Wing Name */}
          <FormField
            label="Wing Name"
            value={form.wingName || ''}
            onChange={v => setForm(f => ({ ...f, wingName: v }))}
            required
          />

          {/* Society Selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Society *
            </label>
            <select
              value={form.societyIdentifier || ''}
              onChange={e => setForm(f => ({ ...f, societyIdentifier: e.target.value, towerIdentifier: '' }))}
              style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)' }}
            >
              <option value="">-- Select Society --</option>
              {societies.map(s => (
                <option key={s.societyIdentifier || s.id} value={s.societyIdentifier || s.id}>
                  {s.societyName || s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tower/ block Selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Block <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <select
              value={form.towerIdentifier || ''}
              onChange={e => setForm(f => ({ ...f, towerIdentifier: e.target.value }))}
              disabled={!form.societyIdentifier || towersLoading}
              style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: form.societyIdentifier ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)', opacity: !form.societyIdentifier ? 0.5 : 1 }}
            >
              <option value="">{towersLoading ? 'Loading towers...' : towers.length === 0 ? 'No Block available' : '-- Select Block --'}</option>
              {towers.map(t => (
                <option key={t.towerIdentifier || t.id} value={t.towerIdentifier || t.id}>
                  {t.towerName || t.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setModal(null)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 18px', color: '#8899aa', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg,#00d4aa,#00b4d8)', border: 'none', borderRadius: 8, padding: '9px 18px', color: '#0d1117', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              {saving ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#0d1117', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Saving...</> : 'Save'}
            </button>
          </div>
        </Modal>
      )} 

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal title="Delete Wing" onClose={() => setDeleteTarget(null)}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: 'var(--text-primary)', fontSize: 14, marginBottom: 6 }}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
            </p>
            <p style={{ color: '#8899aa', fontSize: 12 }}>Yeh action undo nahi ki ja sakti.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setDeleteTarget(null)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 18px', color: '#8899aa', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ background: 'linear-gradient(135deg,#ff6b6b,#ee5a24)', border: 'none', borderRadius: 8, padding: '9px 18px', color: '#fff', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {deleting
                ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Deleting...</>
                : <><Trash2 size={14} /> Delete</>
              }
            </button>
          </div>
        </Modal>
      )}
    </div> 
      
    // </div>
  );
}
// ── Section: Property Master ─────────────────────────────────────────
// function PropertyMaster() {
//     const { properties: ctxProperties } = useAppContext();
//     const [data, setData] = useState(null);
//     const activeData = data || ctxProperties;
//     const [search, setSearch] = useState("");
//     const [modal, setModal] = useState(null);
//     const [form, setForm] = useState({});
//     const filtered = activeData.filter(r => r.unit.toLowerCase().includes(search.toLowerCase()) ||
//         r.owner.toLowerCase().includes(search.toLowerCase()));
//     const [page3, setPage3] = useState(1);
//     const PER = 8;
//     const paged = filtered.slice((page3-1)*PER, page3*PER);
//     const openAdd = () => { setForm({ unit: "", wing: "Wing A", type: "2BHK", area: "", owner: "", status: "Vacant" }); setModal("add"); };
//     const openEdit = (r) => { setForm(Object.assign({}, r)); setModal("edit"); };
//     const handleSave = () => {
//         if (modal === "add")
//             setData(d => [...d, Object.assign(Object.assign({}, form), { id: Date.now() })]);
//         else
//             setData(d => d.map(r => r.id === form.id ? Object.assign({}, form) : r));
//         setModal(null);
//     };
//     return (<div>
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
//         <div style={{ position: "relative" }}>
//           <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }}/>
//           <input placeholder="Search units..." value={search} onChange={e => { setSearch(e.target.value); setPage3(1); }} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px 8px 36px", color: "var(--text-primary)", fontSize: 13, width: 240, outline: "none" }}/>
//         </div>
//         <button onClick={openAdd} style={{ background: "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 18px", color: "#0d1117", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
//           <Plus size={14}/> Add Property
//         </button>
//       </div>
//       <div style={{ overflowX: "auto" }}>
//         <table style={{ width: "100%", borderCollapse: "collapse" }}>
//           <thead>
//             <tr style={{ borderBottom: "1px solid var(--border)" }}>
//               {["Unit", "Wing", "Type", "Area", "Owner", "Status", "Actions"].map(h => (<th key={h} style={{ padding: "10px 14px", color: "#8899aa", fontSize: 12, fontWeight: 600, textAlign: "left" }}>{h}</th>))}
//             </tr>
//           </thead>
//           <tbody>
//             {paged.map(r => (<tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
//                 <td style={{ padding: "12px 14px" }}>
//                   <span style={{ background: "rgba(0,212,170,0.12)", color: "#00d4aa", borderRadius: 6, padding: "3px 8px", fontFamily: "monospace", fontSize: 12, fontWeight: 600 }}>{r.unit}</span>
//                 </td>
//                 <td style={{ padding: "12px 14px", color: "#8899aa" }}>{r.wing}</td>
//                 <td style={{ padding: "12px 14px", color: "var(--text-primary)" }}>{r.type}</td>
//                 <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{r.area}</td>
//                 <td style={{ padding: "12px 14px", color: "var(--text-primary)" }}>{r.owner}</td>
//                 <td style={{ padding: "12px 14px" }}><StatusBadge status={r.status}/></td>
//                 <td style={{ padding: "12px 14px" }}>
//                   <div style={{ display: "flex", gap: 6 }}>
//                     <button onClick={() => openEdit(r)} style={{ background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 6, padding: "6px 10px", color: "#6c63ff", cursor: "pointer" }}><Edit2 size={13}/></button>
//                     <button onClick={() => setData(d => d.filter(x => x.id !== r.id))} style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "6px 10px", color: "#ff6b6b", cursor: "pointer" }}><Trash2 size={13}/></button>
//                   </div>
//                 </td>
//               </tr>))}
//           </tbody>
//         </table>
//       <Pagination page={page3} total={filtered.length} perPage={PER} onChange={setPage3} />
//       </div>
//       {modal && (<Modal title={modal === "add" ? "Add Property" : "Edit Property"} onClose={() => setModal(null)}>
//           <FormField label="Unit Number" value={form.unit || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { unit: v })))} required/>
//           <FormField label="Wing" value={form.wing || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { wing: v })))} options={["Wing A", "Wing B", "Wing C", "Wing D"]}/>
//           <FormField label="Type" value={form.type || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { type: v })))} options={["1BHK", "2BHK", "3BHK", "4BHK", "Studio", "Penthouse"]}/>
//           <FormField label="Area (sqft)" value={form.area || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { area: v })))}/>
//           <FormField label="Owner Name" value={form.owner || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { owner: v })))}/>
//           <FormField label="Status" value={form.status || "Vacant"} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { status: v })))} options={["Occupied", "Vacant"]}/>
//           <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
//             <button onClick={() => setModal(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer" }}>Cancel</button>
//             <button onClick={handleSave} style={{ background: "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 18px", color: "#0d1117", fontWeight: 700, cursor: "pointer" }}>Save</button>
//           </div>
//         </Modal>)}
//     </div>);
// }
// ── Section: Member Master ───────────────────────────────────────────
function MemberMaster() {
    // Use AppContext as primary data source (already fetched + mapped from real API)
    const { members: ctxMembers, loading: ctxLoading, refetch, setMembers } = useAppContext();

    const [search, setSearch]           = useState("");
    const [modal, setModal]             = useState(null);   // "add" | "edit" | null
    const [form, setForm]               = useState({});
    const [saving, setSaving]           = useState(false);
    const [page4, setPage4]             = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // identifier to confirm delete
    const [localRefreshing, setLocalRefreshing] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const PER4 = 10;

    // Use ctxMembers directly — AppContext already handles API fetch + mapping
    const members = ctxMembers;

    // ── Auto-fetch on mount if members look like mock data ───────
    useEffect(() => {
        const isMember = members.length <= 5 &&
            members.some(m => (m.identifier || "").startsWith("mrbaf"));
        if (isMember || members.length === 0) {
            fetchMembersDirectly();
        }
   // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Build display name from firstName/middleName/lastName ────
    const getFullName = (r) => {
        const parts = [r.firstName, r.middleName, r.lastName]
            .filter(v => v && String(v).trim());
        return parts.join(" ").trim() || "—";
    };

    // ── Filtered + paginated list ────────────────────────────────
    const filtered = members.filter(r => {
        const q = search.toLowerCase();
        return (
            getFullName(r).toLowerCase().includes(q) ||
            (r.mobileNumber || "").toLowerCase().includes(q) ||
            (r.identifier   || "").toLowerCase().includes(q)
        );
    });
    const paged4 = filtered.slice((page4 - 1) * PER4, page4 * PER4);

    // ── Direct member fetch — bypasses AppContext batch fetch ───
    const fetchMembersDirectly = async () => {
        try {
            // Try getAllMembersApi first (works for all societies)
            const response = await getAllMembersApi();
            
            const raw = response?.data;
        
            // Handle: { status, message, data: [...] }  OR  { data: [...] }  OR  [...]
            let arr = [];
            if (Array.isArray(raw))            arr = raw;
            else if (Array.isArray(raw?.data)) arr = raw.data;
            else if (Array.isArray(raw?.results)) arr = raw.results;
            else if (Array.isArray(raw?.members)) arr = raw.members;
            else if (raw && typeof raw === "object") {
                const first = Object.values(raw).find(v => Array.isArray(v));
                if (first) arr = first;
            }
            if (arr.length > 0) {
                // Map raw API fields to UI shape — spread ALL raw keys first so nothing is lost
                const mapped = arr.map((item, i) => ({
                    // Spread all raw keys so normaliseItem can access any backend field
                    ...item,
                    // Explicit UI fields (override raw with normalized values)
                    id:               item.id || item._id || i + 1,
                    identifier:       item.identifier  || item.memberIdentifier || "",
                    firstName:        item.firstName   || item.first_name  || "",
                    middleName:       item.middleName  || item.middle_name || "",
                    lastName:         item.lastName    || item.last_name   || "",
                    mobileNumber:     item.mobileNumber || item.mobile || "",
                    email:            item.email || item.emailId || "",
                    alternateEmail:   item.alternateEmail || item.alternate_email || "",
                    phone:            item.phone || "",
                    alternatePhone:   item.alternatePhone || item.alternate_phone || "",
                    // Keep raw dates; normaliseItem converts DD-MM-YYYY → YYYY-MM-DD on openEdit
                    dateOfBirth:      item.dateOfBirth || item.date_of_birth || item.dob || "",
                    gender:           item.gender || "",
                    age:              item.age || "",
                    address:          item.address || "",
                    alternateAddress: item.alternateAddress || item.alternate_address || "",
                    anniversary:      item.anniversary || "",
                    panNo:            item.panNo || item.pan_no || item.panNumber || "",
                    tanNumber:        item.tanNumber || item.tan_number || "",
                    passportNo:       item.passportNo || item.passport_no || "",
                    aadharNumber:     item.aadharNumber || item.aadhar_number || item.aadharNo || "",
                    gstinNo:          item.gstinNo || item.gstin_no || item.gstin || "",
                    unit:             item.unit || item.flatNo || item.flat_no || "",
                    // Preserve raw roleId for normaliseItem to resolve
                    roleId:           item.roleId || item.role_id || "",
                    role:             item.role || item.memberType || "",
                    // Preserve raw status (may be 1/0) for normaliseItem to normalise
                    status:           item.status,
                    profilePicPath:   item.profilePicPath || item.profile_pic || "",
                }));
                setMembers(mapped);
                return mapped;
            }
        } catch (err) {
            console.warn("[MemberMaster] Direct fetch failed:", err?.message);
        }
        return [];
    };

    // ── Refresh: trigger AppContext refetch + direct member fetch ──
    const handleRefresh = async () => {
        setLocalRefreshing(true);
        try {
            // First try direct fetch (faster and more reliable for members)
            const direct = await fetchMembersDirectly();
            // Also trigger full refetch in background
            if (direct.length === 0) {
                await refetch();
            }
        } finally {
            setLocalRefreshing(false);
        }
    };

    // ── CRUD ────────────────────────────────────────────────────
    const openAdd  = () => {
        setForm({
            firstName: "", middleName: "", lastName: "",
            mobileNumber: "", email: "", alternateEmail: "",
            phone: "", alternatePhone: "", dateOfBirth: "", gender: "",
            age: "", address: "", alternateAddress: "", anniversary: "",
            panNo: "", tanNumber: "", passportNo: "", aadharNumber: "",
            gstinNo: "",
        });
        setModal("add");
        console.log(modal, 'Add member form opened');
    };
    // ── Helper: flatten any backend response shape into a plain object ──
    // Backend shape: axios res → res.data = { status:1, message:"...", data: { ...memberFields } }
    const unwrapApiItem = (res) => {
        if (!res) return null;
        const body = res?.data;  // axios unwraps HTTP body into res.data
        if (!body) return null;

        const memberKeys = ["firstName", "first_name", "identifier", "memberIdentifier", "mobileNumber", "mobile", "email", "lastName", "last_name"];

        // Shape 1 (your backend): { status:1, message:"...", data: { ...member } }
        if (body?.data && typeof body.data === "object" && !Array.isArray(body.data)) {
            const d = body.data;
            if (memberKeys.some(k => d[k] !== undefined)) return d;
        }

        // Shape 2: body itself is the member object
        if (body && typeof body === "object" && !Array.isArray(body)) {
            if (memberKeys.some(k => body[k] !== undefined)) return body;
        }

        // Shape 3: other known wrapper keys
        for (const key of ["member", "result", "memberDetail", "details", "item", "record"]) {
            const c = body[key];
            if (c && typeof c === "object" && !Array.isArray(c) && memberKeys.some(k => c[k] !== undefined)) return c;
        }

        // Shape 4: scan all values
        for (const val of Object.values(body)) {
            if (val && typeof val === "object" && !Array.isArray(val) && memberKeys.some(k => val[k] !== undefined)) return val;
        }

        return null;
    };

    // ── Helper: convert date string to YYYY-MM-DD for <input type="date"> ──
    // Handles both "DD-MM-YYYY" (backend) and "YYYY-MM-DD" (already correct)
    const toInputDate = (val) => {
        if (!val) return "";
        const s = String(val).trim();
        // Already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        // DD-MM-YYYY  →  YYYY-MM-DD
        const m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (m) return `${m[3]}-${m[2]}-${m[1]}`;
        // DD/MM/YYYY  →  YYYY-MM-DD
        const m2 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
        return s; // return as-is; browser will show blank for unparseable dates
    };

    // ── Helper: convert YYYY-MM-DD (input[type=date]) → DD-MM-YYYY (backend) ──
    const toBackendDate = (val) => {
        if (!val) return "";
        const s = String(val).trim();
        // YYYY-MM-DD → DD-MM-YYYY
        const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (m) return `${m[3]}-${m[2]}-${m[1]}`;
        // Already DD-MM-YYYY
        if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
        return s;
    };

    // ── Helper: convert numeric / raw status → "Active" | "Inactive" ──
    const toStatusLabel = (val) => {
        if (val === undefined || val === null || val === "") return undefined;
        if (typeof val === "string") {
            const l = val.toLowerCase();
            if (l === "active" || l === "1" || l === "true")  return "Active";
            if (l === "inactive" || l === "0" || l === "false") return "Inactive";
            return val; // pass through unknown strings
        }
        if (typeof val === "number") return val === 1 ? "Active" : "Inactive";
        if (typeof val === "boolean") return val ? "Active" : "Inactive";
        return String(val);
    };

    // ── Helper: map roleId number → human-readable role label ──
    // Adjust the mapping below to match your backend's role IDs
    const ROLE_ID_MAP = {
        "1":  "Super Admin", "2": "Admin",   "3":  "Manager",
        "4":  "Accountant",  "5": "Security","6":  "Viewer",
        "7":  "Owner",       "8": "Tenant",  "9":  "Co-Owner",
        "10": "Family Member","11":"Committee","12": "Staff",
    };
    const toRoleLabel = (item) => {
        // Prefer explicit role string
        const r = item.role || item.memberType || item.memberRole || item.member_type;
        if (r && typeof r === "string" && r.trim()) return r.trim();
        // Fall back to roleId → label
        const rid = String(item.roleId ?? item.role_id ?? "").trim();
        if (rid && ROLE_ID_MAP[rid]) return ROLE_ID_MAP[rid];
        return "Owner"; // safe default
    };

    // ── Helper: map raw API object → clean form state ───────────────
    // pick() returns first non-empty value from `item`, then `fallback`
    const normaliseItem = (item, fallback = {}) => {
        const pick = (...keys) => {
            for (const src of [item, fallback]) {
                for (const k of keys) {
                    const val = src?.[k];
                    if (val !== undefined && val !== null && val !== "" && val !== "null") {
                        return val;
                    }
                }
            }
            return "";
        };
        return {
            ...item,                    // keep every raw key from backend
            id:               pick("id", "_id"),
            identifier:       pick("identifier", "memberIdentifier"),
            firstName:        pick("firstName", "first_name", "fname"),
            middleName:       pick("middleName", "middle_name", "mname"),
            lastName:         pick("lastName", "last_name", "lname"),
            mobileNumber:     pick("mobileNumber", "mobile", "mobileNo", "contact"),
            phone:            pick("phone", "landline", "phoneNo"),
            alternatePhone:   pick("alternatePhone", "alternate_phone", "altPhone", "altMobile"),
            email:            pick("email", "emailId", "email_id"),
            alternateEmail:   pick("alternateEmail", "alternate_email", "altEmail"),
            gender:           pick("gender"),
            age:              pick("age"),
            // dates: convert DD-MM-YYYY → YYYY-MM-DD for <input type="date">
            dateOfBirth:      toInputDate(pick("dateOfBirth", "date_of_birth", "dob", "birthDate")),
            anniversary:      toInputDate(pick("anniversary", "anniversaryDate")),
            address:          pick("address", "residentialAddress", "currentAddress"),
            alternateAddress: pick("alternateAddress", "alternate_address", "permanentAddress"),
            panNo:            pick("panNo", "pan_no", "panNumber", "pan"),
            aadharNumber:     pick("aadharNumber", "aadhar_number", "aadharNo", "aadhaarNumber", "aadhaar"),
            passportNo:       pick("passportNo", "passport_no", "passportNumber", "passport"),
            tanNumber:        pick("tanNumber", "tan_number", "tanNo", "tan"),
            gstinNo:          pick("gstinNo", "gstin_no", "gstin", "gstNumber"),
            unit:             pick("unit", "flatNo", "flat_no", "flatNumber", "propertyNumber"),
            role:             toRoleLabel(item) || toRoleLabel(fallback) || "Owner",
            status:           toStatusLabel(pick("status", "memberStatus")) ?? "Active",
            profilePicPath:   pick("profilePicPath", "profile_pic", "profilePic", "photo"),
        };
    };

    // ── Extract member object from backend response wrapper ──────────
    // Backend: axios res → res.data = { status:1, message:"...", data:{...member} }
    const extractMember = (res) => {
        const body = res?.data;           // axios unwraps HTTP body here
        if (!body) return null;
        // Most common: { status, message, data: { ...member } }
        if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
            return body.data;
        }
        // Body itself is the member object (no wrapper)
        if (body.firstName !== undefined || body.identifier !== undefined) {
            return body;
        }
        // Try other known wrapper keys
        for (const key of ["member", "result", "memberDetail", "details"]) {
            const c = body[key];
            if (c && typeof c === "object" && !Array.isArray(c)) return c;
        }
        return null;
    };

    
  const openEdit = async (r) => {
    console.log("Opening edit for:", r);

    
    setForm(normaliseItem(r, r));
    setModal("edit");
    setDetailLoading(true);

    try {
        if (!r?.identifier) {
            console.warn("No identifier found");
            return;
        }

        // Call detail API
        const res = await getMemberDetailApi(r.identifier);

        console.log("API RESPONSE:", res?.data);

        const memberData = res?.data;

        console.log("MEMBER DATA:", memberData);

        if (memberData) {
            setForm({
                ...memberData,

                // format dates for input[type=date]
                dateOfBirth:      toInputDate(memberData.dateOfBirth || ""),
                anniversary:      toInputDate(memberData.anniversary || ""),

                // Map all fields explicitly — handles any key name variation from backend
                identifier:       memberData.identifier       || memberData.memberIdentifier || "",
                firstName:        memberData.firstName        || memberData.first_name        || "",
                middleName:       memberData.middleName       || memberData.middle_name       || "",
                lastName:         memberData.lastName         || memberData.last_name         || "",
                age:              memberData.age              || "",
                phone:            memberData.phone            || memberData.phoneNo           || "",
                profilePicPath:   memberData.profilePicPath   || memberData.profilePic        || null,
                email:            memberData.email            || memberData.emailId           || "",
                alternateEmail:   memberData.alternateEmail   || memberData.alternate_email   || "",
                mobileNumber:     memberData.mobileNumber     || memberData.mobile            || "",
                gender:           memberData.gender           || "",
                aadharNumber:     memberData.aadharNumber     || memberData.aadhaarNumber     || memberData.aadharNo || "",
                address:          memberData.address          || memberData.residentialAddress || "",
                alternateAddress: memberData.alternateAddress || memberData.alternate_address  || "",
                alternatePhone:   memberData.alternatePhone   || memberData.altPhone          || "",
                panNo:            memberData.panNo            || memberData.pan_no            || memberData.pan     || "",
                tanNumber:        memberData.tanNumber        || memberData.tan_number        || memberData.tanNo   || "",
                passportNo:       memberData.passportNo       || memberData.passport_no       || memberData.passport || "",
                gstinNo:          memberData.gstinNo          || memberData.gstin_no          || memberData.gstin   || "",
                unit:             memberData.unit             || memberData.flatNo            || memberData.flat_no  || "",
                role:             memberData.role             || memberData.memberType        || memberData.member_type || "",
            });
        }
    } catch (err) {
        console.error("Detail API failed:", err?.message, "— using row data already loaded in table");
        // 404 or any error: modal is already open with row data from the table list.
        // No extra action needed — user can still edit and save with what's available.
    } finally {
        setDetailLoading(false);
    }
};
    const handleSave = async () => {
        // Auto-fill required fields with defaults instead of showing error
        const updatedForm = { ...form };
        if (!updatedForm.firstName || !updatedForm.firstName.trim()) {
            updatedForm.firstName = "Member";
        }
        if (!updatedForm.mobileNumber || !updatedForm.mobileNumber.trim()) {
            updatedForm.mobileNumber = "0000000000";
        }
        if (!updatedForm.lastName || !updatedForm.lastName.trim()) {
            updatedForm.lastName = "";
        }
        setSaving(true);
        try {
            if (modal === "add") {
                const payload = {
                    firstName:        updatedForm.firstName.trim(),
                    middleName:       (updatedForm.middleName || "").trim(),
                    lastName:         (updatedForm.lastName || "").trim(),
                    mobileNumber:     (updatedForm.mobileNumber || "").trim(),
                    email:            (updatedForm.email || "").trim(),
                    alternateEmail:   (updatedForm.alternateEmail || "").trim(),
                    phone:            (updatedForm.phone || "").trim(),
                    alternatePhone:   (updatedForm.alternatePhone || "").trim(),
                    dateOfBirth:      toBackendDate((updatedForm.dateOfBirth || "").trim()),
                    gender:           (updatedForm.gender || "").trim(),
                    age:              updatedForm.age || null,
                    address:          (updatedForm.address || "").trim(),
                    alternateAddress: (updatedForm.alternateAddress || "").trim(),
                    anniversary:      toBackendDate((updatedForm.anniversary || "").trim()),
                    panNo:            (updatedForm.panNo || "").trim(),
                    tanNumber:        (updatedForm.tanNumber || "").trim(),
                    passportNo:       (updatedForm.passportNo || "").trim(),
                    aadharNumber:     (updatedForm.aadharNumber || "").trim(),
                    gstinNo:          (updatedForm.gstinNo || "").trim(),
                };
                const addRes = await addMemberApi(payload);
                // Update local list immediately with response data (or payload as fallback)
                const newItem = extractMember(addRes);
                const newMember = normaliseItem(newItem || payload, payload);
                setMembers(prev => [...(prev || []), newMember]);
            } else {
                // ── Send ONLY the fields the backend expects (no extra junk) ──
                // Sending unknown/extra fields causes 500 on this backend.
                const payload = {
                    firstName:        (updatedForm.firstName || "").trim(),
                    middleName:       (updatedForm.middleName || "").trim(),
                    lastName:         (updatedForm.lastName || "").trim(),
                    mobileNumber:     (updatedForm.mobileNumber || "").trim(),
                    email:            (updatedForm.email || "").trim(),
                    alternateEmail:   (updatedForm.alternateEmail || "").trim(),
                    phone:            (updatedForm.phone || "").trim(),
                    alternatePhone:   (updatedForm.alternatePhone || "").trim(),
                    dateOfBirth:      toBackendDate((updatedForm.dateOfBirth || "").trim()),
                    gender:           (updatedForm.gender || "").trim(),
                    age:              (updatedForm.age || "").toString().trim(),
                    address:          (updatedForm.address || "").trim(),
                    alternateAddress: (updatedForm.alternateAddress || "").trim(),
                    anniversary:      toBackendDate((updatedForm.anniversary || "").trim()),
                    panNo:            (updatedForm.panNo || "").trim(),
                    tanNumber:        (updatedForm.tanNumber || "").trim(),
                    passportNo:       (updatedForm.passportNo || "").trim(),
                    aadharNumber:     (updatedForm.aadharNumber || "").trim(),
                    gstinNo:          (updatedForm.gstinNo || "").trim(),
                };
                const updateRes = await updateMemberApi(payload, updatedForm.identifier);

                // The update response contains full member data — use it to
                // refresh the local list so all fields show correctly next time edit opens.
                const updatedItem = extractMember(updateRes);
                const fullData = updatedItem
                    ? { ...updatedForm, ...updatedItem }
                    : updatedForm;
                const updatedMember = normaliseItem(fullData, updatedForm);
                setMembers(prev => (prev || []).map(m =>
                    (m.identifier === updatedForm.identifier) ? { ...m, ...updatedMember } : m
                ));
            }
            setModal(null);
            // Background refetch to stay in sync with server
            refetch().catch(() => {});
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Save failed";
            alert(msg);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (identifier) => {
        setDeleteConfirm(identifier);
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await deleteMemberApi(deleteConfirm);
            setDeleteConfirm(null);
            // Refresh AppContext after delete
            await refetch();
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Delete failed";
            alert(msg);
        }
    };

    const isSpinning = localRefreshing || ctxLoading;

    // ── Loading state ────────────────────────────────────────────
    if (ctxLoading && members.length === 0) return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 14 }}>
            <Loader size={28} style={{ color: "#00d4aa", animation: "spin 1s linear infinite" }}/>
            <span style={{ color: "#8899aa", fontSize: 14 }}>Loading members…</span>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div>
            {/* ── Toolbar ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ position: "relative" }}>
                        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }}/>
                        <input
                            placeholder="Search by name, phone or ID…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage4(1); }}
                            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px 8px 36px", color: "var(--text-primary)", fontSize: 13, width: 260, outline: "none" }}
                        />
                    </div>
                    <button onClick={handleRefresh} title="Refresh" style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "#8899aa", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <RefreshCw size={13} style={isSpinning ? { animation: "spin 1s linear infinite" } : {}}/>
                    </button>
                    <span style={{ color: "#8899aa", fontSize: 12 }}>{members.length.toLocaleString("en-IN")} total</span>
                </div>
                <button onClick={openAdd} style={{ background: "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 18px", color: "#0d1117", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Plus size={14}/> Add Member
                </button>
            </div>

            {/* ── Empty / No-API message ── */}
            {members.length === 0 && !ctxLoading && (
                <div style={{ textAlign: "center", padding: "48px 20px" }}>
                    <AlertCircle size={28} style={{ color: "#8899aa", marginBottom: 12 }}/>
                    <p style={{ color: "#8899aa", fontSize: 14, marginBottom: 8 }}>No members found.</p>
                    <p style={{ color: "#556677", fontSize: 12 }}>Make sure you are logged in and the society is selected.</p>
                    <button onClick={handleRefresh} style={{ marginTop: 16, background: "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "8px 18px", color: "#0d1117", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <RefreshCw size={13}/> Retry
                    </button>
                </div>
            )}

            {/* ── Table ── */}
            {members.length > 0 && (
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)" }}>
                            {["#", "Member Name", "Mobile Number", "Identifier", "Actions"].map(h => (
                                <th key={h} style={{ padding: "10px 14px", color: "#8899aa", fontSize: 12, fontWeight: 600, textAlign: "left" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paged4.map((r, idx) => {
                            const fullName = getFullName(r);
                            const cleanName = fullName.replace(/^(Mr\.|Mrs\.|Ms\.|Miss\.|Dr\.|Smt\.)\s*/i, "").trim();
                            const initials  = cleanName[0] || "?";
                            const rowNum    = (page4 - 1) * PER4 + idx + 1;
                            return (
                                <tr key={r.identifier || idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                    <td style={{ padding: "12px 14px", color: "#556677", fontSize: 12 }}>{rowNum}</td>
                                    <td style={{ padding: "12px 14px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#00d4aa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                                {initials.toUpperCase()}
                                            </div>
                                            <span style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: 13 }}>{fullName}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "12px 14px" }}>
                                        {r.mobileNumber ? (
                                            <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#8899aa", fontSize: 12 }}>
                                                <Phone size={11} style={{ color: "#00d4aa" }}/>
                                                {r.mobileNumber}
                                            </span>
                                        ) : <span style={{ color: "#556677", fontSize: 12 }}>—</span>}
                                    </td>
                                    <td style={{ padding: "12px 14px" }}>
                                        {r.identifier ? (
                                            <span style={{ background: "rgba(108,99,255,0.12)", color: "#6c63ff", borderRadius: 6, padding: "3px 8px", fontFamily: "monospace", fontSize: 11 }}>
                                                {r.identifier}
                                            </span>
                                        ) : <span style={{ color: "#556677", fontSize: 12 }}>—</span>}
                                    </td>
                                    <td style={{ padding: "12px 14px" }}>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button onClick={() => openEdit(r)} title="Edit" style={{ background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 6, padding: "6px 10px", color: "#6c63ff", cursor: "pointer" }}><Edit2 size={13}/></button>
                                            <button onClick={() => confirmDelete(r.identifier)} title="Delete" style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "6px 10px", color: "#ff6b6b", cursor: "pointer" }}><Trash2 size={13}/></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {paged4.length === 0 && members.length > 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: "40px 14px", textAlign: "center", color: "#556677", fontSize: 13 }}>
                                    No members match your search
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <Pagination page={page4} total={filtered.length} perPage={PER4} onChange={setPage4} />
            </div>
            )}

            {/* ── Add / Edit Modal ── */}
            {modal && (
                <Modal title={modal === "add" ? "Add Member" : "Edit Member"} onClose={() => !saving && !detailLoading && setModal(null)}>
                    {/* ── Loading overlay while fetching full detail ── */}
                     
                    {detailLoading && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(108,99,255,0.08)", borderRadius: 8, marginBottom: 16, border: "1px solid rgba(108,99,255,0.2)" }}>
                            <Loader size={14} style={{ color: "#6c63ff", animation: "spin 1s linear infinite" }}/>
                            <span style={{ color: "#6c63ff", fontSize: 12, fontWeight: 500 }}>Loading full member details…</span>
                        </div>
                    )}

                    {/* ── Identifier (read-only on edit) ── */}
                    {modal === "edit" && form.identifier && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Member Identifier</label>
                            <div style={{ background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 8, padding: "10px 12px", color: "#6c63ff", fontSize: 12, fontFamily: "monospace" }}>
                                {form.identifier}
                            </div>
                        </div>
                    )}

                    {/* ── Section: Basic Info ── */}
                    <div style={{ color: "#00d4aa", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, marginTop: 4 }}>Basic Info</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                        <FormField label="First Name" value={form.firstName || ""} onChange={v => setForm(f => ({ ...f, firstName: v }))} required/>
                        <FormField label="Middle Name" value={form.middleName || ""} onChange={v => setForm(f => ({ ...f, middleName: v }))}/>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                        <FormField label="Last Name" value={form.lastName || ""} onChange={v => setForm(f => ({ ...f, lastName: v }))}/>
                        <FormField label="Gender" value={form.gender || ""} onChange={v => setForm(f => ({ ...f, gender: v }))} options={["", "Male", "Female", "Other"]}/>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                        <FormField label="Date of Birth" value={form.dateOfBirth || ""} onChange={v => setForm(f => ({ ...f, dateOfBirth: v }))} type="date"/>
                        <FormField label="Age" value={form.age || ""} onChange={v => setForm(f => ({ ...f, age: v }))} type="number"/>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                        <FormField label="Anniversary" value={form.anniversary || ""} onChange={v => setForm(f => ({ ...f, anniversary: v }))} type="date"/>
                        <FormField label="Role / Member Type" value={form.role || ""} onChange={v => setForm(f => ({ ...f, role: v }))} options={["", "Owner", "Tenant", "Co-Owner", "Family Member", "Committee"]}/>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                        <FormField label="Unit / Flat No" value={form.unit || ""} onChange={v => setForm(f => ({ ...f, unit: v }))}/>
                        <FormField label="Status" value={form.status || ""} onChange={v => setForm(f => ({ ...f, status: v }))} options={["", "Active", "Inactive"]}/>
                    </div>

                    {/* ── Section: Contact ── */}
                    <div style={{ color: "#00d4aa", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, marginTop: 8 }}>Contact</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                        <FormField label="Mobile Number" value={form.mobileNumber || ""} onChange={v => setForm(f => ({ ...f, mobileNumber: v }))} type="tel" required/>
                        <FormField label="Phone" value={form.phone || ""} onChange={v => setForm(f => ({ ...f, phone: v }))} type="tel"/>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                        <FormField label="Email" value={form.email || ""} onChange={v => setForm(f => ({ ...f, email: v }))} type="email"/>
                        <FormField label="Alternate Email" value={form.alternateEmail || ""} onChange={v => setForm(f => ({ ...f, alternateEmail: v }))} type="email"/>
                    </div>
                    <FormField label="Alternate Phone" value={form.alternatePhone || ""} onChange={v => setForm(f => ({ ...f, alternatePhone: v }))} type="tel"/>

                    {/* ── Section: Address ── */}
                    <div style={{ color: "#00d4aa", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, marginTop: 8 }}>Address</div>
                    <FormField label="Address" value={form.address || ""} onChange={v => setForm(f => ({ ...f, address: v }))}/>
                    <FormField label="Alternate Address" value={form.alternateAddress || ""} onChange={v => setForm(f => ({ ...f, alternateAddress: v }))}/>

                    {/* ── Section: Documents ── */}
                    <div style={{ color: "#00d4aa", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, marginTop: 8 }}>Documents</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                        <FormField label="PAN No" value={form.panNo || ""} onChange={v => setForm(f => ({ ...f, panNo: v }))}/>
                        <FormField label="Aadhar Number" value={form.aadharNumber || ""} onChange={v => setForm(f => ({ ...f, aadharNumber: v }))}/>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                        <FormField label="Passport No" value={form.passportNo || ""} onChange={v => setForm(f => ({ ...f, passportNo: v }))}/>
                        <FormField label="TAN Number" value={form.tanNumber || ""} onChange={v => setForm(f => ({ ...f, tanNumber: v }))}/>
                    </div>
                    <FormField label="GSTIN No" value={form.gstinNo || ""} onChange={v => setForm(f => ({ ...f, gstinNo: v }))}/>

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                        <button onClick={() => setModal(null)} disabled={saving || detailLoading} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: (saving || detailLoading) ? "not-allowed" : "pointer" }}>Cancel</button>
                        <button onClick={handleSave} disabled={saving || detailLoading} style={{ background: "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 18px", color: "#0d1117", fontWeight: 700, cursor: (saving || detailLoading) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: (saving || detailLoading) ? 0.7 : 1 }}>
                            {saving ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }}/> : <Save size={13}/>}
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </div>
                </Modal>
            )}

            {/* ── Delete Confirmation Modal ── */}
            {deleteConfirm && (
                <Modal title="Confirm Delete" onClose={() => setDeleteConfirm(null)}>
                    <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
                        <Trash2 size={40} style={{ color: "#ff6b6b", marginBottom: 12 }}/>
                        <p style={{ color: "var(--text-primary)", fontSize: 15, marginBottom: 6 }}>Delete this member?</p>
                        <p style={{ color: "#8899aa", fontSize: 12 }}>Identifier: <span style={{ fontFamily: "monospace", color: "#6c63ff" }}>{deleteConfirm}</span></p>
                        <p style={{ color: "#8899aa", fontSize: 12, marginTop: 6 }}>This action cannot be undone.</p>
                    </div>
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button onClick={() => setDeleteConfirm(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer" }}>Cancel</button>
                        <button onClick={handleDelete} style={{ background: "linear-gradient(135deg,#ff6b6b,#e74c3c)", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                            <Trash2 size={13}/> Delete
                        </button>
                    </div>
                </Modal>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
// ── Section: Vendor Master ───────────────────────────────────────────
// function VendorMaster() {
//     const { vendors: ctxVendors } = useAppContext();
//     const [data, setData] = useState(null);
//     const activeData = data || ctxVendors;
//     const [search, setSearch] = useState("");
//     const [modal, setModal] = useState(null);
//     const [form, setForm] = useState({});
//     const filtered = activeData.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
//     const [page5, setPage5] = useState(1);
//     const PER5 = 8;
//     const paged5 = filtered.slice((page5-1)*PER5, page5*PER5);
//     const StarRating = ({ rating }) => (<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//       {[1, 2, 3, 4, 5].map(i => (<span key={i} style={{ color: i <= Math.round(rating) ? "#ffb347" : "#2a3448", fontSize: 13 }}>★</span>))}
//       <span style={{ color: "#8899aa", fontSize: 12, marginLeft: 2 }}>{rating}</span>
//     </div>);
//     return (<div>
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
//         <div style={{ position: "relative" }}>
//           <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }}/>
//           <input placeholder="Search vendors..." value={search} onChange={e => { setSearch(e.target.value); setPage5(1); }} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px 8px 36px", color: "var(--text-primary)", fontSize: 13, width: 240, outline: "none" }}/>
//         </div>
//         <button onClick={() => { setForm({ name: "", category: "Housekeeping", contact: "", email: "", rating: 4.0, status: "Active" }); setModal(true); }} style={{ background: "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 18px", color: "#0d1117", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
//           <Plus size={14}/> Add Vendor
//         </button>
//       </div>
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 16 }}>
//         {paged5.map(v => (<div key={v.id} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
//               <div>
//                 <div style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: 2 }}>{v.name}</div>
//                 <span style={{ background: "rgba(108,99,255,0.12)", color: "#6c63ff", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{v.category}</span>
//               </div>
//               <StatusBadge status={v.status}/>
//             </div>
//             <div style={{ marginBottom: 12 }}>
//               <StarRating rating={v.rating}/>
//             </div>
//             <div style={{ color: "#8899aa", fontSize: 12, marginBottom: 4 }}>
//               <Phone size={11} style={{ marginRight: 5, verticalAlign: "middle" }}/>{v.contact}
//             </div>
//             <div style={{ color: "#8899aa", fontSize: 12, marginBottom: 14 }}>
//               <Mail size={11} style={{ marginRight: 5, verticalAlign: "middle" }}/>{v.email}
//             </div>
//             <div style={{ display: "flex", gap: 8 }}>
//               <button onClick={() => { setForm(Object.assign({}, v)); setModal("edit"); }} style={{ flex: 1, background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 8, padding: "8px", color: "#6c63ff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
//                 <Edit2 size={12}/> Edit
//               </button>
//               <button onClick={() => setData(d => d.filter(x => x.id !== v.id))} style={{ flex: 1, background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 8, padding: "8px", color: "#ff6b6b", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
//                 <Trash2 size={12}/> Delete
//               </button>
//             </div>
//           </div>))}
//       </div>
//       <Pagination page={page5} total={filtered.length} perPage={PER5} onChange={setPage5} />
//       {modal && (<Modal title={form.id ? "Edit Vendor" : "Add Vendor"} onClose={() => setModal(null)}>
//           <FormField label="Vendor Name" value={form.name || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { name: v })))} required/>
//           <FormField label="Category" value={form.category || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { category: v })))} options={["Housekeeping", "Electrical", "Plumbing", "Security", "Lifts", "HVAC", "Landscaping", "Others"]}/>
//           <FormField label="Contact" value={form.contact || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { contact: v })))}/>
//           <FormField label="Email" value={form.email || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { email: v })))} type="email"/>
//           <FormField label="Status" value={form.status || "Active"} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { status: v })))} options={["Active", "Inactive"]}/>
//           <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
//             <button onClick={() => setModal(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer" }}>Cancel</button>
//             <button onClick={() => { if (form.id)
//             setData(d => d.map(r => r.id === form.id ? Object.assign({}, form) : r));
//         else
//             setData(d => [...d, Object.assign(Object.assign({}, form), { id: Date.now(), rating: 4.0 })]); setModal(null); }} style={{ background: "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 18px", color: "#0d1117", fontWeight: 700, cursor: "pointer" }}>Save</button>
//           </div>
//         </Modal>)}
//     </div>);
// }
// ── Section: Terms & Conditions ──────────────────────────────────────
// function TermsConditions() {
//     const [data, setData] = useState(initialTerms);
//     const activeData = data;
//     const [modal, setModal] = useState(null);
//     const [form, setForm] = useState({});
//     const [expanded, setExpanded] = useState(null);
//     return (<div>
//       <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
//         <button onClick={() => { setForm({ title: "", category: "Finance", content: "", status: "Active" }); setModal(true); }} style={{ background: "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 18px", color: "#0d1117", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
//           <Plus size={14}/> Add Term
//         </button>
//       </div>
//       <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
//         {activeData.map((t, i) => (<div key={t.id} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
//             <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
//               <div style={{ width: 32, height: 32, background: "rgba(0,212,170,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
//                 <FileText size={14} style={{ color: "#00d4aa" }}/>
//               </div>
//               <div style={{ flex: 1 }}>
//                 <div style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: 2 }}>{t.title}</div>
//                 <span style={{ background: "rgba(108,99,255,0.12)", color: "#6c63ff", borderRadius: 20, padding: "2px 8px", fontSize: 11 }}>{t.category}</span>
//               </div>
//               <StatusBadge status={t.status}/>
//               <div style={{ display: "flex", gap: 6 }}>
//                 <button onClick={e => { e.stopPropagation(); setForm(Object.assign({}, t)); setModal("edit"); }} style={{ background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#6c63ff", cursor: "pointer" }}><Edit2 size={12}/></button>
//                 <button onClick={e => { e.stopPropagation(); setData(d => d.filter(x => x.id !== t.id)); }} style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#ff6b6b", cursor: "pointer" }}><Trash2 size={12}/></button>
//               </div>
//               {expanded === t.id ? <ChevronUp size={16} style={{ color: "#8899aa" }}/> : <ChevronDown size={16} style={{ color: "#8899aa" }}/>}
//             </div>
//             {expanded === t.id && (<div style={{ padding: "0 20px 16px 64px", color: "#8899aa", fontSize: 13, lineHeight: 1.6, borderTop: "1px solid var(--border)" }}>
//                 <div style={{ paddingTop: 12 }}>{t.content}</div>
//               </div>)}
//           </div>))}
//       </div>
//       {modal && (<Modal title={form.id ? "Edit Term" : "Add Term"} onClose={() => setModal(null)}>
//           <FormField label="Title" value={form.title || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { title: v })))} required/>
//           <FormField label="Category" value={form.category || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { category: v })))} options={["Finance", "Conduct", "Parking", "Security", "Maintenance", "General"]}/>
//           <div style={{ marginBottom: 16 }}>
//             <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Content</label>
//             <textarea value={form.content || ""} onChange={e => setForm(f => (Object.assign(Object.assign({}, f), { content: e.target.value })))} rows={4} style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit" }}/>
//           </div>
//           <FormField label="Status" value={form.status || "Active"} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { status: v })))} options={["Active", "Inactive"]}/>
//           <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
//             <button onClick={() => setModal(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer" }}>Cancel</button>
//             <button onClick={() => { if (form.id)
//             setData(d => d.map(r => r.id === form.id ? Object.assign({}, form) : r));
//         else
//             setData(d => [...d, Object.assign(Object.assign({}, form), { id: Date.now() })]); setModal(null); }} style={{ background: "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 18px", color: "#0d1117", fontWeight: 700, cursor: "pointer" }}>Save</button>
//           </div>
//         </Modal>)}
//     </div>);
// }
// ── Section: Permissions ─────────────────────────────────────────────
function Permissions({ subTab }) {
    const [mobilePerms, setMobilePerms] = useState(initialMobilePerms);
    const [users, setUsers] = useState(initialUsers);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({});
    const togglePerm = (i, field) => {
        setMobilePerms(p => p.map((item, idx) => idx === i ? Object.assign(Object.assign({}, item), { [field]: !item[field] }) : item));
    };
    if (subTab === "mobile")
        return (<div>
      <div style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.15)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <AlertCircle size={14} style={{ color: "#00d4aa" }}/>
        <span style={{ color: "#8899aa", fontSize: 13 }}>Control what features are accessible to residents and committee members in the mobile app.</span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "10px 14px", color: "#8899aa", fontSize: 12, fontWeight: 600, textAlign: "left" }}>Feature</th>
            <th style={{ padding: "10px 14px", color: "#8899aa", fontSize: 12, fontWeight: 600, textAlign: "center" }}>Residents</th>
            <th style={{ padding: "10px 14px", color: "#8899aa", fontSize: 12, fontWeight: 600, textAlign: "center" }}>Committee</th>
          </tr>
        </thead>
        <tbody>
          {mobilePerms.map((p, i) => (<tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <td style={{ padding: "12px 14px", color: "var(--text-primary)" }}>{p.feature}</td>
              <td style={{ padding: "12px 14px", textAlign: "center" }}><Toggle checked={p.residents} onChange={() => togglePerm(i, "residents")}/></td>
              <td style={{ padding: "12px 14px", textAlign: "center" }}><Toggle checked={p.committee} onChange={() => togglePerm(i, "committee")}/></td>
            </tr>))}
        </tbody>
      </table>
    </div>);
    return (<div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button onClick={() => { setForm({ name: "", email: "", role: "Manager", status: "Active" }); setModal(true); }} style={{ background: "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 18px", color: "#0d1117", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14}/> Add User
        </button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["User", "Email", "Role", "Status", "Last Login", "Actions"].map(h => (<th key={h} style={{ padding: "10px 14px", color: "#8899aa", fontSize: 12, fontWeight: 600, textAlign: "left" }}>{h}</th>))}
          </tr>
        </thead>
        <tbody>
          {users.map(u => (<tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <td style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#00d4aa,#6c63ff)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>{u.name[0]}</div>
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{u.name}</span>
                </div>
              </td>
              <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{u.email}</td>
              <td style={{ padding: "12px 14px" }}>
                <span style={{ background: "rgba(255,179,71,0.12)", color: "#ffb347", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{u.role}</span>
              </td>
              <td style={{ padding: "12px 14px" }}><StatusBadge status={u.status}/></td>
              <td style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12 }}>{u.lastLogin}</td>
              <td style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setForm(Object.assign({}, u)); setModal("edit"); }} style={{ background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 6, padding: "6px 10px", color: "#6c63ff", cursor: "pointer" }}><Edit2 size={13}/></button>
                  <button onClick={() => setUsers(d => d.filter(x => x.id !== u.id))} style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 6, padding: "6px 10px", color: "#ff6b6b", cursor: "pointer" }}><Trash2 size={13}/></button>
                </div>
              </td>
            </tr>))}
        </tbody>
      </table>
      {modal && (<Modal title={form.id ? "Edit User" : "Add User"} onClose={() => setModal(null)}>
          <FormField label="Full Name" value={form.name || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { name: v })))} required/>
          <FormField label="Email" value={form.email || ""} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { email: v })))} type="email" required/>
          <FormField label="Role" value={form.role || "Manager"} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { role: v })))} options={["Super Admin", "Manager", "Accountant", "Security", "Viewer"]}/>
          <FormField label="Status" value={form.status || "Active"} onChange={v => setForm(f => (Object.assign(Object.assign({}, f), { status: v })))} options={["Active", "Inactive"]}/>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setModal(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer" }}>Cancel</button>
            <button onClick={() => { if (form.id)
            setUsers(d => d.map(r => r.id === form.id ? Object.assign({}, form) : r));
        else
            setUsers(d => [...d, Object.assign(Object.assign({}, form), { id: Date.now(), lastLogin: "Never" })]); setModal(null); }} style={{ background: "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 18px", color: "#0d1117", fontWeight: 700, cursor: "pointer" }}>Save</button>
          </div>
        </Modal>)}
    </div>);
}
// ── Main Masters Dashboard ───────────────────────────────────────────
const masterItems = [
    { id: "tower", label: "Block Master", icon: Building, color: "#00d4aa" },
    { id: "society", label: "Society Master", icon: Building2, color: "#6c63ff" },
    { id: "wing", label: "Tower Master", icon: Layers, color: "#00b4d8" },
    { id: "property", label: "Flat Master", icon: Home, color: "#ffb347" },
    { id: "member", label: "Member Master", icon: UserCheck, color: "#ff6b6b" },
    { id: "committee", label: "Committee Master", icon: Users, color: "#6c63ff" },
     { id: "charge", label: "Charge Master", icon: DollarSign, color: "#ff6b6b" },
    { id: "vendor", label: "Vendor Master", icon: Store, color: "#00d4aa" },
    { id: "terms", label: "Terms & Conditions", icon: FileText, color: "#6c63ff" },
    { id: "permissions", label: "Permissions", icon: Shield, color: "#ffb347" }
   
];
const sectionTitles = {
    tower: "Block Master", society: "Society Master", wing: "Tower Master",
    property: "Flat Master", member: "Member Master", vendor: "Vendor Master",
    terms: "Terms & Conditions", permissions: "Permissions", charge: "Charge Master", committee: "Committee Master"
};
export default function MastersDashboard() {
    const [active, setActive] = useState("tower");
    const [permSubTab, setPermSubTab] = useState("mobile");
    const renderSection = () => {
        switch (active) {
            case "tower": return <TowerMaster />;
            case "society": return <SocietyDashboard />;
            case "wing": return <WingMaster />;
            case "property": return <PropertyDashboard />;
            case "member": return <MemberMaster />;
            case "vendor": return <VendorMaster />;
            case "terms": return <TermsConditions />;
            case "charge": return <ChargeMasterDashboard />;
            case "committee": return <CommitteeDashboard />;
            case "permissions": return (<div>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {[{ id: "mobile", label: "Mobile App", icon: Smartphone }, { id: "user", label: "Users", icon: User }].map(t => (<button key={t.id} onClick={() => setPermSubTab(t.id)} style={{
                        background: permSubTab === t.id ? "rgba(0,212,170,0.12)" : "none",
                        border: `1px solid ${permSubTab === t.id ? "#00d4aa" : "var(--border)"}`,
                        borderRadius: 8, padding: "8px 16px", color: permSubTab === t.id ? "#00d4aa" : "#8899aa",
                        cursor: "pointer", fontWeight: 500, fontSize: 13, display: "flex", alignItems: "center", gap: 6
                    }}>
                <t.icon size={13}/>{t.label}
              </button>))}
          </div>
          <Permissions subTab={permSubTab}/>
        </div>);
            default: return null;
        }
    };
    return (<div className="dashboard" style={{ display: "flex", flexDirection: "row", gap: 0, padding: 0 }}>
      {/* Left Sidebar */}
      <div style={{
            width: 220, minWidth: 220, background: "var(--bg-card)", borderRight: "1px solid var(--border)",
            padding: "24px 12px", display: "flex", flexDirection: "column", gap: 4
        }}>
        <p style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", padding: "0 8px", marginBottom: 8 }}>MASTERS</p>
        {masterItems.map(item => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (<button key={item.id} onClick={() => setActive(item.id)} style={{
                    background: isActive ? `${item.color}14` : "none",
                    border: isActive ? `1px solid ${item.color}30` : "1px solid transparent",
                    borderRadius: 10, padding: "10px 12px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10, textAlign: "left", width: "100%",
                    transition: "all 0.15s"
                }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: isActive ? `${item.color}20` : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={14} style={{ color: isActive ? item.color : "#8899aa" }}/>
              </div>
              <span style={{ color: isActive ? item.color : "#8899aa", fontSize: 13, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
              {isActive && <ChevronRight size={12} style={{ color: item.color, marginLeft: "auto" }}/>}
            </button>);
        })}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 28, overflowY: "auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{sectionTitles[active]}</h2>
          <p style={{ color: "#8899aa", fontSize: 13 }}>Manage and configure {sectionTitles[active].toLowerCase()} settings</p>
        </div>
        {renderSection()}
      </div>
    </div>);
}
