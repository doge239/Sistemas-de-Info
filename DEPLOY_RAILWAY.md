# Despliegue en Railway

La tienda compilada y la API se sirven desde un único servicio Node.js. La base de datos sigue en Supabase. El `Dockerfile` compila React y copia únicamente el backend, sus dependencias de producción y los archivos públicos al contenedor. No se ejecutan semillas ni migraciones durante el arranque.

## Proyecto preparado

- Proyecto: `Sistemas PC Factory` (`b0e610db-31d0-4343-a1e7-e3143bb713ff`).
- Servicio: `Sistemas-de-Info` (`f145b1c1-963b-4eb5-acae-ac4638a77122`).
- Entorno: `production`.
- Panel: https://railway.com/project/b0e610db-31d0-4343-a1e7-e3143bb713ff
- Dominio reservado: `https://sistemas-de-info-production.up.railway.app`.
- Puerto: `4000`; comprobación de salud: `/api/salud`.

**Estado:** desplegado y verificado en la cuenta correcta. Railway informa `SUCCESS` para el despliegue `ad9b1854-ec01-47e8-a451-51593d8e1733`. URL pública: https://sistemas-de-info-production.up.railway.app .

## Variables

Ya se configuraron en Railway mediante entrada estándar, sin guardarlas en el repositorio:

- `DATABASE_URL`: conexión privada a Supabase, sin rutas a certificados locales.
- `DATABASE_CA_CERT`: contenido del certificado CA usado para verificar TLS con Supabase.
- `JWT_SECRET`: secreto de sesión del servicio.
- `NODE_ENV=production`.
- `PORT=4000`.
- `FRONTEND_ORIGIN=https://sistemas-de-info-production.up.railway.app`.

Si `DATABASE_CA_CERT` está definido, `DATABASE_URL` no debe incluir parámetros `sslmode`, `sslrootcert`, `sslcert` o `sslkey`: esos parámetros pueden sustituir la configuración SSL explícita del cliente PostgreSQL. El servidor usa el CA con `rejectUnauthorized: true`.

Las migraciones hasta `database/07_entrega_sin_datos.sql` ya están aplicadas en la base usada por este despliegue. Para usar otra base, inicializarla antes de desplegar.

## Actualizar el despliegue

Desde la raíz del repositorio, con la sesión de Railway autenticada:

```powershell
npm.cmd exec --yes --package=@railway/cli -- railway up --project b0e610db-31d0-4343-a1e7-e3143bb713ff --service Sistemas-de-Info --environment production --detach --json
npm.cmd exec --yes --package=@railway/cli -- railway deployment list --service Sistemas-de-Info --environment production --json
```

Esperar un despliegue saludable antes de utilizar el dominio. Verificar `/api/salud`, el catálogo paginado, las imágenes WebP y el inicio de sesión desde la URL pública. El despliegue por CLI incluye los cambios locales: no necesita publicar ni sobrescribir la rama de GitHub. `.railwayignore` y `.dockerignore` excluyen credenciales, certificados locales, dependencias y evidencias.
