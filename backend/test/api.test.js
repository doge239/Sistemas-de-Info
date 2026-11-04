import {test} from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {createApp} from '../app.js';

const secret='test-secret-only-for-local-validation-2026';
const result=(rows=[])=>({rows,rowCount:rows.length});
async function fixture(t,{rol='CLIENTE',active=true,handle=()=>result()}={}){
 const calls=[];
 const db={async query(sql,args=[]){calls.push({sql,args});
  if(sql.includes('WHERE u.id=$1 AND u.activo'))return result(active?[{id:1,nombre:'Prueba',rol}]:[]);
  if(['BEGIN','COMMIT','ROLLBACK'].includes(sql))return result();
  return handle(sql,args);
 },release(){calls.push({sql:'RELEASE'});}};
 db.connect=async()=>db;
 const server=createApp(db,secret).listen(0,'127.0.0.1');
 await new Promise(resolve=>server.once('listening',resolve));
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const token=jwt.sign({id:1,rol},secret);
 return {calls,async request(path,{method='POST',body,auth=true,raw}={}){
  const res=await fetch(`http://127.0.0.1:${server.address().port}/api${path}`,{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:`Bearer ${token}`}:{})},body:raw??(body===undefined?undefined:JSON.stringify(body))});
  return {status:res.status,data:await res.json()};
 }};
}
for(const [label,items] of Object.entries({empty:[],missing:null,nullEntry:[null],booleanId:[{producto_id:true,cantidad:1}],arrayId:[{producto_id:[1],cantidad:1}],zero:[{producto_id:1,cantidad:0}],negative:[{producto_id:1,cantidad:-1}],fraction:[{producto_id:1,cantidad:1.5}],tooMany:[{producto_id:1,cantidad:101}],duplicateLimit:[{producto_id:1,cantidad:60},{producto_id:1,cantidad:60}],tooManyLines:Array.from({length:51},()=>({producto_id:1,cantidad:1}))})){
 test(`rechaza carrito inválido: ${label}`,async t=>{const f=await fixture(t);assert.equal((await f.request('/pedidos/online',{body:{items}})).status,400);assert.ok(!f.calls.some(x=>x.sql==='BEGIN'));});
}
test('catálogo público sin sesión',async t=>{const f=await fixture(t,{handle:()=>result([{id:1,nombre:'Notebook'}])});assert.equal((await f.request('/productos',{method:'GET',auth:false})).status,200);});
test('pedido sin sesión es 401',async t=>{const f=await fixture(t);assert.equal((await f.request('/pedidos/online',{auth:false,body:{}})).status,401);});
test('cuenta desactivada invalida un token existente',async t=>{const f=await fixture(t,{active:false});assert.equal((await f.request('/pedidos/mios',{method:'GET'})).status,401);});
test('permisos actuales prevalecen sobre el rol del token',async t=>{const f=await fixture(t,{rol:'CLIENTE'});assert.equal((await f.request('/usuarios',{method:'GET'})).status,403);});
for(const [rol,path,body] of [['CLIENTE','/inventario/ajuste',{}],['BODEGA','/reposiciones/1/decision',{estado:'APROBADA'}],['JEFATURA','/reposiciones/1/recepcion',{}],['VENDEDOR','/pedidos/1/estado',{estado:'PREPARANDO'}],['VENDEDOR','/pedidos/1/estado',{estado:'LISTO'}]]){
 test(`${rol} no puede ejecutar ${path} ${body.estado||''}`,async t=>{const f=await fixture(t,{rol});assert.equal((await f.request(path,{method:path.includes('decision')||path.includes('estado')?'PATCH':'POST',body})).status,403);});
}
test('login vacío y JSON mal formado devuelven 400',async t=>{const f=await fixture(t);assert.equal((await f.request('/auth/login',{body:{}})).status,400);assert.equal((await f.request('/auth/login',{raw:'{'})).status,400);});
test('login rechaza contraseña errónea o cuenta inactiva',async t=>{const hash=await bcrypt.hash('Correcta123',4);const f=await fixture(t,{handle:()=>result([{id:1,activo:true,clave_hash:hash}])});assert.equal((await f.request('/auth/login',{body:{email:'a@b.cl',clave:'incorrecta'}})).status,401);});
test('stock insuficiente y producto inexistente revierten la transacción',async t=>{
 for(const rows of [[],[{id:1,nombre:'Notebook',stock_fisico:2,stock_reservado:2,precio:100}]]){
  const f=await fixture(t,{handle:()=>result(rows)});assert.equal((await f.request('/pedidos/online',{body:{items:[{producto_id:1,cantidad:1}]}})).status,rows.length?409:404);
  assert.ok(f.calls.some(x=>x.sql==='ROLLBACK'));assert.ok(!f.calls.some(x=>x.sql.startsWith('INSERT')));
 }
});
for(const canal of ['ONLINE','PRESENCIAL'])test(`${canal}: precio del servidor, duplicados agrupados y stock correcto`,async t=>{
 const f=await fixture(t,{rol:canal==='ONLINE'?'CLIENTE':'VENDEDOR',handle:(sql,args)=>{
  if(sql.includes('FOR UPDATE OF i'))return result([{id:1,nombre:'Notebook',stock_fisico:10,stock_reservado:2,precio:500}]);
  if(sql.startsWith('INSERT INTO venta'))return result([{id:10,total:args[4]}]);return result();
 }});
 const res=await f.request(canal==='ONLINE'?'/pedidos/online':'/ventas/presencial',{body:{items:[{producto_id:1,cantidad:1,precio:1},{producto_id:1,cantidad:2}],metodo_pago:'EFECTIVO'}});
 assert.equal(res.status,201);assert.equal(res.data.total,1500);assert.equal(res.data.items.length,1);
 assert.ok(f.calls.some(x=>x.sql.startsWith(`UPDATE inventario SET ${canal==='ONLINE'?'stock_reservado=stock_reservado+':'stock_fisico=stock_fisico-'}`)&&x.args[0]===3));
 assert.ok(f.calls.some(x=>x.sql==='COMMIT'));
});
test('error al guardar detalle revierte venta y stock',async t=>{const f=await fixture(t,{handle:sql=>{
 if(sql.includes('FOR UPDATE OF i'))return result([{id:1,nombre:'Notebook',stock_fisico:10,stock_reservado:0,precio:100}]);
 if(sql.startsWith('INSERT INTO venta'))return result([{id:1}]);
 if(sql.startsWith('INSERT INTO detalle_venta'))throw Object.assign(new Error('Referencia inválida'),{code:'23503'});return result();
 }});assert.equal((await f.request('/pedidos/online',{body:{items:[{producto_id:1,cantidad:1}]}})).status,400);assert.ok(f.calls.some(x=>x.sql==='ROLLBACK'));assert.ok(!f.calls.some(x=>x.sql==='COMMIT'));});
