# pieno

La mappa dei prezzi dei carburanti in Italia.

Sito: https://ffmaster04.github.io/pieno/

Ricerca città, mappa completa, self e servito, tutti i carburanti comunicati per distributore, medie giornaliere, preferiti locali e indicazioni stradali. Dati aperti MIMIT, estrazione giornaliera con data visibile. I file ministeriali fotografano i prezzi delle 8 del giorno precedente; non sono listini in tempo reale.

## Hosting e aggiornamenti

GitHub Pages su repository pubblico, runner Ubuntu standard, nessun servizio API a pagamento. Il workflow controlla la fonte alle 08:23 e 12:23 UTC e pubblica soltanto dopo aver validato i dati. Se la fonte non risponde, il sito online conserva l'ultima estrazione valida. Nessun aggiornamento richiede task AI o un computer acceso.

## In locale

Node.js 22 o successivo. `npm ci`, poi `npm run dev`. `npm run update-data` scarica l'estrazione MIMIT; `npm run check-data` verifica coerenza e medie; `npm run build` genera il sito statico.

## Fonti

Prezzi e anagrafica: [MIMIT](https://www.mimit.gov.it/it/open-data/elenco-dataset/carburanti-prezzi-praticati-e-anagrafica-degli-impianti), IODL 2.0. Le medie sono elaborazioni nazionali della rete stradale, separate per carburante e servizio, con esclusione delle autostrade e dei listini precedenti di oltre 7 giorni all'estrazione.

Cartografia © OpenStreetMap contributors, ODbL; Leaflet, BSD-2-Clause. Comuni: Matteo Contrini / comuni-json e OpenDataSicilia / comuni-italiani, integrati con anagrafica MIMIT. Font DM Sans e Space Grotesk, SIL OFL, licenze in `public/licenses/`.

Progetto indipendente, non affiliato al Ministero. Nessun analytics o pubblicità aggiunti. I preferiti rimangono nel browser; la posizione è usata soltanto su richiesta.
