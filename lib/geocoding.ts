import {addressOptions,normalize,type PlaceOption} from './search.ts';
export type ManualAddress={street:string;houseNumber:string;city:string;postcode:string};
const cache=new Map<string,PlaceOption[]>();
let lastRequest=0;
export function addressSearchUrl(query:string|ManualAddress,anchor:[number,number]|null=null){
 const params=new URLSearchParams({countrycode:'IT',limit:'8'});
 if(typeof query==='string')params.set('q',query.trim());
 else{
  params.set('street',query.street.trim());params.set('city',query.city.trim());
  if(query.houseNumber.trim())params.set('housenumber',query.houseNumber.trim());
  if(query.postcode.trim())params.set('postcode',query.postcode.trim());
 }
 if(anchor){params.set('lat',anchor[0].toFixed(2));params.set('lon',anchor[1].toFixed(2));}
 return 'https://photon.komoot.io/'+(typeof query==='string'?'api/':'structured/')+'?'+params;
}
export function manualAddressOptions(raw:unknown,address:ManualAddress){
 const number=normalize(address.houseNumber);
 const found=addressOptions(raw).filter(o=>(!number||o.precision==='street'||normalize(o.houseNumber||'')===number)&&(!address.postcode.trim()||o.detail.split(' · ').includes(address.postcode.trim())));
 const exactStreet=found.filter(o=>normalize(o.precision==='house'?o.label.slice(0,-(o.houseNumber!.length+1)):o.label)===normalize(address.street));
 return exactStreet.length?exactStreet:found;
}
// Both search entry points share the cache and rate limit. Requests are made
// only on explicit submission; editing never sends an address to the provider.
export async function lookupAddress(query:string|ManualAddress,anchor:[number,number]|null,signal:AbortSignal){
 const url=addressSearchUrl(query,anchor);
 if(cache.has(url))return cache.get(url)!;
 if(Date.now()-lastRequest<1100)throw Error('Attendi un istante prima di riprovare.');
 lastRequest=Date.now();
 let raw:unknown;
 try{
  const response=await fetch(url,{signal});
  if(!response.ok)throw Error();
  raw=await response.json();
 }catch(error){
  if(signal.aborted)throw new DOMException('Ricerca annullata','AbortError');
  throw Error('La ricerca indirizzi non risponde. Riprova tra poco; città e CAP restano disponibili.');
 }
 const found=typeof query==='string'?addressOptions(raw):manualAddressOptions(raw,query);
 if(signal.aborted)throw new DOMException('Ricerca annullata','AbortError');
 cache.set(url,found);if(cache.size>30)cache.delete(cache.keys().next().value!);
 return found;
}
