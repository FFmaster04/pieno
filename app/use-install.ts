import {useEffect,useState} from 'react';
type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
export function useInstall(){
 const [prompt,setPrompt]=useState<InstallPrompt|null>(null),[installed,setInstalled]=useState(false),[offline,setOffline]=useState(false),[ready,setReady]=useState(false),[update,setUpdate]=useState<ServiceWorker|null>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{
  const display=window.matchMedia('(display-mode: standalone)'),status=()=>{setInstalled(display.matches||!!(navigator as Navigator&{standalone?:boolean}).standalone);setOffline(!navigator.onLine);};status();
  const before=(event:Event)=>{event.preventDefault();setPrompt(event as InstallPrompt);},done=()=>{setInstalled(true);setPrompt(null);};
  window.addEventListener('beforeinstallprompt',before);window.addEventListener('appinstalled',done);window.addEventListener('online',status);window.addEventListener('offline',status);display.addEventListener('change',status);
  let disposed=false;
  if('serviceWorker'in navigator&&import.meta.env.PROD){
   navigator.serviceWorker.register((import.meta.env.BASE_URL||'/')+'sw.js',{scope:import.meta.env.BASE_URL||'/',updateViaCache:'none'}).then(registration=>{
    if(disposed)return;if(registration.waiting)setUpdate(registration.waiting);
    registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller&&!disposed)setUpdate(worker);});});
    navigator.serviceWorker.ready.then(async()=>{if(disposed)return;try{const cache=await caches.open('pieno-data-v1');const cached=await cache.match(new URL((import.meta.env.BASE_URL||'/')+'data/initial.json',window.location.origin));if(!disposed)setReady(!!cached);}catch{}});
   }).catch(()=>{if(!disposed)setFailed(true);});
  }
  return()=>{disposed=true;window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',done);window.removeEventListener('online',status);window.removeEventListener('offline',status);display.removeEventListener('change',status);};
 },[]);
 async function install(){if(!prompt)return false;try{await prompt.prompt();const choice=await prompt.userChoice;setPrompt(null);return choice.outcome==='accepted';}catch{setPrompt(null);return false;}}
 function applyUpdate(){if(!update)return;navigator.serviceWorker.addEventListener('controllerchange',()=>window.location.reload(),{once:true});update.postMessage({type:'SKIP_WAITING'});}
 return {canPrompt:!!prompt,installed,offline,ready,update:!!update,failed,install,applyUpdate};
}