test('impide saltar de pendiente a entregada',async t=>{const f=await fixture(t,{rol:'BODEGA',handle:()=>result([{id:1,estado:'PENDIENTE',canal:'ONLINE'}])});assert.equal((await f.request('/pedidos/1/estado',{method:'PATCH',body:{estado:'ENTREGADA'}})).status,409);});
for(const estado of ['ENTREGADA','CANCELADA'])test(`${estado}: reserva inconsistente revierte y no registra movimiento`,async t=>{
 const f=await fixture(t,{rol:'BODEGA',handle:sql=>{
  if(sql.includes('SELECT id,estado,canal'))return result([{id:1,estado:'LISTO',canal:'ONLINE'}]);
  if(sql.includes('FROM detalle_venta'))return result([{producto_id:1,cantidad:2}]);return result();
 }});assert.equal((await f.request('/pedidos/1/estado',{method:'PATCH',body:{estado}})).status,409);assert.ok(f.calls.some(x=>x.sql==='ROLLBACK'));assert.ok(!f.calls.some(x=>x.sql.startsWith('INSERT INTO movimiento')));
});
test('ajuste no consume unidades reservadas',async t=>{const f=await fixture(t,{rol:'BODEGA',handle:()=>result([{stock_fisico:5,stock_reservado:4}])});assert.equal((await f.request('/inventario/ajuste',{body:{producto_id:1,delta:-2,motivo:'Conteo físico'}})).status,409);});
test('ajuste rechaza booleanos',async t=>{const f=await fixture(t,{rol:'BODEGA'});assert.equal((await f.request('/inventario/ajuste',{body:{producto_id:1,delta:true,motivo:'Conteo físico'}})).status,400);});
test('recepción rechazada o ya recibida no aumenta stock',async t=>{for(const estado of ['RECHAZADA','RECIBIDA','PENDIENTE']){const f=await fixture(t,{rol:'BODEGA',handle:()=>result([{estado}])});assert.equal((await f.request('/reposiciones/1/recepcion',{body:{}})).status,409);assert.ok(!f.calls.some(x=>x.sql.startsWith('UPDATE inventario')));}});
test('reposición de producto de otro proveedor revierte',async t=>{const f=await fixture(t,{rol:'BODEGA',handle:sql=>sql.startsWith('SELECT id FROM proveedor')?result([{id:1}]):sql.startsWith('INSERT INTO solicitud')?result([{id:1}]):result([{proveedor_id:2}])});assert.equal((await f.request('/reposiciones',{body:{proveedor_id:1,items:[{producto_id:1,cantidad:1}]}})).status,400);assert.ok(f.calls.some(x=>x.sql==='ROLLBACK'));});
