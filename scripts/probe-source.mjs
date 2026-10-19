import {lookup} from 'node:dns/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
for(const host of ['www.mimit.gov.it','www.mise.gov.it','www.sviluppoeconomico.gov.it','carburanti.mise.gov.it']){
 try{console.log(JSON.stringify({host,dns:await lookup(host,{all:true})}));}catch(error){console.log({host,error:error.code});}
}
const path='/images/exportCSV/prezzo_alle_8.csv';
const probes=[
 {name:'https',url:'https://www.mimit.gov.it'+path},
 {name:'http',url:'http://www.mimit.gov.it'+path},
 {name:'legacy',url:'https://www.mise.gov.it'+path},
 {name:'legacy-old',url:'https://www.sviluppoeconomico.gov.it'+path},
 {name:'explicit-dns',url:'https://www.mimit.gov.it'+path,extra:['--resolve','www.mimit.gov.it:443:81.126.92.6']},
 {name:'official-app',url:'https://carburanti.mise.gov.it/ospzSearch/'},
];
await Promise.all(probes.map(async probe=>{
 try{
  const {stdout}=await run('curl',['--silent','--show-error','--location','--proto','=http,https','--proto-redir','=http,https','--ipv4','--connect-timeout','10','--max-time','15','--range','0-150','--write-out','\nSTATUS %{http_code} IP %{remote_ip} URL %{url_effective}',...(probe.extra||[]),probe.url],{maxBuffer:16*1024*1024,timeout:17000});
  console.log(JSON.stringify({probe:probe.name,response:stdout.slice(0,160),summary:stdout.slice(-220)}));
 }catch(error){console.log(JSON.stringify({probe:probe.name,error:error.stderr||error.message,code:error.code}));}
}));
