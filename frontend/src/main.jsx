import React, {useState,useEffect,useCallback,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {LayoutDashboard,ShoppingCart,ShoppingBag,Package,Truck,Users,LogOut,Search,Bell,Store,ShieldCheck,ChevronRight,RefreshCw,Plus,CheckCircle2,AlertTriangle,Box,ClipboardList,BarChart3,X} from 'lucide-react';
import './style.css';
import './storefront.css';
import {api, post, patch, money, errMsg} from './api';
import Commerce from './Commerce';
import Storefront from './Storefront';
import {ContentSkeleton} from './loading';
import {useDebounced, usePagedResource, Pagination, ListSearch, EntityPicker} from './pagination';
import './workspace.css';
import './delivery.css';
import Orders from './Orders';

const roleName={ADMINISTRADOR:'Administrador',VENDEDOR:'Vendedor',BODEGA:'Bodega',JEFATURA:'Jefatura',CLIENTE:'Cliente'};
<<<<<<< HEAD
const money=n=>'$ '+Number(n||0).toLocaleString('es-CL');
const errMsg=e=>e?.message||'No fue posible completar la operación';
function api(path,opts={}){
 const token=localStorage.getItem('pcf_token');
 return fetch('/api'+path,{...opts,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...opts.headers}})
 .then(async r=>{let data;try{data=await r.json();}catch{throw new Error('No se pudo leer la respuesta del servidor');}if(!r.ok){const error=new Error(data.error||`Error ${r.status}`);error.status=r.status;throw error;}return data;});
}
const post=(path,data)=>api(path,{method:'POST',body:JSON.stringify(data)});
const patch=(path,data)=>api(path,{method:'PATCH',body:JSON.stringify(data)});
=======
const roleDetails={
 ADMINISTRADOR:{title:'Todo tu negocio, en un solo lugar.',description:'Supervisa la operación y gestiona los accesos de tu equipo.',icon:ShieldCheck},
 VENDEDOR:{title:'Cada venta empieza contigo.',description:'Encuentra productos, prepara el carrito y registra las ventas de la sucursal.',icon:ShoppingCart},
 BODEGA:{title:'Tu inventario, siempre al día.',description:'Controla existencias, prepara pedidos y organiza las reposiciones.',icon:Package},
 JEFATURA:{title:'Una visión clara para decidir.',description:'Revisa los resultados de la sucursal y coordina las próximas reposiciones.',icon:BarChart3},
};
function initialPage(rol){return ({ADMINISTRADOR:'inicio',JEFATURA:'inicio',BODEGA:'inventario',VENDEDOR:'venta',CLIENTE:'catalogo'})[rol]||'catalogo';}
>>>>>>> e29a546 (Actualizar tienda, perfiles, pedidos y despliegue)
const nav=[
 {key:'inicio',label:'Panel principal',icon:LayoutDashboard,roles:['ADMINISTRADOR','JEFATURA','BODEGA']},
 {key:'catalogo',label:'Compra online',icon:ShoppingBag,roles:['CLIENTE','ADMINISTRADOR']},
 {key:'venta',label:'Venta presencial',icon:ShoppingCart,roles:['VENDEDOR','ADMINISTRADOR']},
 {key:'pedidos',label:'Pedidos online',icon:ClipboardList,roles:['CLIENTE','ADMINISTRADOR','BODEGA','JEFATURA','VENDEDOR']},
 {key:'inventario',label:'Inventario / Bodega',icon:Package,roles:['ADMINISTRADOR','BODEGA','JEFATURA']},
 {key:'reposiciones',label:'Reposición',icon:Truck,roles:['ADMINISTRADOR','BODEGA','JEFATURA']},
 {key:'usuarios',label:'Usuarios y roles',icon:Users,roles:['ADMINISTRADOR']},
];
function BoxMessage({text,type='ok'}){return text?<div className={'message '+(type==='error'?'error':'ok')} role="status">{type==='error'?<AlertTriangle size={17}/>:<CheckCircle2 size={17}/>} {text}</div>:null;}
function Badge({value}){let cl=/sin stock|rechaz|cancelad/i.test(value)?'red':/bajo|pendient|preparando/i.test(value)?'amber':'green';return <span className={'pill '+cl}>{String(value||'—').replaceAll('_',' ')}</span>;}
function RoleBadge({rol}){return <span className="pill role-badge" data-role={rol}>{roleName[rol]||rol}</span>;}
function Stat({label,value,icon:Icon,sub}){return <div className="stat"><div className="stat-icon"><Icon size={23}/></div><div><p>{label}</p><strong>{value}</strong><small>{sub}</small></div></div>;}
function Card({children,title,action}){return <section className="card"><div className="card-heading"><h3>{title}</h3>{action}</div>{children}</section>;}
<<<<<<< HEAD
function Login({onLogin}){
 const [email,setEmail]=useState('cliente@demo.test');const [clave,setClave]=useState('Demo2026!');const [error,setError]=useState('');const [loading,setLoading]=useState(false);
 async function submit(e){e.preventDefault();setLoading(true);setError('');try{const r=await post('/auth/login',{email,clave});localStorage.setItem('pcf_token',r.token);onLogin(r.usuario);}catch(ex){setError(errMsg(ex));}finally{setLoading(false);}}
 return <div className="login-bg"><div className="login-brand"><span className="mark">P₂</span> Factory</div><form onSubmit={submit} className="login-card"><div className="login-icon"><ShieldCheck size={28}/></div><h1>Bienvenido al sistema</h1><p>Inicia sesión para gestionar ventas, pedidos e inventario de PC Factory Antofagasta.</p><label>Correo electrónico<input value={email} type="email" onChange={e=>setEmail(e.target.value)} required/></label><label>Contraseña<input value={clave} type="password" onChange={e=>setClave(e.target.value)} required/></label><BoxMessage type="error" text={error}/><button className="btn" disabled={loading}>{loading?'Ingresando...':'Iniciar sesión'} <ChevronRight size={17}/></button><div className="demo"><b>Cuentas para la demostración</b><p>Selecciona un perfil y utiliza la contraseña temporal <code>Demo2026!</code>.</p><select value={email} onChange={e=>setEmail(e.target.value)}>{['admin','vendedor','bodega','jefatura','cliente'].map(v=><option key={v} value={v+'@demo.test'}>{v[0].toUpperCase()+v.slice(1)}</option>)}</select></div></form><p className="login-footer">Prototipo académico · Datos ficticios · Universidad Católica del Norte</p></div>;
=======
function Login({onLogin,onClose}){
 const [email,setEmail]=useState('');const [clave,setClave]=useState('');const [error,setError]=useState('');const [loading,setLoading]=useState(false);
 const [register,setRegister]=useState(false),[nombre,setNombre]=useState(''),[confirmation,setConfirmation]=useState('');
 function switchMode(){setRegister(v=>!v);setError('');setClave('');setConfirmation('');}
 async function submit(e){e.preventDefault();setError('');if(register&&clave!==confirmation){setError('Las contraseñas no coinciden');return;}setLoading(true);try{const r=await post(register?'/auth/registro':'/auth/login',register?{nombre,email,clave}:{email,clave});localStorage.setItem('pcf_token',r.token);onLogin(r.usuario);}catch(ex){setError(errMsg(ex));}finally{setLoading(false);}}
 const dialog=React.useRef(null);
 useEffect(()=>{const previous=document.activeElement;dialog.current.showModal();return ()=>{previous?.focus();};},[]);
 return <dialog ref={dialog} className="login-dialog" aria-labelledby="login-title" onCancel={onClose}><form onSubmit={submit} className="login-card"><button type="button" className="login-close" aria-label="Volver a la tienda" onClick={onClose}><X size={22}/></button><div className="login-icon"><ShieldCheck size={28}/></div><h2 id="login-title">{register?'Crear cuenta':'Iniciar sesión'}</h2><p>{register?'Regístrate para reservar productos y consultar tus pedidos.':'Ingresa a tu cuenta para confirmar tus pedidos o acceder a tu espacio de trabajo.'}</p>{register&&<label>Nombre completo<input value={nombre} autoComplete="name" minLength={3} maxLength={100} onChange={e=>setNombre(e.target.value)} required/></label>}<label>Correo electrónico<input value={email} type="email" autoComplete="username" maxLength={150} onChange={e=>setEmail(e.target.value)} required/></label><label>Contraseña<input value={clave} type="password" aria-describedby={register?'password-help':undefined} autoComplete={register?'new-password':'current-password'} minLength={register?8:undefined} onChange={e=>setClave(e.target.value)} required/></label>{register&&<small id="password-help" className="password-help">Usa al menos 8 caracteres.</small>}{register&&<label>Confirmar contraseña<input value={confirmation} type="password" autoComplete="new-password" minLength={8} onChange={e=>setConfirmation(e.target.value)} required/></label>}<BoxMessage type="error" text={error}/><button className="btn" disabled={loading}>{loading?'Procesando...':register?'Crear cuenta':'Iniciar sesión'} <ChevronRight size={17}/></button><div className="auth-switch">{register?'¿Ya tienes cuenta?':'¿No tienes cuenta?'} <button type="button" className="auth-link" disabled={loading} onClick={switchMode}>{register?'Iniciar sesión':'Regístrate'}</button></div></form></dialog>;
>>>>>>> e29a546 (Actualizar tienda, perfiles, pedidos y despliegue)
}
function Dashboard(){
 const [d,setD]=useState(null),[error,setError]=useState('');
 useEffect(()=>{api('/indicadores').then(setD).catch(e=>setError(errMsg(e)));},[]);
 if(error)return <BoxMessage type="error" text={error}/>;
 if(!d)return <ContentSkeleton label="Cargando indicadores"/>;
 const availability=d.stock.productos?Math.round(100*d.stock.disponibles/d.stock.productos):0;
 const weekly=Object.values(d.semanal.reduce((a,v)=>{let f=v.fecha.slice(0,10);a[f]??={fecha:f,presencial:0,online:0};a[f][v.canal==='ONLINE'?'online':'presencial']+=Number(v.total);return a;},{}));
 const maximum=Math.max(1,...weekly.flatMap(a=>[a.presencial,a.online]));
 return <><div className="page-title"><h1>Panel de control</h1><p>Resumen de la operación · Sucursal Antofagasta</p></div><div className="stats"><Stat label="Ventas del día" value={money(d.ventas.ventas_dia)} icon={ShoppingCart} sub="Ventas confirmadas y entregadas"/><Stat label="Productos activos" value={d.stock.productos} icon={Box} sub={`${d.stock.bajo_minimo} bajo mínimo`}/><Stat label="Pedidos online" value={d.pedidos.pendientes} icon={ShoppingBag} sub="Por preparar o entregar"/><Stat label="Reposiciones" value={d.reposiciones.pendientes} icon={Truck} sub="Solicitudes pendientes"/></div>
<<<<<<< HEAD
 <div className="two-col"><Card title="Ventas recientes por canal"><p className="muted">Cifras demostrativas en pesos chilenos</p><div className="chart-legend"><span>● Presencial</span><span>● Online</span></div><div className="mini-chart">{weekly.map(w=><div className="chart-col" key={w.fecha}><div className="bars"><i title={money(w.presencial)} style={{height:(Math.max(4,w.presencial/maximum*100))+'%'}}/><i className="gray" title={money(w.online)} style={{height:(Math.max(4,w.online/maximum*100))+'%'}}/></div><small>{w.fecha.slice(5)}</small></div>)}</div></Card><Card title="Estado del inventario"><div className="big-number">{availability}% <span>disponibilidad</span></div><div className="progress"><div style={{width:availability+'%'}}/></div><div className="status-line"><Badge value="Disponible"/><b>{d.stock.disponibles}</b></div><div className="status-line"><Badge value="Bajo stock"/><b>{d.stock.bajo_minimo}</b></div><div className="status-line"><Badge value="Sin stock"/><b>{d.stock.agotados}</b></div></Card></div><p className="footnote">Valores de ejemplo: se actualizarán con las operaciones registradas en PostgreSQL. Para el informe analítico final deben utilizarse las vistas Power BI.</p></>;
}
function ProductCard({p,onAdd,quantity=0}){return <div className="product-card"><div className="product-visual"><span>{p.categoria}</span><Package size={49}/></div><div className="p-card-title">{p.nombre}</div><small>{p.sku} · {p.categoria}</small><strong>{money(p.precio)}</strong><div><Badge value={p.estado}/> <small>{p.disponible} disponibles</small></div><button className="btn full" onClick={()=>onAdd(p)} disabled={p.disponible<=0||quantity>=Math.min(100,Number(p.disponible))}><Plus size={16}/> {p.disponible<=0?'Sin stock':quantity>0?`Agregar (${quantity} en carrito)`:'Agregar'}</button></div>;}
function Commerce({online,user,onLogin,onSessionExpired,onlineCart,setOnlineCart}){
 const [products,setProducts]=useState([]),[search,setSearch]=useState(''),[localCart,setLocalCart]=useState([]),[payment,setPayment]=useState('EFECTIVO');const [message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const cart=online?onlineCart:localCart,setCart=online?setOnlineCart:setLocalCart;
 const load=useCallback(()=>api('/productos').then(setProducts).catch(e=>setError(errMsg(e))),[]);
 useEffect(()=>{load();const refresh=()=>{if(!document.hidden)load();};const timer=setInterval(refresh,15000);window.addEventListener('focus',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};},[load]);
 function add(p){setCart(items=>{const old=items.find(x=>x.id===p.id);if(old){return items.map(x=>x.id===p.id?{...x,qty:Math.min(100,Number(x.disponible),x.qty+1)}:x);}return [...items,{...p,qty:1}];});}
 function change(id,d){setCart(prev=>prev.map(x=>x.id===id?{...x,qty:Math.max(0,Math.min(100,Number(x.disponible),x.qty+d))}:x).filter(x=>x.qty>0));}
 const total=cart.reduce((s,i)=>s+i.qty*i.precio,0);
 const units=cart.reduce((sum,item)=>sum+item.qty,0),cartRef=useRef(null);
 const cartId=online?'online-cart':'store-cart';
 function viewCart(){cartRef.current?.togglePopover();}
 async function checkout(){
  setError('');setMessage('');
  if(online&&!user){onLogin();return;}
  if(online&&!['CLIENTE','ADMINISTRADOR'].includes(user.rol)){setError('Para reservar online utiliza una cuenta de Cliente o Administrador.');return;}
  setBusy(true);
  try{const data={items:cart.map(x=>({producto_id:x.id,cantidad:x.qty})),...(online?{}:{metodo_pago:payment})};const r=await post(online?'/pedidos/online':'/ventas/presencial',data);setCart([]);setMessage((online?'Pedido reservado':'Venta confirmada')+` #${r.id} · ${money(r.total)}`);await load();}
  catch(e){setError(errMsg(e));if(e.status===401)onSessionExpired();if(e.status===409)await load();}
  finally{setBusy(false);}
 }
 return <><div className="page-title"><h1>{online?'Compra online':'Venta presencial'}</h1><p>{online?'Selecciona productos y confirma retiro en PC Factory Antofagasta':'Registra una venta en sucursal; el descuento de stock es automático'}</p></div><BoxMessage text={message}/><BoxMessage type="error" text={error}/><div className="cart-toolbar"><button className="cart-toggle" onClick={viewCart} aria-label={`Carrito, ${units} unidades`} aria-controls={cartId}><ShoppingCart size={23}/><span>Carrito</span><span className="count" aria-live="polite">{units}</span>{units>0&&<b>{money(total)}</b>}</button></div><div className="commerce-grid catalog-layout"><div><div className="searchbar"><Search size={19}/><input placeholder="Buscar productos por nombre o SKU..." value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="products-grid">{products.filter(p=>(p.nombre+' '+p.sku).toLowerCase().includes(search.toLowerCase())).map(p=><ProductCard key={p.id} p={p} onAdd={add} quantity={cart.find(item=>item.id===p.id)?.qty||0}/>)}</div></div><section className="card sticky-cart cart-popover" popover="auto" id={cartId} ref={cartRef} aria-label="Carrito de compra"><button className="cart-dismiss" aria-label="Cerrar carrito" onClick={()=>cartRef.current?.hidePopover()}><X size={20}/></button><h3>{online?'Mi carrito online':'Carrito de venta'} <span className="count">{units}</span></h3>{cart.length===0?<p className="muted">Agrega productos para comenzar.</p>:cart.map(x=><div className="cart-row" key={x.id}><div><b>{x.nombre}</b><small>{money(x.precio)}</small></div><div className="qty"><button onClick={()=>change(x.id,-1)}>−</button><b>{x.qty}</b><button onClick={()=>change(x.id,1)}>+</button></div></div>)}<BoxMessage type="error" text={error}/><div className="total"><span>Total</span><b>{money(total)}</b></div>{online?<p className="note-green"><Store size={16}/> Pedido para retiro en PC Factory Antofagasta, sin pago integrado.</p>:<label>Método de pago<select value={payment} onChange={e=>setPayment(e.target.value)}>{['EFECTIVO','TARJETA','TRANSFERENCIA','OTRO'].map(x=><option key={x}>{x}</option>)}</select></label>}<button className="btn full" disabled={!cart.length||busy} onClick={checkout}>{busy?'Procesando...':online?(user?'Confirmar pedido para retiro':'Continuar para confirmar pedido'):'Confirmar venta'} <ChevronRight size={16}/></button></section></div></>;
}
function Orders({rol}){
 const isClient=rol==='CLIENTE';const [orders,setOrders]=useState([]),[message,setMessage]=useState(''),[error,setError]=useState('');
 const load=useCallback(()=>api(isClient?'/pedidos/mios':'/pedidos').then(setOrders).catch(e=>setError(errMsg(e))),[isClient]);
 useEffect(()=>{load();},[load]);
 async function change(o,estado){setError('');try{await patch(`/pedidos/${o.id}/estado`,{estado});setMessage(`Pedido #${o.id}: ${estado}`);load();}catch(e){setError(errMsg(e));}}
 return <><div className="page-title"><h1>{isClient?'Mis pedidos':'Pedidos online'}</h1><p>Seguimiento de reservas y retiro en sucursal</p></div><BoxMessage text={message}/><BoxMessage text={error} type="error"/><Card title="Historial de pedidos"><div className="table-wrap"><table><thead><tr><th>Pedido</th><th>{isClient?'Canal':'Cliente'}</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td>#{o.id}</td><td>{isClient?o.canal:o.cliente}</td><td>{new Date(o.creado_en).toLocaleDateString('es-CL')}</td><td>{money(o.total)}</td><td><Badge value={o.estado}/></td><td>{!isClient&&['ADMINISTRADOR','BODEGA','VENDEDOR'].includes(rol)?<div className="row-actions">{o.estado==='PENDIENTE'&&rol!=='VENDEDOR'&&<button onClick={()=>change(o,'PREPARANDO')}>Preparar</button>}{o.estado==='PREPARANDO'&&rol!=='VENDEDOR'&&<button onClick={()=>change(o,'LISTO')}>Listo</button>}{o.estado==='LISTO'&&<button onClick={()=>change(o,'ENTREGADA')}>Entregar</button>}{['PENDIENTE','PREPARANDO','LISTO'].includes(o.estado)&&<button className="danger" onClick={()=>change(o,'CANCELADA')}>Cancelar</button>}</div>:'—'}</td></tr>)}</tbody></table>{!orders.length&&<p className="empty">Todavía no hay pedidos para mostrar.</p>}</div></Card></>;
=======
 <div className="two-col"><Card title="Ventas recientes por canal"><p className="muted">Cifras demostrativas en pesos chilenos</p><div className="chart-legend"><span>● Presencial</span><span>● Online</span></div><div className={"mini-chart "+(!weekly.length?"empty-chart":"")}>{!weekly.length&&<><BarChart3 size={34}/><b>Sin ventas en los últimos 7 días</b><span>Las ventas confirmadas aparecerán aquí.</span></>}{weekly.map(w=><div className="chart-col" key={w.fecha}><div className="bars"><i title={money(w.presencial)} style={{height:(Math.max(4,w.presencial/maximum*100))+'%'}}/><i className="gray" title={money(w.online)} style={{height:(Math.max(4,w.online/maximum*100))+'%'}}/></div><small>{w.fecha.slice(5)}</small></div>)}</div></Card><Card title="Estado del inventario"><div className="big-number">{availability}% <span>disponibilidad</span></div><div className="progress"><div style={{width:availability+'%'}}/></div><div className="status-line"><Badge value="Disponible"/><b>{d.stock.disponibles}</b></div><div className="status-line"><Badge value="Bajo stock"/><b>{d.stock.bajo_minimo}</b></div><div className="status-line"><Badge value="Sin stock"/><b>{d.stock.agotados}</b></div></Card></div><p className="footnote">Valores de ejemplo: se actualizarán con las operaciones registradas en PostgreSQL. Para el informe analítico final deben utilizarse las vistas Power BI.</p></>;
>>>>>>> e29a546 (Actualizar tienda, perfiles, pedidos y despliegue)
}

function Inventory(){
 const [search,setSearch]=useState(''),[selected,setSelected]=useState(''),[delta,setDelta]=useState(''),[motivo,setMotivo]=useState('');
 const [message,setMessage]=useState(''),[error,setError]=useState('');
 const [rol]=useState(()=>JSON.parse(localStorage.getItem('pcf_user')||'{}').rol);
 const settled=useDebounced(search);
 const stock=usePagedResource('/productos',{buscar:settled}),movements=usePagedResource('/movimientos');
 const products=stock.items,mov=movements.items,loading=stock.loading;
 function load(){stock.reload();movements.reload();}
 async function adjust(e){e.preventDefault();setError('');try{await post('/inventario/ajuste',{producto_id:Number(selected),delta:Number(delta),motivo});setMessage('Movimiento registrado y stock actualizado');setDelta('');setMotivo('');load();}catch(ex){setError(errMsg(ex));}}
 if(loading&&!stock.key)return <ContentSkeleton/>;
 return <><div className="page-title"><h1>Inventario · Bodega</h1><p>Existencias físicas, reservas online y alertas de reposición</p></div><BoxMessage text={message}/><BoxMessage text={error||stock.error||movements.error} type="error"/><Card title="Stock de productos"><ListSearch value={search} onChange={setSearch} label="Buscar por producto o SKU"/><div className="table-wrap"><table><thead><tr><th>SKU</th><th>Producto</th><th>Físico</th><th>Reservado</th><th>Disponible</th><th>Mínimo</th><th>Estado</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td>{p.sku}</td><td>{p.nombre}</td><td>{p.stock_fisico}</td><td>{p.stock_reservado}</td><td><b>{p.disponible}</b></td><td>{p.stock_minimo}</td><td><Badge value={p.estado}/></td></tr>)}</tbody></table></div><Pagination resource={stock} label="productos"/></Card><div className="two-col">{rol!=='JEFATURA'&&<Card title="Ajuste de inventario"><form onSubmit={adjust} className="form-grid"><EntityPicker value={selected} onChange={setSelected}/><label>Cambio en unidades<input type="number" placeholder="Ej.: +5 o -2" value={delta} onChange={e=>setDelta(e.target.value)} required/></label><label className="wide">Motivo del movimiento<input value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Ej.: conteo físico de bodega" required minLength={5}/></label><button className="btn">Registrar ajuste</button></form></Card>}<Card title="Movimientos recientes"><div className="movements">{mov.map(x=><div key={x.id}><Badge value={x.tipo}/><div><b>{x.producto}</b><small>{new Date(x.creado_en).toLocaleString('es-CL')}</small></div><strong>{x.cantidad}</strong></div>)}</div><Pagination resource={movements} label="movimientos"/></Card></div></>;
}
function Restock({rol}){
 const [supplier,setSupplier]=useState(''),[product,setProduct]=useState(''),[qty,setQty]=useState(10),[obs,setObs]=useState('');
 const [message,setMessage]=useState(''),[error,setError]=useState('');
 const resource=usePagedResource('/reposiciones');
 const {items:reps,loading,reload:load}=resource;
 async function create(e){e.preventDefault();setError('');try{const r=await post('/reposiciones',{proveedor_id:Number(supplier),items:[{producto_id:Number(product),cantidad:Number(qty)}],observaciones:obs});setMessage('Solicitud de reposición #'+r.id+' creada');setProduct('');setObs('');load();}catch(ex){setError(errMsg(ex));}}
 async function decide(id,estado){setError('');try{await patch(`/reposiciones/${id}/decision`,{estado,observaciones:estado==='RECHAZADA'?'Revisar cantidades y demanda':'Aprobado'});setMessage(`Solicitud #${id}: ${estado.toLowerCase()}`);load();}catch(ex){setError(errMsg(ex));}}
 async function receive(id){setError('');try{await post(`/reposiciones/${id}/recepcion`,{});setMessage(`Solicitud #${id} recibida y sumada al inventario`);load();}catch(ex){setError(errMsg(ex));}}
 if(loading&&!resource.key)return <ContentSkeleton/>;
 return <><div className="page-title"><h1>Solicitudes de reposición</h1><p>Bodega solicita · Jefatura aprueba · Bodega recepciona</p></div><BoxMessage text={message}/><BoxMessage text={error||resource.error} type="error"/><div className="stats stats-3"><Stat label="Solicitudes" value={resource.total} icon={Truck} sub="Total de solicitudes"/><Stat label="Pendientes" value={resource.summary.pendientes||0} icon={AlertTriangle} sub="Esperan aprobación"/><Stat label="Aprobadas" value={resource.summary.aprobadas||0} icon={CheckCircle2} sub="Listas para recepción"/></div><Card title="Seguimiento"><div className="table-wrap"><table><thead><tr><th>N°</th><th>Proveedor</th><th>Detalle</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>{reps.map(r=><tr key={r.id}><td>#{r.id}</td><td>{r.proveedor}</td><td>{r.detalle}</td><td><Badge value={r.estado}/></td><td>{new Date(r.creada_en).toLocaleDateString('es-CL')}</td><td><div className="row-actions">{['ADMINISTRADOR','JEFATURA'].includes(rol)&&r.estado==='PENDIENTE'&&<><button onClick={()=>decide(r.id,'APROBADA')}>Aprobar</button><button className="danger" onClick={()=>decide(r.id,'RECHAZADA')}>Rechazar</button></>}{['ADMINISTRADOR','BODEGA'].includes(rol)&&r.estado==='APROBADA'&&<button onClick={()=>receive(r.id)}>Recepcionar</button>}</div></td></tr>)}</tbody></table>{!reps.length&&<p className="empty">Sin solicitudes registradas.</p>}</div><Pagination resource={resource} label="reposiciones"/></Card>{rol!=='JEFATURA'&&<Card title="Nueva solicitud de reposición"><form onSubmit={create} className="form-grid"><EntityPicker type="proveedores" value={supplier} onChange={value=>{setSupplier(value);setProduct('');}} label="Proveedor"/>{supplier?<EntityPicker key={supplier} value={product} onChange={setProduct} supplier={supplier}/>:<p className="picker-hint">Selecciona un proveedor para buscar sus productos.</p>}<label>Cantidad<input type="number" min="1" max="100" value={qty} onChange={e=>setQty(e.target.value)} required/></label><label>Observaciones<input value={obs} onChange={e=>setObs(e.target.value)} placeholder="Motivo de reposición"/></label><button className="btn" disabled={!supplier||!product}>Crear solicitud</button></form><p className="footnote">Nota: cada producto debe corresponder al proveedor seleccionado. Los lotes parciales quedan para una siguiente iteración.</p></Card>}</>;
}
function UsersPage({currentUserId}){
 const [search,setSearch]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [form,setForm]=useState({nombre:'',email:'',clave:'',rol:'VENDEDOR'});
 const [deleting,setDeleting]=useState(null),[changingRole,setChangingRole]=useState(null);
 const settled=useDebounced(search),resource=usePagedResource('/usuarios',{buscar:settled});
 const {items:users,setItems:setUsers,loading,reload:load}=resource;
 async function save(e){e.preventDefault();setError('');try{await post('/usuarios',form);setMessage('Usuario creado correctamente');setForm({nombre:'',email:'',clave:'',rol:'VENDEDOR'});load();}catch(ex){setError(errMsg(ex));}}
 async function remove(u){
  if(!window.confirm(`¿Eliminar a ${u.nombre} (${u.email})? Se desactivará su acceso y se conservará su historial de operaciones.`))return;
  setDeleting(u.id);setError('');setMessage('');
  try{const result=await api(`/usuarios/${u.id}`,{method:'DELETE'});setUsers(prev=>prev.map(item=>String(item.id)===String(u.id)?{...item,activo:false}:item));setMessage(result.message);}catch(ex){setError(errMsg(ex));}finally{setDeleting(null);}
 }
 async function changeRole(u,rol){
  setChangingRole(u.id);setError('');setMessage('');
  try{const result=await patch(`/usuarios/${u.id}/rol`,{rol});setUsers(prev=>prev.map(item=>String(item.id)===String(u.id)?{...item,rol:result.usuario.rol}:item));setMessage(`Rol de ${u.nombre} actualizado a ${roleName[rol]}`);}catch(ex){setError(errMsg(ex));}finally{setChangingRole(null);}
 }
 if(loading&&!resource.key)return <ContentSkeleton/>;
 return <><div className="page-title"><h1>Gestión de usuarios</h1><p>Accesos y privilegios según perfil</p></div><BoxMessage text={message}/><BoxMessage type="error" text={error||resource.error}/><div className="users-layout"><Card title="Usuarios registrados"><ListSearch value={search} onChange={setSearch} label="Buscar por nombre o correo"/><div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.nombre}</td><td>{u.email}</td><td><div className="user-role"><RoleBadge rol={u.rol}/><select aria-label={`Cambiar rol de ${u.nombre}`} value={u.rol} disabled={!u.activo||deleting!==null||changingRole!==null||String(u.id)===String(currentUserId)} onChange={e=>changeRole(u,e.target.value)}>{Object.keys(roleName).map(rol=><option key={rol} value={rol}>{roleName[rol]}</option>)}</select></div></td><td><Badge value={u.activo?'Activo':'Inactivo'}/></td><td>{u.activo?<div className="row-actions"><button className="danger" disabled={deleting!==null||changingRole!==null||String(u.id)===String(currentUserId)} title={String(u.id)===String(currentUserId)?'No puedes eliminar tu propia cuenta':undefined} onClick={()=>remove(u)}>{String(deleting)===String(u.id)?'Eliminando...':'Eliminar'}</button></div>:'Acceso desactivado'}</td></tr>)}</tbody></table></div><Pagination resource={resource} label="usuarios"/></Card><Card title="Crear usuario"><form className="form-grid" onSubmit={save}>{['nombre','email','clave'].map(k=><label key={k}>{({nombre:'Nombre completo',email:'Correo',clave:'Contraseña'})[k]}<input type={k==='clave'?'password':k==='email'?'email':'text'} minLength={k==='clave'?8:undefined} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} required/></label>)}<label>Rol<select value={form.rol} onChange={e=>setForm({...form,rol:e.target.value})}>{Object.keys(roleName).map(x=><option key={x} value={x}>{roleName[x]}</option>)}</select></label><button className="btn">Crear usuario</button></form></Card></div></>;
}
function LoginDialog({onLogin,onClose}){
 const ref=useRef(null);
 useEffect(()=>{const dialog=ref.current;dialog.showModal();return()=>dialog.close();},[]);
 return <dialog ref={ref} className="login-dialog" aria-label="Iniciar sesión" onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className="login-dialog-content"><button className="login-close" onClick={onClose} aria-label="Cerrar inicio de sesión"><X size={22}/></button><Login onLogin={onLogin}/><button className="continue-shopping" onClick={onClose}>Continuar sin iniciar sesión</button></div></dialog>;
}
function App(){
<<<<<<< HEAD
 const [user,setUser]=useState(null),[page,setPage]=useState('catalogo');
 const [showLogin,setShowLogin]=useState(false),[onlineCart,setOnlineCart]=useState([]);
 const [checking,setChecking]=useState(()=>Boolean(localStorage.getItem('pcf_token')));
 const [sessionError,setSessionError]=useState('');
 function clearSession(){localStorage.removeItem('pcf_user');localStorage.removeItem('pcf_token');setUser(null);setPage('catalogo');}
 useEffect(()=>{
  if(!localStorage.getItem('pcf_token')){localStorage.removeItem('pcf_user');return;}
  let cancelled=false;
  api('/auth/me').then(u=>{if(!cancelled){localStorage.setItem('pcf_user',JSON.stringify(u));setUser(u);}}).catch(e=>{if(!cancelled){if(e.status===401)clearSession();else setSessionError('No se pudo verificar tu cuenta. Puedes seguir explorando o intentar iniciar sesión.');}}).finally(()=>{if(!cancelled)setChecking(false);});
  return()=>{cancelled=true;};
 },[]);
 function login(u){localStorage.setItem('pcf_user',JSON.stringify(u));setUser(u);setShowLogin(false);setSessionError('');}
 function logout(){clearSession();setSessionError('');}
 function sessionExpired(){clearSession();setShowLogin(true);}
 const allowed=nav.filter(n=>n.key==='catalogo'||user&&n.roles.includes(user.rol));
 const commerceProps={user,onLogin:()=>setShowLogin(true),onSessionExpired:sessionExpired,onlineCart,setOnlineCart};
 return <><div className="shell"><aside className="sidebar"><div className="brand"><span className="mark">P₂</span> Factory</div><div className="nav-caption">MENÚ PRINCIPAL</div><nav>{allowed.map(n=><button title={n.label} aria-label={n.label} className={'nav-link '+(page===n.key?'active':'')} onClick={()=>setPage(n.key)} key={n.key}><n.icon size={19}/>{n.label}</button>)}</nav><div className="side-footer"><div className="side-location"><Store size={17}/> Sucursal Antofagasta</div>{user?<button onClick={logout}><LogOut size={17}/> Cerrar sesión</button>:<button onClick={()=>setShowLogin(true)}><ShieldCheck size={17}/> Iniciar sesión</button>}</div></aside><div className="content"><header className="topbar"><div className="header-search"><Search size={18}/> PC Factory · Tienda online</div><div className="right-head"><span className="branch"><Store size={17}/> Antofagasta</span>{user?<><div className="avatar">{user.nombre.slice(0,1)}</div><div><b>{user.nombre}</b><small>{roleName[user.rol]}</small></div><button className="account-button" onClick={logout}>Cerrar sesión</button></>:<button className="btn" disabled={checking} onClick={()=>setShowLogin(true)}><ShieldCheck size={17}/>{checking?'Verificando cuenta...':'Iniciar sesión'}</button>}</div></header><main>
 <BoxMessage text={sessionError} type="error"/>
 {page==='catalogo'&&<p className="guest-note">Explora y agrega productos a tu carrito libremente. Inicia sesión al confirmar tu pedido para retiro.</p>}
 <div hidden={page!=='catalogo'}><Commerce online {...commerceProps}/></div>
 {user&&<React.Fragment key={user.id}>
 {page==='inicio'&&<Dashboard/>}{page==='venta'&&<Commerce online={false} {...commerceProps}/>}{page==='pedidos'&&<Orders rol={user.rol}/>}{page==='inventario'&&<Inventory/>}{page==='reposiciones'&&<Restock rol={user.rol}/>}{page==='usuarios'&&<UsersPage/>}
 </React.Fragment>}
 </main></div></div>{showLogin&&<LoginDialog onLogin={login} onClose={()=>setShowLogin(false)}/>}</>;
=======
 const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('pcf_user')||'null');}catch{return null;}});
 const [page,setPage]=useState(user?initialPage(user.rol):'catalogo');
 const [showLogin,setShowLogin]=useState(false);
 function login(u){localStorage.setItem('pcf_user',JSON.stringify(u));setUser(u);setPage(initialPage(u.rol));setShowLogin(false);}
 function logout(){localStorage.removeItem('pcf_user');localStorage.removeItem('pcf_token');setUser(null);setPage('catalogo');}
 useEffect(()=>{
  if(!user)return;
  let cancelled=false;
  async function refreshIdentity(){
   try{const current=await api('/auth/me');if(cancelled)return;localStorage.setItem('pcf_user',JSON.stringify(current));setUser(current);if(current.rol!==user.rol)setPage(initialPage(current.rol));}
   catch(ex){if(!cancelled&&ex.status===401)logout();}
  }
  refreshIdentity();
  window.addEventListener('focus',refreshIdentity);
  const timer=setInterval(()=>{if(document.visibilityState==='visible')refreshIdentity();},60000);
  return ()=>{cancelled=true;window.removeEventListener('focus',refreshIdentity);clearInterval(timer);};
 },[user?.id,user?.rol]);
 if(!user||user.rol==='CLIENTE')return <Storefront user={user} page={page} setPage={setPage} onLogout={logout} onRequestLogin={()=>setShowLogin(true)} orders={user?<Orders rol={user.rol}/>:null} authDialog={showLogin?<Login onLogin={login} onClose={()=>setShowLogin(false)}/>:null}/>;
 const allowed=nav.filter(n=>n.roles.includes(user.rol));
 const workspace=roleDetails[user.rol]||roleDetails.ADMINISTRADOR;
 const WorkspaceIcon=workspace.icon;
 return <div className="shell" data-role={user.rol}><aside className="sidebar"><div className="brand"><span className="mark">P₂</span> Factory</div><div className="nav-caption">MENÚ PRINCIPAL</div><nav>{allowed.map(n=><button className={'nav-link '+(page===n.key?'active':'')} onClick={()=>setPage(n.key)} key={n.key}><n.icon size={19}/>{n.label}</button>)}</nav><div className="side-footer"><div className="side-location"><Store size={17}/> Sucursal Antofagasta</div><button onClick={logout}><LogOut size={17}/> Cerrar sesión</button></div></aside><div className="content"><header className="topbar"><div className="workspace-breadcrumb"><span>Mi espacio</span><ChevronRight size={15}/><b>{roleName[user.rol]}</b></div><div className="right-head"><span className="branch"><Store size={17}/> Antofagasta</span><Bell size={19}/><div className="avatar">{user.nombre.slice(0,1)}</div><div><b>{user.nombre}</b><RoleBadge rol={user.rol}/></div></div></header><main key={page}><section className="workspace-welcome"><div><span className="workspace-eyebrow">ESPACIO DE {roleName[user.rol].toUpperCase()}</span><h2>{workspace.title}</h2><p>{workspace.description}</p><span className="workspace-greeting">Hola, {user.nombre.split(' ')[0]}. Bienvenido a tu espacio de trabajo.</span></div><div className="workspace-emblem"><WorkspaceIcon size={52}/></div></section>
 {page==='inicio'&&<Dashboard/>}{page==='catalogo'&&<Commerce online/>}{page==='venta'&&<Commerce online={false}/>}{page==='pedidos'&&<Orders rol={user.rol}/>}{page==='inventario'&&<Inventory/>}{page==='reposiciones'&&<Restock rol={user.rol}/>}{page==='usuarios'&&<UsersPage currentUserId={user.id}/>}
 </main></div></div>;
>>>>>>> e29a546 (Actualizar tienda, perfiles, pedidos y despliegue)
}

createRoot(document.getElementById('root')).render(<App/>);
