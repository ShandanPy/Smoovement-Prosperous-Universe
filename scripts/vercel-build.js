#!/usr/bin/env node

/**
 * Vercel build script that handles missing environment variables gracefully
 */

import { execSync } from 'child_process';

async function vercelBuild() {
  console.log('🚀 Starting Vercel build...');

  try {
    // Always generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated');

    // Check if DATABASE_URL is available
    if (process.env.DATABASE_URL) {
      console.log('🗄️ DATABASE_URL found, running migrations...');
      try {
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        console.log('✅ Migrations completed');
      } catch (migrationError) {
        console.warn(
          '⚠️ Migration failed, but continuing build:',
          migrationError.message
        );
      }
    } else {
      console.log('⚠️ DATABASE_URL not found, skipping migrations');
      console.log(
        '💡 Make sure to set DATABASE_URL in Vercel environment variables'
      );
    }

    // Build Next.js app
    console.log('🏗️ Building Next.js application...');
    execSync('npx next build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

vercelBuild();