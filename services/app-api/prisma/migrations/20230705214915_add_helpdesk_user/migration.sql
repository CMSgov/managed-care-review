BEGIN;
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'HELPDESK_USER';

-- AlterTable
ALTER TABLE "UserAudit" ALTER COLUMN "updatedAt" DROP DEFAULT;
COMMIT;
