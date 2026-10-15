import {readFile,writeFile,rename} from 'node:fs/promises';
import {appendHistory,validateHistory} from '../lib/history.mjs';
import {unpackDataset} from '../lib/wire.mjs';
const path=new URL('../public/data/history.json',import.meta.url);
let history={schema:1,days:[]};try{history=validateHistory(JSON.parse(await readFile(path,'utf8')));}catch(error){if(error.code!=='ENOENT')throw error;}
const dataset=unpackDataset(JSON.parse(await readFile(new URL('../public/data/initial.json',import.meta.url),'utf8')));
const next=appendHistory(history,dataset),tmp=new URL('../public/data/history.next.json',import.meta.url);
await writeFile(tmp,JSON.stringify(next)+'\n');await rename(tmp,path);
console.log('Storico medie:',next.days.length,'giorni reali, ultima estrazione',next.days.at(-1).date);
