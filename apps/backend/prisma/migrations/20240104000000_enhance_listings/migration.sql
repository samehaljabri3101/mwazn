-- AlterTable: add slug, price range, tags, certifications, leadTime, viewCount to Listing
ALTER TABLE "Listing" ADD COLUMN "slug" TEXT;
ALTER TABLE "Listing" ADD COLUMN "priceTo" DECIMAL(12,2);
ALTER TABLE "Listing" ADD COLUMN "leadTimeDays" INTEGER;
ALTER TABLE "Listing" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Listing" ADD COLUMN "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Listing" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");
CREATE INDEX "Listing_slug_idx" ON "Listing"("slug");
