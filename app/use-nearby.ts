import {useCallback,useEffect,useRef,useState} from 'react';
import {shouldLocateOnOpen,supportedPosition} from '@/lib/nearby';

export function useNearby(onLocated:(point:[number,number])=>void,notify:(message:string)=>void){
 const [locating,setLocating]=useState(false);
 const request=useRef(0),pending=useRef(false),locatedRef=useRef(onLocated),notifyRef=useRef(notify);
 locatedRef.current=onLocated;notifyRef.current=notify;
 const cancel=useCallback(()=>{request.current++;pending.current=false;setLocating(false);},[]);
 const locate=useCallback(()=>{
  if(pending.current)return;
  if(!navigator.geolocation){notifyRef.current('Questo browser non supporta la posizione. Cerca città, indirizzo o CAP.');return;}
  const seq=++request.current;pending.current=true;setLocating(true);
  const finish=()=>{if(seq!==request.current)return false;pending.current=false;setLocating(false);return true;};
  try{navigator.geolocation.getCurrentPosition(position=>{
   if(!finish())return;
   const {latitude,longitude}=position.coords;
   if(!supportedPosition(latitude,longitude)){notifyRef.current('La posizione è fuori dall’area coperta. Cerca una località italiana.');return;}
   locatedRef.current([latitude,longitude]);
  },error=>{
   if(!finish())return;
   notifyRef.current(error.code===1?'Posizione non autorizzata. Puoi cercare città, indirizzo o CAP.':error.code===3?'La ricerca della posizione ha impiegato troppo tempo. Cerca una località o riprova con “Vicino a me”.':'Posizione non disponibile. Cerca una località o riprova con “Vicino a me”.');
  },{enableHighAccuracy:false,timeout:12000,maximumAge:60000});}
  catch{if(finish())notifyRef.current('Posizione non disponibile. Puoi cercare città, indirizzo o CAP.');}
 },[]);
 useEffect(()=>{if(shouldLocateOnOpen(window.location.search))locate();return()=>{request.current++;pending.current=false;};},[locate]);
 return {locating,locate,cancel};
}
