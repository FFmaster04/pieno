import {writeFile,rename,readFile,mkdir} from 'node:fs/promises';
import {buildDataset} from '../lib/fuel-data.mjs';
import {packDataset,unpackDataset} from '../lib/wire.mjs';
import {downloadCSVPair} from '../lib/update-source.mjs';
const texts=await downloadCSVPair();
const next=buildDataset(...texts);
const target=new URL('../public/data/initial.json',import.meta.url);
let previous;
try{previous=unpackDataset(JSON.parse(await readFile(target,'utf8')));}catch{}
if(process.env.PREVIOUS_SNAPSHOT_URL){
 try{const r=await fetch(process.env.PREVIOUS_SNAPSHOT_URL,{signal:AbortSignal.timeout(15000)});if(r.ok){const live=unpackDataset(await r.json());if(!previous||live.sourceDate>previous.sourceDate)previous=live;}}catch{}
}
if(previous&&next.sourceDate<previous.sourceDate)throw Error('Estrazione precedente alla copia salvata.');
await mkdir(new URL('../public/data/',import.meta.url),{recursive:true});
const tmp=new URL('../public/data/initial.next.json',import.meta.url);
await writeFile(tmp,JSON.stringify(packDataset(next)));await rename(tmp,target);
console.log(JSON.stringify({sourceDate:next.sourceDate,stations:next.stations.length,prices:next.priceCount,checkedAt:next.checkedAt}));
