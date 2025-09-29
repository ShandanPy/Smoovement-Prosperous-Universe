import { POST } from '@/app/api/inventory/sync/route';
import { syncInventory } from '@/lib/inventory/syncInventory';

// Mock dependencies
jest.mock('@/lib/inventory/syncInventory');
jest.mock('@/lib/env', () => ({
  env: {
    MAINT_TOKEN: 'test-maint-token',
    PU_USERNAME: 'test-username',
  },
}));

const mockSyncInventory = syncInventory as jest.MockedFunction<typeof syncInventory>;

describe('/api/inventory/sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when maint token is missing', async () => {
    const request = new Request('http://localhost:3000/api/inventory/sync', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ ok: false, error: 'Unauthorized' });
    expect(mockSyncInventory).not.toHaveBeenCalled();
  });

  it('should return 401 when maint token is incorrect', async () => {
    const request = new Request('http://localhost:3000/api/inventory/sync', {
      method: 'POST',
      headers: {
        'x-maint-token': 'wrong-token',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ ok: false, error: 'Unauthorized' });
    expect(mockSyncInventory).not.toHaveBeenCalled();
  });

  it('should return 200 with updated count when token is correct', async () => {
    mockSyncInventory.mockResolvedValue({ updated: 5 });

    const request = new Request('http://localhost:3000/api/inventory/sync', {
      method: 'POST',
      headers: {
        'x-maint-token': 'test-maint-token',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true, updated: 5 });
    expect(mockSyncInventory).toHaveBeenCalledWith({ username: 'test-username' });
  });

  it('should return 500 when sync fails', async () => {
    mockSyncInventory.mockRejectedValue(new Error('Sync failed'));

    const request = new Request('http://localhost:3000/api/inventory/sync', {
      method: 'POST',
      headers: {
        'x-maint-token': 'test-maint-token',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ ok: false, error: 'Sync failed' });
  });

  it('should handle unknown errors', async () => {
    mockSyncInventory.mockRejectedValue('Unknown error');

    const request = new Request('http://localhost:3000/api/inventory/sync', {
      method: 'POST',
      headers: {
        'x-maint-token': 'test-maint-token',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ ok: false, error: 'Unknown error' });
  });
});
