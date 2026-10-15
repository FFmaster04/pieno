// Compact transport avoids repeating property and fuel names for 90,000+ prices.
export function packDataset(data){
 const {stations,...meta}=data;const ids=new Map(data.fuels.map((f,i)=>[f,i]));
 return {...meta,schema:2,rows:stations.map(s=>[s.id,s.brand,s.name,s.address,s.city,s.province,s.type,s.lat,s.lng,s.prices.map(p=>[ids.get(p.fuel),p.price,p.self?1:0,p.updated])])};
}
export function unpackDataset(raw){
 if(raw.schema!==2)return raw;
 const {rows,...meta}=raw;
 return {...meta,schema:1,stations:rows.map(r=>({id:r[0],brand:r[1],name:r[2],address:r[3],city:r[4],province:r[5],type:r[6],lat:r[7],lng:r[8],prices:r[9].map(p=>({fuel:raw.fuels[p[0]],price:p[1],self:p[2]===1,updated:p[3]}))}))};
}
