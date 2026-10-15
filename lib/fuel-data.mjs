export const SOURCE = 'https://www.mimit.gov.it/it/open-data/elenco-dataset/carburanti-prezzi-praticati-e-anagrafica-degli-impianti';
export const URLS = ['https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv', 'https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv'];
// MIMIT switched to pipes in February 2026. Handle quoted fields and legacy extracts.
export function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '');
  const firstBreak = text.indexOf('\n');
  const sourceDate = text.slice(0, firstBreak).match(/\d{4}-\d{2}-\d{2}/)?.[0];
  const body = text.slice(firstBreak + 1);
  const delimiter = body.slice(0, body.indexOf('\n')).includes('|') ? '|' : ';';
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i=0;i<body.length;i++) {
    const c=body[i];
    if(c==='"') { if(quoted && body[i+1]==='"') {cell+='"';i++;} else if(quoted || !cell) quoted=!quoted; else cell+=c; }
    else if(c===delimiter && !quoted) {row.push(cell.trim());cell='';}
    else if(c==='\n' && !quoted) {row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell='';}
    else if(c!=='\r')cell+=c;
  }
  row.push(cell.trim());if(row.some(Boolean))rows.push(row);
  return {sourceDate, header:rows[0], rows:rows.slice(1)};
}
export function communicationDate(value) {
  const m=value.match(/^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}):(\d{2}))?/);
  return m ? `${m[3]}-${m[2]}-${m[1]}T${m[4]||'00'}:${m[5]||'00'}:${m[6]||'00'}` : '';
}
export function buildDataset(stationCSV,priceCSV,now=new Date()) {
  const a=parseCSV(stationCSV), p=parseCSV(priceCSV);
  if(!a.sourceDate || a.sourceDate!==p.sourceDate)throw new Error('Le due estrazioni MIMIT non sono allineate.');
  if(a.header[0]!=='idImpianto' || p.header[1]!=='descCarburante')throw new Error('Formato MIMIT non riconosciuto.');
  const all = new Map(); let unmapped=0,priceCount=0;
  for(const r of a.rows) {
    const lat=Number(r[8]?.replace(',','.')),lng=Number(r[9]?.replace(',','.'));
    if(!(lat>=35 && lat<=48 && lng>=6 && lng<=20)) {unmapped++;continue;}
    all.set(Number(r[0]),{id:Number(r[0]),brand:r[2]||'Indipendente',type:r[3],name:r[4],address:r[5],city:r[6],province:r[7],lat,lng,prices:[]});
  }
  for(const r of p.rows) {
    const s=all.get(Number(r[0])), price=Number(r[2]?.replace(',','.')), updated=communicationDate(r[4]||'');
    if(!s || !r[1] || !(price>0 && Number.isFinite(price)) || !updated || !['0','1'].includes(r[3]))continue;
    const item={fuel:r[1],price,self:r[3]==='1',updated};
    const prev=s.prices.findIndex(x=>x.fuel===item.fuel && x.self===item.self);
    if(prev<0){s.prices.push(item);priceCount++;} else if(s.prices[prev].updated<updated)s.prices[prev]=item;
  }
  const stations=Array.from(all.values());
  // Each station contributes once per fuel and service. Exclude motorway stations and old reports.
  const sums={},cutoff=Date.parse(a.sourceDate+'T00:00:00Z')-7*86400000;
  for(const s of stations) {
    if(/autostrad/i.test(s.type))continue;
    for(const p of s.prices) {
      if(Date.parse(p.updated+'Z')<cutoff)continue;
      const mode=p.self?'self':'served';
      const g=(sums[p.fuel]??={});const k=(g[mode]??={sum:0,count:0});k.sum+=p.price;k.count++;
    }
  }
  const averages={};for(const [fuel,modes] of Object.entries(sums)) {averages[fuel]={};for(const [mode,v] of Object.entries(modes))averages[fuel][mode]={mean:Math.round(v.sum/v.count*100000)/100000,count:v.count};}
  const fuels=[...new Set(stations.flatMap(s=>s.prices.map(p=>p.fuel)))].sort();
  if(stations.length<10000 || priceCount<40000)throw new Error('Estrazione incompleta: conservata la versione precedente.');
  return {schema:1,source:SOURCE,sourceDate:a.sourceDate,fetchedAt:now.toISOString(),checkedAt:now.toISOString(),total:a.rows.length,unmapped,priceCount,averages,fuels,stations};
}
