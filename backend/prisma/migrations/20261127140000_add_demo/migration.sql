-- AlterTable
ALTER TABLE "users" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "demo_seed" (
    "id" INTEGER NOT NULL,
    "seededAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_seed_pkey" PRIMARY KEY ("id")
);

-- Row level security: the API is the only way in.
ALTER TABLE "demo_seed" ENABLE ROW LEVEL SECURITY;
