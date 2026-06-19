// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { PawPrint, Plus, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, Building2, CheckCircle, ChevronDown } from "lucide-react";
import { getAllPetsApi, createPetsApi, updatePetsApi, deletePetsApi } from "../api/pets-api";
import { getAllSocietyApi } from "../api/society-api";
import { getAllPropertyApi } from "../api/property-api";
import { getSocietyMembersApi, getAllMembersApi } from "../api/member-api";
import { useAppContext } from "../AppContext";


const PET_TYPES = ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Other"];

// ── Photo URL helper ───────────────────────────────────────────
const photoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/api")) return `http://3.7.149.91:8007${path}`;
    return `${BASE_URL}${path}`;
};

// ── Map raw API pet → UI shape ─────────────────────────────────
const mapPet = (item) => ({
    id:                 item.id                 || "",
    petType:            item.petType            || item.type || "Other",
    petName:            item.petName            || item.name || "—",
    age:                item.age                ?? "",
    isVaccinated:       item.isVaccinated       ?? item.vaccinated ?? false,
    petPhotoFilePath:   item.petPhotoFilePath   || "",
    propertyIdentifier: item.propertyIdentifier || item.flatNo || "",
    userIdentifier:     item.userIdentifier     || item.ownerName || "",
    societyIdentifier:  item.societyIdentifier  || item.society?.societyIdentifier || "",
    createdAt:          item.createdAt          || "",
    isDeleted:          item.isDeleted          || false,
});

const inputStyle = {
    width: "100%", background: "var(--input-bg)", border: "1px solid var(--input-border)",
    borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13,
    outline: "none", boxSizing: "border-box",
};

