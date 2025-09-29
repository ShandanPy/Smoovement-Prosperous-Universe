import { GET } from '@/app/api/inventory/route';
import { db } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    inventory: {
      findMany: jest.fn(),
    },
  },
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockFindMany = mockDb.inventory.findMany as jest.MockedFunction<
  typeof mockDb.inventory.findMany
>;

describe('/api/inventory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return inventory data with station and commodity info', async () => {
    const mockInventory = [
      {
        id: '1',
        stationId: 'station-1',
        commodityId: 'commodity-1',
        qty: new Decimal(100),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        station: {
          code: 'STN-001',
          name: 'Test Station',
        },
        commodity: {
          symbol: 'IRON',
          name: 'Iron Ore',
        },
      },
      {
        id: '2',
        stationId: 'station-2',
        commodityId: 'commodity-2',
        qty: new Decimal(50),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        station: {
          code: 'STN-002',
          name: 'Another Station',
        },
        commodity: {
          symbol: 'COPPER',
          name: 'Copper Ore',
        },
      },
    ];

    mockFindMany.mockResolvedValue(mockInventory);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([
      {
        stationCode: 'STN-001',
        stationName: 'Test Station',
        commoditySymbol: 'IRON',
        commodityName: 'Iron Ore',
        qty: 100,
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        stationCode: 'STN-002',
        stationName: 'Another Station',
        commoditySymbol: 'COPPER',
        commodityName: 'Copper Ore',
        qty: 50,
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    ]);

    expect(mockFindMany).toHaveBeenCalledWith({
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
  });

  it('should return empty array when no inventory exists', async () => {
    mockFindMany.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it('should handle database errors', async () => {
    const error = new Error('Database connection failed');
    mockFindMany.mockRejectedValue(error);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Database connection failed',
    });
  });

  it('should handle unknown errors', async () => {
    mockFindMany.mockRejectedValue('Unknown error');

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to fetch inventory',
    });
  });
});
