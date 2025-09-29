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
CREATE UNIQUE INDEX "inventory_stationId_commodityId_key" ON "inventory"("stationId", "commodityId");
