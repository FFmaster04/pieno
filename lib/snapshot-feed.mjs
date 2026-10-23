import {SourceUnavailableError,validatePublishedSnapshot} from './update-source.mjs';
import {snapshotFreshness,calendarDayInItaly} from './freshness.mjs';

const networkCodes=new Set(['UND_ERR_CONNECT_TIMEOUT','UND_ERR_HEADERS_TIMEOUT','UND_ERR_BODY_TIMEOUT','ETIMEDOUT','ECONNRESET','ECONNREFUSED','ENOTFOUND','EAI_AGAIN']);
// This reads a configured, purpose-built data feed, never an arbitrary proxy URL.
export async function fetchSnapshotFeed(url,{fetcher=fetch,minimumDate='',now=()=>new Date(),attempts=2,delay=ms=>new Promise(resolve=>setTimeout(resolve,ms)),timeout=210000,maxBytes=16*1024*1024}={}){
 const endpoint=new URL(url);
 if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password)throw Error('Il servizio dati richiede un URL HTTPS senza credenziali.');
 let lastError;
 for(let attempt=0;attempt<attempts;attempt++){
  try{
   endpoint.searchParams.set('pieno_check',now().getTime());
   const response=await fetcher(endpoint.href,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(timeout),headers:{Accept:'application/json','Cache-Control':'no-cache'}});
   if(!response.ok){
    if([408,425,429].includes(response.status)||response.status>=500)throw new SourceUnavailableError('Servizio dati temporaneamente non disponibile: '+response.status,{code:'FEED_HTTP_'+response.status});
    throw Error('Configurazione del servizio dati non valida: '+response.status);
   }
   if(!response.headers.get('content-type')?.includes('application/json'))throw new SourceUnavailableError('Servizio dati in avvio: risposta JSON non ancora disponibile.',{code:'FEED_WARMING'});
   if(Number(response.headers.get('content-length'))>maxBytes)throw Error('Risposta del servizio dati troppo grande.');
   const chunks=[];let size=0;
   for await(const chunk of response.body){size+=chunk.length;if(size>maxBytes){await response.body.cancel?.().catch(()=>{});throw Error('Risposta del servizio dati troppo grande.');}chunks.push(chunk);}
   const raw=validatePublishedSnapshot(JSON.parse(Buffer.concat(chunks).toString('utf8')),minimumDate);
   if(!snapshotFreshness(raw,now()).fresh)throw new SourceUnavailableError('Il servizio dati non ha ancora l’estrazione attesa.',{code:'FEED_STALE'});
   if(Date.parse(raw.checkedAt)>now().getTime()+300000||Date.parse(raw.fetchedAt)>now().getTime()+300000)throw Error('Date del servizio dati nel futuro.');
   if(calendarDayInItaly(new Date(raw.checkedAt))!==calendarDayInItaly(now()))throw new SourceUnavailableError('Il servizio dati non ha ancora controllato la fonte oggi.',{code:'FEED_CHECK_STALE'});
   return raw;
  }catch(error){
   if(!(error instanceof SourceUnavailableError)){
    if(networkCodes.has(error.cause?.code||error.code)||['TimeoutError','AbortError'].includes(error.name))error=new SourceUnavailableError('Connessione al servizio dati non riuscita.',{cause:error,code:'FEED_CONNECTION'});
    else throw error;
   }
   lastError=error;if(attempt+1<attempts)await delay(15000);
  }
 }
 throw lastError;
}
