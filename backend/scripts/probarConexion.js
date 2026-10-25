// Verificación rápida sin mostrar credenciales de Supabase.
import 'dotenv/config';
import pg from 'pg';
if (!process.env.DATABASE_URL) {
 console.error('Falta DATABASE_URL en backend/.env');
 process.exit(1);
}
const db = new pg.Pool({connectionString:process.env.DATABASE_URL,max:2,connectionTimeoutMillis:10000});
try {
 const {rows:[dbInfo]} = await db.query('SELECT current_database() AS base, current_schema() AS esquema');
 const {rows:[counts]} = await db.query('SELECT (SELECT count(*)::int FROM public.producto) AS productos, (SELECT count(*)::int FROM public.venta) AS ventas, (SELECT count(*)::int FROM public.rol) AS roles');
 console.log('Conexión Supabase/PostgreSQL exitosa:',dbInfo);
 console.log('Registros iniciales:', counts);
} catch(err) {
 console.error('No se pudo conectar o faltan tablas:', err.message);
 process.exitCode=1;
} finally {await db.end();}
