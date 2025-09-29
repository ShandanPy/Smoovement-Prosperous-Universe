import { PrismaClient } from '@prisma/client';
import { getInventory } from '../fioClient';

const prisma = new PrismaClient();

export interface SyncInventoryOptions {
  username: string;
}

export interface SyncInventoryResult {
  updated: number;
}

/**
 * FIO inventory item structure
 */
interface FioInventoryItem {
  stationCode: string;
  commoditySymbol: string;
  qty: number;
}

/**
 * Raw FIO inventory response item
 */
interface FioInventoryResponseItem {
  stationCode: string;
  commoditySymbol: string;
  qty: number;
}

/**
 * Sync inventory data from FIO to the database
 * This function is idempotent - running it multiple times won't create duplicates
 */
export async function syncInventory(options: SyncInventoryOptions): Promise<SyncInventoryResult> {
  const { username } = options;

  // Fetch inventory data from FIO
  const fioInventory = await getInventory(username);

  // Map FIO payload to our expected format
  const inventoryItems: FioInventoryItem[] = fioInventory.map((item: FioInventoryResponseItem) => ({
    stationCode: item.stationCode,
    commoditySymbol: item.commoditySymbol,
    qty: item.qty,
  }));

  let updatedCount = 0;

  // Process each inventory item
  for (const item of inventoryItems) {
    // Resolve station and commodity IDs
    const station = await prisma.station.findUnique({
      where: { code: item.stationCode },
    });

    const commodity = await prisma.commodity.findUnique({
      where: { symbol: item.commoditySymbol },
    });

    if (!station) {
      console.warn(`Station not found: ${item.stationCode}`);
      continue;
    }

    if (!commodity) {
      console.warn(`Commodity not found: ${item.commoditySymbol}`);
      continue;
    }

    // Upsert inventory record
    await prisma.inventory.upsert({
      where: {
        stationId_commodityId: {
          stationId: station.id,
          commodityId: commodity.id,
        },
      },
      update: {
        qty: item.qty,
      },
      create: {
        stationId: station.id,
        commodityId: commodity.id,
        qty: item.qty,
      },
    });

    updatedCount++;
  }

  return { updated: updatedCount };
}
