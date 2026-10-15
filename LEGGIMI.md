# pieno — tutto il progetto, a costo zero

Il sito è già completo: cartografia d'Italia, ricerca di 7.947 comuni e denominazioni, 23.776 distributori geolocalizzati nell'estrazione iniziale, tutti i carburanti comunicati, self/servito, media giornaliera, preferiti, filtri, indicazioni e versione mobile.

## Il sito è online

Apri **https://ffmaster04.github.io/pieno/**. Il repository è **https://github.com/FFmaster04/pieno**. GitHub Pages e il controllo giornaliero sono configurati; il primo scaricamento MIMIT e la prima pubblicazione sono riusciti il 15 ottobre 2026. Non devi attivare altri servizi.

## Replicare il progetto gratuitamente

Occorre soltanto un account GitHub gratuito. Non acquistare un dominio e non attivare piani a pagamento.

1. Crea un repository **pubblico** chiamato `pieno`, con ramo `main`. Carica il contenuto di questa cartella, inclusa la cartella nascosta `.github`.
2. Nel repository apri **Settings → Pages → Source** e scegli **GitHub Actions**.
3. Nella scheda **Actions**, apri “Prezzi giornalieri e sito” e premi **Run workflow**.
4. Al completamento il sito sarà disponibile all'indirizzo gratuito `https://NOMEUTENTE.github.io/pieno/`.

Il workflow usa esclusivamente runner Ubuntu standard. Non richiede carta di credito, database, API a pagamento, servizi AI o un computer acceso. I file di pubblicazione vengono conservati per un giorno; non viene accumulato uno storico dei listini nel repository. Non configurare runner “larger”, budget aggiuntivi o domini a pagamento.

GitHub Pages è gratuito per repository pubblici e GitHub Actions è gratuito con runner standard nei repository pubblici. Restano i limiti di uso dei servizi gratuiti; nessun hosting gratuito garantisce disponibilità o traffico illimitati.

Fonti sui costi:
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/billing/concepts/product-billing/github-actions

**Stato della consegna:** sito pubblico online, workflow attivo e prima esecuzione verificata. Gli aggiornamenti avvengono in cloud; una copia locale scaricata rimane invece una fotografia dei dati inclusi.

## Come si aggiorna

Ogni giorno il workflow controlla i due CSV ufficiali MIMIT alle 08:23 e 12:23 UTC: il secondo controllo copre eventuali pubblicazioni tardive. In Italia corrispondono alle 10:23/14:23 con ora legale e 09:23/13:23 con ora solare. GitHub può ritardare le esecuzioni pianificate.

Il repository conserva una piccola ricevuta giornaliera con data di controllo, data della fonte e numero di prezzi, senza accumulare i listini completi. Questo documenta l'attività di aggiornamento del progetto.

Le estrazioni devono avere la stessa data, il formato atteso e una copertura minima valida. Se la fonte non risponde o i dati non passano i controlli, la pubblicazione si interrompe e il sito già online mantiene l'ultima versione valida. La data dell'estrazione resta sempre visibile. Il Ministero pubblica una fotografia dei prezzi alle 8 del giorno precedente; non sono prezzi in tempo reale.

Le medie sono una nostra elaborazione nazionale della rete stradale, escludono autostrade e listini più vecchi di 7 giorni rispetto all'estrazione. Ogni carburante è separato da self/servito. Le schede nazionali mostrano self per benzina e diesel e servito per GPL e metano. Le medie non sono quelle regionali ufficiali.

La ricerca dei comuni funziona localmente, senza API di geocodifica. I preferiti restano solo nel browser. Le distanze sono in linea d'aria. La cartografia viene da OpenStreetMap e può essere limitata in caso di traffico eccessivo; i prezzi sono consultabili anche nell'elenco. Nessuna iscrizione o pubblicità inserita.

## Anteprima sul computer

Con Node.js 22 o successivo: `npm ci`, poi `npm run dev`. Il sito legge la copia inclusa in `public/data/initial.json`. Per scaricare manualmente l'ultima estrazione: `npm run update-data`. Per verificare i dati: `npm run check-data`. Per creare i file da pubblicare: `npm run build`.

Non aprire direttamente il file HTML: serve il piccolo server di anteprima indicato sopra oppure la pubblicazione GitHub Pages.

## Fonti e licenze

Prezzi e anagrafica: MIMIT, IODL 2.0, https://www.mimit.gov.it/it/open-data/elenco-dataset/carburanti-prezzi-praticati-e-anagrafica-degli-impianti

Cartografia: © OpenStreetMap contributors, ODbL. Leaflet: BSD-2-Clause. Indice comuni: Matteo Contrini / comuni-json e OpenDataSicilia / comuni-italiani, integrato con l'anagrafica MIMIT per alcune nuove denominazioni. Font locali DM Sans e Space Grotesk: SIL OFL; licenze in `public/licenses`.

Progetto indipendente, non affiliato al Ministero.
