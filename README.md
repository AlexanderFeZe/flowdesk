# FlowDesk

> Multi-tenant project management and support platform

FlowDesk is a SaaS platform that allows companies to manage their projects, tasks, and support tickets from a single place. Each company operates in complete isolation within the same platform.

Built as a portfolio project to demonstrate production-grade architecture with NestJS, TypeScript, React Native, and AWS.

---

## Architecture

```
flowdesk/
├── apps/
│   ├── api/            ← Core API (NestJS + TypeScript)
│   ├── notifications/  ← Notifications microservice (NestJS)
│   ├── web/            ← Dashboard (Next.js) — coming soon
│   └── mobile/         ← Mobile app (React Native) — coming soon
└── packages/
    └── shared/         ← Shared TypeScript types
```

**Why this architecture?**

The core API is a modular monolith — clean boundaries between modules, each one independently testable and potentially extractable. The notifications service is intentionally separated because it has a different scaling profile and failure domain: if it goes down, project management keeps working.

Services communicate via Redis pub/sub, not direct HTTP calls.

---

## Tech Stack

### Backend
- **NestJS** + **TypeScript** — modular, scalable Node.js framework
- **PostgreSQL** — primary database with TypeORM
- **Redis** — pub/sub messaging + caching + job queues
- **Bull** — background job processing
- **Socket.io** — real-time notifications via WebSockets
- **JWT** — authentication with access + refresh token strategy
- **Swagger** — auto-generated API documentation

### Infrastructure
- **Docker** + **Docker Compose** — containerized development environment
- **GitHub Actions** — CI/CD pipeline (lint → test → build → deploy)
- **AWS** — EC2 + RDS + ElastiCache (coming soon)

### Frontend (coming soon)
- **Next.js** — web dashboard
- **React Native** — mobile app (iOS + Android)
- **Zustand** — client state management
- **React Query** — server state + caching

---

## Features

### Multi-tenancy
Every tenant (company) is fully isolated. The tenantId is embedded in the JWT and validated on every request via a global middleware. No tenant can access another tenant's data.

### Role-based access control
| Role | Scope | Description |
|---|---|---|
| `superadmin` | Global | Manages tenants and platform settings |
| `admin` | Tenant | Manages members, projects, and tenant config |
| `manager` | Tenant | Creates and assigns projects and tasks |
| `member` | Tenant | Works on assigned tasks, logs time |
| `support_agent` | Tenant | Handles support tickets |
| `client` | Tenant | Creates and tracks support tickets via mobile |

### Modules
- **Projects** — create and manage projects with deadlines and members
- **Tasks** — kanban-style task management with priorities, assignees, and comments
- **Support tickets** — client-facing ticket system with agent responses
- **Timetracking** — log time against tasks with live timer support
- **Notifications** — real-time via WebSocket + async processing via Redis pub/sub

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker Desktop
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/flowdesk.git
cd flowdesk
```

### 2. Set up environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/notifications/.env.example apps/notifications/.env
```

Edit the `.env` files with your values.

### 3. Start infrastructure services

```bash
docker compose up -d
```

This starts PostgreSQL and Redis locally.

### 4. Install dependencies

```bash
npm install
```

### 5. Run the API

```bash
npm run dev:api
```

API available at: `http://localhost:3000/api/v1`  
Swagger docs at: `http://localhost:3000/docs`

### 6. Run the notifications service

```bash
npm run dev:notifications
```

Notifications service at: `http://localhost:3001`

---

## Project Structure

### API modules

```
apps/api/src/
├── common/
│   ├── decorators/     ← @CurrentUser(), @CurrentTenant(), @Roles()
│   ├── filters/        ← Global exception handler
│   ├── guards/         ← JwtAuthGuard, RolesGuard
│   ├── interceptors/   ← TenantInterceptor
│   └── dto/            ← PaginationDto, ApiResponseDto
├── config/             ← Database, JWT, Redis configuration
└── modules/
    ├── auth/           ← JWT authentication + refresh tokens
    ├── tenants/        ← Tenant management (superadmin)
    ├── users/          ← User management per tenant
    ├── projects/       ← Project CRUD + member assignment
    ├── tasks/          ← Task management + comments + history
    ├── tickets/        ← Support ticket system
    └── timetracking/   ← Time logging + live timer
```

### Shared package

```
packages/shared/src/
└── index.ts   ← JwtPayload, TenantRole, NotificationEvent, ApiResponse
```

---

## API Documentation

Swagger UI is available at `http://localhost:3000/docs` when running locally.

All endpoints require a Bearer token except `/auth/login` and `/auth/register`.

---

## Key Technical Decisions

**Modular monolith over microservices**  
FlowDesk doesn't need microservices yet. The modules have clean boundaries and could be extracted later if needed. Premature distribution adds operational complexity without business value at this stage.

**Notifications as a separate service**  
Notifications have a different failure domain and scaling profile than the core API. Separating them means a WebSocket issue never affects project management. They communicate via Redis pub/sub, keeping both services decoupled.

**Redis pub/sub over direct HTTP between services**  
The API publishes events to Redis without knowing who's listening. This keeps services loosely coupled and makes it easy to add new consumers in the future.

**PostgreSQL over NoSQL**  
The data model is relational by nature (tenants → users → projects → tasks). PostgreSQL with proper indexing handles millions of records efficiently without the complexity of a NoSQL setup.

---

## Roadmap

### V1 (current)
- [x] Project setup and architecture
- [ ] Authentication + multi-tenancy
- [ ] Projects and tasks
- [ ] Support tickets
- [ ] Timetracking
- [ ] Real-time notifications
- [ ] Web dashboard (Next.js)
- [ ] Mobile app (React Native)
- [ ] Docker + CI/CD + AWS deploy

### V2 (planned)
- [ ] Custom roles per tenant
- [ ] OAuth (Google, GitHub)
- [ ] Advanced reporting
- [ ] Billing and subscription management
- [ ] Slack and GitHub integrations

---

## Author

**[Your Name]**  
Senior Fullstack & Mobile Engineer  
[LinkedIn](https://linkedin.com/in/YOUR_PROFILE) · [Dev.to](https://dev.to/YOUR_PROFILE)