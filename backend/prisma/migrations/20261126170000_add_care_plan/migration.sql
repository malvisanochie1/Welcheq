-- CreateEnum
CREATE TYPE "CareTaskCategory" AS ENUM ('MEDICATION', 'VITALS', 'PERSONAL_CARE', 'MEAL', 'MOBILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskOutcome" AS ENUM ('DONE', 'NOT_DONE');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'Africa/Lagos';

-- CreateTable
CREATE TABLE "care_tasks" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "category" "CareTaskCategory" NOT NULL,
    "instructions" TEXT,
    "minutesAfterMidnight" INTEGER NOT NULL,
    "daysOfWeek" INTEGER[],
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "care_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_records" (
    "id" UUID NOT NULL,
    "careTaskId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "dueDate" DATE NOT NULL,
    "outcome" "TaskOutcome" NOT NULL,
    "note" TEXT,
    "recordedById" UUID NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "care_tasks_patientId_archivedAt_idx" ON "care_tasks"("patientId", "archivedAt");

-- CreateIndex
CREATE INDEX "task_records_patientId_dueDate_idx" ON "task_records"("patientId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "task_records_careTaskId_dueDate_key" ON "task_records"("careTaskId", "dueDate");

-- AddForeignKey
ALTER TABLE "care_tasks" ADD CONSTRAINT "care_tasks_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_tasks" ADD CONSTRAINT "care_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_records" ADD CONSTRAINT "task_records_careTaskId_fkey" FOREIGN KEY ("careTaskId") REFERENCES "care_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_records" ADD CONSTRAINT "task_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_records" ADD CONSTRAINT "task_records_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "care_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_records" ENABLE ROW LEVEL SECURITY;
