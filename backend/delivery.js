function invalid(message) { const error = new Error(message); error.status = 400; throw error; }

export function deliveryFor(body, channel) {
  if (channel !== 'ONLINE') return {tipo: null, datos: null};
  const tipo = body.tipo_entrega === undefined ? 'RETIRO_SUCURSAL' : body.tipo_entrega;
  if (!['RETIRO_SUCURSAL', 'DOMICILIO'].includes(tipo)) invalid('Selecciona retiro en sucursal o retiro a domicilio');
  return {tipo, datos: null};
}

export function nextOrderStates(order) {
  return {PENDIENTE: ['PREPARANDO', 'CANCELADA'], PREPARANDO: ['LISTO', 'CANCELADA'],
    LISTO: [order.tipo_entrega === 'DOMICILIO' ? 'EN_DESPACHO' : 'ENTREGADA', 'CANCELADA'],
    EN_DESPACHO: order.tipo_entrega === 'DOMICILIO' ? ['ENTREGADA'] : [],
  }[order.estado] || [];
}