// ══════════════════════════════════════════════════════════════
// ── Society Search Engine (same pattern as AnnouncementDashboard)
// ══════════════════════════════════════════════════════════════
function SocietySearchEngine({ societies, selectedSociety, onSelect, loading }) {
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

    const filtered = societies.filter(s => {
        const q = query.toLowerCase();
        return (s.societyName || "").toLowerCase().includes(q) ||
               (s.societyIdentifier || "").toLowerCase().includes(q);
    });

    const displayName = selectedSociety
        ? (selectedSociety.societyName || selectedSociety.societyIdentifier || "Society")
        : "All Societies";

    return (
        <div ref={ref} style={{ position: "relative", minWidth: 280 }}>
            {/* Trigger button */}
            <button onClick={() => setOpen(v => !v)} style={{
                display: "flex", alignItems: "center", gap: 8,
                background: selectedSociety ? "rgba(0,212,170,0.08)" : "var(--bg-card)",
                border: `1.5px solid ${selectedSociety ? "rgba(0,212,170,0.4)" : "var(--border-strong)"}`,
                borderRadius: 10, padding: "8px 14px", color: "var(--text-primary)",
                fontSize: 13, cursor: "pointer", fontWeight: 600, width: "100%",
                justifyContent: "space-between", transition: "all 0.15s",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Building2 size={14} style={{ color: selectedSociety ? "#00d4aa" : "#8899aa", flexShrink: 0 }} />
                    <span style={{ color: selectedSociety ? "#00d4aa" : "var(--text-primary)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {displayName}
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {loading && <RefreshCw size={11} style={{ color: "#8899aa", animation: "spin 1s linear infinite" }} />}
                    {selectedSociety && (
                        <button onClick={e => { e.stopPropagation(); onSelect(null); }}
                            style={{ background: "none", border: "none", padding: "0 2px", cursor: "pointer", color: "#8899aa", display: "flex", alignItems: "center" }}>
                            <X size={12} />
                        </button>
                    )}
                    <ChevronDown size={12} style={{ color: "#8899aa", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s" }} />
                </div>
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                    background: "var(--bg-surface, #0f1923)", border: "1px solid var(--border-strong)",
                    borderRadius: 12, zIndex: 500, boxShadow: "0 16px 48px rgba(0,0,0,0.5)", overflow: "hidden",
                }}>
                    {/* Search input */}
                    <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ position: "relative" }}>
                            <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#8899aa" }} />
                            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                                placeholder="Search society name or ID..."
                                style={{ ...inputStyle, padding: "7px 10px 7px 28px", fontSize: 12, background: "rgba(255,255,255,0.06)" }} />
                        </div>
                    </div>
                    {/* Options */}
                    <div style={{ maxHeight: 240, overflowY: "auto" }}>
                        {/* All Societies */}
                        <button onClick={() => { onSelect(null); setOpen(false); setQuery(""); }}
                            style={{
                                width: "100%", textAlign: "left", padding: "10px 14px",
                                background: !selectedSociety ? "rgba(0,212,170,0.08)" : "none",
                                border: "none", cursor: "pointer", color: !selectedSociety ? "#00d4aa" : "var(--text-primary)",
                                fontSize: 12, fontWeight: !selectedSociety ? 700 : 400,
                                display: "flex", alignItems: "center", gap: 8,
                            }}>
                            {!selectedSociety && <CheckCircle size={12} style={{ color: "#00d4aa" }} />}
                            <span>All Societies</span>
                        </button>
                        {filtered.length === 0 && (
                            <div style={{ padding: "12px 14px", color: "#8899aa", fontSize: 12, textAlign: "center" }}>No societies found</div>
                        )}
                        {filtered.map(s => {
                            const isActive = selectedSociety?.societyIdentifier === s.societyIdentifier;
                            return (
                                <button key={s.societyIdentifier}
                                    onClick={() => { onSelect(s); setOpen(false); setQuery(""); }}
                                    style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: isActive ? "rgba(0,212,170,0.08)" : "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "none"; }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: isActive ? "rgba(0,212,170,0.15)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: isActive ? "#00d4aa" : "#8899aa" }}>
                                        {(s.societyName || s.societyIdentifier || "S").charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ color: isActive ? "#00d4aa" : "var(--text-primary)", fontSize: 12, fontWeight: isActive ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {s.societyName || s.societyIdentifier}
                                        </div>
                                        <div style={{ color: "#8899aa", fontSize: 10 }}>{s.societyIdentifier}</div>
                                    </div>
                                    {isActive && <CheckCircle size={13} style={{ color: "#00d4aa", flexShrink: 0 }} />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Pagination ──────────────────────────────────────────────────
const Pagination = ({ page, total, perPage, onChange }) => {
    const pages = Math.max(1, Math.ceil(total / perPage));
    const vis = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) vis.push(i);
    const btn = (onClick, disabled, icon) => (
        <button onClick={onClick} disabled={disabled} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: disabled ? "#556677" : "#8899aa", cursor: disabled ? "not-allowed" : "pointer" }}>{icon}</button>
    );
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
            <span style={{ color: "#8899aa", fontSize: 12 }}>
                Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}
            </span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {btn(() => onChange(1), page === 1, <ChevronsLeft size={12} />)}
                {btn(() => onChange(page - 1), page === 1, <ChevronLeft size={12} />)}
                {vis.map(p => (
                    <button key={p} onClick={() => onChange(p)} style={{ background: p === page ? "#00d4aa" : "none", border: `1px solid ${p === page ? "#00d4aa" : "var(--border)"}`, borderRadius: 6, padding: "4px 10px", color: p === page ? "#000" : "#8899aa", fontWeight: p === page ? 700 : 400, cursor: "pointer", fontSize: 12, minWidth: 30 }}>{p}</button>
                ))}
                {btn(() => onChange(page + 1), page === pages, <ChevronRight size={12} />)}
                {btn(() => onChange(pages), page === pages, <ChevronsRight size={12} />)}
            </div>
        </div>
    );
};

// ── Text input field ────────────────────────────────────────────
const FI = ({ label, field, type = "text", form, setForm, required }) => (
    <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 12, marginBottom: 6 }}>
            {label}{required && <span style={{ color: "#ff6b6b" }}> *</span>}
        </label>
        <input type={type} value={form[field] ?? ""} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            style={inputStyle} />
    </div>
);

// ── Static select field ─────────────────────────────────────────
const FS = ({ label, field, options, form, setForm }) => (
    <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 12, marginBottom: 6 }}>{label}</label>
        <select value={form[field] ?? ""} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            style={{ ...inputStyle, cursor: "pointer" }}>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    </div>
);

