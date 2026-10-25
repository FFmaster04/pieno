import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {snapshotReceipt,matchesReceipt,selectCloudflareSnapshot,syncCloudflareData,mergePublishedHistory,CLOUDFLARE_UPSTREAM} from '../lib/cloudflare-site.mjs';

const raw=JSON.parse(await readFile(new URL('../public/data/initial.json',import.meta.url),'utf8'));
const history=JSON.parse(await readFile(new URL('../public/data/history.json',import.meta.url),'utf8'));
const receipt=snapshotReceipt(raw);
assert(matchesReceipt(raw,receipt));
assert(matchesReceipt(raw,{sourceDate:raw.sourceDate}));
const later=structuredClone(raw);later.checkedAt=new Date(Date.parse(raw.checkedAt)+86400000).toISOString();
const laterReceipt=snapshotReceipt(later);
assert(!matchesReceipt(raw,laterReceipt));assert(matchesReceipt(later,receipt));
const altered=structuredClone(raw);altered.rows[0][9][0][1]+=.001;
assert(!matchesReceipt(altered,receipt));
assert.equal(selectCloudflareSnapshot([altered,raw],receipt),raw);
assert.equal(selectCloudflareSnapshot([raw,later],receipt),later);
const corrupt=structuredClone(raw);corrupt.priceCount++;
assert(!matchesReceipt(corrupt,receipt));

const parent=await mkdtemp(join(tmpdir(),'pieno-cloudflare-'));
async function setup(name){
 const directory=pathToFileURL(join(parent,name)+'/');await mkdir(new URL('data/',directory),{recursive:true});
 await writeFile(new URL('data/initial.json',directory),JSON.stringify(raw));await writeFile(new URL('data/history.json',directory),JSON.stringify(history));
 return directory;
}
try{
 const directory=await setup('publication');let calls=0,waits=0;
 const result=await syncCloudflareData({directory,receipt:laterReceipt,attempts:2,delay:async()=>{waits++;},fetcher:async url=>{
  assert(url.startsWith(CLOUDFLARE_UPSTREAM));
  if(new URL(url).pathname.endsWith('/history.json'))return Response.json(history);
  return Response.json(++calls===1?raw:later);
 }});
 assert.equal(calls,2);assert.equal(waits,1);assert.equal(result.route,'published');
 const published=JSON.parse(await readFile(new URL('data/initial.json',directory),'utf8'));
 assert.deepEqual(published,later);assert.equal(published.checkedAt,later.checkedAt);
 assert.equal(JSON.parse(await readFile(new URL('data/history.json',directory),'utf8')).days.at(-1).date,later.sourceDate);
 const cachedDirectory=await setup('outage');
 const cached=await syncCloudflareData({directory:cachedDirectory,receipt,attempts:1,fetcher:async()=>{throw Error('offline');}});
 assert.equal(cached.route,'repository');
 assert.deepEqual(JSON.parse(await readFile(new URL('data/initial.json',cachedDirectory),'utf8')),raw);
 const blockedDirectory=await setup('blocked'),before=await readFile(new URL('data/initial.json',blockedDirectory),'utf8');
 await assert.rejects(syncCloudflareData({directory:blockedDirectory,receipt:laterReceipt,attempts:1,fetcher:async()=>Response.json(raw)}),/precedenti/);
 assert.equal(await readFile(new URL('data/initial.json',blockedDirectory),'utf8'),before);
 const htmlDirectory=await setup('html');
 const fallback=await syncCloudflareData({directory:htmlDirectory,receipt,attempts:1,fetcher:async()=>new Response('<html>not JSON</html>')});
 assert.equal(fallback.route,'repository');
 const merged=mergePublishedHistory([history,{schema:0}],raw);assert(merged.days.every(d=>d.date<=raw.sourceDate));
 console.log('Verificati sincronizzazione Cloudflare, attesa della pubblicazione, hash di tutti i listini, rifiuto delle regressioni, storico e date originali.');
}finally{await rm(parent,{recursive:true,force:true});}
