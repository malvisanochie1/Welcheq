-- CreateEnum
CREATE TYPE "CallOutcome" AS ENUM ('REACHED', 'UNREACHABLE');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "daily_calls" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "callerId" UUID NOT NULL,
    "callDate" DATE NOT NULL,
    "outcome" "CallOutcome" NOT NULL,
    "answers" JSONB NOT NULL,
    "mismatchCount" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_calls_patientId_callDate_idx" ON "daily_calls"("patientId", "callDate");

-- AddForeignKey
ALTER TABLE "daily_calls" ADD CONSTRAINT "daily_calls_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_calls" ADD CONSTRAINT "daily_calls_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "daily_calls" ENABLE ROW LEVEL SECURITY;
