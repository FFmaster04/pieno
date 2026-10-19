import {writeFile,rename,readFile,mkdir,appendFile} from 'node:fs/promises';
import {packDataset,unpackDataset} from '../lib/wire.mjs';
import {downloadCSVPair,validatePublishedSnapshot,refreshDataset,newestValidSnapshot} from '../lib/update-source.mjs';
import {fetchCSV} from '../lib/source-transport.mjs';
const target=new URL('../public/data/initial.json',import.meta.url);
let previous,minimumDate='',published,localRaw,remoteRaw;
try{localRaw=validatePublishedSnapshot(JSON.parse(await readFile(target,'utf8')));previous=unpackDataset(localRaw);minimumDate=previous.sourceDate;}catch{}
try{const receipt=JSON.parse(await readFile(new URL('../.github/data-status.json',import.meta.url),'utf8'));if(receipt.sourceDate>minimumDate)minimumDate=receipt.sourceDate;}catch{}
if(process.env.PREVIOUS_SNAPSHOT_URL){
 try{
  const r=await fetch(process.env.PREVIOUS_SNAPSHOT_URL,{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('Copia pubblicata non raggiungibile: '+r.status);
  remoteRaw=await r.json();
 }catch(error){console.warn('Copia pubblicata non disponibile:',error.message);}
}
const bestBackup=newestValidSnapshot([localRaw,remoteRaw],minimumDate);
if(bestBackup){published=unpackDataset(bestBackup);previous=published;}
const {data:next,result,sourceError,sourceErrorDetail}=await refreshDataset({
 download:()=>downloadCSVPair({fetcher:fetchCSV,attempts:process.env.GITHUB_EVENT_NAME==='push'?1:3,retryDelay:20000}),
 published,minimumDate:previous&&previous.sourceDate>minimumDate?previous.sourceDate:minimumDate,
});
if(result==='cached'){console.warn('::warning::Fonte MIMIT temporaneamente non disponibile: conservata l’ultima copia valida. Un nuovo controllo partirà automaticamente.');console.warn(sourceErrorDetail);}
await mkdir(new URL('../public/data/',import.meta.url),{recursive:true});
const tmp=new URL('../public/data/initial.next.json',import.meta.url);
await writeFile(tmp,JSON.stringify(packDataset(next)));await rename(tmp,target);
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`### Controllo dati MIMIT\n\n${result==='updated'?'Fonte raggiunta e dati validati.':'Fonte temporaneamente non raggiungibile; riutilizzata la copia pubblicata e validata.'}\n\n- Estrazione disponibile: ${next.sourceDate}\n- Ultimo controllo riuscito della fonte: ${next.checkedAt}\n- Esito: ${result}${sourceError?' · '+sourceError:''}\n`);
console.log(JSON.stringify({result,sourceError,sourceDate:next.sourceDate,stations:next.stations.length,prices:next.priceCount,checkedAt:next.checkedAt}));
