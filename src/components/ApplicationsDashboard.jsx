// @ts-nocheck
// ApplicationsDashboard.jsx
// Main Applications tab — left sidebar + switch-case renders each sub-dashboard

import React, { useState } from "react";
import {
  AppWindow,
  Key,
  UserCheck,
  Phone,
  Home,
  Wrench,
  Waves,
  // HandHelping,
  MessageSquare,
  FolderOpen,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";

// ── Sub-dashboard imports ─────────────────────────────────────────────────────
import GatePassDashboard        from "./GatepassDashboard";
import NameChangeDashboard      from "./NameChangeDashboard";
import ContactUpdateDashboard   from "./Contactupdatedashboard";
import FlatResaleDashboard      from "./Flatresaledashboard";
import InteriorWorkDashboard    from "./Interiorworkdashboard";
import SwimmingPoolDashboard    from "./Swimmingpooldashboard";
// import HelpersDashboard         from "./HelpersDashboard";
import EnquiryDashboard         from "./EnquiryDashboard";
import DocumentSubmissionDashboard from "./Documentsubmissiondashboard";

// ── Sidebar menu items ────────────────────────────────────────────────────────
const MENU_ITEMS = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    color: "#00b4d8",
    bg: "rgba(0,180,216,0.12)",
    description: "All applications summary",
  },
  {
    id: "gate_pass",
    label: "Gate Pass",
    icon: Key,
    color: "#00b4d8",
    bg: "rgba(0,180,216,0.12)",
    description: "Visitor & vehicle entry",
  },
  {
    id: "name_change",
    label: "Name Change",
    icon: UserCheck,
    color: "#6c63ff",
    bg: "rgba(108,99,255,0.12)",
    description: "Change in flat owner name",
  },
  {
    id: "contact_update",
    label: "Contact Update",
    icon: Phone,
    color: "#00d4aa",
    bg: "rgba(0,212,170,0.12)",
    description: "Phone / email update",
  },
  {
    id: "flat_resale",
    label: "Flat Resale",
    icon: Home,
    color: "#ffb347",
    bg: "rgba(255,179,71,0.12)",
    description: "Property transfer requests",
  },
  {
    id: "interior_work",
    label: "Interior Work",
    icon: Wrench,
    color: "#ff6b6b",
    bg: "rgba(255,107,107,0.12)",
    description: "Renovation & interior jobs",
  },
  {
    id: "swimming_pool",
    label: "Swimming Pool",
    icon: Waves,
    color: "#22d3ee",
    bg: "rgba(34,211,238,0.12)",
    description: "Pool booking requests",
  },
  // // {
  //   id: "helpers",
  //   label: "Helpers",
  //   icon: HandHelping,
  //   color: "#a78bfa",
  //   bg: "rgba(167,139,250,0.12)",
  //   description: "Plumber, electrician & more",
  // },
  {
    id: "enquiry",
    label: "Enquiry",
    icon: MessageSquare,
    color: "#f472b6",
    bg: "rgba(244,114,182,0.12)",
    description: "General queries & complaints",
  },
  {
    id: "document_submission",
    label: "Document Submission",
    icon: FolderOpen,
    color: "#fb923c",
    bg: "rgba(251,146,60,0.12)",
    description: "Upload & track documents",
  },
];

// ── Overview summary card ─────────────────────────────────────────────────────
const OverviewCard = ({ item, onClick }) => {
  const Icon = item.icon;
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "18px 20px",
        cursor: "pointer",
        transition: "all 0.18s ease",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = item.color;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 6px 24px ${item.bg}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: item.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={20} style={{ color: item.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            color: "var(--text-primary)",
            fontWeight: 700,
            fontSize: 14,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.label}
        </p>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 12,
            margin: "3px 0 0",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.description}
        </p>
      </div>
      <ChevronRight size={16} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
    </div>
  );
};

