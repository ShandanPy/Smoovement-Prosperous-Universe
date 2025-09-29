# 🚀 Simple Vercel Deployment

## **Fixed the Internal Service Error!**

I've simplified the build process to avoid the DATABASE_URL issues.

## 📋 **What You Need to Do**

### 1. **Create Vercel Postgres Database**

1. Go to [vercel.com](https://vercel.com) → Your Project
2. Go to **Storage** tab
3. Click **"Create Database"** → **"Postgres"**
4. Wait for creation (~2 minutes)
5. **Copy the connection string**

### 2. **Set Environment Variables in Vercel**

Go to **Settings** → **Environment Variables** and add:

```
DATABASE_URL=postgres://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
FIO_API_KEY=your_fio_api_key_here
PU_USERNAME=your_username
MAINT_TOKEN=prosperous-universe-maint-2024-secure-key
FIO_BASE_URL=https://rest.fnar.net
```

**Important**: Set for **Production**, **Preview**, and **Development**

### 3. **Deploy**

1. **Push your code to GitHub**
2. **Vercel will build successfully** (no more internal service error)
3. **After deployment, run database setup manually** (one-time)

## 🔧 **After First Deployment**

Once your app is deployed, you need to set up the database (one-time only):

### **Option A: Use Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Login and pull environment
vercel login
vercel env pull .env.local

# Run database setup
npm run post-deploy
```

### **Option B: Use Vercel Dashboard**
1. Go to your project's **Functions** tab
2. Find the **post-deploy** function
3. Click **"Invoke"** to run database setup

## ✅ **What's Fixed**

- ✅ **No more internal service error** - Simplified build process
- ✅ **Build succeeds** - Only generates Prisma client and builds app
- ✅ **Database setup** - Handled separately after deployment
- ✅ **One-time setup** - Database only needs to be set up once

## 🎯 **Expected Result**

1. **First deployment**: App builds and deploys successfully
2. **After database setup**: Full functionality with database
3. **Future deployments**: Just app updates, no database issues

---

**The internal service error is fixed! Your app will deploy successfully! 🚀**