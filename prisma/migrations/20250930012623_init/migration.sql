-- CreateTable
CREATE TABLE "commodities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT
);

-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "planet" TEXT,
    "system" TEXT
);

-- CreateTable
CREATE TABLE "prices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stationId" TEXT NOT NULL,
    "commodityId" TEXT NOT NULL,
    "ask" DECIMAL,
    "bid" DECIMAL,
    "ts" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prices_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prices_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "commodities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "production_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "baseCode" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "recipe" TEXT NOT NULL,
    "qtyPerBatch" INTEGER NOT NULL,
    "cycleSeconds" INTEGER NOT NULL,
    "efficiencyPct" INTEGER NOT NULL DEFAULT 100,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stationId" TEXT NOT NULL,
    "commodityId" TEXT NOT NULL,
    "qty" DECIMAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "inventory_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inventory_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "commodities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "commodities_symbol_key" ON "commodities"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "stations_code_key" ON "stations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "prices_stationId_commodityId_key" ON "prices"("stationId", "commodityId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_stationId_commodityId_key" ON "inventory"("stationId", "commodityId");
