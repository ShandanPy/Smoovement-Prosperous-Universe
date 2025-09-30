# Vercel Deployment Troubleshooting Guide

This guide specifically addresses common Vercel deployment issues with this Next.js + Prisma application.

## 🚨 Most Common Issues

### 1. Build Failures

#### Problem: "Prisma Client not generated" or "Cannot find module @prisma/client"

**Root Cause**: Vercel doesn't automatically generate Prisma client during build.

**Solution**: Update your build process:

1. **Update `vercel.json`**:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run prisma:generate && npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "functions": {
    "app/**/*.tsx": {
      "maxDuration": 10
    }
  }
}
```

2. **Add build script to `package.json`**:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

3. **Alternative: Use Vercel's build command override**:
   - Go to Vercel Dashboard → Project → Settings → General
   - Override Build Command: `npm run prisma:generate && npm run build`

### 2. Database Connection Issues

#### Problem: "Database connection failed" or "Invalid DATABASE_URL"

**Root Cause**: Missing or incorrect database configuration.

**Solutions**:

1. **Check Environment Variables**:
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Ensure `DATABASE_URL` is set for all environments (Production, Preview, Development)
   - Format: `postgresql://username:password@host:port/database?schema=public`

2. **Update Prisma Schema for Production**:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Optional: for connection pooling
}
```

3. **Set up Vercel Postgres** (Recommended):
   - Go to Vercel Dashboard → Project → Storage
   - Create Database → Postgres
   - Copy the connection string to environment variables

### 3. Migration Issues

#### Problem: "Migration failed" or "Database schema out of sync"

**Solution**: Add migration deployment to build process:

1. **Update build command**:

```json
{
  "buildCommand": "npm run prisma:generate && npm run prisma:migrate && npm run build"
}
```

2. **Or use the vercel-build script**:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

3. **Manual migration deployment**:

```bash
# Deploy migrations manually
vercel env pull .env.local
npx prisma migrate deploy
```

### 4. Function Timeout Issues

#### Problem: API routes timeout (10s default limit)

**Solution**: Optimize and configure timeouts:

1. **Update `vercel.json`**:

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

2. **Optimize database queries**:
   - Add database indexes
   - Use connection pooling
   - Implement caching

3. **Add error handling**:

```typescript
// app/api/example/route.ts
export async function GET() {
  try {
    // Your logic here
    return Response.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

## 🔧 Step-by-Step Vercel Setup

### 1. Initial Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (this will create the project)
vercel
```

### 2. Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://username:password@host:port/database?schema=public
FIO_API_KEY=your_fio_api_key
PU_USERNAME=your_username
MAINT_TOKEN=your_token
FIO_BASE_URL=https://rest.fnar.net
```

### 3. Set up Database

**Option A: Vercel Postgres (Recommended)**

1. Go to Vercel Dashboard → Project → Storage
2. Create Database → Postgres
3. Copy connection string to `DATABASE_URL`

**Option B: External PostgreSQL**

- Supabase, Neon, Railway, or PlanetScale
- Get connection string and add to environment variables

### 4. Deploy Migrations

```bash
# Pull environment variables
vercel env pull .env.local

# Deploy migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

### 5. Final Deployment

```bash
# Deploy to production
vercel --prod
```

## 🐛 Debugging Deployment Issues

### 1. Check Build Logs

1. Go to Vercel Dashboard → Project → Deployments
2. Click on failed deployment
3. Check build logs for specific errors

### 2. Check Function Logs

1. Go to Vercel Dashboard → Project → Functions
2. Click on failing function
3. Check runtime logs

### 3. Test Locally with Production Environment

```bash
# Pull production environment
vercel env pull .env.local

# Test build locally
npm run build

# Test with production database
npm run prisma:migrate
npm run prisma:generate
npm run dev
```

### 4. Common Error Messages & Solutions

| Error                                              | Solution                                       |
| -------------------------------------------------- | ---------------------------------------------- |
| `Module not found: Can't resolve '@prisma/client'` | Run `npm run prisma:generate` in build command |
| `Database connection failed`                       | Check `DATABASE_URL` environment variable      |
| `Migration failed`                                 | Add `prisma migrate deploy` to build command   |
| `Function timeout`                                 | Increase `maxDuration` in `vercel.json`        |
| `Environment variable not found`                   | Add missing variables in Vercel dashboard      |

## 🚀 Production Optimization

### 1. Database Connection Pooling

For high-traffic applications, use connection pooling:

```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For connection pooling
}
```

### 2. Caching

Implement caching for expensive operations:

```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';

export const getCachedInventory = unstable_cache(
  async () => {
    // Your database query
  },
  ['inventory'],
  { revalidate: 300 } // 5 minutes
);
```

### 3. Error Monitoring

Add error monitoring:

```typescript
// lib/error-handler.ts
export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  // Send to monitoring service (Sentry, etc.)
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error);
  // }

  return Response.json({ error: 'Internal Server Error' }, { status: 500 });
}
```

## 🔄 Continuous Deployment

### 1. GitHub Integration

1. Connect your GitHub repository to Vercel
2. Enable automatic deployments
3. Set up branch protection rules

### 2. Environment-Specific Deployments

- **Production**: `main` branch
- **Preview**: `develop` branch and PRs
- **Development**: feature branches

### 3. Pre-deployment Checks

Add to your CI/CD pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Deploy to Vercel
  run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## 📞 Getting Help

If you're still having issues:

1. **Check Vercel Status**: https://vercel-status.com
2. **Vercel Documentation**: https://vercel.com/docs
3. **Prisma + Vercel Guide**: https://vercel.com/guides/nextjs-prisma-postgres
4. **Community Support**: Vercel Discord or GitHub Issues

## 🎯 Quick Fix Checklist

- [ ] Environment variables set in Vercel dashboard
- [ ] `DATABASE_URL` points to PostgreSQL database
- [ ] Build command includes `prisma generate`
- [ ] Migrations deployed with `prisma migrate deploy`
- [ ] Function timeouts configured in `vercel.json`
- [ ] Error handling implemented in API routes
- [ ] Database connection tested locally

---

**Need more help? Check the main [SETUP_GUIDE.md](./SETUP_GUIDE.md) for comprehensive setup instructions.**
