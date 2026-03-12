-- Add CUSTOMER to Role enum
ALTER TYPE "Role" ADD VALUE 'CUSTOMER';

-- Make crNumber nullable (CUSTOMER has no CR)
ALTER TABLE "Company" ALTER COLUMN "crNumber" DROP NOT NULL;

-- Add isFreelancer flag to Company
ALTER TABLE "Company" ADD COLUMN "isFreelancer" BOOLEAN NOT NULL DEFAULT false;
