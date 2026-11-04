// Prueba en Chrome/Chromium contra el build local y una API simulada.
// No usa credenciales ni modifica Supabase. Ejecutar después de npm run build.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {existsSync,readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,extname,sep} from 'node:path';

const browser=process.env.CHROME_BIN||['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/chromium','/usr/bin/google-chrome'].find(existsSync);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let n=0;n<100;n++){const value=await fn();if(value)return value;await sleep(100);}throw Error('La condición no se cumplió en 10 segundos');}

test('catálogo público, login opcional, carrito y permisos de navegación',{skip:!browser,timeout:45000},async t=>{
 assert.ok(existsSync('dist/index.html'),'Ejecuta npm run build antes de esta prueba');
 let role='CLIENTE',failLogin=false,expireOrder=false,orders=0;
 const user=()=>({id:1,nombre:'Cliente Prueba',email:'cliente@demo.test',rol:role});
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/')){
   let data=[],status=200;
   if(url.pathname==='/api/productos')data=Array.from({length:20},(_,i)=>({id:String(i+1),sku:'TEST'+i,nombre:i===0?'Notebook de prueba':'Producto adicional '+i,categoria:'Notebooks',precio:1000,disponible:10,estado:'En stock'}));
   else if(url.pathname==='/api/auth/login'){if(failLogin){status=401;data={error:'Credenciales incorrectas'};}else data={token:'valid',usuario:user()};}
   else if(url.pathname==='/api/auth/me'){if(req.headers.authorization!=='Bearer valid'){status=401;data={error:'Sesión vencida'};}else data=user();}
   else if(url.pathname==='/api/pedidos/online'){if(expireOrder){status=401;data={error:'Sesión vencida'};}else{orders++;data={id:123,total:1000};status=201;}}
   res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));return;
  }
  const path=resolve('dist','.'+decodeURIComponent(url.pathname));
  if(!path.startsWith(resolve('dist')+'/')&&!path.startsWith(resolve('dist')+'\\')&&path!==resolve('dist')){res.writeHead(403);res.end();return;}
  const file=existsSync(path)&&extname(path)?path:resolve('dist/index.html');
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(file)]||'application/octet-stream');res.end(readFileSync(file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(()=>new Promise(r=>{server.close(r);server.closeAllConnections();}));
 const profile=mkdtempSync(join(tmpdir(),'pcfactory-access-'));
 const proc=spawn(browser,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
 proc.on('error',()=>{});
 t.after(async()=>{proc.kill();await sleep(500);assert.ok(resolve(profile).startsWith(resolve(tmpdir())+sep));try{rmSync(profile,{recursive:true,force:true});}catch{/* El navegador puede tardar en liberar su perfil temporal. */}});
 const portFile=join(profile,'DevToolsActivePort');
 await until(()=>existsSync(portFile));
 const port=readFileSync(portFile,'utf8').split('\n')[0];
 const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 const ws=new WebSocket(targets.find(x=>x.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
 t.after(()=>ws.close());
 let id=0;const pending=new Map(),errors=[];
 ws.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.text);if(data.id){const p=pending.get(data.id);pending.delete(data.id);data.error?p.reject(Error(data.error.message)):p.resolve(data.result);}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
 const click=async selector=>{if(selector==='.sticky-cart .btn'&&!await evaluate("document.querySelector('.cart-popover').matches(':popover-open')"))await evaluate("document.querySelector('.cart-toggle').click()");assert.ok(await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`),`Falta ${selector}`);await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);};
 const text=()=>evaluate('document.body.innerText');
 const open=()=>send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});
 await send('Runtime.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1100,height:750,deviceScaleFactor:1,mobile:false});
 await open();
 await until(async()=>(await text()).includes('Notebook de prueba'));
 assert.equal(await evaluate("Boolean(document.querySelector('dialog[open]'))"),false);
 assert.equal(await evaluate("Boolean(document.querySelector('[aria-label=\"Usuarios y roles\"]'))"),false);
 await click('.product-card .btn');
 assert.equal(await evaluate("document.querySelector('.cart-row .qty b').textContent"),'1');
 assert.match(await evaluate("document.querySelector('.product-card .btn').textContent"),/1 en carrito/);
 assert.equal(await evaluate("document.querySelectorAll('.cart-popover').length"),1,'Un solo carrito');
 assert.equal(await evaluate("document.querySelector('.cart-toggle .count').textContent"),'1');
 assert.equal(await evaluate("document.querySelector('.cart-popover').matches(':popover-open')"),false);
 await click('.cart-toggle');
 assert.equal(await evaluate("document.querySelector('.cart-popover').matches(':popover-open')"),true);
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 assert.ok(await evaluate("document.querySelector('.cart-popover').getBoundingClientRect().top>=0 && document.querySelector('.cart-popover').getBoundingClientRect().bottom<=innerHeight"),'Carrito visible completo en m?vil');
 assert.ok(await evaluate("document.documentElement.scrollWidth<=innerWidth"),'Sin desplazamiento horizontal en m?vil');
 await click('.cart-dismiss');
 assert.equal(await evaluate("document.querySelector('.cart-popover').matches(':popover-open')"),false);
 await send('Emulation.setDeviceMetricsOverride',{width:1100,height:750,deviceScaleFactor:1,mobile:false});
 await click('.sticky-cart .btn');
 await until(()=>evaluate("Boolean(document.querySelector('dialog[open]'))"));
 assert.equal(orders,0,'El invitado no debe enviar pedidos');
 await click('.continue-shopping');
 await until(()=>evaluate("!document.querySelector('dialog')"));
 assert.equal(await evaluate("document.querySelector('.cart-row .qty b').textContent"),'1');
 await click('.topbar .btn');failLogin=true;
 await evaluate("document.querySelector('.login-card').requestSubmit()");
 await until(async()=>(await text()).includes('Credenciales incorrectas'));
 assert.equal(await evaluate("Boolean(document.querySelector('dialog[open]'))"),true);
 failLogin=false;await evaluate("document.querySelector('.login-card').requestSubmit()");
 await until(()=>evaluate("!document.querySelector('dialog')"));
 assert.equal(await evaluate("document.querySelector('.cart-row .qty b').textContent"),'1');
 assert.equal(orders,0,'Entrar no confirma el pedido automáticamente');
 await click('[aria-label="Pedidos online"]');
 await until(async()=>(await text()).includes('Mis pedidos'));
 await click('[aria-label="Compra online"]');
 assert.equal(await evaluate("document.querySelector('.cart-row .qty b').textContent"),'1');
 expireOrder=true;await click('.sticky-cart .btn');
 await until(()=>evaluate("Boolean(document.querySelector('dialog[open]'))"));
 assert.equal(await evaluate("localStorage.getItem('pcf_token')"),null);
 assert.equal(await evaluate("document.querySelector('.cart-row .qty b').textContent"),'1');
 assert.equal(orders,0);expireOrder=false;
 await evaluate("document.querySelector('.login-card').requestSubmit()");
 await until(()=>evaluate("!document.querySelector('dialog')"));
 await click('.sticky-cart .btn');
 await until(async()=>(await text()).includes('Pedido reservado'));
 assert.equal(orders,1,'El perfil CLIENTE puede confirmar su compra');
 assert.equal(await evaluate("document.querySelectorAll('.cart-row').length"),0);
 await click('.product-card .btn');
 await click('.topbar .account-button');
 await until(()=>evaluate("Boolean(document.querySelector('.topbar .btn'))"));
 assert.equal(await evaluate("document.querySelector('.cart-row .qty b').textContent"),'1');
 role='ADMINISTRADOR';await click('.topbar .btn');await evaluate("document.querySelector('.login-card').requestSubmit()");
 await until(()=>evaluate("Boolean(document.querySelector('[aria-label=\"Usuarios y roles\"]'))"));
 await click('.sticky-cart .btn');
 await until(async()=>(await text()).includes('Pedido reservado'));
 assert.equal(orders,2);assert.equal(await evaluate("document.querySelectorAll('.cart-row').length"),0);
 await evaluate("localStorage.setItem('pcf_token','expired')");await open();
 await until(()=>evaluate("Boolean(document.querySelector('.topbar .btn:not(:disabled)'))"));
 assert.equal(await evaluate("Boolean(document.querySelector('dialog[open]'))"),false);
 assert.equal(await evaluate("Boolean(document.querySelector('[aria-label=\"Usuarios y roles\"]'))"),false);
 assert.equal(await evaluate("localStorage.getItem('pcf_token')"),null);
 assert.deepEqual(errors,[],'Sin errores JavaScript durante la navegación');
});
