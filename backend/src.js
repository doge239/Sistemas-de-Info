import 'dotenv/config';
import pg from 'pg';
<<<<<<< HEAD
import {createApp} from './app.js';
=======
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {readPage} from './pagination.js';
import {deliveryFor, nextOrderStates} from './delivery.js';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
>>>>>>> e29a546 (Actualizar tienda, perfiles, pedidos y despliegue)

if (!process.env.DATABASE_URL || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) {
  console.error('Configura DATABASE_URL y un JWT_SECRET seguro en backend/.env');
  process.exit(1);
}
// Node.js conserva una cantidad moderada de conexiones con Supabase.
<<<<<<< HEAD
// SSL se establece con sslmode=require en la DATABASE_URL del .env.
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });
const app=createApp(db,process.env.JWT_SECRET);
=======
// Railway receives the Supabase CA separately, without local filesystem paths.
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL,
 ...(process.env.DATABASE_CA_CERT?{ssl:{ca:process.env.DATABASE_CA_CERT,rejectUnauthorized:true}}:{}),
 max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({limit:'150kb'}));
const R = {ADMIN:'ADMINISTRADOR',SELLER:'VENDEDOR',STORE:'BODEGA',BOSS:'JEFATURA',CLIENT:'CLIENTE'};
class Problem extends Error {constructor(message,status=400){super(message);this.status=status;}}
const fail = (message,status=400)=>{throw new Problem(message,status);};
const wrap = fn => (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const posInt = v => Number.isSafeInteger(Number(v)) && Number(v)>0 ? Number(v) : null;
const text = v => typeof v==='string' ? v.trim() : '';
async function tx(fn){const c=await db.connect();try{await c.query('BEGIN');const out=await fn(c);await c.query('COMMIT');return out;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
const auth = wrap(async(req,_res,next)=>{
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  let identity;
  try {identity=jwt.verify(token,process.env.JWT_SECRET);} catch {fail('Inicia sesión para continuar',401);}
  const {rows}=await q(`SELECT u.id,u.nombre,u.email,r.nombre rol FROM usuario u JOIN rol r ON r.id=u.rol_id WHERE u.id=$1 AND u.activo`,[identity.id]);
  if(!rows.length)fail('Tu cuenta ya no está disponible. Inicia sesión con una cuenta activa.',401);
  req.user=rows[0];
  next();
});
function roles(...permitted){return (req,_res,next)=>permitted.includes(req.user?.rol)?next():next(new Problem('No tienes permisos para esta operación',403));}
const q = (sql, params=[]) => db.query(sql, params);
const stockSql=`SELECT p.id,p.nombre,p.precio,i.stock_fisico,i.stock_reservado,i.stock_minimo
 FROM producto p JOIN inventario i ON i.producto_id=p.id WHERE p.id=$1 AND p.activo FOR UPDATE OF i`;

app.get('/api/salud',wrap(async(_req,res)=>{await q('SELECT 1');res.json({ok:true,base:'Supabase PostgreSQL'});}));
app.post('/api/auth/registro',wrap(async(req,res)=>{
 const nombre=text(req.body.nombre),email=text(req.body.email).toLowerCase(),clave=req.body.clave;
 if(nombre.length<3||nombre.length>100||email.length>150||!/^\S+@\S+\.\S+$/.test(email)||typeof clave!=='string'||clave.length<8||Buffer.byteLength(clave,'utf8')>72)
  fail('Ingresa un nombre (3 a 100 caracteres), correo válido y contraseña de al menos 8 caracteres (máximo 72 bytes)');
 const hash=await bcrypt.hash(clave,12);
 // El registro público nunca utiliza el rol ni el estado recibidos del navegador.
 try{
  const {rows:[user]}=await q(`INSERT INTO usuario(nombre,email,clave_hash,rol_id) VALUES($1,$2,$3,(SELECT id FROM rol WHERE nombre=$4)) RETURNING id,nombre,email`,[nombre,email,hash,R.CLIENT]);
  const identity={...user,rol:R.CLIENT};
  const token=jwt.sign(identity,process.env.JWT_SECRET,{expiresIn:'8h'});
  res.status(201).json({token,usuario:identity});
 }catch(e){if(e.code==='23505')fail('Este correo ya está registrado. Inicia sesión con tu cuenta.',409);throw e;}
}));
app.post('/api/auth/login',wrap(async(req,res)=>{
 const email=text(req.body.email).toLowerCase(), clave=req.body.clave;
 if(!email||!clave)fail('Correo y contraseña son obligatorios');
 const {rows}=await q(`SELECT u.id,u.nombre,u.email,u.clave_hash,u.activo,r.nombre AS rol
 FROM usuario u JOIN rol r ON r.id=u.rol_id WHERE u.email=$1`,[email]);
 const user=rows[0];
 if(!user||!user.activo||!await bcrypt.compare(String(clave),user.clave_hash)) fail('Credenciales incorrectas',401);
 const identity={id:user.id,nombre:user.nombre,email:user.email,rol:user.rol};
 const token=jwt.sign(identity,process.env.JWT_SECRET,{expiresIn:'8h'});
 res.json({token,usuario:identity});
}));
app.get('/api/auth/me',auth,wrap(async(req,res)=>{
 res.json(req.user);
}));
app.get('/api/productos',wrap(async(req,res)=>{
 const filtro=text(req.query.buscar).slice(0,150),categoria=text(req.query.categoria);
 const proveedor=req.query.proveedor_id===undefined?null:posInt(req.query.proveedor_id);
 if(req.query.proveedor_id!==undefined&&!proveedor)fail('Proveedor inválido');
 const sorting={recommended:'p.id', 'price-up':'p.precio ASC,p.id', 'price-down':'p.precio DESC,p.id',name:'p.nombre,p.id'};
 const sort=text(req.query.sort)||'recommended';
 const order=Object.hasOwn(sorting,sort)?sorting[sort]:null;
 if(!order)fail('Orden inválido');
 const from=`FROM producto p JOIN inventario i ON i.producto_id=p.id JOIN categoria c ON c.id=p.categoria_id
 WHERE p.activo AND ($1='' OR p.nombre ILIKE '%'||$1||'%' OR p.sku ILIKE '%'||$1||'%' OR c.nombre ILIKE '%'||$1||'%')
 AND ($2='' OR c.nombre=$2) AND ($3::bigint IS NULL OR p.proveedor_id=$3)`;
 res.json(await readPage(req.query,q,{sql:`SELECT p.id,p.sku,p.nombre,p.precio,p.categoria_id,p.proveedor_id,c.nombre categoria,
 i.stock_fisico,i.stock_reservado,(i.stock_fisico-i.stock_reservado) disponible,i.stock_minimo,
 CASE WHEN i.stock_fisico-i.stock_reservado=0 THEN 'Sin stock' WHEN i.stock_fisico-i.stock_reservado<=i.stock_minimo THEN 'Bajo stock' ELSE 'En stock' END estado
 ${from}`,countSql:`SELECT COUNT(*) total ${from}`,params:[filtro,categoria,proveedor],order}));
}));
let categoryCache;
app.get('/api/categorias',wrap(async(_req,res)=>{
 if(!categoryCache||categoryCache.expires<Date.now()){
  const {rows}=await q('SELECT id,nombre FROM categoria ORDER BY nombre LIMIT 50');
  categoryCache={items:rows,expires:Date.now()+300000};
 }
 res.set('Cache-Control','public, max-age=300').json(categoryCache.items);
}));
app.get('/api/indicadores',auth,roles(R.ADMIN,R.BOSS,R.STORE),wrap(async(_req,res)=>{
 const [stocks,ventas,pedidos,solicitudes,semanal]=await Promise.all([
  q(`SELECT COUNT(*)::int productos,COUNT(*) FILTER(WHERE stock_fisico-stock_reservado>0)::int disponibles,
    COUNT(*) FILTER(WHERE stock_fisico-stock_reservado=0)::int agotados,
    COUNT(*) FILTER(WHERE stock_fisico-stock_reservado>0 AND stock_fisico-stock_reservado<=stock_minimo)::int bajo_minimo FROM inventario`),
  q(`SELECT COALESCE(SUM(total) FILTER (WHERE creado_en::date=CURRENT_DATE AND estado IN ('CONFIRMADA','ENTREGADA')),0)::int ventas_dia,
    COUNT(*) FILTER(WHERE canal='PRESENCIAL')::int presenciales,COUNT(*) FILTER(WHERE canal='ONLINE')::int online FROM venta`),
  q(`SELECT COUNT(*)::int pendientes FROM venta WHERE canal='ONLINE' AND estado IN('PENDIENTE','PREPARANDO','LISTO','EN_DESPACHO')`),
  q(`SELECT COUNT(*)::int pendientes FROM solicitud_reposicion WHERE estado='PENDIENTE'`),
  q(`SELECT creado_en::date fecha,canal,SUM(total)::int total FROM venta WHERE creado_en>=CURRENT_DATE-INTERVAL '6 days'
  AND estado IN('CONFIRMADA','ENTREGADA') GROUP BY creado_en::date,canal ORDER BY fecha,canal`)
 ]);
 res.json({stock:stocks.rows[0],ventas:ventas.rows[0],pedidos:pedidos.rows[0],reposiciones:solicitudes.rows[0],semanal:semanal.rows});
}));
function validateItems(items){
 if(!Array.isArray(items)||items.length<1||items.length>50)fail('Agrega entre 1 y 50 productos');
 const unique=new Map();
 for(const x of items){const id=posInt(x.producto_id),cant=posInt(x.cantidad);if(!id||!cant||cant>100)fail('Producto o cantidad inválida');unique.set(id,(unique.get(id)||0)+cant);}
 return [...unique].sort((a,b)=>a[0]-b[0]);
}
async function createSale(req,canal){
 const items=validateItems(req.body.items),pago=canal==='PRESENCIAL'?text(req.body.metodo_pago).toUpperCase():null;
 const entrega=deliveryFor(req.body,canal);
 if(canal==='PRESENCIAL'&&!['EFECTIVO','TARJETA','TRANSFERENCIA','OTRO'].includes(pago))fail('Selecciona un método de pago válido');
 return tx(async c=>{
  const priced=[];
  for(const [id,cantidad] of items){
   const {rows}=await c.query(stockSql,[id]); const p=rows[0];
   if(!p)fail(`Producto ${id} no existe`,404);
   if(p.stock_fisico-p.stock_reservado<cantidad)fail(`Stock insuficiente para ${p.nombre}`,409);
   priced.push({id,cantidad,precio:p.precio});
  }
  const total=priced.reduce((sum,p)=>sum+p.cantidad*p.precio,0);
  const {rows:[sale]}=await c.query(`INSERT INTO venta(usuario_id,canal,estado,metodo_pago,total,tipo_entrega,datos_entrega) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.id,canal,canal==='PRESENCIAL'?'CONFIRMADA':'PENDIENTE',pago,total,entrega.tipo,entrega.datos]);
  for(const p of priced){
   await c.query('INSERT INTO detalle_venta(venta_id,producto_id,cantidad,precio_unitario) VALUES($1,$2,$3,$4)',[sale.id,p.id,p.cantidad,p.precio]);
   if(canal==='PRESENCIAL')await c.query('UPDATE inventario SET stock_fisico=stock_fisico-$1,actualizado_en=NOW() WHERE producto_id=$2',[p.cantidad,p.id]);
   else await c.query('UPDATE inventario SET stock_reservado=stock_reservado+$1,actualizado_en=NOW() WHERE producto_id=$2',[p.cantidad,p.id]);
   await c.query(`INSERT INTO movimiento_inventario(producto_id,usuario_id,venta_id,tipo,cantidad,motivo)
    VALUES($1,$2,$3,$4,$5,$6)`,[p.id,req.user.id,sale.id,canal==='PRESENCIAL'?'SALIDA_VENTA':'RESERVA',p.cantidad,'Transacción del sistema']);
  }
  return {...sale,items:priced};
 });
}
app.post('/api/ventas/presencial',auth,roles(R.ADMIN,R.SELLER),wrap(async(req,res)=>res.status(201).json(await createSale(req,'PRESENCIAL'))));
app.post('/api/pedidos/online',auth,roles(R.CLIENT,R.ADMIN),wrap(async(req,res)=>res.status(201).json(await createSale(req,'ONLINE'))));
app.get('/api/pedidos/mios',auth,wrap(async(req,res)=>{
 res.json(await readPage(req.query,q,{sql:`SELECT id,canal,estado,total,creado_en,tipo_entrega,datos_entrega FROM venta WHERE usuario_id=$1 AND canal='ONLINE'`,
 countSql:`SELECT COUNT(*) total FROM venta WHERE usuario_id=$1 AND canal='ONLINE'`,params:[req.user.id],order:'id DESC'}));
}));
app.get('/api/pedidos',auth,roles(R.ADMIN,R.STORE,R.BOSS,R.SELLER),wrap(async(req,res)=>{
 res.json(await readPage(req.query,q,{sql:`SELECT v.id,v.estado,v.total,v.creado_en,v.tipo_entrega,v.datos_entrega,u.nombre cliente
 FROM venta v LEFT JOIN usuario u ON u.id=v.usuario_id WHERE v.canal='ONLINE'`,
 countSql:`SELECT COUNT(*) total FROM venta WHERE canal='ONLINE'`,order:'v.id DESC'}));
}));
app.patch('/api/pedidos/:id/estado',auth,roles(R.ADMIN,R.STORE,R.SELLER),wrap(async(req,res)=>{
 const id=posInt(req.params.id),nuevo=text(req.body.estado).toUpperCase();if(!id||!['PREPARANDO','LISTO','EN_DESPACHO','ENTREGADA','CANCELADA'].includes(nuevo))fail('Estado inválido');
 if(req.user.rol===R.SELLER&&['PREPARANDO','LISTO','EN_DESPACHO'].includes(nuevo))fail('Solo bodega o administración puede preparar y despachar pedidos',403);
 const out=await tx(async c=>{
  const {rows}=await c.query(`SELECT id,estado,canal,tipo_entrega FROM venta WHERE id=$1 FOR UPDATE`,[id]);const sale=rows[0];
  if(!sale||sale.canal!=='ONLINE')fail('Pedido no encontrado',404);
  if(!nextOrderStates(sale).includes(nuevo))fail(`No se puede pasar de ${sale.estado} a ${nuevo}`,409);
  const salida=nuevo==='EN_DESPACHO'||(nuevo==='ENTREGADA'&&sale.tipo_entrega!=='DOMICILIO');
  if(salida||nuevo==='CANCELADA'){
   const {rows:details}=await c.query('SELECT producto_id,cantidad FROM detalle_venta WHERE venta_id=$1 ORDER BY producto_id',[id]);
   for(const d of details){
    await c.query('SELECT producto_id FROM inventario WHERE producto_id=$1 FOR UPDATE',[d.producto_id]);
    const stock=await c.query(salida ?
      `UPDATE inventario SET stock_fisico=stock_fisico-$1,stock_reservado=stock_reservado-$1,actualizado_en=NOW() WHERE producto_id=$2 AND stock_reservado>=$1` :
      `UPDATE inventario SET stock_reservado=stock_reservado-$1,actualizado_en=NOW() WHERE producto_id=$2 AND stock_reservado>=$1`,[d.cantidad,d.producto_id]);
    if(stock.rowCount!==1)fail('El stock reservado no coincide con el pedido',409);
    await c.query(`INSERT INTO movimiento_inventario(producto_id,usuario_id,venta_id,tipo,cantidad,motivo) VALUES($1,$2,$3,$4,$5,$6)`,
     [d.producto_id,req.user.id,id,salida?(sale.tipo_entrega==='DOMICILIO'?'SALIDA_ENVIO':'SALIDA_RETIRO'):'LIBERACION_RESERVA',d.cantidad,'Actualización pedido online']);
   }
  }
  const {rows:[updated]}=await c.query(`UPDATE venta SET estado=$1,actualizado_en=NOW() WHERE id=$2 RETURNING *`,[nuevo,id]);return updated;
 });res.json(out);
}));
app.get('/api/movimientos',auth,roles(R.ADMIN,R.STORE,R.BOSS),wrap(async(req,res)=>{
 res.json(await readPage(req.query,q,{sql:`SELECT m.id,m.tipo,m.cantidad,m.motivo,m.creado_en,p.nombre producto,u.nombre usuario
 FROM movimiento_inventario m JOIN producto p ON p.id=m.producto_id LEFT JOIN usuario u ON u.id=m.usuario_id`,
 countSql:'SELECT COUNT(*) total FROM movimiento_inventario',order:'m.id DESC'}));
}));
app.post('/api/inventario/ajuste',auth,roles(R.ADMIN,R.STORE),wrap(async(req,res)=>{
 const id=posInt(req.body.producto_id),delta=Number(req.body.delta),motivo=text(req.body.motivo);
 if(!id||!Number.isSafeInteger(delta)||delta===0||Math.abs(delta)>10000||motivo.length<5)fail('Producto, cantidad no nula y motivo de al menos 5 caracteres son obligatorios');
 const updated=await tx(async c=>{
  const {rows}=await c.query(stockSql,[id]);const p=rows[0];if(!p)fail('Producto no encontrado',404);
  if(p.stock_fisico+delta<p.stock_reservado)fail('El ajuste afectaría unidades reservadas',409);
  await c.query('UPDATE inventario SET stock_fisico=stock_fisico+$1,actualizado_en=NOW() WHERE producto_id=$2',[delta,id]);
  await c.query('INSERT INTO movimiento_inventario(producto_id,usuario_id,tipo,cantidad,motivo) VALUES($1,$2,$3,$4,$5)',[id,req.user.id,delta>0?'AJUSTE_POSITIVO':'AJUSTE_NEGATIVO',Math.abs(delta),motivo]);
  return {producto_id:id,stock_fisico:p.stock_fisico+delta};
 });res.json(updated);
}));
app.get('/api/reposiciones',auth,roles(R.ADMIN,R.STORE,R.BOSS),wrap(async(req,res)=>{
 res.json(await readPage(req.query,q,{sql:`SELECT s.id,s.estado,s.observaciones,s.creada_en,p.nombre proveedor,
  COALESCE(details.detalle,'') detalle
 FROM solicitud_reposicion s JOIN proveedor p ON p.id=s.proveedor_id
 LEFT JOIN LATERAL (SELECT STRING_AGG(pr.nombre||' ×'||d.cantidad,', ' ORDER BY pr.nombre) detalle
 FROM detalle_reposicion d JOIN producto pr ON pr.id=d.producto_id WHERE d.solicitud_id=s.id) details ON TRUE`,countSql:`SELECT COUNT(*) total,COUNT(*) FILTER(WHERE estado='PENDIENTE') pendientes,
 COUNT(*) FILTER(WHERE estado='APROBADA') aprobadas FROM solicitud_reposicion`,order:'s.id DESC'}));
}));
app.post('/api/reposiciones',auth,roles(R.ADMIN,R.STORE),wrap(async(req,res)=>{
 const proveedor=posInt(req.body.proveedor_id),items=validateItems(req.body.items),observaciones=text(req.body.observaciones);
 if(!proveedor)fail('Proveedor obligatorio');
 const out=await tx(async c=>{
  const {rowCount}=await c.query('SELECT id FROM proveedor WHERE id=$1',[proveedor]);if(!rowCount)fail('Proveedor no encontrado',404);
  const {rows:[s]}=await c.query('INSERT INTO solicitud_reposicion(proveedor_id,solicitado_por,observaciones) VALUES($1,$2,$3) RETURNING *',[proveedor,req.user.id,observaciones]);
  for(const [id,qty] of items){
   const {rows}=await c.query('SELECT proveedor_id FROM producto WHERE id=$1',[id]);
   if(!rows.length||Number(rows[0].proveedor_id)!==proveedor)fail(`Producto ${id} no pertenece al proveedor`,400);
   await c.query('INSERT INTO detalle_reposicion(solicitud_id,producto_id,cantidad) VALUES($1,$2,$3)',[s.id,id,qty]);
  }return s;
 });res.status(201).json(out);
}));
app.patch('/api/reposiciones/:id/decision',auth,roles(R.ADMIN,R.BOSS),wrap(async(req,res)=>{
 const id=posInt(req.params.id),decision=text(req.body.estado).toUpperCase(),obs=text(req.body.observaciones);
 if(!id||!['APROBADA','RECHAZADA'].includes(decision))fail('Decisión inválida');
 const {rows}=await q(`UPDATE solicitud_reposicion SET estado=$1,decidido_por=$2,decidida_en=NOW(),observaciones=$3
 WHERE id=$4 AND estado='PENDIENTE' RETURNING *`,[decision,req.user.id,obs,id]);if(!rows.length)fail('Solicitud no encontrada o ya procesada',409);res.json(rows[0]);
}));
app.post('/api/reposiciones/:id/recepcion',auth,roles(R.ADMIN,R.STORE),wrap(async(req,res)=>{
 const id=posInt(req.params.id);if(!id)fail('Solicitud inválida');
 const out=await tx(async c=>{
  const {rows:[s]}=await c.query('SELECT * FROM solicitud_reposicion WHERE id=$1 FOR UPDATE',[id]);
  if(!s||s.estado!=='APROBADA')fail('Solo pueden recibirse solicitudes aprobadas',409);
  const {rows:items}=await c.query('SELECT producto_id,cantidad FROM detalle_reposicion WHERE solicitud_id=$1 ORDER BY producto_id',[id]);
  for(const d of items){
   await c.query('UPDATE inventario SET stock_fisico=stock_fisico+$1,actualizado_en=NOW() WHERE producto_id=$2',[d.cantidad,d.producto_id]);
   await c.query(`INSERT INTO movimiento_inventario(producto_id,usuario_id,tipo,cantidad,motivo) VALUES($1,$2,'RECEPCION',$3,$4)`,[d.producto_id,req.user.id,d.cantidad,`Recepción solicitud #${id}`]);
  }
  const {rows:[received]}=await c.query("UPDATE solicitud_reposicion SET estado='RECIBIDA',recibida_en=NOW() WHERE id=$1 RETURNING *",[id]);return received;
 });res.json(out);
}));
app.get('/api/proveedores',auth,wrap(async(req,res)=>{
 const buscar=text(req.query.buscar).slice(0,150),where=`WHERE ($1='' OR nombre ILIKE '%'||$1||'%')`;
 res.json(await readPage(req.query,q,{sql:`SELECT id,nombre FROM proveedor ${where}`,countSql:`SELECT COUNT(*) total FROM proveedor ${where}`,params:[buscar],order:'id'}));
}));
app.get('/api/usuarios',auth,roles(R.ADMIN),wrap(async(req,res)=>{
 const buscar=text(req.query.buscar).slice(0,150),where=`WHERE ($1='' OR u.nombre ILIKE '%'||$1||'%' OR u.email ILIKE '%'||$1||'%')`;
 res.json(await readPage(req.query,q,{sql:`SELECT u.id,u.nombre,u.email,u.activo,u.creado_en,r.nombre rol FROM usuario u JOIN rol r ON r.id=u.rol_id ${where}`,
 countSql:`SELECT COUNT(*) total FROM usuario u ${where}`,params:[buscar],order:'u.id'}));
}));
app.post('/api/usuarios',auth,roles(R.ADMIN),wrap(async(req,res)=>{
 const nombre=text(req.body.nombre),email=text(req.body.email).toLowerCase(),clave=text(req.body.clave),rol=text(req.body.rol);
 if(nombre.length<3||!/^\S+@\S+\.\S+$/.test(email)||clave.length<8||!Object.values(R).includes(rol))fail('Nombre, correo, contraseña (8+ caracteres) y rol válido son obligatorios');
 const hash=await bcrypt.hash(clave,12);
 try{const {rows}=await q(`INSERT INTO usuario(nombre,email,clave_hash,rol_id) VALUES($1,$2,$3,(SELECT id FROM rol WHERE nombre=$4)) RETURNING id,nombre,email`,[nombre,email,hash,rol]);res.status(201).json(rows[0]);}
 catch(e){if(e.code==='23505')fail('Correo ya registrado',409);throw e;}
}));
app.patch('/api/usuarios/:id/rol',auth,roles(R.ADMIN),wrap(async(req,res)=>{
 const id=posInt(req.params.id),rol=text(req.body.rol);
 if(!id||!Object.values(R).includes(rol))fail('Usuario o rol inválido');
 if(String(id)===String(req.user.id)&&rol!==R.ADMIN)fail('No puedes quitarte tu propio rol de administrador',409);
 const {rows}=await q(`UPDATE usuario SET rol_id=(SELECT id FROM rol WHERE nombre=$1) WHERE id=$2 AND activo
 RETURNING id,nombre,email,activo`,[rol,id]);
 if(!rows.length)fail('Usuario no encontrado o inactivo',404);
 res.json({usuario:{...rows[0],rol},message:'Rol actualizado correctamente'});
}));
app.delete('/api/usuarios/:id',auth,roles(R.ADMIN),wrap(async(req,res)=>{
 const id=posInt(req.params.id);
 if(!id)fail('Usuario inválido');
 if(String(id)===String(req.user.id))fail('No puedes eliminar tu propia cuenta de administrador',409);
 // La baja lógica conserva las referencias de ventas, movimientos y reposiciones.
 const {rows}=await q('UPDATE usuario SET activo=FALSE WHERE id=$1 RETURNING id,nombre,email,activo',[id]);
 if(!rows.length)fail('Usuario no encontrado',404);
 res.json({usuario:rows[0],message:'Usuario eliminado. Su acceso fue desactivado y su historial se conserva.'});
}));
// Railway serves the compiled store and API on the same origin.
const frontendDir=[new URL('./public/',import.meta.url),new URL('../frontend/dist/',import.meta.url)]
 .map(url=>fileURLToPath(url)).find(directory=>existsSync(directory+'index.html'));
if(frontendDir){
 app.use(express.static(frontendDir,{maxAge:'1h',setHeaders(res,path){
  if(path.endsWith('index.html'))res.setHeader('Cache-Control','no-cache');
  else if(/[\\/]assets[\\/]/.test(path))res.setHeader('Cache-Control','public, max-age=31536000, immutable');
 }}));
 app.get('*',(req,res,next)=>{
  if(req.path==='/api'||req.path.startsWith('/api/'))return next();
  if(!req.accepts('html')||/\.[a-z0-9]+$/i.test(req.path))return next();
  res.set('Cache-Control','no-cache').sendFile(frontendDir+'index.html');
 });
}
app.use((_req,_res,next)=>next(new Problem('Ruta no encontrada',404)));
app.use((err,_req,res,_next)=>{
 if(err.code==='23514'||err.code==='23503'||err.code==='22P02')return res.status(400).json({error:'Datos inválidos o referencia inexistente'});
 if(!err.status)console.error('Error backend:',err);
 res.status(err.status||500).json({error:err.status?err.message:'Error interno del servidor'});
});
>>>>>>> e29a546 (Actualizar tienda, perfiles, pedidos y despliegue)
const port=Number(process.env.PORT)||4000;
app.listen(port,'0.0.0.0',()=>console.log(`PC Factory: http://0.0.0.0:${port}`));
