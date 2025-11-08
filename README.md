# HRM FYP Project

A comprehensive Human Resource Management (HRM) system built with modern web technologies.

## 🚀 Tech Stack

### Backend

- **NestJS** - Progressive Node.js framework for building efficient and scalable server-side applications
- **TypeScript** - Typed superset of JavaScript
- **Prisma** - Next-generation ORM for Node.js and TypeScript
- **PostgreSQL** - Powerful open-source relational database

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**
- **PostgreSQL** (v14 or higher)
- **Git**

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/subhashadhikari057/hrm-fyp.git
   cd FYP-Project
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

## ⚙️ Configuration

### Database Setup

1. **Create a PostgreSQL database**

   ```sql
   CREATE DATABASE hrmfyp;
   ```

2. **Configure environment variables**

   Navigate to the `backend` directory and create/update the `.env` file:

   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/hrmfyp?schema=public"
   ```

   Replace `your_password` with your PostgreSQL password.

3. **Generate Prisma Client**
   ```bash
   cd backend
   npm run prisma:generate
   ```

## 🏃 Running the Application

### Backend Development Server

```bash
cd backend
npm run start:dev
```

The server will start on `http://localhost:8080` by default.

You should see:

- ✅ **Database connected successfully** - Confirms Prisma connection
- 🚀 **Application is running on: http://localhost:8080** - Server is ready

## 📁 Project Structure

```
FYP-Project/
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── prisma/         # Prisma module and service
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── app.module.ts   # Root application module
│   │   └── main.ts         # Application entry point
│   ├── prisma/
│   │   └── schema.prisma   # Prisma schema definition
│   ├── .env                # Environment variables (not in git)
│   └── package.json
└── README.md               # This file
```

## 📜 Available Scripts

### Backend Scripts

Navigate to the `backend` directory to run these commands:

- `npm run start:dev` - Start development server with hot-reload
- `npm run build` - Build the application for production
- `npm run start:prod` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Lint code

## 🗄️ Database Management

### Prisma Commands

All Prisma commands should be run from the `backend` directory:

- **Generate Prisma Client**: `npm run prisma:generate`
- **Create Migration**: `npm run prisma:migrate`
- **View Database**: `npx prisma studio` (opens Prisma Studio GUI)

## 🔒 Environment Variables

The following environment variables are required:

| Variable       | Description                              | Example                                        |
| -------------- | ---------------------------------------- | ---------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string             | `postgresql://user:pass@localhost:5432/hrmfyp` |
| `PORT`         | Server port (optional, defaults to 8080) | `8080`                                         |

## 🧪 Testing

```bash
cd backend
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:cov      # Test coverage
```

## 📝 Development Guidelines

- Follow TypeScript best practices
- Use Prisma for all database operations
- Follow NestJS module structure
- Write tests for new features
- Keep environment variables in `.env` (never commit this file)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## 📄 License

This project is part of a Final Year Project (FYP).

## 👤 Author

Subhash Adhikari - FYP Project

---

**Note**: This is a work in progress. More features and documentation will be added as the project develops.
