-- AlterTable: add optional slug column to Company
ALTER TABLE "Company" ADD COLUMN "slug" TEXT;

-- CreateIndex: unique constraint
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex: for fast lookup
CREATE INDEX "Company_slug_idx" ON "Company"("slug");
