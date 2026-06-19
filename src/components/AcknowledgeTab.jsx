import React, { useState, useMemo } from "react";
import { useAppContext } from "../AppContext";
import {
    Send, CheckCircle, AlertCircle, Clock,
    Eye, RefreshCw, Trash2, Mail, Phone,
} from "lucide-react";

import { getAllPaymentAcknowledgements } from "api/acknowledgement-api";

// ── Helpers ──────────────────────────────────────────
const fmtFull = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtNum = (n) => Number(n).toLocaleString("en-IN");

// ── Reusable mini-components ──────────────────────────────────────────

const Pill = ({ status }) => {
    const map = {
        Delivered: { bg: "rgba(0,212,170,0.12)", color: "#00d4aa" },
        Pending: { bg: "rgba(255,179,71,0.12)", color: "#ffb347" },
        Failed: { bg: "rgba(255,107,107,0.12)", color: "#ff6b6b" },
    };
    const s = map[status] || { bg: "rgba(136,153,170,0.12)", color: "#8899aa" };
    return (
        <span style={{
            background: s.bg, color: s.color, padding: "3px 10px",
            borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap"
        }}>
            {status}
        </span>
    );
};

const StatKPI = ({ label, value, sub, color = "#00d4aa", icon: Icon, trend, up }) => (
    <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 14, padding: "16px 18px", position: "relative", overflow: "hidden"
    }}>
        <div style={{
            position: "absolute", top: -12, right: -12, width: 64, height: 64,
            borderRadius: "50%", background: `${color}10`
        }} />
        <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", marginBottom: 10
        }}>
            <div style={{
                color: "var(--text-secondary)", fontSize: 11, fontWeight: 600,
                letterSpacing: "0.3px", textTransform: "uppercase"
            }}>{label}</div>
            {Icon && (
                <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <Icon size={14} color={color} />
                </div>
            )}
        </div>
        <div style={{
            color: "var(--text-primary)", fontSize: 22, fontWeight: 700,
            letterSpacing: "-0.5px", marginBottom: 6
        }}>{value}</div>
        {sub && <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 4 }}>{sub}</div>}
        {trend !== undefined && (
            <div style={{
                display: "flex", alignItems: "center", gap: 4,
                color: up ? "#00d4aa" : "#ff6b6b", fontSize: 11, fontWeight: 600
            }}>
                {up ? "↑" : "↓"} {Math.abs(trend)}% vs last month
            </div>
        )}
    </div>
);

const Card = ({ children, style = {} }) => (
    <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 14, padding: 20, ...style
    }}>
        {children}
    </div>
);

const TH = ({ children, align = "left" }) => (
    <th style={{
        padding: "10px 12px", color: "var(--text-muted)", fontSize: 10,
        fontWeight: 700, textAlign: align, textTransform: "uppercase",
        letterSpacing: "0.5px", whiteSpace: "nowrap",
        borderBottom: "1px solid var(--border)"
    }}>
        {children}
    </th>
);

const TD = ({ children, style = {} }) => (
    <td style={{ padding: "11px 12px", borderBottom: "1px solid var(--border)", ...style }}>
        {children}
    </td>
);

const TableBtn = ({ icon: Icon, color, onClick, title }) => (
    <button title={title} onClick={onClick}
        style={{
            background: `${color}15`, border: "none", borderRadius: 6,
            padding: "4px 8px", color, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center"
        }}
        onMouseEnter={e => (e.currentTarget.style.background = `${color}30`)}
        onMouseLeave={e => (e.currentTarget.style.background = `${color}15`)}>
        <Icon size={12} />
    </button>
);

const SearchInput = ({ value, onChange, placeholder = "Search..." }) => (
    <div style={{ position: "relative" }}>
        <input value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
                background: "var(--bg-surface)", border: "1px solid var(--border)",
                borderRadius: 9, padding: "8px 12px 8px 12px",
                color: "var(--text-primary)", fontSize: 12, width: 220,
                outline: "none", fontFamily: "inherit"
            }} />
    </div>
);

const Modal = ({ open, onClose, title, width = 520, children }) => {
    if (!open) return null;
    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 500, backdropFilter: "blur(4px)"
        }} onClick={onClose}>
            <div style={{
                background: "var(--bg-surface)", border: "1px solid var(--border-strong)",
                borderRadius: 18, width, maxWidth: "95vw", maxHeight: "90vh",
                overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.5)"
            }}
                onClick={e => e.stopPropagation()}>
                <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", padding: "20px 24px",
                    borderBottom: "1px solid var(--border)"
                }}>
                    <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16 }}>{title}</h3>
                    <button onClick={onClose} style={{
                        background: "none", border: "none",
                        color: "var(--text-secondary)", cursor: "pointer", padding: 4
                    }}>✕</button>
                </div>
                <div style={{ padding: "20px 24px" }}>{children}</div>
            </div>
        </div>
    );
};

