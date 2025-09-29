# Database Troubleshooting Guide

This guide addresses common database issues with the Prosperous Universe MVP application, including SQLite (local) and PostgreSQL (production) configurations.

## 🚨 Common Database Issues

### 1. "Database not found" or "Table doesn't exist"

#### Local Development (SQLite)

**Problem**: Database file doesn't exist or tables are missing.

**Solutions**:

1. **Reset and recreate database**:
```bash
# This will delete all data and recreate the database
npm run db:reset
```

2. **Manual migration**:
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev

# Seed with sample data
npm run db:seed
```

3. **Check database file**:
```bash
# Verify SQLite database exists
ls -la prisma/dev.db

# If missing, run migrations
npm run prisma:migrate:dev
```

#### Production (PostgreSQL)

**Problem**: Database connection fails or tables don't exist.

**Solutions**:

1. **Check connection string**:
```bash
# Verify DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://username:password@host:port/database?schema=public
```

2. **Deploy migrations**:
```bash
# Deploy migrations to production
npm run prisma:migrate
```

3. **Verify database access**:
```bash
# Test connection
npx prisma db pull
```

### 2. "Prisma Client not generated"

**Problem**: Prisma client is missing or outdated.

**Solution**:
```bash
# Generate Prisma client
npm run prisma:generate

# If that fails, clean and regenerate
rm -rf node_modules/.prisma
npm run prisma:generate
```

### 3. Migration Conflicts

**Problem**: Migration files are out of sync or conflicting.

**Solutions**:

1. **Reset migrations** (⚠️ This will delete all data):
```bash
# Delete migration files
rm -rf prisma/migrations

# Create new initial migration
npm run prisma:migrate:dev --name init

# Seed database
npm run db:seed
```

2. **Fix specific migration**:
```bash
# Create a new migration to fix issues
npm run prisma:migrate:dev --name fix_migration_name
```

3. **Manual database reset**:
```bash
# For SQLite (local)
rm prisma/dev.db
npm run prisma:migrate:dev
npm run db:seed

