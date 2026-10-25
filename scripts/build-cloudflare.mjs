import {readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {syncCloudflareData} from '../lib/cloudflare-site.mjs';

const root=new URL('../',import.meta.url),output=new URL('../dist-static/',import.meta.url);
function run(file,args=[]){
 const result=spawnSync(process.execPath,[fileURLToPath(new URL(file,root)),...args],{cwd:fileURLToPath(root),env:{...process.env,PAGES_BASE_PATH:'/',PAGES_REDIRECT_URL:''},stdio:'inherit'});
 if(result.error)throw result.error;if(result.status!==0)throw Error('Preparazione del sito non riuscita.');
}
run('node_modules/vite/bin/vite.js',['build','--config','vite.static.config.ts']);
let receipt={};try{receipt=JSON.parse(await readFile(new URL('.github/data-status.json',root),'utf8'));}catch{}
await syncCloudflareData({directory:output,receipt});
await writeFile(new URL('_headers',output),'/data/*\n  Cache-Control: public, max-age=0, must-revalidate\n/sw.js\n  Cache-Control: no-cache\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');
run('scripts/build-pwa.mjs');
let files=0,maxBytes=0;
async function inspect(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=new URL(entry.name+(entry.isDirectory()?'/':''),dir);
  if(entry.isDirectory())await inspect(path);
  else{const bytes=(await stat(path)).size;files++;maxBytes=Math.max(maxBytes,bytes);if(bytes>25*1024*1024)throw Error('File oltre il limite gratuito Cloudflare Pages: '+entry.name);}
 }
}
await inspect(output);if(files>20000)throw Error('Troppi file per il piano gratuito.');
console.log('Sito statico pronto per Cloudflare Pages Free:',files,'file, file massimo',maxBytes,'byte. Nessuna Function o risorsa a pagamento.');
