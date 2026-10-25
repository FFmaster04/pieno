import {readFileSync,writeFileSync} from 'node:fs';
import {snapshotReceipt} from '../lib/cloudflare-site.mjs';
const d=JSON.parse(readFileSync(new URL('../public/data/initial.json',import.meta.url),'utf8'));
const status=snapshotReceipt(d);
writeFileSync(new URL('../.github/data-status.json',import.meta.url),JSON.stringify(status,null,2)+'\n');
console.log('Registrato controllo MIMIT:',status.checkedDay,status.sourceDate);