const FI = ({ label, field, type = "text", form, setForm }) => (
    <div style={{ marginBottom: 14 }}>
        <label style={{
            display: "block", color: "var(--text-secondary)", fontSize: 11,
            fontWeight: 600, marginBottom: 6, textTransform: "uppercase",
            letterSpacing: "0.3px"
        }}>{label}</label>
        <input type={type} value={form[field] || ""}
            onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            style={{
                width: "100%", background: "var(--input-bg)",
                border: "1px solid var(--input-border)", borderRadius: 9,
                padding: "9px 12px", color: "var(--text-primary)",
                fontSize: 13, outline: "none", boxSizing: "border-box"
            }} />
    </div>
);

const FS = ({ label, field, options, form, setForm }) => (
    <div style={{ marginBottom: 14 }}>
        <label style={{
            display: "block", color: "var(--text-secondary)", fontSize: 11,
            fontWeight: 600, marginBottom: 6, textTransform: "uppercase",
            letterSpacing: "0.3px"
        }}>{label}</label>
        <select value={form[field] || ""}
            onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            style={{
                width: "100%", background: "var(--input-bg)",
                border: "1px solid var(--input-border)", borderRadius: 9,
                padding: "9px 12px", color: "var(--text-primary)",
                fontSize: 13, outline: "none", cursor: "pointer"
            }}>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    </div>
);

const BtnPrimary = ({ children, onClick, color = "teal", style = {} }) => {
    const bg =
        color === "red" ? "linear-gradient(135deg,#ff6b6b,#ff8c00)" :
            color === "purple" ? "linear-gradient(135deg,#6c63ff,#00b4d8)" :
                "linear-gradient(135deg,var(--accent-teal),var(--accent-blue))";
    const fg = color === "purple" ? "#fff" : "#000";
    return (
        <button onClick={onClick}
            style={{
                background: bg, border: "none", borderRadius: 9,
                padding: "9px 20px", color: fg, fontWeight: 700, fontSize: 12,
                cursor: "pointer", display: "flex", alignItems: "center",
                gap: 6, fontFamily: "inherit", ...style
            }}>
            {children}
        </button>
    );
};

const BtnGhost = ({ children, onClick, style = {} }) => (
    <button onClick={onClick}
        style={{
            padding: "9px 20px", background: "var(--bg-card)",
            border: "1px solid var(--border)", borderRadius: 9,
            color: "var(--text-secondary)", cursor: "pointer", fontSize: 12,
            fontFamily: "inherit", display: "flex", alignItems: "center",
            gap: 6, ...style
        }}>
        {children}
    </button>
);

// ── TYPE FILTER OPTIONS ───────────────────────────────────────────────
const TYPE_FILTERS = ["All", "Payment Ack", "Invoice Ack", "Overdue Ack", "Reminder"];
const COMPOSE_TYPES = ["Payment Ack", "Invoice Ack", "Overdue Ack", "Reminder", "Custom"];
const SEND_VIA_OPTIONS = ["Email", "SMS", "Email + SMS"];

