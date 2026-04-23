import styles from '../styles/Home.module.css';
import { ListStation } from '../components/list';
import { loadStations } from '../lib/blob';

export default async function Home() {
  const payload = await loadStations();
  const stations = payload?.stations ?? [];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Grifos baratos</h1>
        <p className={styles.subtitle}>Top 10 más baratos por tipo de combustible · Lima · actualizado cada día a las 8am</p>
      </header>

      <nav className={styles.nav}>
        <a href="#Gasohol Regular" className={styles.pill}>
          <span className={`${styles.dot} ${styles.dotAmber}`} />
          Gasohol Regular
        </a>
        <a href="#Gasohol Premium" className={styles.pill}>
          <span className={`${styles.dot} ${styles.dotBlue}`} />
          Gasohol Premium
        </a>
        <a href="#Diesel B5 S-50 UV" className={styles.pill}>
          <span className={`${styles.dot} ${styles.dotGreen}`} />
          Diesel B5 S-50 UV
        </a>
      </nav>

      <ListStation stations={stations} />

      <footer className={styles.footer}>
        @djego
      </footer>
    </div>
  );
}
