import { NavLink, Route, Routes } from 'react-router-dom';
import LanguageSelector from './components/LanguageSelector';
import { useTranslation } from './i18n';
import CashierDashboard from './pages/CashierDashboard';
import CustomerOrder from './pages/CustomerOrder';
import CustomerOrders from './pages/CustomerOrders';
import Home from './pages/Home';
import VolunteerBoard from './pages/VolunteerBoard';
import VolunteerHistory from './pages/VolunteerHistory';

const App = () => {
  const { t } = useTranslation();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">{t('app.brand')}</div>
        <div className="header-actions">
          <nav>
            <NavLink to="/" end>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/volunteers">
              {t('nav.volunteers')}
            </NavLink>
            <NavLink to="/volunteers/history">
              {t('nav.volunteerHistory')}
            </NavLink>
            <NavLink to="/cashier">
              {t('nav.cashier')}
            </NavLink>
            <NavLink to="/my-orders">
              {t('nav.myOrders')}
            </NavLink>
            <NavLink to="/self-service">
              {t('nav.selfService')}
            </NavLink>
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
        </Routes>
      </main>
      <footer className="app-footer">
        <span>{t('footer.communityProject')}</span>
      </footer>
    </div>
  );
};

export default App;
