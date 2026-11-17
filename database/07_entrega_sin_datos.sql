-- Solo se selecciona el tipo de entrega. Conserva los datos históricos existentes.
BEGIN;
ALTER TABLE venta DROP CONSTRAINT IF EXISTS venta_entrega_valida;
ALTER TABLE venta ADD CONSTRAINT venta_entrega_valida CHECK((
 (canal='PRESENCIAL' AND tipo_entrega IS NULL AND datos_entrega IS NULL) OR
 (canal='ONLINE' AND tipo_entrega='RETIRO_SUCURSAL' AND datos_entrega IS NULL) OR
 (canal='ONLINE' AND tipo_entrega='DOMICILIO' AND (datos_entrega IS NULL OR (
  jsonb_typeof(datos_entrega)='object' AND datos_entrega ?& ARRAY['destinatario','telefono','direccion','comuna','region']
 )))
) IS TRUE);
COMMIT;
