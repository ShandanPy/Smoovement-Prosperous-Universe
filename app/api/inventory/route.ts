import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const inventory = await db.inventory.findMany({
      include: {
        station: {
          select: {
            code: true,
            name: true,
          },
        },
        commodity: {
          select: {
            symbol: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const formattedInventory = inventory.map((item) => ({
      stationCode: item.station.code,
      stationName: item.station.name,
      commoditySymbol: item.commodity.symbol,
      commodityName: item.commodity.name,
      qty: Number(item.qty),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedInventory);
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch inventory',
      },
      { status: 500 }
    );
  }
}
