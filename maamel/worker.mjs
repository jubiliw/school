import api from './backend/index.mjs';
import assets from './.generated/assets.mjs';
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/'))return api.fetch(request,env);
  if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405});
  const route=url.pathname==='/index.html'?'/':url.pathname;
  if(!Object.hasOwn(assets,route))return new Response(null,{status:404});
  if(route.endsWith('.webp')||route==='/ui/kufi-headings.woff')return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(assets[route]),letter=>letter.charCodeAt(0)),{headers:{'Content-Type':route.endsWith('.webp')?'image/webp':'font/woff','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
  const type=route.endsWith('.mjs')?'application/javascript':route.endsWith('.css')?'text/css':route.endsWith('.json')?'application/json':route.endsWith('.svg')?'image/svg+xml':'text/html';
  return new Response(request.method==='HEAD'?null:assets[route],{headers:{
   'Content-Type':type+'; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin',
   'Cache-Control':'no-cache','Content-Security-Policy':route==='/studio/python-frame.html'?"default-src 'none'; sandbox allow-scripts; script-src 'sha256-xWe7WRsY8+3Gzkf1Rl3EJRScbCdVp8EA3hbGd1OXl4U=' 'unsafe-eval'; worker-src blob:; connect-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'":"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob: data:; connect-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'none'; form-action 'self'"
  }});
 },
 async scheduled(event,env,ctx){if(api.scheduled)await api.scheduled(event,env,ctx)}
};
