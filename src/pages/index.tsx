import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { fetchStores } from "../api/rest";
import { ListStation } from "../components/list";
import { Station } from "../interfaces/station";

interface Props {
  stations: Station[];
}

const Home = ({stations}: Props ) => {
  return (
    
    <div className={styles.container}>
      
      <Head>
        <title>Grifos baratos Lima</title>
        <meta name="description" content="Top 10 de grifos más baratos de Lima" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        
        <h1 className={styles.title}>Grifos baratos</h1>
        <p>Top 10 de grifos más barato por octanage de LIMA</p>
        <p>*Actualizado cada día a las 8am</p>
        <div className={styles.option}>
          <ul>
            <li><a className={styles.yellow} href="#GASOL 84">⛽ Gasol 84</a></li>
            <li><a className={styles.violet} href="#GASOL 90">⛽ Gasol 90</a></li>
            <li><a className={styles.blue}href="#GASOL 95">⛽ Gasol 95</a></li>
            <li><a className={styles.yellowLight} href="#GASOL 97">⛽ Gasol 97</a></li>
            <li><a className={styles.yellowLight} href="#GASOL 98">⛽ Gasol 98</a></li>
            <li><a className={styles.black} href="#DBS S-50 UV">⛽ Diesel 50</a></li>
          </ul>
        </div>
        {/* <div className={styles.toast} id="snackbar">Dirección de grifo copiada</div> */}
        <ListStation stations={stations} />

        <footer> 


        <p>@djego</p>
        </footer>
      </main>
    </div>
    
  )
}


Home.getInitialProps = async () => {
  const stations = await fetchStores();
  return {
    stations,
  };
};

export default Home
