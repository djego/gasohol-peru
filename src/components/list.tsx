import { Station } from '../interfaces/station';
import styles from '../styles/Home.module.css';

interface Props {
  stations: Station[];
  
}


export const ListStation = ({ stations }: Props) => {
  const station_grouped = stations.reduce((r, a) => {
    r[a.gasohol] = [...r[a.gasohol] || [], a];
    return r;
  }, Object.create(null));
  
  function copyToClipboard(text:string) {
    window.open('https://www.google.com/maps/search/?api=1&query=' + text, '_blank');

    // const elem = document.createElement('textarea');
    // elem.value = text;
    // document.body.appendChild(elem);
    // elem.select();
    // document.execCommand('copy');
    // document.body.removeChild(elem);
    // const x = document.getElementById("snackbar")!
    // x.style.visibility = "visible";
    // setTimeout(function(){ x.style.visibility = "hidden"; }, 2000);
 }
  return (
    <div className={styles.grid}>  
      
      {Object.keys(station_grouped).map((key, index) => 
        <div className={styles.grid_item} key={index}> 
          <h2 id={key}>⛽ {key}</h2>
          <div className={styles.group}>
            { station_grouped[key].slice(0,10).map((station: Station, pos: number) => 
              <div key={station.address} onClick={() => copyToClipboard(station.address)}  className={styles.card}>
                <span className={styles.position}>{"#"+(pos+1)}</span>
                <h3>S/. {station.price}</h3>
                <p>Empresa: {station.station}</p>
                <p>Dirección: {station.address}</p>
                <p><b>{station.district}</b></p>
                <span>🗺️</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

  )};