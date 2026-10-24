import {readSharedSearch} from './share.ts';

export function shouldLocateOnOpen(search:string){
 const params=new URLSearchParams(search),id=params.get('impianto');
 if(id&&/^[1-9]\d{0,8}$/.test(id))return false;
 const shared=readSharedSearch(search,[]);
 return !shared?.scope&&!shared?.view;
}

export function supportedPosition(lat:number,lng:number){
 return Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=35&&lat<=48&&lng>=6&&lng<=20;
}
