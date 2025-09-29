# Environment Variables Setup Guide

This guide explains how to properly configure environment variables for the Prosperous Universe MVP application in both local development and production environments.

## 🔑 Required Environment Variables

### Core Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `FIO_API_KEY` | API key for FIO (Fictional Interstellar Operations) | ✅ Yes | `your_fio_api_key_here` |
| `PU_USERNAME` | Your Prosperous Universe username | ✅ Yes | `your_username` |
| `MAINT_TOKEN` | Maintenance token for admin operations | ✅ Yes | `your_maint_token_here` |
| `DATABASE_URL` | Database connection string | ✅ Yes (Production) | `postgresql://user:pass@host:port/db` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `FIO_BASE_URL` | Base URL for FIO API | `https://rest.fnar.net` | `https://rest.fnar.net` |
| `DIRECT_URL` | Direct database URL for connection pooling | - | `postgresql://user:pass@host:port/db` |
| `NODE_ENV` | Environment mode | `development` | `production` |

## 🏠 Local Development Setup

### 1. Create Environment File

Create a `.env.local` file in your project root:

```bash
# Create the file
touch .env.local
```

### 2. Add Required Variables

```bash
# .env.local
# FIO API Configuration
FIO_API_KEY=your_fio_api_key_here
PU_USERNAME=your_prosperous_universe_username
MAINT_TOKEN=your_maintenance_token_here

# Optional: Override FIO base URL if needed
FIO_BASE_URL=https://rest.fnar.net

# Database (SQLite for local development - auto-created)
# DATABASE_URL=file:./prisma/dev.db

# Environment
NODE_ENV=development
```

### 3. Get Your API Credentials