# For PostgreSQL (production)
# Connect to database and drop/recreate tables manually
```

### 4. Connection Pool Exhaustion

**Problem**: "Too many connections" or connection timeouts.

**Solutions**:

1. **Configure connection pooling**:
```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For connection pooling
}
```

2. **Update database client**:
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

3. **Add connection limits**:
```typescript
// lib/db.ts
export const db = new PrismaClient({
  log: ['query'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add connection pooling configuration
  __internal: {
    engine: {
      connectTimeout: 60000,
      queryTimeout: 60000,
    },
  },
});
```

## 🔧 Database Setup by Environment

### Local Development (SQLite)

1. **Initial Setup**:
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Create and migrate database
npm run prisma:migrate:dev

# Seed with sample data
npm run db:seed
```

2. **Verify Setup**:
```bash
# Check database file exists
ls -la prisma/dev.db

# Open Prisma Studio to view data
npx prisma studio
```

3. **Common Commands**:
```bash
# Reset database (⚠️ deletes all data)
npm run db:reset

# View database in browser
npx prisma studio

# Check database schema
npx prisma db pull

# Generate new migration
npm run prisma:migrate:dev --name describe_changes
```

### Production (PostgreSQL)

1. **Database Provider Setup**:

**Vercel Postgres**:
```bash
# In Vercel dashboard:
# 1. Go to Project → Storage
# 2. Create Database → Postgres
# 3. Copy connection string to environment variables
```

**Supabase**:
```bash
# 1. Create project at supabase.com
# 2. Go to Settings → Database
# 3. Copy connection string
# 4. Add to environment variables
```

**Neon**:
```bash
# 1. Create project at neon.tech
# 2. Copy connection string
# 3. Add to environment variables
```

2. **Deploy to Production**:
```bash
# Update schema for PostgreSQL
# Change provider in prisma/schema.prisma from "sqlite" to "postgresql"

# Deploy migrations
npm run prisma:migrate

# Generate client
npm run prisma:generate
```

3. **Verify Production Setup**:
```bash
# Test connection
npx prisma db pull

# Check tables exist
npx prisma studio --browser none
```

## 🐛 Debugging Database Issues

### 1. Enable Query Logging

```typescript
// lib/db.ts
export const db = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  db.$on('query', (e) => {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
    console.log('Duration: ' + e.duration + 'ms');
  });
}
```

### 2. Test Database Connection

```typescript
// lib/db-test.ts
import { db } from './db';

export async function testConnection() {
  try {
    await db.$connect();
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    const result = await db.commodity.count();
    console.log(`✅ Found ${result} commodities`);
    
    await db.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
```

### 3. Check Database Schema

```bash
# Pull current schema from database
npx prisma db pull

# Compare with your schema.prisma
npx prisma format

# Generate migration if needed
npm run prisma:migrate:dev --name sync_schema
```

### 4. Monitor Database Performance

```typescript
// lib/db-monitor.ts
import { db } from './db';

export async function monitorDatabase() {
  const start = Date.now();
  
  try {
    // Your database operation
    const result = await db.inventory.findMany();
    
    const duration = Date.now() - start;
    console.log(`Query took ${duration}ms`);
    
    if (duration > 1000) {
      console.warn('⚠️ Slow query detected');
    }
    
    return result;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}
```

## 🚀 Performance Optimization

### 1. Add Database Indexes

```prisma
// prisma/schema.prisma
model Inventory {
  id          String   @id @default(cuid())
  stationId   String
  commodityId String
  qty         Decimal
  updatedAt   DateTime @updatedAt

  // Relations
  station   Station   @relation(fields: [stationId], references: [id])
  commodity Commodity @relation(fields: [commodityId], references: [id])

  @@unique([stationId, commodityId])
  @@index([stationId]) // Add index for faster queries
  @@index([commodityId]) // Add index for faster queries
  @@index([updatedAt]) // Add index for sorting
  @@map("inventory")
}
```

### 2. Optimize Queries

```typescript
// ❌ Inefficient query
const inventory = await db.inventory.findMany({
  include: {
    station: true,
    commodity: true,
  },
});

// ✅ Optimized query with specific fields
const inventory = await db.inventory.findMany({
  select: {
    id: true,
    qty: true,
    updatedAt: true,
    station: {
      select: {
        code: true,
        name: true,
      },
    },
    commodity: {
      select: {
        symbol: true,
        name: true,
      },
    },
  },
  orderBy: {
    updatedAt: 'desc',
  },
});
```

### 3. Implement Caching

```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';

export const getCachedInventory = unstable_cache(
  async () => {
    return await db.inventory.findMany({
      include: {
        station: true,
        commodity: true,
      },
    });
  },
  ['inventory'],
  { 
    revalidate: 300, // 5 minutes
    tags: ['inventory']
  }
);
```

## 🔄 Database Maintenance

### 1. Regular Backups

```bash
# SQLite backup
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d)

# PostgreSQL backup (using pg_dump)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### 2. Clean Up Old Data

```typescript
// lib/cleanup.ts
export async function cleanupOldData() {
  // Delete old price data (older than 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await db.price.deleteMany({
    where: {
      ts: {
        lt: thirtyDaysAgo,
      },
    },
  });
}
```

### 3. Monitor Database Size

```bash
# SQLite
ls -lh prisma/dev.db

# PostgreSQL
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

## 📊 Database Health Checks

### 1. Create Health Check Endpoint

```typescript
// app/api/health/route.ts
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    await db.$connect();
    
    // Test basic queries
    const commodityCount = await db.commodity.count();
    const stationCount = await db.station.count();
    const inventoryCount = await db.inventory.count();
    
    await db.$disconnect();
    
    return Response.json({
      status: 'healthy',
      database: 'connected',
      counts: {
        commodities: commodityCount,
        stations: stationCount,
        inventory: inventoryCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return Response.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
```

### 2. Automated Health Monitoring

```typescript
// lib/health-monitor.ts
export async function runHealthChecks() {
  const checks = [
    { name: 'Database Connection', test: testDatabaseConnection },
    { name: 'Schema Validation', test: validateSchema },
    { name: 'Query Performance', test: testQueryPerformance },
  ];
  
  const results = await Promise.allSettled(
    checks.map(async (check) => {
      const result = await check.test();
      return { name: check.name, result };
    })
  );
  
  return results.map((result, index) => ({
    name: checks[index].name,
    status: result.status === 'fulfilled' ? 'pass' : 'fail',
    error: result.status === 'rejected' ? result.reason : null,
  }));
}
```

## 🎯 Quick Fix Checklist

- [ ] Database file exists (SQLite) or connection string is valid (PostgreSQL)
- [ ] Prisma client is generated (`npm run prisma:generate`)
- [ ] Migrations are applied (`npm run prisma:migrate:dev` or `npm run prisma:migrate`)
- [ ] Database is seeded with sample data (`npm run db:seed`)
- [ ] Environment variables are set correctly
- [ ] Database schema matches Prisma schema
- [ ] Connection pooling is configured (for production)
- [ ] Health check endpoint is working

---

**Need more help? Check the main [SETUP_GUIDE.md](./SETUP_GUIDE.md) for comprehensive setup instructions.**