// ════════════════════════════════════════════════════════════════════════
// AcknowledgeTab — Main Export
// ════════════════════════════════════════════════════════════════════════
export default function AcknowledgeTab() {
    const { societies: ctxSocieties = [], selectedSociety } = useAppContext();
    const [acknowledgements, setAcknowledgements] = useState([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [localData, setLocalData] = useState([]);
    const [showCompose, setShowCompose] = useState(false);
    const [form, setForm] = useState({
        type: "Payment Ack",
        resident: "",
        flat: "",
        amount: "",
        sent: "Email + SMS",
    });

    // ── Fetch API data ──────────────────────────────────────────────────
    useMemo(() => {
        const fetchAcknowledgements = async () => {
            setLoading(true);
            try {
                const societyIdentifier = selectedSociety?.societyIdentifier || ctxSocieties[0]?.societyIdentifier;
                const response = await getAllPaymentAcknowledgements(societyIdentifier);

                // ✅ FIXED: Access nested data - response.data.data contains the array
                if (response?.data?.status === 1 && response?.data?.data) {
                    setAcknowledgements(response.data.data);
                    console.log("Set acknowledgements:", response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch acknowledgements:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAcknowledgements();
    }, [selectedSociety, ctxSocieties]);

    // ── Normalise API data ──────────────────────────────────────────────
    const apiAck = useMemo(() => {
        console.log("API acknowledgements:", acknowledgements);
        console.log("API ack length:", acknowledgements.length);

        const mapped = acknowledgements.map((r) => {
            console.log("Mapping item:", r);
            return {
                id: r.acknowledgementNumber || String(r.id),
                type: "Payment Ack",
                resident: r.property?.propertyName?.split(" ")?.slice(1)?.join(" ") || "Unknown",
                flat: r.property?.propertyIdentifier || "",
                amount: Number(r.amount || 0),
                date: r.createdAt?.split(" ")[0] || "",
                sent: r.paymentMethod === "Online Self" ? "Email" : "SMS",
                status: r.onlineSelfPayment?.paymentStatus || "Pending",
                society: r.property?.propertyIdentifier || "",
                invoiceRef: r.invoiceNumber || "",
            };
        });

        console.log("Mapped apiAck:", mapped);
        return mapped;
    }, [acknowledgements]);

    // ✅ FIXED: Removed FALLBACK_ACK - only use API data
    const baseData = apiAck.map((r, i) => ({
        ...r, _key: `base-${r.id ?? i}-${i}`,
    }));

    const localWithKey = localData.map((r, i) => ({
        ...r, _key: `local-${r.id ?? i}-${i}`,
    }));

    const data = [...baseData, ...localWithKey];

    // ── Filter ──────────────────────────────────────────────────────────
    const filtered = data.filter(r => {
        if (typeFilter !== "All" && r.type !== typeFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            if (!r.resident.toLowerCase().includes(q) && !r.flat.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    // ── KPI counts ──────────────────────────────────────────────────────
    const total = data.length;
    const delivered = data.filter(r => r.status === "Delivered").length;
    const failed = data.filter(r => r.status === "Failed").length;
    const pending = data.filter(r => r.status === "Pending").length;

    // ── Compose handler ─────────────────────────────────────────────────
    const handleCompose = () => {
        if (!form.resident.trim()) return;
        setLocalData(prev => [
            ...prev,
            {
                ...form,
                id: `ACK-${String(prev.length + 100).padStart(3, "0")}`,
                amount: Number(form.amount || 0),
                date: new Date().toISOString().slice(0, 10),
                status: "Pending",
            },
        ]);
        setShowCompose(false);
        setForm({ type: "Payment Ack", resident: "", flat: "", amount: "", sent: "Email + SMS" });
    };

    // ── Resend (optimistic) ─────────────────────────────────────────────
    const handleResend = (r) => {
        setLocalData(prev => {
            const withoutThis = prev.filter(x => x._key !== r._key);
            return [...withoutThis, { ...r, _key: `local-resend-${Date.now()}`, status: "Delivered" }];
        });
    };

    // ── Delete (local only for now) ─────────────────────────────────────
    const handleDelete = (r) => {
        setLocalData(prev => prev.filter(x => x._key !== r._key));
    };

    return (
        <div>
            {/* ── Loading indicator ── */}
            {loading && (
                <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)" }}>
                    Loading acknowledgements...
                </div>
            )}

            {/* ── KPI Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
                <StatKPI label="Total Sent" value={fmtNum(total)} sub="All acknowledgements" color="#6c63ff" icon={Send} trend={6.2} up={true} />
                <StatKPI label="Delivered" value={fmtNum(delivered)} sub="Successfully delivered" color="#00d4aa" icon={CheckCircle} trend={4.8} up={true} />
                <StatKPI label="Failed" value={fmtNum(failed)} sub="Delivery failed" color="#ff6b6b" icon={AlertCircle} trend={8.2} up={false} />
                <StatKPI label="Pending" value={fmtNum(pending)} sub="Awaiting" color="#ffb347" icon={Clock} trend={2.1} up={false} />
            </div>

            {/* ── Table Card ── */}
            <Card>
                {/* Toolbar */}
                <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10
                }}>
                    {/* Type filter buttons */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {TYPE_FILTERS.map(t => (
                            <button key={t} onClick={() => setTypeFilter(t)}
                                style={{
                                    background: typeFilter === t ? "rgba(108,99,255,0.12)" : "none",
                                    border: `1px solid ${typeFilter === t ? "var(--accent-purple)" : "var(--border)"}`,
                                    borderRadius: 8, padding: "5px 12px",
                                    color: typeFilter === t ? "var(--accent-purple)" : "var(--text-muted)",
                                    fontSize: 12, fontWeight: typeFilter === t ? 600 : 400, cursor: "pointer",
                                }}>
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* Search + Compose */}
                    <div style={{ display: "flex", gap: 8 }}>
                        <SearchInput value={search} onChange={setSearch} placeholder="Search resident..." />
                        <BtnPrimary color="purple" onClick={() => setShowCompose(true)}>
                            <Send size={12} /> Compose
                        </BtnPrimary>
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <TH>Ack ID</TH>
                                <TH>Type</TH>
                                <TH>Resident</TH>
                                <TH>Flat</TH>
                                <TH align="right">Amount</TH>
                                <TH>Date</TH>
                                <TH>Sent Via</TH>
                                <TH>Status</TH>
                                <TH>Actions</TH>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{
                                        padding: "40px 12px",
                                        textAlign: "center", color: "var(--text-muted)"
                                    }}>
                                        No acknowledgements found
                                    </td>
                                </tr>
                            ) : filtered.map(r => (
                                <tr key={r._key || r.id}
                                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                                    <TD>
                                        <span style={{
                                            color: "var(--accent-purple)", fontFamily: "var(--font-mono)",
                                            fontSize: 12, fontWeight: 600
                                        }}>{r.id}</span>
                                    </TD>

                                    <TD>
                                        <span style={{
                                            background: "rgba(108,99,255,0.1)", color: "var(--accent-purple)",
                                            borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 600
                                        }}>
                                            {r.type}
                                        </span>
                                    </TD>

                                    <TD>
                                        <span style={{ color: "var(--text-primary)", fontSize: 13 }}>{r.resident}</span>
                                    </TD>

                                    <TD>
                                        <span style={{
                                            background: "rgba(0,212,170,0.1)", color: "var(--accent-teal)",
                                            borderRadius: 6, padding: "2px 8px",
                                            fontFamily: "var(--font-mono)", fontSize: 11
                                        }}>
                                            {r.flat}
                                        </span>
                                    </TD>

                                    <TD style={{ textAlign: "right" }}>
                                        <span style={{
                                            color: "var(--text-primary)", fontFamily: "var(--font-mono)",
                                            fontWeight: 600
                                        }}>{fmtFull(r.amount)}</span>
                                    </TD>

                                    <TD>
                                        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{r.date}</span>
                                    </TD>

                                    <TD>
                                        <div style={{ display: "flex", gap: 4 }}>
                                            {r.sent.includes("Email") && (
                                                <span style={{
                                                    background: "rgba(0,180,216,0.1)", color: "var(--accent-blue)",
                                                    borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 600,
                                                    display: "flex", alignItems: "center", gap: 3
                                                }}>
                                                    <Mail size={10} /> Email
                                                </span>
                                            )}
                                            {r.sent.includes("SMS") && (
                                                <span style={{
                                                    background: "rgba(0,212,170,0.1)", color: "var(--accent-teal)",
                                                    borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 600,
                                                    display: "flex", alignItems: "center", gap: 3
                                                }}>
                                                    <Phone size={10} /> SMS
                                                </span>
                                            )}
                                        </div>
                                    </TD>

                                    <TD><Pill status={r.status} /></TD>

                                    <TD>
                                        <div style={{ display: "flex", gap: 4 }}>
                                            <TableBtn icon={Eye} color="var(--accent-teal)" onClick={() => { }} title="View" />
                                            <TableBtn icon={RefreshCw} color="var(--accent-blue)" onClick={() => handleResend(r)} title="Resend" />
                                            <TableBtn icon={Trash2} color="#ff6b6b" onClick={() => handleDelete(r)} title="Delete" />
                                        </div>
                                    </TD>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* ── Compose Modal ── */}
            <Modal open={showCompose} onClose={() => setShowCompose(false)} title="Compose Acknowledgement">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <FS label="Type" field="type" options={COMPOSE_TYPES} form={form} setForm={setForm} />
                    <FI label="Resident Name" field="resident" form={form} setForm={setForm} />
                    <FI label="Flat No." field="flat" form={form} setForm={setForm} />
                    <FI label="Amount (₹)" field="amount" type="number" form={form} setForm={setForm} />
                    <FS label="Send Via" field="sent" options={SEND_VIA_OPTIONS} form={form} setForm={setForm} />
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                    <BtnGhost onClick={() => setShowCompose(false)}>Cancel</BtnGhost>
                    <BtnPrimary color="purple" onClick={handleCompose}>
                        <Send size={14} /> Send Now
                    </BtnPrimary>
                </div>
            </Modal>
        </div>
    );
}