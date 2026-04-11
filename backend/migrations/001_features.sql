-- Run against your Postgres database once (Render / local) if tables already exist without these columns.
-- New installs can rely on Sequelize models + sync with alter:true in dev only.

CREATE TABLE IF NOT EXISTS "Project" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "color" VARCHAR(32) DEFAULT '#49B9FF',
  "icon" VARCHAR(32) DEFAULT '◇',
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ,
  "updatedAt" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "TaskTemplate" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "items" JSONB DEFAULT '[]',
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ,
  "updatedAt" TIMESTAMPTZ
);

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "recurringInterval" INTEGER;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "recurringSkipDates" VARCHAR(255)[] DEFAULT ARRAY[]::VARCHAR[];
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "lifecycleStatus" VARCHAR(32) DEFAULT 'active';
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "trashedAt" TIMESTAMPTZ;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "projectId" UUID REFERENCES "Project"("id") ON DELETE SET NULL;

UPDATE "Task" SET "lifecycleStatus" = 'active' WHERE "lifecycleStatus" IS NULL;

ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "recurringDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "everyNDays" INTEGER;
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "targetTimesPerWeek" INTEGER;
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "goalMinMinutes" INTEGER;
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "goalMaxPerDay" INTEGER;
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "reminderTime" TIME;
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "reminderEnabled" BOOLEAN DEFAULT false;
