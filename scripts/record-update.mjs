import {readFileSync,writeFileSync} from 'node:fs';
const d=JSON.parse(readFileSync(new URL('../public/data/initial.json',import.meta.url),'utf8'));
const status={checkedDay:d.checkedAt.slice(0,10),sourceDate:d.sourceDate,stations:d.rows.length,priceCount:d.priceCount};
writeFileSync(new URL('../.github/data-status.json',import.meta.url),JSON.stringify(status,null,2)+'\n');
console.log('Registrato controllo MIMIT:',status.checkedDay,status.sourceDate);
