-- CreateTable
CREATE TABLE "caregiver_reviews" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "caregiverId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caregiver_reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "caregiver_reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5)
);

-- CreateIndex
CREATE UNIQUE INDEX "caregiver_reviews_patientId_caregiverId_reviewerId_key" ON "caregiver_reviews"("patientId", "caregiverId", "reviewerId");

-- CreateIndex
CREATE INDEX "caregiver_reviews_caregiverId_updatedAt_idx" ON "caregiver_reviews"("caregiverId", "updatedAt");

-- AddForeignKey
ALTER TABLE "caregiver_reviews" ADD CONSTRAINT "caregiver_reviews_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caregiver_reviews" ADD CONSTRAINT "caregiver_reviews_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caregiver_reviews" ADD CONSTRAINT "caregiver_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row level security: the API is the only way in.
ALTER TABLE "caregiver_reviews" ENABLE ROW LEVEL SECURITY;
