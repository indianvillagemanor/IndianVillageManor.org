-- Migration: add_committee_to_event
-- Each Event must belong to exactly one Committee.
-- Pre-existing events are assigned to the "Communications" committee,
-- which is created here if it does not already exist.

-- Step 1: Ensure the Communications committee exists (use stable id 'communications')
INSERT INTO "Committee" ("id", "name", "description", "hasNewsletterFeature")
VALUES ('communications', 'Communications', 'Community communications and announcements', false)
ON CONFLICT ("id") DO NOTHING;

-- Step 2: Add committee_id column as nullable
ALTER TABLE "Event" ADD COLUMN "committee_id" TEXT;

-- Step 3: Assign all existing events to the Communications committee
UPDATE "Event"
SET "committee_id" = 'communications'
WHERE "committee_id" IS NULL;

-- Step 4: Make committee_id NOT NULL
ALTER TABLE "Event" ALTER COLUMN "committee_id" SET NOT NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE "Event" ADD CONSTRAINT "Event_committee_id_fkey"
  FOREIGN KEY ("committee_id") REFERENCES "Committee"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 6: Add index on committee_id
CREATE INDEX "Event_committee_id_idx" ON "Event"("committee_id");
