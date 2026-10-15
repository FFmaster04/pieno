import {readPreferences,readScope,storeScope,type Preferences,type StoredScope} from './preferences.ts';
import type {PlaceScope} from './search';
import type {Bounds} from './types';
export type SearchState={fuel:string;mode:string;litres:number;kilograms:number;scope:PlaceScope|null;road:string;recent:boolean;sort:string;compareIds:number[]};
export type SharedSearch={preferences:Preferences;scope:StoredScope|null;compareIds:number[];view:{lat:number;lng:number;zoom:number}|null};
export function searchLink(base:string,state:SearchState,bounds:Bounds|null){
 const url=new URL(base);url.search='';url.hash='esplora';const p=url.searchParams;
 p.set('ricerca','1');p.set('carburante',state.fuel);p.set('erogazione',state.mode);p.set('litri',String(state.litres));p.set('kg',String(state.kilograms));p.set('rete',state.road);p.set('recenti',state.recent?'1':'0');p.set('ordina',state.sort);
 const scope=storeScope(state.scope);
 if(scope){p.set('area',scope.kind);if(scope.kind==='city'||scope.kind==='province')p.set('comune',scope.id);else if(scope.kind==='postcode')p.set('cap',scope.code);else if(scope.kind==='address'){p.set('indirizzo',scope.name);p.set('localita',scope.detail);p.set('lat',scope.lat.toFixed(6));p.set('lng',scope.lng.toFixed(6));p.set('raggio',String(scope.radius));}}
 else if(bounds&&bounds.zoom>=7){p.set('lat',((bounds.north+bounds.south)/2).toFixed(5));p.set('lng',((bounds.east+bounds.west)/2).toFixed(5));p.set('zoom',String(bounds.zoom));}
 if(state.compareIds.length)p.set('confronta',state.compareIds.slice(0,3).join(','));
 return url.href;
}
export function readSharedSearch(search:string,fuels:string[]):SharedSearch|null{
 const p=new URLSearchParams(search);if(p.get('ricerca')!=='1')return null;
 const amount=(key:string)=>{const v=p.get(key);return v!==null&&/^\d{1,3}$/.test(v)?Number(v):undefined;};
 const raw={schema:1,fuel:p.get('carburante'),mode:p.get('erogazione'),litres:amount('litri'),kilograms:amount('kg'),road:p.get('rete'),recent:p.get('recenti')!=='0',sort:p.get('ordina')};
 let scope:StoredScope|null=null;
 const kind=p.get('area'),lat=p.has('lat')?Number(p.get('lat')):NaN,lng=p.has('lng')?Number(p.get('lng')):NaN;
 if(kind==='city'||kind==='province')scope=readScope({kind,id:p.get('comune')});
 else if(kind==='postcode')scope=readScope({kind,code:p.get('cap')});
 else if(kind==='address')scope=readScope({kind,name:p.get('indirizzo'),detail:p.get('localita')||'',lat,lng,radius:Number(p.get('raggio'))});
 const z=Number(p.get('zoom')),view=!scope&&!kind&&Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=35&&lat<=48&&lng>=6&&lng<=20&&z>=4&&z<=19?{lat,lng,zoom:z}:null;
 const compareIds=[...new Set((p.get('confronta')||'').split(',').filter(s=>/^\d{1,9}$/.test(s)).map(Number).filter(n=>n>0))].slice(0,3);
 return {preferences:readPreferences({...raw,scope},fuels)!,scope,compareIds,view};
}
