# pieno

La mappa dei prezzi dei carburanti in Italia.

Sito: https://ffmaster04.github.io/pieno/

Ricerca per città o provincia, indirizzo e CAP, mappa completa, self e servito, tutti i carburanti comunicati per distributore, medie giornaliere, preferiti locali e indicazioni stradali. Dati aperti MIMIT, estrazione giornaliera con data visibile. I file ministeriali fotografano i prezzi delle 8 del giorno precedente; non sono listini in tempo reale.

## Hosting e aggiornamenti

GitHub Pages su repository pubblico, runner Ubuntu standard, nessun servizio API a pagamento. Il workflow controlla la fonte ogni ora al minuto 17, dalle 07:17 alle 19:17 UTC e pubblica soltanto dopo aver validato i dati. Se la fonte non risponde, il sito online conserva l'ultima estrazione valida. Nessun aggiornamento richiede task AI o un computer acceso.

## In locale

Node.js 22 o successivo. `npm ci`, poi `npm run dev`. `npm run update-data` scarica l'estrazione MIMIT; `npm run check-data` verifica coerenza e medie; `npm run check-search` verifica i filtri geografici, i CAP, gli indirizzi e le coppie città/provincia di tutti i capoluoghi; `npm run build` genera il sito statico.

## Fonti

Prezzi e anagrafica: [MIMIT](https://www.mimit.gov.it/it/open-data/elenco-dataset/carburanti-prezzi-praticati-e-anagrafica-degli-impianti), IODL 2.0. Le medie sono elaborazioni nazionali della rete stradale, separate per carburante e servizio, con esclusione delle autostrade e dei listini precedenti di oltre 7 giorni all'estrazione.

Cartografia © OpenStreetMap contributors, ODbL; Leaflet, BSD-2-Clause. Comuni, province e capoluoghi: ISTAT (21 febbraio 2026). CAP e coordinate: RP92/comuni-italiani e Garda Informatica, CC BY 4.0 / MIT, con integrazioni Matteo Contrini e OpenDataSicilia. [Provenienza e trasformazioni dell’indice](public/data/SEARCH-SOURCES.md). Indirizzi: servizio pubblico Photon/komoot, dati OpenStreetMap. Le richieste partono solo su invio esplicito; nessuna chiave o API a pagamento. Il servizio è best-effort e le ricerche locali rimangono disponibili se non risponde. Font DM Sans e Space Grotesk, SIL OFL, licenze in `public/licenses/`.

Progetto indipendente, non affiliato al Ministero. Nessun analytics o pubblicità aggiunti. I preferiti rimangono nel browser; la posizione è usata soltanto su richiesta.

## Come funziona la ricerca

Scrivendo “Lecce” compaiono due risultati distinti, **Città** e **Provincia**. Lo stesso vale per tutti i capoluoghi, compresi quelli condivisi. Il filtro città usa il comune MIMIT e rimane attivo spostando la mappa; il pulsante “Tutta Italia” lo rimuove. Una barra consente di cambiare tra città e provincia senza riscrivere il nome.

Per una strada, inserisci anche il comune, per esempio “Via Salvatore Trinchese, Lecce”, poi premi Invio e scegli il risultato. Il raggio è selezionabile tra 1, 3 e 5 km, in linea d’aria. Per un CAP basta digitarne le cinque cifre (anche con zero iniziale) e selezionarlo. Nei comuni con più CAP vengono inclusi solo gli impianti con un CAP esplicito nell’indirizzo, quindi la copertura può essere incompleta.

## Costo del pieno, confronto e storico

Il calcolatore usa 1–150 litri oppure 1–100 kg per i carburanti venduti a peso, con quantità indipendenti salvate nelle preferenze. Ogni scheda mostra il totale arrotondato ai centesimi e il risparmio sulla media dello stesso carburante/modalità. Il confronto mantiene fino a tre impianti, anche cambiando ricerca; date e listini mancanti restano espliciti.

`node scripts/record-history.mjs` aggiorna `public/data/history.json` usando le medie dell’estrazione corrente. Una rilevazione per data della fonte, sostituzione in caso di nuova elaborazione dello stesso giorno, massimo 400 date. Il workflow conserva il file solo dopo controlli e build riusciti. Il grafico non riempie i giorni assenti e separa le linee quando manca una rilevazione.

## Preferenze e condivisione

`pieno-preferences` in localStorage conserva carburante, modalità, quantità, zona, rete stradale, filtro recenti e ordinamento. La memorizzazione è disattivabile e separata dai preferiti. Il GPS non viene salvato. I link con `ricerca=1` hanno precedenza sulle preferenze, validano tutti i parametri e conservano anche gli zeri iniziali dei CAP. I link `?impianto=ID` già esistenti rimangono compatibili.

## Installazione e offline

La build genera manifest con scope corretto per GitHub Pages, icone PNG e un service worker. Quest’ultimo conserva la shell dell’app e le ultime risposte valide di listini, indice locale e storico. I dati vengono cercati prima in rete; la copia salvata è il ripiego, con indicazione esplicita della data. Cartografia OSM, geocodifica e indicazioni esterne non sono intercettate o scaricate per l’uso offline. Una nuova versione attende l’aggiornamento esplicito oppure la chiusura delle precedenti schede. Le installazioni precedenti conservano anche la shell immediatamente precedente durante il ricambio.

`npm run check-experience` verifica calcoli, unità, storici non inventati, parametri dei link e preferenze. Controlli browser effettuati su desktop e mobile, inclusa ricarica senza rete e ripristino su un profilo separato.
