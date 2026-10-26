-- Datos exclusivamente FICTICIOS de demostración académica.
-- Importar UNA VEZ después de 01_schema.sql.
BEGIN;
INSERT INTO rol(nombre) VALUES ('ADMINISTRADOR'),('VENDEDOR'),('BODEGA'),('JEFATURA'),('CLIENTE') ON CONFLICT DO NOTHING;
INSERT INTO categoria(nombre) VALUES
 ('Notebooks'),('Computadores'),('Componentes'),('Gaming'),('Periféricos'),
 ('Monitores'),('Redes'),('Almacenamiento'),('Impresoras'),('Software') ON CONFLICT DO NOTHING;
INSERT INTO proveedor(nombre,contacto) VALUES
 ('Lenovo Chile','demo@lenovo.test'),('ASUS Chile','demo@asus.test'),('Kingston','demo@kingston.test'),
 ('Samsung','demo@samsung.test'),('Logitech','demo@logitech.test'),('HP Chile','demo@hp.test'),
 ('Acer Chile','demo@acer.test'),('Crucial','demo@crucial.test'),('HyperX','demo@hyperx.test'),
 ('Proveedor Demo 10','demo@proveedor.test') ON CONFLICT DO NOTHING;
INSERT INTO producto(sku,nombre,categoria_id,proveedor_id,precio,costo) VALUES
 ('PFA001','Notebook Lenovo IdeaPad 3 15,6 pulgadas',1,1,249990,195000),
 ('PFA017','Tarjeta gráfica ASUS RTX 4060',3,2,399990,310000),
 ('PFA032','SSD Crucial P3 1TB',8,8,69990,43000),
 ('PFA045','Monitor Samsung 24 pulgadas',6,4,129990,96000),
 ('PFA078','Teclado Logitech G Pro',5,5,119990,79000),
 ('PFA079','Mouse Logitech G502 Hero',5,5,59990,40000),
 ('PFA120','PC Gamer Ryzen 5',2,2,899990,700000),
 ('PFA133','Audífonos HyperX Cloud II',4,9,89990,58000),
 ('PFA140','Notebook ASUS Vivobook 15',1,2,499990,380000),
 ('PFA141','Notebook Acer Aspire 5',1,7,749990,600000),
 ('PFA142','Notebook HP 15',1,6,419990,325000),
 ('PFA143','Memoria Kingston Fury 16GB',3,3,45990,30000),
 ('PFA144','Router WiFi Doble Banda',7,10,55990,35000),
 ('PFA145','Impresora HP DeskJet',9,6,79990,55000),
 ('PFA146','Licencia Antivirus 1 año',10,10,19990,8000),
 ('PFA147','Gabinete Gaming ATX',2,2,84990,57000),
 ('PFA148','SSD Kingston NV2 500GB',8,3,39990,26000),
 ('PFA149','Mousepad Gamer XL',4,9,16990,9000),
 ('PFA150','Webcam Logitech C920',5,5,74990,53000),
 ('PFA151','Monitor Samsung 27 pulgadas',6,4,229990,168000)
ON CONFLICT(sku) DO NOTHING;
-- Existencias actuales: se asume que las ventas históricas de ejemplo ya fueron descontadas.
INSERT INTO inventario(producto_id,stock_fisico,stock_reservado,stock_minimo)
SELECT p.id,
 CASE p.sku WHEN 'PFA001' THEN 12 WHEN 'PFA017' THEN 5 WHEN 'PFA032' THEN 0
 WHEN 'PFA045' THEN 3 WHEN 'PFA120' THEN 4 WHEN 'PFA133' THEN 0 ELSE 25 END,
 0,CASE WHEN p.precio>300000 THEN 8 ELSE 10 END
FROM producto p ON CONFLICT (producto_id) DO NOTHING;

-- Diez solicitudes y diez detalles históricos simulados (las existencias actuales ya reflejan las recepciones previas).
INSERT INTO solicitud_reposicion(proveedor_id,estado,observaciones,creada_en,decidida_en,recibida_en)
SELECT g,CASE WHEN g<=4 THEN 'PENDIENTE' WHEN g<=7 THEN 'APROBADA' WHEN g<=9 THEN 'RECHAZADA' ELSE 'RECIBIDA' END,
 'Solicitud ficticia histórica # '||g,NOW()-(g||' days')::interval,
 CASE WHEN g>4 THEN NOW()-((g-1)||' days')::interval ELSE NULL END,
 CASE WHEN g=10 THEN NOW()-INTERVAL '1 hour' ELSE NULL END
FROM generate_series(1,10) g;
INSERT INTO detalle_reposicion(solicitud_id,producto_id,cantidad)
SELECT s.id,(SELECT p.id FROM producto p WHERE p.proveedor_id=s.proveedor_id ORDER BY p.id LIMIT 1),10
FROM solicitud_reposicion s
WHERE s.id BETWEEN 1 AND 10
ON CONFLICT (solicitud_id, producto_id) DO NOTHING;

-- 120 ventas + detalles + movimientos ficticios. La tabla venta cumple el mínimo de 100 registros.
INSERT INTO venta(referencia,usuario_id,canal,estado,total,creado_en)
SELECT 'DEMO-'||LPAD(g::text,4,'0'),NULL,
 CASE WHEN g%3=0 THEN 'ONLINE' ELSE 'PRESENCIAL' END,
 CASE WHEN g%3=0 THEN 'ENTREGADA' ELSE 'CONFIRMADA' END,
 p.precio, NOW()-(g||' hours')::interval
FROM generate_series(1,120) g
JOIN producto p ON p.id=((g-1)%20)+1
ON CONFLICT(referencia) DO NOTHING;
INSERT INTO detalle_venta(venta_id,producto_id,cantidad,precio_unitario)
SELECT v.id,p.id,1,p.precio FROM venta v
JOIN producto p ON p.id=((RIGHT(v.referencia,4)::int-1)%20)+1
WHERE v.referencia LIKE 'DEMO-%' AND NOT EXISTS(SELECT 1 FROM detalle_venta d WHERE d.venta_id=v.id);
INSERT INTO movimiento_inventario(producto_id,venta_id,tipo,cantidad,motivo,creado_en)
SELECT d.producto_id,v.id,'SALIDA_VENTA',1,'Venta histórica simulada',v.creado_en
FROM venta v JOIN detalle_venta d ON d.venta_id=v.id
WHERE v.referencia LIKE 'DEMO-%' AND NOT EXISTS (SELECT 1 FROM movimiento_inventario m WHERE m.venta_id=v.id);
COMMIT;
