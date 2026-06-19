// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useAppContext } from "../AppContext";
import {
    Gift, Plus, Search, Edit2, Trash2, Eye, X,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { createOccasionApi, updateOccasionApi, deleteOccasionApi, getAllOccasionsApi } from "../api/occasion-api";

// ── Occasion icon/color mapping ──────────────────────────────
const OCCASION_CONFIG = {
    Marriage:     { color: "#ff6b9d", bg: "rgba(255,107,157,0.12)", emoji: "💍" },
    Birthday:     { color: "#ffb347", bg: "rgba(255,179,71,0.12)",  emoji: "🎂" },
    Graduation:   { color: "#6c63ff", bg: "rgba(108,99,255,0.12)", emoji: "🎓" },
    Anniversary:  { color: "#00d4aa", bg: "rgba(0,212,170,0.12)",  emoji: "🎊" },
    Engagement:   { color: "#ff9f43", bg: "rgba(255,159,67,0.12)", emoji: "💑" },
    Housewarming: { color: "#00b4d8", bg: "rgba(0,180,216,0.12)",  emoji: "🏠" },
    "Baby Shower": { color: "#a29bfe", bg: "rgba(162,155,254,0.12)", emoji: "🍼" },
    default:      { color: "#8899aa", bg: "rgba(136,153,170,0.12)", emoji: "🎉" },
};

function getConfig(name = "") {
    const key = Object.keys(OCCASION_CONFIG).find(k =>
        name.toLowerCase().includes(k.toLowerCase())
    );
    return OCCASION_CONFIG[key] || OCCASION_CONFIG.default;
}

const emptyForm = { occasionName: "", occasionDescription: "" };

// ── Reusable field components ────────────────────────────────
const F = ({ label, field, area, form, setForm }) => (
    <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", color: "#8899aa", fontSize: 12, marginBottom: 6 }}>{label}</label>
        {area ? (
            <textarea
                value={form[field] || ""}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                rows={3}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }}
            />
        ) : (
            <input
                type="text"
                value={form[field] || ""}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />
        )}
    </div>
);

// ── Pagination ───────────────────────────────────────────────
const fmtNum = n => Number(n).toLocaleString("en-IN");
const Pagination = ({ page, total, perPage, onChange }) => {
    const pages = Math.max(1, Math.ceil(total / perPage));
    const visiblePages = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) visiblePages.push(i);
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
            <span style={{ color: "#8899aa", fontSize: 12 }}>
                Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {fmtNum(total)}
            </span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button onClick={() => onChange(1)} disabled={page === 1} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: page === 1 ? "#556677" : "#8899aa", cursor: page === 1 ? "not-allowed" : "pointer" }}><ChevronsLeft size={12} /></button>
                <button onClick={() => onChange(page - 1)} disabled={page === 1} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: page === 1 ? "#556677" : "#8899aa", cursor: page === 1 ? "not-allowed" : "pointer" }}><ChevronLeft size={12} /></button>
                {visiblePages.map(p => (
                    <button key={p} onClick={() => onChange(p)} style={{ background: p === page ? "#00d4aa" : "none", border: `1px solid ${p === page ? "#00d4aa" : "var(--border)"}`, borderRadius: 6, padding: "4px 10px", color: p === page ? "#000" : "#8899aa", fontWeight: p === page ? 700 : 400, cursor: "pointer", fontSize: 12, minWidth: 30 }}>{p}</button>
                ))}
                <button onClick={() => onChange(page + 1)} disabled={page === pages} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: page === pages ? "#556677" : "#8899aa", cursor: page === pages ? "not-allowed" : "pointer" }}><ChevronRight size={12} /></button>
                <button onClick={() => onChange(pages)} disabled={page === pages} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: page === pages ? "#556677" : "#8899aa", cursor: page === pages ? "not-allowed" : "pointer" }}><ChevronsRight size={12} /></button>
            </div>
        </div>
    );
};

