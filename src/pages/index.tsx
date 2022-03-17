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
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        
        <h1 className={styles.title}>Grifos</h1>
        <p>Los 10 más barato por octanage</p>
        <div className={styles.option}>
          <ul>
            <li><a href="#GASOL 84"> Gasol 84</a></li>
            <li><a href="#GASOL 90"> Gasol 90</a></li>
            <li><a href="#GASOL 95"> Gasol 95</a></li>
            <li><a href="#GASOL 97"> Gasol 97</a></li>
            <li><a href="#GASOL 98"> Gasol 98</a></li>
            <li><a href="#DBS S-50 UV"> Diesel 50</a></li>
          </ul>
        </div>
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