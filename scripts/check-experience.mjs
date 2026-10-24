import {shouldLocateOnOpen,supportedPosition} from '../lib/nearby.ts';
import {summarizeMap,groupMapItems} from '../lib/map-experience.ts';
import {priceLevel} from '../lib/price-level.ts';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fullCost,saving,quantityUnit,fuelPrice} from '../lib/experience.ts';
import {appendHistory,historySeries,validateHistory} from '../lib/history.mjs';
import {readPreferences,readScope,restoreScope,storeScope} from '../lib/preferences.ts';
import {searchLink,readSharedSearch} from '../lib/share.ts';
const places=JSON.parse(await readFile(new URL('../public/data/search-places.json',import.meta.url),'utf8'));
const lecce=places.municipalities.find(p=>p.name==='Lecce'),fuels=['Benzina','Gasolio','GPL','Metano','GNL'];
assert.equal(fullCost(1.979,40),79.16);
// MIMIT prices have three decimals: verify half-cent ties over all supported litre quantities.
for(let mills=500;mills<=3500;mills++)for(let quantity=1;quantity<=150;quantity++)assert.equal(fullCost(mills/1000,quantity),Math.floor((mills*quantity+5)/10)/100);
assert.equal(fullCost(2.03468,40),81.39);assert.equal(saving(1.979,2.03468,40),2.23);assert.equal(saving(2,undefined,40),null);
assert.equal(quantityUnit('Metano'),'kg');assert.equal(quantityUnit('GNL'),'kg');assert.equal(quantityUnit('Gasolio'),'l');
const prices=[{fuel:'Benzina',self:true,price:2,updated:'2026-10-14'},{fuel:'Benzina',self:false,price:2.1,updated:'2026-10-14'}];
assert.equal(fuelPrice(prices,'Benzina','served').price,2.1);assert.equal(fuelPrice(prices,'Gasolio','self'),undefined);
const average=v=>({Benzina:{self:{mean:v,count:100}}});
let history={schema:1,days:[]};history=appendHistory(history,{sourceDate:'2026-10-14',averages:average(2)});history=appendHistory(history,{sourceDate:'2026-10-16',averages:average(2.01)});history=appendHistory(history,{sourceDate:'2026-10-16',averages:average(2.02)});
assert.equal(history.days.length,2);assert.equal(history.days[1].averages.Benzina.self.mean,2.02);
assert.deepEqual(historySeries(history,'Benzina','self',7).map(p=>p.date),['2026-10-14','2026-10-16']);
assert.deepEqual(historySeries(history,'Benzina','served',30),[]);
assert.throws(()=>appendHistory(history,{sourceDate:'2026-02-30',averages:average(2)}));assert.throws(()=>validateHistory({schema:1,days:[...history.days,history.days[0]]}));
assert.throws(()=>validateHistory({schema:1,days:[{date:'2026-10-16',averages:{Benzina:{self:{mean:-1,count:2}}}}]}));
assert.equal(readPreferences(null,fuels),null);
const malformed=readPreferences({schema:1,fuel:'fake',mode:'hacked',litres:100000,kilograms:-1,recent:'yes',scope:{kind:'address',lat:NaN}},fuels);
assert.equal(malformed.fuel,'Benzina');assert.equal(malformed.litres,40);assert.equal(malformed.kilograms,15);assert.equal(malformed.scope,null);
assert.equal(readScope({kind:'address',name:'Via Roma',detail:'Lecce',lat:90,lng:18,radius:3}),null);
for(const scope of [{kind:'city',place:lecce},{kind:'province',place:lecce},{kind:'postcode',code:'00144',places:places.municipalities.filter(p=>p.postcodes.includes('00144'))},{kind:'address',id:'a',name:'Via Salvatore Trinchese 83',detail:'Lecce · 73100 · Puglia',lat:40.354,lng:18.182,radius:3},null]){
 const state={fuel:'Gasolio',mode:'served',litres:50,kilograms:20,scope,road:'road',recent:false,sort:'distance',compareIds:[10,20,30]};
 const url=searchLink('https://example.com/pieno/?impianto=1',state,{north:41,south:40,east:19,west:18,zoom:13});
 const parsed=readSharedSearch(new URL(url).search,fuels);assert(parsed);
 assert.equal(new URL(url).pathname,'/pieno/');assert.equal(new URL(url).hash,'#esplora');assert(!new URL(url).searchParams.has('impianto'));
 assert.equal(parsed.preferences.fuel,'Gasolio');assert.equal(parsed.preferences.litres,50);assert.equal(parsed.preferences.recent,false);assert.deepEqual(parsed.compareIds,[10,20,30]);
 assert.deepEqual(parsed.scope,storeScope(scope));if(scope)assert(restoreScope(parsed.scope,places));else assert.equal(parsed.view.zoom,13);
}
assert.equal(readSharedSearch('?ricerca=99',fuels),null);
const poisoned=readSharedSearch('?ricerca=1&carburante=evil&litri=-1&area=address&indirizzo=x&lat=Infinity&lng=18&raggio=999&confronta=1,1,foo,-2,3,4,5',fuels);
assert.equal(poisoned.scope,null);assert.equal(poisoned.preferences.fuel,'Benzina');assert.deepEqual(poisoned.compareIds,[1,3,4]);
validateHistory(JSON.parse(await readFile(new URL('../public/data/history.json',import.meta.url),'utf8')));
console.log('Verificati costi, kg/litri, medie storiche reali, preferenze, link condivisi e validazione dei parametri.');

