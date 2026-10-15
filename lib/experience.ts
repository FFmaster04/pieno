import type {Dataset,Price} from './types';
export const euros=(n:number)=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(n);
export const quantityUnit=(fuel:string)=>/metano|gnl|lng|gnc/i.test(fuel)?'kg':'l';
const roundedEuros=(n:number)=>Math.sign(n)*Math.round(Math.abs(n)*100+1e-7)/100||0;
export function fullCost(price:number,quantity:number){return roundedEuros(price*quantity);}
export function saving(price:number,average:number|undefined,quantity:number){return average===undefined?null:roundedEuros((average-price)*quantity);}
export function fuelPrice(prices:Price[],fuel:string,mode:string){return prices.find(p=>p.fuel===fuel&&p.self===(mode==='self'));}
export const shortFuel=(s:string)=>s==='Gasolio'?'Diesel':s;
export type HistoryDay={date:string;averages:Dataset['averages']};
export type PriceHistory={schema:1;days:HistoryDay[]};
