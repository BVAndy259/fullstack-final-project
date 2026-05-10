# NovaSalud - Full Project Setup

Este repositorio incluye:
- `backend` (API Express + Prisma + PostgreSQL)
- `frontend` (React + Vite)

## 1. Clonar repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd final-project
```

## 2. Requisitos

- Node.js 18+ (recomendado 20+)
- npm
- PostgreSQL

## 3. Backend

### 3.1 Instalar dependencias

```bash
cd backend
npm install
```

### 3.2 Crear `.env`

```bash
# Linux / macOS
cp .env.example .env

# Windows (CMD)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Generar un `JWT_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Editar `backend/.env` con tus valores:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://USUARIO:PASSWORD@localhost:5432/nova_salud
JWT_SECRET=PEGA_AQUI_EL_SECRET_GENERADO
```

### 3.3 Base de datos

1. Crea la base de datos en PostgreSQL (ejemplo: `nova_salud`).
2. Inicializa todo (crea tablas en DB vacia + genera Prisma Client + seed admin):

```bash
npm run db:init
```

No uses `npx prisma db pull` en una DB vacia (ese comando es para introspeccion de una DB que ya tiene tablas).

El seed crea un admin fijo solo si no existe ningun usuario con rol `admin`:
- Nombre: `Admin`
- Email: `admin@novasalud.com`
- Password: `admin123`
- Rol: `admin`
- Activo: `true`

Opcional:

```bash
npx prisma studio
```

No necesitas usar `data_modeling/script.sql` para el arranque normal.

### 3.4 Ejecutar backend

```bash
npm run dev
```

API: `http://localhost:3000`  
Health: `http://localhost:3000/health`

## 4. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

El frontend consume `http://localhost:3000/api` (configurado en `frontend/src/api/axios.js`).

### 4.1 Credenciales de administrador (por defecto)

Si cargas la base de datos con `data_modeling/script.sql`, puedes iniciar sesión con:

- Email: `admin@novasalud.com`
- Contraseña: `password`

> Estas credenciales son solo para entorno local/desarrollo. Cámbialas antes de usar la aplicación en producción.

## 5. Ejecutar ambos

1. Terminal 1:
```bash
cd backend
npm run dev
```

2. Terminal 2:
```bash
cd frontend
npm run dev
```
