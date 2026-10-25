import {createRoot} from 'react-dom/client';
import Pieno from '../app/pieno';
import {siteRedirect} from '../lib/site-address';
import 'leaflet/dist/leaflet.css';
import '../app/globals.css';
const redirect=import.meta.env.VITE_PUBLIC_SITE_URL?siteRedirect(window.location.href,import.meta.env.VITE_PUBLIC_SITE_URL,navigator.onLine):null;
if(redirect)window.location.replace(redirect);
else createRoot(document.getElementById('root')!).render(<Pieno/>);
