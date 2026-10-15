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
