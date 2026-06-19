// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useAppContext } from "../AppContext";
import { FileText, Plus, Edit2, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";
// import { createNewTermsConditionApi } from "api/termsCondition-api";
import { createNewTermsConditionApi, getAllTermsConditionApi } from "api/termsCondition-api";
import { getAllSocietyApi } from "api/society-api";

const StatusBadge = () => (
    <span
        style={{
            background: "rgba(0,212,170,0.15)",
            color: "#00d4aa",
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.04em",
        }}
    >
        Active
    </span>
);

const Modal = ({ title, onClose, children }) => (
    <div
        style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
        }}
    >
        <div
            style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-strong)",
                borderRadius: 16,
                width: "100%",
                maxWidth: 520,
                maxHeight: "85vh",
                overflow: "auto",
                boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}
        >
            <div
                style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <h3 style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600 }}>{title}</h3>
                <button
                    onClick={onClose}
                    style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer" }}
                >
                    <X size={18} />
                </button>
            </div>
            <div style={{ padding: 24 }}>{children}</div>
        </div>
    </div>
);

const inputStyle = {
    width: "100%",
    background: "var(--bg-surface)",
    border: "1px solid var(--border-strong)",
    borderRadius: 8,
    padding: "10px 12px",
    color: "var(--text-primary)",
    fontSize: 13,
    outline: "none",
    cursor: "pointer",
    boxSizing: "border-box",
};

const labelStyle = {
    display: "block",
    color: "#8899aa",
    fontSize: 12,
    marginBottom: 6,
    fontWeight: 500,
};

export default function TermsConditions() {
    const { termsConditions, setTermsConditions } = useAppContext();

    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({});
    const [expanded, setExpanded] = useState(null);
    const [societies, setSocieties] = useState([]);
    const [societyLoading, setSocietyLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // ── Fetch societies ──────────────────────────────────────────────────────
    // API response shape: { status: 1, data: [ { societyIdentifier, societyName, ... } ] }
    useEffect(() => {
        const fetchSocieties = async () => {
            try {
                setSocietyLoading(true);
                const res = await getAllSocietyApi();
                // ✅ Handle both res.data (array) and res.data.data (nested)
                const list =
                    Array.isArray(res?.data?.data) ? res.data.data :
                        Array.isArray(res?.data) ? res.data :
                            [];
                setSocieties(list);
            } catch (err) {
                console.error("Failed to fetch societies:", err);
                setSocieties([]);
            } finally {
                setSocietyLoading(false);
            }
        };
        fetchSocieties();
    }, []);

    const openAdd = () => {
        setForm({
            societyIdentifier: "",
            applicationType: "General",
            termCondition: "",
        });
        setError("");
        setModal("add");
    };

    const openEdit = (t) => {
        setForm({ ...t });
        setError("");
        setModal("edit");
    };

    const handleDelete = (termConditionId) => {
        setTermsConditions((d) => d.filter((x) => x.termConditionId !== termConditionId));
    };

    const handleSave = async () => {
        if (!form.societyIdentifier || !form.applicationType || !form.termCondition) {
            setError("All fields are required.");
            return;
        }
        setSaving(true);
        setError("");

        try {
            if (modal === "add") {
                const payload = {
                    societyIdentifier: form.societyIdentifier,
                    applicationType: form.applicationType,
                    termCondition: form.termCondition,
                };

                const res = await createNewTermsConditionApi(payload);

                if (res?.status === 1) {
                    const created = res.data || { ...payload, termConditionId: `TC-${Date.now()}` };
                    setTermsConditions((d) => [...d, created]);
                    setModal(null);
                } else {
                    setError(res?.message || "Failed to create term. Please try again.");
                }
            } else {
                setTermsConditions((d) =>
                    d.map((r) => (r.termConditionId === form.termConditionId ? { ...form } : r))
                );
                setModal(null);
            }
        } catch (err) {
            console.error("Save term error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const filteredTerms = (termsConditions || []).filter((t) =>
    (t.applicationType || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.societyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.societyIdentifier || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.termCondition || "").toLowerCase().includes(searchTerm.toLowerCase())
);

    return (
        <div>
           <div
              style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              gap: 12,
               }}>
             <input type="text"  placeholder="Search terms..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
              flex: 1,
              maxWidth: 350,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-strong)",
              borderRadius: 8,
              padding: "10px 12px",
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
             }} />

    <button
        onClick={openAdd}
        style={{
            background: "linear-gradient(135deg,#00d4aa,#00b4d8)",
            border: "none",
            borderRadius: 8,
            padding: "9px 18px",
            color: "#0d1117",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
        }}
    >
        <Plus size={14} /> Add Term
    </button>
