// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../AppContext";
import {
    Plus, Search, Edit2, Trash2, X, Save, Phone, Mail,
    ChevronLeft, ChevronsLeft, ChevronRight, ChevronsRight, Minus,
} from "lucide-react";
import { addNewVendorApi, updateVendorApi, deleteVendorApi } from "api/vendor-api";
import { getAllSocietyApi } from "api/society-api";
import { getComplaintCategoriesApi } from "api/complaint-api";


const safeText = (val) => {
    if (val === null || val === undefined) return "-";
    if (typeof val === "object") {
        return val.name || val.label || val.societyName || val.categoryName || "-";
    }
    return String(val);
};

const cleanValue = (v) => (v === null || v === undefined ? "" : String(v));

const safeId = (val) => {
    if (val === null || val === undefined) return "";
    if (typeof val === "object") return val.id || val.societyIdentifier || "";
    return String(val);
};


const StatusBadge = ({ status }) => {
    const statusStr = safeText(status);
    const map = {
        Active: { bg: "rgba(0,212,170,0.15)", color: "#00d4aa" },
        Inactive: { bg: "rgba(255,107,107,0.15)", color: "#ff6b6b" },
    };
    const s = map[statusStr] || { bg: "rgba(136,153,170,0.15)", color: "#8899aa" };
    return (
        <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}>
            {statusStr || "Inactive"}
        </span>
    );
};


const Modal = ({ title, onClose, children }) => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 900, maxHeight: "85vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600 }}>{title}</h3>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}>
                    <X size={18} />
                </button>
            </div>
            <div style={{ padding: 24 }}>{children}</div>
        </div>
    </div>
);


const FormField = ({ label, value, onChange, type = "text", required }) => (
    <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
            {label}{required && <span style={{ color: "#ff6b6b" }}> *</span>}
        </label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
        />
    </div>
);


const navBtnStyle = (disabled) => ({
    background: "none", border: "1px solid var(--border)", borderRadius: 6,
    padding: "4px 8px", color: disabled ? "#556677" : "#8899aa",
    cursor: disabled ? "not-allowed" : "pointer"
});

const Pagination = ({ page, total, perPage, onChange }) => {
    const pages = Math.max(1, Math.ceil(total / perPage));
    const visiblePages = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) visiblePages.push(i);

    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", borderTop: "1px solid var(--border)", marginTop: 16 }}>
            <span style={{ color: "#8899aa", fontSize: 12 }}>
                Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {Number(total).toLocaleString("en-IN")}
            </span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button onClick={() => onChange(1)} disabled={page === 1} style={navBtnStyle(page === 1)}><ChevronsLeft size={12} /></button>
                <button onClick={() => onChange(page - 1)} disabled={page === 1} style={navBtnStyle(page === 1)}><ChevronLeft size={12} /></button>
                {visiblePages.map((p) => (
                    <button key={p} onClick={() => onChange(p)} style={{ background: p === page ? "#00d4aa" : "none", border: `1px solid ${p === page ? "#00d4aa" : "var(--border)"}`, borderRadius: 6, padding: "4px 10px", color: p === page ? "#000" : "#8899aa", fontWeight: p === page ? 700 : 400, cursor: "pointer", fontSize: 12, minWidth: 30 }}>
                        {p}
                    </button>
                ))}
                <button onClick={() => onChange(page + 1)} disabled={page === pages} style={navBtnStyle(page === pages)}><ChevronRight size={12} /></button>
                <button onClick={() => onChange(pages)} disabled={page === pages} style={navBtnStyle(page === pages)}><ChevronsRight size={12} /></button>
            </div>
        </div>
    );
};


const emptyForm = () => ({
    vendorName: "", vendorAddress: "", gsting: "", pan: "", product: "",
    serviceType: "", frequency: "", contactPersonName: "", contactPersonNumber: "",
    contactValue: "", contractStartDate: "", contractEndDate: "",
    totalPeriodCalculation: 1, bankName: "", branchName: "", ifsc: "",
    accountNumber: "", aadharNumber: "", complaintCategoryId: "",
    societyRows: [{ societyIdentifier: "" }],
});

const btnStyle = (color, bg) => ({
    flex: 1, background: bg, border: "none", borderRadius: 8, padding: "8px",
    color, cursor: "pointer", fontSize: 12, display: "flex",
    alignItems: "center", justifyContent: "center", gap: 4,
});


