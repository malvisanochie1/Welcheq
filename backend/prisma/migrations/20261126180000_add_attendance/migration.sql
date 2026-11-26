-- CreateEnum
CREATE TYPE "AttendanceFlag" AS ENUM ('LATE_ARRIVAL', 'EARLY_DEPARTURE', 'MOCK_LOCATION', 'RECORDED_OFFLINE', 'CHECKED_OUT_AWAY');

-- CreateTable
CREATE TABLE "shifts" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "caregiverId" UUID NOT NULL,
    "seriesId" UUID,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "caregiverId" UUID NOT NULL,
    "shiftId" UUID,
    "openForCaregiverId" UUID,
    "checkInAt" TIMESTAMP(3) NOT NULL,
    "checkInClientAt" TIMESTAMP(3) NOT NULL,
    "checkInLatitude" DOUBLE PRECISION NOT NULL,
    "checkInLongitude" DOUBLE PRECISION NOT NULL,
    "checkInAccuracyMeters" DOUBLE PRECISION NOT NULL,
    "checkInDistanceMeters" DOUBLE PRECISION NOT NULL,
    "checkOutAt" TIMESTAMP(3),
    "checkOutClientAt" TIMESTAMP(3),
    "checkOutLatitude" DOUBLE PRECISION,
    "checkOutLongitude" DOUBLE PRECISION,
    "checkOutAccuracyMeters" DOUBLE PRECISION,
    "checkOutDistanceMeters" DOUBLE PRECISION,
    "flags" "AttendanceFlag"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shifts_patientId_startsAt_idx" ON "shifts"("patientId", "startsAt");

-- CreateIndex
CREATE INDEX "shifts_caregiverId_startsAt_idx" ON "shifts"("caregiverId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "visits_openForCaregiverId_key" ON "visits"("openForCaregiverId");

-- CreateIndex
CREATE INDEX "visits_patientId_checkInAt_idx" ON "visits"("patientId", "checkInAt");

-- CreateIndex
CREATE INDEX "visits_caregiverId_checkInAt_idx" ON "visits"("caregiverId", "checkInAt");

-- CreateIndex
CREATE INDEX "visits_shiftId_idx" ON "visits"("shiftId");

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_openForCaregiverId_fkey" FOREIGN KEY ("openForCaregiverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "shifts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "visits" ENABLE ROW LEVEL SECURITY;
