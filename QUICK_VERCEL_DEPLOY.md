# Quick Vercel Deploy - No Local Setup Required

This guide shows you how to deploy directly to Vercel without any local configuration. Perfect if you just want to get your app running in the cloud!

## 🚀 Deploy in 3 Steps

### Step 1: Connect Your Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project

### Step 2: Set Up Database (Vercel Postgres)

1. In your Vercel project dashboard, go to **Storage**
2. Click **"Create Database"** → **"Postgres"**
3. Wait for it to be created (takes ~2 minutes)
4. Copy the connection string (it looks like: `postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres`)

### Step 3: Configure Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

```
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
FIO_API_KEY=your_fio_api_key_here
PU_USERNAME=your_username
MAINT_TOKEN=your_token_here
```

3. Make sure to set them for **Production**, **Preview**, and **Development**

## 🔧 Update Configuration Files

You need to make a few small changes to your code for Vercel deployment:

### 1. Update `vercel.json`

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run prisma:generate && npm run prisma:migrate && npm run build",
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

### 2. Update `prisma/schema.prisma`

Change the database provider from SQLite to PostgreSQL:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}

// ... rest of your models stay the same
```

### 3. Add Build Script to `package.json`

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

## 🚀 Deploy!

1. **Commit and push your changes** to GitHub
2. Vercel will automatically detect the changes and redeploy
3. Your app will be live at `https://your-project.vercel.app`

## 🧪 Test Your Deployment

Once deployed, test these endpoints:

```bash
# Test if the app is running
curl https://your-project.vercel.app/api/ping

# Test if database is connected
curl https://your-project.vercel.app/api/inventory

# Test inventory sync (requires MAINT_TOKEN)
curl -X POST https://your-project.vercel.app/api/inventory/sync \
  -H "x-maint-token: your_token_here"
```

## 🎯 That's It!

Your app is now:

- ✅ Deployed on Vercel
- ✅ Connected to a PostgreSQL database
- ✅ Database tables created automatically
- ✅ Sample data seeded
- ✅ Environment variables configured

## 🔄 Making Changes

After your initial deployment:

1. **Make code changes** in your repository
2. **Push to GitHub**
3. **Vercel automatically redeploys** (takes ~2-3 minutes)

No local setup required!

## 🐛 If Something Goes Wrong

### Check Vercel Logs:

1. Go to Vercel Dashboard → Your Project → **Functions**
2. Click on any failed function to see error logs

### Common Issues:

- **Build fails**: Check that `DATABASE_URL` is set in environment variables
- **Database errors**: Verify the connection string is correct
- **API errors**: Make sure `FIO_API_KEY`, `PU_USERNAME`, and `MAINT_TOKEN` are set

### Quick Fix:

If you need to make changes, just:

1. Edit files in GitHub (or locally and push)
2. Vercel redeploys automatically
3. Check the deployment logs if there are issues

---

**No local development environment needed! Everything runs in the cloud.** 🎉