// ── Backend-connected dropdown field ───────────────────────────
const FD = ({ label, field, options, form, setForm, placeholder, required, loading, disabled }) => (
    <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 12, marginBottom: 6 }}>
            {label}{required && <span style={{ color: "#ff6b6b" }}> *</span>}
            {loading && <span style={{ color: "#8899aa", marginLeft: 6, fontSize: 11 }}>loading...</span>}
        </label>
        <select value={form[field] ?? ""} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            disabled={disabled || loading}
            style={{ ...inputStyle, color: form[field] ? "var(--text-primary)" : "#8899aa", opacity: (disabled || loading) ? 0.6 : 1, cursor: (disabled || loading) ? "not-allowed" : "pointer" }}>
            <option value="">{loading ? "Loading..." : (placeholder || `Select ${label}`)}</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </div>
);

// ── Empty form ──────────────────────────────────────────────────
const emptyForm = {
    petName: "", petType: "Dog", age: "", isVaccinated: false,
    societyIdentifier: "",
    propertyIdentifier: "", userIdentifier: "", photo: null,
};

// ══════════════════════════════════════════════════════════════
// ── Main Component
// ══════════════════════════════════════════════════════════════
export default function PetDashboard() {

    // ── AppContext — shared state with Dashboard & other tabs ──
    const {
        selectedSociety,
        setSelectedSociety,
        societies: contextSocieties,
    } = useAppContext();

    const [pets, setPets]         = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);
    const [search, setSearch]     = useState("");
    const [page, setPage]         = useState(1);
    const PER = 8;

    const [modal, setModal]       = useState(null);
    const [form, setForm]         = useState(emptyForm);
    const [saving, setSaving]     = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // ── Societies list for the search engine ──────────────────
    const [allSocieties,      setAllSocieties]      = useState([]);
    const [societiesLoading,  setSocietiesLoading]  = useState(false);

    // ── Properties & members for form dropdowns ───────────────
    const [allProperties,     setAllProperties]     = useState([]);
    const [allMembers,        setAllMembers]         = useState([]);
    const [propertiesLoading, setPropertiesLoading] = useState(false);
    const [membersLoading,    setMembersLoading]    = useState(false);

    // ── Extract array from any API response shape ─────────────
    const extractArr = (res) => {
        const raw = res?.data;
        if (Array.isArray(raw))          return raw;
        if (Array.isArray(raw?.data))    return raw.data;
        if (Array.isArray(raw?.pets))    return raw.pets;
        if (Array.isArray(raw?.results)) return raw.results;
        if (raw && typeof raw === "object") {
            const first = Object.values(raw).find(v => Array.isArray(v));
            if (first) return first;
        }
        return [];
    };

    // ── Fetch societies list ──────────────────────────────────
    useEffect(() => {
        (async () => {
            setSocietiesLoading(true);
            try {
                const res = await getAllSocietyApi();
                const list = res?.data?.data || res?.data || [];
                setAllSocieties(Array.isArray(list) ? list : []);
            } catch {
                // fallback to context societies
                if (contextSocieties?.length > 0) {
                    setAllSocieties(contextSocieties.map(s => ({
                        societyIdentifier: s.societyIdentifier || s.identifier || s.id,
                        societyName: s.societyName || s.name || s.societyIdentifier,
                    })));
                }
            } finally { setSocietiesLoading(false); }
        })();
    }, []);

    // ── Fetch pets — re-runs when selectedSociety / allSocieties changes ──
    const fetchPets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (selectedSociety?.societyIdentifier) {
                // ── Single society selected ──────────────────────
                const res = await getAllPetsApi(selectedSociety.societyIdentifier);
                const arr = extractArr(res);
                setPets(arr.map(mapPet));
            } else {
                // ── All Societies — fetch from every society in parallel ──
                const sids = allSocieties
                    .map(s => s.societyIdentifier || s.identifier || s.id)
                    .filter(Boolean);

                if (sids.length === 0) {
                    // No societies loaded yet — try a single call without filter
                    const res = await getAllPetsApi(undefined);
                    const arr = extractArr(res);
                    setPets(arr.map(mapPet));
                } else {
                    const results = await Promise.allSettled(
                        sids.map(sid => getAllPetsApi(sid))
                    );
                    const combined = [];
                    const seen = new Set();
                    results.forEach(r => {
                        if (r.status === "fulfilled") {
                            extractArr(r.value).forEach(item => {
                                const mapped = mapPet(item);
                                if (mapped.id && !seen.has(mapped.id)) {
                                    seen.add(mapped.id);
                                    combined.push(mapped);
                                } else if (!mapped.id) {
                                    combined.push(mapped);
                                }
                            });
                        }
                    });
                    setPets(combined);
                }
            }
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to load pets");
        } finally {
            setLoading(false);
        }
    }, [selectedSociety, allSocieties]);

    useEffect(() => { fetchPets(); }, [fetchPets]);

    // ── Fetch properties & members when society changes ───────
    useEffect(() => {
        const sid = selectedSociety?.societyIdentifier || "";
        if (!sid) {
            setAllProperties([]);
            setAllMembers([]);
            return;
        }

        // Properties
        setPropertiesLoading(true);
        getAllPropertyApi(null, sid)
            .then(res => {
                const list = res?.data?.data || res?.data || [];
                setAllProperties(Array.isArray(list) ? list : []);
            })
            .catch(() => setAllProperties([]))
            .finally(() => setPropertiesLoading(false));

        // Members
        setMembersLoading(true);
        getSocietyMembersApi(sid)
            .then(res => {
                const list = res?.data?.data || res?.data || [];
                setAllMembers(Array.isArray(list) ? list : []);
            })
            .catch(() => {
                getAllMembersApi()
                    .then(res => {
                        const list = res?.data?.data || res?.data || [];
                        setAllMembers(Array.isArray(list) ? list : []);
                    })
                    .catch(() => setAllMembers([]));
            })
            .finally(() => setMembersLoading(false));
    }, [selectedSociety]);

    // ── Auto-fill society in form when selectedSociety changes ─
    useEffect(() => {
        if (modal !== "add") return;
        setForm(prev => ({
            ...prev,
            societyIdentifier: selectedSociety?.societyIdentifier || "",
            propertyIdentifier: "",
            userIdentifier: "",
        }));
    }, [selectedSociety, modal]);

    // ── Build dropdown option lists ───────────────────────────
    const societyOptions = useMemo(() =>
        allSocieties.map(s => ({
            value: s.societyIdentifier,
            label: s.societyName ? `${s.societyName} (${s.societyIdentifier})` : s.societyIdentifier,
        })),
    [allSocieties]);

    const propertyOptions = useMemo(() =>
        allProperties
            .filter(p => p.propertyIdentifier)
            .map(p => ({
                value: p.propertyIdentifier,
                label: p.propertyName ? `${p.propertyName} (${p.propertyIdentifier})` : p.propertyIdentifier,
            })),
    [allProperties]);

    const memberOptions = useMemo(() =>
        allMembers
            .filter(m => m.userIdentifier || m.identifier || m.id)
            .map(m => {
                const val  = m.userIdentifier || m.identifier || m.id || "";
                // Try every possible name field the backend might return
                const firstName = m.firstName || m.first_name || "";
                const lastName  = m.lastName  || m.last_name  || "";
                const fullName  = m.name || m.fullName || m.full_name || m.userName || m.user_name || "";
                const name = fullName || [firstName, lastName].filter(Boolean).join(" ");
                // Fallback: use memberType / role as readable label prefix
                const type = m.memberType || m.member_type || m.type || m.role || "";
                if (name && name.trim()) {
                    return { value: val, label: `${name.trim()} (${val})` };
                } else if (type) {
                    const typeLabel = type.replace(/\b\w/g, c => c.toUpperCase());
                    return { value: val, label: `${typeLabel} — ${val}` };
                } else {
                    return { value: val, label: val };
                }
            }),
    [allMembers]);

    // ── Filter & paginate ────────────────────────────────────
    const filtered = pets.filter(p => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (p.petName || "").toLowerCase().includes(q) ||
            (p.petType || "").toLowerCase().includes(q) ||
            (p.propertyIdentifier || "").toLowerCase().includes(q) ||
            (p.userIdentifier || "").toLowerCase().includes(q)
        );
    });
    const paged = filtered.slice((page - 1) * PER, page * PER);

    // ── Open Add ─────────────────────────────────────────────
    const openAdd = () => {
        setForm({
            ...emptyForm,
            societyIdentifier: selectedSociety?.societyIdentifier || "",
        });
        setSaveError(null);
        setModal("add");
    };

    // ── Open Edit ────────────────────────────────────────────
    const openEdit = (pet) => {
        setForm({
            id:                 pet.id,
            petName:            pet.petName,
            petType:            pet.petType,
            age:                pet.age,
            isVaccinated:       pet.isVaccinated,
            societyIdentifier:  pet.societyIdentifier || selectedSociety?.societyIdentifier || "",
            propertyIdentifier: pet.propertyIdentifier,
            userIdentifier:     pet.userIdentifier || "",
            photo:              null,
            _existingPhoto:     pet.petPhotoFilePath,
        });
        setSaveError(null);
        setModal("edit");
    };

    // ── Save ─────────────────────────────────────────────────
    const save = async () => {
        if (!form.petName?.trim()) { setSaveError("Pet name is required"); return; }
        setSaving(true);
        setSaveError(null);
        try {
            const buildFd = () => {
                const fd = new FormData();
                fd.append("petName",      form.petName.trim());
                fd.append("petType",      form.petType || "Dog");
                fd.append("age",          String(form.age || ""));
                fd.append("isVaccinated", String(form.isVaccinated === true || form.isVaccinated === "true"));
                if (form.societyIdentifier)  fd.append("societyIdentifier",  form.societyIdentifier);
                if (form.propertyIdentifier) fd.append("propertyIdentifier", form.propertyIdentifier);
                if (form.userIdentifier)     fd.append("userIdentifier",     form.userIdentifier);
                if (form.photo instanceof File) fd.append("petPhoto", form.photo);
                return fd;
            };

            if (modal === "edit" && form.id) {
                if (form.photo instanceof File) {
                    await updatePetsApi(buildFd(), form.id);
                } else {
                    const payload = {
                        petName: form.petName.trim(), petType: form.petType || "Dog",
                        age: form.age || "", isVaccinated: form.isVaccinated === true || form.isVaccinated === "true",
                    };
                    if (form.societyIdentifier)  payload.societyIdentifier  = form.societyIdentifier;
                    if (form.propertyIdentifier) payload.propertyIdentifier = form.propertyIdentifier;
                    if (form.userIdentifier)     payload.userIdentifier     = form.userIdentifier;
                    await updatePetsApi(payload, form.id);
                }
            } else {
                await createPetsApi(buildFd());
            }
            setModal(null);
            await fetchPets();
        } catch (err) {
            setSaveError(err?.response?.data?.message || err?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ───────────────────────────────────────────────
    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await deletePetsApi(deleteId);
            setDeleteId(null);
            await fetchPets();
        } catch (err) {
            alert(err?.response?.data?.message || err?.message || "Delete failed");
        } finally {
            setDeleting(false);
        }
    };

    // ── Stats ────────────────────────────────────────────────
    const totalPets     = pets.length;
    const vaccinatedCnt = pets.filter(p => p.isVaccinated).length;
    const notVaccCnt    = pets.filter(p => !p.isVaccinated).length;

    const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px" };

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>

            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, var(--accent-teal), var(--accent-blue))", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <PawPrint size={20} color="#fff" />
                    </div>
                    <div>
                        <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>Pet Registry</h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>Manage society pet registrations</p>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={fetchPets} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 14px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, var(--accent-teal), var(--accent-blue))", border: "none", borderRadius: 10, padding: "9px 18px", color: "#000", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                        <Plus size={15} /> Add Pet
                    </button>
                </div>
            </div>

            {/* ── Society Search Engine (synced with Dashboard) ── */}
            <div style={{ marginBottom: 16 }}>
                <SocietySearchEngine
                    societies={allSocieties}
                    selectedSociety={selectedSociety}
                    onSelect={(s) => { setSelectedSociety(s); setPage(1); setSearch(""); }}
                    loading={societiesLoading}
                />
                {selectedSociety && (
                    <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.15)", borderRadius: 8, fontSize: 12, color: "#8899aa" }}>
                        Showing pets for{" "}
                        <strong style={{ color: "#00d4aa" }}>{selectedSociety.societyName || selectedSociety.societyIdentifier}</strong>
                        {" "}({selectedSociety.societyIdentifier}) · Society will be pre-filled when adding a new pet.
                    </div>
                )}
            </div>

            {/* ── Stat Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
                {[
                    { label: "Total Pets",    value: totalPets,     color: "#00d4aa", bg: "rgba(0,212,170,0.12)" },
                    { label: "Vaccinated",     value: vaccinatedCnt, color: "#6c63ff", bg: "rgba(108,99,255,0.12)" },
                    { label: "Not Vaccinated", value: notVaccCnt,   color: "#ff6b6b", bg: "rgba(255,107,107,0.12)" },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 44, height: 44, background: bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <PawPrint size={20} color={color} />
                        </div>
                        <div>
                            <p style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 700 }}>{value}</p>
                            <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Table Card ── */}
            <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
                        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search by name, type, property..."
                            style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, padding: "8px 12px 8px 32px", color: "var(--text-primary)", fontSize: 13, outline: "none" }} />
                    </div>
                    {search && <span style={{ color: "#8899aa", fontSize: 12 }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>}
                </div>

                {loading && (
                    <div style={{ textAlign: "center", padding: 50, color: "var(--text-muted)" }}>
                        <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 8 }} />
                        <p>Loading pets...</p>
                    </div>
                )}
                {!loading && error && (
                    <div style={{ textAlign: "center", padding: 40, color: "#ff6b6b" }}>
                        <p>{error}</p>
                        <button onClick={fetchPets} style={{ marginTop: 12, padding: "8px 18px", background: "rgba(255,107,107,0.1)", border: "1px solid #ff6b6b", borderRadius: 8, color: "#ff6b6b", cursor: "pointer" }}>Retry</button>
                    </div>
                )}

                {!loading && !error && (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                    {["S.No", "Photo", "Pet Type", "Name", "Age", "Vaccinated", "Property", "Owner", "Actions"].map(h => (
                                        <th key={h} style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 10, fontWeight: 700, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((pet, idx) => (
                                    <tr key={pet.id || idx}
                                        style={{ borderBottom: "1px solid var(--border)" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <td style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: 13 }}>{(page - 1) * PER + idx + 1}</td>
                                        <td style={{ padding: "10px 14px" }}>
                                            {photoUrl(pet.petPhotoFilePath) ? (
                                                <img src={photoUrl(pet.petPhotoFilePath)} alt={pet.petName}
                                                    style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)" }}
                                                    onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                                            ) : null}
                                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(0,212,170,0.12)", display: photoUrl(pet.petPhotoFilePath) ? "none" : "flex", alignItems: "center", justifyContent: "center" }}>
                                                <PawPrint size={18} color="#00d4aa" />
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <span style={{ background: "rgba(108,99,255,0.12)", color: "#6c63ff", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{pet.petType || "—"}</span>
                                        </td>
                                        <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}>{pet.petName || "—"}</td>
                                        <td style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: 13 }}>
                                            {pet.age !== "" && pet.age !== null && pet.age !== undefined ? `${pet.age} yr${pet.age == 1 ? "" : "s"}` : "—"}
                                        </td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <span style={{ color: pet.isVaccinated ? "#00d4aa" : "#ff6b6b", background: pet.isVaccinated ? "rgba(0,212,170,0.1)" : "rgba(255,107,107,0.1)", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                                                {pet.isVaccinated ? "Yes" : "No"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: 12, fontFamily: "var(--font-mono)" }}>{pet.propertyIdentifier || "—"}</td>
                                        <td style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: 12 }}>{pet.userIdentifier || "—"}</td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <button onClick={() => openEdit(pet)} title="Edit"
                                                    style={{ background: "rgba(108,99,255,0.1)", border: "none", borderRadius: 6, padding: "5px 8px", color: "var(--accent-purple)", cursor: "pointer" }}>
                                                    <Edit2 size={13} />
                                                </button>
                                                <button onClick={() => setDeleteId(pet.id)} title="Delete"
                                                    style={{ background: "rgba(255,107,107,0.1)", border: "none", borderRadius: 6, padding: "5px 8px", color: "#ff6b6b", cursor: "pointer" }}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {paged.length === 0 && !loading && (
                            <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                                <PawPrint size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
                                <p>{search ? "No pets match your search" : selectedSociety ? "No pets found for this society" : "No pets registered yet"}</p>
                            </div>
                        )}
                        <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage} />
                    </div>
                )}
            </div>

            {/* ── Add / Edit Modal ── */}
            {modal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
                    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 16, width: 540, padding: 28, maxHeight: "92vh", overflowY: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                            <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 17 }}>
                                {modal === "edit" ? "Edit Pet" : "Add New Pet"}
                            </h3>
                            <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><X size={18} /></button>
                        </div>

                        {/* ── Society dropdown (synced) ── */}
                        <div style={{ background: "rgba(0,212,170,0.04)", border: "1px solid rgba(0,212,170,0.12)", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                            <p style={{ color: "#00d4aa", fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>📍 Society</p>
                            <FD
                                label="Society Identifier"
                                field="societyIdentifier"
                                options={societyOptions}
                                form={form}
                                setForm={(updater) => {
                                    // When society changes in form, also update global selectedSociety
                                    // so property/member dropdowns refresh
                                    const next = typeof updater === "function" ? updater(form) : updater;
                                    setForm(next);
                                    if (next.societyIdentifier !== form.societyIdentifier) {
                                        const matched = allSocieties.find(s => s.societyIdentifier === next.societyIdentifier);
                                        setSelectedSociety(matched || null);
                                        // Reset dependent fields
                                        setForm(f => ({ ...f, societyIdentifier: next.societyIdentifier, propertyIdentifier: "", userIdentifier: "" }));
                                    }
                                }}
                                placeholder="Select Society"
                                required
                                loading={societiesLoading}
                            />
                        </div>

                        {/* ── Pet details ── */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                            <FI label="Pet Name" field="petName" form={form} setForm={setForm} required />
                            <FS label="Pet Type" field="petType" options={PET_TYPES} form={form} setForm={setForm} />
                            <FI label="Age (years)" field="age" type="number" form={form} setForm={setForm} />
                            <FD
                                label="Property / Flat"
                                field="propertyIdentifier"
                                options={propertyOptions}
                                form={form} setForm={setForm}
                                placeholder={form.societyIdentifier ? "Select Property" : "Select society first"}
                                loading={propertiesLoading}
                                disabled={!form.societyIdentifier}
                            />
                            <FD
                                label="Owner / Member"
                                field="userIdentifier"
                                options={memberOptions}
                                form={form} setForm={setForm}
                                placeholder={form.societyIdentifier ? "Select Member" : "Select society first"}
                                loading={membersLoading}
                                disabled={!form.societyIdentifier}
                            />
                        </div>

                        {/* Vaccinated */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                            <input type="checkbox" id="vacc" checked={!!form.isVaccinated}
                                onChange={e => setForm(f => ({ ...f, isVaccinated: e.target.checked }))}
                                style={{ width: 16, height: 16, accentColor: "#00d4aa", cursor: "pointer" }} />
                            <label htmlFor="vacc" style={{ color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>Vaccinated</label>
                        </div>

                        {/* Photo upload */}
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 12, marginBottom: 6 }}>Pet Photo</label>
                            {modal === "edit" && form._existingPhoto && !form.photo && (
                                <div style={{ marginBottom: 8 }}>
                                    <img src={photoUrl(form._existingPhoto)} alt="Current"
                                        style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", border: "2px solid var(--border)" }}
                                        onError={e => e.target.style.display = "none"} />
                                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Current photo — upload new to replace</p>
                                </div>
                            )}
                            {form.photo instanceof File && (
                                <div style={{ marginBottom: 8 }}>
                                    <img src={URL.createObjectURL(form.photo)} alt="Preview"
                                        style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", border: "2px solid #00d4aa" }}
                                        onLoad={e => { const src = e.target.src; setTimeout(() => { try { URL.revokeObjectURL(src); } catch(_){} }, 100); }} />
                                </div>
                            )}
                            <input type="file" key={modal} accept="image/*"
                                onChange={e => setForm(f => ({ ...f, photo: e.target.files[0] || null }))}
                                style={{ ...inputStyle, padding: "7px 10px", cursor: "pointer" }} />
                        </div>

                        {saveError && (
                            <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid #ff6b6b", borderRadius: 8, padding: "8px 12px", color: "#ff6b6b", fontSize: 12, marginBottom: 14 }}>
                                {saveError}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button onClick={() => setModal(null)} disabled={saving}
                                style={{ padding: "9px 20px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 9, color: "var(--text-secondary)", cursor: "pointer", fontSize: 13 }}>
                                Cancel
                            </button>
                            <button onClick={save} disabled={saving}
                                style={{ padding: "9px 22px", background: "linear-gradient(135deg, var(--accent-teal), var(--accent-blue))", border: "none", borderRadius: 9, color: "#000", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13, opacity: saving ? 0.7 : 1 }}>
                                {saving ? "Saving..." : modal === "edit" ? "Update Pet" : "Add Pet"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm ── */}
            {deleteId && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
                    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 16, width: 380, padding: 28 }}>
                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                            <div style={{ width: 56, height: 56, background: "rgba(255,107,107,0.12)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                                <Trash2 size={24} color="#ff6b6b" />
                            </div>
                            <h3 style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: 8 }}>Delete Pet?</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>This action cannot be undone. The pet record will be permanently removed.</p>
                        </div>
                        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                            <button onClick={() => setDeleteId(null)} disabled={deleting}
                                style={{ padding: "9px 24px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 9, color: "var(--text-secondary)", cursor: "pointer", fontSize: 13 }}>
                                Cancel
                            </button>
                            <button onClick={confirmDelete} disabled={deleting}
                                style={{ padding: "9px 24px", background: "#ff6b6b", border: "none", borderRadius: 9, color: "#fff", fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", fontSize: 13, opacity: deleting ? 0.7 : 1 }}>
                                {deleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}