assert.equal(priceLevel(1.8,1.9),'lower');
assert.equal(priceLevel(1.9,1.9),'average');
assert.equal(priceLevel(1.89,1.9),'average');
assert.equal(priceLevel(1.91,1.9),'average');
assert.equal(priceLevel(1.889,1.9),'lower');
assert.equal(priceLevel(1.911,1.9),'higher');
assert.equal(priceLevel(2,1.9),'higher');
for(const average of [undefined,NaN,0])assert.equal(priceLevel(1.9,average),'unknown');
assert.equal(priceLevel(undefined,1.9),'unknown');
console.log('Verificati i tre colori rispetto alla media, estremi della fascia ±1 centesimo e assenza di media.');
assert.equal(priceLevel(2.045,2.03474),'average');
assert.equal(priceLevel(2.046,2.03474),'higher');

// A cheaper station just outside the viewport must not win the visible-area recommendation.
const mapBounds={south:40,north:41,west:18,east:19,zoom:12};
const mapItems=[
 {station:{id:8,lat:40.5,lng:18.5},price:{price:1.9}},
 {station:{id:7,lat:40.6,lng:18.6},price:{price:1.9}},
 {station:{id:9,lat:40,lng:19},price:{price:2.01}},
 {station:{id:2,lat:39.9,lng:18.5},price:{price:1.2}},
 {station:{id:1,lat:40.5,lng:19.01},price:{price:1.1}}
];
const mapSummary=summarizeMap(mapItems,mapBounds,2);
assert.equal(mapSummary.best.station.id,7);assert.equal(mapSummary.total,3);assert.equal(mapSummary.lower,2);
assert.equal(summarizeMap([...mapItems].reverse(),mapBounds,2).best.station.id,7);
assert.equal(summarizeMap(mapItems,mapBounds,undefined).lower,0);
assert.equal(summarizeMap(mapItems,null,2).best,null);
assert.deepEqual(summarizeMap([],mapBounds,2),{best:null,total:0,lower:0});
console.log('Verificati minimo e conteggi nella sola area visibile, confini, parità, media assente e mappa vuota.');

const clusterInput=Array.from({length:200},(_,i)=>({station:{id:i,lat:40+i*.001,lng:18+i*.001},price:{price:1.7+i*.002}}));
const projected=i=>({x:(i.station.id%20)*25,y:Math.floor(i.station.id/20)*20});
const clusters=groupMapItems(clusterInput,projected);
assert.deepEqual(clusters.flat().map(e=>e.station.id).sort((a,b)=>a-b),clusterInput.map(e=>e.station.id));
for(let i=0;i<clusters.length;i++){
 assert.equal(clusters[i][0].price.price,Math.min(...clusters[i].map(e=>e.price.price)));
 for(let j=0;j<i;j++){const a=projected(clusters[i][0]),b=projected(clusters[j][0]);assert(Math.abs(a.x-b.x)>=116||Math.abs(a.y-b.y)>=78,'Marker anchors overlap');}
}
assert.deepEqual(groupMapItems([...clusterInput].reverse(),projected),clusters);
console.log('Verificati gruppi senza sovrapposizioni, ancoraggio al minimo e accesso a tutti i distributori.');

assert.equal(shouldLocateOnOpen(''),true);
assert.equal(shouldLocateOnOpen('?ricerca=1&carburante=Gasolio'),true);
assert.equal(shouldLocateOnOpen('?ricerca=1&area=city&comune=075035'),false);
assert.equal(shouldLocateOnOpen('?ricerca=1&area=province&comune=075035'),false);
assert.equal(shouldLocateOnOpen('?ricerca=1&area=postcode&cap=00144'),false);
assert.equal(shouldLocateOnOpen('?ricerca=1&area=address&indirizzo=Via+Roma&localita=Lecce&lat=40.35&lng=18.18&raggio=3'),false);
assert.equal(shouldLocateOnOpen('?ricerca=1&lat=40.35&lng=18.18&zoom=13'),false);
assert.equal(shouldLocateOnOpen('?impianto=123'),false);
for(const search of ['?impianto=0','?impianto=evil','?ricerca=1&area=city&comune=broken','?ricerca=1&lat=Infinity&lng=18&zoom=13'])assert.equal(shouldLocateOnOpen(search),true);
assert.equal(supportedPosition(40.35,18.18),true);
for(const p of [[NaN,18],[Infinity,18],[40,Infinity],[51,-1],[-40,18],[40,180]])assert.equal(supportedPosition(...p),false);
console.log('Verificata apertura sulla posizione, precedenza dei link espliciti e coordinate valide.');