// ── Overview screen ───────────────────────────────────────────────────────────
const OverviewScreen = ({ onNavigate }) => (
  <div style={{ padding: "28px 28px 24px" }}>
    {/* Header */}
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "rgba(0,180,216,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppWindow size={20} style={{ color: "#00b4d8" }} />
        </div>
        <div>
          <h2
            style={{
              color: "var(--text-primary)",
              fontWeight: 800,
              fontSize: 20,
              margin: 0,
            }}
          >
            Applications
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>
            Select a category to view and manage applications
          </p>
        </div>
      </div>
    </div>

    {/* Cards grid */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 14,
      }}
    >
      {MENU_ITEMS.filter((m) => m.id !== "overview").map((item) => (
        <OverviewCard key={item.id} item={item} onClick={() => onNavigate(item.id)} />
      ))}
    </div>
  </div>
);

// ── Render active dashboard via switch-case ───────────────────────────────────
const renderDashboard = (activeId, onNavigate) => {
  switch (activeId) {
    case "overview":
      return <OverviewScreen onNavigate={onNavigate} />;

    case "gate_pass":
      return <GatePassDashboard />;

    case "name_change":
      return <NameChangeDashboard />;

    case "contact_update":
      return <ContactUpdateDashboard />;

    case "flat_resale":
      return <FlatResaleDashboard />;

    case "interior_work":
      return <InteriorWorkDashboard />;

    case "swimming_pool":
      return <SwimmingPoolDashboard />;

    // case "helpers":
    //   return <HelpersDashboard />;

    case "enquiry":
      return <EnquiryDashboard />;

    case "document_submission":
      return <DocumentSubmissionDashboard />;

    default:
      return <OverviewScreen onNavigate={onNavigate} />;
  }
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function ApplicationsDashboard() {
  const [activeId, setActiveId] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const activeItem = MENU_ITEMS.find((m) => m.id === activeId) || MENU_ITEMS[0];
  const ActiveIcon = activeItem.icon;

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        minHeight: "calc(100vh - 60px)",
        background: "var(--bg-base)",
        overflow: "hidden",
      }}
    >
      {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
      <aside
        style={{
          width: sidebarCollapsed ? 64 : 230,
          minWidth: sidebarCollapsed ? 64 : 230,
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.22s ease, min-width 0.22s ease",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            padding: sidebarCollapsed ? "16px 0" : "16px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarCollapsed ? "center" : "space-between",
            flexShrink: 0,
          }}
        >
          {!sidebarCollapsed && (
            <span
              style={{
                color: "var(--text-primary)",
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: "0.4px",
                textTransform: "uppercase",
                opacity: 0.7,
              }}
            >
              Categories
            </span>
          )}
          {/* Toggle button */}
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border)",
              borderRadius: 7,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-secondary)",
              transition: "background 0.15s",
              flexShrink: 0,
            }}
          >
            <ChevronRight
              size={14}
              style={{
                transform: sidebarCollapsed ? "rotate(0deg)" : "rotate(180deg)",
                transition: "transform 0.22s ease",
              }}
            />
          </button>
        </div>

        {/* Sidebar menu */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveId(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: sidebarCollapsed ? "11px 0" : "11px 14px",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  background: isActive ? item.bg : "transparent",
                  border: "none",
                  borderLeft: isActive
                    ? `3px solid ${item.color}`
                    : "3px solid transparent",
                  cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                  borderRadius: sidebarCollapsed ? 0 : "0 8px 8px 0",
                  marginBottom: 1,
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Icon with colored bg when active */}
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: isActive ? item.bg : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.15s",
                  }}
                >
                  <Icon
                    size={16}
                    style={{
                      color: isActive ? item.color : "var(--text-secondary)",
                      transition: "color 0.15s",
                    }}
                  />
                </div>

                {/* Label — hidden when collapsed */}
                {!sidebarCollapsed && (
                  <span
                    style={{
                      color: isActive ? item.color : "var(--text-secondary)",
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      transition: "color 0.15s",
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer — active section label */}
        {!sidebarCollapsed && (
          <div
            style={{
              padding: "12px 14px",
              borderTop: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: activeItem.bg,
                borderRadius: 9,
                padding: "8px 10px",
              }}
            >
              <ActiveIcon size={14} style={{ color: activeItem.color, flexShrink: 0 }} />
              <span
                style={{
                  color: activeItem.color,
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {activeItem.label}
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* ── RIGHT CONTENT AREA ───────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          minWidth: 0,
        }}
      >
        {renderDashboard(activeId, setActiveId)}
      </main>
    </div>
  );
}