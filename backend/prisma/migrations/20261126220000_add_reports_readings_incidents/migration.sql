-- CreateEnum
CREATE TYPE "ReadingType" AS ENUM ('BLOOD_PRESSURE', 'HEART_RATE', 'TEMPERATURE', 'BLOOD_GLUCOSE', 'OXYGEN_SATURATION', 'WEIGHT');

-- CreateEnum
CREATE TYPE "ReadingSource" AS ENUM ('CAREGIVER', 'FAMILY');

-- CreateEnum
CREATE TYPE "Wellbeing" AS ENUM ('GOOD', 'OKAY', 'UNWELL');

-- CreateEnum
CREATE TYPE "IncidentCategory" AS ENUM ('FALL', 'MISSED_MEDICATION', 'HEALTH_CHANGE', 'INJURY', 'SAFETY_CONCERN', 'CAREGIVER_ABSENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "visit_reports" (
    "id" UUID NOT NULL,
    "visitId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "wellbeing" "Wellbeing" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visit_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_readings" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "type" "ReadingType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "secondaryValue" DOUBLE PRECISION,
    "unit" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "source" "ReadingSource" NOT NULL,
    "recordedById" UUID NOT NULL,
    "visitId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "reportedById" UUID NOT NULL,
    "category" "IncidentCategory" NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "visit_reports_visitId_key" ON "visit_reports"("visitId");

-- CreateIndex
CREATE INDEX "visit_reports_patientId_createdAt_idx" ON "visit_reports"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "health_readings_patientId_type_measuredAt_idx" ON "health_readings"("patientId", "type", "measuredAt");

-- CreateIndex
CREATE INDEX "incidents_patientId_status_occurredAt_idx" ON "incidents"("patientId", "status", "occurredAt");

-- AddForeignKey
ALTER TABLE "visit_reports" ADD CONSTRAINT "visit_reports_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_reports" ADD CONSTRAINT "visit_reports_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_reports" ADD CONSTRAINT "visit_reports_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_readings" ADD CONSTRAINT "health_readings_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_readings" ADD CONSTRAINT "health_readings_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_readings" ADD CONSTRAINT "health_readings_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "visit_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "health_readings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "incidents" ENABLE ROW LEVEL SECURITY;
