import { NavLink, Route, Routes } from 'react-router-dom';
import LanguageSelector from './components/LanguageSelector';
import { useTranslation } from './i18n';
import CashierDashboard from './pages/CashierDashboard';
import CustomerOrder from './pages/CustomerOrder';
import Home from './pages/Home';
import VolunteerBoard from './pages/VolunteerBoard';

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
            <NavLink to="/cashier">
              {t('nav.cashier')}
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
          <Route path="/cashier" element={<CashierDashboard />} />
          <Route path="/self-service" element={<CustomerOrder />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <span>{t('footer.communityProject')}</span>
      </footer>
    </div>
  );
};

export default App;
