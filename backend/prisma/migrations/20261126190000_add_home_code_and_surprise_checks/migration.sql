-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "homeCodeSecret" TEXT;

-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "homeCodeVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "surprise_checks" (
    "id" UUID NOT NULL,
    "visitId" UUID NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "passed" BOOLEAN,
    "distanceMeters" DOUBLE PRECISION,
    "isMocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "surprise_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_display_pairings" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "codeHash" TEXT NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "home_display_pairings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "surprise_checks_visitId_key" ON "surprise_checks"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "home_display_pairings_codeHash_key" ON "home_display_pairings"("codeHash");

-- CreateIndex
CREATE INDEX "home_display_pairings_patientId_idx" ON "home_display_pairings"("patientId");

-- AddForeignKey
ALTER TABLE "surprise_checks" ADD CONSTRAINT "surprise_checks_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_display_pairings" ADD CONSTRAINT "home_display_pairings_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "surprise_checks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "home_display_pairings" ENABLE ROW LEVEL SECURITY;
