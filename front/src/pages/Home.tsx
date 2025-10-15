import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1>Bem-vindo ao Stand Manager</h1>
        <p>
          Centralize o fluxo dos pedidos de pastel da igreja em um único lugar. Acompanhe o estoque, receba pedidos
          em tempo real e coordene cada etapa da produção.
        </p>
      </div>
      <div className="quick-actions" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Link className="button" style={{ textAlign: 'center' }} to="/self-service">
          Fazer pedido pelo QR Code
        </Link>
        <Link className="button" style={{ textAlign: 'center' }} to="/cashier">
          Registrar pedido no caixa
        </Link>
        <Link className="button" style={{ textAlign: 'center' }} to="/volunteers">
          Painel dos voluntários
        </Link>
      </div>
      <ul style={{ color: 'var(--color-muted)', display: 'grid', gap: '0.75rem' }}>
        <li>Pedidos agrupados por sessão do cliente para facilitar a entrega.</li>
        <li>Atualizações visuais de status para cada etapa da produção.</li>
        <li>Estoque atualizado automaticamente conforme os pedidos são registrados.</li>
      </ul>
    </section>
  );
};

export default Home;
