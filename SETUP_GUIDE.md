# Prosperous Universe MVP - Complete Setup Guide

This guide will help you set up and test the Prosperous Universe MVP application, including troubleshooting common Vercel and database issues.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20.x or later
- **npm**: Comes with Node.js
- **Git**: For version control

### 1. Clone and Install

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd prosperous-universe-mvp

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the project root:

```bash
# Required for FIO API integration
FIO_API_KEY=your_fio_api_key_here
PU_USERNAME=your_prosperous_universe_username
MAINT_TOKEN=your_maintenance_token_here

# Optional - defaults to https://rest.fnar.net
FIO_BASE_URL=https://rest.fnar.net

# Database URL (for production - see Database Setup section)
DATABASE_URL=your_database_url_here
```

**⚠️ Important**: Never commit `.env.local` to version control!

### 3. Database Setup

#### Local Development (SQLite)

The project uses SQLite for local development by default:

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate:dev

# Seed the database with sample data
npm run db:seed
```

#### Production Database (PostgreSQL)

For Vercel deployment, you'll need a PostgreSQL database:

**Option 1: Vercel Postgres (Recommended)**

1. Go to your Vercel dashboard
2. Navigate to your project
3. Go to Storage → Create Database → Postgres
4. Copy the connection string to your environment variables

**Option 2: External PostgreSQL**

- **Supabase**: Free tier available
- **Neon**: Free tier available
- **Railway**: Free tier available
- **PlanetScale**: Free tier available

Update your Prisma schema for production:

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

### 4. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test the Application

1. **Home Page**: Navigate to `http://localhost:3000`
2. **Inventory Page**: Navigate to `http://localhost:3000/inventory`
3. **API Endpoints**:

   ```bash
   # Test ping endpoint
   curl http://localhost:3000/api/ping

   # Test inventory endpoint
   curl http://localhost:3000/api/inventory

   # Test inventory sync (requires MAINT_TOKEN)
   curl -X POST http://localhost:3000/api/inventory/sync \
     -H "x-maint-token: $MAINT_TOKEN"
   ```

## 🚀 Vercel Deployment

### Common Vercel Issues & Solutions

#### Issue 1: Build Failures

**Problem**: Build fails with Prisma or database errors

**Solution**:

1. Ensure `DATABASE_URL` is set in Vercel environment variables
2. Add build command override in `vercel.json`:
   ```json
   {
     "buildCommand": "npm run prisma:generate && npm run build"
   }
   ```

#### Issue 2: Database Connection Issues

**Problem**: "Database connection failed" or "Prisma client not generated"

**Solutions**:

1. **Check Environment Variables**:
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Ensure `DATABASE_URL` is set for Production, Preview, and Development
   - Ensure all required environment variables are set

2. **Update Vercel Configuration**:

   ```json
   // vercel.json
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

3. **Add Build Script**:
   ```json
   // package.json
   {
     "scripts": {
       "vercel-build": "prisma generate && prisma migrate deploy && next build"
     }
   }
   ```

#### Issue 3: Function Timeout

**Problem**: API routes timeout on Vercel

**Solution**:

1. Optimize database queries
2. Add caching where appropriate
3. Increase function timeout in `vercel.json`:
   ```json
   {
     "functions": {
       "app/api/**/*.ts": {
         "maxDuration": 30
       }
     }
   }
   ```

### Deployment Steps

1. **Connect to Vercel**:

   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Set Environment Variables**:
   - In Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required variables from your `.env.local`

3. **Deploy**:
   ```bash
   vercel --prod
   ```

## 🗄️ Database Troubleshooting

### Common Database Issues

#### Issue 1: "Database not found" or "Table doesn't exist"

**Solutions**:

1. **Local Development**:

   ```bash
   # Reset and reseed database
   npm run db:reset
   ```

2. **Production**:
   ```bash
   # Deploy migrations
   npm run prisma:migrate
   ```

#### Issue 2: "Prisma Client not generated"

**Solution**:

```bash
npm run prisma:generate
```

#### Issue 3: Migration conflicts

**Solution**:

```bash
# Reset database (WARNING: This will delete all data)
npm run db:reset

# Or create a new migration
npm run prisma:migrate:dev --name fix_migration_name
```

### Database Schema Updates

When you modify the Prisma schema:

1. **Create Migration**:

   ```bash
   npm run prisma:migrate:dev --name describe_your_changes
   ```

2. **Generate Client**:

   ```bash
   npm run prisma:generate
   ```

3. **Deploy to Production**:
   ```bash
   npm run prisma:migrate
   ```

## 🔧 Development Tools

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type check
npm run typecheck
```

### Database Management

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npm run db:reset

# Seed database
npm run db:seed
```

## 🐛 Common Issues & Solutions

### Issue: "Module not found" errors

**Solution**: Clear node_modules and reinstall

```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript errors

**Solution**: Regenerate Prisma client

```bash
npm run prisma:generate
npm run typecheck
```

### Issue: Environment variables not loading

**Solution**:

1. Ensure `.env.local` is in project root
2. Restart development server
3. Check variable names match exactly

### Issue: API routes returning 500 errors

**Solution**:

1. Check server logs: `npm run dev`
2. Verify environment variables are set
3. Check database connection
4. Ensure Prisma client is generated

## 📊 Monitoring & Debugging

### Local Debugging

1. **Check Logs**:

   ```bash
   npm run dev
   # Watch console for errors
   ```

2. **Database Queries**:
   - Prisma logs queries in development
   - Use Prisma Studio: `npx prisma studio`

3. **API Testing**:
   ```bash
   # Test individual endpoints
   curl -v http://localhost:3000/api/ping
   curl -v http://localhost:3000/api/inventory
   ```

### Production Debugging

1. **Vercel Logs**:
   - Go to Vercel Dashboard → Project → Functions
   - Check function logs for errors

2. **Database Monitoring**:
   - Check database provider dashboard
   - Monitor connection limits and usage

## 🚨 Emergency Recovery

If everything breaks:

1. **Reset Everything**:

   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install

   # Reset database
   npm run db:reset

   # Restart dev server
   npm run dev
   ```

2. **Redeploy to Vercel**:
   ```bash
   vercel --prod --force
   ```

## 📞 Getting Help

If you're still having issues:

1. Check the logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure database is accessible and migrations are applied
4. Check Vercel function logs for deployment issues

## 🎯 Next Steps

Once everything is working:

1. Test all API endpoints
2. Verify inventory sync functionality
3. Test responsive design on different devices
4. Run the full test suite
5. Deploy to production and monitor

---

**Happy coding! 🚀**
