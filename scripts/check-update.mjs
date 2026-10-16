import assert from 'node:assert/strict';
import {downloadCSVPair} from '../lib/update-source.mjs';
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
await assert.rejects(()=>downloadCSVPair({attempts:1,fetcher:async()=>({ok:true,text:async()=>'<html>non CSV</html>'})}),/allineate/);
console.log('Verificati download senza cache, retry per pubblicazione sfalsata e rifiuto delle risposte non valide.');
