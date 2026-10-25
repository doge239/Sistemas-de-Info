import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';
const db=new pg.Pool({connectionString:process.env.DATABASE_URL,max:2,connectionTimeoutMillis:10000});
const demo=[
 ['Administrador Demo','admin@demo.test','ADMINISTRADOR'],
 ['Vendedor Demo','vendedor@demo.test','VENDEDOR'],
 ['Bodega Demo','bodega@demo.test','BODEGA'],
 ['Jefatura Demo','jefatura@demo.test','JEFATURA'],
 ['Cliente Demo','cliente@demo.test','CLIENTE'],
 ['Cliente Demo 2','cliente02@demo.test','CLIENTE'],
 ['Cliente Demo 3','cliente03@demo.test','CLIENTE'],
 ['Cliente Demo 4','cliente04@demo.test','CLIENTE'],
 ['Cliente Demo 5','cliente05@demo.test','CLIENTE'],
 ['Cliente Demo 6','cliente06@demo.test','CLIENTE']
];
try {
 const hash=await bcrypt.hash('Demo2026!',12);
 for(const [nombre,email,rol] of demo){
  await db.query(`INSERT INTO usuario(nombre,email,clave_hash,rol_id) VALUES($1,$2,$3,(SELECT id FROM rol WHERE nombre=$4)) ON CONFLICT(email) DO NOTHING`,[nombre,email,hash,rol]);
 }
 console.log('Cuentas de DEMOSTRACION creadas. Contraseña temporal: Demo2026!');
} catch(e) {console.error(e);process.exitCode=1;} finally {await db.end();}
