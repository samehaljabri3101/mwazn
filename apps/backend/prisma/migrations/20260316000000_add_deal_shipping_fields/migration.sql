-- Add fulfillment/shipping fields to Deal
ALTER TABLE "Deal" ADD COLUMN "trackingNumber" TEXT;
ALTER TABLE "Deal" ADD COLUMN "carrierName"    TEXT;
ALTER TABLE "Deal" ADD COLUMN "shippedAt"      TIMESTAMP(3);
ALTER TABLE "Deal" ADD COLUMN "deliveredAt"    TIMESTAMP(3);
