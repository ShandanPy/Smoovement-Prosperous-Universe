import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { syncInventory } from '@/lib/inventory/syncInventory';

export async function POST(req: Request) {
  // Check for maintenance token
  if (req.headers.get('x-maint-token') !== env.MAINT_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncInventory({ username: env.PU_USERNAME });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('Inventory sync failed:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
