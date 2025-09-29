-- CreateTable
CREATE TABLE "public"."commodities" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "commodities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "planet" TEXT,
    "system" TEXT,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prices" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "commodityId" TEXT NOT NULL,
    "ask" DECIMAL(65,30),
    "bid" DECIMAL(65,30),
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."production_orders" (
    "id" TEXT NOT NULL,
    "baseCode" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "recipe" TEXT NOT NULL,
    "qtyPerBatch" INTEGER NOT NULL,
    "cycleSeconds" INTEGER NOT NULL,
    "efficiencyPct" INTEGER NOT NULL DEFAULT 100,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "commodityId" TEXT NOT NULL,
    "qty" DECIMAL(65,30) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commodities_symbol_key" ON "public"."commodities"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "stations_code_key" ON "public"."stations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "prices_stationId_commodityId_key" ON "public"."prices"("stationId", "commodityId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_stationId_commodityId_key" ON "public"."inventory"("stationId", "commodityId");

-- AddForeignKey
ALTER TABLE "public"."prices" ADD CONSTRAINT "prices_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "public"."stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prices" ADD CONSTRAINT "prices_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "public"."commodities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory" ADD CONSTRAINT "inventory_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "public"."stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory" ADD CONSTRAINT "inventory_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "public"."commodities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
