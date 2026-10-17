import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {SourceUnavailableError} from './update-source.mjs';
const runFile=promisify(execFile);
// curl gives the connection its own timeout; fetch's built-in connector was
// aborting ministerial connections after 10 seconds on the hosted runners.
export function createCSVTransport(run=runFile){
 return async (url,options={})=>{
  const args=['--silent','--show-error','--location','--proto','=https','--proto-redir','=https','--ipv4','--connect-timeout','30','--max-time','60','--write-out','\n%{http_code}'];
  for(const [name,value] of Object.entries(options.headers||{}))args.push('--header',name+': '+value);
  args.push(url);
  let stdout;
  try{({stdout}=await run('curl',args,{encoding:'utf8',maxBuffer:32*1024*1024,signal:options.signal,timeout:65000}));}
  catch(error){
   if([5,6,7,18,28,35,52,55,56,60].includes(error.code)||error.name==='AbortError')throw new SourceUnavailableError('Connessione alla fonte MIMIT non riuscita.',{cause:error,code:'MIMIT_CONNECTION'});
   throw error;
  }
  const end=stdout.lastIndexOf('\n'),status=Number(stdout.slice(end+1));
  if(end<0||!Number.isInteger(status)||status<100||status>599)throw Error('Risposta del programma di download non riconosciuta.');
  const body=stdout.slice(0,end);
  return {ok:status>=200&&status<300,status,text:async()=>body};
 };
}
export const fetchCSV=createCSVTransport();
