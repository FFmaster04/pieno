export function siteRedirect(current:string,destination:string,online:boolean){
 if(!online||!destination)return null;
 try{
  const from=new URL(current),to=new URL(destination);
  if(from.origin!=='https://ffmaster04.github.io'||!['/pieno/','/pieno'].includes(from.pathname))return null;
  if(to.origin!=='https://pienoitalia.pages.dev'||to.username||to.password||to.pathname!=='/')return null;
  to.search=from.search;to.hash=from.hash;
  return to.href;
 }catch{return null;}
}