</div>
            {filteredTerms.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#8899aa", fontSize: 14 }}>
                    No terms &amp; conditions found.
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredTerms.map((t) => (
                    <div
                        key={t.termConditionId}
                        style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                padding: "16px 20px",
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                cursor: "pointer",
                            }}
                            onClick={() => setExpanded(expanded === t.termConditionId ? null : t.termConditionId)}
                        >
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    background: "rgba(0,212,170,0.1)",
                                    borderRadius: 8,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <FileText size={14} style={{ color: "#00d4aa" }} />
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: 2 }}>
                                    {t.applicationType}
                                </div>
                                <span
                                    style={{
                                        background: "rgba(108,99,255,0.12)",
                                        color: "#6c63ff",
                                        borderRadius: 20,
                                        padding: "2px 8px",
                                        fontSize: 11,
                                    }}
                                >
                                    {t.societyName || t.societyIdentifier || "—"}
                                </span>
                            </div>

                            <StatusBadge />

                            <div style={{ display: "flex", gap: 6 }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openEdit(t);
                                    }}
                                    style={{
                                        background: "rgba(108,99,255,0.12)",
                                        border: "none",
                                        borderRadius: 6,
                                        padding: "5px 8px",
                                        color: "#6c63ff",
                                        cursor: "pointer",
                                    }}
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(t.termConditionId);
                                    }}
                                    style={{
                                        background: "rgba(255,107,107,0.12)",
                                        border: "none",
                                        borderRadius: 6,
                                        padding: "5px 8px",
                                        color: "#ff6b6b",
                                        cursor: "pointer",
                                    }}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>

                            {expanded === t.termConditionId ? (
                                <ChevronUp size={16} style={{ color: "#8899aa" }} />
                            ) : (
                                <ChevronDown size={16} style={{ color: "#8899aa" }} />
                            )}
                        </div>

                        {expanded === t.termConditionId && (
                            <div
                                style={{
                                    padding: "0 20px 16px 64px",
                                    color: "#8899aa",
                                    fontSize: 13,
                                    lineHeight: 1.6,
                                    borderTop: "1px solid var(--border)",
                                }}
                            >
                                <div style={{ paddingTop: 12 }} dangerouslySetInnerHTML={{ __html: t.termCondition }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {modal && (
                <Modal title={modal === "add" ? "Add Term" : "Edit Term"} onClose={() => setModal(null)}>

                    {/* ── Society Dropdown ── */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>
                            Society <span style={{ color: "#ff6b6b" }}>*</span>
                        </label>
                        {societyLoading ? (
                            <div style={{ color: "#8899aa", fontSize: 13, padding: "10px 0" }}>⏳ Loading societies…</div>
                        ) : (
                            <select
                                value={form.societyIdentifier || ""}
                                onChange={(e) => setForm((f) => ({ ...f, societyIdentifier: e.target.value }))}
                                style={{ ...inputStyle, appearance: "none" }}
                            >
                                <option value="">— Select Society —</option>
                                {/* ✅ Shows societyName + identifier from API */}
                                {societies.map((s) => (
                                    <option key={s.societyIdentifier} value={s.societyIdentifier}>
                                        {s.societyName} ({s.societyIdentifier})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* ── Application Type ── */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>
                            Application Type <span style={{ color: "#ff6b6b" }}>*</span>
                        </label>
                        <select
                            value={form.applicationType || ""}
                            onChange={(e) => setForm((f) => ({ ...f, applicationType: e.target.value }))}
                            style={{ ...inputStyle, appearance: "none" }}
                        >
                            <option value="">— Select Type —</option>
                            {["Contact Update", "Move-In", "Move-Out", "Renovation", "Parking", "Pet Registration", "General", "Event"].map((o) => (
                                <option key={o} value={o}>
                                    {o}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* ── Terms Text ── */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>
                            Terms &amp; Conditions <span style={{ color: "#ff6b6b" }}>*</span>
                        </label>
                        <textarea
                            value={form.termCondition || ""}
                            onChange={(e) => setForm((f) => ({ ...f, termCondition: e.target.value }))}
                            rows={4}
                            placeholder="Enter terms (HTML supported, e.g. <p>Your terms here</p>)"
                            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", cursor: "text" }}
                        />
                        {form.termCondition && (
                            <div
                                style={{
                                    marginTop: 8,
                                    padding: "10px 12px",
                                    background: "rgba(0,212,170,0.05)",
                                    border: "1px dashed var(--border)",
                                    borderRadius: 8,
                                    fontSize: 12,
                                    color: "var(--text-primary)",
                                    lineHeight: 1.6,
                                }}
                            >
                                <div style={{ color: "#8899aa", fontSize: 11, marginBottom: 4, fontWeight: 500 }}>
                                    Preview
                                </div>
                                <div dangerouslySetInnerHTML={{ __html: form.termCondition }} />
                            </div>
                        )}
                    </div>

                    {error && (
                        <div
                            style={{
                                marginBottom: 12,
                                padding: "8px 12px",
                                background: "rgba(255,107,107,0.1)",
                                border: "1px solid rgba(255,107,107,0.3)",
                                borderRadius: 8,
                                color: "#ff6b6b",
                                fontSize: 12,
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button
                            onClick={() => setModal(null)}
                            style={{
                                background: "none",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                padding: "9px 18px",
                                color: "#8899aa",
                                cursor: "pointer",
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                background: saving ? "rgba(0,212,170,0.4)" : "linear-gradient(135deg,#00d4aa,#00b4d8)",
                                border: "none",
                                borderRadius: 8,
                                padding: "9px 18px",
                                color: "#0d1117",
                                fontWeight: 700,
                                cursor: saving ? "not-allowed" : "pointer",
                            }}
                        >
                            {saving ? "Saving…" : modal === "add" ? "Save" : "Update"}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}