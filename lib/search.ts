import type {Station} from './types';

export type Municipality={id:string;name:string;provinceId:string;plate:string;lat:number;lng:number;postcodes:string[];capital:boolean;aliases:string[];plates:string[]};
export type Province={id:string;name:string;plate:string};
export type PlaceData={schema:number;asOf:string;municipalities:Municipality[];provinces:Province[]};
export type AddressPlace={kind:'address';id:string;name:string;detail:string;lat:number;lng:number;radius:number};
export type PlaceScope={kind:'city';place:Municipality}|{kind:'province';place:Municipality}|{kind:'postcode';code:string;places:Municipality[]}|AddressPlace;
export type PlaceOption={id:string;label:string;detail:string;badge:string;scope:PlaceScope;precision?:'house'|'street';houseNumber?:string};
export const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function distance(a:[number,number],b:[number,number]){
 const r=Math.PI/180,dla=(b[0]-a[0])*r,dlo=(b[1]-a[1])*r,v=Math.sin(dla/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dlo/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(v),Math.sqrt(Math.max(0,1-v)));
}
export function createPlaceIndex(data:PlaceData){
 const names=new Map<string,Municipality[]>(),postal=new Map<string,Municipality[]>(),provinces=new Map(data.provinces.map(p=>[p.id,p]));
 for(const place of data.municipalities){
  for(const name of new Set([place.name,...place.aliases].map(normalize))){const list=names.get(name)||[];list.push(place);names.set(name,list);}
  for(const code of place.postcodes){const list=postal.get(code)||[];list.push(place);postal.set(code,list);}
 }
 const entries=data.municipalities.map(place=>({place,keys:[place.name,...place.aliases].map(normalize)}));
 function municipality(station:Station){
  const matches=names.get(normalize(station.city))||[];
  return matches.find(p=>p.plates.includes(station.province.toUpperCase())) || (matches.length===1?matches[0]:undefined);
 }
 function postcode(station:Station,place=municipality(station)){
  // Multi-CAP municipalities require the station's own declared postal code.
  const explicit=[...station.address.matchAll(/(?:^|\D)(\d{5})(?!\d)/g)].map(m=>m[1]).reverse().find(c=>postal.has(c)&&(!place||!place.postcodes.length||place.postcodes.includes(c))); 
  return explicit || (place?.postcodes.length===1?place.postcodes[0]:undefined);
 }
 function options(query:string):PlaceOption[]{
  const q=normalize(query).replace(/^cap(?=\d)/,'');if(!q)return [];
  if(/^\d{2,5}$/.test(q))return [...postal.entries()].filter(([code])=>code.startsWith(q)).sort(([a],[b])=>a.localeCompare(b)).slice(0,7).map(([code,places])=>({id:'cap-'+code,label:code,detail:places.slice(0,3).map(p=>p.name).join(', ')+(places.length>3?` e altri ${places.length-3} comuni`:''),badge:'CAP',scope:{kind:'postcode',code,places}}));
  const cleaned=q.replace(/^(comunedi|comune|cittadi|citta|provinciadi|provincia)/,'').replace(/(citta|provincia)$/,'');if(!cleaned)return [];
  const matches=entries.filter(e=>e.keys.some(k=>k.includes(cleaned))||e.keys.some(k=>normalize(k+e.place.plate)===cleaned))
   .sort((a,b)=>Number(b.keys.includes(cleaned))-Number(a.keys.includes(cleaned))||Number(b.keys.some(k=>k.startsWith(cleaned)))-Number(a.keys.some(k=>k.startsWith(cleaned)))||Number(b.place.capital)-Number(a.place.capital)||a.place.name.length-b.place.name.length||a.place.name.localeCompare(b.place.name,'it'));
  const result:PlaceOption[]=[];
  for(const {place} of matches){
   const province=provinces.get(place.provinceId)!;
   const city:PlaceOption={id:'city-'+place.id,label:place.name,detail:`Solo il comune · ${place.plate}`,badge:'Città',scope:{kind:'city',place}};
   const area:PlaceOption={id:'province-'+place.id,label:place.name===province.name?place.name:province.name,detail:`Tutti i comuni · ${province.plate}`,badge:'Provincia',scope:{kind:'province',place}};
   if(place.capital&&/^provincia|provincia$/.test(q))result.push(area,city);else{result.push(city);if(place.capital)result.push(area);}
   if(result.length>=7)break;
  }
  // Province names need not coincide with any one of their capitals.
  for(const p of data.provinces.filter(p=>normalize(p.name).includes(cleaned))){if(result.some(o=>o.scope.kind==='province'&&o.scope.place.provinceId===p.id))continue;const place=data.municipalities.find(c=>c.provinceId===p.id&&c.capital);if(place)result.push({id:'province-'+place.id,label:p.name,detail:`Tutti i comuni · ${p.plate}`,badge:'Provincia',scope:{kind:'province',place}});}
  return result.slice(0,8);
 }
 function contains(station:Station,scope:PlaceScope|null){
  if(!scope)return true;
  if(scope.kind==='address')return distance([scope.lat,scope.lng],[station.lat,station.lng])<=scope.radius;
  const place=municipality(station);
  if(scope.kind==='city')return place?.id===scope.place.id;
  if(scope.kind==='province')return place?place.provinceId===scope.place.provinceId:station.province.toUpperCase()===scope.place.plate;
  return postcode(station,place)===scope.code;
 }
 return {options,contains,municipality,postcode,provinces};
}
export type PlaceIndex=ReturnType<typeof createPlaceIndex>;
export function scopeLabel(scope:PlaceScope,index:PlaceIndex){
 if(scope.kind==='city')return scope.place.name;
 if(scope.kind==='province')return index.provinces.get(scope.place.provinceId)?.name||scope.place.name;
 if(scope.kind==='postcode')return 'CAP '+scope.code;
 return scope.name;
}
export function scopeCenter(scope:PlaceScope):[number,number]{
 if(scope.kind==='address')return [scope.lat,scope.lng];
 const p=scope.kind==='postcode'?scope.places[0]:scope.place;
 return [p.lat,p.lng];
}
export function addressOptions(raw:unknown):PlaceOption[]{
 const features=(raw as {features?:any[]})?.features;if(!Array.isArray(features))return [];
 const seen=new Set<string>();const result:PlaceOption[]=[];
 for(const f of features){
  const p=f?.properties,c=f?.geometry?.coordinates;if(p?.countrycode!=='IT'||!Array.isArray(c)||!c.every(Number.isFinite)||c.length!==2||c[1]<35||c[1]>48||c[0]<6||c[0]>20)continue;
  if(!p.street&&p.type!=='street'&&p.type!=='house'&&p.osm_key!=='highway')continue;
  const street=p.street||p.name;if(!street)continue;
  const name=street+(p.housenumber?' '+p.housenumber:''),city=p.city||p.town||p.village||p.county||'',key=normalize(name+' '+city+' '+(p.postcode||''));
  if(seen.has(key))continue;seen.add(key);
  const detail=[city,p.postcode,p.state].filter(Boolean).join(' · '),id='address-'+key;
  result.push({id,label:name,detail,badge:p.housenumber?'Civico':'Strada',precision:p.housenumber?'house':'street',houseNumber:p.housenumber?String(p.housenumber):undefined,scope:{kind:'address',id,name,detail,lat:c[1],lng:c[0],radius:3}});
 }
 return result;
}
