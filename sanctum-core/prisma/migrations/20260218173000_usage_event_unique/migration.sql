PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

CREATE UNIQUE INDEX "UsageEvent_tsCst_key" ON "UsageEvent" ("tsCst");

COMMIT;
