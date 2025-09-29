import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// Zod schema for inventory item
const InventoryItemSchema = z.object({
  stationCode: z.string(),
  stationName: z.string(),
  commoditySymbol: z.string(),
  commodityName: z.string(),
  qty: z.number(),
  updatedAt: z.string(),
});

export type InventoryItem = z.infer<typeof InventoryItemSchema>;

// Zod schema for the entire inventory response
const InventoryResponseSchema = z.array(InventoryItemSchema);

async function fetchInventory(): Promise<InventoryItem[]> {
  const response = await fetch('/api/inventory');

  if (!response.ok) {
    throw new Error(`Failed to fetch inventory: ${response.statusText}`);
  }

  const data = await response.json();
  return InventoryResponseSchema.parse(data);
}

export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
