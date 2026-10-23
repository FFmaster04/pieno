export function calendarDayInItaly(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 return ['year','month','day'].map(name=>parts.find(p=>p.type===name).value).join('-');
}
export function expectedSourceDate(now=new Date()){
 return new Date(Date.parse(calendarDayInItaly(now)+'T12:00:00Z')-86400000).toISOString().slice(0,10);
}
export function snapshotFreshness(snapshot,now=new Date()){
 const today=calendarDayInItaly(now),expected=expectedSourceDate(now);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(snapshot?.sourceDate)||!Number.isFinite(Date.parse(snapshot.sourceDate))||new Date(snapshot.sourceDate).toISOString().slice(0,10)!==snapshot.sourceDate||snapshot.sourceDate>today)throw Error('Data di estrazione non valida.');
 return {fresh:snapshot.sourceDate>=expected,sourceDate:snapshot.sourceDate,expectedSourceDate:expected,lastSuccessfulCheck:snapshot.checkedAt||snapshot.fetchedAt};
}
