-- Conserva todos los pedidos existentes como retiro en sucursal.
BEGIN;
ALTER TABLE venta ADD COLUMN IF NOT EXISTS tipo_entrega VARCHAR(20);
ALTER TABLE venta ADD COLUMN IF NOT EXISTS datos_entrega JSONB;
UPDATE venta SET tipo_entrega='RETIRO_SUCURSAL' WHERE canal='ONLINE' AND tipo_entrega IS NULL;
ALTER TABLE venta DROP CONSTRAINT IF EXISTS venta_estado_check;
ALTER TABLE venta ADD CONSTRAINT venta_estado_check CHECK(estado IN ('CONFIRMADA','PENDIENTE','PREPARANDO','LISTO','EN_DESPACHO','ENTREGADA','CANCELADA'));
ALTER TABLE venta DROP CONSTRAINT IF EXISTS venta_entrega_valida;
ALTER TABLE venta ADD CONSTRAINT venta_entrega_valida CHECK((
 (canal='PRESENCIAL' AND tipo_entrega IS NULL AND datos_entrega IS NULL) OR
 (canal='ONLINE' AND tipo_entrega='RETIRO_SUCURSAL' AND datos_entrega IS NULL) OR
 (canal='ONLINE' AND tipo_entrega='DOMICILIO' AND (datos_entrega IS NULL OR (jsonb_typeof(datos_entrega)='object' AND
 datos_entrega ?& ARRAY['destinatario','telefono','direccion','comuna','region'])))
) IS TRUE);
ALTER TABLE movimiento_inventario DROP CONSTRAINT IF EXISTS movimiento_inventario_tipo_check;
ALTER TABLE movimiento_inventario ADD CONSTRAINT movimiento_inventario_tipo_check CHECK(tipo IN ('SALIDA_VENTA','RESERVA','LIBERACION_RESERVA','SALIDA_RETIRO','SALIDA_ENVIO','RECEPCION','AJUSTE_POSITIVO','AJUSTE_NEGATIVO'));
COMMIT;
