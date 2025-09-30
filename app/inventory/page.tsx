'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { useInventory, type InventoryItem } from '@/lib/hooks/useInventory';

function SyncInventoryButton() {
  const queryClient = useQueryClient();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const syncMutation = useMutation({
    mutationFn: async () => {
      // Note: In a real app, you'd get the token from a secure place
      // For now, we'll need to pass it somehow (see security note below)
      const response = await fetch('/api/inventory/sync', {
        method: 'POST',
        headers: {
          'x-maint-token': process.env.NEXT_PUBLIC_MAINT_TOKEN || '',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch inventory data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setLastSyncTime(new Date());
      console.log(`✅ Synced ${data.updated} inventory items from FIO`);
    },
  });

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
      <button
        onClick={() => syncMutation.mutate()}
        disabled={syncMutation.isPending}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {syncMutation.isPending ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Syncing from FIO...
          </>
        ) : (
          <>🔄 Sync from FIO</>
        )}
      </button>

      {lastSyncTime && (
        <span className="text-sm text-gray-600">
          Last synced: {lastSyncTime.toLocaleTimeString()}
        </span>
      )}

      {syncMutation.isError && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          ❌ {syncMutation.error instanceof Error ? syncMutation.error.message : 'Sync failed'}
        </div>
      )}

      {syncMutation.isSuccess && syncMutation.data && (
        <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">
          ✅ Synced {syncMutation.data.updated} items
        </div>
      )}
    </div>
  );
}

const columnHelper = createColumnHelper<InventoryItem>();

export default function InventoryPage() {
  const { data: inventory, isLoading, error } = useInventory();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo(
    () => [
      columnHelper.accessor('stationCode', {
        header: 'Station',
        cell: (info) => (
          <div>
            <div className="font-medium">{info.getValue()}</div>
            <div className="text-sm text-gray-500">{info.row.original.stationName}</div>
          </div>
        ),
      }),
      columnHelper.accessor('commoditySymbol', {
        header: 'Commodity',
        cell: (info) => (
          <div>
            <div className="font-medium">{info.getValue()}</div>
            <div className="text-sm text-gray-500">{info.row.original.commodityName}</div>
          </div>
        ),
      }),
      columnHelper.accessor('qty', {
        header: 'Quantity',
        cell: (info) => (
          <div className="text-right font-mono">{info.getValue().toLocaleString()}</div>
        ),
      }),
      columnHelper.accessor('updatedAt', {
        header: 'Last Updated',
        cell: (info) => (
          <div className="text-sm text-gray-600">{new Date(info.getValue()).toLocaleString()}</div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: inventory || [],
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Inventory</h2>
              <p className="text-gray-600 mb-4">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!inventory || inventory.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Inventory Yet</h2>
              <p className="text-gray-600 mb-6">
                Click the button below to sync your inventory from FIO.
              </p>
              <SyncInventoryButton />
              <div className="mt-6 bg-gray-100 rounded-lg p-4 text-left max-w-md mx-auto">
                <p className="text-sm text-gray-700 mb-2">Or sync via command line:</p>
                <code className="text-xs bg-gray-200 px-2 py-1 rounded block">
                  curl -X POST http://localhost:3000/api/inventory/sync -H &quot;x-maint-token:
                  $MAINT_TOKEN&quot;
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                <p className="text-gray-600 mt-1">
                  {inventory.length} item{inventory.length !== 1 ? 's' : ''} across your stations
                </p>
              </div>
              <SyncInventoryButton />
            </div>
          </div>

          <div className="p-6">
            {/* Search Input */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by station or commodity..."
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center space-x-1">
                            <span>
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            {header.column.getIsSorted() === 'asc' && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            )}
                            {header.column.getIsSorted() === 'desc' && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                              </svg>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Results Summary */}
            <div className="mt-4 text-sm text-gray-500">
              Showing {table.getFilteredRowModel().rows.length} of {inventory.length} items
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
