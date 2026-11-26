-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "selfiePath" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "visits_selfiePath_key" ON "visits"("selfiePath");
