-- PC FACTORY ANTOFAGASTA | ENTREGABLE 3
-- Ejecutar en el SQL Editor de un proyecto Supabase NUEVO (base predeterminada: postgres).
BEGIN;
CREATE TABLE IF NOT EXISTS rol (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS usuario (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  clave_hash TEXT NOT NULL,
  rol_id BIGINT NOT NULL REFERENCES rol(id),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS categoria (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(90) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS proveedor (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  contacto VARCHAR(100)
);
CREATE TABLE IF NOT EXISTS producto (
  id BIGSERIAL PRIMARY KEY,
  sku VARCHAR(30) NOT NULL UNIQUE,
  nombre VARCHAR(160) NOT NULL,
  categoria_id BIGINT NOT NULL REFERENCES categoria(id),
  proveedor_id BIGINT NOT NULL REFERENCES proveedor(id),
  precio INTEGER NOT NULL CHECK(precio >= 0),
  costo INTEGER NOT NULL CHECK(costo >= 0),
  activo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS inventario (
  producto_id BIGINT PRIMARY KEY REFERENCES producto(id),
  stock_fisico INTEGER NOT NULL DEFAULT 0 CHECK(stock_fisico >= 0),
  stock_reservado INTEGER NOT NULL DEFAULT 0 CHECK(stock_reservado >= 0),
  stock_minimo INTEGER NOT NULL DEFAULT 0 CHECK(stock_minimo >= 0),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT stock_reservado_valido CHECK(stock_reservado <= stock_fisico)
);
CREATE TABLE IF NOT EXISTS venta (
  id BIGSERIAL PRIMARY KEY,
  referencia VARCHAR(32) UNIQUE,
  usuario_id BIGINT REFERENCES usuario(id),
  canal VARCHAR(15) NOT NULL CHECK(canal IN ('PRESENCIAL','ONLINE')),
  estado VARCHAR(15) NOT NULL CHECK(estado IN ('CONFIRMADA','PENDIENTE','PREPARANDO','LISTO','ENTREGADA','CANCELADA')),
  metodo_pago VARCHAR(20) CHECK(metodo_pago IS NULL OR metodo_pago IN ('EFECTIVO','TARJETA','TRANSFERENCIA','OTRO')),
  total INTEGER NOT NULL DEFAULT 0 CHECK(total >= 0),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS detalle_venta (
  id BIGSERIAL PRIMARY KEY,
  venta_id BIGINT NOT NULL REFERENCES venta(id),
  producto_id BIGINT NOT NULL REFERENCES producto(id),
  cantidad INTEGER NOT NULL CHECK(cantidad > 0),
  precio_unitario INTEGER NOT NULL CHECK(precio_unitario >= 0)
);
CREATE TABLE IF NOT EXISTS movimiento_inventario (
  id BIGSERIAL PRIMARY KEY,
  producto_id BIGINT NOT NULL REFERENCES producto(id),
  usuario_id BIGINT REFERENCES usuario(id),
  venta_id BIGINT REFERENCES venta(id),
  tipo VARCHAR(30) NOT NULL CHECK(tipo IN ('SALIDA_VENTA','RESERVA','LIBERACION_RESERVA','SALIDA_RETIRO','RECEPCION','AJUSTE_POSITIVO','AJUSTE_NEGATIVO')),
  cantidad INTEGER NOT NULL CHECK(cantidad > 0),
  motivo TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS solicitud_reposicion (
  id BIGSERIAL PRIMARY KEY,
  proveedor_id BIGINT NOT NULL REFERENCES proveedor(id),
  solicitado_por BIGINT REFERENCES usuario(id),
  decidido_por BIGINT REFERENCES usuario(id),
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK(estado IN ('PENDIENTE','APROBADA','RECHAZADA','RECIBIDA')),
  observaciones TEXT,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decidida_en TIMESTAMPTZ,
  recibida_en TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS detalle_reposicion (
  id BIGSERIAL PRIMARY KEY,
  solicitud_id BIGINT NOT NULL REFERENCES solicitud_reposicion(id),
  producto_id BIGINT NOT NULL REFERENCES producto(id),
  cantidad INTEGER NOT NULL CHECK(cantidad > 0),
  UNIQUE(solicitud_id, producto_id)
);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON venta(creado_en);
CREATE INDEX IF NOT EXISTS idx_ventas_canal ON venta(canal,estado);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimiento_inventario(creado_en);
CREATE INDEX IF NOT EXISTS idx_sol_estado ON solicitud_reposicion(estado);

-- Vista de alertas, compatible con ambos canales.
CREATE OR REPLACE VIEW vw_stock WITH (security_invoker = true) AS
SELECT p.id, p.sku, p.nombre, c.nombre AS categoria, p.precio,
       i.stock_fisico, i.stock_reservado,
       i.stock_fisico-i.stock_reservado AS stock_disponible,
       i.stock_minimo,
       CASE WHEN i.stock_fisico-i.stock_reservado=0 THEN 'SIN_STOCK'
            WHEN i.stock_fisico-i.stock_reservado<=i.stock_minimo THEN 'BAJO_STOCK'
            ELSE 'DISPONIBLE' END AS estado_stock
FROM producto p JOIN inventario i ON i.producto_id=p.id
JOIN categoria c ON c.id=p.categoria_id WHERE p.activo;

CREATE OR REPLACE VIEW vw_ventas_powerbi WITH (security_invoker = true) AS
SELECT v.id AS venta_id, v.creado_en::date AS fecha, v.canal, v.estado,
       d.producto_id,p.sku,p.nombre AS producto,c.nombre AS categoria,
       d.cantidad,d.precio_unitario,(d.cantidad*d.precio_unitario) AS importe,
       (d.cantidad*p.costo) AS costo_total
FROM venta v JOIN detalle_venta d ON d.venta_id=v.id
JOIN producto p ON p.id=d.producto_id JOIN categoria c ON c.id=p.categoria_id
WHERE v.estado IN ('CONFIRMADA','ENTREGADA');

CREATE OR REPLACE VIEW vw_reposiciones_powerbi WITH (security_invoker = true) AS
SELECT s.id AS solicitud_id,s.estado,s.creada_en,s.decidida_en,s.recibida_en,
       s.proveedor_id,pr.nombre AS proveedor,d.producto_id,d.cantidad,
       EXTRACT(EPOCH FROM (s.recibida_en-s.creada_en))/86400.0 AS dias_reposicion
FROM solicitud_reposicion s JOIN detalle_reposicion d ON d.solicitud_id=s.id
JOIN proveedor pr ON pr.id=s.proveedor_id;

-- SUPABASE: impedir que la API pública consulte/escriba tablas de este prototipo.
-- El único punto de acceso del frontend será Node.js (PostgreSQL privado por DATABASE_URL).
-- NO crear políticas anon ni authenticated mientras se utilice JWT propio en Node.js.
DO $$
DECLARE tabla TEXT;
BEGIN
  FOREACH tabla IN ARRAY ARRAY[
    'rol','usuario','categoria','proveedor','producto','inventario','venta',
    'detalle_venta','movimiento_inventario','solicitud_reposicion','detalle_reposicion'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tabla);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', tabla);
  END LOOP;
END $$;
REVOKE ALL ON TABLE public.vw_stock,public.vw_ventas_powerbi,public.vw_reposiciones_powerbi FROM anon, authenticated;
-- No exponer secuencias de identificadores.
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

COMMIT;
