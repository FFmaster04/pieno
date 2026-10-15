import type {PlaceData,PlaceScope} from './search';
export type StoredScope={kind:'city'|'province';id:string}|{kind:'postcode';code:string}|{kind:'address';name:string;detail:string;lat:number;lng:number;radius:number};
export type Preferences={schema:1;fuel:string;mode:'self'|'served';litres:number;kilograms:number;scope:StoredScope|null;road:'all'|'road'|'highway';recent:boolean;sort:'price'|'distance'};
export function storeScope(scope:PlaceScope|null):StoredScope|null{
 if(!scope)return null;
 if(scope.kind==='city'||scope.kind==='province')return {kind:scope.kind,id:scope.place.id};
 if(scope.kind==='postcode')return {kind:'postcode',code:scope.code};
 return {kind:'address',name:scope.name,detail:scope.detail,lat:scope.lat,lng:scope.lng,radius:scope.radius};
}
export function readScope(raw:unknown):StoredScope|null{
 if(!raw||typeof raw!=='object')return null;const s=raw as Record<string,unknown>;
 if((s.kind==='city'||s.kind==='province')&&typeof s.id==='string'&&/^\d{6}$/.test(s.id))return {kind:s.kind,id:s.id};
 if(s.kind==='postcode'&&typeof s.code==='string'&&/^\d{5}$/.test(s.code))return {kind:'postcode',code:s.code};
 if(s.kind==='address'&&typeof s.name==='string'&&s.name.trim()&&s.name.length<=200&&typeof s.detail==='string'&&s.detail.length<=300&&typeof s.lat==='number'&&typeof s.lng==='number'&&Number.isFinite(s.lat)&&Number.isFinite(s.lng)&&s.lat>=35&&s.lat<=48&&s.lng>=6&&s.lng<=20&&typeof s.radius==='number'&&[1,3,5].includes(s.radius))return {kind:'address',name:s.name,detail:s.detail,lat:s.lat,lng:s.lng,radius:s.radius};
 return null;
}
export function restoreScope(raw:StoredScope|null,places:PlaceData|null):PlaceScope|null{
 if(!raw)return null;if(raw.kind==='address')return {...raw,id:'address-restored'};
 if(!places)return null;
 if(raw.kind==='postcode'){const matches=places.municipalities.filter(p=>p.postcodes.includes(raw.code));return matches.length?{kind:'postcode',code:raw.code,places:matches}:null;}
 const place=places.municipalities.find(p=>p.id===raw.id);return place?{kind:raw.kind,place}:null;
}
export function readPreferences(raw:unknown,fuels:string[]):Preferences|null{
 if(!raw||typeof raw!=='object'||(raw as {schema?:number}).schema!==1)return null;
 const p=raw as Record<string,unknown>;
 const amount=(v:unknown,fallback:number,max:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=1&&v<=max?v:fallback;
 return {schema:1,fuel:typeof p.fuel==='string'&&fuels.includes(p.fuel)?p.fuel:'Benzina',mode:p.mode==='served'?'served':'self',litres:amount(p.litres,40,150),kilograms:amount(p.kilograms,15,100),scope:readScope(p.scope),road:p.road==='road'||p.road==='highway'?p.road:'all',recent:typeof p.recent==='boolean'?p.recent:true,sort:p.sort==='distance'?'distance':'price'};
}
