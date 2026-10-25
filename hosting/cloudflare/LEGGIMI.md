# pienoitalia su Cloudflare Pages Free

Indirizzo attivo: https://pienoitalia.pages.dev/ . Pubblicato il 25 ottobre 2026 su Cloudflare Pages Free; non è un dominio acquistato. Piano Workers Free attivo e nessun metodo di pagamento verificati nella pagina Abbonamenti.

Configurazione: progetto Pages (non Workers), integrazione GitHub limitata al repository FFmaster04/pieno, branch main, framework None, build npm run build:cloudflare, output dist-static, variabile NODE_VERSION=22. Nessuna carta, piano a pagamento, Function, R2, database o dominio acquistato. Il piano Free prevede attualmente 500 build/mese, 20.000 file e 25 MiB per file. Questa build contiene 23 file e il maggiore occupa circa 6,4 MB. Documentazione: https://developers.cloudflare.com/pages/platform/limits/ e https://developers.cloudflare.com/pages/functions/pricing/ .

## Dati e pubblicazioni

La build Cloudflare genera l'interfaccia alla radice / e legge la copia pubblicata sul sito GitHub Pages esistente. Il browser degli utenti scarica dati, ricerche e storico dal nuovo indirizzo, senza usare il vecchio indirizzo nel link pubblico.

Il controllo GitHub registra anche checkedAt e l'hash del dataset nel file .github/data-status.json. Quando cambiano i listini, il commit di questa ricevuta fa partire la build Cloudflare tramite l'integrazione GitHub. Se Pages non ha ancora finito di pubblicare quei listini, la build attende e riprova; non può distribuire una copia precedente alla ricevuta. I dati e lo storico vengono validati e le date originali conservate. Non sono necessari nuovi token o Deploy Hooks.

Verifica del 25 ottobre 2026: pubblicazione GitHub riuscita, successivo commit automatico della ricevuta ac3eff9 distribuito da Cloudflare e hash identico dei dataset pubblici (23.773 impianti, 92.122 prezzi). Manifest e link condivisi usano la radice del nuovo indirizzo. Una build verde non dimostra che il collegamento MIMIT sia tornato a funzionare: la disponibilità della fonte ufficiale rimane un problema distinto e non viene risolto dal cambio di indirizzo.

## Requisiti della migrazione

1. Confermare che il progetto appartenga al piano gratuito e non siano presenti pagamenti o carte.
2. Verificare HTTPS, mappa e ricerca, posizione con consenso, listini, storico, preferenze, link condivisi e PWA sul nuovo indirizzo.
3. Verificare l'aggiornamento automatico dalla ricevuta GitHub alla pubblicazione Cloudflare.
4. Solo dopo i controlli attivare il collegamento dal vecchio indirizzo. I percorsi /data/ sul vecchio host devono continuare a servire JSON: la build Cloudflare li usa come fonte della pubblicazione.
5. Conservare query e frammento nei collegamenti; preferiti e preferenze locali appartengono all'origine precedente e non si trasferiscono automaticamente. Anche l'app installata dal vecchio indirizzo può richiedere una nuova installazione.

La migrazione rimuove il nome del profilo dall'indirizzo del sito, non dal repository pubblico e dalla sua cronologia. Nessun contatto al Ministero è autorizzato.
