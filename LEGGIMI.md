# pieno — tutto il progetto, a costo zero

Sito pubblico: **https://ffmaster04.github.io/pieno/**. Repository: **https://github.com/FFmaster04/pieno**.

## Cosa include

Mappa dei distributori italiani, ricerca distinta per città e provincia per tutti i 119 comuni capoluogo, indirizzi completi con campi via/piazza, civico, comune e CAP facoltativo, con raggio di 1/3/5 km. Se il civico manca nella cartografia viene proposta esplicitamente la posizione della strada. Tutti i listini comunicati, self/servito, medie nazionali giornaliere, preferiti locali, filtri e indicazioni stradali.

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

Il 23 ottobre GitHub ha riattivato il profilo dopo una segnalazione antispam automatica. Il workflow diagnostico di rete e il relativo script sono stati rimossi dal repository. Sono stati eliminati gli esperimenti di rete: il progetto legge esclusivamente i dati ufficiali MIMIT, direttamente o tramite il proprio servizio di acquisizione. Il sito è ripristinato con l'estrazione del 22 ottobre 2026.

Il workflow “Prezzi giornalieri e sito” è pianificato alle 08:23 e 14:23 UTC: una pubblicazione quotidiana e un secondo tentativo se la fonte esce in ritardo. Le esecuzioni possono essere ritardate da GitHub. Dopo un controllo riuscito nella giornata italiana con l'estrazione attesa vengono evitati ulteriori download pianificati. Le modifiche al codice avviano comunque la verifica e la pubblicazione.

Alla verifica del 23 ottobre il Ministero rimane raggiungibile dal computer locale ma non dai runner GitHub, dove la connessione scade. La pubblicazione dell'estrazione del 22 ottobre è stata preparata da un download locale validato. L'acquisizione automatica quotidiana dal server rimane da risolvere e non va considerata verificata solo perché la pubblicazione del sito termina con successo.

In caso di interruzione viene riutilizzata la copia valida più recente, conservandone le date originali. Il riepilogo di ogni esecuzione distingue un download riuscito dal recupero della copia. Il controllo “Verifica giornaliera prezzi online”, alle 20:47 UTC, verifica la data e l'integrità del file realmente pubblicato e segnala una copia più vecchia dell'estrazione attesa del giorno precedente. La data resta nella sezione “Dettagli dati”.

Il repository deve restare pubblico e usare runner standard. Non sono configurati acquisti, abbonamenti o servizi a pagamento.

## Servizio di acquisizione separato (preparato, da attivare e verificare)

`render.yaml` definisce un unico **Web Service Free**, in **Frankfurt**, Node.js 22, senza database, dischi, cron a pagamento o dominio acquistato. Non aggiungere una carta o un altro metodo di pagamento e non scegliere un piano diverso da Free. Se Render chiede una carta per la verifica dell'account, interrompere la procedura: non è compatibile con il vincolo di questo progetto. La documentazione ufficiale conferma che senza un metodo di pagamento il superamento delle quote sospende il servizio invece di generare addebiti: https://render.com/docs/free e https://render.com/docs/faq.

Il servizio non è un proxy generico: acquisisce solo i due CSV pubblici MIMIT, li riconcilia e restituisce il dataset completo nel formato di pieno, con le date originali. Risposte incomplete, dati precedenti e date future vengono rifiutati. Le richieste simultanee condividono lo stesso download; quelle successive nella stessa giornata riusano la copia validata. Dopo un errore viene rispettata una pausa. Il sito pubblico continua a essere servito da GitHub Pages; i visitatori non dipendono dai tempi di avvio del servizio dati.

Attivazione dopo aver creato un account Render gratuito e accettato personalmente le sue condizioni:

1. Aprire https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FFFmaster04%2Fpieno e controllare che l'unico servizio proposto sia **pieno-dati**, **Free**, **Frankfurt**, senza metodo di pagamento. In alternativa usare New → Web Service, repository pubblico https://github.com/FFmaster04/pieno, build `node --check scripts/serve-data.mjs`, avvio `node scripts/serve-data.mjs`, Node 22 e health check `/healthz`.
2. Dopo l'avvio verificare l'URL assegnato da Render, percorso `/data/initial.json`: deve restituire l'estrazione ufficiale attesa, non soltanto `/healthz` con stato ready. Il collegamento MIMIT da Frankfurt va provato: il codice pronto non dimostra che l'host riesca a raggiungere la fonte.
3. Solo dopo il test riuscito impostare la variabile GitHub Actions **SNAPSHOT_FEED_URL** con l'URL HTTPS completo del dataset e avviare “Prezzi giornalieri e sito”. Nel riepilogo devono comparire `result: updated`, `sourceRoute: data-service`, la data attesa e un controllo MIMIT riuscito di oggi.
4. Verificare infine `/pieno/data/initial.json` pubblicato su Pages e il controllo serale di freschezza. Non basta un deploy verde.

