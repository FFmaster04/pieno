const DAY=86400000;
export function validateHistory(raw){
 if(raw?.schema!==1||!Array.isArray(raw.days))throw Error('Storico non valido');
 const seen=new Set();
 for(const day of raw.days){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day.date)||!Number.isFinite(Date.parse(day.date+'T00:00:00Z'))||new Date(day.date+'T00:00:00Z').toISOString().slice(0,10)!==day.date||seen.has(day.date)||!day.averages||typeof day.averages!=='object')throw Error('Data storico non valida');
  seen.add(day.date);
  for(const modes of Object.values(day.averages))for(const [mode,value] of Object.entries(modes))if(!['self','served'].includes(mode)||!Number.isFinite(value.mean)||value.mean<=0||!Number.isInteger(value.count)||value.count<1)throw Error('Media storico non valida');
 }
 return raw;
}
export function appendHistory(history,dataset){
 validateHistory(history);
 const averages={};
 for(const [fuel,modes] of Object.entries(dataset.averages||{})){
  const valid={};for(const mode of ['self','served']){const a=modes[mode];if(a&&Number.isFinite(a.mean)&&a.mean>0&&Number.isInteger(a.count)&&a.count>0)valid[mode]={mean:a.mean,count:a.count};}
  if(Object.keys(valid).length)averages[fuel]=valid;
 }
 if(!Object.keys(averages).length)throw Error('Nessuna media valida per lo storico');
 const day={date:dataset.sourceDate,averages};validateHistory({schema:1,days:[day]});
 const days=[...history.days.filter(d=>d.date!==day.date),day].sort((a,b)=>a.date.localeCompare(b.date)).slice(-400);
 return {schema:1,days};
}
export function historySeries(history,fuel,mode,windowDays){
 const days=validateHistory(history).days.slice().sort((a,b)=>a.date.localeCompare(b.date));if(!days.length)return [];
 const end=Date.parse(days.at(-1).date+'T00:00:00Z'),start=end-(windowDays-1)*DAY;
 return days.filter(d=>Date.parse(d.date+'T00:00:00Z')>=start&&d.averages[fuel]?.[mode]).map(d=>({date:d.date,...d.averages[fuel][mode]}));
}