// ── Main Component ───────────────────────────────────────────
export default function OccasionDashboard() {
    const { occasions, setOccasions, refetch } = useAppContext();

    const [search, setSearch]               = useState("");
    const [modal, setModal]                 = useState(null); // "add" | "edit" | null
    const [form, setForm]                   = useState(emptyForm);
    const [editId, setEditId]               = useState(null);
    const [viewItem, setViewItem]           = useState(null);
    const [page, setPage]                   = useState(1);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError]     = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [fetchLoading, setFetchLoading]   = useState(false);
    const [fetchError, setFetchError]       = useState(null);

    // ── Fetch occasions directly from API on mount ────────────
    const loadOccasions = async () => {
        setFetchLoading(true);
        setFetchError(null);
        try {
            const res = await getAllOccasionsApi();
            // Backend returns: { status:1, message:"...", data:[...] }
            // axios wraps it: res.data = { status, message, data:[...] }
            const payload = res?.data;
            let arr = [];
            if (Array.isArray(payload))           arr = payload;
            else if (Array.isArray(payload?.data)) arr = payload.data;
            else if (Array.isArray(payload?.list)) arr = payload.list;
            else if (Array.isArray(payload?.occasions)) arr = payload.occasions;

            console.log("[OccasionDashboard] Parsed array:", arr);

            if (arr.length > 0) {
                setOccasions(arr.map((item, i) => ({
                    occasionId:          item.occasionId          || item.occasion_id  || item.id || item._id || i + 1,
                    occasionName:        item.occasionName        || item.occasion_name || item.name  || "",
                    occasionDescription: item.occasionDescription || item.occasion_description || item.description || "",
                })));
            }
        } catch (err) {
            console.error("[OccasionDashboard] Fetch error:", err);
            setFetchError(err?.response?.data?.message || err?.message || "Failed to fetch occasions");
        } finally {
            setFetchLoading(false);
        }
    };

    useEffect(() => {
        loadOccasions();
    }, []);

    const PER = 8;

    const filtered = (occasions || []).filter(d =>
        (d.occasionName || "").toLowerCase().includes(search.toLowerCase()) ||
        (d.occasionDescription || "").toLowerCase().includes(search.toLowerCase())
    );
    const paged = filtered.slice((page - 1) * PER, page * PER);

    // ── Open add/edit modal ───────────────────────────────────
    const openAdd = () => { setForm(emptyForm); setEditId(null); setActionError(null); setModal("add"); };
    const openEdit = (item) => {
        setForm({ occasionName: item.occasionName, occasionDescription: item.occasionDescription });
        setEditId(item.occasionId);
        setActionError(null);
        setModal("edit");
    };

    // ── Save (create or update) ───────────────────────────────
    const save = async () => {
        if (!form.occasionName.trim()) return;
        setActionLoading(true);
        setActionError(null);
        try {
            if (modal === "edit" && editId) {
                await updateOccasionApi(form, editId);
            } else {
                await createOccasionApi(form);
            }
            setModal(null);
            await loadOccasions(); // fresh data from server
        } catch (err) {
            console.error("[OccasionDashboard] Save error:", err);
            const msg = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || "Something went wrong";
            setActionError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────
    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        setActionLoading(true);
        setActionError(null);
        try {
            await deleteOccasionApi(deleteConfirm.occasionId);
            setDeleteConfirm(null);
            await loadOccasions(); // fresh data from server
        } catch (err) {
            console.error("[OccasionDashboard] Delete error:", err);
            const msg = err?.response?.data?.message
                || err?.response?.data?.error
                || err?.message
                || "Delete failed";
            setActionError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    // ── Styles ────────────────────────────────────────────────
    const cardStyle = {
        background: "var(--surface)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        overflow: "hidden",
    };
    const overlayStyle = {
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
    };
    const modalStyle = {
        background: "var(--surface)",
        borderRadius: 16,
        border: "1px solid var(--border)",
        padding: 28,
        width: "100%", maxWidth: 440,
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
    };

    return (
        <div style={{ padding: "24px 28px", minHeight: "100vh" }}>
            {/* ── Header ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <Gift size={22} color="#00d4aa" />
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                            Occasion Management
                        </h1>
                    </div>
                    <p style={{ color: "#8899aa", fontSize: 13, margin: 0 }}>
                        Manage all occasion types for society events &amp; celebrations
                    </p>
                </div>
                <button
                    onClick={openAdd}
                    style={{ display: "flex", alignItems: "center", gap: 8, background: "#00d4aa", color: "#000", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                    <Plus size={15} /> Add Occasion
                </button>
            </div>

            {/* ── API Loading / Error banners ── */}
            {fetchLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
                    <div style={{ width: 16, height: 16, border: "2px solid #00d4aa", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <span style={{ color: "#00d4aa", fontSize: 13 }}>Fetching occasions from server…</span>
                </div>
            )}
            {fetchError && !fetchLoading && (
                <div style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#ff6b6b", fontSize: 13 }}>⚠ API Error: {fetchError} — showing cached data</span>
                    <button onClick={() => { setFetchError(null); loadOccasions(); }}
                        style={{ background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 6, padding: "5px 12px", color: "#ff6b6b", fontSize: 12, cursor: "pointer" }}>
                        Retry
                    </button>
                </div>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* ── Stats Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
                {[
                    { label: "Total Occasions", value: (occasions || []).length, color: "#00d4aa" },
                    { label: "Marriage", value: (occasions || []).filter(o => o.occasionName?.toLowerCase().includes("marriage")).length, color: "#ff6b9d" },
                    { label: "Birthday", value: (occasions || []).filter(o => o.occasionName?.toLowerCase().includes("birthday")).length, color: "#ffb347" },
                    { label: "Others", value: (occasions || []).filter(o => !["marriage","birthday"].some(k => o.occasionName?.toLowerCase().includes(k))).length, color: "#6c63ff" },
                ].map(stat => (
                    <div key={stat.label} style={{ ...cardStyle, padding: "16px 20px" }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                        <div style={{ color: "#8899aa", fontSize: 12, marginTop: 6 }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Table Card ── */}
            <div style={cardStyle}>
                {/* Search Bar */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, position: "relative" }}>
                        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }} />
                        <input
                            placeholder="Search occasions..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            style={{ width: "100%", paddingLeft: 34, padding: "9px 12px 9px 34px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                        />
                    </div>
                    <span style={{ color: "#8899aa", fontSize: 12 }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Table */}
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                {["#", "Occasion", "Description", "Actions"].map(h => (
                                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", color: "#8899aa", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: "48px 20px", textAlign: "center", color: "#8899aa" }}>
                                        <Gift size={32} style={{ opacity: 0.3, marginBottom: 10, display: "block", margin: "0 auto 10px" }} />
                                        {search ? "No occasions match your search." : "No occasions found."}
                                    </td>
                                </tr>
                            ) : paged.map((item, idx) => {
                                const cfg = getConfig(item.occasionName);
                                return (
                                    <tr key={item.occasionId} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
                                        {/* # */}
                                        <td style={{ padding: "12px 16px", color: "#8899aa", fontSize: 12 }}>
                                            {(page - 1) * PER + idx + 1}
                                        </td>

                                        {/* Occasion Name */}
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                                                    {cfg.emoji}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>{item.occasionName}</div>
                                                    <div style={{ fontSize: 11, color: cfg.color, marginTop: 1 }}>ID: {item.occasionId}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Description */}
                                        <td style={{ padding: "12px 16px", color: "#aabbcc", fontSize: 13, maxWidth: 320 }}>
                                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {item.occasionDescription || "—"}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <button onClick={() => setViewItem(item)} title="View"
                                                    style={{ background: "rgba(0,180,216,0.12)", border: "none", borderRadius: 7, padding: "6px 8px", color: "#00b4d8", cursor: "pointer", display: "flex", alignItems: "center" }}>
                                                    <Eye size={13} />
                                                </button>
                                                <button onClick={() => openEdit(item)} title="Edit"
                                                    style={{ background: "rgba(108,99,255,0.12)", border: "none", borderRadius: 7, padding: "6px 8px", color: "#6c63ff", cursor: "pointer", display: "flex", alignItems: "center" }}>
                                                    <Edit2 size={13} />
                                                </button>
                                                <button onClick={() => setDeleteConfirm(item)} title="Delete"
                                                    style={{ background: "rgba(255,107,107,0.12)", border: "none", borderRadius: 7, padding: "6px 8px", color: "#ff6b6b", cursor: "pointer", display: "flex", alignItems: "center" }}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
            </div>

            {/* ── Add / Edit Modal ── */}
            {modal && (
                <div style={overlayStyle} onClick={() => setModal(null)}>
                    <div style={modalStyle} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>
                                {modal === "edit" ? "✏️ Edit Occasion" : "✨ Add Occasion"}
                            </h2>
                            <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer", padding: 4 }}><X size={18} /></button>
                        </div>

                        <F label="Occasion Name *" field="occasionName" form={form} setForm={setForm} />
                        <F label="Description" field="occasionDescription" area form={form} setForm={setForm} />

                        {actionError && (
                            <div style={{ background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "10px 14px", color: "#ff6b6b", fontSize: 13, marginBottom: 16 }}>
                                {actionError}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                            <button onClick={() => setModal(null)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 9, padding: "10px", color: "#8899aa", cursor: "pointer", fontSize: 13 }}>
                                Cancel
                            </button>
                            <button onClick={save} disabled={actionLoading || !form.occasionName.trim()}
                                style={{ flex: 2, background: actionLoading ? "#1a9e80" : "#00d4aa", border: "none", borderRadius: 9, padding: "10px", color: "#000", fontWeight: 600, fontSize: 13, cursor: actionLoading ? "wait" : "pointer" }}>
                                {actionLoading ? "Saving…" : modal === "edit" ? "Save Changes" : "Create Occasion"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── View Modal ── */}
            {viewItem && (
                <div style={overlayStyle} onClick={() => setViewItem(null)}>
                    <div style={modalStyle} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Occasion Details</h2>
                            <button onClick={() => setViewItem(null)} style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer", padding: 4 }}><X size={18} /></button>
                        </div>

                        {(() => {
                            const cfg = getConfig(viewItem.occasionName);
                            return (
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                                        <div style={{ width: 60, height: 60, borderRadius: 16, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
                                            {cfg.emoji}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{viewItem.occasionName}</div>
                                            <div style={{ fontSize: 12, color: cfg.color, marginTop: 3 }}>Occasion ID: {viewItem.occasionId}</div>
                                        </div>
                                    </div>

                                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "14px 16px" }}>
                                        <div style={{ color: "#8899aa", fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Description</div>
                                        <div style={{ color: "var(--text-primary)", fontSize: 14, lineHeight: 1.6 }}>
                                            {viewItem.occasionDescription || "No description provided."}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        <button onClick={() => setViewItem(null)}
                            style={{ width: "100%", marginTop: 20, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 9, padding: "10px", color: "#8899aa", cursor: "pointer", fontSize: 13 }}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm Modal ── */}
            {deleteConfirm && (
                <div style={overlayStyle} onClick={() => setDeleteConfirm(null)}>
                    <div style={{ ...modalStyle, maxWidth: 380 }} onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                            <div style={{ fontSize: 40, marginBottom: 10 }}>🗑️</div>
                            <h2 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Delete Occasion?</h2>
                            <p style={{ margin: 0, color: "#8899aa", fontSize: 13 }}>
                                Are you sure you want to delete <strong style={{ color: "var(--text-primary)" }}>{deleteConfirm.occasionName}</strong>? This action cannot be undone.
                            </p>
                        </div>
                        {actionError && (
                            <div style={{ background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "10px 14px", color: "#ff6b6b", fontSize: 13, marginBottom: 12 }}>
                                {actionError}
                            </div>
                        )}
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 9, padding: "10px", color: "#8899aa", cursor: "pointer", fontSize: 13 }}>
                                Cancel
                            </button>
                            <button onClick={confirmDelete} disabled={actionLoading}
                                style={{ flex: 1, background: "#ff6b6b", border: "none", borderRadius: 9, padding: "10px", color: "#fff", fontWeight: 600, fontSize: 13, cursor: actionLoading ? "wait" : "pointer" }}>
                                {actionLoading ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
