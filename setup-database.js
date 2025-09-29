#!/usr/bin/env node

/**
 * Quick database setup script for Supabase
 * Run this after setting up your environment variables
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function setupDatabase() {
  console.log('🚀 Setting up database...');
  
  try {
    // Test connection
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Check if tables exist
    console.log('🔍 Checking database schema...');
    const commodityCount = await prisma.commodity.count();
    const stationCount = await prisma.station.count();
    
    console.log(`📊 Found ${commodityCount} commodities and ${stationCount} stations`);
    
    if (commodityCount === 0 || stationCount === 0) {
      console.log('🌱 Database appears empty, running seed script...');
      execSync('npm run db:seed', { stdio: 'inherit' });
      console.log('✅ Database seeded successfully!');
    } else {
      console.log('✅ Database already has data!');
    }
    
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.message.includes('relation') || error.message.includes('does not exist')) {
      console.log('💡 Running migrations...');
      try {
        execSync('npm run prisma:migrate:dev', { stdio: 'inherit' });
        console.log('✅ Migrations completed!');
        
        console.log('🌱 Seeding database...');
        execSync('npm run db:seed', { stdio: 'inherit' });
        console.log('✅ Database seeded successfully!');
        
      } catch (migrationError) {
        console.error('❌ Migration failed:', migrationError.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();