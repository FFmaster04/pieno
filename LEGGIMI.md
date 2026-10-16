# pieno — tutto il progetto, a costo zero

Sito pubblico: **https://ffmaster04.github.io/pieno/**. Repository: **https://github.com/FFmaster04/pieno**.

## Cosa include

Mappa dei distributori italiani, ricerca distinta per città e provincia per tutti i 119 comuni capoluogo, indirizzi con raggio 1/3/5 km e CAP. Tutti i listini comunicati, self/servito, medie nazionali giornaliere, preferiti locali, filtri e indicazioni stradali.

Le nuove funzioni comprendono:

1. Quantità del pieno personalizzabile, totale in euro e risparmio rispetto alla media. Metano e GNL usano chilogrammi; gli altri carburanti litri.
2. Confronto fino a tre impianti, con prezzo unitario, totale per la stessa quantità, date, distanza e differenza dal più basso.
3. Grafico a 7 e 30 giorni delle medie realmente raccolte, separate per carburante e modalità. Lo storico parte dall’estrazione del 14 ottobre 2026; i giorni mancanti restano vuoti. Vengono conservate fino a 400 rilevazioni giornaliere, senza archiviare tutti i listini degli impianti.
4. Preferenze automatiche sul dispositivo: carburante, modalità, quantità, zona e filtri. Il salvataggio si può disattivare o cancellare dal pannello “Preferenze”. La posizione GPS non viene memorizzata.
5. Link di ricerca che ricostruiscono zona, CAP o indirizzo, filtri, quantità ed eventuali impianti nel confronto. I link hanno precedenza sulle preferenze del destinatario. I prezzi rimangono quelli disponibili quando vengono aperti.
6. App web installabile nei browser compatibili, con icone dedicate e consultazione offline di prezzi, località, confronto e storico dopo una prima visita completa. Mappe, indicazioni stradali e nuovi indirizzi richiedono una connessione. La data della copia rimane visibile.

## Gratuità e pubblicazione

Il sito usa GitHub Pages con repository pubblico e runner GitHub Actions Ubuntu standard, senza API a pagamento, servizi AI, database o computer acceso. Non serve acquistare un dominio. Il servizio Photon pubblico per gli indirizzi è gratuito e best-effort. Non sono configurati acquisti o abbonamenti.

Per replicare il progetto: crea un repository pubblico `pieno`, carica anche `.github`, seleziona **Settings → Pages → Source → GitHub Actions** e avvia il workflow “Prezzi giornalieri e sito”. Il dominio sarà `https://NOMEUTENTE.github.io/pieno/`.

Il workflow controlla MIMIT ogni ora al minuto 17, dalle 07:17 alle 19:17 UTC, valida i dati, aggiorna lo storico, verifica il codice e pubblica il sito. Le esecuzioni pianificate possono essere ritardate da GitHub. In caso di errore resta online l’ultima versione valida. La ricevuta e le medie giornaliere vengono conservate nel repository; i file di pubblicazione scadono dopo un giorno.

## Dati e limiti

MIMIT pubblica una fotografia dei prezzi delle 8 del giorno precedente. I singoli listini conservano la propria data e possono essere incompleti o datati. Le nostre medie includono la rete stradale nazionale, escludono le autostrade e i listini oltre 7 giorni dall’estrazione; sono separate per carburante e modalità e non coincidono con le medie regionali ufficiali.

Il filtro città usa il comune dichiarato nell’anagrafica MIMIT. Nei comuni con più CAP vengono usati solo i CAP espliciti e coerenti nell’indirizzo; i risultati possono essere incompleti. Le distanze sono in linea d’aria e i costi del pieno non comprendono il tragitto.

La consultazione offline usa soltanto dati e file di pieno. Non vengono scaricate mappe per l’uso offline. Il browser può rimuovere la copia locale se vengono cancellati i dati del sito o manca spazio sul dispositivo.

## Sviluppo e verifiche

Node.js 22.13 o successivo. `npm ci`, poi `npm run dev` per lo sviluppo. `npm run update-data` aggiorna i listini; `node scripts/record-history.mjs` conserva le medie dell’estrazione. `npm run check-data`, `npm run check-search`, `npm run check-experience` e `npm run check-update` eseguono i controlli. `npm run build` genera anche manifest e service worker in `dist-static`.

Per verificare il percorso GitHub Pages, imposta `PAGES_BASE_PATH=/pieno/` durante la build e l’anteprima. La consultazione offline è attiva nella versione compilata e pubblicata, non nel server di sviluppo.

## Fonti e licenze

Prezzi e anagrafica: [MIMIT](https://www.mimit.gov.it/it/open-data/elenco-dataset/carburanti-prezzi-praticati-e-anagrafica-degli-impianti), IODL 2.0. Comuni/capoluoghi: ISTAT. CAP/coordinate: RP92 e Garda Informatica, CC BY 4.0 / MIT, con integrazioni Matteo Contrini e OpenDataSicilia; dettagli in `public/data/SEARCH-SOURCES.md`. Cartografia e indirizzi: © OpenStreetMap contributors, ODbL; ricerca Photon/komoot. Leaflet: BSD-2-Clause. Font DM Sans e Space Grotesk: SIL OFL.

Nessun analytics o pubblicità. Preferiti, preferenze e copia offline restano nel browser. Progetto indipendente, non affiliato al Ministero.
