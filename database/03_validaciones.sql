-- Consultas de prueba para PostgreSQL / pgAdmin.
-- 1. Requisito: tabla crítica con 100 o más filas:
SELECT 'venta' AS tabla,COUNT(*) AS filas FROM venta
UNION ALL SELECT 'detalle_venta',COUNT(*) FROM detalle_venta
UNION ALL SELECT 'movimiento_inventario',COUNT(*) FROM movimiento_inventario;
-- 2. N° de tablas públicas:
SELECT COUNT(*) AS total_tablas FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';
-- 3. Stock disponible compartido por ambos canales:
SELECT * FROM vw_stock ORDER BY stock_disponible,sku;
-- 4. Disponibilidad y quiebre de stock (indicadores académicos):
SELECT ROUND(100.0*COUNT(*) FILTER(WHERE stock_disponible>0)/NULLIF(COUNT(*),0),2) AS disponibilidad_pct,
ROUND(100.0*COUNT(*) FILTER(WHERE stock_disponible=0)/NULLIF(COUNT(*),0),2) AS quiebre_pct,
ROUND(100.0*COUNT(*) FILTER(WHERE stock_disponible>stock_minimo)/NULLIF(COUNT(*),0),2) AS cumplimiento_stock_minimo_pct
FROM vw_stock;
-- 5. Resumen de ingresos reconocidos por canal:
SELECT canal,COUNT(DISTINCT venta_id) AS ventas,SUM(importe) AS ingreso
FROM vw_ventas_powerbi GROUP BY canal;
-- 6. Reposición y tiempos:
SELECT * FROM vw_reposiciones_powerbi ORDER BY solicitud_id DESC;
-- 7. Comprobar que no hay stock negativo o reservas superiores al físico:
SELECT * FROM inventario WHERE stock_fisico<0 OR stock_reservado<0 OR stock_reservado>stock_fisico;
