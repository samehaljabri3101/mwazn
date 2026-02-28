-- Migration: add_notifications_invites
-- Adds Notification and RFQInvite models, updates Rating unique constraint,
-- updates Deal.rating -> ratings (one-to-many)

-- CreateTable: Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "bodyAr" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Notification userId+isRead
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- AddForeignKey: Notification -> User
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: RFQInvite
CREATE TABLE "RFQInvite" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RFQInvite_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex: RFQInvite rfqId+supplierId
CREATE UNIQUE INDEX "RFQInvite_rfqId_supplierId_key" ON "RFQInvite"("rfqId", "supplierId");

-- AddForeignKey: RFQInvite -> RFQ
ALTER TABLE "RFQInvite" ADD CONSTRAINT "RFQInvite_rfqId_fkey"
    FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: RFQInvite -> Company
ALTER TABLE "RFQInvite" ADD CONSTRAINT "RFQInvite_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropUniqueIndex on Rating.dealId (was @unique, now part of @@unique([dealId, raterId]))
DROP INDEX IF EXISTS "Rating_dealId_key";

-- CreateUniqueIndex: Rating dealId+raterId (two-way ratings)
CREATE UNIQUE INDEX "Rating_dealId_raterId_key" ON "Rating"("dealId", "raterId");
