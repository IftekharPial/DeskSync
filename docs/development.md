# Development Guide

This guide covers the development setup, workflow, and best practices for contributing to DailySync.

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 18 or higher
- **pnpm**: Package manager (recommended over npm/yarn)
- **PostgreSQL**: Version 15 or higher
- **Redis**: Version 7 or higher
- **Git**: For version control
- **Docker**: Optional, for containerized development

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/dailysync.git
   cd dailysync
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your local configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/dailysync_dev"
   
   # Redis
   REDIS_URL="redis://localhost:6379"
   
   # Authentication
   JWT_SECRET="your-jwt-secret-key"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   
   # API
   API_PORT=3001
   WEBHOOK_API_KEY="your-webhook-api-key"
   
   # Development
   NODE_ENV="development"
   ```

4. **Set up the database:**
   ```bash
   # Generate Prisma client
   pnpm db:generate
   
   # Run migrations
   pnpm db:migrate
   
   # Seed with sample data
   pnpm db:seed
   ```

5. **Start development servers:**
   ```bash
   # Start all services
   pnpm dev
   
   # Or start individually
   pnpm dev:api     # API server (port 3001)
   pnpm dev:web     # Web app (port 3000)
   pnpm dev:worker  # Queue worker
   ```

### Docker Development

For a containerized development environment:

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Run migrations
docker-compose exec api pnpm db:migrate

# View logs
docker-compose logs -f api web
```

## Project Structure

```
dailysync/
├── apps/
│   ├── api/                 # Express.js API server
│   │   ├── src/
│   │   │   ├── routes/      # API route handlers
│   │   │   ├── services/    # Business logic
│   │   │   ├── middleware/  # Express middleware
│   │   │   ├── utils/       # Utility functions
│   │   │   └── __tests__/   # Test files
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/                 # Next.js web application
│       ├── src/
│       │   ├── app/         # App router pages
│       │   ├── components/  # React components
│       │   ├── lib/         # Utility libraries
│       │   └── hooks/       # Custom React hooks
│       ├── public/          # Static assets
│       └── package.json
├── packages/
│   ├── config/              # Shared configuration
│   ├── database/            # Prisma schema and migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   └── types/               # Shared TypeScript types
├── docs/                    # Documentation
├── k8s/                     # Kubernetes manifests
├── monitoring/              # Monitoring configuration
├── .github/                 # GitHub Actions workflows
├── docker-compose.yml       # Docker Compose for production
├── docker-compose.dev.yml   # Docker Compose for development
└── README.md
```

## Development Workflow

### Git Workflow

We use a feature branch workflow:

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and commit:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push and create a pull request:**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

We follow the Conventional Commits specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add webhook delivery retry mechanism
fix: resolve database connection timeout issue
docs: update API documentation for webhooks
test: add unit tests for daily reports service
```

### Code Quality

**Linting and Formatting:**
```bash
# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

**Type Checking:**
```bash
# Check TypeScript types
pnpm type-check
```

**Pre-commit Hooks:**
We use Husky for pre-commit hooks that automatically:
- Run linting
- Check TypeScript types
- Run tests
- Format code

## Database Development

### Schema Changes

1. **Modify the Prisma schema:**
   ```prisma
   // packages/database/prisma/schema.prisma
   model NewModel {
     id        String   @id @default(cuid())
     name      String
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```

2. **Generate migration:**
   ```bash
   pnpm db:migrate:dev --name add-new-model
   ```

3. **Generate Prisma client:**
   ```bash
   pnpm db:generate
   ```

### Seeding Data

Update the seed script for development data:

```typescript
// packages/database/src/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create test users
  const user = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed-password',
      role: 'USER',
    },
  })

  // Create sample data
  await prisma.dailyReport.create({
    data: {
      userId: user.id,
      date: new Date(),
      ticketsResolved: 5,
      chatsHandled: 10,
      // ... other fields
    },
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test:unit         # Unit tests
pnpm test:integration  # Integration tests
pnpm test:e2e          # End-to-end tests

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Writing Tests

**Unit Tests:**
```typescript
// apps/api/src/__tests__/unit/services/dailyReports.test.ts
import { dailyReportsService } from '../../../services/dailyReports'
import { testUtils } from '../../setup'

describe('DailyReportsService', () => {
  it('should create a daily report', async () => {
    const user = await testUtils.createTestUser()
    const reportData = {
      userId: user.id,
      date: new Date(),
      ticketsResolved: 5,
      chatsHandled: 10,
    }

    const result = await dailyReportsService.createDailyReport(reportData)

    expect(result).toMatchObject(reportData)
    expect(result.id).toBeDefined()
  })
})
```

**Integration Tests:**
```typescript
// apps/api/src/__tests__/integration/routes/dailyReports.test.ts
import request from 'supertest'
import { app } from '../../../app'
import { testUtils } from '../../setup'

