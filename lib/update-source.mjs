import {URLS,buildDataset} from './fuel-data.mjs';
export class SourceUnavailableError extends Error{
 constructor(message,{cause,code='MIMIT_UNAVAILABLE'}={}){super(message,{cause});this.name='SourceUnavailableError';this.code=code;}
}
// The two ministerial files can be published a few minutes apart.
export async function downloadCSVPair({fetcher=fetch,now=()=>new Date(),attempts=6,delay=ms=>new Promise(resolve=>setTimeout(resolve,ms)),retryDelay=60000}={}){
 let lastError;
 for(let attempt=0;attempt<attempts;attempt++){
  try{
   const nonce=now().getTime()+'-'+attempt;
   const texts=await Promise.all(URLS.map(async source=>{
    const url=new URL(source);url.searchParams.set('pieno_check',nonce);
    const response=await fetcher(url.href,{cache:'no-store',signal:AbortSignal.timeout(65000),headers:{'User-Agent':'Pieno-open-data/1.1','Accept':'text/csv','Cache-Control':'no-cache','Pragma':'no-cache'}});
    if(!response.ok){
     const message='Fonte MIMIT non raggiungibile: '+response.status;
     if([408,425,429].includes(response.status)||response.status>=500)throw new SourceUnavailableError(message,{code:'MIMIT_HTTP_'+response.status});
     throw Error(message);
    }
    return response.text();
   }));
   const dates=texts.map(text=>text.slice(0,text.indexOf('\n')).match(/\d{4}-\d{2}-\d{2}/)?.[0]);
   if(!dates[0]||!dates[1])throw Error('Formato delle estrazioni MIMIT non riconosciuto.');
   if(dates[0]!==dates[1])throw new SourceUnavailableError('Le due estrazioni MIMIT non sono ancora allineate.',{code:'MIMIT_ROLLOVER'});
   return texts;
  }catch(error){
   if(!(error instanceof SourceUnavailableError)){
    const networkCode=error.cause?.code||error.code;
    if(['UND_ERR_CONNECT_TIMEOUT','UND_ERR_HEADERS_TIMEOUT','UND_ERR_BODY_TIMEOUT','ETIMEDOUT','ECONNRESET','ECONNREFUSED','ENOTFOUND','EAI_AGAIN'].includes(networkCode)||['TimeoutError','AbortError'].includes(error.name))error=new SourceUnavailableError('Connessione alla fonte MIMIT non riuscita.',{cause:error,code:'MIMIT_CONNECTION'});
    else throw error;
   }
   lastError=error;if(attempt+1<attempts){console.warn('Fonte MIMIT non pronta, nuovo tentativo',attempt+2,'di',attempts);await delay(retryDelay);}}
 }
 throw lastError;
}

// Source availability is separate from data integrity: only a known temporary
// outage can reuse an already validated copy, for every kind of workflow run.
export async function refreshDataset({download=downloadCSVPair,published,minimumDate=''}){
 try{
  const next=buildDataset(...await download());
  if(next.sourceDate<minimumDate)throw Error('Estrazione precedente alla copia salvata.');
  return {data:next,result:'updated'};
 }catch(error){
  if(!(error instanceof SourceUnavailableError)||!published)throw error;
  if(published.sourceDate<minimumDate)throw Error('Copia pubblicata precedente all’ultima estrazione registrata.');
  return {data:published,result:'cached',sourceError:error.code};
 }
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
