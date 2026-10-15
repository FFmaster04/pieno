export type Price = { fuel: string; price: number; self: boolean; updated: string };
export type Station = { id: number; brand: string; name: string; address: string; city: string; province: string; type: string; lat: number; lng: number; prices: Price[] };
export type Average = { mean: number; count: number };
export type Dataset = { refreshError?: boolean; sourceDate: string; fetchedAt: string; checkedAt?: string; stations: Station[]; averages: Record<string,{self?: Average; served?: Average}>; fuels: string[]; unmapped: number; total: number; priceCount: number; source: string; schema: number };
export type City = [string,string,number,number,number?];
export type Bounds = {north:number;south:number;east:number;west:number;zoom:number};
