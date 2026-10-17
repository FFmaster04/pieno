import {URLS} from './fuel-data.mjs';
// The two ministerial files can be published a few minutes apart.
export async function downloadCSVPair({fetcher=fetch,now=()=>new Date(),attempts=6,delay=ms=>new Promise(resolve=>setTimeout(resolve,ms)),retryDelay=60000}={}){
 let lastError;
 for(let attempt=0;attempt<attempts;attempt++){
  try{
   const nonce=now().getTime()+'-'+attempt;
   const texts=await Promise.all(URLS.map(async source=>{
    const url=new URL(source);url.searchParams.set('pieno_check',nonce);
    const response=await fetcher(url.href,{cache:'no-store',signal:AbortSignal.timeout(45000),headers:{'User-Agent':'Pieno-open-data/1.1','Accept':'text/csv','Cache-Control':'no-cache','Pragma':'no-cache'}});
    if(!response.ok)throw Error('Fonte MIMIT non raggiungibile: '+response.status);
    return response.text();
   }));
   const dates=texts.map(text=>text.slice(0,text.indexOf('\n')).match(/\d{4}-\d{2}-\d{2}/)?.[0]);
   if(!dates[0]||dates[0]!==dates[1])throw Error('Le due estrazioni MIMIT non sono ancora allineate.');
   return texts;
  }catch(error){lastError=error;if(attempt+1<attempts){console.warn('Fonte MIMIT non pronta, nuovo tentativo',attempt+2,'di',attempts);await delay(retryDelay);}}
 }
 throw lastError;
}

// Reuse only a complete published snapshot, preserving its original timestamps.
export function validatePublishedSnapshot(raw,minimumDate=''){
 if(raw?.schema!==2||!/^\d{4}-\d{2}-\d{2}$/.test(raw.sourceDate)||!Number.isFinite(Date.parse(raw.checkedAt))||!Number.isFinite(Date.parse(raw.fetchedAt))||!Array.isArray(raw.rows)||raw.rows.length<10000||!Array.isArray(raw.fuels)||!raw.averages)throw Error('Copia pubblicata non valida.');
 if(raw.sourceDate<minimumDate)throw Error('Copia pubblicata precedente all’ultima estrazione registrata.');
 let prices=0;
 for(const row of raw.rows){
  if(!Array.isArray(row)||!Number.isInteger(row[0])||!(row[7]>=35&&row[7]<=48&&row[8]>=6&&row[8]<=20)||!Array.isArray(row[9]))throw Error('Impianti della copia pubblicata non validi.');
  for(const p of row[9]){
   if(!Array.isArray(p)||!Number.isInteger(p[0])||!raw.fuels[p[0]]||!(Number.isFinite(p[1])&&p[1]>0)||![0,1].includes(p[2])||!Number.isFinite(Date.parse(p[3])))throw Error('Listini della copia pubblicata non validi.');
   prices++;
  }
 }
 if(prices<40000||prices!==raw.priceCount)throw Error('Copia pubblicata incompleta.');
 return raw;
}
