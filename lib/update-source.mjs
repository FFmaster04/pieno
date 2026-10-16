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
