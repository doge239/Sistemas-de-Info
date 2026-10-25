-- Revisión opcional, después de crear esquema y datos; no realiza cambios.
SELECT tablename, rowsecurity AS rls_activado
FROM pg_tables WHERE schemaname='public' AND tablename IN (
 'rol','usuario','categoria','proveedor','producto','inventario','venta',
 'detalle_venta','movimiento_inventario','solicitud_reposicion','detalle_reposicion'
) ORDER BY tablename;
SELECT grantee, table_name, privilege_type FROM information_schema.table_privileges
WHERE table_schema='public' AND grantee IN ('anon','authenticated') AND table_name IN (
 'usuario','venta','producto','inventario','vw_stock','vw_ventas_powerbi','vw_reposiciones_powerbi'
) ORDER BY grantee,table_name,privilege_type;
-- Esperado: 11 filas con rls_activado=true y 0 privilegios en la segunda consulta.
