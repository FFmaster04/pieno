import {createHash} from 'node:crypto';
import {readFile,writeFile,rename} from 'node:fs/promises';
import {validatePublishedSnapshot,newestValidSnapshot} from './update-source.mjs';
import {validateHistory,appendHistory} from './history.mjs';
import {snapshotFreshness} from './freshness.mjs';

export const CLOUDFLARE_UPSTREAM='https://ffmaster04.github.io/pieno/';
export function snapshotReceipt(raw){
 validatePublishedSnapshot(raw);
 return {checkedDay:raw.checkedAt.slice(0,10),sourceDate:raw.sourceDate,stations:raw.rows.length,priceCount:raw.priceCount,checkedAt:raw.checkedAt,snapshotHash:createHash('sha256').update(JSON.stringify(raw)).digest('hex')};
}
export function matchesReceipt(raw,receipt={}){
 try{
  validatePublishedSnapshot(raw,receipt.sourceDate||'');
  if(raw.sourceDate===receipt.sourceDate&&receipt.checkedAt){
   const actual=Date.parse(raw.checkedAt),expected=Date.parse(receipt.checkedAt);
   if(!Number.isFinite(expected)||actual<expected)return false;
   if(actual===expected&&receipt.snapshotHash&&snapshotReceipt(raw).snapshotHash!==receipt.snapshotHash)return false;
  }
  return true;
 }catch{return false;}
}
export function selectCloudflareSnapshot(candidates,receipt={}){
 return newestValidSnapshot(candidates.filter(raw=>matchesReceipt(raw,receipt)),receipt.sourceDate||'');
}
async function fetchJSON(url,fetcher,maxBytes=16*1024*1024){
 const response=await fetcher(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});
 if(!response.ok)throw Error('Copia pubblicata non disponibile: '+response.status);
 if(Number(response.headers.get('content-length'))>maxBytes)throw Error('Copia pubblicata troppo grande');
 const chunks=[];let size=0;
 for await(const chunk of response.body){size+=chunk.length;if(size>maxBytes)throw Error('Copia pubblicata troppo grande');chunks.push(chunk);}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function mergePublishedHistory(candidates,snapshot){
 const days=new Map();
 for(const raw of candidates){
  try{for(const day of validateHistory(raw).days)if(day.date<=snapshot.sourceDate)days.set(day.date,day);}catch{}
 }
 return appendHistory({schema:1,days:[...days.values()].sort((a,b)=>a.date.localeCompare(b.date))},snapshot);
}
export async function syncCloudflareData({directory,receipt={},fetcher=fetch,attempts=6,delay=ms=>new Promise(resolve=>setTimeout(resolve,ms)),now=()=>new Date()}){
 let local,localHistory,remote,selected;
 try{local=JSON.parse(await readFile(new URL('data/initial.json',directory),'utf8'));}catch{}
 try{localHistory=JSON.parse(await readFile(new URL('data/history.json',directory),'utf8'));}catch{}
 for(let i=0;i<attempts;i++){
  try{
   const url=new URL('data/initial.json',CLOUDFLARE_UPSTREAM);url.searchParams.set('pieno_build',now().getTime()+'-'+i);
   remote=await fetchJSON(url.href,fetcher);
  }catch{console.warn('La copia pubblicata non risponde; verifico la copia disponibile.');}
  selected=selectCloudflareSnapshot([remote,local],receipt);
  if(selected)break;
  if(i+1<attempts){console.log('Attendo che GitHub Pages completi la pubblicazione dei listini.');await delay(5000);}
 }
 if(!selected)throw Error('Il nuovo sito non può pubblicare listini precedenti alla versione registrata su GitHub.');
 let remoteHistory;
 try{remoteHistory=await fetchJSON(new URL('data/history.json',CLOUDFLARE_UPSTREAM).href,fetcher,2*1024*1024);}catch{console.warn('Storico remoto non disponibile; conservo quello validato.');}
 const history=mergePublishedHistory([localHistory,remoteHistory],selected);
 for(const [name,data] of [['initial',selected],['history',history]]){
  const temp=new URL('data/'+name+'.next.json',directory),target=new URL('data/'+name+'.json',directory);
  await writeFile(temp,JSON.stringify(data));await rename(temp,target);
 }
 const status={route:selected===remote?'published':'repository',...snapshotReceipt(selected),fresh:snapshotFreshness(selected,now()).fresh};
 console.log(JSON.stringify(status));return status;
}
