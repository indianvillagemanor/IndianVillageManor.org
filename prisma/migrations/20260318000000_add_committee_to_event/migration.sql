-- Migration: add_committee_to_event
-- Each Event must belong to exactly one Committee.
-- Pre-existing events are assigned to the "Communications" committee,
-- which is created here if it does not already exist.

-- Step 1: Ensure the Communications committee exists (use stable id 'communications')
INSERT INTO "Committee" ("id", "name", "description", "hasNewsletterFeature")
VALUES ('communications', 'Communications', 'Community communications and announcements', false)
ON CONFLICT ("id") DO NOTHING;

-- Step 2: Add committeeId column as nullable
ALTER TABLE "Event" ADD COLUMN "committeeId" TEXT;

-- Step 3: Assign all existing events to the Communications committee
UPDATE "Event"
SET "committeeId" = 'communications'
WHERE "committeeId" IS NULL;

-- Step 4: Make committeeId NOT NULL
ALTER TABLE "Event" ALTER COLUMN "committeeId" SET NOT NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE "Event" ADD CONSTRAINT "Event_committeeId_fkey"
  FOREIGN KEY ("committeeId") REFERENCES "Committee"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 6: Add index on committeeId
CREATE INDEX "Event_committeeId_idx" ON "Event"("committeeId");
