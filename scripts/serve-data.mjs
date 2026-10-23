import {createServer} from 'node:http';
import {setDefaultResultOrder} from 'node:dns';
import {gzipSync} from 'node:zlib';
import {downloadCSVPair,SourceUnavailableError} from '../lib/update-source.mjs';
import {createSnapshotProvider} from '../lib/data-service.mjs';
import {fetchCSV} from '../lib/source-transport.mjs';

setDefaultResultOrder('ipv4first');
const getSnapshot=createSnapshotProvider({download:()=>downloadCSVPair({fetcher:fetchCSV,attempts:2,retryDelay:10000})});
let lastSnapshot,plain,gzip;
const server=createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Robots-Tag','noindex, nofollow');
 res.setHeader('Cache-Control','no-store');
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
 let path;try{path=new URL(req.url,'http://localhost').pathname;}catch{res.writeHead(400);res.end();return;}
 if(path==='/robots.txt'){res.writeHead(200,{'Content-Type':'text/plain'});res.end('User-agent: *\nDisallow: /\n');return;}
 if(path==='/healthz'||path==='/'){
  res.writeHead(200,{'Content-Type':'application/json'});
  res.end(JSON.stringify({service:'pieno — acquisizione open data MIMIT',status:'ready',sourceDate:lastSnapshot?.sourceDate||null,checkedAt:lastSnapshot?.checkedAt||null,endpoint:'/data/initial.json',source:'https://www.mimit.gov.it/it/open-data/elenco-dataset/carburanti-prezzi-praticati-e-anagrafica-degli-impianti',license:'IODL 2.0'}));return;
 }
 if(path!=='/data/initial.json'){res.writeHead(404);res.end();return;}
 // A monitoring HEAD request must not trigger a ministry download.
 if(req.method==='HEAD'){res.writeHead(200,{'Content-Type':'application/json'});res.end();return;}
 try{
  const snapshot=await getSnapshot();
  if(snapshot!==lastSnapshot){plain=Buffer.from(JSON.stringify(snapshot));gzip=gzipSync(plain);lastSnapshot=snapshot;console.log(JSON.stringify({result:'updated',sourceDate:snapshot.sourceDate,checkedAt:snapshot.checkedAt,stations:snapshot.rows.length,prices:snapshot.priceCount}));}
  const compressed=/(?:^|[,\s])gzip(?:[,\s]|$)/i.test(req.headers['accept-encoding']||'');
  const body=compressed?gzip:plain;
  res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Content-Length':body.length,'Vary':'Accept-Encoding','X-Pieno-Source-Date':snapshot.sourceDate,...compressed?{'Content-Encoding':'gzip'}:{}});res.end(body);
 }catch(error){
  console.error(JSON.stringify({result:'unavailable',code:error.code||'INVALID_SOURCE',message:error.message}));
  res.writeHead(error instanceof SourceUnavailableError?503:502,{'Content-Type':'application/json','Retry-After':'600'});
  res.end(JSON.stringify({error:'Estrazione aggiornata momentaneamente non disponibile.',code:error.code||'INVALID_SOURCE'}));
 }
});
server.requestTimeout=240000;
server.listen(Number(process.env.PORT||10000),'0.0.0.0',()=>console.log('Servizio dati pronto.'));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
