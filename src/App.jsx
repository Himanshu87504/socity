import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import MastersDashboard from './components/MastersDashboard';
import AccountDashboard from './components/AccountsDashboard';
import ParentEntityDashboard from './components/ParentEntityDashboard';
import ApplicationsDashboard from './components/ApplicationsDashboard';
import AnnouncementDashboard from './components/AnnouncementDashboard';
import ComplaintsDashboard from './components/ComplaintsDashboard';
import TenantDashboard from './components/TenantDashboard';
import LoansDashboard from './components/LoansDashboard';
import ParkingDashboard from './components/ParkingDashboard';
import NoticeDashboard from './components/NoticeDashboard';
import HelpersDashboard from './components/HelpersDashboard';
import PetDashboard from './components/PetDashboard';
import VisitsDashboard from './components/VisitsDashboard';
import InvoiceDashboard from './components/InvoiceDashboard';
import OccasionDashboard from './components/OccasionDashboard';
import PropertyDashboard from './components/PropertyDashboard';
import ChargeMasterDashboard from './components/ChargeMasterDashboard';
import CommitteeDashboard from './components/CommitteeDashboard';
import { canAccess } from './auth';
import { AppProvider } from './AppContext';
import './App.css';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  Accounts: 'Accounts',
  masters: 'Masters',
  'parent-entity': 'Parent Entity',
  applications: 'Applications',
  announcement: 'Announcement',
  complaints: 'Complaints',
  tenant: 'Tenant',
  loans: 'Loans',
  parking: 'Parking',
  notice: 'Notice',
  helpers: 'Helpers',
  pet: 'Pet Registry',
  visits: 'Visitor Management',
  invoice: 'Invoice',
  occasion: 'Occasion Management',
  property: 'Property',
  'charge-master': 'Charge Master',
  committee: 'Committee',
};

function AccessDenied({ section, onBack }) {
  var _a;
  return (
    <div className="access-denied">
      <div className="access-denied-inner">
        <div className="access-denied-icon">🔒</div>
        <h2>Access Restricted</h2>
        <p>
          You don't have permission to view the{' '}
          <strong>{(_a = PAGE_TITLES[section]) !== null && _a !== void 0 ? _a : section}</strong> module. Contact
          your administrator to request access.
        </p>
        <button onClick={onBack} className="cs-btn" style={{ marginTop: 20 }}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// Route path → component mapping
const ROUTE_COMPONENTS = {
  dashboard:       (props) => <Dashboard {...props} />,
  Accounts:        ()     => <AccountDashboard />,
  masters:         ()     => <MastersDashboard />,
  'parent-entity': ()     => <ParentEntityDashboard />,
  applications:    ()     => <ApplicationsDashboard />,
  announcement:    ()     => <AnnouncementDashboard />,
  complaints:      ()     => <ComplaintsDashboard />,
  tenant:          ()     => <TenantDashboard />,
  loans:           ()     => <LoansDashboard />,
  parking:         ()     => <ParkingDashboard />,
  notice:          ()     => <NoticeDashboard />,
  helpers:         ()     => <HelpersDashboard />,
  pet:             ()     => <PetDashboard />,
  visits:          ()     => <VisitsDashboard />,
  invoice:         ()     => <InvoiceDashboard />,
  occasion:        ()     => <OccasionDashboard />,
  property:        ()     => <PropertyDashboard />,
  'charge-master': ()     => <ChargeMasterDashboard />,
  committee:       ()     => <CommitteeDashboard />,
};

// Protected route wrapper
function ProtectedRoute({ user, routeId, theme, setTheme, setActiveNav }) {
  const navigate = useNavigate();
  if (!canAccess(user, routeId)) {
    return <AccessDenied section={routeId} onBack={() => navigate('/dashboard')} />;
  }
  const Component = ROUTE_COMPONENTS[routeId];
  if (!Component) {
    return (
      <div className="coming-soon">
        <div className="cs-inner">
          <div className="cs-icon">🚧</div>
          <h2>Module Coming Soon</h2>
          <p>
            The{' '}
            <strong>
              {routeId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </strong>{' '}
            module is under construction.
          </p>
        </div>
      </div>
    );
  }
  return <Component theme={theme} setTheme={setTheme} user={user} setActiveNav={setActiveNav} />;
}

// Inner app (after login) — uses router hooks
function AppShell({ user, onLogout }) {
  const [theme, setTheme] = useState('dark');
  const navigate = useNavigate();
  const location = useLocation();

  // Derive activeNav from current URL path
  const activeNav = location.pathname.replace('/', '') || 'dashboard';

  const setActiveNav = (id) => navigate(`/${id}`);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <AppProvider>
      <div className="app-shell">
        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          theme={theme}
          setTheme={setTheme}
          user={user}
          onLogout={onLogout}
        />
        <div className="main-content-wrap">
          <main className="main-content">
            <Routes>
              {Object.keys(ROUTE_COMPONENTS).map((routeId) => (
                <Route
                  key={routeId}
                  path={`/${routeId}`}
                  element={
                    <ProtectedRoute
                      user={user}
                      routeId={routeId}
                      theme={theme}
                      setTheme={setTheme}
                      setActiveNav={setActiveNav}
                    />
                  }
                />
              ))}
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </AppProvider>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogin = (u) => {
    setUser(u);
    if (u.access === '*') {
      navigate('/dashboard', { replace: true });
    } else {
      const firstPage = u.access[0] ?? 'dashboard';
      navigate(`/${firstPage}`, { replace: true });
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/', { replace: true });
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <AppShell user={user} onLogout={handleLogout} />;
}
