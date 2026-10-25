# PC Factory · Entregable 3 · versión Supabase

**Prototipo académico**, no oficial de PC Factory, con datos ficticios. No sustituye sistemas productivos.

## Arquitectura

- **Frontend:** React + Vite, vistas para Cliente, Vendedor, Bodega, Jefatura y Administrador.
- **Backend:** Node.js + Express, JWT propio, control de roles, validaciones y transacciones atómicas.
- **Base de datos:** PostgreSQL administrado en **Supabase**; NO se conecta React directamente a PostgreSQL.
- **Análisis:** Power BI, vistas `vw_stock`, `vw_ventas_powerbi`, `vw_reposiciones_powerbi`.

## Comenzar en Windows

Lee **`INICIO_RAPIDO_WINDOWS.txt`**. Ahí se explican los pasos del dashboard Supabase, SQL Editor, cómo obtener la `DATABASE_URL` del **Session pooler** y cómo iniciar backend/frontend.

La base predeterminada de Supabase se llama `postgres`, no `pcfactory_si`. Se crean nuestras 11 tablas en el esquema `public`.

**Orden de SQL en un proyecto nuevo:** `database/01_schema.sql` → `database/02_demo.sql` (solo una vez) → `database/03_validaciones.sql`. El archivo `04_comprobar_seguridad.sql` revisa RLS y permisos.

## Seguridad del prototipo

- El archivo `01_schema.sql` activa RLS en 11 tablas y quita acceso `anon`/`authenticated` a tablas y vistas del proyecto. Se utiliza la conexión PostgreSQL privada **solo desde Node**. Supabase Auth **no está integrado**: la gestión de usuarios y roles del MVP se realiza en Express.
- No pongas `DATABASE_URL` ni `JWT_SECRET` en React ni en Git. **No uses la API publishable/anon key como conexión de Node**.
- Las credenciales y el password DEMO (`Demo2026!`) son solo para pruebas LOCALES. Cambiar antes de publicar la app.
- Como la conexión privada de Postgres tiene elevados privilegios, jamás debe exponerse al navegador. Para un despliegue público se requiere revisar TLS, claves, cuentas, respaldos, validaciones y límites de peticiones.

## Funciones incluidas

1. Ingreso por usuario (Administrador, Vendedor, Bodega, Jefatura, Cliente).
2. Venta presencial: valida stock disponible, descuenta físico, crea movimiento.
3. Pedido online para retiro: reserva unidades; al entregar, se libera reserva y descuenta físico; si se cancela, se libera.
4. Gestión de inventario: consultas, ajustes justificados.
5. Reposición: bodega solicita, jefatura aprueba/rechaza, bodega recibe.
6. Panel de indicadores operativos y vistas SQL para Power BI.

Se entregan 120 ventas y 20 productos **FICTICIOS** en datos de ejemplo; los números de los mockups no tienen que coincidir con los de este prototipo.


- `powerbi/medidas_dax.txt`: propuesta de fórmulas DAX.
- `PLAN_ENTREGABLE_3.md`: planificación y evidencias para la entrega final.

El proyecto no procesa pagos reales, no emite documentos tributarios y no gestiona despacho nacional.
