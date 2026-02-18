-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'P3',
    "revenueImpact" TEXT NOT NULL DEFAULT 'LOW',
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedBy" TEXT,
    "blockReason" TEXT,
    "type" TEXT NOT NULL DEFAULT 'ONE_OFF',
    "repeatIntervalDays" INTEGER,
    "dueAt" DATETIME,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "closedAt" DATETIME
);

-- CreateTable
CREATE TABLE "DailySignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "utcDate" TEXT NOT NULL,
    "openingLine" TEXT NOT NULL,
    "reflectionLine" TEXT NOT NULL,
    "feedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tsCst" DATETIME NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "estimatedCost" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "DailySignal_utcDate_key" ON "DailySignal"("utcDate");
