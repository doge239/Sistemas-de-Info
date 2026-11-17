# PC Factory

Tienda y sistema de gestión para la sucursal de Antofagasta. Prototipo académico con datos ficticios.

Aplicación publicada: https://sistemas-de-info-production.up.railway.app

## Estructura

- `frontend/`: React, Vite, estilos e imágenes WebP.
- `backend/`: API Express, autenticación, permisos, ventas e inventario.
- `database/`: esquema, datos iniciales y migraciones de Supabase.
- `Dockerfile`, `railway.json`: configuración de producción.
- [DEPLOY_RAILWAY.md](DEPLOY_RAILWAY.md): variables y comandos para actualizar Railway.

## Ejecutar localmente

Requiere Node.js y una base PostgreSQL en Supabase.

Configura `backend/.env` usando `backend/.env.example` como referencia. La conexión privada `DATABASE_URL` y `JWT_SECRET` se utilizan únicamente en el backend.

En una terminal:

```powershell
cd backend
npm ci
npm run dev
```

En otra terminal:

```powershell
cd frontend
npm ci
npm run dev
```

La tienda abre en http://localhost:5173 y la API en http://localhost:4000. Vite reenvía las solicitudes `/api` al backend.

<<<<<<< HEAD

- `powerbi/medidas_dax.txt`: propuesta de fórmulas DAX.
- `PLAN_ENTREGABLE_3.md`: planificación y evidencias para la entrega final.
=======
## Inicializar una base nueva

Ejecutar en el SQL Editor de Supabase, en este orden:

1. `database/01_schema.sql`: tablas, restricciones, vistas y permisos.
2. `database/02_demo.sql`: catálogo y datos iniciales ficticios, una sola vez.
3. `database/05_paginacion.sql`: índices para filtros y paginación.
4. `database/06_entrega_pedidos.sql`: opciones de entrega y estados de despacho.
5. `database/07_entrega_sin_datos.sql`: permite elegir domicilio sin pedir dirección.

Para crear las cuentas iniciales, ejecutar `npm run seed:users` desde `backend/`. La base actualmente utilizada ya está inicializada.

## Funcionamiento

El catálogo es público y permite armar el carrito antes de ingresar. El registro crea siempre una cuenta Cliente. Solo Administrador puede cambiar roles, crear usuarios internos o desactivar cuentas.
>>>>>>> e29a546 (Actualizar tienda, perfiles, pedidos y despliegue)

Los pedidos online permiten elegir retiro en sucursal o retiro a domicilio. Por ahora solo se guarda la opción, sin solicitar dirección ni datos adicionales. Los productos se reservan al confirmar; el stock físico se descuenta al entregar un retiro o al despachar un pedido a domicilio. La confirmación final de domicilio no repite el descuento.

Vendedor registra ventas presenciales y entregas. Bodega gestiona existencias, preparación de pedidos y recepción de reposiciones. Jefatura consulta indicadores y aprueba o rechaza reposiciones. Cada perfil tiene su propia vista y color.

Los listados se consultan en Supabase de 10 registros por página. Los filtros y el orden se aplican en el servidor; la búsqueda espera 400 ms sin escribir y cancela solicitudes anteriores. Las respuestas de listados tienen la forma `{items, total, page, pageSize, totalPages, summary}`.

Las imágenes WebP están en `frontend/public/images/products/`. Las herramientas para descargarlas y optimizarlas están en `frontend/scripts/`; sus instrucciones están en [frontend/public/images/README.md](frontend/public/images/README.md).

El sistema no procesa pagos reales, no emite documentos tributarios y no integra transportistas ni tarifas de envío.

## Producción

Railway compila el frontend y sirve la tienda y la API en un único servicio. Las credenciales y el certificado de Supabase se configuran como variables del servicio. El despliegue no ejecuta semillas ni migraciones automáticamente.
