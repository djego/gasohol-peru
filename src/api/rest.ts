import { Station } from '../interfaces/station';
import axios from 'axios';

const baseRoot = process.env.NEXT_PUBLIC_API_URI;
const storeCollectionURL = `${baseRoot}/v1/stations-current`;

export const fetchStores = async (): Promise<Station[]> => {
  const res = await axios.get(storeCollectionURL);
  let data = res.data;
  return data.map(
    ({ district, address, price, station, gasohol}: any) => ({ district, address, price, station, gasohol } as Station)
  );
}
