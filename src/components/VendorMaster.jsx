// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../AppContext";
import {
    Plus, Search, Edit2, Trash2, X, Save, Phone, Mail, Eye,
    ChevronLeft, ChevronsLeft, ChevronRight, ChevronsRight, Minus,
} from "lucide-react";
import { addNewVendorApi, updateVendorApi, deleteVendorApi, getVendorDetail, getAllVendorApi } from "api/vendor-api";
import { getAllSocietyApi } from "api/society-api";
import { getComplaintCategoriesApi } from "api/complaint-api";


const safeText = (val) => {
    if (val === null || val === undefined || val === "") return "-";
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


const Modal = ({ title, onClose, children }) => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 900, maxHeight: "85vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 1 }}>
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

const DetailRow = ({ label, value }) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
        <span style={{ color: "#8899aa", fontSize: 12, flexShrink: 0 }}>{label}</span>
        <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500, textAlign: "right", wordBreak: "break-word" }}>{value}</span>
    </div>
);

const SectionTitle = ({ children }) => (
    <div style={{ color: "#00d4aa", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 22, marginBottom: 8 }}>
        {children}
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
    vendorName: "", vendorAddress: "", gstin: "", pan: "", product: "",
    serviceType: "", frequency: "", contactPersonName: "", contactPersonNumber: "",
    contactValue: "", contractStartDate: "", contractEndDate: "",
    totalPeriodCalculation: 1, bankName: "", branchName: "", ifsc: "",
    accountNumber: "", aadharNumber: "", complaintCategoryId: "",
    societyRows: [{ societyIdentifier: "" }],
});

