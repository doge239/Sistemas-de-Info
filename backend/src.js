import 'dotenv/config';
import pg from 'pg';
import {createApp} from './app.js';

if (!process.env.DATABASE_URL || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) {
  console.error('Configura DATABASE_URL y un JWT_SECRET seguro en backend/.env');
  process.exit(1);
}
// Node.js conserva una cantidad moderada de conexiones con Supabase.
// SSL se establece con sslmode=require en la DATABASE_URL del .env.
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });
const app=createApp(db,process.env.JWT_SECRET);
const port=Number(process.env.PORT)||4000;
app.listen(port,()=>console.log(`API PC Factory: http://localhost:${port}`));
