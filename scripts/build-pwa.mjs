import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const output=new URL('../dist-static/',import.meta.url),base=(process.env.PAGES_BASE_PATH||'/').replace(/\/?$/,'/');
const assets=(await readdir(new URL('assets/',output))).map(n=>'assets/'+n);
const core=['',...assets,'fonts/body.ttf','fonts/display.ttf','favicon.svg','manifest.webmanifest','icons/pieno-192.png','icons/pieno-512.png','icons/pieno-maskable.png','icons/apple-touch-icon.png'];

const manifest={id:base,name:'pieno · Il prezzo giusto',short_name:'pieno',description:'Prezzi dei carburanti, costo del pieno e confronti in tutta Italia.',lang:'it',start_url:base,scope:base,display:'standalone',background_color:'#fafbf6',theme_color:'#d2f65a',icons:[{src:'icons/pieno-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'icons/pieno-512.png',sizes:'512x512',type:'image/png',purpose:'any'},{src:'icons/pieno-maskable.png',sizes:'512x512',type:'image/png',purpose:'maskable'}],categories:['travel','navigation','utilities']};
await writeFile(new URL('manifest.webmanifest',output),JSON.stringify(manifest));
const digest=createHash('sha256');for(const path of core)digest.update(await readFile(new URL(path||'index.html',output)));const hash=digest.digest('hex').slice(0,14);
const worker=`const BASE=${JSON.stringify(base)},SHELL='pieno-shell-${hash}',DATA='pieno-data-v1';
const CORE=${JSON.stringify(core.map(p=>base+p))};
const FILES=['data/initial.json','data/search-places.json','data/history.json'];
async function dataResponse(request){
 const cache=await caches.open(DATA);
 try{
  const r=await fetch(request,{signal:AbortSignal.timeout(10000),cache:'no-cache'});if(!r.ok)throw Error('Dati non disponibili');
  const value=await r.clone().json(),path=new URL(request.url||request,self.location.origin).pathname;
  if(path.endsWith('/initial.json')&&!(value.rows?.length>0&&/^\\d{4}-\\d{2}-\\d{2}$/.test(value.sourceDate)))throw Error('Listino non valido');
  if(path.endsWith('/search-places.json')&&!(value.schema===1&&value.municipalities?.length>7000))throw Error('Indice non valido');
  if(path.endsWith('/history.json')&&!(value.schema===1&&Array.isArray(value.days)))throw Error('Storico non valido');
  await cache.put(request,r.clone());return r;
 }catch(error){const cached=await cache.match(request);if(!cached)throw error;const headers=new Headers(cached.headers);headers.set('X-Pieno-Offline','1');return new Response(cached.body,{status:200,headers});}
}
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(SHELL);await cache.addAll(CORE);await Promise.allSettled(FILES.map(path=>dataResponse(new Request(new URL(BASE+path,self.location.origin)))));})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys(),old=keys.filter(k=>k.startsWith('pieno-shell-')&&k!==SHELL);await Promise.all(old.slice(0,-1).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 // External geocoding, directions and OSM map tiles use their normal browser behavior.
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(BASE))return;
 if(FILES.some(path=>url.pathname===BASE+path)){event.respondWith(dataResponse(request));return;}
 if(request.mode==='navigate'){event.respondWith((async()=>{try{const r=await fetch(request,{signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error();return r;}catch{const r=await (await caches.open(SHELL)).match(BASE);return r||new Response('Apri pieno una prima volta con una connessione disponibile.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}})());return;}
 if(url.pathname.startsWith(BASE+'assets/')||url.pathname.startsWith(BASE+'fonts/')||url.pathname.startsWith(BASE+'icons/')||url.pathname===BASE+'favicon.svg'||url.pathname===BASE+'manifest.webmanifest')event.respondWith((async()=>{const cache=await caches.open(SHELL),cached=await cache.match(request);if(cached)return cached;const r=await fetch(request);if(r.ok)await cache.put(request,r.clone());return r;})());
});
`;
await writeFile(new URL('sw.js',output),worker);
console.log('PWA pronta:',hash,'scope',base,'· shell, listini e indice offline; nessuna mappa scaricata.');
