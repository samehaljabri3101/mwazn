-- CreateTable
CREATE TABLE "RfqImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "rfqId" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RfqImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RfqImage_rfqId_idx" ON "RfqImage"("rfqId");

-- AddForeignKey
ALTER TABLE "RfqImage" ADD CONSTRAINT "RfqImage_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;