Il servizio dorme dopo 15 minuti senza traffico e si risveglia con la richiesta pianificata di GitHub, senza richieste artificiali per tenerlo acceso. È normale attendere il riavvio: il lettore supporta avvio a freddo e un secondo tentativo. La memoria viene persa durante lo stop; ogni nuova acquisizione viene validata nuovamente. Il piano gratuito non fornisce garanzie di disponibilità. Se il servizio non risponde, GitHub riprova la fonte diretta e conserva soltanto una copia pubblicata valida, senza cambiare le date.

Verifiche locali: `node scripts/check-feed.mjs`, oltre ai controlli esistenti. Avvio manuale del servizio: `node scripts/serve-data.mjs`; porta predefinita 10000, oppure `PORT` assegnata dal provider. Non servono chiavi API né accesso in scrittura all'account GitHub.

## Dati e limiti

MIMIT pubblica una fotografia dei prezzi delle 8 del giorno precedente. I singoli listini conservano la propria data e possono essere incompleti o datati. Le nostre medie includono la rete stradale nazionale, escludono le autostrade e i listini oltre 7 giorni dall’estrazione; sono separate per carburante e modalità e non coincidono con le medie regionali ufficiali.

I segnaposto e i prezzi nell’elenco sono verdi sotto la media nazionale dello stesso carburante e modalità, arancioni entro ±0,01 €/l o €/kg e rossi sopra tale fascia. Le frecce e la legenda rendono il significato leggibile anche senza colore. Nei gruppi il prezzo “da” usa il colore del minimo; senza media viene usato un colore neutro. La ricerca per indirizzo completo usa la ricerca strutturata Photon, con cache temporanea e invio solo dopo una conferma esplicita.

Il filtro città usa il comune dichiarato nell’anagrafica MIMIT. Nei comuni con più CAP vengono usati solo i CAP espliciti e coerenti nell’indirizzo; i risultati possono essere incompleti. Le distanze sono in linea d’aria e i costi del pieno non comprendono il tragitto.

La consultazione offline usa soltanto dati e file di pieno. Non vengono scaricate mappe per l’uso offline. Il browser può rimuovere la copia locale se vengono cancellati i dati del sito o manca spazio sul dispositivo.

## Sviluppo e verifiche

Node.js 22.13 o successivo. `npm ci`, poi `npm run dev` per lo sviluppo. `npm run update-data` aggiorna i listini; `node scripts/record-history.mjs` conserva le medie dell’estrazione. `npm run check-data`, `npm run check-search`, `npm run check-experience` e `npm run check-update` eseguono i controlli. `npm run build` genera anche manifest e service worker in `dist-static`.

Per verificare il percorso GitHub Pages, imposta `PAGES_BASE_PATH=/pieno/` durante la build e l’anteprima. La consultazione offline è attiva nella versione compilata e pubblicata, non nel server di sviluppo.

## Fonti e licenze

Prezzi e anagrafica: [MIMIT](https://www.mimit.gov.it/it/open-data/elenco-dataset/carburanti-prezzi-praticati-e-anagrafica-degli-impianti), IODL 2.0. Comuni/capoluoghi: ISTAT. CAP/coordinate: RP92 e Garda Informatica, CC BY 4.0 / MIT, con integrazioni Matteo Contrini e OpenDataSicilia; dettagli in `public/data/SEARCH-SOURCES.md`. Cartografia e indirizzi: © OpenStreetMap contributors, ODbL; ricerca Photon/komoot. Leaflet: BSD-2-Clause. Font DM Sans e Space Grotesk: SIL OFL.

Nessun analytics o pubblicità. Preferiti, preferenze e copia offline restano nel browser. Progetto indipendente, non affiliato al Ministero.
