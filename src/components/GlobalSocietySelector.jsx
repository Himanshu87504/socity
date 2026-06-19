// @ts-nocheck
import React from "react";
import { ChevronDown, Building2 } from "lucide-react";
import { useAppContext } from "../AppContext";

export default function GlobalSocietySelector() {
  const { societies, selectedSociety, setSelectedSociety } = useAppContext();

  const value = selectedSociety?.societyIdentifier || "ALL";

  const handleChange = (e) => {
    const val = e.target.value;
    if (val === "ALL") {
      setSelectedSociety(null);
      return;
    }
    const matched = societies.find(
      (s) => (s.societyIdentifier || s.id) === val
    );
    setSelectedSociety(
      matched
        ? {
            societyIdentifier: matched.societyIdentifier || matched.id,
            societyName: matched.societyName || matched.name || val,
          }
        : { societyIdentifier: val, societyName: val }
    );
  };

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <Building2
        size={14}
        style={{
          position: "absolute",
          left: 10,
          color: selectedSociety ? "#00d4aa" : "var(--text-muted)",
          pointerEvents: "none",
        }}
      />
      <select
        value={value}
        onChange={handleChange}
        title="Select a society — applies across the whole app"
        style={{
          background: selectedSociety ? "rgba(0,212,170,0.08)" : "var(--bg-card)",
          border: `1.5px solid ${selectedSociety ? "rgba(0,212,170,0.4)" : "var(--border-strong)"}`,
          borderRadius: 10,
          padding: "8px 30px 8px 32px",
          color: selectedSociety ? "#00d4aa" : "var(--text-primary)",
          fontSize: 12,
          fontWeight: selectedSociety ? 700 : 500,
          cursor: "pointer",
          outline: "none",
          fontFamily: "var(--font-body)",
          appearance: "none",
          minWidth: 180,
          maxWidth: 240,
        }}
      >
        <option value="ALL">All Societies</option>
        {societies.map((s) => (
          <option
            key={s.societyIdentifier || s.id}
            value={s.societyIdentifier || s.id}
          >
            {s.societyName || s.name}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        style={{
          position: "absolute",
          right: 9,
          color: "var(--text-muted)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
