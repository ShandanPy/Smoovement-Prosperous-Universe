#!/usr/bin/env node

/**
 * Post-deployment script to set up database
 * This runs after the app is deployed to set up the database
 */

import { execSync } from 'child_process';

async function postDeploy() {
  console.log('🚀 Running post-deployment setup...');

  try {
    // Check if DATABASE_URL is available
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
      console.log('🗄️ DATABASE_URL found, setting up database...');

      try {
        // Run migrations
        console.log('📦 Running database migrations...');
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        console.log('✅ Migrations completed');

        // Check if we need to seed data
        console.log('🌱 Checking if database needs seeding...');
        try {
          execSync('npx prisma db seed', { stdio: 'inherit' });
          console.log('✅ Database seeded');
        } catch (seedError) {
          console.log('ℹ️ Database already has data or seeding not needed');
        }
      } catch (error) {
        console.warn('⚠️ Database setup failed:', error.message);
        console.log('💡 This might be normal if database is already set up');
      }
    } else {
      console.log('⚠️ DATABASE_URL not found, skipping database setup');
    }

    console.log('🎉 Post-deployment setup completed!');
  } catch (error) {
    console.error('❌ Post-deployment setup failed:', error.message);
    // Don't exit with error - this shouldn't break the deployment
  }
}

postDeploy();
