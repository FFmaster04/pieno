import assert from 'node:assert/strict';
import {downloadCSVPair,validatePublishedSnapshot,SourceUnavailableError,refreshDataset,newestValidSnapshot} from '../lib/update-source.mjs';
import {readFile} from 'node:fs/promises';
import {unpackDataset} from '../lib/wire.mjs';
import {createCSVTransport} from '../lib/source-transport.mjs';
const date=d=>'Estrazione del '+d+'\nidImpianto|descCarburante\n';
let calls=[],delays=0;
const texts=await downloadCSVPair({now:()=>new Date('2026-10-16T07:00:00Z'),retryDelay:1,delay:async()=>{delays++;},fetcher:async(url,options)=>{
 calls.push({url,options});const first=calls.length<=2;
 return {ok:true,text:async()=>date(first&&url.includes('prezzo_alle_8')?'2026-10-14':'2026-10-15')};
}});
assert.equal(calls.length,4);assert.equal(delays,1);assert(texts.every(t=>t.includes('2026-10-15')));
assert(calls.every(c=>c.options.cache==='no-store'&&c.options.headers['Cache-Control']==='no-cache'));
assert.equal(new URL(calls[0].url).searchParams.get('pieno_check'),new URL(calls[1].url).searchParams.get('pieno_check'));
assert.notEqual(new URL(calls[0].url).searchParams.get('pieno_check'),new URL(calls[2].url).searchParams.get('pieno_check'));
let failedCalls=0;
await assert.rejects(()=>downloadCSVPair({attempts:2,delay:async()=>{},fetcher:async()=>{failedCalls++;return {ok:false,status:503};}}),/503/);
assert.equal(failedCalls,4);
await assert.rejects(()=>downloadCSVPair({attempts:1,fetcher:async()=>({ok:true,text:async()=>'<html>non CSV</html>'})}),/non riconosciuto/);
console.log('Verificati download senza cache, retry per pubblicazione sfalsata e rifiuto delle risposte non valide.');

const snapshot=JSON.parse(await readFile(new URL('../public/data/initial.json',import.meta.url),'utf8'));
const originalDates={sourceDate:snapshot.sourceDate,checkedAt:snapshot.checkedAt,fetchedAt:snapshot.fetchedAt};
assert.equal(validatePublishedSnapshot(snapshot,snapshot.sourceDate),snapshot);
assert.deepEqual({sourceDate:snapshot.sourceDate,checkedAt:snapshot.checkedAt,fetchedAt:snapshot.fetchedAt},originalDates);
assert.throws(()=>validatePublishedSnapshot(snapshot,'2099-01-01'),/precedente/);
assert.throws(()=>validatePublishedSnapshot({...snapshot,rows:snapshot.rows.slice(0,10)}),/non valida/);
assert.throws(()=>validatePublishedSnapshot({...snapshot,priceCount:snapshot.priceCount-1}),/incompleta/);
assert.throws(()=>validatePublishedSnapshot({...snapshot,checkedAt:'non una data'}),/non valida/);
const corrupt=structuredClone(snapshot);corrupt.rows[0][9][0][1]=-1;
assert.throws(()=>validatePublishedSnapshot(corrupt),/Listini/);
console.log('Verificata copia pubblicata completa, senza regressioni o alterazione delle date.');

// Source outages must not trigger a failed hourly run, but broken code, corrupt
// responses, missing backups and date regressions must remain real failures.
const published=unpackDataset(snapshot),unavailable=new SourceUnavailableError('Timeout',{code:'MIMIT_CONNECTION'});
const cached=await refreshDataset({download:async()=>{throw unavailable;},published,minimumDate:published.sourceDate});
assert.equal(cached.result,'cached');assert.equal(cached.data,published);assert.equal(cached.sourceError,'MIMIT_CONNECTION');
assert.equal(cached.data.checkedAt,originalDates.checkedAt);
await assert.rejects(()=>refreshDataset({download:async()=>{throw unavailable;}}),SourceUnavailableError);
await assert.rejects(()=>refreshDataset({download:async()=>{throw unavailable;},published,minimumDate:'2099-01-01'}),/precedente/);
await assert.rejects(()=>refreshDataset({download:async()=>{throw Error('Programming error');},published}),/Programming error/);
await assert.rejects(()=>refreshDataset({download:async()=>['Estrazione del 2026-10-16\ninvalid header\n','Estrazione del 2026-10-16\ninvalid header\n'],published}),/Formato/);
await assert.rejects(()=>refreshDataset({download:async()=>['Estrazione del 2026-10-16\nidImpianto|Gestore\n','Estrazione del 2026-10-16\nidImpianto|descCarburante\n'],published}),/incompleta/);
await assert.rejects(()=>downloadCSVPair({attempts:1,fetcher:async()=>{throw new TypeError('fetch failed',{cause:{code:'UND_ERR_CONNECT_TIMEOUT'}});}}),SourceUnavailableError);
await assert.rejects(()=>downloadCSVPair({attempts:1,fetcher:async()=>({ok:false,status:404})}),e=>!(e instanceof SourceUnavailableError)&&/404/.test(e.message));

let invocation;
const transport=createCSVTransport(async(...args)=>{invocation=args;return {stdout:'Estrazione del 2026-10-16\ncolonne\n200'};});
const response=await transport('https://www.mimit.gov.it/example.csv',{headers:{'Cache-Control':'no-cache'}});
assert.equal(response.ok,true);assert.equal(response.status,200);assert.equal(await response.text(),'Estrazione del 2026-10-16\ncolonne');
assert.equal(invocation[0],'curl');assert(invocation[1].includes('--ipv4'));assert(!invocation[1].includes('--insecure'));assert(invocation[1].includes('30'));assert(invocation[1].includes('Cache-Control: no-cache'));
await assert.rejects(()=>createCSVTransport(async()=>{throw Object.assign(Error('timeout'),{code:28});})('https://www.mimit.gov.it/example.csv'),SourceUnavailableError);
await assert.rejects(()=>createCSVTransport(async()=>{throw Object.assign(Error('curl missing'),{code:'ENOENT'});})('https://www.mimit.gov.it/example.csv'),e=>!(e instanceof SourceUnavailableError)&&e.code==='ENOENT');
console.log('Verificati recupero automatico durante le interruzioni, date originali, errori reali ancora bloccanti e trasporto HTTPS.');

const older={...snapshot,sourceDate:'2026-10-01'};
assert.equal(newestValidSnapshot([snapshot,older],snapshot.sourceDate),snapshot);
assert.equal(newestValidSnapshot([older,snapshot],snapshot.sourceDate),snapshot);
assert.equal(newestValidSnapshot([{...snapshot,rows:[]},snapshot],snapshot.sourceDate),snapshot);
assert.equal(newestValidSnapshot([snapshot],'2099-01-01'),undefined);
console.log('Verificata selezione del backup valido più recente, anche quando la copia locale è più nuova del sito.');
