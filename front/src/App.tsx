import { NavLink, Route, Routes } from 'react-router-dom';
import CashierDashboard from './pages/CashierDashboard';
import CustomerOrder from './pages/CustomerOrder';
import Home from './pages/Home';
import VolunteerBoard from './pages/VolunteerBoard';

const App = () => {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">Stand Manager</div>
        <nav>
          <NavLink to="/" end>
            Início
          </NavLink>
          <NavLink to="/volunteers">
            Pedidos Ativos
          </NavLink>
          <NavLink to="/cashier">
            Caixa
          </NavLink>
          <NavLink to="/self-service">
            Autoatendimento
          </NavLink>
        </nav>
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
        <span>Projeto comunitário - Gerenciador de pedidos de pastel</span>
      </footer>
    </div>
  );
};

export default App;
