import React, { useState } from 'react';
import { LayoutDashboard, FileText, Database, GitBranch, AppWindow, Megaphone, MessageSquare, Users, Landmark, Car, Bell, HandHelping, ChevronLeft, ChevronRight, PawPrint, CalendarCheck, Receipt, LogOut, Lock, ChevronDown, ChevronUp, LucideCreditCard, Gift, Home } from 'lucide-react';
import { APP_NAME, APP_TAGLINE, LOGO_SRC, LOGO_ACCENT_COLOR } from '../logo';
import { canAccess } from '../auth';
const iconMap = {
    LayoutDashboard, FileText, Database, GitBranch, AppWindow,
    Megaphone, MessageSquare, Users, Landmark, Car, Bell, HandHelping,
    PawPrint, CalendarCheck, Receipt, LucideCreditCard, Gift, Home,
};
const ALL_NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'Accounts', label: 'Accounts', icon: 'FileText' },
    // { id: 'invoice', label: 'Invoice', icon: 'Receipt' },
    { id: 'masters', label: 'Masters', icon: 'Database' },
    { id: 'parent-entity', label: 'Parent Entity', icon: 'GitBranch' },
    { id: 'applications', label: 'Applications', icon: 'AppWindow' },
    { id: 'announcement', label: 'Announcement', icon: 'Megaphone' },
    { id: 'complaints', label: 'Complaints', icon: 'MessageSquare' },
    { id: 'tenant', label: 'Tenant', icon: 'Users' },
    { id: 'loans', label: 'Loans', icon: 'Landmark' },
    { id: 'parking', label: 'Parking', icon: 'Car' },
    { id: 'notice', label: 'Notice', icon: 'Bell' },
    { id: 'helpers', label: 'Helpers', icon: 'HandHelping' },
    { id: 'pet', label: 'Pet', icon: 'PawPrint' },
    { id: 'visits', label: 'Visits', icon: 'CalendarCheck' },
    { id: 'occasion', label: 'Occasions', icon: 'Gift' },
    // { id: 'property', label: 'Property', icon: 'Home' },
    // { id: 'charge-master', label: 'Charge Master', icon: 'LucideCreditCard' },
    // {id: 'committee', label: 'Committee', icon: 'shield'},
];
const THEMES = [
    { id: 'dark', label: 'Dark' },
    { id: 'light', label: 'Light' },
    { id: 'ocean', label: 'Ocean' },
    { id: 'forest', label: 'Forest' },
    { id: 'sunset', label: 'Sunset' },
    { id: 'rose', label: 'Rose' },
    { id: 'midnight', label: 'Midnight' },
    { id: 'nord', label: 'Nord' },
];
const ROLE_COLORS = {
    'Super Admin': '#00d4aa',
    'Billing Manager': '#6c63ff',
    'Tenant Manager': '#00b4d8',
    'Facility Manager': '#ffb347',
    'Loans Officer': '#ff6b6b',
};
export default function Sidebar({ activeNav, setActiveNav, theme, setTheme, user, onLogout }) {
    var _a;
    const [collapsed, setCollapsed] = useState(false);
    const [showThemes, setShowThemes] = useState(false);
    const navItems = ALL_NAV.filter((item) => canAccess(user, item.id));
    const roleColor = (_a = ROLE_COLORS[user.role]) !== null && _a !== void 0 ? _a : '#00d4aa';
    return (<aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        {LOGO_SRC ? (<img src={LOGO_SRC} alt={APP_NAME} className="logo-image"/>) : (<div className="logo-text-wrap">
            <div className="logo-icon-badge"><span>S</span></div>
            {!collapsed && (<div className="logo-text-block">
                <span className="logo-name" style={{ color: LOGO_ACCENT_COLOR }}>{APP_NAME}</span>
                <span className="logo-sub">{APP_TAGLINE}</span>
              </div>)}
          </div>)}
      </div>

      <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
      </button>

      {!collapsed && (<div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `${roleColor}22`, color: roleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {user.avatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--sidebar-text, #e8edf5)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ color: roleColor, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{user.role}</div>
          </div>
        </div>)}

      <nav className="sidebar-nav">
        {!collapsed && <p className="nav-label">MENU</p>}
        {navItems.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = activeNav === item.id;
            return (<button key={item.id} className={`nav-item ${isActive ? 'active' : ''}`} onClick={() => setActiveNav(item.id)} title={collapsed ? item.label : ''}>
              <span className="nav-icon">{Icon && <Icon size={18}/>}</span>
              {!collapsed && <span className="nav-label-text">{item.label}</span>}
              {isActive && !collapsed && <span className="nav-active-dot"/>}
            </button>);
        })}

        {!collapsed && user.access !== '*' && (<>
            <p className="nav-label" style={{ marginTop: 8 }}>RESTRICTED</p>
            {ALL_NAV.filter((i) => !canAccess(user, i.id)).slice(0, 4).map((item) => {
                const Icon = iconMap[item.icon];
                return (<div key={item.id} className="nav-item" style={{ opacity: 0.35, cursor: 'not-allowed', pointerEvents: 'none' }} title={`No access: ${item.label}`}>
                  <span className="nav-icon">{Icon && <Icon size={18}/>}</span>
                  <span className="nav-label-text">{item.label}</span>
                  <Lock size={11} style={{ marginLeft: 'auto', opacity: 0.6 }}/>
                </div>);
            })}
          </>)}
      </nav>

      {!collapsed && (<div className="theme-switcher">
          <button onClick={() => setShowThemes((v) => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <span className="theme-switcher-label" style={{ cursor: 'pointer' }}>Theme</span>
            {showThemes ? <ChevronUp size={12} color="var(--text-muted)"/> : <ChevronDown size={12} color="var(--text-muted)"/>}
          </button>
          {showThemes && (<div className="theme-dots" style={{ marginTop: 8 }}>
              {THEMES.map((t) => (<button key={t.id} className={`theme-dot ${theme === t.id ? 'active' : ''}`} data-t={t.id} title={t.label} onClick={() => setTheme(t.id)}/>))}
            </div>)}
        </div>)}

      <div style={{ padding: collapsed ? '10px 8px' : '10px 10px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
        <button onClick={onLogout} className="nav-item" style={{ width: '100%', color: '#ff6b6b' }} title={collapsed ? 'Logout' : ''}>
          <span className="nav-icon"><LogOut size={18}/></span>
          {!collapsed && <span className="nav-label-text">Logout</span>}
        </button>
      </div>
    </aside>);
}
