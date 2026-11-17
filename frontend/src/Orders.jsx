import React, {useState} from 'react';
import {Store, Truck, MapPin, Phone, User, AlertTriangle, CheckCircle2} from 'lucide-react';
import {patch, money, errMsg} from './api';
import {usePagedResource, Pagination} from './pagination';
import {ContentSkeleton} from './loading';

export default function Orders({rol}) {
  const isClient = rol === 'CLIENTE';
  const resource = usePagedResource(isClient ? '/pedidos/mios' : '/pedidos');
  const [message, setMessage] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(null);
  const canOperate = ['ADMINISTRADOR','BODEGA','VENDEDOR'].includes(rol);
  const canPrepare = ['ADMINISTRADOR','BODEGA'].includes(rol);
  async function change(order, estado) {
    setBusy(order.id); setError(''); setMessage('');
    try {
      await patch(`/pedidos/${order.id}/estado`, {estado});
      setMessage(`Pedido #${order.id} actualizado: ${estado.replaceAll('_', ' ').toLowerCase()}`);
      resource.reload();
    } catch (e) { setError(errMsg(e)); } finally { setBusy(null); }
  }
  if (resource.loading && !resource.key) return <ContentSkeleton label="Cargando pedidos"/>;
  return <><div className="page-title"><h1>{isClient ? 'Mis pedidos' : 'Pedidos online'}</h1><p>Seguimiento de retiros en sucursal y retiros a domicilio</p></div>
    {message && <div className="message ok" role="status"><CheckCircle2 size={18}/>{message}</div>}
    {(error || resource.error) && <div className="message error" role="alert"><AlertTriangle size={18}/>{error || resource.error}</div>}
    <section className="card orders-card"><div className="card-heading"><h3>Historial de pedidos</h3></div>
      <div className="table-wrap"><table><thead><tr><th>Pedido</th><th>{isClient ? 'Canal' : 'Cliente'}</th><th>Fecha</th><th>Total productos</th><th>Entrega</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>{resource.items.map(order => {
          const home = order.tipo_entrega === 'DOMICILIO';
          const address = order.datos_entrega || {};
          const stateLabel = order.estado === 'LISTO' ? (home ? 'Listo para despacho' : 'Listo para retiro') : order.estado.replaceAll('_', ' ');
          const color = order.estado === 'CANCELADA' ? 'red' : ['PENDIENTE','PREPARANDO'].includes(order.estado) ? 'amber' : order.estado === 'EN_DESPACHO' ? 'blue' : 'green';
          return <tr key={order.id}><td><b>#{order.id}</b></td><td>{isClient ? order.canal : order.cliente || 'Cliente de demostración'}</td><td>{new Date(order.creado_en).toLocaleDateString('es-CL')}</td><td>{money(order.total)}</td>
            <td className="order-delivery"><span className={'delivery-type ' + (home ? 'home-delivery' : '')}>{home ? <Truck size={17}/> : <Store size={17}/>}{home ? 'Retiro a domicilio' : 'Retiro en sucursal'}</span>
              {home && order.datos_entrega ? <details className="delivery-details"><summary>Ver datos de entrega</summary><div><p><User size={15}/><span>{address.destinatario}</span></p><p><Phone size={15}/><span>{address.telefono}</span></p><p><MapPin size={15}/><span>{address.direccion}<br/>{address.comuna}, {address.region}</span></p>{address.referencia && <p>Referencia: {address.referencia}</p>}<small>Costo y fecha de envío por coordinar.</small></div></details> : !home ? <small className="pickup-branch">Sucursal Antofagasta</small> : null}
            </td><td><span className={'pill ' + color}>{stateLabel}</span></td><td>{canOperate ? <div className="row-actions">
              {canPrepare && order.estado === 'PENDIENTE' && <button disabled={busy !== null || resource.loading} onClick={() => change(order, 'PREPARANDO')}>Preparar</button>}
              {canPrepare && order.estado === 'PREPARANDO' && <button disabled={busy !== null || resource.loading} onClick={() => change(order, 'LISTO')}>{home ? 'Listo para despacho' : 'Listo para retiro'}</button>}
              {canPrepare && home && order.estado === 'LISTO' && <button disabled={busy !== null || resource.loading} onClick={() => change(order, 'EN_DESPACHO')}>Despachar</button>}
              {((!home && order.estado === 'LISTO') || (home && order.estado === 'EN_DESPACHO')) && <button disabled={busy !== null || resource.loading} onClick={() => change(order, 'ENTREGADA')}>{home ? 'Confirmar entrega' : 'Entregar'}</button>}
              {['PENDIENTE','PREPARANDO','LISTO'].includes(order.estado) && <button className="danger" disabled={busy !== null || resource.loading} onClick={() => change(order, 'CANCELADA')}>Cancelar</button>}
              {['ENTREGADA','CANCELADA'].includes(order.estado) && <span>Finalizado</span>}
            </div> : <span className="muted">{isClient ? 'Seguimiento' : 'Solo consulta'}</span>}</td></tr>;
        })}</tbody></table>{!resource.items.length && <p className="empty">Todavía no hay pedidos para mostrar.</p>}</div>
      <Pagination resource={resource} label="pedidos"/>
    </section></>;
}
