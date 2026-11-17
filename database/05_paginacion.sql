-- Índices no destructivos para filtros, orden y pedidos por cliente.
-- Se pueden ejecutar sobre una base Supabase que ya tenga datos.
BEGIN;
CREATE INDEX IF NOT EXISTS idx_producto_activo_precio_id ON producto(precio,id) WHERE activo;
CREATE INDEX IF NOT EXISTS idx_producto_activo_categoria_id ON producto(categoria_id,id) WHERE activo;
CREATE INDEX IF NOT EXISTS idx_producto_activo_proveedor_id ON producto(proveedor_id,id) WHERE activo;
CREATE INDEX IF NOT EXISTS idx_venta_online_usuario_id ON venta(usuario_id,id DESC) WHERE canal='ONLINE';
CREATE INDEX IF NOT EXISTS idx_venta_online_id ON venta(id DESC) WHERE canal='ONLINE';
COMMIT;
