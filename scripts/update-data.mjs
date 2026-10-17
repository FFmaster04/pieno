import {writeFile,rename,readFile,mkdir} from 'node:fs/promises';
import {buildDataset} from '../lib/fuel-data.mjs';
import {packDataset,unpackDataset} from '../lib/wire.mjs';
import {downloadCSVPair,validatePublishedSnapshot} from '../lib/update-source.mjs';
const target=new URL('../public/data/initial.json',import.meta.url);
let previous,minimumDate='',published;
try{previous=unpackDataset(JSON.parse(await readFile(target,'utf8')));minimumDate=previous.sourceDate;}catch{}
try{const receipt=JSON.parse(await readFile(new URL('../.github/data-status.json',import.meta.url),'utf8'));if(receipt.sourceDate>minimumDate)minimumDate=receipt.sourceDate;}catch{}
if(process.env.PREVIOUS_SNAPSHOT_URL){
 try{
  const r=await fetch(process.env.PREVIOUS_SNAPSHOT_URL,{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('Copia pubblicata non raggiungibile: '+r.status);
  published=unpackDataset(validatePublishedSnapshot(await r.json(),minimumDate));
  if(!previous||published.sourceDate>previous.sourceDate)previous=published;
 }catch(error){console.warn('Copia pubblicata non disponibile:',error.message);}
}
let next;
try{
 const texts=await downloadCSVPair({attempts:process.env.GITHUB_EVENT_NAME==='push'?1:6});
 next=buildDataset(...texts);
 if(next.sourceDate<minimumDate||(previous&&next.sourceDate<previous.sourceDate))throw Error('Estrazione precedente alla copia salvata.');
}catch(error){
 // A source outage must not block publishing an interface fix. Scheduled checks
 // still fail visibly in Actions, and a failed check never gets a new timestamp.
 if(process.env.GITHUB_EVENT_NAME!=='push'||!published)throw error;
 console.warn('::warning::Fonte MIMIT non disponibile: pubblicata l’interfaccia con l’ultima copia valida, senza modificare le date.');
 console.warn(error.message);
 next=published;
}
await mkdir(new URL('../public/data/',import.meta.url),{recursive:true});
const tmp=new URL('../public/data/initial.next.json',import.meta.url);
await writeFile(tmp,JSON.stringify(packDataset(next)));await rename(tmp,target);
console.log(JSON.stringify({sourceDate:next.sourceDate,stations:next.stations.length,prices:next.priceCount,checkedAt:next.checkedAt}));
