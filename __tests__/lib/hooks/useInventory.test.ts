import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInventory } from '@/lib/hooks/useInventory';

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
};

describe('useInventory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and return inventory data', async () => {
    const mockInventory = [
      {
        stationCode: 'STN-001',
        stationName: 'Test Station',
        commoditySymbol: 'IRON',
        commodityName: 'Iron Ore',
        qty: 100,
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockInventory,
    } as Response);

    const { result } = renderHook(() => useInventory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockInventory);
    expect(mockFetch).toHaveBeenCalledWith('/api/inventory');
  });

  it('should handle API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    } as Response);

    const { result } = renderHook(() => useInventory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(
      new Error('Failed to fetch inventory: Internal Server Error')
    );
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useInventory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(new Error('Network error'));
  });

  it('should handle invalid response data', async () => {
    const invalidData = [
      {
        stationCode: 'STN-001',
        // Missing required fields
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => invalidData,
    } as Response);

    const { result } = renderHook(() => useInventory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