describe('Daily Reports API', () => {
  it('should create a daily report', async () => {
    const user = await testUtils.createTestUser()
    const token = testUtils.generateTestToken(user.id)

    const response = await request(app)
      .post('/api/daily-reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2024-01-15',
        ticketsResolved: 5,
        chatsHandled: 10,
      })
      .expect(201)

    expect(response.body.success).toBe(true)
    expect(response.body.data.ticketsResolved).toBe(5)
  })
})
```

### Test Database

Tests use a separate test database:

```env
# .env.test
DATABASE_URL="postgresql://username:password@localhost:5432/dailysync_test"
REDIS_URL="redis://localhost:6379/1"
```

## API Development

### Creating New Endpoints

1. **Define the route:**
   ```typescript
   // apps/api/src/routes/newFeature.ts
   import { Router } from 'express'
   import { authMiddleware } from '../middleware/auth'
   import { validate, newFeatureSchemas } from '../middleware/validation'

   const router = Router()

   router.post(
     '/',
     authMiddleware,
     validate({ body: newFeatureSchemas.create }),
     async (req, res, next) => {
       try {
         // Implementation
         res.json({ success: true, data: result })
       } catch (error) {
         next(error)
       }
     }
   )

   export { router as newFeatureRoutes }
   ```

2. **Add validation schema:**
   ```typescript
   // apps/api/src/middleware/validation.ts
   export const newFeatureSchemas = {
     create: z.object({
       name: z.string().min(1).max(100),
       description: z.string().optional(),
     }),
   }
   ```

3. **Register the route:**
   ```typescript
   // apps/api/src/app.ts
   import { newFeatureRoutes } from './routes/newFeature'

   app.use('/api/new-feature', newFeatureRoutes)
   ```

### Error Handling

Use the centralized error handling:

```typescript
import { validationError, notFoundError } from '../middleware/errorHandler'

// Validation error
if (!isValid) {
  throw validationError('Invalid input data')
}

// Not found error
if (!resource) {
  throw notFoundError('Resource not found')
}
```

## Frontend Development

### Component Structure

```typescript
// apps/web/src/components/feature/FeatureComponent.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FeatureComponentProps {
  data: FeatureData
  onAction: (id: string) => void
}

export function FeatureComponent({ data, onAction }: FeatureComponentProps) {
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    setLoading(true)
    try {
      await onAction(data.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleAction} disabled={loading}>
          {loading ? 'Loading...' : 'Action'}
        </Button>
      </CardContent>
    </Card>
  )
}
```

### API Integration

```typescript
// apps/web/src/lib/api.ts
import { ApiResponse, FeatureData } from '@/types'

export const featureApi = {
  getAll: async (): Promise<ApiResponse<FeatureData[]>> => {
    const response = await fetch('/api/features')
    return response.json()
  },

  create: async (data: CreateFeatureData): Promise<ApiResponse<FeatureData>> => {
    const response = await fetch('/api/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  },
}
```

### State Management

Use React Query for server state:

```typescript
// apps/web/src/hooks/useFeatures.ts
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { featureApi } from '@/lib/api'

export function useFeatures() {
  return useQuery('features', featureApi.getAll)
}

export function useCreateFeature() {
  const queryClient = useQueryClient()

  return useMutation(featureApi.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('features')
    },
  })
}
```

## Performance Optimization

### Database Optimization

- Use database indexes for frequently queried fields
- Implement pagination for large datasets
- Use database transactions for related operations
- Monitor slow queries and optimize them

### API Optimization

- Implement response caching where appropriate
- Use compression middleware
- Optimize database queries (avoid N+1 problems)
- Implement rate limiting

### Frontend Optimization

- Use Next.js Image component for optimized images
- Implement code splitting and lazy loading
- Optimize bundle size
- Use React.memo for expensive components

## Debugging

### API Debugging

```typescript
// Enable debug logging
DEBUG=dailysync:* pnpm dev:api

// Use debugger
import { logger } from '../utils/logger'

logger.debug('Debug information', { data })
```

### Database Debugging

```typescript
// Enable Prisma query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

### Frontend Debugging

```typescript
// React Query DevTools
import { ReactQueryDevtools } from 'react-query/devtools'

function App() {
  return (
    <>
      {/* Your app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}
```

## Deployment

### Building for Production

```bash
# Build all applications
pnpm build

# Build specific app
pnpm build:api
pnpm build:web
```

### Environment Configuration

Create environment-specific configuration:

```typescript
// packages/config/src/index.ts
export const config = {
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL!,
  },
  redis: {
    url: process.env.REDIS_URL!,
  },
}
```

## Contributing Guidelines

1. **Follow the coding standards**
2. **Write tests for new features**
3. **Update documentation**
4. **Use meaningful commit messages**
5. **Keep pull requests focused and small**
6. **Respond to code review feedback**

For questions or help, reach out to the development team or create an issue in the repository.
