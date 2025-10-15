import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';

const Home = () => {
  const { t } = useTranslation();

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1>{t('home.welcome')}</h1>
        <p>{t('home.description')}</p>
      </div>
      <div className="quick-actions" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Link className="button" style={{ textAlign: 'center' }} to="/self-service">
          {t('home.ctaSelfService')}
        </Link>
        <Link className="button" style={{ textAlign: 'center' }} to="/cashier">
          {t('home.ctaCashier')}
        </Link>
        <Link className="button" style={{ textAlign: 'center' }} to="/volunteers">
          {t('home.ctaVolunteers')}
        </Link>
      </div>
      <ul style={{ color: 'var(--color-muted)', display: 'grid', gap: '0.75rem' }}>
        <li>{t('home.feature1')}</li>
        <li>{t('home.feature2')}</li>
        <li>{t('home.feature3')}</li>
      </ul>
    </section>
  );
};

export default Home;
