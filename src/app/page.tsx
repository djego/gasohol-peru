import styles from '../styles/Home.module.css';
import { ListStation } from '../components/list';
import { getStations } from '../lib/stations';

// Revalidate every hour; Playwright runs in background after cache expires
export const revalidate = 3600;

export default async function Home() {
  const stations = await getStations();

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Grifos baratos</h1>
        <p>Top 10 de grifos más barato por octanage de LIMA</p>
        <p>*Actualizado cada día a las 8am</p>
        <div className={styles.option}>
          <ul>
            <li><a className={styles.yellow} href="#Gasohol Regular">⛽ Gasohol Regular</a></li>
            <li><a className={styles.blue} href="#Gasohol Premium">⛽ Gasohol Premium</a></li>
            <li><a className={styles.black} href="#Diesel B5 S-50 UV">⛽ Diesel B5 S-50 UV</a></li>
          </ul>
        </div>
        <ListStation stations={stations} />
        <footer>
          <p>@djego</p>
        </footer>
      </main>
    </div>
  );
}
