# Prisma Setup Documentation

This document explains how to set up and test the Prisma database integration.

## Prisma Models

The following models have been created:

### Commodity

- `id`: Unique identifier (cuid)
- `symbol`: Unique commodity symbol (e.g., "GC", "BDE")
- `name`: Human-readable name
- `category`: Optional category (e.g., "Precious Metals", "Base Metals")

### Station

- `id`: Unique identifier (cuid)
- `code`: Unique station code (e.g., "CI1", "TI1")
- `name`: Station name
- `planet`: Optional planet name
- `system`: Optional system name

### Price

- `id`: Unique identifier (cuid)
- `stationId`: Reference to Station
- `commodityId`: Reference to Commodity
- `ask`: Ask price (Decimal)
- `bid`: Bid price (Decimal)
- `ts`: Timestamp (defaults to now)
- Unique constraint on `stationId + commodityId`

### ProductionOrder

- `id`: Unique identifier (cuid)
- `baseCode`: Base station code
- `building`: Building type
- `recipe`: Production recipe
- `qtyPerBatch`: Quantity per batch
- `cycleSeconds`: Cycle time in seconds
- `efficiencyPct`: Efficiency percentage (defaults to 100)
- `updatedAt`: Last updated timestamp

## Available Scripts

- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Deploy migrations (production)
- `npm run prisma:migrate:dev` - Run migrations in development
- `npm run db:seed` - Run seed script to populate data
- `npm run db:reset` - Reset database and reseed

## How to Test Locally

### Prerequisites

1. PostgreSQL database (local or cloud service like Supabase)
2. Set `DATABASE_URL` in `.env` file

### Steps

1. **Generate Prisma Client**

   ```bash
   npm run prisma:generate
   ```

2. **Run Migrations**

   ```bash
   npm run prisma:migrate:dev
   ```

3. **Seed Database**

   ```bash
   npm run db:seed
   ```

4. **Verify Data**
   - Check that commodities and stations are populated
   - Verify sample price data exists

## CI/CD Integration

The CI workflow includes:

- Prisma client generation in build step
- Database migration deployment in separate job
- Type checking and linting

## Seed Data

### Commodities (21 items)

- Precious Metals: Gold (GC)
- Rare Earth Elements: Beryllium (BDE), Tantalum (TA), Niobium (NB)
- Base Metals: Iron (FE), Aluminum (AL), Copper (CU), Titanium (TI)
- Semiconductors: Silicon (SI)
- Battery Materials: Lithium (LI), Cobalt (CO), Nickel (NI), Manganese (MN)
- Alloy Materials: Chromium (CR), Molybdenum (MO), Vanadium (V), Tungsten (W)
- Nuclear Materials: Uranium (U), Thorium (TH)

### Stations (100+ items)

- Ceres stations: CI1-CI10
- Titan stations: TI1-TI10
- Europa stations: EU1-EU10
- Ganymede stations: GA1-GA10
- Callisto stations: CA1-CA10
- Io stations: IO1-IO10
- Mercury stations: ME1-ME10
- Venus stations: VE1-VE10
- Mars stations: MA1-MA10
- Jupiter stations: JU1-JU10
- Saturn stations: SA1-SA10
- Uranus stations: UR1-UR10
- Neptune stations: NE1-NE10
- Pluto stations: PL1-PL10

### Sample Price Data

- Random prices generated for first 10 commodities across first 20 stations
- Ask prices: base price + 0-10% markup
- Bid prices: base price - 0-10% markdown

## Database Client

The database client is available at `lib/db.ts` and provides:

- Singleton pattern for development hot-reload safety
- Query logging in development
- Proper connection management

## Migration Files

- Initial migration: `prisma/migrations/0_init/migration.sql`
- Creates all tables with proper constraints and indexes
- Includes foreign key relationships with cascade delete
