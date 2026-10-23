import {buildDataset} from './fuel-data.mjs';
import {packDataset} from './wire.mjs';
import {validatePublishedSnapshot,SourceUnavailableError} from './update-source.mjs';
import {calendarDayInItaly,snapshotFreshness} from './freshness.mjs';

// One shared acquisition per day/process; parallel requests reuse the same work.
// No request can select a source host, destination, URL, command, or credentials.
export function createSnapshotProvider({download,now=()=>new Date(),retryAfterMs=600000}={}){
 let current,inFlight,retryAt=0;
 return async function getSnapshot(){
  if(current&&snapshotFreshness(current,now()).fresh&&calendarDayInItaly(new Date(current.checkedAt))===calendarDayInItaly(now()))return current;
  if(inFlight)return inFlight;
  if(now().getTime()<retryAt)throw new SourceUnavailableError('Nuovo tentativo della fonte disponibile tra pochi minuti.',{code:'FEED_COOLDOWN'});
  retryAt=now().getTime()+retryAfterMs;
  inFlight=(async()=>{
   const texts=await download();
   const next=validatePublishedSnapshot(packDataset(buildDataset(...texts,now())),current?.sourceDate||'');
   if(!snapshotFreshness(next,now()).fresh)throw new SourceUnavailableError('MIMIT non ha ancora pubblicato l’estrazione attesa.',{code:'FEED_STALE'});
   current=next;return current;
  })();
  try{return await inFlight;}finally{inFlight=undefined;}
 };
}
