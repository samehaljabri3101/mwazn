-- AlterTable: add filename to ListingImage
ALTER TABLE "ListingImage" ADD COLUMN "filename" TEXT NOT NULL DEFAULT '';
