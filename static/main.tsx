import {createRoot} from 'react-dom/client';
import Pieno from '../app/pieno';
import 'leaflet/dist/leaflet.css';
import '../app/globals.css';
createRoot(document.getElementById('root')!).render(<Pieno/>);
