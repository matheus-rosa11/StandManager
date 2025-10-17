import { NavLink, Route, Routes } from 'react-router-dom';
import LanguageSelector from './components/LanguageSelector';
import IdentityGate from './components/IdentityGate';
import { useTranslation } from './i18n';
import CashierDashboard from './pages/CashierDashboard';
import CustomerOrder from './pages/CustomerOrder';
import CustomerOrders from './pages/CustomerOrders';
import Home from './pages/Home';
import AdminPastelManager from './pages/AdminPastelManager';
import VolunteerBoard from './pages/VolunteerBoard';
import VolunteerHistory from './pages/VolunteerHistory';
import ReportsDashboard from './pages/ReportsDashboard';
import { useIdentity } from './contexts/IdentityContext';

const App = () => {
  const { t } = useTranslation();
  const { state } = useIdentity();

  const customer = state.role === 'customer' ? state.customer : undefined;

  const navLinks = (() => {
    if (state.role === 'volunteer') {
      return [
        { to: '/', label: t('nav.home') },
        { to: '/volunteers', label: t('nav.volunteers') },
        { to: '/volunteers/history', label: t('nav.volunteerHistory') },
        { to: '/cashier', label: t('nav.cashier') },
        { to: '/admin/pasteis', label: t('nav.admin') },
        { to: '/reports', label: t('nav.reports') }
      ];
    }

    if (state.role === 'customer') {
      return [
        { to: '/', label: t('nav.home') },
        { to: '/self-service', label: t('nav.selfService') },
        { to: '/my-orders', label: t('nav.myOrders') }
      ];
    }

    return [];
  })();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span>{t('app.brand')}</span>
          {customer && (
            <small style={{ color: 'var(--color-muted)', fontWeight: 600 }}>
              {t('identity.headerBadge', { id: customer.id, name: customer.name })}
            </small>
          )}
        </div>
        <div className="header-actions">
          <nav>
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.to === '/'}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <LanguageSelector />
        </div>
      </header>
      <main className="app-content">
        <Routes>
          <Route index element={<Home />} />
          <Route path="/volunteers" element={<VolunteerBoard />} />
          <Route path="/volunteers/history" element={<VolunteerHistory />} />
          <Route path="/cashier" element={<CashierDashboard />} />
          <Route path="/cashier/novo" element={<CashierDashboard />} />
          <Route path="/self-service" element={<CustomerOrder />} />
          <Route path="/self-service/orders" element={<CustomerOrders />} />
          <Route path="/my-orders" element={<CustomerOrders />} />
          <Route path="/admin/pasteis" element={<AdminPastelManager />} />
          <Route path="/reports" element={<ReportsDashboard />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <span>{t('footer.communityProject')}</span>
      </footer>
      <IdentityGate />
    </div>
  );
};

export default App;