#### FIO API Key
1. Go to [FIO API Documentation](https://rest.fnar.net)
2. Register for an API key
3. Copy the key to your `.env.local`

#### Prosperous Universe Username
1. This is your in-game username
2. Used for inventory synchronization

#### Maintenance Token
1. This is a custom token for admin operations
2. Generate a secure random string:
```bash
# Generate a secure token
openssl rand -hex 32
```

### 4. Verify Setup

```bash
# Check if environment variables are loaded
npm run dev

# Test API endpoints
curl http://localhost:3000/api/ping
```

## 🚀 Production Setup (Vercel)

### 1. Vercel Dashboard Configuration

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable for the appropriate environments:

#### Environment Variable Configuration

| Variable | Production | Preview | Development |
|----------|------------|---------|-------------|
| `FIO_API_KEY` | ✅ | ✅ | ✅ |
| `PU_USERNAME` | ✅ | ✅ | ✅ |
| `MAINT_TOKEN` | ✅ | ✅ | ✅ |
| `DATABASE_URL` | ✅ | ✅ | ✅ |
| `FIO_BASE_URL` | ✅ | ✅ | ✅ |
| `DIRECT_URL` | ✅ | ✅ | ✅ |

### 2. Database URL Setup

#### Option A: Vercel Postgres (Recommended)

1. In Vercel Dashboard → **Storage**
2. Click **Create Database** → **Postgres**
3. Copy the connection string
4. Add as `DATABASE_URL` environment variable

#### Option B: External PostgreSQL

**Supabase**:
```bash
# Format: postgresql://postgres:[password]@[host]:5432/postgres
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:your_password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Neon**:
```bash
# Format: postgresql://[user]:[password]@[host]/[database]?sslmode=require
DATABASE_URL=postgresql://alex:AbC123dEf@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Railway**:
```bash
# Format: postgresql://postgres:[password]@[host]:[port]/railway
DATABASE_URL=postgresql://postgres:password@containers-us-west-123.railway.app:6543/railway
```

### 3. Vercel CLI Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Pull environment variables locally for testing
vercel env pull .env.local

# Deploy to production
vercel --prod
```

## 🔒 Security Best Practices

### 1. Environment File Security

```bash
# Add to .gitignore (should already be there)
echo ".env.local" >> .gitignore
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore

# Verify gitignore
git status
# Should not show .env.local files
```

### 2. Token Generation

```bash
# Generate secure tokens
# For MAINT_TOKEN
openssl rand -hex 32

# For session secrets
openssl rand -base64 32

# For API keys (if creating your own)
openssl rand -hex 16
```

### 3. Environment Variable Validation

The application includes built-in validation in `lib/env.ts`:

```typescript
// lib/env.ts
const envSchema = z.object({
  FIO_BASE_URL: z.string().url('FIO_BASE_URL must be a valid URL').default('https://rest.fnar.net'),
  FIO_API_KEY: z.string().min(1, 'FIO_API_KEY is required'),
  PU_USERNAME: z.string().min(1, 'PU_USERNAME is required'),
  MAINT_TOKEN: z.string().min(1, 'MAINT_TOKEN is required'),
});
```

## 🧪 Testing Environment Variables

### 1. Local Testing

```bash
# Test environment loading
node -e "console.log(process.env.FIO_API_KEY)"

# Test with Next.js
npm run dev
# Check console for environment validation errors
```

### 2. Production Testing

```bash
# Test Vercel environment
vercel env pull .env.local
npm run build

# Test API endpoints
curl https://your-app.vercel.app/api/ping
```

### 3. Environment Validation Script

Create a test script:

```typescript
// scripts/test-env.ts
import { env } from '../lib/env';

function testEnvironment() {
  console.log('🧪 Testing environment variables...');
  
  try {
    // Test each required variable
    console.log('✅ FIO_BASE_URL:', env.FIO_BASE_URL);
    console.log('✅ FIO_API_KEY:', env.FIO_API_KEY ? 'Set' : 'Missing');
    console.log('✅ PU_USERNAME:', env.PU_USERNAME);
    console.log('✅ MAINT_TOKEN:', env.MAINT_TOKEN ? 'Set' : 'Missing');
    
    console.log('🎉 All environment variables are properly configured!');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
}

testEnvironment();
```

Run the test:

```bash
# Add to package.json scripts
npm run test:env
```

## 🐛 Common Environment Issues

### 1. "Environment variable not found"

**Problem**: Application can't find required environment variables.

**Solutions**:
1. Check file name: `.env.local` (not `.env`)
2. Restart development server after adding variables
3. Verify variable names match exactly (case-sensitive)
4. Check for typos in variable names

### 2. "Invalid URL" or "Invalid format"

**Problem**: Environment variables have incorrect format.

**Solutions**:
1. Check URL format for `FIO_BASE_URL`
2. Ensure no extra spaces or quotes around values
3. Verify database URL format

### 3. "Database connection failed"

**Problem**: `DATABASE_URL` is incorrect or database is not accessible.

**Solutions**:
1. Test database connection string
2. Verify database credentials
3. Check if database server is running
4. Ensure firewall allows connections

### 4. "API key invalid"

**Problem**: FIO API key is incorrect or expired.

**Solutions**:
1. Verify API key with FIO service
2. Check if key has proper permissions
3. Regenerate API key if needed

## 🔄 Environment Management

### 1. Multiple Environments

```bash
# .env.local (local development)
FIO_API_KEY=dev_key_here
PU_USERNAME=dev_username
MAINT_TOKEN=dev_token_here

# .env.production (production - not committed)
FIO_API_KEY=prod_key_here
PU_USERNAME=prod_username
MAINT_TOKEN=prod_token_here
```

### 2. Environment-Specific Configuration

```typescript
// lib/config.ts
const config = {
  development: {
    fioBaseUrl: 'https://rest.fnar.net',
    logLevel: 'debug',
  },
  production: {
    fioBaseUrl: 'https://rest.fnar.net',
    logLevel: 'error',
  },
};

export const appConfig = config[process.env.NODE_ENV as keyof typeof config] || config.development;
```

### 3. Environment Rotation

```bash
# Rotate API keys regularly
# 1. Generate new key
# 2. Update in Vercel dashboard
# 3. Test new key
# 4. Remove old key
```

## 📊 Environment Monitoring

### 1. Health Check with Environment Info

```typescript
// app/api/health/route.ts
export async function GET() {
  const envStatus = {
    fioApiKey: !!process.env.FIO_API_KEY,
    puUsername: !!process.env.PU_USERNAME,
    maintToken: !!process.env.MAINT_TOKEN,
    databaseUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
  };
  
  return Response.json({
    status: 'healthy',
    environment: envStatus,
    timestamp: new Date().toISOString(),
  });
}
```

### 2. Environment Validation in CI/CD

```yaml
# .github/workflows/env-check.yml
name: Environment Check

on: [push, pull_request]

jobs:
  env-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check environment variables
        run: |
          if [ -z "$FIO_API_KEY" ]; then
            echo "❌ FIO_API_KEY is missing"
            exit 1
          fi
          if [ -z "$PU_USERNAME" ]; then
            echo "❌ PU_USERNAME is missing"
            exit 1
          fi
          echo "✅ All required environment variables are set"
```

## 🎯 Quick Setup Checklist

### Local Development
- [ ] Create `.env.local` file
- [ ] Add `FIO_API_KEY`
- [ ] Add `PU_USERNAME`
- [ ] Add `MAINT_TOKEN`
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Restart development server
- [ ] Test API endpoints

### Production (Vercel)
- [ ] Set environment variables in Vercel dashboard
- [ ] Configure `DATABASE_URL` for PostgreSQL
- [ ] Set all variables for Production, Preview, and Development
- [ ] Deploy and test
- [ ] Verify health check endpoint

### Security
- [ ] Use strong, unique tokens
- [ ] Never commit environment files
- [ ] Rotate API keys regularly
- [ ] Monitor environment variable usage
- [ ] Use different keys for different environments

---

**Need more help? Check the main [SETUP_GUIDE.md](./SETUP_GUIDE.md) for comprehensive setup instructions.**