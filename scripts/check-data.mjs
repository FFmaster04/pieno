import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{parseCSV,buildDataset}from'../lib/fuel-data.mjs';
import{packDataset,unpackDataset}from'../lib/wire.mjs';
const parsed=parseCSV('Estrazione del 2026-10-14\nid|name\n1|"a|b"\n2|"a""b"\n');
assert.deepEqual(parsed.rows,[['1','a|b'],['2','a"b']]);
const d=unpackDataset(JSON.parse(readFileSync(new URL('../public/data/initial.json',import.meta.url))));
assert(d.stations.length>20000);assert(d.priceCount>80000);
assert.deepEqual(unpackDataset(packDataset(d)),d);
for(const s of d.stations){assert(s.lat>=35&&s.lat<=48&&s.lng>=6&&s.lng<=20);const keys=new Set();for(const p of s.prices){const k=p.fuel+'|'+p.self;assert(!keys.has(k),'Prezzo duplicato per impianto e modalità');keys.add(k);assert(p.price>0&&p.updated.match(/^\d{4}-\d{2}-\d{2}T/));}}
assert.throws(()=>buildDataset('Estrazione del 2026-10-14\nidImpianto|x\n','Estrazione del 2026-10-13\nidImpianto|descCarburante\n'),/allineate/);
assert.throws(()=>buildDataset('Estrazione del 2026-10-14\nidImpianto|x\n','Estrazione del 2026-10-14\nidImpianto|descCarburante\n'),/incompleta/);
// Independent reference calculation for the headline benzina self average.
let sum=0,n=0;const cutoff=d.sourceDate;for(const s of d.stations){if(s.type.toLowerCase().includes('autostrad'))continue;const p=s.prices.find(p=>p.fuel==='Benzina'&&p.self);if(p&&new Date(cutoff+'T00:00:00Z')-new Date(p.updated+'Z')<=7*86400000){sum+=p.price;n++;}}
assert.equal(d.averages.Benzina.self.count,n);assert(Math.abs(d.averages.Benzina.self.mean-sum/n)<.00001);
console.log('Verificati: CSV quotati, estrazioni disallineate/incomplete, coordinate, prezzi univoci, trasporto compatto e media nazionale.');