const btnStyle = (color, bg, disabled) => ({
    flex: 1, background: bg, border: "none", borderRadius: 8, padding: "8px",
    color, cursor: disabled ? "not-allowed" : "pointer", fontSize: 12, display: "flex",
    alignItems: "center", justifyContent: "center", gap: 4, opacity: disabled ? 0.5 : 1,
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
    const [viewModal, setViewModal] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const PER = 8;

    // ─── Fetch latest vendors from API and update local state ───────────────────
    const fetchAllVendors = async () => {
        try {
            setRefreshing(true);
            const res = await getAllVendorApi();
            setData(res?.data?.data || res?.data || []);
        } catch (err) {
            console.error("Failed to refresh vendors:", err);
        } finally {
            setRefreshing(false);
        }
    };

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

    const fetchVendorDetail = async (identifier) => {
        const res = await getVendorDetail(identifier);
        return res?.data?.data || res?.data || null;
    };

    const openEdit = async (v) => {
        const identifier = v?.vendorIdentifier;
        if (!identifier) {
            console.error("Missing vendorIdentifier for edit");
            return;
        }
        setActionLoadingId(identifier);
        try {
            const detail = await fetchVendorDetail(identifier);
            const source = detail || v;
            const existingSocieties = Array.isArray(source?.societies) ? source.societies : [];
            setForm({
                vendorName: cleanValue(source?.vendorName),
                vendorAddress: cleanValue(source?.vendorAddress),
                pan: cleanValue(source?.pan),
                gstin: cleanValue(source?.gstin),
                product: cleanValue(source?.product) || cleanValue(source?.productName) || "",
                serviceType: cleanValue(source?.serviceType),
                frequency: cleanValue(source?.frequency),
                contactPersonName: cleanValue(source?.contactPersonName),
                contactPersonNumber: cleanValue(source?.contactPersonNumber),
                contactValue: cleanValue(source?.contactValue),
                contractStartDate: cleanValue(source?.contractStartDate),
                contractEndDate: cleanValue(source?.contractEndDate),
                totalPeriodCalculation: source?.totalPeriodCalculation || 1,
                bankName: cleanValue(source?.bankName),
                branchName: cleanValue(source?.branchName),
                ifsc: cleanValue(source?.ifsc),
                accountNumber: cleanValue(source?.accountNumber),
                aadharNumber: cleanValue(source?.aadharNumber),
                complaintCategoryId: safeId(source?.complaintCategoryId) || safeId(source?.complaintCategory),
                societyRows: existingSocieties.length
                    ? existingSocieties.map((sid) => ({ societyIdentifier: safeId(sid) }))
                    : [{ societyIdentifier: "" }],
                id: source?.id || v?.id,
                vendorIdentifier: source?.vendorIdentifier || identifier,
            });
            setModal("edit");
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoadingId(null);
        }
    };

    const openView = async (v) => {
        const identifier = v?.vendorIdentifier;
        if (!identifier) {
            console.error("Missing vendorIdentifier for view");
            return;
        }
        setActionLoadingId(identifier);
        try {
            const detail = await fetchVendorDetail(identifier);
            setViewModal(detail || v);
        } catch (err) {
            console.error(err);
            setViewModal(v);
        } finally {
            setActionLoadingId(null);
        }
    };

    // ─── Delete: await API, then re-fetch latest list ───────────────────────────
    const handleDelete = async (identifier) => {
        if (!identifier) {
            console.error("Missing vendorIdentifier for delete");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this vendor?")) return;
        try {
            setActionLoadingId(identifier);
            await deleteVendorApi(identifier);
            await fetchAllVendors(); // ← refresh latest data from server
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoadingId(null);
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

    // ─── Save (Add / Edit): await API, then re-fetch latest list ────────────────
    const handleSave = async () => {
        const addPayload = {
            vendorName: form.vendorName,
            vendorAddress: form.vendorAddress,
            gstin: form.gstin,
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

        const editPayload = {
            vendorName: form.vendorName,
            vendorAddress: form.vendorAddress,
            gstin: form.gstin,
            pan: form.pan,
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

        try {
            setSaving(true);
            if (modal === "add") {
                await addNewVendorApi(addPayload);
            } else {
                await updateVendorApi(editPayload, form.vendorIdentifier);
            }
            await fetchAllVendors(); // ← refresh latest data from server
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
            {/* ── Header: Search + Add button ── */}
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

            {/* ── Refreshing indicator ── */}
            {refreshing && (
                <div style={{ color: "#00d4aa", fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#00d4aa", animation: "pulse 1s infinite" }} />
                    Refreshing vendors...
                </div>
            )}

            {/* ── Vendor Cards Grid ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))", gap: 16 }}>
                {paged.map((v) => {
                    const isLoadingRow = actionLoadingId === v.vendorIdentifier;
                    return (
                        <div key={v.id || v.vendorIdentifier} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                <div>
                                    <div style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: 4 }}>{safeText(v.vendorName)}</div>
                                </div>
                            </div>

                            <div style={{ color: "#8899aa", fontSize: 12, lineHeight: 1.7, marginBottom: 14 }}>
                                <div><Phone size={11} style={{ marginRight: 5, verticalAlign: "middle" }} />{safeText(v.contactPersonNumber)}</div>
                                <div><Mail size={11} style={{ marginRight: 5, verticalAlign: "middle" }} />{safeText(v.contactPersonName)}</div>
                                <div>Service: {safeText(v.serviceType)}</div>
                                <div>Frequency: {safeText(v.frequency)}</div>
                                <div>Address: {safeText(v.vendorAddress)}</div>
                                <div>Category: {safeText(v.complaintCategory?.name || v.complaintCategory)}</div>
                            </div>

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                                {getSocietiesArray(v).map((sid) => (
                                    <span key={sid} style={{ background: "rgba(0,212,170,0.12)", color: "#00d4aa", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                                        {getSocietyName(sid)}
                                    </span>
                                ))}
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => openView(v)} disabled={isLoadingRow} style={btnStyle("#00b4d8", "rgba(0,180,216,0.12)", isLoadingRow)}>
                                    <Eye size={12} /> {isLoadingRow ? "..." : "View"}
                                </button>
                                <button onClick={() => openEdit(v)} disabled={isLoadingRow} style={btnStyle("#6c63ff", "rgba(108,99,255,0.12)", isLoadingRow)}>
                                    <Edit2 size={12} /> {isLoadingRow ? "..." : "Edit"}
                                </button>
                                <button onClick={() => handleDelete(v.vendorIdentifier)} disabled={isLoadingRow} style={btnStyle("#ff6b6b", "rgba(255,107,107,0.12)", isLoadingRow)}>
                                    <Trash2 size={12} /> {isLoadingRow ? "..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />

            {/* ── Add / Edit Modal ── */}
            {modal && (
                <Modal title={modal === "add" ? "Add Vendor" : "Edit Vendor"} onClose={() => setModal(null)}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                        <FormField label="Vendor Name" value={form.vendorName} onChange={(v) => setForm((f) => ({ ...f, vendorName: v }))} />
                        <FormField label="Vendor Address" value={form.vendorAddress} onChange={(v) => setForm((f) => ({ ...f, vendorAddress: v }))} />
                        <FormField label="GSTIN" value={form.gstin} onChange={(v) => setForm((f) => ({ ...f, gstin: v }))} />
                        <FormField label="PAN" value={form.pan} onChange={(v) => setForm((f) => ({ ...f, pan: v }))} />
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

                    {/* Societies Section */}
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

            {/* ── View Details Modal ── */}
            {viewModal && (
                <Modal title="Vendor Details" onClose={() => setViewModal(null)}>
                    <SectionTitle>Vendor Information</SectionTitle>
                    <DetailRow label="Vendor Name" value={safeText(viewModal.vendorName)} />
                    <DetailRow label="Vendor Address" value={safeText(viewModal.vendorAddress)} />
                    <DetailRow label="GSTIN" value={safeText(viewModal.gstin)} />
                    <DetailRow label="PAN" value={safeText(viewModal.pan)} />
                    <DetailRow label="Aadhar Number" value={safeText(viewModal.aadharNumber)} />
                    <DetailRow label="Service Type" value={safeText(viewModal.serviceType)} />
                    <DetailRow label="Frequency" value={safeText(viewModal.frequency)} />
                    <DetailRow label="Contract Start Date" value={safeText(viewModal.contractStartDate)} />
                    <DetailRow label="Contract End Date" value={safeText(viewModal.contractEndDate)} />
                    <DetailRow label="Total Period Calculation" value={safeText(viewModal.totalPeriodCalculation)} />

                    <SectionTitle>Contact Information</SectionTitle>
                    <DetailRow label="Contact Person Name" value={safeText(viewModal.contactPersonName)} />
                    <DetailRow label="Contact Person Number" value={safeText(viewModal.contactPersonNumber)} />
                    <DetailRow label="Contact Value" value={safeText(viewModal.contactValue)} />

                    <SectionTitle>Bank Details</SectionTitle>
                    <DetailRow label="Bank Name" value={safeText(viewModal.bankName)} />
                    <DetailRow label="Branch Name" value={safeText(viewModal.branchName)} />
                    <DetailRow label="IFSC" value={safeText(viewModal.ifsc)} />
                    <DetailRow label="Account Number" value={safeText(viewModal.accountNumber)} />

                    <SectionTitle>Complaint Category</SectionTitle>
                    <DetailRow
                        label="Category"
                        value={safeText(viewModal.complaintCategory?.name)}
                    />

                    <SectionTitle>
                        Linked Societies ({Array.isArray(viewModal.societies) ? viewModal.societies.length : 0})
                    </SectionTitle>
                    {Array.isArray(viewModal.societies) && viewModal.societies.length > 0 ? (
                        viewModal.societies.map((row, idx) => {
                            const soc = row?.society || row;
                            return (
                                <div key={row?.societyIdentifier || idx} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                                    <div style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: 8, fontSize: 13 }}>
                                        {safeText(soc?.societyName)}
                                    </div>
                                    <DetailRow label="Email" value={safeText(soc?.email)} />
                                    <DetailRow label="Contact Number" value={safeText(soc?.contactNumber)} />
                                    <DetailRow label="Address" value={safeText(soc?.address)} />
                                    <DetailRow label="City" value={safeText(soc?.city)} />
                                    <DetailRow label="State" value={safeText(soc?.state)} />
                                    <DetailRow label="Pincode" value={safeText(soc?.pincode)} />
                                    <DetailRow label="Registration Number" value={safeText(soc?.registrationNumber)} />
                                    <DetailRow label="Billing Frequency" value={safeText(soc?.billingFrequency)} />
                                    <DetailRow label="Society GSTIN" value={safeText(soc?.gstin)} />
                                    <DetailRow label="PAN Number" value={safeText(soc?.panNumber)} />
                                    <DetailRow label="TAN Number" value={safeText(soc?.tanNumber)} />
                                    <DetailRow label="HSN Code" value={safeText(soc?.hsnCode)} />
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ color: "#8899aa", fontSize: 13 }}>No societies linked.</div>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                        <button onClick={() => setViewModal(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 18px", color: "#8899aa", cursor: "pointer" }}>
                            Close
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}