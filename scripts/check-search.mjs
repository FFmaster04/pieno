import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createPlaceIndex,addressOptions,distance} from '../lib/search.ts';
import {unpackDataset} from '../lib/wire.mjs';
const places=JSON.parse(await readFile(new URL('../public/data/search-places.json',import.meta.url),'utf8'));
const index=createPlaceIndex(places);
const stations=unpackDataset(JSON.parse(await readFile(new URL('../public/data/initial.json',import.meta.url),'utf8'))).stations;
const options=index.options('Lecce');
assert.equal(options[0].scope.kind,'city');
assert.equal(options[1].scope.kind,'province');
const city=options[0].scope,province=options[1].scope;
const cityStations=stations.filter(s=>index.contains(s,city));
const provincialStations=stations.filter(s=>index.contains(s,province));
assert(cityStations.length>20);
assert(provincialStations.length>cityStations.length);
assert(cityStations.every(s=>s.city.toUpperCase()==='LECCE'));
assert(provincialStations.some(s=>s.city.toUpperCase()==='SURBO'));
assert(!cityStations.some(s=>s.city.toUpperCase()==='SURBO'));
assert.equal(index.options('provincia di Lecce')[0].scope.kind,'province');
assert.equal(index.options('Lecce LE')[0].scope.place.id,city.place.id);
// Every official capital, including shared capitals, gets its own city/province pair.
for(const place of places.municipalities.filter(p=>p.capital)){
 const found=index.options(place.name);
 assert(found.some(o=>o.scope.kind==='city'&&o.scope.place.id===place.id),place.name+' città');
 assert(found.some(o=>o.scope.kind==='province'&&o.scope.place.provinceId===place.provinceId),place.name+' provincia');
}
const cesena=index.options('Cesena');assert(cesena.some(o=>o.scope.kind==='province'&&o.label==='Forlì-Cesena'));
const cap=index.options('73100')[0].scope;assert.equal(cap.kind,'postcode');assert.equal(cap.code,'73100');assert.equal(index.options('CAP 73100')[0].scope.code,'73100');
assert(!stations.filter(s=>index.contains(s,cap)).some(s=>s.city==='NARDÒ')); 
assert(index.options('001')[0].label.startsWith('001')); // Keep leading zeroes.
const milano=places.municipalities.find(p=>p.name==='Milano');assert(milano.postcodes.length>1);
const synthetic={...cityStations[0],city:'MILANO',province:'MI',address:'Via di prova 10'};
assert.equal(index.postcode(synthetic),undefined);
assert(!index.contains(synthetic,{kind:'postcode',code:'20121',places:[milano]}));
assert.equal(index.postcode({...synthetic,address:'Via di prova 10 20121'}),'20121');
assert.equal(index.postcode({...synthetic,address:'Via di prova 10 73100'}),undefined); // Reject CAPs incompatible with the municipality.
assert.equal(index.postcode({...cityStations[0],address:'Via di prova 10'}),'73100');
const address={kind:'address',id:'test',name:'Via Salvatore Trinchese',detail:'Lecce',lat:40.3539722,lng:18.1813252,radius:1};
const near=stations.filter(s=>index.contains(s,address)),farther=stations.filter(s=>index.contains(s,{...address,radius:5}));
assert(near.length>0&&farther.length>near.length);
assert(near.every(s=>distance([address.lat,address.lng],[s.lat,s.lng])<=1));
assert.equal(distance([40,18],[40,18]),0);
const feature=(city,street,coords=[18.18,40.35])=>({properties:{countrycode:'IT',type:'street',name:street,city,postcode:'73100'},geometry:{coordinates:coords}});
const results=addressOptions({features:[feature('Lecce','Via Roma'),feature('Lecce','Via Roma'),feature('Surbo','Via Roma'),feature('Lecce','Invalid',[NaN,40]),{...feature('Lecce','Foreign'),properties:{countrycode:'FR',type:'street',name:'Foreign'}}]});
assert.equal(results.length,2);assert(results.every(o=>o.scope.kind==='address'&&o.scope.radius===3));
assert.deepEqual(addressOptions({}),[]);
console.log(`Ricerca verificata: ${places.municipalities.filter(p=>p.capital).length} capoluoghi; Lecce ${cityStations.length} impianti nel comune / ${provincialStations.length} in provincia; CAP e raggi indirizzi corretti.`);