export default function VendorMaster() {
    const { vendors: ctxVendors } = useAppContext();
    const [data, setData] = useState(null);
    const activeData = data || ctxVendors || [];
    const [search, setSearch] = useState("");
    const [modal, setModal] = useState(null);
    const [page, setPage] = useState(1);
    const [saving, setSaving] = useState(false);
    const [societies, setSocieties] = useState([]);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState(emptyForm());
    const PER = 8;

    useEffect(() => {
        (async () => {
            try {
                const [socRes, catRes] = await Promise.all([getAllSocietyApi(), getComplaintCategoriesApi()]);
                setSocieties(socRes?.data?.data || []);
                setCategories(catRes?.data?.data || []);
            } catch (err) {
                console.error(err);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return activeData.filter((r) => cleanValue(r.vendorName).toLowerCase().includes(q));
    }, [activeData, search]);

    const paged = filtered.slice((page - 1) * PER, page * PER);

    const openAdd = () => { setForm(emptyForm()); setModal("add"); };

    const openEdit = (v) => {
        const existingSocieties = Array.isArray(v?.societies) ? v.societies : [];
        setForm({
            vendorName: cleanValue(v?.vendorName),
            vendorAddress: cleanValue(v?.vendorAddress),
            // gsting: cleanValue(v?.gsting),
            pan: cleanValue(v?.pan),
            gsting: cleanValue(v?.gsting) || cleanValue(v?.gstin) || cleanValue(v?.gstNumber) || "",
            product: cleanValue(v?.product) || cleanValue(v?.productName) || "",
            // product: cleanValue(v?.product),
            serviceType: cleanValue(v?.serviceType),
            frequency: cleanValue(v?.frequency),
            contactPersonName: cleanValue(v?.contactPersonName),
            contactPersonNumber: cleanValue(v?.contactPersonNumber),
            contactValue: cleanValue(v?.contactValue),
            contractStartDate: cleanValue(v?.contractStartDate),
            contractEndDate: cleanValue(v?.contractEndDate),
            totalPeriodCalculation: v?.totalPeriodCalculation || 1,
            bankName: cleanValue(v?.bankName),
            branchName: cleanValue(v?.branchName),
            ifsc: cleanValue(v?.ifsc),
            accountNumber: cleanValue(v?.accountNumber),
            aadharNumber: cleanValue(v?.aadharNumber),
            complaintCategoryId: safeId(v?.complaintCategoryId) || safeId(v?.complaintCategory),
            societyRows: existingSocieties.length
                ? existingSocieties.map((sid) => ({ societyIdentifier: safeId(sid) }))
                : [{ societyIdentifier: "" }],
            id: v?.id,
            vendorIdentifier: v?.vendorIdentifier,
        });
        setModal("edit");
    };

    const handleDelete = (id) => {
        try {
            deleteVendorApi(id);
            setData((d) => (d || ctxVendors || []).filter((r) => r.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const updateSocietyRow = (index, value) => {
        setForm((f) => {
            const rows = [...f.societyRows];
            rows[index] = { ...rows[index], societyIdentifier: value };
            return { ...f, societyRows: rows };
        });
    };

    const addSocietyRow = () => setForm((f) => ({ ...f, societyRows: [...f.societyRows, { societyIdentifier: "" }] }));

    const removeSocietyRow = (index) => {
        setForm((f) => {
            const rows = f.societyRows.filter((_, i) => i !== index);
            return { ...f, societyRows: rows.length ? rows : [{ societyIdentifier: "" }] };
        });
    };

    const handleSave = async () => {
        // ADD - full payload
        const addPayload = {
            vendorName: form.vendorName,
            vendorAddress: form.vendorAddress,
            gsting: form.gsting,
            pan: form.pan,
            product: form.product,
            serviceType: form.serviceType,
            frequency: form.frequency,
            contactPersonName: form.contactPersonName,
            contactPersonNumber: form.contactPersonNumber,
            contactValue: form.contactValue,
            contractStartDate: form.contractStartDate,
            contractEndDate: form.contractEndDate,
            totalPeriodCalculation: Number(form.totalPeriodCalculation) || 1,
            bankName: form.bankName,
            branchName: form.branchName,
            ifsc: form.ifsc,
            accountNumber: form.accountNumber,
            aadharNumber: form.aadharNumber,
            complaintCategoryId: form.complaintCategoryId,
            societies: form.societyRows.map((r) => r.societyIdentifier).filter(Boolean),
        };

        // EDIT - only these 6 fields as per Postman
        const editPayload = {
            vendorName: form.vendorName,
            vendorAddress: form.vendorAddress,
            contactPersonName: form.contactPersonName,
            contactPersonNumber: form.contactPersonNumber,
            contactValue: form.contactValue,
            societies: form.societyRows.map((r) => r.societyIdentifier).filter(Boolean),
        };

        try {
            setSaving(true);
            let res;
            if (modal === "add") {
                res = await addNewVendorApi(addPayload);
            } else {
                res = await updateVendorApi(editPayload, form.vendorIdentifier);
            }
            const newVendor = res?.data?.data || res?.data || {
                ...(modal === "add" ? addPayload : editPayload),
                id: form.id || Date.now(),
                vendorIdentifier: form.vendorIdentifier || String(Date.now()),
                status: "Active"
            };
            if (modal === "add") setData((d) => [newVendor, ...(d || ctxVendors || [])]);
            else setData((d) => (d || ctxVendors || []).map((r) => (r.id === form.id ? { ...r, ...newVendor } : r)));
            setModal(null);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const getSocietyName = (sid) => {
        const id = safeId(sid);
        return societies.find((s) => s.societyIdentifier === id)?.societyName || id || "-";
    };

    const getSocietiesArray = (v) => {
        if (!Array.isArray(v.societies)) return [];
        return v.societies.map((sid) => safeId(sid)).filter(Boolean);
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12 }}>
                <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
                    <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }} />
                    <input
                        placeholder="Search vendors..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px 8px 36px", color: "var(--text-primary)", fontSize: 13, width: "100%", outline: "none" }}
                    />
                </div>
                <button onClick={openAdd} style={{ background: "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 18px", color: "#0d1117", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Plus size={14} /> Add Vendor
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))", gap: 16 }}>
                {paged.map((v) => (
                    <div key={v.id || v.vendorIdentifier} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <div>
                                <div style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: 4 }}>{safeText(v.vendorName)}</div>
                                <span style={{ background: "rgba(108,99,255,0.12)", color: "#6c63ff", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                                    {safeText(v.product) !== "-" ? safeText(v.product) : "Vendor"}
                                </span>
                            </div>
                            <StatusBadge status={v.status} />
                        </div>

                        <div style={{ color: "#8899aa", fontSize: 12, lineHeight: 1.7, marginBottom: 14 }}>
                            <div><Phone size={11} style={{ marginRight: 5, verticalAlign: "middle" }} />{safeText(v.contactPersonNumber)}</div>
                            <div><Mail size={11} style={{ marginRight: 5, verticalAlign: "middle" }} />{safeText(v.contactPersonName)}</div>
                            <div>Service: {safeText(v.serviceType)}</div>
                            <div>Frequency: {safeText(v.frequency)}</div>
                            <div>Address: {safeText(v.vendorAddress)}</div>
                            <div>Category: {safeText(v.complaintCategory)}</div>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                            {getSocietiesArray(v).map((sid) => (
                                <span key={sid} style={{ background: "rgba(0,212,170,0.12)", color: "#00d4aa", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                                    {getSocietyName(sid)}
                                </span>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => openEdit(v)} style={btnStyle("#6c63ff", "rgba(108,99,255,0.12)")}>
                                <Edit2 size={12} /> Edit
                            </button>
                            <button onClick={() => handleDelete(v.id)} style={btnStyle("#ff6b6b", "rgba(255,107,107,0.12)")}>
                                <Trash2 size={12} /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />

            {modal && (
                <Modal title={modal === "add" ? "Add Vendor" : "Edit Vendor"} onClose={() => setModal(null)}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                        <FormField label="Vendor Name" value={form.vendorName} onChange={(v) => setForm((f) => ({ ...f, vendorName: v }))} />
                        <FormField label="Vendor Address" value={form.vendorAddress} onChange={(v) => setForm((f) => ({ ...f, vendorAddress: v }))} />
                        <FormField label="GSTIN" value={form.gsting} onChange={(v) => setForm((f) => ({ ...f, gsting: v }))} />
                        <FormField label="PAN" value={form.pan} onChange={(v) => setForm((f) => ({ ...f, pan: v }))} />
                        <FormField label="Product" value={form.product} onChange={(v) => setForm((f) => ({ ...f, product: v }))} />
                        <FormField label="Service Type" value={form.serviceType} onChange={(v) => setForm((f) => ({ ...f, serviceType: v }))} />
                        <FormField label="Frequency" value={form.frequency} onChange={(v) => setForm((f) => ({ ...f, frequency: v }))} />
                        <FormField label="Contact Person Name" value={form.contactPersonName} onChange={(v) => setForm((f) => ({ ...f, contactPersonName: v }))} />
                        <FormField label="Contact Person Number" value={form.contactPersonNumber} onChange={(v) => setForm((f) => ({ ...f, contactPersonNumber: v }))} />
                        <FormField label="Contact Value" value={form.contactValue} onChange={(v) => setForm((f) => ({ ...f, contactValue: v }))} />
                        <FormField label="Contract Start Date" type="date" value={form.contractStartDate} onChange={(v) => setForm((f) => ({ ...f, contractStartDate: v }))} />
                        <FormField label="Contract End Date" type="date" value={form.contractEndDate} onChange={(v) => setForm((f) => ({ ...f, contractEndDate: v }))} />
                        <FormField label="Total Period Calculation" type="number" value={form.totalPeriodCalculation} onChange={(v) => setForm((f) => ({ ...f, totalPeriodCalculation: v }))} />
                        <FormField label="Bank Name" value={form.bankName} onChange={(v) => setForm((f) => ({ ...f, bankName: v }))} />
                        <FormField label="Branch Name" value={form.branchName} onChange={(v) => setForm((f) => ({ ...f, branchName: v }))} />
                        <FormField label="IFSC" value={form.ifsc} onChange={(v) => setForm((f) => ({ ...f, ifsc: v }))} />
                        <FormField label="Account Number" value={form.accountNumber} onChange={(v) => setForm((f) => ({ ...f, accountNumber: v }))} />
                        <FormField label="Aadhar Number" value={form.aadharNumber} onChange={(v) => setForm((f) => ({ ...f, aadharNumber: v }))} />
                        <div>
                            <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Complaint Category</label>
                            <select
                                value={form.complaintCategoryId}
                                onChange={(e) => setForm((f) => ({ ...f, complaintCategoryId: e.target.value }))}
                                style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                            >
                                <option value="">Select complaint category</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: 18 }}>
                        <div style={{ color: "#8899aa", fontSize: 12, marginBottom: 10, fontWeight: 500 }}>Societies</div>
                        {form.societyRows.map((row, index) => (
                            <div key={index} style={{ marginBottom: 14 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                    <span style={{ color: "#8899aa", fontSize: 12, fontWeight: 600 }}>Society {index + 1}</span>
                                    {form.societyRows.length > 1 && (
                                        <button type="button" onClick={() => removeSocietyRow(index)} style={{ border: "none", background: "rgba(255,107,107,0.12)", color: "#ff6b6b", borderRadius: 6, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                                            <Minus size={12} /> Remove
                                        </button>
                                    )}
                                </div>
                                <select
                                    value={row.societyIdentifier}
                                    onChange={(e) => updateSocietyRow(index, e.target.value)}
                                    style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                                >
                                    <option value="">Select society</option>
                                    {societies.map((s) => (
                                        <option key={s.societyIdentifier} value={s.societyIdentifier}>
                                            {s.societyName}
                                        </option>
                                    ))}
                                </select>
                                <button type="button" onClick={addSocietyRow} style={{ marginTop: 8, border: "none", background: "none", color: "#00d4aa", cursor: "pointer", fontSize: 13, padding: 0, fontWeight: 600 }}>
                                    + Add Another Society
                                </button>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                        <button onClick={() => setModal(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer" }}>Cancel</button>
                        <button onClick={handleSave} disabled={saving} style={{ background: "linear-gradient(135deg,#00d4aa,#00b4d8)", border: "none", borderRadius: 8, padding: "9px 18px", color: "#0d1117", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: saving ? 0.7 : 1 }}>
                            <Save size={13} /> {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}