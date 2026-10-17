export type PriceLevel='lower'|'average'|'higher'|'unknown';
export const PRICE_TOLERANCE=0.01;
export function priceLevel(price:number|undefined,average:number|undefined):PriceLevel{
 if(price===undefined||average===undefined||!Number.isFinite(price)||!Number.isFinite(average)||price<=0||average<=0)return 'unknown';
 // Match the three decimal places displayed in prices and in the map legend.
 const difference=(Math.round(price*1000)-Math.round(average*1000))/1000;
 if(Math.abs(difference)<=PRICE_TOLERANCE+1e-9)return 'average';
 return difference<0?'lower':'higher';
}
export const priceLevelLabel:Record<PriceLevel,string>={lower:'Sotto la media',average:'In linea con la media',higher:'Sopra la media',unknown:'Media non disponibile'};
export const priceLevelSymbol:Record<PriceLevel,string>={lower:'↓',average:'≈',higher:'↑',unknown:''};
