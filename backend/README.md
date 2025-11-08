# Backend - NestJS + Prisma + PostgreSQL

Backend API server for the HRM system built with NestJS, TypeScript, Prisma, and PostgreSQL.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the root of the `backend` directory:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/hrmfyp?schema=public"
PORT=3000
```

**Important**: Replace `your_password` with your actual PostgreSQL password.

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

This generates the Prisma Client based on your schema.

### 4. Start Development Server

```bash
npm run start:dev
```

The server will start on `http://localhost:3000` (or the port specified in `PORT` env variable).

## ✅ Verification

When the server starts successfully, you should see:

```
[PrismaService] ✅ Database connected successfully
[Bootstrap] 🚀 Application is running on: http://localhost:3000
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start development server with hot-reload |
| `npm run start` | Start production server |
| `npm run start:debug` | Start server in debug mode |
| `npm run build` | Build the application |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Generate test coverage report |
| `npm run lint` | Lint and fix code |

## 📁 Project Structure

```
backend/
├── src/
│   ├── prisma/
│   │   ├── prisma.module.ts    # Global Prisma module
│   │   └── prisma.service.ts   # Prisma service (extends PrismaClient)
│   ├── app.module.ts           # Root application module
│   ├── app.controller.ts       # Root controller
│   ├── app.service.ts          # Root service
│   └── main.ts                 # Application entry point
├── prisma/
│   └── schema.prisma           # Prisma schema (database models)
├── test/                       # E2E tests
├── .env                        # Environment variables (not in git)
└── package.json
```

## 🗄️ Database Management

### Prisma Schema

The database schema is defined in `prisma/schema.prisma`. After modifying the schema:

1. **Create a migration:**
   ```bash
   npm run prisma:migrate
   ```

2. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

### Prisma Studio

View and edit your database using Prisma Studio:

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555`.

## 🔧 Prisma Service

The `PrismaService` is available globally throughout the application. Inject it into any service or controller:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class YourService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.yourModel.findMany();
  }
}
```

## 🔒 Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | - |
| `PORT` | No | Server port | `3000` |

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 📝 Development Notes

- The `PrismaModule` is marked as `@Global()`, so you don't need to import it in every module
- Prisma Client is automatically connected on application startup
- Database connection status is logged on startup
- All database operations should go through `PrismaService`

## 🐛 Troubleshooting

### Database Connection Failed

- Verify PostgreSQL is running: `pg_isready`
- Check your `DATABASE_URL` in `.env`
- Ensure the database `hrmfyp` exists
- Verify username and password are correct

### Prisma Client Not Found

Run:
```bash
npm run prisma:generate
```

### Port Already in Use

Change the `PORT` in `.env` or kill the process using port 3000.

## 📚 Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
