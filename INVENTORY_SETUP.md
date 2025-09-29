# Inventory Page Setup and Testing

## Overview

The inventory page displays synced inventory data from the API in a responsive, sortable, and filterable table.

## Features

- **Responsive Design**: Works on desktop and mobile devices
- **Search**: Filter by station code, station name, commodity symbol, or commodity name
- **Sorting**: Click column headers to sort by station, commodity, quantity, or last updated
- **Empty State**: Shows helpful message when no inventory data exists
- **Error Handling**: Displays error messages if API calls fail
- **Loading States**: Shows loading indicators while fetching data

## How to Test Locally

### 1. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 2. Ensure Inventory Data Exists

If you don't have inventory data, run the seed script to create sample data:

```bash
npm run db:seed
```

This will create:
- 20 commodities
- 140 stations  
- Sample price data
- Sample inventory data (5 commodities across 3 stations)

### 3. Test the Inventory Page

Navigate to `http://localhost:3000/inventory` to see the inventory table.

### 4. Test API Endpoint Directly

```bash
curl http://localhost:3000/api/inventory
```

This should return JSON data with inventory items including:
- `stationCode`: Station identifier
- `stationName`: Human-readable station name
- `commoditySymbol`: Commodity code
- `commodityName`: Human-readable commodity name
- `qty`: Quantity in inventory
- `updatedAt`: Last update timestamp

### 5. Test Sync Functionality

To sync real inventory data (requires proper environment variables):

```bash
curl -X POST http://localhost:3000/api/inventory/sync \
  -H "x-maint-token: $MAINT_TOKEN"
```

## Testing Features

### Search Functionality
- Type in the search box to filter by station or commodity
- Search is case-insensitive and matches partial strings

### Sorting
- Click column headers to sort ascending/descending
- Visual indicators show current sort direction

### Responsive Design
- Resize browser window to test mobile layout
- Table scrolls horizontally on small screens

### Error States
- Disconnect from internet to test error handling
- API errors show user-friendly error messages

## Technical Implementation

- **Frontend**: Next.js 15 with React 19
- **State Management**: TanStack Query for server state
- **Table**: TanStack Table for advanced table features
- **Styling**: Tailwind CSS for responsive design
- **Data Validation**: Zod schemas for type safety
- **Database**: Prisma with SQLite
- **Testing**: Jest with React Testing Library

## Performance

The page is optimized for performance with:
- Client-side caching via TanStack Query
- Efficient table rendering with TanStack Table
- Responsive images and optimized fonts
- Minimal JavaScript bundle size

Expected Lighthouse scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+