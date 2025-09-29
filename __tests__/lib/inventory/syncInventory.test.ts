import { getInventory } from '@/lib/fioClient';

// Mock dependencies
jest.mock('@/lib/fioClient');

const mockGetInventory = getInventory as jest.MockedFunction<typeof getInventory>;

// Mock Prisma client methods
const mockStationFindUnique = jest.fn();
const mockCommodityFindUnique = jest.fn();
const mockInventoryUpsert = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    station: {
      findUnique: mockStationFindUnique,
    },
    commodity: {
      findUnique: mockCommodityFindUnique,
    },
    inventory: {
      upsert: mockInventoryUpsert,
    },
  })),
}));

// Import after mocking
const { syncInventory } = require('@/lib/inventory/syncInventory');

describe('syncInventory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sync inventory data successfully', async () => {
    // Mock FIO response
    const mockFioResponse = [
      {
        stationCode: 'STATION1',
        commoditySymbol: 'COMM1',
        qty: 100,
      },
      {
        stationCode: 'STATION2',
        commoditySymbol: 'COMM2',
        qty: 50,
      },
    ];

    mockGetInventory.mockResolvedValue(mockFioResponse);

    // Mock database responses
    mockStationFindUnique
      .mockResolvedValueOnce({ id: 'station1-id', code: 'STATION1' } as any)
      .mockResolvedValueOnce({ id: 'station2-id', code: 'STATION2' } as any);

    mockCommodityFindUnique
      .mockResolvedValueOnce({ id: 'comm1-id', symbol: 'COMM1' } as any)
      .mockResolvedValueOnce({ id: 'comm2-id', symbol: 'COMM2' } as any);

    mockInventoryUpsert.mockResolvedValueOnce({} as any).mockResolvedValueOnce({} as any);

    const result = await syncInventory({ username: 'test-user' });

    expect(result).toEqual({ updated: 2 });
    expect(mockGetInventory).toHaveBeenCalledWith('test-user');
    expect(mockInventoryUpsert).toHaveBeenCalledTimes(2);
  });

  it('should handle missing stations gracefully', async () => {
    const mockFioResponse = [
      {
        stationCode: 'MISSING_STATION',
        commoditySymbol: 'COMM1',
        qty: 100,
      },
    ];

    mockGetInventory.mockResolvedValue(mockFioResponse);
    mockStationFindUnique.mockResolvedValue(null);

    const result = await syncInventory({ username: 'test-user' });

    expect(result).toEqual({ updated: 0 });
    expect(mockInventoryUpsert).not.toHaveBeenCalled();
  });

  it('should handle missing commodities gracefully', async () => {
    const mockFioResponse = [
      {
        stationCode: 'STATION1',
        commoditySymbol: 'MISSING_COMM',
        qty: 100,
      },
    ];

    mockGetInventory.mockResolvedValue(mockFioResponse);
    mockStationFindUnique.mockResolvedValue({ id: 'station1-id', code: 'STATION1' } as any);
    mockCommodityFindUnique.mockResolvedValue(null);

    const result = await syncInventory({ username: 'test-user' });

    expect(result).toEqual({ updated: 0 });
    expect(mockInventoryUpsert).not.toHaveBeenCalled();
  });

  it('should be idempotent - running multiple times produces same result', async () => {
    const mockFioResponse = [
      {
        stationCode: 'STATION1',
        commoditySymbol: 'COMM1',
        qty: 100,
      },
    ];

    mockGetInventory.mockResolvedValue(mockFioResponse);
    mockStationFindUnique.mockResolvedValue({ id: 'station1-id', code: 'STATION1' } as any);
    mockCommodityFindUnique.mockResolvedValue({ id: 'comm1-id', symbol: 'COMM1' } as any);
    mockInventoryUpsert.mockResolvedValue({} as any);

    // Run sync twice
    const result1 = await syncInventory({ username: 'test-user' });
    const result2 = await syncInventory({ username: 'test-user' });

    expect(result1).toEqual({ updated: 1 });
    expect(result2).toEqual({ updated: 1 });
    expect(mockInventoryUpsert).toHaveBeenCalledTimes(2);
  });

  it('should propagate FIO API errors', async () => {
    mockGetInventory.mockRejectedValue(new Error('FIO API error'));

    await expect(syncInventory({ username: 'test-user' })).rejects.toThrow('FIO API error');
  });
});
