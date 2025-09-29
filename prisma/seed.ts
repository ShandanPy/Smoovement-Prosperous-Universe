import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Load fixtures
  const commoditiesData = JSON.parse(
    readFileSync(join(__dirname, 'fixtures', 'commodities.json'), 'utf-8')
  );
  const stationsData = JSON.parse(
    readFileSync(join(__dirname, 'fixtures', 'stations.json'), 'utf-8')
  );

  // Seed commodities
  console.log('📦 Seeding commodities...');
  for (const commodity of commoditiesData) {
    await prisma.commodity.upsert({
      where: { symbol: commodity.symbol },
      update: commodity,
      create: commodity,
    });
  }
  console.log(`✅ Seeded ${commoditiesData.length} commodities`);

  // Seed stations
  console.log('🏭 Seeding stations...');
  for (const station of stationsData) {
    await prisma.station.upsert({
      where: { code: station.code },
      update: station,
      create: station,
    });
  }
  console.log(`✅ Seeded ${stationsData.length} stations`);

  // Create some sample price data
  console.log('💰 Creating sample price data...');
  const commodities = await prisma.commodity.findMany();
  const stations = await prisma.station.findMany();

  // Create prices for a subset of commodities and stations
  const sampleCommodities = commodities.slice(0, 10); // First 10 commodities
  const sampleStations = stations.slice(0, 20); // First 20 stations

  for (const commodity of sampleCommodities) {
    for (const station of sampleStations) {
      // Random price between 1 and 1000
      const basePrice = Math.random() * 999 + 1;
      const ask = basePrice * (1 + Math.random() * 0.1); // 0-10% markup
      const bid = basePrice * (1 - Math.random() * 0.1); // 0-10% markdown

      await prisma.price.upsert({
        where: {
          stationId_commodityId: {
            stationId: station.id,
            commodityId: commodity.id,
          },
        },
        update: {
          ask,
          bid,
          ts: new Date(),
        },
        create: {
          stationId: station.id,
          commodityId: commodity.id,
          ask,
          bid,
        },
      });
    }
  }
  console.log(
    `✅ Created price data for ${sampleCommodities.length} commodities across ${sampleStations.length} stations`
  );

  // Create some sample inventory data
  console.log('📦 Creating sample inventory data...');
  const sampleInventoryCommodities = commodities.slice(0, 5); // First 5 commodities
  const sampleInventoryStations = stations.slice(0, 3); // First 3 stations

  for (const commodity of sampleInventoryCommodities) {
    for (const station of sampleInventoryStations) {
      // Random quantity between 0 and 10000
      const qty = Math.floor(Math.random() * 10000);

      await prisma.inventory.upsert({
        where: {
          stationId_commodityId: {
            stationId: station.id,
            commodityId: commodity.id,
          },
        },
        update: {
          qty,
          updatedAt: new Date(),
        },
        create: {
          stationId: station.id,
          commodityId: commodity.id,
          qty,
        },
      });
    }
  }
  console.log(
    `✅ Created inventory data for ${sampleInventoryCommodities.length} commodities across ${sampleInventoryStations.length} stations`
  );

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
